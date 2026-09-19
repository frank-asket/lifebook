# Domain 1 - Service A: User Profile Service

Handles user profiles, preferences, streak calculations, and account settings.

## Port
- `8001`

## API Endpoints
- `GET /api/users/profile/:userId` — Retrieve user profile and streak.
- `PUT /api/users/preferences` — Update user Bible translation or theme preferences.
- `GET /health` — Service health check.

## Datastore Dependencies
- Database A (`databases/database-a/` PostgreSQL)
