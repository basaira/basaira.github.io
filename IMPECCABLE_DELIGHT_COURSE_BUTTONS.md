# Impeccable Delight — Course Buttons

Applied to the 15 localized `track-detail-cta-v6` course buttons only.

## Delight thesis
A course CTA should feel discovered, intentional, and confirmed — not playful. The interaction uses a single gilded discovery sweep, pointer-local light, tactile press feedback, and a 155ms confirmation seal before opening WhatsApp.

## Preserved invariants
- All 15 localized WhatsApp hrefs are unchanged.
- `track-buttons-v6.css` remains the final stylesheet.
- No width, height, grid, or course-card layout changes were introduced by JavaScript.
- Reduced-motion users skip the discovery choreography and navigation delay.
- Modifier clicks are not intercepted.

## Files
- `course-buttons-delight-v1.js`
- `course-buttons-delight-check.mjs`
- delight CSS is appended to `track-buttons-v6.css`, which already owns this protected component.
