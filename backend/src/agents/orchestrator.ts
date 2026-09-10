import { getSupabaseAdmin } from '../supabase';
import { Mood, GeneratedContent, StreakRecord } from '../types';
import { retrieveVerse } from './verseRetrieval';
import { generateContent } from './contentGeneration';
import { reviewContent } from './safetyReview';

export interface CheckinResult { content: GeneratedContent; streak: StreakRecord; supportNoteNeeded: boolean; }

type CheckinRow = { id: string; created_at: string; mood: Mood };
type StreakRow = { current: number; longest: number; last_checkin: string };

function toDate(value: string) { return value.slice(0, 10); }

async function historyFor(userId: string, days = 30): Promise<StreakRecord['history']> {
  const since = new Date(); since.setUTCDate(since.getUTCDate() - days + 1);
  const { data, error } = await getSupabaseAdmin().from('checkins').select('created_at,mood')
    .eq('user_id', userId).gte('created_at', since.toISOString()).order('created_at', { ascending: true });
  if (error) throw new Error(`could not load check-in history: ${error.message}`);
  const byDay = new Map<string, Mood>();
  for (const row of (data ?? []) as CheckinRow[]) byDay.set(toDate(row.created_at), row.mood);
  return [...byDay.entries()].map(([date, mood]) => ({ date, mood }));
}

export async function runCheckin(userId: string, mood: Mood, note?: string): Promise<CheckinResult> {
  // Run the expensive AI work before creating durable records so provider
  // failures do not leave a check-in with no devotional response.
  const verse = retrieveVerse(userId, mood);
  const pieces = await generateContent(mood, verse, note);
  const review = reviewContent(note, pieces);
  const client = getSupabaseAdmin();
  const { data: checkin, error: checkinError } = await client.from('checkins')
    .insert({ user_id: userId, mood, note: note || null }).select('id,created_at,mood').single();
  if (checkinError) throw new Error(`could not save check-in: ${checkinError.message}`);

  const { data: savedContent, error: contentError } = await client.from('generated_content').insert({
    checkin_id: (checkin as CheckinRow).id, user_id: userId, verse_text: verse.text,
    verse_reference: verse.reference, why_this_verse: pieces.whyThisVerse, meditation: pieces.meditation,
    reflection_question: pieces.reflectionQuestion, prayer: pieces.prayer, action_step: pieces.actionStep,
    review_verdict: review.verdict, model_mode: pieces.mode,
  }).select().single();
  if (contentError) throw new Error(`could not save generated content: ${contentError.message}`);

  const day = toDate((checkin as CheckinRow).created_at);
  const { data: streakRows, error: streakError } = await client.rpc('record_user_streak', { p_user_id: userId, p_day: day });
  if (streakError) throw new Error(`could not update streak: ${streakError.message}`);
  const streakRow = (streakRows as StreakRow[])[0];
  const history = await historyFor(userId);
  const content = savedContent as Record<string, string>;
  return {
    content: { id: content.id, checkinId: content.checkin_id, verseText: content.verse_text,
      verseReference: content.verse_reference, whyThisVerse: content.why_this_verse,
      meditation: content.meditation, reflectionQuestion: content.reflection_question,
      prayer: content.prayer, actionStep: content.action_step,
      reviewVerdict: content.review_verdict as GeneratedContent['reviewVerdict'],
      modelMode: content.model_mode as GeneratedContent['modelMode'], createdAt: content.created_at },
    streak: { deviceId: userId, current: streakRow.current, longest: streakRow.longest,
      lastCheckIn: streakRow.last_checkin, history }, supportNoteNeeded: review.supportNoteNeeded,
  };
}

export async function getStreak(userId: string): Promise<StreakRecord | null> {
  const { data, error } = await getSupabaseAdmin().from('streaks').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`could not load streak: ${error.message}`);
  if (!data) return null;
  const row = data as StreakRow;
  return { deviceId: userId, current: row.current, longest: row.longest, lastCheckIn: row.last_checkin, history: await historyFor(userId) };
}

// Flags remain on the legacy repository until the community/moderation slice
// migrates. They are deliberately not mixed into the Supabase user-data path.
export { fileFlag } from './legacyFlags';
