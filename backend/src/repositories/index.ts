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

// --------------------------------------------------------------------------
// 4. Prayer Requests Repository (Grounded with Moderation staging)
// --------------------------------------------------------------------------
export const PrayerRepository = {
  async listApproved(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return local.prayerRequests
        .filter((r) => r.moderationStatus === 'approved')
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      deviceId: row.user_id,
      authorName: 'A LifeBook user',
      text: row.text,
      category: row.category || undefined,
      prayerCount: row.prayer_count || 0,
      moderationStatus: row.moderation_status,
      createdAt: row.created_at,
    }));
  },

  async create(item: {
    id: string;
    userId: string;
    text: string;
    category?: string;
    moderationStatus: 'approved' | 'pending' | 'rejected';
    aiFlaggedReason?: string;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from('prayer_requests').insert({
        id: item.id,
        user_id: item.userId,
        text: item.text,
        category: item.category || null,
        moderation_status: item.moderationStatus,
        prayer_count: 0,
        created_at: new Date().toISOString(),
      });

      // If pending or rejected, stage in moderation reviews for pastoral oversight
      if (item.moderationStatus !== 'approved') {
        await supabase.from('moderation_reviews').insert({
          content_type: 'prayer_request',
          content_id: item.id,
          submitted_by: item.userId,
          content_text: item.text,
          ai_flagged_reason: item.aiFlaggedReason || 'Flagged by safety policy',
          status: item.moderationStatus === 'rejected' ? 'rejected' : 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }
  },

  async pray(requestId: string): Promise<number> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('prayer_requests')
        .select('prayer_count')
        .eq('id', requestId)
        .single();
      const newCount = (data?.prayer_count || 0) + 1;
      await supabase
        .from('prayer_requests')
        .update({ prayer_count: newCount })
        .eq('id', requestId);
      return newCount;
    }
    return 1;
  },
};

// --------------------------------------------------------------------------
// 5. Discussions Repository (Curated community boards)
// --------------------------------------------------------------------------
export const DiscussionRepository = {
  async listApproved(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return local.discussions
        .filter((d) => d.moderationStatus === 'approved')
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      deviceId: row.user_id,
      authorName: 'A LifeBook user',
      title: row.title,
      body: row.body,
      tags: row.tags || [],
      likeCount: row.like_count || 0,
      replyCount: row.reply_count || 0,
      moderationStatus: row.moderation_status,
      createdAt: row.created_at,
    }));
  },

  async create(item: {
    id: string;
    userId: string;
    title: string;
    body: string;
    tags?: string[];
    moderationStatus: 'approved' | 'pending' | 'rejected';
    aiFlaggedReason?: string;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from('discussions').insert({
        id: item.id,
        user_id: item.userId,
        title: item.title,
        body: item.body,
        tags: item.tags || [],
        moderation_status: item.moderationStatus,
        like_count: 0,
        reply_count: 0,
        created_at: new Date().toISOString(),
      });

      if (item.moderationStatus !== 'approved') {
        await supabase.from('moderation_reviews').insert({
          content_type: 'discussion',
          content_id: item.id,
          submitted_by: item.userId,
          content_text: `${item.title}: ${item.body}`,
          ai_flagged_reason: item.aiFlaggedReason || 'Community standard check',
          status: item.moderationStatus === 'rejected' ? 'rejected' : 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }
  },
};

// --------------------------------------------------------------------------
// 6. Curated Journeys Repository
// --------------------------------------------------------------------------
export const JourneyRepository = {
  async listAll(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('journeys')
        .select('*')
        .eq('is_published', true);
      if (data && data.length > 0) {
        return data.map((j) => ({
          id: j.id,
          title: j.title,
          description: j.description,
          category: j.category,
          totalDays: j.total_days,
          recommendedMoods: j.recommended_moods || [],
        }));
      }
    }
    return [];
  },

  async getDay(journeyId: string, dayNumber: number): Promise<any | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('journey_days')
        .select('*')
        .eq('journey_id', journeyId)
        .eq('day_number', dayNumber)
        .single();
      if (data) {
        return {
          journeyId: data.journey_id,
          dayNumber: data.day_number,
          title: data.title,
          verseReference: data.verse_reference,
          verseText: data.verse_text,
          reflection: data.reflection,
          prayer: data.prayer,
        };
      }
    }
    return null;
  },

  async syncUserProgress(progress: {
    userId: string;
    journeyId: string;
    currentDay: number;
    completedDays: number[];
    completedAt?: string;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase.from('user_journey_progress').upsert({
        user_id: progress.userId,
        journey_id: progress.journeyId,
        current_day: progress.currentDay,
        completed_days: progress.completedDays,
        completed_at: progress.completedAt || null,
      });
    }
  },
};

// --------------------------------------------------------------------------
// 7. LivingWord Teachings Repository
// --------------------------------------------------------------------------
export const TeachingRepository = {
  async listPublished(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('living_word_teachings')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        return data.map((t) => ({
          slug: t.slug,
          title: t.title,
          teacher: t.teacher,
          teacherRole: t.teacher_role,
          category: t.category,
          duration: t.duration,
          scriptureReference: t.scripture_reference,
          excerpt: t.excerpt,
          audioUrl: t.audio_url || undefined,
          videoUrl: t.video_url || undefined,
        }));
      }
    }
    return [];
  },

  async getBySlug(slug: string): Promise<any | null> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('living_word_teachings')
        .select('*')
        .eq('slug', slug)
        .single();
      if (data) {
        return {
          slug: data.slug,
          title: data.title,
          teacher: data.teacher,
          teacherRole: data.teacher_role,
          category: data.category,
          duration: data.duration,
          scriptureReference: data.scripture_reference,
          excerpt: data.excerpt,
          fullTranscript: data.full_transcript || undefined,
          audioUrl: data.audio_url || undefined,
          videoUrl: data.video_url || undefined,
        };
      }
    }
    return null;
  },
};


