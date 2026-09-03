import fs from 'node:fs';

const html = fs.readFileSync('index.html','utf8');
const cssFiles = ['hero-delight-v3.css','hero-animate-v3.css','hero-polish-v3.css'];
const jsFile = 'hero-delight-v3.js';
for(const file of [...cssFiles,jsFile]){
  if(!html.includes(file)) throw new Error(`Missing ${file} in index.html`);
}
const track = 'track-buttons-v6.css?v=20260830-surgical2';
if(!html.includes(track)) throw new Error('Protected track stylesheet cache key changed or missing.');
const lastStylesheet = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"[^>]*rel="stylesheet"[^>]*>/g)].at(-1)?.[1] || '';
if(lastStylesheet !== track) throw new Error(`track-buttons-v6.css must remain last stylesheet; got ${lastStylesheet}`);
if(!html.includes('class="hero-primary-cta')) throw new Error('Hero CTA missing.');
if(!html.includes('class="hero-visual-stage')) throw new Error('Hero visual stage missing.');
if(!html.includes('class="hero-kicker')) throw new Error('Hero kicker missing.');
const polish = fs.readFileSync('hero-polish-v3.css','utf8');
if(polish.includes('#tracks .track-detail-cta-v6')) throw new Error('Hero polish must not own course buttons.');
const animate = fs.readFileSync('hero-animate-v3.css','utf8');
if(!animate.includes('prefers-reduced-motion')) throw new Error('Reduced motion fallback missing.');
console.log('HERO DELIGHT + ANIMATE + POLISH CHECK PASSED');
