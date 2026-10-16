const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, env = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, process: { env } });
  return exports;
}
const { initialDailyWordStep } = load('../lib/daily-word-navigation.ts');
test('dashboard step deep links override resume position', () => {
  assert.equal(initialDailyWordStep('2', ['UNDERSTAND']), 2);
  assert.equal(initialDailyWordStep('0', ['UNDERSTAND', 'MEDITATE']), 0);
  assert.equal(initialDailyWordStep('4'), 4);
});
test('invalid journey links safely resume the first unfinished step', () => {
  for (const value of [null, '', '-1', '5', '2.5', '02', 'NaN', '<script>']) {
    assert.equal(initialDailyWordStep(value, ['UNDERSTAND', 'MEDITATE']), 2);
  }
  assert.equal(initialDailyWordStep(null), 0);
  assert.equal(initialDailyWordStep(null, ['UNDERSTAND', 'MEDITATE', 'REFLECT', 'PRAY', 'LIVE']), 4);
});
test('marketing links preserve a configured origin and point to the requested flow', () => {
  const { appLinks } = load('../../marketing/lib/app-links.ts', { NEXT_PUBLIC_APP_URL: 'https://example.test///' });
  assert.equal(appLinks.signIn, 'https://example.test/sign-in');
  assert.equal(appLinks.signUp, 'https://example.test/sign-up');
  assert.equal(appLinks.meditation, 'https://example.test/meditation');
  assert.equal(appLinks.prayer, 'https://example.test/prayer');
  assert.equal(appLinks.livingword, 'https://example.test/livingword');
});
test('unconfigured production marketing links never point at localhost', () => {
  const production = load('../../marketing/lib/app-links.ts', { NODE_ENV: 'production' });
  assert.equal(new URL(production.appLinks.home).hostname, 'lifebook-inky.vercel.app');
  const development = load('../../marketing/lib/app-links.ts', { NODE_ENV: 'development' });
  assert.equal(development.appLinks.home, 'http://localhost:3001/dashboard');
});

const { dailyWordDate } = load('../lib/daily-word.ts');
test('daily Scripture follows the local calendar day at midnight and year boundaries', () => {
  assert.equal(dailyWordDate(new Date(2026, 9, 16, 0, 1)), '2026-10-16');
  assert.equal(dailyWordDate(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  assert.equal(dailyWordDate(new Date(2027, 0, 1, 0, 0)), '2027-01-01');
});
