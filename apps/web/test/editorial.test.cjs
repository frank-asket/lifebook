const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act } = require('../../mobile/test/helpers.cjs');
const library = load('../../web/lib/editorial.ts');
const starters = load('../../web/lib/editorial-starters.ts', { './editorial': library, '../../api/content/starter-meditations.json': require('../../api/content/starter-meditations.json') });

test('starter copy stays local and every EN/FR draft matches the validated editorial contract', () => {
  const { editorialInput } = require('../../api/dist/editorial/editorial-input');
  assert.equal(starters.meditationStarterCount, 7);
  for (const kind of ['meditations', 'studies', 'paths']) for (const locale of ['en', 'fr']) {
    for (let index = 0; index < (kind === 'meditations' ? 7 : 1); index++) {
      const draft = starters.starterDraft(kind, locale, index);
      const payload = library.editorialPayload(kind, draft, false, false);
      assert.equal(editorialInput(kind, payload).publish, false);
      assert.equal(payload.reviewConfirmed, false);
      assert.equal(payload.revision, undefined);
      assert.ok(draft.title && draft.slug.endsWith(locale));
      if (kind !== 'meditations') assert.equal(draft.lessons.length, 3);
      if (kind === 'paths') assert.equal(payload.locale, undefined, 'shared path model does not invent a locale field');
      if (kind === 'studies') assert.equal(payload.lessons[0].content, undefined, 'no unrelated lesson fields sent');
    }
  }
});

function setup({ failWrite = false, forbidden = false, savedRow = null } = {}) {
  const listeners = {}; class Element { closest() { return { href: 'https://example.test/dashboard', target: '', hasAttribute: () => false }; } }
  const calls = []; const token = async () => 'synthetic-token';
  const auth = { userId: 'synthetic-editor', isLoaded: true, isSignedIn: true, getToken: token };
  class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const api = async (path, received, options = {}) => {
    calls.push({ path, received, ...options });
    if (forbidden) throw new ApiError('Forbidden', 403);
    if (options.method && failWrite) throw new Error('Synthetic save failed');
    if (options.method) return { ...JSON.parse(options.body), id: 'saved', revision: 'b'.repeat(64), isPublished: false };
    if (savedRow && path.endsWith(`/${savedRow.id}`)) return savedRow;
    return savedRow ? [savedRow] : [];
  };
  const Page = load('../../web/app/editorial/page.tsx', {
    '@clerk/nextjs': { useAuth: () => auth }, 'next/link': { default: 'a' },
    '../../components/shell': { Shell: 'Shell' }, '../../components/language-provider': { useLanguage: () => ({ language: 'en' }) },
    '../../lib/api': { api, ApiError }, '../../lib/errors': { errorMessage: error => error.message }, '../../lib/editorial': library, '../../lib/editorial-starters': starters,
  }, { URL, Element, document: { addEventListener: (event, listener) => { listeners[event] = listener; }, removeEventListener() {} }, window: { location: new URL('https://example.test/editorial'), confirm: () => false, addEventListener() {}, removeEventListener() {} } }).default;
  return { Page, calls, listeners, Element };
}
const button = (renderer, text) => renderer.root.findAllByType('button').find(node => node.props.children === text);

test('editorial UI requires review, resets it after edits and preserves a failed-save draft', async () => {
  const { Page, calls, listeners, Element } = setup({ failWrite: true }); let renderer;
  await act(async () => { renderer = create(React.createElement(Page)); });
  await act(async () => button(renderer, 'Load English draft').props.onClick());
  assert.equal(calls.filter(call => call.method).length, 0, 'loading starter copy never writes');
  let prevented = false; listeners.click({ button: 0, target: new Element(), preventDefault: () => { prevented = true; }, stopPropagation() {} });
  assert.equal(prevented, true, 'sidebar navigation cannot silently discard a dirty draft');
  assert.equal(button(renderer, 'Save and publish').props.disabled, true);
  await act(async () => renderer.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: true } }));
  assert.equal(button(renderer, 'Save and publish').props.disabled, false);
  const title = renderer.root.findAllByType('input').find(node => node.props.maxLength === 200);
  await act(async () => title.props.onChange({ target: { value: 'My edited draft' } }));
  assert.equal(button(renderer, 'Save and publish').props.disabled, true);
  await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  assert.equal(renderer.root.findAllByType('input').find(node => node.props.maxLength === 200).props.value, 'My edited draft');
  assert.equal(JSON.parse(calls.find(call => call.method).body).publish, false);
  assert.match(JSON.stringify(renderer.toJSON()), /Synthetic save failed/);
  await act(async () => button(renderer, 'Bible Studies').props.onClick());
  assert.match(JSON.stringify(renderer.toJSON()), /My edited draft/, 'cancelled discard keeps the current draft');
  await act(async () => renderer.unmount());
});

test('ordinary members get a role explanation and no authoring form', async () => {
  const { Page } = setup({ forbidden: true }); let renderer;
  await act(async () => { renderer = create(React.createElement(Page)); });
  assert.equal(renderer.root.findAllByType('form').length, 0);
  assert.match(JSON.stringify(renderer.toJSON()), /moderators and administrators/);
  await act(async () => renderer.unmount());
});


test('successful path publication forwards loaded revision and stable lesson IDs', async () => {
  const savedRow = { id: 'existing-path', revision: 'a'.repeat(64), slug: 'existing-path', title: 'Existing path', description: 'Description', isPublished: false, lessons: [{ id: 'existing-lesson', title: 'Existing lesson', content: 'Content', position: 1 }] };
  const { Page, calls } = setup({ savedRow }); let renderer;
  await act(async () => { renderer = create(React.createElement(Page)); });
  await act(async () => button(renderer, 'Learning paths').props.onClick());
  await act(async () => button(renderer, 'Edit').props.onClick());
  await act(async () => renderer.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: true } }));
  await act(async () => button(renderer, 'Save and publish').props.onClick());
  const write = calls.find(call => call.method); const payload = JSON.parse(write.body);
  assert.equal(write.method, 'PUT'); assert.equal(write.path, '/editorial/paths/existing-path');
  assert.equal(payload.revision, savedRow.revision); assert.equal(payload.lessons[0].id, 'existing-lesson');
  assert.equal(payload.publish, true); assert.equal(payload.reviewConfirmed, true);
  assert.match(JSON.stringify(renderer.toJSON()), /Publication saved/);
  await act(async () => renderer.unmount());
});
