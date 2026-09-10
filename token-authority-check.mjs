import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const manifest = JSON.parse(read("token-authority-manifest.json"));
const authority = read(manifest.authorityFile);
const design = read("DESIGN.md");
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const norm = (s) => String(s).trim().replace(/\s+/g, " ").toLowerCase();
const decls = (s) => [...stripComments(s).matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;}{]+?)\s*(?=;|})/g)].map(m => ({name:m[1],value:m[2].trim()}));
const fail = (s) => { throw new Error(`Token authority contract failed: ${s}`); };
const byName = new Map();
for (const d of decls(authority)) { if (!byName.has(d.name)) byName.set(d.name, []); byName.get(d.name).push(d.value); }

for (const [name, expected] of Object.entries(manifest.canonicalTokens)) {
  const vals = byName.get(name) || [];
  if (vals.length !== 1) fail(`${name} must be declared exactly once in ${manifest.authorityFile}; got ${vals.length}`);
  if (norm(vals[0]) !== norm(expected)) fail(`${name} differs from manifest: ${vals[0]} != ${expected}`);
}
for (const [name, expected] of Object.entries(manifest.designExplicit)) {
  if (!manifest.canonicalTokens[name]) fail(`DESIGN token ${name} is not canonical`);
  if (norm(manifest.canonicalTokens[name]) !== norm(expected)) fail(`${name} diverges from DESIGN mapping`);
  const d = norm(design).replace(/\s+/g, "");
  const e = norm(expected).replace(/\s+/g, "");
  if (!d.includes(e)) fail(`DESIGN.md no longer contains ${expected} for ${name}`);
}

const aliasMap = new Map();
for (const [legacy, meta] of Object.entries(manifest.aliases)) {
  if (!manifest.canonicalTokens[meta.canonical]) fail(`${legacy} points to missing canonical ${meta.canonical}`);
  const vals = byName.get(legacy) || [];
  if (vals.length !== 1) fail(`${legacy} must have one authority alias declaration; got ${vals.length}`);
  const target = vals[0].match(/^var\((--[A-Za-z0-9_-]+)\)$/)?.[1];
  if (target !== meta.canonical) fail(`${legacy} points to ${target || vals[0]}, expected ${meta.canonical}`);
  aliasMap.set(legacy,target);
}
for (const start of aliasMap.keys()) {
  const seen = new Set(); let cur=start;
  while (aliasMap.has(cur)) { if (seen.has(cur)) fail(`alias cycle from ${start}`); seen.add(cur); cur=aliasMap.get(cur); }
}

function walk(dir) {
  const out=[];
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
    const abs=path.join(dir,e.name);
    if (e.isDirectory()) out.push(...walk(abs)); else out.push(abs);
  }
  return out;
}
function resolveLocalCss(fromFile, href) {
  const clean=href.split("?")[0].split("#")[0];
  if (!clean || /^(?:https?:)?\/\//.test(clean) || clean.startsWith("data:")) return null;
  const abs=clean.startsWith("/") ? path.join(root,clean.slice(1)) : path.resolve(path.dirname(path.join(root,fromFile)),clean);
  if (!abs.startsWith(root) || !fs.existsSync(abs) || !abs.endsWith(".css")) return null;
  return path.relative(root,abs).replaceAll(path.sep,"/");
}
const productionCss=new Set();
for (const abs of walk(root).filter(f=>f.endsWith(".html"))) {
  const rel=path.relative(root,abs).replaceAll(path.sep,"/");
  const html=fs.readFileSync(abs,"utf8");
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const relAttr=tag.match(/\brel=["']([^"']+)["']/i)?.[1] || "";
    const href=tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href || !relAttr.toLowerCase().split(/\s+/).includes("stylesheet")) continue;
    const css=resolveLocalCss(rel,href); if (css) productionCss.add(css);
  }
}
// Follow local CSS @imports recursively (including tokens.css). Package imports such as tailwindcss are skipped.
let changed=true;
while (changed) {
  changed=false;
  for (const file of [...productionCss]) {
    const text=read(file);
    for (const m of text.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
      const href=m[1];
      if (!href.startsWith(".") && !href.startsWith("/")) continue;
      const css=resolveLocalCss(file,href);
      if (css && !productionCss.has(css)) { productionCss.add(css); changed=true; }
    }
  }
}
if (!productionCss.has(manifest.authorityFile)) fail(`${manifest.authorityFile} is not reachable from production CSS load points`);
const cssFiles=[...productionCss].filter(f=>f!==manifest.authorityFile).sort();
for (const file of cssFiles) {
  const defs = new Set(decls(read(file)).map(x=>x.name));
  for (const name of Object.keys(manifest.canonicalTokens)) if (defs.has(name)) fail(`canonical ${name} re-declared in production CSS ${file}`);
}

const allCss=[manifest.authorityFile,...cssFiles];
const allDefined=new Set();
for (const file of allCss) for (const d of decls(read(file))) allDefined.add(d.name);
for (const file of allCss) {
  for (const m of stripComments(read(file)).matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*(,\s*[^)]*)?\)/g)) {
    if (!m[2] && !allDefined.has(m[1])) fail(`undefined token ${m[1]} used without fallback in production CSS ${file}`);
  }
}

for (const name of Object.keys(manifest.canonicalTokens)) {
  if (manifest.componentLocalPrefixes.some(p=>name.startsWith(p))) fail(`component-local prefix promoted: ${name}`);
  if (manifest.componentLocalExplicit.includes(name)) fail(`component-local token promoted: ${name}`);
}
for (const file of ["index.css","acquisition.css","admin-ui-fixes-v1.css"]) {
  if (!read(file).startsWith('@import "./tokens.css";')) fail(`${file} must import tokens.css first`);
}
if (!fs.existsSync(path.join(root,"track-buttons-v6.css"))) fail("track-buttons-v6.css missing");
if (!read("animate-v1.css").includes("prefers-reduced-motion")) fail("prefers-reduced-motion contract missing");
if (!cssFiles.some(f=>/forced-colors/i.test(read(f)))) fail("forced-colors contract missing");
if (manifest.conflictDecisions.length !== 30 || new Set(manifest.conflictDecisions.map(x=>x.token)).size !== 30) fail("exact 30-conflict documentation contract broken");
console.log(`Token authority PASS: ${Object.keys(manifest.canonicalTokens).length} canonical, ${Object.keys(manifest.aliases).length} aliases, 30 conflicts documented.`);
