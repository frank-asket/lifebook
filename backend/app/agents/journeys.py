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
        return existing
        
    prog = {
        "journeyId": journey_id,
        "currentDay": 1,
        "completedDays": [],
        "startedAt": _now_iso()
    }
    user_list.append(prog)
    get_db().write(db)
    return prog

def get_active_journey(user_id: str) -> Optional[Dict[str, Any]]:
    in_progress = [p for p in list_user_journeys(user_id) if not p.get("completedAt")]
    if not in_progress:
        return None
    prog = in_progress[-1]
    journey = get_journey(prog.get("journeyId", ""))
    if not journey:
        return None
    day = get_journey_day(prog.get("journeyId", ""), prog.get("currentDay", 1))
    return {
        "journey": journey,
        "progress": prog,
        "day": day
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
