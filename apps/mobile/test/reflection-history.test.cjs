const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage, copy, web } = require('./helpers.cjs');
const native = Object.fromEntries(['ActivityIndicator', 'Text', 'TextInput', 'Modal', 'KeyboardAvoidingView'].map(name => [name, name]));
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen', 'SectionLabel', 'Segmented'].map(name => [name, name]));
const session = { isSignedIn: true, userId: 'synthetic-user', getToken: async () => 'synthetic-token' };
const meditation = { id: 'synthetic-meditation', title: 'Synthetic meditation', locale: 'fr', scriptureReference: 'JHN.1.1', scriptureText: null, translation: null, explanation: 'Synthetic explanation', questions: [], guidedPrayer: 'Synthetic prayer' };
const daily = { id: 'synthetic-day', journeyDate: '2026-10-19T00:00:00.000Z', passageKey: 'synthetic-passage', status: 'IN_PROGRESS', steps: [{ step: 'UNDERSTAND' }], reflection: { content: 'Saved synthetic reflection' } };
const button = (r, title) => r.root.findAllByType('Button').find(node => node.props.title === title);
function detailHarness(kind = 'daily', lang = 'en') {
  let state = { reflection: 'Saved synthetic reflection', bookmarked: false, completedAt: null };
  const controls = { failRead: false, failWrite: false, pending: null };
  const writes = [];
  let confirmation;
  let closed = 0;
  let changed = 0;
  const { ReflectionDetail } = load('../components/reflection-detail.tsx', {
    'react-native': { ...native, Platform: { OS: 'ios' }, Alert: { alert: (_a, _b, actions) => { confirmation = actions; } } },
    '../lib/app': { useApp: () => ({ c: {}, lang, t: copy[lang] }), useSession: () => session },
    '../lib/api': { requireToken: async read => read(), api: async (path, token, init = {}) => {
      if (init.method) {
        assert.equal(token, 'synthetic-token'); writes.push({ path, init });
        if (controls.pending) await controls.pending;
        if (controls.failWrite) throw new Error('Synthetic write failure');
        if (init.method === 'DELETE') { state = { ...state, reflection: '' }; return { deleted: 1 }; }
        if (path.endsWith('/reflection')) { const body = JSON.parse(init.body); state = { ...state, reflection: body.content ?? body.text }; return {}; }
        if (path.endsWith('/bookmark')) { state = { ...state, bookmarked: JSON.parse(init.body).saved }; return { bookmarked: state.bookmarked }; }
        state = { ...state, completedAt: '2026-10-19T10:00:00.000Z' }; return { completedAt: state.completedAt };
      }
      if (controls.failRead) throw new Error('Synthetic read failure');
      if (path.startsWith('/daily-word/')) return { ...daily, reflection: state.reflection ? { content: state.reflection } : null };
      return path.endsWith('/state') ? state : meditation;
    } }, '../../web/lib/errors': { errorMessage }, './ui': ui,
  });
  return { controls, writes, Component: () => React.createElement(ReflectionDetail, { kind, id: kind === 'daily' ? daily.id : meditation.id, onClose: () => closed++, onChanged: () => changed++ }), get confirmation() { return confirmation; }, get closed() { return closed; }, get changed() { return changed; } };
}

for (const kind of ['daily', 'meditation']) {
  test(`${kind} reflection keeps failed draft, confirms closing, and saves on retry`, async () => {
    const h = detailHarness(kind);
    let r; await act(async () => { r = create(React.createElement(h.Component)); });
    assert.equal(h.writes.length, 0, 'opening a detail never completes a session');
    await act(async () => r.root.findByType('TextInput').props.onChangeText('Changed synthetic reflection'));
    h.controls.failWrite = true;
    await act(async () => button(r, 'Save reflection').props.onPress());
    assert.equal(r.root.findByType('TextInput').props.value, 'Changed synthetic reflection');
    await act(async () => button(r, 'Close').props.onPress());
    assert.equal(h.closed, 0);
    assert.ok(h.confirmation.find(a => a.style === 'cancel'));
    h.controls.failWrite = false;
    await act(async () => button(r, 'Save reflection').props.onPress());
    assert.equal(button(r, 'Save reflection').props.disabled, true);
    await act(async () => button(r, 'Close').props.onPress());
    assert.equal(h.closed, 1);
    await act(async () => r.unmount());
  });
  test(`${kind} deletion is confirmed and a failed delete preserves saved reflection and draft`, async () => {
    const h = detailHarness(kind);
    let r; await act(async () => { r = create(React.createElement(h.Component)); });
    await act(async () => r.root.findByType('TextInput').props.onChangeText('Unsent synthetic draft'));
    await act(async () => button(r, 'Delete reflection').props.onPress());
    assert.equal(h.writes.length, 0, 'opening the confirmation must not delete');
    h.controls.failWrite = true;
    await act(async () => h.confirmation.find(a => a.style === 'destructive').onPress());
    assert.equal(r.root.findByType('TextInput').props.value, 'Unsent synthetic draft');
    assert.ok(button(r, 'Delete reflection'));
    h.controls.failWrite = false;
    await act(async () => button(r, 'Delete reflection').props.onPress());
    await act(async () => h.confirmation.find(a => a.style === 'destructive').onPress());
    assert.equal(r.root.findByType('TextInput').props.value, '');
    assert.equal(button(r, 'Delete reflection'), undefined);
    assert.ok(h.writes.every(w => w.init.method === 'DELETE' && w.path.endsWith('/reflection')));
    assert.equal(h.changed, 1);
    await act(async () => r.unmount());
  });
}

test('failed private read blocks blank editing and retry restores saved state', async () => {
  const h = detailHarness(); h.controls.failRead = true;
  let r; await act(async () => { r = create(React.createElement(h.Component)); });
  assert.equal(r.root.findAllByType('TextInput').length, 0);
  assert.equal(h.writes.length, 0);
  h.controls.failRead = false;
  await act(async () => r.root.findByType('ErrorLine').props.onRetry());
  assert.equal(r.root.findByType('TextInput').props.value, 'Saved synthetic reflection');
  await act(async () => r.unmount());
});

test('meditation bookmark and completion never discard an unsent reflection', async () => {
  const h = detailHarness('meditation');
  let r; await act(async () => { r = create(React.createElement(h.Component)); });
  await act(async () => r.root.findByType('TextInput').props.onChangeText('Unsent synthetic draft'));
  await act(async () => button(r, 'Save meditation').props.onPress());
  await act(async () => button(r, 'Remove from saved').props.onPress());
  await act(async () => button(r, 'Mark complete').props.onPress());
  assert.equal(button(r, 'Completed').props.disabled, true);
  assert.equal(r.root.findByType('TextInput').props.value, 'Unsent synthetic draft');
  assert.deepEqual(h.writes.map(w => w.path.split('/').at(-1)), ['bookmark', 'bookmark', 'complete']);
  await act(async () => r.unmount());
});

test('pending writes cannot be duplicated, closed or applied after an account tree unmount', async () => {
  const h = detailHarness();
  let resolve; h.controls.pending = new Promise(done => { resolve = done; });
  let r; await act(async () => { r = create(React.createElement(h.Component)); });
  await act(async () => r.root.findByType('TextInput').props.onChangeText('Synthetic draft'));
  const save = button(r, 'Save reflection').props.onPress;
  await act(async () => { save(); save(); });
  assert.equal(h.writes.length, 1);
  await act(async () => button(r, 'Close').props.onPress());
  assert.equal(h.closed, 0);
  await act(async () => r.unmount());
  await act(async () => resolve());
  assert.equal(h.changed, 0);
});

test('French Daily Word detail shows all steps and reflection controls', async () => {
  const h = detailHarness('daily', 'fr');
  let r; await act(async () => { r = create(React.createElement(h.Component)); });
  assert.ok(button(r, 'Enregistrer la réflexion'));
  assert.ok(button(r, 'Supprimer la réflexion'));
  assert.ok(r.root.findAllByType('Text').some(n => String(n.props.children).includes('Comprendre')));
  assert.ok(r.root.findAllByType('Text').some(n => String(n.props.children).includes('19 octobre 2026')));
  await act(async () => r.unmount());
});

function collectionHarness(screen, { signedIn = true, missing = false, fail = false, lang = 'fr' } = {}) {
  const requests = [];
  const detail = { ReflectionDetail: 'ReflectionDetail', dailySteps: ['UNDERSTAND', 'MEDITATE', 'REFLECT', 'PRAY', 'LIVE'], dayLabel: (value, language) => new Date(value).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'UTC' }) };
  const { default: Component } = load(`../app/${screen}.tsx`, {
    'react-native': native, 'expo-router': { useFocusEffect: cb => React.useEffect(cb, [cb]), useRouter: () => ({ navigate() {} }) },
    '../lib/app': { useApp: () => ({ c: {}, lang }), useSession: () => ({ ...session, isSignedIn: signedIn }) },
    '../lib/api': { requireToken: async read => read(), api: async (path, token) => {
      requests.push({ path, token });
      if (fail) throw new web.ApiError('Synthetic failure', 503);
      if (path.includes('/today?')) { if (missing) throw new web.ApiError('No meditation', 404); return meditation; }
      if (path.startsWith('/daily-word/sessions/page')) return { items: [daily], nextCursor: null };
      return screen === 'meditations' ? [{ meditation }] : [daily];
    } }, '../../web/lib/api': { ApiError: web.ApiError }, '../../web/lib/errors': { errorMessage }, '../components/ui': ui, '../components/reflection-detail': detail, '../components/load-more': { LoadMore: () => null },
  });
  return { Component, requests };
}

test('Daily Word history loads owner sessions, marks partial progress and opens exact record', async () => {
  const h = collectionHarness('daily-word-history');
  let r; await act(async () => { r = create(React.createElement(h.Component)); });
  assert.equal(h.requests[0].path, '/daily-word/sessions/page');
  assert.equal(h.requests[0].token, 'synthetic-token');
  assert.match(r.root.findByType('Row').props.subtitle, /1\/5 · En cours/);
  await act(async () => r.root.findByType('Row').props.onPress());
  assert.equal(r.root.findByType('ReflectionDetail').props.id, daily.id);
  assert.equal(r.root.findByType('ReflectionDetail').props.kind, 'daily');
  assert.equal(h.requests.length, 1, 'opening history does not call today or any progress writer');
  await act(async () => r.unmount());
});

test('meditation collections preserve content locale and open exact record', async () => {
  const h = collectionHarness('meditations', { lang: 'en' });
  let r; await act(async () => { r = create(React.createElement(h.Component)); });
  assert.equal(h.requests[0].path, '/meditations/today?locale=en');
  await act(async () => r.root.findByType('Segmented').props.onChange('saved'));
  assert.equal(h.requests.at(-1).path, '/meditations/saved');
  assert.match(r.root.findByType('Row').props.subtitle, /Français/);
  await act(async () => r.root.findByType('Row').props.onPress());
  assert.equal(r.root.findByType('ReflectionDetail').props.id, meditation.id);
  await act(async () => r.root.findByType('ReflectionDetail').props.onClose());
  await act(async () => r.root.findByType('Segmented').props.onChange('history'));
  assert.equal(h.requests.at(-1).path, '/meditations/history');
  await act(async () => r.unmount());
});

test('collections distinguish empty publication, unavailable API, and signed-out access', async () => {
  for (const [screen, config] of [['meditations', { missing: true }], ['meditations', { fail: true }], ['daily-word-history', { signedIn: false }], ['meditations', { signedIn: false }]]) {
    const h = collectionHarness(screen, config);
    let r; await act(async () => { r = create(React.createElement(h.Component)); });
    if (config.missing) { assert.equal(r.root.findAllByType('Row').length, 0); assert.equal(r.root.findAllByType('ErrorLine').length, 0); }
    if (config.fail) assert.equal(r.root.findAllByType('ErrorLine').length, 1);
    if (config.signedIn === false) {
      if (screen === 'meditations') await act(async () => r.root.findByType('Segmented').props.onChange('history'));
      assert.equal(r.root.findAllByType('Row').length, 0);
      assert.ok(h.requests.every(request => request.path.includes('/today?')));
    }
    await act(async () => r.unmount());
  }
});

test('web reflection delete confirms, preserves failed draft and clears only after success', async () => {
  const auth = { isLoaded: true, isSignedIn: true, userId: 'synthetic-member', getToken: async () => 'synthetic-token' };
  let state = { reflection: 'Saved synthetic reflection', bookmarked: true, completedAt: '2026-10-19T10:00:00.000Z' };
  let confirmed = false;
  let fail = true;
  const writes = [];
  const { MeditationView } = load('../../web/components/meditation-view.tsx', {
    '@clerk/nextjs': { useAuth: () => auth }, 'next/link': { default: 'Link' }, './language-provider': { useLanguage: () => ({ language: 'fr' }) },
    '../lib/api': { api: async (path, _token, init = {}) => {
      if (init.method) { writes.push({ path, init }); if (fail) throw new Error('Synthetic failure'); state = { ...state, reflection: '' }; return { deleted: 1 }; }
      return state;
    } },
  }, { window: { confirm: () => confirmed } });
  let r; await act(async () => { r = create(React.createElement(MeditationView, { meditation })); });
  const remove = () => r.root.findAllByType('button').find(n => n.props.children === 'Supprimer la réflexion');
  await act(async () => r.root.findByType('textarea').props.onChange({ target: { value: 'Synthetic unsent draft' } }));
  await act(async () => remove().props.onClick());
  assert.equal(writes.length, 0);
  confirmed = true;
  await act(async () => remove().props.onClick());
  assert.equal(r.root.findByType('textarea').props.value, 'Synthetic unsent draft');
  fail = false;
  await act(async () => remove().props.onClick());
  assert.equal(r.root.findByType('textarea').props.value, '');
  assert.equal(remove(), undefined);
  assert.ok(writes.every(w => w.init.method === 'DELETE'));
  assert.equal(state.bookmarked, true);
  assert.ok(state.completedAt);
  await act(async () => r.unmount());
});
