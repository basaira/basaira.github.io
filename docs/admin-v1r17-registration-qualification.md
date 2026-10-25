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
