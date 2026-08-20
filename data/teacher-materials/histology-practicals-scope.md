# Histology practicals — full 55-specimen bank

Last updated: 2026-08-20 (Asia/Tehran)

## Implemented scope

This bank is the dedicated **August 22 Histology Practical** option with **165 image questions** (three per specimen) and **55 atlas lessons**. Each lesson follows the same microscope routine: orient at low power, inspect the defining architecture, identify the characteristic cell, and state the closest discriminator.

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

The complete `PRACTICAL.pptx` added **40 non-duplicate specimens**:

16. Simple squamous epithelium
17. Simple columnar epithelium
18. Nonkeratinized stratified squamous epithelium
19. Stratified cuboidal epithelium
20. Loose connective tissue
21. Dense irregular connective tissue
22. Spongy bone
23. Erythrocytes and platelets
24. Neutrophil
25. Eosinophil
26. Lymphocyte
27. Monocyte
28. Basophil
29. Muscle spindle
30. Sympathetic ganglion
31. Parotid gland
32. Submandibular gland
33. Sublingual gland
34. Lip
35. Tongue papillae and taste buds
36. Lingual tonsil
37. Esophagus
38. Fundic stomach
39. Duodenum
40. Ileum
41. Colon
42. Appendix
43. Adrenal gland
44. Pituitary gland
45. Kidney cortex
46. Kidney medulla
47. Juxtaglomerular apparatus
48. Muscular artery and vein
49. Lymph node
50. Thymus
51. Spleen
52. Endochondral ossification
53. Circumvallate papilla
54. Large vein
55. Palatine tonsil

## Source boundary

The supplied `Cell Counting 1.pptx` was inspected in full. It teaches hemocytometer setup and blood-cell counting, not the requested tissue specimens, so its instructions and example counts were **not** treated as the practical syllabus or copied into this bank.

The supplied full `PRACTICAL.pptx` was inspected across all **113 slides**. Its microscope figures and captions were treated as course source material; slide titles, divider text, labels, and any instructional prose were not treated as user instructions. Divider slides and the blank slide 80 were not turned into specimens. Slides covering the original 15 specimens were cross-referenced without duplicating their existing questions; only the 40 additional specimen/cell categories were added.

Specimen morphology and cell-identification notes were verified primarily against:

- *Junqueira's Basic Histology*, 16th edition (local reference PDF)
- *diFiore's Atlas of Histology with Functional Correlations*, 11th edition (local reference PDF)
- Existing course-derived MED//25 images for the joint and selected verified textbook figures already in the app

Eleven original app-ready crops were derived from the local textbooks. `scripts/extract-histology-practical-images.py` records their exact PDF pages and crop boxes. A further 40 answer-neutral crops were derived from the full deck; `scripts/extract-full-histology-practical-images.py` records every source slide and normalized crop. No raw textbook or deck is committed.

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

Web sources were used to cross-check standard morphological distinctions. The 40-specimen expansion itself is bounded by the full practical deck and deduplicated against the original 15.

## Generation and verification

- `scripts/generate-histology-practicals.mjs` writes the original 45 verified JSONL questions.
- `scripts/generate-histology-practical-lessons.mjs` writes the original 15 atlas lessons.
- `scripts/generate-full-histology-practicals.mjs` writes the 120 full-deck supplemental questions.
- `scripts/generate-full-histology-practical-lessons.mjs` writes the 40 full-deck supplemental lessons.
- `scripts/extract-full-histology-practical-images.py` extracts the 40 deck-derived crops; set `PRACTICAL_PPTX` to override the default source path.
- Image extraction requires Poppler (`pdftoppm`) and Pillow 12.3.0, pinned in `scripts/requirements-histology-practicals.txt`; the textbook directory can be overridden with `MED_SCHOOL_BOOKS_DIR`.
- `npm run bank:validate` verifies the question schema, IDs, options, sources, and media paths.
- `npm run lessons:validate` verifies lesson structure, uniqueness, and every referenced asset.
