# M3.6 staging and privacy rollout

This branch is prepared for **separate staging resources**. It has not been merged or deployed. No production schema/data changes or content publishing are authorized by this document.

## Configuration before starting the new API

Use `render.staging.yaml` to prepare new services, not the existing production service. Use a separate Supabase project and Clerk development/staging instance. Vercel preview builds alone are not an isolated staging environment.

| Setting | Requirement |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Separate staging Supabase pooled/direct URLs. Never copy production URLs into staging/CI. |
| `CLERK_SECRET_KEY` | Staging instance secret in the provider's secret store. Web publishable/server keys must match that instance. |
| `CLERK_AUTHORIZED_PARTIES`, `CORS_ORIGINS` | Explicit staging web origins only. |
| `API_BIBLE_KEY` | Valid API.Bible key with access to the approved translations; server-only. |
| `API_BIBLE_EN_BIBLE_ID` | Approved: `de4e12af7f28f599-01`. |
| `API_BIBLE_FR_BIBLE_ID` | Approved: `a93a92589195411f-01`. |
| `BIBLE_NOTES_ENCRYPTION_KEY` | Existing note key, exactly 64 hexadecimal characters. Preserve it; replacing it makes existing notes unreadable. |
| `REFLECTION_ENCRYPTION_KEYS` | JSON map of short key IDs to independent random 32-byte keys represented by 64 hex characters. Generate/store in a secret manager, not Git/chat. Retain old keys and back them up separately. |
| `REFLECTION_ENCRYPTION_ACTIVE_KEY` | ID of the entry used for new writes. All readers need every retained key. |
| `API_RATE_LIMIT` | Defaults to 120 requests per minute per route/client IP, per process. |
| `TRUST_PROXY_HOPS` | Defaults to zero. Blueprint expects one trusted ingress hop; verify actual staging topology and forged-forwarded-header behavior before production. Never blindly trust all forwarded headers. |
| Marketing `NEXT_PUBLIC_APP_URL` | Staging web URL. |
| Web `NEXT_PUBLIC_API_URL` | Staging API URL, not production. |

The supplied provider credential was tested only against API.Bible; both approved translations returned **403 / Invalid API key**. No supplied key was written to source or deployment configuration. A working credential is still required. Translation approval does not establish provider-account access or redistribution rights.

In production mode the API refuses startup without a valid reflection key ring and active key. Configure and verify keys **before** any application rollout. No startup task creates keys, runs migrations, or rewrites existing private records.

## Local staging settings

`node scripts/staging-env.cjs init` creates the gitignored `.env.staging` with fresh, staging-only annotation and reflection keys (never printed). Fill in the remaining values locally, then:

- `node scripts/staging-env.cjs check` lists which settings are present, by name only.
- `node scripts/staging-env.cjs migrate` refuses any database whose Supabase project matches production (`apps/api/.env`), runs `prisma migrate deploy`, then confirms there is no schema difference.

Copy the same values into the Render and Vercel staging settings. Back up the generated keys in a password manager; losing them makes staging notes and reflections unreadable.

## Database setup and verification

Fresh empty staging databases can replay all six reviewed migrations using explicit `prisma migrate deploy` after verifying the target. Existing databases must first be inspected and backed up; never reuse migration-reconciliation decisions without checking that specific database. The generic `db:migrate` shortcut is disabled to prevent accidental development migrations.

CI uses only its ephemeral PostgreSQL service named `lifebook_restore`; all DB URLs are explicitly loopback and integration tests enforce that target. No Supabase or Clerk secret is provided to the integration job. The Clerk publishable build key is used only for Next.js builds.

Build and run:

```sh
pnpm install --frozen-lockfile
pnpm --filter @lifebook/api prisma:generate
pnpm --filter @lifebook/api exec prisma validate
pnpm --filter @lifebook/api build
node --test apps/api/test/*.test.cjs
node --test apps/web/test/*.test.cjs
pnpm --filter @lifebook/web build
pnpm --filter @lifebook/marketing build
```

Set `LIFEBOOK_STUDY_TEST_DATABASE_URL` and `LIFEBOOK_M36_TEST_DATABASE_URL`, plus runtime datasource URLs, to the disposable loopback `lifebook_restore` database for the opt-in tests. A skipped DB test is not a passing persistence check.

After configuring the server key and IDs in a secure environment, run `node apps/api/scripts/verify-bible-provider.cjs` with those environment variables. It checks translation metadata, books, chapters and actual chapter text without logging credentials or Scripture bodies. It returns nonzero on failure.

## Reflection encryption and backfill

New meditation/Daily Word reflection writes use AES-256-GCM envelopes with a key ID, random nonce, authentication tag and ciphertext. Authenticated additional data binds each value to its feature, owner and record ID. Private API responses decrypt only after ownership resolution. Missing keys, wrong context or damaged ciphertext fail safely; new writes never fall back to plaintext.

Existing plaintext stays readable so rollout does not destroy or hide existing reflections. **Existing rows and old backups are not automatically encrypted.** No schema migration is needed for the envelope in the existing text columns.

1. Store a new reflection key ring/active key securely and verify recovery of both database backups and required keys. Keep the separate existing annotation key unchanged.
2. Rehearse the release and a representative legacy-data copy in isolated staging.
3. Build the API; `node apps/api/scripts/reflection-backfill.cjs` defaults to a read-only scan. Supply datasource/key environment variables explicitly. Output contains counts only.
4. The tool's `--apply` mode is restricted to loopback `/lifebook_restore`. It uses conditional updates to avoid overwriting concurrent edits, checks encrypted values and is idempotent. Conflicts produce a failing exit code.
5. Compare pre/post counts and owner-visible content on the isolated copy. Verify no ciphertext escapes through `today`, completion, history or saved-state responses.
6. Prepare a bounded production plan with a fresh recoverable backup, retained keys, concurrency/locking review and rollback procedure. **Obtain explicit user approval before any production data rewrite.** The supplied tool deliberately cannot apply to Supabase; a production operator procedure still needs separate review.

**Application rollback:** Once this release writes an encrypted reflection, the previous API revision cannot read it correctly and may return the cipher envelope to clients. Keep the decrypt-capable reflection services and every required key in any rollback build. Disabling new writes alone does not restore old readers. Rehearse recovery on an isolated copy; do not restore an older production database over newer user records or decrypt production rows as an automatic rollback step. Database backups and the separately protected key ring must both be recoverable.

For rotation, distribute the ring containing both old and new keys to every reader first, then change the active ID for new writes. Never remove an old key while any live rows or retained backups need it. This backfill tool skips already encrypted rows; it does not rewrap old-key ciphertext. Losing encryption keys cannot be repaired by schema migration or a database-only backup.

## Functional smoke checks

Use two dedicated staging Clerk accounts. Inject short-lived tokens via the local process environment; do not paste them into chat or commit them. Test sign-up/in/out and token expiry in the real browser as well as the API script.

`node scripts/staging-smoke.cjs` requires:

- `LIFEBOOK_STAGING_API_URL`: HTTPS hostname containing `staging`.
- `LIFEBOOK_STAGING_ACK_SEPARATE_DATABASE=yes`: operator confirms the actual separate database wiring.
- Optional authenticated writes: `LIFEBOOK_STAGING_ALLOW_WRITES=yes`, `LIFEBOOK_STAGING_TOKEN_A`, `LIFEBOOK_STAGING_TOKEN_B`.

The script rejects the known production API hostname, does not follow redirects, and never logs tokens/private response bodies. Default mode checks public provider access and anonymous private-route rejection. Write mode checks two-account identity, enrollment, history/resume, explicit day completion, idempotency and ownership rejection. It leaves dedicated synthetic records in staging; it does not clean up or delete accounts.

Also verify in the browser: onboarding and language after a second sign-in, English/French Scripture and attribution, annotation create/edit/delete/reload, unsaved-draft protection, all Daily Word reflection/completion response paths, meditation history and two-account separation. Publish only reviewed staging content; no production seed is included.

## Remaining operational limits

- The rate limiter is single-process; use coordinated storage/edge controls before scaling horizontally. Verify proxy topology and per-user fairness with the real ingress.
- Mobile retains Expo 52 / React 18, with compatible explicit peers. Its older development toolchain still has audit advisories and needs a separate SDK/device upgrade; a TypeScript pass is not native QA.
- The annotation UI saves colored verse marks and shows them beside verse references. It does not restyle fragments of the provider's plain chapter text.
- Runtime platform access policies, full Supabase backup/RLS settings, valid Clerk sessions, real devices, screen readers and staging resources are still external acceptance gates.
