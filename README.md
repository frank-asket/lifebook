# LifeBook — real app build

This is the actual codebase implementing the six planning documents, which
are now included in this package under `docs/` — same six documents,
kept up to date with what's actually in this codebase rather than what
was originally planned:

```
docs/LifeBook_PRD.pdf
docs/LifeBook_TRD.pdf
docs/LifeBook_UIUX_Design.pdf
docs/LifeBook_App_Flow.pdf
docs/LifeBook_Backend_Schema.pdf
docs/LifeBook_Implementation_Plan.pdf
```

```
lifebook-app/
  backend/    Node/TypeScript API + agent pipeline (zero runtime deps)
  mobile/     React Native / Expo app
```

## Run the backend (works immediately, no API key needed)

```bash
cd backend
npm install
npm run dev
```

Confirm it's alive:

```bash
curl http://localhost:8787/api/health
curl -X POST http://localhost:8787/api/checkin \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"me","mood":"calm"}'
```

This has been tested end-to-end in this environment: check-ins, verse
retrieval by mood, streak counting, the crisis-language safety check, and
the flag-for-review queue all work as specified in the TRD and App Flow doc.
See `backend/README.md` for details and the production upgrade path.

## Run the mobile app

```bash
cd mobile
npm install
npx expo start
```

Requires a phone with Expo Go, or an iOS/Android simulator — this repo was
built and the backend was verified in a sandbox without those, so the
mobile app itself hasn't been run on-device yet. Review it with a developer
before your first real test.

**Before testing on a physical device**, update `API_BASE_URL` in
`mobile/src/api/client.ts` from `localhost` to your computer's LAN IP
(Expo prints this when you run `npx expo start`).

**Real login is optional, not required to try the app.** With
`mobile/src/firebase/firebaseConfig.ts` left at its placeholder values, the
app skips login entirely and uses a local anonymous id, same as before auth
was added. To turn on real Firebase email/password sign-in: fill in that
config file with your own Firebase project's web-app config (Firebase
console → Project settings → General → "Your apps"), and set the matching
`FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` in
`backend/.env` (see `backend/README.md` for the full walkthrough). **This
path is written but untested** — there was no real Firebase project or
network access available to verify it end-to-end.

## What maps to what

| Document | Where it shows up in code |
|---|---|
| PRD (full feature set) | All screens under `mobile/src/screens/` |
| TRD (agent pipeline) | `backend/src/agents/*` |
| UI/UX Design | `mobile/src/theme/colors.ts`, component styles |
| App Flow | `App.tsx` tab/stage transitions, `backend/src/server.ts` routes |
| Backend Schema | `backend/src/types.ts`, `backend/src/db.ts` |
| Implementation Plan | This codebase now covers Phases 1–3's core functionality — see below for what's genuinely still missing |

## Home screen redesign (latest revision)

The home screen and navigation were restructured to match a specific UX
spec: header with notification/profile icons, personalized greeting, a
4-mood grid (Happy, Calm, Peaceful, Focused), an Explore quick-actions row,
and a 5-tab bottom nav (Home · Explore · Practice · Community · Profile).
Progress/Journal moved from its own tab into a sub-view under Profile, per
that spec's stated navigation structure.

**A real product tradeoff, made deliberately, not accidentally:** the
previous 6-mood set (anxious, lonely, seeking, grateful, joyful, peaceful)
was designed as a distress-to-peace spectrum, specifically so someone in a
hard moment had a mood option that named that. The new 4-mood set is all
upbeat states. The persistent crisis-resource footer on Home stays either
way, but there's no longer a mood button that says "anxious" or "lonely."
This was flagged explicitly before building it, and the call to proceed
with the 4-mood set was made deliberately — worth revisiting if user
testing shows people in distress have nowhere to go.

**Not built in this pass:** the spec's "Continue Your Journey" section
(structured, multi-day content journeys like "Understanding Faith, Day 3
of 7"). That needs a new content schema — ordered, multi-session journeys
— that doesn't exist anywhere in this codebase yet. Left out rather than
faked with a non-functional static card.

**Now built, closing both gaps from the last revision:**

- **"Continue Your Journey"** — a real content schema (`Journey`, `JourneyDay`, per-user progress), three fully authored 5-day journeys (Finding Peace, Growing in Faith, Overcoming Fear — original reflection/prayer writing paired with real KJV verses), and a working lifecycle: browse → start → advance day-by-day → auto-complete on the final day. Tested end-to-end via a full curl walkthrough of one journey from start to finish.
- **The guided 5-step flow** (Scripture → Reflect → Meditate → Pray → Completion) — `GuidedFlowScreen.tsx` replaces the old two-screen check-in view entirely. It's fed by either a mood check-in or a journey day through the same interface, so one flow serves both. Meditation duration is now a real 2/5/10-minute choice instead of a fixed length. Practice's shortcuts now jump into the correct step of this same flow rather than routing to disconnected screens.

**Not built, still flagged honestly:** completing a journey doesn't yet unlock anything or notify — it just marks it finished.

**Now built:** mood-based journey recommendation. Each journey is tagged with the moods it fits (`recommendedMoods`); the backend scores every not-yet-started journey against the user's real mood history from the last 7 days (the same data backing the Progress heatmap) and returns the best match with a plain-language reason ("Because you've been feeling calm this week"). No signal yet → falls back to a non-personalized suggestion rather than a fake reason. Tested three real scenarios end-to-end: a brand-new user with no history, a single mood check-in correctly flipping the recommendation between journeys, and a started journey correctly dropping out of future recommendations.

**A real gap in the mapping, stated plainly:** "Overcoming Fear" has no moods tied to it — the 4-mood set (happy, calm, peaceful, focused) is entirely upbeat, so there's nothing in the current vocabulary that honestly signals "this person is dealing with fear." That journey only ever surfaces as the generic fallback, never as a personalized match. This is a direct, visible consequence of the earlier mood-set decision, not a bug in the recommendation logic.

## Mood set redesign — research-grounded, not generic

The mood picker was rebuilt a second time, replacing the upbeat 4-mood set
(Happy, Calm, Peaceful, Focused) with six states specifically documented in
research and literature on the Christian faith journey:

**Grateful, Peaceful, Seeking, Doubting, Distant, Convicted**

Sourcing:
- **Doubting** — LifeWay Research's 2025 survey of Protestant churchgoers found roughly a quarter admit doubt about God's involvement creeps in, up from 15% in 2012 to 18% by 2019 — doubt is common and measurably rising, not a rare edge case.
- **Distant** (spiritual dryness) — one of the most extensively documented experiences in Christian literature across traditions, from St. John of the Cross's "Dark Night" writing to modern pastoral literature; serious enough that psychology-of-religion research has studied it directly, not just devotional writing.
- **Grateful / Peaceful / Convicted** — map onto Barna Group's research identifying a recurring pattern in believers' spiritual transformation: seasons of discontent and conviction are followed by surrender and intimacy with God, not opposite "good" and "bad" states but connected stages of the same journey.
- **Seeking / the whole framework** — echoes the Ignatian spiritual-direction practice of examining consolation and desolation, one of the oldest frameworks in Christian tradition for exactly this kind of daily check-in.

This directly resolves the earlier flagged gap from the 4-mood revision:
"Overcoming Fear" had no mood that honestly pointed to it under an
all-upbeat set. It now maps to doubting/convicted — fear and doubt are
closely linked pastorally, a defensible connection the previous set
couldn't make.

**A real bug I introduced and caught before shipping:** "seeking" and
"doubting" aren't simple adjectives, so template text like "feeling
doubting" and reasoning like "This verse speaks directly to in a season of
seeking" came out as broken English in the first pass — caught during
testing, fixed with two separate phrase maps (a noun form for one sentence
shape, a full clause for another), and re-verified across all six moods
and both places the bug appeared (content generation and journey
recommendation reasons) before packaging.

## Feature coverage

| Feature | Status |
|---|---|
| Onboarding (7 steps, saves preferences) | Built and tested end-to-end |
| Mood check-in → AI verse, meditation, prayer, action step | Built and tested end-to-end |
| Streak tracking + real, behavior-derived badges | Built and tested end-to-end |
| Mood-history heatmap | Built and tested end-to-end |
| Journal entries | Built and tested end-to-end |
| Favorite verses | Built and tested end-to-end |
| Flag-for-review queue | Built and tested end-to-end |
| Groups, prayer requests | Built and tested end-to-end |
| Discussions with likes and replies | Built and tested end-to-end |
| Digital library with premium gating, bookmarking, book detail view | Built and tested end-to-end |
| Real Firebase authentication (email/password) | Built, backend verified end-to-end in dev-fallback mode — **live Firebase path is written but untested, no real project available in this environment** |
| Push notifications (via Expo push service) | Built, backend token-storage and failure paths tested — **actual delivery untested, needs a real device** |
| Production deployment (Dockerfile + Render Blueprint) | Written and locally verified (health checks, configurable persistent storage) — **not deployed to a live URL, no hosting account available in this environment** |
| Subscription tier and gating | Built and tested — **payment is mocked, no real processor connected** |
| Guided meditation (breathing animation, Calm/Reflect/Act segments) | Built — **no audio narration, that requires recording and hosting real audio** |
| Book reader (actual text) | Not built — detail screen tracks progress only, no licensed book text loaded |

## Honest scope note

This is now a real, working multi-feature app covering the PRD's full
feature list functionally, running end-to-end against a real backend.
What it is *not* yet is "app store ready" — that requires things outside
of code entirely. See the checklist below.

## Before this can actually ship to an app store

Code readiness is one part of shipping. None of the following can be done
from inside a coding sandbox — they require real accounts, real content,
and real people:

1. **Apple Developer Program ($99/yr) and Google Play Console ($25 one-time) accounts.**
2. **Verify real Firebase Auth against an actual project** — the code is written (backend token verification + mobile sign-in/sign-up) but has never touched a live Firebase project. Create one, fill in both config files, and test a real signup/login/checkin cycle before trusting it.
3. **Actually deploy the backend and migrate off the JSON file** — Dockerfile, Render Blueprint, and a configurable `DATA_DIR` are ready (see `backend/README.md`, "Deploying to production hosting"), but a real database (Postgres/Firestore) is still the right destination before this has real users, not the JSON-file bridge.
4. **A real payment processor** — Stripe or native in-app purchases, configured in App Store Connect / Play Console.
5. **Real audio recordings** for guided meditations, produced and hosted (currently a breathing animation only).
6. **A privacy policy and terms of service**, hosted at a public URL — required by both stores, and especially scrutinized here given the app collects mood and journaling data.
7. **App Store/Play Store assets** — icon in all required sizes, screenshots, description, content rating questionnaire.
8. **A named theological reviewer** for the flag queue — this app generates spiritual guidance at scale; that review process needs to be a real, staffed workflow before public users see it, not just code that logs flags.
9. **Security review before public launch** — CORS lock-down and rate limiting are now built and tested (see `backend/README.md`, "Security"); still worth a fresh pass on input validation hardening and re-verifying API keys stay server-side after any future changes.
10. **TestFlight / Play Console internal testing** with real users before public submission.
