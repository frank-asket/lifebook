const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act } = require('../../mobile/test/helpers.cjs');
const channel = 'UC' + 'a'.repeat(22);
function setup(mode = 'enabled') {
  const calls = []; const token = async () => 'synthetic-editor';
  class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const Page = load('../../web/app/editorial/discover/page.tsx', {
    '@clerk/nextjs': { useAuth: () => ({ userId: 'synthetic', isLoaded: true, isSignedIn: true, getToken: token }) },
    'next/link': { default: 'a' }, '../../../components/shell': { Shell: 'Shell' }, '../../../components/language-provider': { useLanguage: () => ({ language: 'en' }) },
    '../../../lib/errors': { errorMessage: e => e.message },
    '../../../lib/api': { ApiError, api: async (path, received, options) => {
      calls.push({ path, received, options });
      if (mode === 'forbidden') throw new ApiError('Forbidden', 403);
      if (path.endsWith('/sources')) return { enabled: mode !== 'disabled', sources: mode === 'disabled' ? [] : [{ id: channel, sourceUrl: `https://www.youtube.com/channel/${channel}` }] };
      if (mode === 'failed') throw new Error('Synthetic upstream error');
      return { items: [{ id: 'vid00000000', title: '<script>Synthetic title</script>', publisher: 'Synthetic ministry', channelId: channel, sourceUrl: 'https://www.youtube.com/watch?v=vid00000000', channelUrl: `https://www.youtube.com/channel/${channel}`, language: null, duration: 'PT10M', captionsAvailable: false, regionRestricted: true }], nextPageToken: 'next=', checkedAt: '2026-10-26T00:00:00Z', reviewRequired: true };
    } },
  }).default;
  return { Page, calls };
}
test('discovery results are read-only, credited source links with no embedded media or publication action', async () => {
  const { Page, calls } = setup(); let renderer;
  await act(async () => { renderer = create(React.createElement(Page)); });
  assert.equal(calls.length, 1, 'video calls require an explicit editor request');
  await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
  assert.equal(calls.length, 2); assert.ok(calls.every(call => !call.options.method));
  assert.ok(calls[1].path.includes(encodeURIComponent(channel)));
  assert.match(JSON.stringify(renderer.toJSON()), /Synthetic ministry/);
  assert.match(JSON.stringify(renderer.toJSON()), /Regional restrictions/);
  assert.equal(renderer.root.findAllByType('iframe').length + renderer.root.findAllByType('video').length + renderer.root.findAllByType('audio').length + renderer.root.findAllByType('script').length, 0);
  assert.ok(renderer.root.findAllByType('a').some(node => node.props.href === 'https://www.youtube.com/watch?v=vid00000000'));
  assert.ok(!renderer.root.findAllByType('button').some(node => /publish|import/i.test(String(node.props.children))));
  await act(async () => renderer.root.findAllByType('button').find(node => node.props.children === 'Next page').props.onClick());
  assert.ok(calls.at(-1).path.includes('pageToken=next%3D'));
  await act(async () => renderer.unmount());
});
test('disabled and forbidden discovery cannot fetch videos; upstream failure leaves no candidate results', async () => {
  for (const mode of ['disabled', 'forbidden', 'failed']) {
    const { Page, calls } = setup(mode); let renderer;
    await act(async () => { renderer = create(React.createElement(Page)); });
    if (mode === 'failed') {
      await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }));
      assert.match(JSON.stringify(renderer.toJSON()), /Synthetic upstream error/);
      assert.equal(renderer.root.findAllByType('article').length, 0);
    } else { assert.equal(renderer.root.findAllByType('form').length, 0); assert.equal(calls.length, 1); }
    await act(async () => renderer.unmount());
  }
});
