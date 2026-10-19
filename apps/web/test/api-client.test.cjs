const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(fetch) {
  const source = fs.readFileSync(path.resolve(__dirname, '../lib/api.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, fetch, Headers, Response, process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } } });
  return exports;
}
const json = (body, status = 200) => new Response(body, { status, headers: { 'content-type': 'application/json' } });

test('a 200 with an empty body is null, so a new member is not shown a load error', async () => {
  const { api } = load(async () => new Response('', { status: 200 }));
  assert.equal(await api('/bible-reading/continue', 'token'), null);
});

test('JSON bodies parse; 204 is undefined; errors and non-JSON still fail', async () => {
  assert.deepEqual(JSON.parse(JSON.stringify(await load(async () => json('{"chapterId":"JHN.1"}')).api('/x', 't'))), { chapterId: 'JHN.1' });
  assert.equal(await load(async () => new Response(null, { status: 204 })).api('/x', 't'), undefined);
  await assert.rejects(load(async () => new Response('', { status: 500 })).api('/x', 't'), /HTTP 500/);
  await assert.rejects(load(async () => new Response('<html>oops</html>', { status: 200, headers: { 'content-type': 'text/html' } })).api('/x', 't'), /could not load/);
});
