const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require, process: { env: {} } });
  return exports;
}
const onboarding = load('../lib/onboarding.ts');
const api = load('../lib/api.ts');

// Regression: onboarding saved its blank defaults over a member's stored profile
// when the profile read failed. Found by the frontend audit on 2026-10-18.
// Report: docs/FRONTEND_AUDIT_2026-10-18.md (finding 1)
test('a failed profile read blocks saving', async () => {
  for (const failure of [new Error('Please sign in again.'), new Error('LifeBook is temporarily unavailable. Please try again later.'), new TypeError('Failed to fetch')]) {
    const result = await onboarding.loadOnboardingProfile(() => Promise.reject(failure));
    assert.equal(result.status, 'failed');
    assert.equal(onboarding.canSaveOnboarding(result, false), false);
  }
  assert.equal(onboarding.canSaveOnboarding({ status: 'loading' }, false), false);
});

test('a new member (null profile) and an existing member can save', async () => {
  const fresh = await onboarding.loadOnboardingProfile(async () => ({ userId: 'u', role: 'MEMBER', profile: null }));
  assert.deepEqual({ ...fresh }, { status: 'ready', profile: null });
  assert.equal(onboarding.canSaveOnboarding(fresh, false), true);
  assert.equal(onboarding.canSaveOnboarding(fresh, true), false);

  const stored = { language: 'fr', learningGoals: ['Grow in faith'], aiProcessingConsent: true };
  const existing = await onboarding.loadOnboardingProfile(async () => ({ userId: 'u', role: 'MEMBER', profile: stored }));
  assert.equal(existing.status, 'ready');
  assert.equal(existing.profile, stored);
});

test('step links open the named step and fall back to the first', () => {
  assert.equal(onboarding.onboardingStepIndex('language'), 0);
  assert.equal(onboarding.onboardingStepIndex('journey'), 1);
  assert.equal(onboarding.onboardingStepIndex('goals'), 2);
  assert.equal(onboarding.onboardingStepIndex('privacy'), 3);
  for (const value of [null, undefined, '', 'PRIVACY', '3', 'constructor']) {
    assert.equal(onboarding.onboardingStepIndex(value), 0);
  }
});

test('every content format has a French label', () => {
  for (const format of api.FORMATS) {
    assert.equal(api.formatLabel(format, 'en'), format);
    assert.equal(typeof api.formatLabel(format, 'fr'), 'string');
  }
  assert.equal(api.formatLabel('Guided reflection', 'fr'), 'Réflexion guidée');
  assert.equal(api.formatLabel('My own format', 'fr'), 'My own format');
});
