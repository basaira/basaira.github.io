# BASAIR ADMIN — V1R14 | Guarded Preview Qualification, No Deployment

## Frozen authorities and trust boundary
Approved SECURITY SOURCE V1R13 HEAD: fe93498beadf3d4f6efe65acc63559741e0f7006
V1R13 TREE: 90caf98980935a1c98010a33fbb39510bd3e28d4
V1R13 CI: 39503709466 SUCCESS.
MAIN: 2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243
GH-PAGES: cef59ba05b3382978b4c18e83592f08227b2f9c4
V1R12-R2: 8e540f90bf1e63098374d7d34e4142ed8298f797
New isolated candidate branch: basair/admin-preview-guarded-release-qualification-v1r14

The approved V1R13 security source is a frozen ANCESTOR, NOT the future V1R14 candidate HEAD. V1R14 HEAD/TREE must be independently reviewed after this change, then explicitly provided to any future manual dispatch. The source gate verifies exact branch, actual checked-out HEAD = GitHub dispatch SHA = owner-entered HEAD, actual Git TREE = owner-entered TREE, immutable V1R13 security HEAD/TREE and ancestry, exact five V1R14 paths only, unchanged patched Vite 6.4.4 lock hash 62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a, and sole Hosting USER_SITE basair-admin. No wildcard permit-list entries. Existing V1R13 and V1R12-R2 workflows remain intact as historical evidence.

## Scope, unchanged assets and permissions
Five new files only: manual workflow, read-only CI workflow, real fail-closed gate implementation, mocked positive/negative tests, and this document.
No edits to app source, package manifests, lockfile, Firestore Rules, Firebase config, default site, GitHub Pages or production data.
The fully qualified legacy five-file Admin build is 484821 bytes with strict SHA-256 individual file validation by inherited asset-closure and V1R11/V1R12 security tests.
Manual workflow is workflow_dispatch ONLY, default DO_NOT_DEPLOY, separate APPROVE_ONE_DAY_PREVIEW_ONLY for the guarded deploy job.
Permissions BEFORE (V1R13 manual): top-level contents:read; preflight inherited contents:read; deploy contents:read, actions:read, id-token:write.
Permissions AFTER (V1R14 manual): identical. New V1R14 CI permissions: contents:read only. No id-token:write or cloud credentials outside deploy job.
WIF uses google-github-actions/auth v3 short-lived credentials only. No FIREBASE_TOKEN, no service-account keys.
The only future external mutation command remains Firebase Hosting preview-channel deploy with --only admin-v1r11-only under project basair-academy-4a1d0 and --expires 1d. Neither DEFAULT_SITE nor Firestore Rules are included. No command has been executed.

## Mock tests and real CI
Unit tests import the exact gate functions also used by manual workflow. Positive synthetic input: matching SHA, TREE, branch, ancestor, five paths, lock and site, valid WIF format and truly independent protected review.
Negative synthetic inputs: mismatching SHA or TREE, wrong branch, unknown file, missing file, default site, wrong ancestor, V1R13 tree drift, old Vite, bad lock, wrong repository, no owner approval, missing/invalid WIF, wrong service-account project, permanent token, no required review, self-review allowed, self reviewer alone, admin bypass, missing V1R14 branch policy.
All are mock values. No real GitHub/Firebase/Auth token or write is part of tests.
Read-only isolated CI verifies Git history, npm ci, fail-closed npm audit, npm run verify, exact Admin asset closure and hashes, Hosting target & configs, tooling audit, and local Chromium HTTP CSP/XFO clickjacking protection with production network blocked.
A local test cannot establish real Firebase Hosting HTTPS behavior or real Preview Auth compatibility.

## BLOCKERS not covered by this authorization
1. GitHub workflow_dispatch registration: GitHub requires the workflow definition on the default branch for the initial manual dispatch. No V1R14 file is on MAIN. Do not dispatch by alternative write-trigger or move the default branch. This is still BLOCKED.
   Option A: add a minimal standalone dispatch trampoline to default branch in a separate audited owner-approved change. It must avoid arbitrary SHA, refs and credential paths and cannot deploy by itself; extra surface for confused-deputy errors.
   Option B: independently approve registering a pinned, fail-closed manual workflow on default branch and dispatch a separately validated exact ref; even one workflow-only change to MAIN requires owner and reviewer permission and is forbidden today.
   Option C: separately authorize a human-run preview-only CLI with independent recorded build hashes and MFA/credential review, leaving MAIN untouched; does NOT inherit GitHub Environment/OIDC guard guarantees and needs a new security review.
2. Environment: Owner reports basair-admin-preview-approval currently restricts to OLD branch, requires basaira, and disallows administrative bypass. Do NOT change it. Future owner approval must enable the exact new V1R14 branch policy; deny MAIN/default site/other branches; require a reviewer independent from the initiating operator, preferably with prevent_self_review true. Merely allowing the owner to approve their own run is NOT independent security review. Current GitHub environment API access via GITHUB_TOKEN may lack repository Administration read permission: a 403 is an expected fail-closed blocker, not justification to add privileges silently.
3. Google IAM/WIF and Firebase permissions are not proven. Read-only prerequisite inventory: hosting Site IDs and site type, current releases/channels; OAuth WIF provider issuer and attribute conditions for repository ID, exact branch, environment and audience; pool binding on intended dedicated service account with roles/iam.workloadIdentityUser; service-account existence and disabled key creation; Firebase Hosting API permissions needed to create channel, deploy version, release channel; whether project-wide roles grant undesired LIVE publish; CLI exact supported version and its service calls; API-key and Firebase Auth preview-hostname limitations. Do not create provider/account/role, change billing, or claim exact IAM least privilege without permission simulation/readback of real APIs.
4. Public Preview uses real Firebase project backend. Future proof must be unauthenticated, block production Firebase/Auth/Firestore requests, check returned real HTTPS URL/headers/Chromium, expiration, and no live/default Hosting changes, followed by an explicit independent decision for any further operations.
5. Approval barrier: workflow is not registered on MAIN, environment does not allow new branch, WIF/IAM not established. Result cannot be classified release-ready, even if isolated CI passes.

## Stop conditions
NO MAIN MERGE; NO GH-PAGES CHANGE; NO PREVIEW/LIVE DEPLOYMENT; NO FIREBASE/GCP AUTH OR IAM MUTATION; NO PRODUCTION STUDENT DATA; NO BILLING UPGRADE; NO ENVIRONMENT CHANGE. Report and await independent review and subsequent explicit owner approval.
