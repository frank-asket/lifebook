export type Mood = 'grateful' | 'peaceful' | 'seeking' | 'doubting' | 'distant' | 'convicted';

export interface Verse {
  mood: Mood;
  text: string;
  reference: string;
}

export interface GeneratedContent {
  id: string;
  checkinId: string;
  verseText: string;
  verseReference: string;
  whyThisVerse: string;
  meditation: string;
  reflectionQuestion: string;
  prayer: string;
  actionStep: string;
  reviewVerdict: 'pass' | 'uncertain';
  modelMode: 'live' | 'dev-fallback';
  createdAt: string;
}

export interface MoodCheckin {
  id: string;
  deviceId: string;
  userId?: string;
  mood: Mood;
  note?: string;
  createdAt: string;
}

export type Checkin = MoodCheckin;

export interface StreakRecord {
  deviceId: string;
  current: number;
  longest: number;
  lastCheckIn: string; // YYYY-MM-DD
  history: { date: string; mood: Mood }[];
}

export interface Flag {
  id: string;
  contentId: string;
  deviceId: string;
  reason?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface Database {
  checkins: MoodCheckin[];
  content: GeneratedContent[];
  streaks: Record<string, StreakRecord>;
  flags: Flag[];
  groups: Group[];
  groupMembers: GroupMembership[];
  prayerRequests: PrayerRequest[];
  discussions: Discussion[];
  discussionReplies: DiscussionReply[];
  libraryProgress: Record<string, LibraryProgressEntry[]>;
  subscriptions: Record<string, Subscription>;
  journalEntries: JournalEntry[];
  favorites: FavoriteVerse[];
  preferences: Record<string, UserPreferences>;
  pushTokens: Record<string, PushToken>;
  journeyProgress: Record<string, UserJourneyProgress[]>;
  livingWordComments: LivingWordComment[];
  playlists: Playlist[];
  playlistItems: PlaylistItem[];
}

export interface LivingWordComment {
  id: string;
  teachingSlug: string;
  userId: string;
  authorName: string;
  text: string;
  moderationStatus: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  category: string;
  totalDays: number;
  recommendedMoods: string[];
}

export interface JourneyDay {
  journeyId: string;
  dayNumber: number;
  title: string;
  verseText: string;
  verseReference: string;
  reflection: string;
  prayer: string;
}

export interface UserJourneyProgress {
  journeyId: string;
  currentDay: number; // next day to complete, 1-indexed
  completedDays: number[];
  startedAt: string;
  completedAt?: string;
}

export interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'unknown';
  updatedAt: string;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  deviceId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  deviceId?: string;
  userId?: string;
  text?: string;
  body?: string;
  title?: string;
  passageReference?: string;
  tags?: string[];
  relatedContentId?: string;
  createdAt: string;
}

export interface FavoriteVerse {
  id: string;
  deviceId: string;
  contentId: string;
  verseText: string;
  verseReference: string;
  createdAt: string;
}

export interface UserPreferences {
  deviceId: string;
  displayName?: string;
  spiritualPath?: string;
  dailyHabits?: string[];
  notificationTime?: string;
  favoriteBooks?: string[];
  joinedGroupSuggestion?: string;
  onboardingCompletedAt?: string;
  timezone?: string;
  translation?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  meetingFrequency: string;
  memberCount: number;
}

export interface GroupMembership {
  groupId: string;
  deviceId: string;
  joinedAt: string;
}

export interface PrayerRequest {
  id: string;
  deviceId: string;
  authorName: string;
  text: string;
  category?: string;
  prayerCount: number;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Discussion {
  id: string;
  deviceId: string;
  authorName: string;
  title: string;
  body: string;
  tags: string[];
  replyCount: number;
  likeCount: number;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  spiritualLevel: string;
  isPremium: boolean;
  summary: string;
}

export interface LibraryProgressEntry {
  bookId: string;
  progressPercent: number;
  bookmarked: boolean;
}

export interface Subscription {
  deviceId: string;
  tier: 'free' | 'premium';
  billingCycle?: 'monthly' | 'annual';
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  teachingSlug: string;
  teachingTitle: string;
  teacher: string;
  duration: string;
  category?: string;
  audioUrl?: string;
  portrait?: string;
  position: number;
  addedAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  itemCount: number;
  totalDuration?: string;
  items?: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
}
