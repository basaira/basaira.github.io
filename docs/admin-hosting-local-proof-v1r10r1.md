# BASAIR ADMIN — V1R10-R1 | GitHub Actions local-only Admin package and framing proof

## Frozen identities

Source authority V1R8 HEAD: `e4ace99a4dfa876f9597f1cc0dbc0e0c3e7dc0a6`
Source authority V1R8 TREE: `6695ffe2a119dc99bce77575d77120aee08586df`
Source authority V1R8 CI: `39067684006`, SUCCESS
MAIN: `2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243`
V1R6: `badbaa175eba86960559b2145e2b9cee3a20a7d5`
V1R7: `9cc2439970459bd8d4ed5c57b05dbf91cd1ea3ba`
gh-pages: `cef59ba05b3382978b4c18e83592f08227b2f9c4`

This branch contains ONLY disposable evidence scripts, a dedicated CI workflow and this document. Never edit production Admin, npm manifest/lock, Firestore Rules, Firebase config, or deployment scripts.

## Scope

A clean GitHub Actions ubuntu-24.04 runner checks out the exact invoking SHA, uses Node 22.16.0/npm 10.9.2, runs `npm ci` + `npm run build`, and verifies frozen git refs and changed paths. The asset scanner must operate on the *built* `dist/admin.html` and recursively follow local referenced script/link/image/font/CSS URL/module imports; copy only reachable assets to a **RUNNER_TEMP-only** disposable directory. It must check safe relative paths, immutable copy hashes, absence of public pages, Firebase deploy config and secrets, and preservation of the project's Firebase Auth/Firestore client config. Print per-file exact SHA-256 and bytes; manifest is transient evidence, not a release/published artifact.

The browser fixture exposes exactly the disposable directory over local HTTP at port 4179 WITH response headers `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` on `/admin.html`. The unprotected negative control uses port 4181 WITHOUT these headers. A separate local origin at port 4180 requests each Admin page in a cross-origin iframe. Assert unprotected Admin DOM loads, protected Admin DOM does NOT, inspect response headers and actual Chromium security-console refusal. Preserve original CSP meta and verify top-level protected Admin Auth UI, Arabic RTL, request counter elements, no missing local assets and real gstatic Firebase SDK module HTTP responses if reachable. Browser network routing must deny all production Firebase project/Auth/Firestore endpoints. No real login or Firestore operations.

Historical V1R8 successfully tested script-src, connect-src, frame-src, form-action, object-src, base-uri; this proof adds HTTP enforced *frame-ancestors*. The HTTPS production host is NOT evaluated; a local PASS does not authorize hosting creation or deployment. The site inventory, enabled plan, authorized domains, IAM, site types, real hosting release, rollout and rollback compatibility are UNKNOWN.

## Test tooling

Base project V1R8 `npm audit` was 0; temporary V1R8 test tools had SIX HIGH entries. This proof installs Playwright separately under RUNNER_TEMP, preferring patched `playwright@1.55.1` and verifying registry integrity against its separate test lockfile. Any current toolchain advisories remain separately reported; do not claim the historical six are fixed. CI packages and app dependencies must never be combined in audit counts.

## Release boundary

Even after a local proof, separately approve: 1) authenticated Firebase Hosting inventory; 2) standalone secondary site creation; 3) Auth Authorized Domains/OAuth/API key restrictions; 4) explicit test publication; 5) old GitHub Pages `/admin.html` retirement; 6) isolated Hosting-only deployment. No `firebase init`, no `firebase deploy`, no site creation, no Pages deployment and no Firestore Rules mutation in V1R10-R1.
