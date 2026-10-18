// M3.8 launch readiness, measured. Read-only: public URLs and files in this repo; no secrets, no database, no sign-in.
//   pnpm --filter @lifebook/api build
//   node apps/api/scripts/launch-check.cjs [--api <url>] [--web <url>] [--marketing <url>]
// Exit code 1 while any automated gate is open. Manual gates are listed so nothing is forgotten.
const fs = require('node:fs');
const path = require('node:path');
const { apiRoot, repoRoot, parseOptions } = require('./lib/target.cjs');

const options = parseOptions(process.argv.slice(2));
const API = (options.api || 'https://lifebook-yhbx.onrender.com').replace(/\/+$/, '') + '/api/v1';
const WEB = (options.web || 'https://lifebook-inky.vercel.app').replace(/\/+$/, '');
const MARKETING = (options.marketing || 'https://lifebook-marketing.vercel.app').replace(/\/+$/, '');

async function get(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'follow' });
    return { status: res.status, body: await res.text() };
  } catch (error) { return { status: 0, body: '', error: error.message }; }
}
const json = text => { try { return JSON.parse(text); } catch { return null; } };

const gates = [
  { id: 'api', title: 'Production API is up', check: async () => { const r = await get(`${API}/health`); return [r.status === 200, `health ${r.status}`]; } },
  { id: 'web', title: 'Web app and marketing site respond', check: async () => {
    const [w, m] = await Promise.all([get(WEB), get(MARKETING)]);
    return [w.status === 200 && m.status === 200, `web ${w.status}, marketing ${m.status}`];
  } },
  { id: 'scripture', title: 'Daily Word quotes the published translations', check: async () => {
    const [en, fr] = await Promise.all(['en', 'fr'].map(l => get(`${API}/meditations/daily-word/today?locale=${l}`).then(r => json(r.body))));
    const ok = /King James/.test(en?.verse?.translation ?? '') && /Darby/.test(fr?.verse?.translation ?? '');
    return [ok, `en: ${en?.verse?.translation ?? '?'} · fr: ${fr?.verse?.translation ?? '?'}`];
  } },
  { id: 'clerk', title: 'Sign-in uses Clerk production keys', owner: 'Product owner', check: async () => {
    const r = await get(`${WEB}/sign-in`);
    const key = r.body.match(/pk_(live|test)_/)?.[1];
    return [key === 'live', key ? `publishable key is pk_${key}_…` : 'no Clerk key found on /sign-in'];
  } },
  { id: 'privacy', title: 'Final privacy notice is published', owner: 'Product owner + adviser', check: async () => {
    const r = await get(`${MARKETING}/privacy`);
    const placeholder = /pre-launch privacy overview/i.test(r.body);
    return [r.status === 200 && !placeholder, placeholder ? 'still the pre-launch placeholder' : `status ${r.status}`];
  } },
  { id: 'companion', title: 'Prayer topic library reviewed and live', owner: 'Pastoral reviewer', check: async () => {
    const lib = json(fs.readFileSync(path.join(apiRoot, 'content/prayer-topics.json'), 'utf8'));
    const r = await get(`${API}/prayer-companion/topics?locale=en`);
    return [lib?.status === 'reviewed' && r.status === 200, `library ${lib?.status}, production endpoint ${r.status}`];
  } },
  { id: 'crisis', title: 'Crisis numbers verified locally', owner: 'Reviewer per country', check: async () => {
    const doc = fs.readFileSync(path.join(repoRoot, 'docs/M3.7_CRISIS_CONTACTS_DRAFT.md'), 'utf8');
    const draft = /\*\*Status:\*\*\s*DRAFT/i.test(doc);
    return [!draft, draft ? 'contacts document is still marked DRAFT' : 'marked verified'];
  } },
  { id: 'daily-word', title: 'At least 30 reviewed Daily Word entries', owner: 'Writers + pastoral reviewer', check: async () => {
    const { validateDailyWordLibrary, coverage } = require(path.join(apiRoot, 'dist/meditation/daily-word-library'));
    const c = coverage(validateDailyWordLibrary(json(fs.readFileSync(path.join(apiRoot, 'content/daily-word-library.json'), 'utf8'))));
    return [c.byStatus.reviewed >= 30, `${c.byStatus.reviewed} reviewed, ${c.byStatus.draft} draft`];
  } },
  { id: 'pastors', title: 'Pastors registered for the care pilot', owner: 'Product owner + engineering', check: async () => {
    const r = await get(`${API}/pastors`); const list = json(r.body);
    return [Array.isArray(list) && list.length > 0, Array.isArray(list) ? `${list.length} listed` : `status ${r.status}`];
  } },
];

const manual = [
  ['OpenAI key on Render and data-retention terms confirmed', 'Product owner'],
  ['Hosting plan decided (Vercel free plan: 100 deploys a day, non-commercial use)', 'Product owner'],
  ['"Delete my account" built and tested; data export or an accepted manual process', 'Engineering'],
  ['Legacy unencrypted reflections encrypted in production (approved run)', 'Engineering, after approval'],
  ['Daily care-data purge scheduled in production', 'Engineering, after approval'],
  ['Signed-in production smoke test passed (docs/M3.8_SMOKE_TEST.md)', 'Engineering'],
  ['Real devices: iPhone Safari, Android Chrome, VoiceOver and TalkBack', 'Engineering + tester'],
];

(async () => {
  console.log(`LifeBook M3.8 launch check · ${new Date().toISOString().slice(0, 16)}Z\n`);
  let open = 0;
  for (const gate of gates) {
    let ok = false, detail = '';
    try { [ok, detail] = await gate.check(); } catch (error) { detail = `check failed: ${error.message}`; }
    if (!ok) open++;
    console.log(`${ok ? '✔' : '✘'} ${gate.title}${gate.owner && !ok ? `  [${gate.owner}]` : ''}\n    ${detail}`);
  }
  console.log('\nManual gates (tick in docs/M3.8_LAUNCH_PLAN.md):');
  for (const [title, owner] of manual) console.log(`  • ${title}  [${owner}]`);
  console.log(`\n${gates.length - open} of ${gates.length} automated gates pass; ${manual.length} manual gates to confirm.`);
  process.exitCode = open ? 1 : 0;
})();
