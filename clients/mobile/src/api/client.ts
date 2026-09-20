import { MoodId } from '../theme/colors';
import { getIdToken } from '../auth/clerk';

// When testing on a physical device or the Expo Go app, `localhost` refers
// to the phone itself, not your computer. Replace this with your machine's
// LAN IP (e.g. "http://192.168.1.23:8787") — the Expo CLI prints it on start.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export interface GeneratedContent {
  id: string;
  verseText: string;
  verseReference: string;
  whyThisVerse: string;
  meditation: string;
  reflectionQuestion: string;
  prayer: string;
  actionStep: string;
  reviewVerdict: 'pass' | 'uncertain';
  modelMode: 'live' | 'dev-fallback';
}

export interface StreakRecord {
  deviceId: string;
  current: number;
  longest: number;
  lastCheckIn: string;
  history: { date: string; mood: MoodId }[];
}

export interface CheckinResponse {
  content: GeneratedContent;
  streak: StreakRecord;
  supportNoteNeeded: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${path} failed with ${res.status}`);
  }
  return res.json();
}

export function checkIn(deviceId: string, mood: MoodId, note?: string) {
  return request<CheckinResponse>('/api/checkin', {
    method: 'POST',
    body: JSON.stringify({ deviceId, mood, note }),
  });
}

export function fetchStreak(deviceId: string) {
  return request<{ streak: StreakRecord | null }>(`/api/streak?deviceId=${deviceId}`);
}

export function flagContent(contentId: string, deviceId: string, reason?: string) {
  return request<{ flag: unknown }>('/api/flag', {
    method: 'POST',
    body: JSON.stringify({ contentId, deviceId, reason }),
  });
}

export function registerPushToken(deviceId: string, token: string, platform: 'ios' | 'android') {
  return request<{ registered: unknown }>('/api/push-token', {
    method: 'POST',
    body: JSON.stringify({ deviceId, token, platform }),
  });
}

export function sendTestNotification(deviceId: string) {
  return request<{ sent: boolean; reason?: string }>('/api/notifications/send-test', {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  category: string;
  totalDays: number;
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
export interface JourneyProgress {
  journeyId: string;
  currentDay: number;
  completedDays: number[];
  startedAt: string;
  completedAt?: string;
}
export interface ActiveJourney {
  journey: Journey;
  progress: JourneyProgress;
  day: JourneyDay;
}

export function fetchJourneys() {
  return request<{ journeys: Journey[] }>('/api/journeys');
}
export function startJourney(deviceId: string, journeyId: string) {
  return request<{ progress: JourneyProgress }>(`/api/journeys/${journeyId}/start`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}
export function fetchActiveJourney(deviceId: string) {
  return request<{ active: ActiveJourney | null }>(`/api/journeys-active?deviceId=${deviceId}`);
}
export function fetchMyJourneys(deviceId: string) {
  return request<{ progress: JourneyProgress[] }>(`/api/journeys-mine?deviceId=${deviceId}`);
}
export function completeJourneyDay(deviceId: string, journeyId: string) {
  return request<{ progress: JourneyProgress }>(`/api/journeys/${journeyId}/complete-day`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}

export interface JourneyRecommendation {
  journey: Journey;
  reason: string;
  personalized: boolean;
}
export function fetchRecommendedJourney(deviceId: string) {
  return request<{ recommendation: JourneyRecommendation | null }>(`/api/journeys-recommended?deviceId=${deviceId}`);
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}
export function fetchBadges(deviceId: string) {
  return request<{ badges: Badge[] }>(`/api/badges?deviceId=${deviceId}`);
}

export interface Group {
  id: string;
  name: string;
  description: string;
  meetingFrequency: string;
  memberCount: number;
}
export function fetchGroups() {
  return request<{ groups: Group[] }>('/api/groups');
}
export function joinGroup(groupId: string, deviceId: string) {
  return request<{ joined: boolean; memberCount: number }>(`/api/groups/${groupId}/join`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}

export interface PrayerRequest {
  id: string;
  authorName: string;
  text: string;
  category?: string;
  prayerCount: number;
  createdAt: string;
}
export function fetchPrayerRequests() {
  return request<{ requests: PrayerRequest[] }>('/api/prayer-requests');
}
export function submitPrayerRequest(deviceId: string, text: string, category?: string) {
  return request<{ request: PrayerRequest; needsSupportNote: boolean }>('/api/prayer-requests', {
    method: 'POST',
    body: JSON.stringify({ deviceId, text, category }),
  });
}
export function prayForRequest(requestId: string) {
  return request<{ request: PrayerRequest }>(`/api/prayer-requests/${requestId}/pray`, { method: 'POST' });
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  spiritualLevel: string;
  isPremium: boolean;
  summary: string;
  locked: boolean;
  bookmarked: boolean;
}
export function fetchLibrary(deviceId: string) {
  return request<{ books: LibraryBook[] }>(`/api/library?deviceId=${deviceId}`);
}
export function toggleBookmark(deviceId: string, bookId: string) {
  return request<{ entry: unknown }>(`/api/library/${bookId}/bookmark`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  });
}

export interface Discussion {
  id: string;
  authorName: string;
  title: string;
  body: string;
  tags: string[];
  replyCount: number;
  likeCount: number;
  createdAt: string;
}
export interface DiscussionReply {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}
export function fetchDiscussions() {
  return request<{ discussions: Discussion[] }>('/api/discussions');
}
export function createDiscussion(deviceId: string, title: string, body: string, tags: string[] = []) {
  return request<{ discussion: Discussion; needsSupportNote: boolean }>('/api/discussions', {
    method: 'POST',
    body: JSON.stringify({ deviceId, title, body, tags }),
  });
}
export function likeDiscussion(id: string) {
  return request<{ discussion: Discussion }>(`/api/discussions/${id}/like`, { method: 'POST' });
}
export function fetchReplies(id: string) {
  return request<{ replies: DiscussionReply[] }>(`/api/discussions/${id}/replies`);
}
export function replyToDiscussion(id: string, deviceId: string, text: string) {
  return request<{ reply: DiscussionReply; needsSupportNote: boolean }>(`/api/discussions/${id}/replies`, {
    method: 'POST',
    body: JSON.stringify({ deviceId, text }),
  });
}

export interface JournalEntry {
  id: string;
  text: string;
  createdAt: string;
}
export function fetchJournal(deviceId: string) {
  return request<{ entries: JournalEntry[] }>(`/api/journal?deviceId=${deviceId}`);
}
export function addJournalEntry(deviceId: string, text: string, relatedContentId?: string) {
  return request<{ entry: JournalEntry }>('/api/journal', {
    method: 'POST',
    body: JSON.stringify({ deviceId, text, relatedContentId }),
  });
}

export interface FavoriteVerse {
  id: string;
  verseText: string;
  verseReference: string;
  createdAt: string;
}
export function fetchFavorites(deviceId: string) {
  return request<{ favorites: FavoriteVerse[] }>(`/api/favorites?deviceId=${deviceId}`);
}
export function addFavorite(deviceId: string, contentId: string, verseText: string, verseReference: string) {
  return request<{ favorite: FavoriteVerse }>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ deviceId, contentId, verseText, verseReference }),
  });
}

export function fetchMoodHistory(deviceId: string) {
  return request<{ history: { date: string; mood: MoodId | null }[] }>(`/api/mood-history?deviceId=${deviceId}`);
}

export interface Preferences {
  displayName?: string;
  spiritualPath?: string;
  dailyHabits?: string[];
  notificationTime?: string;
  onboardingCompletedAt?: string;
}
export function fetchPreferences(deviceId: string) {
  return request<{ preferences: Preferences | null }>(`/api/preferences?deviceId=${deviceId}`);
}
export function savePreferences(deviceId: string, updates: Partial<Preferences>) {
  return request<{ preferences: Preferences }>('/api/preferences', {
    method: 'POST',
    body: JSON.stringify({ deviceId, ...updates }),
  });
}

export interface Subscription {
  deviceId: string;
  tier: 'free' | 'premium';
  billingCycle?: 'monthly' | 'annual';
}
export function fetchSubscription(deviceId: string) {
  return request<{ subscription: Subscription }>(`/api/subscription?deviceId=${deviceId}`);
}
export function upgradeSubscription(deviceId: string, billingCycle: 'monthly' | 'annual') {
  return request<{ subscription: Subscription }>('/api/subscription/upgrade', {
    method: 'POST',
    body: JSON.stringify({ deviceId, billingCycle }),
  });
}

export function fetchAnalyticsSummary() {
  return request<any>('/api/analytics/summary');
}

