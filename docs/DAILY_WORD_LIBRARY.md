# Daily Word library

The Daily Word everyone sees each day comes from `apps/api/content/daily-word-library.json`. Today it holds only the original three passages, which rotate every three days. The goal is **one reviewed entry for every day of the year**.

## What an entry is

```json
{
  "key": "D_11_01",
  "passage": "PSA.23.1",
  "date": "11-01",
  "en": { "explanation": "…", "question": "…", "prayer": "…", "action": "…" },
  "fr": { "explanation": "…", "question": "…", "prayer": "…", "action": "…" },
  "review": { "status": "draft", "reviewedBy": null, "reviewedOn": null, "notes": "" }
}
```

| Field | Rule |
| --- | --- |
| `key` | Unique, capitals, digits and `_`. For dated entries use `D_MM_DD`. Never change a key once live: it's stored on readers' sessions. |
| `passage` | A passage id in the English (KJV) numbering: `BOOK.CHAPTER.VERSE` or a short range `BOOK.CHAPTER.VERSE-VERSE`, e.g. `JHN.3.16`, `PHP.4.6-7`. |
| `passageFr` | Only when the French (J.N. Darby) numbering differs, which is common in the **Psalms** (e.g. Psalm 46:10 in English is 46:11 in Darby). |
| `date` | The calendar day, `MM-DD`. It repeats every year. `02-29` is allowed. |
| `en`, `fr` | All four fields in both languages. Limits: explanation 420 characters, question 160, prayer 420, action 200. |
| `review` | `draft` → written, not yet approved. `reviewed` → approved by a named reviewer on a date (`YYYY-MM-DD`). `legacy` → the original three entries. |

**Never put Scripture text in the library.** The app always shows the verse from the published translation, so wording, attribution and copyright stay correct, and the validator refuses any extra field such as `text`.

## What readers see

- **Production** shows `reviewed` and `legacy` entries. **Staging** also shows drafts when `DAILY_WORD_ALLOW_DRAFT=true`.
- On a date with a servable entry, everyone sees that entry. On a date without one, the original three-passage rotation continues unchanged.
- Adding an entry never changes what any other day shows.

## Workflow

1. **Get blank entries** for the days you'll write:
   `node apps/api/scripts/daily-word-library.cjs --template 11-01 --to 11-30`
2. **Write** the passage id and the English and French text. Keep explanations faithful to the passage, and avoid claiming God's specific will for the reader or promising outcomes. Leave `status` as `draft`.
3. **Check** (after `pnpm --filter @lifebook/api build`):
   `node apps/api/scripts/daily-word-library.cjs --check --verify-passages`
   This validates every entry, shows coverage and the next 14 days, and looks up every passage in both translations. Compare the two references printed for each entry; if the French number differs, add `passageFr`.
4. **Review on staging** with `DAILY_WORD_ALLOW_DRAFT=true`.
5. **Approve:** the pastoral reviewer sets `status` to `reviewed`, with `reviewedBy` and `reviewedOn`.
6. **Ship:** open a PR. The API deploys on merge; no database change is needed.

## Ideas for the calendar

Seasons work well with dated entries: Advent and Christmas, Lent, Holy Week and Easter (whose dates move each year, so revisit those entries yearly), Pentecost, and the new year. Balance the Old and New Testaments, and include whole short passages rather than proof-texts.
