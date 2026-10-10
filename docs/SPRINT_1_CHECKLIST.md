# Sprint 1 — Acceptance checklist

- [ ] Clerk project created; allowed origins and mobile redirect URLs configured.
- [ ] Supabase PostgreSQL connection strings configured in Render, never in browser.
- [ ] `pnpm install` and `pnpm db:generate` succeed.
- [ ] Prisma migrations applied to staging database.
- [ ] NestJS `/api/v1/health` returns 200.
- [ ] Web and Expo login flows tested on real devices/browsers.
- [ ] GET/PUT `/api/v1/me/profile` reject missing and invalid tokens.
- [ ] Profile edits persist across web and mobile.
- [ ] Profile cannot be read or changed using another user's token.
- [ ] Consent opt-in defaults to false and can be withdrawn.
- [ ] Account deletion and Clerk webhook lifecycle designed and tested before launch.
- [ ] CORS and Clerk authorized parties explicitly set for production.
- [ ] Sentry/logging configured without sensitive prayer or religious profile payloads.

**Status:** Scaffold and example flows only; these checks require live credentials and deployment.
