# BASAIR Admin — root-cause repair / verification ledger

**Frozen production sources:** `main` at `2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243`; the corresponding verified Git tree is `09aa7bd7325e7c078cc817f0790402a5667a3644`. Production `gh-pages` must remain `cef59ba05b3382978b4c18e83592f08227b2f9c4`. These values are identity gates, not deployment targets for this branch.

**Scope:** candidate changes only on `basair/admin-functional-security-repair`. The source `firestore.rules` is **not deployed** by this work. All tests use synthetic users and documents.

## A. Architecture and event flow

- `admin.html` defines the RTL Arabic shell, navigation, login form, request search/status form, CMS text editor, video editor, contact settings, audit list, and help. `admin-v3.css` and other admin-only styles preserve the established BASAIR design.
- `admin.js` imports `firebase-config.js`, the static `content-registry.js` module, Firebase Auth/Firestore SDK modules, and `admin-repair-core.mjs` (pure session/concurrency/request-sort policy). `admin-ui-fixes-v1.js` synchronizes badge visibility without owning application authentication. `harden-v1.js` supplies shared input/network hardening.
- **Login:** email/password and Google popup use Firebase Authentication; `onAuthStateChanged` checks `admin_roles/{uid}` and opens the dashboard **only** if `active === true`. Authorization failure, logout, session change, and live role revocation close the panel.
- **Requests:** a bounded Firestore `documentId()` cursor loop enumerates `enrollment_requests` and `assessment_requests`; only the first 100 matching rows render until the operator requests more; source collections and document IDs remain preserved. A transaction reads the current status, checks the expected value, writes the status and actor UID, and writes the audit event atomically.
- **Content:** the registry is static, while `site_content/public` stores only text overrides, video metadata and contact settings. A transaction reads the current public document and rejects stale same-field/same-array updates before committing the change and audit entry. The document has not been migrated to a new schema.
- **Audit:** `admin_audit` has separate idle, loading, success/empty, permission-denied, and network-failure states. Failed audit reads never masquerade as empty success.
- **Public integration:** `app.js` consumes safe content overrides via `textContent`, non-Firebase external HTTPS video links, and the public contact settings; `acquisition.js` provides assessment intake. This branch does not change those public source modules.

## B–D. Confirmed defects, root causes, corrections

| Severity | Defect / root-cause evidence | Candidate correction |
|---|---|---|
| Critical | An asynchronous role read could finish after account switching/log-out and set `isAdmin` from a stale callback | Auth revision and UID checks before display; immediate fail-closed logout; role-revocation listener |
| High | Requests used `limit(1000)` without a cursor, leaving later documents invisible | Deterministic `documentId()` cursor queries, 200 per server page, 100 per UI view and explicit operational cap |
| High | Request status writes had no stale-status guard | Transactional expected-status compare; actor UID and immutable audit in the same transaction |
| High | Site content, videos and contact settings wrote entire stale cache snapshots | Transaction reads authoritative document, detects concurrent change and refuses overwrite |
| High | `admin_audit` create rules allowed an active admin to specify a different `actorUid` / email | Bound audit actor to the authenticated Firebase token; action, timestamp, details and field validators |
| Medium | `loadAudit()` swallowed permission failures and rendered a false empty state | Explicit error categories; failure propagates to combined load result |
| Medium | Missing contact settings displayed prefilled channel values as though persisted | Render only actually stored values; placeholders remain non-persistent hints |
| Medium | Legacy regression tests demanded the broken request cap and a specific obsolete write API | Tightened checks require cursor pagination, transaction consistency and audited mutations |

## E–H. Verification classification

- **SOURCE VERIFIED:** use the CI result for the *exact candidate SHA*, not for a preceding commit. Required gates are `npm ci`, `npm run verify`, `npm run build`, `node token-authority-check.mjs`, preflight CSS count 51, `git diff --check`, and no protected public/Folio source changes.
- **UNIT VERIFIED:** `node --test tests/admin-policy.test.mjs` covers authentication generation, stale roles, request sorting and conflict detection.
- **EMULATOR VERIFIED:** `tests/admin-firestore-emulator.test.mjs` runs in the local `demo-basair-admin-security` Firestore Emulator; covers non-admin/anonymous denial, active admin status updates and content writes, audit actor attribution and immutability, and revocation. It must **never** be pointed at a production project ID.
- **BROWSER VERIFIED (synthetic provider):** `tests/admin-browser-smoke.mjs` blocks all real external Firebase traffic and uses mock SDK modules, testing Arabic RTL, four viewport sizes (1440×1000, 390×844, 759×900, 761×900), login shell, navigation, active role, non-admin denial, role revocation and delayed-role sign-out race. **This does not verify live Google OAuth or production credentials.**
- **LIVE PROVIDER UNVERIFIED:** actual Firebase Authentication providers, API key website restrictions, authorized domains, deployed rules, real role bootstrap, real data integrity and cross-session live writes are outside this branch. An operator must verify them in a distinct authorized gate.

## I. Read-only operator checks before any production proposal

1. Confirm the intended project ID in Firebase Console without exporting service-account JSON or tokens.
2. In **Authentication → Sign-in method**, inspect whether Email/Password and Google are enabled; inspect **Authentication → Settings → Authorized domains** and the Google Cloud API key's website restrictions.
3. In **Authentication → Users**, identify the intended administrator's UID. In **Firestore → Data**, read (do not create here) `admin_roles/<UID>` and confirm boolean `active: true`.
4. If the initial administrator is absent, a **separately authorized privileged operator** must create the Firebase Authentication account and then set `admin_roles/<UID>` from the Firebase Console or a privileged IAM-backed administrative procedure. Never bootstrap through the public website or weaken the Firestore rules. Never share a password, access token or service-account key in chat.
5. Compare the deployed Firestore rules to this candidate and obtain a **separate rule-deployment authorization** if different. No rule deployment is included here.
6. Use a dedicated synthetic test user and isolation/backup plan for any later live write validation; never test mutations on real student documents.

## J–M. Change control and next gate

All changes are limited to the isolated Admin implementation branch. The new source policy module, executable tests, and CI are also on that branch. Production `main`, historical M5/M4 and `gh-pages` remain frozen.

**Never report complete production readiness solely from this source work.** A separate independent closure gate must check the final candidate SHA and TREE, the full CI run and remaining live-provider limitations. No promotion, merge, Pages deployment, Firebase rule deployment, backend changes or real-user data mutations are permitted.
