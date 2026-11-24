# BASAIR Admin — isolated V1R13 Vite security repair

Frozen source: 8e540f90bf1e63098374d7d34e4142ed8298f797 (TREE e614720f959465e607c1668ee32396cd02bf437c). MAIN 2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243; gh-pages cef59ba05b3382978b4c18e83592f08227b2f9c4.

Original CI 39499224681 failed npm audit for vite@6.4.3, GHSA-698v-4r3x-3vcv, CWE-78: Windows launch-editor escapeCmdArgs omits percent escaping under malicious filenames, environment variables or NTFS alternate data streams. Audit severity was Moderate at original run and High on later isolated probe, both identifying the same advisory. Patch floor Vite 6.4.4 per GitHub advisory. Development-tooling risk, not proof of production Hosting exploit.

CI probe 39502636017 rebuilt with npm 10.9.2 and Node 22.16.0. It confirmed 0 audit vulnerabilities after only updating vite from 6.4.3 to 6.4.4. The resolved npm tarball integrity is pinned in package-lock. New lock SHA-256: 62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a; original SHA-256: 1a4b3f5403ceb7e516ee1c13d0a79be1ba4276784a792c17064cf7fdf424cc76. Reversing root vite version + vite package version/tarball/integrity reproduced exactly the original lockfile digest.

All five original Admin outputs are byte-identical: count 5, total 484821 bytes; their names and SHA-256 remain exactly as in immutable V1R10-R1. No app logic or Firebase client configuration changes. Update only lockfile digest checks to the attested new digest, keeping all output fingerprint gates.

Preserve the manual preview workflow's actions: read, required reviewer gate, WIF requirements and deployment isolation. V1R13 does NOT solve workflow_dispatch default branch registration, WIF/IAM authorization, GitHub Environment gate or permit ANY deployment.

V1R13 final CI must pass dependency audit, full npm verify, exact Admin asset closure, static preview site guards and local Chromium security tests. No Firebase writes, no production/student data use, no main or gh-pages merges or deploys.
