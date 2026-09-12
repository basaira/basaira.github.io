# BASAIR — PHASE 3A CSS CONSOLIDATION PLAN / OWNERSHIP GRAPH

**Mode:** planning only. No production CSS/HTML/JavaScript/Firebase/routes/tokens/package files were modified.

## Authority and closure

- Production source base: `1504baad33b2123056877c1e92f4e2d558c00d51`
- Production tree: `1d987040d0158387d0425d6e6ed00fe2a68ec617`
- Phase 2.5/2.5A are evidence only. Historical Category-5 is closed as **C — MEASUREMENT / HARNESS FALSE POSITIVE**.
- Phase 2 remains closed; **zero proven Phase-2 production regressions require CSS correction**.

## Exact current metrics

| Metric | Exact value |
|---|---:|
| Production HTML entries | 12 |
| Production CSS files | 55 |
| Tracked CSS files total | 58 |
| Production CSS bytes | 482,088 |
| Selector occurrences | 4,120 |
| Custom-property declarations | 458 |
| Duplicate selector/property/value clusters | 253 |
| Exact declaration-block clusters across files | 122 |
| Local exact duplicate declarations | 0 |

Duplicate-cluster counts are overlap metrics, not removable-declaration counts. Surface reachability: **32 Public-only, 8 Acquisition-only, 11 Admin-only, 2 Public+Acquisition, 2 all-surface**.

## Production entry graph / exact logical load order

- **admin.html** — ADMIN — 13 CSS: `admin-ui-fixes-v1.css` → `tokens.css` → `tokens-admin-compat.css` → `admin-v3.css` → `admin-typeset-v1.css` → `admin-layout-v1.css` → `admin-colorize-v1.css` → `admin-animate-v1.css` → `admin-delight-v1.css` → `admin-precision-native-v2.css` → `admin-polish-v2.css` → `admin-final-polish-v3.css` → `harden-v1.css`
- **en/arabic/index.html** — ACQUISITION — 12 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `acquisition-final-polish-v3.css`
- **en/index.html** — ACQUISITION — 10 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `acquisition-final-polish-v3.css`
- **en/quran-adults/index.html** — ACQUISITION — 12 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `acquisition-final-polish-v3.css`
- **en/quran-kids/index.html** — ACQUISITION — 12 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `acquisition-final-polish-v3.css`
- **index.html** — PUBLIC — 36 CSS: `index.css` → `tokens.css` → `tokens-public-compat.css` → `styles.css` → `guide-v2.css` → `premium-v3.css` → `premium-v4.css` → `typeset-v1.css` → `layout-v1.css` → `colorize-v1.css` → `animate-v1.css` → `delight-v1.css` → `overdrive-v1.css` → `visual-layout-hotfix-v2.css` → `precision-native-v2.css` → `harden-v1.css` → `basair-splash.css` → `polish-v2.css` → `topbar-overdrive-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `course-cards-overdrive-v1.css` → `final-polish-v3.css` → `hero-typeset-v2.css` → `hero-layout-v2.css` → `hero-overdrive-v2.css` → `hero-delight-v4.css` → `hero-animate-v4.css` → `hero-polish-v4.css` → `hero-cta-overdrive-v1.css` → `homepage-sections-v1.css` → `academic-pathways-v1.css` → `ui-stability-v1.css` → `public-ui-fixes-v1.css` → `quick-guide-impeccable-v8.css` → `track-buttons-v6.css`
- **ru/arabic/index.html** — ACQUISITION — 12 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `acquisition-final-polish-v3.css`
- **ru/index.html** — ACQUISITION — 10 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `acquisition-final-polish-v3.css`
- **ru/quran/index.html** — ACQUISITION — 12 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `acquisition-final-polish-v3.css`
- **uz/arabic/index.html** — ACQUISITION — 12 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `acquisition-final-polish-v3.css`
- **uz/index.html** — ACQUISITION — 10 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `acquisition-final-polish-v3.css`
- **uz/quran/index.html** — ACQUISITION — 12 CSS: `acquisition.css` → `tokens.css` → `tokens-acquisition-compat.css` → `acquisition-colorize-v1.css` → `acquisition-animate-v1.css` → `acquisition-delight-v1.css` → `acquisition-precision-native-v2.css` → `acquisition-polish-v2.css` → `harden-v1.css` → `form-overdrive-v1.css` → `form-polish-v2.css` → `acquisition-final-polish-v3.css`

Local `@import` edges:
- `acquisition.css` → `tokens.css`, `tokens-acquisition-compat.css`
- `admin-ui-fixes-v1.css` → `tokens.css`, `tokens-admin-compat.css`
- `index.css` → `tokens.css`, `tokens-public-compat.css`

## Exact 55-file production inventory

| # | Path | Surface(s) | Owners | Bytes | Selectors | CP d/c | Media | Selector-derived ownership | Multi | Order-sensitive |
|---:|---|---|---:|---:|---:|---:|---:|---|---|---|
| 1 | `academic-pathways-v1.css` | PUBLIC | 1 | 19,773 | 106 | 27/15 | 5 | COURSE_CARD | NO | YES |
| 2 | `acquisition-animate-v1.css` | ACQUISITION | 10 | 3,671 | 37 | 5/5 | 1 | TOKEN_AUTHORITY, FORM, ADMIN_PANEL | NO | YES |
| 3 | `acquisition-colorize-v1.css` | ACQUISITION | 10 | 3,895 | 67 | 0/7 | 1 | FORM, HERO, NAVIGATION, FAQ | NO | YES |
| 4 | `acquisition-delight-v1.css` | ACQUISITION | 10 | 2,225 | 18 | 0/0 | 2 | FORM | NO | YES |
| 5 | `acquisition-final-polish-v3.css` | ACQUISITION | 10 | 2,884 | 50 | 6/4 | 3 | TOKEN_AUTHORITY, FORM, HERO, NAVIGATION, ADMIN_PANEL, FAQ | NO | YES |
| 6 | `acquisition-polish-v2.css` | ACQUISITION | 10 | 2,677 | 22 | 4/2 | 2 | TOKEN_AUTHORITY, HERO, ADMIN_PANEL | NO | YES |
| 7 | `acquisition-precision-native-v2.css` | ACQUISITION | 10 | 807 | 7 | 1/1 | 1 | TOKEN_AUTHORITY, FORM | NO | YES |
| 8 | `acquisition.css` | ACQUISITION | 10 | 23,439 | 333 | 4/21 | 10 | TOKEN_AUTHORITY, FORM, HERO, NAVIGATION, ADMIN_PANEL, FAQ | NO | YES |
| 9 | `admin-animate-v1.css` | ADMIN | 1 | 1,797 | 28 | 4/4 | 2 | TOKEN_AUTHORITY, FORM, NAVIGATION | NO | YES |
| 10 | `admin-colorize-v1.css` | ADMIN | 1 | 4,953 | 60 | 1/2 | 1 | FORM, NAVIGATION, ADMIN_PANEL | NO | YES |
| 11 | `admin-delight-v1.css` | ADMIN | 1 | 2,159 | 16 | 0/0 | 2 | GENERAL_ADMIN | NO | YES |
| 12 | `admin-final-polish-v3.css` | ADMIN | 1 | 2,658 | 66 | 5/2 | 3 | TOKEN_AUTHORITY, FORM, NAVIGATION | NO | YES |
| 13 | `admin-layout-v1.css` | ADMIN | 1 | 3,757 | 47 | 0/4 | 4 | NAVIGATION | NO | YES |
| 14 | `admin-polish-v2.css` | ADMIN | 1 | 3,966 | 69 | 6/2 | 2 | TOKEN_AUTHORITY, FORM, NAVIGATION | NO | YES |
| 15 | `admin-precision-native-v2.css` | ADMIN | 1 | 2,047 | 30 | 3/2 | 1 | TOKEN_AUTHORITY, FORM, NAVIGATION | NO | YES |
| 16 | `admin-typeset-v1.css` | ADMIN | 1 | 2,965 | 52 | 4/5 | 1 | TOKEN_AUTHORITY, FORM, NAVIGATION | NO | YES |
| 17 | `admin-ui-fixes-v1.css` | ADMIN | 1 | 905 | 5 | 0/0 | 0 | NAVIGATION | NO | YES |
| 18 | `admin-v3.css` | ADMIN | 1 | 13,924 | 152 | 1/5 | 6 | FORM, NAVIGATION | NO | YES |
| 19 | `animate-v1.css` | PUBLIC | 1 | 7,431 | 68 | 3/6 | 2 | HERO, NAVIGATION, VIDEO, WELCOME | NO | YES |
| 20 | `basair-splash.css` | PUBLIC | 1 | 6,035 | 31 | 0/0 | 3 | WELCOME | NO | YES |
| 21 | `colorize-v1.css` | PUBLIC | 1 | 8,877 | 71 | 2/7 | 1 | FORM, HERO, NAVIGATION, VIDEO, FAQ | NO | YES |
| 22 | `course-cards-overdrive-v1.css` | PUBLIC | 1 | 6,399 | 45 | 3/3 | 3 | TOKEN_AUTHORITY, COURSE_CARD | NO | YES |
| 23 | `delight-v1.css` | PUBLIC | 1 | 3,590 | 22 | 0/0 | 3 | GENERAL_PUBLIC | NO | YES |
| 24 | `final-polish-v3.css` | PUBLIC | 1 | 8,042 | 93 | 11/5 | 3 | TOKEN_AUTHORITY, FORM, HERO, NAVIGATION, COURSE_CARD, VIDEO, FAQ | NO | YES |
| 25 | `form-overdrive-v1.css` | ACQUISITION, PUBLIC | 8 | 13,735 | 108 | 28/15 | 2 | TOKEN_AUTHORITY, FORM | YES | YES |
| 26 | `form-polish-v2.css` | ACQUISITION, PUBLIC | 8 | 11,924 | 95 | 1/4 | 3 | FORM | YES | YES |
| 27 | `guide-v2.css` | PUBLIC | 1 | 10,495 | 79 | 7/3 | 3 | GENERAL_PUBLIC | NO | YES |
| 28 | `harden-v1.css` | ACQUISITION, ADMIN, PUBLIC | 12 | 2,257 | 21 | 0/0 | 3 | FORM, HERO, NAVIGATION, COURSE_CARD, VIDEO | YES | YES |
| 29 | `hero-animate-v4.css` | PUBLIC | 1 | 6,484 | 83 | 7/1 | 2 | TOKEN_AUTHORITY, HERO | NO | YES |
| 30 | `hero-cta-overdrive-v1.css` | PUBLIC | 1 | 8,067 | 50 | 6/3 | 3 | HERO | NO | YES |
| 31 | `hero-delight-v4.css` | PUBLIC | 1 | 2,959 | 30 | 3/0 | 1 | HERO | NO | YES |
| 32 | `hero-layout-v2.css` | PUBLIC | 1 | 3,070 | 29 | 0/0 | 3 | HERO | NO | YES |
| 33 | `hero-overdrive-v2.css` | PUBLIC | 1 | 8,203 | 49 | 7/8 | 3 | HERO | NO | YES |
| 34 | `hero-polish-v4.css` | PUBLIC | 1 | 5,698 | 56 | 1/0 | 5 | HERO | NO | YES |
| 35 | `hero-typeset-v2.css` | PUBLIC | 1 | 3,575 | 27 | 0/0 | 2 | HERO | NO | YES |
| 36 | `homepage-sections-v1.css` | PUBLIC | 1 | 10,246 | 100 | 12/8 | 3 | TOKEN_AUTHORITY, VIDEO, TESTIMONIAL, FAQ | NO | YES |
| 37 | `index.css` | PUBLIC | 1 | 345 | 0 | 6/5 | 0 | GENERAL_PUBLIC | NO | YES |
| 38 | `layout-v1.css` | PUBLIC | 1 | 6,460 | 76 | 3/7 | 4 | TOKEN_AUTHORITY, HERO, VIDEO, TESTIMONIAL, FAQ | NO | YES |
| 39 | `overdrive-v1.css` | PUBLIC | 1 | 8,523 | 55 | 12/7 | 3 | TOKEN_AUTHORITY, HERO, VIDEO | NO | YES |
| 40 | `polish-v2.css` | PUBLIC | 1 | 10,373 | 80 | 12/4 | 3 | TOKEN_AUTHORITY, VIDEO, FAQ | NO | YES |
| 41 | `precision-native-v2.css` | PUBLIC | 1 | 4,401 | 53 | 5/5 | 2 | TOKEN_AUTHORITY, FORM, VIDEO | NO | YES |
| 42 | `premium-v3.css` | PUBLIC | 1 | 15,797 | 159 | 7/7 | 5 | TOKEN_AUTHORITY, HERO, VIDEO | NO | YES |
| 43 | `premium-v4.css` | PUBLIC | 1 | 13,903 | 109 | 11/5 | 3 | TOKEN_AUTHORITY | NO | YES |
| 44 | `public-ui-fixes-v1.css` | PUBLIC | 1 | 24,143 | 195 | 9/2 | 11 | FORM, HERO, NAVIGATION, COURSE_CARD | NO | YES |
| 45 | `quick-guide-impeccable-v8.css` | PUBLIC | 1 | 11,370 | 76 | 0/0 | 4 | GENERAL_PUBLIC | NO | YES |
| 46 | `styles.css` | PUBLIC | 1 | 112,413 | 788 | 10/3 | 39 | HERO, NAVIGATION, VIDEO, WELCOME, FAQ | NO | YES |
| 47 | `tokens-acquisition-compat.css` | ACQUISITION | 10 | 1,372 | 1 | 25/25 | 0 | TOKEN_AUTHORITY | NO | YES |
| 48 | `tokens-admin-compat.css` | ADMIN | 1 | 1,263 | 1 | 23/23 | 0 | TOKEN_AUTHORITY | NO | YES |
| 49 | `tokens-public-compat.css` | PUBLIC | 1 | 2,487 | 1 | 49/48 | 0 | TOKEN_AUTHORITY | NO | YES |
| 50 | `tokens.css` | ACQUISITION, ADMIN, PUBLIC | 12 | 5,534 | 1 | 107/1 | 0 | TOKEN_AUTHORITY | YES | YES |
| 51 | `topbar-overdrive-v1.css` | PUBLIC | 1 | 11,660 | 68 | 3/3 | 5 | NAVIGATION | NO | YES |
| 52 | `track-buttons-v6.css` | PUBLIC | 1 | 10,277 | 57 | 7/4 | 5 | COURSE_CARD | NO | YES |
| 53 | `typeset-v1.css` | PUBLIC | 1 | 6,146 | 68 | 4/11 | 1 | TOKEN_AUTHORITY, HERO, VIDEO | NO | YES |
| 54 | `ui-stability-v1.css` | PUBLIC | 1 | 3,746 | 36 | 0/0 | 5 | HERO, NAVIGATION, COURSE_CARD, WELCOME | NO | YES |
| 55 | `visual-layout-hotfix-v2.css` | PUBLIC | 1 | 6,286 | 74 | 3/1 | 2 | TOKEN_AUTHORITY, HERO | NO | YES |

The JSON companion records every importer/import, exact entry-owner list, full declared/consumed custom-property lists, exact media-query conditions and selector anchors. Ownership was derived from actual reachability/selectors, not filenames.

Tracked but non-production-reachable: `hero-animate-v3.css`, `hero-delight-v3.css`, `hero-polish-v3.css`; this is not a deletion finding.

## Binding Phase-2.5A token contracts

Partition remains **23 contextual / 4 review / 13 unobserved**; 15 breakpoint-changing; 0 state-changing in the 48-state sample.

### Contextual — MUST NOT GLOBALIZE

- `--acq-layout-gutter` — owners `acquisition.css`, `tokens-acquisition-compat.css`; consumers `acquisition.css`.
- `--acq-layout-section` — owners `acquisition.css`, `tokens-acquisition-compat.css`; consumers `acquisition.css`.
- `--acq-type-display` — owners `acquisition.css`, `tokens-acquisition-compat.css`; consumers `acquisition.css`.
- `--acq-type-section` — owners `acquisition.css`, `tokens-acquisition-compat.css`; consumers `acquisition.css`.
- `--admin-type-body` — owners `admin-typeset-v1.css`, `tokens-admin-compat.css`; consumers no CSS var() consumer.
- `--admin-type-panel` — owners `admin-typeset-v1.css`, `tokens-admin-compat.css`; consumers `admin-typeset-v1.css`.
- `--admin-type-support` — owners `admin-typeset-v1.css`, `tokens-admin-compat.css`; consumers `admin-typeset-v1.css`.
- `--admin-type-title` — owners `admin-typeset-v1.css`, `tokens-admin-compat.css`; consumers `admin-typeset-v1.css`.
- `--home-journey-section` — owners `homepage-sections-v1.css`; consumers `homepage-sections-v1.css`.
- `--layout-gutter` — owners `layout-v1.css`, `tokens-public-compat.css`; consumers `layout-v1.css`.
- `--layout-section` — owners `layout-v1.css`, `tokens-public-compat.css`, `visual-layout-hotfix-v2.css`; consumers `layout-v1.css`, `visual-layout-hotfix-v2.css`.
- `--line` — owners `tokens-acquisition-compat.css`; consumers `acquisition-colorize-v1.css`, `acquisition.css`; Admin inline rgba(255,255,255,.12).
- `--muted` — owners `tokens-acquisition-compat.css`; consumers `acquisition.css`, `admin-v3.css`; Admin inline rgba(255,255,255,.62).
- `--pathway-accent` — owners `academic-pathways-v1.css`; consumers `academic-pathways-v1.css`.
- `--pathway-accent-ink` — owners `academic-pathways-v1.css`; consumers `academic-pathways-v1.css`.
- `--pathway-summary-bg` — owners `academic-pathways-v1.css`; consumers `academic-pathways-v1.css`.
- `--pathway-summary-ink` — owners `academic-pathways-v1.css`, `public-ui-fixes-v1.css`; consumers `academic-pathways-v1.css`.
- `--pathway-summary-line` — owners `academic-pathways-v1.css`, `public-ui-fixes-v1.css`; consumers `academic-pathways-v1.css`.
- `--pathway-summary-muted` — owners `academic-pathways-v1.css`, `public-ui-fixes-v1.css`; consumers `academic-pathways-v1.css`.
- `--type-body` — owners `tokens-public-compat.css`, `typeset-v1.css`; consumers `typeset-v1.css`.
- `--type-display` — owners `tokens-public-compat.css`, `typeset-v1.css`; consumers `typeset-v1.css`.
- `--type-section` — owners `tokens-public-compat.css`, `typeset-v1.css`; consumers `typeset-v1.css`.
- `--type-subsection` — owners `tokens-public-compat.css`, `typeset-v1.css`; consumers `typeset-v1.css`.

Preserve `--line`/`--muted` surface semantics and keep `--basair-green-deep → --color-public-evergreen-surface → #073B31` distinct from `--basair-green-hover → --color-brand-green-deep → #044637`.

### Four review candidates

- **`--course-btn-glow` — KEEP CURRENT OWNER — NOT APPROVED FOR CONSOLIDATION**. Owners: track-buttons-v6.css; consumers: track-buttons-v6.css. State/media: base 0; course-btn-delight-hovered -> 1; @media (hover:none) hovered -> .45. No fallback at consumption; base declaration is required. Dynamic component-local interaction intensity.
- **`--course-btn-press` — KEEP CURRENT OWNER — NOT APPROVED FOR CONSOLIDATION**. Owners: track-buttons-v6.css; consumers: track-buttons-v6.css. State/media: base 0; course-btn-delight-pressed -> 1. No fallback at consumption; base declaration is required. Transient tactile press state.
- **`--layout-section-compact` — CHARACTERIZE / SEMANTIC DECISION REQUIRED — NOT APPROVED**. Owners: tokens-public-compat.css, visual-layout-hotfix-v2.css; consumers: none. State/media: late visual-layout-hotfix-v2.css root override is unconditional. Without the late override the public alias resolves to --space-layout-section-compact. Hotfix value clamp(3.25rem,4.7vw,4.65rem) differs from canonical clamp(3.75rem,6vw,5.75rem); no current var() consumer, but owner removal changes the computed custom-property contract.
- **`--mobile-drawer-hidden-x` — KEEP DIRECTIONAL OWNER — NOT APPROVED**. Owners: styles.css; consumers: styles.css. State/media: .mobile-drawer -> -100%; html[dir="rtl"] .mobile-drawer -> 100%. No fallback at consumption. Direction-sensitive hidden offset.

### Thirteen unobserved tokens

| Token | Static classification | Reason |
|---|---|---|
| `--dossier-accent` | **KEEP — ACTIVE/CONDITIONAL** | Current #tracks dossier-card selectors declare and consume the token with pathway/state/pseudo-element behavior. |
| `--dossier-border` | **KEEP — ACTIVE/CONDITIONAL** | Current #tracks dossier-card selectors declare and consume the token with pathway/state/pseudo-element behavior. |
| `--fo-bg` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-border` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-border-strong` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-danger-bg` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-muted` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-shadow` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-success-bg` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-surface` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-surface-strong` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--fo-text` | **KEEP — ACTIVE/CONDITIONAL** | Scoped enrollment/assessment form values are directly consumed by form-overdrive/form-polish; form and validation/submission paths are conditional. |
| `--folio-opacity` | **CHARACTERIZE BEFORE DECISION** | CSS consumer exists, but initFolioMarkers() is intentionally dormant in initOverdrive() and no static marker is present; stronger whole-source/runtime proof is required before deletion. |

No unobserved token is classified `PROVABLY DEAD`: 12 are source-proven active/conditional; `--folio-opacity` requires characterization because its creator path is dormant but retained.

## Protected owners

Protected: `tokens.css`, all three compat bridges, `track-buttons-v6.css`, `admin-ui-fixes-v1.css`, `harden-v1.css`, all contextual-token owners, Admin inline-compatible semantics, and cascade-position-critical late sheets. No wholesale compat-bridge deletion.

## Stylesheet consolidation candidates

### SHEET-ACQ-PRECISION-POLISH — LOW-CONDITIONAL — NOT IMPLEMENTATION-APPROVED IN 3A

- **A Source:** `acquisition-precision-native-v2.css`, `acquisition-polish-v2.css`
- **B Target:** acquisition-polish-v2.css; precision rules first
- **C Reason:** Acquisition-only, adjacent and co-loaded in the same order on all 10 Acquisition entries.
- **D Selectors:** 29
- **E Cascade:** Can be order-neutral only under verbatim concatenation between acquisition-delight-v1.css and harden-v1.css.
- **F Specificity:** No change if verbatim.
- **G Media:** 3 @media blocks total; preserve order.
- **H Custom properties:** 5 declarations; no globalization.
- **I Surfaces:** ACQUISITION
- **J Browser evidence:** Phase2.5 gives current 10×4 Acquisition baseline, but the transformed merge itself has not been browser-compared.
- **K Risk:** **LOW-CONDITIONAL**
- **L Checks:** filename/CSSOM consumer scan; npm ci/verify/build/diff-check; 10 Acquisition routes × 4 viewports; focus/hover/reduced-motion/view-transition checks

### SHEET-ACQ-INTERACTION — MEDIUM — CHARACTERIZE INTERACTION STATES FIRST

- **A Source:** `acquisition-animate-v1.css`, `acquisition-delight-v1.css`
- **B Target:** acquisition-animate-v1.css; append delight rules
- **C Reason:** Acquisition-only adjacent interaction layers.
- **D Selectors:** 55
- **E Cascade:** Potentially preservable by exact concatenation between colorize and precision-native.
- **F Specificity:** No intended change.
- **G Media:** 3 @media blocks plus keyframes/states.
- **H Custom properties:** 5 motion declarations.
- **I Surfaces:** ACQUISITION
- **J Browser evidence:** Route/viewport baseline exists; interactive discovery/form states are not exhaustive.
- **K Risk:** **MEDIUM**
- **L Checks:** all Acquisition routes/viewports; hover/focus/active; status/recovery; RTL; reduced motion

### SHEET-FORM-COMPONENT — MEDIUM — STATE CHARACTERIZATION REQUIRED

- **A Source:** `form-overdrive-v1.css`, `form-polish-v2.css`
- **B Target:** form-overdrive-v1.css; append polish rules
- **C Reason:** Adjacent and always co-loaded wherever either appears; coherent shared Public+Acquisition form component.
- **D Selectors:** 203
- **E Cascade:** Potentially preservable by exact concatenation; surrounding sheets differ by surface.
- **F Specificity:** No intended change; many state/important rules increase sensitivity.
- **G Media:** 5 @media blocks.
- **H Custom properties:** 29 declarations, including the 10 unobserved --fo-* family.
- **I Surfaces:** PUBLIC, ACQUISITION
- **J Browser evidence:** Full validation/submission/focus state graph was not characterized.
- **K Risk:** **MEDIUM**
- **L Checks:** Public assessment/enrollment; Acquisition forms; valid/invalid/submitting/success/error/focus; 4 viewports; reduced motion

### SHEET-ADMIN-PRECISION-POLISH — HIGH — BLOCKED — AUTHENTICATED ADMIN CHARACTERIZATION REQUIRED

- **A Source:** `admin-precision-native-v2.css`, `admin-polish-v2.css`
- **B Target:** admin-polish-v2.css; precision rules first
- **C Reason:** Admin-only and adjacent.
- **D Selectors:** 99
- **E Cascade:** Potentially order-neutral under verbatim concatenation.
- **F Specificity:** No intended change.
- **G Media:** 3 @media blocks.
- **H Custom properties:** 9 declarations; Admin semantics remain isolated.
- **I Surfaces:** ADMIN
- **J Browser evidence:** Authenticated Admin interior was not characterized in Phase2.5.
- **K Risk:** **HIGH**
- **L Checks:** authorized authenticated Admin matrix; tabs/forms/statuses; RTL; responsive; reduced motion; inline --line/--muted provenance

### SHEET-PUBLIC-HERO-CLUSTER — HIGH — DEFER / PAIRWISE ONLY

- **A Source:** `hero-typeset-v2.css`, `hero-layout-v2.css`, `hero-overdrive-v2.css`, `hero-delight-v4.css`, `hero-animate-v4.css`, `hero-polish-v4.css`, `hero-cta-overdrive-v1.css`
- **B Target:** future hero component owner; exact name deferred
- **C Reason:** Seven contiguous Public-only sheets own one hero component but separate type/layout/runtime/polish responsibilities.
- **D Selectors:** 324
- **E Cascade:** High sensitivity; preserve seven internal boundaries relative to final-polish and homepage-sections.
- **F Specificity:** No intended change; layered state/important selectors raise risk.
- **G Media:** 19 @media blocks plus keyframes.
- **H Custom properties:** 24 declarations and JS-driven variables.
- **I Surfaces:** PUBLIC
- **J Browser evidence:** Public baseline exists; transformed interactive equivalence not proven.
- **K Risk:** **HIGH**
- **L Checks:** 4 viewports; all locales/RTL; entrance lifecycle; CTA pointer/focus/active; reduced motion; computed provenance

### SHEET-PREMIUM-V3-V4 — HIGH — DEFER

- **A Source:** `premium-v3.css`, `premium-v4.css`
- **B Target:** premium-v4.css with v3 content first if proven
- **C Reason:** Adjacent Public historical layers with broad overlap.
- **D Selectors:** 268
- **E Cascade:** Potentially preservable by concatenation but feeds many later override layers.
- **F Specificity:** No intended change; broad scope raises hidden dependency risk.
- **G Media:** 8 @media blocks.
- **H Custom properties:** 18 historical local declarations.
- **I Surfaces:** PUBLIC
- **J Browser evidence:** Current browser baseline does not isolate independent necessity.
- **K Risk:** **HIGH**
- **L Checks:** full Public page all sections/locales/viewports; cascade provenance; screenshots; all checks

The strongest structural candidate is the adjacent Acquisition precision→polish pair, but Phase 3A still does **not** approve implementation because transformed browser equivalence has not yet been run.

## Rejected opportunities

- **REJECTED — Globalize --line or --muted**: Phase2.5A proves distinct Acquisition/Admin values and semantics.
- **REJECTED — Collapse tokens.css + compatibility bridges**: Would undo Phase2 surface isolation and risk Admin inline ownership.
- **REJECTED — Fold track-buttons-v6.css into another Public sheet**: Protected final sheet with JS-driven states and required cascade position.
- **REJECTED — Merge acquisition-polish-v2.css directly with acquisition-final-polish-v3.css**: harden-v1.css and, on form entries, form sheets intervene; naive merge changes cascade.
- **REJECTED — Merge admin-ui-fixes-v1.css into admin-v3.css/tokens.css**: It is the Admin token/compat gateway after inline style; boundary is semantic.
- **REJECTED — Delete the 13 unobserved tokens**: 12 have direct active/conditional consumers; folio path requires characterization.
- **OUT OF SCOPE — Treat three unreferenced hero-v3 sheets as production-55 consolidation**: They are not reachable from production HTML; repository cleanup is separate.

## Migration DAG

- **3B-0 — Consolidation preflight contract** — depends on none. Scope: Snapshot stylesheet URL/CSSOM consumers, exact load order, Phase2 token contract/build/browser baseline. Rollback: one preflight commit. Gate: Reproduce Phase2.5 baseline and 144 ownership assertions.
- **3B-1 — Acquisition adjacent precision/polish exact-order merge** — depends on 3B-0. Scope: Only the adjacent Acquisition pair and link/check references; no selector rewrite. Rollback: one surgical commit. Gate: 10 routes ×4 viewports + interaction capability; zero computed/geometry deltas.
- **3B-2C — Form-state characterization** — depends on 3B-0. Scope: Characterize enrollment/assessment + --fo-* states. Rollback: audit-only. Gate: valid/invalid/focus/submitting/success/error across owning surfaces/viewports.
- **3B-2 — Shared form sheet merge** — depends on 3B-2C. Scope: Exact-order form pair merge only if 3B-2C passes. Rollback: one component commit. Gate: zero delta across characterized form matrix.
- **3B-3C — Authenticated Admin characterization** — depends on 3B-0. Scope: Authorized interior audit; no auth weakening. Rollback: audit-only. Gate: all Admin panels/forms/tabs; inline --line/--muted preserved.
- **3B-3 — Admin adjacent precision/polish merge** — depends on 3B-3C. Scope: Exact-order pair only if authenticated evidence exists. Rollback: one Admin commit. Gate: zero Admin state/geometry/computed deltas.
- **3B-4 — Review-candidate token disposition** — depends on 3B-0. Scope: Keep glow/press/mobile drawer; separately resolve layout-section-compact authority. Rollback: isolated token decision. Gate: LTR/RTL drawer + pointer/focus/touch/reduced-motion; compact token needs dedicated characterization.
- **3B-5C — Hero ownership characterization** — depends on 3B-1. Scope: Winning-declaration + runtime-state graph for seven hero sheets. Rollback: audit-only. Gate: all locales/RTL/viewports/entrance/CTA/reduced-motion.
- **3B-5 — Hero pairwise consolidation** — depends on 3B-5C. Scope: Only proven adjacent pairs, one merge per commit; no giant rewrite. Rollback: one pair per commit. Gate: full Public visual/computed comparison after every pair.

Edges: `3B-0 → 3B-1`; `3B-0 → 3B-2C → 3B-2`; `3B-0 → 3B-3C → 3B-3`; `3B-0 → 3B-4`; `3B-1 → 3B-5C → 3B-5`.

## Success metrics / conservative target

Current: **55 files; 482,088 CSS bytes; 4,120 selector occurrences; 458 custom-property declarations; 253 duplicate selector/property/value clusters**.

Phase 3A approves **zero production merges for immediate execution** because no transformed candidate has yet passed browser equivalence. Therefore after only currently approved LOW-risk work the projected target remains **55 files; 482,088 CSS bytes; 0 removable declarations**.

If future 3B verification proves the first conditional Acquisition pair, the first safe milestone becomes **54 files**, approximately **482,088 CSS bytes** under exact concatenation, with **0 declaration removals**.

## Unresolved questions

- Authenticated Admin interior is not browser-characterized; Admin consolidation remains blocked.
- --layout-section-compact has two owners with different values and no production var() consumer; semantic authority remains unresolved.
- Form validation/submission/runtime states and --fo-* must be characterized before a form-sheet merge.
- Before any stylesheet-path removal, scan runtime/test code for filename or document.styleSheets/CSSOM dependencies.
- Three tracked hero-v3 CSS files are outside production reachability; repository cleanup is separate.
- No token from the contextual 23 may be globalized to reduce declarations.

## Phase 3A gate

No production source is changed by this plan. Final net diff against Phase 2 must contain only this Markdown file and the JSON companion. Temporary CI harnesses are removed before closure.

