const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { SchemaGuard, bundledMigrations } = require('../dist/health/schema-guard');

const db = (names, fail = false) => {
  const calls = { n: 0 };
  return { calls, $queryRaw: async () => { calls.n++; if (fail) throw Object.assign(new Error('connection refused'), { name: 'PrismaClientInitializationError' }); return names.map(migration_name => ({ migration_name })); } };
};

test('the build ships every migration folder, in order', () => {
  const names = bundledMigrations();
  assert.ok(names.length >= 13);
  assert.deepEqual(names, [...names].sort());
  assert.ok(names.includes('20261019190000_livingword_editorial'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-'));
  fs.mkdirSync(path.join(tmp, '20260101000000_a')); fs.writeFileSync(path.join(tmp, '20260101000000_a', 'migration.sql'), '');
  fs.mkdirSync(path.join(tmp, 'not-a-migration'));
  fs.writeFileSync(path.join(tmp, 'migration_lock.toml'), '');
  try { assert.deepEqual(bundledMigrations(tmp), ['20260101000000_a']); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('current when every bundled migration is applied; extra database migrations are fine', async () => {
  assert.deepEqual(await new SchemaGuard(db(['a', 'b', 'c']), ['a', 'b']).state(), { state: 'current' });
});

test('behind reports only a count when the database lacks a bundled migration', async () => {
  const state = await new SchemaGuard(db(['a']), ['a', 'b', 'c']).state();
  assert.deepEqual(state, { state: 'behind', pending: 2 });
});

test('a database error fails readiness instead of silently accepting a deploy', async () => {
  assert.deepEqual(await new SchemaGuard(db([], true), ['a']).state(), { state: 'unavailable' });
});

test('results are cached, and SCHEMA_GUARD=off disables the check', async () => {
  const d = db(['a']); const guard = new SchemaGuard(d, ['a', 'b'], 30_000);
  await guard.state(1_000); await guard.state(20_000);
  assert.equal(d.calls.n, 1);
  await guard.state(40_000);
  assert.equal(d.calls.n, 2);
  process.env.SCHEMA_GUARD = 'off';
  try { assert.deepEqual(await new SchemaGuard(db([]), ['a']).state(), { state: 'unchecked' }); } finally { delete process.env.SCHEMA_GUARD; }
});

test('a missing migration bundle fails readiness', async () => {
  assert.deepEqual(await new SchemaGuard(db([]), []).state(), { state: 'unavailable' });
});
