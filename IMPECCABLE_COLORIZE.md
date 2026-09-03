# Impeccable Colorize — Basair Academy

Date: 2026-08-26
Source: `basaira-admin-impeccable-layout-2026-08-26`
Command intent: `/impeccable colorize`

## Strategy

**Name:** Illuminated Emerald Manuscript

- Emotional temperature: warm, scholarly, calm.
- Dominant relationship: warm manuscript ivory versus deep evergreen.
- Contrast range: high where action or sustained operation requires it; quiet on reading surfaces.
- Color dosage: restrained. Saturated color owns deliberate roles rather than being scattered over every card.
- Brand commitments preserved: Quranic Green `#00563F`, Heritage Gold `#D4AF37`, Scholarly Navy `#0A1F44`, ivory-first public world, and the protected ivory/green/gold track CTAs.

The key shift is **not a new identity**. Navy remains a structural/text color, while the large dark atmospheric regions now belong to deep evergreen. This makes the public site and admin console feel closer to the Quranic green identity without making every surface green.

## System changes

### Public academy

New semantic color layer: `colorize-v1.css`.

- Hero remains ivory-first but its atmospheric fields now use green/gold rather than green/navy competition.
- Primary Hero CTA is green-only across its gradient; navy no longer appears inside the action gradient.
- Raw gold hero text was moved to accessible **Gold Ink `#8A6D14`** on light surfaces.
- Contact is now a deep evergreen conversion region.
- Video library and embedded video modal use the same evergreen dark world rather than generic navy/blue-black.
- Tracks use a very light green paper field to separate the academic stage without adding another card shell.
- Testimonials and FAQ receive restrained warm/green tinting for section rhythm.
- Footer closes the experience in the same evergreen family as contact/media.
- Navbar remains quiet ivory; primary navigation action stays green.

### Admin console

New semantic layer: `admin-colorize-v1.css`.

- Admin canvas moved from `#061327` navy to **Operational Evergreen Night `#071713`**.
- Admin elevated surface moved to **`#0B2620`**.
- Primary actions use a clearer evergreen ramp (`#159A76 → #0D7A5E`).
- Gold remains focus/status/accent rather than a large fill.
- Danger, success, warning, muted text, inputs, selection, active navigation, overview panels, and integrity states were remapped to the new operational palette.
- Active navigation receives a green edge cue in addition to background/border change, so selection is not color-only.

### Acquisition pages

New shared layer: `acquisition-colorize-v1.css`, loaded by all 10 acquisition pages.

- Hero backgrounds now match the main academy's ivory/green/gold world.
- Dark methodology/assessment regions use evergreen rather than navy.
- Cards and forms use warm paper rather than sterile white.
- Footer and floating notes use the same evergreen closing tone.
- Existing form success/error semantics were preserved.

## Color roles

| Role | Value | Usage |
|---|---|---|
| Quranic Green | `#00563F` | Primary action, branded selection, success family |
| Quranic Green Deep | `#044637` | Hover / pressed |
| Evergreen Deep | `#073B31` | Public dark brand regions |
| Operational Evergreen Night | `#071713` | Admin canvas |
| Operational Evergreen Surface | `#0B2620` | Admin elevated surface |
| Scholarly Navy | `#0A1F44` | Public heading/text structure, not large atmosphere |
| Manuscript Ivory | `#FDFCF3` | Public canvas |
| Warm Paper | `#FFFDF8` | Cards, navigation, forms |
| Green Paper | `#F1F7F3` | Alternate light section surface |
| Heritage Gold | `#D4AF37` | Focus, micro-border, status, academic ornament |
| Heritage Gold Ink | `#8A6D14` | Readable gold-family text on light surfaces |

## Contrast verification

Computed WCAG contrast samples:

- Body ink `#12382F` on manuscript ivory `#FDFCF3`: **12.49:1**.
- Scholarly navy `#0A1F44` on manuscript ivory `#FDFCF3`: **15.78:1**.
- White on Quranic Green `#00563F`: **8.74:1**.
- White on Evergreen Deep `#073B31`: **12.51:1**.
- Gold Ink `#8A6D14` on Warm Paper `#FFFDF8`: **4.83:1**.
- Admin text `#F6F7F1` on Admin Night `#071713`: **17.08:1**.
- Admin muted `#B5C6BF` on Admin Night `#071713`: **10.34:1**.
- Admin text `#F6F7F1` on Admin Surface `#0B2620`: **14.85:1**.
- Heritage Gold `#D4AF37` on Admin Night `#071713`: **8.75:1**.
- Dark ink `#17352D` on Heritage Gold `#D4AF37`: **6.31:1**.

These representative foreground/background pairs exceed WCAG AA for their intended text/control roles.

## Files changed / added

- Added `colorize-v1.css`.
- Added `admin-colorize-v1.css`.
- Added `acquisition-colorize-v1.css`.
- Updated `index.html` to load `colorize-v1.css` **before** protected `track-buttons-v6.css`.
- Updated `admin.html` to load `admin-colorize-v1.css` after layout.
- Updated all 10 acquisition HTML pages to load `acquisition-colorize-v1.css`.
- Updated `DESIGN.md` Colors guidance and admin color world.
- Updated `.impeccable/design.json` with the latest semantic palette and color strategy.

## Protected invariants

Colorize deliberately did **not** modify:

- Firebase rules or Firebase configuration.
- `app.js` / `admin.js` behavior.
- WhatsApp destination logic.
- CMS IDs or content registry.
- Language routing behavior.
- Protected `track-buttons-v6.css` definitions.

`track-buttons-v6.css` remains the final stylesheet on the main public page, preserving the existing UI regression contract.

## Verification

Completed successfully:

- `node --check app.js`
- `node --check admin.js`
- `node ui-regression-check.mjs`
- `node security-check.mjs`
- Parsed all CSS with `tinycss2`: **16 CSS files, 0 parse errors**.
- Verified all local stylesheet references exist.
- Verified all 10 acquisition pages load the new acquisition color layer.
- Verified `track-buttons-v6.css` remains last.

A direct headless Chromium screenshot attempt was not usable in this execution environment because Chromium did not complete rendering; a secondary WeasyPrint render also failed on existing modern layout CSS. No claim of pixel screenshot approval is made. The color pass is therefore verified through source-level design roles, contrast computation, CSS parsing, and the project's functional/security regression tests.

## Follow-up

After this color pass, the appropriate Impeccable handoff is a final `/impeccable polish` when the remaining audit items are ready to be corrected or when a browser-visual QA environment is available.
