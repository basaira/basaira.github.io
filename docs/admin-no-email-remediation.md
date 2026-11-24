# Optional-email audit rule remediation — isolated source evidence

The branch starts at the frozen four-state evidence commit `1f64411fb1e0ba9a7a261b7bf2b3982d46743b06` (tree `a2a492bb41bc607be71204849ea001ebe64d08e1`). Main, the original Admin candidate, the original evidence branch, and gh-pages are not targets of this work.

## Exact security change

The original candidate's audit predicate accesses `request.auth.token.email` even when the claim is absent. Firestore Rules raise `Property email is undefined`, rejecting the complete Admin operation and its audit write. The patched predicate requires `request.auth.token.get('email', '') is string` and equality between `data.actorEmail` and that value. Missing claims map to the empty string. Numeric, null, or other malformed claim values fail the type check. The active role, actor UID, audit schema and action allowlist, timestamp, target and details restrictions, immutability, and all other match permissions remain intact. The six-state suite compares the patched file to the immutable candidate blob after replacing precisely these two predicate lines.

## Immutable source combinations

| Pair | Actual client | Rules | Status with email differing from UID | Missing-token-email audit | Restoration |
| --- | --- | --- | --- | --- | --- |
| A | frozen main | frozen main | Allowed | Allowed | Historical nested-merge defect |
| B | frozen main | frozen candidate | Expected denial | Expected rule evaluation failure | Historical defect |
| C | frozen candidate | frozen main | Allowed | Allowed | Correct |
| D | frozen candidate | frozen candidate | Allowed | Expected rule evaluation failure | Correct |
| E | frozen main | patched checkout | Expected denial | Test for successful audit | Historical defect |
| F | frozen candidate | patched checkout | Allowed | Test for successful audit | Correct |

A–D use `git show` and verified blob identities; the patched E–F load the checkout's `firestore.rules`. Each has its own `demo-basair-compat-*` Firestore Emulator project, actual frozen Admin handler in Chromium, real Firestore SDK transactions, and synthetic Auth identity. The focused SDK rules suite uses `demo-basair-no-email-security`. All connections are restricted to loopback. Expected denials count as passes only if stored data and audit counts remain unchanged.

The new client's `actorEmail` comes from its `currentUser.email`. A synthetic mismatch in which that property is absent but the Auth token still has an email must be denied by this narrow security rule. Supporting that mismatch would require a separately scoped client correction or coherent Auth identity; an arbitrary empty `actorEmail` must never be accepted for a token with an email.

## Qualification and release boundary

The branch-specific CI runs `npm ci`, verification and build, token authority, policy tests, browser smoke, original Firestore tests, original UI write-path tests, focused security tests, and the A–F suite on one checkout. CI result and candidate identity must be recorded from the actual run; this document is source evidence, not a claim of live configuration or deployment. Production Firestore Rules, Auth providers, authorized domains, role state, API key restrictions, login, and live writes remain independent read-only and separately authorized gates. No production Firebase operation, merge, or Pages deployment occurs here. A safe rollout must resolve old-client email-versus-UID status incompatibility and stale browser tabs before patched rules are considered.
