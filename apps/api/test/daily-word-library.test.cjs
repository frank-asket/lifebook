// Run after pnpm --filter @lifebook/api build. No database or network.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateDailyWordLibrary, entryFor, coverage } = require('../dist/meditation/daily-word-library');

const library = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/daily-word-library.json'), 'utf8'));
const text = { explanation: 'An explanation.', question: 'A question?', prayer: 'A prayer. Amen.', action: 'One action.' };
const entry = (key, extra = {}) => ({ key, passage: 'PSA.23.1', en: text, fr: text, review: { status: 'reviewed', reviewedBy: 'Pastor A', reviewedOn: '2026-10-18' }, ...extra });
const base = () => ({ version: 1, entries: [entry('FALLBACK_A'), entry('FALLBACK_B')] });

test('the shipped library is valid', () => { validateDailyWordLibrary(library); });

test('dates without an entry keep exactly today\'s three-passage rotation', () => {
  const old = ['JOSHUA_1_8', 'PSALM_119_105', 'JAMES_1_22'];
  for (let d = Date.UTC(2026, 0, 1); d < Date.UTC(2027, 0, 1); d += 86400000 * 7) {
    const iso = new Date(d).toISOString().slice(0, 10);
    const days = Math.floor(d / 86400000);
    assert.equal(entryFor(library, iso).key, old[((days % 3) + 3) % 3], iso);
  }
});

test('a dated entry is served on its day only; drafts only where allowed', () => {
  const lib = base();
  lib.entries.push(entry('D_10_19', { date: '10-19' }), entry('D_10_20', { date: '10-20', review: { status: 'draft' } }));
  validateDailyWordLibrary(lib);
  assert.equal(entryFor(lib, '2026-10-19').key, 'D_10_19');
  assert.equal(entryFor(lib, '2027-10-19').key, 'D_10_19');
  assert.notEqual(entryFor(lib, '2026-10-20').key, 'D_10_20');
  assert.equal(entryFor(lib, '2026-10-20', true).key, 'D_10_20');
  // Adding dated entries never changes what other days show.
  assert.equal(entryFor(lib, '2026-10-21').key, entryFor(base(), '2026-10-21').key);
});

test('the validator refuses unsafe or incomplete entries', () => {
  const cases = [
    ['Scripture text stored', e => { e.text = 'In the beginning…'; }, /unexpected field "text"/],
    ['bad passage', e => { e.passage = 'Psalm 23'; }, /invalid passage/],
    ['bad date', e => { e.date = '2026-10-19'; }, /invalid date/],
    ['impossible date', e => { e.date = '02-31'; }, /invalid date/],
    ['missing French', e => { e.fr = { ...text, prayer: '' }; }, /fr\.prayer is missing/],
    ['too long', e => { e.en = { ...text, question: 'x'.repeat(161) }; }, /longer than 160/],
    ['reviewed without reviewer', e => { e.review = { status: 'reviewed' }; }, /must name its reviewer/],
  ];
  for (const [name, mutate, message] of cases) {
    const lib = base(); lib.entries.push(entry('X_TEST', { date: '03-01' })); mutate(lib.entries[2]);
    assert.throws(() => validateDailyWordLibrary(lib), message, name);
  }
  const dup = base(); dup.entries.push(entry('A_DAY', { date: '03-01' }), entry('B_DAY', { date: '03-01' }));
  assert.throws(() => validateDailyWordLibrary(dup), /already uses 03-01/);
  const noFallback = { version: 1, entries: [entry('ONLY_DATED', { date: '03-01' })] };
  assert.throws(() => validateDailyWordLibrary(noFallback), /fallback rotation/);
});

test('coverage counts dated entries and lists the missing days of the year', () => {
  const lib = base(); lib.entries.push(entry('D_01_01', { date: '01-01' }), entry('D_01_02', { date: '01-02', review: { status: 'draft' } }));
  const c = coverage(lib);
  assert.deepEqual(c.byStatus, { reviewed: 1, draft: 1, legacy: 0 });
  assert.equal(c.missing.length, 366 - 2);
  assert.equal(c.missing[0], '01-03');
});
