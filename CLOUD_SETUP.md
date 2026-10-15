# LifeBook Phase 1 — Clerk / Supabase / Render / Vercel

## Deployment order

**Existing Supabase database:** Before any migration deployment, follow [the migration review and recovery prerequisites](M3.6_SOURCE_REVIEW.md). The initial migration file now matches the applied checksum, and the two Bible migrations were applied after backup restoration and an isolated rehearsal; see [database verification](M3.6_DATABASE_VERIFICATION.md). Verify the live history and schema and confirm a recoverable backup for every further migration. Application deployment must not reset, drop, overwrite, or automatically migrate this database.

1. **Clerk**: Create an application, enable desired login methods (Google for the included Expo proof of concept), configure OAuth redirect/deep links, and register your production web origins. Use the same Clerk application for web and mobile. Do not use Supabase Auth in parallel.
2. **Supabase**: Create a PostgreSQL project; obtain pooled **DATABASE_URL** for Prisma runtime and **DIRECT_URL** for migrations. Choose connection mode/port based on the current Supabase dashboard guidance. Enable pgvector later when the AI retrieval module is implemented. Restrict database access and enable backups appropriate to your plan.
3. **Render**: Create the two web services using `render.yaml`. Supply secrets via Render dashboard. Run Prisma migrations **separately** as a controlled deployment step (`pnpm --filter @lifebook/api exec prisma migrate deploy`), not automatically on each app instance startup. The API health endpoint is `/api/v1/health`.
4. **Vercel**: Import this monorepo twice: `apps/marketing` and `apps/web` as separate Next.js projects, with the appropriate root directories. Add the web `.env.example` keys as Vercel environment variables. Update Clerk allowed origins and Render CORS.
5. **Expo**: Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_API_URL`. For device testing use the reachable HTTPS Render API, or LAN IP during local testing; `localhost` on a phone is not your computer. Configure OAuth schemes and redirects in Clerk/Expo before relying on mobile sign-in.

## Local development
- `corepack enable && pnpm install`
- Create `.env` and `apps/web/.env.local` and `apps/mobile/.env` from their examples.
- For local PostgreSQL: point both `DATABASE_URL` and `DIRECT_URL` at a disposable local instance before using development migrations. Do not run `pnpm db:migrate` against the existing Supabase database.
- `pnpm db:generate`; use `pnpm db:migrate` only for that disposable local database.
- `pnpm dev:api`, `pnpm dev:web`, `pnpm dev:marketing`, and `pnpm --filter @lifebook/mobile start`.
- FastAPI: `cd apps/ai-service && pip install -r requirements.txt && uvicorn main:app --reload`.

## Important boundaries
- **Bible Reader:** Configure server-only `API_BIBLE_KEY`, `API_BIBLE_EN_BIBLE_ID`, and `API_BIBLE_FR_BIBLE_ID` in Render. Notes additionally require `BIBLE_NOTES_ENCRYPTION_KEY` (64 hexadecimal characters); preserve an existing key so stored notes remain readable. These values are not declared in the current Render Blueprint. Open `/bible/read?locale=en&chapter=GEN.1` to check Scripture delivery, then verify French and authenticated history/plans after the database prerequisites are satisfied.
- **Clerk** is the identity provider. The NestJS API verifies Clerk bearer tokens, then maps `sub` to `User.oidcSubject`. Client-supplied role or user ID must never be trusted.
- **Supabase** is managed PostgreSQL, not a second authentication provider. Keep sensitive prayers and religious profiles behind the NestJS API. Do not expose database service-role keys to clients.
- **Profile onboarding** currently stores selected journey, language, and consent. This is an MVP vertical slice; no spiritual classification is inferred.
- **Mobile Google sign-in** is a scaffold: OAuth must be configured and tested on actual devices; email sign-in, account deletion, token-refresh scenarios, and accessibility need additional work.
- **Render AI** service is a placeholder. Do not expose AI-generation endpoints publicly without service authentication. No production prayer data should be sent to the placeholder.
- **Not yet production-ready:** webhook synchronization, production-grade rate limits, logging/redaction, secrets rotation, user deletion workflow, security tests, complete E2E tests, and database migration validation.
- **Versioning:** dependency ranges in this starter are templates; install and pin tested versions and commit a lockfile before deployment.
