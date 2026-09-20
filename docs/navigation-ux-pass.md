# MCQ navigation and paper-selector UX pass

## Implemented

- Compact left-side study navigation: Practice MCQs, Past exams, Review topics, Results. Removed features stay removed.
- Restored source-style course cards with exam date, course name and MCQ count. Loading counts remain explicit rather than showing zero.
- Desktop sidebar fixed to the viewport; term/course header sticky above the native document scroller. Explicit question viewports still own exam scrolling.
- Mobile: small pinned section navigation and a swipeable course-card strip retaining dates/counts. No full-page dropdown panel or eight-card vertical wall.
- Review TOC: compact title/download/search area, small numbered section cards, PDF page links, question counts and a question-available filter. Suggested mappings stay qualified; reference-only sections remain available.
- Review PDF downloads are available directly from Practice and Review topics. The existing content-hash PDF cache remains unchanged.
- CVS and other imported past-paper collections share `PastPaperCard` presentation, source details and action styling.
- Other imported banks now offer source-bounded combined sessions, select-all/clear, saved combined selections, per-paper resume/new-attempt/result controls, and paper/key downloads. Existing CVS Core/Non-core and grading behavior are retained.
- Same combined source selection has a stable SHA-256 identity; duplicate question IDs are counted once. Course supplements are not auto-selected. Missing-key items stay in source archives, not invented as scored MCQs.
- Practice and final-exam answering remain distraction-free; opening questions hides both navigation areas. Existing storage keys are retained.

## Verification

- TypeScript and production build passed.
- MCQ/source/state regression suite: 55 passing checks, including new navigation markup, shared paper-card, combined identity, storage and malformed-summary tests.
- PDF cache suite: 9 passing checks.
- Browser checks on isolated `127.0.0.1:3000` storage (not the user's `localhost` answers): desktop and 390px mobile navigation, long-list scrolling with both navigation areas pinned, section search and exact PDF-page links.
- Nutrition combined session: three course papers -> 57 unique scored questions; active exam hides navigation; answer feedback and Save & exit work.
- No commit, push, or deployment requested in this pass. Local app remains on port 3000.

## Deliberate boundaries

- Course question content and PDF contents were not rewritten.
- CVS-specific repeated-question Core/Non-core selections are not fabricated for other courses.
- The generic sourced-MCQ engine retains its existing immediate-feedback mode; CVS retains its own deferred-feedback option and unresolved-item handling. Shared picker presentation does not claim identical underlying engines.
