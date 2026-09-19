# Database B (Document & Analytics / In-Memory Store - MongoDB / Redis)

Secondary datastore optimized for high-velocity telemetry, AI generated content logs, caching, and document storage.

## Port
- `27017` (MongoDB) or `6379` (Redis)

## Collections / Key Patterns
- `telemetry_events`: Real-time user event stream.
- `generated_meditations`: AI generated outputs, token counts, model metadata.
- `cache:sessions:{userId}`: Active session cache for low-latency validation.
- `rate_limits:{ip}`: Sliding window rate limit counters.
