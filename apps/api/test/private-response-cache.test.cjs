const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../src');
const routes = {
  'prayer/prayer.controller.ts': ["@Get()","@Get('page')","@Get(':id')"],
  'care/care.controller.ts': ["@Get('requests')","@Get('requests/page')","@Get('requests/:id')","@Get('pastor/status')","@Get('pastor/queue')","@Get('pastor/cases')","@Get('pastor/cases/:id')"],
};
test('all personal prayer and pastoral-care GET routes declare no-store', () => {
  for (const [filename, decorators] of Object.entries(routes)) {
    const source = fs.readFileSync(path.join(root, filename), 'utf8');
    for (const decorator of decorators) {
      const line = source.split('\n').find(line => line.includes(decorator));
      assert.ok(line, `Missing route ${filename}: ${decorator}`);
      assert.ok(line.includes("@Header('Cache-Control', 'no-store')"), `Private route must set no-store: ${filename}: ${decorator}`);
    }
  }
});
