from typing import Dict, Any, List
from ..config import ALLOWED_ORIGINS

def get_cors_middleware_args() -> Dict[str, Any]:
    return {
        "allow_origins": ALLOWED_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["*"],
        "expose_headers": ["*"]
    }
