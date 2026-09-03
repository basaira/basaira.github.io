# Impeccable Animate — Basair Academy

**Date:** 2026-08-26  
**Input:** `basaira-admin-impeccable-colorize-2026-08-26`  
**Output:** `basaira-admin-impeccable-animate-2026-08-26`

## Motion thesis

Basair should not move like a generic SaaS landing page. The public Academy is a scholarly, illuminated environment, so the one authored focal sequence is an **illuminated manuscript reveal**: the hero lines uncover in sequence, the gold illumination expands once, and supporting copy/actions settle after the title. Acquisition pages express the product promise more literally: **measurable progress moves**, with progress bars and correction ledger items appearing as their dashboard becomes relevant. The admin remains an operate surface, so motion is fast state feedback only.

## Implemented changes

### 1. Public Academy focal entrance
- Added `animate-v1.css` before the protected `track-buttons-v6.css` layer.
- Added progressive `motion-prep` / `motion-entered` states in the inline boot contract so content remains visible if JavaScript fails.
- Hero title lines use a controlled clip reveal instead of a generic page-wide fade-up.
- The gold accent illumination expands once as part of the hero sequence.
- The old perpetual hero badge sheen was removed; it now sweeps once during entry.
- The hero pulse was changed from an infinite pulse to one bounded acknowledgement.

### 2. Splash behavior
- Reduced the splash from a long presentation gate to a short acknowledgement.
- Inline load fallback now releases shortly after page load, with an absolute fail-safe at 2.5 seconds.
- Splash exit no longer relies on blur, reducing visual cost.
- The splash logo no longer breathes indefinitely.

### 3. Navigation and overlays
- Navigation underline feedback now animates `transform: scaleX()` rather than width.
- Mobile drawer uses a 340ms spatial transition with confident deceleration.
- Language menus and popovers use the routine state timing.
- Video modal backdrop/dialog transitions communicate overlay depth without exaggerated travel.
- Video close interaction uses a short 45-degree acknowledgment instead of a full decorative spin.

### 4. Video filtering continuity
- Reworked video filter timers so rapid filter changes cancel stale exits.
- Visible cards return on the next animation frame; hidden cards exit in 180ms.
- Reduced-motion users get an immediate exit rather than spatial choreography.
- Video card opacity transitions now use explicit properties instead of broad transition behavior.

### 5. Testimonial loop lifecycle
- The testimonial carousel pauses automatically while its section is offscreen.
- It also pauses when the browser tab/document becomes hidden.
- Focus within the testimonial area pauses the loop, improving reading and keyboard interaction.

### 6. Acquisition motion
- Added `acquisition-animate-v1.css` to all 10 acquisition pages.
- `.reveal` content is visible by default; animation is enabled only when the runtime successfully opts in.
- Existing generic scroll reveals were reduced to a quiet 5px/opacity state transition.
- Dashboard progress fills animate from zero to their real inline values when the dashboard becomes visible.
- Correction/error ledger items arrive in a short bounded sequence.
- Form status and post-submit states acknowledge success/error without long choreography.
- Generic card hover lift was removed; cards respond through border/shadow instead.

### 7. Admin motion
- Added `admin-animate-v1.css`.
- Admin tabs use a 240ms content continuity transition.
- Status messages use a 180ms acknowledgement.
- Buttons/nav items use 120–180ms feedback.
- Active navigation receives a restrained gold edge marker.
- No admin page-load choreography was added.

## Motion tokens

| Role | Timing | Use |
|---|---:|---|
| Immediate feedback | 120–140ms | press, close, button acknowledgement |
| Routine state | 180–220ms | menu, filter, status, active state |
| Overlay/layout | 340–360ms | drawer, dialog, post-submit panel |
| Authored focal | 620–680ms | hero manuscript reveal, progress measurement |

Primary arrival easing: `cubic-bezier(.16,1,.3,1)`  
Routine state easing: `cubic-bezier(.2,.8,.2,1)`

## Accessibility and performance

- `prefers-reduced-motion` removes spatial hero movement, progress growth, admin panel movement, and nonessential loops while retaining legible state changes.
- Content is visible before animation opt-in; failed external module imports cannot leave `.reveal` content permanently hidden.
- No new JavaScript animation dependency was introduced.
- Motion is based primarily on `transform`, `opacity`, `clip-path`, and bounded state changes; layout-driving width animation in navigation was replaced.
- Nonessential continuous animation is paused offscreen/hidden.

## Verification performed

- `node --check app.js` — passed.
- `node --check acquisition.js` — passed.
- `node --check admin.js` — passed.
- `node ui-regression-check.mjs` — passed.
- `node security-check.mjs` — passed.
- 2285 CMS IDs remain unique.
- All 15 localized track CTAs retain their WhatsApp behavior.
- `track-buttons-v6.css` remains the last stylesheet on the public Academy page.
- 10/10 acquisition pages load `acquisition-animate-v1.css`.
- All stylesheet references resolve.
- CSS parser scan found no syntax errors in the project stylesheets.

## Visual-render verification note

A bounded Chromium headless render was attempted in this environment but did not complete reliably, so this pass does **not** claim screenshot/pixel-perfect approval. Verification is based on source inspection, parser checks, interaction invariants, security checks, and bounded motion logic. A local browser pass is still appropriate before production deployment.
