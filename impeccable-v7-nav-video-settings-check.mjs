import fs from 'node:fs';

const read = (f) => fs.readFileSync(f, 'utf8');
const html = read('index.html');
const css = read('public-ui-fixes-v1.css');
const admin = read('admin.js');
const adminHtml = read('admin.html');
const app = read('app.js');
const rules = read('firestore.rules');

function ok(cond, msg){ if(!cond){ console.error('IMPECCABLE V7 CHECK FAILED:', msg); process.exit(1); } console.log('✓', msg); }

// Arabic glyph safety — show real glyph dots, no fake pseudo-content.
ok(/body\.route-ar #home \.hero-title__line[\s\S]*?padding-block:\.035em \.16em!important/.test(css), 'Arabic hero line reserves below-baseline space for dots and marks.');
ok(/body\.route-ar #home \.hero-title__line[\s\S]*?overflow:visible!important/.test(css), 'Arabic hero glyphs are not clipped.');
ok(!/content:\s*["']\.\.["']/.test(css), 'No fake dot characters were introduced.');

// Uzbek topbar — same centered geometry at roomy desktop; no microscopic labels.
ok(/body\.route-uz #navbar>\.max-w-7xl[\s\S]*?max-width:80rem!important/.test(css), 'Uzbek desktop topbar returns to the shared centered width.');
ok(/body\.route-uz #navbar \.nav-link[\s\S]*?font-size:\.77rem!important/.test(css), 'Uzbek desktop labels remain readable.');
ok(/min-width:1024px\) and \(max-width:1439px\)[\s\S]*?body\.route-uz #navbar nav\.hidden\.lg\\:flex[\s\S]*?display:none!important/.test(css), 'Uzbek uses existing compact controls before labels collide.');
ok(/body\.route-uz #navbar \.nav-link--video svg[\s\S]*?display:block!important/.test(css), 'Uzbek video-library icon remains consistent with other languages on wide desktop.');

// Russian video-library copy stays correct and unmodified, with natural casing.
ok((html.match(/>Видеотека</g) || []).length >= 3, 'Russian “Видеотека” copy is preserved in navbar, mobile menu, and section.');
ok(/body\.route-ru #navbar \.nav-link[\s\S]*?text-transform:none!important/.test(css), 'Russian navbar preserves natural title casing.');

// Admin video management: metadata-only external HTTPS model, active-admin protected and audited.
ok(/id="video-url"[^>]*type="url"/.test(adminHtml) && !/id="video-form"[\s\S]{0,3000}type="file"/.test(adminHtml), 'Video admin uses external URL metadata, not Firebase binary upload.');
ok(/function safeUrl\(value, label\)[\s\S]*?url\.protocol !== "https:"/.test(admin), 'Admin rejects non-HTTPS video/poster URLs.');
ok(/function saveVideo\(event\)[\s\S]*?batch\.set\(publicRef, \{ videos \}, \{ merge: true \}\)[\s\S]*?appendAuditToBatch/.test(admin), 'Video saves are atomic with an immutable admin audit entry.');
ok(/videos\.length >= 250/.test(admin), 'Video metadata library retains its safety limit.');
ok(/function normalizeVideo\(video\)[\s\S]*?!isSafeHttpsUrl\(videoUrl\)/.test(app), 'Public renderer rejects unsafe video URLs.');
ok(/video\.published !== false/.test(app), 'Public renderer honors video publish state.');
ok(/match \/site_content\/public[\s\S]*?allow create, update: if isActiveAdmin\(\);[\s\S]*?allow delete: if false;/.test(rules), 'Only active admins can mutate public site content; document deletion is blocked.');

// Settings: validated centrally and applied to all marked public links.
ok(/function normalizeWhatsappNumber/.test(admin) && /function normalizeTelegramUsername/.test(admin), 'Contact settings are normalized before save.');
ok(/batch\.set\(publicRef, \{ settings \}, \{ merge: true \}\)/.test(admin), 'Contact settings save into the protected public content document.');
ok(/function applyPublicContactSettings\(settings\)[\s\S]*?data-contact-channel="whatsapp"[\s\S]*?data-contact-channel="telegram"/.test(app), 'Public WhatsApp and Telegram links consume saved settings dynamically.');
ok(/appendAuditToBatch\(batch, "settings\.update"/.test(admin), 'Settings changes are written to the admin audit trail.');
ok(/function saveText\(event\)[\s\S]*?batch\.set\(publicRef, \{ texts \}, \{ merge: true \}\)[\s\S]*?appendAuditToBatch/.test(admin), 'CMS text overrides remain atomic and audited.');
ok(/function updateRequestStatus\(id, status, sourceCollection\)[\s\S]*?\["new", "contacted", "pending", "accepted", "rejected"\][\s\S]*?batch\.update/.test(admin), 'Admin request-status changes stay allow-listed and audited.');

// Protected stylesheet ordering remains intact.
const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"[^>]*>/g)].map(m=>m[1]);
ok(styles.at(-1)?.startsWith('track-buttons-v6.css?v=20260830-surgical2'), 'Track CTA stylesheet remains the final stylesheet.');

console.log('Impeccable v7 navbar/video/settings invariants passed.');
