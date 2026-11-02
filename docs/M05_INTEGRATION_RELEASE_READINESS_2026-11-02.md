# LifeBook M05 integrated CI release-readiness report

Date: 2026-11-02
Candidate: PR #92, commit 092caed9dc56d70386da7813a349e088505a26d9
GitHub Actions run: 41439991355

## Verified CI evidence

- `build`: **passed** (includes Prisma validation and migration replay on disposable CI PostgreSQL, API tests, web tests/builds, mobile typecheck/tests).
- `api-container`: **passed** (production API Docker-context build).
- `dependency-audit`: **failed** (pnpm audit --audit-level high).
- Audit found **26 advisories total: 10 high, 10 moderate, 6 low**. High findings include the following distinct dependency packages:
  - `node-forge@1.4.0` via Expo tooling, including GHSA-86w9-cpqp-85rv and multiple other node-forge advisories. One advisory reports no patched versions; do not assume a simple version bump resolves it.
  - `zod@3.25.76` via Clerk/abitype chains, GHSA-mrhx-c7xc-m3w5 (audit suggests >=4.6.6; a major-version upgrade requires compatibility review).
  - `body-parser@2.3.0` via Express/NestJS, GHSA-27r3-jxmh-p828 (patched >=2.4.0).
  - `multer@2.4.0` via NestJS platform-express, GHSA-q7qp-rjg7-q26m (patched >=2.5.0).
  - `decode-uri-component<=0.5.0`, GHSA-qr28-fpjm-wq7f (patched >=0.5.1).
- Vercel web and staging checks showed *build-rate-limit* failures, independently of GitHub Actions build success. No evidence yet of a successful Vercel candidate deployment.

## Next blocking actions

1. Preserve the failing `pnpm audit` check (do **not** disable it or blanket-ignore advisories).
2. On a dependency remediation branch, identify which direct dependencies bring in each affected package (`pnpm why <name> -r`). Upgrade upstream dependency ranges where compatible, regenerate and commit `pnpm-lock.yaml`, then run frozen install, API/web/mobile build and full tests.
3. Evaluate whether the `node-forge` advisory without a patched version is reachable in production versus Expo CLI development-only paths. Record the exposure and mitigating controls; seek upstream fix.
4. Assess the Zod 3 -> 4 compatibility requirements via its upstream `abitype`/Clerk dependency; don't force a major transitive override without tests.
5. Re-run the full audit; record exact remaining advisories, dependency paths and justified risk disposition individually.
6. Confirm Vercel builds when account build-rate limits permit; no bypass through unreviewed builds or alternate environments.
7. Run staging two-account and safeguarding acceptance with actual production-like token rules and independently isolated staging resources.
8. Require privacy/pastoral/content and named release sign-offs before merging to auto-deploying `main`.

## Release decision

**NO-GO:** Security audit fails, Vercel preview deployments are rate-limited, and external staging acceptance is not evidenced.

## Source provenance

GitHub Actions run 41439991355, failed dependency-audit job 125259141399; successful build job 125259141327 and api-container job 125259141183. This report records actual observed job status, not a local reproduction or proof of vulnerability exploitability.
