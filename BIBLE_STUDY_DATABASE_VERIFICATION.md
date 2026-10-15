# Bible Study database verification — 15 October 2026 (UTC)

## Completed

- Created `StudyMethod`, `StudyStatus`, `StudySeries`, `StudyLesson`, `StudyEnrollment`, and `StudyLessonCompletion`, with the indexes and foreign keys defined in Prisma.
- Applied `20261015233000_bible_study` using `prisma migrate deploy`. It contains only additive schema statements inside a transaction, with a five-second lock timeout. No data was seeded or published.
- Reconciled meditation history with `20261015232900_meditation_history`. Exact schema comparison proved the existing meditation tables match this migration. Used `prisma migrate resolve --applied` only for this new reconciliation entry; its CREATE statements were not executed against the existing Supabase tables. Existing historical files and ledger checksums were not changed.
- All six migrations have completed records and checksums matching source. `prisma migrate status` reports no pending migrations. A read-only comparison with `schema.prisma` reports zero schema drift.
- Counts and content fingerprints were unchanged for all 20 pre-existing application tables across deployment. No reset, drop, overwrite, development migration, schema push, or live test-data write was performed.

## Fresh backup and verification

The private PostgreSQL 17 archive is `Documents/LifeBook-backups/20261015T232544Z/lifebook-public-before-study.dump`, outside Git. SHA-256: `5b020658ba1e4ece43b0144a4cd3197c06a50d270aa4dabf8291b7089d607f3a`. Its manifest and tested restore list are retained alongside it.

This backup covers all 21 public-schema tables at the pre-migration recovery point, including the migration ledger. It excludes Supabase-managed auth/storage schemas, managed roles, and storage objects. Those were unaffected by this migration; this is an application-data backup, not a full Supabase project backup.

Normal Daily Word activity changed the database after an earlier backup, so the final backup and verification fingerprints used one exported, read-only PostgreSQL snapshot. The restored archive matched that snapshot for every table. This supports verification while application writes continue. See PostgreSQL's [synchronized snapshot support](https://www.postgresql.org/docs/17/app-pgdump.html).

Two isolated PostgreSQL 17 checks passed before live deployment:

1. Replayed all six migrations into a new empty local database; the result exactly matched `schema.prisma`. This closes the previous meditation-history replay gap.
2. Rehearsed the existing-database path on the restored backup: verified meditation structures, marked the reconciliation entry applied, deployed the study migration, and confirmed zero schema drift and unchanged application data.

## Tests and builds

Prisma validation, NestJS build, Next.js build, and the four existing Bible reading regression tests passed. The new database-backed study test passed against the migrated restore: English/French and method filters, unpublished/archived exclusion, lesson ordering, idempotent enrollment/completion, automatic enrollment, and separate progress per user. All fixtures were rolled back locally.

The integration test is `apps/api/test/bible-study.test.cjs`. It requires `LIFEBOOK_STUDY_TEST_DATABASE_URL`, rejects non-loopback hosts and any database name except `lifebook_restore`, and skips when no isolated test URL is supplied. Build the API first, then run it with Node's test runner against a migrated isolated restore. It stubs identity resolution; it does not verify Clerk tokens.

## Future deployments and limits

Fresh empty databases can run the complete checked-in migration chain normally. For another existing database containing meditation tables but lacking this reconciliation record, do not blindly run its CREATE statements or mark it applied: verify that database's exact schema and recoverable backup first. Supabase's current instance is already reconciled.

The four study tables are empty. The existing draft seed contains editorial placeholders and was not run; the library will display studies only after reviewed content is created and published. Live Clerk/provider behavior and production application deployment remain outside these database checks. No application service rewrite was required.
