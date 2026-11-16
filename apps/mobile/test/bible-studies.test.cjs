const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage } = require('./helpers.cjs');

const native = Object.fromEntries(['ActivityIndicator', 'Text', 'TextInput', 'View'].map(name => [name, name]));
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Press', 'Row', 'Screen', 'SectionLabel'].map(name => [name, name]));
const studies = load('../../web/lib/bible-studies.ts');
const lesson = (id, position, title) => ({ id, position, title, scriptureReference: 'Fixture 1:1', introduction: `${title} introduction`, historicalContext: null, exegesis: `${title} explanation`, theology: '', reflectionQuestions: ['A synthetic question?'], guidedPrayer: 'A synthetic prayer', application: null });
// Lessons arrive out of order to prove the reader sorts by position.
const series = { id: 'study-fixture', title: 'A synthetic study', description: 'Original fixture content', method: 'BOOK', lessons: [lesson('lesson-b', 2, 'Second lesson'), lesson('lesson-a', 1, 'First lesson')] };
const catalog = [
  { id: 'study-fixture', title: 'A synthetic study', description: 'Original fixture content', method: 'BOOK', difficulty: 'BEGINNER', _count: { lessons: 2 } },
  { id: 'study-two', title: 'Faith in practice', description: 'Another fixture', method: 'THEMATIC', difficulty: 'BEGINNER', _count: { lessons: 1 } },
];

function harness({ signedIn = true, failPrivate = false, items = catalog } = {}) {
  const app = { c: {}, lang: 'en' };
  const session = { isSignedIn: signedIn, userId: signedIn ? 'owner' : null, getToken: async () => 'fixture-token' };
  const controls = { failPrivate, failWrite: false };
  const writes = [];
  const reads = [];
  const server = { enrollments: [], completedLessonIds: [] };
  const { default: Screen } = load('../app/bible-studies.tsx', {
    'react-native': native,
    'expo-router': { useLocalSearchParams: () => ({}), useRouter: () => ({ navigate() {}, push() {} }), useFocusEffect: callback => React.useEffect(callback, [callback]) },
    '../lib/app': { useApp: () => app, useSession: () => session }, '../components/ui': ui,
    '../../web/lib/errors': { errorMessage }, '../../web/lib/bible-studies': studies,
    '../lib/api': { requireToken: async read => read(), api: async (endpoint, token, init = {}) => {
      if (init.method) {
        writes.push(endpoint);
        assert.equal(token, 'fixture-token');
        if (controls.failWrite) throw new Error('Offline');
        if (!server.enrollments.length) server.enrollments.push({ seriesId: series.id });
        const done = endpoint.match(/lessons\/([^/]+)\/complete$/);
        if (done) server.completedLessonIds.push(done[1]);
        return {};
      }
      reads.push(endpoint);
      if (endpoint === '/bible-studies/my-studies') { if (controls.failPrivate) throw new Error('Offline'); return structuredClone(server); }
      if (endpoint.startsWith('/bible-studies?')) return items;
      return series;
    } },
  });
  return { Screen, controls, writes, reads };
}
const texts = renderer => renderer.root.findAllByType('Text').map(n => [].concat(n.props.children).join(''));
const button = (renderer, title) => renderer.root.findAllByType('Button').find(b => b.props.title === title);
async function render(h) { let renderer; await act(async () => { renderer = create(React.createElement(h.Screen)); }); return renderer; }
async function open(h) {
  const renderer = await render(h);
  await act(async () => renderer.root.findAllByType('Row')[0].props.onPress());
  return renderer;
}

test('catalog requests the reader language and filters by study type and search without writing', async () => {
  const h = harness(); const renderer = await render(h);
  assert.equal(h.reads[0], '/bible-studies?locale=en');
  assert.equal(renderer.root.findAllByType('Row').length, 2);
  const chip = label => renderer.root.findAllByType('Press').find(p => p.props.accessibilityLabel === label);
  await act(async () => chip('Topics').props.onPress());
  assert.deepEqual(renderer.root.findAllByType('Row').map(r => r.props.title), ['Faith in practice']);
  assert.equal(chip('Topics').props.accessibilityState.checked, true);
  await act(async () => chip('All').props.onPress());
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('no such study'));
  assert.equal(renderer.root.findAllByType('Row').length, 0);
  assert.ok(texts(renderer).includes('No studies match'));
  await act(async () => button(renderer, 'Clear filters').props.onPress());
  assert.equal(renderer.root.findAllByType('Row').length, 2);
  assert.equal(h.writes.length, 0);
  await act(async () => renderer.unmount());
});

test('an empty library explains that studies are being prepared', async () => {
  const h = harness({ items: [] }); const renderer = await render(h);
  assert.ok(texts(renderer).includes('No published studies yet'));
  assert.ok(button(renderer, 'Reading plans'));
  await act(async () => renderer.unmount());
});

test('lessons open in order and progress is saved only by explicit, successful writes', async () => {
  const h = harness(); const renderer = await open(h);
  assert.ok(button(renderer, '1. First lesson'), 'lessons are sorted by position');
  assert.ok(texts(renderer).includes('First lesson introduction'));
  assert.equal(texts(renderer).includes('Theological understanding'), false, 'empty sections are omitted');
  assert.equal(h.writes.length, 0, 'opening a study must not write');

  await act(async () => button(renderer, 'Start this study').props.onPress());
  assert.deepEqual(h.writes, ['/bible-studies/study-fixture/enroll']);
  assert.equal(button(renderer, 'Start this study'), undefined);
  assert.ok(texts(renderer).includes('0 / 2 lessons completed'));

  h.controls.failWrite = true;
  await act(async () => button(renderer, 'Mark lesson complete').props.onPress());
  assert.ok(button(renderer, 'Mark lesson complete'), 'a failed write is not shown as completed');
  assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);

  h.controls.failWrite = false;
  await act(async () => button(renderer, 'Mark lesson complete').props.onPress());
  assert.equal(button(renderer, 'Lesson completed').props.disabled, true);
  assert.ok(texts(renderer).includes('1 / 2 lessons completed'));
  assert.ok(button(renderer, '1. First lesson · Completed'));

  await act(async () => button(renderer, '2. Second lesson').props.onPress());
  assert.ok(texts(renderer).includes('Second lesson introduction'));
  assert.equal(h.writes.length, 3, 'choosing another lesson must not write');
  assert.equal(h.writes[2], '/bible-studies/lessons/lesson-a/complete');
  await act(async () => renderer.unmount());
});

test('signed-out members can read every lesson; unavailable progress disables writes but keeps lessons readable', async () => {
  for (const config of [{ signedIn: false }, { failPrivate: true }]) {
    const h = harness(config); const renderer = await open(h);
    assert.ok(texts(renderer).includes('First lesson explanation'));
    if (config.signedIn === false) {
      assert.ok(button(renderer, 'Sign in from You to save progress'));
      assert.equal(h.reads.includes('/bible-studies/my-studies'), false, 'no private request without a session');
    } else {
      assert.equal(button(renderer, 'Mark lesson complete').props.disabled, true);
      assert.equal(button(renderer, 'Start this study').props.disabled, true);
      assert.equal(renderer.root.findAllByType('ErrorLine').length, 1);
    }
    assert.equal(h.writes.length, 0);
    await act(async () => renderer.unmount());
  }
});

test('shared study helpers reject unsafe ids and label every method in both languages', () => {
  for (const bad of ['../me', 'a/b', '', 'x'.repeat(65), 42, undefined]) assert.equal(studies.isStudyId(bad), false);
  assert.equal(studies.isStudyId('cm0abc_DEF-123'), true);
  for (const method of studies.STUDY_METHODS) { assert.ok(studies.methodLabel(method, 'en')); assert.ok(studies.methodLabel(method, 'fr')); }
  assert.equal(studies.methodLabel('UNKNOWN', 'fr'), 'Étude');
});
