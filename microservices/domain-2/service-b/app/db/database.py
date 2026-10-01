import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any
from ..config import DATA_DIR, LIFEBOOK_STORAGE_BACKEND, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

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
        "cloudSyncSnapshots": {},
        "analyticsEvents": [],
        "privatePrayers": [],
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


class SupabaseDatabase:
    """Compatibility store for the API's existing whole-state document model."""

    def __init__(self):
        from ..supabase import get_supabase_admin

        self.table = get_supabase_admin().table("lifebook_app_state")

    def read(self) -> Dict[str, Any]:
        response = self.table.select("payload").eq("state_key", "default").maybe_single().execute()
        if not response.data:
            raise RuntimeError(
                "Supabase app state is empty; run scripts/migrate_json_to_supabase.py --apply "
                "before setting LIFEBOOK_STORAGE_BACKEND=supabase"
            )
        state = response.data.get("payload")
        if not isinstance(state, dict):
            raise RuntimeError("Supabase app state row contains an invalid payload")
        base = empty_db()
        base.update(state)
        return base

    def write(self, data: Dict[str, Any]):
        self.table.upsert(
            {
                "state_key": "default",
                "payload": data,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="state_key",
        ).execute()


_instance: JSONDatabase | SupabaseDatabase | None = None

def get_db() -> JSONDatabase | SupabaseDatabase:
    global _instance
    if _instance is None:
        if LIFEBOOK_STORAGE_BACKEND == "supabase":
            if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
                raise RuntimeError(
                    "LIFEBOOK_STORAGE_BACKEND=supabase requires SUPABASE_URL and "
                    "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)"
                )
            _instance = SupabaseDatabase()
        else:
            _instance = JSONDatabase(DB_FILE)
    return _instance
