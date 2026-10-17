# BASAIR ADMIN — V1R11 dedicated USER_SITE candidate (NO DEPLOYMENT)

## Authority and owner-supplied resources

Project: `basair-academy-4a1d0`.
Owner-verified existing DEFAULT_SITE: `basair-academy-4a1d0` (`https://basair-academy-4a1d0.web.app`).
Owner-verified existing USER_SITE: `basair-admin` (`https://basair-admin.web.app`).
Owner-reported plan: **Spark**, no billing change authorized. These are owner statements, not fresh production Firebase API inventory/readbacks.

Frozen Git:
- MAIN `2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243`
- V1R7 `9cc2439970459bd8d4ed5c57b05dbf91cd1ea3ba`
- V1R8 `e4ace99a4dfa876f9597f1cc0dbc0e0c3e7dc0a6`
- V1R10-R1 `fd76499bd70e79592a67b41d428960091043c57a`, TREE `254532e2fcf0329144ffdb2bcc80f1a9ee007ebb`, CI `39074692370` SUCCESS
- gh-pages `cef59ba05b3382978b4c18e83592f08227b2f9c4`

Branch `basair/admin-dedicated-hosting-candidate-v1` starts at V1R10-R1, preserving all application source, V1R8 browser evidence, Admin counters, auth/session protection, request write transactions, audit and historical R0 compatibility.

## Immutable five-file closure

Run clean `npm ci`, `npm run build` at Node 22.16.0/npm 10.9.2 with frozen lockfile SHA-256
`1a4b3f5403ceb7e516ee1c13d0a79be1ba4276784a792c17064cf7fdf424cc76`.

Reuse `tests/admin-only-asset-closure-v1r10r1.mjs` against actual `dist/admin.html`. All five files must match the V1R10-R1 independent SHA-256 and byte count, total 484821 bytes. Only those files are copied to `$RUNNER_TEMP/basair-v1r11-candidate/admin-only`. No public pages, Firebase deploy config, secrets, Firestore Rules or Folio in that public directory. The emitted `manifest.json`, `firebase.json` and `.firebaserc` reside OUTSIDE the public subtree; exact hashes are recorded in the manifest and CI evidence.

A node script creates `$RUNNER_TEMP/basair-v1r11-candidate/firebase.json` with only one `hosting` resource; it declares `target: "admin-v1r11-only"`, `public: "admin-only"`, and all-route `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`. A corresponding temporary `.firebaserc` binds ONLY that target to site `basair-admin` under the exact project. No `site` override, `rewrites`, `redirects` or default Hosting target. `Cache-Control: no-store, max-age=0` applies to `/admin.html`. The built HTML's original CSP meta is unchanged; the HTTP header adds stricter frame restrictions, preserving existing script/connect/frame/object/base/form restrictions via intersection.

**Reserved Firebase namespaces:** Firebase Hosting reserves `/__/...` routes. These do not serve the five-file Admin HTML but must be separately checked for Auth compatibility at the actual site before production deployment. The only packaged HTML interface is `/admin.html`; root `/`, `/index.html` and other aliases must NOT serve the Admin app. If the site is later configured to serve Admin under another URL, all such routes must be protected too.

## Security and separate operator gates

The Auth client configuration must retain project `basair-academy-4a1d0`, `authDomain: basair-academy-4a1d0.firebaseapp.com`, `signInWithPopup`, email/password and `browserLocalPersistence`. A new `https://basair-admin.web.app` origin may need addition to Firebase Auth **Authorized Domains** and API-key HTTP-referrer allowlist (if restrictions apply). The operator must inspect authorization, OAuth settings, and actual Google Popup result; NO Auth changes or live test in this mission. No production Firestore read/write, no private records, no R2 deployment.

The public academy remains on GitHub Pages unchanged. Do NOT change or retire `https://basaira.github.io/admin.html` during V1R11. Before any later promotion, the owner must separately approve a static, inert transition page for that old endpoint, verification of cached old client tabs and in-flight transactions, explicit rollback of the new dedicated site, and browser/Auth checks under R0. A new secure site does not secure or turn off the old endpoint.

No Firebase CLI is executed by the packaging script. A FUTURE deployment, only after authorization and independently verifying the site target, must be explicitly scoped, e.g. from inside the disposable candidate root:
`firebase deploy --config firebase.json --project basair-academy-4a1d0 --only hosting:admin-v1r11-only`
and never plain `firebase deploy`, `firebase deploy --only hosting` (all configured sites), or `firebase deploy --only firestore:rules`.
**The command above is documentation, not an invocation.** Further production checks must prove the temporary target map resolves exclusively to USER_SITE `basair-admin`; no default site replacement. Do not upgrade Spark billing.

## Test requirements and conclusion scope

Use existing V1R10-R1 Chromium protected/unprotected test on the new five-file bundle. Capture actual local HTTP response headers, unprotected cross-origin frame rendering, protected rejection with Chromium security-console text, top-level RTL/Counter/Auth smoke and real gstatic SDK response codes; all Firestore production network requests remain denied.

Clean project's `npm audit` stays separate from temporary Playwright tooling audit. New temporary Playwright 1.55.1 is integrity-checked against npm metadata. No full expensive Emulator reruns because Admin/Rules source unchanged. Collect manifest and JSON evidence in CI; do NOT upload the runnable application bundle, publish a preview channel, invoke Firebase Hosting APIs or make any production mutation.

Success of all tests proves only **isolated readiness for a future owner-controlled trial**, not Auth Authorized Domains, actual Site target's active release, production Hosting headers or readiness to retire old Pages Admin.

## Approval order

1. Read-only Firebase inventory and confirmation no unintended release on `basair-admin`.
2. Auth Authorized Domain/API referrer/OAuth permissions inspection and owner approval for any changes.
3. Review immutable manifest and verified new-origin browser behavior in a separately approved synthetic test.
4. Separately approve old insecure GitHub Pages Admin endpoint retirement and safe rollback.
5. Explicit approval to deploy ONLY the locked Hosting target to the USER_SITE; R2 Rules remains out of scope.

**NO MERGE, NO DEPLOYMENT, NO PAGES ALTERATION, NO FIREBASE AUTH/RULES/BILLING MUTATION.**
