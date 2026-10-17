# BASAIR ADMIN — V1R6 request-load generation safety

## Frozen baseline and reproduced defect

Repository: basaira/basaira.github.io.
Frozen parent: 2eaf840dbf85749b281a2723457208b690a1cb20.
Frozen tree: 855abfc1bcc6e083353c4ba0033092052390ffab.
Pre-patch admin.js blob: 1279a88491659adff54db41d1d4f3bfe60fdaa12.

An isolated JavaScript test compiled the UNCHANGED loadRequests() function from the exact frozen blob with deterministic controlled collection reads (no network or Firebase). Within the same Admin authentication revision:

1. Load A started.
2. Load B started.
3. B finished with 2 records; load state was complete.
4. A finished later with 1 record; load state became complete with count 1.

This is the independently reproduced stale-overwrite defect. No production data was used.

## Narrow correction

- Monotonic requestLoadGeneration is claimed by every loadRequests() invocation.
- Session revision and load generation are both checked after asynchronous collection reads and before applying any results, counts, failure state, or UI.
- Clearing private state invalidates in-flight request generations.
- Superseded loads return an explicit superseded result without stale success or failure notifications.
- Global load, request-only refresh, and post-transaction refresh honor supersession.
- Current active load failures still throw, while committed transactions with failed active reloads still show the truthful existing warning.
- An additional deterministic reproduction showed that an earlier implementation could suppress an unrelated failing global content read when its request load was superseded; the global caller now reports independent content/audit failures before suppressing only its obsolete completion toast.
- Existing 200-document Firestore pagination, first 100 rendered cards, status transaction, audit, and Rules are unchanged.

## Test and evidence boundaries

The standalone source-extraction tests use deterministic JavaScript promises to verify the completion/error race permutations, private session clear, role revocation, account switch, global/request-only overlap and complete failed load.

The existing actual Admin UI-to-Firestore Emulator test receives an isolated V1R6 race scenario with a genuine Firestore transaction and atomic audit. The SDK wrapper delays a completed post-commit assessment snapshot until a newer request-only refresh finishes. Tests inspect real stored status, audit count, UI totals, filters, and stale-toast suppression.

Injected completion delays are synthetic; status transactions and Firestore Rules are real in the Emulator. No production Firestore calls or student data.

No release approval follows: CSP, published Ruleset identity, source-map-js advisory, and the client-only release boundary remain separate gates. No merge or deployment in this task.
