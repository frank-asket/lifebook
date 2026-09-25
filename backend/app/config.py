import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))

PORT = int(os.getenv("PORT", "8787"))
HOST = os.getenv("HOST", "0.0.0.0")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY", "")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS_RAW == "*" or not ALLOWED_ORIGINS_RAW.strip():
    ALLOWED_ORIGINS = ["*"]
else:
    ALLOWED_ORIGINS = [orig.strip() for orig in ALLOWED_ORIGINS_RAW.split(",") if orig.strip()]

RATE_LIMIT_WINDOW_MS = int(os.getenv("RATE_LIMIT_WINDOW_MS", "60000"))
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "60"))
RATE_LIMIT_CHECKIN_MAX = int(os.getenv("RATE_LIMIT_CHECKIN_MAX", "10"))
