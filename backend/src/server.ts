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
import { ProfileRepository, CheckinRepository, JournalRepository } from './repositories';

const PORT = Number(process.env.PORT) || 8787;
const VALID_MOODS: Mood[] = ['grateful', 'peaceful', 'seeking', 'doubting', 'distant', 'convicted'];

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
    return send(res, 200, { streak: getStreak(userId) });
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
    return send(res, 200, { badges: computeBadges(getStreak(userId)) });
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
    return send(res, 200, { requests: listPrayerRequests() });
  }
  if (req.method === 'POST' && url.pathname === '/api/prayer-requests') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.text) return send(res, 400, { error: 'text is required' });
    return send(res, 200, submitPrayerRequest(userId, body.text, body.category));
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/prayer-requests\/[^/]+\/pray$/)) {
    try {
      const id = url.pathname.split('/')[3];
      return send(res, 200, { request: prayFor(id) });
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/discussions') {
    return send(res, 200, { discussions: listDiscussions() });
  }
  if (req.method === 'POST' && url.pathname === '/api/discussions') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.title || !body.body) return send(res, 400, { error: 'title and body are required' });
    return send(res, 200, createDiscussion(userId, body.title, body.body, body.tags));
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/discussions\/[^/]+\/like$/)) {
    try {
      const id = url.pathname.split('/')[3];
      return send(res, 200, { discussion: likeDiscussion(id) });
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }
  if (req.method === 'GET' && url.pathname.match(/^\/api\/discussions\/[^/]+\/replies$/)) {
    const id = url.pathname.split('/')[3];
    return send(res, 200, { replies: listReplies(id) });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/discussions\/[^/]+\/replies$/)) {
    try {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      const userId = await requireUser(req, res, body.deviceId);
      if (!userId) return;
      if (!body.text) return send(res, 400, { error: 'text is required' });
      return send(res, 200, replyToDiscussion(id, userId, body.text));
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }

  // ---- Journal & favorites ----
  if (req.method === 'GET' && url.pathname === '/api/journal') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { entries: listJournalEntries(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/journal') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.text) return send(res, 400, { error: 'text is required' });
    return send(res, 200, { entry: addJournalEntry(userId, body.text, body.relatedContentId) });
  }
  if (req.method === 'GET' && url.pathname === '/api/favorites') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { favorites: listFavorites(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/favorites') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.contentId || !body.verseText || !body.verseReference) {
      return send(res, 400, { error: 'contentId, verseText, and verseReference are required' });
    }
    return send(res, 200, { favorite: addFavorite(userId, body.contentId, body.verseText, body.verseReference) });
  }
  if (req.method === 'GET' && url.pathname === '/api/mood-history') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { history: moodHistory(userId) });
  }

  // ---- Preferences / onboarding ----
  if (req.method === 'GET' && url.pathname === '/api/preferences') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { preferences: getPreferences(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/preferences') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    const { deviceId, ...updates } = body;
    return send(res, 200, { preferences: savePreferences(userId, updates) });
  }

  // ---- Push notifications ----
  if (req.method === 'POST' && url.pathname === '/api/push-token') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.token) return send(res, 400, { error: 'token is required' });
    return send(res, 200, { registered: registerPushToken(userId, body.token, body.platform) });
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
    return send(res, 200, { journeys: listJourneys() });
  }
  if (req.method === 'GET' && url.pathname.match(/^\/api\/journeys\/[^/]+$/)) {
    const id = url.pathname.split('/')[3];
    const journey = getJourney(id);
    if (!journey) return send(res, 404, { error: 'journey not found' });
    return send(res, 200, { journey });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/journeys\/[^/]+\/start$/)) {
    const id = url.pathname.split('/')[3];
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    try {
      return send(res, 200, { progress: startJourney(userId, id) });
    } catch (err: any) {
      return send(res, 404, { error: String(err?.message || err) });
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/journeys-active') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { active: getActiveJourney(userId) });
  }
  if (req.method === 'GET' && url.pathname === '/api/journeys-mine') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { progress: listUserJourneys(userId) });
  }
  if (req.method === 'GET' && url.pathname === '/api/journeys-recommended') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    return send(res, 200, { recommendation: getRecommendedJourney(userId) });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/journeys\/[^/]+\/complete-day$/)) {
    const id = url.pathname.split('/')[3];
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    try {
      return send(res, 200, { progress: completeDay(userId, id) });
    } catch (err: any) {
      return send(res, 400, { error: String(err?.message || err) });
    }
  }

  // ---- Library ----
  if (req.method === 'GET' && url.pathname === '/api/library') {
    const userId = await requireUser(req, res, url.searchParams.get('deviceId') || undefined);
    if (!userId) return;
    const sub = getSubscription(userId);
    return send(res, 200, { books: listLibrary(userId, sub.tier) });
  }
  if (req.method === 'POST' && url.pathname.match(/^\/api\/library\/[^/]+\/bookmark$/)) {
    const bookId = url.pathname.split('/')[3];
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    return send(res, 200, { entry: toggleBookmark(userId, bookId) });
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
    return send(res, 200, { subscription: getSubscription(userId) });
  }
  if (req.method === 'POST' && url.pathname === '/api/subscription/upgrade') {
    const body = await readBody(req);
    const userId = await requireUser(req, res, body.deviceId);
    if (!userId) return;
    if (!body.billingCycle) return send(res, 400, { error: 'billingCycle is required' });
    return send(res, 200, { subscription: upgrade(userId, body.billingCycle) });
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`LifeBook backend listening on http://localhost:${PORT}`);
  console.log(`AI mode: ${process.env.ANTHROPIC_API_KEY ? 'LIVE' : 'DEV-FALLBACK (no ANTHROPIC_API_KEY set)'}`);
  console.log(`Auth mode: ${isClerkConfigured() ? 'CLERK' : 'UNCONFIGURED'}`);
});
