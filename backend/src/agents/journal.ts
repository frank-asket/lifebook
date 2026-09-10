import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { JournalEntry, FavoriteVerse } from '../types';

export function addJournalEntry(deviceId: string, text: string, relatedContentId?: string): JournalEntry {
  const entry: JournalEntry = { id: randomUUID(), deviceId, text, relatedContentId, createdAt: new Date().toISOString() };
  const database = db.read();
  database.journalEntries.push(entry);
  db.write(database);
  return entry;
}

export function listJournalEntries(deviceId: string): JournalEntry[] {
  const database = db.read();
  return database.journalEntries
    .filter(e => e.deviceId === deviceId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addFavorite(deviceId: string, contentId: string, verseText: string, verseReference: string): FavoriteVerse {
  const database = db.read();
  const existing = database.favorites.find(f => f.deviceId === deviceId && f.contentId === contentId);
  if (existing) return existing;

  const favorite: FavoriteVerse = { id: randomUUID(), deviceId, contentId, verseText, verseReference, createdAt: new Date().toISOString() };
  database.favorites.push(favorite);
  db.write(database);
  return favorite;
}

export function listFavorites(deviceId: string): FavoriteVerse[] {
  const database = db.read();
  return database.favorites
    .filter(f => f.deviceId === deviceId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Mood history is derived straight from real check-ins — this is the data
// backing the Progress screen's heatmap. Nothing separate to keep in sync.
export function moodHistory(deviceId: string, days = 30): { date: string; mood: string | null }[] {
  const database = db.read();
  const byDate = new Map<string, string>();
  database.checkins
    .filter(c => c.deviceId === deviceId)
    .forEach(c => byDate.set(c.createdAt.slice(0, 10), c.mood));

  const result: { date: string; mood: string | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, mood: byDate.get(key) || null });
  }
  return result;
}
