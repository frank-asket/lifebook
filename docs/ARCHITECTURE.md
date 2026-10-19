# LifeBook — Phase 1 architecture

- `apps/marketing`: public Next.js marketing site on Vercel.
- `apps/web`: authenticated Next.js web app on Vercel.
- `apps/mobile`: Expo Router mobile app using Clerk sessions.
- `apps/api`: NestJS API on Render, owns Prisma access to Supabase Postgres.
- `apps/ai-service`: isolated FastAPI service on Render, AI features not yet active.
- Clerk is the **only** identity provider; Supabase Auth is not used.
- Faith journey is user-selected, optional, and never a permission or maturity score.
- Authorization roles are separate from faith journey.
- API should be the only database access point for private user data.

## M3.6 source implementation

Web and marketing use Next.js 15 / React 19; the API uses NestJS 11 on Node.js 22. Mobile now uses Expo 57 / React 19.2 with `@clerk/expo` 4; see [native build readiness](NATIVE_BUILD_READINESS.md) for internal builds and pending device acceptance. The reader has authenticated history, plans, progress, bookmarks, colored verse marks and encrypted private notes. New meditation/Daily Word reflections use owner-bound AES-GCM envelopes; legacy plaintext remains until separately approved backfill.

API requests have per-route/IP/process throttling. CI replays migrations only in disposable loopback PostgreSQL and runs persistence/security tests. Application startup does not run migrations. See the [staging/privacy runbook](../deploy/staging/README.md) for environment settings, recovery and the requirement to retain decrypt-capable services and keys during rollback.

## Production gaps

This starter does not include complete billing, sermon ingestion, prayer encryption, AI RAG, pastor verification workflow, distributed rate limiting, real-account end-to-end acceptance tests, or a fully verified deployment. Do not treat it as launch-ready.
