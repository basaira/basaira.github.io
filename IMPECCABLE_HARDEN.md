# IMPECCABLE HARDEN

Production hardening pass on the Precision Native build.

- Long/translated text wrapping and flex/grid shrink resilience.
- Mobile form 16px floor, high-contrast/forced-colors states, invalid-field focus.
- Online/offline live status while preserving entered data.
- HTML length constraints aligned with Firestore server rules.
- Idempotent assessment document IDs and in-flight guards to reduce duplicate submissions during timeouts/retries.
- Safe storage access and attribution-map sanitation.
- Explicit offline and uncertain-result recovery states.
- Admin request read cap (1000 per collection), video cap (250), defensive content normalization, URL/clipboard fallbacks.
- Added `verify:harden` to the verification chain.

Firestore authorization semantics, CMS IDs, track CTAs, layout geometry, and multilingual content were intentionally left unchanged.
