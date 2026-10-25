# Privacy notice: engineering draft for the adviser

**Status: DRAFT for legal review. Not legal advice and not for publication as is.** Written by engineering from what the code does. It was first drafted on 18 October 2026 and updated on 25 October 2026 for Bible versions, the verse under each prayer, and pastor applications. The adviser turns it into the published notice for Ghana (Data Protection Act 2012, Act 843) and France (GDPR). A French version is in `PRIVACY_NOTICE_DRAFT_FR.md`.

Items marked **[confirm]** need the product owner. Items marked **[gap]** are things the app does not do yet. **What changed on 25 October** lists the new sections.

## What changed on 25 October 2026
- **Verse under each prayer.** By default it is chosen on our server; optionally by AI, but only when you ask on that prayer.
- **Bible versions.** Your choice is remembered on your device; Louis Segond 1910 is served by LifeBook itself.
- **Pastor applications.** What applicants share, who sees it, and how long it is kept.
- **Consent history, AI usage counts and safeguarding logs.**

## Who we are
LifeBook **[confirm: legal entity, address, country of establishment, contact for privacy requests, DPO if any]**. Contact: hello@lifebook.app **[confirm it is monitored]**.

## What we collect, and why

| Data | Where it comes from | Why | Stored as |
| --- | --- | --- | --- |
| Name and email, sign-in identity | Google sign-in through Clerk | To create and secure your account | Held by Clerk; LifeBook keeps only an internal id |
| Faith journey, learning goals, preferred formats, language | Onboarding and Settings | To set up your space; with your consent, to suggest reading plans | Plain database fields |
| Consent choices and their history | Onboarding and Settings | To show what you agreed to, and when | Plain database fields, with the date of each change |
| Prayers in your journal, answered notes | You write them | Your private journal | **Encrypted** (AES-256-GCM, bound to the record) |
| The verse chosen for each prayer | Chosen when you save or edit a prayer (see below) | To show a passage of Scripture under your prayer | **Encrypted** with the prayer |
| Guided meditations | Written on request for one prayer | Your private reflection | **Encrypted** with the prayer |
| Daily Word and meditation reflections | You write them | Your private reflections | **Encrypted**. 2 entries written before encryption are still plain text **[gap: encrypt them before launch]** |
| Bible notes, bookmarks, highlights | You add them | Your study | Notes **encrypted**; bookmarks and colours plain |
| Reading history, plan progress, Daily Word steps finished | Your use of the reader and prayer time | To resume where you left off and show your week | Plain database fields |
| Pastoral care requests and messages | You and the pastor | To let a verified pastor listen and pray with you | **Encrypted**; deleted **90 days** after the request closes |
| Safety reports about a care conversation | You or a pastor | Safeguarding | **Encrypted**; kept **365 days** after resolution |
| AI usage counts | Each time an AI feature runs for you | To apply daily limits | Feature name, "generated" or "not generated", and the time. Never the text. |

**Special category data.** Prayers, reflections and faith choices reveal religious beliefs, and may reveal health or other sensitive matters. The adviser should set the legal basis (likely explicit consent) and the wording.

## The verse under your prayer
When you save a prayer, or change its text, LifeBook chooses one passage of Scripture to show under it.

1. **Safety first, on our server.** The text is checked for signs that someone may be in danger. If there are any, you see helplines and an offer to talk to a pastor instead of a verse.
2. **By default, nothing leaves LifeBook.** The words of your prayer are matched to one of LifeBook's prayer topics on our own server, and one of that topic's passages is shown.
3. **Only if you ask, AI chooses instead.** If you have turned on *optional AI processing* in Settings **and** tick *"Let AI choose the verse for this prayer"* on that prayer, its text is sent to **OpenAI**. It goes first to OpenAI's safety check, then to a model that may only pick a passage from LifeBook's list. Turning on the setting alone never sends a prayer. Requests use `store: false` **[confirm the account's retention terms and zero-data-retention status]**.

The chosen verse is stored encrypted with your prayer and deleted with it.

## What we do not do
- We don't use your prayers, reflections or reading to profile you or infer your spiritual maturity.
- **Personalized suggestions** are off unless you switch them on. They use only the journey and goals you chose, plus counts such as whether you have started a reading plan. Never the content of your prayers.
- We don't sell data or show advertising **[confirm]**.
- The Daily Word is the same for everyone.

## When text leaves LifeBook
- **AI, only when you ask on a specific prayer:** a guided meditation, or an AI-chosen verse. That prayer's text is sent to **OpenAI**, as described above. Your name and account are not included.
- **Scripture usage counts:** when you read Scripture served by **API.Bible** (American Bible Society), LifeBook reports anonymous usage so publishers can see their translations being read. This covers KJV, BSB, WEB, NKJV and GNT in English, and J.N. Darby in French. Only a token for the passage, a random device ID and a random session ID are sent, from our server, never your name, email or account. **Louis Segond 1910** is served from LifeBook's own copy, so reading it sends nothing to anyone.

## If you apply to serve as a pastor
Applying is optional and only for the pastoral care pilot.

| What you give | Who sees it | Stored as |
| --- | --- | --- |
| Name for your profile, profile address, a short bio, languages, church, role, country | The safeguarding lead; **members only after you are approved** | Plain database fields |
| A reference's name | The safeguarding lead | Plain database field |
| The reference's phone or email | The safeguarding lead, to check your application | **Encrypted**. Every time the list of applications is opened, it is logged. |
| Training course and date, and the date you accepted the code of conduct | The safeguarding lead | Plain database fields |
| The lead's decision and any note sent back to you | You and the safeguarding lead | Plain database fields |

**The reference** is a third party whose contact details you give us. The adviser should say how they are informed **[adviser]**.

**Retention:** until you withdraw the application or delete your account **[confirm whether a rejected application should be deleted after a set time]**.

## Who processes data for us
| Service | Role | Location |
| --- | --- | --- |
| Clerk | Sign-in and account security | **[confirm]** (US company) |
| Supabase | Database | Frankfurt, EU |
| Render | API hosting | **[confirm region]** |
| Vercel | Web hosting | **[confirm region]** |
| OpenAI | Guided meditation and AI-chosen verses, only when you ask on a prayer; safety checks for those requests | US **[confirm transfer mechanism]** |
| API.Bible | Bible text for most versions; anonymous usage counts | US |
| Google | Sign-in, if you choose it | **[confirm]** |

International transfers (to the US) need a legal mechanism **[adviser]**.

## Stored on your device
Preferences only:
- theme, language and reading settings;
- your chosen Bible version for each language;
- prayer-time length and chime;
- which welcome or "What's new" sheets you've seen, and suggestions you've hidden;
- a random device ID and session ID for the Scripture usage counts.

On the phone app these are kept in the device's secure storage. There are no advertising or third-party tracking cookies **[confirm, including anything added by Clerk]**.

## Safeguarding records
When the safeguarding lead opens a report, approves or sends back a pastor application, opens the list of applications, or suspends or reinstates a pastor, LifeBook records who did it and when. These records hold no conversation text **[confirm retention]**.

## How long we keep it
- **Pastoral care:** 90 days after a request closes.
- **Safety reports:** 365 days after resolution.
- **Everything else:** until you delete it, or delete your account (Settings → Delete my account), which removes it immediately. Safety reports already made about a conversation are kept until their own deletion date, for safeguarding.
- **Backups:** **[confirm the Supabase backup retention period]**.

## Your rights
You have the right to access, correction, deletion, restriction, objection and portability, and you can withdraw consent at any time. You can complain to the regulator: the CNIL in France, or the Data Protection Commission in Ghana.

In Settings you can:
- download all your data: a file with everything LifeBook holds about you, decrypted for you;
- delete prayers one by one or all at once;
- delete your whole account and its data;
- change your choices, including switching off suggestions and optional AI processing.

## Children
**[confirm the minimum age.]** LifeBook is not designed for children under **[13/15/16]**, and sign-up should say so.

## Changes
We'll update this notice when features change and say what changed at the top.
