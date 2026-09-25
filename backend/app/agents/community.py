import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..db import get_db
from ..models.schemas import Group, PrayerRequest, Discussion, DiscussionReply

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def moderate_text(text: str) -> Dict[str, Any]:
    CRISIS_KEYWORDS = ["suicide", "kill myself", "want to die", "end my life", "self harm"]
    EXPLICIT_KEYWORDS = ["hate", "violence", "kill", "attack"]
    
    haystack = text.lower()
    needs_support = any(k in haystack for k in CRISIS_KEYWORDS)
    needs_review = any(k in haystack for k in EXPLICIT_KEYWORDS) or needs_support
    
    return {
        "status": "pending" if needs_review else "approved",
        "needsSupportNote": needs_support
    }

def list_groups() -> List[Dict[str, Any]]:
    db = get_db().read()
    groups = db.get("groups", [])
    members = db.get("groupMembers", [])
    
    result = []
    for g in groups:
        count = sum(1 for m in members if m.get("groupId") == g.get("id"))
        base_count = g.get("memberCount", 0)
        result.append({
            **g,
            "memberCount": max(base_count, count)
        })
    return result

def join_group(group_id: str, device_id: str) -> Dict[str, Any]:
    db = get_db().read()
    group = next((g for g in db.get("groups", []) if g.get("id") == group_id), None)
    if not group:
        raise ValueError("Group not found")
        
    members = db.get("groupMembers", [])
    already = any(m.get("groupId") == group_id and m.get("deviceId") == device_id for m in members)
    if not already:
        members.append({
            "groupId": group_id,
            "deviceId": device_id,
            "joinedAt": _now_iso()
        })
        db["groupMembers"] = members
        get_db().write(db)
        
    total_count = sum(1 for m in members if m.get("groupId") == group_id)
    return {
        "joined": True,
        "memberCount": max(group.get("memberCount", 0), total_count)
    }

def list_prayer_requests() -> List[Dict[str, Any]]:
    db = get_db().read()
    requests = [r for r in db.get("prayerRequests", []) if r.get("moderationStatus") == "approved"]
    requests.sort(key=lambda r: r.get("createdAt", ""), reverse=True)
    return requests

def submit_prayer_request(device_id: str, text: str, category: Optional[str] = "General") -> Dict[str, Any]:
    mod = moderate_text(text)
    req_id = str(uuid.uuid4())
    request_obj = {
        "id": req_id,
        "deviceId": device_id,
        "authorName": "A LifeBook user",
        "text": text,
        "category": category,
        "prayerCount": 0,
        "moderationStatus": mod["status"],
        "createdAt": _now_iso()
    }
    
    db = get_db().read()
    db.setdefault("prayerRequests", []).append(request_obj)
    get_db().write(db)
    
    return {
        "request": request_obj,
        "needsSupportNote": mod["needsSupportNote"]
    }

def pray_for(request_id: str) -> Dict[str, Any]:
    db = get_db().read()
    req = next((r for r in db.get("prayerRequests", []) if r.get("id") == request_id), None)
    if not req:
        raise ValueError("Prayer request not found")
    req["prayerCount"] = req.get("prayerCount", 0) + 1
    get_db().write(db)
    return req

def list_discussions() -> List[Dict[str, Any]]:
    db = get_db().read()
    discussions = [d for d in db.get("discussions", []) if d.get("moderationStatus") == "approved"]
    discussions.sort(key=lambda d: d.get("createdAt", ""), reverse=True)
    return discussions

def create_discussion(device_id: str, title: str, body: str, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    mod = moderate_text(f"{title} {body}")
    disc_id = str(uuid.uuid4())
    disc_obj = {
        "id": disc_id,
        "deviceId": device_id,
        "authorName": "Believer",
        "title": title,
        "body": body,
        "tags": tags or [],
        "replyCount": 0,
        "likeCount": 0,
        "moderationStatus": mod["status"],
        "createdAt": _now_iso()
    }
    
    db = get_db().read()
    db.setdefault("discussions", []).append(disc_obj)
    get_db().write(db)
    
    return {
        "discussion": disc_obj,
        "needsSupportNote": mod["needsSupportNote"]
    }

def like_discussion(discussion_id: str) -> Dict[str, Any]:
    db = get_db().read()
    disc = next((d for d in db.get("discussions", []) if d.get("id") == discussion_id), None)
    if not disc:
        raise ValueError("Discussion not found")
    disc["likeCount"] = disc.get("likeCount", 0) + 1
    get_db().write(db)
    return disc

def list_replies(discussion_id: str) -> List[Dict[str, Any]]:
    db = get_db().read()
    replies = [r for r in db.get("discussionReplies", []) if r.get("discussionId") == discussion_id]
    replies.sort(key=lambda r: r.get("createdAt", ""))
    return replies

def reply_to_discussion(discussion_id: str, device_id: str, text: str) -> Dict[str, Any]:
    db = get_db().read()
    disc = next((d for d in db.get("discussions", []) if d.get("id") == discussion_id), None)
    if not disc:
        raise ValueError("Discussion not found")
        
    reply_id = str(uuid.uuid4())
    reply_obj = {
        "id": reply_id,
        "discussionId": discussion_id,
        "deviceId": device_id,
        "authorName": "Believer",
        "text": text,
        "createdAt": _now_iso()
    }
    
    disc["replyCount"] = disc.get("replyCount", 0) + 1
    db.setdefault("discussionReplies", []).append(reply_obj)
    get_db().write(db)
    return reply_obj
