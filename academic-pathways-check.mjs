import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('academic-pathways-v1.css','utf8');
const js=fs.readFileSync('course-cards-overdrive-v1.js','utf8');
const fail=(m)=>{throw new Error(m)};
if(!html.includes('academic-pathways-v1.css?v=20260830-pathways1')) fail('Academic pathways stylesheet is not linked');
const links=[...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"[^>]*rel="stylesheet"/g)].map(m=>m[1]);
if(links.at(-1)!=='track-buttons-v6.css?v=20260830-surgical2') fail('Protected track stylesheet must remain last');
if(links.indexOf('academic-pathways-v1.css?v=20260830-pathways1')>links.indexOf('track-buttons-v6.css?v=20260830-surgical2')) fail('Academic pathways CSS must load before protected CTA CSS');
if((html.match(/class="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start academic-pathway"/g)||[]).length!==3) fail('Expected exactly 3 refined academic pathways');
if((html.match(/class="pathway-reading-rail"/g)||[]).length!==3) fail('Expected one reading rail per pathway');
if((html.match(/data-content-id="/g)||[]).length!==1066) fail('CMS content ID count changed');
for(const token of ['view-timeline-name:--pathway-reading','animation-timeline:--pathway-reading','@media (prefers-reduced-motion:reduce)','counter-increment:pathway-stage']){
  if(!css.includes(token)) fail(`Missing ${token}`);
}
if(css.includes('#tracks .track-detail-cta-v6')) fail('Academic pathways CSS must not own protected CTA styling');
if(js.includes("card.setAttribute('role', 'button')")||js.includes("card.setAttribute('tabindex', '0')")) fail('Pathway summary must not become a nested interactive container');
if(!js.includes('IntersectionObserver')) fail('Viewport pathway activation missing');
console.log('academic-pathways-check: ok');
