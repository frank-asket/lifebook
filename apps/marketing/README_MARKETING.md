# LifeBook Marketing — Next.js

Responsive marketing website for LifeBook, using the existing monorepo's `apps/marketing` workspace.

## Pages
- `/` (English) and `/fr` (French) — landing page: hero with a static rendering of the prayer-time screens, the five steps, what's inside, our promises, a verse, FAQ, closing call to action. All copy lives in `lib/content.ts`; keep every claim true to what the app does today and label pilots or upcoming features.
- `/privacy` — clearly marked **pre-launch placeholder**, must be replaced by reviewed privacy policy before public accounts.
- `/terms` — clearly marked **pre-launch placeholder**, must be replaced by reviewed terms before public accounts.
- Custom 404.

## Run locally
From the monorepo root:

```bash
corepack enable
pnpm install
cp apps/marketing/.env.example apps/marketing/.env.local
pnpm --filter @lifebook/marketing dev
```

Marketing: http://localhost:3000. Set `NEXT_PUBLIC_APP_URL` to the deployed LifeBook web URL (e.g. `https://app.lifebook.app`).

## Vercel
Import the same GitHub repository as a **separate project** from `apps/web`:
- Framework: Next.js
- Root directory: `apps/marketing`
- Build: `next build` (default)
- Environment: `NEXT_PUBLIC_APP_URL=https://<your-web-app-domain>`
- Domain: `lifebook.app` after DNS setup.

## Before launch
- Replace placeholder privacy/terms with reviewed documents.
- Confirm `hello@lifebook.app` is an active monitored mailbox or update it.
- Validate any app store / mobile availability statements before advertising downloads.
- Connect live app URL and test sign-in navigation.
- Replace the CSS/SVG placeholder book brand with the final approved LifeBook brand asset when ready.
- Scripture on the site is quoted exactly from the app's translations (KJV, J.N. Darby) with attribution; check any new verse against the Bible API before adding it.
- Check typography/network policies: Google Fonts are imported via CSS with system fallbacks.

No backend is required to render this marketing site. No forms silently collect data. Features are described as product direction, not falsely represented as fully launched.
