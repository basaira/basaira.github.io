import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (m) => { throw new Error(m); };
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');

const index = read('index.html');
const admin = read('admin.html');
const rootCss = read('final-polish-v3.css');
const acqCss = read('acquisition-final-polish-v3.css');
const adminCss = read('admin-final-polish-v3.css');

if (!index.includes('final-polish-v3.css?v=20260826-finalpolish3')) fail('Root final polish stylesheet missing.');
if (index.indexOf('final-polish-v3.css') > index.indexOf('track-buttons-v6.css')) fail('Root final polish must load before protected track buttons.');
if (!admin.includes('admin-final-polish-v3.css?v=20260826-finalpolish3')) fail('Admin final polish stylesheet missing.');
if (admin.indexOf('admin-final-polish-v3.css') > admin.indexOf('harden-v1.css')) fail('Admin final polish must load before harden-v1.css.');
if (rootCss.includes('.track-detail-cta-v6')) fail('Final polish must not take ownership of protected track CTA styles.');

const acquisitionPages = [];
for (const locale of ['en','ru','uz']) {
  const walk = (dir) => {
    for (const ent of fs.readdirSync(path.join(root,dir), {withFileTypes:true})) {
      const rel = path.join(dir,ent.name);
      if (ent.isDirectory()) walk(rel);
      else if (ent.name === 'index.html') {
        const html = read(rel);
        if (html.includes('acquisition.css')) acquisitionPages.push(rel.replaceAll('\\','/'));
      }
    }
  };
  walk(locale);
}
if (acquisitionPages.length !== 10) fail(`Expected 10 acquisition pages, found ${acquisitionPages.length}.`);
for (const page of acquisitionPages) {
  if (!read(page).includes('acquisition-final-polish-v3.css?v=20260826-finalpolish3')) fail(`${page} missing acquisition final polish.`);
}

for (const [name,css] of [['root',rootCss],['acquisition',acqCss],['admin',adminCss]]) {
  if (!css.includes('focus-visible')) fail(`${name} final polish lacks focus-visible treatment.`);
  if (!css.includes('prefers-reduced-motion')) fail(`${name} final polish lacks reduced-motion treatment.`);
  if (!css.includes('forced-colors')) fail(`${name} final polish lacks forced-colors treatment.`);
  if (/transition\s*:\s*all\b/i.test(css)) fail(`${name} final polish uses transition: all.`);
  if (/translateY\(\s*-/i.test(css)) fail(`${name} final polish reintroduces positional hover lift.`);
}

const allHtml = ['index.html','admin.html',...acquisitionPages];
for (const file of allHtml) {
  const html = read(file);
  const dir = path.dirname(path.join(root,file));
  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(ref) || ref.startsWith('//')) continue;
    const target = path.resolve(dir,ref);
    if (!fs.existsSync(target)) fail(`${file} missing local reference: ${ref}`);
  }
}

const cssFiles = fs.readdirSync(root).filter((n)=>n.endsWith('.css'));
for (const file of cssFiles) {
  const css = read(file);
  let depth=0;
  for (const ch of css) { if (ch==='{') depth++; else if (ch==='}') depth--; if (depth<0) fail(`${file} has unmatched }`); }
  if (depth!==0) fail(`${file} has unmatched CSS braces (${depth}).`);
}

console.log(`FINAL POLISH CHECK PASSED (${allHtml.length} HTML pages, ${cssFiles.length} root CSS files)`);
