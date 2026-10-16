# M3.6 implementation update — 16 October 2026

Branch: `codex/m36-completion-implementation`. This follows the earlier completion audit; it does not supersede its historical live observations or approve production release.

## Implemented

| Previous gap | Implementation |
| --- | --- |
| No annotation UI | Reader editor for bookmarks, colored verse/range marks and private notes; saved-verses page with chapter/locale/verse links; filtering, loading/error/anonymous states, save retry, delete and unsaved-draft protection. |
| Plaintext new reflection writes | Shared versioned AES-GCM envelope/key ring with owner/record binding; encrypt new meditation and Daily Word writes; decrypt all private response paths; preserve legacy reads. |
| No rehearsable backfill | Read-only scan by default, loopback-only conditional/idempotent apply, counts-only output and tests. No production rewrite. |
| Inconsistent private endpoint status | Bible reading now rejects absent/invalid authentication with 401. |
| No request throttling | Global per-route/IP limiter, validated proxy-hop configuration and HTTP tests for spoofed forwarded headers. |
| Web/API vulnerable package versions | Next 15.5.28 / React 19.3.1 on web/marketing, Nest 11.2.7 / Swagger 11.4.7, compatible PostCSS/js-yaml patches. Async page params migrated; mobile stays React 18 with Expo-compatible peers. |
| Weak release checks | Frozen installs, immutable CI action SHAs, ephemeral PostgreSQL migration replay and all API/web tests in CI. |
| Docker secrets/root/OpenSSL risks | Ignore local secrets/artifacts; install from lockfile; use non-root Node 22 with OpenSSL; no startup migrations. |
| Missing deploy settings | Approved Bible IDs and encryption settings declared; separate staging Blueprint, provider preflight, two-account staging smoke script and rollout runbook. |
| Dangerous generic migration shortcut | Shortcut now refuses execution; explicit reviewed CLI operations are required. |

The existing `BIBLE_NOTES_ENCRYPTION_KEY` format/ciphertext is preserved. No Prisma model or applied migration was changed.

## Verification

- Prisma validation/client generation, NestJS production build, both Next.js builds and mobile TypeScript checks pass.
- Ten API tests pass with no skips against an isolated PostgreSQL 17 replay: reader/study/M3.6 persistence, crypto integrity/rotation, HTTP auth/validation/throttling, dry-run/idempotent backfill. Fixtures roll back or clean up only their synthetic records.
- Five web regression tests pass. Remote CI has not run; these checks were executed locally.
- 25 annotation browser checks pass with synthetic local identity/API data: refresh/reopen, saved range, delete, draft retention, declined chapter change, four-width layouts, anonymous privacy and error states.
- All 84 layout checks pass across 21 routes at 320, 390, 768 and 1440 pixels.
- API Docker image builds and starts with synthetic keys against the disposable DB; health is 200, private route is 401, UID is non-root and local `.env` is absent.
- Production-workspace audit now has no reported advisory paths under web, marketing or API. Remaining workspace findings (13 moderate, 27 high, 1 critical) are in mobile/tooling paths, not cleared by this change. Audit counts and platform conditions are evidence, not proof of exploitability.

## Still blocked / not claimed complete

1. API.Bible rejected the supplied credential with **403 / Invalid API key** for both approved IDs. A working server credential with access is required. None was committed or deployed.
2. Separate staging resources and two real Clerk accounts/tokens have not been supplied/provisioned. Real sign-up/in/out, cross-session persistence and real-device acceptance still need execution.
3. Existing production plaintext reflections require a separately approved, backed-up backfill. New-code encryption does not retroactively protect old rows or backups.
4. Production encryption keys must be configured/recoverable before rollout; production-mode startup now rejects missing reflection configuration. After encrypted writes begin, rollback builds must retain decrypt-capable services and the required key ring; the previous API returns raw cipher envelopes.
5. Mobile SDK/toolchain audit findings remain; no blind native major upgrade was made during M3.6.
6. No live content was seeded/published, no schema/data migration was deployed, and this branch has not been merged or deployed.

See [staging and privacy rollout instructions](deploy/staging/README.md). M3.6 remains pending operational acceptance; M3.7 Prayer and M3.8 LivingWord were not started.
