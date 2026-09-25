import json
import os
import threading
from pathlib import Path
from typing import Dict, Any, List
from ..config import DATA_DIR

DB_FILE = DATA_DIR / "db.json"
_lock = threading.RLock()

def empty_db() -> Dict[str, Any]:
    return {
        "checkins": [],
        "content": [],
        "streaks": {},
        "flags": [],
        "groups": [],
        "groupMembers": [],
        "prayerRequests": [],
        "discussions": [],
        "discussionReplies": [],
        "libraryProgress": {},
        "subscriptions": {},
        "journalEntries": [],
        "favorites": [],
        "preferences": {},
        "pushTokens": {},
        "journeyProgress": {},
        "livingWordComments": [],
        "playlists": [],
        "playlistItems": [],
        "waitlistMembers": [],
    }

class JSONDatabase:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.data_dir = db_path.parent
        self._ensure_dir()
        self._init_data()

    def _ensure_dir(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _init_data(self):
        with _lock:
            current = self.read()
            # Seed groups if empty
            if not current.get("groups"):
                groups_file = self.data_dir / "groups.json"
                if groups_file.exists():
                    try:
                        with open(groups_file, "r", encoding="utf-8") as f:
                            raw = json.load(f)
                            current["groups"] = raw.get("groups", [])
                    except Exception:
                        pass
                if not current.get("groups"):
                    current["groups"] = [
                        {
                            "id": "morning-prayer",
                            "name": "Morning Watchers",
                            "description": "Daily 6:00 AM encouragement and accountability in Scripture reading.",
                            "meetingFrequency": "Daily 6:00 AM",
                            "memberCount": 42
                        },
                        {
                            "id": "peace-seekers",
                            "name": "Overcoming Anxiety",
                            "description": "Walking together through seasons of transition, stress, and work pressure.",
                            "meetingFrequency": "Weekly Tuesdays",
                            "memberCount": 89
                        },
                        {
                            "id": "scripture-deep-dive",
                            "name": "Psalms & Wisdom",
                            "description": "Verse-by-verse slow meditation and journaling through the poetic books.",
                            "meetingFrequency": "Bi-weekly Thursdays",
                            "memberCount": 63
                        }
                    ]
                self.write(current)

    def read(self) -> Dict[str, Any]:
        with _lock:
            if not self.db_path.exists():
                return empty_db()
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    base = empty_db()
                    base.update(data)
                    return base
            except Exception:
                return empty_db()

    def write(self, data: Dict[str, Any]):
        with _lock:
            self._ensure_dir()
            temp_path = self.db_path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            temp_path.replace(self.db_path)

_instance: JSONDatabase = None

def get_db() -> JSONDatabase:
    global _instance
    if _instance is None:
        _instance = JSONDatabase(DB_FILE)
    return _instance
