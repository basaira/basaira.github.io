# Impeccable — Hero Delight + Animate + Polish

Applied on top of the 2026-08-29 Hero Overdrive + Layout + Typeset release.

## Scope
- Homepage `#home` hero only.
- No CMS, Firebase, top bar, registration form, course card, or course button ownership changes.

## Delight
- Replaced perpetual kicker pulse/glint with one-time discovery moments.
- Added a subtle one-shot seal halo and node glints.
- Added a short CTA acknowledgement state before native same-page navigation continues.

## Animate
- Uses the existing `motion-prep` / `motion-entered` boot contract so the entrance begins after the splash releases.
- Kicker → headline lines → paragraph → CTA are staged with restrained timing.
- Academic visual stage, orbits, and nodes settle once rather than looping.
- `prefers-reduced-motion` has a static fallback.

## Polish
- Reduced background and visual-stage noise.
- Tightened text/CTA rhythm and softened shadows.
- Improved mobile optical balance and reduced the size of the decorative visual.
- Preserved `track-buttons-v6.css?v=20260826-delight1` as the final stylesheet.
