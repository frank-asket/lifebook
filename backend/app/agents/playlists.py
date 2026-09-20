import uuid
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..db import get_db

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _calc_duration(items: List[Dict[str, Any]]) -> str:
    total_min = 0
    for item in items:
        dur_str = item.get("duration", "0 min")
        match = re.search(r'(\d+)', dur_str)
        if match:
            total_min += int(match.group(1))
    if total_min < 60:
        return f"{total_min} min"
    hrs = total_min // 60
    mins = total_min % 60
    return f"{hrs} hr {mins} min" if mins > 0 else f"{hrs} hr"

def get_default_playlists(user_id: str) -> List[Dict[str, Any]]:
    now = _now_iso()
    return [
        {
            "playlist": {
                "id": f"default_morning_{user_id}",
                "userId": user_id,
                "title": "Morning Stillness & Foundation",
                "description": "Short, uplifting theological expositions for daily sunrise devotional rhythms.",
                "icon": "🌅",
                "color": "from-[#5D4E7B] to-[#3B2D54]",
                "isDefault": True,
                "itemCount": 2,
                "totalDuration": "25 min",
                "createdAt": now,
                "updatedAt": now,
            },
            "items": [
                {
                    "id": f"pli_def_1_{user_id}",
                    "playlistId": f"default_morning_{user_id}",
                    "teachingSlug": "grace-in-trials",
                    "teachingTitle": "Grace in Trials: Finding Still Waters",
                    "teacher": "Pastor Asket",
                    "duration": "14 min",
                    "category": "Grace",
                    "audioUrl": "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__integers.mp3",
                    "portrait": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
                    "position": 0,
                    "addedAt": now,
                },
                {
                    "id": f"pli_def_2_{user_id}",
                    "playlistId": f"default_morning_{user_id}",
                    "teachingSlug": "unshakable-peace",
                    "teachingTitle": "Unshakable Peace: Christ in the Tempest",
                    "teacher": "Dr. Miriam Thorne",
                    "duration": "11 min",
                    "category": "Peace",
                    "audioUrl": "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverending_Story.mp3",
                    "portrait": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
                    "position": 1,
                    "addedAt": now,
                },
            ],
        },
        {
            "playlist": {
                "id": f"default_evening_{user_id}",
                "userId": user_id,
                "title": "Evening Examen & Rest",
                "description": "Contemplative, peaceful reflections to cast anxiety upon Christ before sleep.",
                "icon": "🌙",
                "color": "from-[#3B2D54] to-[#1A162B]",
                "isDefault": True,
                "itemCount": 0,
                "totalDuration": "0 min",
                "createdAt": now,
                "updatedAt": now,
            },
            "items": [],
        },
    ]

def list_playlists(user_id: str) -> List[Dict[str, Any]]:
    db = get_db().read()
    playlists = db.setdefault("playlists", [])
    playlist_items = db.setdefault("playlistItems", [])

    user_playlists = [p for p in playlists if p.get("userId") == user_id]
    if not user_playlists:
        defaults = get_default_playlists(user_id)
        for def_item in defaults:
            playlists.append(def_item["playlist"])
            for it in def_item["items"]:
                playlist_items.append(it)
        get_db().write(db)
        user_playlists = [p for p in playlists if p.get("userId") == user_id]

    result = []
    for p in user_playlists:
        items = [it for it in playlist_items if it.get("playlistId") == p.get("id")]
        items.sort(key=lambda x: x.get("position", 0))
        p_copy = dict(p)
        p_copy["itemCount"] = len(items)
        p_copy["totalDuration"] = _calc_duration(items)
        p_copy["items"] = items
        result.append(p_copy)
    return result

def create_playlist(user_id: str, title: str, description: Optional[str] = None, icon: Optional[str] = None, color: Optional[str] = None) -> Dict[str, Any]:
    db = get_db().read()
    playlists = db.setdefault("playlists", [])
    now = _now_iso()
    new_id = f"pl_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:6]}"
    new_playlist = {
        "id": new_id,
        "userId": user_id,
        "title": title.strip(),
        "description": (description or "").strip(),
        "icon": icon or "🎧",
        "color": color or "from-[#5D4E7B] to-[#3B2D54]",
        "isDefault": False,
        "itemCount": 0,
        "totalDuration": "0 min",
        "createdAt": now,
        "updatedAt": now,
        "items": [],
    }
    playlists.append(new_playlist)
    get_db().write(db)
    return new_playlist

def update_playlist(playlist_id: str, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_db().read()
    playlists = db.setdefault("playlists", [])
    target = next((p for p in playlists if p.get("id") == playlist_id and p.get("userId") == user_id), None)
    if not target:
        return None

    if "title" in data and data["title"]:
        target["title"] = str(data["title"]).strip()
    if "description" in data:
        target["description"] = str(data["description"]).strip()
    if "icon" in data and data["icon"]:
        target["icon"] = str(data["icon"]).strip()
    if "color" in data and data["color"]:
        target["color"] = str(data["color"]).strip()
    target["updatedAt"] = _now_iso()
    get_db().write(db)

    playlist_items = db.get("playlistItems", [])
    items = [it for it in playlist_items if it.get("playlistId") == playlist_id]
    items.sort(key=lambda x: x.get("position", 0))
    res = dict(target)
    res["itemCount"] = len(items)
    res["totalDuration"] = _calc_duration(items)
    res["items"] = items
    return res

def delete_playlist(playlist_id: str, user_id: str) -> bool:
    db = get_db().read()
    playlists = db.setdefault("playlists", [])
    playlist_items = db.setdefault("playlistItems", [])

    idx = next((i for i, p in enumerate(playlists) if p.get("id") == playlist_id and p.get("userId") == user_id), None)
    if idx is None:
        return False
    if playlists[idx].get("isDefault"):
        return False

    playlists.pop(idx)
    db["playlistItems"] = [it for it in playlist_items if it.get("playlistId") != playlist_id]
    get_db().write(db)
    return True

def add_playlist_item(user_id: str, playlist_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db().read()
    playlists = db.setdefault("playlists", [])
    playlist_items = db.setdefault("playlistItems", [])

    playlist = next((p for p in playlists if p.get("id") == playlist_id and p.get("userId") == user_id), None)
    if not playlist:
        # Check if default starter playlists need generation
        list_playlists(user_id)
        db = get_db().read()
        playlists = db.get("playlists", [])
        playlist_items = db.get("playlistItems", [])
        playlist = next((p for p in playlists if p.get("id") == playlist_id and p.get("userId") == user_id), None)

    if not playlist:
        return {"error": "playlist not found"}

    teaching_slug = item_data.get("teachingSlug")
    existing_item = next((it for it in playlist_items if it.get("playlistId") == playlist_id and it.get("teachingSlug") == teaching_slug), None)
    if existing_item:
        current_items = [it for it in playlist_items if it.get("playlistId") == playlist_id]
        current_items.sort(key=lambda x: x.get("position", 0))
        p_copy = dict(playlist)
        p_copy["itemCount"] = len(current_items)
        p_copy["totalDuration"] = _calc_duration(current_items)
        p_copy["items"] = current_items
        return {"playlist": p_copy, "item": existing_item}

    current_items = [it for it in playlist_items if it.get("playlistId") == playlist_id]
    new_position = len(current_items)
    now = _now_iso()
    new_item = {
        "id": f"pli_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:6]}",
        "playlistId": playlist_id,
        "teachingSlug": teaching_slug,
        "teachingTitle": item_data.get("teachingTitle") or "Devotional Teaching",
        "teacher": item_data.get("teacher") or "Pastor Asket",
        "duration": item_data.get("duration") or "10 min",
        "category": item_data.get("category"),
        "audioUrl": item_data.get("audioUrl"),
        "portrait": item_data.get("portrait"),
        "position": new_position,
        "addedAt": now,
    }
    playlist_items.append(new_item)
    playlist["updatedAt"] = now
    get_db().write(db)

    all_items = current_items + [new_item]
    all_items.sort(key=lambda x: x.get("position", 0))
    p_copy = dict(playlist)
    p_copy["itemCount"] = len(all_items)
    p_copy["totalDuration"] = _calc_duration(all_items)
    p_copy["items"] = all_items
    return {"playlist": p_copy, "item": new_item}

def remove_playlist_item(user_id: str, playlist_id: str, teaching_slug: str) -> Optional[Dict[str, Any]]:
    db = get_db().read()
    playlists = db.setdefault("playlists", [])
    playlist_items = db.setdefault("playlistItems", [])

    playlist = next((p for p in playlists if p.get("id") == playlist_id and p.get("userId") == user_id), None)
    if not playlist:
        return None

    db["playlistItems"] = [it for it in playlist_items if not (it.get("playlistId") == playlist_id and it.get("teachingSlug") == teaching_slug)]
    playlist["updatedAt"] = _now_iso()
    get_db().write(db)

    remaining = [it for it in db["playlistItems"] if it.get("playlistId") == playlist_id]
    remaining.sort(key=lambda x: x.get("position", 0))
    # Re-normalize positions
    for i, it in enumerate(remaining):
        it["position"] = i
    get_db().write(db)

    p_copy = dict(playlist)
    p_copy["itemCount"] = len(remaining)
    p_copy["totalDuration"] = _calc_duration(remaining)
    p_copy["items"] = remaining
    return p_copy

def reorder_playlist_items(user_id: str, playlist_id: str, teaching_slugs: List[str]) -> Optional[Dict[str, Any]]:
    db = get_db().read()
    playlists = db.setdefault("playlists", [])
    playlist_items = db.setdefault("playlistItems", [])

    playlist = next((p for p in playlists if p.get("id") == playlist_id and p.get("userId") == user_id), None)
    if not playlist:
        return None

    for it in playlist_items:
        if it.get("playlistId") == playlist_id and it.get("teachingSlug") in teaching_slugs:
            it["position"] = teaching_slugs.index(it["teachingSlug"])
    playlist["updatedAt"] = _now_iso()
    get_db().write(db)

    items = [it for it in playlist_items if it.get("playlistId") == playlist_id]
    items.sort(key=lambda x: x.get("position", 0))
    p_copy = dict(playlist)
    p_copy["itemCount"] = len(items)
    p_copy["totalDuration"] = _calc_duration(items)
    p_copy["items"] = items
    return p_copy
