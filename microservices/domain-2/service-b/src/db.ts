import fs from 'node:fs';
import path from 'node:path';
import { Database } from './types';

// --------------------------------------------------------------------------
// This is a deliberately simple JSON-file store so the whole backend runs
// with zero external dependencies and zero setup. It mirrors the entities
// in LifeBook_Backend_Schema.docx (mood_checkins, generated_content,
// streaks, flags) so swapping this file for a real Postgres/Prisma or
// Firestore layer later is a drop-in replacement — every function here
// keeps the same signature either way.
//
// IMPORTANT for deployment: most hosting platforms (Render, Railway, Fly,
// Heroku) wipe the local filesystem on every restart or redeploy. Set
// DATA_DIR to a mounted persistent volume/disk in production, or every
// check-in, streak, and journal entry disappears the next time the service
// restarts. See microservices/domain-2/service-b/README.md, "Deploying to production hosting."
// --------------------------------------------------------------------------

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function emptyDb(): Database {
  return {
    checkins: [], content: [], streaks: {}, flags: [],
    groups: [], groupMembers: [], prayerRequests: [], discussions: [], discussionReplies: [],
    libraryProgress: {}, subscriptions: {},
    journalEntries: [], favorites: [], preferences: {}, pushTokens: {},
    journeyProgress: {}, livingWordComments: [],
    playlists: [], playlistItems: [],
  };
}

let memoryCache: Database | null = null;

function load(): Database {
  if (memoryCache) return memoryCache;
  if (!fs.existsSync(DB_PATH)) {
    const fresh = emptyDb();
    memoryCache = fresh;
    return fresh;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const loaded: Database = { ...emptyDb(), ...raw };
    memoryCache = loaded;
    return loaded;
  } catch {
    const fresh = emptyDb();
    memoryCache = fresh;
    return fresh;
  }
}

function persist(database: Database) {
  memoryCache = database;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
  } catch (err) {
    console.error('[db] Error persisting database to disk:', err);
  }
}

export const db = {
  read: load,
  write: persist,
};
