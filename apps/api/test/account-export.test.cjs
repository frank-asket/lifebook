// Opt in only against a disposable local restore. Uses throwaway test keys, never real ones.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

const url = process.env.LIFEBOOK_ACCOUNT_TEST_DATABASE_URL;
test('the data export decrypts everything for the member, and only for them', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ t1: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 't1';
  process.env.BIBLE_NOTES_ENCRYPTION_KEY = randomBytes(32).toString('hex');
  const { encryptReflection } = require('../dist/security/reflection-crypto');
  const { encryptNote } = require('../dist/bible-annotations/note-crypto');
  const { exportAccount, EXPORT_FORMAT } = require('../dist/account/account-export');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const prefix = `export-${Date.now()}`;
  try {
    const member = await db.user.create({ data: { oidcSubject: `${prefix}-member` } });
    const other = await db.user.create({ data: { oidcSubject: `${prefix}-other` } });
    const id = member.id;
    await db.ministryVerification.create({ data: { userId: id, status: 'PENDING', churchName: 'Fixture church', ministryRole: 'Pastor', country: 'Ghana', reviewerNotes: 'Confidential-review-fixture', referenceName: 'Private referee', referenceContactCiphertext: 'Private referee contact' } });
    await db.pastorProfile.create({ data: { userId: id, slug: prefix, displayName: 'Fixture pastor', bio: 'Fixture biography', languages: ['en'] } });
    await db.ministryVerification.create({ data: { userId: other.id, churchName: 'Other church' } });
    await db.pastorProfile.create({ data: { userId: other.id, slug: `${prefix}-other`, displayName: 'Other pastor', bio: 'Other biography', languages: ['fr'] } });
    const path = await db.learningPath.create({ data: { slug: prefix, title: 'Fixture path', description: 'Fixture path' } });
    await db.enrollment.create({ data: { userId: id, pathId: path.id } });
    await db.enrollment.create({ data: { userId: other.id, pathId: path.id } });
    await db.faithProfile.create({ data: { userId: id, journey: 'EXPLORING', learningGoals: ['Learn about Jesus'], preferredFormats: [], personalizationConsent: true } });
    const p1 = await db.prayerEntry.create({ data: { userId: id, ciphertext: 'pending' } });
    await db.prayerEntry.update({ where: { id: p1.id }, data: { ciphertext: encryptReflection('Keep my family safe.', `prayer:body:${id}:${p1.id}`), titleCiphertext: encryptReflection('Family', `prayer:title:${id}:${p1.id}`) } });
    const p2 = await db.prayerEntry.create({ data: { userId: id, ciphertext: encryptReflection('Moved here from elsewhere', `prayer:body:${id}:some-other-id`) } });
    const session = await db.dailyWordSession.create({ data: { userId: id, journeyDate: new Date('2026-10-18'), passageKey: 'JAMES_1_22' } });
    await db.dailyWordStepProgress.create({ data: { sessionId: session.id, step: 'UNDERSTAND' } });
    await db.dailyWordReflection.create({ data: { sessionId: session.id, content: 'An old reflection from before encryption.' } });
    await db.bibleAnnotation.create({ data: { userId: id, locale: 'en', passageId: 'JHN.1.1', highlight: 'yellow', noteCiphertext: encryptNote('The Word was with God.') } });
    const plan = await db.bibleReadingPlanEnrollment.create({ data: { userId: id, planId: 'discover-jesus' } });
    await db.bibleReadingPlanDayCompletion.createMany({ data: [{ enrollmentId: plan.id, day: 2 }, { enrollmentId: plan.id, day: 1 }] });
    const reqId = `${prefix}-req`;
    await db.careRequest.create({ data: { id: reqId, memberId: id, topic: 'grief', language: 'en', contactPreference: 'MESSAGES', consentAt: new Date(), messageCiphertext: encryptReflection('I lost my father.', `care:request:${id}:${reqId}:`) } });
    await db.careMessage.create({ data: { id: `${prefix}-m1`, requestId: reqId, senderRole: 'pastor', ciphertext: encryptReflection('I am praying with you.', `care:message:${id}:${reqId}:${prefix}-m1`) } });
    await db.prayerEntry.create({ data: { userId: other.id, ciphertext: encryptReflection('Someone else', `prayer:body:${other.id}:x`) } });

    const out = await exportAccount(db, id);
    assert.equal(out.format, EXPORT_FORMAT);
    assert.equal(out.profile.journey, 'EXPLORING');
    assert.equal(out.ministryVerification.churchName, 'Fixture church');
    assert.equal(out.ministryVerification.status, 'PENDING');
    assert.equal(out.pastorProfile.displayName, 'Fixture pastor');
    assert.deepEqual(out.learningPaths.map(p => p.pathId), [path.id]);
    for (const privateValue of ['Confidential-review-fixture', 'Private referee', 'Other church', 'Other pastor', 'Other biography']) assert.ok(!JSON.stringify(out).includes(privateValue), `Export must omit ${privateValue}`);
    const good = out.prayers.find(p => p.title === 'Family');
    assert.equal(good.body, 'Keep my family safe.');
    // A value bound to another record cannot be opened: it is marked, and the export still completes.
    assert.match(out.prayers.find(p => p !== good).body, /could not be decrypted/);
    assert.equal(out.prayers.length, 2);
    assert.deepEqual(out.dailyWord.map(d => [d.date, d.passage, d.stepsDone.join(), d.reflection]), [['2026-10-18', 'JAMES_1_22', 'UNDERSTAND', 'An old reflection from before encryption.']]);
    assert.equal(out.bible.notesAndHighlights[0].note, 'The Word was with God.');
    assert.deepEqual(out.bible.readingPlans[0].daysCompleted, [1, 2]);
    assert.equal(out.pastoralCare[0].request, 'I lost my father.');
    assert.deepEqual(out.pastoralCare[0].messages.map(m => [m.from, m.text]), [['pastor', 'I am praying with you.']]);
    assert.ok(!JSON.stringify(out).includes('Someone else'));
    assert.equal(await exportAccount(db, 'no-such-user'), null);
  } finally {
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } });
    await db.learningPath.deleteMany({ where: { slug: prefix } });
    await db.$disconnect();
  }
});
