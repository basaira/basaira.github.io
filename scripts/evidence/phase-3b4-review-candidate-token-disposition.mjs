#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const args=Object.fromEntries(process.argv.slice(2).map((x)=>{const i=x.indexOf('=');return i<0?[x.slice(2),true]:[x.slice(2,i),x.slice(i+1)]}));
const SOURCE=path.resolve(args.source||process.cwd());
const OUT=path.resolve(args.out||'phase-3b4-static-inventory.json');
const CANDIDATES=['--course-btn-glow','--course-btn-press','--mobile-drawer-hidden-x','--layout-section-compact'];
const HISTORIC=['--dossier-accent','--dossier-border','--fo-bg','--fo-border','--fo-border-strong','--fo-danger-bg','--fo-muted','--fo-shadow','--fo-success-bg','--fo-surface','--fo-surface-strong','--fo-text','--folio-opacity'];
const ALL=[...CANDIDATES,...HISTORIC];
const SKIP=new Set(['.git','node_modules','dist']);
const norm=(p)=>p.split(path.sep).join('/');
const read=(f)=>fs.readFileSync(path.join(SOURCE,f),'utf8');
function walk(d=SOURCE){let out=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(SKIP.has(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())out.push(...walk(p));else out.push(norm(path.relative(SOURCE,p)));}return out;}
const files=walk();
const htmlFiles=files.filter((f)=>f.endsWith('.html')).sort();
const cssFiles=files.filter((f)=>f.endsWith('.css')).sort();
const jsFiles=files.filter((f)=>/\.(?:js|mjs|ts)$/.test(f)).sort();
const cssSet=new Set(cssFiles);
function attrs(tag){const o={},r=/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs;let m;while((m=r.exec(tag)))o[m[1].toLowerCase()]=m[3];return o;}
const cleanUrl=(u)=>u.split(/[?#]/)[0];
function resolveAsset(from,u){u=cleanUrl(String(u||'').trim());if(!u||/^(?:[a-z]+:)?\/\//i.test(u)||u.startsWith('data:'))return null;const base=u.startsWith('/')?'':path.posix.dirname(from);const p=path.posix.normalize(path.posix.join(base,u.replace(/^\/+/,''))).replace(/^\.\//,'');return cssSet.has(p)?p:null;}
function directStyles(h){const out=[];for(const tag of read(h).match(/<link\b[^>]*>/gi)||[]){const a=attrs(tag);if(!(a.rel||'').toLowerCase().split(/\s+/).includes('stylesheet')||!a.href)continue;const p=resolveAsset(h,a.href);if(p)out.push(p);}return out;}
function imports(c){const out=[],r=/@import\s+(?:url\(\s*)?(["'])(.*?)\1\s*\)?[^;]*;/gi;let m;const txt=read(c);while((m=r.exec(txt))){const p=resolveAsset(c,m[2]);if(p)out.push(p);}return out;}
const importGraph=Object.fromEntries(cssFiles.map((c)=>[c,imports(c)]));
function expand(list){const out=[];const seenStack=[];const visit=(c)=>{if(seenStack.includes(c))return;seenStack.push(c);for(const i of importGraph[c]||[])visit(i);seenStack.pop();out.push(c);};for(const c of list)visit(c);return out;}
const routes={};const prodCss=new Set();
for(const h of htmlFiles){const direct=directStyles(h),effective=expand(direct);effective.forEach((c)=>prodCss.add(c));routes[h]={route:h==='index.html'?'/':'/'+h.replace(/index\.html$/,''),direct,effective,surface:h==='admin.html'?'Admin':effective.includes('acquisition.css')?'Acquisition':'Public'};}
function specificity(sel){let a=0,b=0,c=0;try{selectorParser((root)=>root.walk((n)=>{if(n.type==='id')a++;else if(['class','attribute','pseudo'].includes(n.type)){if(n.type==='pseudo'&&n.value?.startsWith('::'))c++;else b++;}else if(n.type==='tag')c++;})).processSync(sel);}catch{}return[a,b,c];}
function atContext(node){const out=[];let p=node.parent;while(p&&p.type!=='root'){if(p.type==='atrule')out.unshift(`@${p.name} ${p.params}`.trim());p=p.parent;}return out;}
function routeReachability(file){if(file.includes('#inline-style-')){const h=file.split('#')[0];return routes[h]?[routes[h].route]:[];}return Object.values(routes).filter((r)=>r.effective.includes(file)).map((r)=>r.route);}
function surfaces(file){if(file.includes('#inline-style-')){const h=file.split('#')[0];return routes[h]?[routes[h].surface]:[];}return [...new Set(Object.values(routes).filter((r)=>r.effective.includes(file)).map((r)=>r.surface))];}
const result=Object.fromEntries(ALL.map((t)=>[t,{declarations:[],cssConsumers:[],runtimeConsumers:[],cssomMentions:[],breakpoints:[]}]))
let globalDeclOrder=0;
function processCssText(file,text){let root;try{root=postcss.parse(text,{from:file});}catch(e){return;}root.walkDecls((d)=>{const selector=d.parent?.type==='rule'?d.parent.selector:null;const ats=atContext(d);for(const token of ALL){if(d.prop===token){result[token].declarations.push({file,line:d.source?.start?.line||null,selector,atRules:ats,specificity:selector?specificity(selector):null,value:d.value,important:Boolean(d.important),declarationOrder:globalDeclOrder++,productionReachable:file.includes('#inline-style-')||prodCss.has(file),routes:routeReachability(file),surfaces:surfaces(file)});}if(String(d.value).includes(`var(${token}`)){result[token].cssConsumers.push({file,line:d.source?.start?.line||null,selector,atRules:ats,consumerProperty:d.prop,value:d.value,productionReachable:file.includes('#inline-style-')||prodCss.has(file),routes:routeReachability(file),surfaces:surfaces(file)});}}});root.walkAtRules('media',(a)=>{for(const token of ALL){let has=false;a.walkDecls((d)=>{if(d.prop===token||String(d.value).includes(`var(${token}`))has=true;});if(has)result[token].breakpoints.push({file,line:a.source?.start?.line||null,media:a.params,productionReachable:file.includes('#inline-style-')||prodCss.has(file),routes:routeReachability(file)});}});}
for(const c of cssFiles)processCssText(c,read(c));
for(const h of htmlFiles){let i=0;for(const m of read(h).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)){i++;processCssText(`${h}#inline-style-${i}`,m[1]);}}
function lineOf(s,idx){return s.slice(0,idx).split('\n').length;}
function snippetAt(s,idx){const lines=s.split('\n'),line=lineOf(s,idx);return lines.slice(Math.max(0,line-2),Math.min(lines.length,line+1)).join('\n').trim();}
for(const f of [...jsFiles,...htmlFiles]){const txt=read(f);for(const token of ALL){let pos=0;while((pos=txt.indexOf(token,pos))!==-1){const around=txt.slice(Math.max(0,pos-120),Math.min(txt.length,pos+180));let kind='mention';if(/setProperty\s*\(/.test(around))kind='setProperty';else if(/removeProperty\s*\(/.test(around))kind='removeProperty';else if(/getPropertyValue\s*\(/.test(around))kind='getPropertyValue';else if(/style\.cssText/.test(around))kind='style.cssText';const rec={file:f,line:lineOf(txt,pos),kind,snippet:snippetAt(txt,pos),productionReachable:true};if(kind==='setProperty'||kind==='removeProperty'||kind==='getPropertyValue'||kind==='style.cssText')result[token].runtimeConsumers.push(rec);else result[token].cssomMentions.push(rec);pos+=token.length;}}}
for(const token of ALL){for(const k of ['declarations','cssConsumers','runtimeConsumers','cssomMentions','breakpoints']){const seen=new Set();result[token][k]=result[token][k].filter((x)=>{const key=JSON.stringify(x);if(seen.has(key))return false;seen.add(key);return true;});}}
const summary={schemaVersion:1,phase:'3B-4',authoritativeSource:process.env.BASE_SHA||null,productionCssCount:prodCss.size,htmlEntryCount:htmlFiles.length,candidates:CANDIDATES,historicSanityTokens:HISTORIC,routes,productionCssFiles:[...prodCss].sort(),tokens:result};
fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(summary,null,2)+'\n');
console.log(`STATIC_INVENTORY_PASS entries=${htmlFiles.length} productionCss=${prodCss.size}`);
for(const token of CANDIDATES){const x=result[token];console.log(`${token} declarations=${x.declarations.length} cssConsumers=${x.cssConsumers.length} runtimeConsumers=${x.runtimeConsumers.length} mentions=${x.cssomMentions.length}`);for(const d of x.declarations)console.log(` OWNER ${token} ${d.file}:${d.line} ${d.selector||''} ${d.atRules.join(' | ')} = ${d.value} reachable=${d.productionReachable}`);for(const c of x.cssConsumers)console.log(` CONSUMER ${token} ${c.file}:${c.line} ${c.selector||''} ${c.consumerProperty}=${c.value}`);for(const r of x.runtimeConsumers)console.log(` RUNTIME ${token} ${r.file}:${r.line} ${r.kind}`);}
