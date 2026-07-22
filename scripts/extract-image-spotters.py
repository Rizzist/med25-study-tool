#!/usr/bin/env python3
"""Render source-PDF crops used by the local image-recognition question bank.

The crop rectangles intentionally exclude textbook captions and answer-revealing
page text. Coordinates use PDF points: (x0, y0, x1, y1).
"""

import os
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
BOOKS = Path(
    os.environ.get(
        "MED_SCHOOL_BOOKS_DIR",
        Path.home() / "Documents" / "MED SCHOOL BOOKS",
    )
)
OUTPUT = ROOT / "public" / "study" / "image-bank"

SOURCES = {
    "junqueira": BOOKS / "Junqueira's Basic Histology 16th Edition.pdf",
    "langman": BOOKS / "embryology" / "Langman's Medical Embryology 15th Edition - OCR.pdf",
}

# (source, one-based PDF page, crop box, output filename)
# These are filled after visual source review; running the script is repeatable.
CROPS: list[tuple[str, int, tuple[float, float, float, float], str]] = [
    # Histology: figure artwork only; caption blocks and page headings excluded.
    ("junqueira", 15, (290.8, 95.4, 542.9, 338.2), "histo-pas-small-intestine.png"),
    ("junqueira", 120, (88.7, 95.7, 311.4, 358.5), "histo-silver-reticular-fibers.png"),
    ("junqueira", 143, (319.4, 371.5, 503.7, 618.9), "histo-hyaline-cartilage.png"),
    ("junqueira", 145, (303.0, 95.8, 549.1, 408.3), "histo-fibrocartilage.png"),
    ("junqueira", 157, (303.0, 95.7, 549.1, 442.5), "histo-osteon.png"),
    ("junqueira", 205, (214.8, 94.1, 371.7, 199.0), "histo-cardiac-muscle.png"),
    ("junqueira", 257, (116.0, 90.0, 241.0, 373.0), "histo-eosinophil.png"),
    ("junqueira", 289, (288.5, 464.6, 514.0, 614.4), "histo-thymus.png"),
    ("junqueira", 300, (323.1, 487.0, 546.7, 654.2), "histo-spleen-white-pulp.png"),
    ("junqueira", 327, (82.9, 432.1, 213.0, 615.5), "histo-small-intestine.png"),
    ("junqueira", 413, (48.0, 95.2, 280.8, 464.5), "histo-renal-cortex.png"),
    ("junqueira", 442, (344.1, 95.2, 564.0, 251.0), "histo-thyroid.png"),
    ("junqueira", 452, (377.3, 214.4, 529.3, 364.7), "histo-seminiferous-tubule.png"),
    ("junqueira", 474, (330.0, 95.4, 570.0, 266.6), "histo-primordial-follicles.png"),
    ("junqueira", 514, (72.1, 91.2, 277.3, 426.4), "histo-retina.png"),
    # Embryology: figures intentionally retain anatomical arrows but not captions.
    ("langman", 57, (60.0, 50.0, 535.0, 220.0), "embryo-cleavage-morula.png"),
    ("langman", 65, (95.0, 45.0, 535.0, 275.0), "embryo-day-eight-implantation.png"),
    ("langman", 74, (70.0, 280.0, 525.0, 520.0), "embryo-bilaminar-disc.png"),
    ("langman", 88, (60.0, 50.0, 535.0, 475.0), "embryo-primitive-streak.png"),
    ("langman", 90, (80.0, 45.0, 520.0, 650.0), "embryo-neurulation-days-22-23.png"),
]


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    opened: dict[str, fitz.Document] = {}
    try:
        for source, page_number, box, filename in CROPS:
            doc = opened.setdefault(source, fitz.open(SOURCES[source]))
            page = doc[page_number - 1]
            pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), clip=fitz.Rect(*box), alpha=False)
            pix.save(OUTPUT / filename)
            print(f"wrote {filename} from {source} PDF page {page_number}")
    finally:
        for doc in opened.values():
            doc.close()


if __name__ == "__main__":
    main()
