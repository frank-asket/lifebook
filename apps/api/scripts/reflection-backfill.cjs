// Encrypts Daily Word and meditation reflections still stored as plain text. Dry run by default; prints counts only, never content.
//   pnpm --filter @lifebook/api build
//   node apps/api/scripts/reflection-backfill.cjs --target local|staging|production [--apply] [--confirm-production <ref>]
// Production needs the key ring the API uses: export REFLECTION_ENCRYPTION_KEYS and REFLECTION_ENCRYPTION_ACTIVE_KEY
// from Render into this shell first (never paste them in chat or commit them). Follow docs/M3.8_REFLECTION_BACKFILL.md.
const fs = require('node:fs');
const path = require('node:path');
const { apiRoot, repoRoot, configureTarget, parseOptions } = require('./lib/target.cjs');

const PREFIX = 'lbenc:v1:';
const SOURCES = [
  { name: 'meditations', model: 'meditationReflection', field: 'text', context: row => `meditation:${row.userId}:${row.meditationId}` },
  { name: 'dailyWord', model: 'dailyWordReflection', field: 'content', include: { session: { select: { userId: true } } }, context: row => `daily-word:${row.session.userId}:${row.sessionId}` },
];
const fail = message => { const error = new Error(message); error.safe = true; return error; };

function ring() {
  try { return JSON.parse(process.env.REFLECTION_ENCRYPTION_KEYS || 'null'); } catch { return null; }
}
/** Production must never run with the staging keys: anything written would be unreadable by the production API. */
function refuseStagingKeys() {
  const file = path.join(repoRoot, '.env.staging');
  if (!fs.existsSync(file)) return;
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find(l => l.startsWith('REFLECTION_ENCRYPTION_KEYS='));
  let staging = {};
  try { staging = JSON.parse(line.slice(line.indexOf('=') + 1).replace(/^(['"])(.*)\1$/, '$2')); } catch { return; }
  const shared = Object.values(ring() || {}).some(key => Object.values(staging).includes(key));
  if (shared) throw fail('These are the staging keys. Export the production keys from Render.');
}

async function* rows(db, source) {
  let cursor;
  for (;;) {
    const page = await db[source.model].findMany({ take: 200, orderBy: { id: 'asc' }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), ...(source.include ? { include: source.include } : {}) });
    if (!page.length) return;
    yield* page;
    cursor = page[page.length - 1].id;
  }
}

/** Counts rows, and with keys proves every existing ciphertext opens with this key ring. Keeps only the ids of legacy rows. */
async function survey(db, source, crypto) {
  const stats = { scanned: 0, legacy: 0, encrypted: 0, encryptedChecked: 0, encryptedUnreadable: 0 };
  const legacy = [];
  for await (const row of rows(db, source)) {
    stats.scanned++;
    if (!row[source.field].startsWith(PREFIX)) { stats.legacy++; legacy.push(row.id); continue; }
    stats.encrypted++;
    if (!crypto) continue;
    try { crypto.decryptReflection(row[source.field], source.context(row)); stats.encryptedChecked++; } catch { stats.encryptedUnreadable++; }
  }
  return { stats, legacy };
}

/** Encrypts one row only if it is unchanged, then reads it back and decrypts it. Puts the original back if that fails. */
async function encryptRow(db, source, id, crypto) {
  const row = await db[source.model].findUnique({ where: { id }, ...(source.include ? { include: source.include } : {}) });
  if (!row || row[source.field].startsWith(PREFIX)) return 'skipped';
  const original = row[source.field];
  const sealed = crypto.encryptReflection(original, source.context(row));
  const { count } = await db[source.model].updateMany({ where: { id, [source.field]: original }, data: { [source.field]: sealed } });
  if (!count) return 'conflict';
  const stored = await db[source.model].findUnique({ where: { id }, ...(source.include ? { include: source.include } : {}) });
  let ok = false;
  try { ok = stored[source.field] === sealed && crypto.decryptReflection(stored[source.field], source.context(stored)) === original; } catch {}
  if (ok) return 'updated';
  await db[source.model].updateMany({ where: { id, [source.field]: sealed }, data: { [source.field]: original } });
  throw fail('A row did not read back correctly; it was restored and the run stopped.');
}

async function main() {
  let options, url, label;
  try {
    options = parseOptions(process.argv.slice(2), ['apply', 'no-existing-ciphertext']);
    ({ url, label } = configureTarget(options));
  } catch (error) { throw fail(error.message); }
  const apply = options.apply === true;
  const production = options.target === 'production';
  const keys = ring();
  if (production && keys) refuseStagingKeys();
  if (apply && !keys) throw fail('Applying needs REFLECTION_ENCRYPTION_KEYS and REFLECTION_ENCRYPTION_ACTIVE_KEY in the environment.');
  const crypto = keys ? require(path.join(apiRoot, 'dist/security/reflection-crypto')) : null;
  if (crypto) {
    try { crypto.decryptReflection(crypto.encryptReflection('preflight', 'preflight'), 'preflight'); } catch { throw fail('The key ring is invalid or the active key is missing from it.'); }
  }

  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    console.error(`Target: ${label}${apply ? '' : ' (dry run: nothing is changed)'}${crypto ? '' : ' · no keys: counts only'}`);
    const report = { mode: apply ? 'apply' : 'dry-run', activeKey: crypto ? process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY : null };
    const surveys = {};
    for (const source of SOURCES) { surveys[source.name] = await survey(db, source, crypto); report[source.name] = surveys[source.name].stats; }

    const all = Object.values(surveys).map(s => s.stats);
    const unreadable = all.reduce((n, s) => n + s.encryptedUnreadable, 0);
    const checked = all.reduce((n, s) => n + s.encryptedChecked, 0);
    report.keyRing = !crypto ? 'not checked' : unreadable ? 'MISMATCH' : checked ? `matches ${checked} existing encrypted reflections` : 'no existing encrypted reflections to compare';
    if (apply) {
      if (unreadable) throw fail(`${unreadable} existing encrypted reflections do not open with these keys. Nothing was changed.`);
      if (production && !checked && !options['no-existing-ciphertext']) throw fail('No existing encrypted reflection proves these keys match the API. Nothing was changed. See the runbook before using --no-existing-ciphertext.');
      for (const source of SOURCES) {
        const result = { updated: 0, conflicts: 0, skipped: 0 };
        for (const id of surveys[source.name].legacy) {
          const outcome = await encryptRow(db, source, id, crypto);
          result[outcome === 'conflict' ? 'conflicts' : outcome]++;
        }
        Object.assign(report[source.name], result);
        const after = await survey(db, source, crypto);
        report[source.name].legacyAfter = after.stats.legacy;
        report[source.name].unreadableAfter = after.stats.encryptedUnreadable;
      }
    }
    console.log(JSON.stringify(report, null, 2));
    const leftovers = SOURCES.some(s => report[s.name].conflicts || report[s.name].legacyAfter || report[s.name].unreadableAfter);
    if (unreadable || leftovers) process.exitCode = 1;
  } finally { await db.$disconnect(); }
}

// Errors from Prisma or crypto can quote values, so only our own messages are printed.
main().catch(error => { console.error(`reflection-backfill: ${error.safe ? error.message : 'stopped. Check the target and keys; no private values were logged.'}`); process.exitCode = 1; });
