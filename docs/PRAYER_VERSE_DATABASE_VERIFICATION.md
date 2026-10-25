# Prayer verse: production database verification (25 October 2026)

Migration `20261025120000_prayer_verse` adds one nullable column, `PrayerEntry.verseCiphertext TEXT`. It holds the verse chosen for each prayer, sealed like the prayer itself. Applied by following `PRODUCTION_RELEASE_RUNBOOK.md` section A. The product owner approved this migration by name in this session.

| Step | Result |
| --- | --- |
| 1. Backup | `~/Documents/LifeBook-backups/20261025T132216Z/lifebook-public.dump`: 91,524 bytes, SHA-256 starts `991f2a553fa55c54`. |
| 2. Restore test | Restored into a fresh local PostgreSQL 17. 34 tables and 129 rows; the exact counts match production table by table. |
| 3. Rehearsal | `migrate deploy` applied only `prayer_verse` on the copy. `migrate diff` against `schema.prisma` showed no difference. Row counts were unchanged; the migration ledger gained its one row. |
| 4. Additive check | The only statement is `ALTER TABLE "PrayerEntry" ADD COLUMN "verseCiphertext" TEXT;` (no drop, no type change, no `NOT NULL`). |
| 6. Pre-check | Production listed exactly `20261025120000_prayer_verse` as pending, and its row counts matched the backup. |
| 7. Apply | `prisma migrate deploy` applied `20261025120000_prayer_verse`. |
| 8. Verify | "Database schema is up to date". `migrate diff` showed no difference. Row counts were unchanged, apart from the migration ledger. There are 0 failed ledger rows, and `verseCiphertext` is `text`, nullable. |

The verse stays off in production until the prayer topic library is marked reviewed, like the Scripture companion. Existing prayers keep `verseCiphertext` empty.
