# CVS physiology review

This variant is regenerated from the 27 selected authored sections, not sliced from pages of the integrated PDF. The original volume and `data/review-curriculum` remain unchanged. The final original physiology section shares a page with histology, so page slicing is not a valid substitute.

`source.json` preserves the selected paragraphs, tables, callouts, questions, figures, and source references. Only private source paths were removed. `provenance.json` locks the original manuscript hash, original PDF hash, selected IDs, seven figures, and four renderer fonts. The mixed orientation/correction sections, histology, anatomy, embryology, and integrated transcript attachments are excluded.

The existing report renderer was adapted for this isolated variant in `scripts/review-variants/render_review.py`. It uses ReportLab's invariant mode; repeated builds produce identical PDF and mapping bytes. Rendering dependencies used for verification: ReportLab 4.4.9, pypdf 6.10.0, pdfplumber 0.11.9, Pillow 12.3.0.

From the repository root, rebuild with:

```sh
python3 scripts/build-cvs-physio-review.py
node scripts/check-cvs-physio-review.mjs
node --test tests/cvs-review-scope.test.mjs
node scripts/build-pdf-manifest.mjs
```

Use an environment containing the recorded Python dependencies. The Codex bundled Python runtime supplies them. To repeat the explicit source import, pass the original locked authoring JSON to `node scripts/import-cvs-physio-review.mjs`; routine builds use only the frozen repository assets.

The output is `public/study/reviews/cvs-physio.pdf`. Its companion JSON records the byte hash and each original `cvs/<section>` ID's new PDF page. All-scope navigation keeps the canonical full review. Physio navigation uses this map exclusively. Non-Physio has no review document; mapped question labels and practice choices can remain available without PDF links.

After a renderer/content change, render the PDF with Poppler and visually verify the contents, tables, figures, section transitions, headers, and footers. The builder also rejects missing glyphs and text outside safe bounds. Generated QA, display images, and temporary renders are not source files.
