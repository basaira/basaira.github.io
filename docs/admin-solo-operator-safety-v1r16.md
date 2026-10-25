# BASAIR ADMIN — V1R16 | Solo Operator Safety Qualification (isolated, no deployment)

## Mission and immutable starting authorities

- Repository: basaira/basaira.github.io
- Approved V1R15 HEAD: ac644985086e5dbb792a3b1236008257868fecc5
- Approved V1R15 TREE: d48ef39c2f504c84268e5f529652a1f67980a240
- Approved V1R15 read-only CI: 39518326670, SUCCESS.
- MAIN frozen: 2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243
- GH-PAGES frozen: cef59ba05b3382978b4c18e83592f08227b2f9c4
- Isolated branch: basair/admin-solo-operator-safety-qualification-v1r16
- Vite patched 6.4.4, lock SHA256: 62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a

## Two strictly non-deploying manual operations

1. VERIFY_ONLY is the default. It accepts an owner-reviewed exact HEAD and TREE, checks branch, repository, Git ancestry to frozen V1R15, precisely five new V1R16 paths, correct Admin-only target, patched Vite and lock digest. Runs clean npm ci, fail-closed npm audit, npm run verify, SHA-256 five-asset closure, and Firebase Hosting *static* target isolation. No owner deployment authorization is needed. This job has no GitHub Environment, no Google authentication action, no OIDC id-token permission, no Firebase CLI and no deployment call.
2. REQUEST_PREVIEW is an **intention record**, not a preview publish action. Requires the triggering actor to be basaira, exact SHA and TREE, the choice REQUEST_REVIEW_ONLY_NOT_DEPLOY, and the literal acknowledgement I_UNDERSTAND_NO_INDEPENDENT_REVIEW_AND_NO_DEPLOYMENT. The result is PREVIEW_REQUEST_RECORDED_NOT_AUTHORIZED. It does NOT obtain cloud credentials, create a GitHub deployment, deploy a preview channel, grant permissions, configure an environment, or say that any second reviewer exists.

Both jobs are read-only and have *only* contents: read for repository access. Checks use the actual GitHub-provided ref, repository, commit, and actor; user-provided identifiers never override them. A clear deterministic stop occurs for missing or mismatched evidence. CI uses a synthetic reviewed HEAD/TREE equal to the true CI commit solely for source verification, without acting on any real deploy consent.

## Solo operator policy and future decision boundary

The sole repository operator basaira is **not a second independent human reviewer**. No test result, GitHub self-approval, owner button, wait timer, MFA status or checkbox is described as independent verification.

The inherited V1R15 deploy workflow remains UNCHANGED and still requires independent reviewer approval via GitHub Environment. V1R16 does NOT bypass or replace its required-reviewer protection. Even the REQUEST_PREVIEW option in the new workflow has no deployment implementation and no credentials; it cannot bypass the old workflow. This intentionally fails closed for a solo owner.

A separately authorized future release design must decide how to handle the lack of independent reviewer transparently. Alternatives: recruit a true independent GitHub reviewer under enforceable self-review prevention; or, with explicit informed acceptance of weaker assurance, design a *separately security-reviewed* solo release path with owner-only actor checks, verified MFA/account protection, exact immutable SHA/TREE, allowlisted paths, a bounded intent confirmation, preferably a documented cooling-off/second session, dedicated preview site, no permanent secrets and independently verified least-privilege IAM. Neither variant is implemented, proven, or authorized here. A solo operator's second confirmation is NEVER called independent review.

## Remaining external BLOCKED requirements

- GitHub workflow_dispatch registration: the new isolated branch workflow does not automatically appear as a manual workflow until an appropriately reviewed workflow exists on default-branch MAIN. No change to MAIN authorized.
- GitHub Environment still reportedly allows the older branch and basaira approval. Actual rule readback is not proven for V1R16, and this read-only workflow does not use that environment.
- WIF and Firebase IAM are unverified. They are not required for V1R16 VERIFY_ONLY; do not create providers, service accounts or update roles.
- Firebase Preview actual HTTPS remote headers, Auth behaviour, preview expiration and default-site stability remain untested. No preview URL exists from this V1R16 execution.
- No main or gh-pages changes, no merge, no deploy, no Firebase Auth/Firestore/Rules/Hosting mutation, no GCP billing upgrade.

## Qualification evidence

Read-only CI on this isolated branch must independently run positive and adversarial tests of the real gates, test VERIFY_ONLY with the true Git SHA/TREE and NO owner authorization, execute the inherited V1R15/V1R14-R1/V1R13 safety tests, build the original Admin five-file candidate, and run local Chromium frame protections with production Firebase network calls blocked. Report final HEAD/TREE, exact changed paths, CI run IDs and no-deployment limits. Preserve original frozen source files.
