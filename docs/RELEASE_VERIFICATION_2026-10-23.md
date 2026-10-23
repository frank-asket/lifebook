# Release verification — 23 October 2026

## Released source and database

- PR #68 merged as `a0cfc4a6a2b1325cda376b2705596b13b1f5f1bf`: consent history, account-owned suggestion dismissals and web controls.
- The product owner approved the named migration after backup review. The backup restored into PostgreSQL 17, all 32 original table counts matched, and the rehearsal preserved existing data counts. Production migration application then verified 14 successful ledger entries, matching checksum, unchanged data counts and no schema drift. See [migration evidence](CONSENT_AND_SUGGESTIONS_2026-10-23.md).
- PR #69 merged as `c75e88dd70645fe1fa506d8857724692bd0f9c7d`: correct the concurrent dismissal race using a duplicate-safe insert. Both full final-head CI runs and web/marketing previews passed. No additional migration was needed.
- Post-merge CI for #68 exposed the race despite prior passing runs. The expanded regression sends 12 simultaneous HTTP dismissals and checks all succeed with one persisted row. An earlier isolated SIGSEGV in the native Prisma test process remains undiagnosed; the race correction is not claimed to diagnose that crash.

## Production observations

- Render explicitly displayed PR #68's merge SHA as its last successfully deployed commit, status Live.
- API `/api/v1/health` returned 200 and the new unauthenticated dismissal route returned 401, confirming the protected route exists.
- Vercel reported PR #68's production web deployment READY; signed-in French dashboard loaded Daily Word, reading continuation, progress and suggestions. Browser error log was empty in the inspected tab. No private content or member identifiers are reproduced here.
- PR #69 main-branch CI passed. Its web production deployment is READY (`dpl_9iMJf91eHzZrvuvrEJSRqMcNRKXy`), with all Vercel checks successful.
- **API correction verified Live:** the standard Render dashboard deployment of `c75e88dd70645fe1fa506d8857724692bd0f9c7d` completed successfully in 2m43s. The deployment detail explicitly displayed `Deploy succeeded | Live`, the matching source SHA, and startup logs confirmed the service was live at 02:33:33 UTC. Deployment ID: `dep-dbdcdmmi0phs739aclmg`.
- Render initially remained on the earlier SHA; dashboard controls were unreliable until the authenticated window could be used. The rollout completed through the normal dashboard action. No credentials were extracted or entered by the agent. The temporary in-app sign-in tab is no longer required.


## Next milestone

[Draft PR #70](https://github.com/frank-asket/lifebook/pull/70) adds native Today suggestions and exact reading-plan navigation. Local verification: 62 component tests, TypeScript and both platform JavaScript exports passed. It is pushed separately with passing CI and remains a draft; it is not merged or claimed installed on a device. Installed iOS/Android, dynamic text and VoiceOver/TalkBack acceptance remain open.

The task-owned restore container was removed. The private production backup remains outside Git. No reset, drop, destructive restore, encryption backfill or retention activation ran.
