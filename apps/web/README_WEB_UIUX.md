# LifeBook — Complete Web UI/UX Layer (Sprint 1 + Feature Shells)

This replaces `apps/web` in the existing LifeBook pnpm monorepo and preserves the existing NestJS API contracts. It includes responsive desktop/mobile layouts, branded auth pages, four-step onboarding, dashboard, meditation, prayer, LivingWord, Bible study, discipleship and settings.

## Run

From the repository root:

```bash
corepack enable
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with real Clerk keys and NestJS URL.
pnpm --filter @lifebook/web dev
```

Open http://localhost:3001. In Vercel, create a Next.js project with Root Directory `apps/web`, and set the three environment variables shown in `.env.example`.

## Existing API contracts

- `GET /api/v1/health`
- `GET /api/v1/devotionals/latest`
- `GET /api/v1/paths`
- `GET /api/v1/me/profile` (Clerk bearer token)
- `PUT /api/v1/me/profile` (Clerk bearer token)

The `apps/api` NestJS project needs a working Supabase connection and correctly configured CORS + Clerk verification for profile calls to work.

## Honest implementation boundaries

- **Working UI + integration code:** Clerk sign-in/up, protected routes, multi-step onboarding with profile persistence, profile/settings retrieval, dashboard and curated content reads. These require configured external services.
- **UI-only pending backend:** Prayer draft is explicitly ephemeral in memory and never sent to a server; AI generation, encrypted prayer persistence, audio playback, media catalog, Bible passage search, bookmarks, enrollment and progress analytics are NOT implemented.
- **Sample scripture:** A placeholder Psalm 46:10 quote is labeled as sample when no published devotional exists. Confirm Bible translation rights before shipping production text.
- **No fake metrics:** Unimplemented activity counts are shown as dashes, not invented numbers.
- **Privacy:** Faith journey is optional and self-selected. AI consent does not itself transmit prayer data. A separate contextual consent and secure backend are required.

## UI design system

Fonts: Manrope headings, DM Sans body. Tokens in `app/globals.css`. Responsive sidebar at desktop widths and mobile bottom navigation. Soft purple, lilac, rose and mint accents; card-based layouts, accessible labels, empty states, errors, and loading state. Icons: lucide-react.

## Deployment checklist

1. Set Clerk allowed origins and redirect URLs for your Vercel domain.
2. Configure `NEXT_PUBLIC_API_URL` with the actual Render API URL (no `/api/v1` suffix).
3. Set `CORS_ORIGIN` in NestJS to the Vercel web origin.
4. Verify `/api/v1/health`, then profile GET/PUT using a signed-in Clerk session.
5. Publish a devotional and discipleship path in the database to replace empty states.
6. Test responsive screens, keyboard navigation, privacy flows and sign-out.
7. Add backend endpoints before enabling disabled feature actions.

## GitHub integration

The ZIP contains the whole LifeBook monorepo with this web app in place, so you can copy it over your existing repository. Review diffs before pushing: backend and other apps are retained from the provided Phase 1 archive, not upgraded or independently audited.
