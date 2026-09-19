# Domain 1 - Service C: Community & Prayer Service

Manages community groups, prayer walls, encouragement counters, and moderated group discussions.

## Port
- `8003`

## API Endpoints
- `GET /api/community/groups` — List prayer & Bible study groups.
- `POST /api/community/prayer-requests` — Submit a prayer request.
- `POST /api/community/prayer-requests/:id/pray` — Increment pray count.
- `GET /health` — Service health check.

## Message Broker Events
- Publishes: `prayer.submitted`, `group.joined` to `message-broker/`.
