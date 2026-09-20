import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { Mood, GeneratedContent, StreakRecord } from '../types';
import { retrieveVerse } from './verseRetrieval';
import { generateContent } from './contentGeneration';
import { reviewContent } from './safetyReview';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export interface CheckinResult {
  content: GeneratedContent;
  streak: StreakRecord;
  supportNoteNeeded: boolean;
}

export async function runCheckin(deviceId: string, mood: Mood, note?: string): Promise<CheckinResult> {
  const database = db.read();

  // 1. Log the check-in (mood_checkins)
  const checkinId = randomUUID();
  database.checkins.push({ id: checkinId, deviceId, mood, note, createdAt: new Date().toISOString() });

  // 2. Verse retrieval agent
  const verse = retrieveVerse(deviceId, mood);

  // 3. Content generation agent
  const pieces = await generateContent(mood, verse, note);

  // 4. Theology & safety review agent
  const review = reviewContent(note, pieces);

  // 5. Assemble + persist generated_content
  const content: GeneratedContent = {
    id: randomUUID(),
    checkinId,
    verseText: verse.text,
    verseReference: verse.reference,
    whyThisVerse: pieces.whyThisVerse,
    meditation: pieces.meditation,
    reflectionQuestion: pieces.reflectionQuestion,
    prayer: pieces.prayer,
    actionStep: pieces.actionStep,
    reviewVerdict: review.verdict,
    modelMode: pieces.mode,
    createdAt: new Date().toISOString(),
  };
  database.content.push(content);

  // 6. Update streak
  const today = todayStr();
  let streak = database.streaks[deviceId];
  if (!streak) {
    streak = { deviceId, current: 1, longest: 1, lastCheckIn: today, history: [] };
  } else if (streak.lastCheckIn !== today) {
    const gap = daysBetween(streak.lastCheckIn, today);
    streak.current = gap === 1 ? streak.current + 1 : 1;
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastCheckIn = today;
  }
  streak.history = [...streak.history.filter(h => h.date !== today), { date: today, mood }].slice(-30);
  database.streaks[deviceId] = streak;

  db.write(database);

  // Durable sync to Supabase when configured
  try {
    const { CheckinRepository, ProfileRepository, StreakRepository, GeneratedContentRepository } = await import('../repositories');
    await CheckinRepository.create({
      id: checkinId,
      userId: deviceId,
      mood,
      note,
    });
    await GeneratedContentRepository.create({
      id: content.id,
      checkinId: content.checkinId,
      userId: deviceId,
      verseText: content.verseText,
      verseReference: content.verseReference,
      whyThisVerse: content.whyThisVerse,
      meditation: content.meditation,
      reflectionQuestion: content.reflectionQuestion,
      prayer: content.prayer,
      actionStep: content.actionStep,
      reviewVerdict: content.reviewVerdict,
      modelMode: content.modelMode,
    });
    await StreakRepository.upsert(streak);
    await ProfileRepository.upsert({
      id: deviceId,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      lastCheckinDate: today,
    });
  } catch (syncErr) {
    // Non-blocking: local store remains mirror if offline
  }

  return { content, streak, supportNoteNeeded: review.supportNoteNeeded };
}

export async function getStreak(deviceId: string): Promise<StreakRecord | null> {
  const { StreakRepository } = await import('../repositories');
  return StreakRepository.get(deviceId);
}

export function fileFlag(contentId: string, deviceId: string, reason?: string) {
  const database = db.read();
  const flag = {
    id: randomUUID(),
    contentId,
    deviceId,
    reason,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
  database.flags.push(flag);
  db.write(database);
  return flag;
}
