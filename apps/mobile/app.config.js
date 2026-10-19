const { expo } = require('./app.json');

module.exports = ({ config = {} } = {}) => {
  const release = process.env.LIFEBOOK_RELEASE_BUILD === 'true' || process.env.EAS_BUILD_PROFILE === 'production';
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  if (process.env.EAS_BUILD_PROFILE && !key) {
    throw new Error('Configure EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in the matching EAS environment before building.');
  }
  if (release) {
    if (!key.startsWith('pk_live_')) throw new Error('Production native builds require a Clerk production publishable key. Keep development keys in development/preview environments.');
    let api;
    try { api = new URL(process.env.EXPO_PUBLIC_API_URL || ''); } catch { throw new Error('Production native builds require EXPO_PUBLIC_API_URL.'); }
    if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash) {
      throw new Error('Production native builds require an HTTPS API URL without credentials, query or fragment.');
    }
  }
  return { ...config, ...expo, extra: { ...config.extra, ...expo.extra } };
};
