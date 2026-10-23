const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act, web } = require('./helpers.cjs');
const rules = load('../../web/lib/suggestions.ts');
const list = [
 { id: 'plan:discover-jesus', kind: 'plan', title: 'Discover Jesus', reason: { type: 'goal', goal: 'Learn about Jesus' } },
 { id: 'short-prayer-time', kind: 'prayer-time', reason: { type: 'goal', goal: 'Build a daily prayer habit' } },
 { id: 'prayer-journal', kind: 'journal', reason: { type: 'journey', journey: 'EXPLORING' } },
];
function harness() {
 let consent = true, fails = false; const calls = [], routes = [], preferences = [];
 let session = { isSignedIn: true, userId: 'a', getToken: async () => 'a' };
 const app = { c: {}, lang: 'en', setPrefs: value => preferences.push(value) };
 const { Suggestions } = load('../components/suggestions.tsx', {
  'react-native': { Text: 'Text', View: 'View' },
  'expo-router': { useFocusEffect: callback => React.useEffect(callback, [callback]), useRouter: () => ({ push: route => routes.push(route), navigate: route => routes.push(route) }) },
  '../lib/app': { useApp: () => app, useSession: () => session },
  '../lib/api': { requireToken: async get => { const token = await get(); if (!token) throw Error('auth'); return token; }, api: async (path, token, options) => {
    calls.push({ path, token, options });
    if (options?.method === 'POST') { if (fails) throw Error('offline'); return {}; }
    return { consent, suggestions: token === 'a' ? list : [] };
  } },
  './ui': { Card: 'Card', Row: 'Row', Button: 'Button', ErrorLine: 'ErrorLine' },
  '../../web/lib/api': web, '../../web/lib/suggestions': rules,
 });
 return { Suggestions, calls, routes, preferences, app, fail: value => { fails=value; }, consent: value => { consent=value; }, switch: () => { session={...session,userId:'b',getToken:async()=> 'b'}; } };
}
const button = (r, title) => r.root.findAllByType('Button').find(b => b.props.title === title);
test('native suggestions require consent, explain choices and route to exact plans and short prayer time', async () => {
 const h=harness(); let r;
 h.consent(false); await act(async()=> {r=create(React.createElement(h.Suggestions));}); assert.equal(r.toJSON(), null);
 await act(async()=>r.unmount()); h.consent(true);
 await act(async()=> {r=create(React.createElement(h.Suggestions));});
 assert.equal(r.root.findAllByType('Row').length,2);
 await act(async()=>button(r,'Why this?').props.onPress());
 assert.ok(r.root.findAllByType('Text').some(t=>String(t.props.children).includes('Learn about Jesus')));
 await act(async()=>r.root.findAllByType('Row')[0].props.onPress());
 assert.deepEqual(JSON.parse(JSON.stringify(h.routes[0])),{pathname:'/reading-plans',params:{plan:'discover-jesus'}});
 await act(async()=>r.root.findAllByType('Row')[1].props.onPress());
 assert.deepEqual(JSON.parse(JSON.stringify(h.preferences)),[{length:2}]); assert.equal(h.routes[1],'/prayer-time');
 await act(async()=>r.unmount());
});
test('native failed dismissal preserves the card, retry persists to account, switching clears old cards', async()=>{
 const h=harness();let r;await act(async()=>{r=create(React.createElement(h.Suggestions));});
 h.fail(true); await act(async()=>button(r,'Hide “Discover Jesus”').props.onPress());
 assert.ok(button(r,'Hide “Discover Jesus”'));assert.equal(r.root.findAllByType('ErrorLine').length,1);
 h.fail(false); await act(async()=>button(r,'Hide “Discover Jesus”').props.onPress());
 assert.equal(button(r,'Hide “Discover Jesus”'),undefined);assert.equal(r.root.findAllByType('Row').length,2);
 assert.equal(h.calls.at(-1).path,'/me/suggestions/plan%3Adiscover-jesus/dismiss');
 h.switch();await act(async()=>r.update(React.createElement(h.Suggestions)));assert.equal(r.toJSON(),null);
 await act(async()=>r.unmount());
});

test('native suggestions translate explanations and controls into French', async()=>{
 const h=harness();h.app.lang='fr';let r;await act(async()=>{r=create(React.createElement(h.Suggestions));});
 await act(async()=>button(r,'Pourquoi ?').props.onPress());
 assert.ok(r.root.findAllByType('Text').some(t=>String(t.props.children).includes('Découvrir Jésus')));
 assert.ok(h.calls[0].path.endsWith('locale=fr'));
 await act(async()=>r.unmount());
});
