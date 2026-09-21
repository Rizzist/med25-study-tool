# Religion past-paper answer audit — 2026-09-21

## Shipped locally

| Source paper | Previously scored | Now scored | Inferred/corrected feedback |
| --- | ---: | ---: | ---: |
| Original 40 (O) | 35 | 40 | 5 |
| Compilation 100 (D) | 44 | 100 | 58 |
| Introduction 2021 (A) | 10 | 20 | 8 |
| February, year unconfirmed (F) | 0 | 20 | 8 |
| Total source occurrences | 89 | 180 | 79 |

65 formerly withheld canonical items now have explicit editorial choices. The 26 linked repeated occurrences are also independently usable in their source papers, rather than making February an empty exam. Their canonical review identity remains recorded; no original question or option order was rewritten. The 75 newly authored practice questions are unchanged.

Every final question has answer-review provenance, confidence, evidence and an audit date. None is represented as an official university answer. Existing graded answers were checked against their review/reference context; the three prior corrections (D11, D60, A11) remain in force. Newly inferred choices and corrections use CVS's subdued darker green/red feedback, not a prominent AI badge. Source-reviewed keys retain lighter feedback.

## Important key corrections / limitations

| Item | Reviewed choice | Reason |
| --- | --- | --- |
| D11 | A | Retained prior correction on monotheism |
| D60 | A | Paraclete is advocate/helper, not literally “the praised” |
| A11 / F6 | B | Retained prior correction: justice as putting things in their proper place |
| D66 | A | Luke 1 does not support the sheet's blanket derogatory description of Mary |
| D77 | B, provisional | Literal biological brother versus figurative brother; “Islam” is also used inconsistently in the stem |
| D78 | D | Ascension and resurrection are distinct events; A describes the latter |
| D95 | A | Earlier revelation's divine origin is not unrestricted continuing legal applicability in this course framework |
| D96 | B | Contradictory doctrines alone do not decide individual salvation |
| A6 / F4 | C, qualified | Closest biblical use: title applied to Jesus in 1 John 2:1; course identification with Muhammad is distinguished from lexical meaning |

Seven canonical items / eight occurrences remain **low confidence**: O29, D19, D43, D64, D77, D94, A14 and its repeat F18. They are now playable with a best-available choice, not magically resolved by adding a key. Examples: D64 says “two Bibles” instead of two Testaments; A14's conversion claim remains unsupported; D19 never names its stage taxonomy. The feedback explicitly warns about these limits. Course claims about religions, salvation and history remain attributed to their framework rather than asserted as universal facts. Medical-ethics items are not clinical or legal authorization.

Overlapping alternatives are accepted for D17, D20, D23, D24, D51, D54, D55, D56, D72, D79 and D98, including linked copies. Preferred course choice stays visible. Live grading and restored attempts use the same acceptance rule.

## Sources and preservation

- Original PDFs and the frozen `data/religion/sources.json` were not edited. Intro 2021's original page 2 was visually inspected to check the marked Paraclete and justice answers.
- Local Religion Review and its identified sources, including Misbah Yazdi's *Theological Instructions*, remain the course frame.
- Specific checks include [1 John 2](https://bible.usccb.org/bible/1john/2), [Acts 1](https://bible.usccb.org/bible/acts/1), [Luke 1](https://bible.usccb.org/bible/luke/1), [Subhani's migration chapter](https://al-islam.org/message-jafar-subhani/chapter-25-event-migration), [al-Khisal's ten ranks](https://hadith.academyofislam.com/books/al-khisal/the-ten-ranks-of-belief), and Sistani's [medical questions](https://www.sistani.org/english/book/46/2060/) and [conditional liability rules 682–684](https://www.sistani.org/persian/book/26578/6483/).
- Question-only, answer-key and combined download inputs were regenerated for all four papers. Their content hashes change PDF-cache identity; original PDFs remain byte-identical.
- All 180 source items have explicit review-section mappings for post-exam feedback. Answer certainty is separate from certainty of the topic mapping.

## Editable inputs and regeneration

1. Edit decisions/evidence in `scripts/content/religion-answer-audit.mjs`; retained prior source reviews are in `scripts/content/religion-past-papers.mjs`.
2. Run `npm run mcq:generate` to rebuild banks, paper exports, memberships and review mappings.
3. Run `npm run religion:validate`, `node --test tests/religion-routes.test.mjs tests/paper-pdf.test.mjs`, `npm run mcq:check`, `npm run pdfs:check`, and `npm run vercel-build`.
4. If a previously graded choice or accepted-alternative policy changes, bump that question's revision to invalidate affected saved answers. This pass preserved the preferred choices and revisions of the existing 89 graded items.

## Verification

- All source choices, duplicate option order, accepted alternatives, per-paper counts, export parsing, metadata and curriculum coverage pass automated checks.
- Production build and hook-order regression checks pass.
- Isolated production browser: four paper counts 40/100/20/20; February 20-item exam; wrong and right feedback; source green `#edf8f2` versus inferred green `#d0ead8`; corrected F4; accepted alternative A on F5; no console errors.
- Localhost:3000 API returns 180 questions, including 79 inferred/corrected occurrences.
- No changes to the user's existing localhost:3000 answers or sessions were made during testing. Browser answers were entered on the separate port-3100 verification origin.
- No commit or push requested in this turn; changes remain local.
