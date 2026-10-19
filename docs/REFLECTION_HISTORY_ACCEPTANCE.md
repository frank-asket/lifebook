# Daily Word history and meditation reflection controls

Source continuation: 19 October 2026. **Device acceptance has not been run.** Use this API source version with a separate local/staging database and synthetic test accounts. Do not use production private data, deploy migrations, or reset Supabase.

## Implemented journeys

- **You → Daily Word history:** load up to 100 saved sessions, show their calendar day, partial/completed status and completed-step count, and open the exact session. Viewing never creates a session or completes steps. Calendar-day labels use UTC to preserve the stored journey date on devices west of UTC. The history does not substitute today's Scripture for an older session.
- **Prayer / You → Meditations:** today's published meditation in the interface language, saved meditations, completed history and detail. Missing publication is an empty state; unavailable service is an error with retry. Saved content retains its language label. Completion history inherits the existing 100-record limit.
- **Reflection detail:** read saved state before enabling editing; retain drafts on write failure; serialize writes; disable close while saving; confirm draft discard when leaving; ignore responses after unmount/account-tree replacement. Drafts stay in memory, not device storage.
- **Reflection deletion:** explicit confirmation removes only the member's reflection. Daily Word steps, meditation completion and bookmarks remain. Cancel or failure leaves the saved reflection and draft intact. Bookmark/completion actions do not save or discard a draft.
- **Web meditation:** confirmed deletion, success/error feedback, draft retention on failed deletion, and truthful encrypted-reflection copy.

## Additive API changes

- `GET /api/v1/daily-word/sessions/:id`: authenticate, query by both internal user ID and session ID, include steps/reflection, decrypt only the owner's reflection, and return 404 for another member's session. No write occurs.
- `DELETE /api/v1/meditations/:id/reflection`: authenticate and delete by internal user ID and meditation ID. Return `{ deleted: count }`, with zero for a missing own reflection. Repeated deletion is safe. A member can delete their own reflection after the meditation is unpublished; no other member's record is affected.

No schema or dependency change is required. Older deployed APIs do not have these endpoints; clients fail visibly rather than falling back to incomplete data. No production migration, backfill or retention operation belongs to this batch.

## Native/manual matrix — pending

Run on iOS and Android, English/French, light/dark, small phone and enlarged text, with VoiceOver/TalkBack. Record commit, device/OS, tester and outcome without private text.

| Check | Expected |
| --- | --- |
| Open history signed out | Sign-in explanation; no private request or data |
| Empty history, API unavailable, retry | Distinct empty/error states; retry recovers |
| Open completed and partial past days | Exact original date, saved reflection and step states; progress unchanged |
| Open day while device is west of UTC | Stored calendar day remains unchanged |
| Edit, fail save, cancel close, retry | Draft remains; successful retry persists after reopening |
| Delete, cancel, fail confirmed deletion, retry | Cancel/failure retains text; success removes only reflection |
| Bookmark/complete with dirty meditation draft | Draft remains dirty; no silent reflection save |
| Double press Save; close during write | One request; close disabled until response |
| Switch test accounts during read/write | No old private screen/state or late callback in new account |
| No published meditation; API failure | Empty publication and service failure have distinct messages |
| Reopen saved/completed meditations | Persisted bookmark/completion and content language are correct |
| Web delete in English/French, keyboard | Confirmation, error and success are usable; draft kept on failure |
| App termination with unsent draft | Loss is accurately disclosed; no claim of offline recovery |

Native installation, visual checks and screen-reader acceptance remain open. API persistence tests use disposable loopback PostgreSQL; component tests mock native primitives and do not establish device usability.

## Automated verification — 19 October 2026

- Mobile/cross-client suite: **32 passed**, including web confirmed-delete behavior in the component harness.
- Web suite: **37 passed**.
- API suite: **55 passed, one optional live-provider test skipped**, zero failures. Existing migrations were replayed only into a fresh disposable local PostgreSQL 17 database; it was stopped and removed after the checks.
- Prisma validation, NestJS build, mobile TypeScript, Next.js web production build, and iOS/Android Hermes JavaScript exports passed.
- No production database access, migration deployment, push or application deployment ran in this batch.
