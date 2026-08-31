# Biochemistry II independent source and correction audit

Status: **PASS**
Scope: local Lippincott 6e Chapters 8-12 and 15, every local carbohydrate/dietary-lipid note and transcript format, and the immutable verified repository baseline. No web question banks, past papers, final papers, or official assessment sources were used.

## Outcome

- Baseline: 158 accepted, 0 excluded, 0 modified; SHA-256 `18df3da7eea257542623d965f1f8b3258c9c1709734bf0c85ec054a321f72ab3`.
- Author gaps: 38 accepted, 0 excluded; 6 substantively corrected, 3 additional locator-corrected, and all 38 release-normalized.
- Catalog: 12 modules, 50 concepts, 94 objectives, 165 source-audit records.
- Direct sampling: 72/94 objectives before expansion and 94/94 after expansion.
- Combined index: 196 baseline+gap questions; unmapped questions: 0; unsampled objectives: 0.
- Gap keys: {'A': 10, 'B': 10, 'C': 9, 'D': 9}. Media: 0.

## Chapter coverage

| Chapter | Concepts | Objectives | Course | Book extension | Baseline MCQs | Gap MCQs | Direct before | Direct after |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | 9 | 18 | 8 | 1 | 40 | 12 | 10/18 | 18/18 |
| 9 | 7 | 13 | 5 | 2 | 20 | 4 | 11/13 | 13/13 |
| 10 | 8 | 15 | 5 | 3 | 19 | 5 | 13/15 | 15/15 |
| 11 | 8 | 15 | 3 | 5 | 20 | 5 | 12/15 | 15/15 |
| 12 | 6 | 11 | 2 | 4 | 15 | 5 | 8/11 | 11/11 |
| 15 | 12 | 22 | 11 | 1 | 44 | 7 | 18/22 | 22/22 |

## Material corrections

1. Lippincott page 218 uses the edition's printed 3-ATP/NADH and 2-ATP/FADH2 convention, so the author claim of 10 ATP per acetyl-CoA was corrected to the source-specific 12. The catalog warns that P/O conventions must be named rather than silently mixed.
2. Carbohydrate transcript ranges were remapped to their actual topics. The author's lines 24-91 mapping to metabolism/glycolysis was incorrect (those lines cover fructose/UDP-galactose), and lines 92-138 are galactose before glycogen begins at line 138.
3. Local teaching errors were not propagated: handwritten notes call pyruvate six-carbon and misstate PFK feedback; IMG_4406 calls glycolysis oxygen-using; IMG_4407 contains contradictory aerobic/anaerobic wording; the main transcript has a fructokinase verbal slip; and the lipid transcript says “glycerol triphosphate.” All were reconciled to the chapter reaction chemistry.
4. Unsupported extensions were narrowed or removed: GLUT3 high affinity, alanine as a stated PDH-deficiency product, insulin-regulated adipose LPL, insulin-driven adipose glycerol-3-phosphate supply, abetalipoproteinemia naming, ApoE2 homozygosity, neonatal pancreatic immaturity, gastric sn-3 specificity, and biliary secretin effects.
5. Gap 018 no longer derives its vignette from the chapter self-assessment's avidin question. Gap 022's ambiguous distractor was replaced. Gaps 017, 021, and 028 received complete multi-page locators.

## Baseline mapping verification

Every one of the 158 immutable baseline IDs appears in at least one objective and the generated combined index. Mapping was checked against each stem/key and the normalized objective text. Two source-locator limitations were documented without rewriting the verified records:

- `term2-biochem-ch08-013-v1`: page 186 supports hepatic/bidirectional GLUT2 but does not state the stem's low-affinity/high-capacity adjectives.
- `term2-biochem-ch09-019-v1`: page 223 is a thiamine-responsive E1 self-assessment; pages 212-213 more directly support the TPP/PDH/lactate mechanism.

These are provenance weaknesses, not biomedical key errors. The baseline was preserved exactly as requested.

## Source inventory and limitations

- Lippincott local PDF pages 176-275 and 326-339 were dispositioned page by page, including dividers, blanks, summaries, and self-assessments.
- The 7-page handwritten notes and 6-page reconstructed notes were reviewed page by page; all six TXT transcripts were line-segmented, and all six SRT companions were inventoried as timed duplicates.
- The original slide deck implied by “slides 27-80” is not present locally. This is recorded as `source-missing`; reconstructed-note PDF pages and transcript lines are the finest defensible course locators.
- No clean local figure was necessary for an interpretive SBA, so every verified gap item is text-only.
- Source coverage and direct objective sampling do not assert official exam weighting.

## Machine checks

`machine-validation.json` records AJV 2020 validation against both repository schemas, the repository-compatible concept audit, baseline hash preservation, routing/status/tag checks, source existence, complete mappings, objective sampling, option explanations, answer-key distribution, duplicate detection, and zero-media enforcement. Re-run with `validate.mjs` in this directory.
