// Verse under a saved prayer: keyword matching, crisis screening, the AI opt-in path and its fallbacks.
// The database part opts in only against a disposable loopback database and always rolls back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { PrayerCompanionService, matchTopic, validateLibrary, foldText } = require('../dist/prayer/prayer-companion.service');
const { PrayerVerseService, VERSE_LIMITS } = require('../dist/prayer/prayer-verse.service');
const { PrayerService } = require('../dist/prayer/prayer.service');
const { MeditationService } = require('../dist/meditation/meditation.service');

const library = validateLibrary(JSON.parse(readFileSync(join(__dirname, '../content/prayer-topics.json'), 'utf8')));
const topicOf = (text, locale = 'en') => matchTopic(library, text, locale);
const stubBible = () => ({ passage: async (locale, id) => ({ reference: `${locale}:${id}`, text: `[1] Verified text of ${id}`, copyright: 'PUBLIC DOMAIN' }) });

async function withEnv(values, run) {
  const saved = Object.fromEntries(Object.keys(values).map(k => [k, process.env[k]]));
  for (const [k, v] of Object.entries(values)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  try { return await run(); } finally { for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v; }
}

/** A verse service with a stubbed database and AI: `consent` and `used` describe the member. */
function harness({ consent = false, used = 0, ai = {} } = {}) {
  const companion = new PrayerCompanionService(stubBible());
  const service = new PrayerVerseService(companion);
  service.onModuleDestroy();
  const logged = []; const calls = [];
  service.db = {
    faithProfile: { findUnique: async () => ({ aiProcessingConsent: consent }) },
    aiUsage: { count: async () => used, create: async ({ data }) => { logged.push(data.outcome); return { id: String(logged.length - 1) }; }, update: async ({ where, data }) => { logged[Number(where.id)] = data.outcome; } },
  };
  service.transaction = run => run(service.db);
  service.db.$queryRaw = async () => [];
  service.ai = {
    flagsRisk: async text => { calls.push('moderation'); return ai.flagged ?? false; },
    structured: async input => { calls.push('pick'); if (ai.fail) throw new Error('provider down'); assert.ok(input.schema.properties.passage_id.enum.includes('PHP.4.6-7')); return { safety: ai.crisis ? 'crisis' : 'none', passage_id: ai.pick ?? 'PSA.23.1-3' }; },
  };
  return { service, logged, calls };
}

test('keywords find the topic in English and French, accents and all', () => {
  assert.equal(topicOf('I am so worried and anxious about tomorrow').topic.id, 'anxiety');
  assert.equal(topicOf('Je suis très inquiète, l’angoisse ne me quitte pas', 'fr').topic.id, 'anxiety');
  assert.equal(topicOf('Lord, my mother passed away last night').topic.id, 'grief');
  assert.equal(topicOf('Seigneur, je me sens si seule depuis le déménagement de mes amis', 'fr').topic.id, 'loneliness');
  assert.equal(topicOf('Thank you Lord, I am so grateful for this blessing').topic.id, 'gratitude');
  // A prayer in the other language still matches.
  assert.equal(topicOf('Merci Seigneur pour ta louange', 'en').topic.id, 'gratitude');
  // Exact words do not match inside longer ones ("seul" is not "seulement").
  assert.notEqual(topicOf('Je voulais seulement te parler', 'fr').topic.id, 'loneliness');
  const none = topicOf('Lord, here I am.');
  assert.equal(none.matched, false);
  assert.equal(none.topic.id, library.fallbackTopic);
  assert.equal(foldText('Cœur brisé, l’Éternel'), ' coeur brise l eternel ');
});

test('the library refuses keywords with accents or capitals, and a missing fallback', () => {
  const copy = () => JSON.parse(JSON.stringify(library));
  const accented = copy(); accented.topics[0].keywords.fr.push('inquiète');
  assert.throws(() => validateLibrary(accented), /keywords/);
  const few = copy(); few.topics[0].keywords.en = ['worry'];
  assert.throws(() => validateLibrary(few), /keywords/);
  const fallback = copy(); fallback.fallbackTopic = 'nothing';
  assert.throws(() => validateLibrary(fallback), /fallbackTopic/);
});

test('without AI consent the verse comes from the keyword match, stays the same for the same prayer, and nothing leaves the server', async () => {
  await withEnv({ PRAYER_COMPANION_ALLOW_DRAFT: 'true', OPENAI_API_KEY: 'test-key' }, async () => {
    const { service, calls, logged } = harness({ consent: false });
    const verse = await service.choose('user', 'prayer-1', 'I am so anxious about my exams', 'en');
    assert.equal(verse.status, 'ok');
    assert.equal(verse.source, 'keywords');
    assert.ok(library.topics.find(t => t.id === verse.topicId).passages.map(p => typeof p === 'string' ? p : p.id).includes(verse.passage.id));
    assert.match(verse.passage.text, /Verified text/);
    assert.deepEqual(await service.choose('user', 'prayer-1', 'I am so anxious about my exams', 'en'), verse);
    assert.deepEqual(calls, []); assert.deepEqual(logged, []);
    assert.equal(service.present(verse).topic, library.topics.find(t => t.id === verse.topicId).title.en);
    // French uses the library's French verse numbering.
    const fr = await service.choose('user', 'prayer-2', 'Je suis en deuil, mon père est décédé', 'fr');
    assert.equal(fr.topicId, 'grief');
    assert.match(fr.passage.reference, /^fr:/);
  });
});

test('a prayer that may signal danger gets helplines, never a verse, before any AI call', async () => {
  await withEnv({ PRAYER_COMPANION_ALLOW_DRAFT: 'true', OPENAI_API_KEY: 'test-key' }, async () => {
    const { service, calls } = harness({ consent: true });
    const verse = await service.choose('user', 'prayer-1', 'I want to end it all, I am a burden', 'en', true);
    assert.deepEqual(verse, { status: 'crisis', locale: 'en' });
    assert.deepEqual(calls, []);
    const shown = service.present(verse);
    assert.ok(shown.contacts.length >= 2 && shown.contacts.every(c => c.number));
    assert.equal((await service.choose('user', 'p', 'Je veux mourir', 'fr')).status, 'crisis');
  });
});

test('members who turned on AI get an AI pick from the library, with fallbacks and a daily limit', async () => {
  await withEnv({ PRAYER_COMPANION_ALLOW_DRAFT: 'true', OPENAI_API_KEY: 'test-key' }, async () => {
    // Turning on AI processing is not enough: each prayer asks for it separately.
    const notAsked = harness({ consent: true, ai: { pick: 'PHP.4.6-7' } });
    assert.equal((await notAsked.service.choose('user', 'p', 'I am so anxious', 'en')).source, 'keywords');
    assert.deepEqual(notAsked.calls, []);
    const declined = harness({ consent: false, ai: { pick: 'PHP.4.6-7' } });
    assert.equal((await declined.service.choose('user', 'p', 'I am so anxious', 'en', true)).source, 'keywords', 'asking on a prayer is not enough without the setting');
    assert.deepEqual(declined.calls, []);

    const picked = harness({ consent: true, ai: { pick: 'PHP.4.6-7' } });
    const verse = await picked.service.choose('user', 'prayer-1', 'Please carry this week for me', 'en', true);
    assert.equal(verse.source, 'ai');
    assert.equal(verse.passage.id, 'PHP.4.6-7');
    assert.equal(verse.topicId, 'anxiety');
    assert.deepEqual(picked.calls, ['moderation', 'pick']);
    assert.deepEqual(picked.logged, ['generated']);

    const flagged = harness({ consent: true, ai: { flagged: true } });
    assert.equal((await flagged.service.choose('user', 'p', 'Please carry this week', 'en', true)).status, 'crisis');
    assert.deepEqual(flagged.calls, ['moderation'], 'moderation stops the pick');
    const modelCrisis = harness({ consent: true, ai: { crisis: true } });
    assert.equal((await modelCrisis.service.choose('user', 'p', 'Please carry this week', 'en', true)).status, 'crisis');
    assert.deepEqual(modelCrisis.logged, ['not-generated']);

    const down = harness({ consent: true, ai: { fail: true } });
    const fallback = await down.service.choose('user', 'p', 'I am so anxious', 'en', true);
    assert.equal(fallback.source, 'keywords');
    assert.equal(fallback.topicId, 'anxiety');
    assert.deepEqual(down.logged, ['not-generated']);

    const stray = harness({ consent: true, ai: { pick: 'GEN.1.1' } });
    assert.equal((await stray.service.choose('user', 'p', 'I am so anxious', 'en', true)).source, 'keywords', 'a passage outside the library is never used');

    const limited = harness({ consent: true, used: VERSE_LIMITS.aiPerDay });
    assert.equal((await limited.service.choose('user', 'p', 'I am so anxious', 'en', true)).source, 'keywords');
    assert.deepEqual(limited.calls, []);
  });
  await withEnv({ PRAYER_COMPANION_ALLOW_DRAFT: 'true', OPENAI_API_KEY: undefined }, async () => {
    const { service, calls } = harness({ consent: true });
    assert.equal((await service.choose('user', 'p', 'I am so anxious', 'en', true)).source, 'keywords');
    assert.deepEqual(calls, [], 'no key, no AI');
  });
});

test('no verse while the topic library awaits review (production)', async () => {
  await withEnv({ PRAYER_COMPANION_ALLOW_DRAFT: undefined }, async () => {
    if (library.status === 'reviewed') return;
    const { service } = harness();
    assert.equal(await service.choose('user', 'p', 'I am so anxious', 'en'), null);
  });
});

const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('the verse is sealed with the prayer, shown on the prayer only, and chosen again when the prayer is edited', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_PRAYER_VERSE_TEST');
  await withEnv({ REFLECTION_ENCRYPTION_KEYS: JSON.stringify({ test: randomBytes(32).toString('hex') }), REFLECTION_ENCRYPTION_ACTIVE_KEY: 'test', PRAYER_COMPANION_ALLOW_DRAFT: 'true', OPENAI_API_KEY: undefined }, async () => {
    try {
      await assert.rejects(db.$transaction(async tx => {
        const user = await tx.user.create({ data: { oidcSubject: `prayer-verse-${Date.now()}` } });
        const meditation = new MeditationService();
        const { service: verses } = harness();
        const prayers = new PrayerService(meditation, verses);
        for (const service of [meditation, prayers]) await service.onModuleDestroy();
        prayers.db = tx; prayers.userId = async () => user.id;

        const created = await prayers.create('me', { body: 'Synthetic prayer: I am anxious about my exams', locale: 'en' });
        assert.equal(created.verse.status, 'ok');
        assert.equal(created.verse.topicId, 'anxiety');
        const stored = await tx.prayerEntry.findUnique({ where: { id: created.id } });
        assert.ok(stored.verseCiphertext.startsWith('lbenc:v1:test:'));
        assert.ok(!stored.verseCiphertext.includes('anxiety') && !stored.verseCiphertext.includes('Verified'));
        assert.deepEqual((await prayers.get('me', created.id)).verse, created.verse);
        assert.equal('verse' in (await prayers.list('me'))[0], false, 'lists stay light');

        const edited = await prayers.update('me', created.id, { body: 'Synthetic prayer: thank you for this blessing', locale: 'en' });
        assert.equal(edited.verse.topicId, 'gratitude');
        const retitled = await prayers.update('me', created.id, { title: 'Thanks' });
        assert.deepEqual(retitled.verse, edited.verse, 'a new title keeps the verse');

        const crisis = await prayers.create('me', { body: 'Synthetic: I want to end my life', locale: 'fr' });
        assert.equal(crisis.verse.status, 'crisis');
        assert.ok(crisis.verse.contacts.length);

        await assert.rejects(prayers.create('me', { body: 'Synthetic', aiVerse: 'yes' }), /aiVerse/);
        // A verse service failure never stops the prayer from saving.
        verses.choose = async () => { throw new Error('down'); };
        const saved = await prayers.create('me', { body: 'Synthetic prayer saved anyway' });
        assert.equal(saved.verse, null);

        // Sealed to its record: moved to another prayer, it does not open.
        await tx.prayerEntry.update({ where: { id: saved.id }, data: { verseCiphertext: stored.verseCiphertext } });
        await assert.rejects(prayers.get('me', saved.id), /cannot be opened|Unable|decrypt/i);
        throw rollback;
      }), error => error === rollback);
    } finally { await db.$disconnect(); }
  });
});
