import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseAdmin } from '../supabase';
import { Journey, JourneyDay, UserJourneyProgress, Mood } from '../types';
import { moodHistory } from './journal';

const CATALOG: { journeys: Journey[]; days: JourneyDay[] } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'journeys.json'), 'utf-8')
);

export function listJourneys(): Journey[] {
  return CATALOG.journeys;
}

export function getJourney(journeyId: string): Journey | null {
  return CATALOG.journeys.find(j => j.id === journeyId) || null;
}

export function getJourneyDay(journeyId: string, dayNumber: number): JourneyDay | null {
  return CATALOG.days.find(d => d.journeyId === journeyId && d.dayNumber === dayNumber) || null;
}

function progressFromRow(row: any): UserJourneyProgress {
  return { journeyId: row.journey_id, currentDay: row.current_day, completedDays: row.completed_days || [], startedAt: row.started_at, completedAt: row.completed_at || undefined };
}

export async function listUserJourneys(userId: string): Promise<UserJourneyProgress[]> {
  const { data, error } = await getSupabaseAdmin().from('user_journey_progress').select('*').eq('user_id', userId).order('started_at', { ascending: true });
  if (error) throw new Error(`could not load journeys: ${error.message}`);
  return (data ?? []).map(progressFromRow);
}

export async function startJourney(userId: string, journeyId: string): Promise<UserJourneyProgress> {
  const journey = getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');
  const client = getSupabaseAdmin();
  const { data, error } = await client.from('user_journey_progress').upsert(
    { user_id: userId, journey_id: journeyId, current_day: 1, completed_days: [] },
    { onConflict: 'user_id,journey_id', ignoreDuplicates: true },
  ).select().maybeSingle();
  if (error) throw new Error(`could not start journey: ${error.message}`);
  if (data) return progressFromRow(data);
  const { data: existing, error: existingError } = await client.from('user_journey_progress').select('*')
    .eq('user_id', userId).eq('journey_id', journeyId).single();
  if (existingError) throw new Error(`could not load started journey: ${existingError.message}`);
  return progressFromRow(existing);
}

// The "active" journey shown on Home is the most recently started one that
// isn't finished yet — if the user has multiple in progress, the newest
// takes priority for the home screen's Continue card.
export async function getActiveJourney(userId: string): Promise<{ journey: Journey; progress: UserJourneyProgress; day: JourneyDay } | null> {
  const list = (await listUserJourneys(userId)).filter(p => !p.completedAt);
  if (list.length === 0) return null;
  const progress = list[list.length - 1];
  const journey = getJourney(progress.journeyId);
  const day = journey ? getJourneyDay(progress.journeyId, progress.currentDay) : null;
  if (!journey || !day) return null;
  return { journey, progress, day };
}

export async function completeDay(userId: string, journeyId: string): Promise<UserJourneyProgress> {
  const journey = getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');

  const { data, error } = await getSupabaseAdmin().rpc('complete_user_journey_day', {
    p_user_id: userId, p_journey_id: journeyId, p_total_days: journey.totalDays,
  });
  if (error) throw new Error(`could not complete journey day: ${error.message}`);
  return progressFromRow((data as any[])[0]);
}

export interface JourneyRecommendation {
  journey: Journey;
  reason: string;
  personalized: boolean;
}

// --------------------------------------------------------------------------
// Real personalization, not a static "recommended" label: scores each
// not-yet-started journey against the user's actual mood history from the
// last 7 days (via journal.ts's moodHistory, which is itself derived from
// real check-ins — see journal.ts's own comment on that).
//
// Mood vocabulary is the research-grounded 6-mood set (grateful, peaceful,
// seeking, doubting, distant, convicted) — see root README for the sourcing
// (LifeWay Research on doubt, Barna Group on spiritual transformation
// stages, and documented spiritual dryness literature). "Overcoming Fear"
// maps to doubting/convicted since fear and doubt are closely linked
// pastorally — a defensible connection this journey didn't have under the
// previous upbeat-only mood set.
// --------------------------------------------------------------------------
// Same grammar concern as contentGeneration.ts's dev fallback — "feeling
// doubting" isn't valid English, so each mood needs its own natural clause.
const MOOD_STATE: Record<Mood, string> = {
  grateful: 'feeling grateful',
  peaceful: 'feeling peaceful',
  seeking: 'in a season of seeking',
  doubting: 'wrestling with doubt',
  distant: 'feeling distant from God',
  convicted: 'feeling convicted',
};

export async function getRecommendedJourney(userId: string): Promise<JourneyRecommendation | null> {
  const started = new Set((await listUserJourneys(userId)).map(p => p.journeyId));
  const candidates = CATALOG.journeys.filter(j => !started.has(j.id));
  if (candidates.length === 0) return null;

  const history = await moodHistory(userId, 7);
  const counts: Partial<Record<Mood, number>> = {};
  for (const entry of history) {
    if (entry.mood) counts[entry.mood as Mood] = (counts[entry.mood as Mood] || 0) + 1;
  }

  let best: Journey | null = null;
  let bestScore = 0;
  let bestMood: Mood | null = null;

  for (const journey of candidates) {
    for (const mood of journey.recommendedMoods) {
      const score = counts[mood as Mood] || 0;
      if (score > bestScore) {
        bestScore = score;
        best = journey;
        bestMood = mood as Mood;
      }
    }
  }

  if (best && bestScore > 0) {
    return {
      journey: best,
      reason: `Because you've been ${MOOD_STATE[bestMood!]} this week`,
      personalized: true,
    };
  }

  // No mood signal strong enough to personalize — fall back to catalog order.
  return {
    journey: candidates[0],
    reason: history.every(h => !h.mood) ? 'A good place to start' : 'Something new to try',
    personalized: false,
  };
}
