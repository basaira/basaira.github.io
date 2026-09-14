# BASAIR — PHASE 3B-0 CONSOLIDATION PREFLIGHT

**Status: COMPLETE — audit/guardrails only. CSS merge not started.**

## Production authority

The clean closure branch was created from the exact Phase-2 production authority:

- commit: `1504baad33b2123056877c1e92f4e2d558c00d51`
- tree: `1d987040d0158387d0425d6e6ed00fe2a68ec617`

The reusable checker is reused unchanged from checker-only commit:

- commit: `a90f490724d0a42773a16061ef06d7263a99e857`
- path: `scripts/verify-css-consolidation-preflight.mjs`
- blob: `3dfc0605151abd9a9e6514a492a9b94137c96c63`

The historical branch `basair/phase-3b-0-consolidation-preflight` remains evidence infrastructure only and is not part of this clean closure branch.

## Structural contract

Established production-tree evidence remains:

- production HTML entries: **12**
- production CSS files: **55**
- canonical tokens: **106**
- CSS `@import` cycles: **0**
- production runtime JS/CSSOM filename dependencies on the candidate pair: **0**
- duplicate production stylesheet links/imports: **0**
- undefined custom properties without fallback under the checker contract: **0**
- `track-buttons-v6.css` remains the terminal Public stylesheet owner
- Public / Acquisition / Admin compatibility bridges remain isolated
- `--line` and `--muted` remain contextual and surface-specific
- the green semantic chains remain distinct

Token authority remains:

- canonical: **106**
- aliases A/B/C/D/E: **1/49/23/23/2**
- corrected conflicts: **40**
- production CSS: **55**
- inline style blocks: **1**

Protected green semantics remain:

- `--basair-green-deep → --color-public-evergreen-surface → #073B31`
- `--basair-green-hover → --color-brand-green-deep → #044637`

## Historical browser evidence

Real-browser characterization remains separate external Phase 3B-0 evidence:

- GitHub Actions run: **34754810028**
- workflow: **Phase 3B-0 Browser Proof Artifact**
- result: **SUCCESS**
- browser: **Google Chrome 152.0.7977.82**
- `puppeteer-core`: **24.16.0**
- artifact: `phase-3b0-browser-proof`
- artifact SHA-256: `da05f7d845382d4e23ab8504f5aa5fd73301770c82b8ba2a993c565fbbb71cc1`

That run measured the exact Phase-2 production commit/tree with the same checker blob. It was **not** a clean-closure-branch execution.

Evidence result:

- **48/48** browser states completed
- coverage failures: **0**
- critical ownership assertions: **144/144 PASS**
- failed ownership assertions: **0**
- screenshots: **96**
- unexplained computed/geometry deltas: **0**
- canonical-token deltas: **0**
- alias deltas: **0**
- surface/authority deltas: **0**
- Category-5 remains **C — MEASUREMENT / HARNESS FALSE POSITIVE**

## Fresh clean-branch first-pass verification

To satisfy the missing command-execution gate without contaminating the clean closure branch, an isolated evidence branch was created:

`basair/phase-3b-0-final-verification-evidence`

First-pass GitHub Actions run:

- run ID: **34859764559**
- evidence workflow commit: `8d13d1ccf8a44b05a1c544e2b87b54aea06b7525`
- evidence branch workflow: `.github/workflows/phase-3b0-final-verification-evidence.yml`
- run result: **SUCCESS**

The workflow did **not** merely test its own workflow commit. It created a pristine detached worktree at the exact clean-branch target:

- tested clean commit: `14c4fcc96cc74ededf583bf724644da982025286`
- tested clean tree: `90946e55757c9d05d620b9625714110db6c71c74`
- checker blob: `3dfc0605151abd9a9e6514a492a9b94137c96c63`

Actual first-pass results:

- `node scripts/verify-css-consolidation-preflight.mjs` — **PASS**
- `npm ci` — **PASS**
- `npm run verify` — **PASS**
- `npm run build` — **PASS**
- `git diff --check` — **PASS**
- `git diff --exit-code` — **PASS**
- tracked working-tree drift — **NONE**
- `git status --porcelain` between the status markers — **EMPTY**
- final target SHA/tree re-check — **PASS**

The fresh checker summary was:

`CSS preflight PASS: entries=12; productionCss=55; canonical=106; cycles=0; candidateFilenameRefs=2`

The raw `candidateFilenameRefs=2` is a checker self-reference artifact: after the checker became a tracked `.mjs` file, its own literal candidate array contains the two candidate stylesheet names and is counted by its generic JS/MJS/TS filename scan. This does **not** represent a production runtime dependency. The production runtime JS/CSSOM dependency audit remains **0**.

This first-pass execution is distinct from historical browser Run `34754810028`.

## Final-HEAD verification requirement

This report update creates a new clean-branch HEAD. Therefore Phase 3B-0 closure requires a mandatory second GitHub Actions pass from the isolated evidence branch against that exact new final HEAD/tree.

The second pass must verify the same checker blob and execute the same five commands successfully. Its exact final SHA/tree and run ID belong in the external audit closure response; this repository report is not edited again after the final pass.

## Future Phase 3B-1 candidate — not implemented

The proposed future candidate pair remains:

1. `acquisition-precision-native-v2.css`
2. `acquisition-polish-v2.css`

Required concatenation invariant: the complete contents of the first file followed immediately by the complete contents of the second file, with:

- no selector rewrite
- no declaration dedupe
- no media-query movement
- no specificity change
- no custom-property consolidation

The future structural matrix is **10 Acquisition routes × 4 viewports = 40 states**, plus applicable hover, active, focus-visible, `aria-busy`, reduced-motion, fine-pointer, coarse-pointer / `hover:none`, `<=520px`, and `>520px` characterization.

**PHASE 3B-1 HAS NOT STARTED.**

## Unresolved future items

These remain open:

- authenticated Admin characterization
- `--layout-section-compact` semantic ownership
- broader form runtime-state characterization
- hero consolidation characterization
- tracked-but-production-unreachable hero-v3 treatment

## Net-diff contract

The authoritative comparison is Phase-2 commit `1504baad33b2123056877c1e92f4e2d558c00d51` to the clean branch final HEAD.

The only permitted changed paths are:

- `PHASE-3B-0-CONSOLIDATION-PREFLIGHT.md`
- `phase-3b-0-consolidation-preflight.json`
- `scripts/verify-css-consolidation-preflight.mjs`

No workflow, CSS, HTML, production JavaScript, Firebase, token, package, screenshot, generated `dist`, or other production-source change is permitted.

PHASE 3B-0 = COMPLETE
READY FOR PHASE 3B-1 CANDIDATE
CSS MERGE NOT STARTED
