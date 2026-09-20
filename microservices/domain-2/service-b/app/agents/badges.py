from typing import List, Optional
from ..models.schemas import Badge, StreakRecord

MILESTONES = [
    {"id": "badge-3-day", "title": "First Steps", "description": "Checked in 3 days in a row", "threshold": 3},
    {"id": "badge-7-day", "title": "7-Day Streak", "description": "A full week of daily check-ins", "threshold": 7},
    {"id": "badge-30-day", "title": "30-Day Streak", "description": "A full month of daily check-ins", "threshold": 30},
    {"id": "badge-100-day", "title": "Faithful Century", "description": "100 days of showing up", "threshold": 100},
]

def compute_badges(streak: Optional[StreakRecord]) -> List[Badge]:
    longest = streak.longest if streak else 0
    return [
        Badge(
            id=m["id"],
            title=m["title"],
            description=m["description"],
            earned=longest >= m["threshold"]
        )
        for m in MILESTONES
    ]
