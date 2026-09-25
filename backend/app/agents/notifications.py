import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from ..db import get_db

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def register_push_token(user_id: str, token: str, platform: str = "unknown") -> Dict[str, Any]:
    db = get_db().read()
    push_tokens = db.setdefault("pushTokens", {})
    record = {
        "userId": user_id,
        "token": token,
        "platform": platform,
        "updatedAt": _now_iso()
    }
    push_tokens[user_id] = record
    get_db().write(db)
    return record

def get_push_token(user_id: str) -> Optional[Dict[str, Any]]:
    db = get_db().read()
    return db.get("pushTokens", {}).get(user_id, None)

async def send_push_notification(user_id: str, title: str, body: str) -> Dict[str, Any]:
    record = get_push_token(user_id)
    if not record:
        return {"sent": False, "reason": "No push token registered for this user yet"}
    
    token = record.get("token", "")
    if not token.startswith("ExponentPushToken"):
        return {
            "sent": False,
            "reason": f"Token is a mock or dev-fallback token ({token[:16]}...) — logged safely without network dispatch"
        }

    try:
        payload = json.dumps({"to": token, "title": title, "body": body, "sound": "default"}).encode("utf-8")
        req = urllib.request.Request(
            EXPO_PUSH_URL,
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            ticket = data.get("data", {})
            if ticket.get("status") == "error":
                return {"sent": False, "reason": ticket.get("message", "Expo push service returned an error")}
            return {"sent": True, "ticketId": ticket.get("id")}
    except Exception as e:
        return {"sent": False, "reason": str(e)}
