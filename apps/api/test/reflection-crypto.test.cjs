const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { encryptReflection, decryptReflection } = require('../dist/security/reflection-crypto');
test('reflection envelopes authenticate owner/context, detect tampering, and retain retired-key reads', () => {
  const old = { keys: process.env.REFLECTION_ENCRYPTION_KEYS, active: process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY };
  try {
    const first = randomBytes(32).toString('hex'); const second = randomBytes(32).toString('hex');
    process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ first, second });
    process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'first';
    const text = 'Synthetic private reflection'; const context = 'meditation:user-a:record-a';
    const a = encryptReflection(text, context); const b = encryptReflection(text, context);
    assert.notEqual(a, b); assert.ok(!a.includes(text));
    assert.equal(decryptReflection(a, context), text);
    assert.throws(() => decryptReflection(a, 'meditation:user-b:record-a'), /cannot be opened/);
    assert.throws(() => decryptReflection(a, 'daily-word:user-a:record-a'), /cannot be opened/);
    const tampered = a.slice(0, -4) + 'AAAA';
    assert.throws(() => decryptReflection(tampered, context), /cannot be opened/);
    process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'second';
    assert.ok(encryptReflection(text, context).startsWith('lbenc:v1:second:'));
    assert.equal(decryptReflection(a, context), text);
    process.env.REFLECTION_ENCRYPTION_KEYS = JSON.stringify({ second });
    assert.throws(() => decryptReflection(a, context), /cannot be opened/);
    assert.equal(decryptReflection('Legacy reflection', context), 'Legacy reflection');
    delete process.env.REFLECTION_ENCRYPTION_KEYS;
    assert.throws(() => encryptReflection(text, context), /not configured/);
    process.env.REFLECTION_ENCRYPTION_ACTIVE_KEY = 'constructor';
    assert.throws(() => encryptReflection(text, context), /not configured/);
    assert.throws(() => decryptReflection('lbenc:v1:broken', context), /cannot be opened/);
  } finally {
    for (const [key, value] of [['REFLECTION_ENCRYPTION_KEYS',old.keys],['REFLECTION_ENCRYPTION_ACTIVE_KEY',old.active]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
