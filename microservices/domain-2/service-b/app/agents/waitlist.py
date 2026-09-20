import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from ..db import get_db

COHORTS_DEF = [
    {
        "id": "cohort-alpha",
        "name": "Founding Disciples (Wave 1)",
        "targetRole": "Core Devotional Seekers",
        "description": "Early access cohort testing 5-minute morning flow and grace days.",
        "capacity": 50,
        "status": "active_onboarding"
    },
    {
        "id": "cohort-beta",
        "name": "Pastors & Ministry Leaders (Wave 2)",
        "targetRole": "Pastors & Teaching Elders",
        "description": "Theological review board and LivingWord pastoral commentary beta.",
        "capacity": 100,
        "status": "accepting_applications"
    },
    {
        "id": "cohort-gamma",
        "name": "Small Group Facilitators (Wave 3)",
        "targetRole": "Group Leaders & Facilitators",
        "description": "Community prayer loops, group streaks, and church sharing.",
        "capacity": 250,
        "status": "waitlist_open"
    },
    {
        "id": "cohort-delta",
        "name": "General Community Waitlist (Wave 4)",
        "targetRole": "General Seekers & Families",
        "description": "Global rollout wave for the public release.",
        "capacity": 1000,
        "status": "waitlist_open"
    }
]

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _assign_cohort(spiritual_role: str) -> str:
    role_lower = (spiritual_role or "").lower()
    if any(k in role_lower for k in ["pastor", "minister", "elder", "theologian"]):
        return "cohort-beta"
    elif any(k in role_lower for k in ["leader", "facilitator", "worship", "small group"]):
        return "cohort-gamma"
    elif any(k in role_lower for k in ["founding", "early", "beta", "first"]):
        return "cohort-alpha"
    return "cohort-delta"

def get_cohort_definitions() -> List[Dict[str, Any]]:
    return COHORTS_DEF

def join_waitlist(
    email: str,
    name: Optional[str] = None,
    spiritual_role: Optional[str] = None,
    struggle_feedback: Optional[str] = None,
    referral_code: Optional[str] = None,
    device_id: Optional[str] = None
) -> Dict[str, Any]:
    email_clean = (email or "").strip().lower()
    if not email_clean or "@" not in email_clean:
        raise ValueError("A valid email address is required.")

    db = get_db().read()
    waitlist = db.setdefault("waitlistMembers", [])

    existing = next((m for m in waitlist if m.get("email") == email_clean), None)
    if existing:
        # Update details if provided
        if name and not existing.get("name"):
            existing["name"] = name
        if struggle_feedback and not existing.get("struggleFeedback"):
            existing["struggleFeedback"] = struggle_feedback
            if existing.get("stage") == "registered":
                existing["stage"] = "feedback_submitted"
        get_db().write(db)
        return {
            "member": existing,
            "alreadyRegistered": True,
            "message": "Welcome back! Your spot in the cohort pipeline is confirmed."
        }

    role = (spiritual_role or "Devotional Seeker").strip()
    cohort_id = _assign_cohort(role)
    unique_ref = f"LB-{(name or 'MEMBER')[:2].upper()}-{uuid.uuid4().hex[:4].upper()}"

    initial_stage = "feedback_submitted" if struggle_feedback else "registered"
    priority_score = 100
    if cohort_id == "cohort-beta":
        priority_score += 40
    elif cohort_id == "cohort-gamma":
        priority_score += 25
    if struggle_feedback:
        priority_score += 30
    if referral_code:
        priority_score += 15

    member = {
        "id": str(uuid.uuid4()),
        "email": email_clean,
        "name": (name or "").strip() or "Faithful Disciple",
        "spiritualRole": role,
        "cohortId": cohort_id,
        "referralCode": unique_ref,
        "referredBy": referral_code,
        "stage": initial_stage,  # "registered" | "feedback_submitted" | "vip_invited" | "onboarded"
        "priorityScore": priority_score,
        "struggleFeedback": struggle_feedback,
        "desiredFeatures": [],
        "feedbackNotes": [],
        "deviceId": device_id,
        "referralCount": 0,
        "createdAt": _now_iso(),
        "updatedAt": _now_iso()
    }

    # Increment referrer count if applicable
    if referral_code:
        referrer = next((m for m in waitlist if m.get("referralCode") == referral_code), None)
        if referrer:
            referrer["referralCount"] = referrer.get("referralCount", 0) + 1
            referrer["priorityScore"] = referrer.get("priorityScore", 100) + 20

    waitlist.append(member)
    get_db().write(db)

    cohort = next((c for c in COHORTS_DEF if c["id"] == cohort_id), COHORTS_DEF[-1])
    return {
        "member": member,
        "cohort": cohort,
        "alreadyRegistered": False,
        "message": f"Successfully joined {cohort['name']}! Your priority code is {unique_ref}."
    }

def submit_cohort_feedback(
    member_id_or_email: str,
    struggle_feedback: str,
    desired_features: Optional[List[str]] = None,
    daily_time_available: Optional[str] = None,
    feedback_note: Optional[str] = None
) -> Dict[str, Any]:
    db = get_db().read()
    waitlist = db.get("waitlistMembers", [])
    target = next((
        m for m in waitlist
        if m.get("id") == member_id_or_email or m.get("email") == member_id_or_email.lower().strip()
    ), None)

    if not target:
        raise ValueError("Waitlist member not found.")

    target["struggleFeedback"] = struggle_feedback
    if desired_features:
        target["desiredFeatures"] = list(set(target.get("desiredFeatures", []) + desired_features))
    if daily_time_available:
        target["dailyTimeAvailable"] = daily_time_available
    if feedback_note:
        notes = target.setdefault("feedbackNotes", [])
        notes.append({
            "note": feedback_note,
            "timestamp": _now_iso()
        })

    if target.get("stage") == "registered":
        target["stage"] = "feedback_submitted"
    target["priorityScore"] = target.get("priorityScore", 100) + 35
    target["updatedAt"] = _now_iso()

    get_db().write(db)
    return {
        "success": True,
        "member": target,
        "message": "Thank you for shaping LifeBook! Your feedback prioritized your invitation wave."
    }

def promote_member_stage(member_id: str, new_stage: str, reviewer_note: Optional[str] = None) -> Dict[str, Any]:
    valid_stages = ["registered", "feedback_submitted", "vip_invited", "onboarded"]
    if new_stage not in valid_stages:
        raise ValueError(f"Invalid stage: {new_stage}. Must be one of {valid_stages}")

    db = get_db().read()
    waitlist = db.get("waitlistMembers", [])
    target = next((m for m in waitlist if m.get("id") == member_id), None)
    if not target:
        raise ValueError("Waitlist member not found.")

    target["stage"] = new_stage
    target["stageUpdatedAt"] = _now_iso()
    if reviewer_note:
        target.setdefault("feedbackNotes", []).append({
            "type": "stage_promotion_note",
            "note": reviewer_note,
            "timestamp": _now_iso()
        })
    get_db().write(db)
    return {"success": True, "member": target}

def list_cohorts_summary() -> Dict[str, Any]:
    db = get_db().read()
    members = db.get("waitlistMembers", [])

    cohorts_data = []
    for c in COHORTS_DEF:
        c_members = [m for m in members if m.get("cohortId") == c["id"]]
        stages = {
            "registered": len([m for m in c_members if m.get("stage") == "registered"]),
            "feedback_submitted": len([m for m in c_members if m.get("stage") == "feedback_submitted"]),
            "vip_invited": len([m for m in c_members if m.get("stage") == "vip_invited"]),
            "onboarded": len([m for m in c_members if m.get("stage") == "onboarded"]),
        }
        cohorts_data.append({
            **c,
            "memberCount": len(c_members),
            "stages": stages,
            "occupancyPercent": min(100, int((len(c_members) / c["capacity"]) * 100))
        })

    total_waitlist = len(members)
    feedback_count = len([m for m in members if m.get("stage") != "registered"])
    feedback_rate = int((feedback_count / max(1, total_waitlist)) * 100)

    # Seed demo cohorts if database is fresh
    if total_waitlist == 0:
        _seed_demo_cohort_members()
        return list_cohorts_summary()

    return {
        "cohorts": cohorts_data,
        "totalWaitlist": total_waitlist,
        "feedbackCompletedCount": feedback_count,
        "feedbackLoopRate": f"{feedback_rate}%",
        "vipInvitedCount": len([m for m in members if m.get("stage") == "vip_invited"]),
        "onboardedCount": len([m for m in members if m.get("stage") == "onboarded"])
    }

def list_waitlist_members(cohort_id: Optional[str] = None, stage: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    db = get_db().read()
    members = db.get("waitlistMembers", [])
    if not members:
        _seed_demo_cohort_members()
        db = get_db().read()
        members = db.get("waitlistMembers", [])

    filtered = members
    if cohort_id:
        filtered = [m for m in filtered if m.get("cohortId") == cohort_id]
    if stage:
        filtered = [m for m in filtered if m.get("stage") == stage]

    filtered.sort(key=lambda m: (m.get("priorityScore", 0), m.get("createdAt", "")), reverse=True)
    return filtered[:limit]

def _seed_demo_cohort_members():
    sample_members = [
        {
            "id": "wl-demo-1",
            "email": "pastor.thomas@gracebiblical.org",
            "name": "Pastor Thomas Vance",
            "spiritualRole": "Senior Pastor & Expository Preacher",
            "cohortId": "cohort-beta",
            "referralCode": "LB-PT-1049",
            "referredBy": None,
            "stage": "vip_invited",
            "priorityScore": 175,
            "struggleFeedback": "Congregants struggle with biblical literacy and feel discouraged by legalistic Bible apps that shame them when they miss a day.",
            "desiredFeatures": ["Pastoral LivingWord review", "Journey Grace Days", "Theological audit trail"],
            "dailyTimeAvailable": "5-10 minutes",
            "feedbackNotes": [{"note": "Approved for pastoral beta advisory panel", "timestamp": _now_iso()}],
            "referralCount": 4,
            "createdAt": _now_iso(),
            "updatedAt": _now_iso()
        },
        {
            "id": "wl-demo-2",
            "email": "sarah.lead@citychurch.net",
            "name": "Sarah Jenkins",
            "spiritualRole": "Small Group Facilitator",
            "cohortId": "cohort-gamma",
            "referralCode": "LB-SJ-8821",
            "referredBy": "LB-PT-1049",
            "stage": "feedback_submitted",
            "priorityScore": 155,
            "struggleFeedback": "Maintaining engagement across our 12-person small group when life gets busy mid-week.",
            "desiredFeatures": ["5-Minute Morning Audio", "Sabbath Rest Shields", "Shared Prayer Requests"],
            "dailyTimeAvailable": "5 minutes",
            "feedbackNotes": [],
            "referralCount": 2,
            "createdAt": _now_iso(),
            "updatedAt": _now_iso()
        },
        {
            "id": "wl-demo-3",
            "email": "david.chen@technorm.io",
            "name": "David Chen",
            "spiritualRole": "Devotional Seeker & Software Lead",
            "cohortId": "cohort-alpha",
            "referralCode": "LB-DC-4412",
            "referredBy": None,
            "stage": "onboarded",
            "priorityScore": 140,
            "struggleFeedback": "Morning screen anxiety — opening Slack before Bible. Need a 5-minute sanctuary habit.",
            "desiredFeatures": ["Spiritual Pulse check-ins", "Voice companion", "Offline habit streaks"],
            "dailyTimeAvailable": "5-8 minutes",
            "feedbackNotes": [{"note": "Testing morning notifications", "timestamp": _now_iso()}],
            "referralCount": 1,
            "createdAt": _now_iso(),
            "updatedAt": _now_iso()
        },
        {
            "id": "wl-demo-4",
            "email": "esther.worship@hopemail.org",
            "name": "Esther Moreau",
            "spiritualRole": "Worship Leader & Youth Mentor",
            "cohortId": "cohort-gamma",
            "referralCode": "LB-EM-9102",
            "referredBy": None,
            "stage": "registered",
            "priorityScore": 125,
            "struggleFeedback": None,
            "desiredFeatures": [],
            "feedbackNotes": [],
            "referralCount": 0,
            "createdAt": _now_iso(),
            "updatedAt": _now_iso()
        }
    ]
    db = get_db().read()
    db["waitlistMembers"] = sample_members
    get_db().write(db)
