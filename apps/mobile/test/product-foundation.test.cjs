const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, web, errorMessage, copy } = require('./helpers.cjs');
const apiModule = (fetch, url = 'https://example.invalid', dev = false, extra = {}) => load('../lib/api.ts', { '../../web/lib/api': web }, {
  __DEV__: dev, process: { env: { EXPO_PUBLIC_API_URL: url } }, fetch, Headers, AbortController, setTimeout, clearTimeout, ...extra,
});

test('mobile API normalizes its prefix, applies bearer auth and never caches private requests', async () => {
  for (const url of ['https://example.invalid/', 'https://example.invalid/api/v1/']) {
    const calls = [];
    const { api } = apiModule(async (...args) => { calls.push(args); return new Response('{"ok":true}'); }, url);
    assert.equal((await api('/prayers', 'fixture-token')).ok, true);
    assert.equal(calls[0][0], 'https://example.invalid/api/v1/prayers');
    assert.equal(calls[0][1].headers.get('Authorization'), 'Bearer fixture-token');
    assert.equal(calls[0][1].cache, 'no-store');
  }
});

test('release API rejects insecure configuration and private writes require a token', async () => {
  let calls = 0;
  const { api, requireToken } = apiModule(async () => { calls++; }, 'http://example.invalid');
  await assert.rejects(api('/prayers'), /temporarily unavailable/);
  await assert.rejects(requireToken(async () => null), /Please sign in again/);
  assert.equal(calls, 0);
});

test('API handles empty/non-JSON responses, localizes rate limits, and aborts stalled requests', async () => {
  assert.equal(await apiModule(async () => new Response(null, { status: 204 })).api('/prayers/x'), undefined);
  await assert.rejects(apiModule(async () => new Response('<html>Error</html>')).api('/prayers'), /could not load/);
  await assert.rejects(apiModule(async () => new Response('{}', { status: 429 })).api('/prayers'), error => {
    assert.match(errorMessage(error, 'fr'), /Trop de demandes/); return true;
  });
  const stalled = apiModule(async (_url, init) => {
    assert.equal(init.signal.aborted, true);
    throw new Error('aborted');
  }, undefined, false, { setTimeout: fn => { fn(); return 1; }, clearTimeout() {} });
  await assert.rejects(stalled.api('/prayers'), /check your connection/);
});

test('switching mobile accounts discards mounted private screen state', async () => {
  const Context = React.createContext({ userId: 'member-a' });
  let changeDraft;
  function Stack() {
    const [draft, setDraft] = React.useState(''); changeDraft = setDraft;
    return React.createElement('PrivateScreen', { draft });
  }
  Stack.Screen = () => null;
  const { SessionNavigation } = load('../app/_layout.tsx', {
    'expo-router': { Stack }, 'expo-status-bar': { StatusBar: () => null }, 'expo-secure-store': {},
    'expo-auth-session': { makeRedirectUri() { return 'lifebook://'; } }, '@clerk/expo': {}, '@clerk/expo/token-cache': {},
    '../lib/app': { useSession: () => React.useContext(Context), useApp: () => ({ c: { bg: 'fixture' }, dark: false }) },
  });
  let renderer;
  const tree = userId => React.createElement(Context.Provider, { value: { userId } }, React.createElement(SessionNavigation));
  await act(async () => { renderer = create(tree('member-a')); });
  await act(async () => changeDraft('Private account A draft'));
  assert.equal(renderer.root.findByType('PrivateScreen').props.draft, 'Private account A draft');
  await act(async () => renderer.update(tree('member-b')));
  assert.equal(renderer.root.findByType('PrivateScreen').props.draft, '');
  await act(async () => changeDraft('Private account B draft'));
  await act(async () => renderer.update(tree(null)));
  assert.equal(renderer.root.findByType('PrivateScreen').props.draft, '');
  await act(async () => renderer.unmount());
});

test('prayer detail edits, answers, protects unsaved changes and confirms deletion', async () => {
  let entry = { id: 'fixture', title: 'Family', body: 'A private synthetic prayer', answerNote: null, answeredAt: null };
  const calls = [];
  let confirmation;
  let changed = 0;
  let closed = 0;
  const session = { getToken: async () => 'fixture-token' };
  const native = Object.fromEntries(['ActivityIndicator', 'KeyboardAvoidingView', 'Modal', 'Text', 'TextInput', 'View'].map(name => [name, name]));
  native.Platform = { OS: 'ios' };
  native.Alert = { alert: (_title, _message, buttons) => { confirmation = buttons; } };
  const { PrayerDetail } = load('../components/prayer-detail.tsx', {
    'react-native': native,
    '../lib/app': { useApp: () => ({ c: {}, t: copy.en, lang: 'en' }), useSession: () => session },
    '../lib/api': {
      requireToken: async read => read(),
      api: async (url, token, init = {}) => {
        calls.push({ url, token, init });
        if (init.method === 'PUT') {
          const body = JSON.parse(init.body);
          entry = url.endsWith('/answer') ? { ...entry, answeredAt: body.answered ? '2026-10-19' : null, answerNote: body.note ?? null } : { ...entry, ...body };
        }
        return entry;
      },
    },
    '../../web/lib/prayer-api': { PRAYER_LIMITS: { title: 120, body: 5000, answerNote: 1000 } },
    '../../web/lib/errors': { errorMessage },
    './ui': Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Screen'].map(name => [name, name])),
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(PrayerDetail, { id: 'fixture', onChanged: () => changed++, onClose: () => closed++ })); });
  const button = title => renderer.root.findAllByType('Button').find(node => node.props.title === title);
  await act(async () => renderer.root.findAllByType('TextInput')[1].props.onChangeText('Edited synthetic prayer'));
  await act(async () => button(copy.en.prayer.close).props.onPress());
  assert.equal(closed, 0);
  assert.equal(confirmation[0].style, 'cancel');
  await act(async () => button(copy.en.prayer.saveChanges).props.onPress());
  assert.equal(entry.body, 'Edited synthetic prayer');
  await act(async () => renderer.root.findAllByType('TextInput')[2].props.onChangeText('A synthetic answer'));
  await act(async () => button(copy.en.prayer.markAnswered).props.onPress());
  assert.equal(entry.answerNote, 'A synthetic answer');
  assert.ok(entry.answeredAt);
  await act(async () => button(copy.en.prayer.markUnanswered).props.onPress());
  assert.equal(entry.answeredAt, null);
  await act(async () => button(copy.en.prayer.delete).props.onPress());
  assert.equal(calls.filter(call => call.init.method === 'DELETE').length, 0);
  await act(async () => confirmation.find(b => b.style === 'destructive').onPress());
  assert.equal(calls.filter(call => call.init.method === 'DELETE').length, 1);
  assert.equal(closed, 1);
  assert.equal(changed, 4);
  await act(async () => renderer.unmount());
});

test('mobile profile loads existing choices, preserves custom data/consent, and returns to a real route', async () => {
  const profile = { journey: 'GROWING_BELIEVER', language: 'fr', learningGoals: ['My custom goal'], preferredFormats: ['My custom format'], personalizationConsent: true, aiProcessingConsent: true };
  let saved;
  let destination;
  let prefs;
  const router = { canGoBack: () => true, back() {}, replace: value => { destination = value; } };
  const session = { isSignedIn: true, getToken: async () => 'fixture-token' };
  const onboarding = load('../../web/lib/onboarding.ts');
  const { default: Onboarding } = load('../app/onboarding.tsx', {
    'react-native': { ActivityIndicator: 'ActivityIndicator', Alert: { alert() {} }, BackHandler: { addEventListener: () => ({ remove() {} }) }, Switch: 'Switch', Text: 'Text', View: 'View' },
    'expo-router': { useRouter: () => router, useFocusEffect: cb => React.useEffect(cb, [cb]) },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en', t: copy.en, setPrefs: value => { prefs = value; } }), useSession: () => session },
    '../lib/api': { requireToken: async read => read(), api: async (_path, _token, init = {}) => { if (init.method === 'PUT') { saved = JSON.parse(init.body); return saved; } return { profile }; } },
    '../components/ui': Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Press', 'Screen', 'Segmented'].map(name => [name, name])),
    '../../web/lib/api': web, '../../web/lib/onboarding': onboarding, '../../web/lib/errors': { errorMessage },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Onboarding)); });
  const goal = renderer.root.findAllByType('Press').find(node => node.props.accessibilityRole === 'checkbox' && node.props.accessibilityLabel === 'Learn about Jesus');
  await act(async () => goal.props.onPress());
  assert.ok(goal.findByType('Text').props.children.join('').startsWith('✓ '), 'selected goals also have a visible mark');
  const save = renderer.root.findAllByType('Button').find(node => node.props.title === 'Save and continue');
  assert.equal(save.props.disabled, false);
  await act(async () => save.props.onPress());
  assert.deepEqual(saved.learningGoals, ['My custom goal', 'Learn about Jesus']);
  assert.deepEqual(saved.preferredFormats, ['My custom format']);
  assert.equal(saved.aiProcessingConsent, true);
  assert.equal(saved.personalizationConsent, true);
  assert.equal(saved.journey, profile.journey);
  assert.equal(saved.language, 'fr');
  assert.equal(prefs.lang, 'fr');
  assert.equal(destination, '/');
  await act(async () => renderer.unmount());
});

test('a failed mobile profile read cannot overwrite existing choices with defaults', async () => {
  let writes = 0;
  const session = { isSignedIn: true, getToken: async () => 'fixture-token' };
  const { default: Onboarding } = load('../app/onboarding.tsx', {
    'react-native': { ActivityIndicator: 'ActivityIndicator', Alert: { alert() {} }, BackHandler: { addEventListener: () => ({ remove() {} }) }, Switch: 'Switch', Text: 'Text', View: 'View' },
    'expo-router': { useRouter: () => ({}), useFocusEffect: cb => React.useEffect(cb, [cb]) },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en', t: copy.en, setPrefs() {} }), useSession: () => session },
    '../lib/api': { requireToken: async read => read(), api: async (_path, _token, init = {}) => { if (init.method === 'PUT') writes++; throw new Error('Network unavailable'); } },
    '../components/ui': Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Press', 'Screen', 'Segmented'].map(name => [name, name])),
    '../../web/lib/api': web, '../../web/lib/onboarding': load('../../web/lib/onboarding.ts'), '../../web/lib/errors': { errorMessage },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Onboarding)); });
  assert.equal(renderer.root.findAllByType('Button').some(node => node.props.title === 'Save and continue'), false);
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  assert.equal(writes, 0);
  await act(async () => renderer.unmount());
});

test('mobile settings saves language to the backend and leaves the UI unchanged on failure', async () => {
  const changes = [];
  const writes = [];
  let fail = true;
  const app = { c: {}, t: copy.en, lang: 'en', prefs: { appearance: 'system', length: 5 }, setPrefs: value => changes.push(value) };
  const session = { isSignedIn: true, getToken: async () => 'fixture-token' };
  const { default: You } = load('../app/(tabs)/you.tsx', {
    'react-native': { Text: 'Text', View: 'View' },
    'expo-router': { useRouter: () => ({}), useFocusEffect: cb => React.useEffect(cb, [cb]) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '../../lib/app': { useApp: () => app, useSession: () => session },
    '../../components/ui': Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen', 'SectionLabel', 'Segmented'].map(name => [name, name])),
    '../../lib/api': { requireToken: async read => read(), api: async (_path, _token, init = {}) => {
      if (init.method !== 'PUT') return { profile: { language: 'en' } };
      writes.push(JSON.parse(init.body));
      if (fail) throw new web.ApiError('Cannot connect to LifeBook right now. Please check your connection and try again.');
      return {};
    } },
    '../../../web/lib/errors': { errorMessage }, '../../../web/lib/prayer-time': { PRAYER_LENGTHS: [3, 5, 10] },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(You)); });
  const language = () => renderer.root.findAllByType('Segmented').find(node => node.props.label === copy.en.you.language);
  assert.equal(language().props.disabled, false);
  changes.length = 0;
  await act(async () => language().props.onChange('fr'));
  assert.equal(changes.length, 0);
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  fail = false;
  await act(async () => language().props.onChange('fr'));
  assert.equal(changes[0].lang, 'fr');
  assert.deepEqual(writes, [{ language: 'fr' }, { language: 'fr' }]);
  await act(async () => renderer.unmount());
});
