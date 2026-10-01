const fs = require('node:fs');
const path = require('node:path');

const serviceRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(serviceRoot, '../../..');
const identityFields = new Set(['id', 'deviceId', 'userId', 'authorId', 'memberId', 'createdBy', 'reviewedBy']);
const dummyIdPattern = /^(test|demo|dummy|mock|placeholder)([_:-]|$)/i;

function isDummyId(value) {
  return typeof value === 'string' && dummyIdPattern.test(value.trim());
}

function isDummyIdentity(field, value) {
  if (typeof value !== 'string') return false;
  if (identityFields.has(field) && isDummyId(value)) return true;
  if (field === 'email' && (/^test[._+-]/i.test(value) || /@(example\.(com|org)|invalid)$/i.test(value))) return true;
  return /token/i.test(field) && /mock|test/i.test(value);
}

function isDummyRecord(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(isDummyRecord);
  return Object.entries(value).some(([field, fieldValue]) => {
    if (isDummyIdentity(field, fieldValue)) return true;
    return fieldValue && typeof fieldValue === 'object' && isDummyRecord(fieldValue);
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cleanState(state) {
  const droppedIds = {
    checkins: new Set(),
    content: new Set(),
    playlists: new Set(),
    discussions: new Set(),
  };

  for (const name of ['checkins', 'playlists', 'discussions']) {
    for (const row of state[name] || []) {
      if (isDummyRecord(row) && row.id) droppedIds[name].add(row.id);
    }
  }

  for (const row of state.content || []) {
    if (isDummyRecord(row) || droppedIds.checkins.has(row.checkinId)) {
      if (row.id) droppedIds.content.add(row.id);
    }
  }

  const relationFields = {
    content: ['checkinId'],
    favorites: ['contentId'],
    playlistItems: ['playlistId'],
    discussionReplies: ['discussionId'],
  };
  const relationSets = {
    content: droppedIds.checkins,
    favorites: droppedIds.content,
    playlistItems: droppedIds.playlists,
    discussionReplies: droppedIds.discussions,
  };

  const removed = {};
  for (const [name, value] of Object.entries(state)) {
    if (Array.isArray(value)) {
      const fields = relationFields[name] || [];
      const linkedIds = relationSets[name];
      const kept = value.filter(row =>
        !isDummyRecord(row) && !(linkedIds && fields.some(field => linkedIds.has(row?.[field])))
      );
      removed[name] = value.length - kept.length;
      state[name] = kept;
    } else if (value && typeof value === 'object') {
      const entries = Object.entries(value);
      const kept = entries.filter(([key, record]) => !isDummyId(key) && !isDummyRecord(record));
      removed[name] = entries.length - kept.length;
      state[name] = Object.fromEntries(kept);
    }
  }
  return removed;
}

function cleanEvents(events) {
  if (!Array.isArray(events)) throw new Error('Analytics data must be a JSON array');
  const kept = events.filter(event => !isDummyRecord(event));
  return { events: kept, removed: events.length - kept.length };
}

function countRecords(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') return Object.values(data).reduce((sum, value) => {
    if (Array.isArray(value) || (value && typeof value === 'object')) return sum + countRecords(value);
    return sum;
  }, 0);
  return 0;
}

function processFile(filePath, kind, apply) {
  if (!fs.existsSync(filePath)) return null;
  const data = readJson(filePath);
  const before = countRecords(data);
  let removed;
  let cleaned;
  if (kind === 'state') {
    cleaned = data;
    removed = cleanState(cleaned);
  } else {
    const result = cleanEvents(data);
    cleaned = result.events;
    removed = { events: result.removed };
  }
  const after = countRecords(cleaned);
  if (apply && before !== after) {
    const temporaryPath = `${filePath}.cleaning`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(cleaned, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporaryPath, filePath);
  }
  return { file: path.relative(repositoryRoot, filePath), before, after, removed };
}

const args = new Set(process.argv.slice(2));
if ([...args].some(arg => arg !== '--apply')) {
  console.error('Usage: node scripts/clean_dummy_data.js [--apply]');
  process.exit(2);
}
const apply = args.has('--apply');
const statePath = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR, 'db.json')
  : path.join(serviceRoot, 'data', 'db.json');
const files = [
  processFile(statePath, 'state', apply),
  processFile(path.join(serviceRoot, 'data', 'analytics_events.json'), 'events', apply),
  processFile(path.join(repositoryRoot, 'backend', 'data', 'analytics_events.json'), 'events', apply),
].filter(Boolean);
console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run', files }, null, 2));
