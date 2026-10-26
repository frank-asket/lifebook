const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;

// Real concurrent transactions, restricted to a disposable loopback database.
test('review regressions: quota reservation, stale AI writes, progress, care ownership and complete message history', { skip: !url, timeout: 30000 }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const { PrayerVerseService, VERSE_LIMITS } = require('../dist/prayer/prayer-verse.service');
  const { GuidedMeditationService } = require('../dist/prayer/guided-meditation.service');
  const { PrayerService } = require('../dist/prayer/prayer.service');
  const { DailyWordService } = require('../dist/daily-word/daily-word.service');
  const { CareService } = require('../dist/care/care.service');
  const { PastorAdmin } = require('../dist/pastors/pastor-admin');
  const { encryptReflection } = require('../dist/security/reflection-crypto');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const prefix = `review-${randomUUID()}`;
  const saved = ['REFLECTION_ENCRYPTION_KEYS', 'REFLECTION_ENCRYPTION_ACTIVE_KEY', 'OPENAI_API_KEY'].map(key => [key, process.env[key]]);
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  const users = {};
  try {
    for (const name of ['member', 'pastor', 'replacement', 'moderator']) users[name] = await db.user.create({ data: { oidcSubject: `${prefix}-${name}` } });
    const identity = { userId: async name => users[name].id };
    const prayers = new PrayerService(identity, { choose: async () => null, present: verse => verse }); prayers.db = db;
    const source = await prayers.create('member', { body: 'Synthetic concern about an examination.' });
    await db.faithProfile.create({ data: { userId: users.member.id, aiProcessingConsent: true } });
    const companion = { candidates: () => [{ title: 'Peace', description: 'Peace', passages: ['JHN.14.27'] }], resolve: async () => [] };
    const guided = new GuidedMeditationService(prayers, companion); guided.db = db;
    const draft = { safety: 'none', passage_ids: ['JHN.14.27'], reflection: 'A synthetic reflection.', questions: ['One?', 'Two?'], prayer: 'A synthetic prayer.' };
    let calls = 0;
    guided.ai = { flagsRisk: async () => false, assessRisk: async () => 'none', structured: async () => { calls++; return draft; } };
    await db.aiUsage.createMany({ data: Array.from({ length: 4 }, () => ({ userId: users.member.id, feature: 'meditation', outcome: 'generated' })) });
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => guided.generate('member', source.id, { consent: true })));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1, 'only the last available quota slot is accepted');
    assert.equal(calls, 1, 'rejected requests never contact the generation provider');
    assert.equal(await db.aiUsage.count({ where: { userId: users.member.id } }), 5);

    await db.aiUsage.deleteMany({ where: { userId: users.member.id } });
    let release, entered;
    const held = new Promise(resolve => { release = resolve; });
    const started = new Promise(resolve => { entered = resolve; });
    guided.ai.structured = async () => { entered(); await held; return draft; };
    const pending = guided.generate('member', source.id, { consent: true });
    const rejected = assert.rejects(pending, /prayer changed/);
    await started;
    await prayers.update('member', source.id, { body: 'A different synthetic prayer.' });
    release(); await rejected;
    assert.equal((await prayers.get('member', source.id)).meditation, null, 'old guidance cannot be reattached after an edit');

    process.env.OPENAI_API_KEY = 'synthetic-test-only';
    const verseCompanion = { ...companion, available: () => true, keywordPick: () => ({ passageId: 'JHN.14.27', topicId: 'peace' }), topicOf: () => 'peace' };
    const verses = new PrayerVerseService(verseCompanion); verses.db = db;
    let verseCalls = 0;
    verses.ai = { flagsRisk: async () => false, structured: async () => { verseCalls++; return { safety: 'none', passage_id: 'JHN.14.27' }; } };
    await db.aiUsage.createMany({ data: Array.from({ length: VERSE_LIMITS.aiPerDay - 1 }, () => ({ userId: users.member.id, feature: 'prayer-verse', outcome: 'generated' })) });
    const verseResults = await Promise.all(Array.from({ length: 8 }, () => verses.choose(users.member.id, source.id, 'A synthetic concern', 'en', true)));
    assert.equal(verseCalls, 1, 'only one concurrent request can reserve the final verse-picking quota slot');
    assert.equal(verseResults.filter(result => result.source === 'ai').length, 1);
    assert.equal(await db.aiUsage.count({ where: { userId: users.member.id, feature: 'prayer-verse' } }), VERSE_LIMITS.aiPerDay);
    assert.equal(verseResults.filter(result => result.source === 'keywords').length, 7, 'quota exhaustion preserves keyword fallback');

    const daily = new DailyWordService(identity); daily.db = db;
    const session = await db.dailyWordSession.create({ data: { userId: users.member.id, journeyDate: new Date('2026-10-25T00:00:00Z'), passageKey: 'fixture' } });
    for (const step of ['UNDERSTAND', 'MEDITATE', 'REFLECT']) await daily.completeStep('member', session.id, step);
    await Promise.all(['PRAY', 'LIVE', 'PRAY', 'LIVE'].map(step => daily.completeStep('member', session.id, step)));
    const completed = await db.dailyWordSession.findUnique({ where: { id: session.id }, include: { steps: true } });
    assert.equal(completed.steps.length, 5); assert.equal(completed.status, 'COMPLETED'); assert.ok(completed.completedAt);

    const care = new CareService(identity); care.db = db;
    const admin = new PastorAdmin(db);
    await admin.setRole(users.moderator.id, 'MODERATOR');
    for (const name of ['pastor', 'replacement']) {
      await admin.register(users[name].id, { slug: `${name}-${Date.now()}`, displayName: 'Synthetic pastor', bio: 'Synthetic', languages: ['en'], churchName: 'Synthetic', ministryRole: 'Pastor', country: 'GH', referenceName: 'Fixture', referenceContact: 'fixture@example.invalid' });
      await admin.recordTraining(users[name].id, 'Fixture', '2026-10-01'); await admin.recordConduct(users[name].id, '2026-10-02'); await admin.approve(users[name].id, users.moderator.id);
      await db.pastorProfile.update({ where: { userId: users[name].id }, data: { acceptingRequests: true } });
    }
    const request = await care.create('member', { topic: 'prayer', language: 'en', contactPreference: 'messages', message: 'Synthetic private request', consent: true });
    await care.claim('pastor', request.id);
    const stale = await db.careRequest.findUnique({ where: { id: request.id } });
    await db.careRequest.update({ where: { id: request.id }, data: { pastorId: users.replacement.id } });
    await assert.rejects(care.addMessage(stale, 'pastor', 'Forbidden stale reply'), /no longer assigned/);
    await assert.rejects(care.thread(stale, 'pastor'), /no longer assigned/);
    await assert.rejects(care.close(stale, 'pastor'), /no longer assigned/);
    await assert.rejects(care.report(stale, users.pastor.id, 'pastor', { category: 'conduct', details: 'Fixture', shareConversation: true }), /no longer assigned/);
    const replacementSnapshot = await db.careRequest.findUnique({ where: { id: request.id } });
    await admin.suspend(users.replacement.id, 'Synthetic suspension');
    await assert.rejects(care.thread(replacementSnapshot, 'pastor'), /active, verified/);
    assert.equal((await db.careRequest.findUnique({ where: { id: request.id } })).status, 'OPEN');
    assert.equal(await db.careMessage.count({ where: { requestId: request.id } }), 0);

    // More than the old 500-message cap, with tied timestamps to exercise stable pagination.
    const at = new Date(Date.now() - 10000);
    const messages = Array.from({ length: 503 }, (_, index) => {
      const id = randomUUID();
      return { id, requestId: request.id, senderRole: 'member', createdAt: new Date(at.getTime() + Math.floor(index / 3)), ciphertext: encryptReflection(`Synthetic message ${index}`, `care:message:${users.member.id}:${request.id}:${id}`) };
    });
    await db.careMessage.createMany({ data: messages });
    let page = await care.mine('member', request.id);
    assert.equal(page.messages.length, 500);
    const expected = [...messages].sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    assert.deepEqual(page.messages.map(message => message.id), expected.slice(-500).map(message => message.id), 'the newest window follows timestamp and UUID ordering, including tied timestamps');
    const seen = new Set(page.messages.map(m => m.id));
    const readAt = (await db.careRequest.findUnique({ where: { id: request.id } })).memberReadAt;
    while (page.nextCursor) {
      page = await care.mine('member', request.id, page.nextCursor);
      for (const message of page.messages) { assert.ok(!seen.has(message.id)); seen.add(message.id); }
    }
    assert.equal(seen.size, 503, 'every historical message remains reachable exactly once');
    assert.deepEqual((await db.careRequest.findUnique({ where: { id: request.id } })).memberReadAt, readAt, 'loading history cannot mark new incoming messages read');
    const foreign = await care.create('member', { topic: 'faith', language: 'en', contactPreference: 'messages', message: 'Other synthetic request', consent: true });
    await assert.rejects(care.mine('member', foreign.id, messages[0].id), /Invalid message cursor/);
  } finally {
    const ids = Object.values(users).map(user => user.id);
    await db.careReport.deleteMany({ where: { reporterId: { in: ids } } });
    await db.aiUsage.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } });
    await db.$disconnect();
    for (const [key, value] of saved) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
