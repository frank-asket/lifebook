const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, errorMessage } = require('./helpers.cjs');
const native = Object.fromEntries(['ActivityIndicator', 'Switch', 'Text', 'TextInput', 'View'].map(n => [n, n]));
const ui = Object.fromEntries(['Button', 'Card', 'ErrorLine', 'Screen'].map(n => [n, n]));
function harness() {
  const controls = { failRead: false, failWrite: false, largeExport: false };
  const calls = []; const shared = []; let confirmation; let signOut = 0;
  const session = { isSignedIn: true, getToken: async () => 'synthetic-token', signOut: async () => { signOut++; } };
  const { default: Privacy } = load('../app/account-privacy.tsx', {
    'react-native': { ...native, Alert: { alert: (_a, _b, actions) => { confirmation = actions; } }, BackHandler: { addEventListener: () => ({ remove() {} }) }, Share: { share: async data => { shared.push(data); return { action: 'dismissedAction' }; } } },
    'expo-router': { useRouter: () => ({ navigate() {} }), useFocusEffect: callback => React.useEffect(callback, [callback]) },
    '../lib/app': { useApp: () => ({ c: {}, lang: 'en' }), useSession: () => session }, '../components/ui': ui, '../components/delete-prayers': { DeletePrayers: 'DeletePrayers' }, '../../web/lib/errors': { errorMessage },
    '../lib/api': { requireToken: async read => read(), api: async (path, _token, init = {}) => {
      calls.push({ path, init });
      if (init.method) { if (controls.failWrite) throw new Error('Synthetic offline failure'); return path.endsWith('/delete') ? { deleted: true, signInRemoved: false } : {}; }
      if (path.endsWith('/export')) return { format: 'lifebook-data-export/v1', prayers: controls.largeExport ? 'x'.repeat(100001) : ['synthetic private text'] };
      if (controls.failRead) throw new Error('Synthetic offline failure');
      return { profile: { personalizationConsent: false, aiProcessingConsent: true } };
    } },
  });
  return { Privacy, controls, calls, shared, get confirmation() { return confirmation; }, get signOut() { return signOut; } };
}
const button = (renderer, title) => renderer.root.findAllByType('Button').find(b => b.props.title === title);
async function render(h) { let renderer; await act(async () => { renderer = create(React.createElement(h.Privacy)); }); return renderer; }

test('mobile privacy keeps failed consent changes and never overwrites unread choices', async () => {
  const h = harness(); const renderer = await render(h);
  h.controls.failWrite = true;
  await act(async () => renderer.root.findAllByType('Switch')[1].props.onValueChange(false));
  assert.equal(renderer.root.findAllByType('Switch')[1].props.value, true);
  h.controls.failWrite = false;
  await act(async () => renderer.root.findAllByType('Switch')[1].props.onValueChange(false));
  assert.equal(renderer.root.findAllByType('Switch')[1].props.value, false);
  assert.deepEqual(JSON.parse(h.calls.filter(c => c.init.method).at(-1).init.body), { aiProcessingConsent: false });
  await act(async () => renderer.unmount());
  const failed = harness(); failed.controls.failRead = true;
  const other = await render(failed);
  assert.equal(other.root.findAllByType('Switch').length, 0);
  assert.equal(failed.calls.filter(c => c.init.method).length, 0);
  await act(async () => other.unmount());
});
test('mobile export opens only a user-selected share sheet and never truncates oversized data', async () => {
  const h = harness(); const renderer = await render(h);
  await act(async () => button(renderer, 'Prepare private data export').props.onPress());
  assert.equal(JSON.parse(h.shared[0].message).prayers[0], 'synthetic private text');
  h.controls.largeExport = true;
  await act(async () => button(renderer, 'Prepare private data export').props.onPress());
  assert.equal(h.shared.length, 1);
  assert.ok(renderer.root.findAllByType('ErrorLine').some(n => n.props.message.includes('too large')));
  await act(async () => renderer.unmount());
});
test('mobile account deletion requires typed and native confirmation, retains failure and explains partial sign-in removal', async () => {
  const h = harness(); const renderer = await render(h);
  const title = 'Delete account permanently';
  assert.equal(button(renderer, title).props.disabled, true);
  await act(async () => renderer.root.findByType('TextInput').props.onChangeText('DELETE'));
  await act(async () => button(renderer, title).props.onPress());
  assert.equal(h.calls.filter(c => c.path.endsWith('/delete')).length, 0);
  assert.equal(h.confirmation[0].style, 'cancel');
  h.controls.failWrite = true;
  await act(async () => h.confirmation.find(a => a.style === 'destructive').onPress());
  assert.equal(renderer.root.findByType('TextInput').props.value, 'DELETE');
  h.controls.failWrite = false;
  await act(async () => button(renderer, title).props.onPress());
  await act(async () => h.confirmation.find(a => a.style === 'destructive').onPress());
  assert.equal(renderer.root.findAllByType('TextInput').length, 0);
  assert.ok(renderer.root.findAllByType('Text').some(n => String(n.props.children).includes('could not be removed automatically')));
  assert.equal(h.signOut, 0);
  await act(async () => button(renderer, 'Sign out').props.onPress());
  assert.equal(h.signOut, 1);
  await act(async () => renderer.unmount());
});
