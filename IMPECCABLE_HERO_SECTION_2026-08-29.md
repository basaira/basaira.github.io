# Impeccable Hero Section — Overdrive + Layout + Typeset

Applied to the public homepage hero only, on top of the final-polish baseline.

## Overdrive
- Added a scholarly orbital visual object using the existing Basair logo.
- Pointer-local parallax and light are confined to decoration and the CTA surface.
- Reduced-motion users receive a fully static version.

## Layout
- Desktop hero becomes an asymmetric text/visual composition.
- Tablet/mobile collapse to a centered single-column reading path.
- The hero no longer depends on a single oversized centered column.

## Typeset
- Preserved Manrope and IBM Plex Sans Arabic.
- Reworked display scale, line height, measure, and language-specific tracking.
- Accent line gains stronger hierarchy without changing CMS copy.

## Protected invariants
- No Firebase/CMS logic changes.
- No changes to top bar, registration forms, course cards, or course-button behavior.
- `track-buttons-v6.css` remains the last stylesheet.

## Validation
- Security invariants: PASS
- UI regression invariants: PASS
- Harden check: PASS (12 HTML pages)
- Registration polish check: PASS (8/8 form pages)
- Course cards overdrive check: PASS
- Course buttons delight check: PASS (15/15 CTAs)
- Final polish check: PASS (12 HTML pages)
- Hero section check: PASS
- Local file references: 0 missing across 12 HTML pages
- Root CSS brace mismatches: 0

`npm run build` was not executed in the container because the packaged release intentionally does not include installed npm binaries. Run `npm ci && npm run verify` locally.
