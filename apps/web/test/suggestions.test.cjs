const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../lib/suggestions.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const lib = {}; vm.runInNewContext(code, { exports: lib, JSON, Array });
const { visible, parseHidden } = lib;
const plain = v => JSON.parse(JSON.stringify(v));
const s = id => ({ id, kind: 'plan', reason: { type: 'goal', goal: 'Grow in faith' }, href: '/x' });

test('Home shows the first two suggestions the person has not hidden', () => {
  assert.deepEqual(plain(visible([s('a'), s('b'), s('c')], [])).map(x => x.id), ['a', 'b']);
  assert.deepEqual(plain(visible([s('a'), s('b'), s('c')], ['a'])).map(x => x.id), ['b', 'c']);
  assert.deepEqual(plain(visible([s('a')], ['a'])), []);
});
test('hidden suggestions are read defensively', () => {
  assert.deepEqual(plain(parseHidden(null)), []);
  assert.deepEqual(plain(parseHidden('oops')), []);
  assert.deepEqual(plain(parseHidden('["plan:discover-jesus", 1]')), ['plan:discover-jesus']);
});
