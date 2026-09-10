# BASAIR — PHASE 2.5 Browser Characterization

- Source: `1504baad33b2123056877c1e92f4e2d558c00d51` / tree `1d987040d0158387d0425d6e6ed00fe2a68ec617`
- Historical comparison: `6e46539a02db342838d7c113a45ff558192658e5` / tree `8c18f5050f4ffa33c2317823e540766a4b2bc9ff`
- Browser engine/version: **Google Chrome 152.0.7977.82**
- Automation: **puppeteer-core 24.16.0**; Node **v22.23.2**; OS **Ubuntu 24.04.5 LTS**.
- Coverage: **48/48** authoritative CSS states; runtime smoke/screenshots attempted for the same 48 states; failures: **0**.
- Contract revalidated: **106 canonical**, aliases **A/B/C/D/E = 1/49/23/23/2**, **40** corrected conflict tokens, **55** production CSS files, **1** inline style block.

## 1. What the browser actually computed
Detected surfaces from loaded token/bridge markers: **PUBLIC, ACQUISITION, ADMIN**. Built stylesheet graphs, root canonical values, all legacy alias values, and representative style/geometry fingerprints are recorded per route/viewport in the JSON.

## 2. Surface isolation and critical ownership
Critical ownership assertions passed: **144/144**. Admin remained isolated from Acquisition aliases: **YES**. Acquisition `--muted` was checked against `#526860`; Admin `--muted` against `rgba(255,255,255,.62)`; Admin `--line` against `rgba(255,255,255,.12)`. Public dark-green chains remained distinct: `--basair-green-deep` → `#073B31`, while `--basair-green-hover` → `#044637`.

## 3. Exact 40-token browser characterization
Contextual / MUST NOT be globally consolidated (23): `--acq-layout-gutter`, `--acq-layout-section`, `--acq-type-display`, `--acq-type-section`, `--admin-type-body`, `--admin-type-panel`, `--admin-type-support`, `--admin-type-title`, `--home-journey-section`, `--layout-gutter`, `--layout-section`, `--line`, `--muted`, `--pathway-accent`, `--pathway-accent-ink`, `--pathway-summary-bg`, `--pathway-summary-ink`, `--pathway-summary-line`, `--pathway-summary-muted`, `--type-body`, `--type-display`, `--type-section`, `--type-subsection`.
Appears safe for later consolidation **review**, not automatic deletion (4): `--course-btn-glow`, `--course-btn-press`, `--layout-section-compact`, `--mobile-drawer-hidden-x`.
Unobserved (13): `--dossier-accent`, `--dossier-border`, `--fo-bg`, `--fo-border`, `--fo-border-strong`, `--fo-danger-bg`, `--fo-muted`, `--fo-shadow`, `--fo-success-bg`, `--fo-surface`, `--fo-surface-strong`, `--fo-text`, `--folio-opacity`. Unobserved means unresolved, not equivalent/dead.
Breakpoint-changing (15): `--acq-layout-gutter`, `--acq-layout-section`, `--acq-type-display`, `--acq-type-section`, `--admin-type-body`, `--admin-type-panel`, `--admin-type-support`, `--admin-type-title`, `--home-journey-section`, `--layout-gutter`, `--layout-section`, `--type-body`, `--type-display`, `--type-section`, `--type-subsection`.
State-changing via real hover/focus observation (0): none.

## 4. Phase 0 vs final Phase 2
Representative browser-computed style/geometry fingerprints were compared for all completed route/viewport pairs. **Unexplained category-5 deltas: 1.** Per-category details are in `baselineComparison` in the JSON. Legacy custom-property effective values are compared separately from canonical-token naming.

## 5. Runtime smoke and screenshots
Runtime smoke used JavaScript normally. 96 matching Phase-2/Phase-0 screenshots were captured as temporary CI artifacts; each logical filename and SHA-256 is recorded in JSON. Screenshots were not committed.

## 6. Limitations
- Authenticated Admin interior was not browser-characterized because no safe authorized credentials were available. The unauthenticated Admin document, inline token ownership, root tokens, cascade, and reachable controls were characterized.
- Screenshot evidence is supporting only; computed styles are primary. External font/Firebase/network failures are recorded separately and are not automatically treated as CSS regressions.

## 7. Constraints for Phase 3 / CSS consolidation
- Never globalize `--line` or `--muted`; preserve their surface contracts.
- Preserve `--basair-green-deep` and `--basair-green-hover` as distinct semantic chains.
- Do not globally consolidate any conflict marked contextual, breakpoint-changing, or state-changing.
- Treat unobserved conflicts as unresolved, not dead/equivalent.
- Preserve `track-buttons-v6.css` until a deliberate replacement has equivalent real-browser characterization.
- Do not consolidate authenticated Admin interior-affecting ownership without separate authorized browser evidence.
- Re-run this 12×4 real-browser matrix after destructive ownership/cascade migrations.

PHASE 2.5 = HOLD
UNEXPLAINED COMPUTED-STYLE DELTA — DO NOT CONSOLIDATE
