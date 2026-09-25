import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from ..config import ANTHROPIC_API_KEY, GEMINI_API_KEY

def fallback_answer(question: str) -> Dict[str, Any]:
    q_lower = question.lower()
    if "trinity" in q_lower:
        return {
            "title": "The Father, Son, and Holy Spirit",
            "answer": "Christians believe there is one God who eternally exists as three distinct persons: the Father, the Son, and the Holy Spirit. This is a sacred mystery we receive with humility and worship.",
            "references": ["Matthew 28:19", "2 Corinthians 13:14"],
            "mode": "dev-fallback"
        }
    if "grace" in q_lower or "salvation" in q_lower:
        return {
            "title": "Grace by Faith",
            "answer": "Grace is the unearned, transforming favor of God given to us through Christ. We are saved not by our own works or striving, but by His boundless love.",
            "references": ["Ephesians 2:8-9", "Romans 5:1-2"],
            "mode": "dev-fallback"
        }
    if "anxiety" in q_lower or "fear" in q_lower or "peace" in q_lower:
        return {
            "title": "Peace That Surpasses Understanding",
            "answer": "Scripture invites us to bring our burdens and anxieties directly to God in honest prayer. Christ promises His deep, lasting peace in exchange for our weariness.",
            "references": ["Philippians 4:6-7", "John 14:27", "1 Peter 5:7"],
            "mode": "dev-fallback"
        }
    return {
        "title": "A Place to Begin",
        "answer": "Thank you for bringing your heart's question honestly. Scripture invites us to seek wisdom from God, stay curious, and make room for quiet prayer as the Holy Spirit guides.",
        "references": ["James 1:5", "Proverbs 3:5-6"],
        "mode": "dev-fallback"
    }

async def answer_voice_question(question: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    if ANTHROPIC_API_KEY:
        try:
            req_data = {
                "model": "claude-sonnet-4-6",
                "max_tokens": 500,
                "system": (
                    "You are LifeBook Voice, a theologically careful Christian guide. "
                    "Answer briefly and warmly, cite relevant Bible references, acknowledge denominational differences when needed, "
                    "never claim to replace a pastor or clinical counselor, and return ONLY a JSON object with keys: title, answer, references."
                ),
                "messages": [{"role": "user", "content": question}]
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
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = "".join(b.get("text", "") for b in data.get("content", [])).strip()
                cleaned = re.sub(r"```json|```", "", text).strip()
                match = re.search(r"\{[\s\S]*\}", cleaned)
                if match:
                    parsed = json.loads(match.group(0))
                    parsed["mode"] = "live"
                    return parsed
        except Exception:
            pass

    return fallback_answer(question)
