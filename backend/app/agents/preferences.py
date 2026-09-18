from typing import Dict, Any, Optional
from ..db import get_db

def save_preferences(device_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db().read()
    prefs = db.setdefault("preferences", {})
    existing = prefs.get(device_id, {"deviceId": device_id})
    merged = {**existing, **updates, "deviceId": device_id}
    prefs[device_id] = merged
    get_db().write(db)
    return merged

def get_preferences(device_id: str) -> Optional[Dict[str, Any]]:
    db = get_db().read()
    prefs = db.get("preferences", {})
    return prefs.get(device_id, None)
