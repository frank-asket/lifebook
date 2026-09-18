import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db';
import { Journey, JourneyDay, UserJourneyProgress, Mood } from '../types';
import { moodHistory } from './journal';

let catalogCache: { journeys: Journey[]; days: JourneyDay[] } | null = null;
function getCatalog(): { journeys: Journey[]; days: JourneyDay[] } {
  if (!catalogCache) {
    catalogCache = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'data', 'journeys.json'), 'utf-8')
    );
  }
  return catalogCache;
}

export function listJourneys(): Journey[] {
  return getCatalog().journeys;
}

export function getJourney(journeyId: string): Journey | null {
  return getCatalog().journeys.find(j => j.id === journeyId) || null;
}

export function getJourneyDay(journeyId: string, dayNumber: number): JourneyDay | null {
  return getCatalog().days.find(d => d.journeyId === journeyId && d.dayNumber === dayNumber) || null;
}

export function listUserJourneys(userId: string): UserJourneyProgress[] {
  const database = db.read();
  return database.journeyProgress[userId] || [];
}

export function startJourney(userId: string, journeyId: string): UserJourneyProgress {
  const journey = getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');

  const database = db.read();
  if (!database.journeyProgress[userId]) database.journeyProgress[userId] = [];
  const existing = database.journeyProgress[userId].find(p => p.journeyId === journeyId);
  if (existing) return existing; // already started — don't reset progress

  const progress: UserJourneyProgress = {
    journeyId,
    currentDay: 1,
    completedDays: [],
    startedAt: new Date().toISOString(),
  };
  database.journeyProgress[userId].push(progress);
  db.write(database);
  return progress;
}

// The "active" journey shown on Home is the most recently started one that
// isn't finished yet — if the user has multiple in progress, the newest
// takes priority for the home screen's Continue card.
export function getActiveJourney(userId: string): { journey: Journey; progress: UserJourneyProgress; day: JourneyDay } | null {
  const list = listUserJourneys(userId).filter(p => !p.completedAt);
  if (list.length === 0) return null;
  const progress = list[list.length - 1];
  const journey = getJourney(progress.journeyId);
  const day = journey ? getJourneyDay(progress.journeyId, progress.currentDay) : null;
  if (!journey || !day) return null;
  return { journey, progress, day };
}

export function completeDay(userId: string, journeyId: string): UserJourneyProgress {
  const database = db.read();
  const list = database.journeyProgress[userId] || [];
  const progress = list.find(p => p.journeyId === journeyId);
  if (!progress) throw new Error('Journey not started for this user');

  const journey = getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');

  if (!progress.completedDays.includes(progress.currentDay)) {
    progress.completedDays.push(progress.currentDay);
  }

  if (progress.currentDay >= journey.totalDays) {
    progress.completedAt = new Date().toISOString();
  } else {
    progress.currentDay += 1;
  }

  db.write(database);
  return progress;
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

export function getRecommendedJourney(userId: string): JourneyRecommendation | null {
  const database = db.read();
  const started = new Set((database.journeyProgress[userId] || []).map(p => p.journeyId));
  const candidates = CATALOG.journeys.filter(j => !started.has(j.id));
  if (candidates.length === 0) return null;

  const history = moodHistory(userId, 7);
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
