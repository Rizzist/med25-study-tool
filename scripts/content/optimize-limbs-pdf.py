"""Make a web-size scan copy; never modify the input/archive original.

Requires pypdf and Pillow. Keeps pages, dimensions, annotations and text;
re-encodes embedded scan images at full pixel resolution, JPEG quality 90.
"""
import sys
from math import isclose
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf import filters

# Known 5100 x 7015 RGB scans expand to 107 MB. Keep a finite per-stream
# limit while allowing those inspected full-resolution source images.
filters.ZLIB_MAX_OUTPUT_LENGTH = 160 * 1024 * 1024

source, destination = map(Path, sys.argv[1:3])
assert source.resolve() != destination.resolve(), "Keep the archive original intact"
reader = PdfReader(source)
writer = PdfWriter()
writer.clone_document_from_reader(reader)
for page in writer.pages:
    for image in page.images:
        if image.image is not None and image.image.mode in ("RGB", "L"):
            image.replace(image.image, quality=90, optimize=True)
    page.compress_content_streams()
writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)
writer.write(destination)
optimized = PdfReader(destination)
assert len(optimized.pages) == len(reader.pages), "Page count changed"
for before, after in zip(reader.pages, optimized.pages):
    assert all(isclose(float(a), float(b), rel_tol=0, abs_tol=0.00001)
               for a, b in zip(before.mediabox, after.mediabox)), "Page size changed"
    assert before.extract_text() == after.extract_text(), "Text layer changed"
assert destination.stat().st_size < 50 * 1024 * 1024, "Still too large for web distribution"
print(f"Optimized {len(reader.pages)} pages: {source.stat().st_size} -> {destination.stat().st_size} bytes")
