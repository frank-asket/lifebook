import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, NamedTuple
from ..db import get_db
from ..models.schemas import MoodType, GeneratedContent, StreakRecord, StreakHistoryItem
from .verse_retrieval import retrieve_verse
from .content_generation import generate_content
from .safety_review import review_content

def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _days_between(d1: str, d2: str) -> int:
    try:
        dt1 = datetime.strptime(d1, "%Y-%m-%d")
        dt2 = datetime.strptime(d2, "%Y-%m-%d")
        return (dt2 - dt1).days
    except Exception:
        return 0

class CheckinResult(NamedTuple):
    checkin: Dict[str, Any]
    content: GeneratedContent
    streak: StreakRecord
    support_note_needed: bool

async def run_checkin(device_id: str, mood: MoodType, note: Optional[str] = None) -> CheckinResult:
    database = get_db().read()
    now_str = _now_iso()
    today = _today_str()

    # 1. Log checkin
    checkin_id = str(uuid.uuid4())
    checkin_obj = {
        "id": checkin_id,
        "deviceId": device_id,
        "mood": mood,
        "note": note,
        "createdAt": now_str
    }
    database["checkins"].append(checkin_obj)

    # 2. Verse retrieval
    verse = retrieve_verse(device_id, mood)

    # 3. Content generation
    pieces = await generate_content(mood, verse, note)

    # 4. Safety review
    review = review_content(note, pieces)

    # 5. Assemble content
    content_id = str(uuid.uuid4())
    content = GeneratedContent(
        id=content_id,
        checkinId=checkin_id,
        verseText=verse.text,
        verseReference=verse.reference,
        whyThisVerse=pieces.get("whyThisVerse", ""),
        meditation=pieces.get("meditation", ""),
        reflectionQuestion=pieces.get("reflectionQuestion", ""),
        prayer=pieces.get("prayer", ""),
        actionStep=pieces.get("actionStep", ""),
        reviewVerdict="uncertain" if review.verdict == "uncertain" else "pass",
        modelMode="live" if pieces.get("mode") == "live" else "dev-fallback",
        createdAt=now_str
    )
    database["content"].append(content.model_dump())

    # 6. Update streak
    streak_raw = database["streaks"].get(device_id)
    if not streak_raw:
        streak_record = StreakRecord(
            deviceId=device_id,
            current=1,
            longest=1,
            lastCheckIn=today,
            history=[StreakHistoryItem(date=today, mood=mood)]
        )
    else:
        last_checkin = streak_raw.get("lastCheckIn", "")
        current = streak_raw.get("current", 0)
        longest = streak_raw.get("longest", 0)
        history = [StreakHistoryItem(**h) for h in streak_raw.get("history", [])]

        if last_checkin != today:
            gap = _days_between(last_checkin, today)
            current = current + 1 if gap == 1 else 1
            longest = max(longest, current)
            last_checkin = today

        history = [h for h in history if h.date != today]
        history.append(StreakHistoryItem(date=today, mood=mood))
        streak_record = StreakRecord(
            deviceId=device_id,
            current=current,
            longest=longest,
            lastCheckIn=last_checkin,
            history=history[-30:]
        )

    database["streaks"][device_id] = streak_record.model_dump()
    get_db().write(database)

    return CheckinResult(
        checkin=checkin_obj,
        content=content,
        streak=streak_record,
        support_note_needed=review.support_note_needed
    )

def get_streak(device_id: str) -> Optional[StreakRecord]:
    database = get_db().read()
    raw = database["streaks"].get(device_id)
    if not raw:
        return None
    return StreakRecord(**raw)

def file_flag(content_id: str, device_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
    database = get_db().read()
    flag = {
        "id": str(uuid.uuid4()),
        "contentId": content_id,
        "deviceId": device_id,
        "reason": reason,
        "status": "pending",
        "createdAt": _now_iso()
    }
    database["flags"].append(flag)
    get_db().write(database)
    return flag
