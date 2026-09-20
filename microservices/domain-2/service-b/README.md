# LifeBook API and AI orchestration service

The agent pipeline and API described in `LifeBook_TRD.docx`, implemented with
**zero runtime dependencies** — just Node's built-ins — so it runs immediately
with no `npm install` required to try it.

## Quick start

```bash
cd microservices/domain-2/service-b
npm install        # only needed for typescript/tsx dev tooling
npm run dev         # starts on http://localhost:8787
```

No `ANTHROPIC_API_KEY`? The server still runs — every check-in returns a
clearly-labeled dev-fallback response (`modelMode: "dev-fallback"`) built from
the same real, retrieval-selected verse a live response would use. This lets
a frontend developer build against the API for free before wiring in a key.

To enable live generation:

```bash
cp .env.example .env
# paste your key into .env
npm run dev
```

## Architecture

Matches the agent pipeline in the TRD:

| File | Agent |
|---|---|
| `src/agents/verseRetrieval.ts` | Verse retrieval — picks from the vetted corpus in `verses.json`, never from model memory |
| `src/agents/contentGeneration.ts` | Content generation — writes the reflection/prayer/action step around the given verse |
| `src/agents/safetyReview.ts` | Theology & safety review — flags distress-indicating language |
| `src/agents/orchestrator.ts` | Orchestrator — sequences the above, persists results, updates streaks |
| `src/db.ts` | Storage — currently a JSON file; swap for Postgres/Prisma or Firestore without changing any calling code |

## API

**Core loop**
- `GET /api/health` — status + current mode (live vs dev-fallback)
- `POST /api/checkin` — `{ deviceId, mood, note? }` → generated content + updated streak
- `GET /api/streak?deviceId=...` — current streak record

## Microservices

The web features can also run as independent services:

```bash
npm run dev:livingword  # http://localhost:8788
npm run dev:voice       # http://localhost:8789
```

LivingWord provides teaching catalog, detail data, and moderated comments.
Voice provides the Scripture-grounded conversation contract. See
`src/microservices/README.md` for routes and production boundaries.
- `POST /api/flag` — `{ contentId, deviceId, reason? }` → files a review-queue entry
- `GET /api/badges?deviceId=...` — badges computed from real streak history

**Community**
- `GET /api/groups` — seeded groups with live member counts
- `POST /api/groups/:id/join` — `{ deviceId }`
- `GET /api/prayer-requests` — approved requests only
- `POST /api/prayer-requests` — `{ deviceId, text, category? }` → passes through the moderation agent
- `POST /api/prayer-requests/:id/pray` — increments the prayer counter
- `GET /api/discussions` / `POST /api/discussions` — same moderation pass
- `POST /api/discussions/:id/like`
- `GET /api/discussions/:id/replies` / `POST /api/discussions/:id/replies` — `{ deviceId, text }`

**Journal & favorites**
- `GET /api/journal?deviceId=...` / `POST /api/journal` — `{ deviceId, text }`
- `GET /api/favorites?deviceId=...` / `POST /api/favorites` — `{ deviceId, contentId, verseText, verseReference }`
- `GET /api/mood-history?deviceId=...` — last 30 days, derived live from real check-ins

**Onboarding**
- `GET /api/preferences?deviceId=...` / `POST /api/preferences` — arbitrary preference fields, merged on save

**Library**
- `GET /api/library?deviceId=...` — books with `locked` reflecting the caller's subscription tier
- `POST /api/library/:id/bookmark` — `{ deviceId }`

**Subscription**
- `GET /api/subscription?deviceId=...`
- `POST /api/subscription/upgrade` — `{ deviceId, billingCycle }` — see note below, this is a mock

**Push notifications**
- `POST /api/push-token` — `{ deviceId, token, platform }` — stores an Expo push token for this user
- `POST /api/notifications/send-test` — `{ deviceId }` — sends a real test push through Expo's push service

## Push notifications

Sends through **Expo's push service**, not a direct FCM/APNs call — this
matches the Expo push token the mobile side registers (see
`clients/mobile/src/notifications/push.ts`). Expo's service forwards to FCM
(Android) and APNs (iOS) on your behalf; you don't need native Firebase
Messaging SDK setup for this to work in Expo's managed workflow.

**Tested:** token registration, and the failure paths (no token registered,
a non-Expo test token). **Not tested:** an actual delivered notification —
that needs a real device running the Expo app, which wasn't available in
this environment. When you try it for real, expect the very first call to
possibly fail with an "ExperienceId not found" or similar error until the
mobile app has been run at least once with a real Expo project — see
Expo's push notification docs if that happens.

## Clerk + Supabase setup

Clerk is the identity authority and Supabase is the Postgres database. Apply
`supabase/migrations/20260909160000_lifebook.sql`, then configure Clerk's
native Supabase integration so session tokens carry the authenticated role.
Set `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, and the
server-only `SUPABASE_SERVICE_ROLE_KEY` in this service's `.env`. Every protected
request must include `Authorization: Bearer <Clerk session token>`; the API
never accepts a client-provided device ID as identity.

## Deploying to production hosting

I can't create an account or push a live deploy for you — no network access
in the environment this was built in — but the backend is genuinely
deploy-ready: it has a Dockerfile, respects `PORT` from the environment,
and has a root route (`/`) for platforms that health-check `/` by default.

**Read this first — the one decision that actually matters:** this backend
stores data in a JSON file on local disk. Almost every hosting platform
wipes local disk on every restart or redeploy. Two options:

- **Demo/pilot only, don't care about data loss on redeploy:** deploy as-is.
  Fine for showing people the app; every check-in disappears eventually.
- **Actually want data to persist:** attach a persistent disk/volume and
  point `DATA_DIR` at its mount path. `render.yaml` in the repo root already
  does this (see below). This is still not a substitute for a real database
  under real load — it's a bridge, not the destination. Migrate to Postgres
  before this has real users depending on it.

### Deploy to Render (Free Tier Walkthrough)

The repository includes both a **Blueprint (`render.yaml`)** and configuration for manual Web Service setup on Render's **Free Tier**.

#### Option A: 1-Click Blueprint Deployment (Fastest)
1. Push your repository to GitHub.
2. Log in at [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Select your GitHub repository. Render will detect `render.yaml` at the root and pre-configure the service with `plan: free`!
5. In the environment variables prompt, enter any keys you want to configure (e.g. `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`), or leave them blank to use local dev-fallback mode.
6. Click **Apply**. Render will build and deploy your backend in ~1–2 minutes.

#### Option B: Manual Web Service Setup
1. Log in at [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `lifebook-backend` (or your chosen name)
   - **Region**: Select the region closest to your users (e.g., Frankfurt or Oregon)
   - **Branch**: `main`
   - **Root Directory**: `microservices/domain-2/service-b`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free** ($0 / month)
4. Under **Environment Variables**, add:
   - `ALLOWED_ORIGINS`: `*` (or your web frontend URL)
   - `PYTHON_VERSION`: `3.11.9`
   - *(Optional)* `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `CLERK_*`, `SUPABASE_*`
5. Click **Create Web Service**.

#### Testing Your Deployed Backend
Once deployed, Render gives you a public URL (e.g. `https://lifebook-backend.onrender.com`):
```bash
curl https://lifebook-backend.onrender.com/api/health
```
You will receive:
```json
{"status":"ok","modelMode":"dev-fallback","version":"0.1.0"}
```
Now set `NEXT_PUBLIC_API_URL` (in web) or `EXPO_PUBLIC_API_URL` (in mobile) to your Render URL.

### Alternatives

- **Railway** (https://railway.app): connect the repo, it detects the
  Dockerfile automatically. Add a volume under the service's Settings →
  Volumes tab, mount it, and set `DATA_DIR` to that mount path.
- **Fly.io** (https://fly.io): `fly launch` from inside `microservices/domain-2/service-b/` detects
  the Dockerfile. `fly volumes create` + a `[mounts]` block in `fly.toml`
  gets you persistent storage.
- Any of these work — the Dockerfile doesn't assume a specific platform.

### Before this is public, not just deployed

- **CORS and rate limiting are now built in** (see "Security" below) — set `ALLOWED_ORIGINS` before going public; the defaults are intentionally wide open for local dev.
- Set real secrets (API keys, Clerk, and Supabase credentials) through the platform's dashboard, never committed to the repo.

## Security

**CORS.** `ALLOWED_ORIGINS` unset → every origin allowed (dev-fallback).
Set it to a comma-separated list of your real domains before going public.
Native mobile requests (the Expo app) don't send an `Origin` header at all,
so they're unaffected either way — this only matters for browser callers.
Tested: an unset allow-list accepts any origin; a configured allow-list
returns 403 for a non-matching origin, 200 with the correct
`Access-Control-Allow-Origin` for a matching one, and still passes through
requests with no `Origin` header at all.

**Rate limiting.** In-memory, per-client-IP, fixed-window. Two tiers:
a general limit (`RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS`, default 60/min)
across every route, and a tighter one specifically on `/api/checkin`
(`RATE_LIMIT_CHECKIN_MAX`, default 10/min) since that's the endpoint that
spends real Anthropic API credit on every call. Tested: dropping the
check-in limit to 3 in a test run correctly let three requests through and
429'd the fourth, with a `retryAfterMs` telling the caller when to retry.

**Known limitation, stated plainly:** the rate limiter's state lives in one
process's memory. Behind multiple instances (horizontal scaling), each
instance enforces its own limit independently — the effective limit
becomes roughly `limit × instance count`, not a hard global cap. Fine for
a single-instance deployment (true for most small pilots and everything
`render.yaml` sets up by default). Once you scale horizontally, move this
to a shared store (Redis) or lean on your platform's own rate limiting
(Cloudflare, Render) instead.

## What's intentionally simple here, and the upgrade path

This is a real, runnable backend — not a mock — scoped for local development
and a small pilot. Before a public launch, per the TRD and Backend Schema:

1. **Migrate existing endpoint repositories from `db.ts` to the new Supabase tables.** The
   SQL migration and Clerk-aware RLS are in `supabase/migrations/`; the legacy JSON
   repository remains only while those endpoint-level data migrations are completed.
2. **Configure Clerk and Supabase in production** before accepting real user traffic.
3. **Move `safetyReview.ts` from a keyword heuristic to a real model-based review agent**
   — the function signature is already shaped to make that a drop-in change.
4. **Put the server behind a real host** (not `localhost`) and restrict CORS
   from `*` to your actual app domain.
5. **Connect a real payment processor** (Stripe, or App Store/Play Store IAP)
   — `src/agents/subscription.ts` currently mocks the upgrade with no real
   charge, by necessity: a real processor needs a live merchant account.
6. **Replace the community moderation heuristic** in `communityModeration.ts`
   with a real model-based pass, same pattern as `contentGeneration.ts`.
