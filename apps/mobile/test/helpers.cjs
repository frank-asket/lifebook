const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const fromMobile = createRequire(path.resolve(__dirname, '../package.json'));
const ts = fromMobile('typescript');
const React = fromMobile('react');
const { create, act } = fromMobile('react-test-renderer');

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: name => Object.hasOwn(mocks, name) ? mocks[name] : fromMobile(name), process: { env: {} }, AbortController, ...globals });
  return exports;
}
const web = load('../../web/lib/api.ts');
const { errorMessage } = load('../../web/lib/errors.ts');
const { copy } = load('../lib/copy.ts');

module.exports = { load, React, create, act, web, errorMessage, copy };
