# BASAIR ADMIN V1R14-R1 — REST Environment and branch policy gate repair

## Authorities and scope
Frozen V1R14 HEAD: `a39bf71c3c653c19e98759dcb9bd7cee5f3f3881`; TREE: `0af829fa339495934a66e0a54a44a9169433f3cc`; original read-only CI: `39511066462` SUCCESS. Branch: `basair/admin-preview-environment-gate-repair-v1r14r1`.
Only four paths changed against frozen V1R14: guard JS, negative/positive test JS, this new no-deploy CI, and this report. V1R14 original branch, MAIN, gh-pages, Firebase and GitHub Environment remain untouched. No integration, credentials or deployment.

## Verified GitHub REST structures and fail-closed policy
GitHub GET environment returns `protection_rules` with a `required_reviewers` rule and `prevent_self_review` **inside that rule** (not at environment root), plus `reviewers: [{type:"User",reviewer:{login:"..."}}]`. The gate now enforces exactly one reviewer rule, `prevent_self_review === true`, required human reviewer distinct (case-insensitive) from triggering actor, no admin bypass, explicit custom branch policy, and no protected-branches alternative. It rejects absent/malformed values rather than guessing defaults.

GitHub GET deployment-branch-policies returns `{total_count,branch_policies:[{id,name}]}`. A passing response must report `total_count===1` AND expose exactly one policy, named literally `basair/admin-preview-guarded-release-qualification-v1r14`. The gate rejects any extra rule, wildcard, main, tag, historical branch, duplicate, mismatched count, or an unreturned second page. It never treats a single matching entry among unsafe extras as sufficient. Extra `type`, when present, must equal `branch`.

## Not relaxed
HEAD/TREE constraints; source ancestry; Vite 6.4.4; immutable package-lock SHA-256 `62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a`; Admin five-asset SHA-256 checks; USER_SITE `basair-admin`; `DO_NOT_DEPLOY`; owner explicit approval; WIF-only short-lived credentials; `id-token: write` limited to historical deploy job; no deploy command in new CI.

## Testing and remaining boundaries
New CI tests the **exact same function** referenced by the historical V1R14 manual workflow, using documented REST-shaped fixtures, positive review and negative cases including all additional policy attacks. It then runs npm ci, fail-closed npm audit, npm run verify, old five asset hashes, hosting isolation, local Chromium protection and tool audit. All HTTP/browser tests run locally without Firebase authentication or data writes.

This repair branch is **not itself dispatchable for preview**: the historical V1R14 manual workflow pins V1R14's branch/HEAD/source-file allowlist; that workflow has intentionally not been altered in this scoped gate repair. Any later integration of the gate correction into a qualified candidate requires a new independent authorization, review and CI. Default-branch `workflow_dispatch` registration, GitHub Environment branch policy and WIF/IAM are separately BLOCKED. Passing local CI is not release approval.

STOP: NO MERGE, NO FIREBASE/GITHUB PAGES DEPLOY, NO GITHUB ENVIRONMENT/IAM/AUTH/RULES EDIT.
