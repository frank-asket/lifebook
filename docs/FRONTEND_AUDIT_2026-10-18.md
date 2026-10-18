# Frontend audit — 18 October 2026

Scope: the web app (`apps/web`) on `main` at `0dbc172` (PRs up to #35 merged), measured against [DESIGN.md](../DESIGN.md). Onboarding was read line by line and exercised in the browser. Every other page was swept from source for the DESIGN.md rules (tokens, single `h1`, EN/FR copy, live regions, error handling). The welcome page, `/pastors`, `/dashboard` and `/onboarding` were checked in the browser at 375px in light and dark themes, with the staging account signed in and nothing saved. The marketing site (rewritten in #35) and the iPhone app (open PR #37) were not audited.

## What is in good shape

- **Tokens:** no hard-coded colours remain in TSX apart from token fallbacks. `--error` and `--success` have dark-mode values.
- **Structure:** one `h1` per rendered state on every page (the files with several `h1`s render them in mutually exclusive branches), and 27 files use `role="status"`/`role="alert"`.
- **Sensitive flows:** prayer, guided meditation, care and safeguarding are bilingual. Their consent copy is specific: it says exactly what is sent to OpenAI and that crisis wording shows contacts instead of a meditation.
- **Errors in care:** care pages translate API errors through `lib/care-errors.ts` and offer retry.
- **Dashboard:** calm and legible at 375px in dark mode.

## Findings

### High

**1. Onboarding can erase a member's saved preferences.**
[`onboarding/page.tsx:189`](../apps/web/app/onboarding/page.tsx) catches any profile-load failure, logs it and carries on with the defaults. For a new member, `GET /me/profile` returns `profile: null` with no error (`apps/api/src/app.module.ts:296`), so a thrown error always means a real failure: network, 401 or 5xx. The form then shows English, no goals and both consents off. **Skip & save** (enabled on every step) or **Finish** sends those defaults with `PUT /me/profile`, which upserts them over the stored language, goals, formats and both consents. Existing members land here on purpose: Settings ("Edit", "Update choices"), Discipleship ("Update my goals") and Guided meditation ("Review your choices") all link to `/onboarding`.
*Fix:* if the load fails, show an error with a retry button and keep both save actions disabled until a load succeeds. Treat `profile: null` as the only "new member" case.

**2. Onboarding is English-only, and choosing Français does not switch it.**
None of its text goes through the language provider: headings, journeys, goals, formats, consent text and buttons. Verified in the browser: after selecting Français, the page stays in English. Goals and formats render raw English strings even though `learningGoalLabel` and `faithJourneyLabel` already exist in `lib/api.ts` and Settings uses them. This is the first screen after sign-up, so a French speaker meets English first.
*Fix:* translate with `tr`/`<L>`, reuse the label helpers, and call `setLanguage` as soon as a language is picked, so steps 2–4 appear in that language.

### Medium

**3. Changing one preference means walking through all four steps.** "Update choices" for the AI consent lands on step 1 (language), but consent is on step 4. *Fix:* accept a `?step=` deep link (`privacy`, `goals`), or make the two consents simple toggles on Settings.

**4. Onboarding step changes are silent.** Focus stays on Continue (verified), so screen-reader users are not told about the new question. There is also no loading state: while the profile loads, the buttons are disabled and default values are shown. *Fix:* move focus to the `h1` on each step change (the pattern `PrayerTime.tsx` already uses) and show `.skeleton` or "Loading your choices…" while loading.

**5. API errors are shown in English everywhere except the care pages.** Ten pages show `err.message` directly: Bible, study detail, plans, my reading, meditation history and detail, Daily Word, prayer and onboarding. `lib/api.ts` returns English sentences. *Fix:* move the translation table in `lib/care-errors.ts` into a shared `lib/errors.ts` and use it on these pages.

**6. Pages with no French at all:** Bible study detail (`/bible/[studyId]`), the welcome page (`/`), sign-in and sign-up framing, and the 404 page. The study detail page also ignores errors when loading completed lessons (`catch(()=>{})`), so completed lessons can quietly appear incomplete.

### Low

7. **Welcome page:**
   - Signed-in visitors are offered "Create an account" instead of being sent to `/dashboard`.
   - Its "Listen" item implies audio content that LifeBook does not offer yet. This is at odds with the honest marketing rewrite in #35.
8. **Onboarding layout at 375px:** the disabled Back button sits alone on its own row, above Skip & save and Continue.
9. **Inline styles are building up:** `meditation-view.tsx` (28), `safeguarding` (13), `care` (12), `care/pastor` (11), `prayer` (10). Each is small, but they bypass the shared classes DESIGN.md asks for, and spacing will drift.
10. **Tests:** four Node test files, no browser tests. Nothing automated would catch onboarding problems like findings 1 and 2.

## Suggested order

Findings 1–4 are fixed (merged with #38). Findings 5 and 6 are fixed on `fix/web-errors-and-french`.


1. Findings 1 and 2 together in one onboarding PR, with a regression test that save stays blocked after a failed load.
2. Findings 3 and 4 in the same PR, or straight after it.
3. Findings 5 and 6: a shared error-translation helper, plus French for the remaining pages.
4. The low-severity items as clean-up.
