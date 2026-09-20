from datetime import datetime, timezone
from typing import Dict, Any
from ..db import get_db

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def get_subscription(device_id: str) -> Dict[str, Any]:
    db = get_db().read()
    subs = db.get("subscriptions", {})
    return subs.get(device_id, {
        "deviceId": device_id,
        "tier": "free",
        "updatedAt": _now_iso()
    })

def upgrade_subscription(device_id: str, billing_cycle: str = "monthly") -> Dict[str, Any]:
    db = get_db().read()
    subs = db.setdefault("subscriptions", {})
    sub = {
        "deviceId": device_id,
        "tier": "premium",
        "billingCycle": billing_cycle,
        "updatedAt": _now_iso()
    }
    subs[device_id] = sub
    get_db().write(db)
    return sub
