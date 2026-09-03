import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const fail=(m)=>{throw new Error(m)};
for(const token of ['hero-typeset-v2.css','hero-layout-v2.css','hero-overdrive-v2.css','hero-overdrive-v2.js','hero-shell','hero-copy-column','hero-visual-stage']){
  if(!html.includes(token)) fail(`Missing ${token}`);
}
const links=[...html.matchAll(/<link\s+[^>]*href="([^"]+\.css[^"]*)"[^>]*rel="stylesheet"[^>]*>/gi)].map(m=>m[1]);
if(links.at(-1)!=='track-buttons-v6.css?v=20260830-surgical2') fail(`Protected track stylesheet must stay last; found ${links.at(-1)}`);
const heroCss=['hero-typeset-v2.css','hero-layout-v2.css','hero-overdrive-v2.css'];
for(const name of heroCss){
  const css=fs.readFileSync(name,'utf8');
  if(!css.includes('#home')) fail(`${name} is not hero-scoped`);
  if(css.includes('#tracks .track-detail-cta-v6')) fail(`${name} must not own track CTA`);
}
console.log('HERO SECTION CHECK PASSED');
