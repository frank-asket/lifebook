const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage, copy } = require('./helpers.cjs');
const native = Object.fromEntries(['ActivityIndicator', 'Switch', 'Text', 'TextInput', 'View'].map(n => [n, n]));
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Row', 'Screen', 'Segmented', 'SectionLabel'].map(n => [n, n]));
function harness(pastor = false) {
  const controls = { failWrite: false }; const writes = [];
  const thread = { id: 'synthetic-request', topic: 'prayer', language: 'en', status: 'CLAIMED', message: 'Synthetic request text', messages: [], pastor: null };
  const status = pastor ? { active: true, displayName: 'Synthetic pastor', acceptingRequests: true, openCases: 0, maxOpenRequests: 1 } : { active: false };
  const summary = { id: thread.id, topic: 'prayer', status: 'CLAIMED', unread: false };
  let confirmation;
  const write = action => async (...args) => { writes.push({ action, args }); if (controls.failWrite) throw new Error('Synthetic offline failure'); return action === 'report' ? { reported: true } : thread; };
  const app = { c: {}, lang: 'en', t: copy.en }; const session = { isSignedIn: true, getToken: async () => 'synthetic' };
  const { default: Care } = load('../app/pastoral-care.tsx', {
    'react-native': { ...native, Alert: { alert: (_a, _b, actions) => { confirmation = actions; } }, BackHandler: { addEventListener: () => ({ remove() {} }) } },
    'expo-router': { useRouter: () => ({ navigate() {} }), useFocusEffect: callback => React.useEffect(callback, [callback]) },
    '../lib/app': { useApp: () => app, useSession: () => session, api: async () => [] }, '../lib/api': { requireToken: async read => read() },
    '../components/ui': ui, '../../web/lib/errors': { errorMessage }, '../components/load-more': { LoadMore: () => null },
    '../lib/care': { CARE_TOPICS: ['prayer'], REPORT_CATEGORIES: ['safety', 'conduct'], topicLabel: value => value, statusLabel: value => value, reportCategoryLabel: value => value,
      care: { pastorStatus: async () => status, mine: async () => [summary], minePage: async () => ({ items: [summary], nextCursor: null }), cases: async () => [], queue: async () => [{ ...summary, language: 'en' }], get: async () => thread, case: async () => thread,
        create: write('create'), reply: write('reply'), pastorReply: write('pastorReply'), report: write('report'), pastorReport: write('report'), claim: write('claim'), setAvailability: async () => status, close: write('close'), pastorClose: write('close'), remove: write('delete') } },
  });
  return { Care, controls, writes, get confirmation() { return confirmation; } };
}
const button = (renderer, title) => renderer.root.findAllByType('Button').find(b => b.props.title === title);
const input = (renderer, label) => renderer.root.findAllByType('TextInput').find(n => n.props.accessibilityLabel === label);
async function render(h) { let renderer; await act(async () => { renderer = create(React.createElement(h.Care)); }); return renderer; }

test('mobile care creation requires sharing consent and preserves request drafts after failure', async () => {
  const h = harness(); const renderer = await render(h);
  await act(async () => button(renderer, 'Ask for pastoral care').props.onPress());
  await act(async () => input(renderer, 'Your request').props.onChangeText('A synthetic private draft'));
  assert.equal(button(renderer, 'Send request').props.disabled, true);
  await act(async () => renderer.root.findByType('Switch').props.onValueChange(true));
  h.controls.failWrite = true;
  await act(async () => button(renderer, 'Send request').props.onPress());
  assert.equal(input(renderer, 'Your request').props.value, 'A synthetic private draft');
  assert.equal(h.writes[0].args[1].consent, true);
  assert.equal(h.writes[0].args[1].contactPreference, 'messages');
  assert.equal(h.writes[0].args[1].phone, undefined);
  h.controls.failWrite = false;
  await act(async () => button(renderer, 'Send request').props.onPress());
  assert.ok(input(renderer, 'Your reply'));
  await act(async () => renderer.unmount());
});
test('mobile conversation retries replies and shares report transcripts only by explicit choice', async () => {
  const h = harness(); const renderer = await render(h);
  await act(async () => renderer.root.findByType('Row').props.onPress());
  await act(async () => input(renderer, 'Your reply').props.onChangeText('Synthetic reply draft'));
  h.controls.failWrite = true;
  await act(async () => button(renderer, 'Send reply').props.onPress());
  assert.equal(input(renderer, 'Your reply').props.value, 'Synthetic reply draft');
  h.controls.failWrite = false;
  await act(async () => button(renderer, 'Send reply').props.onPress());
  assert.equal(input(renderer, 'Your reply').props.value, '');
  await act(async () => button(renderer, 'Report a concern').props.onPress());
  assert.equal(renderer.root.findByType('Switch').props.value, false);
  await act(async () => input(renderer, 'Concern details').props.onChangeText('Synthetic concern'));
  h.controls.failWrite = true;
  await act(async () => button(renderer, 'Send report').props.onPress());
  assert.equal(input(renderer, 'Concern details').props.value, 'Synthetic concern');
  assert.equal(h.writes.at(-1).args[2].shareConversation, false);
  h.controls.failWrite = false;
  await act(async () => renderer.root.findByType('Switch').props.onValueChange(true));
  await act(async () => button(renderer, 'Send report').props.onPress());
  assert.equal(h.writes.at(-1).args[2].shareConversation, true);
  assert.ok(renderer.root.findAllByType('Text').some(n => String(n.props.children).includes('Report sent')));
  await act(async () => button(renderer, 'Delete conversation').props.onPress());
  assert.equal(h.writes.filter(w => w.action === 'delete').length, 0);
  assert.equal(h.confirmation[0].style, 'cancel');
  await act(async () => renderer.unmount());
});
test('mobile pastor workspace shows metadata before an explicit claim opens private content', async () => {
  const h = harness(true); const renderer = await render(h);
  await act(async () => renderer.root.findByType('Segmented').props.onChange('pastor'));
  assert.equal(input(renderer, 'Your reply'), undefined);
  assert.equal(h.writes.length, 0);
  const claim = renderer.root.findAllByType('Button').find(b => b.props.title.startsWith('Claim'));
  await act(async () => claim.props.onPress());
  assert.equal(h.writes[0].action, 'claim');
  assert.ok(input(renderer, 'Your reply'));
  await act(async () => renderer.unmount());
});
