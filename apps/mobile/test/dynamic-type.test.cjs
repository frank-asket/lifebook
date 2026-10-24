const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { React, create, act } = require('./helpers.cjs');

// Exercise the installed dependency, so a missing/reverted pnpm patch fails CI.
const fromMobile = createRequire(path.resolve(__dirname, '../package.json'));
const fromExpo = createRequire(fromMobile.resolve('expo/package.json'));
const filename = fromMobile.resolve('react-native/Libraries/Text/Text');
const code = fromExpo('@babel/core').transformFileSync(filename, {
  babelrc: false, configFile: false,
  presets: [fromExpo.resolve('babel-preset-expo')],
  caller: { name: 'metro', platform: 'ios', supportsStaticESM: false },
}).code;

function harness(os = 'ios') {
  let fontScale = 1;
  const mocks = {
    react: React,
    '../../src/private/featureflags/ReactNativeFeatureFlags': new Proxy({}, { get: () => () => false }),
    '../Pressability/PressabilityDebug': { isEnabled: () => false },
    '../Pressability/usePressability': () => ({}),
    '../StyleSheet/flattenStyle': value => Array.isArray(value) ? Object.assign({}, ...value) : value,
    '../StyleSheet/processColor': value => value,
    '../StyleSheet/StyleSheet': { create: value => value },
    '../Utilities/Platform': { OS: os, select: choices => choices[os] ?? choices.default },
    '../Utilities/useWindowDimensions': () => ({ fontScale }),
    './TextAncestorContext': React.createContext(false),
    './TextNativeComponent': { NativeText: 'NativeText', NativeVirtualText: 'NativeVirtualText', NativeSelectableText: 'NativeSelectableText' },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, __DEV__: false, require: name => Object.hasOwn(mocks, name) ? mocks[name] : fromMobile(name) });
  return { Text: exports.default, setScale(value) { fontScale = value; } };
}

test('iOS text commits the current multiplier in both directions without remounting drafts', async () => {
  const h = harness();
  let mounts = 0;
  let edit;
  function Screen() {
    const [draft, setDraft] = React.useState('');
    edit = setDraft;
    React.useEffect(() => { mounts++; }, []);
    return React.createElement('Draft', { value: draft },
      React.createElement(h.Text, { accessibilityLabel: 'Verse', maxFontSizeMultiplier: 2, style: { fontSize: 17 } }, draft));
  }
  let renderer;
  await act(() => { renderer = create(React.createElement(Screen)); });
  await act(() => edit('Unsaved test draft'));
  const original = renderer.root.findByType('NativeText');
  for (const scale of [3.571, 1, 0.823, 1]) {
    h.setScale(scale);
    await act(() => renderer.update(React.createElement(Screen)));
    const text = renderer.root.findByType('NativeText');
    assert.equal(text, original, 'text must receive new props, not a new key');
    assert.equal(text.props.fontSizeMultiplier, scale);
    assert.equal(text.props.allowFontScaling, true);
    assert.equal(text.props.maxFontSizeMultiplier, 2);
    assert.equal(text.props.style.fontSize, 17, 'native scaling must not be applied twice');
    assert.equal(text.props.accessibilityLabel, 'Verse');
    assert.equal(renderer.root.findByType('Draft').props.value, 'Unsaved test draft');
  }
  assert.equal(mounts, 1);
  const nativeConfig = fs.readFileSync(fromMobile.resolve('react-native/Libraries/Text/TextNativeComponent'), 'utf8');
  assert.match(nativeConfig, /fontSizeMultiplier: true/, 'the multiplier must reach the native view');
  await act(() => renderer.unmount());
});

test('fixed-size text and Android retain their existing scaling behavior', async () => {
  for (const os of ['ios', 'android']) {
    const h = harness(os);
    h.setScale(3.571);
    let renderer;
    await act(() => { renderer = create(React.createElement(h.Text, { allowFontScaling: false }, 'Icon')); });
    const text = renderer.root.findByType('NativeText');
    assert.equal(text.props.allowFontScaling, false);
    assert.equal(text.props.fontSizeMultiplier, os === 'ios' ? 3.571 : undefined);
    await act(() => renderer.unmount());
  }
});
