# Changelog

## [0.1.1.1] - 2026-10-19

### Fixed
- Keep hydrated sign-in and sign-up panels within small phone viewports, including the embedded authentication card, without hiding overflow or removing content.

## [0.1.1.0] - 2026-10-19

### Added
- Revisit Daily Word sessions, saved reflections and individual step progress in Expo without changing completion.
- Browse published, saved and completed meditations and manage bookmarks and private reflections on mobile.
- Delete a meditation reflection from Expo or web after confirmation while preserving completion and bookmarks.

### Security and validation
- Make mobile marketing preview scroll areas keyboard-focusable with accessible section names.
- Scope exact session reads and reflection deletion to the authenticated member. Preserve drafts on failed writes and discard late mobile callbacks after account changes.
- Cover cross-member isolation, repeated deletion, encrypted persistence, English/French controls and failed-save recovery. Native accessibility acceptance remains separate from component tests and JavaScript bundle exports.

## [0.1.0.0] - 2026-10-19

### Added
- Browse reading plans, enroll, explicitly complete plan days, and edit saved verses in Expo.
- Edit prayers, record answers, and delete entries through the mobile prayer journal.
- Add owner-scoped exact annotation lookup and Daily Word reflection removal without changing the database schema.

### Fixed
- Preserve private drafts on failed saves, isolate mobile screens when accounts change, and keep Daily Word sessions paired with the passage opened.
- Save account language and existing profile preferences safely from mobile settings and onboarding.
- Protect older verse notes outside the capped list, and return valid JSON for passages with no saved annotation.
- Include member-facing ministry and learning-path data in account exports while excluding internal reviewer and referee details.
- Fail reflection-backfill checks when plaintext remains, and enable account persistence tests in CI.
- Align Expo native dependencies and isolate React 18 mobile declarations from React 19 web builds.

### Validation status
- Source and automated checks are covered; iOS/Android device, visual, and accessibility acceptance remain open. This PR does not deploy or change the production database.

## [0.0.3.1] - 2026-10-16

### Fixed
- Display French labels for dashboard actions and saved learning preferences when French is selected in Settings. Existing choices and custom goals are preserved.

## [0.0.3.0] - 2026-10-16

### Added
- Save private Bible notes, bookmarks and colored verse marks, then reopen them from Saved verses.
- Encrypt new Daily Word and meditation reflections, with guarded local backfill rehearsal and staging checks.

### Fixed
- Show an honest empty state when no meditation is published.
- Update the web and API framework dependencies and verify persistence, access controls and responsive layouts.

### Changed
- Strengthen CI, container defaults and migration safeguards without changing the production schema.

## [0.0.2.0] - 2026-10-15

### Fixed
- Restore Bible Study persistence and make the full database migration history reproducible.
- Reconcile the initial migration file with the checksum recorded by the database.

## [0.0.1.0] - 2026-10-15

### Fixed
- Open the Bible Reader from reading plans and resume the selected English or French chapter.
- Restore Bible translation and chapter endpoints and refresh recent reading when revisiting a chapter.
- Resolve the Next.js build failure caused by duplicate inactive reader files.

### Added
- Links to reading plans, progress, and the reading dashboard from Bible Study.
- Continue Reading on the main dashboard.
