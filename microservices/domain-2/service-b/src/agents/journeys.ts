import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db';
import { Journey, JourneyDay, UserJourneyProgress, Mood } from '../types';
import { moodHistory } from './journal';
import { JourneyRepository } from '../repositories';

let catalogCache: { journeys: Journey[]; days: JourneyDay[] } | null = null;
function getCatalog(): { journeys: Journey[]; days: JourneyDay[] } {
  if (!catalogCache) {
    catalogCache = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'data', 'journeys.json'), 'utf-8')
    );
  }
  return catalogCache!;
}

export async function listJourneys(): Promise<Journey[]> {
  const supabaseJourneys = await JourneyRepository.listAll();
  if (supabaseJourneys && supabaseJourneys.length > 0) {
    return supabaseJourneys;
  }
  return getCatalog().journeys;
}

export async function getJourney(journeyId: string): Promise<Journey | null> {
  const journeys = await listJourneys();
  return journeys.find(j => j.id === journeyId) || null;
}

export async function getJourneyDay(journeyId: string, dayNumber: number): Promise<JourneyDay | null> {
  const supabaseDay = await JourneyRepository.getDay(journeyId, dayNumber);
  if (supabaseDay) return supabaseDay;
  return getCatalog().days.find(d => d.journeyId === journeyId && d.dayNumber === dayNumber) || null;
}

export async function listUserJourneys(userId: string): Promise<UserJourneyProgress[]> {
  return JourneyRepository.getUserProgress(userId);
}

export async function startJourney(userId: string, journeyId: string): Promise<UserJourneyProgress> {
  const journey = await getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');

  const existingList = await listUserJourneys(userId);
  const existing = existingList.find(p => p.journeyId === journeyId);
  if (existing) return existing;

  const progress: UserJourneyProgress = {
    journeyId,
    currentDay: 1,
    completedDays: [],
    startedAt: new Date().toISOString(),
  };

  await JourneyRepository.syncUserProgress({
    userId,
    journeyId,
    currentDay: progress.currentDay,
    completedDays: progress.completedDays,
  });

  return progress;
}

export async function getActiveJourney(userId: string): Promise<{ journey: Journey; progress: UserJourneyProgress; day: JourneyDay } | null> {
  const list = (await listUserJourneys(userId)).filter(p => !p.completedAt);
  if (list.length === 0) return null;
  const progress = list[list.length - 1];
  const journey = await getJourney(progress.journeyId);
  const day = journey ? await getJourneyDay(progress.journeyId, progress.currentDay) : null;
  if (!journey || !day) return null;
  return { journey, progress, day };
}

export async function completeDay(userId: string, journeyId: string): Promise<UserJourneyProgress> {
  const list = await listUserJourneys(userId);
  const progress = list.find(p => p.journeyId === journeyId);
  if (!progress) throw new Error('Journey not started for this user');

  const journey = await getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');

  if (!progress.completedDays.includes(progress.currentDay)) {
    progress.completedDays.push(progress.currentDay);
  }

  if (progress.currentDay >= journey.totalDays) {
    progress.completedAt = new Date().toISOString();
  } else {
    progress.currentDay += 1;
  }

  await JourneyRepository.syncUserProgress({
    userId,
    journeyId,
    currentDay: progress.currentDay,
    completedDays: progress.completedDays,
    completedAt: progress.completedAt,
  });

  return progress;
}

export interface JourneyRecommendation {
  journey: Journey;
  reason: string;
  personalized: boolean;
}

const MOOD_STATE: Record<Mood, string> = {
  grateful: 'feeling grateful',
  peaceful: 'feeling peaceful',
  seeking: 'in a season of seeking',
  doubting: 'wrestling with doubt',
  distant: 'feeling distant from God',
  convicted: 'feeling convicted',
};

export async function getRecommendedJourney(userId: string): Promise<JourneyRecommendation | null> {
  const catalog = await listJourneys();
  const userProgress = await listUserJourneys(userId);
  const started = new Set(userProgress.map(p => p.journeyId));
  const candidates = catalog.filter(j => !started.has(j.id));
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

  return {
    journey: candidates[0],
    reason: history.every(h => !h.mood) ? 'A good place to start' : 'Something new to try',
    personalized: false,
  };
}
