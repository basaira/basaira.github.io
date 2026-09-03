import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const order=['quick-guide','about','tracks','video-library','testimonials','faq','contact'];
let last=-1;
for (const id of order){
  const idx=html.indexOf(`id="${id}"`);
  if(idx<0) throw new Error(`Missing homepage section #${id}`);
  if(idx<=last) throw new Error(`Homepage journey order invalid at #${id}`);
  last=idx;
}
for (let i=0;i<order.length;i++){
  const id=order[i];
  const num=String(i+1).padStart(2,'0');
  const rx=new RegExp(`<section[^>]*class="[^"]*home-chapter[^"]*"[^>]*data-home-chapter="${num}"[^>]*id="${id}"|<section[^>]*data-home-chapter="${num}"[^>]*class="[^"]*home-chapter[^"]*"[^>]*id="${id}"|<section[^>]*id="${id}"[^>]*class="[^"]*home-chapter[^"]*"[^>]*data-home-chapter="${num}"`);
  if(!rx.test(html)) throw new Error(`Missing chapter metadata for #${id}`);
}
if(!html.includes('homepage-sections-v1.css?v=20260829-home1')) throw new Error('Missing homepage stylesheet');
const links=[...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"[^>]*rel="stylesheet"/g)].map(m=>m[1]);
if(!links.length || links.at(-1)!=='track-buttons-v6.css?v=20260830-surgical2') throw new Error('Protected track stylesheet is not last');
if(links.indexOf('homepage-sections-v1.css?v=20260829-home1') > links.indexOf('track-buttons-v6.css?v=20260830-surgical2')) throw new Error('Homepage stylesheet must load before protected track stylesheet');
const cms=(html.match(/data-content-id="/g)||[]).length;
if(cms!==1066) throw new Error(`CMS content count changed: ${cms}`);
console.log('HOMEPAGE SECTIONS CHECK PASSED (7 chapters, 1066 homepage CMS IDs)');
