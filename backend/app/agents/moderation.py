import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from ..db import get_db

CRISIS_KEYWORDS = [
    "kill myself", "suicide", "end my life", "want to die",
    "self harm", "cutting myself", "no reason to live", "better off dead", "hurt myself"
]

ABUSE_KEYWORDS = [
    "kill you", "hate speech", "scam", "crypto", "casino", "attack"
]

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def classify_safety(input_text: str) -> Dict[str, Any]:
    normalized = input_text.lower()
    
    found_crisis = [kw for kw in CRISIS_KEYWORDS if kw in normalized]
    if found_crisis:
        return {
            "isSafe": False,
            "classification": "crisis_escalation",
            "flaggedWords": found_crisis,
            "reason": "Immediate crisis or self-harm ideation detected.",
            "emergencyCareNoticeNeeded": True
        }

    found_abuse = [kw for kw in ABUSE_KEYWORDS if kw in normalized]
    if found_abuse:
        return {
            "isSafe": False,
            "classification": "flagged_for_review",
            "flaggedWords": found_abuse,
            "reason": "Violates community standards or safety boundaries.",
            "emergencyCareNoticeNeeded": False
        }

    return {
        "isSafe": True,
        "classification": "safe",
        "flaggedWords": [],
        "emergencyCareNoticeNeeded": False
    }

def moderate_post(content: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    safety = classify_safety(content)
    if not safety["isSafe"]:
        return {
            "allowed": False,
            "status": "pending" if safety["classification"] == "flagged_for_review" else "rejected",
            "reason": safety.get("reason"),
            "emergencyCareNoticeNeeded": safety["emergencyCareNoticeNeeded"]
        }
    return {
        "allowed": True,
        "status": "approved",
        "emergencyCareNoticeNeeded": False
    }

def list_moderation_reviews() -> List[Dict[str, Any]]:
    db = get_db().read()
    reviews = db.get("moderationReviews", [])
    reviews.sort(key=lambda r: r.get("createdAt", ""), reverse=True)
    return reviews[:50]

def resolve_moderation_review(review_id: str, reviewer_id: str, status: str, resolution_notes: Optional[str] = None) -> Dict[str, Any]:
    db = get_db().read()
    reviews = db.get("moderationReviews", [])
    review = next((r for r in reviews if r.get("id") == review_id), None)
    if not review:
        # If not present, create record
        review = {
            "id": review_id,
            "status": status,
            "reviewerId": reviewer_id,
            "reviewedAt": _now_iso(),
            "resolutionNotes": resolution_notes
        }
        reviews.append(review)
    else:
        review["status"] = status
        review["reviewerId"] = reviewer_id
        review["reviewedAt"] = _now_iso()
        review["resolutionNotes"] = resolution_notes

    db["moderationReviews"] = reviews
    get_db().write(db)
    return {"success": True, "status": status}
