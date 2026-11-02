const { test } = require('node:test');
const assert = require('node:assert/strict');
const { verifiedSubject } = require('../dist/common/identity');

test('production rejects bearer tokens when Clerk authorized parties are missing', async () => {
  const previous = { NODE_ENV: process.env.NODE_ENV, CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY, CLERK_AUTHORIZED_PARTIES: process.env.CLERK_AUTHORIZED_PARTIES };
  try {
    process.env.NODE_ENV = 'production';
    process.env.CLERK_SECRET_KEY = 'sk_test_synthetic_for_unit_testing_only';
    for (const value of [undefined, '', ' , ']) {
      if (value === undefined) delete process.env.CLERK_AUTHORIZED_PARTIES;
      else process.env.CLERK_AUTHORIZED_PARTIES = value;
      await assert.rejects(verifiedSubject('Bearer synthetic.invalid.token'), error =>
        error.status === 401 && error.message === 'Clerk authorized parties are not configured');
    }
    process.env.CLERK_AUTHORIZED_PARTIES = 'https://app.example.org';
    await assert.rejects(verifiedSubject('Bearer synthetic.invalid.token'), error =>
      error.status === 401 && error.message === 'Invalid or expired access token');
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
