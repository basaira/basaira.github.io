# Basair Academy — Impeccable v4 surgical UI/performance pass

Scope is deliberately narrow: no CMS copy, course content, Firebase rules, track CTA actions, or form submission fields were removed.

## Fixed
- Removed the persistent gold/yellow page progress line from the floating top bar.
- Removed the gold/yellow segment from the welcome loader; loader remains green only.
- Added a dedicated compact desktop layout for the Uzbek navigation so long labels, language control and assessment CTA do not collide.
- Refined academic course cards into quiet ivory editorial dossiers with dark high-contrast text and a restrained side accent.
- Retired pointer-driven card repainting and the large blurred video decoration.
- Reworked the public scroll spy to use cached section geometry rather than querying/reading layout on every scroll frame.
- Retired the decorative reading-progress runtime and large hero pointer-tracking repaint.
- Preserved chapter/page number suppression.
- Local Vite development now uses `localhost` rather than `127.0.0.1`, improving compatibility with Firebase Auth authorized-domain configuration.
- `auth/internal-error` now receives a useful local-development diagnostic instead of a raw Firebase message.

## Verification
All source-level security/UI/hardening/form/course/hero/homepage/pathway/welcome/surgical/freeze/Impeccable checks pass in this package. Full `npm run verify` additionally needs dependencies installed; this environment could not fetch Vite from npm, so run `npm ci && npm run verify` locally.
