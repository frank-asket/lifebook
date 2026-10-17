// Operator tool for the pastoral care pilot. Build the API first (pnpm --filter @lifebook/api build).
//
//   node apps/api/scripts/pastor-admin.cjs <command> --target local|staging|production [options]
//
//   list
//   show       --email <pastor>
//   register   --email <pastor> --slug kwame-mensah --name "Rev. Kwame Mensah" --bio-file bio.txt
//              --languages en,tw --church "..." --role "Senior Pastor" --country GH
//              --reference-name "..." --reference-contact "..."
//   training   --email <pastor> --course "Mental Health First Aid" --date 2026-10-01
//   conduct    --email <pastor> --date 2026-10-02
//   approve    --email <pastor> --by <moderator email>
//   reject     --email <pastor> --notes "..."
//   suspend    --email <pastor> --reason "..."          (immediate: profile hidden)
//   reinstate  --email <pastor> --by <moderator email>
//   set-role   --email <user>   --role MODERATOR|ADMIN|MEMBER|CREATOR
//
// People are looked up by email in Clerk; LifeBook stores only the Clerk id, never the email.
// Production needs --confirm-production <project-ref> and the reflection key ring in the environment.
const fs = require('node:fs');
const path = require('node:path');

const apiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(apiRoot, '../..');
const commands = ['list', 'show', 'register', 'training', 'conduct', 'approve', 'reject', 'suspend', 'reinstate', 'set-role'];

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    if (!key.startsWith('--') || rest[i + 1] === undefined || rest[i + 1].startsWith('--')) throw new Error(`Expected a value after ${key}`);
    options[key.slice(2)] = rest[++i];
  }
  return { command, options };
}
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

// Resolves database, Clerk and key settings for the chosen target, refusing anything ambiguous.
function configure(options) {
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

async function findUserId(db, email, options) {
  if (options['user-id'] && options.target === 'local') return options['user-id'];
  if (!email) throw new Error('--email is required');
  const { createClerkClient } = require('@clerk/backend');
  if (!process.env.CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY is not set for this target');
  const { data } = await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }).users.getUserList({ emailAddress: [email] });
  if (data.length !== 1) throw new Error(`Expected one account for that email in this environment's sign-in, found ${data.length}. The person must sign up first.`);
  const user = await db.user.upsert({ where: { oidcSubject: data[0].id }, create: { oidcSubject: data[0].id }, update: {} });
  return user.id;
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!commands.includes(command)) throw new Error(`Usage: pastor-admin.cjs <${commands.join('|')}> --target local|staging|production ...`);
  const { url, label } = configure(options);
  const { PrismaClient } = require('@prisma/client');
  const { PastorAdmin } = require(path.join(apiRoot, 'dist/pastors/pastor-admin'));
  const db = new PrismaClient({ datasources: { db: { url } } });
  const admin = new PastorAdmin(db);
  console.error(`Target: ${label}`);
  try {
    if (command === 'list') return console.table(await admin.list());
    const userId = await findUserId(db, options.email, options);
    const byId = async () => options['by-user-id'] && options.target === 'local' ? options['by-user-id'] : findUserId(db, options.by, options);
    let result;
    switch (command) {
      case 'show': result = await admin.summary(userId); break;
      case 'register': result = await admin.register(userId, {
        slug: options.slug, displayName: options.name, bio: options['bio-file'] ? fs.readFileSync(options['bio-file'], 'utf8') : options.bio,
        languages: (options.languages || '').split(','), churchName: options.church, ministryRole: options.role, country: options.country,
        referenceName: options['reference-name'], referenceContact: options['reference-contact'],
      }); break;
      case 'training': result = await admin.recordTraining(userId, options.course, options.date); break;
      case 'conduct': result = await admin.recordConduct(userId, options.date); break;
      case 'approve': result = await admin.approve(userId, await byId()); break;
      case 'reject': result = await admin.reject(userId, options.notes); break;
      case 'suspend': result = await admin.suspend(userId, options.reason); break;
      case 'reinstate': result = await admin.reinstate(userId, await byId()); break;
      case 'set-role': result = await admin.setRole(userId, options.role); break;
    }
    console.log(JSON.stringify(result, null, 2));
  } finally { await db.$disconnect(); }
}

main().catch(error => { console.error(`pastor-admin: ${error.message}`); process.exitCode = 1; });
