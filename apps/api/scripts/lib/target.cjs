// Shared target selection for operator scripts: local (loopback only), staging, or production (confirmed by project ref).
const fs = require('node:fs');
const path = require('node:path');

const apiRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(apiRoot, '../..');

function readEnv(file) {
  if (!fs.existsSync(file)) throw new Error(`${path.relative(repoRoot, file)} not found`);
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}
function projectRef(url) {
  const parsed = new URL(url);
  return decodeURIComponent(parsed.username).split('.')[1] || parsed.hostname.match(/^db\.([a-z0-9]+)\./)?.[1] || parsed.hostname;
}

/** Returns { url, label } and sets the secrets the chosen target needs. Throws rather than guess. */
function configureTarget(options) {
  const target = options.target;
  if (target === 'local') {
    const host = new URL(process.env.DATABASE_URL || 'postgresql://invalid').hostname;
    if (!['127.0.0.1', 'localhost'].includes(host)) throw new Error('--target local needs DATABASE_URL on 127.0.0.1 or localhost');
    return { url: process.env.DATABASE_URL, label: 'local' };
  }
  if (target === 'staging') {
    const env = readEnv(path.join(repoRoot, '.env.staging'));
    const production = projectRef(readEnv(path.join(apiRoot, '.env')).DIRECT_URL);
    if (projectRef(env.DIRECT_URL) === production) throw new Error('.env.staging points at the production database');
    for (const name of ['CLERK_SECRET_KEY', 'REFLECTION_ENCRYPTION_KEYS', 'REFLECTION_ENCRYPTION_ACTIVE_KEY']) process.env[name] = env[name];
    return { url: env.DIRECT_URL, label: `staging (${projectRef(env.DIRECT_URL)})` };
  }
  if (target === 'production') {
    const env = readEnv(path.join(apiRoot, '.env'));
    const ref = projectRef(env.DIRECT_URL);
    if (options['confirm-production'] !== ref) throw new Error(`Production changes need --confirm-production ${ref}`);
    process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || env.CLERK_SECRET_KEY;
    return { url: env.DIRECT_URL, label: `PRODUCTION (${ref})` };
  }
  throw new Error('Choose --target local, staging or production');
}

function parseOptions(args, flags = []) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument ${key}`);
    if (flags.includes(key.slice(2))) { options[key.slice(2)] = true; continue; }
    if (args[i + 1] === undefined || args[i + 1].startsWith('--')) throw new Error(`Expected a value after ${key}`);
    options[key.slice(2)] = args[++i];
  }
  return options;
}

module.exports = { apiRoot, repoRoot, configureTarget, parseOptions };
