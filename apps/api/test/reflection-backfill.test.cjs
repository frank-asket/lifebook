const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const url = process.env.LIFEBOOK_M36_TEST_DATABASE_URL;
const script = path.resolve(__dirname, '../scripts/reflection-backfill.cjs');

test('backfill exits unsuccessfully when its final scan finds new plaintext', async () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  let reads = 0;
  let report;
  const fakeProcess = { argv: [], env: { REFLECTION_ENCRYPTION_KEYS: '{"test":"fixture"}' } };
  const db = {
    meditationReflection: { findMany: async () => ++reads === 2 ? [{ id: 'late', text: 'New legacy row' }] : [] },
    dailyWordReflection: { findMany: async () => [] },
    $disconnect: async () => {},
  };
  const crypto = { encryptReflection: value => value, decryptReflection: value => value };
  await vm.runInNewContext(fs.readFileSync(script, 'utf8'), {
    process: fakeProcess,
    console: { error() {}, log(value) { report = JSON.parse(value); } },
    require(name) {
      if (name === './lib/target.cjs') return { apiRoot: '/fixture', parseOptions: () => ({ target: 'local', apply: true }), configureTarget: () => ({ url: 'fixture', label: 'local' }) };
      if (name === '@prisma/client') return { PrismaClient: function () { return db; } };
      if (name.endsWith('reflection-crypto')) return crypto;
      return require(name);
    },
  });
  assert.equal(report.meditations.legacyAfter, 1);
  assert.equal(report.meditations.conflicts, 0);
  assert.equal(report.meditations.unreadableAfter, 0);
  assert.equal(fakeProcess.exitCode, 1);
});

test('reflection backfill: dry run first, refuses wrong keys, verifies every row and is idempotent', { skip: !url }, async () => {
  const target = new URL(url); assert.equal(target.hostname, '127.0.0.1'); assert.equal(target.pathname, '/lifebook_restore');
  const ring = { test: randomBytes(32).toString('hex') };
  const keys = { REFLECTION_ENCRYPTION_KEYS: JSON.stringify(ring), REFLECTION_ENCRYPTION_ACTIVE_KEY: 'test' };
  const base = { ...process.env, DATABASE_URL: url, REFLECTION_ENCRYPTION_KEYS: '', REFLECTION_ENCRYPTION_ACTIVE_KEY: '' };
  const run = (env, ...args) => { const r = spawnSync(process.execPath, [script, ...args], { env: { ...base, ...env }, encoding: 'utf8' }); return { code: r.status, out: r.stdout ? JSON.parse(r.stdout) : null, err: r.stderr }; };
  Object.assign(process.env, keys);
  const { encryptReflection, decryptReflection } = require('../dist/security/reflection-crypto');

  const db = new PrismaClient({ datasources: { db: { url } } }); let user, meditation;
  try {
    user = await db.user.create({ data: { oidcSubject: `backfill-test-${Date.now()}` } });
    meditation = await db.meditation.create({ data: { slug: user.id, title: 'Fixture', scriptureReference: 'LUK.1', explanation: 'Fixture', questions: [], guidedPrayer: 'Fixture' } });
    const legacy = await db.meditationReflection.create({ data: { userId: user.id, meditationId: meditation.id, text: 'Legacy synthetic meditation' } });
    const session = await db.dailyWordSession.create({ data: { userId: user.id, journeyDate: new Date('2026-01-01'), passageKey: 'LUK.1' } });
    const daily = await db.dailyWordReflection.create({ data: { sessionId: session.id, content: 'Legacy synthetic Daily Word' } });
    const meditation2 = await db.meditation.create({ data: { slug: `${user.id}-2`, title: 'Fixture', scriptureReference: 'LUK.2', explanation: 'Fixture', questions: [], guidedPrayer: 'Fixture' } });
    const existing = await db.meditationReflection.create({ data: { userId: user.id, meditationId: meditation2.id, text: encryptReflection('Written by the API', `meditation:${user.id}:${meditation2.id}`) } });
    const textOf = async () => [(await db.meditationReflection.findUnique({ where: { id: legacy.id } })).text, (await db.dailyWordReflection.findUnique({ where: { id: daily.id } })).content];

    assert.equal(run(keys).code, 1, 'a target is required');
    const counts = run({}, '--target', 'local');
    assert.equal(counts.code, 0); assert.equal(counts.out.mode, 'dry-run'); assert.equal(counts.out.keyRing, 'not checked');
    assert.ok(counts.out.meditations.legacy >= 1 && counts.out.dailyWord.legacy >= 1);
    assert.match(run({}, '--target', 'local', '--apply').err, /needs REFLECTION_ENCRYPTION_KEYS/);

    const wrong = { REFLECTION_ENCRYPTION_KEYS: JSON.stringify({ test: randomBytes(32).toString('hex') }), REFLECTION_ENCRYPTION_ACTIVE_KEY: 'test' };
    const refused = run(wrong, '--target', 'local', '--apply');
    assert.equal(refused.code, 1); assert.match(refused.err, /do not open with these keys/);
    assert.deepEqual(await textOf(), ['Legacy synthetic meditation', 'Legacy synthetic Daily Word'], 'wrong keys change nothing');

    const dry = run(keys, '--target', 'local');
    assert.match(dry.out.keyRing, /^matches \d+ existing/); assert.deepEqual(await textOf(), ['Legacy synthetic meditation', 'Legacy synthetic Daily Word']);
    assert.doesNotMatch(dry.err + JSON.stringify(dry.out), /Legacy synthetic|Written by the API/, 'no content is printed');

    const applied = run(keys, '--target', 'local', '--apply');
    assert.equal(applied.code, 0, applied.err);
    assert.ok(applied.out.meditations.updated >= 1 && applied.out.dailyWord.updated >= 1);
    for (const name of ['meditations', 'dailyWord']) { assert.equal(applied.out[name].legacyAfter, 0); assert.equal(applied.out[name].unreadableAfter, 0); assert.equal(applied.out[name].conflicts, 0); }
    const [m, d] = await textOf();
    assert.ok(m.startsWith('lbenc:v1:test:') && d.startsWith('lbenc:v1:test:'));
    assert.equal(decryptReflection(m, `meditation:${user.id}:${meditation.id}`), 'Legacy synthetic meditation');
    assert.equal(decryptReflection(d, `daily-word:${user.id}:${session.id}`), 'Legacy synthetic Daily Word');
    assert.equal((await db.meditationReflection.findUnique({ where: { id: existing.id } })).text, existing.text, 'existing ciphertext untouched');

    const again = run(keys, '--target', 'local', '--apply');
    assert.equal(again.out.meditations.updated, 0); assert.equal(again.out.dailyWord.updated, 0);
  } finally {
    if (user) await db.user.deleteMany({ where: { id: user.id } });
    if (meditation) await db.meditation.deleteMany({ where: { slug: { startsWith: user.id } } });
    await db.$disconnect();
  }
});
