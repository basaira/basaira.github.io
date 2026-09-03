# Visual Layout Hotfix v2 — 2026-08-26

This hotfix responds to real viewport screenshots supplied after Overdrive.

## Fixed regressions

- Removed floating Overdrive folio line/diamond separators that visually created empty page bands.
- Restored the public hero to content-driven height instead of the later `90svh` layout override.
- Reduced and localized hero display scale, especially for long English/French/Russian/Uzbek headings.
- Reduced major-section top/bottom rhythm to remove dead vertical space.
- Tightened the concise-guide two-column introduction and reduced excessive gaps.
- Reduced Academic Tracks heading-to-content distance, inter-track spacing, document padding and card padding.
- Tightened Video Library top rhythm and its inner editorial frame.
- Re-centered and normalized the assessment/conversion surface.
- Preserved the deep-emerald track-card contrast hotfix.
- Preserved `track-buttons-v6.css` as the final stylesheet.

## Protected behavior

No Firebase rules, CMS IDs, WhatsApp actions, form ownership, or language routing logic were changed.
