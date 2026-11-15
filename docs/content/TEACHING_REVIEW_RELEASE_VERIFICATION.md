# Teaching review release verification — 15 November 2026

Release candidate: v0.5.0.0, branch `codex/livingword-review-drafts`.

## Production preflight

- Read-only inspection found 15 applied Prisma migrations. Every SQL SHA-256 checksum matches the repository; no failed, unfinished or rolled-back ledger row was found.
- Exactly one migration is pending: `20261114233000_teaching_review_drafts`.
- SQL review: one new table, unique source/index and RLS enabled with no public policies. No existing table, row or applied migration is altered.
- A fresh private custom-format PostgreSQL 17 public-schema backup was created outside Git. Its SHA-256 is `befe0716d200d6ae5ddb16d7a701a1f2f95116ed688c70d9edbc044a68e1b022`.
- Restore into a separate local PostgreSQL 17 database matched exact counts for all 34 public tables. The standard restore reported only the already-existing empty `public` schema; all table counts matched afterward.
- Rehearsal applied the one pending migration. Existing data counts were unchanged; only the migration ledger gained its expected row. Prisma schema diff reported no difference and the new table had RLS enabled.
- Backup, row counts and detailed local rehearsal evidence remain private outside the repository. No participant content or credentials are included here.

## Release status

**The product owner approved the named migration and deployment on 15 November 2026. Production migration applied and verified successfully before code merge.** All 16 migrations are applied, existing data counts remain unchanged, Prisma reports no schema difference, and the new table has RLS enabled. Main automatically deploys web/API; the schema guard remains enabled.

The separate v0.5.0.0 version and named production migration/deployment approvals are recorded in the operator conversation. Backup hash and recoverability were rechecked immediately before application; production counts still matched the backup. Code deployment verification follows merge.

## Validation

Prisma validation, NestJS production build, Next.js web/marketing builds and mobile TypeScript validation passed. API, web and mobile regression results are recorded in the PR after the final run. Independent source review found no verified blocker. Browser Back/Forward recovery of unsaved review text and physical-device acceptance remain limitations; see `TEACHING_REVIEW_DRAFTS.md`.

## After named migration approval

1. Recheck the expected pending migration, applied checksums and backup row counts against current production. If data changed, refresh the backup and repeat restore/rehearsal.
2. Apply only the reviewed migration through Prisma migrate deploy. Never reset, drop, overwrite production or amend the migration ledger.
3. Verify history/checksums, schema drift, RLS and unchanged existing row counts.
4. Merge the green PR, verify Render Live and Vercel Ready, then test anonymous denial and signed-in source save/edit/conflict behavior.
