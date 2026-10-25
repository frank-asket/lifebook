const { test } = require('node:test');
const assert = require('node:assert/strict');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
test('HTTP API denies unauthenticated private access, rejects invalid input and throttles spoofed IPs', { skip: !url }, async () => {
  for (const raw of [url, process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const target = new URL(raw); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  }
  process.env.API_RATE_LIMIT = '3';
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../dist/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.getHttpAdapter().getInstance().set('trust proxy', false);
  await app.listen(0, '127.0.0.1');
  try {
    const base = await app.getUrl();
    const { database } = require('../dist/common/database');
    const query = database.$queryRaw;
    try {
      database.$queryRaw = async () => { throw new Error('Synthetic database outage'); };
      const readiness = await fetch(`${base}/api/v1/health`);
      assert.equal(readiness.status, 503, 'an unverified schema cannot report production readiness');
      assert.equal((await readiness.json()).status, 'schema-unavailable');
    } finally { database.$queryRaw = query; }
    for (const path of ['me/profile','paths/fixture/state','livingword/editor','bible-reading/history','bible-annotations','bible-annotations/passage?locale=fr&passageId=LUK.1.1','daily-word/sessions','daily-word/sessions/fixture','meditations/history','prayers','care/requests','care/pastor/queue','safeguarding/overview']) {
      const response = await fetch(`${base}/api/v1/${path}`);
      assert.equal(response.status, 401, path);
    }
    for (const [path, method] of [['me/suggestions/prayer-journal/dismiss', 'POST'], ['paths/fixture/enroll', 'POST'], ['paths/fixture/lessons/fixture/complete', 'PUT']]) {
      const response = await fetch(`${base}/api/v1/${path}`, { method });
      assert.equal(response.status, 401, path);
    }
    const invalid = await fetch(`${base}/api/v1/bible-reading/history`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: 'invalid', chapterId: '../secret', userId: 'other-user' }) });
    assert.equal(invalid.status, 400);
    const eraseReflection = await fetch(`${base}/api/v1/daily-word/sessions/fixture/reflection`, { method: 'DELETE' });
    assert.equal(eraseReflection.status, 401);
    const eraseMeditation = await fetch(`${base}/api/v1/meditations/fixture/reflection`, { method: 'DELETE' });
    assert.equal(eraseMeditation.status, 401);
    for (let i = 0; i < 4; i++) {
      const response = await fetch(`${base}/api/v1/bible-reading/plans`, { headers: { 'X-Forwarded-For': `203.0.113.${i+1}` } });
      assert.equal(response.status, i < 3 ? 200 : 429);
    }
  } finally { await app.close(); }
});
