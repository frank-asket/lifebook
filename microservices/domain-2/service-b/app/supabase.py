import os
from typing import Optional

try:
    from .config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
except ImportError:
    from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_cached_supabase_admin: Optional[object] = None


def get_service_key() -> Optional[str]:
    return SUPABASE_SERVICE_ROLE_KEY


def is_supabase_configured() -> bool:
    return bool(SUPABASE_URL and get_service_key())


def get_supabase_admin():
    """
    Server-only client with singleton reuse to prevent connection exhaustion.
    """
    global _cached_supabase_admin
    if _cached_supabase_admin is not None:
        return _cached_supabase_admin

    service_key = get_service_key()
    if not SUPABASE_URL or not service_key:
        raise RuntimeError(
            "Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        )

    try:
        from supabase import create_client
        _cached_supabase_admin = create_client(SUPABASE_URL, service_key)
        return _cached_supabase_admin
    except ImportError:
        raise RuntimeError("supabase-py is not installed. Add 'supabase' to requirements.txt")
    except Exception as e:
        raise RuntimeError(f"Failed to initialize Supabase client: {e}")


def clerk_uid_from_auth(auth_user: Optional[str]) -> Optional[str]:
    """Extract Clerk user ID from auth context."""
    return auth_user