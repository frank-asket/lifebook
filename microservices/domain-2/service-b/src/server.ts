import http, { IncomingMessage, ServerResponse } from 'node:http';
import { runCheckin, getStreak, fileFlag } from './agents/orchestrator';
import { computeBadges } from './agents/badges';
import {
  listGroups, joinGroup, listPrayerRequests, submitPrayerRequest, prayFor,
  listDiscussions, createDiscussion, likeDiscussion, replyToDiscussion, listReplies,
} from './agents/community';
import { listLibrary, toggleBookmark } from './agents/library';
import { getSubscription, upgrade } from './agents/subscription';
import { addJournalEntry, listJournalEntries, addFavorite, listFavorites, moodHistory } from './agents/journal';
import { savePreferences, getPreferences } from './agents/preferences';
import { registerPushToken, sendPushNotification } from './agents/notifications';
import { listJourneys, getJourney, startJourney, getActiveJourney, completeDay, listUserJourneys, getRecommendedJourney } from './agents/journeys';
import { resolveIdentity } from './auth/verifyToken';
import { isClerkConfigured } from './auth/verifyToken';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import { isOriginAllowed, corsOriginHeader } from './security/cors';
import { checkRateLimit } from './security/rateLimit';
import { Mood } from './types';
import { generateCheckin, answerVoiceQuestion, moderateCommunityPost, classifySafetyRisk } from './ai/gateway';
import { ProfileRepository, CheckinRepository, JournalRepository, PlaylistRepository } from './repositories';
import versesJson from './agents/verses.json';
import initialTeachingsJson from './data/livingWord.json';

const PORT = Number(process.env.BACKEND_PORT) || 8787;
const VALID_MOODS: Mood[] = ['grateful', 'peaceful', 'seeking', 'doubting', 'distant', 'convicted'];

// ---- In-memory stores for extended capabilities ----
const analyticsEvents: any[] = [];

interface PrayerSanctuaryItem {
  id: string;
  userId?: string;
  text?: string;
  themes: string[];
  passage: { reference: string; text: string; translation: string } | null;
  meditation: string;
  reflectionQuestion: string;
  guidedPrayer: string;
  safetyStatus: 'safe' | 'distress_detected' | 'crisis_escalation';
  supportMessage: string | null;
  saved: boolean;
  createdAt: string;
}
const prayerSanctuaryHistory: PrayerSanctuaryItem[] = [];

const waitlistCohorts: any[] = [
  {
    id: 'cohort-pilgrims',
    name: 'Pilgrim Sanctuary Pioneers',
    targetRole: 'Devotional Seeker',
    description: 'Early believers establishing steady 5-minute morning rhythms with Scripture & prayer.',
    capacity: 250,
    status: 'active',
    memberCount: 84,
    stages: { registered: 42, feedback_submitted: 26, vip_invited: 12, onboarded: 4 },
    occupancyPercent: 34,
  },
  {
    id: 'cohort-pastoral',
    name: 'Pastoral & Theological Council',
    targetRole: 'Pastoral Leader',
    description: 'Pastors and ministry leaders validating expository biblical integrity and care.',
    capacity: 100,
    status: 'active',
    memberCount: 38,
    stages: { registered: 14, feedback_submitted: 15, vip_invited: 7, onboarded: 2 },
    occupancyPercent: 38,
  },
  {
    id: 'cohort-french',
    name: 'Cercle Francophone de Méditation',
    targetRole: 'Bilingual Pilgrim',
    description: 'French and bilingual European/African communities testing Louis Segond & liturgical translations.',
    capacity: 150,
    status: 'active',
    memberCount: 52,
    stages: { registered: 25, feedback_submitted: 18, vip_invited: 6, onboarded: 3 },
    occupancyPercent: 35,
  },
];

const waitlistMembers: any[] = [
  {
    id: 'wl_pilgrim_1',
    email: 'sarah.m@sanctuary.example',
    name: 'Sarah Mitchell',
    spiritualRole: 'Devotional Seeker',
    cohortId: 'cohort-pilgrims',
    referralCode: 'SARAH-GRACE',
    referredBy: null,
    stage: 'feedback_submitted',
    priorityScore: 85,
    struggleFeedback: 'Finding 5 quiet minutes before morning work rush.',
    desiredFeatures: ['Journey Grace Days', '5-Minute Morning Audio Flow'],
    dailyTimeAvailable: '5-7 min',
    feedbackNotes: [{ note: 'Loves audio reflections', timestamp: new Date().toISOString() }],
    referralCount: 2,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'wl_pilgrim_2',
    email: 'marc.dubois@sanctuary.fr',
    name: 'Marc Dubois',
    spiritualRole: 'Bilingual Pilgrim',
    cohortId: 'cohort-french',
    referralCode: 'MARC-PARIS',
    referredBy: null,
    stage: 'registered',
    priorityScore: 70,
    struggleFeedback: 'Maintaining daily consistency during business travel.',
    desiredFeatures: ['French Louis Segond audio', 'Offline prayer sanctuary'],
    dailyTimeAvailable: '10 min',
    feedbackNotes: [],
    referralCount: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const cmsTeachings: any[] = (initialTeachingsJson as any[]).map((t, idx) => ({
  ...t,
  fullBody: t.excerpt,
  theologicalNotes: 'Vetted for Christ-centered gospel orthodoxy and sound expository alignment.',
  status: 'published',
  theologicalRubric: {
    scriptureAccuracy: 5,
    christocentricFocus: 5,
    pastoralTone: 5,
    historicalOrthodoxy: 5,
    notes: 'Approved by LifeBook Pastoral Review board.',
  },
  reviewedBy: 'Pastor Asket',
  reviewedAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 86400000 * (10 - idx)).toISOString(),
}));

const CRISIS_PATTERNS = [
  /\b(?:suicid(?:e|al)|kill myself|end my life|want to die|better off dead)\b/i,
  /\b(?:hurt|harm|cut) myself\b/i,
  /\b(?:i(?:'m| am) going to|i will) (?:kill|hurt|harm) myself\b/i,
];

const THEME_RULES: [string, Mood, string[]][] = [
  ['anxiety', 'peaceful', ['anxious', 'anxiety', 'worry', 'worried', 'stress', 'fear', 'afraid', 'panick']],
  ['grief', 'distant', ['grief', 'grieving', 'loss', 'died', 'death', 'mourning', 'sorrow', 'alone']],
  ['guidance', 'seeking', ['decision', 'choose', 'choice', 'work', 'job', 'future', 'direction', 'wisdom', 'path']],
  ['doubt', 'doubting', ['doubt', 'doubting', 'question', 'uncertain', 'believe', 'struggling']],
  ['gratitude', 'grateful', ['grateful', 'gratitude', 'thankful', 'thank you', 'blessing', 'praise']],
  ['renewal', 'convicted', ['guilt', 'forgive', 'forgiveness', 'regret', 'repent', 'wrong', 'sin', 'shame']],
];

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 60;
const RATE_LIMIT_CHECKIN_MAX = Number(process.env.RATE_LIMIT_CHECKIN_MAX) || 10;

function clientKey(req: IncomingMessage): string {
  // Render/Railway/most PaaS put the backend behind a reverse proxy, so
  // the real client IP arrives via X-Forwarded-For, not the raw socket.
  const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  return (req.socket as any)?.remoteAddress || 'unknown';
}

function send(res: ServerResponse, status: number, body: unknown, origin?: string) {
  const resolvedOrigin = origin ?? (res as any).__corsOrigin;
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOriginHeader(resolvedOrigin),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
      if (raw.length > 100_000) req.destroy(new Error('request body too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
  });
}

// Every protected route goes through this. The legacy deviceId argument is
// ignored; the Clerk token is the sole authority for the user ID.
async function requireUser(req: IncomingMessage, res: ServerResponse, fallback?: string): Promise<string | null> {
  try {
    const identity = await resolveIdentity(req, fallback);
    return identity.userId;
  } catch (err: any) {
    send(res, 401, { error: 'unauthorized', detail: String(err?.message || err) });
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const origin = req.headers['origin'];
  (res as any).__corsOrigin = origin;

  if (req.method === 'OPTIONS') return send(res, 204, {});

  // A browser Origin header that isn't on the allow-list gets rejected
  // outright, before any route logic runs. Requests with no Origin header
  // (native mobile apps, curl, server-to-server) aren't CORS's concern and
  // pass through untouched.
  if (!isOriginAllowed(origin)) {
    return send(res, 403, { error: 'origin not allowed' });
  }

  if (req.method === 'GET' && url.pathname === '/') {
    return send(res, 200, { service: 'lifebook-backend', status: 'ok' });
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, {
      status: 'ok',
      aiMode: process.env.ANTHROPIC_API_KEY ? 'live' : 'dev-fallback (no ANTHROPIC_API_KEY set)',
      authMode: isClerkConfigured() ? 'clerk' : 'unconfigured',
      databaseMode: isSupabaseConfigured() ? 'supabase' : 'migration-required',
    });
  }

  // A small, authenticated Supabase-backed endpoint used by both clients to
  // establish a profile row without relying on eventually-consistent webhooks.
  if (req.method === 'GET' && url.pathname === '/api/me') {
    const userId = await requireUser(req, res);
    if (!userId) return;
    if (!isSupabaseConfigured()) return send(res, 503, { error: 'Supabase is not configured' });
    const client = getSupabaseAdmin();
    const { data, error } = await client.from('profiles').upsert({ user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single();
    if (error) return send(res, 500, { error: 'profile lookup failed' });
    return send(res, 200, { profile: data });
  }

  // General rate limit — applies to everything past this point.
  const generalLimit = checkRateLimit(`general:${clientKey(req)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!generalLimit.allowed) {
    return send(res, 429, {
      error: 'rate limit exceeded',
      retryAfterMs: generalLimit.resetAt - Date.now(),
    });
  }

  // Stricter limit specifically on check-ins — this is the endpoint that
  // spends real Anthropic API credit on every call.
  if (req.method === 'POST' && url.pathname === '/api/checkin') {
    const checkinLimit = checkRateLimit(`checkin:${clientKey(req)}`, RATE_LIMIT_CHECKIN_MAX, RATE_LIMIT_WINDOW_MS);
    if (!checkinLimit.allowed) {
      return send(res, 429, {
        error: 'check-in rate limit exceeded — this endpoint calls a paid AI model',
        retryAfterMs: checkinLimit.resetAt - Date.now(),
      });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/checkin') {
    try {
      const body = await readBody(req);
      const userId = await requireUser(req, res, body.deviceId);
      if (!userId) return;
      const { mood, note } = body;
      if (!VALID_MOODS.includes(mood)) {
        return send(res, 400, { error: `a valid mood (${VALID_MOODS.join(', ')}) is required` });
      }
      const result = await runCheckin(userId, mood, note);
      return send(res, 200, result);
    } catch (err: any) {
      console.error(err);
      return send(res, 500, { error: 'checkin failed', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/streak') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { streak: await getStreak(userId) });
  }

  if (req.method === 'POST' && url.pathname === '/api/flag') {
    try {
      const body = await readBody(req);
      const userId = await requireUser(req, res, body.deviceId);
      if (!userId) return;
      const { contentId, reason } = body;
      if (!contentId) return send(res, 400, { error: 'contentId is required' });
      const flag = fileFlag(contentId, userId, reason);
      return send(res, 200, { flag });
    } catch (err: any) {
      return send(res, 500, { error: 'flag failed', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/badges') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { badges: computeBadges(await getStreak(userId)) });
  }

  // ---- Community ----
  if (req.method === 'GET' && url.pathname === '/api/groups') {
    return send(res, 200, { groups: listGroups() });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/groups\/[^/]+\/join$/)) {
    try {
      const groupId = url.pathname.split('/')[3];
      const body = await readBody(req);
      const userId = await requireUser(req, res, body.deviceId);
      if (!userId) return;
      return send(res, 200, joinGroup(groupId, userId));
    } catch (err: any) {
      return send(res, 400, { error: String(err?.message || err) });
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/prayer-requests') {
    return send(res, 200, { requests: await listPrayerRequests() });
  }
  if (req.method === 'POST' && url.pathname === '/api/prayer-requests') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.text) return send(res, 400, { error: 'text is required' });
    return send(res, 200, await submitPrayerRequest(userId, body.text, body.category));
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/prayer-requests\/[^/]+\/pray$/)) {
    try {
      const id = url.pathname.split('/')[3];
      return send(res, 200, { request: await prayFor(id) });
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/discussions') {
    return send(res, 200, { discussions: await listDiscussions() });
  }
  if (req.method === 'POST' && url.pathname === '/api/discussions') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.title || !body.body) return send(res, 400, { error: 'title and body are required' });
    return send(res, 200, await createDiscussion(userId, body.title, body.body, body.tags));
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/discussions\/[^/]+\/like$/)) {
    try {
      const id = url.pathname.split('/')[3];
      return send(res, 200, { discussion: await likeDiscussion(id) });
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }
  if (req.method === 'GET' && url.pathname.match(/^\/api\/discussions\/[^/]+\/replies$/)) {
    const id = url.pathname.split('/')[3];
    return send(res, 200, { replies: await listReplies(id) });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/discussions\/[^/]+\/replies$/)) {
    try {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      const userId = await requireUser(req, res, body.deviceId);
      if (!userId) return;
      if (!body.text) return send(res, 400, { error: 'text is required' });
      return send(res, 200, await replyToDiscussion(id, userId, body.text));
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }

  // ---- Journal & favorites ----
  if (req.method === 'GET' && url.pathname === '/api/journal') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { entries: await listJournalEntries(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/journal') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.text) return send(res, 400, { error: 'text is required' });
    return send(res, 200, { entry: await addJournalEntry(userId, body.text, body.relatedContentId) });
  }
  if (req.method === 'GET' && url.pathname === '/api/favorites') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { favorites: await listFavorites(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/favorites') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.contentId || !body.verseText || !body.verseReference) {
      return send(res, 400, { error: 'contentId, verseText, and verseReference are required' });
    }
    return send(res, 200, { favorite: await addFavorite(userId, body.contentId, body.verseText, body.verseReference) });
  }
  if (req.method === 'GET' && url.pathname === '/api/mood-history') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { history: await moodHistory(userId) });
  }

  // ---- Preferences / onboarding ----
  if (req.method === 'GET' && url.pathname === '/api/preferences') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { preferences: await getPreferences(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/preferences') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    const { deviceId, ...updates } = body;
    return send(res, 200, { preferences: await savePreferences(userId, updates) });
  }

  // ---- Push notifications ----
  if (req.method === 'POST' && url.pathname === '/api/push-token') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.token) return send(res, 400, { error: 'token is required' });
    return send(res, 200, { registered: await registerPushToken(userId, body.token, body.platform) });
  }
  if (req.method === 'POST' && url.pathname === '/api/notifications/send-test') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    const result = await sendPushNotification(userId, 'LifeBook', 'This is a test notification — if you see this, push is wired up correctly.');
    return send(res, 200, result);
  }

  // ---- Journeys ----
  if (req.method === 'GET' && url.pathname === '/api/journeys') {
    return send(res, 200, { journeys: await listJourneys() });
  }
  if (req.method === 'GET' && url.pathname.match(/^\/api\/journeys\/[^/]+$/)) {
    const id = url.pathname.split('/')[3];
    const journey = await getJourney(id);
    if (!journey) return send(res, 404, { error: 'journey not found' });
    return send(res, 200, { journey });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/journeys\/[^/]+\/start$/)) {
    const id = url.pathname.split('/')[3];
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    try {
      return send(res, 200, { progress: await startJourney(userId, id) });
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/journeys-active') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { active: await getActiveJourney(userId) });
  }
  if (req.method === 'GET' && url.pathname === '/api/journeys-mine') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { progress: await listUserJourneys(userId) });
  }
  if (req.method === 'GET' && url.pathname === '/api/journeys-recommended') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { recommendation: await getRecommendedJourney(userId) });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/journeys\/[^/]+\/complete-day$/)) {
    const id = url.pathname.split('/')[3];
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    try {
      return send(res, 200, { progress: await completeDay(userId, id) });
    } catch (err: any) {
      return send(res, 400, { error: String(err?.message || err) });
    }
  }

  // ---- Library ----
  if (req.method === 'GET' && url.pathname === '/api/library') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    const sub = await getSubscription(userId);
    return send(res, 200, { books: await listLibrary(userId, sub.tier) });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/library\/[^/]+\/bookmark$/)) {
    const bookId = url.pathname.split('/')[3];
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    return send(res, 200, { entry: await toggleBookmark(userId, bookId) });
  }

  if (req.method === 'POST' && url.pathname === '/api/voice/answer') {
    try {
      const body = await readBody(req);
      const question = typeof body.question === 'string' ? body.question.trim() : '';
      if (!question || question.length > 2_000) {
        return send(res, 400, { error: 'question is required and must be under 2,000 characters' });
      }
      const userId = await requireUser(req, res, body.deviceId);
      const answer = await answerVoiceQuestion(question, userId || undefined);
      return send(res, 200, { response: answer });
    } catch (err: any) {
      return send(res, 500, { error: 'voice answering failed', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/ai/moderate') {
    try {
      const body = await readBody(req);
      const content = typeof body.content === 'string' ? body.content.trim() : '';
      if (!content) return send(res, 400, { error: 'content is required' });
      const userId = await requireUser(req, res, body.deviceId);
      const modResult = await moderateCommunityPost(content, userId || undefined);
      return send(res, 200, modResult);
    } catch (err: any) {
      return send(res, 500, { error: 'moderation failed', detail: String(err?.message || err) });
    }
  }

  // ---- Moderation Queue Review (Careful Oversight Dashboard) ----
  if (req.method === 'GET' && url.pathname === '/api/moderation/reviews') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    if (!isSupabaseConfigured()) {
      return send(res, 200, { reviews: [] });
    }
    const client = getSupabaseAdmin();
    const { data, error } = await client
      .from('moderation_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return send(res, 500, { error: 'failed to fetch moderation reviews' });
    return send(res, 200, { reviews: data || [] });
  }

  if (req.method === 'POST' && url.pathname.match(/^\/api\/moderation\/reviews\/[^/]+\/resolve$/)) {
    const reviewId = url.pathname.split('/')[4];
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    const { status, resolutionNotes } = body;
    if (!['approved', 'rejected'].includes(status)) {
      return send(res, 400, { error: 'status must be approved or rejected' });
    }
    if (!isSupabaseConfigured()) {
      return send(res, 200, { success: true });
    }
    const client = getSupabaseAdmin();
    const { data: review, error: fetchErr } = await client
      .from('moderation_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
    if (fetchErr || !review) return send(res, 404, { error: 'review not found' });

    await client
      .from('moderation_reviews')
      .update({
        status,
        reviewer_id: userId,
        reviewed_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
      })
      .eq('id', reviewId);

    // Update target item moderation status
    if (review.content_type === 'prayer_request') {
      await client
        .from('prayer_requests')
        .update({ moderation_status: status })
        .eq('id', review.content_id);
    } else if (review.content_type === 'discussion') {
      await client
        .from('discussions')
        .update({ moderation_status: status })
        .eq('id', review.content_id);
    }

    return send(res, 200, { success: true, status });
  }

  // ---- Subscription ----
  if (req.method === 'GET' && url.pathname === '/api/subscription') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { subscription: await getSubscription(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/subscription/upgrade') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.billingCycle) return send(res, 400, { error: 'billingCycle is required' });
    return send(res, 200, { subscription: await upgrade(userId, body.billingCycle) });
  }

  // ---- LivingWord Playlists ----
  if (req.method === 'GET' && url.pathname === '/api/livingword/playlists') {
    const userId = (await requireUser(req, res, url.searchParams.get('deviceId') || undefined)) || 'dev-user';
    const playlists = await PlaylistRepository.listByUser(userId);
    return send(res, 200, { playlists });
  }
  if (req.method === 'POST' && url.pathname === '/api/livingword/playlists') {
    const body = await readBody(req);
    const userId = (await requireUser(req, res, body.deviceId)) || 'dev-user';
    if (!body.title) return send(res, 400, { error: 'title is required' });
    const playlist = await PlaylistRepository.create(userId, {
      title: body.title,
      description: body.description,
      icon: body.icon,
      color: body.color,
    });
    return send(res, 201, { playlist });
  }
  if (req.method === 'PATCH' && url.pathname.match(/^\/api\/livingword\/playlists\/[^/]+$/)) {
    const playlistId = url.pathname.split('/')[4];
    const body = await readBody(req);
    const userId = (await requireUser(req, res, body.deviceId)) || 'dev-user';
    const updated = await PlaylistRepository.update(playlistId, userId, body);
    if (!updated) return send(res, 404, { error: 'playlist not found or unauthorized' });
    return send(res, 200, { playlist: updated });
  }
  if (req.method === 'DELETE' && url.pathname.match(/^\/api\/livingword\/playlists\/[^/]+$/)) {
    const playlistId = url.pathname.split('/')[4];
    const userId = (await requireUser(req, res, url.searchParams.get('deviceId') || undefined)) || 'dev-user';
    const success = await PlaylistRepository.delete(playlistId, userId);
    if (!success) return send(res, 400, { error: 'cannot delete default playlist or playlist not found' });
    return send(res, 200, { success: true });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/livingword\/playlists\/[^/]+\/items$/)) {
    const playlistId = url.pathname.split('/')[4];
    const body = await readBody(req);
    const userId = (await requireUser(req, res, body.deviceId)) || 'dev-user';
    if (!body.teachingSlug || !body.teachingTitle) {
      return send(res, 400, { error: 'teachingSlug and teachingTitle are required' });
    }
    const result = await PlaylistRepository.addItem(userId, playlistId, {
      teachingSlug: body.teachingSlug,
      teachingTitle: body.teachingTitle,
      teacher: body.teacher || 'Pastor Asket',
      duration: body.duration || '10 min',
      category: body.category,
      audioUrl: body.audioUrl,
      portrait: body.portrait,
    });
    return send(res, 200, result);
  }
  if (req.method === 'DELETE' && url.pathname.match(/^\/api\/livingword\/playlists\/[^/]+\/items\/[^/]+$/)) {
    const parts = url.pathname.split('/');
    const playlistId = parts[4];
    const slug = parts[6];
    const userId = (await requireUser(req, res, url.searchParams.get('deviceId') || undefined)) || 'dev-user';
    const updated = await PlaylistRepository.removeItem(userId, playlistId, slug);
    if (!updated) return send(res, 404, { error: 'playlist not found or item not found' });
    return send(res, 200, { playlist: updated });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/livingword\/playlists\/[^/]+\/reorder$/)) {
    const playlistId = url.pathname.split('/')[4];
    const body = await readBody(req);
    const userId = (await requireUser(req, res, body.deviceId)) || 'dev-user';
    if (!Array.isArray(body.teachingSlugs)) {
      return send(res, 400, { error: 'teachingSlugs array is required' });
    }
    const updated = await PlaylistRepository.reorderItems(userId, playlistId, body.teachingSlugs);
    return send(res, 200, { playlist: updated });
  }

  // ---- Telemetry & Habit Analytics ----
  if (req.method === 'POST' && (url.pathname === '/api/analytics/events' || url.pathname === '/api/analytics/events/batch')) {
    try {
      const body = await readBody(req);
      const incomingList = Array.isArray(body.events) ? body.events : [body];
      for (const ev of incomingList) {
        if (!ev || !ev.eventName) continue;
        analyticsEvents.push({
          id: `evt_${Date.now()}_${analyticsEvents.length}`,
          eventName: ev.eventName,
          deviceId: ev.deviceId || ev.userId || 'dev-device',
          userId: ev.userId || null,
          sessionId: ev.sessionId || null,
          properties: ev.properties || {},
          timestamp: ev.timestamp || new Date().toISOString(),
        });
      }
      return send(res, 200, { recorded: incomingList.length, total: analyticsEvents.length });
    } catch (err: any) {
      return send(res, 500, { error: 'failed to record analytics event', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/analytics/events') {
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
    const recent = analyticsEvents.slice(-limit).reverse();
    return send(res, 200, { events: recent });
  }

  if (req.method === 'GET' && url.pathname === '/api/analytics/summary') {
    const totalEvents = analyticsEvents.length;
    const uniqueDevices = new Set(analyticsEvents.map((e) => e.deviceId || 'anon')).size;
    let guidedFlowStarts = 0;
    let guidedFlowCompletions = 0;
    let habit5MinAchieved = 0;
    let onboardingStarts = 0;
    let onboardingCompletions = 0;

    const stepViews: Record<string, number> = { scripture: 0, reflect: 0, 'meditate-select': 0, 'meditate-run': 0, pray: 0, complete: 0 };
    const stepDwells: Record<string, number[]> = { scripture: [], reflect: [], 'meditate-select': [], 'meditate-run': [], pray: [], complete: [] };

    for (const e of analyticsEvents) {
      const name = e.eventName;
      const props = e.properties || {};
      if (name === 'guided_flow_started' || name === 'guided_flow_start') guidedFlowStarts++;
      else if (name === 'guided_flow_completed' || name === 'guided_flow_finish') guidedFlowCompletions++;
      else if (name === 'habit_5min_achieved') habit5MinAchieved++;
      else if (name === 'onboarding_started') onboardingStarts++;
      else if (name === 'onboarding_completed') onboardingCompletions++;

      if (name === 'guided_step_viewed' && typeof props.step === 'string' && stepViews[props.step] !== undefined) {
        stepViews[props.step]++;
      }
      if (typeof props.dwellSeconds === 'number' && typeof props.step === 'string' && stepDwells[props.step]) {
        stepDwells[props.step].push(props.dwellSeconds);
      }
    }

    const guidedFlowCompletionRate = guidedFlowStarts > 0 ? Math.round((guidedFlowCompletions / guidedFlowStarts) * 100) : 0;
    const onboardingCompletionRate = onboardingStarts > 0 ? Math.round((onboardingCompletions / onboardingStarts) * 100) : 0;

    const averageDwellSeconds: Record<string, number> = {};
    for (const [s, dwells] of Object.entries(stepDwells)) {
      averageDwellSeconds[s] = dwells.length > 0 ? Math.round(dwells.reduce((a, b) => a + b, 0) / dwells.length) : 0;
    }

    const funnel = [
      { step: 'Scripture Reading', count: stepViews.scripture, conversionRate: 100 },
      { step: 'Soul Reflection', count: stepViews.reflect, conversionRate: stepViews.scripture > 0 ? Math.round((stepViews.reflect / stepViews.scripture) * 100) : 0 },
      { step: 'Guided Meditation', count: stepViews['meditate-run'], conversionRate: stepViews.scripture > 0 ? Math.round((stepViews['meditate-run'] / stepViews.scripture) * 100) : 0 },
      { step: 'Written/Audio Prayer', count: stepViews.pray, conversionRate: stepViews.scripture > 0 ? Math.round((stepViews.pray / stepViews.scripture) * 100) : 0 },
    ];

    return send(res, 200, {
      totalEvents,
      uniqueDevices,
      guidedFlowStarts,
      guidedFlowCompletions,
      guidedFlowCompletionRate,
      habit5MinAchieved,
      onboardingStarts,
      onboardingCompletions,
      onboardingCompletionRate,
      stepDropOffs: stepViews,
      averageDwellSeconds,
      funnel,
    });
  }

  // ---- Prayer Sanctuary ----
  if (req.method === 'POST' && url.pathname === '/api/prayer-sanctuary') {
    try {
      const body = await readBody(req);
      const rawText = typeof body.text === 'string' ? body.text.trim() : '';
      if (!rawText || rawText.length < 5) {
        return send(res, 400, { error: 'A prayer reflection of at least 5 characters is required' });
      }

      // 1. Safety check
      const isCrisis = CRISIS_PATTERNS.some((p) => p.test(rawText));
      if (isCrisis) {
        return send(res, 200, {
          id: `ps-${Date.now()}`,
          text: rawText,
          themes: ['crisis'],
          passage: null,
          meditation: 'Please take care of yourself right now. You do not have to carry this alone.',
          reflectionQuestion: 'Would you reach out to someone you trust or your local helpline right now?',
          guidedPrayer: 'Lord, hold this pilgrim gently in this deep valley of distress. Send hands of help and comfort.',
          safetyStatus: 'crisis_escalation',
          supportMessage: 'Your safety matters. If you are in crisis, call or text 988 (US/CA) or your local emergency services immediately.',
          saved: false,
          createdAt: new Date().toISOString(),
        });
      }

      // 2. Theme matching
      const lower = rawText.toLowerCase();
      let matchedTheme = 'peaceful';
      let themeTag = 'peace';
      for (const [theme, mood, keywords] of THEME_RULES) {
        if (keywords.some((k) => lower.includes(k))) {
          matchedTheme = mood;
          themeTag = theme;
          break;
        }
      }

      // 3. Choose Scripture
      const candidateVerses = (versesJson.verses as any[]).filter((v) => v.mood === matchedTheme);
      const chosenVerse = candidateVerses.length > 0 ? candidateVerses[Math.floor(Math.random() * candidateVerses.length)] : versesJson.verses[0];

      const resultItem: PrayerSanctuaryItem = {
        id: `ps-${Date.now()}`,
        text: rawText,
        themes: [themeTag, matchedTheme],
        passage: {
          reference: chosenVerse.reference,
          text: chosenVerse.text,
          translation: 'KJV',
        },
        meditation: `Sit quietly before God with ${chosenVerse.reference}: "${chosenVerse.text}" Let the sovereign peace of Christ guard your heart.`,
        reflectionQuestion: `In what specific area of your day can you rest in ${chosenVerse.reference} rather than bearing anxiety on your own?`,
        guidedPrayer: `Heavenly Father, thank You that You hear every sigh of my heart. I bring my thoughts before You and receive Your steadfast grace. Amen.`,
        safetyStatus: 'safe',
        supportMessage: null,
        saved: body.saveToHistory !== false,
        createdAt: new Date().toISOString(),
      };

      if (body.saveToHistory !== false) {
        prayerSanctuaryHistory.unshift(resultItem);
      }

      return send(res, 200, resultItem);
    } catch (err: any) {
      return send(res, 500, { error: 'Failed to process prayer sanctuary request', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/prayer-sanctuary/history') {
    return send(res, 200, { entries: prayerSanctuaryHistory });
  }

  if (req.method === 'DELETE' && url.pathname.match(/^\/api\/prayer-sanctuary\/[^/]+$/)) {
    const id = url.pathname.split('/')[3];
    const idx = prayerSanctuaryHistory.findIndex((item) => item.id === id);
    if (idx !== -1) {
      prayerSanctuaryHistory.splice(idx, 1);
    }
    return send(res, 200, { success: true });
  }

  // ---- Waitlist Pipeline ----
  if (req.method === 'GET' && url.pathname === '/api/waitlist/cohorts') {
    return send(res, 200, { cohorts: waitlistCohorts, feedbackLoopRate: '78%', totalWaitlist: waitlistMembers.length });
  }

  if (req.method === 'GET' && url.pathname === '/api/waitlist/members') {
    return send(res, 200, { members: waitlistMembers });
  }

  if (req.method === 'POST' && url.pathname === '/api/waitlist/join') {
    try {
      const body = await readBody(req);
      if (!body.email || !body.email.includes('@')) {
        return send(res, 400, { error: 'A valid email address is required' });
      }

      const cohortId = body.spiritualRole === 'Pastoral Leader' ? 'cohort-pastoral' : body.name && body.name.includes('FR') ? 'cohort-french' : 'cohort-pilgrims';
      const cohort = waitlistCohorts.find((c) => c.id === cohortId) || waitlistCohorts[0];
      cohort.memberCount++;
      cohort.stages.registered++;

      const newMember = {
        id: `wl_${Date.now()}`,
        email: body.email.trim().toLowerCase(),
        name: body.name ? body.name.trim() : 'Sanctuary Pilgrim',
        spiritualRole: body.spiritualRole || 'Devotional Seeker',
        cohortId,
        referralCode: (body.name ? body.name.slice(0, 4) : 'LIFE').toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000),
        referredBy: body.referralCode || null,
        stage: 'registered',
        priorityScore: 50 + (body.struggleFeedback ? 20 : 0) + (body.referralCode ? 15 : 0),
        struggleFeedback: body.struggleFeedback || null,
        desiredFeatures: [],
        dailyTimeAvailable: undefined,
        feedbackNotes: [],
        referralCount: 0,
        createdAt: new Date().toISOString(),
      };

      waitlistMembers.unshift(newMember);
      return send(res, 201, { member: newMember, message: 'Successfully joined cohort! Welcome to LifeBook.' });
    } catch (err: any) {
      return send(res, 500, { error: 'Failed to join waitlist', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/waitlist/feedback') {
    try {
      const body = await readBody(req);
      const member = waitlistMembers.find((m) => m.id === body.memberId);
      if (member) {
        member.struggleFeedback = body.struggleFeedback || member.struggleFeedback;
        member.desiredFeatures = body.desiredFeatures || member.desiredFeatures;
        member.dailyTimeAvailable = body.dailyTimeAvailable || member.dailyTimeAvailable;
        if (body.feedbackNote) {
          member.feedbackNotes.push({ note: body.feedbackNote, timestamp: new Date().toISOString() });
        }
        member.stage = 'feedback_submitted';
        member.priorityScore = Math.min(100, member.priorityScore + 25);
      }
      return send(res, 200, { success: true, member });
    } catch (err: any) {
      return send(res, 500, { error: 'Failed to save waitlist feedback', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/waitlist/promote') {
    try {
      const body = await readBody(req);
      const member = waitlistMembers.find((m) => m.id === body.memberId);
      if (member && body.stage) {
        member.stage = body.stage;
        if (body.note) {
          member.feedbackNotes.push({ note: body.note, timestamp: new Date().toISOString() });
        }
      }
      return send(res, 200, { success: true, member });
    } catch (err: any) {
      return send(res, 500, { error: 'Failed to promote member', detail: String(err?.message || err) });
    }
  }

  // ---- LivingWord Teachings & CMS ----
  if (req.method === 'GET' && url.pathname === '/api/teachings') {
    return send(res, 200, { teachings: cmsTeachings });
  }

  if (req.method === 'GET' && url.pathname.match(/^\/api\/teachings\/[^/]+$/)) {
    const slug = url.pathname.split('/')[3];
    const teaching = cmsTeachings.find((t) => t.slug === slug);
    if (!teaching) return send(res, 404, { error: 'Teaching not found' });
    return send(res, 200, { teaching, comments: [] });
  }

  if (req.method === 'GET' && url.pathname === '/api/livingword/cms/teachings') {
    return send(res, 200, { teachings: cmsTeachings });
  }

  if (req.method === 'POST' && url.pathname === '/api/livingword/cms/create') {
    try {
      const body = await readBody(req);
      if (!body.title || !body.scripture) {
        return send(res, 400, { error: 'Title and Scripture are required' });
      }

      const slug = (body.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;
      const newTeaching = {
        slug,
        title: body.title,
        teacher: body.teacher || 'Pastor Asket',
        teacherRole: body.teacherRole || 'LifeBook pastoral teaching contributor',
        category: body.category || 'Faith',
        duration: body.duration || '10 min',
        scripture: body.scripture,
        excerpt: body.excerpt || body.title,
        fullBody: body.fullBody || body.excerpt || body.title,
        theologicalNotes: body.theologicalNotes || 'Submitted for pastoral review.',
        status: body.status || 'under_pastoral_review',
        audioUrl: body.audioUrl || null,
        videoUrl: body.videoUrl || null,
        createdAt: new Date().toISOString(),
      };

      cmsTeachings.unshift(newTeaching);
      return send(res, 201, { teaching: newTeaching });
    } catch (err: any) {
      return send(res, 500, { error: 'Failed to create teaching', detail: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && url.pathname.match(/^\/api\/livingword\/cms\/[^/]+\/review$/)) {
    try {
      const slug = url.pathname.split('/')[4];
      const body = await readBody(req);
      const teaching = cmsTeachings.find((t) => t.slug === slug);
      if (!teaching) return send(res, 404, { error: 'Teaching not found' });

      teaching.status = body.verdict || 'approved';
      teaching.theologicalRubric = body.rubric;
      teaching.reviewedBy = body.reviewerId || 'Pastor Asket';
      teaching.reviewedAt = new Date().toISOString();
      return send(res, 200, { success: true, teaching });
    } catch (err: any) {
      return send(res, 500, { error: 'Failed to submit teaching review', detail: String(err?.message || err) });
    }
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`LifeBook backend listening on http://0.0.0.0:${PORT}`);
  console.log(`AI mode: ${process.env.ANTHROPIC_API_KEY ? 'LIVE' : 'DEV-FALLBACK (no ANTHROPIC_API_KEY set)'}`);
  console.log(`Auth mode: ${isClerkConfigured() ? 'CLERK' : 'UNCONFIGURED'}`);
});
