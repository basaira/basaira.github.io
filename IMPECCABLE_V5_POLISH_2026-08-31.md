# Impeccable v5 — Multilingual Typeset + Adaptive Topbar + Auth Error Polish

Applied against the v4 Basair release after visual QA in English, Russian and Uzbek.

## Root causes corrected

- The Faculty & Methodology heading lived in a `max-width: 10ch` sticky column while the hardening layer allowed aggressive wrapping. English, Russian and Uzbek therefore split inside words. v5 widens the scholarly split, disables mid-word breaking for the heading, and collapses to a single-column composition before the heading becomes cramped.
- Uzbek desktop navigation had been protected from collision by shrinking labels too far. v5 restores readable type at roomy desktop widths and switches to the already-existing mobile command controls in the cramped 1024–1279px range instead of microsizing copy.
- Firebase `auth/internal-error` previously produced a page-wide operational error. v5 constrains authentication status to the login task width, adds explicit configuration recovery copy, and allows Google popup internal errors to fall back to redirect authentication.

## Protected invariants

- Homepage CMS text remains unchanged.
- Five-language parity remains intact.
- Track CTA localization and WhatsApp actions are untouched.
- `track-buttons-v6.css` remains the final public stylesheet.
- v4 scroll-performance and no-yellow-loader fixes remain in place.
