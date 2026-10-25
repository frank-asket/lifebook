const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, copy } = require('./helpers.cjs');
const native = Object.fromEntries(['Pressable', 'ScrollView', 'Text', 'View', 'ActivityIndicator', 'FlatList'].map(name => [name, name]));

function uiHarness() {
  let fontScale = 1;
  const ui = load('../components/ui.tsx', {
    'react-native': { ...native, Platform: { OS: 'ios' }, useWindowDimensions: () => ({ width: 320, fontScale }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 34, left: 0, right: 0 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '../lib/app': { useApp: () => ({ c: {}, t: copy.en }) },
  });
  return { ...ui, setFontScale(value) { fontScale = value; } };
}

test('shared controls keep motion still, expose meaningful labels and adapt to enlarged text', async () => {
  const h = uiHarness();
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.Row, { icon: 'book', title: 'Read the Bible', subtitle: 'Continue John 1', onPress() {} })); });
  const press = renderer.root.findByType('Pressable');
  assert.equal(press.props.accessibilityLabel, 'Read the Bible, Continue John 1');
  const feedback = press.props.style({ pressed: true });
  assert.equal(feedback[0].minHeight, 48);
  assert.ok(feedback.every(style => !style || !style.transform));
  assert.ok(renderer.root.findAllByType('Icon').every(icon => icon.props.accessible === false));
  h.setFontScale(2);
  await act(async () => renderer.update(React.createElement(h.Row, { icon: 'book', title: 'Commencez votre journal de prière', onPress() {} })));
  assert.equal(renderer.root.findAllByType('Icon').length, 0, 'decorative icons must leave the full row width for enlarged text');
  assert.equal(renderer.root.findByType('Pressable').props.accessibilityLabel, 'Commencez votre journal de prière');
  h.setFontScale(1);
  const choices = { label: 'Appearance', value: 'system', onChange() {}, options: [{ label: 'System', value: 'system' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }] };
  await act(async () => renderer.update(React.createElement(h.Segmented, choices)));
  assert.equal(renderer.root.findByType('View').props.style.flexDirection, 'row');
  h.setFontScale(2);
  await act(async () => renderer.update(React.createElement(h.Segmented, choices)));
  assert.equal(renderer.root.findByType('View').props.style.flexDirection, 'column');
  assert.ok(renderer.root.findAllByType('Pressable').every(p => p.props.style.minHeight >= 48));
  assert.equal(renderer.root.findAllByType('Pressable')[0].props.accessibilityState.checked, true);
  await act(async () => renderer.update(React.createElement(h.Screen, { title: 'Settings' }, 'Content')));
  assert.equal(renderer.root.findByType('ScrollView').props.contentContainerStyle.paddingBottom, 66);
  assert.equal(renderer.root.findByType('ScrollView').props.contentContainerStyle.maxWidth, 760);
  await act(async () => renderer.unmount());
});

test('chapter picker retries a failed chapter request and sizes its grid for enlarged text', async () => {
  let requests = 0;
  const paths = [];
  const { default: Books } = load('../app/books.tsx', {
    'react-native': { ...native, useWindowDimensions: () => ({ width: 320, fontScale: 2 }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 34, left: 0, right: 0 }) },
    'expo-router': { useRouter: () => ({ back() {} }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '../components/ui': { ErrorLine: 'ErrorLine' },
    '../../web/lib/bible-versions': load('../../web/lib/bible-versions.ts'),
    '../lib/app': { useApp: () => ({ c: {}, t: copy.en, prefs: { chapterId: 'JHN.1', bibleVersions: { en: 'nkjv' } }, setPrefs() {}, bibleLocale: 'en' }), api: async path => {
      paths.push(path);
      if (path.includes('/chapters')) { requests++; if (requests === 1) throw new Error('offline'); return { data: [{ id: 'JHN.1', number: '1' }] }; }
      return { data: [{ id: 'JHN', name: 'John' }] };
    } },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Books)); });
  const row = renderer.root.findByType('FlatList').props.renderItem({ item: { id: 'JHN', name: 'John' } });
  await act(async () => row.props.onPress());
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  await act(async () => renderer.root.findByType('ErrorLine').props.onRetry());
  assert.equal(requests, 2);
  // Books and chapters come from the version chosen for this language.
  assert.ok(paths.length && paths.every(path => path.includes('locale=en&version=nkjv')));
  const list = renderer.root.findByType('FlatList');
  assert.equal(list.props.numColumns, 3);
  const cell = list.props.renderItem({ item: { id: 'JHN.1', number: '1' } });
  assert.ok(cell.props.style({ pressed: false }).minHeight >= 96);
  assert.equal(cell.props.accessibilityState.selected, true);
  await act(async () => renderer.unmount());
});

test('Today rebuilds only the display grid when font scale changes', async () => {
  let fontScale = 1;
  const session = { isSignedIn: true, getToken: async () => 'synthetic' };
  const days = Array.from({ length: 7 }, (_, i) => ({ date: `day-${i}`, name: `Day ${i}`, label: String(i), state: 'none' }));
  const { default: Today } = load('../app/(tabs)/index.tsx', {
    'react-native': { ...native, useWindowDimensions: () => ({ fontScale }) },
    'expo-router': { useFocusEffect: callback => React.useEffect(callback, [callback]), useRouter: () => ({}) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '../../components/suggestions': { Suggestions: 'Suggestions' },
    '../../components/ui': Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen'].map(name => [name, name])),
    '../../lib/app': {
      useApp: () => ({ c: {}, t: copy.en, lang: 'en', prefs: { length: 5 } }),
      useDailyWord: () => ({ date: '2026-10-24' }), useSession: () => session, timezone: () => 'UTC',
      api: async url => url.includes('?limit=7') ? [] : null,
    },
    '../../lib/theme': { fonts: {} }, '../../lib/scripture-usage': { reportScripture() {} },
    '../../../web/lib/scripture': { calendarDay: () => 'Today', lastSevenDays: () => days },
    '../../../web/lib/daily-word-navigation': { DAILY_WORD_STEPS: [] },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Today)); });
  let previousGrid;
  let previousScale;
  const screen = renderer.root.findByType('Screen');
  for (const scale of [1, 3.571, 1.5, 1]) {
    fontScale = scale;
    await act(() => renderer.update(React.createElement(Today)));
    const cells = renderer.root.findAllByType('View').filter(view => view.props.accessibilityLabel?.startsWith('Day '));
    assert.equal(cells.length, 7);
    const grid = cells[0].parent;
    assert.equal(renderer.root.findByType('Screen'), screen, 'the screen and its state must stay mounted');
    if (previousGrid && previousScale !== scale) assert.notEqual(grid, previousGrid, 'old native measurements must not be reused');
    for (const cell of cells) {
      assert.equal(cell.props.style.flex, scale > 1.3 ? undefined : 1);
      assert.equal(cell.props.style.width, scale > 2 ? '50%' : scale > 1.3 ? '33.333%' : undefined);
    }
    previousGrid = grid;
    previousScale = scale;
  }
  await act(() => renderer.unmount());
});

test('app motion preferences follow OS changes and remove the subscription on unmount', async () => {
  let listener;
  let removed = false;
  const app = load('../lib/app.tsx', {
    'react-native': { useColorScheme: () => 'light', AccessibilityInfo: { isReduceMotionEnabled: async () => false, addEventListener: (name, callback) => { assert.equal(name, 'reduceMotionChanged'); listener = callback; return { remove() { removed = true; } }; } } },
    'expo-secure-store': { getItemAsync: async () => null }, './copy': { copy }, './theme': { palettes: { light: {}, dark: {} } },
    '../../web/lib/reader-settings': { DEFAULT_READER: {}, parseReaderSettings() {} }, '../../web/lib/prayer-time': { parseLength() {} },
    '../../web/lib/bible-versions': { parseVersionChoice: () => ({}) },
    '../../web/lib/daily-word': { dailyWordDate() {} }, './api': { api() {} },
  });
  const Probe = () => React.createElement('Probe', { reduceMotion: app.useApp().reduceMotion });
  let renderer;
  await act(async () => { renderer = create(React.createElement(app.AppProvider, null, React.createElement(Probe))); });
  assert.equal(renderer.root.findByType('Probe').props.reduceMotion, false);
  await act(async () => listener(true));
  assert.equal(renderer.root.findByType('Probe').props.reduceMotion, true);
  await act(async () => renderer.unmount());
  assert.equal(removed, true);
});

test('failed sign-out keeps the account screen available and offers a retry', async () => {
  const session = { isSignedIn: true, firstName: 'Test member', getToken: async () => 'synthetic', signOut: async () => { throw new Error('synthetic failure'); } };
  const appState = { c: {}, t: copy.en, lang: 'en', prefs: { appearance: 'system', length: 5 }, setPrefs() {} };
  const { default: You } = load('../app/(tabs)/you.tsx', {
    'react-native': native,
    'expo-router': { useFocusEffect: callback => React.useEffect(callback, [callback]), useRouter: () => ({ push() {} }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '../../lib/app': { useApp: () => appState, useSession: () => session },
    '../../lib/api': { requireToken: async read => read(), api: async () => ({ profile: { language: 'en' } }) },
    '../../components/ui': Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen', 'SectionLabel', 'Segmented'].map(name => [name, name])),
    '../../../web/lib/errors': { errorMessage: () => 'Synthetic failure' }, '../../../web/lib/prayer-time': { PRAYER_LENGTHS: [2, 5, 10] },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(You)); });
  const signOut = () => renderer.root.findAllByType('Button').find(b => b.props.title === copy.en.you.signOut);
  // The UI callback intentionally returns void; act also flushes its async failure state.
  await act(async () => { signOut().props.onPress(); });
  assert.equal(signOut().props.disabled, false);
  assert.ok(renderer.root.findAllByType('Text').some(n => n.props.accessibilityRole === 'alert' && String(n.props.children).includes('Sign-out failed')));
  await act(async () => renderer.unmount());
});

test('reading settings can scroll to every control and respect the home indicator', async () => {
  const patches = [];
  const { default: Settings } = load('../app/reader-settings.tsx', {
    'react-native': native, 'expo-router': { useRouter: () => ({ back() {} }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 34 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' }, '../lib/scripture-usage': { reportScripture() {} },
    '../../web/lib/bible-versions': load('../../web/lib/bible-versions.ts'),
    '../lib/app': { api: async () => { throw new Error('public-domain previews are quoted, not fetched'); }, useApp: () => ({ c: {}, t: copy.en, prefs: { reader: { size: 'm', spacing: 'normal', font: 'serif' }, bibleVersions: {} }, setPrefs: patch => patches.push(patch), bibleLocale: 'en' }) },
    '../lib/theme': { fonts: { serif: 'Georgia' } }, '../components/ui': { Segmented: 'Segmented' },
    '../../web/lib/reader-settings': load('../../web/lib/reader-settings.ts'),
    '../lib/reader-style': load('../lib/reader-style.ts', { './theme': { fonts: { serif: 'Georgia' } } }),
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Settings)); });
  assert.equal(renderer.root.findByType('ScrollView').props.contentContainerStyle.paddingBottom, 58);
  // The live preview shows the reader's text in the reader's own size, spacing and typeface.
  const preview = renderer.root.findAllByType('Text').find(t => t.props.children === 'Thy word is a lamp unto my feet, and a light unto my path.');
  assert.ok(preview, 'preview verse is shown');
  assert.equal(preview.props.style.fontSize, 19); assert.equal(preview.props.style.lineHeight, Math.round(19 * 1.8)); assert.equal(preview.props.style.fontFamily, 'Georgia');
  assert.equal(renderer.root.findAllByType('Segmented').length, 3);
  // Every English version is offered, the default is checked, and choosing one is remembered for English only.
  const versions = renderer.root.findAllByType('Pressable').filter(p => p.props.accessibilityRole === 'radio');
  assert.equal(versions.map(v => v.props.accessibilityLabel).join(', '), ['King James Version', 'Berean Standard Bible', 'World English Bible', 'New King James Version', 'Good News Translation'].join(', '));
  assert.equal(versions[0].props.accessibilityState.checked, true);
  await act(async () => versions[1].props.onPress());
  assert.equal(JSON.stringify(patches), JSON.stringify([{ bibleVersions: { en: 'bsb' } }]));
  assert.ok(renderer.root.findAllByType('Pressable').every(p => {
    const style = typeof p.props.style === 'function' ? p.props.style({ pressed: false }) : p.props.style;
    return style.minHeight >= 48;
  }));
  await act(async () => renderer.unmount());
});

test('mobile text colours meet normal-text contrast in both themes and Android uses a native serif', () => {
  const { palettes, fonts } = load('../lib/theme.ts', { 'react-native': { Platform: { OS: 'android' } } });
  assert.equal(fonts.serif, 'serif');
  const luminance = hex => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const c of Object.values(palettes)) {
    for (const [foreground, background] of [['ink', 'bg'], ['ink', 'paper'], ['muted', 'paper'], ['muted', 'bg'], ['deep', 'soft'], ['accentInk', 'accent'], ['accentInk', 'danger']]) {
      const values = [luminance(c[foreground]), luminance(c[background])].sort((a, b) => b - a);
      assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `${foreground} on ${background}`);
    }
  }
});
