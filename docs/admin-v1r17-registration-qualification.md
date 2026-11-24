# BASAIR ADMIN — V1R17 | ISOLATED Manual Registration Qualification

## Frozen starting authorities
- Repository: basaira/basaira.github.io
- V1R16 HEAD: 3da010de1c444d956deecead8dd2e39823360e26
- V1R16 TREE: 5ed825108eb100de4879b6d5923f9ba4e572e5cc
- V1R16 verified CI: 40172481192 — SUCCESS
- Main frozen: 2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243
- gh-pages frozen: cef59ba05b3382978b4c18e83592f08227b2f9c4
- New isolated branch: basair/admin-manual-registration-qualification-v1r17
- Changes confined to EXACTLY five V1R17 paths. No previous code files changed.

## Why one Main registration file is required
GitHub only presents a new workflow_dispatch workflow for manual invocation after its workflow file is registered on the repository DEFAULT branch. On GitHub UI a branch selector may still be available; a workflow run's GITHUB_REF and GITHUB_SHA refer to the SELECTED event ref, not the ref passed to actions/checkout. Hence registration must be treated as a separate high-trust operation; branch selection alone cannot be used as authority for running arbitrary source code.

## The **entire** proposed later Main diff — exactly one new file, no other change
Proposed addition to Main:
  .github/workflows/admin-verify-only-registration-v1r17.yml

Its bytes are stored in V1R17 at this SAME repository path, solely as an isolated proposed addition, never copied to Main. This is NOT a merge request to merge V1R17's five files or any parent histories into Main. NEVER merge the V1R17 branch into Main. If approved subsequently, a separate authorized operation must add ONLY the reviewed YAML bytes to Main, after rechecking Main's then-current HEAD, the exact SHA-256 from V1R17 CI, GitHub Actions permissions, and branch-protection approval requirements.

The workflow registers ONLY VERIFY_ONLY. It does not register REQUEST_PREVIEW, and offers no dynamic workflow/script/ref/path/command input. It pins actions/checkout ref to the existing independently qualified V1R16 *full commit SHA*. The user must submit precisely the reviewed V1R16 SHA and TREE; any different inputs fail before tests. It checks the real GitHub event is workflow_dispatch from refs/heads/main, correct repository, and exact actor 'basaira'; it checks pinned checked-out HEAD/TREE, frozen V1R15 TREE, V1R16 remote branch tip and security patch lock, and invokes the already-approved V1R16 sourceGate and verifyOnlyGate from the pinned source. GitHub event GITHUB_SHA on Main is NOT falsely treated as the checked-out pinned V1R16 SHA: two distinct identities are checked.

The future YAML is self-contained: it calls NO V1R17 script at runtime. All invoked source and tests are fetched from the full V1R16 SHA. Its only permissions are contents: read, with no OIDC, no cloud variables, no Firebase CLI, no GitHub Environment, no publishing command, and no persistence of checkout credentials. Build uses pinned Node 22.16.0/npm 10.9.2, performs fail-closed npm audit, npm run verify, inherited exact five-Admin SHA-256 closure, and static dedicated Hosting guard.

## Untrusted ref / confused-deputy failure analysis
- Attacker provides alternate candidate_sha/tree: inputs must match hardcoded immutable values; fail.
- Attacker clicks another branch in UI or supplies another branch via API: job's if condition and the actual in-job GITHUB_REF equality both demand MAIN; no default branch bypass.
- Attacker modifies V1R17 or V1R16 afterwards: Main registration workflow checks out immutable V1R16 SHA, not the latest branch, and also fails if V1R16 remote branch tip drifts from the reviewed commit.
- Attacker changes package or a source file in another branch: unrelated to checked-out immutable V1R16 commit.
- Spoofed repo/actor: exact actual runtime GitHub environment guards fail closed.
- Malicious additions to Main proposal (new job/event, deployment, OIDC, credentials, environment, dynamic checkout): detected by reviewed static contract; future Main copy must match qualified SHA-256.
- Workflow itself edited on Main after authorization: that is a new TRUST BOUNDARY and requires independent review and branch rules. The candidate's tests cannot prevent privileged actors changing Main.
- GitHub actions checkout/setup-node are action major-version references rather than immutable action-SHA pins; future explicit Main change should reassess action supply-chain trust and preferably independently verify and pin upstream action digests before registration. This is a remaining qualification caveat, not evidence of arbitrary source checkout.
- No declaration that solo-operator approval is an independent human review. The Main registration performs verification only; no preview deploy path.

## Read-only CI and simulation limits
New branch push CI independently checks exact Main authority, only the five isolated V1R17 files, no mutations to app/rules/frozen files, Main proposal-only policy, mocked invalid inputs and hostile workflow changes, then executes the actual proposal Bash source-check step IN A DISPOSABLE GIT WORKTREE at the pinned real V1R16 commit using an explicitly simulated Main workflow_dispatch event. This is not a real GitHub manual dispatch. It also runs inherited V1R16/V1R15 tests, npm ci, npm audit, npm run verify, immutable Admin SHA-256, target guard, local Chromium CSP/XFO frame safety with Firebase production network requests blocked, and a separately audited temporary Playwright install.

CI/fixture success proves code behavior in a controlled simulated environment. It does not prove the workflow is registered on Main, or GitHub will permit manual dispatch, or any browser/Firebase preview has been deployed. No credential-bearing workflow is executed.

## Further approval needed — frozen external boundary
Until the owner and independent reviewer authorize a one-file Main addition, there is NO registration and no manual invocation via default branch. No Environment, Google WIF/IAM, Firebase or gh-pages changes are authorized. Future Main change must be followed by an authentic manual VERIFY_ONLY smoke run with reviewed SHA/TREE and no approval for deployment. If the Main dispatch remains unavailable or hidden, STOP; do not use a workflow_run or pull_request_target workaround.

## Rollback, future-only and separately authorized
1. Stop and disable further invocation of the newly registered workflow if an unexpected run occurs.
2. Use an independently reviewed follow-up commit that deletes ONLY the registered Main workflow file; do not reset or force-push Main.
3. Confirm no other Main paths changed and gh-pages/Firebase untouched; retain logs as evidence.
4. Revert no cloud infrastructure because none is created by this registration. Any unexpected external activity escalates to incident review, not automatic retry.

STOP — V1R17 is ISOLATED QUALIFICATION ONLY. NO MAIN WRITE, NO MERGE, NO DEPLOY.


---

# FINAL ARCHITECTURE READINESS AUDIT — 2026-10-25
**Authority:** V1R17 baseline \`2eb91de735576fa603bd60492932b4914b75fc45\`; independent read-only source inspection of actual project paths; no operational access to Firebase or GitHub Environment. This annex is an evidence-bound engineering audit, not a blanket claim of full functional completion.

## Executive engineering verdict

- **VERIFIED:** V1R17 source lineage and no cloud-credential use in proposed Main-only VERIFY_ONLY registration; after this qualification the previously mutable official Action references are pinned to independently checked official repository commit SHAs.
- **VERIFIED:** browser Admin implementation and explicit Firestore Rules have substantive authentication, role, public/private data and immutable audit boundaries, with existing emulator/UI tests available.
- **UNVERIFIED:** real deployed Firebase Rules, actual configured Authentication, live Admin end-to-end behavior, GitHub Environment and WIF/IAM permissions, real preview HTTPS headers. Offline CI does not prove these.
- **EXTERNAL BLOCKER:** Main registration has NOT been executed, so true workflow_dispatch manual availability has not been proven. Firebase Preview deployment is a separate future operation.
- **DEFECT repaired in this qualification:** main-registration workflow depended on movable major-version third-party action tags; it now pins actions/checkout v4.2.2 and actions/setup-node v4.4.0 to full Git commits.
- **DEFECT not on production-execution path:** SECURITY.md still calls Vite 6.4.3 "retained" although package.json and immutable package-lock attest Vite 6.4.4. Fixing this historical-document discrepancy must not be mixed into the one-file Main proposal; updating historical explanatory text is separate from application risk remediation.

## A. Application architecture | VERIFIED source facts, qualified limits
- **Frontend:** \`admin.html\` and \`admin.js\` are a static, modular browser-admin UI; \`admin-repair-core.mjs\` holds pure authorization/session revision, concurrency and deterministic sorting helpers. \`content-registry.js\` and static public-site source supply source-of-truth fallback text. There is no separate server API authority for Admin CMS operations: Firebase Auth + Firestore Rules are the remote trust boundary.
- **Session states:** \`onAuthStateChanged\`, \`authRevision\`, a real \`admin_roles/{uid}\` document read, and a role \`onSnapshot\` subscription gate the dashboard. The \`revokeLocalAdminSession\` path increments generation, unsubscribes, clears caches and private DOM, and closes the UI on loss of role or listener error. Firestore Rules also independently gate reads and writes; the client gate is not the security authority.
- **Data/load:** \`site_content/public\` for CMS text, video metadata and contact settings; \`assessment_requests\` and legacy \`enrollment_requests\` for lead management; \`admin_audit\` for an immutable administrative journal. \`loadAll\` calls the three loaders via Promise.allSettled and exposes partial read errors rather than declaring success. Request load generations, cursor pagination and count state handle refresh races and incomplete collections (see \`tests/admin-request-load-generation.test.mjs\` / \`tests/admin-real-write-path.mjs\`; check actual filenames before relying on a given suite). 
- **Mutation consistency:** admin.js uses \`runTransaction\` and \`writeBatch\` alongside audit insertions; conflict checks detect concurrently changed text, video and settings baselines. \`tests/admin-real-write-path.mjs\` exercises browser handlers with a synthetic Firebase Emulator target. A green read-only CI building assets alone cannot attest Firestore transactions in a deployed Firebase project.
- **Input/output:** user-visible lead data is set into request DOM via textContent; some internal structural innerHTML templates contain only hard-coded HTML. Client-side contact validators exist, while authoritative public request schema checks are in Firestore Rules. **UNVERIFIED:** exhaustive XSS, accessibility and all responsive views; local browser tests cover specified flows only.

## B. Security architecture
| Boundary | Finding | Evidence / limitation |
|---|---|---|
| Admin identity | VERIFIED SOURCE | Firebase Auth sign-in + active admin role in admin.js; no automatic role grant |
| Firestore role enforcement | VERIFIED SOURCE | \`isActiveAdmin()\` in \`firestore.rules\` checks authenticated UID and active role document |
| Public lead creation | VERIFIED SOURCE | restricted \`assessment_requests\` create schema, including valid contact, fixed status and server timestamp |
| Legacy/private collection isolation | VERIFIED SOURCE | \`enrollment_requests\` cannot be created by public users; read and status update only active admins |
| Audit integrity | VERIFIED SOURCE | \`admin_audit\` create binds actor UID and claim email, immutable update/delete, write-path batches/transactions |
| Firestore **deployed** rules | UNVERIFIED | file presence is not evidence of current cloud ruleset |
| HTML and CSP | VERIFIED LOCAL ONLY | admin.html contains CSP meta; true frame-ancestors protection requires emitted HTTP header; V1R10R1 local HTTP header/Chromium proof covers local fixture only |
| App Check, backend rate limiting, authorized Auth domains | UNVERIFIED/EXTERNAL | SECURITY.md identifies public lead abuse and client cooldown limitations; cloud configs require owner/operator verification |
| Dependency inventory | VERIFIED IN CI WHEN RUN | exact \`vite@6.4.4\`, frozen lock SHA-256, zero \`npm audit\` advisories at tested date; not permanent assurance |
| GitHub workflow supply chain | FIXED, PENDING FINAL CI | proposed registration action tags changed to full official SHA pins, lock to one vetted file; final negative-test and tag-origin qualification required |
| Solo operation | VERIFIED POLICY | V1R16 \`VERIFY_ONLY\` needs no deployment authorization and explicitly does **not** imply independent human review |

## C. Operational architecture
- **VERIFIED SOURCE:** npm ci with exact lock, \`npm run verify\` (includes build and static safety regression suites), V1R10R1 five-admin-asset SHA-256 manifest (484821 bytes), V1R11 dedicated site target \`basair-admin\`, V1R12 static preview guard and local Chromium CSP/XFO test.
- **VERIFIED ISOLATION:** the generated disposable Hosting \`firebase.json\` contains only dedicated admin Hosting target and headers; root firebase.json contains Firestore rules and must not be treated as the admin-only Hosting manifest.
- **UNVERIFIED:** operational alerting, cloud readback, IAM permissions simulation, support recovery after partial live failure, browser Auth against actual allowed preview domain.
- **ROLLBACK PLAN (future Main authorization ONLY):** add exactly one pinned workflow file to Main after independent approval. On malfunction disable further dispatch and commit a single-file deletion, without force-push or app/Firestore rollbacks; compare Main HEAD and all other paths before any proposed operation.

## D. Release architecture — separate gates, no shortcut
1. **Proposed VERIFY_ONLY registration:** default-branch \`workflow_dispatch\` registration remains unauthorized. Its job gates an event from exact \`main\`, exact repository, owner actor, reviewed source HEAD/TREE and frozen V1R16 target; it checks out \`3da010de1c444d956deecead8dd2e39823360e26\` regardless of caller-selected workflow branch. This is a **separate** identity from the GitHub dispatch \`GITHUB_SHA\` on main. It has contents:read only, no OIDC, no cloud credentials, no deploy action.
2. **REQUEST_PREVIEW:** intentionally not registered in the Main proposal; V1R16 intention-only mode cannot deploy.
3. **Independent review / solo operator:** there is no second human reviewer established. Owner confirmation is not independent approval.
4. **GitHub Environment:** unverified actual reviewer/branch policy settings; historical settings reportedly still reference an earlier candidate.
5. **Google WIF / IAM:** no authorized provider/service-account/key or minimal role evidence. No creation/change made.
6. **Firebase Preview:** no release authorization or external HTTP/HTTPS proof. Public Preview shares the real backend and may require Auth-domain configuration; do not log in for testing with real student data.

## E. Existing tests and proof boundaries
- **VERIFIED AVAILABLE TESTS:** \`tests/admin-policy.test.mjs\` pure policy, \`tests/admin-browser-smoke.mjs\` synthetic Auth/browser flows, \`tests/admin-firestore-emulator.test.mjs\` rules behavior, \`tests/admin-real-write-path.mjs\` real UI + emulator writes, \`tests/admin-four-state.mjs\` frozen compatibility variants, \`tests/admin-no-email-rules.mjs\` optional-email rules, plus immutable-asset closure, preview site and local frame-protection suites.
- **NOT EVIDENCED BY THIS QUALIFICATION ALONE:** a full contemporary execution of the emulator suites and all Admin functional flows; existing CI workflow definitions specify these runs, but their presence alone is not a passing run. Do not conflate CI \`npm run verify\` with the emulator/browser scenarios.
- **SCOPE DECISION:** only the live action-tag risk is newly confirmed within the one-file Main-registration surface. Leave application sources unchanged and preserve all original V1R17 security checks. Extend only the pinned-action origin and moving-tag negative tests, plus exact-byte registration approval.

## F. Final acceptance / next actions
- Compare and independently review FINAL HEAD/TREE; confirm exactly the five historical V1R17 qualification paths were touched relative to the V1R17 base, **zero** application/lock/rules changes.
- Prove official \`actions/checkout@v4.2.2\` and \`actions/setup-node@v4.4.0\` tag refs resolve to the full SHA pins in the proposed YAML, and verify the final one-file SHA-256.
- Re-run qualified zero-advisory npm audit, build, inherited security checks, five asset hashes and local Chromium only after all changes are fixed.
- Obtain **separate owner authorization** for exactly one Main registration file; then and only then smoke-test real VERIFY_ONLY from GitHub main. Preview-related environment/WIF/IAM steps require different, future authorizations.
- **NO MAIN / NO GH-PAGES / NO GCP / NO FIREBASE MUTATION.**
