const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act } = require('./helpers.cjs');

function authHarness(result) {
  const Context = React.createContext(null);
  const calls = [];
  const tokenCache = {};
  const Stack = () => React.createElement('SessionProbe', { session: React.useContext(Context) });
  Stack.Screen = () => null;
  const { default: Layout } = load('../app/_layout.tsx', {
    'expo-router': { Stack },
    'expo-status-bar': { StatusBar: () => null },
    'expo-auth-session': { makeRedirectUri: options => { calls.push({ redirect: options }); return 'lifebook://'; } },
    '@clerk/expo/token-cache': { tokenCache },
    '@clerk/expo': {
      ClerkProvider: ({ children, ...props }) => { assert.equal(props.publishableKey, 'pk_test_synthetic'); assert.equal(props.tokenCache, tokenCache); return children; },
      ClerkLoaded: ({ children }) => children,
      useAuth: () => ({ isLoaded: true, isSignedIn: false, getToken: async () => null, signOut: async () => {} }),
      useUser: () => ({}),
      useSSO: () => ({ startSSOFlow: async options => { calls.push({ sso: options }); return result; } }),
    },
    '../lib/app': {
      AppProvider: ({ children }) => children,
      DailyWordProvider: ({ children }) => children,
      SessionContext: Context,
      useSession: () => React.useContext(Context),
      useApp: () => ({ c: { bg: 'fixture' }, dark: false }),
    },
  }, { process: { env: { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_synthetic' } } });
  return { Layout, calls };
}

test('native Google sign-in uses the app redirect and activates the returned session', async () => {
  const activated = [];
  const { Layout, calls } = authHarness({ createdSessionId: 'session_synthetic', setActive: async value => { activated.push(value); } });
  let renderer;
  try {
    await act(async () => { renderer = create(React.createElement(Layout)); });
    await act(async () => renderer.root.findByType('SessionProbe').props.session.signIn());
    assert.deepEqual(calls.map(call => JSON.parse(JSON.stringify(call))), [
      { redirect: { scheme: 'lifebook' } },
      { sso: { strategy: 'oauth_google', redirectUrl: 'lifebook://' } },
    ]);
    assert.deepEqual(activated.map(value => JSON.parse(JSON.stringify(value))), [{ session: 'session_synthetic' }]);
  } finally {
    if (renderer) await act(async () => renderer.unmount());
  }
});

test('native sign-in reports cancellation and incomplete sign-up without activating a session', async () => {
  for (const [result, message] of [
    [{}, /Sign-in was not completed/],
    [{ signUp: { missingFields: ['first_name', 'last_name'] } }, /Missing: first_name, last_name/],
  ]) {
    let activations = 0;
    const { Layout } = authHarness({ ...result, setActive: async () => { activations++; } });
    let renderer;
    try {
      await act(async () => { renderer = create(React.createElement(Layout)); });
      await assert.rejects(renderer.root.findByType('SessionProbe').props.session.signIn(), message);
      assert.equal(activations, 0);
    } finally {
      if (renderer) await act(async () => renderer.unmount());
    }
  }
});
