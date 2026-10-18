// Run after pnpm --filter @lifebook/api build; never connects to a database or the Bible provider.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('reflect-metadata');
const { MeditationService } = require('../dist/meditation/meditation.service');
const { MeditationModule } = require('../dist/meditation/meditation.module');
const { BibleContentModule } = require('../dist/bible-content/bible-content.module');

const translations = { en: 'King James Version', fr: 'Bible J.N. Darby' };
const texts = {
  'en:JAS.1.22': '     [22] But be ye doers of the word, and not hearers only, deceiving your own selves. \n',
  'fr:JAS.1.22': '     [22] Mais mettez la parole en pratique, et ne l’écoutez pas seulement, vous séduisant vous-mêmes. \n',
};
function stubBible({ failing = false } = {}) {
  const calls = [];
  return {
    calls,
    passage: async (locale, id) => {
      calls.push(`${locale}:${id}`);
      if (failing) throw Object.assign(new Error('Scripture provider temporarily unavailable'), { status: 503 });
      return { reference: locale === 'fr' ? 'Jacques 1:22' : 'James 1:22', text: texts[`${locale}:${id}`] ?? `[1] text ${id}`, translation: `${locale}-bible-id`, copyright: locale === 'fr' ? 'Texte libre de droits' : 'PUBLIC DOMAIN', provider: 'API.Bible' };
    },
    translation: async locale => ({ data: { name: 'ignored', nameLocal: translations[locale] } }),
  };
}

test('the meditation module can reach the Bible provider', () => {
  assert.ok(Reflect.getMetadata('imports', MeditationModule).includes(BibleContentModule));
});

test('French Daily Word quotes J.N. Darby from the provider, with attribution', async () => {
  const bible = stubBible();
  const word = await new MeditationService(bible).dailyWord('fr', '2026-10-18');
  assert.equal(word.passageKey, 'JAMES_1_22');
  assert.equal(word.passageId, 'JAS.1.22');
  assert.deepEqual(bible.calls, ['fr:JAS.1.22']);
  assert.equal(word.verse.text, 'Mais mettez la parole en pratique, et ne l’écoutez pas seulement, vous séduisant vous-mêmes.');
  assert.equal(word.verse.translation, 'Bible J.N. Darby');
  assert.equal(word.verse.reference, 'Jacques 1:22');
  assert.equal(word.verse.copyright, 'Texte libre de droits');
});

test('English Daily Word quotes the KJV from the provider the same way', async () => {
  const word = await new MeditationService(stubBible()).dailyWord('en', '2026-10-18');
  assert.equal(word.verse.text, 'But be ye doers of the word, and not hearers only, deceiving your own selves.');
  assert.equal(word.verse.translation, 'King James Version');
  assert.equal(word.verse.copyright, 'PUBLIC DOMAIN');
});

test('verses are cached per locale and passage', async () => {
  const bible = stubBible();
  const service = new MeditationService(bible);
  await service.dailyWord('fr', '2026-10-18');
  await service.dailyWord('fr', '2026-10-18');
  await service.dailyWord('en', '2026-10-18');
  assert.deepEqual(bible.calls, ['fr:JAS.1.22', 'en:JAS.1.22']);
});

test('a provider outage is an error, never substitute text', async () => {
  await assert.rejects(new MeditationService(stubBible({ failing: true })).dailyWord('fr', '2026-10-18'), /unavailable/);
  await assert.rejects(new MeditationService().dailyWord('fr', '2026-10-18'), /not configured/);
});

test('the rotation is chosen without the network and every passage is a provider id', () => {
  const service = new MeditationService();
  const keys = ['2026-10-16', '2026-10-17', '2026-10-18'].map(day => service.dailyPassage(day));
  assert.deepEqual(keys.map(k => k.passageId), ['JOS.1.8', 'PSA.119.105', 'JAS.1.22']);
  assert.throws(() => service.dailyPassage('2026-13-40'), /Invalid date/);
});

test('no Scripture wording is hard-coded in the Daily Word source', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/meditation/meditation.service.ts'), 'utf8');
  for (const phrase of ['doers of the word', 'mettez la parole', 'lamp unto my feet', 'révision éditoriale']) {
    assert.ok(!source.includes(phrase), `found "${phrase}"`);
  }
});
