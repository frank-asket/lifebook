import os
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import threading

ANALYTICS_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "analytics_events.json")
_lock = threading.Lock()

# Standard steps in Guided Devotional Flow
GUIDED_STEPS = ["scripture", "reflect", "meditate-select", "meditate-run", "pray", "complete"]

def _ensure_data_file():
    os.makedirs(os.path.dirname(ANALYTICS_DATA_PATH), exist_ok=True)
    if not os.path.exists(ANALYTICS_DATA_PATH):
        with open(ANALYTICS_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)

def _read_events() -> List[Dict[str, Any]]:
    _ensure_data_file()
    try:
        with open(ANALYTICS_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _write_events(events: List[Dict[str, Any]]):
    _ensure_data_file()
    # Keep last 5000 events to prevent unbounded growth
    trimmed = events[-5000:]
    with open(ANALYTICS_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(trimmed, f, indent=2)

def record_event(
    event_name: str,
    device_id: Optional[str] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    properties: Optional[Dict[str, Any]] = None,
    timestamp: Optional[str] = None,
) -> Dict[str, Any]:
    with _lock:
        events = _read_events()
        event_obj = {
            "id": f"evt_{int(time.time() * 1000)}_{len(events)}",
            "eventName": event_name,
            "deviceId": device_id or user_id or "anonymous",
            "userId": user_id,
            "sessionId": session_id,
            "properties": properties or {},
            "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
        }
        events.append(event_obj)
        _write_events(events)
        return event_obj

def record_batch_events(events_list: List[Dict[str, Any]]) -> int:
    with _lock:
        events = _read_events()
        now_iso = datetime.now(timezone.utc).isoformat()
        count = 0
        for e in events_list:
            event_obj = {
                "id": f"evt_{int(time.time() * 1000)}_{len(events) + count}",
                "eventName": e.get("eventName", "unknown_event"),
                "deviceId": e.get("deviceId") or e.get("userId") or "anonymous",
                "userId": e.get("userId"),
                "sessionId": e.get("sessionId"),
                "properties": e.get("properties") or {},
                "timestamp": e.get("timestamp") or now_iso,
            }
            events.append(event_obj)
            count += 1
        _write_events(events)
        return count

def get_recent_events(limit: int = 100) -> List[Dict[str, Any]]:
    with _lock:
        events = _read_events()
        return list(reversed(events[-limit:]))

def compute_funnel_and_summary() -> Dict[str, Any]:
    with _lock:
        events = _read_events()

    total_events = len(events)
    unique_devices = len(set(e.get("deviceId", "anon") for e in events))

    starts = 0
    completions = 0
    habit_5min = 0

    step_views: Dict[str, int] = {s: 0 for s in GUIDED_STEPS}
    step_completions: Dict[str, int] = {s: 0 for s in GUIDED_STEPS}
    step_dwells: Dict[str, List[float]] = {s: [] for s in GUIDED_STEPS}

    for e in events:
        name = e.get("eventName")
        props = e.get("properties", {})

        if name in ("guided_flow_started", "guided_flow_start"):
            starts += 1
        elif name in ("guided_flow_completed", "guided_flow_finish"):
            completions += 1
        elif name == "habit_5min_achieved":
            habit_5min += 1

        if name == "guided_step_viewed":
            step = props.get("step")
            if step in step_views:
                step_views[step] += 1
        elif name == "guided_step_completed":
            step = props.get("step")
            if step in step_completions:
                step_completions[step] += 1
            dwell = props.get("dwellSeconds") or props.get("durationSeconds")
            if step in step_dwells and isinstance(dwell, (int, float)) and dwell > 0:
                step_dwells[step].append(float(dwell))

    funnel_list = []
    prev_views = starts if starts > 0 else (step_views.get("scripture", 0) or 1)

    for step in GUIDED_STEPS:
        views = step_views.get(step, 0)
        comps = step_completions.get(step, 0)
        avg_dwell = (
            round(sum(step_dwells[step]) / len(step_dwells[step]), 1)
            if step_dwells.get(step)
            else 0.0
        )
        drop_off = 0.0
        if prev_views > 0 and views < prev_views:
            drop_off = round(((prev_views - views) / prev_views) * 100, 1)

        funnel_list.append({
            "step": step,
            "views": views,
            "completions": comps,
            "dropOffRate": drop_off,
            "avgDwellSeconds": avg_dwell,
        })
        if views > 0:
            prev_views = views

    completion_rate = round((completions / starts * 100), 1) if starts > 0 else 0.0

    return {
        "totalEvents": total_events,
        "uniqueDevices": unique_devices,
        "guidedFlowStarts": starts,
        "guidedFlowCompletions": completions,
        "completionRate": completion_rate,
        "habit5MinAchieved": habit_5min,
        "funnel": funnel_list,
    }
