# LifeBook Milestone 2 — changes only

Baseline: `lifebook-reviewed-updated.zip` (the previous reviewed project).

Only three code files differ between that baseline and Milestone 2:

- NEW `apps/api/prisma/seed-meditations.cjs` — seeds 14 unpublished meditation drafts.
- UPDATED `apps/web/app/dashboard/page.tsx` — today's meditation from `/meditations/today`, no sample verse; Bible Study navigation.
- UPDATED `apps/web/app/bible/[studyId]/page.tsx` — displays completed lesson progress.

No environment files, Prisma schema, dependencies, configuration, or unrelated source files are included.

## Safest application (from project root)

1. Commit or back up your current work.
2. Download `lifebook-milestone-2-only-changes.patch`.
3. Run `git apply --check /path/to/lifebook-milestone-2-only-changes.patch`.
4. Only if it passes, run `git apply /path/to/lifebook-milestone-2-only-changes.patch`.
5. Review `git diff`, run your project's builds and tests.

This patch is based on the previous reviewed project; if your current VS Code files have diverged, the check may fail. Do not force apply. Share your current files to produce a precise patch against your working tree.

The ZIP contains the full contents of only those three files as an alternative, but copying full files can overwrite local edits; prefer the `.patch`.

The seed script does not publish meditations automatically. No database changes have been executed.


French UI addition (2026-10-12): language selector EN/FR in desktop/mobile navigation, persisted in browser localStorage; French translations for navigation, dashboard, Bible Study library, daily meditation page, and account settings. The meditation API locale now follows selected language. Other feature screens and backend content are not yet fully translated. No database changes.
