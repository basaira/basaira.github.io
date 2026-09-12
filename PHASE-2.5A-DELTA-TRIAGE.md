# PHASE 2.5A — Delta Triage

Status: **COMPLETE — AUDIT ONLY**

This phase reconciles the single Category-5 computed-style delta reported by Phase 2.5 and normalizes the 40-token characterization directly from the committed raw browser evidence. It does **not** modify production HTML, CSS, JavaScript, Firebase, Firestore, routing, CMS, i18n, RTL behavior, or component geometry, and it does not begin CSS consolidation.

## Anchors

- Phase 2.5 starting audit commit: `02bc781aec31c0de199c92b88205cc02ad6dc603`
- Phase 2.5 starting tree: `81f2583430905b6f28876d4caf95b408d31d2bd8`
- Production Phase 2 commit under comparison: `1504baad33b2123056877c1e92f4e2d558c00d51`
- Production Phase 2 tree: `1d987040d0158387d0425d6e6ed00fe2a68ec617`
- Historical Phase 0 commit: `6e46539a02db342838d7c113a45ff558192658e5`
- Historical Phase 0 tree: `8c18f5050f4ffa33c2317823e540766a4b2bc9ff`
- Raw Phase 2.5 evidence: `phase-2.5-browser-characterization.json`
- Raw evidence blob SHA: `b79d09a7639183665ed23b33dbeca0e6937e3fab`

The raw historical JSON was not rewritten.

## 1. Raw-evidence reconciliation

The committed raw evidence contains:

- 48 completed CSS states.
- 48 baseline-comparison rows.
- 1,920 conflict-token observation rows = 48 states × 40 tokens.
- 96 screenshot records.
- 144 atomic critical-ownership assertion records.
- 144 passed, 0 failed.

Therefore the authoritative ownership count is **144/144**. The later prose figure **84/84** is not present in the committed JSON as an assertion count and cannot be reconstructed from it; it is treated as a later summary error, not as an audit result.

## 2. The single Category-5 row

The only representative-element computed-style delta counted by the Phase 2.5 verdict is:

- JSON path: `baselineComparison[11].categories.mainCardPanel`
- Route: `/en/quran-kids/`
- Viewport: `wide` = 1920×1080, DPR 1
- Surface: Acquisition
- Element: `div.dashboard.reveal @ section`
- Property: `color`
- Historical recorded Phase 0 value: `rgb(0, 0, 0)`
- Historical recorded Phase 2 value: `rgb(18, 56, 47)`
- Geometry delta: none

Twelve other historical leaves carry the same textual label for serialization-only alias differences such as color formatting/casing. They are not representative-element computed-style deltas and are not counted by the Phase 2.5 verdict, which is 1.

## 3. Isolated 5×5 reproduction

The suspect state was rerun in fresh browser contexts five times against the exact Phase 0 tree and five times against the exact Phase 2 tree, using the same essential characterization conditions:

- Chrome `152.0.7977.82`
- Puppeteer Core `24.16.0`
- Node `22.23.2`
- Ubuntu 24.04 runner
- JavaScript disabled
- `prefers-reduced-motion: reduce`
- light color scheme
- 1920×1080, DPR 1
- bounded `document.fonts.ready` wait + 180 ms deterministic delay
- explicit stylesheet-settlement check added for diagnosis only

Result in all ten observations, both before and after the explicit stylesheet-settlement check:

`rgb(18, 56, 47)`

Additional controls were stable in all observations:

- same selected element descriptor;
- same geometry: x `1036.796875`, y `344.0625`, width `515.203125`, height `435`;
- zero failed resources;
- all stylesheet links settled;
- document complete, `lang=en`, LTR;
- Manrope loaded successfully;
- stable text metrics;
- rerun screenshot SHA identical across both commits and all observations.

## 4. Cascade provenance

The selected panel has no direct winning `color` rule. Its color is inherited from the body.

Phase 0:

- winning inherited declaration: `body { color: var(--ink) }`
- source: `acquisition-colorize-v1.css`
- specificity: 0,0,1
- no `!important`
- effective `--ink`: `#12382f`

Phase 2:

- same winning inherited declaration: `body { color: var(--ink) }`
- source remains `acquisition-colorize-v1.css`
- specificity remains 0,0,1
- no `!important`
- compatibility chain: `--ink → --color-text-primary → #12382F`
- bridge: `tokens-acquisition-compat.css`
- canonical value: `tokens.css`

There is no inline declaration, pseudo-element color cause, media-query cause, geometry change, or resource failure explaining a real visual regression.

## 5. Category-5 final classification

**C — MEASUREMENT / HARNESS FALSE POSITIVE**

The historical Phase 0 fingerprint value of black is not reproducible. Five independent Phase 0 observations and five independent Phase 2 observations agree on the same computed color, with stable selector identity, geometry, typography, resources, and cascade semantics. The historical raw observation is preserved, but its derived unexplained-delta verdict is superseded by this reconciliation.

The exact transient mechanism that produced the historical black fingerprint cannot be reconstructed from that one raw row because Phase 2.5 did not record stylesheet-settlement state or matched-rule provenance at the anomalous instant. This report does not invent one.

## 6. Forty-token characterization

The 40-token inventory partitions cleanly, without overlap:

- **23 contextual — MUST NOT GLOBALIZE**
- **4 review candidates — NOT YET APPROVED FOR CONSOLIDATION**
- **13 unobserved — NO CONSOLIDATION EVIDENCE**
- total: **40**

Exactly 15 tokens change across sampled breakpoints. No token was observed changing by the sampled state dimension.

The four review candidates are:

- `--course-btn-glow`
- `--course-btn-press`
- `--layout-section-compact`
- `--mobile-drawer-hidden-x`

They each showed one stable sampled value and no sampled breakpoint/state change. That makes them review candidates only; it is **not** approval to consolidate or globalize them.

Important contextual examples include:

- `--line`: Acquisition = `rgba(18,56,47,.12)`, Admin = `rgba(255,255,255,.12)`.
- `--muted`: Acquisition = `#526860`, Admin = `rgba(255,255,255,.62)`.
- pathway tokens carry multiple intentional track-specific values.
- public/acquisition/admin typography and section/gutter tokens include viewport-dependent values.

The 13 unobserved tokens have no rendered-sample value in the 48-state matrix, so Phase 2.5 provides no evidence for consolidating them.

The complete token-by-token disposition is recorded in `phase-2.5a-delta-triage.json`.

## 7. Verification

The exact historical Phase 0 and production Phase 2 trees were checked out as detached worktrees. Phase 2 was revalidated with:

- `npm ci`
- full `npm run verify`
- `npm run build`
- `git diff --check`

The token contract passed with:

`106 canonical; aliases A/B/C/D/E=1/49/23/23/2; corrected conflicts=40; production CSS=55; inline styles=1.`

The isolated 5×5 reproduction workflow completed successfully. Temporary CI harness files were then deleted from the branch. The final net diff from the Phase 2.5 starting commit is audit documentation/data only.

## 8. Decision / STOP

Phase 2.5A finds **no reproducible production regression** corresponding to the historical Category-5 row. No fix to production CSS is justified by this evidence.

No consolidation, compatibility deletion, component-owner migration, visual redesign, or Phase 3 work is started here.

**STOP.**
