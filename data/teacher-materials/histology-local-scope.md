# Local histology slide scope and bank-gap audit

Audit date: 2026-07-21 (America/Toronto)

This report covers two local TUMS histology decks that were hidden behind ambiguous filenames. The source files were read in place and were not moved, renamed or modified.

## Bottom line

- `INTRODUCTION.pptx` is a 24-slide Histology Introduction covering tissue preparation, routine and special stains, microscopy, autoradiography, culture, immunohistochemistry and enzyme histochemistry.
- `lecture 1 .pptx` is a 111-slide Cell lecture covering plasma membrane, transport, cell signaling, organelles, cytoskeleton, inclusions, nucleus, cell cycle, apoptosis, mitosis and meiosis.
- The current bank has strong general Junqueira coverage (399 histology questions), including 10 Chapter 1 method questions, 24 dedicated stain questions, 10 Chapter 2 cell/cytoplasm questions and 10 Chapter 3 nucleus questions. However, the teacher decks reveal high-value gaps in the exact stain table, cell-signaling modes, membrane detail, organelle comparisons and cell-ultrastructure images.

## Source 1: `INTRODUCTION.pptx`

- Path: `~/Downloads/INTRODUCTION.pptx`
- Size: 5,871,546 bytes
- SHA-256: `910fe8965daf9d0fde49f409de2aff78d625e24a0aef6b9c4d9029992918e48e`
- Slides: 24
- Instructor/source evidence: slide 1 identifies Dr Tayebeh Rastegar, Anatomy Department, TUMS; slide 24 cites Junqueira's Basic Histology (2019), Chapter 1.
- Exact scope:
  - Slides 1-5: histology, cells, tissues and organs.
  - Slides 7-13: fixation aims, dehydration, clearing, infiltration, embedding and microtome sectioning.
  - Slides 14-16: staining, H&E and the teacher's special-stain table.
  - Slides 17-20: light microscopy, fluorescence, polarization, confocal microscopy and electron microscopy.
  - Slides 21-22: autoradiography, cell/tissue culture, immunohistochemistry and enzyme histochemistry.

### Slide 16 stain table: exam-critical extraction

The teacher table explicitly lists:

| Stain | Main use/target in the slide | Distinguishing color emphasis |
| --- | --- | --- |
| Hematoxylin | Nucleic acids, nucleus, ER | Blue to blue-black |
| Eosin | Cytoplasmic proteins, collagen and other eosinophilic material | Pink to orange-red |
| Toluidine blue | General/basic dye; mast-cell granules | Blue with purple metachromasia |
| Masson's trichrome | Connective tissue | Collagen/cartilage blue-green; muscle red |
| Mallory's trichrome | Connective tissue | Collagen/cartilage/bone deep blue; muscle red; keratin orange |
| Weigert's elastic stain | Elastic fibers | Blue-black |
| Heidenhain's AZAN | Cells versus extracellular components | Collagen/cartilage/bone blue; muscle red |
| Silver stain | Reticular fibers, nerve fibers and fungi | Brown-black to black |
| Wright's stain | Blood cells | Leukocyte granule and RBC color differentiation |
| Orcein | Elastic fibers | Dark brown elastic fibers; slide also lists mast-cell/smooth-muscle contrasts |
| PAS | Basement membrane and carbohydrates | Magenta carbohydrate-rich structures |

The table is teacher-specific and appears compressed; preserve its exact associations in source-tagged questions, but cross-check ambiguous cell/color columns against Junqueira before treating them as universal staining rules.

## Source 2: `lecture 1 .pptx`

- Path: `~/Downloads/lecture 1 .pptx`
- Size: 25,982,985 bytes
- SHA-256: `f656303af5e9adefc9892c823449dc5317e6a9f640b5a86e77d592486eb9a190`
- Slides: 111
- Instructor/source evidence: slide 1 identifies Dr Tayebeh Rastegar, Anatomy Department, TUMS; slide 111 cites Junqueira's Basic Histology (2019), Chapter 3.
- Exact scope:
  - Slides 1-18: cell types/differentiation, membrane components, asymmetry, cholesterol, glycocalyx, fluid-mosaic model, lipid rafts and membrane functions.
  - Slides 19-31: passive/active/vesicular transport, phagocytosis, pinocytosis, transcytosis, clathrin/caveolin receptor-mediated endocytosis, exocytosis and trafficking.
  - Slides 32-43: endocrine, paracrine, juxtacrine, autocrine and synaptic signaling; signaling molecules and receptor classes.
  - Slides 44-74: ribosomes, RER/SER, Golgi cis/trans faces, vesicles, mitochondria, lysosomes, proteasomes and peroxisomes.
  - Slides 75-89: actin microfilaments, intermediate filaments, microtubules, kinesin/dynein, centrioles, cilia/flagella and inclusions.
  - Slides 90-110: nuclear envelope/pore, chromatin/nucleosomes/nucleolus, cell cycle, cyclins/CDKs, stem cells, apoptosis versus necrosis, mitosis and meiosis.

## Mapping to the current question bank

The bank audit counted **399 histology questions**:

- `histology-existing.jsonl`: 230
- `histology-junqueira-assess.jsonl`: 130
- `histology-stains.jsonl`: 24
- `image-spotters.jsonl`: 15

### Areas already covered well

- Histologic methods: 10 Junqueira Chapter 1 questions address processing order, ionic staining, light/EM resolution, PAS, autoradiography, immunolocalization, in-situ hybridization and cryostat use.
- Dedicated stains: 24 questions already cover H&E, PAS/diastase, orcein, silver/reticulin, methylene blue, toluidine-blue metachromasia, Wright-Giemsa, Oil Red O, osmium, Feulgen, Alcian blue, Prussian blue, Congo red, Masson trichrome, Nissl, Luxol fast blue, IHC/ISH and enzyme histochemistry.
- Cell/cytoplasm: 10 Junqueira Chapter 2 questions cover membrane ultrastructure, organelles, exocytosis, microtubule polarity, signal peptides, Golgi targeting, proteostasis, LDL endocytosis and keratin-filament disease.
- Nucleus/cycle: 10 Junqueira Chapter 3 questions cover nuclear-envelope breakdown, nuclear import, chromatin, meiosis, cyclin-dependent control, apoptosis/necrosis and selected clinical applications.

### Teacher-specific gaps

#### Methods and stains

- No dedicated items for **Mallory trichrome, Weigert elastic stain, or Heidenhain AZAN**.
- Masson, Wright and orcein are represented, but not the teacher table's full **target-by-color comparison**.
- Silver questions focus on reticular fibers; the teacher slide also explicitly tests **nerve fibers and fungi**.
- H&E coverage should explicitly connect **euchromatin versus heterochromatin** to staining intensity, as stated on slide 15.
- Fixation questions do not fully test all four aims on slide 8 or the complete fixation-dehydration-clearing-infiltration-embedding-sectioning sequence.
- Fluorescence, confocal and polarized-light microscopy need direct comparison questions tied to slides 17-20.
- Only two current image spotters are technique/stain specific (PAS small intestine and silver reticular fibers). There are no teacher-aligned image spotters for H&E, toluidine blue, trichromes, Wright, orcein/elastic tissue, or microscopy modality recognition.

#### Cell lecture

- Membrane asymmetry, cholesterol/fluidity, glycocalyx, fluid-mosaic evidence and lipid rafts are thinly represented.
- Transcytosis and the clathrin-versus-caveolin distinction are not directly tested.
- The bank audit found no systematic questions on the five signaling modes or receptor categories from slides 32-43.
- RER versus SER, Golgi cis versus trans, mitochondrial outer versus inner membrane, lysosome versus proteasome versus peroxisome, and P450/lipid-metabolism functions need comparison items.
- Cytoskeletal filament diameters, subunits and functions; kinesin versus dynein; MTOC/centriole organization; and cilia/flagella structure need teacher-aligned coverage.
- Cytoplasmic inclusions (glycogen, lipid, lipofuscin, melanin and hemosiderin) need a consolidated distinction set.
- Nuclear pore architecture, nucleolus/rRNA, chromatin state and the teacher's mitosis/meiosis summary need direct recall plus application.
- There are no current cell-ultrastructure image spotters for plasma membrane, RER/SER, Golgi, mitochondria, lysosome/peroxisome, centriole/cilium, nuclear pore or nucleolus.

## Recommended additive MCQ allocation

Add **64 gap-filling questions** rather than duplicating the existing 399:

| Gap block | New questions | Notes |
| --- | ---: | --- |
| Teacher stain-table distinctions | 14 | Mallory, Weigert, AZAN, table-specific color/target contrasts, silver-fungi/nerve |
| Processing and microscope comparisons | 8 | Complete workflow, fixation aims, fluorescence/confocal/polarized/EM |
| Membrane composition and transport | 8 | asymmetry, fluidity, rafts, transcytosis, clathrin/caveolin |
| Cell signaling | 6 | endocrine/paracrine/autocrine/juxtacrine/synaptic and receptor location |
| Organelles and trafficking | 12 | RER/SER, Golgi, mitochondria, lysosome/proteasome/peroxisome |
| Cytoskeleton and inclusions | 8 | filament comparison, motors, centrioles/cilia, pigments/storage |
| Nucleus, cycle and cell death | 8 | pore/nucleolus/chromatin, cyclin/CDK, mitosis/meiosis, apoptosis |
| **Total** | **64** | At least 18 should use images or unlabeled diagrams |

Image priority: stain recognition first, then organelle/cell-ultrastructure recognition. Every new item should retain the exact teacher deck and slide number in its source metadata.

## Import and deduplication guardrails

- Do not merge `INTRODUCTION.pptx` with `INTRODUCTION.ppt`; the former is histology and the latter is biochemistry.
- These two histology decks overlap Junqueira Chapters 1-3 conceptually but are not file duplicates of the textbook or current bank.
- Generate only the identified gap set; run semantic duplicate detection against the 399 existing histology questions before adding any item.
