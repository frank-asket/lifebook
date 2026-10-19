# Expo reader and Daily Word acceptance

Status: **not yet run on devices**. Use this source version of the API with a separate local/staging database and dedicated test accounts. Do not use production data, real private content or database reset commands. Automated component tests use synthetic data and mocked native primitives; successful Hermes exports do not establish native usability.

Run the matrix in English/French and light/dark themes on iOS and Android. Include a small phone, enlarged text and VoiceOver/TalkBack. Record the commit, device, OS, tester and outcome; do not include note/reflection text in the report.

| Journey | Expected |
| --- | --- |
| Bible → Reading plans, signed out | Catalog and chapter readings work; no private progress is exposed and enrollment requires sign-in |
| Enroll and reopen the app | Plan membership and progress come from the API |
| Open a plan chapter | Correct chapter and language; day remains incomplete |
| Mark a day complete, retry and reopen | One completed day persists; retry does not double-count |
| Fail the private progress read | Error and retry appear; public readings remain available; enrollment changes are disabled until the read succeeds |
| Reader → Save a verse | Range controls have accessible labels and comfortable targets; invalid/nonexistent verses are rejected |
| Save bookmark, highlight and synthetic note | Exact passage and locale are preserved; reloading shows the note and theme-appropriate highlight |
| Fail an annotation read or save | Read failure never opens a blank editable form; save failure preserves the draft |
| Web reader: edit a verse omitted from the 200-record list | Saving a seemingly new entry first checks the exact record. An existing note blocks the write, preserves the draft and requires confirmed loading of the saved version |
| Close an unsaved note, then cancel | Editor stays open with the draft intact; confirm discard closes it |
| Delete a saved verse, first cancelling | Cancel leaves it intact; confirm removes bookmark, highlight and note |
| Saved verses → Read chapter / Edit | Correct language/chapter opens; range editor restores its exact saved record. Chapter navigation currently does not scroll to an exact verse |
| Switch between two test accounts | Neither account sees the other's notes, plans, progress or in-memory draft |
| Fail Daily Word session initialization | Retry is offered; no false saved progress or completion appears |
| Save a reflection, then fail the step write | Stay on the same step with the text intact; retry completes only the failed step |
| Fail the final step write | Completion screen does not open until a successful response |
| Jump ahead without finishing all steps | Closing screen explains remaining work; it does not claim full completion |
| Clear a previously saved reflection and continue | Reflection is removed; existing completed steps remain |
| Close a dirty reflection / use Android back | Cancel keeps it; confirm discards it. Saving disables close/step controls |
| Keep prayer time open across midnight | Opened passage remains paired with its original session. Closing and reopening starts the new day |
| Fail chapter metadata, then retry | Chapter controls and translation metadata recover; another translation's stale name is never retained |
| Prayer / You → Meditations | Today, Saved and Completed collections open; language and theme match Settings; saved content retains its own language label |
| No published meditation / unavailable API | A 404 shows an honest empty state; other failures offer retry instead of claiming no content exists |
| Open a meditation and reopen saved/history | Reading does not complete it; explicit completion and bookmark changes persist through the existing API |
| Fail the personal meditation-state read | Public content may remain readable; no blank reflection editor or private write controls appear |
| Edit a meditation reflection, fail save, close and cancel | Failed save and cancelled close preserve the draft; retry saves it without changing completion |
| Bookmark or complete with an unsaved meditation draft | Draft remains intact and still prompts before closing; those actions do not implicitly save it |
| Switch accounts or leave while a meditation request is pending | Old private content and responses do not appear in the new account's navigation tree |

Limits to retain in the product checklist: saved-verse list pagination, exact-verse scrolling, encrypted offline drafts, native session restart checks and broader consent/account parity. Unsent drafts currently live in memory only and are not recoverable after the operating system terminates the app.

Daily Word history and meditation collections/reflection deletion now have source implementations; run the additional [reflection history acceptance matrix](REFLECTION_HISTORY_ACCEPTANCE.md).
