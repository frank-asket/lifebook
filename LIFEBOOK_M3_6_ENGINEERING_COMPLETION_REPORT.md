# LifeBook M3.6 Engineering Completion Report

**Assessment date:** 17 October 2026  
**Code assessed:** `main` at `d4a3e85` (v0.0.3.1, PR #14). This includes PR #13 (v0.0.3.0, M3.6 source readiness) and PR #14 (French label fixes).  
**Supersedes:** the 16 October version of this report. That version was written before PR #13 and PR #14 landed. Its findings are in Git history (`dca2b2e`).

**Verdict: M3.6 is code-complete and technically verified. Operational sign-off is still pending.** Every build passes. All 17 automated tests (10 API, 7 web) pass with none skipped, including database integration tests run against a disposable PostgreSQL. Supabase has no pending migrations and no drift. The live Bible Reader now serves English and French. The remaining gates are operational, not code: an authenticated two-account acceptance run, a separate staging environment, a production Clerk instance, published meditation and study content, and an approved backfill of legacy plaintext reflections. **Do not start M3.7 until those gates close.**

This assessment made **no production database writes, migrations, repairs, seeds, deployments or configuration changes**. The production checks were `prisma migrate status`, a `prisma migrate diff` (both read-only) and unauthenticated GET requests.

---

## 1. Files modified and bugs fixed

### Since the previous report (PR #13, v0.0.3.0, 46 files)

| Area | Change |
| --- | --- |
| Bible annotations | Reader annotation panel for bookmarks, colored verse marks and private notes (`components/bible/AnnotationPanel.tsx`), plus a new **Saved verses** page (`app/bible/annotations`). |
| Reflection privacy | Shared versioned AES-GCM envelope bound to the owner and record (`api/src/security/reflection-crypto.ts`). New meditation and Daily Word reflections are encrypted, and legacy plaintext rows can still be read. |
| Backfill tooling | `scripts/reflection-backfill.cjs` scans read-only by default. `--apply` works only against a loopback database, is idempotent and prints counts only. |
| Auth consistency | Bible reading now returns 401, not 400, when there is no token (confirmed live). |
| Rate limiting | Global `@nestjs/throttler` guard (default 120 requests/min per route and IP) with validated `TRUST_PROXY_HOPS`. |
| Dependencies | Next 15.5.28 / React 19.3.1 for web and marketing; NestJS 11.2.7. Async page params migrated. |
| CI | Frozen installs, action SHAs pinned, PostgreSQL 17 service with migration replay, all API and web tests. |
| Docker | Non-root Node 22 image built from the lockfile; secrets excluded from the build context; no migrations at startup. |
| Deployment | `render.staging.yaml`, provider preflight (`verify-bible-provider.cjs`), two-account smoke test (`scripts/staging-smoke.cjs`), runbook at `deploy/staging/README.md`. |
| Safety | Root `db:migrate` now refuses to run (`migration-safety.cjs`). Production startup refuses to run without reflection keys. |

### PR #14 (v0.0.3.1, 7 files)

French labels for dashboard actions and saved learning preferences (`app/dashboard`, `app/settings`, `lib/api.ts`), with a new regression test `apps/web/test/profile-labels.regression-1.test.cjs`.

### Earlier M3.6 fixes (already verified in the previous report)

These remain in place: the duplicate `apps/web/src` App Router tree is gone, the initial migration checksum is reconciled, meditation and study migration history is restored, the daily passage is shared across pages, and a 404 for an unpublished meditation shows the empty state.

### This assessment

The only change is this report. No source changes were needed: nothing failed.

## 2. Build and test results (run 17 Oct on `d4a3e85`)

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS (lockfile up to date) |
| `prisma validate` / `prisma generate` | PASS / PASS |
| `@lifebook/api build` (NestJS) | PASS |
| `@lifebook/web build` (Next.js 15) | PASS (22 routes, listed below) |
| `@lifebook/marketing build` | PASS |
| `@lifebook/mobile tsc --noEmit` | PASS |
| Replay all migrations into an empty PostgreSQL 17 (Docker, loopback only) | PASS: 6 migrations, 25 public tables |
| `prisma migrate diff` (replayed DB against `schema.prisma`) | **No difference** |
| API tests (`apps/api/test/*.test.cjs`) with the disposable DB | **10/10 pass, 0 skipped** |
| Web tests (`apps/web/test/*.test.cjs`) | **7/7 pass, 0 skipped** |
| Remote GitHub CI on the `main` merge of PR #14 | **success** (run 38990746954) |

The 10 API tests cover reader registration, the translation contract, history scoping, plan enrollment and completion ownership, Bible Study persistence, HTTP auth/validation/throttling (including spoofed IPs), M3.6 persistence with encrypted notes, an idempotent backfill dry-run, envelope tamper detection with key rotation, and staging tools refusing unsafe targets.

**Web routes built:** `/`, `/bible`, `/bible/[studyId]`, `/bible/annotations`, `/bible/dashboard`, `/bible/my-reading`, `/bible/plans`, `/bible/plans/[id]`, `/bible/read`, `/daily-word`, `/dashboard`, `/discipleship`, `/livingword`, `/meditation`, `/meditation/[id]`, `/meditation/history`, `/onboarding`, `/prayer`, `/settings`, `/sign-in`, `/sign-up`. There are no duplicate routes, and `apps/web/src` no longer exists.

**To reproduce the database tests:** start a disposable `postgres:17` on loopback with database `lifebook_restore`. Set `DATABASE_URL`, `DIRECT_URL`, `LIFEBOOK_STUDY_TEST_DATABASE_URL` and `LIFEBOOK_M36_TEST_DATABASE_URL` to it. Run `prisma migrate deploy`, then `node --test apps/api/test/*.test.cjs`. The tests reject any host other than `127.0.0.1` and any database other than `/lifebook_restore`.

## 3. Features verified

Live checks were made against API `lifebook-yhbx.onrender.com` and web `lifebook-inky.vercel.app` (production, deployed about 11 hours before the check).

| Feature | Evidence | Status |
| --- | --- | --- |
| Authentication | Signed-out document requests to every protected route redirect to the Clerk handshake. Private API endpoints return 401 without a token. Tokens are verified via `@clerk/backend`. | Gating works. **Production runs a Clerk development instance** (`pk_test_`, `*.clerk.accounts.dev`). Real sign-up/in/out was not tested. |
| Onboarding | Profile API and source reviewed; `/me/profile` returns 401 without a token | Real account create/reload not verified |
| Daily Bible Meditation | Encrypted reflections, history and ownership pass the DB tests | **Live: 404 in EN and FR. No published meditation.** The UI shows the empty state. |
| Prayer | Source: in-memory draft only | **Not implemented** (M3.7 scope) |
| Daily Word | `devotionals/latest` returns 200 in EN and FR; sessions and stats return 401 without a token; encrypted reflections tested | Signed-in save/reload not verified |
| Bible Study | DB tests pass; the live list returns 200 | **Live library is empty in EN and FR** |
| **Bible Reader** | Live: translation metadata, books, chapter lists and **John 3 text return 200 in EN (KJV) and FR (Darby)** | **Previous P1 blocker resolved** |
| Bible Annotations | UI and Saved verses page shipped; AES-GCM notes and ownership tested; live endpoint returns 401 without a token | Signed-in browser run not verified |
| Reading history and resume | Revisit recency and user scoping tested; live returns 401 without a token | Signed-in resume after reload not verified |
| Reading plans | Live returns 3 localized plans in EN and FR; idempotent completion and day bounds tested | Signed-in enrollment and completion not verified |
| Reading dashboard | `completedDays` comes from completion rows. Opening a chapter does **not** count as completing a day (tested). | Cross-screen totals with a real account not verified |
| LivingWord | A clear "forthcoming" state is shown | **Not implemented** (M3.8 scope) |
| Settings | French labels fixed in v0.0.3.1 and covered by a regression test | Real account persistence not verified |

**What "not verified" means here:** every signed-in journey has been tested only with stubbed identity against a real database. None has been tested end to end with a real Clerk token in a browser, because no test accounts or staging environment exist yet. That run is the single largest remaining gap.

## 4. Outstanding issues and technical debt

| Priority | Issue | Next action |
| --- | --- | --- |
| **P1** | No real authenticated acceptance run | Create two Clerk test accounts and run `scripts/staging-smoke.cjs` plus the browser checklist in section 7 |
| **P1** | No separate staging environment. Vercel has only `lifebook` and `lifebook-marketing` (both production); no staging Render service or Supabase project was found. | Provision from `render.staging.yaml` and `deploy/staging/README.md` |
| **P1** | Production uses a Clerk development instance | Create a Clerk production instance (custom domain, keys, allowed origins) before public launch |
| **P1** | Reflections written before v0.0.3.0 may still be plaintext in production | Take a fresh backup, then run the backfill **dry-run** (read-only counts) with your approval. Rehearse `--apply` on a restored copy before any production apply. |
| **P2** | No published meditations; the study library is empty | Publish reviewed EN/FR content in staging first, then in production |
| **P2** | Mobile dependency advisories: 1 critical, 27 high, 13 moderate, **all under `apps/mobile`**. Web, marketing and API report none. | Plan an Expo SDK upgrade on its own branch before M4.2 Mobile |
| **P2** | The whole `/bible(.*)` area, including the reader, requires sign-in | Product decision: should anonymous visitors be able to read Scripture? |
| **P2** | Two identity implementations and more than one Prisma client | Consolidate behind ownership regression tests |
| **P2** | `AI_INTERNAL_API_KEY` (Render) vs `AI_INTERNAL_TOKEN` (FastAPI) mismatch | Reconcile before M3.7 activates AI |
| **P3** | Prisma 5.22 (6.x/7.x available); pnpm 9 | Upgrade later; not a release blocker |
| **P3** | Many overlapping status documents at the repo root (`M3.6_*`, `M36_*`, `*_REVIEW.md`) | Archive the historical ones under `docs/history/` once M3.6 closes |

## 5. Database migration status

Production Supabase (`aws-1-eu-central-1.pooler.supabase.com`), checked read-only on 17 Oct:

| Migration | Applied |
| --- | --- |
| `20261011065053_first_migration` | Yes |
| `20261013_daily_word_sessions` | Yes |
| `20261014_bible_annotations` | Yes |
| `20261014_bible_reading` | Yes |
| `20261015232900_meditation_history` | Yes |
| `20261015233000_bible_study` | Yes |

- `prisma migrate status` reports **"Database schema is up to date!"** (6 of 6 found and applied).
- `prisma migrate diff` (live datasource to `schema.prisma`) reports **no difference**, so there is no drift.
- An empty replay of all 6 migrations matches the schema exactly.

**The Phase 2 drift issue is closed.** The two migrations that were pending are applied, and the initial migration checksum was reconciled earlier (`356d8f7`, `807e8fb`). No repair is needed or proposed.

**Backups:** the existing verified archives are from 15 Oct and cover only the public schema (not Auth, Storage or roles), and they predate the study tables. **Take a fresh, restore-tested backup before any future production write**, including the reflection backfill.

## 6. Security findings

**In place (verified in source and/or tests):**

- Clerk tokens are verified with `@clerk/backend`. There is no decode-only fallback.
- All private data (history, enrollments, annotations, Daily Word sessions, meditation state) is scoped to the resolved user. Cross-user access is rejected in tests.
- Annotation notes use AES-256-GCM. New reflections use a versioned AES-GCM envelope bound to the owner and record, with key rotation and tamper detection tested.
- Production startup refuses to run without reflection keys. Because the live API is up and shows post-PR #13 behavior (401 on reading history), the keys are configured, so new reflections in production should now be encrypted.
- A global rate limiter is in place, and spoofed `X-Forwarded-For` headers are tested.
- Input bounds are enforced on notes, reflections, locales, chapters and plan days.
- The API.Bible key stays server-side.
- No reflection or prayer bodies are logged in API source, and no analytics SDK appears in the web or API source.
- Docker runs as a non-root user, CI action SHAs are pinned, and installs are frozen.

**Open:**

1. Clerk development instance in production (see section 4).
2. Legacy plaintext reflections pending the backfill (see section 4).
3. Platform-side controls were not inspected: Supabase RLS and direct-access roles, Render, Vercel and Supabase log retention, MFA on provider accounts, branch protection. Source-level controls do not certify these.
4. Rate limiting is per process (in memory). If the API scales beyond one instance, the effective limit multiplies; a shared store would be needed then.
5. The encryption key-recovery procedure (where the key ring is backed up, and who can restore it) is documented but not exercised.

## 7. Staging deployment readiness

**The code is ready for staging. The environment does not exist yet.**

| Component | Status | Needed |
| --- | --- | --- |
| Vercel | Production only | Staging/preview project with `NEXT_PUBLIC_API_URL` pointing at the staging API |
| Render | Production API only | New service from `render.staging.yaml` |
| Supabase | Production only | **Separate** project; `prisma migrate deploy` replays cleanly (verified locally) |
| Clerk | One development instance, used by production | Dedicated staging instance and two test accounts |
| API.Bible | Working in production (EN and FR) | Same key or a staging key, checked with `verify-bible-provider.cjs` |
| Encryption keys | Configured in production | Separate staging key ring; never reuse production keys |

**Staging acceptance sequence** (once provisioned):

1. Sign up account A. Sign out and back in. Check protected routes, and that expired or wrong-instance tokens are rejected. Create account B.
2. Complete onboarding and settings, reload and sign in again. Check that language and preferences persist and stay separate between A and B.
3. Read EN and FR chapters with previous/next navigation. Check history, and resume in a new session.
4. Enroll A in a plan. Open a chapter **without** completing it and check that the completion count does not change. Complete a day twice and check that it counts once. Check that B cannot touch A's plan and that dashboard totals match after reload.
5. Add, list and delete annotations, and confirm B cannot see A's.
6. Publish staging meditation and study content. Exercise reflection, completion and history for both accounts. Check that the database stores reflection ciphertext and that logs contain no reflection bodies.
7. Test on real iOS and Android browsers, with keyboard navigation and a screen reader.
8. Review the evidence, then plan the production release. Production database changes still need separate, explicit approval.

## 8. Recommended next engineering tasks

1. **Provision staging** (Render, Supabase and Clerk staging, plus a Vercel preview) and create two test accounts. This unblocks everything below.
2. **Run the section 7 acceptance sequence** and record the results. This is the M3.6 sign-off gate.
3. **Reflection backfill:** take a fresh backup, run a read-only dry-run on production (needs your approval), rehearse `--apply` on a restored copy, then apply with approval.
4. **Clerk production instance** and custom domain, before any public launch.
5. **Publish reviewed EN/FR meditation and Bible Study content**, staging first.
6. Decide whether the Bible Reader should be readable without signing in.
7. Plan the Expo/mobile dependency upgrade before M4.2.
8. Then start **M3.7 Prayer Sanctuary**, beginning with a privacy and AI-boundary design review and the `AI_INTERNAL_*` variable fix.
