// "Load more" paging for the four member lists that used to stop at a fixed cap: prayers, Daily Word sessions,
// meditation history and care requests. Real app over HTTP with a Clerk test double, on the loopback test database.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { randomBytes, randomUUID } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
const TOKENS = { 'page-a': 'pg-member-a', 'page-b': 'pg-member-b' };

test('load more pages through every record, newest first, and only with your own cursor', { skip: !url, timeout: 120000 }, async () => {
  for (const raw of [url, process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const target = new URL(raw); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  }
  Object.assign(process.env, {
    API_RATE_LIMIT: '10000', CLERK_SECRET_KEY: 'sk_test_paging',
    REFLECTION_ENCRYPTION_KEYS: JSON.stringify({ pg: randomBytes(32).toString('hex') }), REFLECTION_ENCRYPTION_ACTIVE_KEY: 'pg',
    BIBLE_NOTES_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
  });
  const load = Module._load;
  Module._load = function (request, ...rest) {
    const real = load.call(this, request, ...rest);
    return request === '@clerk/backend' ? { ...real, verifyToken: async token => { if (!TOKENS[token]) throw new Error('invalid'); return { sub: TOKENS[token] }; } } : real;
  };
  const { PrismaClient } = require('@prisma/client');
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/app.module');
  const { encryptReflection } = require('../dist/security/reflection-crypto');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const run = randomBytes(4).toString('hex');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  await app.listen(0, '127.0.0.1');
  const base = (await app.getUrl()) + '/api/v1';
  const get = async (who, route) => { const res = await fetch(base + route, { headers: { Authorization: `Bearer ${who}` } }); return { status: res.status, json: res.status < 300 ? await res.json() : null }; };
  const N = 60;
  try {
    await get('page-a', '/me/profile'); await get('page-b', '/me/profile');
    const a = await db.user.findUnique({ where: { oidcSubject: TOKENS['page-a'] } });
    const b = await db.user.findUnique({ where: { oidcSubject: TOKENS['page-b'] } });
    const t0 = Date.UTC(2025, 0, 1);
    // Fixtures: 60 of each for A, with strictly increasing times so "newest first" is well defined.
    for (let i = 0; i < N; i++) {
      const at = new Date(t0 + i * 86400000);
      const id = randomUUID();
      await db.prayerEntry.create({ data: { id, userId: a.id, ciphertext: encryptReflection(`prayer ${i}`, `prayer:body:${a.id}:${id}`), createdAt: at, updatedAt: at } });
      await db.dailyWordSession.create({ data: { userId: a.id, journeyDate: at, passageKey: 'JHN.1.1' } });
      const m = await db.meditation.create({ data: { slug: `pg-${run}-${i}`, title: `Meditation ${i}`, scriptureReference: 'JHN.1', explanation: 'x', questions: [], guidedPrayer: 'x', isPublished: true } });
      await db.meditationCompletion.create({ data: { userId: a.id, meditationId: m.id, completedAt: at } });
      const rid = randomUUID();
      await db.careRequest.create({ data: { id: rid, memberId: a.id, topic: 'prayer', language: 'en', contactPreference: 'messages', messageCiphertext: encryptReflection('x', `care:request:${a.id}:${rid}:`), consentAt: at, createdAt: at, status: 'CLOSED' } });
    }
    const lists = {
      prayers: ['/prayers/page', item => item.id],
      sessions: ['/daily-word/sessions/page', item => item.id],
      meditations: ['/meditations/history/page', item => item.id],
      care: ['/care/requests/page', item => item.id],
    };
    for (const [name, [route, idOf]] of Object.entries(lists)) {
      const first = await get('page-a', route);
      assert.equal(first.status, 200, name);
      assert.equal(first.json.items.length, 50, `${name}: first page`);
      assert.ok(first.json.nextCursor, `${name}: has more`);
      const second = await get('page-a', `${route}?cursor=${encodeURIComponent(first.json.nextCursor)}`);
      assert.equal(second.status, 200, name);
      assert.equal(second.json.items.length, N - 50, `${name}: second page`);
      assert.equal(second.json.nextCursor, null, `${name}: no third page`);
      const ids = [...first.json.items, ...second.json.items].map(idOf);
      assert.equal(new Set(ids).size, N, `${name}: no duplicates or gaps`);
      // B cannot use A's cursor, and B's own list is empty.
      assert.equal((await get('page-b', `${route}?cursor=${encodeURIComponent(first.json.nextCursor)}`)).status, 404, `${name}: foreign cursor`);
      assert.deepEqual((await get('page-b', route)).json, { items: [], nextCursor: null }, `${name}: B sees nothing`);
      assert.equal((await get('page-a', `${route}?cursor=not-a-real-id`)).status, 404, `${name}: unknown cursor`);
    }
    // Newest first, across the page boundary.
    const p1 = (await get('page-a', '/daily-word/sessions/page')).json;
    const p2 = (await get('page-a', `/daily-word/sessions/page?cursor=${p1.nextCursor}`)).json;
    const dates = [...p1.items, ...p2.items].map(s => s.journeyDate);
    assert.deepEqual(dates, [...dates].sort().reverse());
  } finally {
    await app.close();
    await db.user.deleteMany({ where: { oidcSubject: { in: Object.values(TOKENS) } } });
    await db.meditation.deleteMany({ where: { slug: { startsWith: `pg-${run}-` } } });
    await db.$disconnect();
  }
});
