# Content workspace — first authoring batch

Implemented locally on 26 October 2026. No migration, production content write or deployment was performed by this batch.

## What editors can do

An existing LifeBook MODERATOR or ADMIN opens Settings → Content workspace (`/editorial`). Ordinary members receive an access explanation; the API independently checks the database role on every request. No new role or user privilege is granted.

The workspace has Meditations, Bible Studies and Learning paths, plus links to the existing LivingWord editor and read-only teaching discovery (`/editorial/discover`). English/French interface labels follow Settings. Meditation/study records have a content language. Learning paths currently share one catalog; translated courses use distinct titles/slugs rather than an invented locale field.

1. Create a blank draft or load starter copy into the form. Loading starter copy is local only and never saves or approves it.
2. Edit the title, stable slug and content. A meditation has a UTC date, Scripture reference, explanation, questions and prayer. A study has its method/level and ordered lessons with context, explanation, questions, prayer and application. A learning path has a description and ordered text/activity lessons.
3. Save as draft. Drafts stay out of public catalogs. Saving an already published record as a draft explicitly unpublishes it; the UI asks first.
4. Review the actual wording, Scripture context and rights. Confirm that review for the current version and choose Save and publish. Any form change clears the confirmation. This does not imply Franck or a pastor approved the starter copy already.
5. Future-dated meditations become eligible on their scheduled UTC day. Direct member detail, bookmarks/history and search exclude future schedules/drafts. Existing completion/bookmark/reflection rows remain stored when the content is hidden.

Private draft details are not returned in the public catalogs. Failed saves retain the form. Sidebar/link navigation, library switching and reload have unsaved-change prompts. Browser history navigation and a killed browser are not a durable draft backup; drafts are held in memory until saved.

## Starter content

- Seven existing original meditation pairs (EN/FR) are reused from a canonical `apps/api/content/starter-meditations.json`. The existing operator seed reads this same file; its write behavior was not run or promoted to a safe production publisher.
- One original three-lesson Bible Study in each language walks through Luke 10:25–37: observing, interpreting in context and responding wisely.
- One short learning path in each language provides the corresponding attentive-reading activities. Path content is text; typed cross-feature activity references and automatic cross-feature completion are not implemented by this batch.
- LivingWord keeps its existing role-protected editor, approved-host/media rules, rights reference, attribution, transcript and explicit publication. Real permitted recordings must be supplied; no licensed media or invented rights claim is bundled.

All starter text is a draft for pastoral review. It contains references, not copied translation text. The editor does not populate the separate Daily Word dated library. No content was inserted into Supabase.

## Persistence and API

The existing Meditation, StudySeries/StudyLesson and LearningPath/Lesson models are reused. No migration is needed. The new role-protected API is:

- `GET /api/v1/editorial/:kind`: up to 100 summary records.
- `GET /api/v1/editorial/:kind/:id`: current full record and revision.
- `POST /api/v1/editorial/:kind`: create a draft or explicitly reviewed publication.
- `PUT /api/v1/editorial/:kind/:id`: save a complete form using the loaded revision.

`kind` is `meditations`, `studies` or `paths`. Bodies are validated by kind, with strict field allowlists, text/array limits, real dates, publication confirmation and lesson identity checks. There is no delete endpoint. Public member APIs are reused after publication.

Saves are atomic serializable transactions. A hash of the loaded record and lessons acts as the expected revision; stale or concurrent edits return 409 rather than silently overwriting another editor. Duplicate slugs also return 409. Keep/copy your draft before loading the newer record to reconcile a conflict; there is no automatic merge.

Existing lesson IDs and order must remain intact, so completion records are not deleted or reassigned. Editors may edit existing lessons or append new ones. Removing/reordering already saved lessons is intentionally unsupported here. New unsaved trailing lessons can be removed from the form.

## Limits and next implementation

This is an explicit review-and-publish workflow using the current role model, not a separate author/reviewer approval queue. The review confirmation is enforced on each publishing request, but existing models do not retain a per-version reviewer audit or prior content versions. Those require a separately reviewed additive schema change; do not imply the current confirmation is a signed approval history.

The existing LivingWord editor has its previous persistence behavior; this batch links to it rather than silently changing its API. This workspace's revision protection does not extend to that separate editor yet.

Remaining product work includes Expo Bible Study, typed cross-feature learning-path activities, content/review history, separate translation discovery for paths, permitted recordings and installed-device/media/accessibility acceptance. Content-dependent public catalogs stay empty until an authorized reviewer actually saves/publishes approved records.

## Verification — 26 October 2026

- Prisma validation, NestJS build, web and marketing production builds, and mobile TypeScript passed.
- Full API suite on the existing disposable loopback database: **97 passed, 1 skipped**. This includes the new editor's input limits, role checks, atomic draft/publication, stale/concurrent edits, lesson ID/completion preservation and hidden draft/future meditation responses. The cross-member HTTP route matrix includes all four new editorial routes.
- Full web suite: **51 passed**, including starter payloads, no write on draft load, publication review reset, failed-save retention, cancelled navigation and ordinary-member denial. Full mobile suite: **69 passed**.
- A pre-existing resume-order fixture failed once because rapid writes shared millisecond timestamps. Its assertion now uses explicit distinct fixture timestamps; the complete suite then passed. No reading service behavior was changed for that test.
- English meditation and French study layouts were inspected in an isolated browser fixture generated from the real component and production CSS with a synthetic editor session. This is not authenticated full-app or physical-device acceptance. Proof: `/tmp/lifebook-editorial-workspace-preview.jpg` (outside Git).
- No database migration/schema change, production seed, content publication, role grant, invitation or deployment was performed. The local test container was stopped with data retained after verification.


## Research-based content follow-up — 26 October 2026

A separate [EN/FR first-week content pack](content/EVANGELICAL_PILOT_CONTENT_PACK.md), [primary-source/rights register](content/EVANGELICAL_SOURCE_REGISTER.md) and [sermon-discovery implementation and remaining design](content/SERMON_DISCOVERY_API_DESIGN.md) are prepared for review. They distinguish original AI-assisted LifeBook drafts from external ministry resources; no author/reviewer/permission is inferred. The pack is documentation, not an importer or automatic change to Daily Word. Inline citation fields/UI and provider-specific YouTube playback still need implementation before those external resources can appear in LifeBook. Nothing was published or downloaded.


## Read-only teaching discovery — v0.4.0.0

`/editorial/discover` is an opt-in MODERATOR/ADMIN tool backed by `/api/v1/teaching-discovery/sources` and `/api/v1/teaching-discovery/videos`. Configure server-only `YOUTUBE_API_KEY` and `YOUTUBE_APPROVED_CHANNEL_IDS` only after verifying the channel identities and intended use. Both are blank by default; this release approves no ministry and enables no production integration.

The tool shows current metadata and original-source links from configured channels, up to 12 unique videos per page. Responses are not cached or stored as candidate records. Reported eligibility, captions and regional restrictions still need real review. Nothing imports, publishes, downloads, embeds or transcribes a sermon. No member prayer/reflection text is sent to YouTube. Provider-specific playback, source/rights publication fields, persisted review decisions and recommendations remain future work. See the discovery document for configuration, API behavior and limits.

## v0.4.0.0 PR verification

The combined content/discovery release passed Prisma validation, NestJS, web and marketing builds, mobile TypeScript, **98 API tests (1 optional test skipped)**, **54 web tests** and **69 mobile tests**. API persistence/permission tests ran against the existing disposable loopback database. A local Console Ninja extension kept the standalone discovery test process open after its assertions passed; the final local API run used Node's `--test-force-exit`. CI retains the ordinary serial test command and must pass independently. No live YouTube API key/channel check, embedded playback or production data operation was performed. Discovery remains disabled by default.
