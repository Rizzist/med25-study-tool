# Account, activity, books and PWA lanes

Scope: 30 September 2026. Work sequentially; preserve accounts, passwords and study progress.

| Lane | Scope | Status | Evidence |
|---|---|---|---|
| 1 | Owner assigns moderators; moderators add new students only; 11 digits beginning 4 | SHIP | 21 auth tests; TypeScript; production build/HTTP checks; browser owner dropdown/add form verified |
| 2 | Owner-only visit history and approximate foreground active time | SHIP | 30 auth/activity tests; production HTTP denied student/moderator/admin; browser persisted 2 visits and separate elapsed/active durations |
| 3 | Disabled Med School Books navigation | SHIP | 14 MCQ/refactor tests, TypeScript/production build, desktop and 390px/320px browser checks; no horizontal overflow at 320px |
| 4 | Installable PWA, icons, standalone mode, safe offline screen | SHIP | 8 PWA tests, production build/HTTP checks, Chrome installation prompt, actual offline reload and authenticated reconnect verified |

## Guardrails

- Owner identity is server configured, not derived from a display name.
- Only owner assigns roles. Existing admins manage students; moderators only add new accounts.
- Moderator storage remains backward-compatible: older builds safely treat a moderator as a student rather than rejecting the credential store.
- Format validation does not claim to verify university enrollment.
- No auth polling/loading screen on tab focus. Login remains persistent.
- Activity is approximate, not attendance, and never captures answers, keystrokes, IP addresses or outside browsing.
- Do not cache authenticated HTML or APIs. Cold offline launch must not expose private content.
- No real account permission change without clear user direction.

## Verification and handoff

- 91 focused tests passed across auth/client auth, activity, PWA, hook guards, guided study/school map, respiratory core, MCQ refactor and PDF caching.
- Final `npm run auth:check`: 38 passed after the moderator storage compatibility change.
- Final `npx next build` and `node tests/auth-http.integration.mjs`: passed, including TypeScript and production HTTP role/authentication checks.
- `git diff --check`: clean.
- Browser checks used a synthetic local account store, never production credentials or role changes. Temporary servers stopped and mobile viewport override reset.
- Chrome exposed its native installation action. The OS installation itself was not performed; physical iOS device testing was not performed. Safari/iOS installation instructions are included.
- Activity reports page visits, elapsed time and estimated foreground active time; multiple tabs can overlap. Idle time stops counting after two minutes. Up to 100 visits per user within 90 days are shown; old entries are pruned on next access, not by a scheduled deletion job.
- Updates are batched at five-minute intervals and on leaving/hiding the page. No auth polling on tab focus and no automatic dashboard refresh.
- Authenticated HTML is never stored as an offline app shell. Opening the app requires a connection; the existing authenticated PDF/media caches remain separate.
- User authorized committing and pushing all pending work on 30 September 2026, including these account/PWA lanes and the limb-paper import. Ali's role has not been changed; the owner can choose Moderator in Accounts after deployment. GitHub push triggers the existing deployment pipeline; build readiness does not itself confirm deployment completion.

## PWA references

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
