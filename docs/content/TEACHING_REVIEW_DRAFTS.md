# Private teaching review drafts

Implemented in source on 15 November 2026. Code deployment is pending. The additive migration was approved, applied and verified in production on 15 November 2026; see `TEACHING_REVIEW_RELEASE_VERIFICATION.md`.

## Scope and design

Editors save a discovered source into a separate private queue, then write their own title, verified speaker, proposed attribution, permission reference/restrictions and pastoral review notes. This implements the next review step after discovery. It does not import media, copy sermon text, approve rights, publish a Sermon or add a YouTube player.

The existing LivingWord direct-media editor and web/mobile players retain their current contracts. Keeping review drafts separate prevents unfinished sources from appearing in the member library or being passed to an incompatible player.

### Implementation map

- `TeachingReviewDraft` and `20261114233000_teaching_review_drafts`: one new table, unique source reference, revision counter, editor IDs and timestamps. No existing table or applied migration changes. Row-level security is enabled with no public policies; the server's database owner connection retains access.
- `TeachingDiscoveryService.verifyVideo`: recheck the configured channel, current public/processed/embeddable status and reported age restrictions before saving the source. Eligibility is not copyright or pastoral approval.
- `TeachingReviewsService` and controller: role checks, strict field limits, deduplication and atomic revision-checked note edits.
- Discovery UI: explicit Save review draft action; no write on page load or ordinary discovery.
- `/editorial/teaching-reviews`: bilingual private queue and original-note form; failed saves preserve the form, and unsaved edits require confirmation before switching drafts/reloading/navigating away. Browser history and a killed browser are not durable draft backup.
- Tests: anonymous/member denial, provider revalidation, duplicate/concurrent creation, stale edits, review-only payloads, failure retention and the full cross-member route matrix.

## Operator workflow

1. A MODERATOR or ADMIN opens `/editorial/discover`, requests current results and chooses Save review draft.
2. The server verifies the exact video again and saves a canonical source reference. Saving the same video again returns the existing draft without overwriting notes.
3. Open Private review drafts. Watch the original source and write original review notes. A channel name is not proof of the speaker, rights holder or permission.
4. Record real permission terms and restrictions; unknown permission stays unknown. No checkbox or saved text represents approval or grants rights automatically.
5. Save private notes. Another editor's intervening change produces HTTP 409 and keeps the unsaved form for copying/reconciliation.

The queue shows the 100 most recently edited records. It contains source identifiers/bookmarks and editor-authored fields, not a cache of fetched YouTube titles, publisher names, descriptions, captions, durations, thumbnails or transcripts. The first saved record has empty review fields. No private prayer, reflection or review text is sent to YouTube. Only fixed YouTube metadata endpoints receive the server key and public source identifiers.

This queue is shared among authorized editors. It is not a personal member bookmark library. Editorial records retain creator/last-editor IDs, but this is not a versioned audit history, separate reviewer decision or approved public attribution. Staff should not paste participant/private pastoral information into these notes.

## API

All routes require the current database MODERATOR/ADMIN role and return `Cache-Control: no-store`.

| Route | Input / behavior |
| --- | --- |
| `GET /api/v1/teaching-reviews` | Up to 100 most recently edited private records |
| `POST /api/v1/teaching-reviews` | `{videoId, channelId}` only; revalidates upstream and deduplicates by canonical source |
| `PUT /api/v1/teaching-reviews/:id` | `{revision, title, speaker, attribution, rightsReference, reviewNotes, locale}` only; `locale` is `en` or `fr` |

Publication fields, supplied source URLs and creator/approval overrides are rejected. Changing the source means choosing another discovery result, rather than silently transferring review notes to a different video. Notes remain editable even if discovery/provider access later becomes unavailable; no publication path exists to bypass provider revalidation.

## Release gate and remaining work

Do not merge/deploy this build to production until the migration history/checksums are reviewed, a recoverable backup is confirmed, and the operator approves the named additive migration. The schema guard intentionally refuses readiness if the new migration is missing. Do not disable that guard, reset the database or amend applied migrations.

The migration was rehearsed in an isolated synthetic local PostgreSQL database and on an isolated restore of the production backup; see the dated [release verification](TEACHING_REVIEW_RELEASE_VERIFICATION.md) for migration-history, backup and restore evidence. The production migration remains pending named approval. No production migration, source publication, license assertion or player change is authorized by this document.

Later work: versioned rights/reviewer decisions, explicit approval tied to a specific source/version, provider-specific member publication, and tested web/Expo playback with third-party disclosure and source fallback. Recheck current YouTube/ministry requirements before publishing, embedding or introducing any metadata cache. Raw YouTube URLs must not be allowed through the direct-media host allowlist.

## Verification — 15 November 2026

- Prisma 5.22 schema validation and NestJS production build passed.
- Full API suite: 108 passed, one optional test skipped; persistence/concurrency and HTTP access-isolation tests used an isolated local PostgreSQL database.
- Full web suite: 57 passed. Web and marketing production builds passed.
- All 16 migrations replayed on a fresh synthetic local PostgreSQL database, including the new table with RLS enabled. Applied production migration files were not modified.
- The actual review component was visually checked using a synthetic desktop HTML preview with existing application CSS. This is not authenticated production or physical-device acceptance.
- The named production migration was subsequently approved, applied and verified; code deployment verification follows merge. Mobile playback and public publication remain outside this change.
