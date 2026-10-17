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
const { careErrorMessage, SIGN_IN_AGAIN } = load('../lib/care-errors.ts');

test('care errors keep the API message in English', () => {
  assert.equal(careErrorMessage(new Error('Another pastor has already taken this request'), 'en'), 'Another pastor has already taken this request');
});
test('care errors are translated to French, including the session and network messages', () => {
  assert.equal(careErrorMessage(new Error(SIGN_IN_AGAIN), 'fr'), 'Reconnectez-vous.');
  assert.equal(careErrorMessage(new Error('Another pastor has already taken this request'), 'fr'), 'Un autre pasteur a déjà pris cette demande.');
  assert.equal(careErrorMessage(new Error('You already have 3 open conversations, your limit'), 'fr'), 'Vous avez déjà 3 conversations ouvertes, votre limite.');
});
test('unknown or empty errors fall back to a generic message in the UI language', () => {
  assert.equal(careErrorMessage(new Error('LifeBook API returned HTTP 500.'), 'fr'), 'Une erreur est survenue. Veuillez réessayer.');
  assert.equal(careErrorMessage(null, 'en'), 'Something went wrong. Please try again.');
  assert.equal(careErrorMessage({ message: '  ' }, 'fr'), 'Une erreur est survenue. Veuillez réessayer.');
});
test('safeguarding report errors are translated to French', () => {
  assert.equal(careErrorMessage(new Error('You have sent several reports today. If someone is in danger, call 112 now.'), 'fr'), 'Vous avez déjà envoyé plusieurs signalements aujourd’hui. Si quelqu’un est en danger, appelez le 112 maintenant.');
  assert.equal(careErrorMessage(new Error('Give a reason for the suspension'), 'fr'), 'Indiquez le motif de la suspension.');
});
