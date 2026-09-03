import fs from 'node:fs';

const html = fs.readFileSync('index.html','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const required = [
  'hero-delight-v4.css',
  'hero-animate-v4.css',
  'hero-polish-v4.css',
  'hero-delight-v4.js',
  'track-buttons-v6.css?v=20260830-surgical2'
];
for(const token of required){
  if(!html.includes(token)) throw new Error(`Missing ${token} in index.html`);
}
for(const old of ['hero-delight-v3.css','hero-animate-v3.css','hero-polish-v3.css','hero-delight-v3.js']){
  if(html.includes(old)) throw new Error(`Legacy hero final layer still loaded: ${old}`);
}
const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^\"]*)"[^>]*>/g)].map(m=>m[1]);
if(!styles.length || !styles.at(-1)?.startsWith('track-buttons-v6.css')){
  throw new Error('track-buttons-v6.css must remain the final stylesheet');
}
for(const file of ['hero-delight-v4.css','hero-animate-v4.css','hero-polish-v4.css']){
  const css=fs.readFileSync(file,'utf8');
  const opens=(css.match(/\{/g)||[]).length;
  const closes=(css.match(/\}/g)||[]).length;
  if(opens!==closes) throw new Error(`${file}: brace mismatch ${opens}/${closes}`);
}
if(!pkg.scripts?.['verify:hero-final-v4']) throw new Error('Missing verify:hero-final-v4 script');
console.log('HERO DELIGHT + ANIMATE + POLISH v4 CHECK PASSED');
