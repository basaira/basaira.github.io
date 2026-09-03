import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = [
  'index.html',
  'en/quran-kids/index.html',
  'en/quran-adults/index.html',
  'en/arabic/index.html',
  'ru/quran/index.html',
  'ru/arabic/index.html',
  'uz/quran/index.html',
  'uz/arabic/index.html'
];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

if (!fs.existsSync(path.join(root, 'form-polish-v2.css'))) failures.push('form-polish-v2.css is missing');
for (const file of pages) {
  const html = read(file);
  if (!html.includes('form-polish-v2.css')) failures.push(`${file}: form polish stylesheet missing`);
  if (!html.includes('form-overdrive-v1.js')) failures.push(`${file}: overdrive form behavior missing`);
  if (file === 'index.html' && !html.includes('registration-shell')) failures.push('index.html: registration shell marker missing');
  if (file !== 'index.html' && !html.includes('registration-form-card')) failures.push(`${file}: polished form card marker missing`);
}
const rootHtml = read('index.html');
const styleLinks = [...rootHtml.matchAll(/<link\s+[^>]*href="([^"]+\.css[^"]*)"[^>]*rel="stylesheet"[^>]*>/gi)].map(m => m[1]);
if (styleLinks.at(-1) !== 'track-buttons-v6.css?v=20260830-surgical2') failures.push('Protected track-buttons-v6.css is no longer last');

if (failures.length) {
  console.error('REGISTRATION POLISH CHECK FAILED');
  failures.forEach((failure) => console.error(' - ' + failure));
  process.exit(1);
}
console.log(`REGISTRATION POLISH CHECK PASSED (${pages.length}/${pages.length} form pages)`);
