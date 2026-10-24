const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { fold, score, rank, parseReference, BOOKS } = require('../dist/search/search-rank');

test('folding ignores accents, case and punctuation', () => {
  assert.equal(fold('  Prière du SOIR! '), 'priere du soir');
  assert.equal(fold('L’Évangile'), 'l evangile');
});

test('ranking matches whole words and word beginnings, never inside a word', () => {
  assert.equal(score('grace', 'Disgrace'), 0);
  assert.equal(score('grace', 'Grace'), 100);
  assert.ok(score('grace', 'Grace for today') > score('grace', 'Amazing Grace'));
  assert.ok(score('grace', 'Amazing Grace') > score('grace', 'Living with graces'));
  assert.ok(score('grace', 'Living with graces') > score('grace', 'A plan', 'About grace and peace'));
  assert.equal(score('pray', 'Prayer habits') > 0, true);
  assert.equal(score('pr', 'Prayer habits'), 0, 'two letters only match whole words');
  assert.equal(score('priere', 'Prière du soir') > 0, true);
  assert.equal(score('peace jesus', 'Peace with Jesus') > 0, true);
  assert.equal(score('peace jesus', 'Peace and joy'), 0, 'every word must match');
  const ranked = rank('faith', [{ t: 'Walking by faith' }, { t: 'Unfaithful' }, { t: 'Faith' }, { t: 'Hope', d: 'Faith and hope' }], x => ({ title: x.t, description: x.d }));
  assert.deepEqual(ranked.map(x => x.t), ['Faith', 'Walking by faith', 'Hope']);
});

test('references parse in English and French, with short forms, and invalid chapters are refused', () => {
  const ref = (q, l = 'en') => { const r = parseReference(q, l); return r && `${r.chapterId}${r.verse ? '.' + r.verse : ''}${r.verseEnd ? '-' + r.verseEnd : ''} ${r.label}`; };
  assert.equal(ref('John 3:16'), 'JHN.3.16 John 3:16');
  assert.equal(ref('jean 3 16', 'fr'), 'JHN.3.16 Jean 3:16');
  assert.equal(ref('1 Jean 4', 'fr'), '1JN.4 1 Jean 4');
  assert.equal(ref('Psaume 23', 'fr'), 'PSA.23 Psaume 23');
  assert.equal(ref('psalms 119:105'), 'PSA.119.105 Psalm 119:105');
  assert.equal(ref('gen 1:1-3'), 'GEN.1.1-3 Genesis 1:1-3');
  assert.equal(ref('1 cor 13'), '1CO.13 1 Corinthians 13');
  assert.equal(ref('Phil 4:13'), 'PHP.4.13 Philippians 4:13');
  assert.equal(ref('Apocalypse 21', 'fr'), 'REV.21 Apocalypse 21');
  assert.equal(ref('Ésaïe 53', 'fr'), 'ISA.53 Ésaïe 53');
  assert.equal(ref('esaie 53', 'fr'), 'ISA.53 Ésaïe 53');
  for (const bad of ['John 99', 'John 3:0', 'John 3:5-2', 'grace', 'grace 3', 'jo 3', 'Jude 2', '3 Kings 1']) assert.equal(parseReference(bad, 'en'), null, bad);
  assert.equal(BOOKS.length, 66);
});

const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('the endpoint returns published content only, never private writing, and each section fails on its own', { skip: !url, timeout: 60000 }, async () => {
  for (const raw of [url, process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const target = new URL(raw); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  }
  Object.assign(process.env, { LIVINGWORD_MEDIA_HOSTS: 'media.example.org', REFLECTION_ENCRYPTION_KEYS: JSON.stringify({ s: randomBytes(32).toString('hex') }), REFLECTION_ENCRYPTION_ACTIVE_KEY: 's' });
  const { PrismaClient } = require('@prisma/client');
  const { SearchService } = require('../dist/search/search.service');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const run = randomBytes(3).toString('hex');
  const word = `zion${run}`;
  const now = new Date(Date.now() - 60000);
  const user = await db.user.create({ data: { oidcSubject: `search-${run}` } });
  try {
    await db.studySeries.create({ data: { slug: `s1-${run}`, locale: 'en', title: `${word} study`, description: 'x', method: 'THEMATIC', status: 'PUBLISHED' } });
    await db.studySeries.create({ data: { slug: `s2-${run}`, locale: 'en', title: `${word} draft study`, description: 'x', method: 'THEMATIC', status: 'DRAFT' } });
    await db.studySeries.create({ data: { slug: `s3-${run}`, locale: 'fr', title: `${word} étude`, description: 'x', method: 'THEMATIC', status: 'PUBLISHED' } });
    await db.learningPath.create({ data: { slug: `p1-${run}`, title: `${word} pathway`, description: 'x', isPublished: true } });
    await db.learningPath.create({ data: { slug: `p2-${run}`, title: `${word} hidden pathway`, description: 'x', isPublished: false } });
    const ok = { approvedAt: now, publishedAt: now, rightsReference: 'r', attribution: 'a', transcript: 't', creatorId: 'c', locale: 'en', kind: 'audio' };
    await db.sermon.create({ data: { ...ok, title: `${word} teaching`, mediaKey: 'https://media.example.org/a.mp3', speaker: 'Speaker' } });
    await db.sermon.create({ data: { ...ok, title: `${word} unapproved teaching`, mediaKey: 'https://media.example.org/b.mp3', approvedAt: null } });
    await db.sermon.create({ data: { ...ok, title: `${word} other host teaching`, mediaKey: 'https://evil.example.com/c.mp3' } });
    await db.meditation.create({ data: { slug: `m1-${run}`, title: `${word} meditation`, scriptureReference: 'PSA.23', explanation: 'x', questions: [], guidedPrayer: 'x', isPublished: true, locale: 'en' } });
    await db.meditation.create({ data: { slug: `m2-${run}`, title: `${word} future meditation`, scriptureReference: 'PSA.23', explanation: 'x', questions: [], guidedPrayer: 'x', isPublished: true, locale: 'en', publishDate: new Date(Date.now() + 5 * 86400000) } });
    await db.prayerEntry.create({ data: { userId: user.id, ciphertext: `${word} private prayer` } });

    let bibleCalls = 0;
    const bible = { search: async () => { bibleCalls++; throw new Error('provider down'); } };
    const service = new SearchService(bible);
    const result = await service.search(word, 'en');
    const titles = kind => result.sections.find(s => s.kind === kind).items.map(i => i.title);
    assert.deepEqual(titles('studies'), [`${word} study`]);
    assert.deepEqual(titles('pathways'), [`${word} pathway`]);
    assert.deepEqual(titles('teachings'), [`${word} teaching`]);
    assert.deepEqual(titles('meditations'), [`${word} meditation`]);
    assert.equal(result.sections.find(s => s.kind === 'scripture').status, 'unavailable', 'a provider failure stays in its own section');
    assert.ok(result.sections.filter(s => s.kind !== 'scripture').every(s => s.status === 'ok'));
    assert.doesNotMatch(JSON.stringify(result), /private prayer/);
    assert.equal(result.go, null);

    const fr = await service.search(word, 'fr');
    assert.deepEqual(fr.sections.find(s => s.kind === 'studies').items.map(i => i.title), [`${word} étude`]);

    const reference = await service.search('Jean 3:16', 'fr');
    assert.deepEqual(reference.go, { label: 'Jean 3:16', href: '/bible/read?locale=fr&chapter=JHN.3&verse=16' });
    assert.equal(bibleCalls, 2, 'a reference skips Scripture word search');

    await assert.rejects(service.search('a', 'en'), /2 to 120/);
    await assert.rejects(service.search('x'.repeat(121), 'en'), /2 to 120/);
    const plans = await service.search('discover jesus', 'en');
    assert.deepEqual(plans.sections.find(s => s.kind === 'plans').items.map(i => i.href), ['/bible/plans/discover-jesus']);
    await service.onModuleDestroy();
  } finally {
    await db.user.deleteMany({ where: { id: user.id } });
    await db.studySeries.deleteMany({ where: { slug: { endsWith: run } } });
    await db.learningPath.deleteMany({ where: { slug: { endsWith: run } } });
    await db.sermon.deleteMany({ where: { title: { startsWith: word } } });
    await db.meditation.deleteMany({ where: { slug: { endsWith: run } } });
    await db.$disconnect();
  }
});
