const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { AccountService, deletionBlocked, DELETE_CONFIRMATION } = require('../dist/account/account.service');

test('who may delete their own account', () => {
  assert.equal(deletionBlocked({ role: 'MEMBER' }, null), null);
  assert.equal(deletionBlocked({ role: 'MEMBER' }, 'PENDING'), null);
  assert.equal(deletionBlocked({ role: 'MEMBER' }, 'REJECTED'), null);
  assert.equal(deletionBlocked({ role: 'MEMBER' }, 'APPROVED'), 'pastor');
  for (const role of ['MODERATOR', 'ADMIN', 'CREATOR']) assert.equal(deletionBlocked({ role }, null), 'role');
});

// Opt in only against a disposable local restore: it writes and deletes real rows.
const url = process.env.LIFEBOOK_ACCOUNT_TEST_DATABASE_URL;
test('deleting an account removes every record about the member and keeps safety records', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const service = new AccountService();
  await service.onModuleDestroy();
  service.db = db;
  const prefix = `acct-${Date.now()}`;
  try {
    const member = await db.user.create({ data: { oidcSubject: `${prefix}-member` } });
    const other = await db.user.create({ data: { oidcSubject: `${prefix}-other` } });
    const id = member.id;
    await db.faithProfile.create({ data: { userId: id, learningGoals: ['Grow in faith'], preferredFormats: [], personalizationConsent: true } });
    await db.prayerEntry.create({ data: { userId: id, ciphertext: 'lbenc:v1:x' } });
    const session = await db.dailyWordSession.create({ data: { userId: id, journeyDate: new Date('2026-10-18'), passageKey: 'JAMES_1_22' } });
    await db.dailyWordStepProgress.create({ data: { sessionId: session.id, step: 'UNDERSTAND' } });
    await db.dailyWordReflection.create({ data: { sessionId: session.id, content: 'lbenc:v1:y' } });
    await db.bibleReadingHistory.create({ data: { userId: id, locale: 'en', chapterId: 'JHN.1' } });
    const plan = await db.bibleReadingPlanEnrollment.create({ data: { userId: id, planId: 'discover-jesus' } });
    await db.bibleReadingPlanDayCompletion.create({ data: { enrollmentId: plan.id, day: 1 } });
    await db.aiUsage.create({ data: { userId: id, feature: 'guided-meditation', outcome: 'ok' } });
    const request = await db.careRequest.create({ data: { id: `${prefix}-req`, memberId: id, topic: 'grief', language: 'en', contactPreference: 'MESSAGES', messageCiphertext: 'lbenc:v1:z', consentAt: new Date() } });
    await db.careMessage.create({ data: { id: `${prefix}-msg`, requestId: request.id, senderRole: 'member', ciphertext: 'lbenc:v1:m' } });
    await db.careReport.create({ data: { id: `${prefix}-rep`, requestId: request.id, reporterId: id, reporterRole: 'member', category: 'conduct', detailsCiphertext: 'lbenc:v1:d' } });
    const otherPrayer = await db.prayerEntry.create({ data: { userId: other.id, ciphertext: 'lbenc:v1:o' } });

    service.subject = async () => `${prefix}-member`;
    await assert.rejects(service.deleteAccount('Bearer x', 'yes'), /Confirmation required/);
    const result = await service.deleteAccount('Bearer x', DELETE_CONFIRMATION);
    assert.equal(result.deleted, true);
    assert.equal(result.signInRemoved, false); // no Clerk in tests

    const counts = await Promise.all([
      db.user.count({ where: { id } }), db.faithProfile.count({ where: { userId: id } }), db.prayerEntry.count({ where: { userId: id } }),
      db.dailyWordSession.count({ where: { userId: id } }), db.dailyWordStepProgress.count({ where: { sessionId: session.id } }), db.dailyWordReflection.count({ where: { sessionId: session.id } }),
      db.bibleReadingHistory.count({ where: { userId: id } }), db.bibleReadingPlanEnrollment.count({ where: { userId: id } }), db.bibleReadingPlanDayCompletion.count({ where: { enrollmentId: plan.id } }),
      db.aiUsage.count({ where: { userId: id } }), db.careRequest.count({ where: { id: request.id } }), db.careMessage.count({ where: { requestId: request.id } }),
    ]);
    assert.deepEqual(counts, Array(counts.length).fill(0));
    // Kept: the safety report, detached from the deleted request.
    const report = await db.careReport.findUnique({ where: { id: `${prefix}-rep` } });
    assert.ok(report); assert.equal(report.requestId, null);
    // Nobody else is touched.
    assert.ok(await db.prayerEntry.findUnique({ where: { id: otherPrayer.id } }));

    // Approved pastors are asked to have their role closed first.
    const pastor = await db.user.create({ data: { oidcSubject: `${prefix}-pastor` } });
    await db.ministryVerification.create({ data: { userId: pastor.id, status: 'APPROVED' } });
    service.subject = async () => `${prefix}-pastor`;
    await assert.rejects(service.deleteAccount('Bearer x', DELETE_CONFIRMATION), /pastor role closed/);
    assert.equal(await db.user.count({ where: { id: pastor.id } }), 1);
  } finally {
    await db.careReport.deleteMany({ where: { id: { startsWith: prefix } } });
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } });
    await db.$disconnect();
  }
});
