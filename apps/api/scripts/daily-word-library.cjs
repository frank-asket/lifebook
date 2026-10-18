// Daily Word library tool for writers and reviewers. Read-only: never edits the library or touches a database.
//   pnpm --filter @lifebook/api build
//   node apps/api/scripts/daily-word-library.cjs --check                 validate, coverage, the next 14 days
//   node apps/api/scripts/daily-word-library.cjs --verify-passages       every passage resolves in KJV and Darby
//   node apps/api/scripts/daily-word-library.cjs --template 11-01 --to 11-07  blank entries for those days, to fill in
// --verify-passages reads API_BIBLE_KEY and the Bible ids from the environment or the gitignored .env.staging.
// Scripture text and keys are never printed; only references, so a reviewer can compare KJV and Darby numbering.
const fs = require('node:fs');
const path = require('node:path');
const { apiRoot, repoRoot, parseOptions } = require('./lib/target.cjs');

const file = path.join(apiRoot, 'content/daily-word-library.json');
const { validateDailyWordLibrary, entryFor, coverage } = require(path.join(apiRoot, 'dist/meditation/daily-word-library'));

function loadEnv() {
  const env = path.join(repoRoot, '.env.staging');
  if (!fs.existsSync(env)) return;
  for (const line of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(API_BIBLE_[A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

function days(from, to) {
  const out = [];
  const [fm, fd] = from.split('-').map(Number); const [tm, td] = to.split('-').map(Number);
  for (let t = Date.UTC(2024, fm - 1, fd); t <= Date.UTC(2024, tm - 1, td); t += 86400000) out.push(new Date(t).toISOString().slice(5, 10));
  return out;
}

async function main() {
  const options = parseOptions(process.argv.slice(2), ['check', 'verify-passages']);
  if (options.template) {
    const range = options.to ? days(options.template, options.to) : [options.template];
    const blank = { explanation: '', question: '', prayer: '', action: '' };
    const entries = range.map(md => ({ key: `D_${md.replace('-', '_')}`, passage: 'BOOK.C.V', date: md, en: blank, fr: blank, review: { status: 'draft', reviewedBy: null, reviewedOn: null, notes: '' } }));
    console.log(JSON.stringify(entries, null, 2));
    return;
  }
  const library = validateDailyWordLibrary(JSON.parse(fs.readFileSync(file, 'utf8')));
  console.log(`Library is valid: ${library.entries.length} entries.`);

  const c = coverage(library);
  console.log(`Dated entries: ${c.byStatus.reviewed} reviewed, ${c.byStatus.draft} draft, ${c.byStatus.legacy} legacy. ${c.missing.length} of 366 days still have no entry.`);
  const today = new Date();
  console.log('\nNext 14 days (production / with drafts):');
  for (let i = 0; i < 14; i++) {
    const iso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i)).toISOString().slice(0, 10);
    const live = entryFor(library, iso); const draft = entryFor(library, iso, true);
    console.log(`  ${iso}  ${live.key.padEnd(18)} ${live.passage.padEnd(14)}${draft.key !== live.key ? `  (draft: ${draft.key})` : ''}`);
  }

  if (options['verify-passages']) {
    loadEnv();
    process.env.API_BIBLE_FUMS = 'off';
    const { BibleContentService } = require(path.join(apiRoot, 'dist/bible-content/bible-content.service'));
    const bible = new BibleContentService();
    if (!bible.isConfigured('en') || !bible.isConfigured('fr')) throw new Error('Set API_BIBLE_KEY, API_BIBLE_EN_BIBLE_ID and API_BIBLE_FR_BIBLE_ID (or add them to .env.staging)');
    console.log('\nPassages (reference in each translation; compare the numbering):');
    let failed = 0;
    for (const e of library.entries) {
      const row = [];
      for (const [locale, id] of [['en', e.passage], ['fr', e.passageFr ?? e.passage]]) {
        try { row.push(`${locale}: ${(await bible.passage(locale, id)).reference}`); }
        catch (err) { failed++; row.push(`${locale}: FAILED ${id} (${err.message})`); }
      }
      console.log(`  ${e.key.padEnd(18)} ${row.join('   ')}`);
    }
    if (failed) { console.error(`\n${failed} passage lookup(s) failed.`); process.exitCode = 1; }
  }
}
main().catch(error => { console.error(`daily-word-library: ${error.message}`); process.exitCode = 1; });
