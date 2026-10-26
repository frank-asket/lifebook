# LifeBook product completion plan

Updated 26 October 2026. This checklist distinguishes source implementation, available content and launch/device acceptance. The current source audit below supersedes the historical batch notes. Existing M3.6–M3.8 work is retained; native-store distribution remains separate.

## Current milestone — 26 October 2026

**M3.8 launch readiness is active and incomplete.** The current source release prepares a web-first invited beta; deploying it does not approve access for real users. See the [beta procedure](WEB_BETA_RELEASE.md), [acceptance evidence](M3.8_WEB_BETA_ACCEPTANCE.md), and [M3.8 launch gates](M3.8_LAUNCH_PLAN.md). Those documents include the legal and pastoral review packets, production identity requirements and the owner's decision to retain Render Free.

M3.6/M3.7 feature source is present, but remaining device/provider/content acceptance still applies. Native-store distribution and its installed-device, accessibility, signing and submission gates remain separate; the historical implementation rows below do not close them.

## Completion standard

A feature is complete only when its real UI, API, persistence, ownership checks, English/French copy, loading/empty/error/retry states and meaningful tests work together. Mobile also needs iOS/Android interaction and accessibility acceptance. Mock content, previews and a successful typecheck do not count as complete features. Content approval and licensing remain separate human gates.

## Current feature audit — 26 October 2026

**All features are not complete.** A built screen, an empty working API and an approved, usable library are different states. See [how the core experiences work](FEATURE_READINESS.md) for their actual behavior, content dependencies and next actions.

| Workstream | Source implemented | Remaining before acceptance |
| --- | --- | --- |
| Bible reader | Web/Expo reading, version selection, search, bookmarks/notes/highlights, plans and persisted progress | Device/provider attribution acceptance; capped saved-annotation list and exact-verse behavior require verification |
| Daily Word / Moment of Peace | One shared dated passage, five steps, private reflection, saved progress/history and web/Expo journeys | Thirty approved dated entries for the actual launch window, production-identity and device tests; currently uses legacy fallback entries |
| Published meditations | Web/Expo Today, saved/completed collections, private reflection edit/delete and explicit completion; local draft/schedule editor | No eligible published EN/FR meditation at live inspection; editorial approval/publication and device acceptance |
| Bible Study | Web catalog, four study methods, lesson detail, enrollment and private completion API; local role-protected series/lesson editor | No published EN/FR series at live inspection; no Expo study screen; first reviewed lessons and end-to-end content acceptance |
| Prayer Sanctuary | Web/Expo journal, answered state, guided meditation, per-prayer AI choice, consent controls and deletion | Reviewed prayer topics and provider/rights checks; guided features remain gated in production; device acceptance |
| Pastoral care | Web/Expo directory, requests/replies/reporting, web safeguarding and application review, API ownership/retention controls | Staffed approved pilot, verified crisis contacts, working notification ownership, verified retention schedule and device acceptance |
| Account/settings | Web/Expo profile/language, privacy choices, export/deletion; atomic consent history | Final production Clerk identity/isolation/export/deletion tests, legal approval and device acceptance; large mobile exports use the web download |
| Discipleship / My Journey | Web/Expo path detail, enrollment and persisted lesson completion; race-safe API; local course/lesson editor | No published path at live inspection; approved course content and device acceptance |
| LivingWord | Search/pagination, approved-content API, web moderator/admin editor, web/Expo audio/video players with transcript and retry | No visible EN/FR teachings at live inspection; approved media hosts, rights, transcripts and real playback/device acceptance |
| Suggestions | Consent-gated web/Expo suggestions, account-owned dismissals and consent auditing | Device acceptance and broader goal content; no spiritual scoring |
| Web/marketing | Responsive shell, EN/FR, themes, web visual/accessibility pass; bilingual draft legal pages | Final legal copy, physical browser/screen-reader checks and remaining content-dependent detail checks |
| Security/data | Session/ownership checks, encrypted private writes, log redaction, schema readiness, integration tests | Paused legacy-reflection backfill; fresh backup/rehearsal/approval before data operations; operational retention proof |
| Native distribution | EAS profiles and compiled iOS simulator candidate; source parity for most features | Android testing remains pending by owner choice; installed-device, spoken accessibility, signing/store acceptance; Bible Study parity missing |

The public content survey reads endpoints only, not private database rows. Empty results do not prove no drafts exist. `launch-check.cjs` now reports content availability separately from the nine launch gates and requires explicit content acceptance or scope exclusions for the beta.

## Historical implementation sequence

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

## Consent auditing and Suggestions v2 — 23 October 2026

Continued the unfinished branch after the pagination and log-redaction handoff. Source now records atomic consent preference transitions, persists account-owned suggestion dismissals, migrates earlier browser choices, includes both in account exports and deletes them with the account. Web failures preserve cards and allow retry; account switching discards previous state. Existing mobile switches reuse the profile endpoint.

See [scope, migration gate and verification](CONSENT_AND_SUGGESTIONS_2026-10-23.md). The additive migration is **not approved or applied to production by this work**. Earlier milestone rows are historical source snapshots, not a declaration that those features are still missing or that native/launch acceptance is complete.

## Content authoring batch — 26 October 2026

The local [content workspace](CONTENT_WORKSPACE.md) adds role-protected web/API drafting, explicit review-confirmed publication, revision/conflict checks and lesson edits/appends that preserve completion IDs. Seven original meditation pairs and a three-lesson study/path per language can be loaded locally as drafts. No migration, seeding, production publication or role grant ran. LivingWord reuses its existing editor; recordings/rights and its separate concurrency behavior remain open. Expo Bible Study, typed cross-feature path activities and versioned editorial review history remain next work.
