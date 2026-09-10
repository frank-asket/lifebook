import { getSupabaseAdmin } from '../supabase';
import { UserPreferences } from '../types';

type ProfileRow = {
  user_id: string; display_name: string | null; spiritual_path: string | null;
  daily_habits: string[] | null; notification_time: string | null;
  favorite_books: string[] | null; joined_group_suggestion: string | null; onboarding_completed_at: string | null;
};

function toPreferences(row: ProfileRow): UserPreferences {
  return { deviceId: row.user_id, displayName: row.display_name || undefined,
    spiritualPath: row.spiritual_path || undefined, dailyHabits: row.daily_habits || [],
    notificationTime: row.notification_time || undefined, favoriteBooks: row.favorite_books || [],
    joinedGroupSuggestion: row.joined_group_suggestion || undefined,
    onboardingCompletedAt: row.onboarding_completed_at || undefined };
}

export async function savePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
  const row: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
  if (updates.displayName !== undefined) row.display_name = updates.displayName;
  if (updates.spiritualPath !== undefined) row.spiritual_path = updates.spiritualPath;
  if (updates.dailyHabits !== undefined) row.daily_habits = updates.dailyHabits;
  if (updates.notificationTime !== undefined) row.notification_time = updates.notificationTime;
  if (updates.favoriteBooks !== undefined) row.favorite_books = updates.favoriteBooks;
  if (updates.joinedGroupSuggestion !== undefined) row.joined_group_suggestion = updates.joinedGroupSuggestion;
  if (updates.onboardingCompletedAt !== undefined) row.onboarding_completed_at = updates.onboardingCompletedAt;
  const { data, error } = await getSupabaseAdmin().from('profiles').upsert(row, { onConflict: 'user_id' }).select().single();
  if (error) throw new Error(`could not save preferences: ${error.message}`);
  return toPreferences(data as ProfileRow);
}

export async function getPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await getSupabaseAdmin().from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`could not load preferences: ${error.message}`);
  return data ? toPreferences(data as ProfileRow) : null;
}
