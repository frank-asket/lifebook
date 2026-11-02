const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Expo Bible Study matches the API lesson field names', () => {
  const page = fs.readFileSync(path.resolve(__dirname, '../app/bible-studies.tsx'), 'utf8');
  const service = fs.readFileSync(path.resolve(__dirname, '../../api/src/editorial/editorial.service.ts'), 'utf8');
  for (const field of ['guidedPrayer', 'application', 'reflectionQuestions', 'historicalContext', 'exegesis']) {
    assert.ok(service.includes(field), `API editorial service lacks ${field}`);
    assert.ok(page.includes(field), `Mobile Bible Study does not render ${field}`);
  }
  assert.ok(!page.includes('practicalApplication'), 'Use API application field');
});
