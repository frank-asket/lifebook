import { getSupabaseAdmin, isSupabaseConfigured } from '../supabase';
import { db } from '../db';
import { Checkin, JournalEntry } from '../types';

export interface UserProfile {
  id: string; // Clerk sub ID
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  timezone: string;
  translationPreference: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate?: string;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// 1. User Profiles Repository (Clerk sub -> Supabase profiles)
// --------------------------------------------------------------------------
export const ProfileRepository = {
  async get(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      const prefs = local.preferences[userId] || {};
      const streak = local.streaks[userId] || { current: 0, longest: 0 };
      return {
        id: userId,
        timezone: prefs.timezone || 'UTC',
        translationPreference: prefs.translation || 'KJV',
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastCheckinDate: streak.lastCheckinDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      timezone: data.timezone || 'UTC',
      translationPreference: data.translation_preference || 'KJV',
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      lastCheckinDate: data.last_checkin_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async upsert(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      if (profile.timezone || profile.translationPreference) {
        local.preferences[profile.id] = {
          ...local.preferences[profile.id],
          ...(profile.timezone ? { timezone: profile.timezone } : {}),
          ...(profile.translationPreference ? { translation: profile.translationPreference } : {}),
        };
      }
      db.write(local);
      return (await this.get(profile.id))!;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        ...(profile.email !== undefined ? { email: profile.email } : {}),
        ...(profile.fullName !== undefined ? { full_name: profile.fullName } : {}),
        ...(profile.avatarUrl !== undefined ? { avatar_url: profile.avatarUrl } : {}),
        ...(profile.timezone !== undefined ? { timezone: profile.timezone } : {}),
        ...(profile.translationPreference !== undefined ? { translation_preference: profile.translationPreference } : {}),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert profile: ${error.message}`);
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      timezone: data.timezone,
      translationPreference: data.translation_preference,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastCheckinDate: data.last_checkin_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// --------------------------------------------------------------------------
// 2. Checkins Repository
// --------------------------------------------------------------------------
export const CheckinRepository = {
  async listByUser(userId: string, limit = 30): Promise<Checkin[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return local.checkins
        .filter((c) => c.userId === userId)
        .slice(-limit)
        .reverse();
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      mood: row.mood,
      note: row.note || undefined,
      createdAt: row.created_at,
    }));
  },

  async create(checkin: { id: string; userId: string; mood: string; note?: string }): Promise<void> {
    // 1. Always keep local mirror updated
    const local = db.read();
    local.checkins.push({
      id: checkin.id,
      userId: checkin.userId,
      mood: checkin.mood as any,
      note: checkin.note,
      createdAt: new Date().toISOString(),
    });
    db.write(local);

    // 2. Persist to Supabase when configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from('checkins').insert({
        id: checkin.id,
        user_id: checkin.userId,
        mood: checkin.mood,
        note: checkin.note || null,
        created_at: new Date().toISOString(),
      });
    }
  },
};

// --------------------------------------------------------------------------
// 3. Journal Entries Repository (Private user entries)
// --------------------------------------------------------------------------
export const JournalRepository = {
  async listByUser(userId: string): Promise<JournalEntry[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return (local.journalEntries || [])
        .filter((j) => j.userId === userId)
        .slice()
        .reverse();
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      body: row.body,
      passageReference: row.passage_reference || undefined,
      tags: row.tags || [],
      createdAt: row.created_at,
    }));
  },

  async create(entry: {
    id: string;
    userId: string;
    body: string;
    title?: string;
    passageReference?: string;
    tags?: string[];
  }): Promise<void> {
    const local = db.read();
    if (!local.journalEntries) local.journalEntries = [];
    local.journalEntries.push({
      id: entry.id,
      userId: entry.userId,
      body: entry.body,
      passageReference: entry.passageReference,
      tags: entry.tags,
      createdAt: new Date().toISOString(),
    });
    db.write(local);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from('journal_entries').insert({
        id: entry.id,
        user_id: entry.userId,
        body: entry.body,
        title: entry.title || null,
        passage_reference: entry.passageReference || null,
        tags: entry.tags || [],
        created_at: new Date().toISOString(),
      });
    }
  },
};
