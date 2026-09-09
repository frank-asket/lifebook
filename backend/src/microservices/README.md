# LifeBook microservices

The backend now exposes two independently runnable services for the web features.

## LivingWord service

```bash
cd backend
npm run dev:livingword
```

Default port: `8788`

- `GET /health`
- `GET /api/teachings`
- `GET /api/teachings/:slug`
- `GET /api/teachings/:slug/comments`
- `POST /api/teachings/:slug/comments`

Comments use the existing Firebase/dev-fallback identity resolver and the community moderation agent. Approved comments are persisted in the configured JSON data store.

## Voice service

```bash
cd backend
npm run dev:voice
```

Default port: `8789`

- `GET /health`
- `POST /api/voice/answer`

The Voice service uses `ANTHROPIC_API_KEY` when configured and a clearly labeled Scripture-grounded fallback otherwise. Provider keys remain server-side.

## Production boundary

These services currently share the repository's JSON store and auth/moderation helpers so they are easy to run locally. Before public launch, move them behind a gateway or service deployment, use a persistent database, lock CORS to the web/mobile origins, and add service-level observability and request limits.
