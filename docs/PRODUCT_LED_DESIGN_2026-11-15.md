# Product-led marketing and web design — 15 November 2026

Prepared for release v0.5.1.0 on `codex/product-led-marketing`. Production rollout is verified separately after merge.

## Changes

- Warm ivory/plum light palette across marketing and shared web tokens; existing dark palette preserved.
- Marketing hero presents labelled source-based Bible Reader and home illustrations with example content. Scripture attribution remains visible.
- Four visual cards explain Meditation, Bible Study, LivingWord and Learning Paths. Status labels reuse the existing content source and do not imply unreviewed resources are published.
- Three-link public navigation, with remaining sections preserved in the footer.
- Primary invitation opens a localized pilot email request to the approved operator address; it does not send an email, create an account, grant access or promise admission. Sign-in stays separate.
- Corrected older church/FAQ contact references and unrestricted-availability wording.
- Web dashboard uses a quieter Scripture card, more readable text and a clearer continuation section. Existing API calls, reading/prayer/progress behavior, locale and theme settings are unchanged.
- DESIGN.md records the runtime token mapping; UX-CONTRACT.md records the existing owners used in this scoped change.

## Verification

- Final marketing and web Next.js production builds passed.
- Prisma validation and NestJS build passed.
- Full web regression suite: 57 passed, zero failed.
- Scoped premium UI static audit: zero findings. Scope: marketing components/app and web dashboard; this is not a whole-project compliance claim.
- Actual marketing production build: English/French navigation, French feature-tab arrow key selection, mobile menu focus and Escape dismissal checked in the browser; no console errors observed.
- Static fixtures generated from the final marketing SSR markup and CSS, with scripts disabled and explicit theme media selection, were measured in browser iframe viewports at 320/390/768/1440 px. All 16 locale/theme/width combinations matched their requested widths and had no horizontal overflow.
- The actual dashboard component was rendered with synthetic data for light/dark layout review; no participant account or database writes were used.
- Text/action colour pair checks: white on plum 6.44:1; muted text on ivory 6.18:1; emphasis text on soft surface 8.37:1; dark primary 7.59:1; dark muted text 8.65:1.
- git diff whitespace check passed. No migration, new dependency, third-party template asset or production configuration change.

## Limits

Authenticated dashboard browser acceptance, physical-device screen-reader listening, reduced-motion runtime emulation and full 200% zoom acceptance remain unverified for this design update. Static theme/viewport fixtures validate layout, not interaction. Existing data loading/error behavior is covered by the unchanged implementation and web regressions, not a new live API failure injection.

Marketing still loads Google Fonts with system fallbacks. Phone illustrations and the four feature graphics are explanatory examples, not screenshots of an approved native store release. Content/legal/pilot launch gates remain separate.

## Release checks — 16 November 2026

- Independent source review found no concrete blocker. The update adds no API route, dependency or migration.
- Fresh Prisma validation, NestJS build and web/mobile regressions passed: 57 web tests and 69 mobile tests. Production builds are also checked by PR CI.
- Local Clerk OAuth returned to the dashboard, but client authentication stayed loading. No authentication settings or credentials were changed to work around this; authenticated acceptance is deferred to the Vercel release build.
- The in-app browser did not apply the requested native zoom shortcut. Full browser 200% zoom and runtime Reduced Motion emulation remain unverified; static responsive/contrast evidence does not substitute for them.
- Pilot email links were inspected, not submitted. No invitations, content publication or participant-data writes were performed.
