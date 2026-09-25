import os
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Request, Response, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import (
    PORT,
    ANTHROPIC_API_KEY,
    GEMINI_API_KEY,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX,
    RATE_LIMIT_CHECKIN_MAX,
)
from .security.cors import get_cors_middleware_args
from .security.rate_limit import check_rate_limit
from .auth.verify_token import get_current_user, get_optional_user, require_staff_user, is_clerk_configured
from .models.schemas import (
    CheckinRequest,
    FlagRequest,
    PrayerRequestInput,
    DiscussionInput,
    DiscussionReplyInput,
    JournalEntryInput,
    FavoriteVerseInput,
    PushTokenInput,
    UpgradeInput,
    VoiceQuestionInput,
    ModerationInput,
    ModerationReviewResolveInput,
    HealthResponse,
    TelemetryEventInput,
    BatchTelemetryEventsInput,
    AnalyticsSummaryResponse,
    CreatePlaylistInput,
    UpdatePlaylistInput,
    AddPlaylistItemInput,
    ReorderPlaylistItemsInput,
)
from .agents.playlists import (
    list_playlists,
    create_playlist,
    update_playlist,
    delete_playlist,
    add_playlist_item,
    remove_playlist_item,
    reorder_playlist_items,
)
from .agents.orchestrator import run_checkin, get_streak, file_flag
from .agents.badges import compute_badges
from .agents.analytics import (
    record_event,
    record_batch_events,
    compute_funnel_and_summary,
    get_recent_events,
)
from .agents.community import (
    list_groups,
    join_group,
    list_prayer_requests,
    submit_prayer_request,
    pray_for,
    list_discussions,
    create_discussion,
    like_discussion,
    list_replies,
    reply_to_discussion,
)
from .agents.journal import (
    add_journal_entry,
    list_journal_entries,
    add_favorite,
    list_favorites,
    mood_history,
)
from .agents.journeys import (
    list_journeys,
    get_journey,
    list_user_journeys,
    start_journey,
    get_active_journey,
    complete_day,
    get_recommended_journey,
    use_grace_day,
    complete_grace_catchup,
    simulate_missed_day,
)
from .agents.library import list_library, toggle_bookmark
from .agents.subscription import get_subscription, upgrade_subscription
from .agents.preferences import get_preferences, save_preferences
from .agents.notifications import register_push_token, send_push_notification
from .agents.voice import answer_voice_question
from .agents.living_word import (
    list_teachings,
    get_teaching,
    list_comments,
    add_comment,
    list_cms_teachings,
    create_teaching_draft,
    update_teaching,
    review_pastoral_teaching,
)
from .agents.waitlist import (
    get_cohort_definitions,
    join_waitlist,
    submit_cohort_feedback,
    promote_member_stage,
    list_cohorts_summary,
    list_waitlist_members,
)
from .agents.moderation import (
    moderate_post,
    list_moderation_reviews,
    resolve_moderation_review,
)

app = FastAPI(
    title="LifeBook Backend API",
    description="Full-featured Christian devotional and spiritual formation platform powered by FastAPI.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup CORS
cors_args = get_cors_middleware_args()
app.add_middleware(CORSMiddleware, **cors_args)


# Rate limit middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for OPTIONS, OpenAPI, or health checks
    if request.method == "OPTIONS" or request.url.path in ["/", "/api/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)

    client_ip = request.client.host if request.client else "127.0.0.1"
    path = request.url.path

    if path == "/api/checkin":
        limit = RATE_LIMIT_CHECKIN_MAX
    else:
        limit = RATE_LIMIT_MAX

    rate_key = f"{client_ip}:{path}"
    rl = check_rate_limit(rate_key, max_requests=limit, window_ms=RATE_LIMIT_WINDOW_MS)

    if not rl.allowed:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded. Please wait a moment before trying again."},
            headers={
                "Retry-After": str(max(1, int(rl.reset_at))),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
            },
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(rl.remaining)
    return response


# --------------------------------------------------------------------------
# Root & Health
# --------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "service": "lifebook-backend",
        "status": "ok",
        "framework": "FastAPI (Python)",
        "version": "1.0.0",
    }


@app.get("/api/health", response_model=HealthResponse)
async def health():
    ai_mode = "live" if (ANTHROPIC_API_KEY or GEMINI_API_KEY) else "dev-fallback"
    auth_mode = "live" if is_clerk_configured() else "dev-fallback"
    return HealthResponse(
        status="ok",
        service="lifebook-backend-fastapi",
        version="1.0.0",
        aiMode=ai_mode,
        authMode=auth_mode,
        databaseMode="json-file-thread-safe",
    )


@app.get("/api/me")
async def me(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    user_id = auth_user or deviceId or "dev_user_anonymous"
    sub = get_subscription(user_id)
    prefs = get_preferences(user_id)
    streak = get_streak(user_id)
    return {
        "userId": user_id,
        "subscription": sub,
        "preferences": prefs,
        "streak": streak.model_dump() if streak else None,
    }


# --------------------------------------------------------------------------
# Check-in & Core Devotional
# --------------------------------------------------------------------------
@app.post("/api/checkin")
async def checkin_endpoint(
    payload: CheckinRequest,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_device_id = payload.deviceId or auth_user or "dev_user_anonymous"
    result = await run_checkin(
        device_id=active_device_id,
        mood=payload.mood,
        note=payload.note,
    )
    checkin_data = result.checkin.model_dump() if hasattr(result.checkin, "model_dump") else result.checkin
    return {
        "checkin": checkin_data,
        "content": result.content.model_dump(),
        "streak": result.streak.model_dump(),
        "supportNote": result.support_note_needed,
    }


@app.get("/api/streak")
async def streak_endpoint(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    rec = get_streak(active_id)
    if not rec:
        return {
            "deviceId": active_id,
            "current": 0,
            "longest": 0,
            "lastCheckIn": None,
            "history": [],
        }
    return rec.model_dump()


@app.post("/api/flag")
async def flag_endpoint(
    payload: FlagRequest,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    flag = file_flag(
        content_id=payload.contentId,
        device_id=active_id,
        reason=payload.reason,
    )
    return {"flag": flag}


@app.get("/api/badges")
async def badges_endpoint(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    streak = get_streak(active_id)
    badges = compute_badges(streak)
    return {"badges": [b.model_dump() for b in badges]}


# --------------------------------------------------------------------------
# Community & Fellowship
# --------------------------------------------------------------------------
@app.get("/api/groups")
async def get_groups():
    return {"groups": list_groups()}


@app.post("/api/groups/{group_id}/join")
async def join_group_endpoint(
    group_id: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    try:
        res = join_group(group_id, active_id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/prayer-requests")
async def get_prayer_requests():
    return {"requests": list_prayer_requests()}


@app.post("/api/prayer-requests")
async def create_prayer_request(
    payload: PrayerRequestInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    res = submit_prayer_request(
        device_id=active_id,
        text=payload.text,
        category=payload.category,
    )
    return res


@app.post("/api/prayer-requests/{req_id}/pray")
async def pray_for_request(req_id: str):
    try:
        updated = pray_for(req_id)
        return {"request": updated}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/discussions")
async def get_discussions():
    return {"discussions": list_discussions()}


@app.post("/api/discussions")
async def post_discussion(
    payload: DiscussionInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    disc = create_discussion(
        device_id=active_id,
        title=payload.title,
        body=payload.body,
        tags=payload.tags,
    )
    return {"discussion": disc}


@app.post("/api/discussions/{disc_id}/like")
async def like_disc(disc_id: str):
    try:
        updated = like_discussion(disc_id)
        return {"discussion": updated}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/discussions/{disc_id}/replies")
async def get_replies(disc_id: str):
    return {"replies": list_replies(disc_id)}


@app.post("/api/discussions/{disc_id}/replies")
async def post_reply(
    disc_id: str,
    payload: DiscussionReplyInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    try:
        rep = reply_to_discussion(disc_id, active_id, payload.text)
        return {"reply": rep}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --------------------------------------------------------------------------
# Journal, Favorites & Mood History
# --------------------------------------------------------------------------
@app.get("/api/journal")
async def get_journal(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    return {"entries": list_journal_entries(active_id)}


@app.post("/api/journal")
async def create_journal(
    payload: JournalEntryInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    entry = add_journal_entry(
        device_id=active_id,
        text=payload.text,
        related_content_id=payload.relatedContentId,
    )
    return {"entry": entry}


@app.get("/api/favorites")
async def get_favs(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    return {"favorites": list_favorites(active_id)}


@app.post("/api/favorites")
async def create_fav(
    payload: FavoriteVerseInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    fav = add_favorite(
        device_id=active_id,
        content_id=payload.contentId,
        verse_text=payload.verseText,
        verse_reference=payload.verseReference,
    )
    return {"favorite": fav}


@app.get("/api/mood-history")
async def get_mood_history(
    deviceId: Optional[str] = Query(None),
    days: int = Query(30),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    return {"history": mood_history(active_id, days=days)}


# --------------------------------------------------------------------------
# Preferences
# --------------------------------------------------------------------------
@app.get("/api/preferences")
async def get_user_prefs(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    return {"preferences": get_preferences(active_id)}


@app.post("/api/preferences")
async def save_user_prefs(
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.get("deviceId") or auth_user or "dev_user_anonymous"
    saved = save_preferences(active_id, payload)
    return {"preferences": saved}


# --------------------------------------------------------------------------
# Push Notifications
# --------------------------------------------------------------------------
@app.post("/api/push-token")
async def save_push_token(
    payload: PushTokenInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    record = register_push_token(
        user_id=active_id,
        token=payload.token,
        platform=payload.platform or "unknown",
    )
    return {"registered": record}


@app.post("/api/notifications/send-test")
async def send_test_notification(
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    title = (payload or {}).get("title") or "LifeBook Daily Devotion"
    body = (payload or {}).get("body") or "Your daily verse and quiet meditation are ready."
    res = await send_push_notification(active_id, title=title, body=body)
    return res


# --------------------------------------------------------------------------
# Journeys
# --------------------------------------------------------------------------
@app.get("/api/journeys")
async def get_all_journeys():
    return {"journeys": list_journeys()}


@app.get("/api/journeys/{journey_id}")
async def get_one_journey(journey_id: str):
    j = get_journey(journey_id)
    if not j:
        raise HTTPException(status_code=404, detail="Journey not found")
    return {"journey": j}


@app.post("/api/journeys/{journey_id}/start")
async def start_user_journey(
    journey_id: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    try:
        prog = start_journey(active_id, journey_id)
        return {"progress": prog}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/journeys-active")
async def get_user_active_journey(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    return {"active": get_active_journey(active_id)}


@app.get("/api/journeys-mine")
async def get_my_journeys(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    return {"progress": list_user_journeys(active_id)}


@app.get("/api/journeys-recommended")
async def get_rec_journey(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    rec = get_recommended_journey(active_id)
    return {"recommendation": rec}


@app.post("/api/journeys/{journey_id}/complete-day")
async def complete_journey_day(
    journey_id: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    try:
        prog = complete_day(active_id, journey_id)
        return {"progress": prog}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/journeys/{journey_id}/grace-day")
async def apply_journey_grace_day(
    journey_id: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    reason = (payload or {}).get("reason") or "Intentional Rest / Sabbath"
    try:
        res = use_grace_day(active_id, journey_id, reason=reason)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/journeys/{journey_id}/grace-catchup")
async def resume_journey_grace_catchup(
    journey_id: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    try:
        res = complete_grace_catchup(active_id, journey_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/journeys/{journey_id}/simulate-missed-day")
async def simulate_missed_day_endpoint(
    journey_id: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    try:
        res = simulate_missed_day(active_id, journey_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------------------------------------------------------------
# Library
# --------------------------------------------------------------------------
@app.get("/api/library")
async def get_library_books(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    sub = get_subscription(active_id)
    tier = sub.get("tier", "free")
    books = list_library(active_id, tier=tier)
    return {"books": books}


@app.post("/api/library/{book_id}/bookmark")
async def bookmark_book(
    book_id: str,
    payload: Optional[Dict[str, Any]] = None,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = (payload or {}).get("deviceId") or auth_user or "dev_user_anonymous"
    entry = toggle_bookmark(active_id, book_id)
    return {"entry": entry}


# --------------------------------------------------------------------------
# Voice Guidance
# --------------------------------------------------------------------------
@app.post("/api/voice/answer")
async def voice_answer_endpoint(
    payload: VoiceQuestionInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    ans = await answer_voice_question(question, user_id=active_id)
    return {"response": ans}


# --------------------------------------------------------------------------
# AI Moderation & Admin Review Queue
# --------------------------------------------------------------------------
@app.post("/api/ai/moderate")
async def moderate_content(
    payload: ModerationInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    res = moderate_post(payload.content, user_id=active_id)
    return res


@app.get("/api/moderation/reviews")
async def get_reviews(
    auth_user: str = Depends(require_staff_user),
):
    return {"reviews": list_moderation_reviews()}


@app.post("/api/moderation/reviews/{review_id}/resolve")
async def resolve_review_endpoint(
    review_id: str,
    payload: ModerationReviewResolveInput,
    auth_user: str = Depends(require_staff_user),
):
    active_id = auth_user or payload.deviceId or "dev_reviewer_admin"
    res = resolve_moderation_review(
        review_id=review_id,
        reviewer_id=active_id,
        status=payload.status,
        resolution_notes=payload.resolutionNotes,
    )
    return res


# --------------------------------------------------------------------------
# Subscriptions
# --------------------------------------------------------------------------
@app.get("/api/subscription")
async def get_user_subscription(
    deviceId: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = deviceId or auth_user or "dev_user_anonymous"
    return {"subscription": get_subscription(active_id)}


@app.post("/api/subscription/upgrade")
async def upgrade_sub(
    payload: UpgradeInput,
    auth_user: Optional[str] = Depends(get_optional_user),
):
    active_id = payload.deviceId or auth_user or "dev_user_anonymous"
    sub = upgrade_subscription(active_id, billing_cycle=payload.billingCycle)
    return {"subscription": sub}


# --------------------------------------------------------------------------
# Living Word Media & Teachings
# --------------------------------------------------------------------------
@app.get("/api/livingword/teachings")
async def get_livingword_teachings():
    return {"teachings": list_teachings()}


@app.get("/api/livingword/teachings/{slug}")
async def get_livingword_teaching(slug: str):
    teaching = get_teaching(slug)
    if not teaching:
        raise HTTPException(status_code=404, detail="Teaching not found")
    comments = list_comments(slug)
    return {"teaching": teaching, "comments": comments}


@app.get("/api/livingword/teachings/{slug}/comments")
async def get_livingword_comments(slug: str):
    return {"comments": list_comments(slug)}


@app.post("/api/livingword/teachings/{slug}/comments")
async def post_livingword_comment(
    slug: str,
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment text cannot be empty")
    author_name = payload.get("authorName")
    active_id = payload.get("deviceId") or auth_user or "dev_user_anonymous"
    res = add_comment(slug=slug, user_id=active_id, text=text, author_name=author_name)
    return res


# --------------------------------------------------------------------------
# LivingWord Pastoral Review CMS (P5 Content Scaling)
# --------------------------------------------------------------------------
@app.get("/api/livingword/cms/teachings")
async def get_cms_teachings_endpoint(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    auth_user: Optional[str] = Depends(get_optional_user),
):
    return {"teachings": list_cms_teachings(status=status, category=category)}


@app.post("/api/livingword/cms/create")
async def create_teaching_endpoint(
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    creator = payload.get("deviceId") or auth_user or "pastor_contributor"
    try:
        res = create_teaching_draft(payload, creator_id=creator)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/livingword/cms/{slug}")
async def update_teaching_endpoint(
    slug: str,
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    try:
        res = update_teaching(slug, payload)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/livingword/cms/{slug}/review")
async def review_teaching_endpoint(
    slug: str,
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    reviewer = payload.get("reviewerId") or auth_user or "Pastor Asket"
    verdict = payload.get("verdict") or "approved"
    rubric = payload.get("rubric")
    notes = payload.get("notes") or payload.get("pastoralNotes")
    try:
        res = review_pastoral_teaching(
            slug=slug,
            reviewer_id=reviewer,
            verdict=verdict,
            rubric=rubric,
            pastoral_notes=notes,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --------------------------------------------------------------------------
# Waitlist & Cohort Pipeline (P4 Community Growth & Feedback Loops)
# --------------------------------------------------------------------------
@app.get("/api/waitlist/cohorts")
async def get_waitlist_cohorts():
    return list_cohorts_summary()


@app.get("/api/waitlist/members")
async def get_waitlist_members_endpoint(
    cohortId: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    limit: int = Query(100),
):
    return {"members": list_waitlist_members(cohort_id=cohortId, stage=stage, limit=limit)}


@app.post("/api/waitlist/join")
async def post_join_waitlist(
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    name = payload.get("name")
    spiritual_role = payload.get("spiritualRole") or payload.get("role")
    struggle_feedback = payload.get("struggleFeedback") or payload.get("feedback")
    referral_code = payload.get("referralCode") or payload.get("ref")
    device_id = payload.get("deviceId") or auth_user or "anonymous_device"

    try:
        res = join_waitlist(
            email=email,
            name=name,
            spiritual_role=spiritual_role,
            struggle_feedback=struggle_feedback,
            referral_code=referral_code,
            device_id=device_id,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/waitlist/feedback")
async def post_waitlist_feedback(
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    member_id = payload.get("memberId") or payload.get("email")
    if not member_id:
        raise HTTPException(status_code=400, detail="memberId or email is required")
    struggle = payload.get("struggleFeedback") or payload.get("feedback") or ""
    desired = payload.get("desiredFeatures") or []
    time_avail = payload.get("dailyTimeAvailable")
    note = payload.get("feedbackNote")

    try:
        res = submit_cohort_feedback(
            member_id_or_email=member_id,
            struggle_feedback=struggle,
            desired_features=desired,
            daily_time_available=time_avail,
            feedback_note=note,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/waitlist/promote")
async def post_promote_member(
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    member_id = payload.get("memberId")
    new_stage = payload.get("stage")
    if not member_id or not new_stage:
        raise HTTPException(status_code=400, detail="memberId and stage are required")
    note = payload.get("note")

    try:
        res = promote_member_stage(member_id=member_id, new_stage=new_stage, reviewer_note=note)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------------------------------------------------------------
# Telemetry & Analytics
# --------------------------------------------------------------------------
@app.post("/api/analytics/events")
async def post_analytics_event(
    payload: Dict[str, Any],
    auth_user: Optional[str] = Depends(get_optional_user),
):
    # Support batch format { events: [...] }
    if "events" in payload and isinstance(payload["events"], list):
        count = record_batch_events(payload["events"])
        return {"recorded": count, "batch": True}

    event_name = payload.get("eventName") or payload.get("event")
    if not event_name:
        raise HTTPException(status_code=400, detail="Missing eventName")

    device_id = payload.get("deviceId") or auth_user or "dev_user_anonymous"
    user_id = payload.get("userId") or auth_user
    evt = record_event(
        event_name=event_name,
        device_id=device_id,
        user_id=user_id,
        session_id=payload.get("sessionId"),
        properties=payload.get("properties"),
        timestamp=payload.get("timestamp"),
    )
    return {"event": evt}


@app.get("/api/analytics/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary_endpoint():
    summary = compute_funnel_and_summary()
    return AnalyticsSummaryResponse(**summary)


@app.get("/api/analytics/events")
async def get_analytics_events_endpoint(limit: int = Query(50)):
    return {"events": get_recent_events(limit=limit)}


# --- Living Word Playlists Endpoints ---
@app.get("/api/livingword/playlists")
async def get_playlists_endpoint(auth_user: str = Depends(get_current_user)):
    playlists = list_playlists(auth_user)
    return {"playlists": playlists}


@app.post("/api/livingword/playlists", status_code=status.HTTP_201_CREATED)
async def create_playlist_endpoint(
    body: CreatePlaylistInput,
    auth_user: str = Depends(get_current_user),
):
    playlist = create_playlist(
        user_id=auth_user,
        title=body.title,
        description=body.description,
        icon=body.icon,
        color=body.color,
    )
    return {"playlist": playlist}


@app.patch("/api/livingword/playlists/{playlist_id}")
async def update_playlist_endpoint(
    playlist_id: str,
    body: UpdatePlaylistInput,
    auth_user: str = Depends(get_current_user),
):
    updated = update_playlist(
        playlist_id=playlist_id,
        user_id=auth_user,
        data=body.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="playlist not found or unauthorized")
    return {"playlist": updated}


@app.delete("/api/livingword/playlists/{playlist_id}")
async def delete_playlist_endpoint(
    playlist_id: str,
    auth_user: str = Depends(get_current_user),
):
    success = delete_playlist(playlist_id, auth_user)
    if not success:
        raise HTTPException(status_code=400, detail="cannot delete default playlist or playlist not found")
    return {"success": True, "id": playlist_id}


@app.post("/api/livingword/playlists/{playlist_id}/items")
async def add_playlist_item_endpoint(
    playlist_id: str,
    body: AddPlaylistItemInput,
    auth_user: str = Depends(get_current_user),
):
    result = add_playlist_item(auth_user, playlist_id, body.model_dump())
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.delete("/api/livingword/playlists/{playlist_id}/items/{teaching_slug}")
async def remove_playlist_item_endpoint(
    playlist_id: str,
    teaching_slug: str,
    auth_user: str = Depends(get_current_user),
):
    updated = remove_playlist_item(auth_user, playlist_id, teaching_slug)
    if not updated:
        raise HTTPException(status_code=404, detail="playlist not found or item not found")
    return {"playlist": updated}


@app.post("/api/livingword/playlists/{playlist_id}/reorder")
async def reorder_playlist_items_endpoint(
    playlist_id: str,
    body: ReorderPlaylistItemsInput,
    auth_user: str = Depends(get_current_user),
):
    updated = reorder_playlist_items(auth_user, playlist_id, body.teachingSlugs)
    if not updated:
        raise HTTPException(status_code=404, detail="playlist not found")
    return {"playlist": updated}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
