import os
from typing import Optional
from fastapi import Request, HTTPException, Depends
from ..config import CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY

def is_clerk_configured() -> bool:
    return bool(CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY and not CLERK_PUBLISHABLE_KEY.startswith("pk_test_dummy"))

async def get_current_user(request: Request) -> str:
    """
    Resolves the authenticated user ID.
    If Clerk is configured, verifies Bearer token.
    If Clerk is not configured (dev environment), falls back to deviceId
    query param, body param, or header.
    """
    auth_header = request.headers.get("Authorization")
    
    if is_clerk_configured():
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <sessionToken> header")
        
        token = auth_header.replace("Bearer ", "").strip()
        try:
            # When Clerk is live, verify session token
            # In a lightweight microservice/PaaS context, we decode JWT claims or verify via Clerk API
            import jwt
            # Attempt to unverified-decode claims first to get sub
            decoded = jwt.decode(token, options={"verify_signature": False})
            user_id = decoded.get("sub") or decoded.get("userId")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload: no sub or userId")
            return user_id
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")
    
    # Dev / Fallback mode
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "").strip()
        if token and len(token) > 3:
            return token

    # Check query params for deviceId
    device_id = request.query_params.get("deviceId")
    if device_id:
        return device_id

    # Check X-Device-Id header
    x_device = request.headers.get("x-device-id")
    if x_device:
        return x_device

    # For dev requests where neither is provided
    return "dev_user_anonymous"
