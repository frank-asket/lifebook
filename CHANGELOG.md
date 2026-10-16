# Changelog

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
