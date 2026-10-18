const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { crisisScreen } = require('../dist/prayer/crisis-screen');
const { OpenAiClient } = require('../dist/prayer/openai-client');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;

test('the crisis screen catches English and French risk wording without flagging ordinary prayers', () => {
  for (const text of ['I want to kill myself', 'I have been thinking about suicide', 'Sometimes I wish I was dead', 'I don’t want to live anymore', 'He hits me when he drinks',
    'Je veux mourir', 'J’ai pensé à me suicider', 'Je n’ai plus envie de vivre', 'Il me frappe tous les soirs', 'Je veux en finir', 'I keep cutting myself',
    'I have been writing goodbye letters to my children', 'My family would be better off without me', 'J’ai écrit des lettres d’adieu', 'Bientôt je ne serai plus un poids pour personne', 'I have been saving up my sleeping pills']) assert.equal(crisisScreen(text), true, text);
  for (const text of ['Please give me peace about my exams', 'Pray for my grandfather who died last week', 'I am tired and need rest',
    'Seigneur, guide mes pas cette semaine', 'Help me forgive my brother', 'I am anxious about money',
    'I keep my letters from my grandmother in a box', 'Help me plan a farewell party for my retiring colleague', 'I am giving my old clothes to the church charity']) assert.equal(crisisScreen(text), false, text);
});

test('the OpenAI client opts out of storage, enforces the schema and never leaks the key', async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'sk-test-secret-value';
  const calls = [];
  const ok = new OpenAiClient(async (url, init) => { calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization }); return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: '{"a":1}' } }] }) }; });
  assert.deepEqual(await ok.structured({ model: 'm', system: 's', user: 'u', schemaName: 'x', schema: { type: 'object' }, maxTokens: 10 }), { a: 1 });
  assert.equal(calls[0].body.store, false);
  assert.equal(calls[0].body.response_format.json_schema.strict, true);
  assert.equal(calls[0].auth, 'Bearer sk-test-secret-value');
  const failing = new OpenAiClient(async () => ({ ok: false, status: 401, json: async () => ({}) }));
  await assert.rejects(failing.flagsRisk('text'), error => /unavailable/.test(error.message) && !error.message.includes('sk-test'));
  const refusing = new OpenAiClient(async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: null, refusal: 'no' } }] }) }));
  await assert.rejects(refusing.structured({ model: 'm', system: 's', user: 'u', schemaName: 'x', schema: {}, maxTokens: 10 }), /could not be written/);
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(ok.flagsRisk('x'), /not available yet/);
  if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous;
});

test('guided meditation needs consent, screens for crisis, uses only reviewed Scripture and stores the result encrypted', { skip: !url }, async () => {
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.pathname, '/lifebook_restore');
  const { PrismaClient } = require('@prisma/client');
  const { PrayerService } = require('../dist/prayer/prayer.service');
  const { PrayerCompanionService } = require('../dist/prayer/prayer-companion.service');
  const { GuidedMeditationService } = require('../dist/prayer/guided-meditation.service');
  const { MeditationService } = require('../dist/meditation/meditation.service');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const rollback = new Error('ROLLBACK_MEDITATION_TEST');
  const saved = ['REFLECTION_ENCRYPTION_KEYS', 'REFLECTION_ENCRYPTION_ACTIVE_KEY', 'PRAYER_COMPANION_ALLOW_DRAFT'].map(k => [k, process.env[k]]);
  process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ test: randomBytes(32).toString('hex') });
  process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'test';
  process.env.PRAYER_COMPANION_ALLOW_DRAFT = 'true';
  try {
    await assert.rejects(db.$transaction(async tx => {
      const prefix = `med-test-${Date.now()}`;
      const owner = await tx.user.create({ data: { oidcSubject: `${prefix}-owner` } });
      const other = await tx.user.create({ data: { oidcSubject: `${prefix}-other` } });
      const meditation = new MeditationService();
      const prayers = new PrayerService(meditation);
      const bible = { passage: async (locale, id) => ({ reference: `${locale}:${id}`, text: `verified text ${id}`, copyright: null }) };
      const companion = new PrayerCompanionService(bible);
      const guided = new GuidedMeditationService(prayers, companion);
      for (const s of [meditation, prayers, guided]) await s.onModuleDestroy();
      prayers.db = tx; guided.db = tx;
      prayers.userId = async auth => auth === 'owner' ? owner.id : other.id;
      let flag = false; let draft; const generated = [];
      let risk = 'none';
      guided.ai = { flagsRisk: async () => flag, assessRisk: async () => risk, structured: async input => { generated.push(input); return draft(); } };
      const normal = () => ({ safety: 'none', passage_ids: ['PSA.56.3', 'NOT.1.1', 'ISA.41.10', 'PSA.56.3'], reflection: Array(200).fill('word').join(' ') + '.', questions: ['One?', 'Two?', 'Three?', 'Four?'], prayer: 'Lord, I bring you my fear. Amen.' });
      draft = normal;

      const prayer = await prayers.create('owner', { title: 'Exams', body: 'Synthetic prayer: I am afraid about my exams.' });
      await assert.rejects(guided.generate('owner', prayer.id, { consent: false }), /confirm/);
      await assert.rejects(guided.generate('owner', prayer.id, { consent: true }), /AI processing is turned off/);
      await tx.faithProfile.create({ data: { userId: owner.id, aiProcessingConsent: true } });
      await tx.faithProfile.create({ data: { userId: other.id, aiProcessingConsent: true } });
      await assert.rejects(guided.generate('other', prayer.id, { consent: true }), /not found/);

      const result = await guided.generate('owner', prayer.id, { consent: true, locale: 'fr' });
      assert.equal(result.status, 'ok');
      assert.deepEqual(result.meditation.passages.map(p => p.id), ['PSA.56.4', 'ISA.41.10'], 'unknown ids dropped, duplicates removed, Darby numbering applied');
      assert.equal(result.meditation.passages[0].text, 'verified text PSA.56.4', 'Scripture comes from the provider, never from the model');
      assert.ok(result.meditation.reflection.split(/\s+/).length <= 121);
      assert.equal(result.meditation.questions.length, 3);
      assert.match(generated[0].user, /Language: French/);
      assert.match(generated[0].user, /afraid about my exams/);
      assert.equal(generated[0].user.includes(owner.id), false, 'no account id is sent');
      const row = await tx.prayerEntry.findUnique({ where: { id: prayer.id } });
      assert.ok(row.meditationCiphertext.startsWith('lbenc:v1:test:') && !row.meditationCiphertext.includes('verified'));
      assert.equal((await prayers.get('owner', prayer.id)).meditation.passages.length, 2);
      assert.equal('meditation' in (await prayers.list('owner'))[0], false, 'lists never carry the meditation');

      // Crisis: keyword screen, provider moderation, or the model's own flag. Nothing generated or stored.
      const crisisPrayer = await prayers.create('owner', { body: 'Synthetic: I don’t want to live anymore.' });
      const before = generated.length;
      const crisis = await guided.generate('owner', crisisPrayer.id, { consent: true });
      assert.equal(crisis.status, 'crisis');
      assert.ok(crisis.contacts.some(c => c.number === '112'));
      assert.equal(generated.length, before, 'no text is generated after a crisis screen');
      const quiet = await prayers.create('owner', { body: 'Synthetic: please help me this week.' });
      flag = true;
      assert.equal((await guided.generate('owner', quiet.id, { consent: true })).status, 'crisis');
      flag = false; risk = 'possible';
      assert.equal((await guided.generate('owner', quiet.id, { consent: true })).status, 'crisis', 'the focused risk check also stops generation');
      risk = 'none'; draft = () => ({ ...normal(), safety: 'crisis' });
      assert.equal((await guided.generate('owner', quiet.id, { consent: true })).status, 'crisis');
      assert.equal((await tx.prayerEntry.findUnique({ where: { id: quiet.id } })).meditationCiphertext, null);
      draft = normal;

      // Daily limit, counted without content: five requests so far, so the sixth is refused.
      await assert.rejects(guided.generate('owner', quiet.id, { consent: true }), /5 guided meditations a day/);
      const usage = await tx.aiUsage.findMany({ where: { userId: owner.id } });
      assert.equal(usage.length, 5);
      assert.ok(usage.every(u => ['generated', 'not-generated'].includes(u.outcome)), 'outcomes never record a crisis by name');

      // Editing the prayer clears the meditation; it can also be removed directly.
      await prayers.update('owner', prayer.id, { body: 'Synthetic edited prayer.' });
      assert.equal((await prayers.get('owner', prayer.id)).meditation, null);
      await tx.aiUsage.deleteMany({ where: { userId: owner.id } });
      await guided.generate('owner', prayer.id, { consent: true });
      assert.equal((await prayers.clearMeditation('owner', prayer.id)).meditation, null);
      throw rollback;
    }), error => error === rollback);
  } finally {
    for (const [k, v] of saved) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    await db.$disconnect();
  }
});
