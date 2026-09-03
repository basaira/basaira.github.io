# Impeccable — Hero Delight + Animate + Polish v4

Second refinement pass on the hero only, built on Hero Overdrive + Layout + Typeset.

## Delight
- one-time kicker pulse after splash release
- one-time accent-gradient ink catch
- one-time seal halo and node glints
- short CTA acknowledgement on press; no navigation delay
- no looping decorative animation

## Animate
- tighter hierarchy-led entrance timing
- slight blur-to-sharp resolution with shorter travel distances
- visual stage resolves in sequence: grid/orbits → axis → seal → nodes
- reduced-motion fallback displays the complete static hero immediately

## Polish
- replaced the organic blob plate with a calmer scholarly folio/compass surface
- reduced ambient glow, grid noise, orbit opacity, shadows and visual competition
- reduced mobile visual footprint and tightened vertical rhythm
- preserved established typography, CMS text, CTA href and section structure

## Invariants
- hero scope only
- no Firebase, CMS, admin, forms, course-card or course-button ownership changes
- `track-buttons-v6.css` remains the final stylesheet

## Validation
- `node --check hero-delight-v4.js` — passed
- Security invariants — passed
- UI regression invariants — passed
- Harden check — passed (12 HTML pages)
- Registration polish — passed (8/8 form pages)
- Course cards — passed
- Course buttons delight — passed (15/15 CTAs)
- Final polish — passed (12 HTML pages)
- Hero section check — passed
- Hero Delight + Animate + Polish v4 check — passed
- Local browser screenshot QA could not be completed because the runtime blocks local/file navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`). No visual-browser success is claimed.
- Vite build was not run because npm packages are not installed in this runtime copy; run `npm ci && npm run verify` locally.
