// The database test opts in against a disposable loopback database and always rolls back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { randomBytes, randomUUID } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;

test('reports reach only the safeguarding lead, conversations only when shared, and retention is enforced', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const { CareService } = require('../dist/care/care.service');
  const { SafeguardingService } = require('../dist/safeguarding/safeguarding.service');
  const { MeditationService } = require('../dist/meditation/meditation.service');
  const { PastorAdmin } = require('../dist/pastors/pastor-admin');
  const { purgeCare } = require('../dist/care/care-purge');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_SAFEGUARDING_TEST');
  const previous = [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY];
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  try {
    await assert.rejects(db.$transaction(async tx => {
      const prefix = `sg-test-${Date.now()}`;
      const users = {};
      for (const name of ['member', 'stranger', 'pastor', 'otherPastor', 'lead']) users[name] = await tx.user.create({ data: { oidcSubject: `${prefix}-${name}` } });
      const identity = async auth => users[auth].id;
      const meditation = new MeditationService(); const care = new CareService(meditation); const sg = new SafeguardingService(meditation);
      for (const service of [meditation, care, sg]) await service.onModuleDestroy();
      care.db = tx; care.userId = identity; sg.db = tx; sg.userId = identity;
      const admin = new PastorAdmin(tx);
      await admin.setRole(users.lead.id, 'MODERATOR');
      for (const [name, slug] of [['pastor', 'sg-test-pastor'], ['otherPastor', 'sg-test-other']]) {
        await admin.register(users[name].id, { slug, displayName: name, bio: 'Synthetic', languages: ['en'], churchName: 'Synthetic', ministryRole: 'Pastor', country: 'GH', referenceName: 'Ref', referenceContact: 'ref@example.invalid' });
        await admin.recordTraining(users[name].id, 'MHFA', '2026-10-01'); await admin.recordConduct(users[name].id, '2026-10-02');
        await admin.approve(users[name].id, users.lead.id);
        await care.setAvailability(name, true);
      }

      const request = await care.create('member', { topic: 'family', language: 'en', contactPreference: 'messages', message: 'Synthetic first message.', consent: true });
      await care.claim('pastor', request.id);
      await care.pastorReply('pastor', request.id, 'Synthetic pastor message asking for money.');

      // Reporting
      const concern = { category: 'money', details: 'Synthetic: the pastor asked me for money.', shareConversation: true };
      await assert.rejects(care.memberReport('member', request.id, { ...concern, category: 'gossip' }), /Choose what/);
      await assert.rejects(care.memberReport('member', request.id, { ...concern, shareConversation: 'yes' }), /share the conversation/);
      await assert.rejects(care.memberReport('member', request.id, { ...concern, details: ' ' }), /required/);
      await assert.rejects(care.memberReport('stranger', request.id, concern), /not found/);
      await assert.rejects(care.pastorReport('otherPastor', request.id, concern), /not found/);
      assert.deepEqual(await care.memberReport('member', request.id, concern), { reported: true, sharedConversation: true });
      assert.deepEqual(await care.pastorReport('pastor', request.id, { category: 'safety', details: 'Synthetic: member may be unsafe.', shareConversation: false }), { reported: true, sharedConversation: false });
      const stored = await tx.careReport.findMany({ where: { requestId: request.id }, orderBy: { createdAt: 'asc' } });
      assert.equal(stored.length, 2);
      for (const r of stored) assert.ok(r.detailsCiphertext.startsWith('lbenc:v1:') && !r.detailsCiphertext.includes('Synthetic'));
      assert.ok(stored[0].transcriptCiphertext.startsWith('lbenc:v1:'));
      assert.equal(stored[1].transcriptCiphertext, null, 'nothing is shared unless chosen');
      assert.equal(stored[0].subjectPastorId, users.pastor.id);
      for (let i = 0; i < 4; i++) await care.memberReport('member', request.id, { ...concern, shareConversation: false });
      await assert.rejects(care.memberReport('member', request.id, concern), /several reports today/);
      await tx.careReport.deleteMany({ where: { reporterId: users.member.id, id: { not: stored[0].id } } });

      // Lead access only
      for (const who of ['member', 'pastor', 'stranger']) {
        await assert.rejects(sg.overview(who), /safeguarding lead/);
        await assert.rejects(sg.reports(who), /safeguarding lead/);
        await assert.rejects(sg.report(who, stored[0].id), /safeguarding lead/);
      }
      const list = await sg.reports('lead');
      assert.equal(list.find(r => r.id === stored[0].id).aboutPastor.displayName, 'pastor');
      const opened = await sg.report('lead', stored[0].id);
      assert.equal(opened.details, concern.details);
      assert.deepEqual(opened.transcript.map(t => t.text), ['Synthetic first message.', 'Synthetic pastor message asking for money.']);
      assert.equal((await sg.report('lead', stored[1].id)).transcript, null);
      assert.ok(await tx.safeguardingAction.count({ where: { actorId: users.lead.id, action: 'viewed-report' } }) >= 2, 'every opening is logged');

      await sg.acknowledge('lead', stored[0].id);
      await assert.rejects(sg.acknowledge('lead', stored[0].id), /not waiting/);
      await assert.rejects(sg.resolve('lead', stored[0].id, ' '), /Describe/);
      const resolved = await sg.resolve('lead', stored[0].id, 'Synthetic: pastor suspended and spoken to.');
      assert.equal(resolved.status, 'RESOLVED');
      const resolvedRow = await tx.careReport.findUnique({ where: { id: stored[0].id } });
      assert.ok(Math.abs(resolvedRow.deleteAfter - resolvedRow.resolvedAt - 365 * 86400000) < 1000);
      await sg.resolve('lead', stored[1].id, 'Synthetic: checked in with the pastor.');
      assert.ok((await tx.careReport.findUnique({ where: { id: stored[1].id } })).acknowledgedAt, 'resolving also records acknowledgement');

      // Suspension through the lead returns the conversation to the queue.
      await assert.rejects(sg.suspendPastor('lead', 'sg-test-pastor', ' '), /reason/);
      await assert.rejects(sg.suspendPastor('pastor', 'sg-test-other', 'x'), /safeguarding lead/);
      assert.equal((await sg.suspendPastor('lead', 'sg-test-pastor', 'Synthetic: money request')).releasedConversations, 1);
      assert.equal((await care.mine('member', request.id)).status, 'OPEN');
      await sg.reinstatePastor('lead', 'sg-test-pastor');
      assert.ok((await tx.safeguardingAction.findMany({ where: { actorId: users.lead.id } })).some(a => a.action === 'suspended-pastor' && a.note.includes('1 conversation')));

      // Reports survive when the member deletes the conversation.
      await care.memberDelete('member', request.id);
      assert.equal((await tx.careReport.findUnique({ where: { id: stored[0].id } })).requestId, null);

      // Overview: overdue items without any content.
      const waiting = await care.create('stranger', { topic: 'grief', language: 'en', contactPreference: 'messages', message: 'Synthetic waiting message.', consent: true });
      await tx.careRequest.update({ where: { id: waiting.id }, data: { createdAt: new Date(Date.now() - 30 * 3600000) } });
      const overview = await sg.overview('lead');
      const item = overview.waitingTooLong.find(w => w.topic === 'grief');
      assert.deepEqual(Object.keys(item).sort(), ['language', 'topic', 'waitingHours']);
      assert.ok(item.waitingHours >= 30);
      assert.equal(JSON.stringify(overview).includes('Synthetic waiting message'), false);
      assert.ok(overview.pastors.some(p => p.slug === 'sg-test-pastor' && p.active));

      // Retention: dry run changes nothing; apply closes, deletes and keeps the rest.
      const now = new Date();
      await tx.careRequest.update({ where: { id: waiting.id }, data: { createdAt: new Date(now - 31 * 86400000) } });
      const expiredId = randomUUID();
      await tx.careRequest.create({ data: { id: expiredId, memberId: users.member.id, topic: 'other', language: 'en', contactPreference: 'messages', messageCiphertext: 'lbenc:v1:x', consentAt: now, status: 'CLOSED', closedAt: new Date(now - 100 * 86400000), deleteAfter: new Date(now - 86400000) } });
      await tx.careMessage.create({ data: { id: randomUUID(), requestId: expiredId, senderRole: 'member', ciphertext: 'lbenc:v1:x' } });
      await tx.careReport.update({ where: { id: stored[1].id }, data: { deleteAfter: new Date(now - 1000) } });
      const dry = await purgeCare(tx, { now });
      assert.equal(dry.applied, false);
      assert.ok(dry.unclaimedClosed >= 1 && dry.requestsDeleted >= 1 && dry.messagesDeleted >= 1 && dry.reportsDeleted >= 1);
      assert.ok(await tx.careRequest.findUnique({ where: { id: expiredId } }), 'a dry run deletes nothing');
      await purgeCare(tx, { apply: true, now });
      assert.equal(await tx.careRequest.findUnique({ where: { id: expiredId } }), null);
      assert.equal(await tx.careMessage.count({ where: { requestId: expiredId } }), 0);
      assert.equal(await tx.careReport.findUnique({ where: { id: stored[1].id } }), null);
      assert.ok(await tx.careReport.findUnique({ where: { id: stored[0].id } }), 'reports inside their retention period are kept');
      const closed = await care.mine('stranger', waiting.id);
      assert.equal(closed.status, 'CLOSED');
      assert.equal(closed.closedBy, 'system');
      throw rollback;
    }), error => error === rollback);
  } finally {
    [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY] = previous;
    if (previous[0] === undefined) delete process.env.REFLECTION_ENCRYPTION_KEYS;
    if (previous[1] === undefined) delete process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY;
    await db.$disconnect();
  }
});

test('the retention script needs a named, local or confirmed target', () => {
  const script = path.resolve(__dirname, '../scripts/care-purge.cjs');
  const run = (args, env = {}) => spawnSync(process.execPath, [script, ...args], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
  assert.match(run([]).stderr, /Choose --target/);
  assert.match(run(['--target', 'local'], { DATABASE_URL: 'postgresql://u:secret-pass@db.example.com/x' }).stderr, /127\.0\.0\.1/);
  const production = run(['--target', 'production', '--apply']);
  assert.equal(production.status, 1);
  assert.equal(/secret-pass|postgresql:\/\//.test(production.stdout + production.stderr), false);
  assert.match(run(['--target', 'staging', 'extra']).stderr, /Unexpected argument/);
});
