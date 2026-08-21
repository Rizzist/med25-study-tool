#!/usr/bin/env python3
"""Build answer-neutral fields for the 15-slide microscope identification bank.

The committed inputs are the verified local/book and course-derived assets already
used by MED//25. Optional WhatsApp inputs are a downloaded private photo directory
supplied through ``WHATSAPP_PRACTICAL_DIR`` or the older album-preview fallback
through ``WHATSAPP_PRACTICAL_SCREENSHOT``. Only tightly cropped microscope fields
are written to the public study directory. Chat names, phone numbers, captions,
student markings and AI overlays are never retained.

Requires Pillow.  Use the bundled Codex Python runtime or install the dependency
listed in ``requirements-histology-practicals.txt``.
"""

from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "study"
OUTPUT = PUBLIC / "histology" / "practicals" / "identification-15"


# slug: source path, then three pixel crops (left, top, right, bottom).
# The crops remove answer-revealing figure letters/labels where those exist and
# provide genuinely different fields/magnifications for transfer practice.
FIELDS: dict[str, tuple[str, tuple[int, int, int, int], tuple[int, int, int, int], tuple[int, int, int, int]]] = {
    "trachea": (
        "histology/practicals/trachea.jpg",
        (0, 0, 580, 1190),
        (0, 0, 580, 360),
        (0, 320, 580, 1190),
    ),
    "bladder": (
        "histology/practicals/bladder.jpg",
        (0, 0, 1096, 956),
        (700, 0, 1096, 956),
        (0, 40, 700, 920),
    ),
    "bone": (
        "histology/telegram-standalone/spongy-bone-trabeculae.jpg",
        (0, 0, 720, 900),
        (0, 0, 720, 650),
        (80, 80, 690, 760),
    ),
    "cartilage": (
        "image-bank/histo-hyaline-cartilage.png",
        (0, 0, 300, 260),
        (220, 0, 470, 240),
        (260, 360, 554, 700),
    ),
    "joint": (
        "histology/telegram-standalone/synovial-joint-low-power.jpg",
        (0, 0, 720, 1050),
        (100, 80, 690, 700),
        (0, 250, 600, 950),
    ),
    "nerve": (
        "histology/practicals/peripheral-nerve.jpg",
        (0, 0, 1224, 802),
        (0, 0, 650, 802),
        (0, 0, 560, 440),
    ),
    "skin-with-hair": (
        "histology/practicals/skin-with-hair.jpg",
        (0, 0, 1394, 876),
        (0, 0, 700, 876),
        (650, 150, 1394, 850),
    ),
    "skin-without-hair": (
        "histology/practicals/thick-skin.jpg",
        (0, 0, 1302, 1002),
        (850, 0, 1302, 1002),
        (450, 280, 980, 930),
    ),
    "white-adipose": (
        "histology/practicals/white-adipose.jpg",
        (0, 0, 660, 450),
        (0, 0, 660, 450),
        (250, 80, 650, 500),
    ),
    "brown-adipose": (
        "histology/practicals/brown-adipose.jpg",
        (0, 0, 986, 720),
        (0, 120, 650, 760),
        (300, 0, 986, 620),
    ),
    "thyroid": (
        "image-bank/histo-thyroid.png",
        (0, 0, 360, 230),
        (40, 140, 320, 420),
        (380, 280, 660, 468),
    ),
    "skeletal-muscle": (
        "histology/practicals/skeletal-muscle.jpg",
        (0, 0, 630, 420),
        (0, 0, 630, 230),
        (0, 180, 630, 420),
    ),
    "cardiac-muscle": (
        "image-bank/histo-cardiac-muscle.png",
        (0, 0, 472, 315),
        (0, 0, 300, 315),
        (170, 0, 472, 315),
    ),
    "tendon": (
        "histology/practicals/tendon.jpg",
        (0, 0, 1392, 936),
        (150, 0, 1200, 450),
        (300, 450, 1392, 936),
    ),
}


# The previous local "dorsal-root-ganglion" asset was actually a peripheral
# nerve field. These answer-neutral crops come from morphology-verified open
# teaching micrographs instead. The first two are CC BY-SA 3.0 images by
# Merlin-UK on Wikimedia Commons; the close field is an unlabeled right-side
# crop of the UNSW Embryology dorsal-root-ganglion teaching image.
REMOTE_FIELDS: dict[str, tuple[str, tuple[int, int, int, int]]] = {
    "ganglion-overview.jpg": (
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/SFEC-2012-EXP-DOG-SPINAL%20GANGLION-H%26E007.JPG",
        (0, 0, 1500, 2490),
    ),
    "ganglion-field-a.jpg": (
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/SFEC-2012-EXP-DOG-SPINAL%20GANGLION-H%26E008.JPG",
        (1750, 0, 3470, 2246),
    ),
    "ganglion-field-b.jpg": (
        "https://embryology.med.unsw.edu.au/embryology/images/b/b8/Dorsal_root_ganglion_histology_01.jpg",
        (220, 330, 640, 800),
    ),
}


# Full-resolution course photos recovered from WhatsApp Web. The directory is
# intentionally private and temporary; only the microscope-field crops below
# are committed. Brown-fat, ganglion and cardiac-muscle album entries are not in
# this map because their raw morphology did not independently support the label.
# Those specimens retain the verified local/book fields above.
COURSE_CROPS: dict[str, tuple[str, tuple[int, int, int, int]]] = {
    "tendon-course.jpg": ("hawra-full/hawra-01.jpg", (0, 40, 900, 940)),
    "skin-with-hair-course.jpg": ("hawra-full/hawra-02.jpg", (0, 0, 900, 1120)),
    "skin-without-hair-course.jpg": ("hawra-full/hawra-03.jpg", (0, 80, 900, 1120)),
    "skeletal-muscle-course.jpg": ("hawra-full/hawra-06.jpg", (0, 120, 900, 1180)),
    "white-adipose-course.jpg": ("hawra-full/hawra-07.jpg", (0, 330, 900, 1410)),
    "thyroid-course.jpg": ("hawra-full/hawra-08.jpg", (0, 100, 900, 1120)),
    "bladder-course.jpg": ("hawra-full/hawra-09.jpg", (0, 300, 900, 1380)),
    "cartilage-course.jpg": ("hawra-full/hawra-11.jpg", (0, 150, 900, 1240)),
    "bone-course.jpg": ("hawra-full/hawra-12.jpg", (0, 330, 900, 1420)),
    "nerve-course.jpg": ("nerve-set/nerve-1.jpg", (160, 100, 960, 1040)),
    "joint-course.jpg": ("hawra-full/hawra-14.jpg", (0, 310, 900, 1390)),
    "trachea-course.jpg": ("course-trachea.jpg", (0, 350, 720, 1240)),
    "bone-course-detail.jpg": ("visible-75.jpg", (60, 180, 950, 1150)),
    "cartilage-course-detail.jpg": ("visible-77.jpg", (350, 800, 3000, 4080)),
}


def save_opened_crop(opened: Image.Image, box: tuple[int, int, int, int], destination: Path) -> None:
    image = ImageOps.exif_transpose(opened).convert("RGB")
    crop = image.crop(box)
    if crop.width < 900:
        height = round(crop.height * 900 / crop.width)
        crop = crop.resize((900, height), Image.Resampling.LANCZOS)
    elif crop.width > 1500:
        height = round(crop.height * 1500 / crop.width)
        crop = crop.resize((1500, height), Image.Resampling.LANCZOS)
    crop.save(destination, "JPEG", quality=92, optimize=True, progressive=True)


def save_crop(source: Path, box: tuple[int, int, int, int], destination: Path) -> None:
    with Image.open(source) as opened:
        save_opened_crop(opened, box, destination)


def save_remote_crop(url: str, box: tuple[int, int, int, int], destination: Path) -> None:
    request = Request(url, headers={"User-Agent": "MED25-histology-bank/1.0"})
    with urlopen(request, timeout=60) as response:
        payload = response.read()
    with Image.open(BytesIO(payload)) as opened:
        save_opened_crop(opened, box, destination)


def extract_whatsapp_fields() -> int:
    directory_value = os.environ.get("WHATSAPP_PRACTICAL_DIR")
    if directory_value:
        directory = Path(directory_value)
        if not directory.exists():
            raise FileNotFoundError(directory)
        for filename, (relative_source, box) in COURSE_CROPS.items():
            source = directory / relative_source
            if not source.exists():
                raise FileNotFoundError(source)
            save_crop(source, box, OUTPUT / filename)
        for rejected in (
            "brown-adipose-course.jpg",
            "ganglion-course.jpg",
            "cardiac-muscle-course.jpg",
            "nerve-course-longitudinal.jpg",
        ):
            (OUTPUT / rejected).unlink(missing_ok=True)
        return len(COURSE_CROPS)

    screenshot_value = os.environ.get("WHATSAPP_PRACTICAL_SCREENSHOT")
    if not screenshot_value:
        return 0
    screenshot = Path(screenshot_value)
    if not screenshot.exists():
        raise FileNotFoundError(screenshot)

    # Coordinates refer only to a morphology-verified microscope circle in the
    # 2026-08-17 practical album preview. Student/AI captions immediately below
    # the tiles are deliberately excluded. The tile captioned "Nerve" was
    # rejected independently because the low-resolution morphology is not a
    # reliable peripheral-nerve match; stale extracts of it are removed.
    boxes = {
        "white-adipose-course": (677, 307, 827, 445),
    }
    (OUTPUT / "nerve-course.jpg").unlink(missing_ok=True)
    for name, box in boxes.items():
        save_crop(screenshot, box, OUTPUT / f"{name}.jpg")
    return len(boxes)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, (relative_source, overview, field_a, field_b) in FIELDS.items():
        source = PUBLIC / relative_source
        if not source.exists():
            raise FileNotFoundError(source)
        for label, box in (("overview", overview), ("field-a", field_a), ("field-b", field_b)):
            save_crop(source, box, OUTPUT / f"{slug}-{label}.jpg")

    for filename, (url, box) in REMOTE_FIELDS.items():
        save_remote_crop(url, box, OUTPUT / filename)

    # Bone field A also gets a higher-resolution morphology-verified example
    # extracted from PRACTICAL.pptx slide 34.
    spongy_source = PUBLIC / "histology" / "practicals" / "full" / "spongy-bone.jpg"
    save_crop(spongy_source, (100, 20, 650, 440), OUTPUT / "bone-field-a.jpg")

    course_count = extract_whatsapp_fields()

    # Keep optional course images already generated when the private screenshot
    # is unavailable on a later machine.
    required = {f"{slug}-{variant}.jpg" for slug in FIELDS for variant in ("overview", "field-a", "field-b")}
    required.update(REMOTE_FIELDS)
    missing = sorted(name for name in required if not (OUTPUT / name).exists())
    if missing:
        raise RuntimeError(f"Missing generated identification fields: {', '.join(missing)}")
    print(
        f"Wrote {len(required)} answer-neutral verified fields and {course_count} "
        f"course fields to {OUTPUT.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
