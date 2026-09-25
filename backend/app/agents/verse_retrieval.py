import json
import random
from pathlib import Path
from typing import Dict, List
from ..config import DATA_DIR
from ..models.schemas import MoodType, Verse

VERSES_PATH = DATA_DIR / "verses.json"

_recently_served: Dict[str, List[str]] = {}

def _load_corpus() -> List[Dict[str, str]]:
    if not VERSES_PATH.exists():
        # Fallback verses
        return [
            {"mood": "grateful", "text": "O give thanks unto the LORD, for he is good: for his mercy endureth for ever.", "reference": "Psalm 107:1"},
            {"mood": "peaceful", "text": "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.", "reference": "John 14:27"},
            {"mood": "seeking", "text": "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", "reference": "Jeremiah 29:11"},
            {"mood": "doubting", "text": "Lord, I believe; help thou mine unbelief.", "reference": "Mark 9:24"},
            {"mood": "distant", "text": "As the hart panteth after the water brooks, so panteth my soul after thee, O God.", "reference": "Psalm 42:1"},
            {"mood": "convicted", "text": "Create in me a clean heart, O God; and renew a right spirit within me.", "reference": "Psalm 51:10"}
        ]
    try:
        with open(VERSES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("verses", [])
    except Exception:
        return []

def retrieve_verse(device_id: str, mood: MoodType) -> Verse:
    all_verses = _load_corpus()
    candidates = [v for v in all_verses if v.get("mood") == mood]
    if not candidates:
        candidates = all_verses

    recent = _recently_served.get(device_id, [])
    fresh = [v for v in candidates if v.get("reference") not in recent]
    pool = fresh if fresh else candidates

    chosen_dict = random.choice(pool)
    chosen = Verse(
        mood=chosen_dict.get("mood", mood),
        text=chosen_dict.get("text", ""),
        reference=chosen_dict.get("reference", "")
    )

    _recently_served[device_id] = [chosen.reference] + recent[:1]
    return chosen
