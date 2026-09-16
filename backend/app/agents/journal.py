import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from ..db import get_db
from ..models.schemas import JournalEntry, FavoriteVerse

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def add_journal_entry(device_id: str, text: str, related_content_id: Optional[str] = None) -> Dict[str, Any]:
    entry = {
        "id": str(uuid.uuid4()),
        "deviceId": device_id,
        "text": text,
        "relatedContentId": related_content_id,
        "createdAt": _now_iso()
    }
    db = get_db().read()
    db.setdefault("journalEntries", []).append(entry)
    get_db().write(db)
    return entry

def list_journal_entries(device_id: str) -> List[Dict[str, Any]]:
    db = get_db().read()
    entries = [e for e in db.get("journalEntries", []) if e.get("deviceId") == device_id]
    entries.sort(key=lambda e: e.get("createdAt", ""), reverse=True)
    return entries

def add_favorite(device_id: str, content_id: str, verse_text: str, verse_reference: str) -> Dict[str, Any]:
    db = get_db().read()
    favorites = db.setdefault("favorites", [])
    existing = next((f for f in favorites if f.get("deviceId") == device_id and f.get("contentId") == content_id), None)
    if existing:
        return existing
        
    fav = {
        "id": str(uuid.uuid4()),
        "deviceId": device_id,
        "contentId": content_id,
        "verseText": verse_text,
        "verseReference": verse_reference,
        "createdAt": _now_iso()
    }
    favorites.append(fav)
    get_db().write(db)
    return fav

def list_favorites(device_id: str) -> List[Dict[str, Any]]:
    db = get_db().read()
    favs = [f for f in db.get("favorites", []) if f.get("deviceId") == device_id]
    favs.sort(key=lambda f: f.get("createdAt", ""), reverse=True)
    return favs

def mood_history(device_id: str, days: int = 30) -> List[Dict[str, Any]]:
    db = get_db().read()
    checkins = [c for c in db.get("checkins", []) if c.get("deviceId") == device_id]
    
    by_date: Dict[str, str] = {}
    for c in checkins:
        dt_str = c.get("createdAt", "")[:10]
        if dt_str:
            by_date[dt_str] = c.get("mood")
            
    now = datetime.now(timezone.utc)
    result = []
    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        result.append({
            "date": day_str,
            "mood": by_date.get(day_str)
        })
    return result
