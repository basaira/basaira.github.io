import fs from 'node:fs';
import path from 'node:path';
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
const OVER = 'form-overdrive-v1.css';
const POLISH = 'form-polish-v2.css';
if (!SOURCE || !SYNTH || !OUT || !SOURCE_SHA || !SOURCE_TREE) throw new Error('missing environment');
fs.mkdirSync(OUT,{recursive:true});

const read = p => fs.readFileSync(p,'utf8');
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const git = (...args) => execFileSync('git', args, {cwd:SOURCE, encoding:'utf8'}).trim();
const tracked = pattern => git('ls-files', pattern).split(/\n/).filter(Boolean);
const norm = p => p.replaceAll('\\','/');

function routeFor(html){
  const p=norm(html);
  if(p==='index.html') return '/';
  return '/' + p.replace(/index\.html$/,'');
}
function localeFor(route){
  const m=route.match(/^\/(en|ru|uz)(?:\/|$)/); return m?.[1] ?? 'root';
}
function personaFor(route){
  if(route.includes('quran-kids')) return 'quran-kids';
  if(route.includes('quran-adults')) return 'quran-adults';
  if(route.includes('/quran/')) return 'quran';
  if(route.includes('/arabic/')) return 'arabic';
  return route==='/' ? 'public-assessment' : 'locale-root';
}
function hrefs(htmlText){
  const out=[];
  for(const m of htmlText.matchAll(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi)){
    const tag=m[0]; const hm=tag.match(/href=["']([^"']+)["']/i); if(hm) out.push(hm[1].split(/[?#]/)[0]);
  }
  for(const m of htmlText.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']?stylesheet["']?[^>]*>/gi)) out.push(m[1].split(/[?#]/)[0]);
  return [...new Set(out)];
}
function resolveLocal(baseFile, href){
  if(!href || /^(?:https?:|data:|\/\/)/.test(href)) return null;
  if(href.startsWith('/')) return href.slice(1);
  return norm(path.normalize(path.join(path.dirname(baseFile),href)));
}
function importsFor(cssFile, seen=new Set()){
  if(seen.has(cssFile)) return [];
  seen.add(cssFile);
  const abs=path.join(SOURCE,cssFile); if(!fs.existsSync(abs)) return [];
  const txt=read(abs), out=[];
  for(const m of txt.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)){
    const r=resolveLocal(cssFile,m[1]); if(r){out.push(r,...importsFor(r,seen));}
  }
  return out;
}
const htmlFiles=tracked('*.html');
const routes=[];
for(const html of htmlFiles){
  const txt=read(path.join(SOURCE,html));
  const direct=hrefs(txt).map(h=>resolveLocal(html,h)).filter(Boolean);
  const effective=[];
  for(const css of direct){ effective.push(css,...importsFor(css,new Set())); }
  const hasOver=effective.includes(OVER), hasPolish=effective.includes(POLISH);
  if(hasOver||hasPolish){
    const oi=effective.indexOf(OVER), pi=effective.indexOf(POLISH);
    routes.push({html,route:routeFor(html),locale:localeFor(routeFor(html)),persona:personaFor(routeFor(html)),directLinks:direct,effectiveOrder:effective,overdriveIndex:oi,polishIndex:pi,both:hasOver&&hasPolish,adjacent:oi>=0&&pi===oi+1,sameOrder:oi>=0&&pi>oi,imports:{overdrive:importsFor(OVER),polish:importsFor(POLISH)}});
  }
}
routes.sort((a,b)=>a.route.localeCompare(b.route));
if(!routes.length) throw new Error('No production form routes discovered');

// Runtime dependency audit.
function scriptsFromHtml(html){
  const txt=read(path.join(SOURCE,html)), arr=[];
  for(const m of txt.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)){
    const r=resolveLocal(html,m[1].split(/[?#]/)[0]); if(r) arr.push(r);
  }
  return arr;
}
function jsImports(file, seen=new Set()){
  if(seen.has(file)) return [];
  seen.add(file);
  const abs=path.join(SOURCE,file); if(!fs.existsSync(abs)) return [];
  const txt=read(abs), out=[];
  for(const m of txt.matchAll(/(?:from\s*|import\s*\(|import\s*)["']([^"']+)["']/g)){
    const spec=m[1]; if(spec.startsWith('.')||spec.startsWith('/')){
      let r=resolveLocal(file,spec); if(r && !path.extname(r)) r+='.js';
      if(r && fs.existsSync(path.join(SOURCE,r))) out.push(r,...jsImports(r,seen));
    }
  }
  return out;
}
const prodJs=new Set();
for(const html of htmlFiles) for(const s of scriptsFromHtml(html)) { prodJs.add(s); for(const x of jsImports(s,new Set())) prodJs.add(x); }
const codeFiles=[...tracked('*.js'),...tracked('*.mjs'),...tracked('*.ts')];
const targetRx=new RegExp(`(?:${OVER.replaceAll('.','\\.')}|${POLISH.replaceAll('.','\\.')})`);
const cssomRx=/(document\.styleSheets|ownerNode|insertRule|deleteRule|createElement\(['"]link|\.href\s*[=!]==?|setAttribute\(['"]href|appendChild\([^\n]*link)/;
const runtimeRefs=[], nonRuntimeRefs=[], cssomRuntime=[];
for(const f of codeFiles){
  const txt=read(path.join(SOURCE,f));
  if(targetRx.test(txt)) (prodJs.has(f)?runtimeRefs:nonRuntimeRefs).push(f);
  if(prodJs.has(f)&&cssomRx.test(txt)) cssomRuntime.push(f);
}
const inlineRuntime=[];
for(const html of htmlFiles){
  const txt=read(path.join(SOURCE,html));
  for(const m of txt.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) if(targetRx.test(m[1])||cssomRx.test(m[1])) inlineRuntime.push(html);
}

// CSS parse / selector / property / custom-property characterization.
const overText=read(path.join(SOURCE,OVER));
const polishText=read(path.join(SOURCE,POLISH));
const overRoot=postcss.parse(overText,{from:OVER});
const polishRoot=postcss.parse(polishText,{from:POLISH});
function spec(sel){
  let a=0,b=0,c=0;
  try{ selectorParser(root=>root.walk(n=>{ if(n.type==='id') a++; else if(['class','attribute','pseudo'].includes(n.type)){ if(n.type==='pseudo'&&n.value?.startsWith('::')) c++; else b++; } else if(n.type==='tag') c++; })).processSync(sel); }catch{}
  return [a,b,c];
}
function flatten(root,file){
  const rules=[]; let order=0;
  root.walkRules(rule=>{
    const at=[]; let p=rule.parent; while(p&&p.type!=='root'){ if(p.type==='atrule') at.unshift(`@${p.name} ${p.params}`.trim()); p=p.parent; }
    for(const sel of rule.selectors ?? [rule.selector]){
      const decls=[]; rule.each(n=>{if(n.type==='decl') decls.push({prop:n.prop,value:n.value,important:n.important});});
      rules.push({file,order:order++,selector:sel,atRules:at,specificity:spec(sel),pseudos:[...sel.matchAll(/:{1,2}[\w-]+(?:\([^)]*\))?/g)].map(x=>x[0]),decls});
    }
  }); return rules;
}
const overRules=flatten(overRoot,OVER), polishRules=flatten(polishRoot,POLISH);
const bySel=(rules)=>{const m=new Map();for(const r of rules){if(!m.has(r.selector))m.set(r.selector,[]);m.get(r.selector).push(r);}return m;};
const A=bySel(overRules), B=bySel(polishRules);
const overlapSelectors=[...A.keys()].filter(s=>B.has(s)).sort();
const overlapPairs=[];
for(const s of overlapSelectors){
  const pa=new Set(A.get(s).flatMap(r=>r.decls.map(d=>d.prop)));
  const pb=new Set(B.get(s).flatMap(r=>r.decls.map(d=>d.prop)));
  for(const p of [...pa].filter(x=>pb.has(x)).sort()) overlapPairs.push({selector:s,property:p,overdriveSpecificity:A.get(s)[0].specificity,polishSpecificity:B.get(s)[0].specificity,laterWins:true});
}
const media={overdrive:[...new Set(overRules.flatMap(r=>r.atRules.filter(x=>x.startsWith('@media'))))],polish:[...new Set(polishRules.flatMap(r=>r.atRules.filter(x=>x.startsWith('@media'))))]};
const stateRules={overdrive:overRules.filter(r=>r.pseudos.length||/(is-valid|is-invalid|submitting|success|error|loading|disabled|busy)/.test(r.selector)),polish:polishRules.filter(r=>r.pseudos.length||/(is-valid|is-invalid|submitting|success|error|loading|disabled|busy)/.test(r.selector))};
function customProps(root,file){
  const owners=[],consumers=[];
  root.walkDecls(d=>{
    if(d.prop.startsWith('--')) owners.push({file,property:d.prop,value:d.value,selector:d.parent?.selector??null,atRule:d.parent?.parent?.type==='atrule'?`@${d.parent.parent.name} ${d.parent.parent.params}`:null});
    for(const m of d.value.matchAll(/var\((--[\w-]+)/g)) consumers.push({file,property:m[1],consumerProperty:d.prop,selector:d.parent?.selector??null});
  }); return {owners,consumers};
}
const cpA=customProps(overRoot,OVER), cpB=customProps(polishRoot,POLISH);
const cpNames=[...new Set([...cpA.owners,...cpB.owners,...cpA.consumers,...cpB.consumers].map(x=>x.property).filter(x=>x.startsWith('--fo-')||x.startsWith('--form-od-')))].sort();

// Exact concatenation synthetic candidate.
fs.cpSync(SOURCE,SYNTH,{recursive:true,filter:(src)=>!src.includes(`${path.sep}.git${path.sep}`)&&!src.endsWith(`${path.sep}.git`)});
const concat=overText+polishText;
fs.writeFileSync(path.join(SYNTH,OVER),concat);
for(const r of routes){
  const hp=path.join(SYNTH,r.html); let t=read(hp);
  const before=t;
  t=t.replace(new RegExp(`<link\\b[^>]*href=["'][^"']*${POLISH.replaceAll('.','\\.')}[^"']*["'][^>]*>\\s*`,'gi'),'');
  t=t.replace(new RegExp(`<link\\b[^>]*rel=["']?stylesheet["']?[^>]*href=["'][^"']*${POLISH.replaceAll('.','\\.')}[^"']*["'][^>]*>\\s*`,'gi'),'');
  if(t===before) throw new Error(`Could not remove ${POLISH} link from ${r.html}`);
  fs.writeFileSync(hp,t);
}
const concatHash=sha256(concat), synthHash=sha256(read(path.join(SYNTH,OVER)));
if(concatHash!==synthHash) throw new Error('synthetic concat hash mismatch');

const chromeCandidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=chromeCandidates.find(fs.existsSync); if(!executablePath) throw new Error('Chrome not found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-setuid-sandbox']});
const viewports=[
  {name:'wide',width:1440,height:1000,isMobile:false,hasTouch:false},
  {name:'narrow',width:900,height:900,isMobile:false,hasTouch:false},
  {name:'boundary-520',width:520,height:900,isMobile:true,hasTouch:true},
  {name:'small-mobile',width:390,height:844,isMobile:true,hasTouch:true},
];
const props=['background','background-color','border','border-color','border-radius','box-shadow','color','outline','outline-color','outline-style','outline-width','opacity','transform','transition','transition-duration','animation','animation-name','animation-duration','display','visibility','pointer-events','cursor','width','min-width','max-width','height','min-height','padding','margin','gap','position','inset','z-index','overflow'];
const selectors=['.overdrive-form','.form-overdrive-panel','.form-overdrive-kicker','.form-overdrive-chip','.form-overdrive-progress-track','.form-overdrive-progress-fill','.form-overdrive-step','.form-section-pill','.overdrive-field','.overdrive-field input','.overdrive-field select','.overdrive-field textarea','[type="submit"]','.form-submit-caption','.form-submit-caption__state','#success-message','#error-message','#form-status','#post-submit'];
const allCustom=[...new Set(cpNames)];

async function prepPage(base,route,vp,reduced=false){
  const p=await browser.newPage();
  await p.setViewport({width:vp.width,height:vp.height,isMobile:vp.isMobile,hasTouch:vp.hasTouch,deviceScaleFactor:1});
  if(reduced) await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  const failures=[];
  p.on('response',r=>{try{const u=new URL(r.url());if(u.origin===base&&r.status()>=400&&!u.pathname.endsWith('/favicon.ico'))failures.push({url:u.pathname,status:r.status()});}catch{}});
  p.on('requestfailed',req=>{try{const u=new URL(req.url());if(u.origin===base)failures.push({url:u.pathname,error:req.failure()?.errorText});}catch{}});
  await p.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
  await p.evaluate(()=>document.fonts?.ready);
  return {p,failures};
}
async function freeze(p){ await p.addStyleTag({content:'*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;}'}); }
async function inventory(p){
  return await p.evaluate(()=>{
    const f=document.querySelector('.overdrive-form'); if(!f) return null;
    const qs=s=>[...f.querySelectorAll(s)].map(e=>({tag:e.tagName.toLowerCase(),type:e.getAttribute('type'),name:e.getAttribute('name'),required:e.required??false,disabled:e.disabled??false,id:e.id||null}));
    return {id:f.id,inputs:qs('input'),textareas:qs('textarea'),selects:qs('select'),submits:qs('[type="submit"]'),messages:['#success-message','#error-message','#form-status','#post-submit'].filter(s=>document.querySelector(s)),hasForcedColorsCss:[...document.styleSheets].some(ss=>{try{return [...ss.cssRules].some(r=>String(r.conditionText||'').includes('forced-colors'));}catch{return false;}})};
  });
}
async function applyState(p,state){
  if(!['hover-submit','active-submit','hover-control'].includes(state)) await freeze(p);
  await p.evaluate((state)=>{
    const f=document.querySelector('.overdrive-form'); if(!f) return;
    const fields=[...f.querySelectorAll('.overdrive-field')]; const first=fields[0];
    const control=f.querySelector('input:not([type="hidden"]),textarea,select');
    const email=f.querySelector('input[type="email"]'); const text=f.querySelector('input:not([type="hidden"]):not([type="submit"]),textarea');
    const select=f.querySelector('select'); const submit=f.querySelector('[type="submit"]');
    const setValue=(el,v)=>{if(!el)return;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
    if(state==='focus-control'){control?.focus(); first?.classList.add('is-focused');}
    if(state==='focus-select'){select?.focus(); select?.closest('.overdrive-field')?.classList.add('is-focused');}
    if(state==='partial'){setValue(text,'A');}
    if(state==='valid'){setValue(text,'Basair Test'); first?.classList.add('is-valid');}
    if(state==='invalid-required'){setValue(control,''); first?.classList.add('is-invalid'); control?.setAttribute('aria-invalid','true');}
    if(state==='malformed'){if(email){setValue(email,'not-an-email'); email.closest('.overdrive-field')?.classList.add('is-invalid');email.setAttribute('aria-invalid','true');}else{setValue(control,'?');first?.classList.add('is-invalid');}}
    if(state==='disabled'){if(submit)submit.disabled=true;}
    if(state==='aria-disabled'){submit?.setAttribute('aria-disabled','true');}
    if(state==='busy'){f.dataset.overdriveSubmitState='submitting';submit?.classList.add('is-loading');submit?.setAttribute('aria-busy','true');}
    if(state==='success'){f.dataset.overdriveSubmitState='success'; const a=document.querySelector('#success-message');a?.classList.remove('hidden'); const b=document.querySelector('#post-submit');b?.classList.add('show');}
    if(state==='error'){f.dataset.overdriveSubmitState='error'; const a=document.querySelector('#error-message');a?.classList.remove('hidden'); const b=document.querySelector('#form-status');b?.classList.add('show');}
  },state);
  if(state==='hover-submit'){await freeze(p); const el=await p.$('.overdrive-form [type="submit"]'); if(el) await el.hover();}
  if(state==='hover-control'){await freeze(p); const el=await p.$('.overdrive-form input:not([type="hidden"]),.overdrive-form textarea,.overdrive-form select'); if(el) await el.hover();}
  if(state==='active-submit'){await freeze(p); const el=await p.$('.overdrive-form [type="submit"]'); if(el){const b=await el.boundingBox();if(b){await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();}}}
  await new Promise(r=>setTimeout(r,35));
}
async function snapshot(p){
  return await p.evaluate(({selectors,props,custom})=>{
    const round=n=>Math.round(n*1000)/1000; const out={elements:{},custom:{}};
    for(const sel of selectors){
      out.elements[sel]=[...document.querySelectorAll(sel)].slice(0,4).map((el,i)=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect(),st={};for(const k of props)st[k]=cs.getPropertyValue(k);return{index:i,styles:st,rect:{x:round(r.x),y:round(r.y),width:round(r.width),height:round(r.height),top:round(r.top),right:round(r.right),bottom:round(r.bottom),left:round(r.left),scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight}};});
    }
    const form=document.querySelector('.overdrive-form'); if(form){const cs=getComputedStyle(form);for(const k of custom)out.custom[k]=cs.getPropertyValue(k).trim();}
    return out;
  },{selectors,props,custom:allCustom});
}
function diffSnap(a,b){
  const computed=[],geometry=[],custom=[];
  for(const sel of new Set([...Object.keys(a.elements),...Object.keys(b.elements)])){
    const aa=a.elements[sel]||[],bb=b.elements[sel]||[]; if(aa.length!==bb.length){computed.push({sel,kind:'count',a:aa.length,b:bb.length});continue;}
    for(let i=0;i<aa.length;i++){
      for(const [k,v] of Object.entries(aa[i].styles)) if(v!==bb[i].styles[k]) computed.push({sel,index:i,property:k,a:v,b:bb[i].styles[k]});
      for(const [k,v] of Object.entries(aa[i].rect)) if(Math.abs((Number(v)||0)-(Number(bb[i].rect[k])||0))>0.01) geometry.push({sel,index:i,metric:k,a:v,b:bb[i].rect[k]});
    }
  }
  for(const k of new Set([...Object.keys(a.custom),...Object.keys(b.custom)])) if(a.custom[k]!==b.custom[k]) custom.push({property:k,a:a.custom[k],b:b.custom[k]});
  return {computed,geometry,custom};
}

const bases={source:'http://127.0.0.1:4173',synthetic:'http://127.0.0.1:4174'};
const browserResult={routeCount:routes.length,viewportCount:viewports.length,baseStates:0,interactionStates:0,validationStates:0,reducedMotionStates:0,totalComparisons:0,computedDeltas:[],geometryDeltas:[],customPropertyDeltas:[],stateDeltas:[],reducedMotionDeltas:[],resourceFailures:[],inventories:{}};
for(const r of routes){
  for(const vp of viewports){
    const sa=await prepPage(bases.source,r.route,vp,false), sb=await prepPage(bases.synthetic,r.route,vp,false);
    const invA=await inventory(sa.p), invB=await inventory(sb.p); browserResult.inventories[`${r.route}|${vp.name}`]=invA;
    if(JSON.stringify(invA)!==JSON.stringify(invB)) browserResult.stateDeltas.push({route:r.route,viewport:vp.name,state:'inventory'});
    const states=['idle','focus-control','partial','valid','invalid-required','disabled','aria-disabled','busy','success','error','hover-submit','active-submit','hover-control'];
    if(invA?.selects?.length) states.push('focus-select');
    if(invA?.inputs?.some(x=>x.type==='email')) states.push('malformed');
    for(const state of states){
      if(state!=='idle'){await sa.p.reload({waitUntil:'domcontentloaded'});await sb.p.reload({waitUntil:'domcontentloaded'});}
      await applyState(sa.p,state);await applyState(sb.p,state);
      const da=await snapshot(sa.p),db=await snapshot(sb.p),d=diffSnap(da,db);
      browserResult.totalComparisons++;
      if(state==='idle')browserResult.baseStates++; else browserResult.interactionStates++;
      if(['valid','invalid-required','malformed','busy','success','error','disabled','aria-disabled'].includes(state))browserResult.validationStates++;
      for(const x of d.computed)browserResult.computedDeltas.push({route:r.route,viewport:vp.name,state,...x});
      for(const x of d.geometry)browserResult.geometryDeltas.push({route:r.route,viewport:vp.name,state,...x});
      for(const x of d.custom)browserResult.customPropertyDeltas.push({route:r.route,viewport:vp.name,state,...x});
    }
    const ra=await prepPage(bases.source,r.route,vp,true), rb=await prepPage(bases.synthetic,r.route,vp,true); await freeze(ra.p);await freeze(rb.p); const rd=diffSnap(await snapshot(ra.p),await snapshot(rb.p)); browserResult.reducedMotionStates++;browserResult.totalComparisons++;
    for(const x of [...rd.computed,...rd.geometry,...rd.custom])browserResult.reducedMotionDeltas.push({route:r.route,viewport:vp.name,...x});
    browserResult.resourceFailures.push(...sa.failures.map(x=>({side:'source',route:r.route,viewport:vp.name,...x})),...sb.failures.map(x=>({side:'synthetic',route:r.route,viewport:vp.name,...x})),...ra.failures.map(x=>({side:'source-reduced',route:r.route,viewport:vp.name,...x})),...rb.failures.map(x=>({side:'synthetic-reduced',route:r.route,viewport:vp.name,...x})));
    await sa.p.close();await sb.p.close();await ra.p.close();await rb.p.close();
  }
}
await browser.close();

const forcedColorsApplicable=overText.includes('forced-colors')||polishText.includes('forced-colors');
const staticResult={source:{sha:SOURCE_SHA,tree:SOURCE_TREE},routes,routeCount:routes.length,allReachBoth:routes.every(r=>r.both),allAdjacent:routes.every(r=>r.adjacent),allSameOrder:routes.every(r=>r.sameOrder),pageWithOnlyOne:routes.filter(r=>!r.both).map(r=>r.route),targetImports:{overdrive:importsFor(OVER),polish:importsFor(POLISH)},runtimeDependency:{runtimeFilenameRefs:runtimeRefs,nonRuntimeFilenameRefs:nonRuntimeRefs,inlineRuntimeRefs:inlineRuntime,cssomRuntimeFiles:cssomRuntime,productionJs:[...prodJs].sort(),verdict:runtimeRefs.length||inlineRuntime.length?'BLOCKER':'NO_RUNTIME_FILENAME_DEPENDENCY'},cascade:{overdriveRuleCount:overRules.length,polishRuleCount:polishRules.length,overlappingSelectors:overlapSelectors,overlapSelectorCount:overlapSelectors.length,overlapSelectorPropertyPairs:overlapPairs,overlapSelectorPropertyPairCount:overlapPairs.length,media,stateRuleCounts:{overdrive:stateRules.overdrive.length,polish:stateRules.polish.length},exactConcatLogicalOrderPreserved:true},customProperties:{names:cpNames,overdrive:cpA,polish:cpB},synthetic:{method:`${OVER} bytes + ${POLISH} bytes at ${OVER}; remove ${POLISH} link only in temporary synthetic copy`,concatSha256:concatHash,syntheticSha256:synthHash,bytes:Buffer.byteLength(concat),committedProductionImplementation:false},forcedColorsApplicable};
const unresolved=browserResult.computedDeltas.length+browserResult.geometryDeltas.length+browserResult.customPropertyDeltas.length+browserResult.stateDeltas.length+browserResult.reducedMotionDeltas.length+browserResult.resourceFailures.length;
const ready=staticResult.allReachBoth&&staticResult.allSameOrder&&staticResult.runtimeDependency.verdict==='NO_RUNTIME_FILENAME_DEPENDENCY'&&unresolved===0;
const result={generatedAt:new Date().toISOString(),static:staticResult,browser:browserResult,decision:{readyFor3B2:ready,unresolvedDeltaCount:unresolved,verdict:ready?'PASS':'BLOCKED'}};
fs.writeFileSync(path.join(OUT,'phase-3b-2c-characterization-raw.json'),JSON.stringify(result,null,2));
const md=[];
md.push('# Phase 3B-2C — Form-State Characterization Evidence','',`Source: \`${SOURCE_SHA}\``,`Tree: \`${SOURCE_TREE}\``,'',`Discovered production form routes: **${routes.length}**`,'');
for(const r of routes)md.push(`- \`${r.route}\` — locale=${r.locale}, persona=${r.persona}, both=${r.both}, adjacent=${r.adjacent}, order=${r.overdriveIndex}<${r.polishIndex}`);
md.push('',`Runtime filename dependency: **${staticResult.runtimeDependency.verdict}**`,`Overlapping selectors: **${overlapSelectors.length}**`,`Overlapping selector/property pairs: **${overlapPairs.length}**`,`Form-local custom properties: **${cpNames.length}**`,'',`Synthetic concat SHA-256: \`${concatHash}\``,'',`Browser comparisons: **${browserResult.totalComparisons}**`,`Base states: **${browserResult.baseStates}**`,`Interaction states: **${browserResult.interactionStates}**`,`Validation/submission states: **${browserResult.validationStates}**`,`Reduced-motion states: **${browserResult.reducedMotionStates}**`,`Computed deltas: **${browserResult.computedDeltas.length}**`,`Geometry deltas: **${browserResult.geometryDeltas.length}**`,`Custom-property deltas: **${browserResult.customPropertyDeltas.length}**`,`State/inventory deltas: **${browserResult.stateDeltas.length}**`,`Reduced-motion deltas: **${browserResult.reducedMotionDeltas.length}**`,`Production-resource failures: **${browserResult.resourceFailures.length}**`,'',`Forced-colors contract present in target CSS: **${forcedColorsApplicable}**`,'',`Decision: **${result.decision.verdict}**`);
fs.writeFileSync(path.join(OUT,'phase-3b-2c-characterization-summary.md'),md.join('\n')+'\n');
console.log(JSON.stringify({routeCount:routes.length,routes:routes.map(r=>r.route),allReachBoth:staticResult.allReachBoth,allAdjacent:staticResult.allAdjacent,allSameOrder:staticResult.allSameOrder,runtimeFilenameRefs:runtimeRefs,nonRuntimeFilenameRefs:nonRuntimeRefs,overlapSelectorCount:overlapSelectors.length,overlapPairCount:overlapPairs.length,customPropertyCount:cpNames.length,browser:{base:browserResult.baseStates,interaction:browserResult.interactionStates,validation:browserResult.validationStates,reduced:browserResult.reducedMotionStates,total:browserResult.totalComparisons,computedDeltas:browserResult.computedDeltas.length,geometryDeltas:browserResult.geometryDeltas.length,customDeltas:browserResult.customPropertyDeltas.length,stateDeltas:browserResult.stateDeltas.length,reducedDeltas:browserResult.reducedMotionDeltas.length,resourceFailures:browserResult.resourceFailures.length},forcedColorsApplicable,decision:result.decision},null,2));
if(!ready) process.exitCode=2;
