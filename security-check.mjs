import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const fail = (message) => { console.error(`SECURITY CHECK FAILED: ${message}`); process.exitCode = 1; };
const ok = (message) => console.log(`✓ ${message}`);

const rules = read('firestore.rules');
const app = read('app.js');
const admin = read('admin.html');
const index = read('index.html');
const registry = JSON.parse(read('content-registry.json'));

if (/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(rules)) fail('Found unconditional public read/write in Firestore Rules.');
else ok('No unconditional public read/write rule.');

if (!/match \/enrollment_requests\/\{requestId\}[\s\S]*?allow create, delete: if false;/.test(rules)) fail('Legacy enrollment public create/delete is not explicitly closed.');
else ok('Legacy enrollment public create/delete is closed.');

if (!/match \/settings\/\{document=\*\*\}[\s\S]*?allow read, write: if false;/.test(rules)) fail('Legacy settings collection is not closed.');
else ok('Legacy settings collection is closed.');

if (!/match \/admin_audit\/\{entryId\}[\s\S]*?allow update, delete: if false;/.test(rules)) fail('Admin audit trail is not immutable.');
else ok('Admin audit trail is immutable.');

if (/firebase-auth\.js|getAuth\(|signInWithPopup|onAuthStateChanged/.test(app)) fail('Public app.js still contains Firebase admin authentication code.');
else ok('Admin authentication is isolated from public app.js.');

const cspTag = admin.match(/<meta[^>]*Content-Security-Policy[^>]*>/i)?.[0] || '';
const csp = cspTag.match(/content="([^"]+)"/i)?.[1] || '';
if (!csp || /script-src[^;]*'unsafe-inline'/.test(csp)) fail('Admin CSP is missing or allows inline scripts.');
else ok('Admin CSP blocks inline script execution.');

const rootTag = index.match(/<html[^>]*>/i)?.[0] || '';
if (!/lang="en"/i.test(rootTag) || !/dir="ltr"/i.test(rootTag) || !/class="route-en\b/.test(index)) fail('Public homepage is not statically English/LTR by default.');
else ok('Public homepage defaults to English/LTR.');

if (!/const DEFAULT_LANGUAGE\s*=\s*"en"/.test(app) || !/function getInitialLanguage\(\)[\s\S]{0,240}return DEFAULT_LANGUAGE;/.test(app)) fail('JavaScript default language is not forced to English.');
else ok('JavaScript default language is English.');

const ids = Array.isArray(registry.items) ? registry.items.map((x) => x && x.id).filter(Boolean) : [];
if (new Set(ids).size !== ids.length) fail('Duplicate CMS content IDs detected.');
else ok(`CMS registry IDs are unique (${ids.length}).`);

const trackCount = (index.match(/class="(?:lang-(?:ar|en|fr|ru|uz)\s+)?track-detail-cta-v6"/g) || []).length;
if (trackCount !== 15 || /academic-inquiry-btn/.test(index)) fail(`Track CTA isolation failed (v6=${trackCount}).`);
else ok('All 15 multilingual track CTAs use the isolated v6 component.');

const textFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','dist','.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:js|mjs|json|html|css|rules|md|ts)$/i.test(entry.name)) textFiles.push(full);
  }
}
walk(root);
for (const file of textFiles) {
  const value = fs.readFileSync(file, 'utf8');
  if (/-----BEGIN (?:RSA |EC |)PRIVATE KEY-----/.test(value) || /"private_key"\s*:/.test(value)) {
    fail(`Private key material detected in ${path.relative(root,file)}.`);
  }
  if (/href\s*=\s*["']javascript:/i.test(value)) fail(`javascript: URL detected in ${path.relative(root,file)}.`);
}
if (!process.exitCode) ok('No private-key material or javascript: URLs found in source files.');

if (process.exitCode) process.exit(process.exitCode);
console.log('Security invariants passed.');
