const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage } = require('./helpers.cjs');
const native = Object.fromEntries(['ActivityIndicator', 'Text', 'TextInput', 'View'].map(n => [n, n]));
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen'].map(n => [n, n]));
const button = (renderer, title) => renderer.root.findAllByType('Button').find(b => b.props.title === title);
function harness() {
  const app = { c: {}, lang: 'en' }; const calls = []; let plays = 0; let pauses = 0;
  const controls = { error: null, loaded: true };
  const player = { pause() { pauses++; }, play() { plays++; }, seekTo: async () => {} };
  const item = { id: 'synthetic-teaching', title: 'Synthetic teaching', speaker: 'Synthetic teacher', kind: 'audio', locale: 'en', mediaUrl: 'https://media.example.invalid/a.mp3', attribution: 'Synthetic credit', transcript: 'Synthetic accessible transcript', description: null };
  const { default: Library } = load('../app/livingword.tsx', {
    'react-native': native, 'expo': { useEvent: () => ({ status: 'readyToPlay' }) },
    'expo-router': { useLocalSearchParams: () => ({}), useRouter: () => ({ navigate() {} }), useFocusEffect: callback => React.useEffect(callback, [callback]) },
    'expo-audio': { useAudioPlayer: () => player, useAudioPlayerStatus: () => ({ isLoaded: controls.loaded, error: controls.error, isBuffering: false, playing: false, currentTime: 0, duration: 60 }) },
    'expo-video': { useVideoPlayer: () => player, VideoView: 'VideoView' }, '../lib/app': { useApp: () => app }, '../components/ui': ui, '../../web/lib/errors': { errorMessage },
    '../lib/api': { api: async path => { calls.push(path); return path.includes('?') ? { items: path.includes('q=missing') ? [] : [item], total: 1, page: 1, pageSize: 20 } : item; } },
  });
  return { Library, calls, controls, get plays() { return plays; }, get pauses() { return pauses; } };
}
test('native LivingWord searches, reads transcripts and starts playback only on explicit press', async () => {
  const h = harness(); let renderer;
  await act(async () => { renderer = create(React.createElement(h.Library)); });
  assert.equal(h.plays, 0);
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('missing'));
  await act(async () => button(renderer, 'Search').props.onPress());
  assert.ok(h.calls.at(-1).includes('q=missing'));
  assert.equal(renderer.root.findAllByType('Row').length, 0);
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText(''));
  await act(async () => button(renderer, 'Search').props.onPress());
  await act(async () => renderer.root.findByType('Row').props.onPress());
  assert.equal(h.plays, 0);
  assert.ok(renderer.root.findAllByType('Text').some(t => t.props.children === 'Synthetic accessible transcript'));
  await act(async () => button(renderer, 'Play audio').props.onPress());
  assert.equal(h.plays, 1);
  await act(async () => button(renderer, 'All teachings').props.onPress());
  assert.ok(h.pauses > 0, 'leaving the player pauses it');
  await act(async () => renderer.unmount());
});
