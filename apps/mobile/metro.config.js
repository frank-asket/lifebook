// Keep native imports on the app's own React and Expo dependencies in this monorepo.
// The web apps may use different React versions from the native SDK.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const pinned = ['react', 'react-dom', 'react-native', 'expo-crypto', 'expo-auth-session'];
const fromApp = path.join(__dirname, 'package.json');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pin = pinned.find(name => moduleName === name || moduleName.startsWith(`${name}/`));
  return context.resolveRequest(pin ? { ...context, originModulePath: fromApp } : context, moduleName, platform);
};

module.exports = config;
