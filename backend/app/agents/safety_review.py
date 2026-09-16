from typing import Optional, NamedTuple
from ..models.schemas import GeneratedContent

CRISIS_SIGNALS = [
    "suicide", "kill myself", "want to die", "end my life", "self harm", "self-harm", "hurting myself"
]

class ReviewResult(NamedTuple):
    verdict: str
    support_note_needed: bool

def review_content(note: Optional[str], content: dict) -> ReviewResult:
    haystack = (note or "").lower()
    flagged = any(signal in haystack for signal in CRISIS_SIGNALS)
    return ReviewResult(
        verdict="uncertain" if flagged else "pass",
        support_note_needed=flagged
    )
