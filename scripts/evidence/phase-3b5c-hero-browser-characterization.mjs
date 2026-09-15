import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';

const P1={id:'P1',first:'hero-typeset-v2.css',second:'hero-layout-v2.css'};
const VIEWPORT_WIDTHS=[1440,1200,1121,1120,1119,1024,1023,1022,768,641,640,639,391,390,389];
const LOCALES=['en','ar','fr','ru','uz'];
const MOTION_PROGRESS=[0,.25,.5,.75,1];
const GEOMETRY_TOLERANCE=.11;
const COMPUTED_PROPS=['display','position','width','height','minWidth','minHeight','maxWidth','maxHeight','margin','marginTop','marginRight','marginBottom','marginLeft','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','gap','rowGap','columnGap','gridTemplateColumns','alignItems','justifyContent','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','color','backgroundColor','backgroundImage','backgroundPosition','backgroundSize','border','borderColor','borderRadius','boxShadow','opacity','filter','transform','translate','perspective','overflow','isolation','zIndex','outline','outlineOffset','transition','transitionProperty','transitionDuration','transitionDelay','animation','animationName','animationDuration','animationDelay','animationIterationCount','willChange','touchAction','visibility','pointerEvents','content'];
const SAMPLES=[
  ['home','#home'],['shell','#home > .hero-shell'],['copy','#home .hero-copy-column'],['kicker','#home .hero-kicker'],['kicker-dot','#home .hero-kicker > span:first-child'],['title','#home .hero-title'],['title-1','#home .hero-title__line:nth-child(1)'],['title-2','#home .hero-title__line:nth-child(2)'],['accent','#home .hero-title__line--accent'],['copy-p','#home .hero-copy-column > p'],['cta-group','#home .hero-cta-group'],['cta-primary','#home .hero-primary-cta'],['cta-secondary','#home .hero-secondary-cta'],['stage','#home .hero-visual-stage'],['plate','#home .hero-visual-plate'],['grid','#home .hero-visual-grid'],['axis','#home .hero-visual-axis'],['seal','#home .hero-visual-seal'],['orbit-a','#home .hero-visual-orbit--a'],['orbit-b','#home .hero-visual-orbit--b'],['node-1','#home .hero-visual-node--1'],['node-2','#home .hero-visual-node--2'],['node-3','#home .hero-visual-node--3'],
];
const PSEUDOS=[['home-before','#home','::before'],['home-after','#home','::after'],['kicker-after','#home .hero-kicker','::after'],['accent-after','#home .hero-title__line--accent','::after'],['primary-before','#home .hero-primary-cta','::before'],['primary-after','#home .hero-primary-cta','::after'],['secondary-before','#home .hero-secondary-cta','::before'],['secondary-after','#home .hero-secondary-cta','::after'],['stage-before','#home .hero-visual-stage','::before'],['plate-before','#home .hero-visual-plate','::before'],['plate-after','#home .hero-visual-plate','::after'],['seal-before','#home .hero-visual-seal','::before'],['node1-after','#home .hero-visual-node--1','::after']];

function args(){const o={};for(const a of process.argv.slice(2)){const m=a.match(/^--([^=]+)=(.*)$/s);if(m)o[m[1]]=m[2];}return o;}
const opts=args();
if(!opts.source||!opts.static||!opts.out||!opts.chrome)throw new Error('usage --source= --static= --out= --chrome= [--repeat=]');
const source=path.resolve(opts.source),staticData=JSON.parse(fs.readFileSync(opts.static,'utf8')),outPath=path.resolve(opts.out),chrome=opts.chrome,repeat=Number(opts.repeat||1);
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const customNames=Object.keys(staticData.heroCustomProperties||{}).sort();
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};

function serverFor(root){
  const server=http.createServer((req,res)=>{
    try{
      const u=new URL(req.url,'http://local');let pathname=decodeURIComponent(u.pathname);
      if(pathname==='/tailwindcss'||pathname==='/tailwindcss/'){res.writeHead(200,{'content-type':'text/css; charset=utf-8','cache-control':'no-store'});res.end('');return;}
      if(pathname.endsWith('/'))pathname+='index.html';
      const target=path.resolve(root,'.'+pathname),rr=path.resolve(root);
      if(!target.startsWith(rr+path.sep)&&target!==path.join(rr,'index.html')){res.writeHead(403);res.end('forbidden');return;}
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
  const localFailures=[],pageErrors=[];
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
    if(u.includes('fonts.googleapis.com')){req.respond({status:200,contentType:'text/css',headers,body:'/* deterministic evidence: external webfont CSS omitted */'});return;}
    if(u.includes('fonts.gstatic.com')){req.respond({status:204,headers,body:''});return;}
    if(u.includes('googletagmanager.com')||u.includes('google-analytics.com')){req.respond({status:200,contentType:'text/javascript',headers,body:'/* evidence stub */'});return;}
    req.respond({status:204,headers,body:''});
  });
  page.on('requestfailed',req=>{const u=req.url();if(u.startsWith(origin))localFailures.push({type:'requestfailed',url:u,error:req.failure()?.errorText||''});});
  page.on('response',res=>{const u=res.url();if(u.startsWith(origin)&&res.status()>=400)localFailures.push({type:'http',url:u,status:res.status()});});
  page.on('pageerror',e=>pageErrors.push(String(e?.stack||e?.message||e)));
  return{localFailures,pageErrors};
}

function constructP1Variant(tempRoot){
  const dir=path.join(tempRoot,'p1-synthetic');
  fs.cpSync(source,dir,{recursive:true,filter:s=>!['.git','node_modules','dist','.vite'].includes(path.basename(s))});
  const a=fs.readFileSync(path.join(source,P1.first)),b=fs.readFileSync(path.join(source,P1.second)),concat=Buffer.concat([a,b]);
  fs.writeFileSync(path.join(dir,P1.first),concat);fs.rmSync(path.join(dir,P1.second));
  const ip=path.join(dir,'index.html');let html=fs.readFileSync(ip,'utf8');
  const re=new RegExp(`<link\\s+[^>]*href=["'](?:\\./)?${escapeRe(P1.second)}(?:\\?[^"']*)?["'][^>]*rel=["']stylesheet["'][^>]*>`,'g');
  const matches=[...html.matchAll(re)];if(matches.length!==1)throw new Error(`P1 expected one ${P1.second} link, got ${matches.length}`);
  html=html.replace(re,'');if(!html.includes(P1.first))throw new Error('P1 survivor link missing');fs.writeFileSync(ip,html);
  return{dir,firstSha256:sha256(a),secondSha256:sha256(b),concatSha256:sha256(concat),concatBytes:concat.length,secondFileDeleted:!fs.existsSync(path.join(dir,P1.second))};
}

async function waitForProductionReady(page){
  await page.waitForFunction(()=>document.readyState==='complete',{timeout:15000});
  await page.waitForSelector('#home .hero-primary-cta',{timeout:12000});
  await page.waitForSelector('#home .hero-secondary-cta',{timeout:12000});
  await page.waitForSelector('#home .hero-visual-stage',{timeout:12000});
  await page.waitForFunction(()=>typeof window.setLang==='function',{timeout:12000});
  await page.waitForFunction(()=>window.BasairBoot?.state?.()==='released',{timeout:15000});
  await page.evaluate(async()=>{
    await document.fonts.ready;
    const imgs=[...document.querySelectorAll('#home img')];
    await Promise.all(imgs.map(async img=>{try{if(typeof img.decode==='function')await img.decode();img.dataset.evidenceDecode='ok';}catch(e){img.dataset.evidenceDecode=`error:${String(e?.name||e)}`;}}));
    window.scrollTo(0,0);
  });
  await page.waitForFunction(()=>scrollX===0&&scrollY===0,{timeout:3000});
}

async function setLocale(page,lang){
  const dir=lang==='ar'?'rtl':'ltr';
  await page.evaluate(async l=>{await Promise.resolve(window.setLang(l));window.scrollTo(0,0);},lang);
  await page.waitForFunction((l,d)=>document.documentElement.lang===l&&document.documentElement.dir===d&&document.body.classList.contains(`route-${l}`)&&scrollX===0&&scrollY===0,{timeout:8000},lang,dir);
}

async function setControllerState(page,phase){
  await page.evaluate(p=>{if(p==='prep'){document.body.classList.add('motion-prep');document.body.classList.remove('motion-entered');}else{document.body.classList.add('motion-entered');document.body.classList.remove('motion-prep');}},phase);
  await page.waitForFunction(p=>p==='prep'?(document.body.classList.contains('motion-prep')&&!document.body.classList.contains('motion-entered')):(document.body.classList.contains('motion-entered')&&!document.body.classList.contains('motion-prep')),{timeout:3000},phase);
}

async function relevantAnimationInventory(page){
  return page.evaluate(()=>{
    const hero=document.querySelector('#home');
    const elementKey=el=>{if(!el)return'unknown';if(el.id)return`#${el.id}`;const classes=[...el.classList||[]].filter(Boolean).slice(0,3);let key=el.tagName?.toLowerCase?.()||'node';if(classes.length)key+='.'+classes.join('.');if(el.parentElement){const siblings=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);if(siblings.length>1)key+=`:nth-of-type(${siblings.indexOf(el)+1})`;}return key;};
    const records=[];
    for(const a of document.getAnimations({subtree:true})){
      const effect=a.effect,target=effect?.target;let element=target instanceof Element?target:(target?.element instanceof Element?target.element:null);if(!element||!(element===hero||hero?.contains(element)))continue;
      const timing=effect?.getTiming?.()||{},computed=effect?.getComputedTiming?.()||{},type=a.constructor?.name||'Animation',pseudo=effect?.pseudoElement||target?.type||null,animationName=type==='CSSAnimation'?(a.animationName||''):'',transitionProperty=type==='CSSTransition'?(a.transitionProperty||''):'',targetId=elementKey(element),logicalName=animationName||transitionProperty||'';
      records.push({key:`${targetId}${pseudo||''}|${type}|${logicalName}`,target:targetId,pseudo,type,animationName,transitionProperty,playState:a.playState,startTime:a.startTime,currentTime:a.currentTime,duration:timing.duration,delay:timing.delay,iterations:timing.iterations,direction:timing.direction,fill:timing.fill,easing:timing.easing,progress:computed.progress,currentIteration:computed.currentIteration,endTime:computed.endTime,activeDuration:computed.activeDuration,replaceState:a.replaceState||null});
    }
    return records.sort((x,y)=>x.key.localeCompare(y.key));
  });
}
function logicalInventory(inventory){return inventory.map(x=>({key:x.key,target:x.target,pseudo:x.pseudo,type:x.type,animationName:x.animationName,transitionProperty:x.transitionProperty,duration:x.duration,delay:x.delay,iterations:x.iterations,direction:x.direction,fill:x.fill,easing:x.easing}));}

async function normalizeAnimations(page,finiteProgress=1){
  return page.evaluate(progress=>{
    const hero=document.querySelector('#home'),isHeroTarget=target=>{const el=target instanceof Element?target:(target?.element instanceof Element?target.element:null);return Boolean(el&&(el===hero||hero?.contains(el)));},normalized=[];
    for(const a of document.getAnimations({subtree:true})){
      const effect=a.effect;if(!effect||!isHeroTarget(effect.target))continue;const t=effect.getTiming(),d=Number(t.duration),delay=Number(t.delay)||0,it=t.iterations;
      try{a.pause();let desired;if(it===Infinity)desired=delay;else{const active=(Number.isFinite(d)?d:0)*(Number.isFinite(Number(it))?Number(it):1);desired=delay+active*progress;}if(Number.isFinite(desired))a.currentTime=desired;const c=effect.getComputedTiming();normalized.push({type:a.constructor?.name||'Animation',name:a.animationName||a.transitionProperty||'',currentTime:a.currentTime,progress:c.progress,playState:a.playState});}catch(e){normalized.push({type:a.constructor?.name||'Animation',name:a.animationName||a.transitionProperty||'',error:String(e)});}
    }
    document.documentElement.getBoundingClientRect();return normalized;
  },finiteProgress);
}
async function pauseNewAnimations(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{const hero=document.querySelector('#home');for(const a of document.getAnimations({subtree:true})){const target=a.effect?.target,el=target instanceof Element?target:(target?.element instanceof Element?target.element:null);if(el&&(el===hero||hero?.contains(el))){try{a.pause();}catch{}}}resolve();})));}

async function readiness(page,meta,expected={}){
  return page.evaluate(({meta,expected})=>{
    const hero=document.querySelector('#home'),title=document.querySelector('#home .hero-title'),primary=document.querySelector('#home .hero-primary-cta');
    const stylesheetLinks=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(l=>{try{return new URL(l.href,location.href).origin===location.origin}catch{return false}}).map(l=>({href:new URL(l.href,location.href).pathname,loaded:Boolean(l.sheet),ruleCount:(()=>{try{return l.sheet?.cssRules?.length??null}catch{return null}})()}));
    const images=[...document.querySelectorAll('#home img')].map(img=>{const r=img.getBoundingClientRect();return{src:img.getAttribute('src'),currentSrc:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,renderedWidth:+r.width.toFixed(3),renderedHeight:+r.height.toFixed(3),decode:img.dataset.evidenceDecode||'not-recorded'};});
    const fontInfo=el=>{if(!el)return null;const cs=getComputedStyle(el),family=cs.fontFamily,first=family.split(',')[0].trim().replace(/^['"]|['"]$/g,'');return{fontFamily:family,fontSize:cs.fontSize,firstFamily:first,loaded:first?document.fonts.check(`${cs.fontSize} "${first}"`):null};};
    return{...meta,readyState:document.readyState,heroExists:Boolean(hero),setLangReady:typeof window.setLang==='function',lang:document.documentElement.lang,dir:document.documentElement.dir,fontsStatus:document.fonts.status,titleFont:fontInfo(title),primaryFont:fontInfo(primary),images,localStylesheets:stylesheetLinks,localStylesheetsLoaded:stylesheetLinks.every(x=>x.loaded&&x.ruleCount!==null),viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},scroll:{x:scrollX,y:scrollY},bootState:window.BasairBoot?.state?.()||null,bodyClasses:[...document.body.classList].sort(),heroClasses:hero?[...hero.classList].sort():[],routeClassOk:expected.lang?document.body.classList.contains(`route-${expected.lang}`):true,controllerStateOk:expected.phase==='prep'?(document.body.classList.contains('motion-prep')&&!document.body.classList.contains('motion-entered')):expected.phase==='entered'?(document.body.classList.contains('motion-entered')&&!document.body.classList.contains('motion-prep')):true};
  },{meta,expected});
}
function assertReadinessFacts(f,expected){const p=[];if(f.readyState!=='complete')p.push(`readyState=${f.readyState}`);if(!f.heroExists)p.push('hero missing');if(!f.setLangReady)p.push('setLang missing');if(expected.lang&&f.lang!==expected.lang)p.push(`lang=${f.lang}`);if(expected.dir&&f.dir!==expected.dir)p.push(`dir=${f.dir}`);if(f.fontsStatus!=='loaded')p.push(`fontsStatus=${f.fontsStatus}`);if(!f.localStylesheetsLoaded)p.push('local stylesheets not loaded');if(f.scroll.x!==0||f.scroll.y!==0)p.push(`scroll=${f.scroll.x},${f.scroll.y}`);if(f.bootState!=='released')p.push(`bootState=${f.bootState}`);if(!f.routeClassOk)p.push('route class mismatch');if(!f.controllerStateOk)p.push('controller state mismatch');if(expected.width&&f.viewport.width!==expected.width)p.push(`viewportWidth=${f.viewport.width}`);if(expected.height&&f.viewport.height!==expected.height)p.push(`viewportHeight=${f.viewport.height}`);if(f.images.some(x=>!x.complete||x.decode.startsWith('error:')))p.push('hero image readiness failure');return p;}

async function snapshot(page,context,readyFacts){
  const inventory=await relevantAnimationInventory(page);
  const core=await page.evaluate(({samples,pseudos,props,customNames})=>{
    const val=(cs,p)=>cs[p]??cs.getPropertyValue(p),pack=(el,pseudo=null)=>{if(!el)return null;const cs=getComputedStyle(el,pseudo),computed={};for(const p of props)computed[p]=String(val(cs,p)||'');const rect=pseudo?null:el.getBoundingClientRect();return{computed,geometry:rect?{x:+rect.x.toFixed(3),y:+rect.y.toFixed(3),width:+rect.width.toFixed(3),height:+rect.height.toFixed(3),top:+rect.top.toFixed(3),right:+rect.right.toFixed(3),bottom:+rect.bottom.toFixed(3),left:+rect.left.toFixed(3)}:null};};
    const elements={};for(const[name,sel]of samples)elements[name]=pack(document.querySelector(sel));for(const[name,sel,pseudo]of pseudos)elements[name]=pack(document.querySelector(sel),pseudo);
    const custom={};for(const[scope,sel]of[['root','html'],['hero','#home'],['primary','#home .hero-primary-cta'],['secondary','#home .hero-secondary-cta'],['stage','#home .hero-visual-stage']]){const el=document.querySelector(sel),cs=el?getComputedStyle(el):null;custom[scope]={};for(const n of customNames)custom[scope][n]=cs?cs.getPropertyValue(n).trim():'';}
    const primary=document.querySelector('#home .hero-primary-cta'),secondary=document.querySelector('#home .hero-secondary-cta');
    return{elements,custom,state:{lang:document.documentElement.lang,dir:document.documentElement.dir,motionPrep:document.body.classList.contains('motion-prep'),motionEntered:document.body.classList.contains('motion-entered'),primaryHover:primary?.matches(':hover')||false,primaryActive:primary?.matches(':active')||false,primaryFocusVisible:primary?.matches(':focus-visible')||false,secondaryFocusVisible:secondary?.matches(':focus-visible')||false,primaryAck:primary?.classList.contains('is-acknowledged')||false,secondaryAck:secondary?.classList.contains('is-acknowledged')||false,hash:location.hash,bodyClasses:[...document.body.classList].sort(),heroClasses:[...document.querySelector('#home')?.classList||[]].sort(),capabilities:{pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches,pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,forced:matchMedia('(forced-colors: active)').matches}},access:{primary:primary?{tag:primary.tagName,href:primary.getAttribute('href'),tabIndex:primary.tabIndex,ariaLabel:primary.getAttribute('aria-label'),role:primary.getAttribute('role')}:null,secondary:secondary?{tag:secondary.tagName,href:secondary.getAttribute('href'),tabIndex:secondary.tabIndex,ariaLabel:secondary.getAttribute('aria-label'),role:secondary.getAttribute('role')}:null,activeElement:document.activeElement?.matches?.('#home .hero-primary-cta')?'primary':document.activeElement?.matches?.('#home .hero-secondary-cta')?'secondary':document.activeElement?.tagName||null}};
  },{samples:SAMPLES,pseudos:PSEUDOS,props:COMPUTED_PROPS,customNames});
  return{...core,context,readiness:readyFacts,animationInventory:inventory};
}

function diffSnapshots(a,b){
  const computed=[],geometry=[],custom=[],state=[],accessibility=[],keys=new Set([...Object.keys(a.elements||{}),...Object.keys(b.elements||{})]);
  for(const k of keys){const ae=a.elements?.[k],be=b.elements?.[k];if(!ae||!be){computed.push({sample:k,property:'__presence',source:Boolean(ae),synthetic:Boolean(be)});continue;}for(const p of COMPUTED_PROPS)if(ae.computed[p]!==be.computed[p])computed.push({sample:k,property:p,source:ae.computed[p],synthetic:be.computed[p]});if(ae.geometry&&be.geometry)for(const p of Object.keys(ae.geometry)){const delta=be.geometry[p]-ae.geometry[p];if(Math.abs(delta)>GEOMETRY_TOLERANCE)geometry.push({sample:k,property:p,source:ae.geometry[p],synthetic:be.geometry[p],delta:+delta.toFixed(3)});}}
  for(const scope of Object.keys(a.custom||{}))for(const n of customNames)if((a.custom?.[scope]?.[n]??'')!==(b.custom?.[scope]?.[n]??''))custom.push({scope,name:n,source:a.custom?.[scope]?.[n]??'',synthetic:b.custom?.[scope]?.[n]??''});
  for(const k of Object.keys(a.state||{}))if(JSON.stringify(a.state[k])!==JSON.stringify(b.state?.[k]))state.push({property:k,source:a.state[k],synthetic:b.state?.[k]});
  if(JSON.stringify(a.access)!==JSON.stringify(b.access))accessibility.push({source:a.access,synthetic:b.access});return{computed,geometry,custom,state,accessibility};
}
function recordCompare(records,label,category,a,b,extra={}){const deltas=diffSnapshots(a,b),inventorySource=logicalInventory(a.animationInventory),inventorySynthetic=logicalInventory(b.animationInventory),inventoryEqual=JSON.stringify(inventorySource)===JSON.stringify(inventorySynthetic),record={label,category,...extra,source:a,synthetic:b,inventoryEqual,logicalInventory:{source:inventorySource,synthetic:inventorySynthetic},deltas};records.push(record);return record;}
function aggregate(records){const t={comparisons:records.length,computed:0,geometry:0,custom:0,state:0,accessibility:0,inventoryMismatches:0};for(const r of records){t.computed+=r.deltas.computed.length;t.geometry+=r.deltas.geometry.length;t.custom+=r.deltas.custom.length;t.state+=r.deltas.state.length;t.accessibility+=r.deltas.accessibility.length;if(!r.inventoryEqual)t.inventoryMismatches++;}return t;}
function deltaAttribution(records,mode){const out=[];for(const r of records)for(const kind of ['computed','geometry','custom','state','accessibility'])for(const d of r.deltas[kind])out.push({mode,label:r.label,category:r.category,locale:r.source.context?.locale,viewport:r.source.context?.viewport,pointerCapability:r.source.state?.capabilities,reducedMotion:r.source.state?.capabilities?.reduced,motionPhase:r.source.context?.motionPhase,kind,...d,sourceGeometry:d.sample?r.source.elements?.[d.sample]?.geometry:null,syntheticGeometry:d.sample?r.synthetic.elements?.[d.sample]?.geometry:null,sourceBodyClasses:r.source.state?.bodyClasses,syntheticBodyClasses:r.synthetic.state?.bodyClasses,sourceHeroClasses:r.source.state?.heroClasses,syntheticHeroClasses:r.synthetic.state?.heroClasses,sourceAnimations:r.source.animationInventory,syntheticAnimations:r.synthetic.animationInventory,sourceFont:r.source.readiness?.titleFont,syntheticFont:r.synthetic.readiness?.titleFont,sourceImages:r.source.readiness?.images,syntheticImages:r.synthetic.readiness?.images});return out;}

async function exactCommonPoint(a,b,selector,rx=.5,ry=.5){const[ra,rb]=await Promise.all([a.$eval(selector,e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom};}),b.$eval(selector,e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom};})]),left=Math.max(ra.left,rb.left),right=Math.min(ra.right,rb.right),top=Math.max(ra.top,rb.top),bottom=Math.min(ra.bottom,rb.bottom);if(right<=left||bottom<=top)throw new Error(`no common pointer area for ${selector}`);return{x:left+(right-left)*rx,y:top+(bottom-top)*ry};}
async function settlePointerRaf(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));}
async function focusPrimaryByKeyboard(page){await page.mouse.move(1,1);await page.evaluate(()=>document.activeElement?.blur?.());for(let i=0;i<50;i++){await page.keyboard.press('Tab');if(await page.$eval('#home .hero-primary-cta',e=>e.matches(':focus-visible')))return;}throw new Error('Could not reach primary CTA by keyboard');}
async function waitAckReset(page){await page.waitForFunction(()=>!document.querySelector('#home .hero-primary-cta')?.classList.contains('is-acknowledged')&&!document.querySelector('#home .hero-secondary-cta')?.classList.contains('is-acknowledged'),{timeout:2000});}
async function openPage(browser,origin,config={}){const page=await browser.newPage(),monitor=await configurePage(page,origin,config);await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:30000});await waitForProductionReady(page);return{page,monitor};}
async function prepareStatic(page,{lang='en',phase='entered',width=1440,height=900}={}){await page.setViewport({width,height,deviceScaleFactor:1,isMobile:false,hasTouch:false});await setLocale(page,lang);await setControllerState(page,phase);await normalizeAnimations(page,1);await page.evaluate(()=>{scrollTo(0,0);document.documentElement.getBoundingClientRect();});}

async function measurePair(a,b,monA,monB,mode,records,label,category,ctx={}){
  const lang=ctx.locale||'en',dir=lang==='ar'?'rtl':'ltr',motionPhase=ctx.motionPhase||'entered',phase=ctx.controllerPhase||(motionPhase==='prep'?'prep':'entered'),width=ctx.viewport?.width||await a.evaluate(()=>innerWidth),height=ctx.viewport?.height||await a.evaluate(()=>innerHeight),expected={lang,dir,phase,width,height};
  const[ra,rb]=await Promise.all([readiness(a,{side:'A',mode},expected),readiness(b,{side:'B',mode},expected)]),readinessProblems={A:assertReadinessFacts(ra,expected),B:assertReadinessFacts(rb,expected)};
  if(monA.localFailures.length)readinessProblems.A.push(`localFailures=${monA.localFailures.length}`);if(monB.localFailures.length)readinessProblems.B.push(`localFailures=${monB.localFailures.length}`);if(monA.pageErrors.length)readinessProblems.A.push(`pageErrors=${monA.pageErrors.length}`);if(monB.pageErrors.length)readinessProblems.B.push(`pageErrors=${monB.pageErrors.length}`);
  const[sa,sb]=await Promise.all([snapshot(a,{mode,label,locale:lang,viewport:{width,height},motionPhase,category},ra),snapshot(b,{mode,label,locale:lang,viewport:{width,height},motionPhase,category},rb)]),r=recordCompare(records,label,category,sa,sb,{readinessProblems});if(readinessProblems.A.length||readinessProblems.B.length)r.readinessBlocker=true;return r;
}

async function runNormalizedEntranceMotion(a,b,monA,monB,mode,motionRecords){
  await Promise.all([prepareStatic(a,{lang:'en',phase:'prep'}),prepareStatic(b,{lang:'en',phase:'prep'})]);const preA=await relevantAnimationInventory(a),preB=await relevantAnimationInventory(b);await Promise.all([setControllerState(a,'entered'),setControllerState(b,'entered')]);await Promise.all([pauseNewAnimations(a),pauseNewAnimations(b)]);const triggeredA=await relevantAnimationInventory(a),triggeredB=await relevantAnimationInventory(b),logicalEqual=JSON.stringify(logicalInventory(triggeredA))===JSON.stringify(logicalInventory(triggeredB));
  for(const progress of MOTION_PROGRESS){await Promise.all([normalizeAnimations(a,progress),normalizeAnimations(b,progress)]);await measurePair(a,b,monA,monB,mode,motionRecords,`motion:entrance:${Math.round(progress*100)}%`,'motion',{locale:'en',viewport:{width:1440,height:900},motionPhase:`entered@${progress}`,controllerPhase:'entered'});}return{pre:{source:preA,synthetic:preB},triggered:{source:triggeredA,synthetic:triggeredB},logicalEqual};
}

async function run93Matrix(a,b,monA,monB,mode,records){
  await Promise.all([prepareStatic(a,{lang:'en',phase:'prep'}),prepareStatic(b,{lang:'en',phase:'prep'})]);await measurePair(a,b,monA,monB,mode,records,'initial-pre-animation','static',{locale:'en',viewport:{width:1440,height:900},motionPhase:'prep'});
  await Promise.all([prepareStatic(a,{lang:'en',phase:'entered'}),prepareStatic(b,{lang:'en',phase:'entered'})]);await measurePair(a,b,monA,monB,mode,records,'initial-settled','static',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  for(const width of VIEWPORT_WIDTHS){const height=width<=640?844:900;for(const lang of LOCALES){await Promise.all([prepareStatic(a,{lang,phase:'entered',width,height}),prepareStatic(b,{lang,phase:'entered',width,height})]);await measurePair(a,b,monA,monB,mode,records,`responsive:${width}:${lang}`,'responsive',{locale:lang,viewport:{width,height},motionPhase:'entered'});}}
  await Promise.all([prepareStatic(a,{lang:'en',phase:'entered'}),prepareStatic(b,{lang:'en',phase:'entered'})]);await measurePair(a,b,monA,monB,mode,records,'fine-idle','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  let p=await exactCommonPoint(a,b,'#home .hero-primary-cta',.55,.45);await Promise.all([a.mouse.move(p.x,p.y),b.mouse.move(p.x,p.y)]);await Promise.all([settlePointerRaf(a),settlePointerRaf(b)]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'fine-hover-primary','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  p=await exactCommonPoint(a,b,'#home .hero-visual-stage',.72,.33);await Promise.all([a.mouse.move(p.x,p.y),b.mouse.move(p.x,p.y)]);await Promise.all([settlePointerRaf(a),settlePointerRaf(b)]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'fine-stage-pointer-custom','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  p=await exactCommonPoint(a,b,'#home .hero-primary-cta',.33,.64);await Promise.all([a.mouse.move(p.x,p.y),b.mouse.move(p.x,p.y)]);await Promise.all([settlePointerRaf(a),settlePointerRaf(b)]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'fine-cta-pointer-custom','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  await Promise.all([a.mouse.down(),b.mouse.down()]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'fine-active-primary','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  await Promise.all([a.mouse.move(1,1),b.mouse.move(1,1)]);await Promise.all([a.mouse.up(),b.mouse.up()]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'fine-acknowledged-after-press','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  await Promise.all([waitAckReset(a),waitAckReset(b)]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'fine-pointer-leave-reset','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  await Promise.all([focusPrimaryByKeyboard(a),focusPrimaryByKeyboard(b)]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'keyboard-focus-primary','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  await Promise.all([a.keyboard.press('Tab'),b.keyboard.press('Tab')]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'keyboard-focus-secondary','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
  await Promise.all([prepareStatic(a,{lang:'ar',phase:'entered'}),prepareStatic(b,{lang:'ar',phase:'entered'})]);p=await exactCommonPoint(a,b,'#home .hero-primary-cta');await Promise.all([a.mouse.move(p.x,p.y),b.mouse.move(p.x,p.y)]);await Promise.all([settlePointerRaf(a),settlePointerRaf(b)]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'rtl-primary-hover','interaction',{locale:'ar',viewport:{width:1440,height:900},motionPhase:'entered'});
  await Promise.all([prepareStatic(a,{lang:'en',phase:'entered'}),prepareStatic(b,{lang:'en',phase:'entered'})]);await Promise.all([a.evaluate(()=>document.querySelector('#home .hero-secondary-cta')?.click()),b.evaluate(()=>document.querySelector('#home .hero-secondary-cta')?.click())]);await Promise.all([a.waitForFunction(()=>location.hash==='#quick-guide',{timeout:3000}),b.waitForFunction(()=>location.hash==='#quick-guide',{timeout:3000})]);await Promise.all([a.evaluate(()=>scrollTo(0,0)),b.evaluate(()=>scrollTo(0,0))]);await Promise.all([normalizeAnimations(a,1),normalizeAnimations(b,1)]);await measurePair(a,b,monA,monB,mode,records,'native-anchor-secondary','interaction',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});
}

async function runMode(mode,leftOrigin,rightOrigin){
  const records=[],motionRecords=[],blockers=[],browserA=await puppeteer.launch({headless:false,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--metrics-recording-only','--no-first-run']}),browserB=await puppeteer.launch({headless:false,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--metrics-recording-only','--no-first-run']});let fineCaps=null,coarseCaps=null,reducedCaps=null,entranceMotion=null,resourceFailures=[];
  try{
    const A=await openPage(browserA,leftOrigin),B=await openPage(browserB,rightOrigin);fineCaps={source:await A.page.evaluate(()=>({pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches})),synthetic:await B.page.evaluate(()=>({pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches}))};if(!fineCaps.source.pointerFine||!fineCaps.source.hoverHover||!fineCaps.synthetic.pointerFine||!fineCaps.synthetic.hoverHover)blockers.push({type:'fine-capability',fineCaps});
    entranceMotion=await runNormalizedEntranceMotion(A.page,B.page,A.monitor,B.monitor,mode,motionRecords);if(!entranceMotion.logicalEqual)blockers.push({type:'entrance-animation-inventory-mismatch',details:entranceMotion.triggered});await run93Matrix(A.page,B.page,A.monitor,B.monitor,mode,records);resourceFailures.push(...A.monitor.localFailures,...B.monitor.localFailures);if(A.monitor.pageErrors.length||B.monitor.pageErrors.length)blockers.push({type:'page-errors',A:A.monitor.pageErrors,B:B.monitor.pageErrors});await Promise.all([A.page.close(),B.page.close()]);
    const C=await openPage(browserA,leftOrigin,{mobile:true}),D=await openPage(browserB,rightOrigin,{mobile:true});coarseCaps={source:await C.page.evaluate(()=>({pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches})),synthetic:await D.page.evaluate(()=>({pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches}))};if(!coarseCaps.source.pointerCoarse||!coarseCaps.source.hoverNone||!coarseCaps.synthetic.pointerCoarse||!coarseCaps.synthetic.hoverNone)blockers.push({type:'coarse-capability',coarseCaps});await Promise.all([setLocale(C.page,'en'),setLocale(D.page,'en')]);await Promise.all([setControllerState(C.page,'entered'),setControllerState(D.page,'entered')]);await Promise.all([normalizeAnimations(C.page,1),normalizeAnimations(D.page,1)]);await measurePair(C.page,D.page,C.monitor,D.monitor,mode,records,'coarse-idle','interaction',{locale:'en',viewport:{width:390,height:844},motionPhase:'entered'});let p=await exactCommonPoint(C.page,D.page,'#home .hero-primary-cta'),cs=await C.page.target().createCDPSession(),ct=await D.page.target().createCDPSession();await Promise.all([cs.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]}),ct.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]})]);await Promise.all([normalizeAnimations(C.page,1),normalizeAnimations(D.page,1)]);await measurePair(C.page,D.page,C.monitor,D.monitor,mode,records,'coarse-touch-active','interaction',{locale:'en',viewport:{width:390,height:844},motionPhase:'entered'});await Promise.all([cs.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}),ct.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})]);await Promise.all([waitAckReset(C.page),waitAckReset(D.page)]);await Promise.all([normalizeAnimations(C.page,1),normalizeAnimations(D.page,1)]);await measurePair(C.page,D.page,C.monitor,D.monitor,mode,records,'coarse-touch-reset','interaction',{locale:'en',viewport:{width:390,height:844},motionPhase:'entered'});resourceFailures.push(...C.monitor.localFailures,...D.monitor.localFailures);if(C.monitor.pageErrors.length||D.monitor.pageErrors.length)blockers.push({type:'coarse-page-errors',A:C.monitor.pageErrors,B:D.monitor.pageErrors});await Promise.all([C.page.close(),D.page.close()]);
    const E=await openPage(browserA,leftOrigin,{reduced:true}),F=await openPage(browserB,rightOrigin,{reduced:true});reducedCaps={source:await E.page.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches})),synthetic:await F.page.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}))};if(!reducedCaps.source.reduced||!reducedCaps.synthetic.reduced)blockers.push({type:'reduced-capability',reducedCaps});await Promise.all([setLocale(E.page,'en'),setLocale(F.page,'en')]);await Promise.all([setControllerState(E.page,'prep'),setControllerState(F.page,'prep')]);await Promise.all([normalizeAnimations(E.page,1),normalizeAnimations(F.page,1)]);await measurePair(E.page,F.page,E.monitor,F.monitor,mode,records,'reduced-initial','static',{locale:'en',viewport:{width:1440,height:900},motionPhase:'prep'});await Promise.all([setControllerState(E.page,'entered'),setControllerState(F.page,'entered')]);await Promise.all([normalizeAnimations(E.page,1),normalizeAnimations(F.page,1)]);await measurePair(E.page,F.page,E.monitor,F.monitor,mode,records,'reduced-settled','static',{locale:'en',viewport:{width:1440,height:900},motionPhase:'entered'});resourceFailures.push(...E.monitor.localFailures,...F.monitor.localFailures);if(E.monitor.pageErrors.length||F.monitor.pageErrors.length)blockers.push({type:'reduced-page-errors',A:E.monitor.pageErrors,B:F.monitor.pageErrors});await Promise.all([E.page.close(),F.page.close()]);
  }catch(e){blockers.push({type:'harness-exception',message:String(e?.stack||e)});}finally{await Promise.allSettled([browserA.close(),browserB.close()]);}
  const totals=aggregate(records),motionTotals=aggregate(motionRecords),readinessBlockers=records.filter(r=>r.readinessBlocker).length+motionRecords.filter(r=>r.readinessBlocker).length,unexpected=totals.computed+totals.geometry+totals.custom+totals.state+totals.accessibility+totals.inventoryMismatches+motionTotals.computed+motionTotals.geometry+motionTotals.custom+motionTotals.state+motionTotals.accessibility+motionTotals.inventoryMismatches+resourceFailures.length+readinessBlockers+blockers.length;
  return{mode,records,motionRecords,totals,motionTotals,resourceFailures,resourceFailureCount:resourceFailures.length,blockers,readinessBlockers,environment:{fineCaps,coarseCaps,reducedCaps},entranceMotion,deltaAttribution:[...deltaAttribution(records,mode),...deltaAttribution(motionRecords,mode)],pass:unexpected===0};
}

const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),'phase3b5c-p1-canary-')),variant=constructP1Variant(tempRoot),sourceServer=await serverFor(source),syntheticServer=await serverFor(variant.dir),output={schema:'phase-3b-5c-p1-determinism-canary-v1',generatedAt:new Date().toISOString(),repeat,baseSha:process.env.BASE_SHA||null,pair:P1,variant,geometryTolerance:GEOMETRY_TOLERANCE,modes:{},rootCauseHypothesis:{productionBootController:'BasairBoot owns motion-prep -> motion-entered release and must reach released before characterization changes controller classes.',finiteAnimationNormalization:'Static and motion sampling assign currentTime + pause; finish() is intentionally not used because it changes animation completion lifecycle.'}};let fatal=null;
try{output.modes.sourceSource=await runMode('S/S',sourceServer.origin,sourceServer.origin);output.modes.syntheticSynthetic=await runMode('X/X',syntheticServer.origin,syntheticServer.origin);output.modes.sourceSynthetic=await runMode('S/X',sourceServer.origin,syntheticServer.origin);}catch(e){fatal=String(e?.stack||e);}finally{await new Promise(r=>sourceServer.server.close(r));await new Promise(r=>syntheticServer.server.close(r));fs.rmSync(tempRoot,{recursive:true,force:true});}
output.fatal=fatal;const modes=Object.values(output.modes);output.controlsPass=Boolean(output.modes.sourceSource?.pass&&output.modes.syntheticSynthetic?.pass);output.realPass=Boolean(output.modes.sourceSynthetic?.pass);output.ready=Boolean(!fatal&&output.controlsPass&&output.realPass&&modes.length===3&&modes.every(m=>m.totals.comparisons===93));fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(output,null,2));for(const m of Object.values(output.modes))console.log(`${m.mode} comparisons=${m.totals.comparisons} computed=${m.totals.computed} geometry=${m.totals.geometry} custom=${m.totals.custom} state=${m.totals.state} motion=${m.motionTotals.computed+m.motionTotals.geometry+m.motionTotals.custom+m.motionTotals.state+m.motionTotals.accessibility} accessibility=${m.totals.accessibility} resources=${m.resourceFailureCount} inventoryMismatches=${m.totals.inventoryMismatches+m.motionTotals.inventoryMismatches} readinessBlockers=${m.readinessBlockers} pass=${m.pass}`);console.log(`P1_CANARY_READY=${output.ready}`);if(!output.ready)process.exitCode=2;
