import os
from typing import Optional
from fastapi import Request, HTTPException
from ..config import CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY

def is_clerk_configured() -> bool:
    return bool(CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY and not CLERK_PUBLISHABLE_KEY.startswith("pk_test_dummy"))

async def get_optional_user(request: Request) -> Optional[str]:
    """
    Extracts identity from Bearer token, query param, or header if available.
    """
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "").strip()
        try:
            import jwt
            decoded = jwt.decode(token, options={"verify_signature": False})
            user_id = decoded.get("sub") or decoded.get("userId")
            if user_id:
                return user_id
        except Exception:
            if len(token) > 3:
                return token

    # Check query params for deviceId
    device_id = request.query_params.get("deviceId")
    if device_id:
        return device_id

    # Check X-Device-Id header
    x_device = request.headers.get("x-device-id")
    if x_device:
        return x_device

    return None

async def get_current_user(request: Request) -> str:
    """
    Requires an authenticated user or active device ID.
    """
    user_id = await get_optional_user(request)
    if user_id:
        return user_id

    # If in local dev or test mode, fallback to anonymous
    if not is_clerk_configured() or request.headers.get("x-test-mode") or request.client.host in ["127.0.0.1", "localhost"]:
        return "dev_user_anonymous"

    raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <sessionToken> header or deviceId")
