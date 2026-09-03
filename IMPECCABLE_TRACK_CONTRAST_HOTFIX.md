# Basair Academy — Track Card Contrast Hotfix

Date: 2026-08-26

## Problem
The Colorize layer replaced the academic track side-card background with a very light green gradient while the established track typography remained white. On real mobile rendering this produced critically poor contrast, especially on Track 03.

## Root cause
A late rule in `colorize-v1.css` overrode the deep-emerald track card surface:

`#tracks article > div:first-child { background: ...light green... !important; }`

The existing title and description rules correctly remained white because the component was originally designed for a dark surface.

## Repair
- Restored a deep emerald track-card surface for all three tracks.
- Explicitly pinned all localized titles to white.
- Explicitly pinned localized descriptions to translucent white.
- Rebalanced the numbered badge for the dark surface.
- Incremented the root-page Colorize cache key to `20260826-colorize2`.
- Left the isolated `track-buttons-v6.css` component untouched and last in the stylesheet order.

## Verification
- `node --check`: app/admin/acquisition/overdrive scripts passed.
- Security invariants passed.
- UI regression invariants passed.
- 2285 CMS IDs remain unique.
- All 15 localized track CTAs retain their WhatsApp actions.
- CSS brace validation passed.
- White text contrast across the emerald gradient ranges from approximately 6.57:1 to 12.54:1.

The production Vite build was not claimed in the sandbox because dependency installation timed out there. The user's Windows environment successfully completed `npm ci` with zero vulnerabilities, so `npm run verify` should be run there on this hotfix package.
