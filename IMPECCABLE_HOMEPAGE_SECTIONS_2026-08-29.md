# Homepage Sections — Overdrive + Layout + Distill + Polish

## Direction
Scholarly Editorial Journey + Quiet Scholarly Minimalism (1+3).

## Structural change
The homepage journey after the hero is now:
1. Quick Guide
2. Faculty & Methodology
3. Academic Tracks
4. Video Library
5. Testimonials
6. FAQ
7. Initial Academic Assessment

The assessment section was moved from the middle of the page to the end so the primary Hero CTA remains a direct conversion path while normal scrolling reads as one coherent academic narrative.

## Overdrive
- Added a restrained seven-chapter folio system with universal numeric markers.
- Reframed the page as one editorial journey instead of unrelated component blocks.

## Layout
- Faculty becomes an editorial split with a sticky chapter heading on desktop.
- FAQ becomes a two-column reading pattern with a sticky heading on desktop.
- Section widths and vertical rhythm are normalized.
- Video Library reads as an academic media shelf.

## Distill
- No academic/CMS text was deleted.
- Removed redundant shadows, repeating decorative card effects, and competing folio markers.
- Simplified Quick Guide process blocks into a flatter ledger.
- Reduced decorative glows in Video Library.

## Polish
- Alternating paper/ivory/dark academic surfaces.
- Lower-noise borders, shadows, and section transitions.
- Mobile collapses split layouts cleanly.

## Preserved
- Hero CTA work and Hero v4.
- Registration form and Firebase behavior.
- Course Cards + Course Button Delight.
- All 1066 homepage CMS IDs are preserved exactly; the full registry remains 2285 unique IDs.
- Protected `track-buttons-v6.css` remains the final root stylesheet.

## Validation
- Security invariants passed.
- UI regression invariants passed.
- Hardening passed across 12 HTML pages.
- Registration polish passed 8/8 form pages.
- Course Cards and 15/15 Course Button CTAs passed.
- Hero v4 and Hero CTA checks passed.
- Homepage Sections check passed for all seven chapters.
- Homepage CMS IDs before/after: 1066 / 1066, identical set, no duplicates.
- Local HTML references: 0 missing.
- CSS brace scan: 0 mismatches.
- Vite build was not run in the working environment because the build tool is not installed there.
- Headless Chromium visual QA was attempted but the local Chromium process did not complete in this environment, so no browser screenshot success is claimed.
