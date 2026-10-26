# LifeBook pilot program

Prepared 26 October 2026. Franck requested a pilot before supplying the owned domain and public contact address. Those details are deferred for public launch; their absence does not mark the public-launch gates complete.

**Status:** personal-data pilot scope confirmed by Franck; not started. Up to **10 invited adults, of any faith background or no religious belief**. Target start: **26 October–1 November 2026**; exact opening day and participant list are pending. No invitations have been sent. This scope supersedes the earlier synthetic-data recommendation; it does not approve the draft participant notice or complete the technical start checks.

## Confirmed scope and preparation

- Up to 10 invited adults for a proposed seven-day run, with Franck coordinating feedback through `lifebook.meditation@gmail.com`.
- Existing web application: https://lifebook-inky.vercel.app. Use a separate account per tester; never share the owner's credentials. The existing Clerk development configuration is a test environment, not completed production identity setup.
- No domain purchase, billing upgrade, authentication migration or database operation. Render stays Free. Explain that the first API request after inactivity may take 50 seconds or longer; record failures instead of marking them successful.
- Invitations are a participation plan, not a technical access restriction. The prepared production invite-only configuration has not been applied; do not advertise this environment as access-restricted.
- Personal writing is optional. Participants can use a synthetic entry, skip reflection/prayer writing, or choose to record personal information after receiving the reviewed participant notice. Do not ask for medical histories, crisis accounts, third-party names or sensitive disclosures as a test task. Never copy private writing or authentication tokens into feedback.
- Explain before signup that LifeBook is a Christian Scripture/prayer application. Welcome people of any belief without requiring a declaration of Christian faith or a change of belief. Journey/profile choices are self-descriptions, not spiritual scores.
- Review the [EN/FR participant information draft](PILOT_PARTICIPANT_INFORMATION_DRAFT.md) with the operator, resolve its open items and make the reviewed information available before personal-data participation. The draft is not a published privacy notice or proof of participant agreement.
- Explain that daily content is still under review and some libraries are empty. The pilot tests usability and reliability, not pastoral/content approval or emergency support.

## Included tasks

| Day | Tester task | What to record |
| --- | --- | --- |
| 1 | Sign in, open Settings, choose EN or FR, sign out and back in | Successful access, language persistence, first-load delay |
| 2 | Open Daily Word/Moment of Peace; complete five steps with an optional reflection (synthetic or personal by choice) | Save result, completion on dashboard, same passage across entry points |
| 3 | Resume/revisit the daily journey and inspect history | No lost progress, correct day/passage, saved reflection, if one was entered |
| 4 | Read a Bible chapter, switch an available version, save a bookmark/highlight and optional private note | Text/attribution, save and reload, readable verse selection |
| 5 | Start a reading plan and explicitly complete one day | Opening a chapter alone does not complete it; progress persists |
| 6 | Create/edit an optional prayer (a synthetic example is fine) and test its answered state; review privacy choices | Correct persistence, clear errors, no unexpected AI processing |
| 7 | Repeat a main journey on a mobile browser; use keyboard/large text; submit feedback | Overlap/truncation, unreachable controls, time lost, most confusing step |

After each save, reload once and confirm the expected result. On failure, preserve the draft and report the error; do not repeatedly submit an uncertain write. Use each tester's own records only. Engineering's cross-account, export and deletion checks use dedicated disposable accounts separately, not a tester's main account.

## Outside this first run

Published meditation, Bible Study, learning paths and LivingWord catalogs are currently empty. Test their empty-state clarity if useful, but do not promise lessons or recordings, seed production content, or treat empty states as feature acceptance. Expo Bible Study is not implemented. Guided prayer features remain dependent on reviewed topics/provider configuration. Pastoral care is outside this recommended scope until staffing and operational acceptance exist.

Native store submission, physical-device screen-reader sign-off, public launch, production sign-in transition and legacy-reflection/retention operations remain separate. A seven-day web pilot does not close those gates.

## Start checklist

- [x] Franck confirms personal-data participation, up to 10 invited adults of any belief, targeting this week.
- [ ] Franck selects the actual participants and exact opening day within 26 October–1 November.
- [ ] Review and publish the pilot participant/privacy information; confirm the support contact and review how participation/optional processing choices are recorded. Do not label the existing legal overview approved.
- [ ] Configure and verify restricted access on the actual pilot identity environment, including invited/uninvited signup and existing-account behavior. The current development identity has not been approved for personal-data participation; rehearse any required transition without orphaning records.
- [ ] Verify current account isolation, saved private writes, consent controls, export/deletion and recovery on disposable pilot test accounts; confirm operational data-handling/support ownership before collecting participants’ personal writing.
- [ ] Pin the actual deployed candidate and run health/readiness checks. Record known open gates rather than suppressing them.
- [ ] Testers receive the reviewed scope/privacy information, optional-writing instructions, known limitations and support contact.
- [ ] Franck authorizes sending the specific invitations, or distributes the instructions himself.
- [ ] Verify the first tester can sign in and complete one journey (using synthetic text for this engineering check) before inviting the remaining cohort.

Franck has selected personal-data participation. The earlier synthetic-data script is superseded; its completion is not evidence that the personal-data start checklist has passed. Targeting this week does not turn pending checks into successful results.

## Feedback and daily review

Use one record per problem; no private text, passwords, tokens or account exports:

```text
Tester alias:
Date / candidate commit:
Device / browser / language:
Task and steps:
Expected result:
Actual result / visible error:
Can repeat?:
Screenshot with personal information removed:
Impact: blocks task / inconvenient / cosmetic
```

Franck reviews feedback daily. Pause the affected task immediately for suspected private-data exposure, lost writes or wrong-account data; preserve minimal private evidence for investigation. Fix and verify those failures before expanding the cohort. For other failures, record the issue and provide a known working route if one exists.

## Exit decision

At the end, record actual participation, completed/failed tasks, unresolved issues and the next candidate. Continue or expand only after blocking issues are resolved and Franck approves the next scope. Do not claim statistically validated retention, public readiness or pastoral approval from this small usability run.

The next decision after the run is whether to extend the same limited pilot, expand the cohort after verified fixes, or finish the remaining M3.8 public-launch gates. See `FEATURE_READINESS.md`, `WEB_BETA_RELEASE.md` and `M3.8_WEB_BETA_ACCEPTANCE.md`.
