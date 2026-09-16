import json
import re
from typing import Dict, Any, Optional
import urllib.request
import urllib.error
from ..config import ANTHROPIC_API_KEY, GEMINI_API_KEY
from ..models.schemas import MoodType, Verse

SYSTEM_PROMPT = """You are a warm, theologically careful Christian devotional guide inside an app called LifeBook.
You will be given a mood and a Bible verse that has already been selected — do not change it or cite a different one.
The mood will be one of: grateful, peaceful, seeking, doubting, distant, convicted.
Rules:
- Keep language doctrinally mainstream across denominations. No fringe theology, no prosperity-gospel framing.
- Treat doubting, distant, and convicted as normal, well-documented seasons of the Christian life.
- Never diagnose a mental health condition.
- Respond ONLY with a single JSON object, no preamble, no markdown code fences.
Keys: whyThisVerse (one sentence), meditation (2-3 sentences), reflectionQuestion (one sentence), prayer (2-3 sentences), actionStep (one short practical sentence)."""

MOOD_NOUN = {
    "grateful": "gratitude",
    "peaceful": "peace",
    "seeking": "seeking guidance",
    "doubting": "wrestling with doubt",
    "distant": "distance from God",
    "convicted": "conviction and renewal",
}

MOOD_STATE = {
    "grateful": "feeling grateful",
    "peaceful": "feeling peaceful",
    "seeking": "in a season of seeking",
    "doubting": "wrestling with honest questions",
    "distant": "feeling distant from God",
    "convicted": "feeling convicted toward grace",
}

def dev_fallback(mood: MoodType, verse: Verse) -> Dict[str, Any]:
    noun = MOOD_NOUN.get(mood, "this moment")
    state = MOOD_STATE.get(mood, "in this season")
    return {
        "whyThisVerse": f"This verse speaks directly to {noun} — it is one of the timeless passages LifeBook returns to for grounding.",
        "meditation": f'Sit for a quiet moment with "{verse.text}". Let the words settle rather than rushing past them. Notice what in your heart left you {state}.',
        "reflectionQuestion": f"Where recently were you {state}, and what would it look like to bring that honestly before God?",
        "prayer": f"Lord, thank You for meeting me in how I actually feel today, not how I think I should feel. Help me carry {verse.reference} with me throughout this day. Amen.",
        "actionStep": "Send a brief message to someone you care about or write down one quiet prayer of release.",
        "mode": "dev-fallback"
    }

async def generate_content(mood: MoodType, verse: Verse, note: Optional[str] = None) -> Dict[str, Any]:
    if ANTHROPIC_API_KEY:
        try:
            req_data = {
                "model": "claude-sonnet-4-6",
                "max_tokens": 700,
                "system": SYSTEM_PROMPT,
                "messages": [
                    {
                        "role": "user",
                        "content": f'Mood: {mood}{f"\nUser note: {note}" if note else ""}\nVerse: "{verse.text}" ({verse.reference})\n\nWrite today\'s content.'
                    }
                ]
            }
            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                data=json.dumps(req_data).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                text = "".join(b.get("text", "") for b in result.get("content", []))
                cleaned = re.sub(r"```json|```", "", text).strip()
                match = re.search(r"\{[\s\S]*\}", cleaned)
                if match:
                    parsed = json.loads(match.group(0))
                    parsed["mode"] = "live"
                    return parsed
        except Exception:
            pass

    return dev_fallback(mood, verse)
