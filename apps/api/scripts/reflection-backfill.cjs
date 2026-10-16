// Dry-run by default. Applies only to disposable loopback restores, never Supabase.
const { PrismaClient } = require('@prisma/client');
const { encryptReflection, decryptReflection } = require('../dist/security/reflection-crypto');
const apply = process.argv.includes('--apply');
let db;
async function scan(model, field, context) {
  let cursor; const stats = { scanned: 0, legacy: 0, encrypted: 0, updated: 0, conflicts: 0 };
  for (;;) {
    const rows = await db[model].findMany({ take: 100, orderBy: { id: 'asc' }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), ...(model === 'dailyWordReflection' ? { include: { session: { select: { userId: true } } } } : {}) });
    if (!rows.length) break;
    for (const row of rows) {
      stats.scanned++;
      if (row[field].startsWith('lbenc:v1:')) { decryptReflection(row[field], context(row)); stats.encrypted++; continue; }
      stats.legacy++;
      if (apply) {
        const result = await db[model].updateMany({ where: { id: row.id, [field]: row[field] }, data: { [field]: encryptReflection(row[field], context(row)) } });
        if (result.count) stats.updated++; else stats.conflicts++;
      }
    }
    cursor = rows[rows.length - 1].id;
  }
  return stats;
}
(async () => {
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error('Provide an explicit database URL');
  const url = new URL(raw);
  if (apply && (url.hostname !== '127.0.0.1' || url.pathname !== '/lifebook_restore')) throw new Error('Apply is restricted to the isolated loopback lifebook_restore database');
  encryptReflection('backfill preflight', 'preflight');
  db = new PrismaClient({ datasources: { db: { url: raw } } });
  const meditations = await scan('meditationReflection', 'text', row => `meditation:${row.userId}:${row.meditationId}`);
  const dailyWord = await scan('dailyWordReflection', 'content', row => `daily-word:${row.session.userId}:${row.sessionId}`);
  console.log(JSON.stringify({ mode: apply ? 'local-apply' : 'dry-run', meditations, dailyWord }));
  if (meditations.conflicts || dailyWord.conflicts) process.exitCode = 1;
})().catch(() => { console.error('Backfill stopped. Check target/key configuration and retained keys; no private values were logged.'); process.exitCode = 1; }).finally(() => db?.$disconnect());
