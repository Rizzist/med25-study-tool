# Histology practicals — 15-slide bank

Last updated: 2026-08-18 (Asia/Tehran)

## Implemented scope

This bank is a distinct July 25 collection with **45 image questions** (three per specimen) and **15 atlas lessons**. Each lesson follows the same microscope routine: orient at low power, inspect the defining architecture, identify the characteristic cell, and state the closest discriminator.

1. Trachea
2. Urinary bladder
3. Compact bone
4. Hyaline cartilage
5. Synovial joint
6. Peripheral nerve
7. Dorsal root ganglion
8. Thin skin with hair
9. Thick skin without hair
10. White adipose tissue
11. Brown adipose tissue
12. Thyroid gland
13. Skeletal muscle
14. Cardiac muscle
15. Tendon

## Source boundary

The supplied `Cell Counting 1.pptx` was inspected in full. It teaches hemocytometer setup and blood-cell counting, not the requested tissue specimens, so its instructions and example counts were **not** treated as the practical syllabus or copied into this bank.

Specimen morphology and cell-identification notes were verified primarily against:

- *Junqueira's Basic Histology*, 16th edition (local reference PDF)
- *diFiore's Atlas of Histology with Functional Correlations*, 11th edition (local reference PDF)
- Existing course-derived MED//25 images for the joint and selected verified textbook figures already in the app

Eleven new app-ready crops were derived from the local textbooks. `scripts/extract-histology-practical-images.py` records the exact PDF page, crop box, output path, and rendering scale for reproducibility. No raw textbook or deck is committed.

## Academic web cross-checks

- OpenStax Anatomy & Physiology 2e: connective tissue, cartilage, bone, adipose, and muscle comparisons
  - https://openstax.org/books/anatomy-and-physiology-2e/pages/4-3-connective-tissue-supports-and-protects
  - https://openstax.org/books/anatomy-and-physiology-2e/pages/10-1-overview-of-muscle-tissues
- Southern Illinois University School of Medicine Histology: trachea, skin, connective tissue/adipose, dorsal-root ganglion, and skeleton/joints
  - https://histology.siu.edu/crr/CR045b.htm
  - https://histology.siu.edu/intro/skin.htm
  - https://histology.siu.edu/intro/ct.htm
  - https://histology.siu.edu/ssb/drgang.htm
  - https://histology.siu.edu/ssb/skeleton.htm
- NCBI Bookshelf: bladder histology and urothelium
  - https://www.ncbi.nlm.nih.gov/books/NBK540963/
- Duke University Medical Histology: peripheral nerve
  - https://histology.oit.duke.edu/MBS/CellSci/CS-Nerve/CS-Nerve.html
- Columbia University Histology Laboratory: synovial joint
  - https://www.columbia.edu/itc/hs/medical/sbpm_histology_old/lab/lab06_joint.html
- Yale MedCell: thyroid virtual slide
  - https://medcell.org/histology/virtualSlide.php?lab_name=endocrine_systems_lab&slide_id=5&slide_name=CB502_Histo_0005

Web sources were used to cross-check standard morphological distinctions; they did not broaden the fixed 15-specimen list.

## Generation and verification

- `scripts/generate-histology-practicals.mjs` writes the 45 verified JSONL questions.
- `scripts/generate-histology-practical-lessons.mjs` writes the 15 atlas lessons.
- Image extraction requires Poppler (`pdftoppm`) and Pillow 12.3.0, pinned in `scripts/requirements-histology-practicals.txt`; the textbook directory can be overridden with `MED_SCHOOL_BOOKS_DIR`.
- `npm run bank:validate` verifies the question schema, IDs, options, sources, and media paths.
- `npm run lessons:validate` verifies lesson structure, uniqueness, and every referenced asset.
