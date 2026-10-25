const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const { BIBLE_VERSIONS, LocalBible, resolveVersion } = require('../dist/bible-content/bible-versions');
const { BibleContentService } = require('../dist/bible-content/bible-content.service');

const lsg = new LocalBible('lsg', 'lsg');

test('each language defaults to its first version, and unknown versions are refused', () => {
  assert.equal(resolveVersion('en').id, 'kjv');
  assert.equal(resolveVersion('fr').id, 'darby');
  assert.equal(resolveVersion('en', 'nkjv').id, 'nkjv');
  assert.throws(() => resolveVersion('en', 'niv'), { status: 400 });
  assert.throws(() => resolveVersion('en', '../../etc'), { status: 400 });
});

test('the apps offer exactly the versions the API serves', () => {
  const web = readFileSync(join(__dirname, '../../web/lib/bible-versions.ts'), 'utf8');
  const offered = [...web.matchAll(/\{ id: '([a-z]+)', source: '([a-z.]+)', locale: '(en|fr)', abbreviation: '([A-Z]+)', name: '([^']+)'/g)]
    .map(([, id, source, locale, abbreviation, name]) => ({ id, source: source === 'lifebook' ? 'local' : source, locale, abbreviation, name }));
  assert.deepEqual(offered, BIBLE_VERSIONS.map(({ id, source, locale, abbreviation, name }) => ({ id, source, locale, abbreviation, name })));
});

test('Louis Segond 1910 is complete and carries only verse text', () => {
  const folder = join(__dirname, '../content/bibles/lsg');
  const index = JSON.parse(readFileSync(join(folder, 'index.json'), 'utf8'));
  assert.equal(index.books.length, 66);
  assert.equal(readdirSync(folder).length, 67);
  let verses = 0;
  for (const meta of index.books) {
    const book = JSON.parse(readFileSync(join(folder, `${meta.id}.json`), 'utf8'));
    assert.equal(book.chapters.length, meta.chapters, meta.id);
    for (const chapter of book.chapters) {
      const numbers = chapter.flat().map(([n]) => Number(n));
      assert.deepEqual(numbers, numbers.map((_, i) => i + 1), `${meta.id} verses run 1, 2, 3…`);
      for (const [, text] of chapter.flat()) { assert.ok(text.length > 0); assert.doesNotMatch(text, /\\|strong=|\|/); }
      verses += numbers.length;
    }
  }
  assert.equal(verses, 31170);
});

test('Louis Segond answers in API.Bible shapes the readers already parse', () => {
  assert.equal(lsg.books().data.find(b => b.id === 'PSA').name, 'Psaumes');
  assert.equal(lsg.chapters('PSA').data.length, 150);
  const chapter = lsg.chapter('JHN.3').data;
  assert.equal(chapter.reference, 'Jean 3');
  assert.equal(chapter.fumsToken, null);
  assert.match(chapter.content, /\[16\] Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle\./);
  assert.match(chapter.copyright, /Domaine public/);
  const passage = lsg.passage('PSA.23.1-3');
  assert.equal(passage.reference, 'Psaumes 23:1-3');
  assert.match(passage.text, /^\[1\] Cantique de David\. L’Éternel est mon berger: je ne manquerai de rien\..*\[3\] Il restaure mon âme/s);
  assert.doesNotMatch(passage.text, /\[4\]/);
  assert.equal(lsg.passage('JHN.3.16').reference, 'Jean 3:16');
  assert.throws(() => lsg.chapter('JHN.22'), { status: 400 });
  assert.throws(() => lsg.passage('JHN.3.40'), { status: 400 });
  assert.throws(() => lsg.chapters('XYZ'), { status: 400 });
});

test('Louis Segond search matches words without accents and returns references only', () => {
  const found = lsg.search('Eternel berger', 0, 20);
  assert.ok(found.items.some(item => item.id === 'PSA.23.1'));
  assert.deepEqual(Object.keys(found.items[0]).sort(), ['chapterId', 'id', 'reference', 'verse']);
  assert.ok(lsg.search('berger', 0, 20).total > lsg.search('bergers', 0, 20).total, 'a word finds its longer forms');
  assert.equal(lsg.search('zzzz', 0, 20).total, 0);
  assert.equal(lsg.search('...', 0, 20).total, 0);
});

test('the service reads Louis Segond without API.Bible, and keeps API.Bible versions behind the key', async () => {
  const saved = { ...process.env };
  try {
    delete process.env.API_BIBLE_KEY;
    const bible = new BibleContentService();
    const passage = await bible.passage('fr', 'PSA.23.1', 'lsg');
    assert.equal(passage.translation, 'lsg');
    assert.equal(passage.provider, 'LifeBook');
    assert.equal((await bible.search('fr', 'berger', '0', 'canonical', 'lsg')).limit, 20);
    await assert.rejects(bible.chapter('en', 'JHN.3', 'nkjv'), { status: 503 });
    await assert.rejects(bible.chapter('en', 'JHN.3', 'niv'), { status: 400 });
  } finally { process.env = saved; }
});
