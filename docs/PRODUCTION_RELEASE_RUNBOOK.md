# Production release runbook

How LifeBook reaches production safely. Written 18 October 2026, after the M3.7 migration (see `M3.7_DATABASE_VERIFICATION.md`).

## How production deploys today

| Part | Where | Deploys |
| --- | --- | --- |
| API | Render `lifebook-api` (`srv-db5j7dqd0e5s73flpdg0`) | **Automatically on every merge to `main`** |
| Web app | Vercel `lifebook` (`lifebook-inky.vercel.app`) | Automatically on every merge to `main` |
| Marketing site | Vercel `lifebook-marketing` | Automatically on every merge to `main` |
| Database | Supabase `qqsfju…` (Frankfurt, PostgreSQL 17) | **Never automatically.** Migrations need approval. |
| Sign-in | Clerk | **Still a development instance.** Must change before public launch. |

**The rule learned on 18 October:** code reaches production the moment it merges, so **migrations must reach production first**. Every LifeBook migration so far is additive, which means the old code runs fine on the new schema. So:

1. Merge nothing that needs a new migration until the migration is in production, **or**
2. Turn off Render's auto-deploy and deploy the API by hand after migrating.

Option 1 is the default.

## A. Database change (any new migration)

Run from the repo root on the operator machine. Production changes need the product owner's explicit approval at step 5.

1. **Back up.** Create a private folder outside Git:
   ```bash
   TS=$(date -u +%Y%m%dT%H%M%SZ); D=~/Documents/LifeBook-backups/$TS; mkdir -p $D && chmod 700 $D
   docker run --rm -e PGURL="$DIRECT_URL" -v $D:/out postgres:17 sh -c 'pg_dump "$PGURL" --schema=public --format=custom --no-owner --no-privileges --file=/out/lifebook-public.dump'
   shasum -a 256 $D/lifebook-public.dump
   ```
   `DIRECT_URL` is production's direct connection string from `apps/api/.env`; never paste it in chat or commit it.
2. **Restore test.** Restore into a new local PostgreSQL 17 (`pg_restore --no-owner --no-privileges`) and compare exact row counts with production.
3. **Rehearse.** On the restored copy: `prisma migrate deploy`, then `prisma migrate diff --from-url <copy> --to-schema-datamodel prisma/schema.prisma --exit-code`. It must report no difference, with existing row counts unchanged.
4. **Check the SQL is additive.** No `DROP`, no column type change, no `NOT NULL` without a default on an existing table. Anything else needs a written plan of its own.
5. **Approval.** The product owner approves the specific migrations by name.
6. **Pre-check.** `prisma migrate status` lists exactly the expected pending migrations, and row counts still match the backup.
7. **Apply.** `pnpm --filter @lifebook/api exec prisma migrate deploy`.
8. **Verify.** Status "up to date", `migrate diff` shows no difference, row counts unchanged, no failed ledger rows, and the affected endpoints respond as expected.
9. **Record** the evidence in a `M<version>_DATABASE_VERIFICATION.md` file.

**If a migration fails partway:** stop. Don't retry and don't `migrate resolve` without understanding why. Additive migrations leave existing data untouched; the backup restores the `public` schema if needed (into a new database first, never straight over production).

## B. Before the public launch (one-time gates)

| Gate | Owner | Status |
| --- | --- | --- |
| Clerk **production instance**: domain, production keys in Render (`CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`) and Vercel (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), allowed origins | Product owner | Open |
| Pastoral review of `apps/api/content/prayer-topics.json`, then set `status: "reviewed"`, `reviewedBy`, `reviewedOn` (switches on the Scripture companion and guided meditation in production) | Pastoral reviewer | Open |
| Local verification of crisis numbers (`docs/M3.7_CRISIS_CONTACTS_DRAFT.md`) | Reviewer per country | Open |
| `OPENAI_API_KEY` added to Render `lifebook-api` as a secret | Product owner | Open |
| OpenAI data-retention terms for the account confirmed; zero data retention requested if available | Product owner | Open |
| Guided meditation evaluation passes on the release candidate (`docs/M3.7_MEDITATION_EVAL.md`) | Engineering | **Done** (18 Oct) |
| Pastoral care pilot: pastors registered with `pastor-admin.cjs`, safeguarding lead given MODERATOR, notification channel chosen | Product owner + engineering | Open |
| Daily retention job scheduled (`care-purge.cjs --target production --apply --confirm-production <ref>`) | Engineering, after approval | Open |
| Privacy notice updated (prayers, care conversations, AI processing); data protection review for Ghana and France | Product owner + adviser | Open |
| Real-device check: iOS and Android browsers, screen reader | Engineering | Open |

## C. Release-day checklist

1. `main` is green on GitHub CI and Vercel.
2. Any new migration has gone through section A **before** merging the code that needs it.
3. Merge. Watch the Render deploy reach "Live" and the Vercel production deploy reach "Ready".
4. **Smoke test, signed out:** `/api/v1/health` 200; `/pastors` 200; the home page, sign-in and Bible Reader EN/FR load.
5. **Smoke test, signed in** (a dedicated production test account): onboarding, read a chapter and resume, save a prayer, open Ask a pastor. Once the library is reviewed, also the Scripture companion and one guided meditation.
6. Check the Render logs for errors in the 15 minutes after release. The logs must never contain prayer or conversation text.
7. Note the release in `CHANGELOG.md`.

## D. Rollback

- **Code:** Render → `lifebook-api` → Deploys → roll back to the previous deploy. Vercel → Deployments → promote the previous production deployment. Additive migrations stay; older code ignores the new tables.
- **Data:** never restore a backup over production directly. Restore into a new database, compare, then decide with the product owner.
- **Encryption keys:** never remove a key from `REFLECTION_ENCRYPTION_KEYS` while any data or backup uses it. Rolled-back code must still have every key.

## E. Known operational notes

- A preview build can fail with a React type mismatch (`DailyWordContext.Provider cannot be used as a JSX component`) when Vercel restores a stale build cache. Redeploy that deployment with the build cache disabled.
- `render.yaml` still declares a `lifebook-ai` service from the original architecture. Guided meditation runs inside `lifebook-api`, so that service isn't needed; remove it from Render if it exists, to avoid cost and confusion.
