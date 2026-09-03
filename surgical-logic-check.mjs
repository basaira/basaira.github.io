import fs from 'node:fs';
import crypto from 'node:crypto';

const html = fs.readFileSync('index.html', 'utf8');
const splashCss = fs.readFileSync('basair-splash.css', 'utf8');
const stabilityCss = fs.readFileSync('ui-stability-v1.css', 'utf8');
const trackCss = fs.readFileSync('track-buttons-v6.css', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

function ok(condition, label) {
  if (!condition) throw new Error(label);
  console.log(`✓ ${label}`);
}

ok(html.includes('id="splash-screen"'), 'Splash markup is preserved');
ok(html.includes('window.BasairBoot = Object.freeze({') && html.includes('ready: function () { requestRelease("app-ready"); }'), 'Single authoritative boot controller is present');
ok(html.includes('ABSOLUTE_MAX_MS = 1800'), 'Splash has an independent absolute watchdog');
ok(splashCss.includes('#splash-screen.basair-splash.splash-hidden{\n  opacity:0!important;'), 'Splash terminal state hides instead of re-showing');
ok(appJs.includes('window.BasairBoot && typeof window.BasairBoot.ready === "function"'), 'app.js delegates to the shared splash controller');
ok(splashCss.includes('2026-08-31 welcome lifecycle fix'), 'Autonomous CSS splash lifecycle is disabled additively');
ok(html.includes('data.releaseReason') || html.includes('dataset.releaseReason'), 'Splash release records its terminal reason for diagnostics');
ok(appJs.includes('if (!window.BasairBoot || typeof window.BasairBoot.ready !== "function")'), 'Historical app timers remain available only as a true fallback');
ok(html.includes('The early controller above is authoritative'), 'Legacy splash fallback delegates to the early controller');
ok(!html.includes('splash.parentNode.removeChild(splash)'), 'Splash markup is never removed at runtime');
ok(html.includes('splash.style.setProperty("display", "none", "important")'), 'Splash fallback retires the preserved node visually');
ok(html.includes('basair-splash.css?v=20260831-welcome4'), 'Splash fix has a fresh browser cache key');
ok(html.includes('ui-stability-v1.css?v=20260830-surgical2'), 'Stability fix has a fresh browser cache key');
ok(html.includes('track-buttons-v6.css?v=20260830-surgical2'), 'Track CTA fix has a fresh browser cache key');
ok(html.includes('app.js?v=20260831-perf4'), 'Application boot fix has a fresh browser cache key');

for (const id of ['tracks','video-library','testimonials','contact']) {
  ok(html.includes(`id="${id}"`), `Section preserved: #${id}`);
}
ok((html.match(/data-pathway-index="0[123]"/g) || []).length === 3, 'All three academic pathways are preserved');
ok((html.match(/data-content-id=/g) || []).length === 1066, 'All 1066 homepage CMS bindings are preserved');

const cmsRows = [];
const cmsPattern = /<span\b[^>]*\bdata-content-id="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g;
let cmsMatch;
while ((cmsMatch = cmsPattern.exec(html))) {
  cmsRows.push(`${cmsMatch[1]}\u0000${cmsMatch[2]}`);
}
const cmsDigest = crypto.createHash('sha256').update(cmsRows.join('\u0001')).digest('hex');
ok(cmsRows.length === 1066, 'All homepage CMS text nodes remain readable');
ok(cmsDigest === 'b21a6db3ccff31688bf529daf8ff7a7ae67d4467fa370873a999a23083d3de0b', 'Homepage wording is byte-for-byte preserved');

const links = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"[^>]*>/g)].map(m => m[1]);
ok(links.at(-1)?.startsWith('track-buttons-v6.css'), 'Protected track stylesheet remains last');
ok(links.some(href => href.startsWith('ui-stability-v1.css')), 'Additive stability stylesheet is loaded');
ok(stabilityCss.includes('#home.bg-pattern{background-image:none!important}'), 'Requested square/grid background is disabled additively');
ok(stabilityCss.includes('position:relative!important;\n    top:auto!important;'), 'Desktop pathway summary no longer floats alone as sticky content');
ok(trackCss.includes('grid-template-columns:minmax(0,1fr) 1.72rem!important'), 'Track CTA label has a real text column');
ok(trackCss.includes('overflow-wrap:normal!important'), 'Track CTA no longer breaks words letter-by-letter');
ok(stabilityCss.includes('max-inline-size:23ch!important'), 'Desktop hero measure is stabilized');
ok(stabilityCss.includes('white-space:nowrap!important'), 'Desktop nav labels are protected from ugly wrapping');
ok(stabilityCss.includes('#home .hero-visual-seal{width:30%!important}'), 'Inner hero logo is proportionally restrained');
for (const id of ['tracks','video-library','testimonials','faq','contact']) {
  ok(stabilityCss.includes(`#${id}.home-chapter`), `Visibility guard retained for #${id}`);
}
ok(packageJson.scripts.verify.includes('verify:surgical'), 'Surgical regression check runs in the normal verification chain');

console.log('SURGICAL LOGIC CHECK PASSED');
