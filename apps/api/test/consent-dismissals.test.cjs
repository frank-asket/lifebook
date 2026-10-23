const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const Module = require('node:module');
const url = process.env.LIFEBOOK_ACCOUNT_TEST_DATABASE_URL;

test('consent transitions are atomic and dismissals persist only for their owner', { skip: !url }, async () => {
  for (const raw of [url, process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const target = new URL(raw); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  }
  Object.assign(process.env, { API_RATE_LIMIT: '10000', CLERK_SECRET_KEY: 'sk_test_synthetic', REFLECTION_ENCRYPTION_KEYS: JSON.stringify({ test: randomBytes(32).toString('hex') }), REFLECTION_ENCRYPTION_ACTIVE_KEY: 'test' });
  const prefix = `consent-${randomUUID()}`;
  const original = Module._load;
  Module._load = function (request, ...rest) {
    const real = original.call(this, request, ...rest);
    return request === '@clerk/backend' ? { ...real, verifyToken: async token => { if (!['a', 'b'].includes(token)) throw new Error('invalid'); return { sub: `${prefix}-${token}` }; } } : real;
  };
  const { PrismaClient } = require('@prisma/client');
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../dist/app.module');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  async function call(who, route, method = 'GET', body) {
    const response = await fetch(base + route, { method, headers: { Authorization: `Bearer ${who}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const json = await response.json(); return { status: response.status, json, headers: response.headers };
  }
  try {
    await call('a', '/me/profile'); await call('b', '/me/profile');
    const a = await db.user.findUniqueOrThrow({ where: { oidcSubject: `${prefix}-a` } });
    const b = await db.user.findUniqueOrThrow({ where: { oidcSubject: `${prefix}-b` } });
    // Default false and non-consent edits do not invent historical consent.
    assert.equal((await call('a', '/me/profile', 'PUT', { language: 'fr', personalizationConsent: false })).status, 200);
    assert.equal(await db.consentEvent.count({ where: { userId: a.id } }), 0);
    const saves = await Promise.all(Array.from({ length: 6 }, () => call('a', '/me/profile', 'PUT', { personalizationConsent: true, learningGoals: ['Learn about Jesus'] })));
    assert.ok(saves.every(r => r.status === 200));
    assert.equal(await db.consentEvent.count({ where: { userId: a.id, kind: 'personalization', granted: true } }), 1);
    await call('a', '/me/profile', 'PUT', { aiProcessingConsent: true });
    await call('a', '/me/profile', 'PUT', { aiProcessingConsent: false });
    await call('a', '/me/profile', 'PUT', { personalizationConsent: false });
    await call('a', '/me/profile', 'PUT', { personalizationConsent: true });
    assert.equal(await db.consentEvent.count({ where: { userId: a.id } }), 5);
    assert.equal(await db.consentEvent.count({ where: { userId: b.id } }), 0);
    const invalid = await call('a', '/me/profile', 'PUT', { aiProcessingConsent: 'yes' });
    assert.equal(invalid.status, 400);
    assert.equal(await db.consentEvent.count({ where: { userId: a.id } }), 5);
    await call('b', '/me/profile', 'PUT', { personalizationConsent: true, learningGoals: ['Learn about Jesus'] });
    let response = await call('a', '/me/suggestions');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(response.json.suggestions.some(s => s.id === 'plan:discover-jesus'));
    const dismiss = () => call('a', '/me/suggestions/plan%3Adiscover-jesus/dismiss', 'POST');
    const dismissed = await Promise.all(Array.from({ length: 12 }, dismiss));
    assert.deepEqual(dismissed.map(r => r.status), Array(12).fill(200), JSON.stringify(dismissed.map(r => ({ status: r.status, body: r.json }))));
    assert.equal(await db.suggestionDismissal.count({ where: { userId: a.id } }), 1);
    response = await call('a', '/me/suggestions');
    assert.equal(response.json.suggestions.length, 0);
    assert.ok((await call('b', '/me/suggestions')).json.suggestions.some(s => s.id === 'plan:discover-jesus'));
    assert.equal((await call('a', '/me/suggestions/plan%3Ainvented/dismiss', 'POST')).status, 400);
    assert.equal((await call('invalid', '/me/suggestions/prayer-journal/dismiss', 'POST')).status, 401);
    const exported = (await call('a', '/me/account/export')).json;
    assert.equal(exported.consentHistory.length, 5);
    assert.deepEqual(exported.hiddenSuggestions.map(s => s.suggestion), ['plan:discover-jesus']);
    // A failed audit insert must roll back its preference write.
    const { saveProfile } = require('../dist/account/profile-consent');
    const failing = { $transaction: run => db.$transaction(tx => run(new Proxy(tx, { get(target, key) { return key === 'consentEvent' ? { createMany: async () => { throw new Error('synthetic audit failure'); } } : target[key]; } }))) };
    await assert.rejects(saveProfile(failing, a.id, { aiProcessingConsent: true }), /synthetic audit failure/);
    assert.equal((await db.faithProfile.findUniqueOrThrow({ where: { userId: a.id } })).aiProcessingConsent, false);
    await db.user.delete({ where: { id: a.id } });
    assert.equal(await db.consentEvent.count({ where: { userId: a.id } }), 0);
    assert.equal(await db.suggestionDismissal.count({ where: { userId: a.id } }), 0);
    assert.equal(await db.consentEvent.count({ where: { userId: b.id } }), 1);
  } finally {
    await app.close();
    await db.user.deleteMany({ where: { oidcSubject: { startsWith: prefix } } });
    await db.$disconnect(); Module._load = original;
  }
});
