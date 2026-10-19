const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage, copy, web } = require('./helpers.cjs');
const native = Object.fromEntries(['ActivityIndicator', 'Text', 'TextInput', 'Modal', 'KeyboardAvoidingView'].map(name => [name, name]));
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen', 'SectionLabel', 'Segmented'].map(name => [name, name]));
const session = { isSignedIn: true, userId: 'synthetic-member', getToken: async () => 'synthetic-token' };
const item = { id: 'synthetic-meditation', title: 'Synthetic meditation', locale: 'fr', scriptureReference: 'JHN.1.1', scriptureText: null, translation: null, explanation: 'Synthetic explanation', questions: ['Synthetic question'], guidedPrayer: 'Synthetic prayer' };
const button = (renderer, title) => renderer.root.findAllByType('Button').find(node => node.props.title === title);

function detailHarness() {
  let personal = { reflection: 'Saved synthetic reflection', bookmarked: false, completedAt: null };
  const controls = { failState: false, failWrite: false };
  const writes = [];
  let confirmation;
  let closed = 0;
  const { MeditationDetail } = load('../components/meditation-detail.tsx', {
    'react-native': { ...native, Platform: { OS: 'ios' }, Alert: { alert: (_a, _b, actions) => { confirmation = actions; } } },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en', t: copy.en }), useSession: () => session },
    '../lib/api': { requireToken: async read => read(), api: async (path, _token, init = {}) => {
      if (init.method) {
        writes.push({ path, init });
        if (controls.failWrite) throw new Error('Synthetic network failure');
        if (path.endsWith('/reflection')) { personal = { ...personal, reflection: JSON.parse(init.body).text }; return { updatedAt: '2026-10-19' }; }
        if (path.endsWith('/bookmark')) { personal = { ...personal, bookmarked: JSON.parse(init.body).saved }; return { bookmarked: personal.bookmarked }; }
        personal = { ...personal, completedAt: '2026-10-19T10:00:00.000Z' }; return { completedAt: personal.completedAt };
      }
      if (path.endsWith('/state')) { if (controls.failState) throw new Error('Synthetic state failure'); return personal; }
      return item;
    } }, '../../web/lib/errors': { errorMessage }, './ui': ui,
  });
  return { controls, writes, Component: () => React.createElement(MeditationDetail, { id: item.id, onClose: () => closed++, onChanged() {} }), get confirmation() { return confirmation; }, get closed() { return closed; } };
}

test('meditation reflection keeps failed draft, prompts on close and saves on retry', async () => {
  const h = detailHarness();
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.Component)); });
  assert.equal(h.writes.length, 0, 'opening a meditation must not mark it complete');
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('New synthetic reflection'));
  h.controls.failWrite = true;
  await act(async () => button(renderer, 'Save reflection').props.onPress());
  assert.equal(renderer.root.findByType('TextInput').props.value, 'New synthetic reflection');
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  await act(async () => button(renderer, 'Close').props.onPress());
  assert.equal(h.closed, 0);
  assert.ok(h.confirmation.find(action => action.style === 'cancel'));
  h.controls.failWrite = false;
  await act(async () => button(renderer, 'Save reflection').props.onPress());
  assert.equal(button(renderer, 'Save reflection').props.disabled, true);
  await act(async () => button(renderer, 'Close').props.onPress());
  assert.equal(h.closed, 1);
  await act(async () => renderer.unmount());
});

test('meditation bookmark and explicit completion preserve an unsaved reflection', async () => {
  const h = detailHarness();
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.Component)); });
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('Unsent synthetic draft'));
  await act(async () => button(renderer, 'Save meditation').props.onPress());
  assert.ok(button(renderer, 'Remove from saved'));
  await act(async () => button(renderer, 'Remove from saved').props.onPress());
  assert.ok(button(renderer, 'Save meditation'));
  await act(async () => button(renderer, 'Mark complete').props.onPress());
  assert.equal(button(renderer, 'Completed').props.disabled, true);
  assert.equal(renderer.root.findByType('TextInput').props.value, 'Unsent synthetic draft');
  assert.deepEqual(h.writes.map(write => write.path.split('/').at(-1)), ['bookmark', 'bookmark', 'complete']);
  await act(async () => renderer.unmount());
});

test('failed private meditation read blocks blank editing and all writes', async () => {
  const h = detailHarness(); h.controls.failState = true;
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.Component)); });
  assert.equal(renderer.root.findAllByType('TextInput').length, 0);
  assert.equal(button(renderer, 'Mark complete'), undefined);
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  assert.equal(h.writes.length, 0);
  h.controls.failState = false;
  await act(async () => renderer.root.findByType('ErrorLine').props.onRetry());
  assert.equal(renderer.root.findByType('TextInput').props.value, 'Saved synthetic reflection');
  await act(async () => renderer.unmount());
});

function collectionHarness({ signedIn = true, missing = false, unavailable = false } = {}) {
  const requests = [];
  const app = { c: {}, lang: 'fr' };
  const { default: Meditations } = load('../app/meditations.tsx', {
    'react-native': native,
    'expo-router': { useFocusEffect: cb => React.useEffect(cb, [cb]), useRouter: () => ({ navigate() {} }) },
    '../lib/app': { useApp: () => app, useSession: () => ({ ...session, isSignedIn: signedIn }) },
    '../lib/api': { requireToken: async read => read(), api: async path => {
      requests.push(path);
      if (unavailable) throw new web.ApiError('Unavailable', 503);
      if (path.includes('/today?')) { if (missing) throw new web.ApiError('Not found', 404); return item; }
      return [{ meditation: item, completedAt: '2026-10-19T10:00:00.000Z' }];
    } }, '../../web/lib/api': { ApiError: web.ApiError }, '../../web/lib/errors': { errorMessage },
    '../components/ui': ui, '../components/reflection-detail': { ReflectionDetail: 'ReflectionDetail' },
  });
  return { Meditations, requests };
}

test('meditation collections load saved/history and open the selected real meditation', async () => {
  const h = collectionHarness();
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.Meditations)); });
  assert.equal(h.requests[0], '/meditations/today?locale=fr');
  await act(async () => renderer.root.findByType('Segmented').props.onChange('saved'));
  assert.equal(h.requests.at(-1), '/meditations/saved');
  await act(async () => renderer.root.findByType('Row').props.onPress());
  assert.equal(renderer.root.findByType('ReflectionDetail').props.id, item.id);
  await act(async () => renderer.root.findByType('ReflectionDetail').props.onClose());
  await act(async () => renderer.root.findByType('Segmented').props.onChange('history'));
  assert.equal(h.requests.at(-1), '/meditations/history');
  assert.match(renderer.root.findByType('Row').props.subtitle, /Français/);
  await act(async () => renderer.unmount());
});

test('meditation collections distinguish unpublished empty state, unavailable API, and signed-out privacy', async () => {
  for (const config of [{ missing: true }, { unavailable: true }, { signedIn: false }]) {
    const h = collectionHarness(config);
    let renderer;
    await act(async () => { renderer = create(React.createElement(h.Meditations)); });
    if (config.unavailable) assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
    if (config.missing) {
      assert.equal(renderer.root.findAllByType('ErrorLine').length, 0);
      assert.ok(renderer.root.findAllByType('Text').some(node => String(node.props.children).includes('Aucune méditation')));
    }
    if (config.signedIn === false) {
      await act(async () => renderer.root.findByType('Segmented').props.onChange('history'));
      assert.equal(h.requests.length, 1, 'signed-out member must not request private history');
      assert.equal(renderer.root.findAllByType('Row').length, 0);
    }
    await act(async () => renderer.unmount());
  }
});
