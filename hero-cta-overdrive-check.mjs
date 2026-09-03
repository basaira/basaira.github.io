import fs from 'node:fs';
const html = fs.readFileSync('index.html','utf8');
const css = fs.readFileSync('hero-cta-overdrive-v1.css','utf8');
const js = fs.readFileSync('hero-cta-overdrive-v1.js','utf8');
const checks = [
  ['dual CTA group', html.includes('class="hero-cta-group"')],
  ['assessment primary CTA', html.includes('data-hero-cta="assessment"') && html.includes('href="#contact"')],
  ['guide secondary CTA', html.includes('data-hero-cta="guide"') && html.includes('href="#quick-guide"')],
  ['CTA CSS loaded', html.includes('hero-cta-overdrive-v1.css?v=20260829-herocta1')],
  ['CTA JS loaded', html.includes('hero-cta-overdrive-v1.js?v=20260829-herocta1')],
  ['protected CTA stylesheet last', [...html.matchAll(/<link[^>]+href=\"([^\"]+\.css[^\"]*)\"[^>]*rel=\"stylesheet\"/g)].map(m=>m[1]).at(-1) === 'track-buttons-v6.css?v=20260830-surgical2'],
  ['reduced motion fallback', css.includes('@media(prefers-reduced-motion:reduce)')],
  ['no looping infinite CTA animation', !/hero-cta[^\n{}]*animation[^;]*infinite/i.test(css)],
  ['native anchors not prevented', !js.includes('preventDefault')],
  ['pointer glow scoped', js.includes("querySelectorAll('.hero-cta')")],
];
for (const [name, ok] of checks) {
  if (!ok) throw new Error(`Hero CTA check failed: ${name}`);
  console.log(`✓ ${name}`);
}
console.log('HERO CTA OVERDRIVE CHECK PASSED');
