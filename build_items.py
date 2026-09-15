# -*- coding: utf-8 -*-
"""Build items.json for this review site.

Source: the converted course CSV, which lives in the `hawler spark` app repo,
not here -- regenerate it with
`python .claude/skills/hawleri-sorani/convert_pull.py` first. Keeps only rows
the `tests` pool contributes, orders them by learner exposure so the most-used
strings are corrected first even if the reviewer never reaches the end, and
gives every row an id derived from the Standard text -- so a re-run produces
the SAME ids, and her saved progress and her rows in the sheet still line up.

  python build_items.py [path/to/Supabase course material - Standard Sorani to Hawleri.csv]

With no argument it looks for the CSV in a sibling `hawler spark` checkout,
which is where it sits when this repo is cloned inside `others/`.
"""
import csv, hashlib, io, json, os, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SRC = os.path.join(
    os.path.dirname(os.path.dirname(HERE)), "others", "Hawleri-Sorani",
    "Supabase course material - Standard Sorani to Hawleri.csv")
SRC = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
OUT = os.path.join(HERE, "items.json")
PER_SECTION = 50


def iid(s):
    return "t" + hashlib.sha1(s.encode("utf-8")).hexdigest()[:8]


def first_unit(u):
    u = (u or "").strip()
    if not u:
        return ""
    return u.split(",")[0].strip()


def main():
    if not os.path.exists(SRC):
        raise SystemExit(
            "converted CSV not found:\n  %s\n"
            "Pass its path as an argument, or regenerate it with\n"
            "  python .claude/skills/hawleri-sorani/convert_pull.py" % SRC)
    rows = [r for r in csv.DictReader(io.open(SRC, encoding="utf-8-sig"))
            if "tests" in (r["source"] or "")]
    rows.sort(key=lambda r: (-int(r["occurrences"] or 0), r["standard_kurdish"]))

    items, seen = [], set()
    for r in rows:
        s = (r["standard_kurdish"] or "").strip()
        if not s or s in seen:
            continue
        seen.add(s)
        items.append({
            "id": iid(s),
            "s": s,
            "d": (r["hawleri"] or "").strip() or s,
            "en": (r["english"] or "").strip(),
            "ar": (r["arabic"] or "").strip(),
            "c": r["confidence"],
            "n": int(r["occurrences"] or 0),
            "u": first_unit(r["units"]),
        })

    data = {
        "batch": "tests-all",
        "label": "دەقەکانی تاقیکردنەوە",
        "per": PER_SECTION,
        "intro": ("ئەمانە هەموو ئەو دەقانەن کە لە تاقیکردنەوەکانی ئەپەکەدا "
                  "بەکاردێن. ئەمن لە کوردیی ستاندارد بۆ هەولێری گۆڕیومە — "
                  "بەڵام بە پڕۆگرام، لەبەر ئەوە هەڵەی تێدایە. ئەرکی تۆ ئەوەیە "
                  "هەولێرییەکە ڕاست بکەوە.\n\nلای هەر دەقێک، دەقە ستانداردەکە "
                  "دەبینی، و ئەگەر هەبێ مانا ئینگلیزی و عەرەبییەکەشی. ئەگەر "
                  "هەولێرییەکەی ئەمن ڕاستە، تەنیا «ڕاستە ✓» لێ بدە. ئەگەر نا، "
                  "بیگۆڕە و بڕۆ بۆ دواتر.\n\nپێویست ناکا هەمووی بە جارێک "
                  "تەواو بکەی — ئیشەکەت خۆی پارێزراوە، هەر کاتێک بگەڕێوە لە "
                  "هەمان شوێن دەست پێدەکەیتەوە."),
        "items": items,
    }
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))

    import collections
    c = collections.Counter(i["c"] for i in items)
    print("items          : %d" % len(items))
    print("sections of %d : %d" % (PER_SECTION, -(-len(items) // PER_SECTION)))
    print("with english   : %d" % sum(1 for i in items if i["en"]))
    print("with arabic    : %d" % sum(1 for i in items if i["ar"]))
    print("draft differs  : %d" % sum(1 for i in items if i["d"] != i["s"]))
    print("confidence     : " + "  ".join("%s=%d" % (k, c[k])
                                          for k in ("high", "medium", "low")))
    print("exposures      : %d" % sum(i["n"] for i in items))
    print("wrote %s (%.0f KB)" % (OUT, os.path.getsize(OUT) / 1024.0))


if __name__ == "__main__":
    main()
