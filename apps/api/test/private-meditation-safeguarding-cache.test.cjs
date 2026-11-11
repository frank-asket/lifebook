const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const routes = {
  'meditation/meditation.controller.ts': ["@Get('history/page')", "@Get('history')", "@Get('saved')", "@Get(':id/state')"],
  'safeguarding/safeguarding.controller.ts': ["@Get('overview')", "@Get('reports')", "@Get('reports/:id')", "@Get('applications')"],
};
test('sensitive meditation and safeguarding GET endpoints set no-store', () => {
  for (const [file, decorators] of Object.entries(routes)) {
    const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
    for (const decorator of decorators) {
      const position = source.indexOf(decorator);
      assert.ok(position >= 0, `Missing route: ${file} ${decorator}`);
      const next = source.slice(position + decorator.length).split(/\n\s*(?:@Get\(|\w+\s*\()/)[0];
      assert.match(next, /@Header\('Cache-Control', 'no-store'\)/, `Private response must not be cached: ${file} ${decorator}`);
    }
  }
});
