#!/usr/bin/env python3
"""Render the textbook crops used by the 15-slide histology practical bank.

The crop rectangles contain figure artwork only. Captions and answer-revealing
labels are excluded. Coordinates are pixels measured on a 144-DPI page render
and are scaled automatically when ``RENDER_DPI`` changes.

Requires Pillow (see requirements-histology-practicals.txt) and Poppler's
``pdftoppm`` executable on PATH, or supplied through ``PDFTOPPM_BIN``.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BOOKS = Path(os.environ.get("MED_SCHOOL_BOOKS_DIR", Path.home() / "Documents" / "MED SCHOOL BOOKS"))
OUTPUT = ROOT / "public" / "study" / "histology" / "practicals"
TMP = ROOT / "tmp" / "pdfs" / "histology-practicals"
RENDER_DPI = int(os.environ.get("RENDER_DPI", "288"))

SOURCES = {
    "junqueira": BOOKS / "Junqueira's Basic Histology 16th Edition.pdf",
    "difiore": BOOKS / "diFiore's Atlas of Histology with Functional Correlations.pdf",
}

# source, one-based PDF page, crop at 144 DPI (left, top, right, bottom), output
CROPS = [
    ("junqueira", 365, (830, 270, 1120, 865), "trachea.jpg"),
    ("difiore", 397, (432, 192, 980, 670), "bladder.jpg"),
    ("difiore", 115, (350, 200, 1010, 600), "compact-bone.jpg"),
    ("difiore", 179, (411, 193, 1023, 594), "peripheral-nerve.jpg"),
    ("difiore", 185, (392, 648, 1007, 1130), "dorsal-root-ganglion.jpg"),
    ("difiore", 241, (360, 218, 1057, 656), "skin-with-hair.jpg"),
    ("difiore", 247, (349, 159, 1000, 660), "thick-skin.jpg"),
    ("junqueira", 134, (734, 262, 1064, 533), "white-adipose.jpg"),
    ("junqueira", 137, (214, 837, 707, 1350), "brown-adipose.jpg"),
    ("junqueira", 205, (165, 260, 480, 470), "skeletal-muscle.jpg"),
    ("difiore", 85, (342, 659, 1038, 1127), "tendon.jpg"),
]


def find_pdftoppm() -> str:
    configured = os.environ.get("PDFTOPPM_BIN")
    if configured:
        return configured
    found = shutil.which("pdftoppm")
    if found:
        return found
    raise RuntimeError("pdftoppm was not found; set PDFTOPPM_BIN to the Poppler executable")


def main() -> None:
    pdftoppm = find_pdftoppm()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    scale = RENDER_DPI / 144

    rendered: dict[tuple[str, int], Path] = {}
    for source, page, box, filename in CROPS:
        source_path = SOURCES[source]
        if not source_path.exists():
            raise FileNotFoundError(source_path)

        key = (source, page)
        render_path = rendered.get(key)
        if render_path is None:
            prefix = TMP / f"{source}-page-{page}"
            subprocess.run(
                [
                    pdftoppm,
                    "-f",
                    str(page),
                    "-l",
                    str(page),
                    "-singlefile",
                    "-png",
                    "-r",
                    str(RENDER_DPI),
                    str(source_path),
                    str(prefix),
                ],
                check=True,
            )
            render_path = prefix.with_suffix(".png")
            rendered[key] = render_path

        scaled_box = tuple(round(value * scale) for value in box)
        with Image.open(render_path) as page_image:
            crop = page_image.crop(scaled_box).convert("RGB")
            crop.save(OUTPUT / filename, quality=92, optimize=True, progressive=True)
        print(f"wrote {filename} from {source} PDF page {page}")


if __name__ == "__main__":
    main()
