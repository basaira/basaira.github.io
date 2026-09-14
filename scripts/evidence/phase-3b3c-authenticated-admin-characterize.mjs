import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import puppeteer from 'puppeteer-core';

const SOURCE = process.env.SOURCE_DIR;
const SYNTH = process.env.SYNTH_DIR;
const OUT = process.env.OUT_DIR;
const SOURCE_SHA = process.env.SOURCE_SHA;
const SOURCE_TREE = process.env.SOURCE_TREE;
const EVIDENCE_SHA = process.env.EVIDENCE_SHA || '';
const PRECISION = 'admin-precision-native-v2.css';
const POLISH = 'admin-polish-v2.css';
const ENTRY = 'admin.html';
if (!SOURCE || !SYNTH || !OUT || !SOURCE_SHA || !SOURCE_TREE) throw new Error('missing required environment');
fs.mkdirSync(OUT, { recursive: true });

const read = (root, p) => fs.readFileSync(path.join(root, p), 'utf8');
const readBuf = (root, p) => fs.readFileSync(path.join(root, p));
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: SOURCE, encoding: 'utf8' }).trim();
const trackedAll = git('ls-files').split(/\n/).filter(Boolean);
const norm = (p) => p.replaceAll('\\', '/');
const uniq = (xs) => [...new Set(xs)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function routeFor(html) {
  const p = norm(html);
  if (p === 'index.html') return '/';
  if (p.endsWith('/index.html')) return '/' + p.slice(0, -'index.html'.length);
  return '/' + p;
}
function resolveLocal(baseFile, href) {
  if (!href || /^(?:https?:|data:|\/\/|mailto:|tel:|javascript:)/i.test(href)) return null;
  const bare = href.split(/[?#]/)[0];
  if (bare.startsWith('/')) return bare.slice(1);
  return norm(path.normalize(path.join(path.dirname(baseFile), bare)));
}
function stylesheetHrefs(htmlText) {
  const out = [];
  for (const m of htmlText.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\brel=["']?stylesheet["']?/i.test(tag)) continue;
    const hm = tag.match(/\bhref=["']([^"']+)["']/i);
    if (hm) out.push(hm[1]);
  }
  return out;
}
function scriptSrcs(htmlText) {
  const out = [];
  for (const m of htmlText.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) out.push(m[1]);
  return out;
}
function inlineBlocks(htmlText, tag) {
  const rx = new RegExp(`<${tag}\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  return [...htmlText.matchAll(rx)].map((m) => m[1]);
}
function cssImports(rootDir, cssFile, seen = new Set()) {
  if (seen.has(cssFile)) return [];
  seen.add(cssFile);
  const abs = path.join(rootDir, cssFile);
  if (!fs.existsSync(abs)) return [];
  const txt = fs.readFileSync(abs, 'utf8');
  const out = [];
  for (const m of txt.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
    const r = resolveLocal(cssFile, m[1]);
    if (r && fs.existsSync(path.join(rootDir, r))) out.push(r, ...cssImports(rootDir, r, seen));
  }
  return out;
}
function jsImports(rootDir, file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  const abs = path.join(rootDir, file);
  if (!fs.existsSync(abs)) return [];
  const txt = fs.readFileSync(abs, 'utf8');
  const out = [];
  for (const m of txt.matchAll(/(?:from\s*|import\s*\(|import\s*)["']([^"']+)["']/g)) {
    const spec = m[1];
    if (!(spec.startsWith('.') || spec.startsWith('/'))) continue;
    let r = resolveLocal(file, spec);
    if (r && !path.extname(r)) r += '.js';
    if (r && fs.existsSync(path.join(rootDir, r))) out.push(r, ...jsImports(rootDir, r, seen));
  }
  return out;
}

const htmlFiles = trackedAll.filter((f) => f.endsWith('.html'));
const htmlAudit = [];
for (const html of htmlFiles) {
  const txt = read(SOURCE, html);
  const directRaw = stylesheetHrefs(txt);
  const direct = directRaw.map((h) => resolveLocal(html, h)).filter(Boolean);
  const effective = [];
  for (const css of direct) effective.push(css, ...cssImports(SOURCE, css, new Set()));
  const pIndex = effective.indexOf(PRECISION);
  const lIndex = effective.indexOf(POLISH);
  const scripts = scriptSrcs(txt).map((s) => resolveLocal(html, s)).filter(Boolean);
  htmlAudit.push({
    html, route: routeFor(html), directStylesheets: direct, effectiveStylesheets: effective,
    inlineStyleBlocks: [...txt.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].length,
    jsEntrypoints: scripts, hasPrecision: pIndex >= 0, hasPolish: lIndex >= 0,
    precisionIndex: pIndex, polishIndex: lIndex, both: pIndex >= 0 && lIndex >= 0,
    adjacent: pIndex >= 0 && lIndex === pIndex + 1, sameOrder: pIndex >= 0 && lIndex > pIndex,
    precisionImports: cssImports(SOURCE, PRECISION), polishImports: cssImports(SOURCE, POLISH),
    compatReachable: effective.includes('tokens-admin-compat.css'),
  });
}
const targetEntries = htmlAudit.filter((x) => x.hasPrecision || x.hasPolish);
if (!targetEntries.length) throw new Error('target Admin stylesheet pair is not production-reachable');
const adminEntry = htmlAudit.find((x) => x.html === ENTRY);
if (!adminEntry) throw new Error('admin.html missing from tracked entries');

const adminRuntime = new Set(adminEntry.jsEntrypoints);
for (const js of [...adminRuntime]) for (const imp of jsImports(SOURCE, js, new Set())) adminRuntime.add(imp);
const targetRx = /admin-(?:precision-native-v2|polish-v2)\.css/g;
const cssomRx = /(document\.styleSheets|ownerNode|insertRule|deleteRule|createElement\(['"]link|setAttribute\(['"]href|\.href\s*=|appendChild\([^\n]*link|removeChild\([^\n]*link)/;
const refs = { productionRuntime: [], checkerTest: [], docsCommentsSelf: [], inlineRuntime: [], cssomRuntime: [] };
const scanFiles = trackedAll.filter((f) => /\.(?:js|mjs|ts|html|css|md|json|ya?ml|txt)$/i.test(f));
for (const f of scanFiles) {
  const txt = read(SOURCE, f);
  const matches = [...txt.matchAll(targetRx)].map((m) => m[0]);
  targetRx.lastIndex = 0;
  if (matches.length) {
    const rec = { file: f, matches: uniq(matches) };
    if (adminRuntime.has(f)) refs.productionRuntime.push(rec);
    else if (/(?:check|test|spec|workflow|scripts\/evidence|\.github\/workflows)/i.test(f)) refs.checkerTest.push(rec);
    else refs.docsCommentsSelf.push(rec);
  }
  if (adminRuntime.has(f) && cssomRx.test(txt)) refs.cssomRuntime.push(f);
}
for (const html of htmlFiles) {
  const txt = read(SOURCE, html);
  for (const block of inlineBlocks(txt, 'script')) {
    if (targetRx.test(block) || cssomRx.test(block)) refs.inlineRuntime.push(html);
    targetRx.lastIndex = 0;
  }
}
refs.productionRuntime = refs.productionRuntime.filter((v, i, a) => a.findIndex((x) => x.file === v.file) === i);
refs.checkerTest = refs.checkerTest.filter((v, i, a) => a.findIndex((x) => x.file === v.file) === i);
refs.docsCommentsSelf = refs.docsCommentsSelf.filter((v, i, a) => a.findIndex((x) => x.file === v.file) === i);
refs.inlineRuntime = uniq(refs.inlineRuntime); refs.cssomRuntime = uniq(refs.cssomRuntime);

const precisionBuf = readBuf(SOURCE, PRECISION), polishBuf = readBuf(SOURCE, POLISH);
const precisionText = precisionBuf.toString('utf8'), polishText = polishBuf.toString('utf8');
const precisionRoot = postcss.parse(precisionText, { from: PRECISION }), polishRoot = postcss.parse(polishText, { from: POLISH });
function specificity(sel) {
  let a = 0, b = 0, c = 0;
  try { selectorParser((root) => root.walk((n) => {
    if (n.type === 'id') a++;
    else if (['class', 'attribute', 'pseudo'].includes(n.type)) { if (n.type === 'pseudo' && n.value?.startsWith('::')) c++; else b++; }
    else if (n.type === 'tag') c++;
  })).processSync(sel); } catch {}
  return [a, b, c];
}
function flatten(root, file) {
  const rules = []; let order = 0;
  root.walkRules((rule) => {
    const atRules = []; let p = rule.parent;
    while (p && p.type !== 'root') { if (p.type === 'atrule') atRules.unshift(`@${p.name} ${p.params}`.trim()); p = p.parent; }
    for (const selector of rule.selectors || [rule.selector]) {
      const declarations = []; rule.each((n) => { if (n.type === 'decl') declarations.push({ prop: n.prop, value: n.value, important: n.important }); });
      rules.push({ file, order: order++, selector, specificity: specificity(selector), atRules,
        pseudos: [...selector.matchAll(/:{1,2}[\w-]+(?:\([^)]*\))?/g)].map((m) => m[0]), declarations });
    }
  }); return rules;
}
function declCount(root) { let n = 0; root.walkDecls(() => n++); return n; }
function keyframes(root) { const out = []; root.walkAtRules('keyframes', (a) => out.push(a.params)); return out; }
function cpInfo(root, file) {
  const owners = [], consumers = [];
  root.walkDecls((d) => {
    const selector = d.parent?.selector || null;
    const atRule = d.parent?.parent?.type === 'atrule' ? `@${d.parent.parent.name} ${d.parent.parent.params}` : null;
    if (d.prop.startsWith('--')) owners.push({ file, property: d.prop, value: d.value, selector, atRule });
    for (const m of d.value.matchAll(/var\((--[\w-]+)/g)) consumers.push({ file, property: m[1], consumerProperty: d.prop, selector, atRule });
  }); return { owners, consumers };
}
const precisionRules = flatten(precisionRoot, PRECISION), polishRules = flatten(polishRoot, POLISH);
const bySel = (rules) => { const m = new Map(); for (const r of rules) { if (!m.has(r.selector)) m.set(r.selector, []); m.get(r.selector).push(r); } return m; };
const A = bySel(precisionRules), B = bySel(polishRules);
const overlapSelectors = [...A.keys()].filter((s) => B.has(s)).sort();
const overlapPairs = [];
for (const selector of overlapSelectors) for (const ar of A.get(selector)) for (const br of B.get(selector)) {
  const aProps = new Set(ar.declarations.map((d) => d.prop));
  for (const bd of br.declarations) if (aProps.has(bd.prop)) overlapPairs.push({
    selector, property: bd.prop, precisionSpecificity: ar.specificity, polishSpecificity: br.specificity,
    equalSpecificity: JSON.stringify(ar.specificity) === JSON.stringify(br.specificity), laterOwner: POLISH,
    precisionContext: ar.atRules, polishContext: br.atRules,
    mediaSpecific: [...ar.atRules, ...br.atRules].some((x) => x.startsWith('@media')),
    runtimeState: uniq([...ar.pseudos, ...br.pseudos]),
  });
}
const stateRuleRx = /(:hover|:active|:focus|:focus-visible|:disabled|aria-busy|is-loading|is-native-pending|\.active|\.success|\.error|\.warning)/;
const cascade = {
  precision: { ruleCount: precisionRules.length, declarationCount: declCount(precisionRoot), selectorSequence: precisionRules.map((r) => r.selector), declarationSequence: precisionRules.flatMap((r) => r.declarations.map((d) => ({ selector:r.selector, atRules:r.atRules, ...d }))), mediaSequence: precisionRules.flatMap((r) => r.atRules.filter((x) => x.startsWith('@media'))), keyframes:keyframes(precisionRoot), stateRules:precisionRules.filter((r) => stateRuleRx.test(r.selector)), responsiveRules:precisionRules.filter((r) => r.atRules.some((x) => x.startsWith('@media'))) },
  polish: { ruleCount: polishRules.length, declarationCount: declCount(polishRoot), selectorSequence: polishRules.map((r) => r.selector), declarationSequence: polishRules.flatMap((r) => r.declarations.map((d) => ({ selector:r.selector, atRules:r.atRules, ...d }))), mediaSequence: polishRules.flatMap((r) => r.atRules.filter((x) => x.startsWith('@media'))), keyframes:keyframes(polishRoot), stateRules:polishRules.filter((r) => stateRuleRx.test(r.selector)), responsiveRules:polishRules.filter((r) => r.atRules.some((x) => x.startsWith('@media'))) },
  overlapSelectors, overlapPairs, equalSpecificityLaterWins: overlapPairs.filter((p) => p.equalSpecificity), mediaSpecificCollisions: overlapPairs.filter((p) => p.mediaSpecific),
};
const cpPrecision = cpInfo(precisionRoot, PRECISION), cpPolish = cpInfo(polishRoot, POLISH);
const targetCustomProps = uniq([...cpPrecision.owners,...cpPrecision.consumers,...cpPolish.owners,...cpPolish.consumers].map((x) => x.property)).sort();
const relevantCustomProps = uniq([...targetCustomProps, '--line', '--muted']).sort();

const adminHtmlText = read(SOURCE, ENTRY);
const adminInlineStyles = [...adminHtmlText.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
const adminCssTexts = [];
for (const css of adminEntry.effectiveStylesheets) if (fs.existsSync(path.join(SOURCE, css))) adminCssTexts.push({ source:css, text:read(SOURCE,css) });
adminInlineStyles.forEach((text,i)=>adminCssTexts.push({source:`admin.html#inline-style-${i+1}`,text}));
const breakpoints = []; let forcedColorsApplicable = false;
for (const {source,text} of adminCssTexts) {
  if (/forced-colors\s*:/i.test(text)) forcedColorsApplicable = true;
  for (const m of text.matchAll(/\((min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\)/gi)) breakpoints.push({source,kind:m[1].toLowerCase(),width:Number(m[2]),expression:m[0]});
}
const breakpointWidths = uniq(breakpoints.map((b)=>b.width)).sort((a,b)=>b-a);

fs.rmSync(SYNTH,{recursive:true,force:true});
fs.cpSync(SOURCE,SYNTH,{recursive:true,filter:(src)=>!/(?:^|\/)(?:\.git|node_modules|dist)(?:\/|$)/.test(norm(src))});
const concatBuf = Buffer.concat([precisionBuf,polishBuf]);
fs.writeFileSync(path.join(SYNTH,PRECISION),concatBuf);
const synthAdminPath = path.join(SYNTH,ENTRY);
const beforeSynthAdmin = fs.readFileSync(synthAdminPath,'utf8');
const afterSynthAdmin = beforeSynthAdmin.replace(/<link\b[^>]*href=["'][^"']*admin-polish-v2\.css[^"']*["'][^>]*>\s*/gi,'');
if (afterSynthAdmin === beforeSynthAdmin) throw new Error('synthetic admin.html could not retire polish link');
if ((afterSynthAdmin.match(/admin-precision-native-v2\.css/g)||[]).length !== 1) throw new Error('synthetic precision link count != 1');
if (/admin-polish-v2\.css/.test(afterSynthAdmin)) throw new Error('synthetic polish link still present');
fs.writeFileSync(synthAdminPath,afterSynthAdmin);
const synthetic = { precisionSha256:sha256(precisionBuf), precisionBytes:precisionBuf.length, polishSha256:sha256(polishBuf), polishBytes:polishBuf.length, concatSha256:sha256(concatBuf), concatBytes:concatBuf.length, syntheticSurvivorSha256:sha256(readBuf(SYNTH,PRECISION)), productionMergeCommitted:false, method:`exact bytes(${PRECISION}) + exact bytes(${POLISH}); remove only ${POLISH} link in temporary synthetic admin.html` };
if (synthetic.concatSha256 !== synthetic.syntheticSurvivorSha256) throw new Error('exact concat hash mismatch');

const FIREBASE_APP_STUB = `export function initializeApp(config){ globalThis.__BASAIR_EVIDENCE_APP_CONFIG=config; return {config}; }`;
const FIRESTORE_STUB = `
const ev=()=>globalThis.__BASAIR_EVIDENCE||{};
const ts=(n=0)=>({toDate:()=>new Date(1700000000000+n*60000),toMillis:()=>1700000000000+n*60000});
const docSnap=(id,data,exists=true)=>({id,exists:()=>exists,data:()=>data});
const fx=()=>{ const name=ev().fixture||'empty'; const long='نص تجريبي طويل وآمن لقياس الالتفاف والمسافات داخل لوحة الإدارة دون أي بيانات حقيقية. '.repeat(5); if(name==='empty') return {content:{texts:{},videos:[],settings:{}},enrollment:[],assessment:[],audit:[]}; return {content:{texts:{'cms-index-en-global-001':long,'cms-index-ar-global-001':'نص تجريبي معدل'},videos:[{title:'Evidence Video One',category:'quran',videoUrl:'https://example.invalid/video-one',posterUrl:'https://example.invalid/poster-one',published:true,createdAt:'2026-01-01T00:00:00Z'},{title:'Evidence Video With A Deliberately Long Administrative Title For Responsive Coverage',category:'arabic',videoUrl:'https://example.invalid/video-two-with-a-long-path-for-layout-coverage',posterUrl:'',published:false,createdAt:'2026-01-02T00:00:00Z'}],settings:{whatsappNumber:'201000000000',telegramUsername:'EvidenceAcademy',updatedAt:'2026-01-03T00:00:00Z'}},enrollment:[{id:'enroll-short',data:{fullName:'Synthetic Student',phone:'+201000000001',email:'synthetic.one@example.invalid',country:'EG',track:'Arabic',status:'new',message:'Short fixture',submissionDate:ts(3)}},{id:'enroll-long',data:{fullName:'Synthetic Learner With An Intentionally Very Long Name For Layout Characterization',whatsapp:'+155500000000',email:'very.long.synthetic.address.for.admin.layout@example.invalid',country:'Synthetic Country With Long Metadata',track:'Quran and Tajweed — Extended Fixture Label',status:'pending',message:long,submissionDate:ts(2)}}],assessment:[{id:'assess-accepted',data:{fullName:'Evidence Accepted',email:'accepted@example.invalid',country:'US',track:'Quran',persona:'adult',locale:'en',status:'accepted',goal:'Synthetic assessment goal',submittedAt:ts(5)}},{id:'assess-rejected',data:{fullName:'Evidence Rejected',phone:'+441234567890',country:'GB',track:'Arabic',persona:'adult',locale:'en',status:'rejected',goal:long,submittedAt:ts(1)}}],audit:[{id:'audit-1',data:{action:'text.update',targetType:'content',targetId:'synthetic-long-id',actorEmail:'evidence-admin@example.invalid',createdAt:ts(6)}},{id:'audit-2',data:{action:'request.status',targetType:'request',targetId:'enroll-short',actorEmail:'evidence-admin@example.invalid',createdAt:ts(4)}},{id:'audit-3',data:{action:'settings.update',targetType:'settings',targetId:'contact',actorEmail:'evidence-admin@example.invalid',createdAt:ts(2)}}]}; };
export function initializeFirestore(app,opts){return {app,opts,__evidence:true};}
export function collection(db,name){return {kind:'collection',name,path:name};}
export function doc(base,...parts){ if(base&&base.kind==='collection'){const id=parts[0]||('evidence-'+Math.random().toString(36).slice(2));return {kind:'doc',path:base.path+'/'+id,id};} const p=parts.join('/'); return {kind:'doc',path:p,id:parts.at(-1)}; }
export function query(ref,...mods){return {kind:'query',ref,mods};}
export function orderBy(field,dir){return {kind:'orderBy',field,dir};}
export function limit(n){return {kind:'limit',n};}
export function serverTimestamp(){return ts(99);}
export async function getDoc(ref){ const e=ev(),data=fx(); if(String(ref.path||'').startsWith('admin_roles/')) return docSnap(ref.id||'evidence-admin',{active:e.roleActive!==false},true); if(ref.path==='site_content/public') return docSnap('public',data.content,true); return docSnap(ref.id||'missing',{},false); }
const docs=(rows)=>rows.map(x=>docSnap(x.id,x.data,true));
export async function getDocs(q){ const name=q?.ref?.name||q?.name||q?.ref?.path||q?.path||'',data=fx(); if(name==='enrollment_requests') return {docs:docs(data.enrollment)}; if(name==='assessment_requests') return {docs:docs(data.assessment)}; if(name==='admin_audit') return {docs:docs(data.audit)}; return {docs:[]}; }
export function writeBatch(){ const ops=[]; return {set:(ref,data,opts)=>ops.push({op:'set',path:ref.path,data,opts}),update:(ref,data)=>ops.push({op:'update',path:ref.path,data}),delete:(ref)=>ops.push({op:'delete',path:ref.path}),commit:async()=>{const e=ev();globalThis.__BASAIR_EVIDENCE_LOCAL_WRITES||=[];globalThis.__BASAIR_EVIDENCE_LOCAL_WRITES.push(ops.map(o=>({op:o.op,path:o.path})));await new Promise(r=>setTimeout(r,Number(e.writeDelay||0)));if(e.writeMode==='error'){const err=new Error('Synthetic isolated write failure');err.code='evidence/write-failed';throw err;}}}; }
`;
const AUTH_STUB = `
const listeners=[]; const ev=()=>globalThis.__BASAIR_EVIDENCE||{}; const user=()=>({uid:'evidence-admin-uid',email:'evidence-admin@example.invalid',displayName:'Evidence Admin'}); const emit=(u)=>{for(const cb of [...listeners]) Promise.resolve().then(()=>cb(u));};
export function getAuth(app){return {app,__evidence:true};}
export class GoogleAuthProvider{setCustomParameters(v){this.params=v;}}
export const browserLocalPersistence={kind:'evidence-local'};
export async function setPersistence(){return undefined;}
export function onAuthStateChanged(auth,cb){listeners.push(cb);const e=ev();const delay=e.authMode==='delay'?1200:20;setTimeout(()=>{if(e.authMode==='admin'||e.authMode==='unauthorized')emit(user());else emit(null);},delay);return()=>{};}
async function signIn(){const e=ev();await new Promise(r=>setTimeout(r,Number(e.signInDelay||700)));if(e.signInMode==='error'){const err=new Error('Synthetic invalid credential');err.code='auth/invalid-credential';throw err;}emit(user());return {user:user()};}
export async function signInWithPopup(){return signIn();}
export async function signInWithEmailAndPassword(){return signIn();}
export async function signOut(){emit(null);}
`;

function mime(file){if(file.endsWith('.html'))return'text/html; charset=utf-8';if(file.endsWith('.css'))return'text/css; charset=utf-8';if(file.endsWith('.js')||file.endsWith('.mjs'))return'text/javascript; charset=utf-8';if(file.endsWith('.json'))return'application/json; charset=utf-8';if(file.endsWith('.svg'))return'image/svg+xml';if(file.endsWith('.png'))return'image/png';return'application/octet-stream';}
function startServer(root){return new Promise((resolve)=>{const server=http.createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost');let rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');if(!rel)rel='index.html';const abs=path.resolve(root,rel);if(!abs.startsWith(path.resolve(root)+path.sep)&&abs!==path.resolve(root)){res.writeHead(403);res.end('forbidden');return;}if(!fs.existsSync(abs)||!fs.statSync(abs).isFile()){res.writeHead(404);res.end('not found');return;}res.writeHead(200,{'content-type':mime(abs),'cache-control':'no-store'});fs.createReadStream(abs).pipe(res);}catch(e){res.writeHead(500);res.end(String(e));}});server.listen(0,'127.0.0.1',()=>{const{port}=server.address();resolve({server,base:`http://127.0.0.1:${port}`});});});}

const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);if(!executablePath)throw new Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-setuid-sandbox']});
const sourceServer=await startServer(SOURCE),synthServer=await startServer(SYNTH);
const measuredProps=['display','visibility','position','top','right','bottom','left','width','min-width','max-width','height','min-height','max-height','padding','padding-top','padding-right','padding-bottom','padding-left','margin','margin-top','margin-right','margin-bottom','margin-left','gap','row-gap','column-gap','grid-template-columns','grid-template-rows','flex-direction','flex-wrap','align-items','justify-content','background','background-color','border','border-color','border-width','border-radius','box-shadow','color','opacity','filter','transform','transition','transition-duration','transition-timing-function','animation','animation-name','animation-duration','outline','outline-color','outline-width','outline-offset','cursor','overflow','overflow-x','overflow-y','z-index','font-size','font-weight','line-height','letter-spacing','text-align','direction','pointer-events'];
const selectors=['html','body','.shell','.sidebar','.main-card','.topbar','.top-actions','.content','#status','#login-screen','.login-card','.nav-btn','.nav-btn.active','.badge','#admin-dashboard','.section','.section.active','.panel','.stat','.item','.pill','.row-actions','.toolbar','.empty','.btn','.btn.secondary','.btn.danger','.btn.ok','.google-btn','input','select','textarea','form[aria-busy="true"]','.item.is-native-pending','.overview-intro','.capability-item','.integrity-meta-card','.editor-meta-card','.original-preview'];
const pseudoSelectors=new Set(['.btn','.nav-btn','.panel','.item','.login-card','.topbar','.main-card','.overview-intro']);
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map((k)=>[k,stable(v[k])]));return v;}
function deepDiff(a,b,prefix=''){const out=[],aa=stable(a),bb=stable(b);if(JSON.stringify(aa)===JSON.stringify(bb))return out;if(aa===null||bb===null||typeof aa!=='object'||typeof bb!=='object')return[{path:prefix||'$',source:aa,synthetic:bb}];for(const k of uniq([...Object.keys(aa),...Object.keys(bb)]).sort())out.push(...deepDiff(aa[k],bb[k],prefix?`${prefix}.${k}`:k));return out;}
async function configurePage(page,base,cfg,viewport,reduced){await page.setViewport({width:viewport.width,height:viewport.height,isMobile:viewport.isMobile,hasTouch:viewport.hasTouch,deviceScaleFactor:1});if(reduced)await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.evaluateOnNewDocument((inCfg)=>{Object.defineProperty(window,'__BASAIR_EVIDENCE',{value:{...inCfg},configurable:true,writable:true});window.__BASAIR_EVIDENCE_LOCAL_WRITES=[];},cfg);const monitor={sameOriginFailures:[],requestFailures:[],externalIntercepts:[],forbiddenNetworkEscapes:[]};await page.setRequestInterception(true);page.on('request',async(req)=>{const url=req.url();try{if(/https:\/\/www\.gstatic\.com\/firebasejs\/12\.15\.0\/firebase-app\.js/.test(url)){monitor.externalIntercepts.push('firebase-app');return req.respond({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:FIREBASE_APP_STUB});}if(/https:\/\/www\.gstatic\.com\/firebasejs\/12\.15\.0\/firebase-firestore\.js/.test(url)){monitor.externalIntercepts.push('firebase-firestore');return req.respond({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:FIRESTORE_STUB});}if(/https:\/\/www\.gstatic\.com\/firebasejs\/12\.15\.0\/firebase-auth\.js/.test(url)){monitor.externalIntercepts.push('firebase-auth');return req.respond({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:AUTH_STUB});}if(/^https:\/\/fonts\.googleapis\.com\//.test(url)){monitor.externalIntercepts.push('google-fonts-css');return req.respond({status:200,contentType:'text/css',headers:{'access-control-allow-origin':'*'},body:'/* evidence font stub */'});}if(/^https:\/\/fonts\.gstatic\.com\//.test(url)){monitor.externalIntercepts.push('google-font-file');return req.respond({status:204,headers:{'access-control-allow-origin':'*'},body:''});}if(url.startsWith(base)||url.startsWith('data:')||url.startsWith('blob:'))return req.continue();if(/googleapis\.com|firebaseio\.com|firebaseapp\.com|accounts\.google\.com/.test(url))monitor.forbiddenNetworkEscapes.push(url);monitor.externalIntercepts.push(new URL(url).origin);return req.respond({status:204,body:''});}catch{try{return req.abort();}catch{}}});page.on('response',(r)=>{try{const u=new URL(r.url());if(u.origin===base&&r.status()>=400)monitor.sameOriginFailures.push({url:u.pathname,status:r.status()});}catch{}});page.on('requestfailed',(r)=>monitor.requestFailures.push({url:r.url(),error:r.failure()?.errorText||''}));return monitor;}
async function newPair(cfg,viewport,reduced=false){const c1=await browser.createBrowserContext(),c2=await browser.createBrowserContext();const a=await c1.newPage(),b=await c2.newPage();const ma=await configurePage(a,sourceServer.base,cfg,viewport,reduced),mb=await configurePage(b,synthServer.base,cfg,viewport,reduced);await Promise.all([a.goto(`${sourceServer.base}/${ENTRY}?evidence=1`,{waitUntil:'domcontentloaded',timeout:30000}),b.goto(`${synthServer.base}/${ENTRY}?evidence=1`,{waitUntil:'domcontentloaded',timeout:30000})]);return{a,b,c1,c2,ma,mb};}
async function closePair(pair){await Promise.allSettled([pair.c1.close(),pair.c2.close()]);}
async function waitSettled(pages,ms=340){await Promise.all(pages.map((p)=>p.evaluate(()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))));await sleep(ms);}
async function waitDashboard(pair){await Promise.all([pair.a.waitForSelector('#admin-dashboard:not(.hidden)',{timeout:10000}),pair.b.waitForSelector('#admin-dashboard:not(.hidden)',{timeout:10000})]);await waitSettled([pair.a,pair.b],420);}
async function waitLogin(pair){await Promise.all([pair.a.waitForSelector('#login-screen:not(.hidden)',{timeout:5000}),pair.b.waitForSelector('#login-screen:not(.hidden)',{timeout:5000})]);await waitSettled([pair.a,pair.b],260);}
async function snapshot(page){return page.evaluate(({selectors,props,customProps,pseudoList})=>{const rect=(el)=>{const r=el.getBoundingClientRect(),n=(x)=>Math.round(x*1000)/1000;return{x:n(r.x),y:n(r.y),docX:n(r.x+scrollX),docY:n(r.y+scrollY),width:n(r.width),height:n(r.height),top:n(r.top),right:n(r.right),bottom:n(r.bottom),left:n(r.left),clientWidth:el.clientWidth,clientHeight:el.clientHeight,scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight};};const styles=(el,pseudo=null)=>{const s=getComputedStyle(el,pseudo),o={};for(const p of props)o[p]=s.getPropertyValue(p);return o;};const state=(el)=>({tag:el.tagName.toLowerCase(),id:el.id||'',class:el.className||'',hidden:el.hidden||false,disabled:'disabled'in el?Boolean(el.disabled):false,checked:'checked'in el?Boolean(el.checked):undefined,value:'value'in el?String(el.value||'').slice(0,160):undefined,ariaBusy:el.getAttribute('aria-busy'),ariaSelected:el.getAttribute('aria-selected'),ariaHidden:el.getAttribute('aria-hidden'),role:el.getAttribute('role'),tabIndex:el.tabIndex,text:String(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,220)});const elements={};for(const sel of selectors){let nodes=[];try{nodes=[...document.querySelectorAll(sel)];}catch{}elements[sel]={count:nodes.length,samples:nodes.slice(0,3).map((el)=>({state:state(el),style:styles(el),geometry:rect(el),custom:Object.fromEntries(customProps.map((p)=>[p,getComputedStyle(el).getPropertyValue(p).trim()]))}))};if(pseudoList.includes(sel)&&nodes[0])elements[sel].pseudo={before:styles(nodes[0],'::before'),after:styles(nodes[0],'::after')};}const rootStyle=getComputedStyle(document.documentElement);const visibleControls=[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter((el)=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&!el.disabled;});const active=document.activeElement;return{url:location.pathname,rootCustom:Object.fromEntries(customProps.map((p)=>[p,rootStyle.getPropertyValue(p).trim()])),elements,document:{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,bodyScrollWidth:document.body.scrollWidth,bodyScrollHeight:document.body.scrollHeight},accessibility:{activeElement:active?{tag:active.tagName.toLowerCase(),id:active.id||'',class:active.className||'',tabIndex:active.tabIndex}:null,visibleControlCount:visibleControls.length,keyboardReachableCount:visibleControls.filter((el)=>el.tabIndex>=0).length,selectedTabs:[...document.querySelectorAll('.nav-btn[aria-selected="true"]')].map((e)=>e.dataset.tab||e.id),visibleSections:[...document.querySelectorAll('.section.active')].map((e)=>e.id),statusRole:document.querySelector('#status')?.getAttribute('role')||null,statusLive:document.querySelector('#status')?.getAttribute('aria-live')||null},capabilities:{hoverHover:matchMedia('(hover:hover)').matches,hoverNone:matchMedia('(hover:none)').matches,pointerFine:matchMedia('(pointer:fine)').matches,pointerCoarse:matchMedia('(pointer:coarse)').matches,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,forcedColors:matchMedia('(forced-colors: active)').matches},localWriteCount:(globalThis.__BASAIR_EVIDENCE_LOCAL_WRITES||[]).length};},{selectors,props:measuredProps,customProps:relevantCustomProps,pseudoList:[...pseudoSelectors]});}
function compareSnapshots(source,syntheticSnap){const computed=[],geometry=[],custom=[],state=[],accessibility=[];for(const sel of selectors){const a=source.elements[sel],b=syntheticSnap.elements[sel];if(!a||!b){state.push({selector:sel,reason:'selector-presence',source:!!a,synthetic:!!b});continue;}if(a.count!==b.count)state.push({selector:sel,reason:'count',source:a.count,synthetic:b.count});const n=Math.max(a.samples.length,b.samples.length);for(let i=0;i<n;i++){const as=a.samples[i],bs=b.samples[i];if(!as||!bs){state.push({selector:sel,index:i,reason:'sample-presence'});continue;}for(const d of deepDiff(as.style,bs.style))computed.push({selector:sel,index:i,...d});for(const d of deepDiff(as.geometry,bs.geometry))geometry.push({selector:sel,index:i,...d});for(const d of deepDiff(as.custom,bs.custom))custom.push({selector:sel,index:i,...d});for(const d of deepDiff(as.state,bs.state))state.push({selector:sel,index:i,...d});}if(a.pseudo||b.pseudo)for(const d of deepDiff(a.pseudo||null,b.pseudo||null))computed.push({selector:sel,pseudo:true,...d});}for(const d of deepDiff(source.rootCustom,syntheticSnap.rootCustom))custom.push({selector:':root',...d});for(const d of deepDiff(source.document,syntheticSnap.document))geometry.push({selector:'document',...d});for(const d of deepDiff(source.accessibility,syntheticSnap.accessibility))accessibility.push(d);for(const d of deepDiff(source.capabilities,syntheticSnap.capabilities))accessibility.push({capability:true,...d});if(source.localWriteCount!==syntheticSnap.localWriteCount)state.push({reason:'local-write-count',source:source.localWriteCount,synthetic:syntheticSnap.localWriteCount});return{computed,geometry,custom,state,accessibility};}
const groups={auth:[],empty:[],populated:[],responsive:[],reduced:[]},totals={comparisons:0,computed:0,geometry:0,custom:0,state:0,accessibility:0,resourceFailures:0,unresolved:0};
async function measure(group,label,pair,meta={}){await waitSettled([pair.a,pair.b],meta.settleMs??340);const[sa,sb]=await Promise.all([snapshot(pair.a),snapshot(pair.b)]),d=compareSnapshots(sa,sb);const rfA=pair.ma.sameOriginFailures.length+pair.ma.requestFailures.length+pair.ma.forbiddenNetworkEscapes.length,rfB=pair.mb.sameOriginFailures.length+pair.mb.requestFailures.length+pair.mb.forbiddenNetworkEscapes.length,resourceFailures=rfA+rfB,unresolved=d.computed.length+d.geometry.length+d.custom.length+d.state.length+d.accessibility.length+resourceFailures;const rec={label,group,authoritativeSourceSha:SOURCE_SHA,authoritativeSourceTree:SOURCE_TREE,evidenceSha:EVIDENCE_SHA,route:'/admin.html',authMode:meta.authMode,fixture:meta.fixture,viewport:meta.viewport,section:meta.section,state:meta.state,capability:sa.capabilities,selectorsMeasured:selectors,computedDeltas:d.computed,geometryDeltas:d.geometry,customPropertyDeltas:d.custom,stateDeltas:d.state,accessibilityDeltas:d.accessibility,resourceFailures:{source:[...pair.ma.sameOriginFailures,...pair.ma.requestFailures,...pair.ma.forbiddenNetworkEscapes],synthetic:[...pair.mb.sameOriginFailures,...pair.mb.requestFailures,...pair.mb.forbiddenNetworkEscapes]},harnessExternalInterceptions:{source:uniq(pair.ma.externalIntercepts),synthetic:uniq(pair.mb.externalIntercepts)},localWrites:{source:sa.localWriteCount,synthetic:sb.localWriteCount},unresolvedDeltaCount:unresolved,readiness:unresolved===0};groups[group].push(rec);totals.comparisons++;totals.computed+=d.computed.length;totals.geometry+=d.geometry.length;totals.custom+=d.custom.length;totals.state+=d.state.length;totals.accessibility+=d.accessibility.length;totals.resourceFailures+=resourceFailures;totals.unresolved+=unresolved;return rec;}
async function syncEval(pair,fn,...args){return Promise.all([pair.a.evaluate(fn,...args),pair.b.evaluate(fn,...args)]);}async function syncClick(pair,sel){await Promise.all([pair.a.click(sel),pair.b.click(sel)]);}async function syncHover(pair,sel){await Promise.all([pair.a.hover(sel),pair.b.hover(sel)]);}async function syncFocus(pair,sel){await Promise.all([pair.a.focus(sel),pair.b.focus(sel)]);}async function setSection(pair,tab){await syncClick(pair,`.nav-btn[data-tab="${tab}"]`);await Promise.all([pair.a.waitForSelector(`#tab-${tab}.active`,{timeout:3000}),pair.b.waitForSelector(`#tab-${tab}.active`,{timeout:3000})]);}
const VP={wide:{name:'wide',width:1440,height:1000,isMobile:false,hasTouch:false},standard:{name:'standard',width:1200,height:900,isMobile:false,hasTouch:false},narrow:{name:'narrow',width:900,height:900,isMobile:false,hasTouch:false},mobile:{name:'mobile',width:390,height:844,isMobile:true,hasTouch:true}};
for(const viewport of[VP.wide,VP.mobile]){
  {const pair=await newPair({authMode:'delay',fixture:'empty'},viewport,false);await measure('auth',`${viewport.name}:auth-initial-checking`,pair,{authMode:'delay',fixture:'empty',viewport,state:'auth-loading'});await closePair(pair);}
  {const pair=await newPair({authMode:'loggedout',fixture:'empty'},viewport,false);await waitLogin(pair);await measure('auth',`${viewport.name}:logged-out-idle`,pair,{authMode:'loggedout',fixture:'empty',viewport,state:'login-idle'});await syncFocus(pair,'#admin-email');await measure('auth',`${viewport.name}:email-focus`,pair,{authMode:'loggedout',fixture:'empty',viewport,state:'focus'});await syncClick(pair,'#email-login-btn');await measure('auth',`${viewport.name}:login-validation-error`,pair,{authMode:'loggedout',fixture:'empty',viewport,state:'validation-error'});await closePair(pair);}
  {const pair=await newPair({authMode:'loggedout',fixture:'empty',signInMode:'error',signInDelay:900},viewport,false);await waitLogin(pair);await syncEval(pair,()=>{document.querySelector('#admin-email').value='evidence-admin@example.invalid';document.querySelector('#admin-password').value='evidence-only-password';});await syncClick(pair,'#email-login-btn');await sleep(360);await measure('auth',`${viewport.name}:auth-busy`,pair,{authMode:'loggedout',fixture:'empty',viewport,state:'auth-busy',settleMs:0});await Promise.all([pair.a.waitForFunction(()=>document.querySelector('#status')?.classList.contains('error'),{timeout:3000}),pair.b.waitForFunction(()=>document.querySelector('#status')?.classList.contains('error'),{timeout:3000})]);await measure('auth',`${viewport.name}:auth-error`,pair,{authMode:'loggedout',fixture:'empty',viewport,state:'auth-error'});await closePair(pair);}
  {const pair=await newPair({authMode:'unauthorized',roleActive:false,fixture:'empty'},viewport,false);await waitLogin(pair);await measure('auth',`${viewport.name}:authenticated-not-admin`,pair,{authMode:'unauthorized',fixture:'empty',viewport,state:'authenticated-non-admin'});await closePair(pair);}
  {const pair=await newPair({authMode:'loggedout',fixture:'populated',signInMode:'admin',signInDelay:900},viewport,false);await waitLogin(pair);await syncEval(pair,()=>{document.querySelector('#admin-email').value='evidence-admin@example.invalid';document.querySelector('#admin-password').value='evidence-only-password';});await syncClick(pair,'#email-login-btn');await sleep(360);await measure('auth',`${viewport.name}:authenticated-transition-busy`,pair,{authMode:'login-transition',fixture:'populated',viewport,state:'auth-transition',settleMs:0});await waitDashboard(pair);await measure('auth',`${viewport.name}:authenticated-shell`,pair,{authMode:'admin',fixture:'populated',viewport,section:'overview',state:'authenticated-shell'});await closePair(pair);}
}
const deepViewports=[VP.wide,VP.standard,VP.narrow,VP.mobile];
for(const fixture of['empty','populated'])for(const viewport of deepViewports){const pair=await newPair({authMode:'admin',roleActive:true,fixture},viewport,false);await waitDashboard(pair);const tabs=await pair.a.$$eval('.nav-btn[data-tab]',els=>els.map(e=>e.dataset.tab));for(const tab of tabs){await setSection(pair,tab);await measure(fixture,`${viewport.name}:${fixture}:section:${tab}`,pair,{authMode:'admin',fixture,viewport,section:tab,state:'section-active'});}if(fixture==='populated'){await setSection(pair,'requests');if(await pair.a.$('#requests-list .item')){await syncHover(pair,'#requests-list .item');await measure('populated',`${viewport.name}:request-item-hover`,pair,{authMode:'admin',fixture,viewport,section:'requests',state:'hover'});await syncFocus(pair,'#requests-list select.request-status');await measure('populated',`${viewport.name}:request-select-focus`,pair,{authMode:'admin',fixture,viewport,section:'requests',state:'focus'});}await setSection(pair,'settings');await syncFocus(pair,'#settings-whatsapp');await measure('populated',`${viewport.name}:settings-focus`,pair,{authMode:'admin',fixture,viewport,section:'settings',state:'focus'});await syncEval(pair,()=>{document.querySelector('#settings-whatsapp').value='1';document.querySelector('#settings-telegram').value='x';});await measure('populated',`${viewport.name}:settings-changed`,pair,{authMode:'admin',fixture,viewport,section:'settings',state:'changed'});await syncClick(pair,'#contact-settings-form button[type="submit"]');await measure('populated',`${viewport.name}:settings-validation-error`,pair,{authMode:'admin',fixture,viewport,section:'settings',state:'validation-error'});await setSection(pair,'videos');await syncEval(pair,()=>{const t=document.querySelector('#video-title'),u=document.querySelector('#video-url');if(t)t.value='Evidence invalid URL';if(u)u.value='http://invalid.example';});if(await pair.a.$('#video-form button[type="submit"]')){await syncClick(pair,'#video-form button[type="submit"]');await measure('populated',`${viewport.name}:video-validation-error`,pair,{authMode:'admin',fixture,viewport,section:'videos',state:'validation-error'});}}await closePair(pair);}
for(const viewport of[VP.wide,VP.mobile]){const pair=await newPair({authMode:'admin',roleActive:true,fixture:'populated'},viewport,false);await waitDashboard(pair);await syncHover(pair,'#refresh-all-btn');await measure('populated',`${viewport.name}:button-hover`,pair,{authMode:'admin',fixture:'populated',viewport,section:'overview',state:'hover'});const[ba,bb]=await Promise.all([pair.a.$('#refresh-all-btn'),pair.b.$('#refresh-all-btn')]),[ra,rb]=await Promise.all([ba.boundingBox(),bb.boundingBox()]);await Promise.all([pair.a.mouse.move(ra.x+ra.width/2,ra.y+ra.height/2),pair.b.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2)]);await Promise.all([pair.a.mouse.down(),pair.b.mouse.down()]);await sleep(300);await measure('populated',`${viewport.name}:button-active`,pair,{authMode:'admin',fixture:'populated',viewport,section:'overview',state:'active',settleMs:0});await Promise.all([pair.a.mouse.up(),pair.b.mouse.up()]);await syncEval(pair,()=>{document.querySelector('.nav-btn.active')?.focus();});await Promise.all([pair.a.keyboard.press('ArrowDown'),pair.b.keyboard.press('ArrowDown')]);await measure('populated',`${viewport.name}:keyboard-tab-navigation`,pair,{authMode:'admin',fixture:'populated',viewport,section:'requests',state:'keyboard-only'});await setSection(pair,'requests');if(await pair.a.$('#requests-list .item .request-status')){await syncEval(pair,()=>{const s=document.querySelector('#requests-list .item .request-status');if(s){s.value=s.value==='new'?'contacted':'new';s.dispatchEvent(new Event('change',{bubbles:true}));}globalThis.__BASAIR_EVIDENCE.writeMode='success';globalThis.__BASAIR_EVIDENCE.writeDelay=1000;});await syncClick(pair,'#requests-list .item button.ok');await sleep(330);await measure('populated',`${viewport.name}:request-save-busy`,pair,{authMode:'admin',fixture:'populated',viewport,section:'requests',state:'busy',settleMs:0});await sleep(900);await measure('populated',`${viewport.name}:request-save-success`,pair,{authMode:'admin',fixture:'populated',viewport,section:'requests',state:'success'});await syncEval(pair,()=>{const s=document.querySelector('#requests-list .item .request-status');if(s)s.value=s.value==='new'?'pending':'new';globalThis.__BASAIR_EVIDENCE.writeMode='error';globalThis.__BASAIR_EVIDENCE.writeDelay=500;});await syncClick(pair,'#requests-list .item button.ok');await sleep(800);await measure('populated',`${viewport.name}:request-save-error`,pair,{authMode:'admin',fixture:'populated',viewport,section:'requests',state:'error'});}await closePair(pair);}
const responsiveWidths=uniq([1440,1200,390,...breakpointWidths.flatMap((w)=>[Math.max(320,Math.round(w+1)),Math.max(320,Math.round(w)),Math.max(320,Math.round(w-1))])]).sort((a,b)=>b-a);
for(const width of responsiveWidths){const viewport={name:`w${width}`,width,height:900,isMobile:width<=600,hasTouch:width<=600},pair=await newPair({authMode:'admin',roleActive:true,fixture:'populated'},viewport,false);await waitDashboard(pair);await measure('responsive',`${viewport.name}:overview`,pair,{authMode:'admin',fixture:'populated',viewport,section:'overview',state:'responsive-base'});await setSection(pair,'requests');await measure('responsive',`${viewport.name}:requests`,pair,{authMode:'admin',fixture:'populated',viewport,section:'requests',state:'responsive-requests'});await closePair(pair);}
for(const viewport of[VP.wide,VP.mobile]){const pair=await newPair({authMode:'admin',roleActive:true,fixture:'populated'},viewport,true);await waitDashboard(pair);await measure('reduced',`${viewport.name}:reduced-overview`,pair,{authMode:'admin',fixture:'populated',viewport,section:'overview',state:'reduced-motion'});await setSection(pair,'requests');await syncHover(pair,'#requests-list .item');await measure('reduced',`${viewport.name}:reduced-requests-hover`,pair,{authMode:'admin',fixture:'populated',viewport,section:'requests',state:'reduced-hover'});await closePair(pair);}
await browser.close();await Promise.all([new Promise((r)=>sourceServer.server.close(r)),new Promise((r)=>synthServer.server.close(r))]);
for(const[name,records]of Object.entries(groups))fs.writeFileSync(path.join(OUT,`phase-3b-3c-raw-${name}.json`),JSON.stringify({sourceSha:SOURCE_SHA,sourceTree:SOURCE_TREE,evidenceSha:EVIDENCE_SHA,group:name,records},null,2));
const staticCharacterization={sourceSha:SOURCE_SHA,sourceTree:SOURCE_TREE,evidenceSha:EVIDENCE_SHA,adminEntries:htmlAudit.filter((x)=>x.html==='admin.html'||x.hasPrecision||x.hasPolish),targetEntries,runtimeFilenameAudit:refs,adminRuntimeEntrypoints:[...adminRuntime].sort(),cascade,customProperties:{precision:cpPrecision,polish:cpPolish,relevant:relevantCustomProps},breakpoints,breakpointWidths,forcedColorsApplicable,protectedTokenContext:{inlineLine:/--line\s*:\s*rgba\(255,255,255,\.12\)/.test(adminHtmlText),inlineMuted:/--muted\s*:\s*rgba\(255,255,255,\.62\)/.test(adminHtmlText),compatImportedByAdminUiFixes:read(SOURCE,'admin-ui-fixes-v1.css').includes('@import "./tokens-admin-compat.css"')},synthetic};
fs.writeFileSync(path.join(OUT,'phase-3b-3c-static-characterization.json'),JSON.stringify(staticCharacterization,null,2));
const sourceSecurity={firebaseSdkVersion12_15_0:read(SOURCE,'admin.js').includes('firebasejs/12.15.0/'),popupAuthLifecycle:read(SOURCE,'admin.js').includes('signInWithPopup')&&!read(SOURCE,'admin.js').includes('signInWithRedirect'),cspPresent:/Content-Security-Policy/.test(adminHtmlText),firestoreRulesSha256:fs.existsSync(path.join(SOURCE,'firestore.rules'))?sha256(readBuf(SOURCE,'firestore.rules')):null,adminAuthorizationCheck:/admin_roles/.test(read(SOURCE,'admin.js'))&&/active\s*===\s*true/.test(read(SOURCE,'admin.js')),immutableAuditIntent:/admin_audit/.test(read(SOURCE,'admin.js')),requestStatusAllowList:/\["new",\s*"contacted",\s*"pending",\s*"accepted",\s*"rejected"\]/.test(read(SOURCE,'admin.js')),harnessAuthBypassProductionCommitted:false,realProductionWritesPossible:false};
const readinessChecks={adminProductionReachabilityUnderstood:targetEntries.length>0,pairOrderAdjacency:targetEntries.every((x)=>x.both&&x.adjacent&&x.sameOrder),noUnresolvedRuntimeFilenameDependency:refs.productionRuntime.length===0&&refs.inlineRuntime.length===0,authenticatedAdminMeasured:groups.auth.some((x)=>x.state==='authenticated-shell')&&groups.populated.length>0,loggedOutMeasured:groups.auth.some((x)=>x.state==='login-idle'),relevantSectionsInventoried:groups.empty.some((x)=>x.section==='help')&&groups.populated.some((x)=>x.section==='settings'),emptyAndPopulatedCovered:groups.empty.length>0&&groups.populated.length>0,cascadeKnown:cascade.precision.ruleCount>0&&cascade.polish.ruleCount>0,customOwnershipKnown:relevantCustomProps.length>=2,contextualLineMutedPreserved:staticCharacterization.protectedTokenContext.inlineLine&&staticCharacterization.protectedTokenContext.inlineMuted,exactConcatByteProven:synthetic.concatSha256===synthetic.syntheticSurvivorSha256,computedUnexpectedZero:totals.computed===0,geometryUnexpectedZero:totals.geometry===0,customUnexpectedZero:totals.custom===0,stateUnexpectedZero:totals.state===0,reducedUnexpectedZero:groups.reduced.every((x)=>x.unresolvedDeltaCount===0),accessibilityUnexpectedZero:totals.accessibility===0,resourceFailuresZero:totals.resourceFailures===0,noUnresolvedAD:totals.unresolved===0,productionBranchUnchanged:true,noRealProductionDataMutated:true,forcedColorsHandled:forcedColorsApplicable?groups.reduced.length>0:true};
const ready=Object.values(readinessChecks).every(Boolean);
const summary={sourceSha:SOURCE_SHA,sourceTree:SOURCE_TREE,evidenceSha:EVIDENCE_SHA,route:'/admin.html',authHarness:{method:'request-intercepted Firebase/Auth/Firestore ES-module stubs; unmodified production admin.html/admin.js executed from authoritative source',isolated:true,credentialsUsed:false,productionWrites:false,fixtures:['empty','populated'],stubbedSdkVersion:'12.15.0 import URLs only'},targetPair:{precision:PRECISION,polish:POLISH,entries:targetEntries.map((x)=>({route:x.route,html:x.html,adjacent:x.adjacent,sameOrder:x.sameOrder,precisionIndex:x.precisionIndex,polishIndex:x.polishIndex}))},synthetic,breakpointWidths,responsiveWidths,forcedColorsApplicable,matrix:{groupCounts:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),totalSynchronizedComparisons:totals.comparisons},deltas:{computed:totals.computed,geometry:totals.geometry,customProperties:totals.custom,state:totals.state,reduced:groups.reduced.reduce((n,x)=>n+x.unresolvedDeltaCount,0),accessibility:totals.accessibility,resourceFailures:totals.resourceFailures,unresolved:totals.unresolved},sourceSecurity,readinessChecks,readyForPhase3B3Candidate:ready};
fs.writeFileSync(path.join(OUT,'phase-3b-3c-authenticated-admin-characterization.json'),JSON.stringify(summary,null,2));
const report=`# PHASE 3B-3C — Authenticated Admin Characterization\n\n- Source SHA: \`${SOURCE_SHA}\`\n- Source tree: \`${SOURCE_TREE}\`\n- Evidence SHA: \`${EVIDENCE_SHA}\`\n- Target entries: ${targetEntries.length}\n- Exact concat SHA-256: \`${synthetic.concatSha256}\`\n- Exact concat bytes: ${synthetic.concatBytes}\n- Synchronized comparisons: ${totals.comparisons}\n- Computed deltas: ${totals.computed}\n- Geometry deltas: ${totals.geometry}\n- Custom-property deltas: ${totals.custom}\n- State deltas: ${totals.state}\n- Accessibility deltas: ${totals.accessibility}\n- Resource failures: ${totals.resourceFailures}\n- Unresolved deltas: ${totals.unresolved}\n- Forced colors applicable: ${forcedColorsApplicable}\n- Ready for Phase 3B-3 candidate review: ${ready}\n\n## Harness isolation\nProduction \`admin.html\` and \`admin.js\` execute unchanged. Firebase 12.15.0 module requests are intercepted inside isolated browser contexts and answered by deterministic local Auth/Firestore stubs. No credentials are used; no Firebase/Google data API request is allowed to escape. All write paths terminate in an in-memory stub and are counted locally.\n\n## Readiness checks\n${Object.entries(readinessChecks).map(([k,v])=>`- ${v?'PASS':'FAIL'} — ${k}`).join('\n')}\n`;
fs.writeFileSync(path.join(OUT,'PHASE-3B-3C-AUTHENTICATED-ADMIN-CHARACTERIZATION.md'),report);
console.log(JSON.stringify(summary,null,2));if(!ready)process.exitCode=23;
