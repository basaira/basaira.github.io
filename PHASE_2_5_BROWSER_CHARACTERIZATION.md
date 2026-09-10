# BASAIR — PHASE 2.5 Browser Characterization

- Source: `1504baad33b2123056877c1e92f4e2d558c00d51` / tree `1d987040d0158387d0425d6e6ed00fe2a68ec617`
- Comparison: `6e46539a02db342838d7c113a45ff558192658e5` / tree `8c18f5050f4ffa33c2317823e540766a4b2bc9ff`
- Browser: **Google Chrome 152.0.7977.82**
- Automation: **puppeteer-core 24.16.0**; Node **v22.23.2**; OS **Ubuntu 24.04.5 LTS**.
- Coverage: **4/48** CSS-characterization states; 89 recorded failures.
- Token contract: **106 canonical**, aliases **A/B/C/D/E = 1/49/23/23/2**, corrected conflicts **40**, production CSS **55**, inline style blocks **1**.

## What the browser computed
All three surface families were detected from loaded compatibility markers: PUBLIC. Canonical authority was checked in every completed state. Critical ownership assertions: **8/20 passed**.

### Surface isolation
Admin isolation from Acquisition aliases: **PASS**. Acquisition `--muted` was checked against `#526860`; Admin `--muted` against `rgba(255,255,255,.62)`; Admin `--line` against `rgba(255,255,255,.12)`. The public `--basair-green-deep` → `#073B31` and `--basair-green-hover` → `#044637` chains were checked independently.

## 40 conflict tokens
- Contextual / MUST NOT be globally consolidated from current evidence (13): `--home-journey-section`, `--layout-gutter`, `--layout-section`, `--pathway-accent`, `--pathway-accent-ink`, `--pathway-summary-bg`, `--pathway-summary-ink`, `--pathway-summary-line`, `--pathway-summary-muted`, `--type-body`, `--type-display`, `--type-section`, `--type-subsection`.
- Appears safe for later consolidation review (3): `--course-btn-glow`, `--course-btn-press`, `--layout-section-compact`.
- Not observed in a rendered resting/state sample (24): `--acq-layout-gutter`, `--acq-layout-section`, `--acq-type-display`, `--acq-type-section`, `--admin-type-body`, `--admin-type-panel`, `--admin-type-support`, `--admin-type-title`, `--dossier-accent`, `--dossier-border`, `--fo-bg`, `--fo-border`, `--fo-border-strong`, `--fo-danger-bg`, `--fo-muted`, `--fo-shadow`, `--fo-success-bg`, `--fo-surface`, `--fo-surface-strong`, `--fo-text`, `--folio-opacity`, `--line`, `--mobile-drawer-hidden-x`, `--muted`; these are **not** safe to consolidate merely because unobserved.
- Breakpoint-changing tokens (7): `--home-journey-section`, `--layout-gutter`, `--layout-section`, `--type-body`, `--type-display`, `--type-section`, `--type-subsection`.
- State-changing tokens actively observed via hover/focus samples (0): none.

## Phase 0 → final Phase 2
Representative computed-style fingerprints were compared for every completed route/viewport pair. Unexplained category-5 differences: **0**. Identical computed results are classified as **EXACTLY EQUIVALENT**. Admin legacy ownership restoration is separately proven by the critical assertions and matches the Phase-0 historical values.

## Screenshots and runtime smoke
Captured 8 viewport screenshots (Phase 2 + matching Phase 0) into a temporary GitHub Actions artifact; each filename/logical state and SHA-256 is recorded in the JSON. Runtime smoke was executed with JavaScript enabled on all Phase-2 route/viewport states; network/console failures are preserved as evidence rather than silenced.

## Limitations
- Authenticated Admin interior was not browser-characterized because no safe authorized credentials were available; the unauthenticated Admin document, inline ownership, root tokens, and reachable styles were characterized.
- Screenshots are supporting evidence only; computed styles are authoritative. External font/Firebase/network noise is recorded separately and was not used as a CSS mismatch by itself.
- Coverage failures:
  - /en/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html mobile css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html tablet css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html desktop css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html wide css: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-kids/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/quran-adults/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /en/arabic/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/quran/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /ru/arabic/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/quran/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /uz/arabic/ wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html mobile runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html tablet runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html desktop runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  - /admin.html wide runtime/screenshot: ProtocolError: Protocol error (Page.navigate): Cannot navigate to invalid URL
  -   surface-detection: Detected PUBLIC

## Constraints for Phase 3 / CSS consolidation
- Preserve surface-scoped compatibility bridges and never globalize `--line` or `--muted`.
- Preserve the two distinct dark-green semantic chains; color similarity is not semantic equivalence.
- Do not globally consolidate any token marked contextual, breakpoint-changing, or state-changing by this evidence.
- Treat unobserved conflicts as unresolved, not dead or equivalent.
- Keep `track-buttons-v6.css` protected until a deliberate replacement has equivalent browser characterization.
- Authenticated Admin interior needs separate authorized characterization before consolidation that can affect it.
- Re-run the same 12×4 browser matrix after each destructive cascade/ownership migration.

PHASE 2.5 = NOT COMPLETE

INCOMPLETE BROWSER EVIDENCE — DO NOT CONSOLIDATE
