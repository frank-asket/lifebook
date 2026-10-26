# Web-first invited beta

Prepared 26 October 2026. This is a release procedure, **not a launch approval**. The native-store release stays separate.

## Scope and owner

Franck Asket identified himself as LifeBook's operator and final pastoral approver in this session. Contact: `lifebook.meditation@gmail.com`. Public business/contact address, country/legal capacity, and an owned production domain remain pending. No legal text or pastoral content has been approved merely by identifying the approver.

The proposed first cohort is 5–10 invited adult testers. Franck selects the actual participants; no invitations or emails have been sent. Increase access only after the first cohort's issues are resolved. Do not use anonymous public sign-up as a substitute for this phase.

## Identity transition — before changing keys

The current canonical Clerk application is `LifeBook` (`app_3KWWv8jvivVLca9iy5ToPt2cEqK`), matching the existing web/API/native test instance. Read-only Clerk inspection found **no production instance**. The operator CLI's stale application link was corrected to this existing application; no instance, account or authentication setting was changed.

Clerk documents that development users cannot be transferred into a production instance. Creating production does not copy their identities. Do not replace a publishable key alone, auto-link accounts by an email string, or delete the development instance.

1. Confirm the domain Franck owns and the intended web/API origins. Set up production under the canonical application and verify its DNS, OAuth and redirect configuration. Do not purchase a domain, accept new contracts or change billing without the required owner action.
2. Create an explicit, private identity-transition plan for existing LifeBook records. Existing data is keyed by the internal `User.id` and the unique Clerk `User.oidcSubject`; new production identities are different. Determine which current accounts are test-only and which need a verified, owner-approved mapping. Preserve all current records and the old instance.
3. Take a fresh private database backup and prove a restore into a new local database. Rehearse any proposed subject rebind on that restore, checking all ownership boundaries and row counts. Never map by an unverified email or merge two users automatically.
4. Obtain named approval for the exact identity mappings and release window. A map may change only the explicitly approved subject linkage, preserving the internal user ID and related data; keep a private rollback map. No identity rewrite is authorized by this document.
5. Configure matching production web/API keys and authorized origins together. Retain the old environment as the recovery path. Native development/preview remains on its current matching instance; no store build is promoted in this web phase.
6. Verify a new production test account and any approved retained account before sending invitations. Confirm sign-in, restart, sign-out and second-account isolation.

Official references: [Clerk environments](https://clerk.com/docs/guides/development/managing-environments), [migration limits](https://clerk.com/docs/guides/development/migrating/overview).

## Invite-only configuration

Use Clerk's existing access mode; no second application allowlist or custom email gate is needed. `config/clerk-web-beta.json` contains only:

```json
{"auth_access_control":{"sign_up_mode":"restricted"}}
```

The current Clerk schema confirms this is the invite-only value. Once the production instance exists, preview the patch against **production explicitly**:

```sh
clerk config schema --app app_3KWWv8jvivVLca9iy5ToPt2cEqK --instance prod --keys auth_access_control
clerk config patch --app app_3KWWv8jvivVLca9iy5ToPt2cEqK --instance prod --file config/clerk-web-beta.json --dry-run
```

Inspect the preview before applying the exact patch. Do not run it against development to simulate production readiness. Verify the resulting production access mode, then test that an uninvited visitor cannot sign up. Actual invitation delivery needs the selected recipients and the owner's instruction to send. [Clerk access modes](https://clerk.com/docs/guides/secure/restricting-access).

## Approval and operational gates

- **Legal:** review the engineering drafts, supply the public contact address, and approve final EN/FR privacy and terms. `/privacy`, `/terms`, `/fr/privacy`, `/fr/terms` stay explicit drafts, non-indexed, with `lifebook-legal-status=draft`. Only change that marker after replacing the overview with approved final text; the checker also rejects known placeholder language.
- **Pastoral:** review [November's 30 bilingual entries](review/NOVEMBER_2026_PASTORAL_REVIEW.md) and [the 24 prayer topics](review/PRAYER_TOPICS_PASTORAL_REVIEW.md). November is a proposed review window, not an approved launch date. Record exact corrections and actual approval dates in the source. The checker requires coverage for the chosen first 30 launch days, not 30 unrelated older entries.
- **Crisis resources:** have the appropriate local reviewers verify the services. When all applicable checks are complete, record `**Status:** VERIFIED`, `**Verified by:** <actual reviewer>`, `**Verified on:** YYYY-MM-DD` in the contacts document. Removing DRAFT alone no longer passes.
- **Safeguarding:** verify approved pastors, the lead's role and an operational notification channel before inviting people to use pastoral care. No pastor was listed at the last successful public check.
- **Production data:** the read-only survey on 26 October, before the synthetic journey write, found 0 legacy meditation reflections and **2 legacy Daily Word reflections**, plus 1 encrypted Daily Word reflection. Encryption was not applied and key validity was not tested. The previously paused backfill stays paused; fresh backup/restore, key proof, rehearsal and named approval are still required.
- **Retention:** the preview found 0 requests to close and 0 requests/messages/reports to delete. No apply flag was used. Current Render inspection found no explicit service-level `CARE_PURGE_SCHEDULE` variable and no `CarePurge` startup log in the current window; the earlier owner-reported setting is therefore not accepted as verified. Preview, approve and verify any activation before relying on retention promises.
- **Availability:** Render shows the API on its Free instance and warns of spin-down delays of 50 seconds or more. That behavior explains why some first requests time out. On 26 October Franck explicitly chose to **keep the Free plan**. This accepts the first-visit delay for the proposed private beta; it does not establish capacity or latency for a broad public launch. The read-only checker permits two bounded 30-second attempts and records recovery on retry. No paid plan was selected or purchased.
- **Release verification:** fresh CI, production health/schema readiness, live Scripture access/rights, synthetic-account export/deletion, current-candidate signed-in smoke tests, mobile-browser accessibility, support delivery, monitoring and rollback must be evidenced in the acceptance record.

## Release check

After building the API:

```sh
node apps/api/scripts/launch-check.cjs --date YYYY-MM-DD --json
```

Use the **actual proposed launch date**. It reads public endpoints and source metadata only; it never changes a database or approves content. A retry can recover a transient cold start but does not make persistent timeouts pass. Automated success does not approve the separate manual gates. Keep detailed logs and account exports private, outside Git.

## Launch sequence

1. Resolve the identity/domain and legal/pastoral approvals above.
2. Confirm recoverable data handling and retention, apply only specifically approved operations, and verify their results.
3. Run every applicable step of `M3.8_SMOKE_TEST.md` on the actual production identity configuration, in English and French; test mobile browsers and accessibility.
4. Record deployed commit, tester, date and evidence in `M3.8_WEB_BETA_ACCEPTANCE.md`. Obtain Franck's named go/no-go for this candidate and selected cohort.
5. Send only the authorized invitations, observe the first cohort and handle feedback through the supplied support inbox. Do not declare the public or native-store milestones complete from a private beta.
