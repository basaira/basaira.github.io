# Impeccable Overdrive — Precision Native (1 + 3)

Date: 2026-08-26

## Chosen direction

The user selected a combined **Precision Overdrive + Native Academy** pass after visual QA exposed that earlier cinematic layers could interfere with layout. The governing rule for this pass is therefore explicit: **Overdrive may enhance interaction, continuity, accessibility, and perceived responsiveness, but it may not own geometry.**

## Public Academy

- Kept the manuscript pointer-light effect and gold reading-progress edge.
- Retired the folio-marker runtime entirely: no hidden marker elements and no section IntersectionObserver are created.
- Disabled scroll-cinematic movement of the manuscript layer in the Precision Native layer.
- Reading progress uses native CSS `scroll()` timeline where supported; the rAF scroll listener now exists only as a fallback.
- Language View Transitions are interruptible. A rapid language change skips the stale transition instead of queueing another animation.
- Video-filter changes use a named View Transition on the grid where supported; fallback filtering uses short cancellable timers.
- Video open/close is operation-guarded so rapid commands cannot leave stale transition cleanup behind.
- While the video modal is open, non-modal body siblings become `inert`; their prior inert state is preserved and restored on close.
- Modal focus remains trapped and returns to the originating control after close.
- Removed a duplicate `tabindex` assignment from dynamic video cards.
- Main assessment submission now exposes `aria-busy` on the form and submit action and keeps explicit success/error native state.
- Added keyboard navigation for desktop/mobile language menus and Tab containment for the mobile navigation drawer.

## Acquisition routes

All ten EN/RU/UZ acquisition pages load `acquisition-precision-native-v2.css`.

- No positional hover motion on actions.
- Consistent focus-visible treatment.
- Assessment forms and submit controls expose `aria-busy` during network writes.
- No geometry properties are owned by the new interaction layer.

## Admin console

- Navigation is now a semantic `tablist` with `tab` / `tabpanel` relationships and `aria-selected` state.
- Arrow keys, Home, and End move and activate admin tabs.
- Supporting browsers transition the active admin panel with a short named View Transition; the root itself does not crossfade.
- Request status gives immediate optimistic feedback, disables the local select during the write, and rolls back on Firestore failure.
- Text/request search rendering is coalesced through `requestAnimationFrame` so rapid typing does not rebuild the DOM multiple times in one frame.
- Text, video, and contact-settings forms use the existing busy runner and expose form-level `aria-busy` while work is in flight.
- Decorative button shimmer and positional hover movement are removed from the operational surface.

## Geometry protection

The new interaction stylesheets were machine-checked for these forbidden declarations and contain none:

`width`, `height`, min/max sizes, `padding`, `margin`, `gap`, row/column gap, grid-template rows/columns, `font-size`, and `line-height`.

`track-buttons-v6.css` remains the final stylesheet on the root page.

## Browser automation

Direct navigation to `localhost` and `file://` is blocked by the container organization policy, so a Chrome DevTools Protocol harness was used with `Page.setDocumentContent`. The harness loaded the actual new Precision Native CSS and exercised the interaction primitives in installed Chromium 144.

Verified in-browser:
- `document.startViewTransition` is supported.
- A real same-document View Transition completed.
- Hovering the primary action did **not** change its x/y/width/height and computed `transform` remained `none`.
- Reduced-motion media-query support is available.
- The visual harness showed stable emerald/ivory action, video, form, admin-tab, pending-save, and status surfaces without positional movement.

## Regression verification

Passed:
- `node --check app.js`
- `node --check overdrive-v1.js`
- `node --check precision-native-v2.js`
- `node --check acquisition.js`
- `node --check admin.js`
- `node security-check.mjs`
- `node ui-regression-check.mjs`
- CSS brace integrity across all root stylesheets.
- Local HTML asset-reference scan.
- 2,285 unique CMS IDs remain intact.
- All 15 localized academic-track WhatsApp CTAs remain intact.
- Acquisition Precision Native coverage: 10/10 routes.

The container's `npm ci` again timed out before dependencies were available, so no container-side Vite build is claimed. The user's Windows environment has already demonstrated that `npm ci` succeeds with zero vulnerabilities; `npm run verify` remains the final production build check there.

## Files added/changed

- `precision-native-v2.css`
- `precision-native-v2.js`
- `admin-precision-native-v2.css`
- `acquisition-precision-native-v2.css`
- `app.js`
- `overdrive-v1.js`
- `acquisition.js`
- `admin.js`
- `index.html`
- `admin.html`
- ten acquisition `index.html` files
- `DESIGN.md`
- `.impeccable/design.json`
