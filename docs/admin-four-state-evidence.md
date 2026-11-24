# BASAIR Admin four-state source compatibility evidence

Evidence date: 2026-10-12 UTC. This is isolated source-pair testing. It is not a production Firebase configuration or release approval.

## Frozen inputs

| Authority | Commit/tree or blob identity |
| --- | --- |
| Main (old client/rules) | `2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243` / `09aa7bd7325e7c078cc817f0790402a5667a3644` |
| Admin candidate (new client/rules) | `aa7cdd9698914e212eef2956df0fbf62a06c94c0` / `16f19f59acb2ab289f8f453bf8ea059caa1306b4` |
| Old `admin.js` / `firestore.rules` blobs | `90c86f2b3010f1392a92626f3b76e8a11ee59c74` / `40f80ac892bfa03f90b933d6c26d51d4a513b6c6` |
| New `admin.js` / `firestore.rules` blobs | `b41ff9047a9a767741e0c97f9aa2fc67ff0ac1e6` / `ea30c6d8b74e428d783a58d9a8fd5681ef723d76` |
| `admin.html` in both commits | `8a57f75206a5088db783705208886b693caef2eb` |
| Historical M4 / M5 | `5bc4e216a568a57b217187b4030f8208ad87fe31` / main above |
| Frozen gh-pages | `cef59ba05b3382978b4c18e83592f08227b2f9c4` |
| Earlier Admin source CI | `38087006627` success on frozen candidate |

The suite reads both `admin.js` and `firestore.rules` with `git show <immutable-commit>:<path>` and checks the Git blob identities before a browser or Emulator is started. It does not copy or alter application source. The separate evidence branch changes only this document, `tests/admin-four-state.mjs`, and `.github/workflows/admin-compatibility-evidence.yml`.

## Execution boundary and reproducibility

The workflow checks out its exact commit, runs `npm ci`, `npm run verify`, `npm run build`, `node token-authority-check.mjs`, `git diff --check`, Admin unit/browser/Firestore regression tests, and then the new four-state suite. The four invocations use *separate* Firestore Emulator processes and projects:

| Pair | Client | Rules | Project |
| --- | --- | --- | --- |
| A | old | old | `demo-basair-compat-a` |
| B | old | new | `demo-basair-compat-b` |
| C | new | old | `demo-basair-compat-c` |
| D | new | new | `demo-basair-compat-d` |

The test fails unless `FIRESTORE_EMULATOR_HOST` is a `127.0.0.1` address and the project ID matches the selected `demo-` project. Browser requests are confined to the loopback static server, the loopback Emulator, and intercepted synthetic Firebase modules. Unexpected external requests are aborted and fail the suite; font requests are aborted. No production SDK credentials or records are loaded. The Firebase Auth provider is synthetic; the **real Firebase Firestore SDK** performs the old batches and new transactions against the loaded frozen rules. The real old/new Admin event handlers run in the browser. The CSP meta tag is removed only in this synthetic module-substitution harness; this suite does not verify live CSP, Google OAuth, production rules, or production Auth configuration.

To rerun in a trusted isolated checkout with Node 22, Java 21 and Chromium installed, start a loopback HTTP server on port 4179 and execute each pair as the workflow does. For example:

```bash
python3 -m http.server 4179 --bind 127.0.0.1
TEST_PAIR=A npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-basair-compat-a "node tests/admin-four-state.mjs"
```

Repeat for B, C and D with their matching `demo-` project IDs. The workflow runs all four and fails on any unexpected result. It also runs the previously established actual UI-to-Emulator test, which reports ten successful audited writes.

## Observed matrix

All `PASS` values below describe passing assertions, including explicit assertions for expected **denial**. They do not mean that the combination has no functional defect.

| Operation and context | A: old/old | B: old/new | C: new/old | D: new/new |
| --- | --- | --- | --- | --- |
| Active admin with email different from UID: request read | PASS | PASS | PASS | PASS |
| Same admin: request status + audit | PASS; `handledBy=email` | **DENIED as expected**; no request or audit mutation | PASS; `handledBy=UID` | PASS; `handledBy=UID` |
| Same admin: text save + audit | PASS | PASS | PASS | PASS |
| Save original text and delete override | **Defect reproduced:** override remains, audit commits | **Defect reproduced:** override remains, audit commits | PASS: override absent | PASS: override absent |
| Video create/update/delete + audit | PASS | PASS | PASS | PASS |
| Contact settings + audit | PASS | PASS | PASS | PASS |
| Active admin **without email**: status + audit | PASS | **DENIED**; no request or audit mutation | PASS | **DENIED**; no request or audit mutation |
| Same no-email admin: text save + audit | Not separately exercised | **DENIED**; content/audit unchanged | Not separately exercised | **DENIED**; content/audit unchanged |
| Guest, non-admin and inactive admin | Private reads and writes denied; UI admin view withheld | Same | Same | Same |
| Role revoked while actual handler waits to commit | Write and audit denied; old rendered dashboard remains | Same | Write and audit denied; new dashboard and request DOM cleared | Same |

For every successful operation the suite reads the committed document independently, checks exactly one new action-specific audit event, and checks the actor UID. For expected rejection it reads the request/content and audit collection independently and requires no mutation. The video, text and settings assertions use only synthetic fixtures. The pending-operation test holds the real SDK batch or transaction before commit, revokes the role in a separate privileged Emulator fixture context, resumes the operation and verifies rejection. Fixture seeding with disabled rules is restricted to the Emulator.

### Exact incompatibilities

1. **Old client + new rules, email present.** Old `updateRequestStatus()` uses `currentUser.email || currentUser.uid`; the new request rule requires `handledBy == request.auth.uid`. The actual old UI reports an error, and its batch commits neither the request status nor audit event. Old tabs must not be assumed to close when Pages changes.
2. **Candidate rules, email absent.** The audit predicate evaluates `request.auth.token.email is string` without first checking that the property exists. The Emulator reports `Property email is undefined` at audit creation. Both the old client and new client use the UID for `handledBy` when email is absent, but their audited request-status write is rejected atomically under candidate rules. A no-email text write is rejected atomically as well. This is a **functional regression in an active-admin identity the source contract otherwise permits**. No rule or application fix was made in this evidence task.
3. **Old text restore.** Both old-client pairs commit an audit event while the nested override remains because the old `set(...,{merge:true})` does not remove the deleted key. The new-client pairs replace the `texts` map in a transaction and preserve unrelated text, videos and settings.
4. **Old client after remote role revocation.** The server denies subsequent operations, but already rendered Admin content remains visible in the old tab. The new client clears its private DOM. This is a source-version behavior observed with synthetic data, not a claim about historical disclosure.

## Transition and recovery conditions

Pair C proves that the new client can use the frozen **old source rules** for the tested operations and denied contexts. It does not prove that production rules C equal those rules. Obtain the published rules through authorized read-only access and classify them first. If they are old source rules, a future client-first sequence is technically viable for the tested identities, but publishing the current candidate rules later would break no-email active administrators and old cached clients. The candidate rules therefore need separate isolated remediation and another full matrix run before any rule deployment.

Before any Pages/rules transition, account for open old tabs, cached bundles, in-flight operations, role changes and the rollback pair. A Pages replacement cannot terminate a loaded old script. An operational maintenance window or a temporary compatibility rule may be required. Any bridge must retain active-admin authorization, bind `handledBy` to the caller's UID or the **same token's** email only, preserve request-field restrictions and audit constraints, safely handle an absent token email, reject spoofed attribution, have explicit expiry/removal criteria, and be tested in both client versions. No bridge was implemented here. Restoring old Pages while strict new rules remain would restore the known request-status failure; recover compatible client/rules together under separate authorization.

Production rules C, provider configuration, authorized domains, role bootstrap and live login/write behavior remain **unverified**. This evidence is not a deployment, merge, rules publication or production sign-off.
