const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file) {
  const source = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports });
  return exports;
}
const { pageTitle } = load('../lib/page-title.ts');
const css = fs.readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');

// WCAG relative luminance and contrast ratio.
const lum = hex => { const [r, g, b] = hex.match(/\w\w/g).map(h => parseInt(h, 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const token = (block, name) => css.match(new RegExp(`${block.replace(/[[\]']/g, '\\$&')}\\s*\\{[^}]*--${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];

test('every page gets its own title, ending with LifeBook', () => {
  assert.equal(pageTitle('Prayer Sanctuary'), 'Prayer Sanctuary | LifeBook');
  assert.equal(pageTitle('  Sanctuaire de prière '), 'Sanctuaire de prière | LifeBook');
  assert.equal(pageTitle(''), 'LifeBook');
  assert.equal(pageTitle(undefined), 'LifeBook');
  assert.equal(pageTitle('LifeBook'), 'LifeBook');
});

test('text links use the theme accent, which meets 4.5:1 on cards in both themes', () => {
  assert.match(css, /\.text-link\s*\{[^}]*color:\s*var\(--purple\)/);
  for (const theme of [":root[data-theme='light']", ":root[data-theme='dark']"]) {
    const ratio = contrast(token(theme, 'purple'), token(theme, 'paper'));
    assert.ok(ratio >= 4.5, `${theme}: ${ratio.toFixed(2)}`);
  }
});

test('muted text meets 4.5:1 on the page and on cards in both themes', () => {
  for (const theme of [":root[data-theme='light']", ":root[data-theme='dark']"]) {
    for (const bg of ['bg', 'paper']) {
      const ratio = contrast(token(theme, 'muted'), token(theme, bg));
      assert.ok(ratio >= 4.5, `${theme} muted on ${bg}: ${ratio.toFixed(2)}`);
    }
  }
});
