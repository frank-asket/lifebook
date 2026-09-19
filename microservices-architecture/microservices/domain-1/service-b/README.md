# Domain 1 - Service B: Content & Devotional Service

Serves Scripture verses, curated reading plans, devotional library books, and daily check-ins.

## Port
- `8002`

## API Endpoints
- `GET /api/content/verses` — Retrieve mood-curated verses.
- `GET /api/content/library` — Access reading library and bookmarks.
- `GET /health` — Service health check.

## Datastore Dependencies
- Database A (`databases/database-a/`)
- Cache layer in Database B (`databases/database-b/`)
