const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file) {
  const source = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Intl, Date });
  return exports;
}
// Values built inside the vm sandbox come from another realm; compare them as plain data.
const plain = value => JSON.parse(JSON.stringify(value));
const { bookName, passageLabel, parseVerses: rawParse, calendarDay, greeting } = load('../lib/scripture.ts');
const parseVerses = content => plain(rawParse(content));
const { stillnessSeconds, breathPhase, clock, parseLength, spokenDuration } = load('../lib/prayer-time.ts');

test('chapter and passage ids read as book names in both languages', () => {
  assert.equal(passageLabel('LUK.1', 'en'), 'Luke 1');
  assert.equal(passageLabel('LUK.1', 'fr'), 'Luc 1');
  assert.equal(passageLabel('PSA.23', 'en', 4), 'Psalm 23:4');
  assert.equal(passageLabel('1CO.13.4', 'fr'), '1 Corinthiens 13:4');
  assert.equal(passageLabel('PHP.4.6-PHP.4.7', 'en'), 'Philippians 4:6–7');
  assert.equal(passageLabel('ROM.8.38-ROM.9.1', 'en'), 'Romans 8:38–9:1');
  assert.equal(bookName('rev', 'fr'), 'Apocalypse');
});
test('unknown ids are shown unchanged rather than guessed', () => {
  assert.equal(passageLabel('XYZ.1', 'en'), 'XYZ 1');
  assert.equal(passageLabel('not-an-id', 'en'), 'not-an-id');
  assert.equal(bookName('TOB', 'en'), 'TOB');
});
test('verse markers become numbered verses without changing the words', () => {
  const content = '   [1] Psaume de David. L’Éternel est mon berger : je ne manquerai de rien.\n   [2] Il me fait reposer dans de verts pâturages,  [3] Il restaure mon âme.';
  const paragraphs = parseVerses(content);
  assert.equal(paragraphs.length, 2);
  assert.deepEqual(paragraphs[0].map(v => v.number), ['1']);
  assert.deepEqual(paragraphs[1].map(v => v.number), ['2', '3']);
  assert.equal(paragraphs[1][0].text, 'Il me fait reposer dans de verts pâturages,');
  const words = s => s.replace(/\[\d+\]/g, '').split(/\s+/).filter(Boolean).join(' ');
  assert.equal(paragraphs.flat().map(v => v.text).join(' '), words(content));
  const kjv = parseVerses('[5] And the light shineth in darkness. [6] ¶ There was a man sent from God, whose name was John. [7] The same came for a witness.');
  assert.deepEqual(kjv.map(p => p.map(v => v.number)), [['5'], ['6', '7']]);
  assert.equal(kjv[1][0].text, 'There was a man sent from God, whose name was John.');
  assert.deepEqual(parseVerses('A heading without numbers'), [[{ number: '', text: 'A heading without numbers' }]]);
});
test('daily dates are shown as calendar days, never shifted by timezone', () => {
  assert.equal(calendarDay('2026-10-18', 'en'), 'Sunday 18 October');
  assert.equal(calendarDay('2026-10-18', 'fr'), 'dimanche 18 octobre');
  assert.equal(calendarDay('not a date', 'en'), 'not a date');
  assert.equal(greeting(9, 'en'), 'Good morning');
  assert.equal(greeting(15, 'en'), 'Good afternoon');
  assert.equal(greeting(21, 'fr'), 'Bonsoir');
});
test('prayer time pacing stays gentle and accepts only known lengths', () => {
  assert.deepEqual([2, 5, 10].map(stillnessSeconds), [30, 90, 240]);
  assert.equal(breathPhase(0), 'in');
  assert.equal(breathPhase(4.5), 'out');
  assert.equal(breathPhase(10.2), 'in');
  assert.equal(clock(89.2), '1:30');
  assert.equal(clock(-3), '0:00');
  assert.equal(parseLength('10'), 10);
  for (const bad of [null, '', '3', '<b>', 'NaN']) assert.equal(parseLength(bad), 5);
  assert.equal(spokenDuration(90, 'fr'), 'une minute et demie');
  assert.equal(spokenDuration(240, 'en'), '4 minutes');
});
const { parseReaderSettings, stepSize } = load('../lib/reader-settings.ts');
test('reading settings fall back to defaults for anything unknown', () => {
  assert.deepEqual(plain(parseReaderSettings(null)), { size: 'm', spacing: 'normal', font: 'serif' });
  assert.deepEqual(plain(parseReaderSettings('{"size":"xl","spacing":"relaxed","font":"sans"}')), { size: 'xl', spacing: 'relaxed', font: 'sans' });
  for (const bad of ['not json', '"m"', '[]', '{"size":"huge","font":"comic"}', 'null']) assert.deepEqual(plain(parseReaderSettings(bad)), { size: 'm', spacing: 'normal', font: 'serif' });
  assert.equal(stepSize('xl', 1), 'xl');
  assert.equal(stepSize('s', -1), 's');
  assert.equal(stepSize('m', 1), 'l');
});
const { lastSevenDays } = load('../lib/scripture.ts');
test('the week view shows the last seven days without streaks', () => {
  const days = plain(lastSevenDays('2026-10-18', 'en', [
    { journeyDate: '2026-10-18T00:00:00.000Z', status: 'COMPLETED', steps: [1, 2, 3, 4, 5] },
    { journeyDate: '2026-10-17T00:00:00.000Z', status: 'IN_PROGRESS', steps: [1] },
    { journeyDate: '2026-10-15T00:00:00.000Z', status: 'IN_PROGRESS', steps: [] },
    { journeyDate: '2026-10-01T00:00:00.000Z', status: 'COMPLETED', steps: [1] },
  ]));
  assert.deepEqual(days.map(d => d.date), ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
  assert.deepEqual(days.map(d => d.state), ['none', 'none', 'none', 'none', 'none', 'started', 'done']);
  assert.deepEqual(days.map(d => d.today), [false, false, false, false, false, false, true]);
  assert.equal(days[0].label, 'M');
  assert.equal(plain(lastSevenDays('2026-03-01', 'fr', []))[0].date, '2026-02-23');
  assert.deepEqual(plain(lastSevenDays('bad', 'en', [])), []);
});
