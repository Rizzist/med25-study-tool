"""Reproducible native-text import of the complete original C&M papers.

Keep source numbering, option order, printed key glyph coordinates and figures.
The checked-in extract is reviewed by build-biochemistry-retake.mjs; extraction
does not treat a printed key as an independently correct scientific answer.
"""
import json
import re
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PAPERS = [("cell-block", 2, 84, 27, 84), ("february-2021", 3, 80, 1, 57),
          ("biochemistry-2022", 5, 64, 1, 64), ("september-2021", 6, 86, 1, 64)]


def clean(text):
    return re.sub(r"\s+", " ", re.sub(r"[\u0600-\u06ff\ufb50-\ufeff\ue013]", "", text)).strip()


papers = []
for name, asset, count, first_bio, last_bio in PAPERS:
    source = ROOT / f"public/study/past-paper-downloads/originals/term1-source-{asset}.pdf"
    native = PdfReader(source)
    rows = []
    with pdfplumber.open(source) as pdf:
        for page_no, page in enumerate(pdf.pages, 1):
            groups = []
            for line in page.extract_text_lines():
                match = re.match(r"^(\d+)-\s*", line["text"])
                # All actual question numbers start at the left question margin;
                # numbered chemical names inside options must not split rows.
                if match and line["x0"] < (180 if asset == 2 else 40):
                    groups.append({"number": int(match[1]), "page": page_no, "lines": [line]})
                elif groups and 55 < line["top"] < page.height - 35:
                    groups[-1]["lines"].append(line)
            for index, group in enumerate(groups):
                n = group["number"]
                bio = first_bio <= n <= last_bio
                row = {"number": n, "page": page_no, "biochemistry": bio,
                       "text": "\n".join(l["text"] for l in group["lines"])}
                # Existing audited biochemistry wording/keys are retained by the builder.
                if not bio or (name == "september-2021" and n == 64):
                    prompts, options, pending_key = [], [], False
                    for line in group["lines"]:
                        text = clean(line["text"])
                        option = any(abs(c["size"] - 9.75) < .04 for c in line["chars"])
                        keyed = "\ue013" in line["text"]
                        if not text and keyed:
                            pending_key = True
                            continue
                        if option:
                            options.append({"id": chr(65 + len(options)), "text": text})
                            if keyed or pending_key:
                                row["sourceKey"] = options[-1]["id"]
                            pending_key = False
                        elif not options and text and any(abs(c["size"] - 10.5) < .04 for c in line["chars"]):
                            prompts.append(re.sub(r"^\d+-\s*", "", text))
                    row.update(prompt=" ".join(prompts).strip(), options=options)
                    assert len(options) == 4 and row.get("sourceKey"), (name, n, row)
                    top = group["lines"][0]["top"]
                    bottom = groups[index + 1]["lines"][0]["top"] if index + 1 < len(groups) else page.height - 35
                    # The Q73 source positions its illustration slightly above its number.
                    images = [im for im in page.images if top - 8 <= im["top"] < bottom]
                    if images:
                        assert len(images) == 1 and len(native.pages[page_no - 1].images) == 1
                        im = native.pages[page_no - 1].images[0]
                        filename = f"{name}-q{n:03d}{Path(im.name).suffix}"
                        (ROOT / "public/study/biochemistry-retake" / filename).write_bytes(im.data)
                        row["image"] = filename
                rows.append(row)
    assert [r["number"] for r in rows] == list(range(1, count + 1)), name
    papers.append({"id": name, "asset": asset, "questions": rows})

(ROOT / "data/biochemistry-retake/full-source-extract.json").write_text(json.dumps(papers, ensure_ascii=False, indent=2) + "\n")
print(f"Imported {sum(len(p['questions']) for p in papers)} numbered source questions.")
