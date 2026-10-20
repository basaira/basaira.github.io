# BASAIR ADMIN — V1R12, secondary Hosting Preview channel preflight

## Operator authorization and limits

The owner authorized preparation and testing of an **isolated Firebase Hosting preview channel** belonging only to the existing USER_SITE `basair-admin` in project `basair-academy-4a1d0`. This is **not** permission to promote the live Hosting channel or alter Auth, Firestore, Rules, DNS, GitHub Pages, default Firebase Hosting site or Spark billing. Do not create a new Hosting site.

The evidence branch `basair/admin-preview-v1r12` begins at frozen V1R11 HEAD `3ec08740edd956351a091924d35254b6c24d09d4`, TREE `4d12ba83c40eeb5166f66dd21e89d09d42caa04e`, CI `39078517265` SUCCESS. Preserve locked V1R8 app source, all five exact V1R10-R1 asset hashes, V1R11 config hash `df54b916c3e4e0b7ff07190d9093d7db2cb873f08ab6b21da8e2469e5b0b9d67` and target map hash `7933ccd627a0878bda7d01c14f4fedbb466fa0a38e235140ddc7a376121f9dc0`. There are no code, package, Firestore Rules or Firebase client configuration changes.

## Preview target and correct Firebase CLI syntax

Official Firebase multisite documentation uses **`--only TARGET_NAME` (without `hosting:`)** with `firebase hosting:channel:deploy`. It is intentionally different from `firebase deploy --only hosting:TARGET_NAME`, which publishes to a **live channel**. Never run a plain or unscoped Hosting preview command; that defaults to the DEFAULT_SITE.

The intended future operator command, **not executed by V1R12 automatic CI**, is the following, from the disposable candidate directory containing only `firebase.json`, `.firebaserc`, the 5-file `admin-only/` directory, and manifest:

```bash
firebase hosting:channel:deploy v1r12-admin-only --only admin-v1r11-only --project basair-academy-4a1d0 --config firebase.json --expires 1d
```

This must **only** be executed by an authenticated, permitted Firebase operator after independently verifying the account's Hosting permissions and target mapping. Do not embed credentials, Firebase service-account JSON, OAuth tokens or `FIREBASE_TOKEN` in Git or CI logs. Use minimum required permissions. Do not use `firebase deploy` or `firebase hosting:clone`. No billing upgrade authorized. Preview channel expiration is one day; its URL is returned by the tool, never guessed.

### Material safety limitations

A Firebase Hosting preview URL is **publicly reachable** to anyone knowing the URL, and Firebase docs state that the app hosted there connects to the project's **real** backend. Although Firestore Security Rules still apply, do **not** sign in, use real student credentials or query production student records during the preview smoke. The new preview URL hostname is **not guaranteed** to be in Auth Authorized Domains or API-key referrer restrictions; the owner previously authorized `basair-admin.web.app` for normal Hosting, which does not by itself authorize every generated preview hostname. Do not change Auth or API key restrictions in this mission.

The immutable application CSP is retained, and `firebase.json` adds response headers `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` for `**` on static files. Do not conflate local Chromium success with HTTPS Hosting actual-header proof. If a preview is later published, use HTTP headers from **that exact preview URL** and a separate-origin Chromium iframe to prove browser-enforced refusal, plus the original unauthenticated UI/RTL/counters/no-missing-assets smoke, with production Firebase service endpoints blocked. Check root /, /index.html and alternate routes never serve Admin without equivalent HTTP security headers.

## CI architecture

The `push`-triggered GitHub Actions workflow is **read-only with respect to all Firebase resources**. It tests exact frozen Git SHA/TREE and evidence-only paths; rebuilds V1R8 with Node 22.16.0/npm 10.9.2 from unchanged lockfile; reproduces V1R10-R1 closure and V1R11 Hosting candidate; proves `basair-admin` is the sole USER_SITE target; verifies correct preview CLI argument shape and writes a temporary JSON intent; then reuses real Playwright cross-origin protected/unprotected proof on the candidate. Its GitHub artifact contains **JSON evidence and config only**, not a deployable Admin bundle. There is no Firebase CLI execution, credentials or deployment automation in this workflow.

Historical V1R8 temporary tools had six HIGH advisory entries; V1R11's isolated patched Playwright had zero at the time of its successful CI. Audit base and temporary tools separately again and record the observed results without assuming vulnerabilities remain unchanged.

## Owner release gates

1. Independent source/config/CI review and the exact new V1R12 HEAD/TREE freeze.
2. Operator verifies account/site `basair-admin` and Preview permissions without modifying live.
3. Operator deliberately executes **preview-only** command with short expiration and captures actual URL/release ID.
4. Remote **unauthenticated** HTTPS header and Chromium tests; block real Firebase Auth and Firestore API traffic.
5. After the operator captures the *actual* CLI-returned preview URL, perform a read-only check with `BASAIR_PREVIEW_URL=<EXACT_URL_FROM_FIREBASE_CLI> BASAIR_TEST_TOOLS=<ISOLATED_PLAYWRIGHT_DIR> node tests/admin-preview-remote-http-v1r12.mjs`. The test **refuses the live/default domains**, checks the real HTTPS response headers, full unauthenticated Admin UI and assets, and records Chromium cross-origin frame denial while preventing browser requests to production Firebase Auth or Firestore. It is prepared now but must NOT execute before a preview exists.
6. Operator decides whether separate Auth/domain approvals, real test publication, old insecure `https://basaira.github.io/admin.html` retirement, rollback and live-channel release are desirable later.

No preview URL, live release, Auth test or Hosting header proof is claimed until an authorized preview publish and independent browser verification succeed.
