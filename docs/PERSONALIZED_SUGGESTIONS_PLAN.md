# Personalized suggestions — plan

Written 18 October 2026; source status updated 24 October. **Web suggestions and account-owned dismissals are implemented.** Goals still map from saved labels in code; stable stored goal codes and reviewed “New to this?” content remain open. Native Today cards merged in PR #70 (`5c38dcd`); identity, EAS configuration and large-text fixes follow separately on `codex/native-release-fixes`, with device acceptance incomplete. The account-dismissal migration was approved and applied on 23 October after checksum review, backup restoration and rehearsal; application release is tracked in PR #68. See [consent and suggestions release scope](CONSENT_AND_SUGGESTIONS_2026-10-23.md) for endpoints, legacy-device import, tests and release gates.

## Where we are

- **Daily Word** is the same for everyone: a rotation of **three** passages by date (Joshua 1:8, Psalm 119:105, James 1:22), varying only by language (`meditation.service.ts`, `dailyWord()`).
- **Onboarding** saves a journey stage, learning goals, preferred formats and `personalizationConsent` on `FaithProfile`. Consent-gated suggestion rules use the saved journey and goals to choose surrounding suggestions; Daily Word stays shared.
- **Goals are stored as English text** ("Learn about Jesus"), not stable codes, and custom goals are allowed. A wording change today would silently break any rule built on them.
- **Content available to suggest:** 3 reading plans (Discover Jesus · 21 days, Foundations of Faith · 14, Walking with God · 30), prayer time, the prayer journal, Ask a pastor (pilot). **None yet:** published Bible studies, learning paths, audio, video.

## Principles

1. **The Daily Word stays shared.** Everyone reads the same passage on the same day. Personalization happens *around* it, never by changing it.
2. **Only with consent.** No consent, no suggestions: the home page looks exactly as it does today.
3. **Plain rules, no AI, no profiling.** Suggestions come from the journey and goals the person chose, never from prayers, reflections or reading behaviour.
4. **Always explained and dismissable.** Each suggestion says why ("Because you chose *Learn about Jesus*") and can be hidden for good.
5. **Few and gentle.** At most two suggestions, no scores, no "you're behind", nothing that resembles a streak.
6. **English and French**, reviewed like any other content.

## What people will see (v1)

On web Home, one quiet card (the equivalent native Today card is source-implemented separately, awaiting device acceptance) titled "Suggested for you" with up to two items:

| If they chose… | We suggest |
| --- | --- |
| Learn about Jesus · or journey Exploring / New believer | **Discover Jesus** reading plan |
| Understand the Bible · Grow in faith | **Foundations of Faith** reading plan |
| Develop consistency | **Walking with God** reading plan, and prayer time at 2 minutes |
| Build a daily prayer habit | The **prayer journal**, and prayer time at 2 minutes |
| Find encouragement | *(gap)* a Psalms of comfort plan, to be written |
| Explore discipleship · Prepare to serve · journey Discipleship / Ministry | *(gap)* Bible studies; **Ask a pastor** once the pilot is live |

Plus, for journeys **Exploring** and **New believer**, a short optional "New to this?" note under the Daily Word explanation that explains a term or idea in plain words (content to write, then pastoral review).

Rules skip anything the person has already started or finished, and anything they dismissed. Preferred formats (Audio, Video) are ignored until such content exists.

## Content gaps (the real bottleneck)

1. **Daily Word library: about 365 reviewed entries** (passage, explanation, question, prayer, action in EN/FR), replacing the three-day rotation. This matters for everyone, with or without personalization. It's pastoral and editorial work, then a data import.
2. **Two or three more reading plans:** Psalms of comfort (encouragement), First steps as a disciple, Serving others.
3. **Publish at least one Bible study** per method already in the app.

## Build steps

| # | Step | Size |
| --- | --- | --- |
| 1 | **Goals as stable codes.** Add codes (`LEARN_JESUS`, `UNDERSTAND_BIBLE`, …) and map existing English labels to them; labels become display-only. Additive migration, through the production runbook. | S |
| 2 | **Rules as a pure function** `suggest(profile, progress, dismissed) → Suggestion[]`, fully unit-tested, no database or network. | S |
| 3 | **`GET /api/v1/me/suggestions`**: returns `[]` without consent; `POST /me/suggestions/:id/dismiss`, stored in a small `SuggestionDismissal` table (additive migration). | S |
| 4 | **Home card** on web and the Today tab on mobile, with "Why this?" and dismiss. Loading, empty and error states; EN/FR; light/dark. | M |
| 5 | **"New to this?" notes** on Daily Word entries, shown only for the two early journeys. Depends on content. | M |
| 6 | **Turn it on:** remove "Coming soon", and update the privacy notice to describe exactly what the switch does. | S |

Steps 1–4 can ship with the existing three reading plans. Steps 5–6 wait for content and review.

## Decisions for the product owner

- Agree that the Daily Word stays shared (recommended).
- Who writes and reviews the 365-entry Daily Word library, and in what order: library first, or suggestions first?
- Is the "New to this?" note wanted, and who reviews it pastorally?
- Is two suggestions the right maximum?

## Native Today follow-up — 23 October 2026

The separate native suggestions batch reuses the same consent-gated API and account-owned dismissal endpoint. It shows at most two cards, explains the saved goal or journey in EN/FR, preserves cards on failed dismissal, ignores late responses after leaving or changing accounts, and refreshes consent/content when Today regains focus. No new local storage of private choices or database migration is added.

A reading-plan suggestion opens its detail directly via a validated `plan` search parameter. Prayer-time suggestions select two minutes before opening the existing shared Daily Word flow; journal suggestions open the private journal. Change preferences opens the existing profile editor.

Verification updated 24 October: **65 mobile/cross-client tests passed** and mobile TypeScript passed; iOS/Android JavaScript bundles exported on 23 October. Tests cover no-consent behavior, exact plan links, two-minute setup, EN/FR explanations, failed dismissal/retry, and account switching. These tests are synthetic checks. Standalone iOS checks on `fdceca8` also verified signed-in suggestions, exact plan navigation and dismissal persistence; the subsequent row correction was visually rechecked in the 24 October compiled iOS simulator build from `b8380a1`. Android installation and VoiceOver/TalkBack remain pending, and no store release is claimed. See the [native acceptance record](NATIVE_SUGGESTIONS_ACCEPTANCE_2026-10-23.md).
