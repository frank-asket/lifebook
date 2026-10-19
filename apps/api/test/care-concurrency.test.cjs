const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('simultaneous care creation, claims and reports cannot exceed per-person quotas', { skip: !url }, async () => {
  const target = new URL(url); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const { CareService } = require('../dist/care/care.service');
  const { PastorAdmin } = require('../dist/pastors/pastor-admin');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const prefix = `care-race-${Date.now()}`;
  const previous = [process.env.REFLECTION_ENCRYPTION_KEYS, process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY];
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') }); process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  const care = new CareService({}); care.db = db;
  const users = {};
  care.userId = async auth => users[auth].id;
  try {
    for (const name of ['member', 'pastor', 'moderator']) users[name] = await db.user.create({ data: { oidcSubject: `${prefix}-${name}` } });
    const admin = new PastorAdmin(db);
    await admin.setRole(users.moderator.id, 'MODERATOR');
    await admin.register(users.pastor.id, { slug: prefix, displayName: 'Synthetic pastor', bio: 'Synthetic', languages: ['en'], churchName: 'Synthetic', ministryRole: 'Pastor', country: 'GH', referenceName: 'Fixture', referenceContact: 'fixture@example.invalid' });
    await admin.recordTraining(users.pastor.id, 'Fixture training', '2026-10-01'); await admin.recordConduct(users.pastor.id, '2026-10-02'); await admin.approve(users.pastor.id, users.moderator.id);
    await db.pastorProfile.update({ where: { userId: users.pastor.id }, data: { acceptingRequests: true, maxOpenRequests: 1 } });
    const created = await Promise.allSettled(Array.from({ length: 5 }, () => care.create('member', { topic: 'prayer', language: 'en', contactPreference: 'messages', message: 'Synthetic message', consent: true })));
    assert.equal(created.filter(r => r.status === 'fulfilled').length, 2);
    assert.equal(await db.careRequest.count({ where: { memberId: users.member.id } }), 2);
    const ids = created.filter(r => r.status === 'fulfilled').map(r => r.value.id);
    const claimed = await Promise.allSettled(ids.map(id => care.claim('pastor', id)));
    assert.equal(claimed.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(await db.careRequest.count({ where: { pastorId: users.pastor.id, status: 'CLAIMED' } }), 1);
    const reported = await Promise.allSettled(Array.from({ length: 8 }, () => care.memberReport('member', ids[0], { category: 'conduct', details: 'Synthetic report', shareConversation: false })));
    assert.equal(reported.filter(r => r.status === 'fulfilled').length, 5);
    assert.equal(await db.careReport.count({ where: { reporterId: users.member.id } }), 5);
    const request = await db.careRequest.findUnique({ where: { id: ids[0] } });
    await care.memberClose('member', ids[0]);
    await assert.rejects(care.addMessage(request, 'member', 'Late synthetic reply'), /closed/);
    assert.equal(await db.careMessage.count({ where: { requestId: ids[0] } }), 0);
  } finally {
    await db.careReport.deleteMany({ where: { reporterId: { in: Object.values(users).map(u => u.id) } } });
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } });
    await db.$disconnect();
    if (previous[0] === undefined) delete process.env.REFLECTION_ENCRYPTION_KEYS; else process.env.REFLECTION_ENCRYPTION_KEYS = previous[0];
    if (previous[1] === undefined) delete process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY; else process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = previous[1];
  }
});
