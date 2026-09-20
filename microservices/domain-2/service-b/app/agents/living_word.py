import json
import uuid
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..config import DATA_DIR
from ..db import get_db

LIVING_WORD_PATH = DATA_DIR / "livingWord.json"

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s)
    return s[:60] or f"teaching-{uuid.uuid4().hex[:6]}"

def _load_base_teachings() -> List[Dict[str, Any]]:
    if not LIVING_WORD_PATH.exists():
        return []
    try:
        with open(LIVING_WORD_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
            # Ensure each base teaching has required CMS fields
            for item in raw:
                item.setdefault("status", "published")
                item.setdefault("theologicalRubric", {
                    "scriptureAccuracy": 5,
                    "christocentricFocus": 5,
                    "pastoralTone": 5,
                    "historicalOrthodoxy": 5,
                    "notes": "Original foundational pastoral series by Pastor Asket."
                })
                item.setdefault("reviewedBy", "Pastor Asket")
                item.setdefault("reviewedAt", "2026-01-01T00:00:00Z")
                item.setdefault("createdAt", "2026-01-01T00:00:00Z")
                item.setdefault("fullBody", item.get("excerpt", "") + "\n\nIn this pastoral teaching, we explore how God's truth transforms our ordinary workdays, quiet meditations, and spiritual rhythms.")
            return raw
    except Exception:
        return []

def _get_all_stored_teachings() -> List[Dict[str, Any]]:
    db = get_db().read()
    cms_list = db.get("livingWordTeachings")
    if cms_list is None:
        # Initialize with base file
        cms_list = _load_base_teachings()
        db["livingWordTeachings"] = cms_list
        get_db().write(db)
    return cms_list

def list_teachings() -> List[Dict[str, Any]]:
    """Returns published teachings for public devotional listeners/readers."""
    all_teachings = _get_all_stored_teachings()
    return [t for t in all_teachings if t.get("status") in ["published", "approved"]]

def get_teaching(slug: str) -> Optional[Dict[str, Any]]:
    teachings = _get_all_stored_teachings()
    return next((t for t in teachings if t.get("slug") == slug), None)

# --------------------------------------------------------------------------
# Pastoral Review CMS Functions (P5 Content Scaling)
# --------------------------------------------------------------------------
def list_cms_teachings(status: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    teachings = _get_all_stored_teachings()
    filtered = teachings
    if status and status != "all":
        filtered = [t for t in filtered if t.get("status") == status]
    if category and category != "all":
        filtered = [t for t in filtered if (t.get("category") or "").lower() == category.lower()]
    return sorted(filtered, key=lambda t: t.get("createdAt", ""), reverse=True)

def create_teaching_draft(data: Dict[str, Any], creator_id: Optional[str] = None) -> Dict[str, Any]:
    title = (data.get("title") or "Untitled Pastoral Reflection").strip()
    slug = data.get("slug") or _slugify(title)
    
    db = get_db().read()
    cms_list = db.setdefault("livingWordTeachings", _load_base_teachings())
    
    # Ensure slug uniqueness
    base_slug = slug
    counter = 1
    while any(t.get("slug") == slug for t in cms_list):
        slug = f"{base_slug}-{counter}"
        counter += 1

    initial_status = data.get("status") or "under_pastoral_review"

    new_teaching = {
        "slug": slug,
        "title": title,
        "teacher": (data.get("teacher") or "Pastor Asket").strip(),
        "teacherRole": (data.get("teacherRole") or "LifeBook pastoral teaching contributor").strip(),
        "category": (data.get("category") or "Faith").strip(),
        "duration": (data.get("duration") or "10 min").strip(),
        "scripture": (data.get("scripture") or "Romans 8:28").strip(),
        "excerpt": (data.get("excerpt") or title).strip(),
        "fullBody": (data.get("fullBody") or data.get("excerpt") or "").strip(),
        "theologicalNotes": (data.get("theologicalNotes") or "").strip(),
        "status": initial_status,  # "draft" | "under_pastoral_review" | "approved" | "published" | "needs_revision"
        "audioUrl": data.get("audioUrl"),
        "videoUrl": data.get("videoUrl"),
        "theologicalRubric": data.get("theologicalRubric") or {
            "scriptureAccuracy": 5,
            "christocentricFocus": 5,
            "pastoralTone": 5,
            "historicalOrthodoxy": 5,
            "notes": "Submitted for pastoral review."
        },
        "reviewedBy": data.get("reviewedBy"),
        "reviewedAt": _now_iso() if initial_status in ["approved", "published"] else None,
        "createdBy": creator_id or "pastor_editorial_board",
        "createdAt": _now_iso(),
        "updatedAt": _now_iso()
    }

    cms_list.insert(0, new_teaching)
    get_db().write(db)
    return {"teaching": new_teaching, "message": f"Teaching “{title}” submitted to Pastoral CMS."}

def update_teaching(slug: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db().read()
    cms_list = db.setdefault("livingWordTeachings", _load_base_teachings())
    target = next((t for t in cms_list if t.get("slug") == slug), None)
    if not target:
        raise ValueError("Teaching not found.")

    allowed_fields = [
        "title", "teacher", "teacherRole", "category", "duration",
        "scripture", "excerpt", "fullBody", "theologicalNotes",
        "audioUrl", "videoUrl", "status"
    ]
    for key in allowed_fields:
        if key in data:
            target[key] = data[key]
    target["updatedAt"] = _now_iso()

    get_db().write(db)
    return {"teaching": target, "message": "Teaching updated successfully."}

def review_pastoral_teaching(
    slug: str,
    reviewer_id: str,
    verdict: str,  # "published" | "approved" | "needs_revision" | "rejected"
    rubric: Optional[Dict[str, Any]] = None,
    pastoral_notes: Optional[str] = None
) -> Dict[str, Any]:
    db = get_db().read()
    cms_list = db.setdefault("livingWordTeachings", _load_base_teachings())
    target = next((t for t in cms_list if t.get("slug") == slug), None)
    if not target:
        raise ValueError("Teaching not found.")

    target["status"] = verdict
    target["reviewedBy"] = reviewer_id or "Pastor Asket"
    target["reviewedAt"] = _now_iso()
    target["updatedAt"] = _now_iso()

    if rubric:
        target["theologicalRubric"] = {
            "scriptureAccuracy": rubric.get("scriptureAccuracy", 5),
            "christocentricFocus": rubric.get("christocentricFocus", 5),
            "pastoralTone": rubric.get("pastoralTone", 5),
            "historicalOrthodoxy": rubric.get("historicalOrthodoxy", 5),
            "notes": pastoral_notes or rubric.get("notes", "Orthodox pastoral audit complete.")
        }
    elif pastoral_notes:
        existing = target.setdefault("theologicalRubric", {})
        existing["notes"] = pastoral_notes

    get_db().write(db)
    return {
        "success": True,
        "status": verdict,
        "teaching": target,
        "message": f"Teaching “{target.get('title')}” reviewed: status changed to {verdict}."
    }

# --------------------------------------------------------------------------
# Public Comments (with Moderation Safety)
# --------------------------------------------------------------------------
def list_comments(slug: str) -> List[Dict[str, Any]]:
    db = get_db().read()
    comments = db.get("livingWordComments", [])
    approved = [
        c for c in comments
        if c.get("teachingSlug") == slug and c.get("moderationStatus") == "approved"
    ]
    approved.sort(key=lambda c: c.get("createdAt", ""), reverse=True)
    return approved

def add_comment(slug: str, user_id: str, text: str, author_name: Optional[str] = None) -> Dict[str, Any]:
    CRISIS_KEYWORDS = ["suicide", "kill myself", "want to die", "end my life", "self harm"]
    EXPLICIT_KEYWORDS = ["hate", "violence", "kill", "attack"]
    
    text_lower = text.lower()
    needs_support = any(k in text_lower for k in CRISIS_KEYWORDS)
    needs_review = any(k in text_lower for k in EXPLICIT_KEYWORDS) or needs_support

    status = "pending" if needs_review else "approved"
    comment = {
        "id": str(uuid.uuid4()),
        "teachingSlug": slug,
        "userId": user_id,
        "authorName": (author_name.strip()[:80] if author_name else None) or "LifeBook member",
        "text": text if status == "approved" else "[Under moderation review]",
        "moderationStatus": status,
        "createdAt": _now_iso()
    }

    db = get_db().read()
    db.setdefault("livingWordComments", []).append(comment)
    get_db().write(db)

    return {
        "comment": comment,
        "needsSupportNote": needs_support,
        "status": status
    }
