const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const library = require('../content/prayer-topics.json');
const { PrayerCompanionService, validateLibrary } = require('../dist/prayer/prayer-companion.service');
const { BibleContentService } = require('../dist/bible-content/bible-content.service');

function stubBible(failing = new Set()) {
  const calls = [];
  return { calls, passage: async (locale, id) => { calls.push(`${locale}:${id}`); if (failing.has(id)) throw new Error('down'); return { reference: `ref ${id}`, text: `text ${id}`, copyright: null }; } };
}
async function withEnv(name, value, fn) {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name]; else process.env[name] = value;
  try { return await fn(); } finally { if (previous === undefined) delete process.env[name]; else process.env[name] = previous; }
}

test('the shipped topic library is well formed and still marked as a draft until pastoral review', () => {
  assert.doesNotThrow(() => validateLibrary(library));
  assert.equal(library.status, 'draft');
  assert.ok(library.topics.length >= 20);
});

test('library validation rejects incomplete or unsafe content changes', () => {
  const copy = () => JSON.parse(JSON.stringify(library));
  const reviewed = copy(); reviewed.status = 'reviewed';
  assert.throws(() => validateLibrary(reviewed), /reviewer/);
  const missingFrench = copy(); missingFrench.topics[0].prompt.fr = ' ';
  assert.throws(() => validateLibrary(missingFrench), /English and French/);
  const badPassage = copy(); badPassage.topics[0].passages[0] = 'PHP.4.6-PHP.4.7';
  assert.throws(() => validateLibrary(badPassage), /invalid passage/);
  const badOverride = copy(); badOverride.topics[0].passages[0] = { id: 'PSA.56.3', fr: '../x' };
  assert.throws(() => validateLibrary(badOverride), /invalid passage/);
  const duplicate = copy(); duplicate.topics[1].id = duplicate.topics[0].id;
  assert.throws(() => validateLibrary(duplicate), /duplicate/);
  const tooFew = copy(); tooFew.topics[0].passages = tooFew.topics[0].passages.slice(0, 2);
  assert.throws(() => validateLibrary(tooFew), /3 to 8/);
});

test('a draft library is served only where explicitly allowed', async () => {
  const service = new PrayerCompanionService(stubBible());
  await withEnv('PRAYER_COMPANION_ALLOW_DRAFT', undefined, async () => {
    assert.throws(() => service.topics('en'), /not available/);
    await assert.rejects(service.topic('fear', 'en'), /not available/);
  });
  await withEnv('PRAYER_COMPANION_ALLOW_DRAFT', 'true', async () => {
    const { reviewed, topics } = service.topics('fr');
    assert.equal(reviewed, false);
    assert.equal(topics.find(t => t.id === 'fear').title, 'La peur');
  });
});

test('topics use French verse overrides, skip a failed passage and cache provider calls', async () => {
  await withEnv('PRAYER_COMPANION_ALLOW_DRAFT', 'true', async () => {
    const bible = stubBible(new Set(['JOS.1.9']));
    const service = new PrayerCompanionService(bible);
    const fr = await service.topic('fear', 'fr');
    assert.deepEqual(fr.passages.map(p => p.id), ['ISA.41.10', 'PSA.56.4', '2TI.1.7'], 'Darby numbers Psalm 56:3 as 56:4');
    assert.equal(fr.unavailable, 1);
    const en = await service.topic('fear', 'en');
    assert.ok(en.passages.some(p => p.id === 'PSA.56.3'));
    const before = bible.calls.length;
    await service.topic('fear', 'en');
    assert.equal(bible.calls.length, before + 1, 'only the failed passage is requested again');
    await assert.rejects(service.topic('unknown', 'en'), /not found/);
    const down = new PrayerCompanionService(stubBible(new Set(library.topics[0].passages.map(p => typeof p === 'string' ? p : p.id))));
    await assert.rejects(down.topic(library.topics[0].id, 'en'), /temporarily unavailable/);
  });
});

test('short verse ranges are expanded to the form API.Bible accepts', async () => {
  const urls = [];
  const realFetch = global.fetch;
  global.fetch = async url => { urls.push(String(url)); return { ok: true, json: async () => ({ data: { content: 'text', reference: 'ref' } }) }; };
  try {
    await withEnv('API_BIBLE_KEY', 'test', () => withEnv('API_BIBLE_EN_BIBLE_ID', 'bible', async () => {
      const bible = new BibleContentService();
      await bible.passage('en', 'PHP.4.6-7');
      await bible.passage('en', 'JHN.3.16');
    }));
  } finally { global.fetch = realFetch; }
  assert.match(urls[0], /\/passages\/PHP\.4\.6-PHP\.4\.7\?/);
  assert.match(urls[1], /\/passages\/JHN\.3\.16\?/);
});

// Opt-in: checks every reference against the live provider in both translations.
const live = process.env.LIFEBOOK_VERIFY_SCRIPTURE === '1' && process.env.API_BIBLE_KEY;
test('every topic passage resolves in KJV and Darby', { skip: !live }, async () => {
  const bible = new BibleContentService();
  const failures = [];
  for (const topic of library.topics) for (const ref of topic.passages) {
    for (const locale of ['en', 'fr']) {
      const id = typeof ref === 'string' ? ref : locale === 'fr' && ref.fr ? ref.fr : ref.id;
      try { assert.ok((await bible.passage(locale, id)).text); } catch { failures.push(`${topic.id} ${locale} ${id}`); }
    }
  }
  assert.deepEqual(failures, []);
});
