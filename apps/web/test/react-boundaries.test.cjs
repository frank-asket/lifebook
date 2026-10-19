const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');

test('web, marketing and Expo resolve the React declarations matching their runtime', () => {
  for (const app of ['web', 'marketing', 'mobile']) {
    const fromApp = createRequire(path.resolve(__dirname, `../../${app}/package.json`));
    const runtime = fromApp('react/package.json').version.split('.')[0];
    assert.equal(fromApp('@types/react/package.json').version.split('.')[0], runtime, app);
    if (app !== 'mobile') {
      // Next's declarations also import React; a hoisted Expo copy broke JSX after a clean install.
      const fromNext = createRequire(fromApp.resolve('next/package.json'));
      assert.equal(fromNext('@types/react/package.json').version.split('.')[0], runtime, `${app}: Next declarations`);
    }
  }
});
