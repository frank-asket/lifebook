import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from ..db.database import get_db
from ..models.schemas import MoodType, Verse
from .content_generation import dev_fallback, generate_content

CORPUS_PATH = Path(__file__).resolve().parents[2] / "data" / "verses.json"
CRISIS_PATTERNS = (
    r"\b(?:suicid(?:e|al)|kill myself|end my life|want to die|better off dead)\b",
    r"\b(?:hurt|harm|cut) myself\b",
    r"\b(?:i(?:'m| am) going to|i will) (?:kill|hurt|harm) myself\b",
)
THEME_RULES: Tuple[Tuple[str, MoodType, Tuple[str, ...]], ...] = (
    ("anxiety", "peaceful", ("anxious", "anxiety", "worry", "worried", "stress", "fear", "afraid")),
    ("grief", "distant", ("grief", "grieving", "loss", "died", "death", "mourning")),
    ("guidance", "seeking", ("decision", "choose", "choice", "work", "job", "future", "direction")),
    ("doubt", "doubting", ("doubt", "doubting", "question", "uncertain", "believe")),
    ("gratitude", "grateful", ("grateful", "gratitude", "thankful", "thank you")),
    ("renewal", "convicted", ("guilt", "forgive", "forgiveness", "regret", "repent", "wrong")),
)
CRISIS_SUPPORT = (
    "Your safety matters. If you may be in immediate danger, call your local emergency number now. "
    "In the US or Canada, call or text 988. Please reach out to someone you trust and stay with them. "
    "LifeBook is not an emergency or crisis service."
)
BIBLE_BOOKS = "|".join((
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    r"1\s+Samuel", r"2\s+Samuel", r"1\s+Kings", r"2\s+Kings", r"1\s+Chronicles", r"2\s+Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms?", "Proverbs", "Ecclesiastes", "Song of Solomon", "Song of Songs",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    r"1\s+Corinthians", r"2\s+Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
    r"1\s+Thessalonians", r"2\s+Thessalonians", r"1\s+Timothy", r"2\s+Timothy", "Titus", "Philemon",
    "Hebrews", "James", r"1\s+Peter", r"2\s+Peter", r"1\s+John", r"2\s+John", r"3\s+John", "Jude", "Revelation",
))
REFERENCE_PATTERN = re.compile(
    rf"\b(?:{BIBLE_BOOKS})\s+\d+(?::\d+(?:[-–]\d+)?)?\b",
    re.IGNORECASE,
)


def _load_corpus() -> List[Dict[str, str]]:
    try:
        with CORPUS_PATH.open("r", encoding="utf-8") as corpus_file:
            payload = json.load(corpus_file)
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("The approved Scripture corpus could not be loaded") from exc
    verses = payload.get("verses", [])
    if not isinstance(verses, list):
        raise RuntimeError("The approved Scripture corpus has an invalid format")
    return [
        verse for verse in verses
        if isinstance(verse, dict)
        and isinstance(verse.get("text"), str)
        and verse.get("text", "").strip()
        and isinstance(verse.get("reference"), str)
        and verse.get("reference", "").strip()
    ]


def _is_crisis(text: str) -> bool:
    normalized = re.sub(r"\s+", " ", text.lower().replace("’", "'"))
    return any(re.search(pattern, normalized) for pattern in CRISIS_PATTERNS)


def _themes_and_mood(text: str) -> Tuple[List[str], MoodType]:
    normalized = text.lower()
    matches = [
        (theme, mood)
        for theme, mood, keywords in THEME_RULES
        if any(keyword in normalized for keyword in keywords)
    ]
    if not matches:
        return ["reflection"], "seeking"
    return [theme for theme, _ in matches], matches[0][1]


def _choose_verse(mood: MoodType) -> Verse:
    corpus = _load_corpus()
    candidates = [verse for verse in corpus if verse.get("mood") == mood]
    if not candidates:
        candidates = corpus
    if not candidates:
        raise RuntimeError("No approved Scripture passages are available")
    selected = candidates[0]
    return Verse(mood=mood, text=selected["text"], reference=selected["reference"])


def _has_unapproved_reference(generated: Dict[str, Any], approved_references: set[str]) -> bool:
    for key in ("whyThisVerse", "meditation", "reflectionQuestion", "prayer", "actionStep"):
        value = generated.get(key)
        if not isinstance(value, str):
            continue
        for reference in REFERENCE_PATTERN.findall(value):
            if reference.casefold().replace("–", "-") not in approved_references:
                return True
    return False


async def create_prayer_reflection(user_id: str, text: str, save_to_history: bool) -> Dict[str, Any]:
    clean_text = text.strip()
    if len(clean_text) < 10:
        raise ValueError("Please write a little more so we can shape a reflection around it.")

    record_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    if _is_crisis(clean_text):
        result = {
            "id": record_id,
            "themes": [],
            "passage": None,
            "meditation": None,
            "reflectionQuestion": None,
            "guidedPrayer": None,
            "safetyStatus": "crisis_escalation",
            "supportMessage": CRISIS_SUPPORT,
            "saved": save_to_history,
            "createdAt": created_at,
        }
    else:
        themes, mood = _themes_and_mood(clean_text)
        verse = _choose_verse(mood)
        generated = await generate_content(mood, verse, note=None)
        approved_references = {
            item["reference"].casefold().replace("–", "-")
            for item in _load_corpus()
        }
        if _has_unapproved_reference(generated, approved_references):
            generated = dev_fallback(mood, verse)
        result = {
            "id": record_id,
            "themes": themes,
            "passage": {"reference": verse.reference, "text": verse.text, "translation": "KJV"},
            "meditation": generated.get("meditation", ""),
            "reflectionQuestion": generated.get("reflectionQuestion", ""),
            "guidedPrayer": generated.get("prayer", ""),
            "safetyStatus": "distress_detected" if any(word in clean_text.lower() for word in ("hopeless", "overwhelmed", "can't go on", "cannot go on")) else "safe",
            "supportMessage": None,
            "saved": save_to_history,
            "createdAt": created_at,
        }

    if save_to_history:
        database = get_db()
        state = database.read()
        state.setdefault("privatePrayers", []).append({"userId": user_id, "text": clean_text, **result})
        database.write(state)

    return result


def list_private_prayers(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    state = get_db().read()
    records = [
        {key: value for key, value in item.items() if key != "userId"}
        for item in state.get("privatePrayers", [])
        if item.get("userId") == user_id
    ]
    return sorted(records, key=lambda item: item.get("createdAt", ""), reverse=True)[:limit]


def delete_private_prayer(user_id: str, record_id: str) -> bool:
    database = get_db()
    state = database.read()
    records = state.get("privatePrayers", [])
    updated = [
        item for item in records
        if not (item.get("id") == record_id and item.get("userId") == user_id)
    ]
    if len(updated) == len(records):
        return False
    state["privatePrayers"] = updated
    database.write(state)
    return True