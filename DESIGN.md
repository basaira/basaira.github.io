---
name: Basair Academy
description: "A calm multilingual academic system built from warm manuscript ivory, Quranic green, restrained gold, and structural scholarly navy."
colors:
  quranic-green: "#00563F"
  quranic-green-deep: "#044637"
  scholarly-navy: "#0A1F44"
  manuscript-ivory: "#FDFCF3"
  warm-paper: "#FFFDF8"
  heritage-gold: "#D4AF37"
  heritage-gold-ink: "#8A6D14"
  evergreen-night: "#071713"
  evergreen-surface: "#0B2620"
typography:
  display-latin:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4.3rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body-latin:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.7
    letterSpacing: "normal"
  display-arabic:
    fontFamily: "IBM Plex Sans Arabic, Tajawal, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4.3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body-arabic:
    fontFamily: "IBM Plex Sans Arabic, Tajawal, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.8
    letterSpacing: "normal"
rounded:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.35rem"
  xl: "1.75rem"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "4rem"
  section: "clamp(4.75rem, 7.5vw, 7rem)"
layout:
  publicWide: "84rem"
  publicContent: "72rem"
  publicReading: "68ch"
  publicGutter: "clamp(1rem, 3vw, 2rem)"
  acquisitionWide: "74rem"
  adminShell: "96rem"
components:
  button-primary:
    backgroundColor: "{colors.quranic-green}"
    textColor: "{colors.manuscript-ivory}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  track-cta:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.quranic-green}"
    rounded: "{rounded.md}"
    padding: "0.36rem 0.44rem"
  admin-primary:
    backgroundColor: "{colors.quranic-green}"
    textColor: "{colors.manuscript-ivory}"
    rounded: "{rounded.md}"
    padding: "0.68rem 0.95rem"
---

# Design System: Basair Academy

## Overview

**Creative North Star: "The Illuminated Study Hall"**

Basair Academy should feel like a contemporary scholarly environment: quiet enough for trust, precise enough for academic authority, and warm enough to welcome a parent or learner who may be encountering the institution for the first time. The public surface is manuscript-light rather than sterile white; Quranic green carries action and academic continuity; gold behaves like restrained illumination, not a dominant fill; navy is primarily a text and structural color.

The admin console is the operational counterpart of the same system. It uses a deep evergreen substrate because the task is sustained operation rather than persuasion; its action hierarchy stays green-first and its gold remains secondary. Scholarly navy is retained for public structure and text rather than large atmospheric fields. Public and admin surfaces should therefore feel related without pretending they serve the same mode.

**Key Characteristics:**
- Warm ivory public canvas with high-contrast scholarly text.
- Quranic green as the principal action and success signal.
- Heritage gold as a controlled accent, focus cue, divider, or small highlight.
- Manrope for Latin-script routes; IBM Plex Sans Arabic with Tajawal fallback for Arabic and Arabic-heavy operational UI.
- Rounded geometry that is soft but not toy-like.
- Motion is short, stateful, and always suppressed under `prefers-reduced-motion`.

## Colors

**Color strategy: “Illuminated Emerald Manuscript.”** The emotional temperature is warm, scholarly, and calm. The dominant relationship is **warm ivory ↔ deep evergreen**, with a high contrast range and restrained color dosage. Green owns action and deliberate large regions; gold signals scholarship, focus, and selected state; navy remains a structural/text color instead of becoming the default dark atmosphere.

### Primary
- **Quranic Green** (`#00563F`): canonical primary action, selected academic state, branded success, and the strongest public action color.
- **Quranic Green Deep** (`#044637`): hover/pressed state and compact dark-green refinement.
- **Evergreen Deep** (`#073B31`): rich public dark-region surface for contact, media, and evidence sections where a full brand field is intentional.

### Structural
- **Scholarly Navy** (`#0A1F44`): public heading/text structure, navigation copy, and selective outlines. It is no longer the default large dark background.
- **Operational Evergreen Night** (`#071713`): canonical admin canvas.
- **Operational Evergreen Surface** (`#0B2620`): canonical elevated admin surface.

### Neutral
- **Manuscript Ivory** (`#FDFCF3`): canonical public canvas.
- **Warm Paper** (`#FFFDF8`): cards, navigation, forms, and isolated reading surfaces.
- **Green Paper** (`#F1F7F3`): subtle alternate section tint where hierarchy needs more than white-on-white separation.

### Accent
- **Heritage Gold** (`#D4AF37`): focus rings, selected state, micro-borders, academic ornament, and small signals on dark surfaces.
- **Heritage Gold Ink** (`#8A6D14`): accessible gold-family text on light surfaces. Use this instead of raw gold for ordinary-size text.

### Semantic and contrast rules
- Body text on ivory uses deep green/near-navy text; body paragraphs never use gold.
- White on Quranic Green is a high-contrast primary action pairing; near-white is used on evergreen dark regions.
- Raw Heritage Gold is decorative/status color on light surfaces; **Gold Ink** is the readable text role.
- Admin muted text must remain visibly lighter than its evergreen surfaces; success, warning, and danger must also carry labels/icons/position rather than color alone.
- Protected academic track CTAs remain warm ivory + green + gold and must not inherit a dark background.
- Large colored regions are intentional: contact, media, evidence, and admin operation. Do not scatter extra saturated accents across every card.

## Typography

Latin-script and Cyrillic public routes use **Manrope** as the canonical family. Arabic and Arabic-heavy operational text use **IBM Plex Sans Arabic**, with **Tajawal** only as a local fallback rather than a separately downloaded family. Quranic teaching specimens on acquisition pages may use **Noto Naskh Arabic** because their purpose is to display Arabic letterforms, not interface chrome. The project should not declare **Inter** unless it is intentionally adopted as a new system decision.

### Purpose-led type roles

- **Display / hero:** Manrope 800; IBM Plex Sans Arabic 700. Responsive scale approximately `2.75rem → 6.1rem`, compact leading (`1.025` Latin, about `1.14` Arabic). This is the strongest persuasive role.
- **Section title:** Manrope 800; IBM Plex Sans Arabic 700. Responsive scale approximately `2rem → 3.75rem`, with `1.10–1.24` leading.
- **Subsection / track title:** 700–800, approximately `1.45rem → 2.25rem`; it must read as subordinate to section headings without relying on decoration.
- **Card title:** 700, approximately `1.15rem → 1.45rem`, with generous Arabic leading.
- **Reading body:** ordinary floor `1rem`; typical public range `1rem–1.125rem`. Target measure is **45–75ch**, with **68ch** the default long-form cap and up to **72ch** for academic prose.
- **Support / metadata:** `0.75rem–0.875rem` only where density is justified; explanatory prose must not be pushed into metadata sizing.
- **Admin operational text:** Arabic-first IBM Plex Sans Arabic; panel body around `0.86rem–0.94rem`, panel headings around `1.08rem`, top-level console title around `1.32rem`, with extra leading on dark surfaces. Numeric counters use tabular figures.

Hero titles are weight-led rather than decoration-led: bold, compact line-height, balanced wrapping, and no gradient-clipped text. Arabic does not use negative tracking. Russian and Uzbek headings use gentler tracking than English/French where long localized words need more room.

Use typography to create hierarchy before adding borders, pills, or extra cards. Interface labels may be strong, but long explanatory copy should remain calm. Load only font families and weights that are actually used on each page; never depend on synthetic 850/900/950 weights when the loaded family stops at 800 or 700.

## Layout

The spatial thesis is **conversion-first scholarship**: the public page moves from orientation to evidence to action without forcing every section into the same card pattern. The intended task path is **Hero → Concise Guide → Initial Assessment gateway → Institutional context → Detailed Academic Tracks → Media/testimonial proof → FAQ**. The DOM order should continue to reflect this path so visual order, keyboard order, and screen-reader order stay aligned.

### Container system
- **Public wide container:** `84rem` with `clamp(1rem, 3vw, 2rem)` gutters. Use it for hero, guide, tracks, media, and testimonial sections.
- **Public content container:** `72rem` for trust/context and FAQ content that does not benefit from panoramic width.
- **Reading measure:** `68ch` for long academic prose; do not stretch track documentation merely because the grid has available space.
- **Assessment/form container:** approximately `64rem`, with heading copy narrower than the form surface.
- **Acquisition pages:** `74rem` wide container with the same fluid-gutter principle.
- **Admin shell:** `96rem` maximum width. The editor column is always `minmax(0, 1fr)` so tables, forms, and CMS panels may shrink without forcing horizontal page overflow.

### Rhythm and grouping
Use a small deliberate spacing vocabulary: local control gaps around `0.75–1rem`, component clusters around `1.25–2rem`, major internal stacks around `2.25–3.75rem`, and section separation around `4.75–7rem`. Prefer `gap` on grid/flex parents over accumulating arbitrary child margins. Related labels, controls, and explanations sit close together; different academic stages receive visibly larger separation.

The public hero is one centered reading path rather than several independently margined blocks. The concise guide may use editorial asymmetry where it improves scanning. The assessment form is a conversion boundary and may be an elevated panel. Long academic tracks are not split into sticky sidebar + document until the viewport is at least **1180px**; between 1024px and 1179px they become a full-width summary followed by the reading column to protect Russian, Uzbek, French, and Arabic copy.

### Responsive composition
Responsive behavior changes structure before content collides:
- **≤1023px:** public navigation uses its compact/mobile architecture; sticky learning-guide side content becomes normal flow.
- **1024–1179px:** detailed tracks remain a single reading column rather than using the desktop 4/8 split.
- **≤767px:** assessment fields, track articles, and major action groups become one column; section gutters and vertical rhythm tighten without collapsing touch space.
- **Acquisition ≤1000px:** hero, solution, and assessment pairs stack; card grids reduce further to one column by `760px`.
- **Admin ≤1180px:** four-stat rows become two columns. **≤900px:** the sidebar becomes a horizontally scrollable compact rail and the main workspace uses full width. **≤680px:** operational grids become one column.

RTL and localization are first-class layout constraints. Use logical properties (`margin-inline`, `padding-inline`, `inset-inline-*`) and flexible `minmax(0, 1fr)` tracks. Do not create fixed-width navigation, labels, or buttons that only fit English. Visual reordering must never disagree with DOM/focus order.

## Elevation

Public pages are **flat by default**. Elevation is reserved for navigation, interactive cards, modal-like surfaces, and focus/hover response.

- Public cards: subtle border plus low-opacity shadow; interaction emphasis must not depend on positional hover lift.
- Navigation: light translucency and blur are acceptable because they communicate persistence over content.
- Track CTAs: warm ivory surface with a narrow gold-tinted border and minimal hover lift.
- Admin: translucent evergreen surfaces with restrained blur; green and gold glows remain faint and local.
- Focus states: visible gold ring with spacing from the control; focus visibility is never traded for visual cleanliness.

Avoid nested card-on-card elevation unless the inner surface represents a real interaction boundary.

## Components

### Global Navigation
Use a warm, nearly opaque ivory surface. Keep the brand, primary navigation, language control, and assessment CTA visually distinct. On compact widths, switch to the mobile architecture before desktop items begin colliding.

### Language Control
Language switching is an operational selector, not a decorative badge. The trigger must show the current language, expose its expanded state, point to the controlled popup, and preserve one active option across all five routes.

### Academic Track CTA
`track-detail-cta-v6` is the protected public track action. It uses warm ivory, green text, a gold-edged mark, explicit hover/focus/active states, and exactly one visible localized version per track.

Do not reintroduce navy backgrounds or broad legacy WhatsApp selectors into this component.

### Cards and Academic Sections
Cards should group a coherent unit of information. Prefer spacing and typography before introducing another container. Section headings may use green/gold accents, but the content hierarchy should stay readable without decoration.

### Forms
Inputs use explicit labels, generous vertical spacing, clear focus rings, and stable success/error states. Submit actions are green-first. Disabled/loading states must preserve legibility.

### Admin Console
The admin console is a deep-evergreen operational variant: fixed/compact navigation, dense but readable panels, high-contrast fields, green primary actions, muted secondary actions, and gold only as a status/focus accent. Its typography must load explicitly rather than relying on device fallback.

### Motion System
Motion follows the **Illuminated Study Hall** concept rather than generic fade-and-rise choreography. The public Academy has one authored focal entrance: the hero lines reveal as if a manuscript is being uncovered, the gold illumination expands once, and the primary action settles after the title. Acquisition pages make **measurable progress** the focal material by animating progress bars and ledger items when their dashboard becomes visible. The admin console stays in operate mode: tab changes, status messages, and press feedback are fast and functional.

Use these timings as the default vocabulary: **140ms** for immediate press/feedback, **220ms** for routine state changes, **340ms** for overlays/drawers, and up to **680ms** only for the authored hero entrance. Arrivals use `cubic-bezier(.16,1,.3,1)`; routine state changes may use `cubic-bezier(.2,.8,.2,1)`. Exits should be faster than entrances. Do not use bounce or elastic easing.

Motion is progressive enhancement. Content remains visible when JavaScript fails; motion-enabled classes may hide or stage content only after the runtime has opted in. Nonessential loops must pause while offscreen or when the document is hidden. `prefers-reduced-motion` removes spatial movement and loops while preserving color/opacity state feedback needed to understand actions.

### Delight System
Delight follows the **Quiet Academic Seal** thesis: meaningful actions should feel acknowledged and trustworthy, as though a scholarly record has been stamped and advanced to the next step. It is concentrated at earned moments—assessment completion, submission recovery, administrative save/confirmation, and useful empty states—not on ordinary navigation clicks.

For public assessment success, use an emerald/gold confirmation treatment that remains visible long enough to create certainty. Do not use confetti, mascots, sound, or fake waiting. When submission fails or a cooldown prevents another request, recovery comes first: preserve the user’s path and expose direct WhatsApp/Telegram follow-up instead of leaving them at a dead end. On acquisition routes, the existing follow-up actions become the explicit next step for both success and recovery.

In the admin console, delight is deliberately quieter because actions repeat frequently. Routine saves use a compact status seal; copy actions may temporarily confirm the copied state; empty results receive a restrained compass-like mark. These details must never delay work, obscure errors, or replace the actual status copy. All authored delight remains keyboard/touch accessible, localized where it carries meaning, silent by default, and compatible with reduced motion.


## Overdrive System

**Direction: Precision Native Overdrive (1 + 3).** The previous Scholar’s Manuscript visual experiment is retained only where it proved useful: a calm pointer-light layer, the gold reading edge, and continuity-rich View Transitions. Geometry is now protected. Overdrive must not own section heights, padding, gaps, grids, or type scale. Extraordinary means **continuity, immediacy, and operational certainty**, not added spectacle.

The public site uses interruptible language transitions, a shared-element video morph, and a View Transition on the video grid when filters change. Rapid repeated input cancels stale transitions rather than queueing them. The video modal makes the background inert while open, contains keyboard focus, restores focus on close, and treats Firestore/video metadata as authoritative rather than presentation state. The assessment form exposes `aria-busy` while sending and keeps success/error states explicit.

The admin console behaves like a native operational application: tabs expose real `tablist/tab/tabpanel` semantics, arrow/Home/End keys move between tabs, panel changes use a short View Transition when supported, search rendering is coalesced with `requestAnimationFrame`, and request-status changes respond optimistically while rolling back on Firestore failure. Form busy states never hide the actual result of the write.

### Precision Native constraints
- **Geometry is protected.** Overdrive interaction layers must not override width, height, min/max sizes, padding, margin, gap, grid tracks, font size, or line height.
- No positional hover lift on primary controls, video media, slider controls, or admin buttons. State is communicated with color, border, shadow, opacity, and focus treatment.
- The retired folio separators stay retired; do not inject hidden marker nodes or observers for them.
- Prefer CSS scroll timelines over permanent JavaScript scroll listeners; JavaScript is fallback only where the platform cannot express the behavior.
- Repeated View Transitions must be interruptible; stale transitions are skipped instead of queued.
- Modal background content becomes `inert` while the video player is open and returns to its prior interaction state on close.
- Admin optimistic UI is presentation-only and must roll back if the Firestore write fails.
- Acquisition and assessment forms expose `aria-busy` during network work and return to an actionable state in `finally`.
- Reduced-motion users retain all state changes without spatial animation.
- `track-buttons-v6.css` remains the final public stylesheet and its functional/localization contract is not overridden.


## Hardening System

Production resilience is part of the design system, not an afterthought. Public and admin surfaces must remain usable with long translations, malformed or extreme input, offline/slow networks, repeated actions, empty collections, and partially corrupted remote data. Hardening must preserve the established visual geometry rather than introducing another design layer.

- Text-bearing flex/grid children use `min-inline-size: 0`; user/CMS text may wrap with `overflow-wrap: anywhere` instead of forcing horizontal overflow.
- Mobile form controls keep a 16px minimum rendered size to avoid iOS focus zoom; field lengths mirror the Firestore server constraints.
- Invalid fields expose `aria-invalid`, retain the user's data, and receive focus when custom validation fails.
- Offline state is announced in a localized live region. Form submission is blocked before the network write while preserving all entered values.
- Assessment writes use a session-scoped idempotency token and deterministic Firestore document ID so timeout/retry races do not create duplicate leads. An uncertain timeout result is explained as uncertain rather than falsely reported as success or failure.
- Attribution data recovered from browser storage is allowlisted and length-limited before it reaches Firestore. Storage failures degrade to in-memory/current-page behavior.
- Firestore-editable public content is defensively bounded before rendering: text maps and video arrays cannot expand without limit in the browser. Realtime listeners are disposed on `pagehide`.
- Admin collection reads are capped for safety, large CMS results are already windowed, videos have an operational cap, URLs require HTTPS with no embedded credentials, and clipboard failure falls back to manual selection.
- Windows forced-colors/high-contrast mode retains visible focus, invalid, border, and status affordances. Color is never the only error signal.
- Every hardening invariant is covered by `verify:harden`, which runs inside the normal `npm run verify` chain.

Hardening must not weaken Firestore authorization, bypass validation, silently discard user input, or reintroduce fixed widths that only fit English.

## Do's and Don'ts

### Do
- Use Manrope for Latin-script UI and IBM Plex Sans Arabic/Tajawal for Arabic.
- Keep the public surface ivory and academically calm.
- Use green to communicate primary action and to own deliberate dark brand regions.
- Use Gold Ink (`#8A6D14`) when gold-family text must remain readable on light surfaces.
- Use raw gold sparingly for focus, status, separators, and fine emphasis.
- Preserve identical functional access across English, Arabic, French, Russian, and Uzbek.
- Keep one localized track CTA visible per route.
- Respect reduced-motion preferences and keyboard focus.
- Use motion to explain state, continuity, progress, or one authored brand moment; pause nonessential loops offscreen.
- Concentrate delight on earned completion, recovery, and operational certainty; keep it specific to the academic world of Basair.
- Use semantic state (`aria-expanded`, `aria-hidden`, `aria-busy`, `inert`) where visual state alone would leave interaction ambiguous.
- Keep advanced interaction transitions interruptible and rollback-safe.

### Don't
- Do not add Inter as a silent fallback or undeclared dependency.
- Do not bring navy back as the background of the protected track CTA.
- Do not let navy reclaim large public dark regions that now belong to evergreen.
- Do not use raw `#D4AF37` for paragraph-size text on ivory.
- Do not use purple/blue AI gradients, gradient text, or decorative glass on every surface.
- Do not add generic section-by-section fade-and-rise choreography, bounce/elastic easing, or perpetual decorative motion.
- Do not use confetti, playful mascots, forced celebration, sound, or fake delays for routine actions.
- Do not solve hierarchy by nesting more cards.
- Do not hide focus outlines without replacing them with an equally visible focus treatment.
- Do not create language-specific controls that drift in size, hierarchy, or capability.
- Do not let Overdrive interaction layers own geometry or reintroduce positional hover movement.
- Do not use Firestore-editable content as executable HTML/CSS/JavaScript.

## Top Bar Overdrive — Floating Academic Command Bar (2026-08-26)

The navbar is the single high-impact navigation surface. It floats inside the existing fixed header height and must not cause layout shift.

- Surface: ivory/emerald glass with a subtle gold top highlight.
- Scroll state: stronger opacity, border, and shadow; no height change.
- Navigation: one shared gold active rail instead of multiple underlines.
- Pointer response: specular highlight follows fine pointers only.
- Command cluster: Telegram, language, and assessment actions share one compact command group.
- Mobile: language and menu controls sit in one glass command cluster.
- Accessibility: reduced-motion disables animated transitions; focus behavior remains native.
- Guardrail: no section/hero/card geometry changes from this layer.


## Final Polish — Unified Finish Pass (2026-08-26)

The final polish pass is deliberately **subtractive**. It does not add another visual concept; it reconciles the accumulated Top Bar, Registration Form, Course Dossier, Delight, and hardening layers so the interface reads as one authored system.

- Elevation is quieter and more consistent across public, acquisition, and admin surfaces.
- Large hover lifts are removed; state is communicated through border, shadow, color, opacity, and focus treatment.
- Hero, guide, assessment, course documents, video cards, testimonials, and FAQ surfaces share a more restrained finish.
- Acquisition pages use the same restrained button/card language without flattening their conversion hierarchy.
- Admin panels, fields, navigation, and actions use the same operational rhythm with reduced visual noise.
- `track-buttons-v6.css` remains the final public stylesheet; the final polish layer never targets `.track-detail-cta-v6`.
- Forced-colors and reduced-motion behavior are explicit in every final-polish stylesheet.

**Guardrail:** final polish is not a redesign. It must not change Firebase behavior, CMS IDs, route availability, form submission semantics, or the established responsive structure.

## Hero CTA — Academic Dual Action (2026-08-29)
- The hero exposes two actions with explicit hierarchy: **Free Academic Assessment** as the primary conversion route and the existing **Concise Guide** as the secondary exploration route.
- The primary action uses evergreen depth; the secondary uses ivory/gold academic treatment.
- Button geometry stays stable on hover; feedback is light, border, local glow, and a one-time acknowledgement rather than large movement.
- On mobile the pair stacks into one compact action column.
- Motion is one-time and reduced-motion safe; anchors keep native navigation semantics.

## Homepage editorial journey — 2026-08-29
The public homepage after the Hero follows one scholarly reading path: Quick Guide → Faculty & Methodology → Academic Tracks → Video Library → Testimonials → FAQ → Initial Academic Assessment. The assessment is intentionally terminal in normal scroll order while the Hero primary CTA still links directly to `#contact`. Visual hierarchy is carried by chapter rhythm, paper/ivory/dark surface alternation, and low-noise rules rather than repeated card shadows. Academic/CMS copy is preserved; Distill operates on redundant visual framing, not substantive content.
