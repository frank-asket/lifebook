import argparse
import json
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.config import DATA_DIR, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from app.db.database import empty_db

STATE_KEY = "default"
TABLE_NAME = "lifebook_app_state"


def read_source() -> dict:
    source_path = DATA_DIR / "db.json"
    if not source_path.is_file():
        raise FileNotFoundError(f"Legacy data file not found: {source_path}")
    with source_path.open("r", encoding="utf-8") as source_file:
        source = json.load(source_file)
    if not isinstance(source, dict):
        raise ValueError("Legacy database snapshot must be a JSON object")

    state = empty_db()
    state.update(source)
    return state


def summarize(state: dict) -> dict:
    return {
        collection: len(value) if isinstance(value, (list, dict)) else 0
        for collection, value in state.items()
    }


def migrate(replace: bool) -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in the root .env")

    from app.supabase import get_supabase_admin

    client = get_supabase_admin()
    table = client.table(TABLE_NAME)
    existing = table.select("state_key").eq("state_key", STATE_KEY).maybe_single().execute()
    if existing.data and not replace:
        raise RuntimeError("Supabase already has an app state row; use --replace only if you intend to overwrite it")

    state = read_source()
    table.upsert(
        {"state_key": STATE_KEY, "payload": state},
        on_conflict="state_key",
    ).execute()
    verification = table.select("payload").eq("state_key", STATE_KEY).single().execute()
    if not verification.data or verification.data.get("payload") != state:
        raise RuntimeError("Supabase state read-back did not match the local snapshot")


def main() -> int:
    parser = argparse.ArgumentParser(description="Import the legacy JSON API state into Supabase.")
    parser.add_argument("--apply", action="store_true", help="write the snapshot to Supabase; default is a local dry run")
    parser.add_argument("--replace", action="store_true", help="overwrite an existing Supabase state row; requires --apply")
    args = parser.parse_args()

    if args.replace and not args.apply:
        parser.error("--replace requires --apply")

    state = read_source()
    print(json.dumps({"source": str(DATA_DIR / "db.json"), "collections": summarize(state)}, indent=2))

    if args.apply:
        migrate(args.replace)
        print("Import completed. Keep LIFEBOOK_STORAGE_BACKEND=json until the import is verified.")
    else:
        print("Dry run only. Apply the SQL migration, rotate credentials, then rerun with --apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
