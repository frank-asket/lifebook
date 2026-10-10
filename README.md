# LifeBook — GitHub Monorepo (Phase 1)

Mobile-first Christian devotional platform with a marketing site and full web application. This repository extends the earlier LifeBook Cloud Starter with web/mobile onboarding, a dashboard, and deployment documentation.

## Applications

| Directory | Stack | Target |
|---|---|---|
| `apps/marketing` | Next.js | Vercel |
| `apps/web` | Next.js + Clerk | Vercel |
| `apps/mobile` | Expo + Clerk | iOS / Android |
| `apps/api` | NestJS + Prisma | Render |
| `apps/ai-service` | FastAPI | Render |

## Requirements

Node.js 20, pnpm 9, Python 3.11+, Docker for optional local Postgres/Redis.

## Quick start

1. Copy `.env.example` to `.env` and the app-specific `.env.example` files to `.env.local` / `.env` as appropriate. **Never commit credentials.**
2. Create a Clerk project, Supabase project, and configure Clerk redirect origins.
3. `corepack enable && pnpm install`
4. Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) for Supabase in the API environment.
5. `pnpm db:generate && pnpm db:migrate` (staging/local only; use deploy migrations in production).
6. `pnpm dev:api`, `pnpm dev:web`, `pnpm dev:marketing` in separate terminals.
7. `pnpm --filter @lifebook/mobile start` for Expo.
8. For AI: `cd apps/ai-service && pip install -r requirements.txt && uvicorn main:app --reload`.

## Deploy

- Create two separate Vercel projects rooted at `apps/marketing` and `apps/web`.
- Render services are described in `render.yaml`.
- Store database URLs and Clerk secret only in Render API environment.
- Set `NEXT_PUBLIC_API_URL` for web and `EXPO_PUBLIC_API_URL` for mobile.
- See `CLOUD_SETUP.md`, `docs/ARCHITECTURE.md`, and `docs/SPRINT_1_CHECKLIST.md`.

## Scope and status

This is a **GitHub-ready source folder**, not a hosted GitHub repository. No live credentials are included. Dependencies have not been installed or tested against live services in this environment. API token validation and onboarding flows require integration testing before production.
