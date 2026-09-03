# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Repository-inferred from the current public copy and flows:

- Prospective learners studying the Quran, Tajweed, Arabic, or Arabic-language sciences.
- Parents or guardians evaluating structured study for a child.
- Multilingual visitors using English, Arabic, French, Russian, or Uzbek.
- Internal academy administrators who review assessment requests, manage public content, maintain video metadata, update contact settings, and inspect the audit trail.

## Product Purpose

Basair Academy presents a structured academic path for Quranic and Arabic study, explains the academy's methodology, helps a visitor choose a suitable track, and converts interest into an academic assessment or direct inquiry.

The internal admin console exists to manage the public site's editable content and operational records without turning Firestore into a remote code editor.

## Positioning

Repository-inferred: the product positions the academy as a structured academic institution rather than a generic tutoring marketplace. The differentiator expressed in the interface is the combination of defined academic tracks, assessment-led entry, documented methodology, and specialist instruction.

Future work should preserve that distinction and avoid generic "book a tutor" language unless the product strategy explicitly changes.

## Operating Context

- Public website used across mobile, tablet, and desktop.
- English is the default route; visitors can switch to Arabic, French, Russian, or Uzbek without leaving the page.
- Inquiry paths use WhatsApp and Telegram.
- Academic-assessment requests are submitted from the site and surfaced to administrators.
- Video files and poster images are hosted externally; Firestore stores their metadata and URLs.
- The admin console is an authenticated operational surface separate from the public marketing experience.

## Capabilities and Constraints

- Five-language public UI: `en`, `ar`, `fr`, `ru`, `uz`.
- RTL/LTR direction changes with the selected language.
- Three academic track CTAs, with exactly one localized CTA visible per route.
- Public CMS content is indexed through `data-content-id`.
- Firebase Authentication and Firestore are used for protected administration and persisted content.
- Firestore rules deliberately prevent public administrative writes and keep the audit trail immutable.
- Admin edits public text through safe text operations rather than executable HTML/CSS/JavaScript.
- Video binaries are not stored in Firebase Storage in this project.
- Existing security and UI regression invariants are release constraints and must continue to pass.

## Brand Commitments

- Product name: **Basair Academy / أكاديمية بصائر**.
- Existing logo assets: `logo.png`, `favicon.png`.
- Existing verbal identity includes **"نور يهدي، وعلم يبني" / "A Guiding Light, Building Knowledge."**
- The public experience is scholarly, calm, premium, and academically explicit.
- Do not fabricate student outcomes, customer counts, institutional endorsements, or performance metrics.

## Evidence on Hand

Real repository evidence includes:

- Public multilingual academic-track copy in `index.html`.
- A CMS registry with thousands of stable content IDs in `content-registry.json`.
- Existing testimonials and methodology content in the public page.
- Assessment, contact, video-library, and administration flows.
- Security constraints in `firestore.rules` and `SECURITY.md`.
- UI regression checks in `ui-regression-check.mjs`.
- Security checks in `security-check.mjs`.

No independent case-study data, audited learning outcomes, press coverage, or externally verified conversion metrics are present in the repository. Future design work must not invent them.

## Product Principles

1. **Academic clarity before promotion.** Explain what the learner studies, how the path works, and what the next step is.
2. **Trust before conversion pressure.** Use evidence, methodology, and clear boundaries rather than aggressive sales devices.
3. **Localization parity.** Every supported language should receive the same functional access and coherent visual treatment.
4. **Secure editability.** Administrators may manage content and operational data, but executable code remains repository-controlled.
5. **Responsive continuity.** Mobile, tablet, and desktop should feel like one product, not separate designs.

## Accessibility & Inclusion

The current implementation already contains reduced-motion handling, visible focus treatment, semantic labels on many controls, and explicit RTL/LTR language switching. Future work should preserve keyboard access, focus visibility, readable contrast, language-correct labels, and equivalent functionality across all five routes.
