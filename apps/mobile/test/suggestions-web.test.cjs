const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act } = require('./helpers.cjs');
const rules = load('../../web/lib/suggestions.ts');
const item = { id: 'prayer-journal', kind: 'journal', reason: { type: 'goal', goal: 'Prayer' }, href: '/prayer' };
function harness() {
  let auth = { isSignedIn: true, userId: 'a', getToken: async () => 'synthetic-a' };
  let fails = false; const calls = []; const storage = new Map();
  const { Suggestions } = load('../../web/components/Suggestions.tsx', {
    'lucide-react': { BookOpen: 'Icon', LockKeyhole: 'Icon', Timer: 'Icon', X: 'Icon' },
    'next/link': { default: 'a' }, '@clerk/nextjs': { useAuth: () => auth },
    './language-provider': { useLanguage: () => ({ language: 'en' }) },
    '../lib/suggestions': rules,
    '../lib/api': { learningGoalLabel: value => value, faithJourneyLabel: value => value, api: async (path, token, options) => {
      calls.push({ path, token, options });
      if (options?.method === 'POST') { if (fails) throw new Error('offline'); return {}; }
      return { consent: true, suggestions: token === 'synthetic-a' ? [item] : [] };
    } },
  }, { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  return { Suggestions, storage, calls, fail: value => { fails = value; }, switch: () => { auth = { isSignedIn: true, userId: 'b', getToken: async () => 'synthetic-b' }; } };
}
const hide = renderer => renderer.root.findAllByType('button').find(b => b.props['aria-label']?.startsWith('Hide'));
test('suggestion dismissal waits for persistence, retries failures and clears on account change', async () => {
  const h = harness(); let renderer;
  await act(async () => { renderer = create(React.createElement(h.Suggestions)); });
  h.fail(true);
  await act(async () => hide(renderer).props.onClick());
  assert.ok(hide(renderer));
  assert.equal(renderer.root.findAllByProps({ role: 'alert' }).length, 1);
  h.fail(false);
  await act(async () => hide(renderer).props.onClick());
  assert.equal(hide(renderer), undefined);
  assert.equal(h.storage.size, 0, 'new dismissals are stored on the server only');
  h.switch();
  await act(async () => renderer.update(React.createElement(h.Suggestions)));
  assert.equal(renderer.toJSON(), null, 'previous member cards and status are discarded');
  await act(async () => renderer.unmount());
});
test('earlier device choices migrate before loading cards and are removed only after success', async () => {
  const h = harness(); h.storage.set(rules.dismissedKey('a'), '["prayer-journal"]'); let renderer;
  await act(async () => { renderer = create(React.createElement(h.Suggestions)); });
  assert.equal(h.calls[0].options.method, 'POST');
  assert.equal(h.calls[0].path, '/me/suggestions/prayer-journal/dismiss');
  assert.equal(h.calls[1].path, '/me/suggestions?locale=en');
  assert.equal(h.storage.size, 0);
  assert.equal(hide(renderer), undefined);
  await act(async () => renderer.unmount());
  const failing = harness(); failing.storage.set(rules.dismissedKey('a'), '["prayer-journal"]'); failing.fail(true);
  await act(async () => { renderer = create(React.createElement(failing.Suggestions)); });
  assert.equal(failing.storage.size, 1);
  await act(async () => renderer.unmount());
});
