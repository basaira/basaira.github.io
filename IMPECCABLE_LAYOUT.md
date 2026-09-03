# Impeccable Layout — Basair Academy

**Date:** 2026-08-26  
**Input:** `basaira-admin-impeccable-typeset-2026-08-26`  
**Scope:** Public multilingual homepage, acquisition surfaces, and admin console. No Firebase rules, CMS content, WhatsApp actions, or application logic were changed.

## Spatial thesis

Basair's public surface is a conversion-first scholarly experience. Its primary task path is:

**Hero → Concise Guide → Initial Assessment → Institutional context → Detailed Academic Tracks → Media/testimonial proof → FAQ**

The layout preserves this DOM/reading order rather than visually reordering content. The admin counterpart is an operational workspace: compact navigation plus a flexible editor column that receives the majority of horizontal space.

## Findings before the layout pass

1. **Section widths were not governed by one container system.** The homepage mixed Tailwind `max-w-*`, 1180/1280px custom widths, and per-section padding values.
2. **Vertical rhythm was uneven.** Major sections alternated between hard-coded `py-24`, `md:py-32`, premium overrides, and guide-specific padding.
3. **Academic tracks split too early.** The `lg:grid-cols-12` structure activated around 1024px while Russian, Uzbek, French, and Arabic headings still needed more horizontal room.
4. **The admin sidebar retained width too long.** At compact-laptop widths, the editing workspace could become unnecessarily narrow before the mobile navigation architecture took over.
5. **Acquisition pages had sound grids but a separate spacing model.** Their 1180px container and fixed 86px section rhythm did not align with the fluid system established on the main site.
6. **Existing CSS is highly layered.** Legacy and premium files use many `!important` declarations, so this pass uses small, isolated structural override files rather than rewriting visual identity or risking protected components.

## Layout changes

### Public homepage

- Added `layout-v1.css` as a dedicated structural layer immediately before the protected `track-buttons-v6.css`.
- Established layout tokens:
  - public wide container: `84rem`
  - public content container: `72rem`
  - reading measure: `68ch`
  - assessment form container: `64rem`
  - fluid gutter: `clamp(1rem, 3vw, 2rem)`
  - section rhythm: `clamp(4.75rem, 7.5vw, 7rem)`
- Converted hero spacing into one parent-controlled vertical stack rather than unrelated child margins.
- Normalized outer geometry for Guide, Assessment, About, Tracks, Video, Testimonials, and FAQ.
- Kept long academic prose constrained to a readable measure.
- Delayed the desktop sticky 4/8 academic-track composition until `1180px`; 1024–1179px uses a full-width track summary followed by full-width reading content.
- Forced assessment and track grids into one structural column at narrow mobile widths before localized copy can collide.

### Acquisition surfaces

All ten acquisition HTML surfaces continue to share `acquisition.css`, now with a final Impeccable Layout layer and a fresh cache key.

- Container: `74rem` maximum with fluid gutters.
- Section rhythm is fluid instead of fixed at one desktop value.
- Hero, solution, and assessment pairs stack by `1000px`.
- Repeated card/form grids become one column by `760px`.
- CTA/footer action areas become vertical on compact screens.

### Admin console

Added `admin-layout-v1.css` after the admin typography layer.

- Admin shell remains capped at `96rem`.
- Desktop geometry uses a bounded sidebar plus `minmax(0, 1fr)` workspace.
- Four-column stats reduce to two columns by `1180px`.
- At `900px`, the sidebar becomes a sticky horizontal navigation rail and the editor receives full width.
- At `680px`, major operational grids become one column.
- `overflow: clip` replaces the main-card scrolling-boundary behavior in the layout layer so the card can clip decoration without deliberately creating another scroll container.

## Protected invariants

The pass intentionally does **not** change:

- Firebase rules or Firestore data contracts.
- CMS IDs or localized copy.
- WhatsApp URLs/actions.
- Track CTA behavior or language activation.
- Public default language (English/LTR).
- Typography decisions from `/impeccable typeset`.

`track-buttons-v6.css?v=20260825-4` remains the final public stylesheet because the existing UI regression suite protects that ordering.

## Verification

Completed successfully after the layout changes:

- `node --check app.js`
- `node --check admin.js`
- `node ui-regression-check.mjs`
- `node security-check.mjs`
- CSS parsing for all 13 root CSS files: **0 parse errors**
- Local stylesheet reference scan across all HTML files: **0 missing stylesheets**
- Acquisition cache-key scan: all **10** acquisition pages reference the new layout revision.

The project source package does not include `node_modules`. A clean `npm ci` attempt exceeded the execution environment's timeout, so a Vite production build is **not claimed** in this pass. Partial installation output was removed; the deliverable contains no `node_modules`.

## Remaining layout-related debt

The existing project still has a large historical cascade with many `!important` declarations across older CSS layers. This layout pass isolates new geometry cleanly, but a future `/impeccable extract` or `/impeccable distill` pass should consolidate duplicated structural rules rather than continuing to add override layers.
