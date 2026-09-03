# Impeccable Typeset — Basair Academy

**Date:** 2026-08-26  
**Scope:** public Academy homepage, multilingual acquisition pages, and admin console  
**Input:** `basaira-admin-impeccable-audited-2026-08-26.zip`  
**Command intent:** `/impeccable typeset`

## Typographic assessment

### Authority and fit

The established visual world already had the right core direction: **Manrope** for Latin/Cyrillic interface text and **IBM Plex Sans Arabic** for Arabic operational/public text. The problem was not the identity itself; it was inconsistent application. `styles.css`, `guide-v2.css`, and other layers still explicitly selected Tajawal in Arabic sections, while the later premium layer selected IBM Plex Sans Arabic. This caused two sans-serif Arabic voices to coexist in the same product.

Acquisition pages also downloaded Tajawal on all ten localized pages even though none of those pages is an Arabic UI route. Seven pages downloaded Noto Naskh Arabic although only three pages actually contain the `.arabic-word` teaching specimen.

### Hierarchy

The codebase contained many one-off sizes and custom weights. The public experience had strong display typography, but section, subsection, card-title, body, label, and metadata roles were not consistently expressed across all layered styles. The admin console also compressed a large amount of explanatory text into 0.67–0.80rem roles, which reduced scanability on a dark surface.

### Scale and consistency

Before this pass, authored declarations included **103 non-system weight requests** using values such as `650`, `730`, `750`, `760`, `780`, `850`, `900`, and `950`. Those values did not correspond cleanly to the statically loaded Google Font weights. The browser therefore had to approximate weight selection.

After this pass, authored `font-weight` declarations use only the loaded/system roles **400 / 500 / 600 / 700 / 800**. Arabic display roles are explicitly capped at **700**, matching IBM Plex Sans Arabic's loaded maximum.

### Reading

The new role system establishes:

- 68ch as the ordinary long-form reading measure;
- up to 72ch for academic prose;
- 1rem as the ordinary public body floor;
- 1.72–1.78 leading for Latin/Cyrillic reading text;
- approximately 1.86 leading for Arabic reading text;
- slightly more leading and weight compensation on the dark admin console.

### Localization stress

Arabic no longer inherits negative Latin tracking. Russian and Uzbek display headings receive gentler negative tracking than English/French. Mobile display scales are capped to avoid crushing long localized headings into narrow containers.

### Delivery

Font delivery was reduced without changing brand identity:

| Delivery check | Before | After |
|---|---:|---:|
| Acquisition pages downloading Tajawal | 10 / 10 | 0 / 10 |
| Acquisition pages downloading Noto Naskh Arabic | 7 / 10 | 3 / 10 |
| Acquisition pages actually using `.arabic-word` | 3 / 10 | 3 / 10 |
| Main homepage downloaded UI families | IBM Plex + Manrope + Tajawal | IBM Plex + Manrope |
| Non-system authored weight declarations | 103 | 0 |

Noto Naskh Arabic is now loaded only on the three acquisition pages that actually render the Arabic teaching specimen.

## System set

### Public Academy

- **Display:** Manrope 800 / IBM Plex Sans Arabic 700.
- **Section title:** Manrope 800 / IBM Plex Sans Arabic 700.
- **Subsection:** 700–800.
- **Card title:** 700.
- **Body:** 1rem–1.125rem, 68ch default measure.
- **Label / eyebrow:** ~0.78rem, 700, restrained tracking; zero tracking for Arabic.

Implemented in `typeset-v1.css`, loaded after the existing public visual layers but **before** `track-buttons-v6.css`. The track-button stylesheet remains last because the project's regression contract intentionally protects those multilingual CTAs.

### Acquisition pages

`acquisition.css` now contains a small purpose-led type system shared by English, Russian, and Uzbek acquisition routes. Metadata that was visually too small was raised, form labels are more stable, long-form copy has predictable leading, and Noto Naskh Arabic remains reserved for `.arabic-word`.

### Admin console

Implemented in `admin-typeset-v1.css`, loaded after `admin-v3.css`:

- Arabic-first operational family: IBM Plex Sans Arabic;
- larger support/hint text on dark surfaces;
- clearer console-title → panel-title → body → metadata hierarchy;
- tabular figures for counters/timestamps;
- no negative tracking for Arabic UI.

## Additional typography correction

The assessment form heading on the public page no longer depends on gradient-clipped text. Its hierarchy is carried by scale, weight, and a solid gold text color, matching the documented design rule.

## Verification

### Passed

- `node --check app.js`
- `node --check admin.js`
- `node ui-regression-check.mjs`
- `node security-check.mjs`
- CSS parser scan across every top-level CSS file: **0 parse errors**
- Track CTA stylesheet remains the final stylesheet with its required cache key.
- All 15 localized track CTAs retain their WhatsApp actions.
- All 2,285 CMS registry IDs remain unique.

### Build status

`npm run build` could not run because the supplied project did not include `node_modules` and `vite` was therefore unavailable. A subsequent `npm ci --ignore-scripts --no-audit --no-fund` attempt timed out in the execution environment. No build success is claimed.

## Files added

- `typeset-v1.css`
- `admin-typeset-v1.css`
- `IMPECCABLE_TYPESET.md`

## Existing files intentionally changed

- `index.html` — font delivery and Typeset stylesheet registration.
- `admin.html` — admin Typeset stylesheet registration and weight normalization.
- `index.css`, `styles.css`, `guide-v2.css`, `premium-v3.css`, `premium-v4.css`, `admin-v3.css` — canonical Arabic family / supported weight normalization.
- `acquisition.css` — acquisition typography role system.
- `en/**/index.html`, `ru/**/index.html`, `uz/**/index.html` — per-page font delivery reduction.
- `DESIGN.md` — authoritative typography roles documented.

## Handoff

The typography system is now intentional and bounded. The next Impeccable handoff for visual finishing is `/impeccable polish`; structural removal of legacy overridden CSS belongs to `/impeccable distill`, not this Typeset pass.
