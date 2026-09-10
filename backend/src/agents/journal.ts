import { getSupabaseAdmin } from '../supabase';
import { JournalEntry, FavoriteVerse, Mood } from '../types';

function journalEntry(row: any): JournalEntry {
  return { id: row.id, deviceId: row.user_id, text: row.text, relatedContentId: row.related_content_id || undefined, createdAt: row.created_at };
}
function favorite(row: any): FavoriteVerse {
  return { id: row.id, deviceId: row.user_id, contentId: row.content_id, verseText: row.verse_text, verseReference: row.verse_reference, createdAt: row.created_at };
}

export async function addJournalEntry(userId: string, text: string, relatedContentId?: string): Promise<JournalEntry> {
  const { data, error } = await getSupabaseAdmin().from('journal_entries')
    .insert({ user_id: userId, text, related_content_id: relatedContentId || null }).select().single();
  if (error) throw new Error(`could not save journal entry: ${error.message}`);
  return journalEntry(data);
}

export async function listJournalEntries(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await getSupabaseAdmin().from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw new Error(`could not load journal entries: ${error.message}`);
  return (data ?? []).map(journalEntry);
}

export async function addFavorite(userId: string, contentId: string, verseText: string, verseReference: string): Promise<FavoriteVerse> {
  const { data, error } = await getSupabaseAdmin().from('favorite_verses').upsert({
    user_id: userId, content_id: contentId, verse_text: verseText, verse_reference: verseReference,
  }, { onConflict: 'user_id,content_id' }).select().single();
  if (error) throw new Error(`could not save favorite: ${error.message}`);
  return favorite(data);
}

export async function listFavorites(userId: string): Promise<FavoriteVerse[]> {
  const { data, error } = await getSupabaseAdmin().from('favorite_verses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw new Error(`could not load favorites: ${error.message}`);
  return (data ?? []).map(favorite);
}

export async function moodHistory(userId: string, days = 30): Promise<{ date: string; mood: Mood | null }[]> {
  const start = new Date(); start.setUTCDate(start.getUTCDate() - days + 1);
  const { data, error } = await getSupabaseAdmin().from('checkins').select('created_at,mood').eq('user_id', userId)
    .gte('created_at', start.toISOString()).order('created_at', { ascending: true });
  if (error) throw new Error(`could not load mood history: ${error.message}`);
  const byDate = new Map<string, Mood>();
  for (const row of data ?? []) byDate.set((row as any).created_at.slice(0, 10), (row as any).mood as Mood);
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(); day.setUTCDate(day.getUTCDate() - (days - index - 1));
    const date = day.toISOString().slice(0, 10);
    return { date, mood: byDate.get(date) || null };
  });
}
