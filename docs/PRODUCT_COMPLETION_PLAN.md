# LifeBook product completion plan

Updated 19 October 2026. This is the implementation checklist for the user's decision to finish the product before discussing deployment. Source inspection is not visual or device acceptance. Existing M3.6–M3.8 work is retained; mobile work previously deferred to M3.9 starts now. No deployment or production database changes are included.

## Completion standard

A feature is complete only when its real UI, API, persistence, ownership checks, English/French copy, loading/empty/error/retry states and meaningful tests work together. Mobile also needs iOS/Android interaction and accessibility acceptance. Mock content, previews and a successful typecheck do not count as complete features. Content approval and licensing remain separate human gates.

## Milestone map and source audit

| Workstream | Source present | Remaining product work | Priority |
| --- | --- | --- | --- |
| M3.6 Bible reader | Web reader and progress APIs; Expo chapter reader, saved verse editor, highlights, plans and explicit day completion | Device acceptance, Scripture search, pagination beyond 200 annotations and exact-verse scrolling; text/license attribution acceptance across clients | High |
| M3.6 Daily Word and meditation | Shared daily Scripture, encrypted reflections, web meditation/history; mobile save retries, draft guards, passage/session pairing, session history and meditation collections | Native device acceptance for midnight, background and interrupted writes | High |
| M3.7 Prayer Sanctuary | Encrypted journal CRUD, answered notes, consent-gated guided meditation, web journal | Expo journal detail/edit/answer/delete is the first implementation batch below; bulk deletion, guided meditation and consent controls remain | High |
| M3.7 Pastoral care | Directory, private requests/replies, role checks, reporting, safeguarding and retention implementation | Expo end-to-end care and safeguarding journeys; concurrency/abuse review; independently approved pilot content and contacts | High |
| M3.8 Account and settings | Web account controls; themed Expo profile editor and saved account language; server owner checks | Expo export/deletion and full consent management; device verification of failure paths and account switching | High |
| M3.8 Web application design | Shared shell, theme/language providers, responsive components, accessibility pass; **visual matrix done 19 Oct** (`M3.8_WEB_VISUAL_MATRIX.md`): 27 routes × 4 widths, EN/FR, light/dark, all clean after fixes | Screen-reader results; the three data-dependent detail routes once pilot data exists | High |
| M3.8 Marketing | English/French home, responsive navigation, product previews, privacy/terms routes | Audit claims against working features; complete content/detail navigation and legal layouts using approved copy; avoid publishing invented legal text | Medium |
| Discipleship / My Journey | Learning paths, lessons and enrollment models; published paths list; separate functional Bible Study progress | Actual path details, enrollment and persisted lesson progress; web/Expo journey screens; keep progress separate from faith/ministry authority | High |
| LivingWord | Web placeholder; sermon model | Approved-content API and editorial permissions, searchable library, detail/player UI, media validation, playback states and Expo parity; licensed media is required for final acceptance | Medium |
| Security and API quality | Clerk verification, ownership filters, encryption, throttling, safeguarding tests; **full HTTP ownership matrix** (`cross-member-access.test.cjs`, 19 Oct: all 98 routes classified, member B blocked on every route naming A's records, A's rows unchanged); **migration safeguard** (health 503 while the schema is behind, PR #61) | Private client-state isolation, pagination/resource limits, consent auditing, redacted logs | High |
| Expo foundation | SDK 57, React 19.2, current Clerk SDK/token cache, EAS test profiles, four tabs, theme, reading controls | Complete feature navigation and account settings; validate session restart, offline/error recovery, accessibility, dynamic text and device builds | High |

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

- The user has now authorized pushing, merging and deploying reviewed source changes. Production migrations still require migration-history review and a confirmed recoverable backup; no backfill or retention activation is included.
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


## Daily Word history and reflection controls — 19 October 2026

- [x] Expo Daily Word history with partial/completed progress, UTC-stable stored calendar dates, exact session reads and existing private reflection editing/deletion.
- [x] Restore the unpublished local meditation continuation against merged main: Today/Saved/Completed collections, published detail, bookmarks, explicit completion and private reflection editing.
- [x] Add owner-scoped meditation reflection deletion to API, Expo and web, preserving completion/bookmarks. No schema change is introduced.
- [x] Keep drafts on failed writes, confirm deletion/discard, serialize mobile writes, block blank editing after private-read failures and ignore callbacks after account-tree unmount.
- [x] Cover persistence, cross-member isolation, repeated deletion and deleting an own reflection after content is unpublished; add mobile/cross-client tests for English/French, failures and account-unmount behavior.
- [ ] Run the native and web manual matrix in [REFLECTION_HISTORY_ACCEPTANCE.md](REFLECTION_HISTORY_ACCEPTANCE.md). Automated component tests and JavaScript exports are not device acceptance.

The history screens show at most 100 sessions/completions; pagination remains open. Drafts remain in memory only. Published meditation content must already exist; no production content is seeded. Use the matching API source version for the new exact session and meditation-reflection deletion endpoints. Source implementation did not access production. The user subsequently authorized a reviewed production release; no production schema migration, backfill or retention activation is needed.

Verification: **32 mobile/cross-client tests, 37 web tests and 55 API tests passed**, with one optional live-provider API test skipped. Prisma validation, NestJS build, mobile TypeScript, Next.js web build and iOS/Android Hermes JavaScript exports passed. API fixtures ran only against a disposable local PostgreSQL 17 database with existing migrations replayed; it was removed afterwards. Native installation, visual and accessibility acceptance remain open.


## Native build readiness — 19 October 2026

- [x] Upgrade to Expo 57 / React Native 0.86.3 / React 19.2.3 using Expo compatibility metadata; migrate deprecated `@clerk/clerk-expo` to `@clerk/expo` 4.13 with official secure token cache.
- [x] Preserve existing Clerk identity and API settings; verify the existing native environment and Google strategy.
- [x] Configure linked EAS project, internal Android APK and iOS simulator profiles, managed signing, scoped preview/development public configuration, build archive exclusions and fail-closed store release configuration.
- [x] Pass 21 Expo Doctor checks, 41 mobile component/build-config/auth tests after integrating the latest main, mobile TypeScript, 37 web tests, Prisma validation and API/web/marketing builds.
- [ ] Accept corrected installable build results and complete signed-in native/device/accessibility testing; see [Native build readiness](NATIVE_BUILD_READINESS.md).

This SDK migration is isolated on `codex/native-readiness`; it is not a production rollout. Earlier SDK 52 verification notes above describe the historical source batches. The standalone iOS build compiled, installed and loaded Today’s Word and the Bible; dark appearance and French settings were exercised. Google SSO reached its credential form. Android remains queued, and authenticated flows and screen-reader acceptance remain pending.

## Native screen design pass — 19 October 2026

Reviewed all 12 mobile routes and editor implementations. Improved shared touch targets, large-text adaptation, tablet reading widths, safe-area/keyboard handling, screen-reader labels, motion preferences, chapter retry and authentication error states. See [screen review and remaining release gates](MOBILE_DESIGN_REVIEW_2026-10-19.md). Source and bundle checks do not complete native visual, authenticated or screen-reader acceptance. This work is isolated on `codex/mobile-design-quality`.
