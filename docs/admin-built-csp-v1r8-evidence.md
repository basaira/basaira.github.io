# BASAIR ADMIN — V1R8 built CSP / client-only Pages preflight

## Authority and purpose

FROZEN V1R7 HEAD: 9cc2439970459bd8d4ed5c57b05dbf91cd1ea3ba
FROZEN V1R7 TREE: 02c16252787467e8b5a142bc212a10d96e603524
FROZEN V1R7 CI: 39066225920 (SUCCESS)
FROZEN gh-pages: cef59ba05b3382978b4c18e83592f08227b2f9c4
New evidence-only branch: basair/admin-csp-client-release-preflight-v1

No application JS, HTML, CSS, Firebase config, Rules, deployment scripts, or package dependency edits are authorized in V1R8.

## Real build and strict CSP

The browser test reads dist/admin.html, not source admin.html. It uses real headless Chromium with the emitted Content-Security-Policy meta tag unmodified. It serves the compiled dist directory on loopback and captures error console messages, SecurityPolicyViolationEvent metadata, load failures and HTTP responses of the real Firebase JS modules on gstatic.

A strict isolated network boundary denies all production Firebase Auth/Firestore API hosts and any unrelated external endpoints; gstatic/firebasejs modules and Google Fonts are allowed for read-only loading. No production credential or student data is supplied, and no production Firebase read or write may be attempted by the tester. Real authentication, popup sign-in and Firestore operations are NOT deemed verified by a gstatic SDK response alone.

Viewport checks: 390x844, 759x900, 761x900, 1440x1000. Check built DOM, RTL, responsive overflow, focus, initial authentication gating, counter distinctions, and actual rejection of an inline script. These are unauthenticated checks; they do NOT amount to a fully authenticated built-Admin counter UI verification.

## Clickjacking and host limits

The source meta CSP declares frame-ancestors 'none', but browsers ignore frame-ancestors when provided in a meta CSP. The browser test tries a cross-origin iframe from a second loopback port and records whether the built Admin is framed. The result proves only the enforcement of that emitted meta CSP under the local Python server, which has no server-side X-Frame-Options or response CSP. Separately inspect the currently published Pages Admin headers read-only; do not claim those old-version headers are necessarily the future release headers.

If the current/future Pages hosting cannot enforce a response header with frame-ancestors, document that the original meta declaration is not an effective anti-framing boundary and recommend separately authorized hosting mitigation. Do not patch this in the evidence branch.

## Client-only snapshot and operational boundaries

Build with frozen Node 22.16.0 / npm 10.9.2; npm ci, npm audit --json, npm run verify, npm run build, token check and git diff --check. Record source identity, lockfile SHA-256, SHA-256 of each dist file, absolute path inventory, all HTML entrypoints and linked assets. A local copy-of-dist clean-snapshot simulation proves no old Pages assets need to be retained and that the output includes no firestore.rules, firebase.json, CLI scripts or server-side functionality.

Important: package.json contains explicit deploy:firestore-rules and deploy-firestore-rules.bat contains Firebase CLI deploy --only firestore:rules. NEVER call either in a client-only release. An unrestricted firebase deploy remains a prohibited potential accidental path. A future approved Pages operation must publish only an immutable client dist snapshot, not a checkout or Firebase configuration.

## R0, old sessions, rollback

V1R7 did not modify Admin application source after V1R6. Historical Emulator pair C (NEW ADMIN + R0) tested an earlier frozen NEW client; not every current built-client route was re-qualified against R0. Operator-supplied production Rules text is not an independently observed deployed Rules Release ID/time. Treat production rules authority as an outstanding gate.

Old browser tabs, old JS assets cached by the browser, open transactions, and service workers (if any) can outlive a Pages update. A clean Pages replacement must account for old asset URLs and rollback to the previous gh-pages HEAD; a live Rules R2 transition must be authorized separately and prove old-client compatibility.

## Temporary toolchain vulnerabilities

Base-project V1R7 npm audit was zero; the test-only Playwright/Firebase toolchain previously displayed HIGH findings. Audit the isolated temporary tooling separately, report actual freshly observed severities and chains, and never combine them with release-build or deployed-browser audit. No dependency upgrades in V1R8.

## Conclusive scope

This task creates only evidence code, workflow and documentation; no GitHub Pages publication, Firestore production operation, branch promotion, production authentication or release manifest publication. A workflow success proves the diagnostic was executed; it does not change a recorded security finding into a PASS.
