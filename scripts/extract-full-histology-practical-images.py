"""Extract answer-neutral histology crops from the supplied PRACTICAL.pptx.

The raw teaching deck is intentionally not committed. This script records the
source slide and normalized crop for every derived study image.
"""

from __future__ import annotations

import io
import os
import posixpath
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get("PRACTICAL_PPTX", "/Users/rizzist/Downloads/PRACTICAL.pptx"))
OUTPUT = ROOT / "public/study/histology/practicals/full"

# slug: (slide number, left, top, right, bottom), using fractions of the
# largest raster image on that slide. Marginal labels/captions are excluded.
CROPS = {
    "simple-squamous": (5, 0.03, 0.02, 0.97, 0.84),
    "simple-columnar": (11, 0.19, 0.02, 0.80, 0.88),
    "stratified-squamous-nonkeratinized": (15, 0.20, 0.02, 0.78, 0.72),
    "stratified-cuboidal": (18, 0.18, 0.02, 0.82, 0.86),
    "loose-connective-tissue": (20, 0.18, 0.02, 0.82, 0.86),
    "dense-irregular-connective-tissue": (22, 0.12, 0.13, 0.50, 0.82),
    "spongy-bone": (34, 0.18, 0.02, 0.82, 0.87),
    "endochondral-ossification": (36, 0.35, 0.02, 0.84, 0.88),
    "erythrocytes-platelets": (38, 0.36, 0.02, 0.86, 0.84),
    "neutrophil": (39, 0.15, 0.02, 0.58, 0.83),
    "eosinophil": (40, 0.23, 0.02, 0.79, 0.83),
    "lymphocyte": (41, 0.18, 0.02, 0.59, 0.62),
    "monocyte": (42, 0.19, 0.02, 0.82, 0.84),
    "basophil": (43, 0.19, 0.02, 0.82, 0.84),
    "muscle-spindle": (48, 0.18, 0.02, 0.82, 0.87),
    "sympathetic-ganglion": (59, 0.18, 0.02, 0.82, 0.87),
    "parotid": (62, 0.12, 0.02, 0.86, 0.87),
    "submandibular": (63, 0.22, 0.02, 0.80, 0.87),
    "sublingual": (64, 0.20, 0.02, 0.82, 0.87),
    "lip": (65, 0.16, 0.02, 0.84, 0.87),
    "tongue-papillae": (67, 0.18, 0.02, 0.82, 0.87),
    "circumvallate-papilla": (68, 0.18, 0.02, 0.82, 0.88),
    "lingual-tonsil": (70, 0.18, 0.02, 0.82, 0.87),
    "esophagus": (71, 0.18, 0.02, 0.82, 0.87),
    "stomach-fundus": (73, 0.21, 0.02, 0.80, 0.88),
    "duodenum": (76, 0.18, 0.02, 0.82, 0.87),
    "ileum": (77, 0.17, 0.02, 0.83, 0.87),
    "colon": (78, 0.18, 0.02, 0.82, 0.87),
    "appendix": (79, 0.25, 0.05, 0.75, 0.85),
    "adrenal": (82, 0.16, 0.02, 0.69, 0.90),
    "pituitary": (85, 0.16, 0.02, 0.84, 0.88),
    "kidney-cortex": (91, 0.18, 0.02, 0.66, 0.90),
    "kidney-medulla": (93, 0.18, 0.02, 0.82, 0.87),
    "juxtaglomerular-apparatus": (92, 0.20, 0.02, 0.82, 0.87),
    "muscular-artery-vein": (99, 0.18, 0.02, 0.82, 0.87),
    "large-vein": (100, 0.18, 0.02, 0.82, 0.88),
    "lymph-node": (102, 0.22, 0.03, 0.66, 0.88),
    "thymus": (108, 0.18, 0.02, 0.65, 0.88),
    "spleen": (110, 0.18, 0.02, 0.82, 0.88),
    "palatine-tonsil": (113, 0.18, 0.02, 0.82, 0.88),
}


def largest_raster_for_slide(archive: ZipFile, slide_number: int) -> tuple[bytes, str]:
    rel_path = f"ppt/slides/_rels/slide{slide_number}.xml.rels"
    relationship_root = ET.fromstring(archive.read(rel_path))
    candidates: list[tuple[int, bytes, str]] = []
    for relationship in relationship_root:
        target = relationship.attrib.get("Target", "")
        if "/media/" not in target:
            continue
        media_path = posixpath.normpath(posixpath.join("ppt/slides", target))
        data = archive.read(media_path)
        try:
            with Image.open(io.BytesIO(data)) as image:
                candidates.append((image.width * image.height, data, media_path))
        except Exception:
            continue
    if not candidates:
        raise RuntimeError(f"Slide {slide_number} has no readable raster image")
    _, data, media_path = max(candidates, key=lambda item: item[0])
    return data, media_path


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Source deck not found: {SOURCE}\nSet PRACTICAL_PPTX to override it.")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with ZipFile(SOURCE) as archive:
        for slug, (slide, left, top, right, bottom) in CROPS.items():
            data, media_path = largest_raster_for_slide(archive, slide)
            with Image.open(io.BytesIO(data)) as source_image:
                image = ImageOps.exif_transpose(source_image).convert("RGB")
                width, height = image.size
                box = (
                    round(width * left),
                    round(height * top),
                    round(width * right),
                    round(height * bottom),
                )
                crop = image.crop(box)
                if crop.width > 1400:
                    new_height = round(crop.height * 1400 / crop.width)
                    crop = crop.resize((1400, new_height), Image.Resampling.LANCZOS)
                destination = OUTPUT / f"{slug}.jpg"
                crop.save(destination, "JPEG", quality=92, optimize=True, progressive=True)
                print(
                    f"{slug}: slide {slide}, {media_path}, {width}x{height}, "
                    f"crop={box} -> {destination.relative_to(ROOT)}"
                )

    expected = {f"{slug}.jpg" for slug in CROPS}
    actual = {path.name for path in OUTPUT.glob("*.jpg")}
    stale = sorted(actual - expected)
    if stale:
        raise SystemExit(f"Unexpected stale crops in {OUTPUT}: {', '.join(stale)}")
    print(f"Wrote {len(CROPS)} practical crops from {SOURCE.name}.")


if __name__ == "__main__":
    main()
