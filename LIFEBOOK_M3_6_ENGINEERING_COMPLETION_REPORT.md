# LifeBook M3.6 Engineering Completion Report

**Assessment date:** 16 October 2026, Africa/Accra (UTC).  
**Verdict:** **M3.6 NOT SIGNED OFF.** Builds, migration reconciliation and isolated persistence tests pass. Live Bible delivery is blocked by missing translation configuration; authenticated production journeys and a separate staging environment have not been validated. Do not start M3.7 as a substitute for these release gates.

**Scope:** Audited the deployed code tree at `ccc7da5` (equivalent to feature commit `28bc606`), its changes since M3.6 baseline `97a9f0a`, and the current public API/database state. New work is on `codex/m36-completion-audit`. The previous UI releases were already merged before this request. This audit introduces no production deployment, production database write, migration repair, seed or schema change.

## 1. Files modified and bugs fixed

Historical fixes reviewed across the 64-path change inventory below:

- Removed duplicate `apps/web/src/app/bible/read` and its duplicate reader component; `apps/web/app` is the sole App Router root. Reader content routes are registered in NestJS. Both Next.js applications build their expected routes.
- Reconciled the initial migration's exact original bytes and added the missing meditation/study migration history. Current source matches the live ledger; this is no longer pending work.
- Fixed reader styling/integration, history error visibility, enrollment/completion feedback, user-scoped requests, and dashboard step links.
- Fixed desktop rendering of mobile tabs; centralized the daily passage for Dashboard, Daily Word and Moment of Peace; moved application-language saving to Settings; improved theme, responsive navigation, accessibility and page states.
- Marketing destinations and mobile/tablet overflow were corrected. Existing feature destinations remain present; dormant Prayer/LivingWord capabilities were not represented as implemented features.

**New files/changes in this audit only:**

| File | Change |
| --- | --- |
| `apps/web/app/meditation/page.tsx` | Treat the API's unpublished-meditation 404 as the existing empty state. Previously the UI expected null and presented missing content as a service failure. 503 remains an error. |
| `apps/api/test/m36-persistence.test.cjs` | Add opt-in, rollback-only PostgreSQL tests for reading, completion semantics, encrypted annotations, Daily Word, meditation and ownership. Rejects any target except loopback `/lifebook_restore`. Identity is stubbed deliberately. |
| This report | Consolidate current results, feature gaps, security findings, staging gates and the historical change inventory. |

These changes stay on the feature branch. No new feature was removed or added to the public release in this audit.

## 2. Build and test results

| Check executed during this audit | Result |
| --- | --- |
| `pnpm --filter @lifebook/api exec prisma validate` | PASS |
| `pnpm --filter @lifebook/api prisma:generate` | PASS |
| `pnpm --filter @lifebook/api build` | PASS |
| `pnpm --filter @lifebook/web build` | PASS, including a rebuild after the 404 fix |
| `pnpm --filter @lifebook/marketing build` | PASS |
| `pnpm --filter @lifebook/mobile exec tsc --noEmit` | PASS; no native-device session |
| `node --test apps/web/test/ui-navigation.test.cjs` | 5 passed |
| API tests without an isolated URL | 4 passed; study test correctly skipped. Not counted as database verification. |
| All three API test files with isolated URLs | **6 passed, zero skipped**: four reader regressions, study integration, new M3.6 integration |
| Empty local PostgreSQL 17 database: replay all migrations and compare schema | PASS; six migrations, 25 public tables, no difference |
| Restore immutable pre-study backup into another new local database | PASS; 21 historical public tables restored |
| Browser regression for unpublished meditation | PASS: 404 → empty state, 503 → error |
| Production public API checks | Mixed; details below |
| `git diff --check` | PASS |

To rerun the integration suites: build the API, prepare a migrated disposable loopback database named `lifebook_restore`, and set `LIFEBOOK_STUDY_TEST_DATABASE_URL` and `LIFEBOOK_M36_TEST_DATABASE_URL` to that database before running `node --test apps/api/test/*.test.cjs`. Set runtime `DATABASE_URL`/`DIRECT_URL` to the same local target too. Never use Supabase URLs for these tests.

The earlier UI release's **80 layout checks across 20 routes/four widths and 28 interaction/dark checks** remain supporting evidence for that unchanged baseline, documented in `WEB_EXPERIENCE_REVIEW.md`; those full suites were not rerun in this audit. The new 404 branch was checked separately in the isolated browser harness.

Local persistence tests use two synthetic users and real PostgreSQL queries, with fixtures rolled back. They verify revisits/history ordering, separate ownership, idempotent enrollment/day completion, day bounds, localized progress, AES-GCM note round-trips, Daily Word completion/reflection and meditation state/history. They do **not** verify Clerk token issuance, a real sign-in session, concurrent writes, or a complete browser refresh/sign-in cycle.

## 3. Features verified and remaining gaps

| Feature | Evidence | Status / outstanding acceptance gate |
| --- | --- | --- |
| Authentication | Signed-out production browser routes redirect to Clerk; private API calls reject absent tokens; signature verification traced in source | Sign-up/sign-in/sign-out, expired/invalid/other-instance token tests and two real accounts still required. Development Clerk keys were confirmed again on the production sign-in page during this audit. |
| Onboarding | Profile API/source and prior fixture UI checks | Real account creation, update, reload and second sign-in persistence not verified. |
| Daily Bible Meditation | Real local reflection/history/ownership persistence; new 404 UI regression | Live `/meditations/today?locale=en` and `fr` both return **404**; no eligible published meditation. Publish reviewed content in staging rather than seeding production automatically. |
| Prayer | Source confirms in-memory draft, no submission/persistence/AI processing | Submission/retrieval is **not implemented**, not a passing feature test. Keep in M3.7 scope. |
| Daily Word | Live English/French endpoint 200 with verse; local sessions/reflection/completion/ownership tests | Real signed-in browser save/reload still required; reflection encryption is outstanding. |
| Bible Study | Local publication/filter/order/progress/ownership integration passes; live list 200 | Live English/French lists are empty. Editorial content and real account lesson journeys remain unverified. |
| Bible Reader | Registered content routes and fixture chapter/locale tests | **BLOCKED LIVE:** English and French book endpoints return **503: Translation is not configured**. This occurs before chapter navigation can work. |
| Bible Annotations | Local API/service tests verify bookmark/highlight/note writes, encrypted storage and ownership | No annotation controls or annotation API calls in the web reader. Production encryption-key availability and key recovery are unverified. |
| Reading history / resume | Real database revisit, recency and ownership checks | Live authenticated write/read/resume after reload/sign-in still required. |
| Reading plans | Live public list returns 3 plans in both languages; real local idempotency/day-bound/ownership tests | Signed-in staging enrollment/completion/reload required. |
| Reading dashboard | Source and prior fixture UI checks; local `completedDays` derived from completion rows | Completion is manually asserted, not inferred from chapter opens. Real account cross-screen totals remain unverified. |
| LivingWord | Navigation and honest forthcoming-library state retained | Content catalogue, playback and saved teachings are not implemented; M3.8 scope. |
| Settings | Prior fixture save/failure/reload checks; language-only partial update reviewed | Real account persistence and account-menu operations remain unverified. |

**History semantics:** Opening a chapter updates `BibleReadingHistory`; completing a plan day writes `BibleReadingPlanDayCompletion`. The new local test proves an opened chapter leaves plan `completedDays` at zero until explicit completion. Neither chapter visits nor course completion should be described as spiritual maturity.

**Live read-only API observations on 16 October:**

- `https://lifebook-yhbx.onrender.com/api/v1/health`: 200.
- Daily Word, English/French: 200. Reading plans, English/French: 200 / 3 plans.
- Study library, English/French: 200 / 0 studies.
- Daily meditation, English/French: 404.
- Bible books, English/French: 503, explicit missing-translation message.
- Absent-token profile, annotations and Daily Word history: 401. Reading history: 400 and no data; auth-status consistency should be corrected, but this is not evidence of a bypass.

## 4. Outstanding issues and technical debt

| Priority | Finding | Concrete next action |
| --- | --- | --- |
| P1 — M3.6 blocker | Live Bible translations are unconfigured | Configure reviewed/licensed `API_BIBLE_EN_BIBLE_ID` and `API_BIBLE_FR_BIBLE_ID` on the Render API; confirm server-only `API_BIBLE_KEY` is valid. The current response proves missing translation IDs, not whether the key is valid. Verify metadata, books, chapters and next/previous in both languages. |
| P1 — release gate | No real authenticated acceptance run or isolated staging proof | Provision isolated staging credentials/resources and execute the two-account checklist in section 7. |
| P1 — privacy | Meditation and Daily Word reflections lack application-level encryption | Design key lifecycle and a reviewed additive/backfill plan; rehearse with synthetic/local data. Do not rewrite production data automatically. |
| P1 — dependency readiness | Production-workspace audit reports high/critical affected versions | Triage by runtime/exploit prerequisites and upgrade compatible packages on a dedicated branch, followed by full builds/auth tests. No blind major-version upgrade in this report. |
| P2 | Reader annotation UI is absent | Either deliver the intended annotation workflow before broad feature sign-off or explicitly agree its deferral; do not mark bookmarks/notes complete because a table exists. |
| P2 | No eligible daily meditations; study library empty | Publish reviewed English/French staging content and exercise actual content journeys. |
| P2 | CI misses web regression tests and opt-in DB integration coverage | Add web tests and an isolated PostgreSQL CI job. Current study and new persistence tests safely skip without opt-in URLs. Never supply a production URL. |
| P2 | Multiple identity implementations and Prisma clients | Consolidate later with ownership/auth regression coverage; current source verifies tokens but uses inconsistent rejection status codes. |
| P2 | Migration command footgun | Root `db:migrate` delegates to `prisma migrate dev`. It was not run. Add an explicit local-only guard or safer command naming before wider team use. |
| P2 | Build reproducibility and container hardening | Freeze reviewed dependency installation, pass a committed lockfile into the API Docker build, define a non-root runtime and exclude local secret files from Docker context. No committed secret was found by the limited scan. |
| P2 — M3.7 preparation | AI environment mismatch | Render declares `AI_INTERNAL_API_KEY` but FastAPI reads `AI_INTERNAL_TOKEN`; reconcile in staging before activating anything. Generation currently returns 501 after checks. |
| P3 | Historical docs describe superseded failures | Treat this dated report and the completed database records as current evidence; older source/UI reports preserve their historical limitations. |

## 5. Database migration and backup status

**Current read-only Supabase verification:**

| Migration | Completed | Source checksum equals live ledger |
| --- | --- | --- |
| `20261011065053_first_migration` | Yes | Yes |
| `20261013_daily_word_sessions` | Yes | Yes |
| `20261014_bible_annotations` | Yes | Yes |
| `20261014_bible_reading` | Yes | Yes |
| `20261015232900_meditation_history` | Yes | Yes |
| `20261015233000_bible_study` | Yes | Yes |

`prisma migrate status` says up to date. `migrate diff` from the live datasource to `schema.prisma` reports no difference. A read-only ledger transaction confirmed each checksum/completion record. The initial checksum also matches the exact Git object at `20b1afb`. **No migration is pending and no repair is proposed.**

Both existing backup archives were rehashed; hashes match `M3.6_DATABASE_VERIFICATION.md` and `BIBLE_STUDY_DATABASE_VERIFICATION.md`. The later pre-study archive (`20261015T232544Z/lifebook-public-before-study.dump`, SHA-256 `5b020658ba1e4ece43b0144a4cd3197c06a50d270aa4dabf8291b7089d607f3a`) restored successfully into a new local database using its verified restore list. The migration chain also replayed independently from empty and matched Prisma.

These are **historical application/public-schema backups**, not fresh backups of today's whole Supabase project. They exclude managed Auth/Storage schemas, roles and storage objects; the later archive predates the study tables. No claim is made that they cover writes since the recovery point. Any future production database change still requires a fresh, appropriately scoped recovery point, verified restore, reviewed plan and explicit user approval.

The only migration deployment executed in this audit targeted a newly created local Docker PostgreSQL 17 instance with both datasource URLs overridden to loopback. Production commands were status, schema comparison and SELECT-only ledger inspection. No reset, drop, schema push, production seed, checksum edit or production migration resolve/deploy was run.

## 6. Security findings and limits

### Confirmed concerns / release gates

- **Private reflections are plaintext at application level.** `MeditationService.reflect` writes `MeditationReflection.text`; `DailyWordService.saveReflection` writes `DailyWordReflection.content`. Ownership checks do not protect these values from privileged database/backup access. This is distinct from infrastructure encryption at rest, whose settings were not audited.
- **Production identity readiness is incomplete.** The production sign-in browser inspection during this audit emitted Clerk’s development-key warning. SDK signature verification exists; authorized-party restrictions are conditional on configuration. Verify production instance/origins, session expiry, wrong-instance tokens and two-account isolation in staging before launch. No authentic user token was available for this audit.
- **Dependency advisory backlog:** `pnpm audit --prod --json` returned 91 reported vulnerability findings (3 critical, 47 high, 37 moderate, 4 low) across 86 advisory records in the workspace. These are advisory/path counts, not 91 proven exploitable production vulnerabilities. Installed web/marketing Next.js is `14.2.35`; API Nest core is `10.4.22`; mobile Expo is `52.0.49`. Workspace findings include mobile/build tooling and transitive packages.
  - Next.js's [Windows-hosted RCE advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) requires Windows hosting; it is **not established as applicable to Vercel/Linux**.
  - Its [AVIF image-optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) concerns image optimization and underlying `libheif`/`sharp`. This repository's image-optimization exposure and platform mitigations were not proven; no exploit was attempted.
  - Triage remaining Next/Nest/mobile/transitive advisories separately. Do not treat a green build or lack of an exploit demonstration as dependency clearance.

### Positive evidence

- Clerk bearer tokens are verified through `@clerk/backend`; no decode-only fallback was found.
- Reading enrollments, history, annotations, Daily Word sessions and meditation state are scoped to the resolved internal user. Two-user local service tests reject cross-user access; they stub identity and therefore do not establish full HTTP/JWT isolation.
- Annotation notes use AES-256-GCM with random IVs. Local tests verify encrypted bytes and an owner-only plaintext round-trip. Production key storage, rotation/recovery and corrupted-ciphertext handling still require operational tests.
- DTO/manual validation bounds reflection/note lengths, locales, chapters, plan days and annotation fields. Bible provider keys stay server-side; fixed provider origin and eight-second timeout are present.
- The inspected app code does not log prayer/reflection bodies or initialize a frontend analytics SDK. Logging/analytics/retention settings in external platforms were not inspected; this is not a privacy certification.
- A limited tracked-file/history scan for Clerk/GitHub/AWS/private-key credential patterns returned no matching files/commits. This is not an exhaustive secret scan or evidence that previously shared credentials are valid/safe.

### Reliability and hardening backlog

No application rate-limiting middleware or deployment-level limit evidence was found; establish a baseline before public scale. CI uses mutable action tags and unfrozen installs; API Docker lacks an explicit non-root user and context secret exclusions. External branch protection, Supabase RLS/direct-access permissions, full backup policies, MFA, retention/deletion, monitoring and all platform access controls remain unverified. Source-level controls should not be substituted for those checks.

## 7. Staging deployment readiness

**Ready to prepare a staging environment; not a validated release candidate.** Existing Vercel preview builds do not demonstrate an isolated Render API, separate Supabase database or Clerk instance. No separate staging resources were created or reused during this audit.

| Component | Required isolated setup / gate |
| --- | --- |
| Vercel web/marketing | Preview/staging projects; `NEXT_PUBLIC_APP_URL` points to staging web; web `NEXT_PUBLIC_API_URL` points only to staging API |
| Render API | Staging service, explicit CORS/Clerk origins, valid licensed Bible provider key and both translation IDs; stable annotation key stored outside Git |
| Supabase | Separate staging project/database, separate pooled/direct URLs; fresh empty schema can replay all six migrations. Existing databases require inspection before any reconciliation. |
| Clerk | Dedicated development/staging instance, matching frontend/backend keys, allowed redirects/origins, two dedicated test accounts |
| AI service | Keep disabled until M3.7; do not route prayer data to the current 501 stub |
| CI/evidence | Locked build input, current dependency triage, isolated DB tests, browser and real-device evidence, agreed rollback/recovery procedure |

Execute this acceptance sequence after configuration:

1. Sign up test A, sign out/in, verify protected routes and rejected expired/wrong-instance tokens; create test B.
2. Save onboarding/preferences; reload and sign in again; verify language, consent and account separation.
3. Read English/French chapters using actual provider text/attribution; navigate previous/next; verify revisit history and resume after a new session.
4. Enroll A in a plan; open a chapter without completing it; verify no completion increment. Complete a day twice; verify one increment, ownership rejection for B and matching dashboard totals after reload.
5. Exercise available annotation controls/API with reviewed encryption keys, including owner-only list/delete and recovery expectations. Do not sign off a missing UI as complete.
6. Publish approved staging meditations/studies; exercise reflection/bookmark/completion/history with both accounts. Verify private bodies are absent from logs/analytics.
7. Run keyboard/screen-reader, real iOS/Android browser and native Expo checks. Record failures and limitations.
8. Review the completed evidence before any production release. Production database changes require separate explicit approval; a frontend deployment is not approval for a data migration.

## 8. Recommended next engineering tasks

1. Restore actual English/French Bible delivery through reviewed Render configuration and provider/licensing verification; rerun the full M3.6 reader acceptance path.
2. Provision isolated staging and two test accounts. Complete authenticated reload/sign-in, ownership and dashboard tests using real JWTs.
3. Triage/upgrade affected dependencies and implement the sensitive-reflection encryption/key-lifecycle plan on separate reviewed branches.
4. Decide and deliver the annotation UI acceptance scope; publish approved staging content; wire all safe regression suites into CI.
5. Complete M3.6 evidence and real-device/security review, then prepare the production release. Only afterward begin M3.7 Prayer Sanctuary, followed by M3.8 LivingWord.

## Appendix: historical changed-path inventory

Comparison: `97a9f0a..28bc606`. This inventory includes deleted duplicate routes and historical documentation, not just runtime code. Source/schema/API paths were traced with their callers/tests; UI and styling findings also use the earlier documented browser review. It is not a claim that every external integration passed a live acceptance test.

```text
M	.github/workflows/ci.yml
M	.gitignore
A	BIBLE_STUDY_DATABASE_VERIFICATION.md
A	CHANGELOG.md
M	CLOUD_SETUP.md
A	M3.6_DATABASE_VERIFICATION.md
A	M3.6_SOURCE_REVIEW.md
M	README.md
A	UI_UX_REVIEW.md
A	VERSION
A	WEB_EXPERIENCE_REVIEW.md
M	apps/api/prisma/migrations/20261011065053_first_migration/migration.sql
A	apps/api/prisma/migrations/20261015232900_meditation_history/migration.sql
A	apps/api/prisma/migrations/20261015233000_bible_study/migration.sql
M	apps/api/src/app.module.ts
M	apps/api/src/bible-content/bible-content.module.ts
M	apps/api/src/bible-reading/bible-reading.service.ts
A	apps/api/test/bible-reading.test.cjs
A	apps/api/test/bible-study.test.cjs
M	apps/marketing/app/globals.css
M	apps/marketing/app/layout.tsx
M	apps/marketing/app/page.tsx
M	apps/marketing/components/site-header.tsx
A	apps/marketing/lib/app-links.ts
A	apps/marketing/next-env.d.ts
M	apps/web/app/bible/[studyId]/page.tsx
M	apps/web/app/bible/dashboard/page.tsx
M	apps/web/app/bible/my-reading/page.tsx
M	apps/web/app/bible/page.tsx
M	apps/web/app/bible/plans/[id]/page.tsx
M	apps/web/app/bible/plans/page.tsx
A	apps/web/app/bible/read/page.tsx
M	apps/web/app/daily-word/page.tsx
M	apps/web/app/dashboard/page.tsx
M	apps/web/app/discipleship/page.tsx
M	apps/web/app/globals.css
M	apps/web/app/layout.tsx
M	apps/web/app/livingword/page.tsx
M	apps/web/app/meditation/[id]/page.tsx
M	apps/web/app/meditation/history/page.tsx
M	apps/web/app/meditation/page.tsx
M	apps/web/app/onboarding/page.tsx
M	apps/web/app/page.tsx
M	apps/web/app/prayer/page.tsx
M	apps/web/app/settings/page.tsx
M	apps/web/app/sign-in/[[...sign-in]]/page.tsx
M	apps/web/app/sign-up/[[...sign-up]]/page.tsx
A	apps/web/components/bible/BibleReader.tsx
M	apps/web/components/bible/ContinueReading.tsx
M	apps/web/components/bible/ReadingTracker.tsx
A	apps/web/components/daily-word-provider.tsx
M	apps/web/components/language-provider.tsx
M	apps/web/components/meditation-view.tsx
M	apps/web/components/shell.tsx
M	apps/web/components/theme-provider.tsx
M	apps/web/components/theme-toggle.tsx
M	apps/web/lib/api.ts
R078	apps/web/src/lib/bible-api.ts	apps/web/lib/bible-api.ts
A	apps/web/lib/daily-word-navigation.ts
A	apps/web/lib/daily-word.ts
D	apps/web/src/app/bible/read/page.tsx
D	apps/web/src/components/bible/BibleReader.tsx
A	apps/web/test/ui-navigation.test.cjs
M	package.json
```
