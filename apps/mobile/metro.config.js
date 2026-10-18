// The monorepo has two Reacts (web: 19, mobile: 18). pnpm lets some packages (expo-router, vector icons)
// resolve the web copy, which breaks rendering, and Clerk's auto-installed peers target a newer Expo SDK,
// so every import of these resolves from this app instead.
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
