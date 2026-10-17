// Applies pastoral care retention. Dry run by default; prints counts only, never content.
//   node apps/api/scripts/care-purge.cjs --target local|staging|production [--apply] [--confirm-production <ref>]
// Run daily (for example from a scheduled job) once the pilot is live.
const path = require('node:path');
const { apiRoot, configureTarget, parseOptions } = require('./lib/target.cjs');

async function main() {
  const options = parseOptions(process.argv.slice(2), ['apply']);
  const { url, label } = configureTarget(options);
  const { PrismaClient } = require('@prisma/client');
  const { purgeCare } = require(path.join(apiRoot, 'dist/care/care-purge'));
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    console.error(`Target: ${label}${options.apply ? '' : ' (dry run: nothing is changed)'}`);
    console.log(JSON.stringify(await purgeCare(db, { apply: options.apply === true }), null, 2));
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error(`care-purge: ${error.message}`); process.exitCode = 1; });
