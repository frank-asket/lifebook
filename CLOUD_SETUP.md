# LifeBook Phase 1 — Clerk / Supabase / Render / Vercel

## Deployment order
1. **Clerk**: Create an application, enable desired login methods (Google for the included Expo proof of concept), configure OAuth redirect/deep links, and register your production web origins. Use the same Clerk application for web and mobile. Do not use Supabase Auth in parallel.
2. **Supabase**: Create a PostgreSQL project; obtain pooled **DATABASE_URL** for Prisma runtime and **DIRECT_URL** for migrations. Choose connection mode/port based on the current Supabase dashboard guidance. Enable pgvector later when the AI retrieval module is implemented. Restrict database access and enable backups appropriate to your plan.
3. **Render**: Create the two web services using `render.yaml`. Supply secrets via Render dashboard. Run Prisma migrations **separately** as a controlled deployment step (`pnpm --filter @lifebook/api exec prisma migrate deploy`), not automatically on each app instance startup. The API health endpoint is `/api/v1/health`.
4. **Vercel**: Import this monorepo twice: `apps/marketing` and `apps/web` as separate Next.js projects, with the appropriate root directories. Add the web `.env.example` keys as Vercel environment variables. Update Clerk allowed origins and Render CORS.
5. **Expo**: Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_API_URL`. For device testing use the reachable HTTPS Render API, or LAN IP during local testing; `localhost` on a phone is not your computer. Configure OAuth schemes and redirects in Clerk/Expo before relying on mobile sign-in.

## Local development
- `corepack enable && pnpm install`
- Create `.env` and `apps/web/.env.local` and `apps/mobile/.env` from their examples.
- For local PostgreSQL: update both `DATABASE_URL` and `DIRECT_URL` to your local instance; or use Supabase URLs directly.
- `pnpm db:generate && pnpm db:migrate`
- `pnpm dev:api`, `pnpm dev:web`, `pnpm dev:marketing`, and `pnpm --filter @lifebook/mobile start`.
- FastAPI: `cd apps/ai-service && pip install -r requirements.txt && uvicorn main:app --reload`.

## Important boundaries
- **Clerk** is the identity provider. The NestJS API verifies Clerk bearer tokens, then maps `sub` to `User.oidcSubject`. Client-supplied role or user ID must never be trusted.
- **Supabase** is managed PostgreSQL, not a second authentication provider. Keep sensitive prayers and religious profiles behind the NestJS API. Do not expose database service-role keys to clients.
- **Profile onboarding** currently stores selected journey, language, and consent. This is an MVP vertical slice; no spiritual classification is inferred.
- **Mobile Google sign-in** is a scaffold: OAuth must be configured and tested on actual devices; email sign-in, account deletion, token-refresh scenarios, and accessibility need additional work.
- **Render AI** service is a placeholder. Do not expose AI-generation endpoints publicly without service authentication. No production prayer data should be sent to the placeholder.
- **Not yet production-ready:** webhook synchronization, production-grade rate limits, logging/redaction, secrets rotation, user deletion workflow, security tests, complete E2E tests, and database migration validation.
- **Versioning:** dependency ranges in this starter are templates; install and pin tested versions and commit a lockfile before deployment.
