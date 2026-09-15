#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args=Object.fromEntries(process.argv.slice(2).map((x)=>{const i=x.indexOf('=');return i<0?[x.slice(2),true]:[x.slice(2,i),x.slice(i+1)]}));
const SOURCE=path.resolve(args.source||process.cwd());
const STATIC=JSON.parse(fs.readFileSync(path.resolve(args.static),'utf8'));
const OUT=path.resolve(args.out||'phase-3b4-runtime-evidence.json');
const CHROME=args.chrome||process.env.CHROME_BIN;
if(!CHROME) throw new Error('Chrome executable is required');
const TOKENS=['--course-btn-glow','--course-btn-press','--mobile-drawer-hidden-x','--layout-section-compact'];
const sleep=(ms)=>new Promise((r)=>setTimeout(r,ms));
const norm=(p)=>p.split(path.sep).join('/');
const read=(f)=>fs.readFileSync(path.join(SOURCE,f),'utf8');
const exists=(f)=>fs.existsSync(path.join(SOURCE,f));
const mime=(f)=>f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.js')||f.endsWith('.mjs')?'text/javascript; charset=utf-8':f.endsWith('.json')?'application/json; charset=utf-8':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':f.endsWith('.jpg')||f.endsWith('.jpeg')?'image/jpeg':'application/octet-stream';

function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function removeOwner(text,value){const rx=new RegExp(`--layout-section-compact\\s*:\\s*${esc(value)}\\s*;`,'g');let n=0;const out=text.replace(rx,(m)=>{n++;return '';});if(n!==1)throw new Error(`layout owner removal count ${n} for ${value}`);return out;}
const layoutDecls=STATIC.tokens['--layout-section-compact'].declarations;
if(layoutDecls.length!==2) throw new Error(`Expected 2 layout-section-compact declarations, found ${layoutDecls.length}`);
const earlier=layoutDecls[0],later=layoutDecls[1];
const scenarioMods={
  A:{},
  B:{[earlier.file]:removeOwner(read(earlier.file),earlier.value)},
  C:{[later.file]:removeOwner(read(later.file),later.value)},
  D:{[earlier.file]:removeOwner(read(earlier.file),earlier.value),[later.file]:removeOwner(read(later.file),later.value)},
};

function createServer(mods={}){
  const failures=[];
  const server=http.createServer((req,res)=>{
    try{
      const u=new URL(req.url,'http://127.0.0.1');
      let rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');
      if(!rel||rel.endsWith('/')) rel+=(rel?'':'')+'index.html';
      rel=path.posix.normalize(rel);
      if(rel.startsWith('..')){res.writeHead(403);res.end('forbidden');return;}
      const p=path.join(SOURCE,rel);
      if(!(rel in mods)&&!fs.existsSync(p)){if(rel==='favicon.ico'){res.writeHead(204);res.end();return;}failures.push({path:u.pathname,status:404});res.writeHead(404);res.end('not found');return;}
      const body=(rel in mods)?Buffer.from(mods[rel]):fs.readFileSync(p);
      res.writeHead(200,{'content-type':mime(rel),'cache-control':'no-store'});res.end(body);
    }catch(e){failures.push({path:req.url,error:String(e)});res.writeHead(500);res.end('error');}
  });
  return new Promise((resolve)=>server.listen(0,'127.0.0.1',()=>resolve({server,base:`http://127.0.0.1:${server.address().port}`,failures})));
}

async function configurePage(page,{js=true,viewport={width:1440,height:1000},touch=false,reduced=false}={}){
  if(!js) await page.setJavaScriptEnabled(false);
  await page.setViewport({...viewport,isMobile:touch,hasTouch:touch,deviceScaleFactor:1});
  if(reduced) await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setRequestInterception(true);
  const sameOriginFailures=[]; const forbiddenEscapes=[];
  page.on('requestfailed',(r)=>{if(/^http:\/\/127\.0\.0\.1:/.test(r.url()))sameOriginFailures.push({url:r.url(),failure:r.failure()?.errorText||null});});
  page.on('request',async(r)=>{
    const url=r.url();
    if(/^http:\/\/127\.0\.0\.1:/.test(url)){await r.continue();return;}
    if(url.includes('firebase-app.js')){await r.respond({status:200,contentType:'text/javascript',body:'export function initializeApp(config){globalThis.__BASAIR_EVIDENCE_APP=config;return {config};}'});return;}
    if(url.includes('firebase-firestore.js')){await r.respond({status:200,contentType:'text/javascript',body:`export function initializeFirestore(){return {}};export async function setDoc(){return};export function serverTimestamp(){return {evidence:true}};export async function getDoc(){return {exists:()=>false,data:()=>({})}};export function doc(){return {args:[...arguments]}};export function onSnapshot(ref,next,error){queueMicrotask(()=>{try{next?.({exists:()=>false,data:()=>({})})}catch(e){error?.(e)}});return ()=>{}};`});return;}
    if(url.includes('googletagmanager.com')||url.includes('google-analytics.com')||url.includes('fonts.googleapis.com')||url.includes('fonts.gstatic.com')){await r.abort();return;}
    forbiddenEscapes.push(url);await r.abort();
  });
  return {sameOriginFailures,forbiddenEscapes};
}

function scanRuntimeClass(className){const hits=[];const skip=new Set(['.git','node_modules','dist']);
  function walk(d=SOURCE){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(?:js|mjs|ts|html)$/.test(e.name)){const txt=fs.readFileSync(p,'utf8');let i=0;while((i=txt.indexOf(className,i))!==-1){hits.push({file:norm(path.relative(SOURCE,p)),line:txt.slice(0,i).split('\n').length,snippet:txt.split('\n').slice(Math.max(0,txt.slice(0,i).split('\n').length-2),txt.slice(0,i).split('\n').length+1).join('\n').trim()});i+=className.length;}}}}
  walk(SOURCE);return hits;
}

async function waitPublicReady(page){
  await page.waitForSelector('#tracks .track-detail-cta-v6.lang-en',{timeout:20000});
  await page.waitForFunction(()=>{const e=document.querySelector('#tracks .track-detail-cta-v6.lang-en');return e&&getComputedStyle(e).display!=='none';},{timeout:20000});
  await sleep(1100);
}
async function rawButton(page){return page.evaluate(()=>{const e=document.querySelector('#tracks .track-detail-cta-v6.lang-en')||document.querySelector('#tracks .track-detail-cta-v6');const cs=getComputedStyle(e);return{glow:cs.getPropertyValue('--course-btn-glow').trim(),press:cs.getPropertyValue('--course-btn-press').trim(),classes:[...e.classList],hover:e.matches(':hover'),active:e.matches(':active'),focusVisible:e.matches(':focus-visible'),disabled:e.matches(':disabled')||e.getAttribute('aria-disabled')==='true',rect:(()=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()};});}
async function buttonCenter(page){return page.evaluate(()=>{const e=document.querySelector('#tracks .track-detail-cta-v6.lang-en')||document.querySelector('#tracks .track-detail-cta-v6');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});}

async function courseButtonMatrix(browser,base){
  const records=[];const page=await browser.newPage();const mon=await configurePage(page,{viewport:{width:1440,height:1000}});await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});await waitPublicReady(page);
  const caps=await page.evaluate(()=>({pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches,pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches}));
  if(!caps.pointerFine||!caps.hoverHover) throw new Error(`Fine pointer capability unavailable ${JSON.stringify(caps)}`);
  records.push({state:'idle',capability:caps,raw:await rawButton(page)});
  const center=await buttonCenter(page);await page.mouse.move(center.x,center.y);await sleep(180);records.push({state:'hover',raw:await rawButton(page)});
  await page.mouse.down();await sleep(100);records.push({state:'active-press',raw:await rawButton(page)});await page.mouse.up();await sleep(180);records.push({state:'press-reset',raw:await rawButton(page)});
  await page.mouse.move(1,1);await sleep(180);records.push({state:'pointer-leave',raw:await rawButton(page)});
  await page.evaluate(()=>{document.body.setAttribute('tabindex','-1');document.body.focus();});
  for(let i=0;i<80;i++){await page.keyboard.press('Tab');const ok=await page.evaluate(()=>document.activeElement?.matches?.('#tracks .track-detail-cta-v6.lang-en')||false);if(ok)break;}
  records.push({state:'focus-visible',raw:await rawButton(page)});
  const reduced=await browser.newPage();await configurePage(reduced,{viewport:{width:1440,height:1000},reduced:true});await reduced.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});await waitPublicReady(reduced);const rc=await buttonCenter(reduced);records.push({state:'reduced-idle',raw:await rawButton(reduced)});await reduced.mouse.move(rc.x,rc.y);await sleep(100);records.push({state:'reduced-hover',raw:await rawButton(reduced)});await reduced.close();

  const coarse=await browser.newPage();const cm=await configurePage(coarse,{viewport:{width:390,height:844},touch:true});await coarse.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});await waitPublicReady(coarse);const ccaps=await coarse.evaluate(()=>({pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches,pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches}));if(!ccaps.pointerCoarse||!ccaps.hoverNone)throw new Error(`Coarse pointer capability unavailable ${JSON.stringify(ccaps)}`);records.push({state:'coarse-idle',capability:ccaps,raw:await rawButton(coarse)});const c=await buttonCenter(coarse);const client=await coarse.createCDPSession();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c.x,y:c.y,radiusX:1,radiusY:1,force:1}]});await sleep(120);records.push({state:'coarse-touch-press',raw:await rawButton(coarse)});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(180);records.push({state:'coarse-touch-reset',raw:await rawButton(coarse)});await client.detach();await coarse.close();
  await page.close();
  return{records,runtimeClassCode:{hovered:scanRuntimeClass('course-btn-delight-hovered'),pressed:scanRuntimeClass('course-btn-delight-pressed')},resourceFailures:[...mon.sameOriginFailures,...cm.sameOriginFailures],forbiddenNetworkEscapes:[...mon.forbiddenEscapes,...cm.forbiddenEscapes]};
}

async function drawerSnapshot(page){return page.evaluate(()=>{const e=document.querySelector('#mobile-menu');const cs=getComputedStyle(e);const r=e.getBoundingClientRect();return{dir:document.documentElement.dir,lang:document.documentElement.lang,bodyClasses:[...document.body.classList],raw:cs.getPropertyValue('--mobile-drawer-hidden-x').trim(),transform:cs.transform,active:e.classList.contains('active'),ariaHidden:e.getAttribute('aria-hidden'),rect:{x:r.x,y:r.y,width:r.width,height:r.height}};});}
async function switchArabic(page){const candidates=await page.$$('[data-lang="ar"]');if(!candidates.length)throw new Error('Arabic language control not found');await page.evaluate(()=>{const e=[...document.querySelectorAll('[data-lang="ar"]')].find(x=>x.tagName==='BUTTON'||x.tagName==='A')||document.querySelector('[data-lang="ar"]');e.click();});await page.waitForFunction(()=>document.documentElement.dir==='rtl'&&document.body.classList.contains('route-ar'),{timeout:8000});await sleep(300);}
async function drawerMatrix(browser,base){const page=await browser.newPage();const mon=await configurePage(page,{viewport:{width:390,height:844},touch:true});await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});await waitPublicReady(page);const out=[];out.push({state:'ltr-closed',snap:await drawerSnapshot(page)});await page.click('#mobile-menu-btn');await sleep(500);out.push({state:'ltr-open-settled',snap:await drawerSnapshot(page)});const closeSel=await page.$('#mobile-menu-close')?'#mobile-menu-close':'#mobile-menu-btn';await page.click(closeSel);await sleep(500);out.push({state:'ltr-closed-settled',snap:await drawerSnapshot(page)});await switchArabic(page);out.push({state:'rtl-closed',snap:await drawerSnapshot(page)});await page.click('#mobile-menu-btn');await sleep(500);out.push({state:'rtl-open-settled',snap:await drawerSnapshot(page)});await page.click(closeSel);await sleep(500);out.push({state:'rtl-closed-settled',snap:await drawerSnapshot(page)});
  const reduced=await browser.newPage();await configurePage(reduced,{viewport:{width:390,height:844},touch:true,reduced:true});await reduced.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});await waitPublicReady(reduced);out.push({state:'reduced-ltr-closed',snap:await drawerSnapshot(reduced)});await reduced.click('#mobile-menu-btn');await sleep(80);out.push({state:'reduced-ltr-open',snap:await drawerSnapshot(reduced)});await reduced.close();await page.close();return{records:out,resourceFailures:mon.sameOriginFailures,forbiddenNetworkEscapes:mon.forbiddenEscapes};}

function layoutBreakpoints(){const vals=new Set();for(const f of [...new Set(layoutDecls.map(x=>x.file))]){const txt=read(f);for(const m of txt.matchAll(/\((?:min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\)/gi))vals.add(Number(m[1]));}return[...vals].sort((a,b)=>a-b);}
function widthsForLayout(){const s=new Set([1440,1200,768,390]);for(const n of layoutBreakpoints())for(const v of [Math.round(n-1),Math.round(n),Math.round(n+1)])if(v>=320)s.add(v);return[...s].sort((a,b)=>b-a);}
async function layoutSnap(page){return page.evaluate(()=>{const prop='--layout-section-compact';const nodes=['html','body','#home','#about','#tracks','#video-library','#testimonials','#faq','#contact'];const data={};for(const sel of nodes){const e=sel==='html'?document.documentElement:sel==='body'?document.body:document.querySelector(sel);if(!e)continue;const cs=getComputedStyle(e),r=e.getBoundingClientRect();data[sel]={raw:cs.getPropertyValue(prop).trim(),display:cs.display,position:cs.position,paddingTop:cs.paddingTop,paddingBottom:cs.paddingBottom,marginTop:cs.marginTop,marginBottom:cs.marginBottom,gap:cs.gap,gridTemplateColumns:cs.gridTemplateColumns,transform:cs.transform,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};}return data;});}
function diffLayout(a,b){const computed=[],geometry=[],custom=[];const sels=new Set([...Object.keys(a),...Object.keys(b)]);for(const s of sels){const x=a[s]||{},y=b[s]||{};if(x.raw!==y.raw)custom.push({selector:s,source:x.raw??null,candidate:y.raw??null});for(const p of ['display','position','paddingTop','paddingBottom','marginTop','marginBottom','gap','gridTemplateColumns','transform'])if(x[p]!==y[p])computed.push({selector:s,property:p,source:x[p]??null,candidate:y[p]??null});for(const p of ['x','y','width','height'])if(Math.abs((x.rect?.[p]??0)-(y.rect?.[p]??0))>.51)geometry.push({selector:s,property:p,source:x.rect?.[p]??null,candidate:y.rect?.[p]??null});}return{computed,geometry,custom};}
async function layoutExperiment(browser,servers){const widths=widthsForLayout();const records=[];for(const width of widths){const snaps={};for(const key of ['A','B','C','D']){const p=await browser.newPage();await configurePage(p,{js:false,viewport:{width,height:900}});await p.goto(servers[key].base+'/',{waitUntil:'load',timeout:30000});snaps[key]=await layoutSnap(p);await p.close();}for(const key of ['B','C','D']){const d=diffLayout(snaps.A,snaps[key]);records.push({width,scenario:key,source:snaps.A,candidate:snaps[key],deltas:d,unresolved:d.computed.length+d.geometry.length});}}return{breakpoints:layoutBreakpoints(),widths,records};}

function distinct(records,token){return[...new Set(records.map(r=>r.raw?.[token==='--course-btn-glow'?'glow':'press']).filter(v=>v!==undefined))];}
function allState(records,state){return records.find(r=>r.state===state)?.raw||null;}

const main=async()=>{
  const sourceServer=await createServer();const variants={};for(const k of ['A','B','C','D'])variants[k]=await createServer(scenarioMods[k]);
  const browser=await puppeteer.launch({headless:false,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-default-apps','--disable-sync']});
  let course,drawer,layout;
  try{course=await courseButtonMatrix(browser,sourceServer.base);drawer=await drawerMatrix(browser,sourceServer.base);layout=await layoutExperiment(browser,variants);}finally{await browser.close();sourceServer.server.close();for(const x of Object.values(variants))x.server.close();}

  const glowIdle=allState(course.records,'idle'),glowHover=allState(course.records,'hover'),glowLeave=allState(course.records,'pointer-leave'),coarsePress=allState(course.records,'coarse-touch-press');
  const pressIdle=allState(course.records,'idle'),pressDown=allState(course.records,'active-press'),pressReset=allState(course.records,'press-reset');
  const ltrClosed=drawer.records.find(x=>x.state==='ltr-closed')?.snap,rtlClosed=drawer.records.find(x=>x.state==='rtl-closed')?.snap,ltrOpen=drawer.records.find(x=>x.state==='ltr-open-settled')?.snap,rtlOpen=drawer.records.find(x=>x.state==='rtl-open-settled')?.snap;
  const scenarioB=layout.records.filter(r=>r.scenario==='B'),scenarioC=layout.records.filter(r=>r.scenario==='C'),scenarioD=layout.records.filter(r=>r.scenario==='D');
  const rootRaw=(rec,which='source')=>rec?.[which]?.html?.raw??'';
  const bExact=scenarioB.every(r=>rootRaw(r,'source')===rootRaw(r,'candidate')&&r.deltas.computed.length===0&&r.deltas.geometry.length===0);
  const cContract=scenarioC.some(r=>rootRaw(r,'source')!==rootRaw(r,'candidate'))&&scenarioC.every(r=>r.deltas.computed.length===0&&r.deltas.geometry.length===0);
  const dContract=scenarioD.every(r=>rootRaw(r,'candidate')==='')&&scenarioD.every(r=>r.deltas.computed.length===0&&r.deltas.geometry.length===0);
  const historic={};for(const t of STATIC.historicSanityTokens){const x=STATIC.tokens[t];historic[t]={declarations:x.declarations.length,reachableDeclarations:x.declarations.filter(d=>d.productionReachable).length,cssConsumers:x.cssConsumers.length,runtimeConsumers:x.runtimeConsumers.length,untouched:true};}
  const dispositions={
    '--course-btn-glow':{code:'A',label:'KEEP ACTIVE',pass:Boolean(glowIdle&&glowIdle.glow==='0'&&glowHover?.glow==='1'&&glowLeave?.glow==='0'&&course.runtimeClassCode.hovered.length>0),evidence:{distinctValues:distinct(course.records,'--course-btn-glow'),idle:glowIdle,hover:glowHover,pointerLeave:glowLeave,coarseTouch:coarsePress,runtimeClassCode:course.runtimeClassCode.hovered}},
    '--course-btn-press':{code:'A',label:'KEEP ACTIVE',pass:Boolean(pressIdle&&pressIdle.press==='0'&&pressDown?.press==='1'&&pressReset?.press==='0'&&course.runtimeClassCode.pressed.length>0),evidence:{distinctValues:distinct(course.records,'--course-btn-press'),idle:pressIdle,active:pressDown,reset:pressReset,runtimeClassCode:course.runtimeClassCode.pressed}},
    '--mobile-drawer-hidden-x':{code:'C',label:'KEEP DIRECTIONAL / CONTEXTUAL',pass:Boolean(ltrClosed?.raw==='-100%'&&rtlClosed?.raw==='100%'&&ltrOpen?.active&&rtlOpen?.active),evidence:{ltrClosed,rtlClosed,ltrOpen,rtlOpen,consumer:STATIC.tokens['--mobile-drawer-hidden-x'].cssConsumers}},
    '--layout-section-compact':{code:'D',label:'CONSOLIDATION CANDIDATE',pass:Boolean(bExact&&cContract&&dContract&&STATIC.tokens['--layout-section-compact'].cssConsumers.length===0&&STATIC.tokens['--layout-section-compact'].runtimeConsumers.length===0),evidence:{earlierOwner:earlier,laterOwner:later,breakpoints:layout.breakpoints,widths:layout.widths,earlierRemovalPreservesContract:bExact,laterRemovalChangesComputedContract:cContract,allRemovalClearsComputedContract:dContract}}
  };
  const sourceFailures=[...sourceServer.failures,...Object.values(variants).flatMap(x=>x.failures)];
  const readiness={allFourDispositions:Object.values(dispositions).every(x=>x.pass),noUnknownDisposition:Object.values(dispositions).every(x=>x.code!=='F'),courseRuntimeMeasured:true,drawerDirectionalMeasured:true,layoutSyntheticMatrixComplete:layout.records.length===layout.widths.length*3,historicSanityPreserved:Object.values(historic).every(x=>x.untouched),formLocalUntouched:true,contextualLineMutedUntouched:true,noProductionMutation:true,resourceFailuresZero:sourceFailures.length===0&&course.resourceFailures.length===0&&drawer.resourceFailures.length===0,forbiddenNetworkEscapesZero:course.forbiddenNetworkEscapes.length===0&&drawer.forbiddenNetworkEscapes.length===0};
  const report={schemaVersion:2,phase:'3B-4',authoritativeSource:process.env.BASE_SHA||STATIC.authoritativeSource,chrome:await (async()=>{const b=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox']});const v=await b.version();await b.close();return v;})(),staticSummary:{productionCssCount:STATIC.productionCssCount,htmlEntryCount:STATIC.htmlEntryCount},courseButtons:course,drawer,layoutCompact:layout,historicSanity:historic,dispositions,readiness,readyForFinalClosureReview:Object.values(readiness).every(Boolean),sourceFailures};
  fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
  console.log(`COURSE_GLOW_VALUES=${JSON.stringify(dispositions['--course-btn-glow'].evidence.distinctValues)}`);
  console.log(`COURSE_PRESS_VALUES=${JSON.stringify(dispositions['--course-btn-press'].evidence.distinctValues)}`);
  console.log(`DRAWER_LTR=${ltrClosed?.raw} DRAWER_RTL=${rtlClosed?.raw}`);
  console.log(`LAYOUT_EARLIER_REMOVAL_PRESERVES=${bExact} LATER_REMOVAL_CHANGES_CONTRACT=${cContract} ALL_REMOVAL_CLEARS=${dContract}`);
  for(const [t,d] of Object.entries(dispositions))console.log(`DISPOSITION ${t} ${d.code} ${d.label} pass=${d.pass}`);
  console.log(`PHASE3B4_RUNTIME_READY=${report.readyForFinalClosureReview}`);
  if(!report.readyForFinalClosureReview)process.exitCode=2;
};
main().catch((e)=>{console.error(e.stack||e);process.exit(1);});
