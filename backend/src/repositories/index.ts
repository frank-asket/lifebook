import { getSupabaseAdmin, isSupabaseConfigured } from '../supabase';
import { db } from '../db';
import { Checkin, JournalEntry, FavoriteVerse, StreakRecord, UserPreferences, Subscription, PushToken, Journey, JourneyDay, UserJourneyProgress, Mood, Playlist, PlaylistItem } from '../types';

export interface UserProfile {
  id: string; // Clerk sub ID or deviceId
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  timezone?: string;
  translationPreference?: string;
  spiritualPath?: string;
  dailyHabits?: string[];
  notificationTime?: string;
  favoriteBooks?: string[];
  onboardingCompletedAt?: string;
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
      const prefs = local.preferences[userId] || { deviceId: userId };
      const streak = local.streaks[userId] || { deviceId: userId, current: 0, longest: 0, lastCheckIn: '', history: [] };
      return {
        id: userId,
        fullName: prefs.displayName,
        timezone: prefs.timezone || 'UTC',
        translationPreference: prefs.translation || 'KJV',
        spiritualPath: prefs.spiritualPath,
        dailyHabits: prefs.dailyHabits || [],
        notificationTime: prefs.notificationTime,
        favoriteBooks: prefs.favoriteBooks || [],
        onboardingCompletedAt: prefs.onboardingCompletedAt,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastCheckinDate: streak.lastCheckIn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const supabase = getSupabaseAdmin();
      // Look up by user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        // Fallback to local memory if not found yet in Supabase
        const local = db.read();
        const prefs = local.preferences[userId] || { deviceId: userId };
        const streak = local.streaks[userId] || { deviceId: userId, current: 0, longest: 0, lastCheckIn: '', history: [] };
        return {
          id: userId,
          fullName: prefs.displayName,
          timezone: prefs.timezone || 'UTC',
          translationPreference: prefs.translation || 'KJV',
          spiritualPath: prefs.spiritualPath,
          dailyHabits: prefs.dailyHabits || [],
          notificationTime: prefs.notificationTime,
          favoriteBooks: prefs.favoriteBooks || [],
          onboardingCompletedAt: prefs.onboardingCompletedAt,
          currentStreak: streak.current,
          longestStreak: streak.longest,
          lastCheckinDate: streak.lastCheckIn,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: data.user_id || data.id,
        email: data.email,
        fullName: data.display_name || data.full_name,
        avatarUrl: data.avatar_url,
        timezone: data.timezone || 'UTC',
        translationPreference: data.translation_preference || 'KJV',
        spiritualPath: data.spiritual_path,
        dailyHabits: data.daily_habits || [],
        notificationTime: data.notification_time,
        favoriteBooks: data.favorite_books || [],
        onboardingCompletedAt: data.onboarding_completed_at,
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        lastCheckinDate: data.last_checkin_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch {
      const local = db.read();
      const prefs = local.preferences[userId] || { deviceId: userId };
      const streak = local.streaks[userId] || { deviceId: userId, current: 0, longest: 0, lastCheckIn: '', history: [] };
      return {
        id: userId,
        fullName: prefs.displayName,
        timezone: prefs.timezone || 'UTC',
        translationPreference: prefs.translation || 'KJV',
        spiritualPath: prefs.spiritualPath,
        dailyHabits: prefs.dailyHabits || [],
        notificationTime: prefs.notificationTime,
        favoriteBooks: prefs.favoriteBooks || [],
        onboardingCompletedAt: prefs.onboardingCompletedAt,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastCheckinDate: streak.lastCheckIn,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async upsert(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    // 1. Always update local mirror
    const local = db.read();
    local.preferences[profile.id] = {
      ...local.preferences[profile.id],
      deviceId: profile.id,
      displayName: profile.fullName || local.preferences[profile.id]?.displayName,
      spiritualPath: profile.spiritualPath || local.preferences[profile.id]?.spiritualPath,
      dailyHabits: profile.dailyHabits || local.preferences[profile.id]?.dailyHabits,
      notificationTime: profile.notificationTime || local.preferences[profile.id]?.notificationTime,
      favoriteBooks: profile.favoriteBooks || local.preferences[profile.id]?.favoriteBooks,
      onboardingCompletedAt: profile.onboardingCompletedAt || local.preferences[profile.id]?.onboardingCompletedAt,
      timezone: profile.timezone || local.preferences[profile.id]?.timezone,
      translation: profile.translationPreference || local.preferences[profile.id]?.translation,
    };
    db.write(local);

    if (!isSupabaseConfigured()) {
      return (await this.get(profile.id))!;
    }

    try {
      const supabase = getSupabaseAdmin();
      const payload: Record<string, any> = {
        user_id: profile.id,
        updated_at: new Date().toISOString(),
      };
      if (profile.fullName !== undefined) payload.display_name = profile.fullName;
      if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl;
      if (profile.spiritualPath !== undefined) payload.spiritual_path = profile.spiritualPath;
      if (profile.dailyHabits !== undefined) payload.daily_habits = profile.dailyHabits;
      if (profile.notificationTime !== undefined) payload.notification_time = profile.notificationTime;
      if (profile.favoriteBooks !== undefined) payload.favorite_books = profile.favoriteBooks;
      if (profile.onboardingCompletedAt !== undefined) payload.onboarding_completed_at = profile.onboardingCompletedAt;

      await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Profile Supabase upsert error:', e);
    }

    return (await this.get(profile.id))!;
  },
};

// --------------------------------------------------------------------------
// 2. Streaks Repository (Synchronized across Web & Mobile platforms)
// --------------------------------------------------------------------------
export const StreakRepository = {
  async get(userId: string): Promise<StreakRecord | null> {
    const local = db.read();
    const localStreak = local.streaks[userId] || null;

    if (!isSupabaseConfigured()) {
      return localStreak;
    }

    try {
      const supabase = getSupabaseAdmin();

      // Query Supabase streaks table
      const { data: streakRow } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Query latest checkins to build history and verify streak freshness
      const { data: checkinRows } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      const history: { date: string; mood: Mood }[] = (checkinRows || []).map((c: any) => ({
        date: c.created_at.slice(0, 10),
        mood: c.mood as Mood,
      }));

      // Calculate streak status
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      let current = streakRow?.current ?? localStreak?.current ?? 0;
      let longest = streakRow?.longest ?? localStreak?.longest ?? 0;
      let lastCheckIn = streakRow?.last_checkin ?? localStreak?.lastCheckIn ?? (history[0]?.date || '');

      // Verify if streak has lapsed (more than 1 day missed)
      if (lastCheckIn && lastCheckIn !== todayStr && lastCheckIn !== yesterdayStr) {
        current = 0; // streak broken
      }
      longest = Math.max(longest, current);

      const combined: StreakRecord = {
        deviceId: userId,
        current,
        longest,
        lastCheckIn,
        history: history.length > 0 ? history : (localStreak?.history || []),
      };

      // Keep local in sync
      local.streaks[userId] = combined;
      db.write(local);

      return combined;
    } catch (err) {
      console.warn('StreakRepository.get Supabase error, using local:', err);
      return localStreak;
    }
  },

  async upsert(streak: StreakRecord): Promise<void> {
    // 1. Update local database
    const local = db.read();
    local.streaks[streak.deviceId] = streak;
    db.write(local);

    // 2. Persist to Supabase streaks table
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('streaks').upsert({
          user_id: streak.deviceId,
          current: streak.current,
          longest: streak.longest,
          last_checkin: streak.lastCheckIn || new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('Failed to upsert streak to Supabase:', err);
      }
    }
  },
};

// --------------------------------------------------------------------------
// 3. Checkins Repository
// --------------------------------------------------------------------------
export const CheckinRepository = {
  async listByUser(userId: string, limit = 30): Promise<Checkin[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return local.checkins
        .filter((c) => c.userId === userId || c.deviceId === userId)
        .slice(-limit)
        .reverse();
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        const local = db.read();
        return local.checkins
          .filter((c) => c.userId === userId || c.deviceId === userId)
          .slice(-limit)
          .reverse();
      }

      return data.map((row: any) => ({
        id: row.id,
        deviceId: row.user_id,
        userId: row.user_id,
        mood: row.mood,
        note: row.note || undefined,
        createdAt: row.created_at,
      }));
    } catch {
      const local = db.read();
      return local.checkins
        .filter((c) => c.userId === userId || c.deviceId === userId)
        .slice(-limit)
        .reverse();
    }
  },

  async create(checkin: { id: string; userId: string; mood: string; note?: string }): Promise<void> {
    // 1. Always keep local mirror updated
    const local = db.read();
    local.checkins.push({
      id: checkin.id,
      deviceId: checkin.userId,
      userId: checkin.userId,
      mood: checkin.mood as any,
      note: checkin.note,
      createdAt: new Date().toISOString(),
    });
    db.write(local);

    // 2. Persist to Supabase when configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('checkins').insert({
          id: checkin.id,
          user_id: checkin.userId,
          mood: checkin.mood,
          note: checkin.note || null,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Checkin Supabase insert error:', e);
      }
    }
  },
};

// --------------------------------------------------------------------------
// 4. Generated Content Repository
// --------------------------------------------------------------------------
export const GeneratedContentRepository = {
  async create(content: {
    id: string;
    checkinId: string;
    userId: string;
    verseText: string;
    verseReference: string;
    whyThisVerse: string;
    meditation: string;
    reflectionQuestion: string;
    prayer: string;
    actionStep: string;
    reviewVerdict: string;
    modelMode: string;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('generated_content').insert({
          id: content.id,
          checkin_id: content.checkinId,
          user_id: content.userId,
          verse_text: content.verseText,
          verse_reference: content.verseReference,
          why_this_verse: content.whyThisVerse,
          meditation: content.meditation,
          reflection_question: content.reflectionQuestion,
          prayer: content.prayer,
          action_step: content.actionStep,
          review_verdict: content.reviewVerdict,
          model_mode: content.modelMode,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('GeneratedContent Supabase insert error:', e);
      }
    }
  },
};

// --------------------------------------------------------------------------
// 5. Journal Entries Repository (Private user entries, offline-syncable)
// --------------------------------------------------------------------------
export const JournalRepository = {
  async listByUser(userId: string): Promise<JournalEntry[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return (local.journalEntries || [])
        .filter((j) => j.userId === userId || j.deviceId === userId)
        .slice()
        .reverse();
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const local = db.read();
        return (local.journalEntries || [])
          .filter((j) => j.userId === userId || j.deviceId === userId)
          .slice()
          .reverse();
      }

      return data.map((row: any) => ({
        id: row.id,
        deviceId: row.user_id,
        userId: row.user_id,
        text: row.text || row.body,
        body: row.text || row.body,
        relatedContentId: row.related_content_id || undefined,
        createdAt: row.created_at,
      }));
    } catch {
      const local = db.read();
      return (local.journalEntries || [])
        .filter((j) => j.userId === userId || j.deviceId === userId)
        .slice()
        .reverse();
    }
  },

  async create(entry: {
    id: string;
    userId: string;
    body: string;
    title?: string;
    passageReference?: string;
    relatedContentId?: string;
    tags?: string[];
  }): Promise<void> {
    const local = db.read();
    if (!local.journalEntries) local.journalEntries = [];
    const exists = local.journalEntries.some(j => j.id === entry.id);
    if (!exists) {
      local.journalEntries.push({
        id: entry.id,
        deviceId: entry.userId,
        userId: entry.userId,
        text: entry.body,
        body: entry.body,
        passageReference: entry.passageReference,
        relatedContentId: entry.relatedContentId,
        tags: entry.tags,
        createdAt: new Date().toISOString(),
      });
      db.write(local);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('journal_entries').upsert({
          id: entry.id,
          user_id: entry.userId,
          text: entry.body,
          related_content_id: entry.relatedContentId || null,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Journal Supabase insert error:', e);
      }
    }
  },
};

// --------------------------------------------------------------------------
// 6. Favorite Verses Repository
// --------------------------------------------------------------------------
export const FavoriteVerseRepository = {
  async listByUser(userId: string): Promise<FavoriteVerse[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return (local.favorites || [])
        .filter(f => f.deviceId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('favorite_verses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const local = db.read();
        return (local.favorites || [])
          .filter(f => f.deviceId === userId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      }

      return data.map((row: any) => ({
        id: row.id,
        deviceId: row.user_id,
        contentId: row.content_id,
        verseText: row.verse_text,
        verseReference: row.verse_reference,
        createdAt: row.created_at,
      }));
    } catch {
      const local = db.read();
      return (local.favorites || [])
        .filter(f => f.deviceId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
  },

  async create(fav: {
    id: string;
    userId: string;
    contentId: string;
    verseText: string;
    verseReference: string;
  }): Promise<void> {
    const local = db.read();
    if (!local.favorites) local.favorites = [];
    const exists = local.favorites.find(f => f.deviceId === fav.userId && f.contentId === fav.contentId);
    if (!exists) {
      local.favorites.push({
        id: fav.id,
        deviceId: fav.userId,
        contentId: fav.contentId,
        verseText: fav.verseText,
        verseReference: fav.verseReference,
        createdAt: new Date().toISOString(),
      });
      db.write(local);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('favorite_verses').upsert({
          id: fav.id,
          user_id: fav.userId,
          content_id: fav.contentId,
          verse_text: fav.verseText,
          verse_reference: fav.verseReference,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id,content_id' });
      } catch (e) {
        console.warn('FavoriteVerse Supabase error:', e);
      }
    }
  },
};

// --------------------------------------------------------------------------
// 7. Prayer Requests Repository
// --------------------------------------------------------------------------
export const PrayerRepository = {
  async listApproved(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return local.prayerRequests
        .filter((r) => r.moderationStatus === 'approved')
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const local = db.read();
        return local.prayerRequests
          .filter((r) => r.moderationStatus === 'approved')
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      }

      return data.map((row: any) => ({
        id: row.id,
        deviceId: row.user_id,
        authorName: 'A LifeBook user',
        text: row.text,
        category: row.category || undefined,
        prayerCount: row.prayer_count || 0,
        moderationStatus: row.moderation_status,
        createdAt: row.created_at,
      }));
    } catch {
      const local = db.read();
      return local.prayerRequests
        .filter((r) => r.moderationStatus === 'approved')
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
  },

  async create(item: {
    id: string;
    userId: string;
    text: string;
    category?: string;
    moderationStatus: 'approved' | 'pending' | 'rejected';
    aiFlaggedReason?: string;
  }): Promise<void> {
    const local = db.read();
    local.prayerRequests.push({
      id: item.id,
      deviceId: item.userId,
      authorName: 'A LifeBook user',
      text: item.text,
      category: item.category,
      prayerCount: 0,
      moderationStatus: item.moderationStatus,
      createdAt: new Date().toISOString(),
    });
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
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
      } catch (e) {
        console.warn('Prayer Supabase insert error:', e);
      }
    }
  },

  async pray(requestId: string): Promise<number> {
    const local = db.read();
    const req = local.prayerRequests.find(r => r.id === requestId);
    if (req) {
      req.prayerCount += 1;
      db.write(local);
    }

    if (isSupabaseConfigured()) {
      try {
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
      } catch {
        return req?.prayerCount || 1;
      }
    }
    return req?.prayerCount || 1;
  },
};

// --------------------------------------------------------------------------
// 8. Discussions Repository
// --------------------------------------------------------------------------
export const DiscussionRepository = {
  async listApproved(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return local.discussions
        .filter((d) => d.moderationStatus === 'approved')
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const local = db.read();
        return local.discussions
          .filter((d) => d.moderationStatus === 'approved')
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      }

      return data.map((row: any) => ({
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
    } catch {
      const local = db.read();
      return local.discussions
        .filter((d) => d.moderationStatus === 'approved')
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
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
    const local = db.read();
    local.discussions.push({
      id: item.id,
      deviceId: item.userId,
      authorName: 'A LifeBook user',
      title: item.title,
      body: item.body,
      tags: item.tags || [],
      likeCount: 0,
      replyCount: 0,
      moderationStatus: item.moderationStatus,
      createdAt: new Date().toISOString(),
    });
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
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
      } catch (e) {
        console.warn('Discussion Supabase insert error:', e);
      }
    }
  },

  async like(id: string): Promise<any> {
    const local = db.read();
    const d = local.discussions.find(x => x.id === id);
    if (d) {
      d.likeCount += 1;
      db.write(local);
    }
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase.from('discussions').select('like_count').eq('id', id).single();
        const next = (data?.like_count || 0) + 1;
        await supabase.from('discussions').update({ like_count: next }).eq('id', id);
      } catch (e) {
        console.warn('Discussion like Supabase error:', e);
      }
    }
    return d;
  },

  async listReplies(discussionId: string): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      const local = db.read();
      return local.discussionReplies
        .filter(r => r.discussionId === discussionId)
        .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        const local = db.read();
        return local.discussionReplies
          .filter(r => r.discussionId === discussionId)
          .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
      }

      return data.map((r: any) => ({
        id: r.id,
        discussionId: r.discussion_id,
        authorName: 'A LifeBook user',
        text: r.text,
        createdAt: r.created_at,
      }));
    } catch {
      const local = db.read();
      return local.discussionReplies
        .filter(r => r.discussionId === discussionId)
        .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    }
  },

  async reply(discussionId: string, reply: { id: string; userId: string; text: string }): Promise<any> {
    const local = db.read();
    const r = {
      id: reply.id,
      discussionId,
      deviceId: reply.userId,
      authorName: 'A LifeBook user',
      text: reply.text,
      createdAt: new Date().toISOString(),
    };
    local.discussionReplies.push(r);
    const parent = local.discussions.find(d => d.id === discussionId);
    if (parent) parent.replyCount += 1;
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('discussion_replies').insert({
          id: reply.id,
          discussion_id: discussionId,
          user_id: reply.userId,
          text: reply.text,
          created_at: new Date().toISOString(),
        });
        const { data } = await supabase.from('discussions').select('reply_count').eq('id', discussionId).single();
        await supabase.from('discussions').update({ reply_count: (data?.reply_count || 0) + 1 }).eq('id', discussionId);
      } catch (e) {
        console.warn('Discussion reply Supabase error:', e);
      }
    }
    return r;
  },
};

// --------------------------------------------------------------------------
// 9. Curated Journeys Repository
// --------------------------------------------------------------------------
export const JourneyRepository = {
  async listAll(): Promise<Journey[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from('journeys')
          .select('*')
          .eq('is_published', true);
        if (data && data.length > 0) {
          return data.map((j: any) => ({
            id: j.id,
            title: j.title,
            description: j.description,
            category: j.category,
            totalDays: j.total_days,
            recommendedMoods: j.recommended_moods || [],
          }));
        }
      } catch (e) {
        console.warn('JourneyRepository.listAll Supabase error:', e);
      }
    }
    return [];
  },

  async getDay(journeyId: string, dayNumber: number): Promise<JourneyDay | null> {
    if (isSupabaseConfigured()) {
      try {
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
      } catch (e) {
        console.warn('JourneyRepository.getDay Supabase error:', e);
      }
    }
    return null;
  },

  async getUserProgress(userId: string): Promise<UserJourneyProgress[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from('user_journey_progress')
          .select('*')
          .eq('user_id', userId);
        if (data && data.length > 0) {
          return data.map((row: any) => ({
            journeyId: row.journey_id,
            currentDay: row.current_day,
            completedDays: row.completed_days || [],
            startedAt: row.started_at,
            completedAt: row.completed_at || undefined,
          }));
        }
      } catch (e) {
        console.warn('JourneyRepository.getUserProgress Supabase error:', e);
      }
    }
    const local = db.read();
    return local.journeyProgress[userId] || [];
  },

  async syncUserProgress(progress: {
    userId: string;
    journeyId: string;
    currentDay: number;
    completedDays: number[];
    completedAt?: string;
  }): Promise<void> {
    const local = db.read();
    if (!local.journeyProgress[progress.userId]) local.journeyProgress[progress.userId] = [];
    const list = local.journeyProgress[progress.userId];
    const existing = list.find(p => p.journeyId === progress.journeyId);
    if (existing) {
      existing.currentDay = progress.currentDay;
      existing.completedDays = progress.completedDays;
      existing.completedAt = progress.completedAt;
    } else {
      list.push({
        journeyId: progress.journeyId,
        currentDay: progress.currentDay,
        completedDays: progress.completedDays,
        startedAt: new Date().toISOString(),
        completedAt: progress.completedAt,
      });
    }
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('user_journey_progress').upsert({
          user_id: progress.userId,
          journey_id: progress.journeyId,
          current_day: progress.currentDay,
          completed_days: progress.completedDays,
          completed_at: progress.completedAt || null,
        }, { onConflict: 'user_id,journey_id' });
      } catch (e) {
        console.warn('Journey progress Supabase sync error:', e);
      }
    }
  },
};

// --------------------------------------------------------------------------
// 10. LivingWord Teachings Repository
// --------------------------------------------------------------------------
export const TeachingRepository = {
  async listPublished(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from('living_word_teachings')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          return data.map((t: any) => ({
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
      } catch (e) {
        console.warn('TeachingRepository.listPublished Supabase error:', e);
      }
    }
    return [];
  },

  async getBySlug(slug: string): Promise<any | null> {
    if (isSupabaseConfigured()) {
      try {
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
      } catch (e) {
        console.warn('TeachingRepository.getBySlug Supabase error:', e);
      }
    }
    return null;
  },
};

// --------------------------------------------------------------------------
// 11. Subscriptions Repository
// --------------------------------------------------------------------------
export const SubscriptionRepository = {
  async get(userId: string): Promise<Subscription> {
    const local = db.read();
    const fallback = local.subscriptions[userId] || { deviceId: userId, tier: 'free', updatedAt: new Date().toISOString() };

    if (!isSupabaseConfigured()) return fallback;

    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        return {
          deviceId: data.user_id,
          tier: data.tier,
          billingCycle: data.billing_cycle || undefined,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('SubscriptionRepository.get Supabase error:', e);
    }
    return fallback;
  },

  async upsert(sub: Subscription): Promise<Subscription> {
    const local = db.read();
    local.subscriptions[sub.deviceId] = sub;
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('subscriptions').upsert({
          user_id: sub.deviceId,
          tier: sub.tier,
          billing_cycle: sub.billingCycle || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('SubscriptionRepository.upsert Supabase error:', e);
      }
    }
    return sub;
  },
};

// --------------------------------------------------------------------------
// 12. Push Tokens Repository
// --------------------------------------------------------------------------
export const PushTokenRepository = {
  async get(userId: string): Promise<PushToken | null> {
    const local = db.read();
    const fallback = local.pushTokens[userId] || null;
    if (!isSupabaseConfigured()) return fallback;

    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        return {
          userId: data.user_id,
          token: data.token,
          platform: data.platform as any,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('PushTokenRepository.get Supabase error:', e);
    }
    return fallback;
  },

  async upsert(record: PushToken): Promise<PushToken> {
    const local = db.read();
    local.pushTokens[record.userId] = record;
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('push_tokens').upsert({
          user_id: record.userId,
          token: record.token,
          platform: record.platform,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('PushTokenRepository.upsert Supabase error:', e);
      }
    }
    return record;
  },
};

// --------------------------------------------------------------------------
// 13. Library Progress Repository
// --------------------------------------------------------------------------
export const LibraryRepository = {
  async listProgress(userId: string): Promise<{ bookId: string; progressPercent: number; bookmarked: boolean }[]> {
    const local = db.read();
    const fallback = local.libraryProgress[userId] || [];
    if (!isSupabaseConfigured()) return fallback;

    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('library_progress')
        .select('*')
        .eq('user_id', userId);
      if (data && data.length > 0) {
        return data.map((row: any) => ({
          bookId: row.book_id,
          progressPercent: row.progress_percent,
          bookmarked: row.bookmarked,
        }));
      }
    } catch (e) {
      console.warn('LibraryRepository.listProgress Supabase error:', e);
    }
    return fallback;
  },

  async toggleBookmark(userId: string, bookId: string): Promise<{ bookId: string; progressPercent: number; bookmarked: boolean }> {
    const local = db.read();
    if (!local.libraryProgress[userId]) local.libraryProgress[userId] = [];
    const list = local.libraryProgress[userId];
    let entry = list.find(p => p.bookId === bookId);
    if (!entry) {
      entry = { bookId, progressPercent: 0, bookmarked: true };
      list.push(entry);
    } else {
      entry.bookmarked = !entry.bookmarked;
    }
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('library_progress').upsert({
          user_id: userId,
          book_id: bookId,
          progress_percent: entry.progressPercent,
          bookmarked: entry.bookmarked,
        }, { onConflict: 'user_id,book_id' });
      } catch (e) {
        console.warn('LibraryRepository.toggleBookmark Supabase error:', e);
      }
    }
    return entry;
  },
};

// --------------------------------------------------------------------------
// 14. LivingWord Playlists Repository
// --------------------------------------------------------------------------
function calcDuration(items: PlaylistItem[]): string {
  let totalMin = 0;
  for (const item of items) {
    const match = item.duration.match(/\d+/);
    if (match) {
      totalMin += parseInt(match[0], 10);
    }
  }
  if (totalMin >= 60) {
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${totalMin} min`;
}

function getDefaultPlaylists(userId: string): { playlist: Playlist; items: PlaylistItem[] }[] {
  const now = new Date().toISOString();
  return [
    {
      playlist: {
        id: `pl_listen_later_${userId}`,
        userId,
        title: 'Listen Later',
        description: 'Teachings saved to listen to in your quiet morning and evening reflection.',
        icon: '⏳',
        color: 'from-[#5D4E7B] to-[#3B2D54]',
        isDefault: true,
        itemCount: 1,
        totalDuration: '12 min',
        createdAt: now,
        updatedAt: now,
      },
      items: [
        {
          id: `pli_seed_1_${userId}`,
          playlistId: `pl_listen_later_${userId}`,
          teachingSlug: 'when-faith-feels-small',
          teachingTitle: 'When faith feels small',
          teacher: 'Pastor Asket',
          duration: '12 min',
          category: 'Faith',
          audioUrl: '',
          portrait: '/AsketOfficialPic (1).png',
          position: 0,
          addedAt: now,
        },
      ],
    },
    {
      playlist: {
        id: `pl_reflections_${userId}`,
        userId,
        title: 'Sunday Reflections',
        description: 'Deeper theological teachings for contemplation and Sabbath rest.',
        icon: '🕊️',
        color: 'from-[#3A506B] to-[#1C2541]',
        isDefault: true,
        itemCount: 1,
        totalDuration: '9 min',
        createdAt: now,
        updatedAt: now,
      },
      items: [
        {
          id: `pli_seed_2_${userId}`,
          playlistId: `pl_reflections_${userId}`,
          teachingSlug: 'learning-to-be-still',
          teachingTitle: 'Learning to be still',
          teacher: 'Pastor Asket',
          duration: '9 min',
          category: 'Prayer',
          audioUrl: '',
          portrait: '/AsketOfficialPic (1).png',
          position: 0,
          addedAt: now,
        },
      ],
    },
    {
      playlist: {
        id: `pl_faith_${userId}`,
        userId,
        title: 'Strengthening Faith',
        description: 'Encouraging pastoral messages on steadfast faith, prayer, and trusting Christ.',
        icon: '🌱',
        color: 'from-[#436436] to-[#25391F]',
        isDefault: true,
        itemCount: 0,
        totalDuration: '0 min',
        createdAt: now,
        updatedAt: now,
      },
      items: [],
    },
  ];
}

export const PlaylistRepository = {
  async listByUser(userId: string): Promise<Playlist[]> {
    const local = db.read();
    if (!local.playlists) local.playlists = [];
    if (!local.playlistItems) local.playlistItems = [];

    // Ensure starter defaults exist for this user
    const userLocalPlaylists = local.playlists.filter((p) => p.userId === userId);
    if (userLocalPlaylists.length === 0) {
      const defaults = getDefaultPlaylists(userId);
      for (const def of defaults) {
        local.playlists.push(def.playlist);
        for (const it of def.items) {
          local.playlistItems.push(it);
        }
      }
      db.write(local);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data: dbPlaylists, error } = await supabase
          .from('living_word_playlists')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && dbPlaylists && dbPlaylists.length > 0) {
          const playlistIds = dbPlaylists.map((p: any) => p.id);
          const { data: dbItems } = await supabase
            .from('living_word_playlist_items')
            .select('*')
            .in('playlist_id', playlistIds)
            .order('position', { ascending: true });

          const itemsByPlaylist: Record<string, PlaylistItem[]> = {};
          for (const row of dbItems || []) {
            if (!itemsByPlaylist[row.playlist_id]) itemsByPlaylist[row.playlist_id] = [];
            itemsByPlaylist[row.playlist_id].push({
              id: row.id,
              playlistId: row.playlist_id,
              teachingSlug: row.teaching_slug,
              teachingTitle: row.teaching_title,
              teacher: row.teacher,
              duration: row.duration,
              category: row.category || undefined,
              audioUrl: row.audio_url || undefined,
              portrait: row.portrait || undefined,
              position: row.position,
              addedAt: row.added_at,
            });
          }

          return dbPlaylists.map((row: any) => {
            const items = itemsByPlaylist[row.id] || [];
            return {
              id: row.id,
              userId: row.user_id,
              title: row.title,
              description: row.description || undefined,
              icon: row.icon || '🎧',
              color: row.color || 'from-[#5D4E7B] to-[#3B2D54]',
              isDefault: Boolean(row.is_default),
              itemCount: items.length,
              totalDuration: calcDuration(items),
              items,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };
          });
        }
      } catch (e) {
        console.warn('PlaylistRepository.listByUser Supabase error:', e);
      }
    }

    // Fallback to local DB
    return local.playlists
      .filter((p) => p.userId === userId)
      .map((p) => {
        const items = (local.playlistItems || [])
          .filter((it) => it.playlistId === p.id)
          .sort((a, b) => a.position - b.position);
        return {
          ...p,
          itemCount: items.length,
          totalDuration: calcDuration(items),
          items,
        };
      });
  },

  async getById(playlistId: string, userId: string): Promise<Playlist | null> {
    const list = await this.listByUser(userId);
    return list.find((p) => p.id === playlistId) || null;
  },

  async create(userId: string, data: { title: string; description?: string; icon?: string; color?: string }): Promise<Playlist> {
    const local = db.read();
    if (!local.playlists) local.playlists = [];
    const now = new Date().toISOString();
    const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newPlaylist: Playlist = {
      id,
      userId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      icon: data.icon || '🎧',
      color: data.color || 'from-[#5D4E7B] to-[#3B2D54]',
      isDefault: false,
      itemCount: 0,
      totalDuration: '0 min',
      items: [],
      createdAt: now,
      updatedAt: now,
    };
    local.playlists.push(newPlaylist);
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('living_word_playlists').insert({
          id,
          user_id: userId,
          title: newPlaylist.title,
          description: newPlaylist.description,
          icon: newPlaylist.icon,
          color: newPlaylist.color,
          is_default: false,
          created_at: now,
          updated_at: now,
        });
      } catch (e) {
        console.warn('PlaylistRepository.create Supabase error:', e);
      }
    }
    return newPlaylist;
  },

  async update(
    playlistId: string,
    userId: string,
    updates: Partial<{ title: string; description: string; icon: string; color: string }>
  ): Promise<Playlist | null> {
    const local = db.read();
    const playlist = (local.playlists || []).find((p) => p.id === playlistId && p.userId === userId);
    if (!playlist) return null;

    if (updates.title) playlist.title = updates.title.trim();
    if (updates.description !== undefined) playlist.description = updates.description.trim();
    if (updates.icon) playlist.icon = updates.icon;
    if (updates.color) playlist.color = updates.color;
    playlist.updatedAt = new Date().toISOString();
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('living_word_playlists')
          .update({
            title: playlist.title,
            description: playlist.description,
            icon: playlist.icon,
            color: playlist.color,
            updated_at: playlist.updatedAt,
          })
          .eq('id', playlistId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn('PlaylistRepository.update Supabase error:', e);
      }
    }

    return this.getById(playlistId, userId);
  },

  async delete(playlistId: string, userId: string): Promise<boolean> {
    const local = db.read();
    const index = (local.playlists || []).findIndex((p) => p.id === playlistId && p.userId === userId);
    if (index === -1) return false;

    // Prevent deletion of default playlists
    if (local.playlists[index].isDefault) {
      return false;
    }

    local.playlists.splice(index, 1);
    if (local.playlistItems) {
      local.playlistItems = local.playlistItems.filter((it) => it.playlistId !== playlistId);
    }
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('living_word_playlists').delete().eq('id', playlistId).eq('user_id', userId);
      } catch (e) {
        console.warn('PlaylistRepository.delete Supabase error:', e);
      }
    }
    return true;
  },

  async addItem(
    userId: string,
    playlistId: string,
    item: {
      teachingSlug: string;
      teachingTitle: string;
      teacher: string;
      duration: string;
      category?: string;
      audioUrl?: string;
      portrait?: string;
    }
  ): Promise<{ playlist: Playlist; item: PlaylistItem }> {
    const local = db.read();
    if (!local.playlistItems) local.playlistItems = [];

    // Ensure playlist belongs to user or create starter if needed
    let playlist = (local.playlists || []).find((p) => p.id === playlistId && p.userId === userId);
    if (!playlist) {
      await this.listByUser(userId);
      playlist = (local.playlists || []).find((p) => p.id === playlistId && p.userId === userId);
      if (!playlist) throw new Error('Playlist not found');
    }

    // Check if item already in playlist
    let existing = local.playlistItems.find(
      (it) => it.playlistId === playlistId && it.teachingSlug === item.teachingSlug
    );
    if (existing) {
      const updatedPlaylist = (await this.getById(playlistId, userId))!;
      return { playlist: updatedPlaylist, item: existing };
    }

    const currentItems = local.playlistItems.filter((it) => it.playlistId === playlistId);
    const id = `pli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const newItem: PlaylistItem = {
      id,
      playlistId,
      teachingSlug: item.teachingSlug,
      teachingTitle: item.teachingTitle,
      teacher: item.teacher,
      duration: item.duration,
      category: item.category,
      audioUrl: item.audioUrl,
      portrait: item.portrait,
      position: currentItems.length,
      addedAt: now,
    };

    local.playlistItems.push(newItem);
    playlist.updatedAt = now;
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('living_word_playlist_items').insert({
          id,
          playlist_id: playlistId,
          teaching_slug: item.teachingSlug,
          teaching_title: item.teachingTitle,
          teacher: item.teacher,
          duration: item.duration,
          category: item.category || null,
          audio_url: item.audioUrl || null,
          portrait: item.portrait || null,
          position: newItem.position,
          added_at: now,
        });
      } catch (e) {
        console.warn('PlaylistRepository.addItem Supabase error:', e);
      }
    }

    const fullPlaylist = (await this.getById(playlistId, userId))!;
    return { playlist: fullPlaylist, item: newItem };
  },

  async removeItem(userId: string, playlistId: string, teachingSlug: string): Promise<Playlist | null> {
    const local = db.read();
    if (!local.playlistItems) local.playlistItems = [];

    const playlist = (local.playlists || []).find((p) => p.id === playlistId && p.userId === userId);
    if (!playlist) return null;

    local.playlistItems = local.playlistItems.filter(
      (it) => !(it.playlistId === playlistId && it.teachingSlug === teachingSlug)
    );
    // Re-index positions
    let pos = 0;
    for (const it of local.playlistItems) {
      if (it.playlistId === playlistId) {
        it.position = pos++;
      }
    }
    playlist.updatedAt = new Date().toISOString();
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('living_word_playlist_items')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('teaching_slug', teachingSlug);
      } catch (e) {
        console.warn('PlaylistRepository.removeItem Supabase error:', e);
      }
    }

    return this.getById(playlistId, userId);
  },

  async reorderItems(userId: string, playlistId: string, teachingSlugs: string[]): Promise<Playlist | null> {
    const local = db.read();
    const playlist = (local.playlists || []).find((p) => p.id === playlistId && p.userId === userId);
    if (!playlist) return null;

    const items = (local.playlistItems || []).filter((it) => it.playlistId === playlistId);
    teachingSlugs.forEach((slug, index) => {
      const it = items.find((i) => i.teachingSlug === slug);
      if (it) it.position = index;
    });
    playlist.updatedAt = new Date().toISOString();
    db.write(local);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        for (let i = 0; i < teachingSlugs.length; i++) {
          await supabase
            .from('living_word_playlist_items')
            .update({ position: i })
            .eq('playlist_id', playlistId)
            .eq('teaching_slug', teachingSlugs[i]);
        }
      } catch (e) {
        console.warn('PlaylistRepository.reorderItems Supabase error:', e);
      }
    }

    return this.getById(playlistId, userId);
  },
};

