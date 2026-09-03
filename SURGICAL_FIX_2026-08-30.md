# Surgical logic fix — 2026-08-30

Baseline: Academic Pathways Living Manuscript build.

No section, CMS block, track, registration form, testimonial, video library, or splash markup was removed.

Changes are limited to:
- early splash release controller independent from Firebase/modules, while retaining the splash;
- corrected splash hidden terminal state;
- additive visual stability overrides (grid decoration off, sane hero scale, non-sticky pathway summary);
- corrected track CTA grid after its decorative pseudo-element became absolute;
- `app.js` delegates splash release to the shared boot contract with its prior fallback code preserved.

Second surgical pass:
- makes the early splash controller authoritative while retaining the complete legacy fallback;
- retires the splash visually without removing its DOM/source markup;
- refreshes cache keys for every corrected runtime/style file;
- adds explicit visibility guards for tracks, video library, testimonials, FAQ, and registration;
- reduces only the inner hero seal/logo scale;
- verifies all 1,066 homepage CMS bindings and their wording byte for byte.
