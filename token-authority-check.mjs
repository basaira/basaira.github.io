import fs from "node:fs";
import path from "node:path";
import posix from "node:path/posix";
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const manifest=JSON.parse(read("token-authority-manifest.json"));
const authority=read(manifest.authorityFile);
const design=read("DESIGN.md");
const bridges={B:"tokens-public-compat.css",C:"tokens-acquisition-compat.css",D:"tokens-admin-compat.css"};
const stripComments=(s)=>s.replace(/\/\*[\s\S]*?\*\//g,"");
const norm=(s)=>String(s).trim().replace(/\s*!important\s*$/i,"").replace(/\s+/g," ").toLowerCase();
const decls=(s)=>[...stripComments(s).matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;}{]+?)\s*(?=;|})/g)].map(m=>({name:m[1],value:m[2].trim()}));
const vars=(s)=>[...stripComments(s).matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*(,\s*[^)]*)?\)/g)].map(m=>({name:m[1],fallback:!!m[2]}));
const fail=(s)=>{throw new Error(`Token authority contract failed: ${s}`)};
const byName=new Map();
for(const d of decls(authority)){if(!byName.has(d.name))byName.set(d.name,[]);byName.get(d.name).push(d.value)}
for(const [name,expected] of Object.entries(manifest.canonicalTokens)){
  const vals=byName.get(name)||[];
  if(vals.length!==1)fail(`${name} must be declared exactly once in ${manifest.authorityFile}; got ${vals.length}`);
  if(norm(vals[0])!==norm(expected))fail(`${name} differs from manifest`);
}
for(const [name,expected] of Object.entries(manifest.designExplicit)){
  if(!manifest.canonicalTokens[name])fail(`DESIGN token ${name} is not canonical`);
  if(norm(manifest.canonicalTokens[name])!==norm(expected))fail(`${name} diverges from DESIGN mapping`);
  if(!norm(design).replace(/\s+/g,"").includes(norm(expected).replace(/\s+/g,"")))fail(`DESIGN.md no longer contains ${expected}`);
}
const allowed=new Set(["A","B","C","D","E"]);
const bridgeText=Object.fromEntries(Object.entries(bridges).map(([k,f])=>[k,read(f)]));
const bridgeDecls=Object.fromEntries(Object.entries(bridgeText).map(([k,t])=>[k,new Map(decls(t).map(d=>[d.name,d.value]))]));
const edge=new Map();
let globalAliasCount=0;
const classCounts={A:0,B:0,C:0,D:0,E:0};
for(const [legacy,meta] of Object.entries(manifest.aliases)){
  const c=meta.surfaceClassification;
  if(!allowed.has(c))fail(`${legacy} missing valid surfaceClassification`);
  classCounts[c]++;
  if(!manifest.canonicalTokens[meta.canonical])fail(`${legacy} points to missing canonical ${meta.canonical}`);
  const authVals=byName.get(legacy)||[];
  if(c==="A"){
    globalAliasCount++;
    if(authVals.length!==1)fail(`${legacy} class A must be global exactly once`);
    const target=authVals[0].match(/^var\((--[A-Za-z0-9_-]+)\)$/)?.[1];
    if(target!==meta.canonical)fail(`${legacy} global target mismatch`);
    edge.set(legacy,target);
    for(const [bc,m] of Object.entries(bridgeDecls))if(m.has(legacy))fail(`${legacy} class A leaked into bridge ${bc}`);
  } else {
    if(authVals.length)fail(`${legacy} class ${c} must not be globally bound in tokens.css`);
    if(c==="E"){
      const v=bridgeDecls.C.get(legacy); const target=v?.match(/^var\((--[A-Za-z0-9_-]+)\)$/)?.[1];
      if(target!==meta.canonical)fail(`${legacy} ambiguous acquisition binding mismatch`);
      if(bridgeDecls.B.has(legacy)||bridgeDecls.D.has(legacy))fail(`${legacy} ambiguous alias leaked into wrong bridge`);
      edge.set(legacy,target);
    } else {
      const expectedBridge=bridges[c]; const v=bridgeDecls[c].get(legacy); const target=v?.match(/^var\((--[A-Za-z0-9_-]+)\)$/)?.[1];
      if(target!==meta.canonical)fail(`${legacy} class ${c} missing/mismatched in ${expectedBridge}`);
      edge.set(legacy,target);
      for(const [bc,m] of Object.entries(bridgeDecls))if(bc!==c&&m.has(legacy))fail(`${legacy} class ${c} leaked into bridge ${bc}`);
    }
  }
}
for(const start of edge.keys()){const seen=new Set();let cur=start;while(edge.has(cur)){if(seen.has(cur))fail(`alias cycle from ${start}`);seen.add(cur);cur=edge.get(cur)}}
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(["node_modules","dist",".git"].includes(e.name))continue;const abs=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(abs));else out.push(abs)}return out}
const cssSet=new Set(walk(root).filter(f=>f.endsWith(".css")).map(f=>path.relative(root,f).replaceAll(path.sep,"/")));
function resolveCss(fromFile,href){const clean=href.split("?")[0].split("#")[0];if(!clean||/^(?:https?:)?\/\//.test(clean)||clean.startsWith("data:"))return null;const rel=clean.startsWith("/")?clean.slice(1):posix.normalize(posix.join(posix.dirname(fromFile),clean));return cssSet.has(rel)?rel:null}
const pages=[];
for(const abs of walk(root).filter(f=>f.endsWith(".html"))){
  const rel=path.relative(root,abs).replaceAll(path.sep,"/");const html=fs.readFileSync(abs,"utf8");const linked=[];
  for(const tag of html.match(/<link\b[^>]*>/gi)||[]){const ra=tag.match(/\brel=["']([^"']+)["']/i)?.[1]||"";const href=tag.match(/\bhref=["']([^"']+)["']/i)?.[1];if(!href||!ra.toLowerCase().split(/\s+/).includes("stylesheet"))continue;const c=resolveCss(rel,href);if(c)linked.push(c)}
  const loaded=new Set();const stack=[...linked];while(stack.length){const f=stack.shift();if(loaded.has(f))continue;loaded.add(f);for(const m of read(f).matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)){const href=m[1];if(!href.startsWith(".")&&!href.startsWith("/"))continue;const c=resolveCss(f,href);if(c&&!loaded.has(c))stack.push(c)}}
  const inline=[...(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi))].map((m,i)=>({source:`${rel}::<style#${i+1}>`,text:m[1]}));
  const surface=rel==="admin.html"||[...loaded].some(f=>/^admin(?:-|\.)/.test(posix.basename(f)))?"admin":[...loaded].some(f=>posix.basename(f)==="acquisition.css"||posix.basename(f).startsWith("acquisition-"))?"acquisition":"public";
  pages.push({rel,html,loaded,inline,surface});
}
if(!pages.some(p=>p.surface==="admin")||!pages.some(p=>p.surface==="acquisition")||!pages.some(p=>p.surface==="public"))fail("all three surface families must be discovered");
for(const p of pages)if(!p.loaded.has(manifest.authorityFile))fail(`${p.rel} cannot reach ${manifest.authorityFile}`);
const allProdCss=new Set(pages.flatMap(p=>[...p.loaded]));
for(const file of allProdCss){if(file===manifest.authorityFile)continue;const defs=new Set(decls(read(file)).map(x=>x.name));for(const n of Object.keys(manifest.canonicalTokens))if(defs.has(n))fail(`canonical ${n} re-declared in ${file}`)}
for(const p of pages)for(const block of p.inline){const defs=new Set(decls(block.text).map(x=>x.name));for(const n of Object.keys(manifest.canonicalTokens))if(defs.has(n))fail(`canonical ${n} re-declared inline at ${block.source}`)}
// Inline collision model: a class-A global alias may shadow inline only when resolved value contract is identical.
const resolveCanonical=(v)=>{const m=norm(v).match(/^var\((--[a-z0-9_-]+)\)$/);return m&&manifest.canonicalTokens[m[1]]?norm(manifest.canonicalTokens[m[1]]):norm(v)};
for(const [legacy,meta] of Object.entries(manifest.aliases)){
  const inlineDefs=pages.flatMap(p=>p.inline.flatMap(b=>decls(b.text).filter(d=>d.name===legacy).map(d=>({p,b,d}))));
  if(meta.surfaceClassification==="A"){
    const gv=(byName.get(legacy)||[])[0];for(const x of inlineDefs)if(resolveCanonical(gv)!==resolveCanonical(x.d.value))fail(`${legacy} global alias shadows different inline contract at ${x.b.source}`);
  }
  if(meta.surfaceClassification==="E"){
    const adminDefs=inlineDefs.filter(x=>x.p.surface==="admin");if(!adminDefs.length)fail(`${legacy} ambiguous alias lost Admin inline owner`);
    const expected=meta.surfaceBindings?.admin?.value;if(!expected||!adminDefs.some(x=>norm(x.d.value)===norm(expected)))fail(`${legacy} Admin inline value drifted`);
  }
}
// Undefined vars are checked per production page, including inline style blocks.
for(const p of pages){const sources=[...p.loaded].map(f=>read(f)).concat(p.inline.map(x=>x.text));const defined=new Set(sources.flatMap(t=>decls(t).map(d=>d.name)));for(const t of sources)for(const v of vars(t))if(!v.fallback&&!defined.has(v.name))fail(`undefined ${v.name} without fallback on ${p.rel}`)}
for(const n of Object.keys(manifest.canonicalTokens)){if(manifest.componentLocalPrefixes.some(p=>n.startsWith(p)))fail(`component-local prefix promoted: ${n}`);if(manifest.componentLocalExplicit.includes(n))fail(`component-local token promoted: ${n}`)}
if(!read("animate-v1.css").includes("prefers-reduced-motion"))fail("prefers-reduced-motion contract missing");
if(![...allProdCss].some(f=>/forced-colors/i.test(read(f))))fail("forced-colors contract missing");
if(!fs.existsSync(path.join(root,"track-buttons-v6.css")))fail("track-buttons-v6.css missing");
// Exhaustive corrected conflict inventory: external production CSS + inline styles, deduped by source.
const auditBy=new Map();const add=(src,text)=>{for(const d of decls(text)){if(!auditBy.has(d.name))auditBy.set(d.name,[]);auditBy.get(d.name).push({src,value:d.value})}};
for(const f of [...allProdCss].sort())add(f,read(f));for(const p of pages)for(const b of p.inline)add(b.source,b.text);
const actual=[...auditBy.entries()].filter(([n,xs])=>new Set(xs.map(x=>resolveCanonical(x.value))).size>1).map(([n])=>n).sort();
const declared=[...(manifest.correctedAuditScope?.conflictTokens||[])].sort();
if(JSON.stringify(actual)!==JSON.stringify(declared))fail(`corrected conflict inventory drift: actual ${actual.length}, manifest ${declared.length}`);
if(manifest.correctedAuditScope.productionCssFileCount!==allProdCss.size)fail("corrected production CSS scope count drift");
const inlineCount=pages.reduce((n,p)=>n+p.inline.length,0);if(manifest.correctedAuditScope.inlineStyleBlockCount!==inlineCount)fail("corrected inline-style scope count drift");
if(!manifest.correctedAuditScope.includesInlineStyleBlocks)fail("inline-style audit scope disabled");
if(manifest.conflictDecisions.length!==30)fail("historical 30 migration decisions changed unexpectedly");
console.log(`Token authority PASS: ${Object.keys(manifest.canonicalTokens).length} canonical; aliases A/B/C/D/E=${classCounts.A}/${classCounts.B}/${classCounts.C}/${classCounts.D}/${classCounts.E}; corrected conflicts=${actual.length}; production CSS=${allProdCss.size}; inline styles=${inlineCount}.`);
