import { UserPreferences } from '../types';
import { ProfileRepository } from '../repositories';

export async function savePreferences(deviceId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
  const profile = await ProfileRepository.upsert({
    id: deviceId,
    fullName: updates.displayName,
    spiritualPath: updates.spiritualPath,
    dailyHabits: updates.dailyHabits,
    notificationTime: updates.notificationTime,
    favoriteBooks: updates.favoriteBooks,
    onboardingCompletedAt: updates.onboardingCompletedAt,
    timezone: updates.timezone,
    translationPreference: updates.translation,
  });

  return {
    deviceId,
    displayName: profile.fullName,
    spiritualPath: profile.spiritualPath,
    dailyHabits: profile.dailyHabits,
    notificationTime: profile.notificationTime,
    favoriteBooks: profile.favoriteBooks,
    onboardingCompletedAt: profile.onboardingCompletedAt,
    timezone: profile.timezone,
    translation: profile.translationPreference,
  };
}

export async function getPreferences(deviceId: string): Promise<UserPreferences | null> {
  const profile = await ProfileRepository.get(deviceId);
  if (!profile) return null;

  return {
    deviceId,
    displayName: profile.fullName,
    spiritualPath: profile.spiritualPath,
    dailyHabits: profile.dailyHabits,
    notificationTime: profile.notificationTime,
    favoriteBooks: profile.favoriteBooks,
    onboardingCompletedAt: profile.onboardingCompletedAt,
    timezone: profile.timezone,
    translation: profile.translationPreference,
  };
}
