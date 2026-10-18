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
  vm.runInNewContext(code, { exports });
  return exports;
}
const { errorMessage, SIGN_IN_AGAIN } = load('../lib/errors.ts');
const apiError = message => Object.assign(new Error(message), { name: 'ApiError' });

test('care errors keep the API message in English', () => {
  assert.equal(errorMessage(new Error('Another pastor has already taken this request'), 'en'), 'Another pastor has already taken this request');
});
test('care errors are translated to French, including the session and network messages', () => {
  assert.equal(errorMessage(new Error(SIGN_IN_AGAIN), 'fr'), 'Reconnectez-vous.');
  assert.equal(errorMessage(new Error('Another pastor has already taken this request'), 'fr'), 'Un autre pasteur a déjà pris cette demande.');
  assert.equal(errorMessage(new Error('You already have 3 open conversations, your limit'), 'fr'), 'Vous avez déjà 3 conversations ouvertes, votre limite.');
});
test('unknown or empty errors fall back to a generic message in the UI language', () => {
  assert.equal(errorMessage(new Error('LifeBook API returned HTTP 500.'), 'fr'), 'Une erreur est survenue. Veuillez réessayer.');
  assert.equal(errorMessage(null, 'en'), 'Something went wrong. Please try again.');
  assert.equal(errorMessage({ message: '  ' }, 'fr'), 'Une erreur est survenue. Veuillez réessayer.');
});
test('safeguarding report errors are translated to French', () => {
  assert.equal(errorMessage(new Error('You have sent several reports today. If someone is in danger, call 112 now.'), 'fr'), 'Vous avez déjà envoyé plusieurs signalements aujourd’hui. Si quelqu’un est en danger, appelez le 112 maintenant.');
  assert.equal(errorMessage(new Error('Give a reason for the suspension'), 'fr'), 'Indiquez le motif de la suspension.');
});

// Audit finding 5 (docs/FRONTEND_AUDIT_2026-10-18.md): pages outside care showed raw English API text.
test('technical status text is never shown, in either language', () => {
  assert.equal(errorMessage(apiError('LifeBook API returned HTTP 500.'), 'en'), 'Something went wrong. Please try again.');
  assert.equal(errorMessage(apiError('LifeBook API returned HTTP 403.'), 'fr'), 'Une erreur est survenue. Veuillez réessayer.');
});
test('an unknown API message falls back in French, while page-written text passes through', () => {
  assert.equal(errorMessage(apiError('property foo should not exist'), 'fr'), 'Une erreur est survenue. Veuillez réessayer.');
  assert.equal(errorMessage(apiError('property foo should not exist'), 'en'), 'property foo should not exist');
  assert.equal(errorMessage(new Error('Échec de l’enregistrement. Votre brouillon est conservé.'), 'fr'), 'Échec de l’enregistrement. Votre brouillon est conservé.');
  assert.equal(errorMessage(new Error('Reconnectez-vous.'), 'fr'), 'Reconnectez-vous.');
});
test('network and availability messages from lib/api.ts are translated', () => {
  assert.equal(errorMessage(apiError('Cannot connect to LifeBook right now. Please check your connection and try again.'), 'fr'), 'Impossible de joindre LifeBook pour le moment. Vérifiez votre connexion et réessayez.');
  assert.equal(errorMessage(apiError('Too many requests. Please wait a moment and try again.'), 'fr'), 'Trop de demandes. Patientez un instant puis réessayez.');
});
