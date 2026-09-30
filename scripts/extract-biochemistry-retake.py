"""Extract the already-imported, native-text Term 1 biochemistry sources.

Read-only toward source PDFs. Excludes the physiology/histology question ranges.
The alternate February scan is a duplicate, not another exam sitting.
"""
from pathlib import Path
import json
import re
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PAPERS = [
    ("cell-block", 2, "CELL BLOCK THEORY FINAL EXAM.pdf", 27, 84),
    ("february-2021", 3, "Feburay 2021 cell theory answers.pdf", 1, 57),
    ("biochemistry-2022", 5, "Biochem1 Finals 2022.pdf", 1, 64),
    ("september-2021", 6, "SEP2021 T.pdf", 1, 63),
]
out = []
for paper_id, asset, name, first, last in PAPERS:
    reader = PdfReader(ROOT / f"public/study/past-paper-downloads/originals/term1-source-{asset}.pdf")
    rows = []
    for page_no, page in enumerate(reader.pages, 1):
        raw = page.extract_text() or ""
        matches = [m for m in re.finditer(r"(?:^|\n)\s*(\d+)\s*[-–]", raw)
                   if not raw[m.end():].startswith(("D stereochemical", "Hydroxycholecalciferol"))]
        for i, match in enumerate(matches):
            number = int(match.group(1))
            if first <= number <= last:
                text = raw[match.end():matches[i+1].start() if i+1 < len(matches) else len(raw)].strip()
                rows.append({"number": number, "page": page_no, "text": text})
        image_page = {3: 7, 5: 3, 6: 5}.get(asset)
        if page_no == image_page:
            images = list(page.images)
            assert len(images) == 1, "Review extraction if source image count changes"
            dest = ROOT / f"public/study/biochemistry-retake/{paper_id}-reaction.png"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(images[0].data)
    assert {r['number'] for r in rows} == set(range(first, last+1)), (paper_id, "Question extraction gap")
    assert len(rows) == last-first+1, (paper_id, "Duplicate question number")
    out.append({"id": paper_id, "name": name, "asset": asset, "first": first, "last": last, "questions": rows})
dest = ROOT / "data/biochemistry-retake/source-extract.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
print(f"Extracted {sum(len(p['questions']) for p in out)} biochemistry source occurrences from {len(out)} papers.")
