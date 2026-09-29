# Private MED25 authentication

Implemented 2026-09-28 and upgraded to a small named allowlist on 2026-09-29. There is no sign-up endpoint. Authorized student IDs and optional initial names are configured in the private server-only `MED25_AUTH_ACCOUNTS` JSON environment variable, never in public source code. The legacy `MED25_STUDENT_ID` remains a one-account compatibility fallback during migration. Missing/invalid configuration fails closed. Tests use synthetic IDs and isolated stores.

## First use

1. Open the app. Sign in using an authorized student ID as both username and temporary password.
2. This creates a **restricted 15-minute session**, not access to study content. Confirm the full name and set a new unique password (12–128 characters). There is no skip.
3. Setting the password revokes all existing sessions and issues a normal 7-day session. The original temporary password no longer works.
4. Use **Change password** or **Sign out** in the navigation. Later password changes require the current password and revoke other sessions.

The user must choose their own replacement password. Automated tests use separate disposable credential stores and do not set the user's password.

## Local development

Set `MED25_AUTH_ACCOUNTS` in ignored `.env.local` before running the app. Its value is a JSON array of `{ "id": "…", "name": "…" }` objects; `name` may be `null` when the student must enter it during first login. Keep this file private; do not use a `NEXT_PUBLIC_` prefix. The setup script uses this list only to bootstrap missing accounts; it never reactivates accounts disabled in the dashboard.

`npm run dev` uses `.med25-auth/state.json`, outside Git. The directory is mode 0700; the account file is mode 0600. Passwords are salted scrypt hashes, not plaintext; only hashes of random session tokens are stored. Do not delete this file to sign out: deleting an account record re-enables the initial-password bootstrap. Back it up securely if local credentials must survive checkout replacement.

The local file adapter uses an atomic directory lock and atomic rename. After an interrupted write, a stale `state.json.lock` fails closed; confirm no server is writing before manually removing that specific empty lock directory. Never erase `state.json` as routine troubleshooting.

## Vercel deployment: Neon Postgres (preferred)

Configured with owner approval on 2026-09-28: a separate free Neon resource named `med25-auth` is connected to MED25's Production and Development environments, not Preview. The existing Libas Vision database was not changed. The optional separate Neon Auth service is disabled; MED25 implements its own private allowlisted login. The account allowlist is stored as a private Production secret and in ignored local configuration; database connection variables use the `MED25_` prefix.

The existing local password hash was migrated without resetting the password. Old local session tokens were not copied, so sign in again locally after switching to the cloud store. The original local credential file remains a private backup. Do not rerun the import against the initialized cloud account; the script refuses to overwrite it.

Production redeployment `DCk56ZQ8FseKoLWtAxtzHRJQuRd9` reached Ready using commit `c5b3aea`. Verified on the production domain: the root redirects to the working login page; anonymous API, JSON and PDF requests return 401; unsupported accounts receive `UNSUPPORTED_ACCOUNT`; the old temporary password is rejected. The cloud password hash exactly matches the owner's previously changed local password. No replacement password or test session was created in the real account. Sign out is available in the desktop sidebar and mobile account row after login.

Use a dedicated `MED25_DATABASE_URL` server environment variable for this database, in Production and local Development. Unlike a generic `DATABASE_URL`, this explicit prefix cannot accidentally select another application's connection. The adapter validates a Neon Postgres endpoint and never falls back to local files when the connection is invalid/unavailable. Keep it out of browser variables and Git. Do not connect public preview deployments to the production account; use a separate resource/key if previews need auth testing.

The table `public.med25_auth_state` holds one versioned record containing isolated per-account salted password hashes, names, forced-change flags, hashed session tokens and rate-limit state. Password changes revoke only that account's sessions. Parameterized `INSERT ... ON CONFLICT DO NOTHING` and conditional `UPDATE ... WHERE state_json = ...` provide atomic updates across server instances. It is not exposed through a client data API. The environment list and setup script bootstrap missing accounts; after that, the database record is authoritative.

## Owner administration

Set `MED25_ADMIN_STUDENT_ID` to the owner's authorized student ID as a private server-only variable. The authenticated owner then receives an **Admin** navigation link to `/admin`. The dashboard can add an account, edit its display name, disable or restore access, and reset a forgotten password. It never displays a password or password hash.

Adding or restoring an account sets its temporary password to its student ID, requires the student to confirm their name and choose a new password at first login, and revokes any earlier sessions. Resetting does the same for an existing account. Disabling access immediately revokes that account's sessions. The owner account cannot be disabled or reset from the dashboard. Every admin API operation checks the live server session and owner identity; there is still no public registration endpoint.

After connecting and securely pulling the MED25-only environment variables:

Also configure `MED25_AUTH_ACCOUNTS` as a private Production environment variable before deploying. Neither this value nor the database URL is supplied by a Git push.

```sh
node scripts/setup-auth-database.mjs
```

This creates the auth table, upgrades the legacy account in place and provisions only missing allowlisted accounts with their student ID as the one-time initial password. It does not print passwords/connection strings or overwrite an existing password. `--import-local` remains available only for the initial one-account cloud migration. Keep `.med25-auth/state.json` as a private local backup; it is no longer used once `MED25_DATABASE_URL` is configured. Localhost and production will then use the **same passwords** without a redeployment when they change. A production source deployment is still necessary to activate the multi-account code.

## Optional Redis adapter

The previous Redis adapter remains supported but is not required when Neon is configured. The implementation deliberately refuses ephemeral files on Vercel, even if file mode is set. The existing live deployment is not changed until this source is deployed.

Connect a durable Redis store supporting the Upstash REST API and set server-only environment variables:

| Variable | Value |
| --- | --- |
| `MED25_AUTH_ACCOUNTS` | Private JSON allowlist of student IDs and optional initial display names |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST endpoint supplied by the store |
| `UPSTASH_REDIS_REST_TOKEN` | Read/write REST token; never `NEXT_PUBLIC_*`, never commit |
| `MED25_AUTH_KEY` | Optional namespace; default `med25:private-auth:v1` |

`KV_REST_API_URL` / `KV_REST_API_TOKEN` aliases are supported. Keep production and preview stores/keys separate. Use the same production key across deployments to retain the password and sessions. The record is updated atomically using Redis `EVAL`; no TTL is applied to the credential record. Choose durable storage without eviction for this record. Loss/deletion of that record permits first-login initialization again.

Without valid storage configuration, protected production requests fail closed (503). Storage outages do not silently reset credentials or grant access. Configure storage **before** deploying; then complete the first password change promptly because the initial password is intentionally predictable. Local and production accounts are separate unless explicitly configured to share a store.

Self-hosted production on a persistent private disk can explicitly set `MED25_AUTH_STORAGE=file` and `MED25_AUTH_FILE=/absolute/private/path/state.json`. Do not use this option on ephemeral/serverless infrastructure.

## Protection boundaries

- Next proxy protects page requests, APIs, study JSON, source files, PDFs, images, ranges and image-optimizer requests. Login assets/framework JS are public; protected content is not embedded in them.
- All existing content APIs also independently check the session. A server template checks before rendering the study UI. Cookie access remains outside storage-error catches so Next cannot prerender a permanent login shell.
- Cookies are HttpOnly, SameSite=Strict, Secure in production. Sessions are opaque server records, not a localStorage login flag.
- Same-origin, JSON and custom-header checks protect authentication writes. Persistent per-account rate limiting allows 12 login attempts per 15 minutes, with a separate unsupported-ID bucket. At the owner's request, unsupported student IDs receive an explicit `UNSUPPORTED_ACCOUNT` message; an allowed ID with a wrong password receives `INCORRECT_PASSWORD`. Neither error displays any permitted ID or issues a cookie. This intentionally distinguishes account eligibility; both cases remain rate-limited. A successful login resets only that account's counter.
- Each cache read requires a live authenticated session; offline sign-in authorization is not allowed. Content-addressed caches still reduce downloads while signed in. Logout clears MED25 Cache Storage but retains exam answers/results. Cross-tab logout and periodic/focus checks lock the UI.
- A previously downloaded/exported PDF cannot be revoked, nor can already received data be erased from another person's files. The new worker replaces the old cache-first worker after visiting the updated site; it cannot retroactively control an old offline copy that has never received the update.
- No self-service recovery/email reset is provided. Password loss requires an explicit owner-controlled maintenance/reset process; do not expose a public reset endpoint.

## Verification

- `npm run auth:check`: isolated unit/security tests, Neon parameterized atomic writes/failure isolation, local persistence/races, password changes, session invalidation, forced-change restriction, rate limiting, cached PDF denial and content-route guard coverage. Runs in both build scripts.
- `npm run build`: Next production compilation/typecheck and existing hook/guided/core checks.
- `node tests/auth-http.integration.mjs`: run after a build; starts a disposable production server on port 3911 using a temporary credential file. Verifies anonymous and limited-session denial, initial/new password flow, CSRF rejection, secure-cookie flags, authenticated PDF/API access, token revocation and logout. Never uses the student's credential store.
- `npm run mcq:check`: existing MCQ/progress/review regression suite.
- Verified locally: production build and isolated HTTP integration passed; authentication, PDF-cache and MCQ regression checks passed. Desktop and 390×844 mobile login/required-password screens were checked in Chrome during initial implementation. The owner subsequently completed the local password change personally; later checks preserve that account and use synthetic credentials in disposable stores.
- Existing unrelated `tests/paper-pdf.test.mjs` failures at implementation time: stale 30-PDF manifest expectation (actual 77) and missing math glyphs in export fonts. Cache authorization fixture tests pass; this auth task does not rewrite paper content/font pipelines.

## Reference decisions

Server checks follow the [Next authentication guide](https://nextjs.org/docs/app/guides/authentication). Durable production storage is required because [Vercel function filesystems are not a persistent database](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel). Redis commands use the [Upstash REST API](https://upstash.com/docs/redis/features/restapi).

The preferred adapter uses the official [Neon HTTP driver](https://neon.com/docs/serverless/serverless-driver), pinned to 1.1.0. Dependencies run server-side only.
