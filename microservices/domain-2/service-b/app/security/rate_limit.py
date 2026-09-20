import time
import threading
from typing import NamedTuple, Dict

class Bucket(NamedTuple):
    count: int
    reset_at: float

_buckets: Dict[str, Bucket] = {}
_lock = threading.Lock()

class RateLimitResult(NamedTuple):
    allowed: bool
    remaining: int
    reset_at: float

def check_rate_limit(key: str, max_requests: int, window_ms: int) -> RateLimitResult:
    now = time.time()
    window_sec = window_ms / 1000.0
    
    with _lock:
        # Occasional cleanup if map gets large
        if len(_buckets) > 1000:
            for k in list(_buckets.keys()):
                if _buckets[k].reset_at < now:
                    del _buckets[k]
                    
        existing = _buckets.get(key)
        if not existing or existing.reset_at < now:
            reset_at = now + window_sec
            _buckets[key] = Bucket(count=1, reset_at=reset_at)
            return RateLimitResult(allowed=True, remaining=max_requests - 1, reset_at=reset_at)
            
        if existing.count >= max_requests:
            return RateLimitResult(allowed=False, remaining=0, reset_at=existing.reset_at)
            
        new_count = existing.count + 1
        _buckets[key] = Bucket(count=new_count, reset_at=existing.reset_at)
        return RateLimitResult(allowed=True, remaining=max_requests - new_count, reset_at=existing.reset_at)
