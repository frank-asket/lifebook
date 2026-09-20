import json
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..config import DATA_DIR
from ..db import get_db
from .journal import mood_history

CATALOG_PATH = DATA_DIR / "journeys.json"

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _load_catalog() -> Dict[str, Any]:
    if not CATALOG_PATH.exists():
        return {"journeys": [], "days": []}
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"journeys": [], "days": []}

def list_journeys() -> List[Dict[str, Any]]:
    catalog = _load_catalog()
    return catalog.get("journeys", [])

def get_journey(journey_id: str) -> Optional[Dict[str, Any]]:
    journeys = list_journeys()
    return next((j for j in journeys if j.get("id") == journey_id), None)

def get_journey_day(journey_id: str, day_number: int) -> Optional[Dict[str, Any]]:
    catalog = _load_catalog()
    days = catalog.get("days", [])
    return next((d for d in days if d.get("journeyId") == journey_id and d.get("dayNumber") == day_number), None)

def list_user_journeys(user_id: str) -> List[Dict[str, Any]]:
    db = get_db().read()
    progress_map = db.get("journeyProgress", {})
    return progress_map.get(user_id, [])

def start_journey(user_id: str, journey_id: str) -> Dict[str, Any]:
    journey = get_journey(journey_id)
    if not journey:
        raise ValueError("Journey not found")
        
    db = get_db().read()
    progress_map = db.setdefault("journeyProgress", {})
    user_list = progress_map.setdefault(user_id, [])
    
    existing = next((p for p in user_list if p.get("journeyId") == journey_id), None)
    if existing:
        # Backfill grace fields if missing
        if "graceDaysRemaining" not in existing:
            existing["graceDaysTotal"] = 2
            existing["graceDaysRemaining"] = 2
            existing["graceDaysUsed"] = 0
            existing["isGraceProtected"] = True
            existing["graceHistory"] = []
            existing["status"] = "active"
            get_db().write(db)
        return existing
        
    prog = {
        "journeyId": journey_id,
        "currentDay": 1,
        "completedDays": [],
        "startedAt": _now_iso(),
        "graceDaysTotal": 2,
        "graceDaysRemaining": 2,
        "graceDaysUsed": 0,
        "isGraceProtected": True,
        "graceHistory": [],
        "status": "active"
    }
    user_list.append(prog)
    get_db().write(db)
    return prog

def use_grace_day(user_id: str, journey_id: str, reason: str = "Intentional Rest / Sabbath") -> Dict[str, Any]:
    """
    Activates a Journey Grace Day.
    Protects the user's progress on currentDay and ensures no streak reset or failure occurs.
    """
    db = get_db().read()
    progress_map = db.get("journeyProgress", {})
    user_list = progress_map.get(user_id, [])
    prog = next((p for p in user_list if p.get("journeyId") == journey_id), None)
    if not prog:
        # If not started yet, auto-start
        prog = start_journey(user_id, journey_id)
        # re-read
        db = get_db().read()
        user_list = db.get("journeyProgress", {}).get(user_id, [])
        prog = next((p for p in user_list if p.get("journeyId") == journey_id), prog)

    rem = prog.get("graceDaysRemaining", 2)
    used = prog.get("graceDaysUsed", 0)

    if rem > 0:
        prog["graceDaysRemaining"] = rem - 1
        prog["graceDaysUsed"] = used + 1
    else:
        # Compassionate grace extension
        prog["graceDaysUsed"] = used + 1

    history = prog.setdefault("graceHistory", [])
    entry = {
        "id": f"grace-{len(history) + 1}",
        "timestamp": _now_iso(),
        "reason": reason,
        "protectedDay": prog.get("currentDay", 1),
        "scripture": "The Lord's mercies are new every morning; great is your faithfulness. (Lamentations 3:22-23)",
        "streakProtected": True
    }
    history.append(entry)
    prog["status"] = "grace_paused"
    prog["isGraceProtected"] = True

    get_db().write(db)
    return {
        "progress": prog,
        "graceEntry": entry,
        "message": f"Grace Day applied with zero penalty. Day {prog.get('currentDay', 1)} is safely held."
    }

def complete_grace_catchup(user_id: str, journey_id: str) -> Dict[str, Any]:
    """
    Resumes the journey seamlessly after a Grace Day.
    Offers a pressure-free return to the current day without backlog overwhelm.
    """
    db = get_db().read()
    progress_map = db.get("journeyProgress", {})
    user_list = progress_map.get(user_id, [])
    prog = next((p for p in user_list if p.get("journeyId") == journey_id), None)
    if not prog:
        raise ValueError("Journey not found for this user")

    prog["status"] = "active"
    get_db().write(db)
    return {
        "progress": prog,
        "message": f"Welcome back into God's presence! You are resuming Day {prog.get('currentDay', 1)} in peace."
    }

def simulate_missed_day(user_id: str, journey_id: str) -> Dict[str, Any]:
    """
    Simulation utility for testing: simulates missing a devotional day.
    Instead of penalty, a Journey Grace Day steps in automatically to preserve momentum.
    """
    return use_grace_day(user_id, journey_id, reason="Simulated Life Interruption / Auto-Protection")

def get_active_journey(user_id: str) -> Optional[Dict[str, Any]]:
    in_progress = [p for p in list_user_journeys(user_id) if not p.get("completedAt")]
    if not in_progress:
        return None
    prog = in_progress[-1]
    # Backfill default grace fields if needed
    if "graceDaysRemaining" not in prog:
        prog["graceDaysTotal"] = 2
        prog["graceDaysRemaining"] = 2
        prog["graceDaysUsed"] = 0
        prog["isGraceProtected"] = True
        prog["graceHistory"] = []
        prog["status"] = "active"

    journey = get_journey(prog.get("journeyId", ""))
    if not journey:
        return None
    day = get_journey_day(prog.get("journeyId", ""), prog.get("currentDay", 1))
    return {
        "journey": journey,
        "progress": prog,
        "day": day,
        "graceProtection": {
            "total": prog.get("graceDaysTotal", 2),
            "remaining": prog.get("graceDaysRemaining", 2),
            "used": prog.get("graceDaysUsed", 0),
            "status": prog.get("status", "active"),
            "isProtected": True,
            "recentHistory": prog.get("graceHistory", [])[-3:]
        }
    }

def complete_day(user_id: str, journey_id: str) -> Dict[str, Any]:
    db = get_db().read()
    progress_map = db.get("journeyProgress", {})
    user_list = progress_map.get(user_id, [])
    prog = next((p for p in user_list if p.get("journeyId") == journey_id), None)
    if not prog:
        raise ValueError("Journey not started for this user")
        
    journey = get_journey(journey_id)
    if not journey:
        raise ValueError("Journey not found")
        
    curr = prog.get("currentDay", 1)
    completed = prog.setdefault("completedDays", [])
    if curr not in completed:
        completed.append(curr)
        
    if curr >= journey.get("totalDays", 5):
        prog["completedAt"] = _now_iso()
    else:
        prog["currentDay"] = curr + 1
        
    get_db().write(db)
    return prog

def get_recommended_journey(user_id: str) -> Dict[str, Any]:
    journeys = list_journeys()
    if not journeys:
        return {
            "journey": {
                "id": "peace-in-anxiety",
                "title": "Peace in the Storm",
                "description": "5-day devotional anchor for anxiety and work stress.",
                "category": "Peace",
                "totalDays": 5,
                "recommendedMoods": ["peaceful", "seeking"]
            },
            "reason": "Popular foundation track",
            "personalized": False
        }
        
    user_progress = list_user_journeys(user_id)
    started_ids = {p.get("journeyId") for p in user_progress}
    unstarted = [j for j in journeys if j.get("id") not in started_ids]
    target = unstarted[0] if unstarted else journeys[0]
    
    return {
        "journey": target,
        "reason": f"Matches spiritual growth path in {target.get('category', 'Faith')}",
        "personalized": True
    }
