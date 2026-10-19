const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function config(env) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../app.config.js'), 'utf8'), {
    module, URL, process: { env }, require: name => { assert.equal(name, './app.json'); return require('../app.json'); },
  });
  return module.exports({ config: {} });
}
test('production native config rejects missing/development identity and unsafe API settings', () => {
  for (const key of ['', 'pk_test_synthetic']) assert.throws(() => config({ LIFEBOOK_RELEASE_BUILD: 'true', EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: key, EXPO_PUBLIC_API_URL: 'https://api.example.test' }), /production publishable key/);
  const values = { EAS_BUILD_PROFILE: 'production', EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_synthetic' };
  for (const api of ['', 'http://localhost:4100', 'https://member:password@api.example.test', 'https://api.example.test?credential=synthetic', 'https://api.example.test#token']) assert.throws(() => config({ ...values, EXPO_PUBLIC_API_URL: api }), /API URL|EXPO_PUBLIC_API_URL/);
  assert.equal(config({ ...values, EXPO_PUBLIC_API_URL: 'https://api.example.test/api/v1' }).android.package, 'app.lifebook.mobile');
});
test('preview builds keep development identity separate from store releases', () => {
  assert.throws(() => config({ EAS_BUILD_PROFILE: 'preview' }), /matching EAS environment/);
  const value = config({ EAS_BUILD_PROFILE: 'preview', EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_synthetic' });
  assert.equal(value.ios.bundleIdentifier, value.android.package);
  assert.ok(value.extra.eas.projectId);
  assert.ok(value.plugins.includes('@clerk/expo'));
  assert.ok(value.plugins.includes('expo-secure-store'));
});
