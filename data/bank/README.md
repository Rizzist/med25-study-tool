# MCQ bank

The bank contains verified July 25 and July 29 exam questions as JSON Lines files under `data/bank/questions/`.

- One question object per line.
- Validate with `npm run bank:validate`.
- Put local question images under `data/assets/` or `public/study/`.
- Every record must conform to `schemas/mcq-question.schema.json`.
- Stable ids use `subject-topic-short-name-v1` style and revisions increase when answers or wording change.
- Only `verified` questions should appear in exam sessions.

During an active MCQ session, topic and settings tabs are hidden. Session construction happens before entering study mode.
