// React hooks must be called at the top level of a component or a custom hook. A hook nested inside another
// hook's callback type-checks but crashes the page at runtime ("Invalid hook call"), so check every client file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repo = path.resolve(__dirname, '../../..');
const roots = ['apps/web/app', 'apps/web/components', 'apps/web/lib', 'apps/mobile/app', 'apps/mobile/components', 'apps/mobile/lib', 'apps/marketing/app', 'apps/marketing/components'];
function files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name.startsWith('.') ? [] : files(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
  });
}
function name(fn) {
  if (ts.isFunctionDeclaration(fn) && fn.name) return fn.name.text;
  if ((ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && fn.parent) {
    if (ts.isVariableDeclaration(fn.parent) && ts.isIdentifier(fn.parent.name)) return fn.parent.name.text;
    if (ts.isCallExpression(fn.parent) && /^(React\.)?(memo|forwardRef)$/.test(fn.parent.expression.getText())) return 'Component';
  }
  return null;
}
function misplacedHooks(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^use[A-Z]/.test(node.expression.text)) {
      let fn = node.parent; while (fn && !ts.isFunctionLike(fn)) fn = fn.parent;
      const owner = fn ? name(fn) : null;
      if (!owner || !/^([A-Z]|use[A-Z])/.test(owner)) found.push(`${path.relative(repo, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1} ${node.expression.text}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

test('hooks are only called at the top level of components and custom hooks', () => {
  const all = roots.flatMap(root => files(path.join(repo, root)));
  assert.ok(all.length > 50, `expected the client sources, found ${all.length} files`);
  assert.deepEqual(all.flatMap(misplacedHooks), []);
});

test('the check catches a hook nested inside another hook', () => {
  const tmp = path.join(require('node:os').tmpdir(), `hooks-${process.pid}.tsx`);
  fs.writeFileSync(tmp, 'export function Reader() {\n  useEffect(() => {\n    useEffect(() => {}, []);\n  }, []);\n}\n');
  try { assert.equal(misplacedHooks(tmp).length, 1); } finally { fs.rmSync(tmp, { force: true }); }
});
