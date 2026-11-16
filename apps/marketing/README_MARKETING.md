# LifeBook Marketing — Next.js

Responsive marketing website for LifeBook, using the existing monorepo's `apps/marketing` workspace.

## Pages
- `/` (English) and `/fr` (French) — landing page: product-led hero with labelled illustrations of the Bible Reader and home screen, four feature previews, the five steps, what's inside, our promises, a verse, FAQ, closing call to action. Shared copy lives in `lib/content.ts`; the bilingual product-story copy lives in `components/product-stories.tsx`. keep every claim true to what the app does today and label pilots or upcoming features.
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
- Pilot requests and church enquiries use the operator-provided `lifebook.meditation@gmail.com`. Primary pilot links open a localized email subject and do not register or admit a participant.
- Validate any app store / mobile availability statements before advertising downloads.
- Connect live app URL and test sign-in navigation.
- Replace the CSS/SVG placeholder book brand with the final approved LifeBook brand asset when ready.
- Scripture on the site is quoted exactly from the app's translations (KJV and J.N. Darby for the site's own verses; the reader also offers BSB, WEB, NKJV, GNT and Louis Segond 1910) with attribution; check any new verse against the Bible API before adding it.
- Check typography/network policies: Google Fonts are imported via CSS with system fallbacks.

No backend is required to render this marketing site. No forms silently collect data. Feature previews preserve the existing content-status labels. The pilot remains invitation-only for up to 10 adults of any belief. No audience statistics or store-release claims have been added.

## Design ownership

Read root `DESIGN.md` and `UX-CONTRACT.md`. Marketing uses warm ivory and a single plum accent in light mode, with system dark-mode support. Header navigation is limited to purpose, features and the five-step experience; remaining sections stay in the footer. Screen illustrations use example content and preserve Scripture attribution.
