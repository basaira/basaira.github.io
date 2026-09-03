import fs from 'node:fs';
const html = fs.readFileSync('index.html','utf8');
const css = fs.readFileSync('track-buttons-v6.css','utf8');
const js = fs.readFileSync('course-buttons-delight-v1.js','utf8');
const ctas = html.match(/<a[^>]+class=\"[^\"]*track-detail-cta-v6[^\"]*\"[^>]*>/g) || [];
if (ctas.length !== 15) throw new Error(`Expected 15 localized course CTA anchors, found ${ctas.length}`);
if (!html.includes('course-buttons-delight-v1.js')) throw new Error('Missing course-buttons-delight-v1.js in index.html');
if (!css.includes('course-btn-delight-discovered')) throw new Error('Delight discovery styles missing from protected CTA stylesheet');
if (!css.includes('course-btn-delight-activating')) throw new Error('Delight activation styles missing');
if (!js.includes('validWhatsappHref')) throw new Error('Safe WhatsApp validation missing');
const delightBlock = css.split('/* Impeccable Delight — course buttons')[1] || '';
for (const forbidden of ['width:', 'min-width:', 'max-width:', 'height:', 'min-height:', 'max-height:', 'padding:', 'margin:', 'grid-template-columns:']) {
  if (delightBlock.includes(forbidden)) throw new Error(`Delight layer must not change button geometry: ${forbidden}`);
}
const links = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"[^>]*>/g)].map((m)=>m[1]);
if (!links.length || !links.at(-1).startsWith('track-buttons-v6.css')) throw new Error('track-buttons-v6.css is not the final stylesheet');
console.log('COURSE BUTTONS DELIGHT CHECK PASSED (15/15 CTAs)');
