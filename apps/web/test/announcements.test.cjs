const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {}; vm.runInNewContext(code, { exports, Date, JSON, Array, Set }); return exports;
}
const plain = v => JSON.parse(JSON.stringify(v));
const { pickAnnouncement, markSeen, parseSeen, byId, WELCOME, RELEASES } = load('../lib/announcements.ts');
const now = new Date('2026-10-20T12:00:00Z');
const release = (id, date) => ({ id, kind: 'release', date, label: { en: '', fr: '' }, slides: [] });

test('a new account sees the welcome tour once', () => {
  assert.equal(pickAnnouncement({ createdAt: new Date('2026-10-19T09:00:00Z'), now, seen: [] }).id, 'welcome');
  assert.equal(pickAnnouncement({ createdAt: new Date('2026-10-19T09:00:00Z'), now, seen: ['welcome'] }), null);
});
test('a returning member sees the newest release they have not seen, only if it shipped after they joined', () => {
  const releases = [release('r2', '2026-10-18'), release('r1', '2026-09-01')];
  const old = new Date('2026-06-01T00:00:00Z');
  assert.equal(pickAnnouncement({ createdAt: old, now, seen: [], releases }).id, 'r2');
  assert.equal(pickAnnouncement({ createdAt: old, now, seen: ['r2'], releases }).id, 'r1');
  assert.equal(pickAnnouncement({ createdAt: old, now, seen: ['r1', 'r2'], releases }), null);
  // Joined in September after r1 shipped: r1 is not news to them.
  assert.equal(pickAnnouncement({ createdAt: new Date('2026-09-20T00:00:00Z'), now, seen: ['r2'], releases }), null);
});
test('finishing the welcome tour also covers the current releases', () => {
  const seen = plain(markSeen([], WELCOME));
  assert.ok(seen.includes('welcome'));
  for (const r of RELEASES) assert.ok(seen.includes(r.id));
  assert.deepEqual(plain(markSeen(['welcome'], RELEASES[0])), ['welcome', RELEASES[0].id]);
});
test('stored seen lists are read defensively', () => {
  assert.deepEqual(plain(parseSeen(null)), []);
  assert.deepEqual(plain(parseSeen('not json')), []);
  assert.deepEqual(plain(parseSeen('{"a":1}')), []);
  assert.deepEqual(plain(parseSeen('["welcome", 3, null]')), ['welcome']);
});
test('every slide has both languages, and links stay inside the app', () => {
  for (const a of [WELCOME, ...RELEASES]) {
    assert.ok(a.slides.length >= 1 && a.slides.length <= 6, a.id);
    for (const s of a.slides) {
      for (const field of [s.title, s.body]) { assert.ok(field.en.trim() && field.fr.trim(), `${a.id}/${s.id}`); }
      if (s.cta) assert.match(s.cta.href, /^\/[a-z-]/);
    }
  }
  assert.equal(byId('welcome').id, 'welcome');
  assert.equal(byId('nope'), null);
});
