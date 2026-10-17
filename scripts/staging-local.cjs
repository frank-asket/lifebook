// Run the API or web app on this machine against the STAGING database and Clerk app.
//   node scripts/staging-local.cjs api   API on http://localhost:4100 (build it first)
//   node scripts/staging-local.cjs web   web on http://localhost:3001, calling the local API
// Every setting is passed explicitly so nothing falls back to production .env files.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const API_PORT = 4100, WEB_ORIGIN = 'http://localhost:3001';
const env = {};
for (const line of fs.readFileSync(path.join(root, '.env.staging'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/^'(.*)'$/, '$1');
}
if (!/communal-honeybee|Y29tbXVuYWwtaG9uZXliZWU/.test(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '')) throw new Error('.env.staging does not hold the staging Clerk app');

const base = { PATH: process.env.PATH, HOME: process.env.HOME };
const targets = {
  api: {
    cwd: root, command: process.execPath, args: ['apps/api/dist/main.js'],
    env: {
      ...base, NODE_ENV: 'production', PORT: String(API_PORT), API_RATE_LIMIT: '120', TRUST_PROXY_HOPS: '0', PRAYER_COMPANION_ALLOW_DRAFT: 'true',
      CLERK_AUTHORIZED_PARTIES: WEB_ORIGIN, CORS_ORIGINS: WEB_ORIGIN,
      ...Object.fromEntries(['DATABASE_URL', 'DIRECT_URL', 'CLERK_SECRET_KEY', 'API_BIBLE_KEY', 'API_BIBLE_EN_BIBLE_ID', 'API_BIBLE_FR_BIBLE_ID', 'BIBLE_NOTES_ENCRYPTION_KEY', 'REFLECTION_ENCRYPTION_KEYS', 'REFLECTION_ENCRYPTION_ACTIVE_KEY'].map(name => [name, env[name]])),
    },
  },
  web: {
    cwd: path.join(root, 'apps/web'), command: 'pnpm', args: ['exec', 'next', 'dev', '-p', '3001'],
    env: {
      ...base, NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY: env.CLERK_SECRET_KEY,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in', NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
    },
  },
};
const target = targets[process.argv[2]];
if (!target) throw new Error('Usage: node scripts/staging-local.cjs api|web');
const child = spawn(target.command, target.args, { cwd: target.cwd, env: target.env, stdio: 'inherit' });
child.on('exit', code => { process.exitCode = code ?? 1; });
