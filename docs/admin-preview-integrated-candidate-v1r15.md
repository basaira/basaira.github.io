# BASAIR ADMIN — V1R15 Consolidated Isolated Preview Candidate

## Frozen authority chain
- Repository: basaira/basaira.github.io
- Security V1R13 HEAD: fe93498beadf3d4f6efe65acc63559741e0f7006, TREE: 90caf98980935a1c98010a33fbb39510bd3e28d4, original CI: 39503709466.
- V1R14 HEAD: a39bf71c3c653c19e98759dcb9bd7cee5f3f3881, TREE: 0af829fa339495934a66e0a54a44a9169433f3cc.
- V1R14-R1 BASE HEAD: 74027299ba927dc16db062d55e4b8ff17696ad55, TREE: 2a6165be8d360dd2a4b216de55d778e271d92c46, CI 39514611764 successful.
- New isolated V1R15 branch: basair/admin-preview-integrated-candidate-v1r15. Final HEAD/TREE must be read independently after integration; never confuse approved base with deployment candidate.
- MAIN: 2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243; gh-pages: cef59ba05b3382978b4c18e83592f08227b2f9c4.
- Vite 6.4.4 / lock SHA256: 62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a.

## Changes: five files ONLY after R1
1. .github/workflows/admin-preview-integrated-manual-v1r15.yml: manual-only, default DO_NOT_DEPLOY, exact SHA and TREE, V1R14-R1 ancestor, five exact new paths, freeze all previous production assets/lock. Deployment cannot run without owner APPROVE_ONE_DAY_PREVIEW_ONLY, protected Environment, reviewer readback and short-lived WIF. The only future Firebase mutation is a one-day Preview CHANNEL to USER_SITE basair-admin, not the default site, from the disposable five-file asset bundle. No production secrets have been installed.
2. .github/workflows/admin-preview-integrated-ci-v1r15.yml: read-only push CI for V1R15 branch only. It has contents: read and no id-token or cloud secrets; full source and inherited security tests, zero-vulnerability npm audit, npm run verify, exact Admin SHA-256, Hosting config, and local browser iframe/XFO/CSP proof.
3. scripts/admin-preview-integrated-guards-v1r15.mjs: based on reviewed V1R14-R1 gate, copies corrected nested required_reviewers.prevent_self_review and requires exactly one explicit branch policy pointing ONLY at V1R15. No wildcard, tag, extra policy, owner-only reviewer or bypass. Enforces real V1R13/V1R14/R1 ancestry and full review-HEAD and review-TREE inputs.
4. tests/admin-preview-integrated-guards-v1r15.mjs: tests exact same source / environment / WIF / owner gate functions used by manual workflow, with independent REST-shaped mock positive and adversarial negatives, plus static simulated workflow privilege/target attacks.
5. docs/admin-preview-integrated-candidate-v1r15.md: this audit/handoff.

The frozen V1R13 and V1R14-R1 implementation files remain byte identical. Diff source allowlist is EXACTLY the five V1R15 paths, relative to R1; no catch-all. Any drift rejects.

## Hosting / security
V1R11 exact five Admin output SHA-256 and overall count 5 / 484821 bytes are rechecked by inherited tests; Hosting config SHA256 df54b916c3e4e0b7ff07190d9093d7db2cb873f08ab6b21da8e2469e5b0b9d67 and target mapping 7933ccd627a0878bda7d01c14f4fedbb466fa0a38e235140ddc7a376121f9dc0 remain frozen. No authDomain change, Firestore Rules, student data or live public website changes.

## Remaining BLOCKED external dependencies
1. GitHub workflow_dispatch registration: standalone new workflow on V1R15 isolated branch cannot be assumed dispatchable without a separately authorized Main workflow registration, which is forbidden now. No Main change performed.
2. GitHub environment "basair-admin-preview-approval" has been reported as restricted to the old branch and requiring basaira. To authorize V1R15, it would need an independently approved exact-branch policy with truly independent required reviewer and self-review prevention. No environment mutation is authorized.
3. GitHub Actions read-only token may be unable to retrieve Environment configuration/policies requiring repository Administration permission. HTTP 403 must fail closed, not be papered over.
4. Google WIF provider, trust attribute conditions, short-lived dedicated service account, actual least-privilege Firebase Preview IAM, and Spark eligibility are unverified. Do not create/change any without a separate authorization. In particular project-level Hosting Admin can also alter LIVE releases; no assumption of preview-only IAM.
5. Firebase Preview is publicly reachable and connects to real production backend. No real preview URL, remote HTTPS readback, Auth/FireStore test, IAM simulation or external deployment was executed in this V1R15 preparation.
6. A successful read-only CI verifies SOURCE / LOCAL security only, not production release eligibility.

Before any new step: independent engineering and security review of V1R15 final HEAD/TREE, CI logs, realistic failure tests, then separate owner decisions for workflow registration, environment restrictions, WIF/IAM and later Preview dispatch. STOP: NO MERGE / NO FIREBASE DEPLOY / NO PRODUCTION MUTATION.
