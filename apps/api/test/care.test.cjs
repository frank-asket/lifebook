// Opt in only against a disposable loopback database. Fixtures always roll back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;

test('care requests stay private to the member and the one pastor who claims them', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const { CareService } = require('../dist/care/care.service');
  const { MeditationService } = require('../dist/meditation/meditation.service');
  const { PastorAdmin } = require('../dist/pastors/pastor-admin');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_CARE_TEST');
  const previous = [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY];
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  try {
    await assert.rejects(db.$transaction(async tx => {
      const prefix = `care-test-${Date.now()}`;
      const users = {};
      for (const name of ['member', 'stranger', 'pastorA', 'pastorB', 'pending', 'moderator']) users[name] = await tx.user.create({ data: { oidcSubject: `${prefix}-${name}` } });
      const meditation = new MeditationService();
      const care = new CareService(meditation);
      for (const service of [meditation, care]) await service.onModuleDestroy();
      care.db = tx; care.userId = async auth => users[auth].id;
      const admin = new PastorAdmin(tx);
      await admin.setRole(users.moderator.id, 'MODERATOR');
      const base = { bio: 'Synthetic', languages: ['en', 'tw'], churchName: 'Synthetic Chapel', ministryRole: 'Pastor', country: 'GH', referenceName: 'Ref', referenceContact: 'ref@example.invalid' };
      for (const [name, slug] of [['pastorA', 'care-test-a'], ['pastorB', 'care-test-b'], ['pending', 'care-test-p']]) await admin.register(users[name].id, { ...base, slug, displayName: name });
      for (const name of ['pastorA', 'pastorB']) {
        await admin.recordTraining(users[name].id, 'MHFA', '2026-10-01'); await admin.recordConduct(users[name].id, '2026-10-02');
        await admin.approve(users[name].id, users.moderator.id);
      }

      const valid = { topic: 'grief', language: 'en', contactPreference: 'callback', name: 'Ama', phone: '+233 20 000 0000', message: 'Synthetic care message about my grandmother.', consent: true };
      await assert.rejects(care.create('member', { ...valid, consent: false }), /Consent/);
      await assert.rejects(care.create('member', { ...valid, topic: 'money' }), /topic/);
      await assert.rejects(care.create('member', { ...valid, phone: '123' }), /country code/);
      await assert.rejects(care.create('member', { ...valid, contactPreference: 'messages' }), /only used for a callback/);
      await assert.rejects(care.create('member', { ...valid, message: 'x'.repeat(2001) }), /too long/);
      const request = await care.create('member', valid);
      assert.equal(request.status, 'OPEN');
      assert.equal(request.phone, null, 'the member view never echoes the phone number');
      const stored = await tx.careRequest.findUnique({ where: { id: request.id } });
      for (const value of [stored.messageCiphertext, stored.nameCiphertext, stored.phoneCiphertext]) {
        assert.ok(value.startsWith('lbenc:v1:test:'));
        assert.ok(!/grandmother|Ama|233/.test(value));
      }
      await care.create('member', { ...valid, contactPreference: 'messages', phone: undefined, language: 'fr' });
      await assert.rejects(care.create('member', valid), /two open requests/);

      // Only active pastors see the queue, and only topic/language/time before claiming.
      for (const who of ['member', 'stranger', 'pending']) await assert.rejects(care.queue(who), /Only active, verified pastors/);
      const queue = await care.queue('pastorA');
      assert.deepEqual(queue.map(q => q.id), [request.id], 'the French request is outside this pastor’s languages');
      assert.deepEqual(Object.keys(queue[0]).sort(), ['contactPreference', 'createdAt', 'id', 'language', 'topic']);
      await assert.rejects(care.case('pastorA', request.id), /not found/, 'content is hidden until claimed');
      // A pastor who asks for care as a member never sees their own request in the queue.
      const own = await care.create('pastorB', { ...valid, contactPreference: 'messages', phone: undefined });
      assert.equal((await care.queue('pastorB')).some(q => q.id === own.id), false);
      assert.equal((await care.queue('pastorA')).some(q => q.id === own.id), true);
      await assert.rejects(care.claim('pastorB', own.id), /accepting requests|your own request/);
      await care.memberDelete('pastorB', own.id);

      await assert.rejects(care.claim('pastorA', request.id), /accepting requests/);
      await care.setAvailability('pastorA', true); await care.setAvailability('pastorB', true);
      const [first, second] = await Promise.allSettled([care.claim('pastorA', request.id), care.claim('pastorB', request.id)]);
      assert.equal([first, second].filter(r => r.status === 'fulfilled').length, 1, 'exactly one pastor wins a race to claim');
      const winner = first.status === 'fulfilled' ? 'pastorA' : 'pastorB';
      const loser = winner === 'pastorA' ? 'pastorB' : 'pastorA';
      const claimed = await care.case(winner, request.id);
      assert.equal(claimed.message, valid.message);
      assert.equal(claimed.name, 'Ama');
      assert.equal(claimed.phone, '+233200000000');
      await assert.rejects(care.case(loser, request.id), /not found/);
      await assert.rejects(care.pastorReply(loser, request.id, 'Not my case'), /not found/);
      await assert.rejects(care.mine('stranger', request.id), /not found/);
      await assert.rejects(care.memberDelete('stranger', request.id), /not found/);
      assert.deepEqual((await care.listMine('stranger')), []);

      await care.pastorReply(winner, request.id, 'Synthetic pastor reply.');
      const memberView = await care.listMine('member');
      assert.equal(memberView.find(r => r.id === request.id).unread, true);
      const thread = await care.memberReply('member', request.id, 'Synthetic member reply.');
      assert.deepEqual(thread.messages.map(m => m.from), ['pastor', 'member']);
      assert.equal(thread.pastor.displayName, winner);
      const storedMessages = await tx.careMessage.findMany({ where: { requestId: request.id } });
      assert.ok(storedMessages.every(m => m.ciphertext.startsWith('lbenc:v1:') && !m.ciphertext.includes('Synthetic')));

      // Moving a message's ciphertext onto another message must not decrypt.
      await tx.careMessage.update({ where: { id: storedMessages[1].id }, data: { ciphertext: storedMessages[0].ciphertext } });
      await assert.rejects(care.mine('member', request.id), /cannot be opened/);
      await tx.careMessage.delete({ where: { id: storedMessages[1].id } });

      // Suspension is immediate and returns the conversation to the queue.
      const suspended = await admin.suspend(users[winner].id, 'Synthetic review');
      assert.equal(suspended.releasedConversations, 1);
      await assert.rejects(care.case(winner, request.id), /Only active, verified pastors/);
      assert.equal((await care.mine('member', request.id)).status, 'OPEN');
      await admin.reinstate(users[winner].id, users.moderator.id);
      await care.claim(loser, request.id);
      assert.equal((await care.case(loser, request.id)).messages.length, 1, 'the new pastor sees the earlier conversation');

      await care.memberClose('member', request.id);
      await assert.rejects(care.pastorReply(loser, request.id, 'After close'), /closed/);
      const closed = await tx.careRequest.findUnique({ where: { id: request.id } });
      assert.equal(closed.closedBy, 'member');
      assert.ok(closed.deleteAfter > closed.closedAt);
      assert.equal((await care.memberDelete('member', request.id)).deleted, true);
      assert.equal(await tx.careMessage.count({ where: { requestId: request.id } }), 0, 'deleting a request deletes its messages');
      throw rollback;
    }), error => error === rollback);
  } finally {
    [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY] = previous;
    if (previous[0] === undefined) delete process.env.REFLECTION_ENCRYPTION_KEYS;
    if (previous[1] === undefined) delete process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY;
    await db.$disconnect();
  }
});
