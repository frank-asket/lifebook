# Privacy notice — engineering draft for the adviser

**Status: DRAFT for legal review. Not legal advice and not for publication as is.** Written 18 October 2026 by engineering from what the code actually does, so the adviser can turn it into the published notice for Ghana (Act 843) and France (GDPR). Items marked **[confirm]** need the product owner; items marked **[gap]** are things the app does not do yet.

## Who we are
LifeBook **[confirm: legal entity, address, country of establishment, contact for privacy requests, DPO if any]**. Contact: hello@lifebook.app **[confirm it is monitored]**.

## What we collect, and why

| Data | Where it comes from | Why | Stored as |
| --- | --- | --- | --- |
| Name and email, sign-in identity | Google sign-in through Clerk | To create and secure your account | Held by Clerk; LifeBook keeps only an internal id |
| Faith journey, learning goals, preferred formats, language, consent choices | Onboarding and Settings | To set up your space; with your consent, to suggest reading plans | Plain database fields |
| Prayers in your journal, answered notes | You write them | Your private journal | **Encrypted** (AES-256-GCM, per-record context) |
| Daily Word and meditation reflections | You write them | Your private reflections | **Encrypted** for new entries; older entries may still be plain text **[gap: encrypt them before launch]** |
| Bible notes, bookmarks, highlights | You add them | Your study | Notes **encrypted**; bookmarks and colours plain |
| Reading history, plan progress, Daily Word steps finished | Your use of the reader and prayer time | To resume where you left off and show your week | Plain database fields |
| Pastoral care requests and messages | You and the pastor | To let a verified pastor listen and pray with you | **Encrypted**; deleted **90 days** after the request closes |
| Safety reports about a care conversation | You or a pastor | Safeguarding | **Encrypted**; kept **365 days** after resolution |

**Special category data.** Prayers, reflections and faith choices reveal religious beliefs and may reveal health or other sensitive matters. The adviser should set the legal basis (likely explicit consent) and the wording.

## What we do not do
- We don't use your prayers, reflections or reading to profile you or infer your spiritual maturity.
- **Personalized suggestions** (off unless you switch them on) use only the journey and goals you chose, plus counts such as whether you have started a reading plan. Never the content of your prayers.
- We don't sell data or show advertising **[confirm]**.
- The Daily Word is the same for everyone.

## When text leaves LifeBook
- **Guided meditation (AI), only when you ask for one on a prayer:** that prayer's text is sent to **OpenAI** to write a short meditation. Requests use `store: false`, so OpenAI is asked not to keep them for its own use **[confirm the account's retention terms and zero-data-retention status]**. Before writing, the text is screened; if it suggests someone may be in danger, LifeBook shows helplines instead.
- **Scripture usage counts:** when you read Scripture, LifeBook reports anonymous usage to **API.Bible** (American Bible Society) so translation publishers can see their texts being read. Only a token for the passage, a random device ID and a random session ID are sent, from our server, never your name, email or account.

## Who processes data for us
| Service | Role | Location |
| --- | --- | --- |
| Clerk | Sign-in and account security | **[confirm]** (US company) |
| Supabase | Database | Frankfurt, EU |
| Render | API hosting | **[confirm region]** |
| Vercel | Web hosting | **[confirm region]** |
| OpenAI | Guided meditation, on request only | US **[confirm transfer mechanism]** |
| API.Bible | Bible text; anonymous usage counts | US |
| Google | Sign-in, if you choose it | **[confirm]** |

International transfers (to the US) need a legal mechanism **[adviser]**.

## Stored on your device
Your browser keeps preferences only: theme, language, reading settings, prayer-time length and chime, which welcome or "What's new" sheets you've seen, suggestions you've hidden, and a random device and session ID for the Scripture usage counts. No advertising or third-party tracking cookies **[confirm, including anything added by Clerk]**.

## How long we keep it
- Pastoral care: 90 days after a request closes. Safety reports: 365 days after resolution.
- Everything else: until you delete it, or delete your account (Settings → Delete my account), which removes it immediately. Safety reports already made about a conversation are kept until their own deletion date, for safeguarding.
- Backups **[confirm the Supabase backup retention period]**.

## Your rights
Access, correction, deletion, restriction, objection, portability, and withdrawing consent at any time, plus complaint to the regulator: the CNIL (France) or the Data Protection Commission (Ghana). In Settings you can download all your data (a file with everything LifeBook holds about you, decrypted for you), delete prayers one by one or all at once, delete your whole account and its data, change your choices, and switch suggestions off.

## Children
**[confirm the minimum age.]** LifeBook is not designed for children under **[13/15/16]**, and sign-up should say so.

## Changes
We'll update this notice when features change and say what changed at the top.
