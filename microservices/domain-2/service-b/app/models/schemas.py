from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

MoodType = Literal["grateful", "peaceful", "seeking", "doubting", "distant", "convicted"]

# --- Core Checkin & Verse ---
class Verse(BaseModel):
    mood: MoodType
    text: str
    reference: str

class CheckinRequest(BaseModel):
    deviceId: Optional[str] = None
    mood: MoodType
    note: Optional[str] = None

class GeneratedContent(BaseModel):
    id: str
    checkinId: str
    verseText: str
    verseReference: str
    whyThisVerse: str
    meditation: str
    reflectionQuestion: str
    prayer: str
    actionStep: str
    reviewVerdict: Literal["pass", "uncertain"] = "pass"
    modelMode: Literal["live", "dev-fallback"] = "dev-fallback"
    createdAt: str

class StreakHistoryItem(BaseModel):
    date: str
    mood: MoodType

class StreakRecord(BaseModel):
    deviceId: str
    current: int = 0
    longest: int = 0
    lastCheckIn: str = ""
    history: List[StreakHistoryItem] = []

class CheckinResponse(BaseModel):
    checkin: Dict[str, Any]
    content: GeneratedContent
    streak: StreakRecord

class FlagRequest(BaseModel):
    deviceId: Optional[str] = None
    contentId: str
    reason: Optional[str] = None

class FlagResponse(BaseModel):
    id: str
    contentId: str
    deviceId: str
    reason: Optional[str] = None
    status: Literal["pending", "reviewed", "resolved"] = "pending"
    createdAt: str

class Badge(BaseModel):
    id: str
    title: str
    description: str
    earned: bool
    earnedAt: Optional[str] = None

# --- Community ---
class Group(BaseModel):
    id: str
    name: str
    description: str
    meetingFrequency: str
    memberCount: int = 0

class JoinGroupRequest(BaseModel):
    deviceId: Optional[str] = None

class PrayerRequestInput(BaseModel):
    deviceId: Optional[str] = None
    text: str
    category: Optional[str] = "General"

class PrayerRequest(BaseModel):
    id: str
    deviceId: str
    authorName: str = "Fellow Believer"
    text: str
    category: Optional[str] = "General"
    prayerCount: int = 0
    moderationStatus: Literal["pending", "approved", "rejected"] = "approved"
    createdAt: str

class DiscussionInput(BaseModel):
    deviceId: Optional[str] = None
    title: str
    body: str
    tags: Optional[List[str]] = []

class Discussion(BaseModel):
    id: str
    deviceId: str
    authorName: str = "Believer"
    title: str
    body: str
    tags: List[str] = []
    replyCount: int = 0
    likeCount: int = 0
    moderationStatus: Literal["pending", "approved", "rejected"] = "approved"
    createdAt: str

class DiscussionReplyInput(BaseModel):
    deviceId: Optional[str] = None
    text: str

class DiscussionReply(BaseModel):
    id: str
    discussionId: str
    deviceId: str
    authorName: str = "Believer"
    text: str
    createdAt: str

# --- Journal & Favorites ---
class JournalEntryInput(BaseModel):
    deviceId: Optional[str] = None
    text: str
    relatedContentId: Optional[str] = None

class JournalEntry(BaseModel):
    id: str
    deviceId: str
    text: str
    relatedContentId: Optional[str] = None
    createdAt: str

class FavoriteVerseInput(BaseModel):
    deviceId: Optional[str] = None
    contentId: str
    verseText: str
    verseReference: str

class FavoriteVerse(BaseModel):
    id: str
    deviceId: str
    contentId: str
    verseText: str
    verseReference: str
    createdAt: str

# --- Preferences ---
class UserPreferences(BaseModel):
    deviceId: str
    displayName: Optional[str] = None
    spiritualPath: Optional[str] = None
    dailyHabits: Optional[List[str]] = []
    notificationTime: Optional[str] = None
    favoriteBooks: Optional[List[str]] = []
    joinedGroupSuggestion: Optional[str] = None
    onboardingCompletedAt: Optional[str] = None

# --- Notifications ---
class PushTokenInput(BaseModel):
    deviceId: Optional[str] = None
    token: str
    platform: Optional[Literal["ios", "android", "unknown"]] = "unknown"

# --- Journeys ---
class JourneyDay(BaseModel):
    journeyId: str
    dayNumber: int
    title: str
    verseText: str
    verseReference: str
    reflection: str
    prayer: str

class Journey(BaseModel):
    id: str
    title: str
    description: str
    category: str
    totalDays: int
    recommendedMoods: List[str] = []
    days: Optional[List[JourneyDay]] = None

class UserJourneyProgress(BaseModel):
    journeyId: str
    currentDay: int = 1
    completedDays: List[int] = []
    startedAt: str
    completedAt: Optional[str] = None

# --- Library ---
class LibraryBook(BaseModel):
    id: str
    title: str
    author: str
    category: str
    spiritualLevel: str
    isPremium: bool
    summary: str
    locked: Optional[bool] = False
    progressPercent: Optional[int] = 0
    bookmarked: Optional[bool] = False

# --- Subscription ---
class Subscription(BaseModel):
    deviceId: str
    tier: Literal["free", "premium"] = "free"
    billingCycle: Optional[Literal["monthly", "annual"]] = None
    updatedAt: str

class UpgradeInput(BaseModel):
    deviceId: Optional[str] = None
    billingCycle: Literal["monthly", "annual"]

# --- Voice & AI ---
class VoiceQuestionInput(BaseModel):
    deviceId: Optional[str] = None
    question: str

class VoiceQuestionResponse(BaseModel):
    response: Dict[str, Any]

class ModerationInput(BaseModel):
    deviceId: Optional[str] = None
    content: str

class ModerationResponse(BaseModel):
    flagged: bool
    reason: Optional[str] = None
    recommendedAction: Literal["allow", "review", "reject"] = "allow"

class ModerationReviewResolveInput(BaseModel):
    deviceId: Optional[str] = None
    status: Literal["approved", "rejected"]
    resolutionNotes: Optional[str] = None

# --- Health ---
class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "lifebook-backend-fastapi"
    version: str = "1.0.0"
    aiMode: str
    authMode: str
    databaseMode: str

# --- Analytics & Telemetry ---
class TelemetryEventInput(BaseModel):
    eventName: str
    deviceId: Optional[str] = None
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None

class BatchTelemetryEventsInput(BaseModel):
    events: List[TelemetryEventInput]

class FunnelStepSummary(BaseModel):
    step: str
    views: int
    completions: int
    dropOffRate: float
    avgDwellSeconds: float

class AnalyticsSummaryResponse(BaseModel):
    totalEvents: int
    uniqueDevices: int
    guidedFlowStarts: int
    guidedFlowCompletions: int
    completionRate: float
    habit5MinAchieved: int
    funnel: List[FunnelStepSummary]
