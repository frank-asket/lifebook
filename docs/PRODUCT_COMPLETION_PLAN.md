# LifeBook product completion plan

Updated 19 October 2026. This is the implementation checklist for the user's decision to finish the product before discussing deployment. Source inspection is not visual or device acceptance. Existing M3.6–M3.8 work is retained; mobile work previously deferred to M3.9 starts now. No deployment or production database changes are included.

## Completion standard

A feature is complete only when its real UI, API, persistence, ownership checks, English/French copy, loading/empty/error/retry states and meaningful tests work together. Mobile also needs iOS/Android interaction and accessibility acceptance. Mock content, previews and a successful typecheck do not count as complete features. Content approval and licensing remain separate human gates.

## Milestone map and source audit

| Workstream | Source present | Remaining product work | Priority |
| --- | --- | --- | --- |
| M3.6 Bible reader | Web reader and progress APIs; Expo chapter reader, saved verse editor, highlights, plans and explicit day completion | Device acceptance, Scripture search, pagination beyond 200 annotations and exact-verse scrolling; text/license attribution acceptance across clients | High |
| M3.6 Daily Word and meditation | Shared daily Scripture, encrypted reflections, web meditation/history; mobile save retries, draft guards, passage/session pairing and published/saved/completed meditation screens | Meditation reflection deletion, Daily Word history screen; device acceptance for midnight, background and interrupted writes | High |
| M3.7 Prayer Sanctuary | Encrypted journal CRUD, answered notes, consent-gated guided meditation, web journal | Expo journal detail/edit/answer/delete is the first implementation batch below; bulk deletion, guided meditation and consent controls remain | High |
| M3.7 Pastoral care | Directory, private requests/replies, role checks, reporting, safeguarding and retention implementation | Expo end-to-end care and safeguarding journeys; concurrency/abuse review; independently approved pilot content and contacts | High |
| M3.8 Account and settings | Web account controls; themed Expo profile editor and saved account language; server owner checks | Expo export/deletion and full consent management; device verification of failure paths and account switching | High |
| M3.8 Web application design | Shared shell, theme/language providers, responsive components, accessibility pass | Verify every route visually at 320/390/768/1440 px, both themes/languages; connect unfinished journeys; document keyboard/screen-reader results | High |
| M3.8 Marketing | English/French home, responsive navigation, product previews, privacy/terms routes | Audit claims against working features; complete content/detail navigation and legal layouts using approved copy; avoid publishing invented legal text | Medium |
| Discipleship / My Journey | Learning paths, lessons and enrollment models; published paths list; separate functional Bible Study progress | Actual path details, enrollment and persisted lesson progress; web/Expo journey screens; keep progress separate from faith/ministry authority | High |
| LivingWord | Web placeholder; sermon model | Approved-content API and editorial permissions, searchable library, detail/player UI, media validation, playback states and Expo parity; licensed media is required for final acceptance | Medium |
| Security and API quality | Clerk verification, ownership filters, encryption, throttling, safeguarding tests | Private client-state isolation, pagination/resource limits, consent auditing, full HTTP ownership matrix, redacted logs, migration/backup safeguards | High |
| Expo foundation | SDK 52, React 18, Router, Clerk SSO/SecureStore, four tabs, theme, reading controls | Complete feature navigation and account settings; validate session restart, offline/error recovery, accessibility, dynamic text and device builds | High |

## Implementation sequence

1. **Mobile account safety and private journal:** isolate screens by identity; harden the API client; finish prayer CRUD and safe profile editing. Reuse the encrypted API and existing design tokens.
2. **Reader and Daily Word parity:** saved verses/annotations, plans, progress, meditation history and reliable session saving. Add mobile navigation for those real features.
3. **Discipleship end to end:** path/lesson contracts, enrollment, persisted progress and web/mobile layouts. Any schema additions are additive migrations reviewed and tested only on disposable local PostgreSQL.
4. **Pastoral care and account privacy parity:** requests/replies/reporting, mobile account export/deletion, consent controls and session/error recovery.
5. **LivingWord:** approved-content and media backend, editorial authorization, accessible web/mobile library and playback. Keep empty states honest until approved content exists.
6. **Whole-product design and security acceptance:** web/marketing visual matrix, keyboard/screen readers, iOS/Android, API authorization/abuse checks, performance and accessibility evidence.

## First batch — source implemented, device acceptance pending

- [x] Key the Expo navigation tree by Clerk user ID so private screens and asynchronous callbacks are discarded on account changes.
- [x] Harden the mobile API client: one `/api/v1` prefix, release HTTPS requirement, bounded requests, cancellation, non-JSON/204 handling and localized error compatibility.
- [x] Add prayer detail, title/body edits, answered notes, answered/unanswered controls and confirmed deletion using the existing API.
- [x] Keep unsaved detail edits when closing is cancelled; discard only after confirmation.
- [x] Replace the raw Expo onboarding form with themed English/French profile editing; load existing preferences first, block saving on read failure, preserve custom choices and AI consent, and return to a real route.
- [x] Settings reads the account's saved language and persists changes through the profile API before changing the local UI. Failed saves leave the current language intact.
- [x] Stop presenting non-interactive informational rows as buttons.
- [x] Add component and API-client regression tests to CI; keep React Native and screens aligned with the installed Expo SDK.
- [x] Finish final regression and native bundle checks, then record their evidence below.
- [ ] Verify the batch on iOS and Android with test accounts; type/bundle checks alone cannot close this item.

This PR also includes the earlier review fixes: account tests enabled in CI, additional account export fields with privacy exclusions, and plaintext-leftover detection for backfill. See `M3.8_REVIEW_FIXES_2026-10-19.md`.

### Verification notes

- New React 18 component/API-client tests exercise real component state with mocked native primitives and synthetic HTTP data. These are not screenshot tests or tests against a real Clerk account.
- Final checks: **8 mobile tests passed**, **37 web tests passed**, mobile TypeScript passed, Prisma validation and NestJS build passed, and both web/marketing production builds passed. iOS and Android Hermes JavaScript bundles exported successfully to a temporary local directory. This is not a compiled or installed native application.
- The offline SDK compatibility check passes after aligning the two native packages; it is not a substitute for a native build or device test.
- Metro's TypeScript path aliases previously resolved `react` to `@types/react`. Runtime aliasing is now disabled in Expo config; TypeScript keeps the React 18 declarations it needs for this mixed React 18/19 monorepo.
- A clean dependency restoration also exposed Next.js resolving the hoisted mobile React 18 declarations. The pnpm Next 15 package extension now binds its declarations to the web apps' React 19 types. A regression test checks both apps, Next itself and Expo against their own React runtimes.
- The installed Expo SDK 52 compatibility check identified React Native 0.76.0 and screens 4.1.0 as mismatches. They were aligned to 0.76.9 and ~4.4.0. A supported Expo/Clerk major-version upgrade still needs its own compatibility and device acceptance pass; this batch does not silently migrate the SDK.
- iOS Simulator inventory showed no booted device. Native interaction, screenshots, VoiceOver/TalkBack, dynamic text and session restart acceptance remain open.
- The source pass also improved shared mobile controls: translated button labels can wrap, row badges wrap instead of forcing titles out, segmented choices have 44-point targets and support a disabled state, and informational rows do not advertise a button action.

## Explicit exclusions during product work

- Pushing a review branch and opening a PR are authorized. No merge, deployment, production migration, production backfill or retention activation.
- No reset/drop/overwrite of Supabase. Applied migration files are immutable.
- No assertion that draft pastoral/legal content is approved, or that a provider grants media rights.
- No claim of product readiness until the acceptance matrix has real results.

## Second batch — reader and Daily Word parity

Source implementation on 19 October 2026; device acceptance is still open.

- [x] Expo plan catalog, plan details, enrollment, persisted progress and explicit day completion. Opening a chapter does not complete a day. A failed private progress read disables enrollment changes while public readings remain accessible.
- [x] Saved verses screen with language-aware chapter links, note previews and range editing. The list discloses its current 200-record limit.
- [x] Accessible verse/range selection in the reader, bookmark/highlight/private-note editing, unsaved-change prompts, confirmed removal and highlight display in both themes. Verse ranges must exist in the loaded chapter.
- [x] Add an owner-scoped exact annotation endpoint, `GET /api/v1/bible-annotations/passage?locale=…&passageId=…`. The endpoint returns `{ annotation: recordOrNull }` so missing records remain valid JSON over HTTP. The mobile editor uses it instead of assuming a record absent from a capped list does not exist.
- [x] Daily Word waits for successful writes before advancing, keeps drafts on failure, retries only the failed operation, blocks silent continuation after session-load failure and labels partial sessions honestly.
- [x] Pair the opened passage with its original calendar day for the duration of prayer time; reject a newly created session for a different day. Closing with an unsaved reflection prompts first.
- [x] Support explicit clearing of a reflection via owner-checked `DELETE /api/v1/daily-word/sessions/:id/reflection`; completed steps remain intact. No schema change is required.
- [x] Reader metadata retry clears stale translation names; late resume responses are ignored after leaving or changing the chapter. Shared passage labels now include short verse ranges such as `JHN.1.1-3`.
- [x] Record final build/test results below.
- [ ] Complete `docs/EXPO_READER_ACCEPTANCE.md` on iOS and Android.

Use these screens with the matching API source version: older APIs lack the two new endpoints. The mobile editor deliberately displays a read error rather than falling back to an incomplete list. The web editor now checks a seemingly new verse through the same exact endpoint before writing: an older record outside the list blocks the write and offers to load its saved version after confirming draft discard.

Verification: **20 mobile/cross-client component tests passed**, **37 web tests passed**, and **55 API tests passed with one optional live-provider test skipped**. API tests ran against a fresh disposable PostgreSQL 17 database with all 11 existing migrations replayed; it was removed afterwards. Tests include the exact annotation lookup outside the 200-row window, cross-account/locale isolation, HTTP authentication checks, reflection deletion and unchanged step completion. Prisma validation, NestJS build, mobile TypeScript, web and marketing production builds, and iOS/Android Hermes JavaScript exports all passed. No production database or deployment operation ran. Native installation, visual checks and accessibility acceptance remain open.

## Meditation collection continuation — 19 October 2026

- [x] Add Expo Today, Saved and Completed meditation collections with routes from Prayer and You, English/French labels, theme tokens and honest empty/error/retry states.
- [x] Open published content and load the signed-in member's private state before allowing reflection edits, bookmark changes or explicit completion. Reading alone does not complete a meditation.
- [x] Keep reflection drafts on failed writes and while changing bookmarks or completion; confirm draft discard on close and ignore responses after the editor unmounts.
- [x] Reuse existing encrypted meditation APIs; no API contract, dependency or schema change is introduced. Saved/history retain the content's language instead of relabeling it as the current interface language.
- [x] Add component regressions for collections, absent/unavailable content, signed-out access, failed private reads, failed writes, draft guards, bookmarks and explicit completion.
- [ ] Verify native installation, both themes/languages, dynamic text, screen readers, background interruption and account switching using the expanded acceptance matrix.

This continuation does not yet add a Daily Word session history screen or meditation reflection deletion. Completed meditation history inherits the existing API's 100-record cap. Unsent drafts remain in memory and are lost after leaving the editor or OS termination. Published meditation content must already exist; no content is seeded into production.

Verification: **25 mobile component tests** and **37 web tests passed**. Mobile TypeScript, Prisma validation, NestJS build, Next.js web production build and iOS/Android Hermes JavaScript exports passed. Backend source did not change; the API persistence suite was not rerun for this mobile-only continuation. No production database, push or deployment operation ran. Device acceptance remains open.
