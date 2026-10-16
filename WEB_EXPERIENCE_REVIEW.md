# Web experience refinement — 16 October 2026

## Root causes

The bottom navigation had `display:flex` inside the mobile breakpoint but no default `display:none`. On desktop it therefore rendered as a normal navigation block. The previous audit checked document overflow and landmarks without explicitly asserting navigation visibility; this audit includes that assertion at all four widths.

Moment of Peace contained a static Psalm 46:10. The dashboard and Daily Word used the daily content endpoint independently, and the dashboard used the server's UTC date while Daily Word used the reader's local date. These could disagree around midnight.

## Changes

| Area | Before | After |
| --- | --- | --- |
| Navigation | Mobile tabs also rendered on desktop | Hidden by default; enabled only at 760px and below; desktop sidebar retained |
| Daily passage | Static sidebar verse and separate date/request handling | One shared daily-passage provider for sidebar, dashboard and Daily Word; same locale and local calendar date; refresh on day change/focus; shared retry and no unrelated fallback |
| Language | Global language selectors in desktop/mobile navigation and meditation; Bible selection changed global language | Application language saved from Settings with the existing partial profile update; device fallback and saved account preference; no navigation or meditation selector; Bible language remains an independent reading choice |
| Settings | Read-only language label and dense account cards | Dedicated language/appearance section, clear save/loading/success/error feedback, responsive grouping and readable privacy/account sections; language-only updates preserve goals and consent |
| Continue your spiritual journey | Five nearly identical list rows | Numbered, illustrated five-step cards with descriptions and a continuation action; compact stacked mobile layout; all step links preserved |
| Dashboard | Basic passage card and limited preference recovery | Scripture-focused typography and spacing, shared daily content, retry for failed preferences, clearer secondary hierarchy |
| Bible reading landing | Plain vertical links | Three clear entry cards for reading, plans and progress, plus continuation |
| Meditation | Incomplete French labels and inconsistent history/detail states | Expanded French UI, history retry, account-aware history loading, localized dates, stable detail heading and retry |
| Prayer/LivingWord | Primarily English interface despite French preference | French section labels, explanatory copy and empty states; existing local-draft/forthcoming-library behavior preserved |
| Shared pages | Inconsistent search surfaces, action links and dark hero/progress colors | Theme-aware controls, consistent section spacing and reading actions, responsive settings and journey grids |
| Daily Word recovery | Account changes could leave stale draft state; authenticated session failure allowed unsaved continuation | Reset session/draft per account/day, disable completion until session is ready, retry loading without using save-error retry to discard drafts |

No API, schema, migration, dependency or production authentication configuration changes. Existing feature destinations, prayer privacy behavior and account role display are retained.

## Review and verification

Reviewed the shared shell and all web routes, including Dashboard, Daily Word, Bible studies/detail, reading dashboard/reader/plans/detail/progress, daily meditation/detail/history, prayer, LivingWord, discipleship, onboarding, Settings and auth entry pages.

- 80 browser layout checks passed: 20 routes at 320, 390, 768 and 1440 pixels. Assertions include navigation visibility, absence of navigation language controls, document overflow, unclipped primary content, one main landmark and one primary heading.
- 28 interaction/dark-mode checks passed: language saving and reload, failed-save recovery, unchanged consent, English/French passage consistency, journey deep links, independent Bible language, mobile More/Escape behavior, desktop visibility, 18 dark layouts, and daily-passage error/retry recovery.
- Five Node regression tests passed, including local-day/midnight/year-boundary selection.
- Web and marketing production builds, NestJS build, Prisma validation and TypeScript checks passed.
- Screenshots inspected for the refined dashboard and Settings. Browser evidence uses synthetic identities/content in an isolated local copy and an in-memory fixture API. No production personal data, prayer processing or database writes were used.

Evidence: `/tmp/lifebook-refinement-layout-results.json`, `/tmp/lifebook-refinement-interaction-results.json`, and `/tmp/lifebook-refined-*.png`. Authenticated production persistence and native-device testing remain outside this browser fixture verification. Production Clerk's existing development-key configuration remains a separate operational concern.
