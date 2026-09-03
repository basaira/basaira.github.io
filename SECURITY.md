# Basair Academy — Security Notes

## Production decisions in this release
- Public lead creation is allowed only in `assessment_requests` and is schema-validated in Firestore Rules.
- Legacy `enrollment_requests` is read/update for active admins only; public create and delete are closed.
- `settings` is closed by default.
- Videos are not stored in Firebase or Git; only external HTTPS URLs and metadata are stored in Firestore.
- The development server binds to `127.0.0.1` instead of all interfaces.
- Unused React, Express, GenAI, Motion, Firebase npm SDK and other scaffold dependencies were removed from the build dependency graph.
- Tailwind is built locally through Vite; the runtime Tailwind CDN script was removed.

## Still recommended before high-volume advertising
1. Enable Firebase App Check for the web app and enforce it after validating production traffic.
2. Add a server-side rate-limited lead endpoint or Turnstile/reCAPTCHA if abuse appears. Client cooldowns alone are not anti-abuse security.
3. Keep the Firebase API key restricted to the intended web origins and required Google APIs.
4. Use a real privacy/cookie consent implementation before non-essential analytics in jurisdictions that require consent.
5. Review Firebase Authentication authorized domains and remove domains no longer used.

## Dependency verification
Run after extracting:
```bash
npm ci
npm audit
npm run verify
```
`npm audit fix --force` is intentionally not automated because forced major upgrades can break the site.

## Toolchain note
The retained Vite version is `6.4.3`. It contains the fixes for the 2026 Vite dev-server advisories affecting earlier 6.x releases. The development command also binds only to `127.0.0.1` rather than the LAN.

## 2026-08-25 transitive dependency remediation
The lockfile pins the two transitive packages flagged by `npm audit` to patched versions:
- `postcss`: `8.5.26` (patched floor is `8.5.23` for the reported source-map disclosure/path traversal advisories).
- `nanoid`: `3.3.18` (patched 3.x floor for the reported generator infinite-loop advisories).

`package.json` also contains exact `overrides` for these two packages so future installs do not regress to the vulnerable transitive versions while this Vite toolchain is retained.

## Admin CMS security boundary
- The public website contains no embedded admin/authentication workspace; administration is isolated in `admin.html`.
- Firebase Authentication is only initialized on the dedicated admin page.
- Admin authorization is enforced twice: the UI checks `admin_roles/{uid}.active`, and Firestore Rules independently enforce the same condition for privileged reads/writes.
- Site text overrides are rendered with `textContent`, never `innerHTML`; a compromised content field therefore cannot inject executable HTML/JavaScript into visitors' pages.
- The CMS intentionally edits content, video metadata, public contact destinations and request status — not HTML/CSS/JavaScript or Firestore Rules. Executable code remains repository-controlled.
- Administrative writes for text, videos, contact settings and request status are paired with immutable `admin_audit` records.
- `admin_audit` entries avoid copying learner contact details or message contents.
