const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage } = require('./helpers.cjs');
const native = Object.fromEntries(['ActivityIndicator', 'Text'].map(name => [name, name]));
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen'].map(name => [name, name]));
const path = { id: 'path-fixture', slug: 'fixture', title: 'A synthetic pathway', description: 'Original content', lessons: [{ id: 'lesson-a', title: 'First lesson', position: 1, content: 'Published lesson content' }, { id: 'lesson-b', title: 'Second lesson', position: 2, content: 'Another lesson' }] };
function harness({ signedIn = true, failRead = false } = {}) {
  const app = { c: {}, lang: 'en' };
  const session = { isSignedIn: signedIn, userId: signedIn ? 'owner' : null, getToken: async () => 'fixture-token' };
  let enrollment = null;
  const controls = { failRead, failWrite: false };
  const writes = [];
  const { default: Journey } = load('../app/discipleship.tsx', {
    'react-native': native,
    'expo-router': { useRouter: () => ({ navigate() {}, push() {} }), useFocusEffect: callback => React.useEffect(callback, [callback]) },
    '../lib/app': { useApp: () => app, useSession: () => session }, '../components/ui': ui,
    '../../web/lib/errors': { errorMessage }, '../../web/lib/learning-paths': load('../../web/lib/learning-paths.ts'),
    '../lib/api': { requireToken: async read => read(), api: async (endpoint, _token, init = {}) => {
      if (init.method) {
        writes.push(endpoint);
        if (controls.failWrite) throw new Error('Offline');
        enrollment = endpoint.endsWith('/enroll') ? { id: 'enrollment', startedAt: '2026-10-19', completions: [] } : { ...enrollment, completions: [{ lessonId: 'lesson-a', completedAt: '2026-10-19' }] };
        return { enrollment };
      }
      if (endpoint.endsWith('/state')) { if (controls.failRead) throw new Error('Offline'); return { enrollment }; }
      return endpoint === '/paths' ? [path] : path;
    } },
  });
  return { Journey, controls, writes };
}
const button = (renderer, title) => renderer.root.findAllByType('Button').find(b => b.props.title === title);
async function open(h) {
  let renderer;
  await act(async () => { renderer = create(React.createElement(h.Journey)); });
  await act(async () => renderer.root.findByType('Row').props.onPress());
  return renderer;
}
test('mobile journey enrollment and explicit completion persist only after successful writes', async () => {
  const h = harness(); const renderer = await open(h);
  assert.equal(h.writes.length, 0);
  await act(async () => button(renderer, 'Start this pathway').props.onPress());
  assert.ok(button(renderer, 'Mark lesson complete'));
  h.controls.failWrite = true;
  await act(async () => button(renderer, 'Mark lesson complete').props.onPress());
  assert.ok(button(renderer, 'Mark lesson complete'));
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
  h.controls.failWrite = false;
  await act(async () => button(renderer, 'Mark lesson complete').props.onPress());
  assert.equal(button(renderer, 'Lesson completed').props.disabled, true);
  await act(async () => button(renderer, '2. Second lesson').props.onPress());
  assert.equal(h.writes.length, 3, 'opening another lesson must not write');
  await act(async () => renderer.unmount());
});
test('failed private progress disables writes without hiding public lessons; signed-out reading remains available', async () => {
  for (const config of [{ failRead: true }, { signedIn: false }]) {
    const h = harness(config); const renderer = await open(h);
    assert.ok(renderer.root.findAllByType('Text').some(n => n.props.children === 'Published lesson content'));
    if (config.failRead) assert.equal(button(renderer, 'Start this pathway').props.disabled, true);
    else assert.ok(button(renderer, 'Sign in from You to save progress'));
    assert.equal(h.writes.length, 0);
    await act(async () => renderer.unmount());
  }
});

test('web journey opens lessons without writes and resets private progress on account changes', async () => {
  const auth = { isLoaded: true, isSignedIn: true, userId: 'member-a', getToken: async () => 'fixture' };
  let enrollment = null;
  const writes = [];
  const { default: Page } = load('../../web/app/discipleship/[id]/page.tsx', {
    'next/navigation': { useParams: () => ({ id: path.id }) }, 'next/link': { default: 'a' }, '@clerk/nextjs': { useAuth: () => auth },
    '../../../components/shell': { Shell: 'Shell' }, '../../../components/language-provider': { useLanguage: () => ({ language: 'en' }) },
    '../../../lib/errors': { errorMessage }, '../../../lib/learning-paths': load('../../web/lib/learning-paths.ts'),
    '../../../lib/api': { api: async (endpoint, _token, init = {}) => {
      if (init.method) { writes.push(endpoint); enrollment = endpoint.endsWith('/enroll') ? { id: 'enrollment-a', completions: [] } : { ...enrollment, completions: [{ lessonId: 'lesson-a', completedAt: '2026-10-19' }] }; return { enrollment }; }
      if (endpoint.endsWith('/state')) return { enrollment: auth.userId === 'member-a' ? enrollment : null };
      return path;
    } },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Page)); });
  const find = title => renderer.root.findAllByType('button').find(b => b.props.children === title);
  assert.equal(writes.length, 0);
  await act(async () => find('Start this pathway').props.onClick());
  await act(async () => find('Mark lesson complete').props.onClick());
  assert.equal(find('Lesson completed').props.disabled, true);
  auth.userId = 'member-b';
  await act(async () => renderer.update(React.createElement(Page)));
  assert.ok(find('Start this pathway'));
  assert.equal(find('Lesson completed'), undefined);
  assert.equal(writes.length, 2);
  await act(async () => renderer.unmount());
});
