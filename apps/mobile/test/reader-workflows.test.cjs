const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage, copy } = require('./helpers.cjs');
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen', 'SectionLabel', 'Segmented'].map(name => [name, name]));
const scripture = load('../../web/lib/scripture.ts');
const annotations = load('../lib/annotations.ts');
const native = Object.fromEntries(['ActivityIndicator', 'Text', 'View', 'Switch', 'TextInput', 'Modal', 'KeyboardAvoidingView', 'Pressable', 'ScrollView'].map(name => [name, name]));
const session = { isSignedIn: true, userId: 'fixture-user', getToken: async () => 'fixture-token' };
const focus = cb => React.useEffect(cb, [cb]);
const button = (renderer, title) => renderer.root.findAllByType('Button').find(node => node.props.title === title);

test('reading plans enroll and persist explicit completion; reading alone never completes a day', async () => {
  const plan = { id: 'discover-jesus', title: 'Découvrir Jésus', description: 'Fixture', duration: 2, days: [{ day: 1, chapterId: 'LUK.1' }, { day: 2, chapterId: 'LUK.2' }] };
  let mine = [];
  const writes = [];
  let location;
  let preferences;
  const api = async (path, _token, init = {}) => {
    if (init.method === 'POST') {
      writes.push({ path, body: init.body });
      if (path.endsWith('/enroll')) mine = [{ id: 'enrollment-1', planId: plan.id, completedDays: 0, completions: [], plan }];
      else mine = [{ ...mine[0], completedDays: 1, completions: [{ day: JSON.parse(init.body).day }] }];
      return {};
    }
    if (path.includes('/my-plans')) return mine;
    return path.includes('/plans?') ? [plan] : plan;
  };
  const app = { c: {}, lang: 'fr', setPrefs: value => { preferences = value; } };
  const { default: Plans } = load('../app/reading-plans.tsx', {
    'react-native': native,
    'expo-router': { useFocusEffect: focus, useRouter: () => ({ navigate: value => { location = value; } }) },
    '../lib/app': { useApp: () => app, useSession: () => session },
    '../lib/api': { api, requireToken: async read => read() }, '../components/ui': ui,
    '../../web/lib/scripture': scripture, '../../web/lib/errors': { errorMessage },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Plans)); });
  await act(async () => renderer.root.findAllByType('Row')[0].props.onPress());
  await act(async () => button(renderer, 'Commencer ce plan').props.onPress());
  assert.equal(writes.length, 1);
  await act(async () => renderer.root.findAllByType('Button').find(node => node.props.title === 'Lire le chapitre').props.onPress());
  assert.equal(location, '/bible');
  assert.equal(preferences.chapterId, 'LUK.1');
  assert.equal(preferences.bibleLocale, 'fr');
  assert.equal(writes.length, 1, 'opening a chapter must not complete a day');
  await act(async () => renderer.root.findAllByType('Button').find(node => node.props.title === 'Marquer le jour comme terminé').props.onPress());
  assert.equal(writes[1].path, '/bible-reading/enrollments/enrollment-1/complete-day');
  assert.equal(JSON.parse(writes[1].body).day, 1);
  assert.equal(button(renderer, 'Terminé').props.disabled, true);
  await act(async () => renderer.unmount());
  await act(async () => { renderer = create(React.createElement(Plans)); });
  assert.match(renderer.root.findAllByType('Row')[0].props.subtitle, /1 jours sur 2/);
  await act(async () => renderer.unmount());
});

test('annotation editor preserves saved note, guards unsaved changes and confirms deletion', async () => {
  let record = { id: 'note-1', passageId: 'JHN.1.1-3', locale: 'fr', bookmarked: true, highlight: 'yellow', note: 'Synthetic private note' };
  let confirmation;
  let closed = 0;
  let changed = 0;
  const calls = [];
  const api = async (path, _token, init = {}) => {
    calls.push({ path, init });
    if (init.method === 'PUT') { const input = JSON.parse(init.body); record = { ...record, ...input, bookmarked: input.bookmark }; }
    if (init.method === 'DELETE') record = null;
    return path.includes('/passage?') ? { annotation: record } : record;
  };
  const { AnnotationEditor } = load('../components/annotation-editor.tsx', {
    'react-native': { ...native, Platform: { OS: 'ios' }, Alert: { alert: (_t, _m, buttons) => { confirmation = buttons; } } },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en', t: copy.en }), useSession: () => session },
    '../lib/api': { api, requireToken: async read => read() }, '../lib/annotations': annotations,
    '../../web/lib/errors': { errorMessage }, '../../web/lib/scripture': scripture, './ui': ui,
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(AnnotationEditor, { chapterId: 'JHN.1', locale: 'fr', verse: '1-3', onClose: () => closed++, onChanged: () => changed++ })); });
  assert.equal(calls[0].path, '/bible-annotations/passage?locale=fr&passageId=JHN.1.1-3');
  assert.equal(renderer.root.findByType('TextInput').props.value, 'Synthetic private note');
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('Edited synthetic note'));
  await act(async () => button(renderer, 'Close').props.onPress());
  assert.equal(closed, 0);
  assert.equal(confirmation[0].style, 'cancel');
  await act(async () => button(renderer, 'Save verse').props.onPress());
  const payload = JSON.parse(calls.find(c => c.init.method === 'PUT').init.body);
  assert.deepEqual(payload, { passageId: 'JHN.1.1-3', locale: 'fr', bookmark: true, highlight: 'yellow', note: 'Edited synthetic note' });
  await act(async () => button(renderer, 'Delete saved verse').props.onPress());
  assert.equal(calls.filter(c => c.init.method === 'DELETE').length, 0);
  await act(async () => confirmation.find(b => b.style === 'destructive').onPress());
  assert.equal(calls.find(c => c.init.method === 'DELETE').path, '/bible-annotations/note-1');
  assert.equal(renderer.root.findByType('TextInput').props.value, '');
  assert.equal(changed, 2);
  await act(async () => renderer.unmount());
});

test('a missing exact annotation opens a new mobile note and saves it', async () => {
  let saved;
  const { AnnotationEditor } = load('../components/annotation-editor.tsx', {
    'react-native': { ...native, Platform: { OS: 'ios' }, Alert: {} },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en', t: copy.en }), useSession: () => session },
    '../lib/api': { requireToken: async read => read(), api: async (_path, _token, init = {}) => {
      if (!init.method) return { annotation: null };
      saved = JSON.parse(init.body);
      return { ...saved, id: 'new-note', bookmarked: saved.bookmark };
    } },
    '../lib/annotations': annotations, '../../web/lib/errors': { errorMessage }, '../../web/lib/scripture': scripture, './ui': ui,
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(AnnotationEditor, { chapterId: 'JHN.1', locale: 'en', verse: '1', onClose() {}, onChanged() {} })); });
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('New synthetic note'));
  await act(async () => button(renderer, 'Save verse').props.onPress());
  assert.equal(saved.note, 'New synthetic note');
  assert.equal(saved.passageId, 'JHN.1.1');
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 0);
  await act(async () => renderer.unmount());
});

test('an annotation read failure never exposes a blank form that could overwrite a saved note', async () => {
  let writes = 0;
  const { AnnotationEditor } = load('../components/annotation-editor.tsx', {
    'react-native': { ...native, Platform: { OS: 'ios' }, Alert: {} },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'fr', t: copy.fr }), useSession: () => session },
    '../lib/api': { api: async (_p, _t, init = {}) => { if (init.method) writes++; throw new Error('Unavailable'); }, requireToken: async read => read() },
    '../lib/annotations': annotations, '../../web/lib/errors': { errorMessage }, '../../web/lib/scripture': scripture, './ui': ui,
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(AnnotationEditor, { chapterId: 'JHN.1', locale: 'fr', verse: '1', onClose() {}, onChanged() {} })); });
  assert.equal(renderer.root.findAllByType('TextInput').length, 0);
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  assert.equal(writes, 0);
  await act(async () => renderer.unmount());
});

test('verse ranges label correctly and exact annotations take precedence over overlapping ranges', () => {
  assert.equal(scripture.passageLabel('JHN.1.1-3', 'en'), 'John 1:1–3');
  assert.equal(scripture.passageLabel('JHN.1.1-3', 'fr'), 'Jean 1:1–3');
  for (const value of ['1', '1-3', '150-200']) assert.equal(annotations.validVerseRange(value), true);
  for (const value of ['0', '1-52', '3-1', '201', '1a', '../x']) assert.equal(annotations.validVerseRange(value), false);
  const items = [{ passageId: 'JHN.1.1-3', note: 'range' }, { passageId: 'JHN.1.2', note: 'exact' }];
  assert.equal(annotations.annotationAt(items, 'JHN.1', '2').note, 'exact');
  assert.equal(annotations.annotationAt(items, 'JHN.1', '3').note, 'range');
  assert.equal(annotations.annotationAt(items, 'JHN.11', '3'), undefined);
});

function dailyHarness({ failInit = false, failStep = true, initialReflection = null } = {}) {
  let value = { id: 'session-1', journeyDate: '2026-10-19T00:00:00.000Z', status: 'IN_PROGRESS', steps: [{ step: 'UNDERSTAND' }, { step: 'MEDITATE' }], reflection: initialReflection ? { content: initialReflection } : null };
  const calls = [];
  let closed = 0;
  let confirmation;
  const controls = { failInit, failStep, failLive: false };
  const word = { verse: { text: 'Synthetic verse fixture', reference: 'JHN.1.1', translation: 'Fixture' }, explanation: 'Fixture', meditation: 'Fixture', reflectionQuestion: 'Reflect?', prayer: 'Pray', application: 'Live' };
  let live = { word, date: '2026-10-19', retry() {} };
  class Value { setValue() {} stopAnimation() {} interpolate() { return 0; } }
  const { default: PrayerTime } = load('../app/prayer-time.tsx', {
    'react-native': {
      ...native, Platform: { OS: 'ios' }, AccessibilityInfo: { isReduceMotionEnabled: async () => false },
      Animated: { Value, View: 'AnimatedView', timing: () => ({ start() {} }), multiply: () => 0 }, Easing: { bezier() {}, inOut() {}, sin() {} },
      BackHandler: { addEventListener: () => ({ remove() {} }) }, Alert: { alert: (_t, _m, buttons) => { confirmation = buttons; } },
    },
    'expo-router': { useFocusEffect: focus, useRouter: () => ({ back: () => closed++, navigate() {} }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }, '@expo/vector-icons': { Ionicons: 'Icon' },
    '../lib/app': {
      useApp: () => ({ c: {}, t: copy.en, lang: 'en', prefs: { length: 5 } }), useSession: () => session, useDailyWord: () => live, timezone: () => 'UTC',
      api: async (path, _token, init = {}) => {
        calls.push({ path, init });
        if (path.endsWith('/today')) { if (controls.failInit) throw new Error('Offline'); return value; }
        if (path.endsWith('/reflection')) { value = { ...value, reflection: init.method === 'DELETE' ? null : JSON.parse(init.body) }; return value.reflection; }
        if (controls.failStep || (controls.failLive && path.endsWith('/LIVE'))) throw new Error('Offline');
        const step = path.split('/').at(-1);
        const steps = [...value.steps.filter(item => item.step !== step), { step }];
        value = { ...value, steps, status: steps.length === 5 ? 'COMPLETED' : 'IN_PROGRESS' };
        return value;
      },
    },
    '../lib/api': { requireToken: async read => read() }, '../lib/theme': { fonts: {} }, '../components/ui': ui,
    '../../web/lib/daily-word-navigation': load('../../web/lib/daily-word-navigation.ts'), '../../web/lib/prayer-time': load('../../web/lib/prayer-time.ts'),
  });
  return { PrayerTime, calls, controls, get closed() { return closed; }, get confirmation() { return confirmation; }, advanceDate() { live = { ...live, word: { ...word, verse: { ...word.verse, text: 'New day fixture' } }, date: '2026-10-20' }; } };
}

test('Daily Word retries failed steps without losing or resaving a successful reflection', async () => {
  const h = dailyHarness();
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.PrayerTime)); });
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('Synthetic reflection draft'));
  await act(async () => button(renderer, copy.en.pt.next).props.onPress());
  assert.equal(renderer.root.findByType('TextInput').props.value, 'Synthetic reflection draft');
  assert.equal(h.calls.filter(c => c.path.endsWith('/reflection')).length, 1);
  h.controls.failStep = false;
  await act(async () => button(renderer, copy.en.pt.next).props.onPress());
  assert.equal(h.calls.filter(c => c.path.endsWith('/reflection')).length, 1, 'retry only the failed step');
  await act(async () => button(renderer, copy.en.pt.amen).props.onPress());
  h.controls.failLive = true;
  await act(async () => button(renderer, copy.en.pt.finish).props.onPress());
  assert.equal(button(renderer, copy.en.pt.home), undefined, 'failed final write must not show completion');
  h.controls.failLive = false;
  await act(async () => button(renderer, copy.en.pt.finish).props.onPress());
  assert.ok(button(renderer, copy.en.pt.home));
  await act(async () => renderer.unmount());
});

test('Daily Word blocks progress on session failure, guards drafts and keeps the opened passage across midnight', async () => {
  const h = dailyHarness({ failInit: true });
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.PrayerTime)); });
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  assert.equal(button(renderer, copy.en.pt.next), undefined);
  h.controls.failInit = false;
  await act(async () => renderer.root.findByType('ErrorLine').props.onRetry());
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('Keep this draft'));
  await act(async () => renderer.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === copy.en.pt.close).props.onPress());
  assert.equal(h.closed, 0);
  assert.equal(h.confirmation[0].style, 'cancel');
  const starts = h.calls.filter(c => c.path.endsWith('/today')).length;
  h.advanceDate();
  await act(async () => renderer.update(React.createElement(h.PrayerTime)));
  assert.equal(h.calls.filter(c => c.path.endsWith('/today')).length, starts);
  assert.equal(renderer.root.findByType('TextInput').props.value, 'Keep this draft');
  await act(async () => renderer.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel?.startsWith('1. ')).props.onPress());
  assert.ok(renderer.root.findAllByType('Text').some(node => node.props.children === 'Synthetic verse fixture'));
  assert.ok(!renderer.root.findAllByType('Text').some(node => node.props.children === 'New day fixture'));
  await act(async () => renderer.unmount());
});

test('clearing an existing Daily Word reflection deletes it before completing the step', async () => {
  const h = dailyHarness({ failStep: false, initialReflection: 'Old synthetic reflection' });
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.PrayerTime)); });
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText(''));
  await act(async () => button(renderer, copy.en.pt.next).props.onPress());
  const deletion = h.calls.find(c => c.path.endsWith('/reflection'));
  assert.equal(deletion.init.method, 'DELETE');
  assert.ok(h.calls.find(c => c.path.endsWith('/steps/REFLECT')));
  await act(async () => renderer.unmount());
});

test('saved verses open the matching chapter/language and can reopen the range editor', async () => {
  const record = { id: 'fixture-note', passageId: 'JHN.1.1-3', locale: 'fr', bookmarked: true, highlight: 'yellow', note: 'Synthetic note' };
  let preferences;
  let location;
  const { default: Saved } = load('../app/saved-verses.tsx', {
    'react-native': native,
    'expo-router': { useFocusEffect: focus, useRouter: () => ({ navigate: value => { location = value; } }) },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en', setPrefs: value => { preferences = value; } }), useSession: () => session },
    '../lib/api': { api: async () => [record], requireToken: async read => read() },
    '../components/annotation-editor': { AnnotationEditor: 'AnnotationEditor' }, '../components/ui': ui,
    '../../web/lib/scripture': scripture, '../../web/lib/errors': { errorMessage },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Saved)); });
  await act(async () => button(renderer, 'Read chapter').props.onPress());
  assert.equal(location, '/bible');
  assert.equal(preferences.chapterId, 'JHN.1');
  assert.equal(preferences.bibleLocale, 'fr');
  await act(async () => button(renderer, 'Edit saved verse').props.onPress());
  const editor = renderer.root.findByType('AnnotationEditor');
  assert.equal(editor.props.verse, '1-3');
  assert.equal(editor.props.locale, 'fr');
  await act(async () => renderer.unmount());
});

test('a partial Daily Word session does not claim all five steps are complete', async () => {
  const h = dailyHarness({ failStep: false });
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.PrayerTime)); });
  await act(async () => renderer.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel?.startsWith('5. ')).props.onPress());
  await act(async () => button(renderer, copy.en.pt.finish).props.onPress());
  assert.ok(button(renderer, copy.en.today.cont));
  assert.ok(renderer.root.findAllByType('Text').some(node => node.props.children === copy.en.pt.closingInProgress));
  assert.ok(!renderer.root.findAllByType('Text').some(node => node.props.children === copy.en.pt.closingText));
  await act(async () => renderer.unmount());
});

test('an unavailable progress read disables enrollment without hiding public plan readings', async () => {
  const plan = { id: 'fixture', title: 'Fixture plan', duration: 1, description: 'Fixture', days: [{ day: 1, chapterId: 'JHN.1' }] };
  const { default: Plans } = load('../app/reading-plans.tsx', {
    'react-native': native, 'expo-router': { useFocusEffect: focus, useRouter: () => ({ navigate() {} }) },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en', setPrefs() {} }), useSession: () => session },
    '../lib/api': { requireToken: async read => read(), api: async path => { if (path.includes('my-plans')) throw new Error('Offline'); return path.includes('/plans?') ? [plan] : plan; } },
    '../components/ui': ui, '../../web/lib/scripture': scripture, '../../web/lib/errors': { errorMessage },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Plans)); });
  await act(async () => renderer.root.findByType('Row').props.onPress());
  assert.equal(button(renderer, 'Start this plan').props.disabled, true);
  assert.equal(button(renderer, 'Read chapter').props.disabled, false);
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  await act(async () => renderer.unmount());
});

test('web annotation editor cannot overwrite an older note omitted by its capped list', async () => {
  const existing = { id: 'older-note', passageId: 'JHN.1.1', locale: 'en', bookmarked: true, highlight: 'blue', note: 'Existing synthetic note' };
  let writes = 0;
  let confirm = false;
  const auth = { isLoaded: true, isSignedIn: true, userId: 'fixture-user', getToken: async () => 'fixture-token' };
  const { AnnotationPanel } = load('../../web/components/bible/AnnotationPanel.tsx', {
    '@clerk/nextjs': { useAuth: () => auth }, 'next/link': { default: 'Link' },
    'lucide-react': { Bookmark: 'Icon', Highlighter: 'Icon', NotebookPen: 'Icon', Trash2: 'Icon' },
    '../../lib/api': { api: async (path, _token, init = {}) => {
      if (init.method === 'PUT') { writes++; const input = JSON.parse(init.body); return { ...existing, note: input.note }; }
      return path.includes('/passage?') ? { annotation: existing } : [];
    } }, '../../lib/errors': { errorMessage },
  }, { window: { confirm: () => confirm, addEventListener() {}, removeEventListener() {} }, document: { addEventListener() {}, removeEventListener() {} } });
  let renderer;
  await act(async () => { renderer = create(React.createElement(AnnotationPanel, { chapterId: 'JHN.1', locale: 'en', initialVerse: '1' })); });
  await act(async () => renderer.root.findByType('textarea').props.onChange({ target: { value: 'Unsaved synthetic draft' } }));
  await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  assert.equal(writes, 0);
  assert.equal(renderer.root.findByType('textarea').props.value, 'Unsaved synthetic draft');
  const loadSaved = () => renderer.root.findAllByType('button').find(node => node.props.children === 'Load saved version');
  await act(async () => loadSaved().props.onClick());
  assert.equal(renderer.root.findByType('textarea').props.value, 'Unsaved synthetic draft');
  confirm = true;
  await act(async () => loadSaved().props.onClick());
  assert.equal(renderer.root.findByType('textarea').props.value, 'Existing synthetic note');
  await act(async () => renderer.root.findByType('textarea').props.onChange({ target: { value: 'Updated synthetic note' } }));
  await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  assert.equal(writes, 1);
  await act(async () => renderer.unmount());
});
