# Consent history and account suggestion dismissals

Source implementation continued from the unfinished `feat/consent-history-and-dismissals` handoff on 23 October 2026. This is not a production rollout or completion of every product milestone.

## Behavior

- Profile saves record changes to personalization and optional AI-processing preferences in `ConsentEvent`. Unchanged values and unrelated edits create no events. Missing historical values are treated as the existing default, false; earlier consent is not fabricated or backfilled.
- A parameterized lock on the member's existing User row serializes profile saves, including the first save from two devices. The profile and events commit together; an event-write failure rolls back the preference change.
- This is a history of preference transitions from this release onward. It does not establish what privacy notice a person saw and is not a claim of legal compliance.
- `POST /api/v1/me/suggestions/:id/dismiss` persists a known suggestion ID for the authenticated member. Repeated requests are idempotent. Arbitrary IDs are rejected. Dismissals do not enable personalization or AI processing.
- `GET /api/v1/me/suggestions` excludes the member's dismissed suggestions and remains empty without personalization consent. Responses are marked `Cache-Control: no-store`.
- Web Home waits for a successful dismissal before removing a card; failed writes keep it visible with a retry message. Account/language changes discard the old component state. The heading receives keyboard focus after a successful hide, and a status announces success.
- Earlier per-account device-only dismissals are uploaded before loading suggestions. Their local copy is removed only after successful upload. New dismissals are not written to browser storage. If legacy import fails, optional suggestions remain hidden for that visit and import retries on the next visit.
- Account exports include `consentHistory` and `hiddenSuggestions`. Both tables cascade on LifeBook account deletion; another member's records are untouched.
- Existing goal labels remain compatible. The rule engine's current label-to-code mapping is retained, with no goal-data rewrite. Mobile consent switches already use the same profile endpoint; this batch introduces no native UI flow.

## Database and release gate

Pending additive migration: `20261020125247_consent_history_and_suggestion_dismissals`.

It creates two tables, their primary keys, one history index and two foreign keys to User. It does not alter existing rows, defaults or applied migrations. No production database was accessed or changed during this continuation.

Before merging code that depends on these tables, follow [the production release runbook, section A](PRODUCTION_RELEASE_RUNBOOK.md): inspect the live migration ledger (including the previously reconciled initial migration), confirm a recoverable backup by restoring it into a separate database, rehearse against that restore and obtain approval for this named migration. A clean empty-database replay alone does not prove production backup recoverability. Main auto-deploys; do not merge first and rely on the schema health guard.

Rollback is to the previous application version while leaving these additive tables intact. Do not drop tables or restore a backup over production.

## Verification

Passed on 23 October 2026:

- All 14 repository migrations replayed into a fresh task-owned PostgreSQL 17 database bound only to 127.0.0.1. Prisma schema comparison returned **no difference**. This is a fresh-database rehearsal, not a restore of production.
- **69 API tests passed**, one optional live-provider test skipped. The real HTTP regression covers concurrent consent saves, unchanged/default values, both consent kinds, invalid input, audit-write rollback, idempotent dismissals, invalid IDs, unauthenticated access, owner isolation, export and deletion cascades. The cross-member route inventory includes the new endpoint.
- **41 web tests and 59 mobile/cross-client component tests passed**. The new web component tests cover failed dismissal/retry, identity changes and importing legacy device choices without deleting them on failure.
- Prisma generation and validation, NestJS build, web and marketing Next.js production builds, mobile TypeScript, and Git whitespace checks passed.

Synthetic test data and Clerk test doubles exercise the real HTTP controllers; no real member credentials are used. The disposable test container was removed after verification. The reviewed source has been pushed on `feat/consent-history-and-dismissals`; the pull request is pending. Nothing has been merged or deployed in this continuation.

Manual browser/screen-reader acceptance and production backup/migration approval remain open.

## Production migration verification — 23 October 2026

The product owner approved `20261020125247_consent_history_and_suggestion_dismissals` by name in this session after reviewing the recovery rehearsal.

- All 13 previously applied migration checksums matched repository SQL; exactly the named migration was pending. No applied migration was changed.
- Private backup: `~/Documents/LifeBook-backups/20261023T020727Z/lifebook-public.dump`, 86,703 bytes, SHA-256 `841fe425e4e39f189e10ad73cfeb9d12dafa65d923c50024e6d77f9ad694bb03`. Folder mode 700; dump mode 600.
- Restored with PostgreSQL 17 into an isolated loopback database. Counts matched on all 32 original tables, including the migration ledger.
- Applied only the named migration to the restore. Existing table counts remained unchanged and schema comparison reported no difference.
- Rechecked live ledger and exact row counts against the backup immediately before application. Applied the approved migration; the ledger now contains 14 applied migrations and the new checksum matches SQL. Existing data table counts remained unchanged.
- Production schema comparison reported no difference after application. No reset, drop, backfill or retention activation ran.

Application release: [PR #68](https://github.com/frank-asket/lifebook/pull/68), awaiting green checks and merge at the time of this entry. Earlier pending statements above describe the source implementation before approval. The backup is retained; rollback uses the previous application code while keeping additive tables.
