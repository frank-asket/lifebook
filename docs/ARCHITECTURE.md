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

## Production gaps

This starter does not include complete billing, sermon ingestion, prayer encryption, AI RAG, pastor verification workflow, production rate limiting, automated end-to-end tests, or a fully verified deployment. Do not treat it as launch-ready.
