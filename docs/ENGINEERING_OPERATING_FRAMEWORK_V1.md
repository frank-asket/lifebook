# LifeBook Product & Engineering Operating Framework v1.0
Status: Proposed for review | Owner: Founder/Product + CTO | Date: 2026-11-01

## Principles
- Eight lifecycle workstreams are overlapping accountabilities, not sequential waterfall departments.
- Every feature has one accountable product owner and one accountable technical owner.
- "Code complete" does not imply "launch ready"; verified evidence and approval are required.
- Security, privacy, accessibility, observability and theological-content review are continuous.
- Never deploy, migrate production data, or invite pilot users without explicit release authorization.
- The self-selected faith journey is not a spiritual maturity score; ministry role and spiritual pathway must remain separate.
- MVP discipleship content is centrally curated; pastor-managed programs and mentorship are Phase 2.

## Responsibility / deliverables / gate matrix

| Phase | Accountable | Responsible roles | Outputs | Exit gate |
|---|---|---|---|---|
| 1. Discovery & requirements | Product Lead | BA, UX Researcher, Domain Reviewer | PRD, personas, prioritized epics, stories, acceptance criteria, privacy requirements | Scope and success metrics approved |
| 2. Planning & architecture | CTO | Technical Lead, Architect, TPM | TRD, HLD, ADRs, dependency map, risk register, milestones, API/data contracts | Architecture/security design reviewed |
| 3. Product design | Design Lead | UX/UI Designer, UX Writer, Accessibility Reviewer | User flows, wireframes, prototype, responsive screens, EN/FR copy, design tokens | User flow and accessibility reviewed |
| 4. Development | Engineering Lead | Frontend, Backend, Mobile, Database, DevOps engineers | Reviewed code, migrations, APIs, instrumentation, developer docs | Code review and build/testing checks pass |
| 5. Security & privacy | Security Owner | AppSec, Backend, Privacy reviewer | Threat model, role/resource authorization matrix, data lifecycle, secret/dependency scans | Critical exposures closed; residual risks documented |
| 6. QA & validation | QA Owner | SDET, developers, accessibility and device testers | Automated tests, regression matrix, UAT evidence, performance results | Tested candidate meets acceptance requirements |
| 7. Release & deployment | Release Owner | DevOps, Engineering Lead, Product | Reviewed migration plan, backup restore evidence, staging smoke, rollback, changelog | Named go/no-go sign-off |
| 8. Reliability & iteration | Engineering + Product Leads | SRE, support, analytics, content reviewers | Dashboards, incidents, feedback, improvement backlog | Monthly product/operational review |

A startup contributor may hold multiple roles, but security/privacy review and high-risk production approvals must not depend only on the implementer.

## RACI: decision rights
R = executes, A = one accountable approver, C = consulted, I = informed.

| Decision | Product | CTO/Engineering | Design | Security/Privacy | QA | Content/Pastoral |
|---|---|---|---|---|---|---|
| MVP scope | A | C | C | C | I | C |
| Architecture | C | A/R | C | C | C | I |
| UX acceptance | A | C | R | C | C | C |
| Authorization/data design | C | A/R | I | C | C | I |
| Vulnerability disposition | C | R | I | A | C | I |
| Regression/UAT evidence | A | R | C | C | R | C |
| Content doctrinal approval | C | I | I | C | I | A/R |
| Production go/no-go | A | R | I | C | C | C |
| Incident technical response | I | A/R | I | C | C | I |

## Feature Definition of Ready
- Named user and user need; hypothesis and measurable outcome.
- In-scope/out-of-scope behavior and EN/FR localization requirements.
- Acceptance criteria, failure and empty states, accessibility and privacy constraints.
- Data ownership, permission rules, migration requirements and retention expectations.
- Architecture and design reviewed for risks and dependencies.

## Feature Definition of Done
- PR reviewed; automated lint, typecheck and builds pass.
- Unit/integration tests and applicable E2E regression pass.
- Tenant/member access restrictions and negative auth tests pass.
- Migrations independently reviewed, rehearsed on disposable data, safely sequenced.
- Secrets never logged or committed; privacy and retention controls verified.
- EN/FR copy, empty/loading/error states, accessibility and device acceptance appropriate to scope.
- Metrics and alerts instrumented; docs, changelog, rollback and support notes updated.
- Staging smoke evidence retained; release owner approves deployment.
- Content-backed experiences additionally require rights/licensing and pastoral editorial approval.

## Change/release process
1. Product creates story with acceptance criteria, priority and risk classification.
2. Architecture/design/security review for cross-cutting features.
3. Implement on feature branch with tests, observability and docs.
4. Pull request: CI + peer review + security review where needed.
5. Staging: use isolated credentials, database and media; run migration rehearsal and smoke matrix.
6. For production schema changes: approved backup, tested restore, SQL review, named authorization, migrate before incompatible code; no automatic schema updates on merge.
7. Release owner checks Clerk production configuration, privacy notice, crisis/safeguarding setup, content approval, monitoring and rollback.
8. Deploy progressively, verify signed-out and signed-in flows, log incidents, and conduct post-release review.

## Issue and PR required fields
- User impact / problem
- Scope and exclusions
- Owner, reviewer, priority, target milestone
- Acceptance criteria
- Data/privacy/security implications
- Dependencies and migration plan
- Test evidence: automated + manual/device
- Rollback or feature-flag strategy
- Docs/content approval (when relevant)

## Milestones, proposed status as of 2026-11-01
| ID | Milestone | Priority | Primary owner | Proposed status | Exit evidence |
|---|---|---|---|---|---|
| M01 | Governance adoption | P1 | Product + CTO | Proposed | Approved roles, templates and gates |
| M02 | Production Clerk and privacy | P0 | Backend + Security | Blocked pending verification | Production identity, access tests, privacy approval |
| M03 | Staging/production DB release safety | P0 | DevOps + Database | Needs verification | Restore rehearsal, migration gate, release plan |
| M04 | Feature/content completion | P1 | Product + Engineering | In progress | Functional EN/FR catalog + app flows |
| M05 | Security, CI and mobile QA | P1 | Security + QA | Needs verification | CI gate results, device and UAT evidence |
| M06 | Pastoral/content governance | P1 | Content Lead | Blocked pending approvals | Licensed, reviewed content and safeguarding |
| M07 | Controlled adult beta | P1 | Product + Release | Not authorized | Signed go/no-go; consented pilot scope |
| M08 | Pilot iteration | P2 | Product + Engineering | Planned | Telemetry, feedback and prioritized changes |

## Source-based audit notes (not a fresh runtime audit)
Repository: frank-asket/lifebook, branch main, reviewed 2026-11-01.
- README and docs/FEATURE_READINESS.md describe incomplete launch acceptance and empty published content catalogs.
- docs/PRODUCTION_RELEASE_RUNBOOK.md describes automatic deploys on main, manual DB migrations, open Clerk production/legal/retention/pastoral gates.
- apps/ai-service/main.py currently rejects generation with HTTP 501; guided meditation provider logic also exists in apps/api/src/prayer/openai-client.ts.
- apps/web/middleware.ts protects defined routes; security review must also validate every NestJS endpoint and resource-level owner authorization.
- .github/workflows/ci.yml runs build, Prisma migration replay and many tests; add dependency/secret/SAST and stronger deployment/UX quality gates.
- docs/FEATURE_READINESS.md reports Expo Bible Study is absent and native/user acceptance checks remain.
These are verified source/document observations, not confirmation of production incidents or successful fresh tests.

## Audit follow-up checklist
- Inspect all NestJS controllers/services for missing authorization/IDOR and retention/deletion paths.
- Validate Prisma constraints, migrations, indexes, backup restore and staging isolation.
- Run full pnpm frozen install, lint, TypeScript, builds, API/web/mobile tests and migration rehearsal.
- Run credential/secret, supply-chain, SAST and dependency scans.
- Test web/mobile accessibility, EN/FR flows and real-device behavior.
- Confirm real production Clerk/domain and safeguarding; verify license/rights for Bible texts/media.
- Record findings as confirmed defects vs operational risks with exact file/line, reproduction and remediation PR.
