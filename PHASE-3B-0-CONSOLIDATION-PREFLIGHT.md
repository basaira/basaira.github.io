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

The historical branch `basair/phase-3b-0-consolidation-preflight` is evidence infrastructure only and is not part of this clean closure branch.

## Structural contract

The executed structural checker established:

- production HTML entries: **12**
- production CSS files: **55**
- canonical tokens: **106**
- CSS `@import` cycles: **0**
- candidate-pair stylesheet filename references: **0**
- duplicate production stylesheet links/imports: **0**
- undefined custom properties without fallback under the checker contract: **0**
- `track-buttons-v6.css` remains the terminal Public stylesheet owner
- Public / Acquisition / Admin compatibility bridges remain isolated
- `--line` and `--muted` remain contextual and surface-specific
- the two green semantic chains remain distinct
- no JavaScript/CSSOM filename dependency was found for `acquisition-precision-native-v2.css` or `acquisition-polish-v2.css`

Token authority remains:

- canonical: **106**
- aliases A/B/C/D/E: **1/49/23/23/2**
- corrected conflicts: **40**
- production CSS: **55**
- inline style blocks: **1**

Protected green semantics remain:

- `--basair-green-deep → --color-public-evergreen-surface → #073B31`
- `--basair-green-hover → --color-brand-green-deep → #044637`

## Browser evidence

The authoritative real-browser evidence was generated during Phase 3B-0 on the historical evidence branch, not on this clean closure branch.

- GitHub Actions run: **34754810028**
- workflow: **Phase 3B-0 Browser Proof Artifact**
- result: **SUCCESS**
- browser: **Google Chrome 152.0.7977.82**
- `puppeteer-core`: **24.16.0**
- artifact: `phase-3b0-browser-proof`
- artifact SHA-256: `da05f7d845382d4e23ab8504f5aa5fd73301770c82b8ba2a993c565fbbb71cc1`

That run measured an exact detached Phase-2 worktree at commit `1504baad33b2123056877c1e92f4e2d558c00d51`, tree `1d987040d0158387d0425d6e6ed00fe2a68ec617`, using the same checker blob `3dfc0605151abd9a9e6514a492a9b94137c96c63`.

Evidence result:

- **48/48** browser states completed
- coverage failures: **0**
- critical ownership assertions: **144/144 PASS**
- failed ownership assertions: **0**
- screenshots: **96**

Comparison against the closed Phase-2.5 Phase-2 observations:

- unexplained computed/geometry deltas: **0**
- canonical-token deltas: **0**
- alias deltas: **0**
- surface/authority deltas: **0**

The historical Category-5 finding remains closed as:

**C — MEASUREMENT / HARNESS FALSE POSITIVE**

It is not reopened by Phase 3B-0.

## Future Phase 3B-1 candidate — not implemented

The proposed future candidate pair is:

1. `acquisition-precision-native-v2.css`
2. `acquisition-polish-v2.css`

Required concatenation invariant: the complete contents of the first file followed immediately by the complete contents of the second file, with:

- no selector rewrite
- no declaration dedupe
- no media-query movement
- no specificity change
- no custom-property consolidation

Acquisition routes to characterize:

- `/en/`
- `/en/quran-kids/`
- `/en/quran-adults/`
- `/en/arabic/`
- `/ru/`
- `/ru/quran/`
- `/ru/arabic/`
- `/uz/`
- `/uz/quran/`
- `/uz/arabic/`

The future structural matrix is **10 routes × 4 viewports = 40 states**, plus applicable interaction/capability states: hover, active, focus-visible, `aria-busy`, reduced-motion, fine pointer, coarse pointer / `hover:none`, `<=520px`, and `>520px`.

**PHASE 3B-1 HAS NOT STARTED.**

## Unresolved future items

These remain open and are not silently closed by this phase:

- authenticated Admin characterization
- `--layout-section-compact` semantic ownership
- broader form runtime-state characterization
- hero consolidation characterization
- independent treatment of tracked-but-production-unreachable hero-v3 files

None blocks Phase 3B-0 closure.

## Closure contract

The authoritative final comparison is always Phase-2 commit `1504baad33b2123056877c1e92f4e2d558c00d51` to the clean branch final HEAD.

The final net changed-file list must contain exactly:

- `PHASE-3B-0-CONSOLIDATION-PREFLIGHT.md`
- `phase-3b-0-consolidation-preflight.json`
- `scripts/verify-css-consolidation-preflight.mjs`

No workflow, CSS, HTML, production JavaScript, Firebase, token, package, screenshot, generated `dist`, or other production-source change is permitted.

PHASE 3B-0 = COMPLETE
READY FOR PHASE 3B-1 CANDIDATE
CSS MERGE NOT STARTED
