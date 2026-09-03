> **Superseded by Precision Native Overdrive (1 + 3).** This file records the earlier Scholar’s Manuscript experiment. The current shipping contract is documented in `IMPECCABLE_OVERDRIVE_PRECISION_NATIVE.md` and `DESIGN.md`; folio separators and scroll-cinematic depth described below are no longer active.

# Impeccable Overdrive — Scholar’s Manuscript

Date: 2026-08-26

## Chosen direction

**Scholar’s Manuscript** was selected over the more cinematic/WebGL direction and the mostly invisible-performance direction. The goal is a stronger first impression and unusually coherent state transitions while preserving Basair Academy’s scholarly, Quranic, calm visual character.

## Implemented

### 1. Living manuscript hero
- Added `overdrive-v1.css` and `overdrive-v1.js` as isolated progressive-enhancement layers.
- Added a restrained manuscript frame and pointer-responsive illumination to the hero.
- Pointer tracking is `requestAnimationFrame`-throttled, applies only to fine-pointer/hover devices, changes decorative CSS variables only, and resets on pointer exit.
- Hero copy never tilts, follows the pointer, or becomes harder to read.
- Where scroll timelines are supported, only the decorative manuscript layer gains a small depth shift as the user leaves the hero.

### 2. Gilded reading progress
- Added a 2px reading edge beneath the persistent navbar.
- Uses CSS `scroll()` timeline when supported.
- JavaScript updates the same progress value as a fallback, using one rAF-throttled listener.
- Transform origin respects document direction.

### 3. Folio section continuity
- Major sections after the hero receive a single lightweight folio marker.
- In supporting browsers the marker opens with `view()` timeline as the section enters.
- IntersectionObserver adds a restrained current-section emphasis for browsers without view-driven animation.
- No content is hidden while waiting for JavaScript.

### 4. Language View Transition
- Refactored language state application so route changes preserve unrelated body state classes instead of replacing the full class list.
- When `document.startViewTransition` is available and motion is permitted, the hero title and language control transition as named elements.
- Baseline `setLang` behavior remains unchanged when the API is missing or reduced motion is enabled.

### 5. Video shared-element morph
- Dynamic video cards pass their actual media surface to the existing video player.
- Supporting browsers morph that media surface into the modal stage on open and reverse the relationship on close.
- Existing YouTube/direct-media behavior is unchanged.
- No new video hosting, storage, Firebase, or CMS behavior was introduced.
- Modal keyboard handling now also loops Tab/Shift+Tab through the relevant video controls and restores focus on close.

## Progressive enhancement and performance

No WebGL, particles, audio, third-party animation dependency, or new asset was added. Advanced motion is feature-tested and reduced-motion aware. Pointer work is limited to the hero and throttled with rAF. Scroll work changes transforms/custom properties only. Folio observation uses a single IntersectionObserver.

## Browser verification

Browser automation was performed with Playwright + the installed Chromium binary. The container blocks direct browser navigation to localhost/file URLs, so visual verification used a deterministic browser harness that inlined the project’s local HTML/CSS. This verified the authored Overdrive layer at desktop, mobile, and a scrolled section without external network dependencies.

Chromium capability checks executed successfully:
- `document.startViewTransition`: supported and an actual same-document transition completed.
- `animation-timeline: scroll()`: supported.
- `animation-timeline: view()`: supported.
- `color-mix()`: supported.

The harness confirmed:
- Overdrive runtime initialized.
- Manuscript layer present.
- Reading progress present and updates on scroll.
- Seven folio markers initialized.
- No JavaScript page errors in the isolated visual harness.

Because `index.css` contains Tailwind’s Vite-time `@import "tailwindcss"`, the inlined harness does not represent every Tailwind utility exactly. A true Vite render was attempted, but `npm ci` could not complete within the environment timeout, so no claim of a production Vite screenshot/build is made.

## Regression verification

Passed after Overdrive implementation:
- `node --check app.js`
- `node --check overdrive-v1.js`
- `node ui-regression-check.mjs`
- `node security-check.mjs`
- 2,285 CMS registry IDs remain unique.
- All 15 localized academic-track WhatsApp CTAs remain intact.
- `track-buttons-v6.css` remains the final public stylesheet.
- No local stylesheet reference is missing.
- CSS brace-integrity scan reports no mismatch.

## Files changed/added

- `app.js` — progressive View Transitions for language/video plus modal focus containment; preserved body-state classes during language changes.
- `index.html` — loads the isolated Overdrive CSS/JS while preserving the protected CTA stylesheet as last.
- `overdrive-v1.css` — manuscript, folio, scroll, and View Transition presentation.
- `overdrive-v1.js` — pointer illumination, reading progress fallback, and folio initialization.
- `DESIGN.md` — Overdrive design contract.
- `.impeccable/design.json` — machine-readable Overdrive decisions.
- `IMPECCABLE_OVERDRIVE.md` — this report.
