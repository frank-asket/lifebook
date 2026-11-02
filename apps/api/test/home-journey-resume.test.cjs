const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

test('M06 dashboard next lesson is derived from member-owned completion rows', () => {
  const api = readFileSync(join(__dirname, '../src/home.controller.ts'), 'utf8');
  assert.match(api, /studyLessonCompletion\.findMany\(\{ where: \{ userId \}/);
  assert.match(api, /learningLessonCompletion\.findMany\(\{ where: \{ enrollment: \{ userId \} \}/);
  assert.match(api, /lessons\.find\(l => !completedStudyLessons\.has\(l\.id\)\)/);
  assert.match(api, /lessons\.find\(l => !completedPathLessons\.has\(l\.id\)\)/);
  assert.match(api, /status: 'PUBLISHED'/);
  assert.match(api, /isPublished: true/);
  assert.doesNotMatch(api, /spiritualScore|maturityScore/);
});
