# BASAIR ADMIN — V1R12-R2: Guarded Manual Preview Preparation

## Execution state
ISOLATED PREPARATION ONLY. **Preview deployment NOT EXECUTED.** No merge, no deployment, no Firebase Auth/Firestore/Rules/DNS/billing changes.

- Repo: basaira/basaira.github.io
- Frozen V1R12 HEAD: 40d9560a76c1c3d67995e59bf2e0ba7bb09176cb
- Frozen V1R12 TREE: c67b4106c9519c5fec49637606adfb2e605bc89d
- Frozen V1R12 CI: 39355321067, successful.
- Isolated branch: basair/admin-preview-manual-release-v1r12r2
- Application build from frozen lock SHA-256 1a4b3f5403ceb7e516ee1c13d0a79be1ba4276784a792c17064cf7fdf424cc76.
- 5 assets, 484821 bytes, exact V1R10-R1 hashes; no source, Firebase config, Firestore Rules or package edits.
- Immutable V1R11 Hosting config SHA-256 df54b916c3e4e0b7ff07190d9093d7db2cb873f08ab6b21da8e2469e5b0b9d67.
- Immutable isolated target-map SHA-256 7933ccd627a0878bda7d01c14f4fedbb466fa0a38e235140ddc7a376121f9dc0.

## Two workflows with unequal privileges
1. .github/workflows/admin-preview-manual-ci-v1r12r2.yml: push on the single isolated branch only. Clean build, verify static manual-workflow contract, confirm frozen Git refs, re-attest exact assets and Hosting target. **No id-token permission, no Firebase CLI deployment, no Firebase credentials, no live backend contact.** This CI is NOT a deployment authorization.
2. .github/workflows/admin-preview-manual-v1r12r2.yml: workflow_dispatch ONLY (no push/PR/schedule). Preflight without Firebase auth. The deploy job requires (a) exact isolated branch, (b) exact dispatch SHA matching the separately entered reviewed candidate SHA, (c) the explicit APPROVE_ONE_DAY_PREVIEW_ONLY option (default is DO_NOT_DEPLOY), (d) an actual GitHub Environment called basair-admin-preview-approval with required reviewers, verified using GitHub REST before auth, (e) environment-approved short-lived WIF authentication to a project-specific service account, and (f) fresh five-file and target revalidation. If any condition fails, STOP. No uploaded runnable bundle reused.

### Critical GitHub workflow_dispatch limitation
GitHub documents that workflow_dispatch triggers only when its workflow file is present on the repository's **default branch**. Since MAIN is frozen and no merge is authorized, the isolated new manual workflow is *NOT CURRENTLY DISPATCHABLE*. Do NOT circumvent this via a push-triggered deployment or by moving/changing the default branch. The next owner decision must resolve the registration mechanism independently and must NOT be interpreted as automatic approval to merge or deploy.

### Environment / WIF / Firebase IAM dependencies — UNKNOWN, FAIL CLOSED
Current connector cannot establish GitHub environment reviewer settings or Google Workload Identity Federation IAM readiness. Do not claim any has passed. The deploy job checks the GitHub environment's real required_reviewers protection rule before receiving Google credentials. Missing or unreadable protection blocks deployment. Repository/environment variables needed, never containing secrets:
- BASAIR_PREVIEW_WIF_PROVIDER: full numeric Google project-number Workload Identity provider resource path (not project ID).
- BASAIR_PREVIEW_SERVICE_ACCOUNT: purpose-specific service account under basair-academy-4a1d0.
Review exact permissions and billing eligibility **before** creating any IAM or WIF resource; creation is NOT authorized by this implementation. No permanent service-account keys or FIREBASE_TOKEN are allowed. Need independently verify Firebase CLI authorization to the target, site-level least privilege where supported, and environment reviewer protections.

### Target isolation and command
Inside disposable generated candidate root only, after all gates, the only external write command is:

firebase hosting:channel:deploy v1r12-admin-only --only admin-v1r11-only --project basair-academy-4a1d0 --config firebase.json --expires 1d --json

The --only argument is a naked Hosting target, NOT hosting:TARGET (that second shape belongs to LIVE firebase deploy). This preview command is documented by Firebase's multi-site deployment targets guidance. It must target existing basair-admin USER_SITE, not basair-academy-4a1d0 DEFAULT_SITE; no site creation, live release, clone, DNS, Auth, Firestore or Rules deployment. Pin Firebase CLI 15.30.2 and compare npm lock integrity with registry metadata before use. Candidate config contains only a single hosting resource and target mapping, no firebase deploy instruction.

### Safety of externally published preview
Firebase preview URLs are publicly reachable and connect to the real project backend. Do not use an administrator account, private student data or any production Firestore mutations. The dedicated live host basair-admin.web.app is an Authorized Domain; a **dynamically generated preview hostname is NOT approved merely because the live hostname is**. The client authDomain remains basair-academy-4a1d0.firebaseapp.com. Never add preview hosts, modify OAuth, API-key restrictions or Auth in this task.

The actual preview URL must be learned from Firebase CLI's --json response, never synthesized. The post-deploy parser refuses unmatched URLs, and the existing remote Playwright test blocks project Auth/Firestore endpoints, proves real HTTPS CSP frame-ancestors 'none', X-Frame-Options DENY, iframe rejection from a separate origin, top-level RTL/login/counters/assets and real gstatic SDK responses, without real sign-in. Failure means no promotion. The short expiration is requested as 1d; independently verify actual channel expiry in later read-only inventory. Preview URL expiration is not a rollback of a live release.

### Migration, release and rollback remain separate
The GitHub Pages public academy and its OLD unprotected https://basaira.github.io/admin.html entrypoint remain completely unchanged. Separate owner-approved retirement must account for open tabs, cached JavaScript, old/new sessions, in-flight transactions, R0 rules compatibility and rollback to a verified secure Admin release. Never use the old vulnerable Admin as a security rollback.

### Next operator decision (NO EXECUTION YET)
1. Inspect static CI, changes and final HEAD/TREE; do not consider a CI success remote Firebase proof.
2. Verify protected GitHub Environment with required reviewers, project WIF and minimal Firebase IAM permissions using approved read-only operator checks.
3. Resolve workflow_dispatch requirement for a registered workflow on default branch without violating frozen MAIN or deploying; obtain **separate explicit owner approval** for any such change.
4. Obtain **another explicit owner approval** for the exact preview deployment target, credentials, one-day channel and public real-backend effects.
5. Only then may the manual preview be dispatched and remote HTTP/browser tests run. Until then: STOP.

Final status labels must distinguish PREPARED, AUTHORIZED, EXECUTED and VERIFIED. Classification B if IAM, Environment or default-branch dispatch prerequisites remain unproven.
