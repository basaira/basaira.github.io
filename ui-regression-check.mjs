import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const fail = (message) => {
  console.error(`UI CHECK FAILED: ${message}`);
  process.exitCode = 1;
};
const ok = (message) => console.log(`✓ ${message}`);

const index = read('index.html');
const trackCss = read('track-buttons-v6.css');
const legacyCss = read('styles.css');
const locales = ['ar', 'en', 'fr', 'ru', 'uz'];

const baseRule = trackCss.match(/#tracks\s+\.track-detail-cta-v6\s*\{([\s\S]*?)\}/)?.[1] || '';
const baseDisplays = [...baseRule.matchAll(/display\s*:\s*([^;!}]+)/gi)]
  .map((match) => match[1].trim().toLowerCase());

if (!baseRule || baseDisplays.length !== 1 || baseDisplays[0] !== 'none') {
  fail('Track CTA base rule must contain one display declaration and it must be display:none.');
} else {
  ok('Inactive track CTA languages are hidden by default.');
}

const missingLocaleSelectors = locales.filter((locale) => {
  const selector = `body.route-${locale} #tracks .track-detail-cta-v6.lang-${locale}`;
  return !trackCss.includes(selector);
});
if (missingLocaleSelectors.length || !/\{\s*display\s*:\s*grid\s*!important\s*\}/i.test(trackCss)) {
  fail(`Localized track CTA activation is incomplete: ${missingLocaleSelectors.join(', ') || 'display rule missing'}.`);
} else {
  ok('All five routes activate only their matching track CTA.');
}

for (const locale of locales) {
  const count = (index.match(new RegExp(`class="lang-${locale} track-detail-cta-v6"`, 'g')) || []).length;
  if (count !== 3) fail(`Expected 3 ${locale.toUpperCase()} track CTAs, found ${count}.`);
}
if (!process.exitCode) ok('Each academic track has one CTA for every supported locale.');

const ctaTags = index.match(/<a\s+class="lang-(?:ar|en|fr|ru|uz) track-detail-cta-v6"[^>]*>/g) || [];
if (ctaTags.length !== 15 || ctaTags.some((tag) => !/data-contact-channel="whatsapp"/.test(tag) || !/href="https:\/\/wa\.me\//.test(tag))) {
  fail('Every localized track CTA must retain a valid WhatsApp action.');
} else {
  ok('All 15 localized track CTAs retain their WhatsApp actions.');
}

const unsafeLegacySelectors = [
  '#tracks article > div:first-child a[href^="https://wa.me/"]',
  '#tracks article:nth-of-type(1) > div:first-child a[href^="https://wa.me/"]',
  '#tracks article:nth-of-type(2) > div:first-child a[href^="https://wa.me/"]',
  '#tracks article:nth-of-type(3) > div:first-child a[href^="https://wa.me/"]',
  'body.route-ar #tracks article > div:first-child a[href^="https://wa.me/"]'
].filter((selector) => legacyCss.includes(selector));
if (unsafeLegacySelectors.length) {
  fail(`Legacy WhatsApp styling can still override the track CTA component: ${unsafeLegacySelectors.join(', ')}.`);
} else {
  ok('Legacy WhatsApp rules are isolated from the current track CTA component.');
}

const navyBackground = /background(?:-color)?\s*:[^;}]*?(?:#071d3d|#0a1f44|#163b69|#0a244a)/i;
if (navyBackground.test(trackCss)) {
  fail('A navy background remains in the isolated track CTA component.');
} else if (!/background\s*:\s*linear-gradient\(180deg,#fffdf6 0%,#f8f1df 100%\)\s*!important/i.test(trackCss)) {
  fail('The approved ivory track CTA surface is missing.');
} else {
  ok('Track CTAs use the ivory, green and gold palette with no navy background.');
}

for (const state of [':visited', ':focus-visible', ':hover', ':active']) {
  if (!trackCss.includes(`.track-detail-cta-v6${state}`)) {
    fail(`Track CTA ${state} state is not explicitly protected.`);
  }
}

const stylesheetLinks = [...index.matchAll(/<link\s+[^>]*href="([^"]+\.css[^"]*)"[^>]*rel="stylesheet"[^>]*>/gi)]
  .map((match) => match[1]);
const lastStylesheet = stylesheetLinks.at(-1) || '';
if (lastStylesheet !== 'track-buttons-v6.css?v=20260830-surgical2') {
  fail(`Track CTA stylesheet must be the final stylesheet with the current cache key; found "${lastStylesheet}".`);
} else {
  ok('The hardened CTA stylesheet loads last with a fresh cache key.');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('UI regression invariants passed.');
