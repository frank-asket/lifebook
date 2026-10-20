// Private text never reaches the logs. Boots the real app with Nest logging on, captures every log line and every
// write to stdout/stderr, runs the private-text flows (including bad input and edge cases) with a secret marker,
// and asserts the marker never appears. Clerk is a test double; runs only on the loopback test database.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { randomBytes } = require('node:crypto');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
const TOKENS = { 'log-a': 'log-member-a' };

test('prayer, reflection, note and care text never appears in the logs', { skip: !url, timeout: 120000 }, async () => {
  for (const raw of [url, process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const target = new URL(raw); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  }
  Object.assign(process.env, {
    API_RATE_LIMIT: '10000', CLERK_SECRET_KEY: 'sk_test_logs', OPENAI_API_KEY: '',
    REFLECTION_ENCRYPTION_KEYS: JSON.stringify({ lg: randomBytes(32).toString('hex') }), REFLECTION_ENCRYPTION_ACTIVE_KEY: 'lg',
    BIBLE_NOTES_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
  });
  const load = Module._load;
  Module._load = function (request, ...rest) {
    const real = load.call(this, request, ...rest);
    return request === '@clerk/backend' ? { ...real, verifyToken: async token => { if (!TOKENS[token]) throw new Error('invalid'); return { sub: TOKENS[token] }; } } : real;
  };

  // Everything the process writes, plus every Nest log call, at every level.
  const captured = [];
  const capture = stream => { const write = stream.write.bind(stream); stream.write = (chunk, ...rest) => { captured.push(String(chunk)); return write(chunk, ...rest); }; return () => { stream.write = write; }; };
  const restoreOut = capture(process.stdout); const restoreErr = capture(process.stderr);
  const logger = Object.fromEntries(['log', 'error', 'warn', 'debug', 'verbose', 'fatal'].map(level => [level, (...args) => captured.push(args.map(a => a instanceof Error ? `${a.message}\n${a.stack}` : typeof a === 'string' ? a : JSON.stringify(a)).join(' '))]));

  const { PrismaClient } = require('@prisma/client');
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../dist/app.module');
  const db = new PrismaClient({ datasources: { db: { url } } });
  const run = randomBytes(4).toString('hex');
  const MARK = `PRIVATE-${run}`;
  const meditation = await db.meditation.create({ data: { slug: `lg-${run}`, title: 'Fixture', scriptureReference: 'JHN.1', explanation: 'x', questions: [], guidedPrayer: 'x', isPublished: true } });
  const app = await NestFactory.create(AppModule, { logger });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  const base = (await app.getUrl()) + '/api/v1';
  const call = async (method, route, body, raw) => {
    const res = await fetch(base + route, { method, headers: { Authorization: 'Bearer log-a', 'Content-Type': 'application/json' }, ...(raw !== undefined ? { body: raw } : body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, text: await res.text() };
  };
  try {
    await call('GET', '/me/profile');
    // Normal flows with private text.
    const prayer = JSON.parse((await call('POST', '/prayers', { title: `${MARK} title`, body: `${MARK} body` })).text);
    await call('PUT', `/prayers/${prayer.id}`, { body: `${MARK} edited` });
    await call('PUT', `/prayers/${prayer.id}/answer`, { answered: true, note: `${MARK} answer` });
    await call('POST', `/prayers/${prayer.id}/meditation`, { consent: true, locale: 'en' }); // no AI key: must fail without logging the prayer
    await call('PUT', '/bible-annotations', { passageId: 'JHN.1.1', locale: 'en', note: `${MARK} note` });
    const session = JSON.parse((await call('POST', '/daily-word/sessions/today', { timezone: 'UTC' })).text);
    await call('PUT', `/daily-word/sessions/${session.id}/reflection`, { content: `${MARK} reflection` });
    await call('PUT', `/meditations/${meditation.id}/reflection`, { text: `${MARK} meditation` });
    const care = JSON.parse((await call('POST', '/care/requests', { topic: 'grief', language: 'en', contactPreference: 'callback', name: `${MARK} name`, phone: '+233200000000', message: `${MARK} care`, consent: true })).text);
    await call('POST', `/care/requests/${care.id}/messages`, { text: `${MARK} reply` });
    await call('POST', `/care/requests/${care.id}/report`, { category: 'other', details: `${MARK} report`, shareConversation: true });
    await call('GET', '/me/account/export');
    // Bad input carrying private text: too long, wrong types, malformed JSON, invalid ids, NUL bytes.
    await call('POST', '/prayers', { body: `${MARK} `.repeat(2000) });
    await call('POST', '/prayers', { body: { nested: MARK } });
    await call('PUT', `/daily-word/sessions/${session.id}/reflection`, { content: `${MARK}`.repeat(1000), extra: MARK });
    await call('POST', '/prayers', undefined, `{"body": "${MARK} unterminated`);
    await call('PUT', `/prayers/${MARK}`, { body: `${MARK} into nowhere` });
    await call('POST', '/prayers', { body: `${MARK} \u0000 nul` });
    await call('POST', '/care/requests', { topic: 'grief', language: 'en', contactPreference: 'callback', phone: `${MARK}`, message: `${MARK}`, consent: true });
    await call('PUT', '/bible-annotations', { passageId: `${MARK}`, locale: 'en', note: `${MARK}` });
    await new Promise(r => setTimeout(r, 200));
  } finally {
    await app.close();
    restoreOut(); restoreErr();
    await db.user.deleteMany({ where: { oidcSubject: { in: Object.values(TOKENS) } } });
    await db.meditation.deleteMany({ where: { slug: `lg-${run}` } });
    await db.$disconnect();
  }
  const leaks = captured.filter(line => line.includes(MARK)).map(line => line.slice(0, 300));
  assert.ok(captured.length > 0, 'the logger captured something, so the check is live');
  assert.deepEqual(leaks, [], 'private text appeared in the logs');
});
