import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..config import DATA_DIR
from ..db import get_db

LIBRARY_PATH = DATA_DIR / "library.json"

def _load_catalog() -> List[Dict[str, Any]]:
    if not LIBRARY_PATH.exists():
        return []
    try:
        with open(LIBRARY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("books", [])
    except Exception:
        return []

def list_library(device_id: str, tier: str = "free") -> List[Dict[str, Any]]:
    books = _load_catalog()
    db = get_db().read()
    progress_map = db.get("libraryProgress", {})
    user_list = progress_map.get(device_id, [])

    result = []
    for b in books:
        entry = next((p for p in user_list if p.get("bookId") == b.get("id")), None)
        is_premium = b.get("isPremium", False)
        locked = is_premium and tier != "premium"
        result.append({
            **b,
            "locked": locked,
            "progressPercent": entry.get("progressPercent", 0) if entry else 0,
            "bookmarked": entry.get("bookmarked", False) if entry else False,
        })
    return result

def toggle_bookmark(device_id: str, book_id: str) -> Dict[str, Any]:
    db = get_db().read()
    progress_map = db.setdefault("libraryProgress", {})
    user_list = progress_map.setdefault(device_id, [])

    entry = next((p for p in user_list if p.get("bookId") == book_id), None)
    if not entry:
        entry = {"bookId": book_id, "progressPercent": 0, "bookmarked": True}
        user_list.append(entry)
    else:
        entry["bookmarked"] = not entry.get("bookmarked", False)

    get_db().write(db)
    return entry
