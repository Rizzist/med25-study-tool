# Tissue source regeneration

The committed `questions/tissue-*.json` files contain 1,074 question occurrences from 12 originals. The January 2023 annotated original repeats the same 80-question sequence; the application groups it as an alternate original. Repeated question numbers in the DDS compilation remain distinct occurrences through `sourceOrdinal`.

Python 3 requires PyMuPDF (`pymupdf`), Pillow, and NumPy. The optional OCR helper requires macOS Swift, AppKit, and Vision. All PDF inputs are the originals under `public/study/term1-telegram/`.

Set these input locations explicitly when moving the extraction work to another machine:

```sh
export TERM1_TISSUE_WORK_DIR="/path/to/tissue-scratch"
export TERM1_TISSUE_SOURCE_OCR_DIR="/path/to/source-ocr"
```

`TERM1_TISSUE_WORK_DIR` defaults to `/tmp`. It must contain:

- `tissue-ocr-boxes.json`: positional Vision output, an array of `{file, lines:[{text, box:[x0,y0,x1,y1]}]}`. Coordinates are normalized from the top-left. Page names use `tissue-<paper>-01.jpg`.
- `tissue-ocr-pages/`: the corresponding original PDF page renders, using a PyMuPDF scale of 1.7. They are needed to inspect source checkmarks and highlights.

`TERM1_TISSUE_SOURCE_OCR_DIR` defaults to `$TERM1_TISSUE_WORK_DIR/ocr`. It must contain `Tissue Theory SEP2021.json`, the reviewed source OCR array of `{page, text}` records, with one-based pages and original line breaks. Keep this reviewed OCR input with the extraction archive; changing OCR results requires another source comparison.

For a new positional OCR pass after rendering the pages:

```sh
swift scripts/extract-term1-tissue-ocr.swift "$TERM1_TISSUE_WORK_DIR/tissue-ocr-pages" "$TERM1_TISSUE_WORK_DIR/tissue-ocr-boxes.json"
```

From the repository root, run the complete pipeline in this order. Do not run an early extraction stage alone and treat its intermediate output as reviewed data.

```sh
python3 scripts/extract-term1-tissue-native.py
python3 scripts/extract-term1-tissue-scans.py
python3 scripts/extract-term1-tissue-tehran.py
python3 scripts/extract-term1-tissue-reviewed.py
python3 scripts/extract-term1-tissue-keys.py
python3 scripts/extract-term1-tissue-editorial.py
```

The editorial stage automatically runs `extract-term1-tissue-audit.py` last. That final stage preserves the independent review corrections, source numbering, ambiguous-question exclusions, option-order-aware duplicate corrections, and restored February figures. It validates every stem, option, answer ID, and figure path. It can also be run independently against already reviewed data.

`sourceAnswer` preserves the original mark even when it was scientifically incorrect. `answerBasis: editorial` identifies an independently supplied or corrected answer. `correctOptionId: null` means the original question remains present but is ungraded. Figure crops exclude marked answer rows; the three restored February figures explicitly identify the matching Test 22204 source in their media descriptions and explanations.
