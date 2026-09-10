## LifeBook web

The Next.js web experience is the public LifeBook site, LivingWord library,
and LifeBook Voice interface. Clerk owns authentication; durable user data and
server-side operations go through the LifeBook backend.

## Run locally

```bash
npm run dev
```

Clerk CLI links the development instance and writes these variables to
`.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
LIFEBOOK_API_URL=http://localhost:8787
```

Never expose the backend's Supabase service-role key in this app. The
authenticated catch-all API route at `/api/lifebook/*` forwards requests to
the backend with the current Clerk session token.

## Authentication

- `/sign-in` and `/sign-up` provide Clerk-hosted account routes.
- The homepage navigation presents sign-in/sign-up actions while signed out
  and an account button after sign-in.
- `src/proxy.ts` establishes Clerk request context. Public pages remain public;
  protect sensitive server routes with `await auth()`.
