const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../lib/api.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const api = {};
vm.runInNewContext(code, { exports: api, process: { env: {} } });

// Regression: ISSUE-001 — French settings/dashboard displayed stored English choices.
// Found by /qa on 2026-10-16.
// Report: .gstack/qa-reports/m36-signed-in-20261016/QA_REPORT.md
test('known account choices use French display labels without changing stored values', () => {
  for (const journey of api.JOURNEYS) {
    assert.equal(api.faithJourneyLabel(journey.value, 'en'), journey.label);
    assert.equal(typeof api.faithJourneyLabel(journey.value, 'fr'), 'string');
    assert.notEqual(api.faithJourneyLabel(journey.value, 'fr'), journey.label);
  }
  for (const goal of api.GOALS) {
    assert.equal(api.learningGoalLabel(goal, 'en'), goal);
    assert.notEqual(api.learningGoalLabel(goal, 'fr'), goal);
  }
  assert.equal(api.faithJourneyLabel('MINISTRY_PREPARATION', 'fr'), 'Se préparer au service');
  assert.equal(api.learningGoalLabel('Understand the Bible', 'fr'), 'Comprendre la Bible');
});
test('custom goals remain verbatim and unknown journeys keep the existing fallback', () => {
  for (const value of ['My own goal', 'constructor', '__proto__', '']) {
    assert.equal(api.learningGoalLabel(value, 'fr'), value);
  }
  for (const value of [undefined, null, '', 'FUTURE_JOURNEY']) {
    assert.equal(api.faithJourneyLabel(value, 'fr'), undefined);
  }
});
