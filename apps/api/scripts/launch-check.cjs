// M3.8 launch readiness, measured. Read-only: public URLs and files in this repo; no secrets, no database, no sign-in.
//   pnpm --filter @lifebook/api build
//   node apps/api/scripts/launch-check.cjs [--date YYYY-MM-DD] [--json] [--api <url>] [--web <url>] [--marketing <url>]
// Exit code 1 while any automated gate is open. Manual gates are listed so nothing is forgotten.
const fs = require('node:fs');
const path = require('node:path');
const { apiRoot, repoRoot, parseOptions } = require('./lib/target.cjs');

const options = parseOptions(process.argv.slice(2), ['json']);
const API = (options.api || 'https://lifebook-yhbx.onrender.com').replace(/\/+$/, '') + '/api/v1';
const WEB = (options.web || 'https://lifebook-inky.vercel.app').replace(/\/+$/, '');
const MARKETING = (options.marketing || 'https://lifebook-marketing.vercel.app').replace(/\/+$/, '');

const { get, json, validDate, validDailyWord, approvedLegalPage, verifiedContacts, reviewedDays, contentState } = require('./lib/launch-readiness.cjs');
const checkedDate = new Date().toISOString().slice(0, 10);
const launchDate = options.date || checkedDate;
if (!validDate(launchDate)) throw new Error('--date must be a real YYYY-MM-DD calendar date');

const gates = [
  { id: 'api', title: 'Production API is up', check: async () => { const r = await get(`${API}/health`); return [r.status === 200, `health ${r.status}${r.attempts > 1 ? ' (required retry)' : ''}`]; } },
  { id: 'web', title: 'Web app and marketing site respond', check: async () => {
    const [w, m] = await Promise.all([get(WEB), get(MARKETING)]);
    return [w.status === 200 && m.status === 200, `web ${w.status}, marketing ${m.status}`];
  } },
  { id: 'scripture', title: 'Daily Word quotes the published translations', check: async () => {
    const [en, fr] = await Promise.all(['en', 'fr'].map(locale => get(`${API}/meditations/daily-word/today?locale=${locale}`)));
    const ok = validDailyWord(en, 'en') && validDailyWord(fr, 'fr');
    return [ok, `en: ${json(en.body)?.verse?.translation ?? '?'} · fr: ${json(fr.body)?.verse?.translation ?? '?'}`];
  } },
  { id: 'clerk', title: 'Sign-in uses Clerk production keys', owner: 'Product owner', check: async () => {
    const r = await get(`${WEB}/sign-in`);
    const key = r.body.match(/pk_(live|test)_/)?.[1];
    return [r.status === 200 && key === 'live', key ? `publishable key is pk_${key}_…` : 'no Clerk key found on /sign-in'];
  } },
  { id: 'privacy', title: 'Approved privacy and terms published in English and French', owner: 'Product owner + adviser', check: async () => {
    const paths = ['/privacy', '/terms', '/fr/privacy', '/fr/terms'];
    const responses = await Promise.all(paths.map(async pathname => ({ pathname, response: await get(`${MARKETING}${pathname}`) })));
    const pending = responses.filter(({ response }) => !approvedLegalPage(response));
    return [pending.length === 0, pending.length ? `not approved or unavailable: ${pending.map(({ pathname }) => pathname).join(', ')}` : 'all four legal pages explicitly marked approved'];
  } },
  { id: 'companion', title: 'Prayer topic library reviewed and live', owner: 'Pastoral reviewer', check: async () => {
    const lib = json(fs.readFileSync(path.join(apiRoot, 'content/prayer-topics.json'), 'utf8'));
    const r = await get(`${API}/prayer-companion/topics?locale=en`);
    const published = json(r.body);
    return [lib?.status === 'reviewed' && !!lib.review?.reviewedBy?.trim() && validDate(lib.review?.reviewedOn) && lib.review.reviewedOn <= checkedDate && r.status === 200 && published?.reviewed === true && Array.isArray(published?.topics) && published.topics.length > 0, `library ${lib?.status}, production endpoint ${r.status}`];
  } },
  { id: 'crisis', title: 'Crisis numbers verified locally', owner: 'Reviewer per country', check: async () => {
    const doc = fs.readFileSync(path.join(repoRoot, 'docs/M3.7_CRISIS_CONTACTS_DRAFT.md'), 'utf8');
    const verified = verifiedContacts(doc, checkedDate);
    return [verified, verified ? 'named local reviewer and verification date recorded' : 'explicit VERIFIED status, named reviewer and real verification date still required'];
  } },
  { id: 'daily-word', title: 'Reviewed Daily Word coverage for the first 30 launch days', owner: 'Product owner / pastoral reviewer', check: async () => {
    const { validateDailyWordLibrary } = require(path.join(apiRoot, 'dist/meditation/daily-word-library'));
    const result = reviewedDays(validateDailyWordLibrary(json(fs.readFileSync(path.join(apiRoot, 'content/daily-word-library.json'), 'utf8'))), launchDate);
    return [!result.missing.length, `${result.reviewed}/${result.total} reviewed from ${launchDate}${result.missing.length ? `; first missing: ${result.missing.slice(0, 5).join(', ')}` : ''}`];
  } },
  { id: 'pastors', title: 'Pastors registered for the care pilot', owner: 'Product owner + engineering', check: async () => {
    const r = await get(`${API}/pastors`); const list = json(r.body);
    return [r.status === 200 && Array.isArray(list) && list.length > 0, Array.isArray(list) ? `${list.length} listed` : `status ${r.status}`];
  } },
];

const manual = [
  ['Every feature included in the beta has approved, usable content and completed detail/playback acceptance; explicitly record excluded empty libraries', 'Engineering + pastoral reviewer'],
  ['Production Clerk identity transition rehearsed without orphaning existing LifeBook data; matching web/API keys and allowed origins', 'Engineering + product owner'],
  ['Invite-only access enabled on the production Clerk instance; no invitations sent until approvals pass', 'Product owner'],
  ['Scripture rights and AI-provider retention terms confirmed for the enabled features', 'Product owner'],
  ['Hosting/domain plan confirmed, monitoring and rollback owner assigned, support inbox checked', 'Product owner'],
  ['Account export and deletion verified with dedicated synthetic production accounts', 'Engineering'],
  ['Legacy reflections: fresh count, recoverable backup, rehearsal and named approval before encryption; previous pause remains respected', 'Engineering + product owner'],
  ['Care retention setting and successful purge logs verified; do not enable destructive runs without approval', 'Engineering + product owner'],
  ['Signed-in production smoke test passed on the deployed candidate (docs/M3.8_SMOKE_TEST.md)', 'Engineering'],
  ['Web on physical iPhone/Android: browser, large text, VoiceOver/TalkBack and second-account isolation; native-store acceptance tracked separately', 'Engineering + tester'],
];

(async () => {
  // Availability is separate from approval and the nine launch gates; a working empty API is not a finished library.
  const content = ['en', 'fr'].flatMap(locale => [
    { feature: 'Published meditation', route: 'meditations/today', kind: 'meditation', locale },
    { feature: 'Bible Study', route: 'bible-studies', kind: 'collection', locale },
    { feature: 'LivingWord', route: 'livingword', kind: 'teachings', locale },
  ]);
  content.push({ feature: 'Learning paths', route: 'paths', kind: 'collection', locale: 'shared' });
  const contentAvailability = Promise.all(content.map(async ({ feature, route, kind, locale }) => {
    const response = await get(`${API}/${route}${locale === 'shared' ? '' : `?locale=${locale}`}`);
    return { feature, locale, status: response.status, ...contentState(response, kind) };
  }));
  const results = await Promise.all(gates.map(async gate => {
    try { const [passed, detail] = await gate.check(); return { id: gate.id, title: gate.title, owner: gate.owner || 'Engineering', passed, detail }; }
    catch { return { id: gate.id, title: gate.title, owner: gate.owner || 'Engineering', passed: false, detail: 'check failed; inspect the source/configuration locally' }; }
  }));
  const passed = results.filter(gate => gate.passed).length;
  const report = { checkedAt: new Date().toISOString(), launchDate, automatedReady: passed === gates.length, passed, total: gates.length, gates: results, contentAvailability: await contentAvailability, manualGatesToConfirm: manual.map(([title, owner]) => ({ title, owner })) };
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`LifeBook M3.8 web launch check · ${report.checkedAt} · launch date ${launchDate}\n`);
    for (const gate of results) console.log(`${gate.passed ? '✔' : '✘'} ${gate.title}${gate.passed ? '' : `  [${gate.owner}]`}\n    ${gate.detail}`);
    console.log('\nPublished content availability (does not prove approval, playback or feature completion):');
    for (const item of report.contentAvailability) console.log(`  • ${item.feature} [${item.locale}]: ${item.state}${item.count === null ? '' : ` (${item.count})`} · HTTP ${item.status}`);
    console.log('\nManual gates (record evidence in docs/M3.8_WEB_BETA_ACCEPTANCE.md):');
    for (const [title, owner] of manual) console.log(`  • ${title}  [${owner}]`);
    console.log(`\n${passed} of ${gates.length} automated gates pass; ${manual.length} manual gates still require evidence. Automated success alone does not authorize launch.`);
  }
  process.exitCode = report.automatedReady ? 0 : 1;
})();
