Review sheet. Static page, no build step; GitHub Pages serves it. Unlisted (`noindex`, `robots.txt` disallows all).

Now (2026-11-10): **posts context**, the human check of the Arabic and Kurdish texts of arabickurdishbot's Instagram
posts (reel lines, word cards, translation lines, captions, hashtags). Two groups on the first screen: Iraqi Arabic
(screens in Arabic) and Kurdish (screens in Sorani). One section per post, one screen per text: the English meaning,
where it appears, who says it, the same line in the other language, and the text now. The reviewer answers "the text
is right" or types the right text, plus an optional note. Paging past records nothing.

`items.json` is written by the story-shorts skill's `review.py`. Only posts that are still being checked are here;
a post leaves this public repo when its check is complete (the record stays in a private repo).

Answers go to the Google Sheet (tabs `posts_answers`, `posts_log`) through `apps-script.gs`; its `/exec` URL is
`SHEET_URL` in `index.html`.

Earlier rounds were removed from this repo on 2026-11-10 (history wiped on purpose; their answers live in their Sheets).
