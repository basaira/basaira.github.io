# BASAIR ADMIN — V1R7 supply-chain repair qualification

## Frozen source authority

V1R6 frozen HEAD: badbaa175eba86960559b2145e2b9cee3a20a7d5
V1R6 frozen TREE: 2b8c98b9e5ae35f009d69582f4a8ef16d2264f6f
V1R6 authoritative CI: 39059397517 (success)
Isolated V1R7 branch: basair/admin-source-map-security-v1

## Vulnerability and unmodified baseline

GHSA-68fv-2mgg-jv7q / CVE-2026-93749: event-loop blocking using malicious indexed source-map offsets.
Github advisory defines vulnerable source-map-js range >=1.0.0 and <1.2.2; patched version 1.2.2.
Baseline npm lockfile identifies one dev-only source-map-js@1.2.1 node_modules package and two inbound ranges:
- @tailwindcss/node@4.3.0 -> source-map-js ^1.2.1
- postcss@8.5.26 -> source-map-js ^1.2.1

This is a build/tooling dependency; browser presence is not established and must not be asserted.
Frozen baseline package.json overrides nanoid=3.3.18 and postcss=8.5.26.

## Exact proposed remedy

- Add exactly one package.json override: source-map-js=1.2.2.
- Replace only the three version/resolved/integrity fields of node_modules/source-map-js in package-lock.json.
- Keep the original npm integrity assertion and run npm ci on the final lockfile.
- Verify the declared patched tarball checksum against npm registry metadata during CI.
- No other dependency versions, application source, Firestore Rules, or deployment settings may change.

## CI evidence contract

The isolated workflow must:
1. Verify frozen SHA/TREE authorities and changed path whitelist.
2. Create a temporary BASE checkout using git archive and execute a **clean baseline npm ci**.
3. Record Node/npm versions, baseline lockfile identity, npm ls, full npm audit and npm audit --omit=dev in the base graph, separately from any temporary browser/test tooling.
4. Run fresh candidate npm ci; npm ls; npm audit full and omit=dev; ensure 1.2.2 exists exclusively, no 1.2.1 remains, and no new vulnerabilities or higher severities arise.
5. Compare the entire package-lock graph excluding the source-map-js entry to prove no other resolution changed.
6. Run all frozen V1R6 source/public/build/Admin regression gates including genuine transaction and atomic audit on a loopback-only demo project and compatibility A-F.
7. Record CI final head, tree and narrow changed paths.

Do not interpret successful npm audit exit status alone as closure; assert the actual resolved package, registry tarball integrity and no remaining advisory for source-map-js. Audit results after installation of temporary Playwright/Firebase testing packages are separate and are NOT base-project audit results.

No release approval follows this evidence. Outstanding gates include CSP, production Ruleset provenance, a separate client-only Pages release mechanism, old-tab transition safety and later separately authorized production checks.
