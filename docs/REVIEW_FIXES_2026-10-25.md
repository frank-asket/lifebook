# Repository review fixes — 25 October 2026

Changes are prepared on `codex/project-review-fixes`, based on current main. The earlier native PR #71 is already merged. No production release, Supabase write, schema change, or migration-history edit was performed. Migrations were replayed only into a newly created disposable PostgreSQL database bound to loopback port 55439. Existing `.claude/launch.json` changes were left untouched.

## Implemented

1. **API Docker packaging:** copy the registered React Native patch before the filtered frozen pnpm install. A separate CI job now builds the actual API Dockerfile so workspace packaging failures cannot bypass the regular Nest build.
2. **Pastoral access:** private thread reads, replies, reports and closing actions lock and recheck current verification and assignment. A request snapshot from before reassignment or suspension cannot authorize a later operation. Suspension, availability changes and release of claimed requests now commit together. Lock order is verification before care request; member actions lock their request as well.
3. **Daily Word drafts:** web prayer time pins its passage and session day while open. Midnight provider updates cannot replace the active passage or erase the reflection. Returning to the overview loads the new day. Delayed step and reflection completions are ignored after a day, account or visit replacement. A returned session for a different day is rejected before progress can be saved against it. Drafts remain in memory; no private browser-storage copy was introduced.
4. **AI quota:** reserve an attempt in a short transaction under the user's row lock before contacting the AI provider, and recheck optional AI consent inside that transaction. The newer prayer-verse feature uses the same reservation rule with its existing 20-attempt limit and keyword fallback. Concurrent requests cannot exceed five attempts per rolling 24 hours. Provider failures and interrupted requests retain their reservation; this prevents retries from bypassing the spending limit. Usage outcomes remain coarse and contain no prayer text or crisis classification.
5. **AI prayer consistency:** generation captures the source ciphertext and modification time. Saving uses a conditional update against that source, so an edit or deletion during generation cannot attach guidance written for the previous prayer. Conflicts ask the member to try again.
6. **Daily Word progress:** lock the session before inserting/counting completed steps, and use the current completion timestamp. Simultaneous final steps now leave five recorded steps and a completed session.
7. **Care history:** return the newest 500 messages in chronological order, with a stable cursor for earlier messages. Keep the existing window size for older clients. Web and Expo offer “Load earlier messages,” preserve reply drafts, and deduplicate overlapping responses. Cursors are scoped to the same conversation. Loading historical pages does not advance read markers. Conversation-list unread queries fetch only the latest incoming-message metadata.
8. **Readiness:** database verification failures and missing bundled migration metadata now return unavailable readiness rather than a successful unchecked result. The health endpoint returns HTTP 503. `SCHEMA_GUARD=off` remains an explicit operational override, and the existing 30-second cache remains in place.
9. **Shared infrastructure:** API services and the retention scheduler reuse one Prisma client/pool. The root Nest provider owns connection/shutdown lifecycle. Token verification, including configured authorized-party checks, now has one implementation; account lookup/upsert stays outside its authentication error boundary. CI also enables the previously opt-in learning/media integration tests.
10. **Marketing contact and legal preparation:** replace the placeholder address on privacy, terms and the footer with the owner's supplied `lifebook.meditation@gmail.com`. English and French privacy/terms drafts are in `docs/legal/PRIVACY-AND-TERMS-DRAFT.md`. They are explicitly unapproved and have not replaced the public legal overviews.

## Verification

- Prisma validation passed; no Prisma schema or migration files changed.
- NestJS build and production API Docker build passed.
- Web and marketing production builds passed.
- Expo TypeScript check passed.
- API suite: 89 passed, one live Scripture-provider test intentionally skipped. All local database integration tests were enabled, including learning/media, ownership isolation, consent, export/deletion, safeguarding, and concurrent operations.
- Web suite: 46 passed, including an active unsaved reflection across midnight.
- Mobile suite: 69 passed, including loading earlier messages without losing a reply draft.
- Whitespace/diff checks passed.

## Remaining acceptance and release considerations

- The live Scripture-provider test was not run; local synthetic integration tests do not establish current API.Bible access or translation licensing.
- Physical iPhone VoiceOver and Android device acceptance remain pending; these source changes do not complete those milestones. No device reset or replacement emulator was attempted.
- The legal drafts need operator identity, intended countries/ages, legal review, provider/transfer review and confirmation of actual production retention/backup practices before approval. The supplied inbox was configured in source; delivery was not tested by sending email.
- Readiness now fails closed during database-verification errors. Deploy operators should expect HTTP 503 in that situation and avoid treating it as a reason to run migrations without the required history review and recoverable backup.
- AI request reservations intentionally count failed or interrupted provider attempts toward the rolling quota. No automatic refund/retry job was introduced.
- Source checks and local image builds do not prove production deployment health. The ship follow-up commits and pushes these changes for PR review. It does not merge, deploy, or change the production database.
