import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { JournalEntry, FavoriteVerse } from '../types';
import { JournalRepository, FavoriteVerseRepository, CheckinRepository } from '../repositories';

export async function addJournalEntry(deviceId: string, text: string, relatedContentId?: string): Promise<JournalEntry> {
  const entry: JournalEntry = {
    id: randomUUID(),
    deviceId,
    userId: deviceId,
    text,
    body: text,
    relatedContentId,
    createdAt: new Date().toISOString(),
  };

  // Syncs to Supabase and updates local mirror
  await JournalRepository.create({
    id: entry.id,
    userId: deviceId,
    body: text,
    relatedContentId,
  });

  return entry;
}

export async function listJournalEntries(deviceId: string): Promise<JournalEntry[]> {
  return JournalRepository.listByUser(deviceId);
}

export async function addFavorite(deviceId: string, contentId: string, verseText: string, verseReference: string): Promise<FavoriteVerse> {
  const existingFavorites = await FavoriteVerseRepository.listByUser(deviceId);
  const existing = existingFavorites.find(f => f.contentId === contentId);
  if (existing) return existing;

  const favorite: FavoriteVerse = {
    id: randomUUID(),
    deviceId,
    contentId,
    verseText,
    verseReference,
    createdAt: new Date().toISOString(),
  };

  await FavoriteVerseRepository.create({
    id: favorite.id,
    userId: deviceId,
    contentId,
    verseText,
    verseReference,
  });

  return favorite;
}

export async function listFavorites(deviceId: string): Promise<FavoriteVerse[]> {
  return FavoriteVerseRepository.listByUser(deviceId);
}

// Mood history backed directly by Supabase checkins
export async function moodHistory(deviceId: string, days = 30): Promise<{ date: string; mood: string | null }[]> {
  const checkins = await CheckinRepository.listByUser(deviceId, days * 2);
  const byDate = new Map<string, string>();
  checkins.forEach(c => {
    const dStr = c.createdAt.slice(0, 10);
    if (!byDate.has(dStr)) {
      byDate.set(dStr, c.mood);
    }
  });

  const result: { date: string; mood: string | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, mood: byDate.get(key) || null });
  }
  return result;
}
