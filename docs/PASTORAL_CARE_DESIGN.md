# Pastoral Care — design note

**Status:** proposal, 17 October 2026. The product owner has pastors ready for a pilot.
**Working name:** "Ask a pastor"

## What it is, and what it is not

A member can ask a **verified LifeBook pastor** to reach out to them. The pastor replies within an agreed time, by private message and, if the member chooses, by phone.

It is **pastoral care, not an emergency service.** Pastors are volunteers with limited hours and are not crisis counsellors. Wherever the app offers a pastor, an emergency number and a crisis line come first (see `M3.7_CRISIS_CONTACTS_DRAFT.md`). The member is told the expected reply time **before** writing anything.

## Why pilot it now

The pilot needs verified pastor profiles, not the whole LivingWord content platform. Building those profiles first serves both: M3.8 LivingWord reuses them for sermons and teachings.

## Pilot shape

| | |
| --- | --- |
| Pastors | 3–5, from one or two churches whose leadership endorses them |
| Members | Adults (18+) only |
| Languages | The languages the pilot pastors actually speak; members choose one |
| Reply promise | Within 24 hours (adjust to what the pastors can keep) |
| Contact | Private in-app messages. Phone only if the member chooses to share a number for a callback. |
| Duration | 8 weeks, with a review every week |

## Member flow

1. **Entry points:** Prayer Sanctuary ("Would you like a pastor to pray with you?"), the crisis screen (after the helplines), and a pastor's profile.
2. **Before writing:** who will read the message (one verified pastor), the reply time, and that this is not an emergency service, with emergency numbers shown.
3. **Request:** a broad topic (prayer, grief, family, faith questions and so on), a short message, language, and contact preference (messages only, or a callback with a phone number the member enters). There is an explicit consent box for sharing this with a pastor.
4. **Matching (pilot):** requests go to a shared queue for the pilot pastors. The first available pastor who speaks the language claims it, and only that pastor can then read it. Later, members could also choose a specific pastor.
5. **Conversation:** a private thread between the member and that pastor only. Either side can close it. The member is asked one optional feedback question.
6. **If something feels wrong:** "Report a concern" on every thread goes to LifeBook's safeguarding lead, not to the pastor or their church.

The prayer journal never leaves the member's control. Nothing from it is shared unless the member copies it into a request.

## Safeguards

1. **Verification:** identity, church name and role, country, languages, and a reference from church leadership. Recorded with who verified it and when.
2. **Training before activation:** a suicide-awareness course (for example Mental Health First Aid or LivingWorks safeTALK), plus a LifeBook briefing on the app, the escalation steps and the code of conduct.
3. **Code of conduct, signed and dated:** no requests for money, gifts or donations; no romantic or sexual contact; no pressure to join a church or change denomination; no sharing what members say; respect when a member ends contact; refer to professionals for medical, legal, psychological or abuse concerns.
4. **Contact stays in LifeBook:** pastors don't receive members' email addresses. A phone number is shown only when the member opted into a callback, and only to the assigned pastor.
5. **Escalation:** if a pastor believes someone is in immediate danger, they direct the member to emergency services and alert the safeguarding lead. LifeBook does not contact emergency services on anyone's behalf in the pilot.
6. **Oversight:** one named **safeguarding lead** handles reports, can suspend a pastor immediately, and reviews pilot metrics weekly.
7. **Limits:** a cap on open requests per pastor; requests not claimed in time are flagged to the lead, and the member is told honestly.

## Privacy and data

- Messages and request text are encrypted with the existing envelope, bound to the thread, and readable only by the member and the assigned pastor.
- **Admins can't read conversations.** A report shares only what the member or pastor chooses to include in it.
- Closed threads are deleted after a set period (proposal: 90 days) unless the member chooses to keep them. Members can delete their requests at any time.
- Notifications ("You have a new message") never contain message content.
- Faith and health information is special-category data under GDPR (France) and sensitive data under Ghana's Data Protection Act, 2012. **Before launch:** update the privacy notice, complete a data protection impact assessment, and confirm with a qualified adviser whether LifeBook must register with Ghana's Data Protection Commission.

## Data model (additive)

Builds on the existing `User`, `PlatformRole`, `VerificationStatus` and `MinistryVerification`.

| Model | Key fields |
| --- | --- |
| `MinistryVerification` (extend) | `churchName`, `ministryRole`, `country`, `referenceName`, `referenceContact`, `trainingCompletedAt`, `codeOfConductSignedAt`, `verifiedById` |
| `PastorProfile` (new; reused by LivingWord) | `userId`, `displayName`, `bio`, `languages[]`, `acceptingRequests`, `maxOpenRequests` |
| `CareRequest` (new) | `memberId`, `topic`, `language`, `contactPreference`, `phoneCiphertext?`, `messageCiphertext`, `consentAt`, `status` (open, claimed, closed), `pastorId?`, `claimedAt`, `closedAt`, `deleteAfter` |
| `CareMessage` (new) | `requestId`, `senderId`, `ciphertext`, `createdAt` |
| `CareReport` (new) | `requestId`, `reporterId`, `detailsCiphertext`, `status`, `handledById`, `handledAt` |

A user acts as a pastor only when their verification is `APPROVED`, training and the code of conduct are recorded, and `acceptingRequests` is on. The safeguarding lead uses `MODERATOR`.

## Delivery slices

1. **Pastor foundation:** extend verification, add pastor profiles, and a guarded admin script to approve or suspend pastors (no admin UI yet). Public pastor profile pages.
2. **Requests and messaging:** request form with consent, shared queue and claiming, encrypted threads, notifications without content, and reply-time warnings.
3. **Safety and lifecycle:** report a concern, safeguarding-lead view, suspension, closing, feedback and automatic deletion.
4. **Pilot:** onboard pastors on staging, rehearse with test accounts (including a report and a suspension), then a production pilot.

Each slice gets the same checks as M3.6 and M3.7: ownership tests, encryption at rest, and a two-account staging run.

## Pilot success measures

- At least 90% of requests get a first reply within the promised time.
- Member feedback is mostly positive (one optional question).
- Every report is acknowledged within 24 hours and resolved.
- Pastor workload stays within the agreed cap.

## What's needed from the product owner

1. **The pilot pastors:** names, churches, countries, languages, and a leadership reference for each.
2. **A safeguarding lead:** one person, not one of the pilot pastors.
3. **Training:** which suicide-awareness course, and a date for completion.
4. **Code of conduct:** approve the wording above (or your church's own) and have each pastor sign it.
5. **Reply promise:** the reply time and weekly hours the pastors can genuinely keep.
6. **Notifications:** how pastors should be alerted (email, WhatsApp or another channel), knowing the alert carries no content.
7. **Legal check:** someone to review the privacy notice and the Ghana and France data-protection points.
