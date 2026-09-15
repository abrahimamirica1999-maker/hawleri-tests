# hawleri-tests

Hawleri review sheet for the course's **test strings**. Static page, no build
step. Edit `index.html` / `items.json` and push; GitHub Pages serves it.

Sibling of `kawa-voice`, minus the conversation layer: the unit here is one
test string, not a scene.

## What's in it

`items.json` — 2,325 distinct Standard Kurdish strings that the app's tests
draw on, ordered by **learner exposure** (most-used first, 17,782 exposures in
total), each with:

| field | |
|---|---|
| `id` | `t` + first 8 hex of sha1(standard text) — stable across rebuilds |
| `s` | the Standard Sorani original |
| `d` | my Hawleri draft |
| `en` / `ar` | English and Iraqi Arabic meaning where the course has them (1,030 of 2,325) |
| `c` | draft confidence — high 628 / medium 1,319 / low 378 |
| `n` | learner exposures |
| `u` | first unit the string appears in |

Cut into 47 sections of 50 so it never reads as one endless list. Progress
lives in `localStorage` under `hawleri_tests_v1:tests-all`, and `items.json` is
cached there too, so a reload with no signal still works.

## Rebuilding items.json

From the `hawler spark` repo (the data is not in this repo):

```
python .claude/skills/hawleri-sorani/pull_course.py      # only if the raw pull is stale
python .claude/skills/hawleri-sorani/convert_pull.py     # Standard -> Hawleri
python others/build_tests_site_data.py                   # -> others/hawleri-tests/items.json
```

Ids are derived from the Standard text, so a rebuild keeps her saved progress
and lines up with rows already in the sheet.

## The sheet

`apps-script.gs` is bound to the spreadsheet, not to this repo. Deploy it as a
web app and paste the `/exec` URL into `SHEET_URL` at the top of the `<script>`
in `index.html`. Until that's filled in the page still works — it saves locally
and the send dialog can copy the whole thing as CSV.

It writes two tabs: `answers` (one row per string, upserted on `item_id`) and
`log` (every submission appended raw, never edited).
