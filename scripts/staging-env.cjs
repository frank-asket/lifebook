// Staging helper. Secrets live only in the gitignored .env.staging and are never printed.
//   node scripts/staging-env.cjs init     create .env.staging with fresh staging-only keys
//   node scripts/staging-env.cjs check    report which settings are present (names only)
//   node scripts/staging-env.cjs migrate  replay reviewed migrations into the staging database
//   node scripts/staging-env.cjs render | pbcopy   copy the API settings for Render's "Add from .env"
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const file = path.join(root, '.env.staging');
const required = ['DATABASE_URL', 'DIRECT_URL', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_AUTHORIZED_PARTIES', 'CORS_ORIGINS', 'API_BIBLE_KEY', 'API_BIBLE_EN_BIBLE_ID', 'API_BIBLE_FR_BIBLE_ID', 'BIBLE_NOTES_ENCRYPTION_KEY', 'REFLECTION_ENCRYPTION_KEYS', 'REFLECTION_ENCRYPTION_ACTIVE_KEY'];

function parse(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^'(.*)'$/, '$1');
  }
  return env;
}
const load = target => (fs.existsSync(target) ? parse(fs.readFileSync(target, 'utf8')) : {});
// Supabase pooler usernames are postgres.<project-ref>; direct hosts are db.<project-ref>.supabase.co.
function projectRef(raw) {
  if (!raw) return null;
  const url = new URL(raw);
  return decodeURIComponent(url.username).split('.')[1] || url.hostname.match(/^db\.([a-z0-9]+)\./)?.[1] || url.hostname;
}

function init() {
  if (fs.existsSync(file)) throw new Error('.env.staging already exists; refusing to overwrite keys');
  const key = () => randomBytes(32).toString('hex');
  const lines = [
    '# LifeBook STAGING only. Never copy production values here. Gitignored; keep a backup of the keys in a password manager.',
    'DATABASE_URL=', 'DIRECT_URL=',
    'CLERK_SECRET_KEY=', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=',
    'CLERK_AUTHORIZED_PARTIES=', 'CORS_ORIGINS=',
    'API_BIBLE_KEY=', 'API_BIBLE_EN_BIBLE_ID=de4e12af7f28f599-01', 'API_BIBLE_FR_BIBLE_ID=a93a92589195411f-01',
    `BIBLE_NOTES_ENCRYPTION_KEY=${key()}`,
    `REFLECTION_ENCRYPTION_KEYS='${JSON.stringify({ stg1: key() })}'`,
    'REFLECTION_ENCRYPTION_ACTIVE_KEY=stg1', '',
  ];
  fs.writeFileSync(file, lines.join('\n'), { mode: 0o600 });
  console.log('Created .env.staging with fresh staging encryption keys. Fill in the empty settings; values are not shown here.');
}

function check() {
  const env = load(file);
  for (const name of required) console.log(`${env[name] ? 'set    ' : 'MISSING'} ${name}`);
  const production = projectRef(load(path.join(root, 'apps/api/.env')).DIRECT_URL);
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) if (env[name] && production && projectRef(env[name]) === production) throw new Error(`${name} points at the production database`);
  return env;
}

function migrate() {
  const env = check();
  const production = projectRef(load(path.join(root, 'apps/api/.env')).DIRECT_URL);
  if (!env.DATABASE_URL || !env.DIRECT_URL) throw new Error('Set both staging database URLs first');
  if (!production) throw new Error('Cannot read the production project from apps/api/.env to rule it out');
  console.log(`Target staging project: ${projectRef(env.DIRECT_URL)} (production ${production} excluded)`);
  const run = args => spawnSync('pnpm', ['--filter', '@lifebook/api', 'exec', 'prisma', ...args], { cwd: root, stdio: 'inherit', env: { ...process.env, DATABASE_URL: env.DATABASE_URL, DIRECT_URL: env.DIRECT_URL } }).status;
  if (run(['migrate', 'deploy']) !== 0) throw new Error('migrate deploy failed');
  if (run(['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code']) !== 0) throw new Error('Staging schema differs from schema.prisma');
}

// Run by the operator only: the output contains secrets, so pipe it straight to the clipboard.
function render() {
  const env = load(file);
  const api = required.filter(name => !name.startsWith('NEXT_PUBLIC_'));
  const missing = api.filter(name => !env[name]);
  if (missing.length) throw new Error(`Fill in first: ${missing.join(', ')}`);
  // Fixed settings from render.staging.yaml, for services created without a Blueprint.
  const fixed = ['NODE_ENV=production', 'API_RATE_LIMIT=120', 'TRUST_PROXY_HOPS=1', 'PRAYER_COMPANION_ALLOW_DRAFT=true'];
  process.stdout.write([...fixed, ...api.map(name => `${name}=${env[name]}`)].join('\n') + '\n');
}

const commands = { init, check, migrate, render };
try {
  const command = commands[process.argv[2]];
  if (!command) throw new Error('Usage: node scripts/staging-env.cjs init|check|migrate|render');
  command();
} catch (error) {
  console.error(`staging-env: ${error.message}`);
  process.exitCode = 1;
}
