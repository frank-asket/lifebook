# Sermon discovery and LivingWord integration — implementation and next design

Updated 26 October 2026 for the v0.4.0.0 PR. **Read-only editorial discovery is implemented; disabled by default. Publication and player integration remain proposed.** Use the ministry register and real permissions independently of technical checks. No ministry/channel has been approved or configured by this release.

## Implemented: read-only editorial leads

A MODERATOR or ADMIN opens `/editorial/discover` from the content workspace. The API checks the editor role independently on both `GET /api/v1/teaching-discovery/sources` and `GET /api/v1/teaching-discovery/videos?channelId=<id>&pageToken=<optional>`. Both responses use `Cache-Control: no-store`. Ordinary members cannot discover resources through these endpoints.

To enable in an approved environment, supply server-only `YOUTUBE_API_KEY` and comma-separated `YOUTUBE_APPROVED_CHANNEL_IDS` (up to 20 verified stable `UC…` IDs); blank values in `.env.example` leave it disabled. Keep the key out of web/mobile variables. Configure only channels whose identity and intended discovery use the operator has reviewed; this variable name does not itself grant media rights or approve any teaching.

Choose a configured channel and Find recent videos. Each page reads the official channel uploads playlist and current video metadata, with up to 12 unique IDs. Requests have a ten-second timeout, reject redirects and return a generic upstream error without the key or provider response body. Results exclude mismatched channels, nonpublic/unprocessed/nonembeddable videos and reported age restrictions. Regional restrictions and caption availability are displayed for further review, not certified playback acceptance.

Results contain titles, channel attribution, source links and available metadata only. They are ephemeral response data: no database candidates, import, audio/video, thumbnails, transcripts, downloaded captions, summary, ministry ranking, recommendation algorithm or automatic publication is created. The editor opens YouTube in a new tab to review the original resource. Existing LivingWord direct-media records and players are unchanged. No API key, channel approval, scheduler, database migration or production setting is introduced by shipping this source.

## Proposed publication workflow

1. An editor selects a verified official channel/approved playlist. Store its stable identity with an actual source/permission review; channel names alone can be impersonated. No channels have been approved by this document.
2. A server-only YouTube Data API integration reads that channel's uploads/playlist metadata with `channels.list`, `playlistItems.list` and `videos.list`. Use documented public-data access; do not request participants' YouTube accounts or upload/management scopes.
3. Keep original title, channel/source, video ID, language/duration when available and current playback status. Deduplicate by provider/video ID. Missing information is unknown, not invented. Do not fetch arbitrary metadata URLs or execute supplied HTML.
4. Reject private/deleted/unavailable candidates; check embedding and regional availability. Missing status or API failure leaves the candidate unverified. A public/embeddable flag is technical eligibility, not copyright or pastoral approval.
5. Editors watch the actual resource, check source ownership, permitted usage and pastoral suitability, then attach independently authored LifeBook topic/passage notes and explicitly approve or reject it. Changes to the selected source or usage mode invalidate prior approval.
6. Publish only approved, currently eligible items. The member chooses to load/play the official embedded player, sees credit/source information, and has an original-source fallback. Recheck availability and remove/unpublish unusable entries without deleting personal progress unexpectedly.

## Algorithm boundary

Use deterministic discovery checks and deduplication first. Recommend approved resources using LifeBook's independently supplied editorial topic/passages, chosen language and a member's explicitly consented learning goals. Keep discovery and ministry review separate from recommendation. Never send prayer/reflection text to this discovery service. Popularity is not an orthodoxy score; do not create ministry rankings from views/subscribers or claim an algorithm certifies doctrine.

Do not automatically summarize, translate or classify a sermon from YouTube API data/captions. Use separately permitted first-party/ministry material only after reviewing that use. Any AI assistance remains untrusted drafting for human review, with permitted input sources and no prompt-driven publication, links, credentials or tool execution.

## YouTube obligations to design for

Official references: [developer policies](https://developers.google.com/youtube/terms/developer-policies), [video status fields](https://developers.google.com/youtube/data/reference/rest/v3/videos), [player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality), [embed help](https://support.google.com/youtube/answer/171780?hl=en).

The policies restrict copying/offline storage of audiovisual content and deriving new data/metrics from API data. Temporarily stored non-authorized metadata needs refresh/deletion within 30 days, with reasonable efforts to reflect changes sooner. Preserve YouTube presentation and required player identification/referrer behavior. Do not strip ads or separate audio from video. Update the app's terms/privacy disclosures for the actual integration before enabling it. These are platform requirements, not a blanket license for ministry content. Design the exact use against current policies before release.

An embedding flag can still fail at playback. Handle removed/private videos, disabled embedding, geography/age restrictions and player errors, with a source link; do not bypass them. Provide accessible labels, keyboard controls and publisher-provided captions when available. Do not promise a transcript when none is authorized.

## Changes LifeBook actually needs

LivingWord currently expects an approved direct HTTPS audio/video file and a supplied transcript. Web uses HTML5 audio/video; Expo uses native audio/video players. A YouTube watch URL will not play through those components. Do not add youtube.com to `LIVINGWORD_MEDIA_HOSTS` as a workaround.

- Add a provider-specific contract (`direct`, `youtube`, or reviewed source link), canonical source, author/publisher/attribution and permission records. Keep legacy direct-media records working.
- Add private discovery candidates and versioned rights/review decisions. Keep these separate from published Sermon records and from API metadata subject to refresh/deletion.
- Add official web embed support and a separately tested Expo player/browser flow. Prefer a reviewed external-source link as an initial fallback where native embedding is not ready. Clicking play must clearly signal the third-party connection; no preloaded player before the member's choice.
- Make transcript requirements provider-aware. Direct licensed files may include an authorized transcript; YouTube resources may expose available publisher captions in the official player. Do not scrape/download captions to satisfy the existing required transcript field.
- Add quota budgets, bounded requests, server-side key handling without credentials in logs, per-editor authorization and deterministic availability checks. A daily scheduled refresh is proposed, not configured. Pause publication if required metadata has expired and cannot be refreshed.

A reviewed additive database migration may be needed for persisted candidates, rights decisions and provider-specific publication. The implemented discovery needs none. Do not alter applied migrations or deploy a new one without migration-history review, a recoverable backup and named approval.

## Acceptance before publication/player integration

Tests should cover unapproved sources, duplicate IDs, hidden/unplayable videos, stale metadata, quota/API failures, attempted automatic publication, malicious metadata, permission withdrawal, removed resources, preserved direct playback and clear credit. Verify real web/Expo playback, keyboard/screen-reader access, captions and a working source fallback. Obtain Franck's approval of the ministry/usage list and actual content; no outreach or invitations have been sent.
