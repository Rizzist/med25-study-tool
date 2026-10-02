"""Extract source diagrams only; never redraw anatomy or include marked answers.

Usage: python crop-limbs-october.py OCR_OUTPUT_DIRECTORY
OCR images come from inspect-limbs-sources.swift, with Past year 3 at 004
and Past year 2 at 005. Normalized bounds were visually checked on originals.
"""
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1])
crops = [
    ('004/001.png', 'limbs-upper-axial-fragment/q001.png', (.080, .267, .425, .494)),
    ('004/004.png', 'limbs-upper-axial-fragment/q004.png', (.076, .181, .312, .422)),
    ('005/019.png', 'limbs-lower-axial-fragment/q017.png', (.047, .194, .867, .419)),
]
for original, name, bounds in crops:
    image = Image.open(source / original).convert('RGB')
    width, height = image.size
    cropped = image.crop(tuple(round(value * (width if i % 2 == 0 else height)) for i, value in enumerate(bounds)))
    dest = root / 'public/study/limbs/figures' / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dest, optimize=True)
    print(name, cropped.size)
