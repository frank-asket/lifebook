# Product completion — production database verification

19 October 2026. Runbook section A for PR #58's two migrations. **Approved by the product owner** in the session on 19 October 2026, by name:

- `20261019180000_learning_path_progress`
- `20261019190000_livingword_editorial`

| Step | Evidence |
| --- | --- |
| 1. Backup | Production `public` schema with `pg_dump` (PostgreSQL 17 client), 83 KB, SHA-256 starting `1160e5cf8317321a`. Kept outside Git, in `~/Documents/LifeBook-backups/20261019T212334Z` (mode 700) on the operator machine. |
| 2. Restore test | Restored into a new local PostgreSQL 17. Exact row counts match production on all 31 tables (102 rows). Only warning: `schema "public" already exists`, which is expected on a fresh database. |
| 3. Rehearsal | On the restore: `migrate status` listed exactly the two migrations; `migrate deploy` applied both; `migrate diff` against `schema.prisma` showed no difference; ledger 13 rows, none failed; existing row counts unchanged. |
| 4. SQL check | Additive only: a new `LearningLessonCompletion` table, and new `Sermon` columns that are nullable or defaulted. No drops, renames or type changes. |
| 5. Approval | Product owner, 19 October 2026, both migrations by name. |
| 6. Pre-check | Production listed exactly the two migrations as pending; ledger 11 rows, none failed; row counts still matched the backup. |
| 7. Apply | `pnpm --filter @lifebook/api exec prisma migrate deploy`: both applied. |
| 8. Verify | `migrate status`: up to date. `migrate diff`: no difference. Ledger 13 rows, none failed. Row counts on all 30 existing tables unchanged. With the previous API still live, `/health`, `/pastors`, `/meditations/daily-word/today`, `/paths` and `/bible-studies` all return 200. |

Production had no `Sermon` rows, so "existing teachings stay unapproved until reviewed" affected nothing. The code in PR #58 was merged after this verification, as the runbook requires.

**Rollback:** the migrations are additive, so older code ignores the new table and columns. If data ever has to be restored, restore the backup into a new database first, never over production.
