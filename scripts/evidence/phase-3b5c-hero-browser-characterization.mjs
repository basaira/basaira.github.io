import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';

const HERO_FILES=['hero-typeset-v2.css','hero-layout-v2.css','hero-overdrive-v2.css','hero-delight-v4.css','hero-animate-v4.css','hero-polish-v4.css','hero-cta-overdrive-v1.css'];
const PAIRS=HERO_FILES.slice(0,-1).map((first,i)=>({id:`P${i+1}`,first,second:HERO_FILES[i+1]}));
const VIEWPORT_WIDTHS=[1440,1200,1121,1120,1119,1024,1023,1022,768,641,640,639,391,390,389];
const LOCALES=['en','ar','fr','ru','uz'];
const COMPUTED_PROPS=['display','position','width','height','minWidth','minHeight','maxWidth','maxHeight','margin','marginTop','marginRight','marginBottom','marginLeft','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','gap','rowGap','columnGap','gridTemplateColumns','alignItems','justifyContent','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','color','backgroundColor','backgroundImage','backgroundPosition','backgroundSize','border','borderColor','borderRadius','boxShadow','opacity','filter','transform','translate','perspective','overflow','isolation','zIndex','outline','outlineOffset','transition','transitionProperty','transitionDuration','transitionDelay','animation','animationName','animationDuration','animationDelay','animationIterationCount','willChange','touchAction','visibility','pointerEvents','content'];
const SAMPLES=[
  ['home','#home'],['shell','#home > .hero-shell'],['copy','#home .hero-copy-column'],['kicker','#home .hero-kicker'],['kicker-dot','#home .hero-kicker > span:first-child'],['title','#home .hero-title'],['title-1','#home .hero-title__line:nth-child(1)'],['title-2','#home .hero-title__line:nth-child(2)'],['accent','#home .hero-title__line--accent'],['copy-p','#home .hero-copy-column > p'],['cta-group','#home .hero-cta-group'],['cta-primary','#home .hero-primary-cta'],['cta-secondary','#home .hero-secondary-cta'],['stage','#home .hero-visual-stage'],['plate','#home .hero-visual-plate'],['grid','#home .hero-visual-grid'],['axis','#home .hero-visual-axis'],['seal','#home .hero-visual-seal'],['orbit-a','#home .hero-visual-orbit--a'],['orbit-b','#home .hero-visual-orbit--b'],['node-1','#home .hero-visual-node--1'],['node-2','#home .hero-visual-node--2'],['node-3','#home .hero-visual-node--3'],
];
const PSEUDOS=[['home-before','#home','::before'],['home-after','#home','::after'],['kicker-after','#home .hero-kicker','::after'],['accent-after','#home .hero-title__line--accent','::after'],['primary-before','#home .hero-primary-cta','::before'],['primary-after','#home .hero-primary-cta','::after'],['secondary-before','#home .hero-secondary-cta','::before'],['secondary-after','#home .hero-secondary-cta','::after'],['stage-before','#home .hero-visual-stage','::before'],['plate-before','#home .hero-visual-plate','::before'],['plate-after','#home .hero-visual-plate','::after'],['seal-before','#home .hero-visual-seal','::before'],['node1-after','#home .hero-visual-node--1','::after']];

function args(){const o={};for(const a of process.argv.slice(2)){const m=a.match(/^--([^=]+)=(.*)$/s);if(m)o[m[1]]=m[2];}return o;}
const opts=args();if(!opts.source||!opts.static||!opts.out||!opts.chrome)throw new Error('usage --source --static --out --chrome');
const source=path.resolve(opts.source), staticData=JSON.parse(fs.readFileSync(opts.static,'utf8')), outPath=path.resolve(opts.out), chrome=opts.chrome;
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const customNames=Object.keys(staticData.heroCustomProperties||{}).sort();

const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
function serverFor(root){
  const server=http.createServer((req,res)=>{
    try{
      const u=new URL(req.url,'http://local'); let pathname=decodeURIComponent(u.pathname);
      if(pathname==='/tailwindcss'||pathname==='/tailwindcss/') {res.writeHead(200,{'content-type':'text/css; charset=utf-8','cache-control':'no-store'});res.end('');return;}
      if(pathname.endsWith('/'))pathname+='index.html';
      const target=path.resolve(root,'.'+pathname);
      if(!target.startsWith(path.resolve(root)+path.sep) && target!==path.join(path.resolve(root),'index.html')){res.writeHead(403);res.end('forbidden');return;}
      if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404,{'content-type':'text/plain'});res.end('not found');return;}
      res.writeHead(200,{'content-type':MIME[path.extname(target).toLowerCase()]||'application/octet-stream','cache-control':'no-store','access-control-allow-origin':'*'});fs.createReadStream(target).pipe(res);
    }catch(e){res.writeHead(500);res.end(String(e));}
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,origin:`http://127.0.0.1:${server.address().port}`})));
}

const FIREBASE_APP_STUB=`export const initializeApp=(config)=>({config,name:'evidence-app'});`;
const FIRESTORE_STUB=`
const snap={exists:()=>false,data:()=>({}),docs:[],empty:true,size:0,forEach:()=>{}};
export const initializeFirestore=()=>({kind:'evidence-firestore'});
export const setDoc=async()=>{};
export const serverTimestamp=()=>({__serverTimestamp:true});
export const getDoc=async()=>snap;
export const doc=(...args)=>({path:args.slice(1).join('/'),args});
export const onSnapshot=(...args)=>{const funcs=args.filter(x=>typeof x==='function');const next=funcs[0];queueMicrotask(()=>{try{next?.(snap)}catch{}});return()=>{}};
`;
async function configurePage(page,origin,{mobile=false,reduced=false}={}){
  const failures=[]; const pageErrors=[];
  await page.setCacheEnabled(false);
  await page.setViewport(mobile?{width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true}:{width:1440,height:900,deviceScaleFactor:1,isMobile:false,hasTouch:false});
  if(reduced)await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setRequestInterception(true);
  page.on('request',req=>{
    const u=req.url();
    if(u.startsWith(origin)){req.continue();return;}
    const headers={'access-control-allow-origin':'*','cache-control':'no-store'};
    if(u.includes('/firebase-app.js')){req.respond({status:200,contentType:'text/javascript',headers,body:FIREBASE_APP_STUB});return;}
    if(u.includes('/firebase-firestore.js')){req.respond({status:200,contentType:'text/javascript',headers,body:FIRESTORE_STUB});return;}
    if(u.includes('fonts.googleapis.com')){req.respond({status:200,contentType:'text/css',headers,body:''});return;}
    if(u.includes('googletagmanager.com')||u.includes('google-analytics.com')){req.respond({status:200,contentType:'text/javascript',headers,body:'/* evidence stub */'});return;}
    req.respond({status:204,headers,body:''});
  });
  page.on('requestfailed',req=>{const u=req.url();if(u.startsWith(origin))failures.push({type:'requestfailed',url:u,error:req.failure()?.errorText||''});});
  page.on('response',res=>{const u=res.url();if(u.startsWith(origin)&&res.status()>=400)failures.push({type:'http',url:u,status:res.status()});});
  page.on('pageerror',e=>pageErrors.push(String(e?.message||e)));
  return {failures,pageErrors};
}
async function waitHero(page){
  await page.waitForSelector('#home .hero-primary-cta',{timeout:12000});
  await page.waitForSelector('#home .hero-secondary-cta',{timeout:12000});
  await page.waitForSelector('#home .hero-visual-stage',{timeout:12000});
  await page.waitForFunction(()=>typeof window.setLang==='function',{timeout:12000});
}
async function capabilities(page){return page.evaluate(()=>({pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches,pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,forced:matchMedia('(forced-colors: active)').matches,userAgent:navigator.userAgent}));}
async function setLocale(page,lang){
  await page.evaluate(async l=>{await Promise.resolve(window.setLang(l));window.scrollTo(0,0);},lang);
  const dir=lang==='ar'?'rtl':'ltr';
  await page.waitForFunction((l,d)=>document.documentElement.lang===l&&document.documentElement.dir===d&&document.body.classList.contains(`route-${l}`),{timeout:8000},lang,dir);
  await sleep(80);
}
async function pauseAnimationsAtZero(page){await page.evaluate(()=>{for(const a of document.getAnimations({subtree:true})){try{a.currentTime=0;a.pause()}catch{}}});await sleep(20);}
async function freezeSettled(page){await page.evaluate(()=>{for(const a of document.getAnimations({subtree:true})){try{const t=a.effect?.getTiming?.()||{};if(t.iterations===Infinity){a.currentTime=0;a.pause();}else a.finish();}catch{try{a.pause()}catch{}}}});await sleep(30);}
async function settleEntered(page){await page.waitForFunction(()=>document.body.classList.contains('motion-entered'),{timeout:5000});await sleep(1450);await freezeSettled(page);}
async function snapshot(page){
  return page.evaluate(({samples,pseudos,props,customNames})=>{
    const val=(cs,p)=>cs[p]??cs.getPropertyValue(p);
    const pack=(el,pseudo=null)=>{if(!el)return null;const cs=getComputedStyle(el,pseudo);const computed={};for(const p of props)computed[p]=String(val(cs,p)||'');const rect=pseudo?null:el.getBoundingClientRect();return {computed,geometry:rect?{x:+rect.x.toFixed(3),y:+rect.y.toFixed(3),width:+rect.width.toFixed(3),height:+rect.height.toFixed(3),top:+rect.top.toFixed(3),right:+rect.right.toFixed(3),bottom:+rect.bottom.toFixed(3),left:+rect.left.toFixed(3)}:null};};
    const elements={};for(const [name,sel] of samples)elements[name]=pack(document.querySelector(sel));for(const [name,sel,pseudo] of pseudos)elements[name]=pack(document.querySelector(sel),pseudo);
    const custom={};for(const [scope,sel] of [['root','html'],['hero','#home'],['primary','#home .hero-primary-cta'],['secondary','#home .hero-secondary-cta'],['stage','#home .hero-visual-stage']]){const el=document.querySelector(sel);const cs=el?getComputedStyle(el):null;custom[scope]={};for(const n of customNames)custom[scope][n]=cs?cs.getPropertyValue(n).trim():'';}
    const primary=document.querySelector('#home .hero-primary-cta'),secondary=document.querySelector('#home .hero-secondary-cta');
    const state={lang:document.documentElement.lang,dir:document.documentElement.dir,motionPrep:document.body.classList.contains('motion-prep'),motionEntered:document.body.classList.contains('motion-entered'),primaryHover:primary?.matches(':hover')||false,primaryActive:primary?.matches(':active')||false,primaryFocusVisible:primary?.matches(':focus-visible')||false,secondaryFocusVisible:secondary?.matches(':focus-visible')||false,primaryAck:primary?.classList.contains('is-acknowledged')||false,secondaryAck:secondary?.classList.contains('is-acknowledged')||false,hash:location.hash,capabilities:{pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches,pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,forced:matchMedia('(forced-colors: active)').matches}};
    const access={primary:primary?{tag:primary.tagName,href:primary.getAttribute('href'),tabIndex:primary.tabIndex,ariaLabel:primary.getAttribute('aria-label'),role:primary.getAttribute('role')} : null,secondary:secondary?{tag:secondary.tagName,href:secondary.getAttribute('href'),tabIndex:secondary.tabIndex,ariaLabel:secondary.getAttribute('aria-label'),role:secondary.getAttribute('role')} : null,activeElement:document.activeElement?.matches?.('#home .hero-primary-cta')?'primary':document.activeElement?.matches?.('#home .hero-secondary-cta')?'secondary':document.activeElement?.tagName||null};
    const cssom=[...document.styleSheets].map(s=>({href:s.href?new URL(s.href,location.href).pathname:null,disabled:s.disabled,ruleCount:(()=>{try{return s.cssRules.length}catch{return null}})()}));
    return {elements,custom,state,access,cssom};
  },{samples:SAMPLES,pseudos:PSEUDOS,props:COMPUTED_PROPS,customNames});
}
function diffSnapshots(a,b){
  const computed=[],geometry=[],custom=[],state=[],accessibility=[];
  const keys=new Set([...Object.keys(a.elements||{}),...Object.keys(b.elements||{})]);
  for(const k of keys){const ae=a.elements?.[k],be=b.elements?.[k];if(!ae||!be){computed.push({sample:k,property:'__presence',source:Boolean(ae),synthetic:Boolean(be)});continue;}for(const p of COMPUTED_PROPS){if(ae.computed[p]!==be.computed[p])computed.push({sample:k,property:p,source:ae.computed[p],synthetic:be.computed[p]});}if(ae.geometry&&be.geometry){for(const p of Object.keys(ae.geometry)){if(Math.abs(ae.geometry[p]-be.geometry[p])>.11)geometry.push({sample:k,property:p,source:ae.geometry[p],synthetic:be.geometry[p]});}}}
  for(const scope of Object.keys(a.custom||{})){for(const n of customNames){if((a.custom?.[scope]?.[n]??'')!==(b.custom?.[scope]?.[n]??''))custom.push({scope,name:n,source:a.custom?.[scope]?.[n]??'',synthetic:b.custom?.[scope]?.[n]??''});}}
  for(const k of Object.keys(a.state||{})){if(JSON.stringify(a.state[k])!==JSON.stringify(b.state?.[k]))state.push({property:k,source:a.state[k],synthetic:b.state?.[k]});}
  if(JSON.stringify(a.access)!==JSON.stringify(b.access))accessibility.push({source:a.access,synthetic:b.access});
  return {computed,geometry,custom,state,accessibility};
}
function recordCompare(records,label,category,a,b){const d=diffSnapshots(a,b);records.push({label,category,source:a,synthetic:b,deltas:d});return d;}
function aggregate(records){const total={comparisons:records.length,computed:0,geometry:0,custom:0,state:0,motion:0,accessibility:0};for(const r of records){total.computed+=r.deltas.computed.length;total.geometry+=r.deltas.geometry.length;total.custom+=r.deltas.custom.length;total.state+=r.deltas.state.length;total.accessibility+=r.deltas.accessibility.length;if(r.category==='motion')total.motion+=r.deltas.computed.length+r.deltas.geometry.length+r.deltas.custom.length+r.deltas.state.length;}return total;}
async function center(page,sel){const r=await page.$eval(sel,e=>{const b=e.getBoundingClientRect();return{x:b.left+b.width*.5,y:b.top+b.height*.5}});return r;}
async function moveRatio(page,sel,rx,ry){const p=await page.$eval(sel,(e,r)=>{const b=e.getBoundingClientRect();return{x:b.left+b.width*r[0],y:b.top+b.height*r[1]}},[rx,ry]);await page.mouse.move(p.x,p.y);}
async function focusPrimaryByKeyboard(page){await page.mouse.move(1,1);await page.evaluate(()=>document.activeElement?.blur?.());for(let i=0;i<50;i++){await page.keyboard.press('Tab');const ok=await page.$eval('#home .hero-primary-cta',e=>e.matches(':focus-visible'));if(ok)return;}throw new Error('Could not reach primary CTA by keyboard Tab');}
function cleanCopy(src,dst){fs.cpSync(src,dst,{recursive:true,filter:s=>!['.git','node_modules','dist','.vite'].includes(path.basename(s))});}
function constructVariant(pair,tempRoot){
  const dir=path.join(tempRoot,pair.id.toLowerCase());cleanCopy(source,dir);
  const a=fs.readFileSync(path.join(source,pair.first)),b=fs.readFileSync(path.join(source,pair.second)),concat=Buffer.concat([a,b]);fs.writeFileSync(path.join(dir,pair.first),concat);fs.rmSync(path.join(dir,pair.second));
  const ip=path.join(dir,'index.html');let html=fs.readFileSync(ip,'utf8');const re=new RegExp(`<link\\s+[^>]*href=["'](?:\\./)?${escapeRe(pair.second)}(?:\\?[^"']*)?["'][^>]*rel=["']stylesheet["'][^>]*>`,'g');const matches=[...html.matchAll(re)];if(matches.length!==1)throw new Error(`${pair.id}: expected one second link, got ${matches.length}`);const removed=matches[0][0];html=html.replace(re,'');if(!html.includes(pair.first))throw new Error(`${pair.id}: survivor link missing`);fs.writeFileSync(ip,html);
  return {dir,concatSha256:sha256(concat),concatBytes:concat.length,firstSha256:sha256(a),firstBytes:a.length,secondSha256:sha256(b),secondBytes:b.length,removedLink:removed,secondFileDeleted:!fs.existsSync(path.join(dir,pair.second))};
}
async function openPair(browserS,browserT,originS,originT,{mobile=false,reduced=false}={}){
  const s=await browserS.newPage(),t=await browserT.newPage();const sm=await configurePage(s,originS,{mobile,reduced}),tm=await configurePage(t,originT,{mobile,reduced});
  await Promise.all([s.goto(originS+'/',{waitUntil:'domcontentloaded',timeout:30000}),t.goto(originT+'/',{waitUntil:'domcontentloaded',timeout:30000})]);await Promise.all([waitHero(s),waitHero(t)]);return{s,t,sm,tm};
}

const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),'phase3b5c-'));
const sourceServer=await serverFor(source);
const browserSource=await puppeteer.launch({headless:false,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--metrics-recording-only','--no-first-run']});
const browserSynthetic=await puppeteer.launch({headless:false,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--metrics-recording-only','--no-first-run']});
const environment={chromeVersion:await browserSource.version(),sourceProcessIndependent:true,syntheticProcessIndependent:true,viewports:VIEWPORT_WIDTHS,locales:LOCALES,forcedColorsApplicable:Boolean(staticData.forcedColorsUsed),intermediateAnimation:{tested:false,reason:'Mixed delayed CSS transitions/keyframes are characterized at deterministic pre-animation and settled boundaries rather than unsynchronized wall-clock intermediate timestamps.'}};
const pairResults=[];
try{
  for(const pair of PAIRS){
    const variant=constructVariant(pair,tempRoot);const synServer=await serverFor(variant.dir);const records=[];const unresolved=[];let resourceFailures=[];let fineCaps=null,coarseCaps=null,reducedCaps=null,cssomBoundary=null,nativeAnchor={};
    try{
      const {s,t,sm,tm}=await openPair(browserSource,browserSynthetic,sourceServer.origin,synServer.origin);
      fineCaps={source:await capabilities(s),synthetic:await capabilities(t)};
      if(!fineCaps.source.pointerFine||!fineCaps.source.hoverHover||!fineCaps.synthetic.pointerFine||!fineCaps.synthetic.hoverHover) unresolved.push({type:'fine-capability',fineCaps});
      const preClasses=await Promise.all([s.evaluate(()=>({prep:document.body.classList.contains('motion-prep'),entered:document.body.classList.contains('motion-entered')})),t.evaluate(()=>({prep:document.body.classList.contains('motion-prep'),entered:document.body.classList.contains('motion-entered')}))]);
      if(!preClasses.every(x=>x.prep&&!x.entered)) unresolved.push({type:'pre-animation-boundary-not-captured',preClasses});
      await Promise.all([pauseAnimationsAtZero(s),pauseAnimationsAtZero(t)]);recordCompare(records,'initial-pre-animation','motion',await snapshot(s),await snapshot(t));
      await Promise.all([settleEntered(s),settleEntered(t)]);recordCompare(records,'initial-settled','motion',await snapshot(s),await snapshot(t));
      cssomBoundary={source:(await snapshot(s)).cssom,synthetic:(await snapshot(t)).cssom};
      for(const width of VIEWPORT_WIDTHS){await Promise.all([s.setViewport({width,height:width<=640?844:900,deviceScaleFactor:1,isMobile:false,hasTouch:false}),t.setViewport({width,height:width<=640?844:900,deviceScaleFactor:1,isMobile:false,hasTouch:false})]);for(const lang of LOCALES){await Promise.all([setLocale(s,lang),setLocale(t,lang)]);await Promise.all([freezeSettled(s),freezeSettled(t)]);recordCompare(records,`responsive:${width}:${lang}`,'responsive',await snapshot(s),await snapshot(t));}}
      await Promise.all([s.setViewport({width:1440,height:900,deviceScaleFactor:1,isMobile:false,hasTouch:false}),t.setViewport({width:1440,height:900,deviceScaleFactor:1,isMobile:false,hasTouch:false}),setLocale(s,'en'),setLocale(t,'en')]);await sleep(100);await Promise.all([freezeSettled(s),freezeSettled(t)]);recordCompare(records,'fine-idle','interaction',await snapshot(s),await snapshot(t));
      await Promise.all([moveRatio(s,'#home .hero-primary-cta',.55,.45),moveRatio(t,'#home .hero-primary-cta',.55,.45)]);await sleep(280);recordCompare(records,'fine-hover-primary','interaction',await snapshot(s),await snapshot(t));
      await Promise.all([moveRatio(s,'#home .hero-visual-stage',.72,.33),moveRatio(t,'#home .hero-visual-stage',.72,.33)]);await sleep(90);recordCompare(records,'fine-stage-pointer-custom','interaction',await snapshot(s),await snapshot(t));
      await Promise.all([moveRatio(s,'#home .hero-primary-cta',.33,.64),moveRatio(t,'#home .hero-primary-cta',.33,.64)]);await sleep(90);recordCompare(records,'fine-cta-pointer-custom','interaction',await snapshot(s),await snapshot(t));
      await Promise.all([s.mouse.down(),t.mouse.down()]);await sleep(60);recordCompare(records,'fine-active-primary','interaction',await snapshot(s),await snapshot(t));await Promise.all([s.mouse.move(1,1),t.mouse.move(1,1)]);await Promise.all([s.mouse.up(),t.mouse.up()]);await sleep(90);recordCompare(records,'fine-acknowledged-after-press','interaction',await snapshot(s),await snapshot(t));await sleep(430);recordCompare(records,'fine-pointer-leave-reset','interaction',await snapshot(s),await snapshot(t));
      await Promise.all([focusPrimaryByKeyboard(s),focusPrimaryByKeyboard(t)]);await sleep(80);recordCompare(records,'keyboard-focus-primary','interaction',await snapshot(s),await snapshot(t));await Promise.all([s.keyboard.press('Tab'),t.keyboard.press('Tab')]);await sleep(80);recordCompare(records,'keyboard-focus-secondary','interaction',await snapshot(s),await snapshot(t));
      await Promise.all([setLocale(s,'ar'),setLocale(t,'ar')]);await Promise.all([moveRatio(s,'#home .hero-primary-cta',.5,.5),moveRatio(t,'#home .hero-primary-cta',.5,.5)]);await sleep(260);recordCompare(records,'rtl-primary-hover','interaction',await snapshot(s),await snapshot(t));
      await Promise.all([setLocale(s,'en'),setLocale(t,'en')]);await Promise.all([s.evaluate(()=>document.querySelector('#home .hero-secondary-cta')?.click()),t.evaluate(()=>document.querySelector('#home .hero-secondary-cta')?.click())]);await sleep(100);nativeAnchor={sourceHash:await s.evaluate(()=>location.hash),syntheticHash:await t.evaluate(()=>location.hash)};recordCompare(records,'native-anchor-secondary','interaction',await snapshot(s),await snapshot(t));if(nativeAnchor.sourceHash!=='#quick-guide'||nativeAnchor.syntheticHash!=='#quick-guide')unresolved.push({type:'native-anchor-navigation',nativeAnchor});
      resourceFailures.push(...sm.failures,...tm.failures);if(sm.pageErrors.length||tm.pageErrors.length)unresolved.push({type:'page-errors',source:sm.pageErrors,synthetic:tm.pageErrors});await Promise.all([s.close(),t.close()]);

      const coarse=await openPair(browserSource,browserSynthetic,sourceServer.origin,synServer.origin,{mobile:true});coarseCaps={source:await capabilities(coarse.s),synthetic:await capabilities(coarse.t)};if(!coarseCaps.source.pointerCoarse||!coarseCaps.source.hoverNone||!coarseCaps.synthetic.pointerCoarse||!coarseCaps.synthetic.hoverNone)unresolved.push({type:'coarse-capability',coarseCaps});await Promise.all([settleEntered(coarse.s),settleEntered(coarse.t)]);recordCompare(records,'coarse-idle','interaction',await snapshot(coarse.s),await snapshot(coarse.t));const c1=await center(coarse.s,'#home .hero-primary-cta'),c2=await center(coarse.t,'#home .hero-primary-cta');const cs=await coarse.s.target().createCDPSession(),ct=await coarse.t.target().createCDPSession();await Promise.all([cs.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c1.x,y:c1.y}]}),ct.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c2.x,y:c2.y}]})]);await sleep(70);recordCompare(records,'coarse-touch-active','interaction',await snapshot(coarse.s),await snapshot(coarse.t));await Promise.all([cs.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}),ct.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})]);await sleep(420);recordCompare(records,'coarse-touch-reset','interaction',await snapshot(coarse.s),await snapshot(coarse.t));resourceFailures.push(...coarse.sm.failures,...coarse.tm.failures);if(coarse.sm.pageErrors.length||coarse.tm.pageErrors.length)unresolved.push({type:'coarse-page-errors',source:coarse.sm.pageErrors,synthetic:coarse.tm.pageErrors});await Promise.all([coarse.s.close(),coarse.t.close()]);

      const reduced=await openPair(browserSource,browserSynthetic,sourceServer.origin,synServer.origin,{reduced:true});reducedCaps={source:await capabilities(reduced.s),synthetic:await capabilities(reduced.t)};if(!reducedCaps.source.reduced||!reducedCaps.synthetic.reduced)unresolved.push({type:'reduced-capability',reducedCaps});await Promise.all([pauseAnimationsAtZero(reduced.s),pauseAnimationsAtZero(reduced.t)]);recordCompare(records,'reduced-initial','motion',await snapshot(reduced.s),await snapshot(reduced.t));await sleep(950);await Promise.all([freezeSettled(reduced.s),freezeSettled(reduced.t)]);recordCompare(records,'reduced-settled','motion',await snapshot(reduced.s),await snapshot(reduced.t));resourceFailures.push(...reduced.sm.failures,...reduced.tm.failures);if(reduced.sm.pageErrors.length||reduced.tm.pageErrors.length)unresolved.push({type:'reduced-page-errors',source:reduced.sm.pageErrors,synthetic:reduced.tm.pageErrors});await Promise.all([reduced.s.close(),reduced.t.close()]);
    }catch(e){unresolved.push({type:'harness-exception',message:String(e?.stack||e)});}
    await new Promise(r=>synServer.server.close(r));
    const totals=aggregate(records);const staticPair=staticData.pairs.find(x=>x.id===pair.id);const runtimeFilenameDep=(staticPair?.runtimeFilenameHits||[]).length>0;const productionCssomObserver=(staticData.cssomRefs||[]).length>0;
    const resourceCount=resourceFailures.length;const unexpected=totals.computed+totals.geometry+totals.custom+totals.state+totals.accessibility+resourceCount+unresolved.length;
    let disposition='A — SAFE EXACT-CONCAT PAIR',ownershipFinding='No runtime/CSSOM blocker or protected component boundary identified.';
    if(unexpected>0){disposition='E — BLOCKED / UNKNOWN';ownershipFinding='Unexpected browser/resource/harness delta remains.';}
    else if(runtimeFilenameDep||productionCssomObserver){disposition='C — KEEP SEPARATE — RUNTIME/CSSOM CONTRACT';ownershipFinding='Production runtime observes a target filename or stylesheet boundary.';}
    else if(pair.id==='P2'){disposition='B — KEEP SEPARATE — COMPONENT OWNERSHIP';ownershipFinding='hero-overdrive-v2.css is coupled to the dedicated hero-overdrive-v2.js pointer/custom-property component; preserve its CSS/JS ownership boundary.';}
    else if(pair.id==='P3'){disposition='B — KEEP SEPARATE — COMPONENT OWNERSHIP';ownershipFinding='Boundary separates two independently JS-coupled Hero interaction domains (Overdrive pointer engine vs Delight acknowledgement).';}
    else if(pair.id==='P6'){disposition='B — KEEP SEPARATE — COMPONENT OWNERSHIP';ownershipFinding='hero-cta-overdrive-v1.css has a dedicated JS companion, native-anchor/focus/pointer contract, and dedicated checker; preserve CTA component isolation.';}
    pairResults.push({pair,...variant,staticPair,environment:{fineCaps,coarseCaps,reducedCaps},records,totals,resourceFailures,resourceFailureCount:resourceCount,unresolved,unresolvedCount:unresolved.length,cssomBoundary,nativeAnchor,ownershipFinding,disposition,pass:unexpected===0});
    console.log(`${pair.id} comparisons=${totals.comparisons} computed=${totals.computed} geometry=${totals.geometry} custom=${totals.custom} state=${totals.state} motion=${totals.motion} accessibility=${totals.accessibility} resources=${resourceCount} unresolved=${unresolved.length} disposition=${disposition}`);
  }
} finally {
  await Promise.allSettled([browserSource.close(),browserSynthetic.close()]); await new Promise(r=>sourceServer.server.close(r)); fs.rmSync(tempRoot,{recursive:true,force:true});
}
const totalComparisons=pairResults.reduce((n,p)=>n+p.totals.comparisons,0);const blockers=pairResults.filter(p=>!p.pass||p.disposition.startsWith('E'));
const recommendedSequence={
  direct:[
    {step:1,pair:'P1',survivor:'hero-typeset-v2.css',retire:'hero-layout-v2.css',expectedProductionCss:51,rationale:'Isolated safe pair; pure CSS structural layers; no runtime filename/CSSOM blocker.'},
    {step:2,pair:'P4',survivor:'hero-delight-v4.css',retire:'hero-animate-v4.css',expectedProductionCss:50,rationale:'Isolated safe pair; survivor keeps Delight CSS beside its JS companion while absorbing adjacent entrance choreography. P1 is disjoint, so P4 source bytes/order are unchanged by step 1.'},
  ],
  conditional:[{pair:'P5',status:'isolated-safe-alternative',note:'P5 is safe in isolation, but after P4 the left boundary becomes the combined Delight+Animate survivor. Re-characterize that new boundary before any further merge with hero-polish-v4.css.'}],
  keepSeparate:['P2','P3','P6'],
  invariant:'track-buttons-v6.css remains terminal; hero-cta-overdrive-v1.css remains isolated; no multi-file transitive collapse inferred.'
};
const output={schema:'phase-3b-5c-browser-v1',generatedAt:new Date().toISOString(),baseSha:process.env.BASE_SHA||null,environment,totalComparisons,pairs:pairResults,recommendedSequence,ready:blockers.length===0};
fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(output,null,2));
if(blockers.length)throw new Error(`PHASE3B5C_BROWSER_BLOCKED pairs=${blockers.map(x=>x.pair.id).join(',')}`);
console.log(`PHASE3B5C_BROWSER_READY=true comparisons=${totalComparisons}`);
