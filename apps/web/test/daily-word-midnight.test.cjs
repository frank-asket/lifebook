const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act } = require('../../mobile/test/helpers.cjs');

test('an open web prayer keeps its word, session and unsaved reflection across midnight', async () => {
  const state = { date: '2026-10-25', word: { date: '2026-10-25', explanation: 'Original word', verse: { text: 'Original verse', reference: 'Fixture', translation: 'Fixture' } }, loading: false };
  const auth = { getToken: async () => 'fixture', isLoaded: true, isSignedIn: true, userId: 'fixture-user' };
  const calls = [];
  const navigation = load('../../web/lib/daily-word-navigation.ts');
  const prayerTime = load('../../web/lib/prayer-time.ts');
  const { default: Page } = load('../../web/app/daily-word/page.tsx', {
    'next/link': { default: 'a' }, '@clerk/nextjs': { useAuth: () => auth }, 'lucide-react': { ArrowRight: 'ArrowRight', Check: 'Check' },
    '../../components/language-provider': { useLanguage: () => ({ language: 'en' }) },
    '../../components/daily-word-provider': { useDailyWord: () => ({ ...state, retry() {} }) },
    '../../components/shell': { Shell: 'Shell' }, '../../components/daily-word/PrayerTime': { PrayerTime: 'PrayerTime' },
    '../../lib/api': { api: async url => { calls.push(url); return { id: 'original-session', journeyDate: `${state.date}T00:00:00.000Z`, status: 'IN_PROGRESS', steps: [], reflection: null }; } },
    '../../lib/daily-word-navigation': navigation, '../../lib/prayer-time': prayerTime,
    '../../lib/scripture': { calendarDay: date => date }, '../../lib/errors': { errorMessage: e => e.message }, '../../lib/fums': { reportScripture() {} },
  }, { URLSearchParams, Intl, localStorage: { getItem: () => null }, window: { location: { search: '' }, history: { replaceState() {} } } });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Page)); });
  const begin = renderer.root.findAllByType('button').find(node => node.props.className?.includes('btn-primary'));
  assert.ok(begin);
  await act(async () => begin.props.onClick());
  await act(async () => renderer.root.findByType('PrayerTime').props.onReflection('A private unsaved draft'));
  state.date = '2026-10-26'; state.word = null; state.loading = true;
  await act(async () => renderer.update(React.createElement(Page)));
  assert.equal(renderer.root.findByType('PrayerTime').props.reflection, 'A private unsaved draft');
  assert.equal(renderer.root.findByType('PrayerTime').props.word.verse.text, 'Original verse');
  state.word = { ...state.word, date: '2026-10-26', verse: { text: 'New verse' } }; state.loading = false;
  await act(async () => renderer.update(React.createElement(Page)));
  assert.equal(renderer.root.findByType('PrayerTime').props.word.verse.text, 'Original verse');
  assert.equal(calls.length, 1, 'midnight does not replace the active session');
  await act(async () => renderer.root.findByType('PrayerTime').props.onClose());
  assert.equal(calls.length, 2, 'returning to the overview loads the new day');
  await act(async () => renderer.unmount());
});

for (const replacement of ['day', 'account']) for (const pendingSave of ['step', 'reflection']) test(`a deferred ${pendingSave} save cannot overwrite a replacement ${replacement}'s session or draft`, async () => {
  const state = { date: '2026-10-25', word: { date: '2026-10-25', explanation: 'Word', verse: { text: 'Verse', reference: 'Fixture', translation: 'Fixture' } } };
  const auth = { getToken: async () => 'fixture', isLoaded: true, isSignedIn: true, userId: 'fixture-user' };
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const writes = [];
  const session = () => ({ id: `session-${state.date}`, journeyDate: `${state.date}T00:00:00.000Z`, status: 'IN_PROGRESS', steps: [], reflection: null });
  const { default: Page } = load('../../web/app/daily-word/page.tsx', {
    'next/link': { default: 'a' }, '@clerk/nextjs': { useAuth: () => auth }, 'lucide-react': { ArrowRight: 'ArrowRight', Check: 'Check' },
    '../../components/language-provider': { useLanguage: () => ({ language: 'en' }) },
    '../../components/daily-word-provider': { useDailyWord: () => ({ ...state, retry() {} }) },
    '../../components/shell': { Shell: 'Shell' }, '../../components/daily-word/PrayerTime': { PrayerTime: 'PrayerTime' },
    '../../lib/api': { api: async (url, token, options) => {
      if (options.method === 'POST') return session();
      writes.push(url);
      await held;
      return { id: 'session-2026-10-25', journeyDate: '2026-10-25T00:00:00.000Z', status: 'IN_PROGRESS', steps: [{ step: 'UNDERSTAND' }], reflection: null };
    } },
    '../../lib/daily-word-navigation': load('../../web/lib/daily-word-navigation.ts'), '../../lib/prayer-time': load('../../web/lib/prayer-time.ts'),
    '../../lib/scripture': { calendarDay: date => date }, '../../lib/errors': { errorMessage: e => e.message }, '../../lib/fums': { reportScripture() {} },
  }, { URLSearchParams, Intl, localStorage: { getItem: () => null }, window: { location: { search: '' }, history: { replaceState() {} } } });
  let renderer;
  const prayer = () => renderer.root.findByType('PrayerTime');
  const begin = () => renderer.root.findAllByType('button').find(node => node.props.className?.includes('btn-primary')).props.onClick();
  await act(async () => { renderer = create(React.createElement(Page)); });
  await act(async () => begin());
  if (pendingSave === 'reflection') {
    await act(async () => prayer().props.onGoTo(2));
    await act(async () => prayer().props.onReflection('Yesterday unsaved'));
  }
  await act(async () => prayer().props.onContinue());
  assert.equal(writes.length, 1);
  if (replacement === 'day') { state.date = '2026-10-26'; state.word = { ...state.word, date: state.date }; }
  else auth.userId = 'replacement-account';
  await act(async () => renderer.update(React.createElement(Page)));
  await act(async () => prayer().props.onClose());
  await act(async () => begin());
  await act(async () => prayer().props.onReflection('Today private draft'));
  await act(async () => release());
  assert.equal(prayer().props.step, 0, 'old reflection completion cannot navigate the new journey');
  assert.deepEqual(Array.from(prayer().props.done), [false, false, false, false, false], 'old progress cannot merge into today');
  assert.equal(prayer().props.reflection, 'Today private draft');
  assert.equal(prayer().props.reflectionDirty, true, 'old response cannot replace saved reflection metadata');
  assert.equal(prayer().props.busy, false);
  assert.equal(writes.length, 1, 'old reflection completion cannot submit another step');
  await act(async () => renderer.unmount());
});
