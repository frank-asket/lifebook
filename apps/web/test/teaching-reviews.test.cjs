const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act } = require('../../mobile/test/helpers.cjs');
const library = load('../../web/lib/teaching-reviews.ts');
const row = { id: 'review', sourceUrl: 'https://www.youtube.com/watch?v=AbCdEf12345', channelId: 'UC' + 'a'.repeat(22), title: 'Original review', speaker: '', attribution: '', rightsReference: '', reviewNotes: '', locale: 'en', revision: 1, creatorId: 'editor', updatedById: 'editor', createdAt: '', updatedAt: '' };
function setup(mode = '') {
  const calls = []; const token = async () => 'synthetic-editor';
  class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const Page = load('../../web/app/editorial/teaching-reviews/page.tsx', {
    '@clerk/nextjs': { useAuth: () => ({ userId: 'editor', isLoaded: true, isSignedIn: true, getToken: token }) },
    'next/link': { default: 'a' }, '../../../components/shell': { Shell: 'Shell' }, '../../../components/language-provider': { useLanguage: () => ({ language: 'en' }) },
    '../../../lib/teaching-reviews': library, '../../../lib/errors': { errorMessage: error => error.message },
    '../../../lib/api': { ApiError, api: async (path, received, options = {}) => { calls.push({ path, ...options }); if (mode === 'forbidden') throw new ApiError('Forbidden', 403); if (options.method) { if (mode === 'conflict') throw new ApiError('This review changed', 409); return { ...row, ...JSON.parse(options.body), revision: 2 }; } return [row]; } },
  }, { Element: class {}, document: { addEventListener() {}, removeEventListener() {} }, window: { confirm: () => false, addEventListener() {}, removeEventListener() {} } }).default;
  return { Page, calls };
}
test('review notes send only editable fields and revision; conflict keeps the unsaved draft', async () => {
  for (const mode of ['', 'conflict']) {
    const { Page, calls } = setup(mode); let renderer;
    await act(async () => { renderer = create(React.createElement(Page)); });
    assert.equal(calls.length, 1); assert.equal(calls[0].method, undefined);
    await act(async () => renderer.root.findAllByType('button').find(node => node.props['aria-pressed'] === false).props.onClick());
    await act(async () => renderer.root.findAllByType('textarea').find(node => node.props.maxLength === 10000).props.onChange({ target: { value: 'My human review notes' } }));
    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    const write = calls.find(call => call.method); const payload = JSON.parse(write.body);
    assert.equal(write.method, 'PUT'); assert.equal(payload.revision, 1); assert.equal(payload.reviewNotes, 'My human review notes');
    for (const field of ['sourceUrl', 'channelId', 'creatorId', 'approvedAt', 'publish']) assert.equal(payload[field], undefined);
    assert.equal(renderer.root.findAllByType('iframe').length, 0);
    assert.equal(renderer.root.findAllByType('textarea').find(node => node.props.maxLength === 10000).props.value, 'My human review notes');
    if (mode) assert.match(JSON.stringify(renderer.toJSON()), /This review changed/);
    else assert.match(JSON.stringify(renderer.toJSON()), /Nothing was published/);
    await act(async () => renderer.unmount());
  }
});
test('member cannot view or edit the review queue', async () => {
  const { Page } = setup('forbidden'); let renderer;
  await act(async () => { renderer = create(React.createElement(Page)); });
  assert.equal(renderer.root.findAllByType('form').length, 0);
  assert.match(JSON.stringify(renderer.toJSON()), /moderators and administrators/);
  await act(async () => renderer.unmount());
});
