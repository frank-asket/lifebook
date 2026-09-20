import os
import base64
import json
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException
from ..config import CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY

_jwk_client = None

def is_clerk_configured() -> bool:
    return bool(CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY and not CLERK_PUBLISHABLE_KEY.startswith("pk_test_dummy"))

def is_local_dev_fallback_allowed() -> bool:
    """Only allow anonymous/device-ID bypass if Clerk is completely unconfigured or explicit dev flag is set."""
    return not is_clerk_configured() or os.getenv("LOCAL_DEV_ALLOW_ANONYMOUS") == "true"

def _get_clerk_jwks_url() -> str:
    custom_url = os.getenv("CLERK_JWKS_URL")
    if custom_url:
        return custom_url

    # Extract frontend domain from Clerk publishable key (pk_test_... or pk_live_...)
    if CLERK_PUBLISHABLE_KEY and "_" in CLERK_PUBLISHABLE_KEY:
        try:
            parts = CLERK_PUBLISHABLE_KEY.split("_")
            if len(parts) >= 3:
                encoded = parts[2]
                # Pad base64
                padded = encoded + "=" * (-len(encoded) % 4)
                decoded = base64.b64decode(padded).decode("utf-8").rstrip("$")
                return f"https://{decoded}/.well-known/jwks.json"
        except Exception:
            pass

    return "https://api.clerk.com/v1/jwks"

def get_jwk_client():
    global _jwk_client
    if _jwk_client is None:
        try:
            import jwt
            jwks_url = _get_clerk_jwks_url()
            headers = {}
            if CLERK_SECRET_KEY and "api.clerk.com" in jwks_url:
                headers["Authorization"] = f"Bearer {CLERK_SECRET_KEY}"
            _jwk_client = jwt.PyJWKClient(jwks_url, headers=headers)
        except Exception:
            _jwk_client = None
    return _jwk_client

def verify_clerk_jwt(token: str) -> Dict[str, Any]:
    """
    Cryptographically verifies a Clerk JWT using JWKS, issuer, audience, and expiration.
    No unverified decodes or forged identities permitted.
    """
    import jwt

    # Check for direct PEM public key override if configured
    jwt_key = os.getenv("CLERK_JWT_KEY")
    issuer = os.getenv("CLERK_ISSUER")
    audience = os.getenv("CLERK_AUDIENCE")

    options = {
        "verify_signature": True,
        "verify_exp": True,
        "verify_nbf": True,
    }

    if jwt_key:
        return jwt.decode(
            token,
            jwt_key,
            algorithms=["RS256"],
            issuer=issuer,
            audience=audience,
            options=options,
        )

    jwk_client = get_jwk_client()
    if jwk_client:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            audience=audience,
            options=options,
        )

    # Fallback to Clerk API verify if JWKS client could not be constructed
    if CLERK_SECRET_KEY:
        import httpx
        resp = httpx.get(
            "https://api.clerk.com/v1/jwks",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=5.0,
        )
        if resp.status_code == 200:
            jwks = resp.json()
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            for key_dict in jwks.get("keys", []):
                if key_dict.get("kid") == kid:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_dict))
                    return jwt.decode(
                        token,
                        public_key,
                        algorithms=["RS256"],
                        issuer=issuer,
                        audience=audience,
                        options=options,
                    )

    raise ValueError("No valid JWKS or public key found to verify Clerk token")

async def get_verified_claims(request: Request) -> Optional[Dict[str, Any]]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        if is_local_dev_fallback_allowed():
            # Allow fallback explicitly in local dev only
            x_dev_user = request.headers.get("x-user-id") or request.query_params.get("deviceId") or request.headers.get("x-device-id")
            if x_dev_user:
                return {"sub": x_dev_user, "role": "user", "verified": False}
            if request.headers.get("x-test-mode") or request.client.host in ["127.0.0.1", "localhost"]:
                return {"sub": "dev_user_anonymous", "role": "user", "verified": False}
        return None

    token = auth_header.replace("Bearer ", "").strip()
    if not is_clerk_configured():
        # Local unconfigured dev environment
        return {"sub": token, "role": "dev_user", "verified": False}

    try:
        claims = verify_clerk_jwt(token)
        claims["verified"] = True
        return claims
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired Clerk session token: {str(e)}")

async def get_optional_user(request: Request) -> Optional[str]:
    claims = await get_verified_claims(request)
    if claims and claims.get("sub"):
        return claims["sub"]
    return None

async def get_current_user(request: Request) -> str:
    user_id = await get_optional_user(request)
    if user_id:
        return user_id

    raise HTTPException(status_code=401, detail="Authentication required: valid Clerk Bearer token required")

def is_staff_claims(claims: Dict[str, Any]) -> bool:
    if not claims:
        return False
    # Check explicit staff flags and roles
    role = (
        claims.get("role")
        or claims.get("metadata", {}).get("role")
        or claims.get("public_metadata", {}).get("role")
        or claims.get("org_role")
    )
    if isinstance(role, str) and role.lower() in ["admin", "moderator", "reviewer", "staff", "org:admin"]:
        return True
    
    if claims.get("is_staff") is True or claims.get("public_metadata", {}).get("isStaff") is True:
        return True

    perms = claims.get("permissions") or []
    if "org:moderation:review" in perms or "org:admin" in perms:
        return True

    # Check local dev override
    if is_local_dev_fallback_allowed() and claims.get("sub") == "dev_reviewer_admin":
        return True

    return False

async def require_staff_user(request: Request) -> str:
    claims = await get_verified_claims(request)
    if not claims or not claims.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required: sign in with reviewer credentials")

    if not is_staff_claims(claims):
        raise HTTPException(status_code=403, detail="Forbidden: staff or reviewer permission required")

    return claims["sub"]

