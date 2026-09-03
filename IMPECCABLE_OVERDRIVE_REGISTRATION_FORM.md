# Impeccable Overdrive — Registration Form

Applied on top of the `overdrive topbar` build.

## Scope
- Main homepage academic assessment form (`#enrollment-form`)
- Acquisition assessment forms (`#assessment-form`) across EN/RU/UZ landing pages

## What changed
1. **Native Academic Enrollment feel**
   - premium overdrive control panel above each form
   - section pills `01 / 02 / 03`
   - stronger card treatment per field
   - validated field badges and inline state feedback
   - richer submit area with admissions seal

2. **Instant Precision Form behavior**
   - live progress + readiness meter
   - field-level validation states without breaking existing logic
   - draft persistence in localStorage and auto-restore
   - submit-state observation for idle / submitting / success / error
   - duplicate-prevention logic remains owned by the existing form logic

## Files added
- `form-overdrive-v1.css`
- `form-overdrive-v1.js`

## Notes
- No change to Firebase collections or existing submission routes.
- No change to CTA inventory.
- Existing hardening, top bar overdrive, and track-button hotfixes were preserved.
