# First EN/FR Bible Study launch — editorial acceptance

The starter study is **already authored** in `apps/web/lib/editorial-starters.ts`. It has an original three-lesson sequence in English and French on Luke 10:25–37. This implementation reuses that source instead of creating duplicate study records. **No starter study is published by these code changes.**

## Review and publishing path
1. In an isolated staging environment, an authenticated MODERATOR or ADMIN opens `/editorial`, selects Bible Studies, and loads the starter for English. Loading is local-only and does not write to the database.
2. Review the Scripture reference, Luke 10:25–37 in context, historical claims, pastoral tone, translation/reference conventions, language accuracy, questions, prayer and safe application. Revise as needed.
3. Save as **DRAFT** first. Verify the public web and Expo catalogs remain empty for this series.
4. Repeat for French, with a fluent reviewer checking idiom and biblical meaning, not relying on mechanical translation.
5. Record the reviewer, date, approved revision and any content/rights decision in the release checklist outside of the app. The editor's existing review confirmation is not an immutable signed approval log.
6. Only after editorial sign-off, use the explicit review confirmation and publish each approved draft. Verify public EN/FR catalogs, lesson details, reader flow, enrolment, completion, reload, other-account isolation and accessibility.
7. Check the mobile reader renders `guidedPrayer` and `application` (the actual API fields), as well as Scripture references, historical context, exegesis, theological observations and reflection questions.

## Release gates
- PR #94 GitHub CI and physical-device EN/FR QA.
- Existing security integration PRs #92–93 reconciled and approved.
- Real staging environment with separate database and Clerk credentials.
- No automatic migration, publication, production seed or user invitation.

Progress measures lesson activity, not spiritual maturity or pastoral calling.
