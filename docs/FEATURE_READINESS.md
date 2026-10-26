# How LifeBook works and what is ready

Source/public-endpoint audit: 26 October 2026. The local [content workspace batch](CONTENT_WORKSPACE.md) now adds draft authoring/publication for meditations, studies and paths; it is not deployed and does not change the public content counts below. This is an engineering inventory, not content approval or launch approval. No private data was read or changed for the public content survey.

## Are all features done?

No. Most core web/API features and many Expo equivalents are implemented. Launch acceptance is incomplete, several published libraries are empty, and Expo Bible Study is missing. The [current completion table](PRODUCT_COMPLETION_PLAN.md#current-feature-audit--26-october-2026) separates those issues from historical implementation batches.

| Experience | Public content observed | Meaning |
| --- | --- | --- |
| Daily Word / Moment of Peace | Live English KJV and French Darby passages; prior readiness check passed | The daily journey works. Dated draft entries are not approved; the legacy fallback rotation remains active. |
| Published meditations | EN/FR `/meditations/today`: 404 | No eligible published meditation, rather than evidence that the feature's code is absent. |
| Bible Study | EN/FR `/bible-studies`: 200, empty list | No published series available to members. Drafts, if present, are hidden. |
| LivingWord | EN/FR `/livingword`: 200, zero teachings | No publicly visible teaching meeting the publication/media rules. This does not diagnose whether drafts or host configuration are missing. |
| Learning paths | `/paths`: 200, empty list | No published discipleship course available. This is a different catalog from Bible Study. |

The read-only launch checker now reports these content states in `contentAvailability` in JSON and in a separate text section. `available` means the endpoint returned published metadata, not that pastoral approval, lesson quality, media playback or full feature acceptance has been independently verified. Collection counts describe the returned catalog; the path list is capped at 100. A failed endpoint is `unavailable`, a malformed payload is `invalid`, and a valid empty list is `empty`.

## Daily Word / Moment of Peace

This is the short daily experience at `/daily-word`, shared with the dashboard's Word of the Day and Moment of Peace. Choose 2, 5 or 10 minutes, then move through **Be still → Read → Reflect → Pray → Live**. An optional private reflection is saved when continuing; progress is stored for a signed-in member and can be resumed. Closing with an unsaved reflection prompts first. Completion is explicit, not inferred from opening a page.

The passage and short explanation/question/prayer/action come from the same shared dated library. Scripture text and attribution come from the Bible provider; they are not invented by AI. The publishing day is UTC. An opened session keeps its original day's passage even across midnight. A reviewed entry for that calendar date wins; otherwise the legacy undated rotation is used. Drafts are not served unless an explicit non-production draft setting is enabled.

Before beta: Franck reviews the actual first 30 launch days and the EN/FR copy. Use the existing [November review packet](review/NOVEMBER_2026_PASTORAL_REVIEW.md) only if it covers the actual launch window; November is not an approved launch date.

## Published Daily Meditation

This is a separate, longer editorial experience at `/meditation`, with saved/completed history at `/meditation/history` and an Expo Meditations screen. The member reads the Scripture reference and editorial explanation, considers reflection questions, writes a private reflection if desired, prays, bookmarks the meditation and explicitly marks it complete. Reflection deletion leaves the bookmark/completion intact. This progress is separate from the five-step Daily Word session.

The API chooses the latest published meditation in the selected language whose publication date is at or before today's UTC day. If nothing new is scheduled, it can show an older eligible meditation; it does not generate a new one automatically. With no eligible item it returns 404 and the UI shows an empty state. Today's EN/FR catalogs are empty.

Before beta: review a starter schedule in both languages, then publish only those approved records. The existing `prisma/seed-meditations.cjs` writes to a database and can update existing starter records; do not run it on production as a read-only review tool. The new local `/editorial` workspace provides meditation authoring and scheduling; it still requires real pastoral review and deployment. Approving Daily Word does not populate this separate database library.

## Bible Study

On the web, open `/bible`, filter by **topic, biblical character, Bible book or Christian doctrine**, then open a series. The series contains ordered lessons. Each lesson can include a Scripture reference, introduction, historical context, passage explanation, theology, reflection questions, prayer and practical application. Start the study, choose a lesson, then explicitly mark it complete. Enrollment and completed lesson IDs are saved privately; reading a chapter or opening a lesson does not automatically complete it.

Only `PUBLISHED` series appear in the selected language. There is no published EN/FR series at the inspected endpoints. The source supports lesson delivery and persistence, and the new local `/editorial` workspace provides the missing study editor. There is still no Expo study screen. Expo learning paths and reading plans are separate features and do not close this gap.

Before beta: prepare and review at least one coherent series in each included language, publish through a reviewed operator process, then test enrollment, every lesson, completion, reload and account isolation. Complete Expo parity in the native milestone, or explicitly exclude Bible Study from the native candidate. Progress records activity, not a score for spiritual maturity or ministry eligibility.

## LivingWord

Open `/livingword`, search published teachings by title/description/speaker, choose an audio or video item and press play. Web and Expo players provide manual playback, failure/retry states, attribution and a readable transcript. Nothing plays automatically. The current implementation does not save a listening-completion history or offer an offline download library.

A moderator/admin uses the web editor at `/livingword/editor` to supply title, language, speaker, description, audio/video URL, attribution, transcript and a rights reference. Saving a draft is separate from publishing. Members only receive approved, currently published items on an explicitly allowed HTTPS media host. Unpublishing removes public access. Ordinary members cannot publish.

The media URL must have no credentials, query string, fragment or custom port. Configure `LIVINGWORD_MEDIA_HOSTS` only for the media provider approved for LifeBook. This is URL-based playback, not a built-in upload/streaming service; private/signed-query links do not fit the current contract. Transcripts do not by themselves prove video captions or device playback work.

The new `/editorial/discover` tool provides editor-only, ephemeral YouTube metadata and original-source links when server-only configuration is supplied. It is disabled by default and does not import or publish resources, add YouTube playback, persist candidates or approve media rights. See the [implementation and remaining design](content/SERMON_DISCOVERY_API_DESIGN.md).

Before beta: obtain permission for actual recordings, verify the media host, publish reviewed teachings with transcripts and test real audio/video playback and failure recovery on the intended devices. Never use unlicensed recordings merely to fill the library.

## Smallest safe beta scope

1. Finish production Clerk/domain configuration and a rehearsed identity-preserving transition; approve legal text, support ownership, crisis resources and pastoral staffing as required by the enabled features.
2. Approve the actual daily content window. Prioritize the working Daily Word, Bible reader, reading plans, journal and account controls. Review the prayer topics before enabling their dependent guided features.
3. For meditations, studies, paths and teachings, either supply reviewed usable content and pass their detail/playback tests, or explicitly exclude the empty library from the beta promise and tell testers it is unavailable. A working empty state is not a completed content feature.
4. Complete the signed-in EN/FR web test matrix, separate-account isolation/export/deletion, mobile-browser and screen-reader acceptance. Record candidate, tester, date and evidence.
5. Franck approves the exact candidate and selected adult cohort, then authorizes those invitations. No invitation or public launch is implied by source deployment.

The public address, owned domain and actual legal/pastoral approvals are still owner inputs. Backup/rehearsal/named approval remain mandatory before the paused legacy-data operation. Render Free remains the owner's choice; its wake-up delay is a known limitation.
