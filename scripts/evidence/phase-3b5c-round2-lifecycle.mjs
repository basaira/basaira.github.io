import {GEOMETRY_TOLERANCE,configurePage,waitForProductionReady,setLocale,setControllerState} from './phase-3b5c-round2-base.mjs';
const MAX_INVENTORY_PASSES=8;

export async function relevantAnimationInventory(page){
  return page.evaluate(()=>{
    const hero=document.querySelector('#home');
    const elementKey=el=>{if(!el)return'unknown';if(el.id)return`#${el.id}`;const classes=[...el.classList||[]].filter(Boolean).slice(0,3);let key=el.tagName?.toLowerCase?.()||'node';if(classes.length)key+='.'+classes.join('.');if(el.parentElement){const siblings=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);if(siblings.length>1)key+=`:nth-of-type(${siblings.indexOf(el)+1})`;}return key;};
    const records=[];
    for(const a of document.getAnimations({subtree:true})){
      const effect=a.effect,target=effect?.target;const element=target instanceof Element?target:(target?.element instanceof Element?target.element:null);if(!element||!(element===hero||hero?.contains(element)))continue;
      const timing=effect?.getTiming?.()||{},computed=effect?.getComputedTiming?.()||{},type=a.constructor?.name||'Animation',pseudo=effect?.pseudoElement||target?.type||null,animationName=type==='CSSAnimation'?(a.animationName||''):'',transitionProperty=type==='CSSTransition'?(a.transitionProperty||''):'',targetId=elementKey(element),logicalName=animationName||transitionProperty||'';
      records.push({key:`${targetId}${pseudo||''}|${type}|${logicalName}`,target:targetId,pseudo,type,animationName,transitionProperty,playState:a.playState,startTime:a.startTime,currentTime:a.currentTime,duration:timing.duration,delay:timing.delay,iterations:timing.iterations,direction:timing.direction,fill:timing.fill,easing:timing.easing,progress:computed.progress,currentIteration:computed.currentIteration,endTime:computed.endTime,activeDuration:computed.activeDuration,replaceState:a.replaceState||null});
    }
    return records.sort((x,y)=>x.key.localeCompare(y.key));
  });
}
export function logicalInventory(inventory){return inventory.map(x=>({key:x.key,target:x.target,pseudo:x.pseudo,type:x.type,animationName:x.animationName,transitionProperty:x.transitionProperty,duration:x.duration,delay:x.delay,iterations:x.iterations,direction:x.direction,fill:x.fill,easing:x.easing}));}

export async function forceMaterialization(page){
  await page.evaluate(async()=>{
    await Promise.resolve();
    await new Promise(r=>requestAnimationFrame(()=>r()));
    const hero=document.querySelector('#home');
    const nodes=hero?[hero,...hero.querySelectorAll('*')]:[];
    for(const el of nodes){const cs=getComputedStyle(el);void cs.display;void cs.transform;void cs.opacity;el.getBoundingClientRect();}
    for(const [sel,pseudo] of [['#home','::before'],['#home','::after'],['#home .hero-kicker','::after'],['#home .hero-title__line--accent','::after'],['#home .hero-primary-cta','::before'],['#home .hero-primary-cta','::after'],['#home .hero-secondary-cta','::before'],['#home .hero-secondary-cta','::after'],['#home .hero-visual-stage','::before']]){const el=document.querySelector(sel);if(el){const cs=getComputedStyle(el,pseudo);void cs.opacity;void cs.transform;void cs.backgroundColor;}}
    document.documentElement.getBoundingClientRect();
    await new Promise(r=>requestAnimationFrame(()=>r()));
  });
}

async function pauseRelevantAnimations(page){
  return page.evaluate(()=>{
    const hero=document.querySelector('#home'),paused=[];
    for(const a of document.getAnimations({subtree:true})){
      const target=a.effect?.target,el=target instanceof Element?target:(target?.element instanceof Element?target.element:null);
      if(!el||!(el===hero||hero?.contains(el)))continue;
      try{a.pause();paused.push({type:a.constructor?.name||'Animation',name:a.animationName||a.transitionProperty||'',currentTime:a.currentTime,playState:a.playState});}catch(e){paused.push({type:a.constructor?.name||'Animation',name:a.animationName||a.transitionProperty||'',error:String(e)});}
    }
    return paused;
  });
}

export async function stableAnimationInventory(page,maxPasses=MAX_INVENTORY_PASSES){
  let previous=null;const history=[];
  for(let pass=1;pass<=maxPasses;pass++){
    await forceMaterialization(page);
    const inventory=await relevantAnimationInventory(page),logical=logicalInventory(inventory),serialized=JSON.stringify(logical);
    history.push({pass,logical});
    if(previous===serialized){
      const paused=await pauseRelevantAnimations(page);
      await forceMaterialization(page);
      const frozenInventory=await relevantAnimationInventory(page),frozenLogical=logicalInventory(frozenInventory),frozenSerialized=JSON.stringify(frozenLogical);
      history.push({pass:`${pass}-frozen`,logical:frozenLogical});
      if(frozenSerialized===serialized)return{stable:true,passes:pass,inventory:frozenInventory,logical:frozenLogical,history,paused,frozen:true};
      previous=frozenSerialized;
      continue;
    }
    previous=serialized;
  }
  const inventory=await relevantAnimationInventory(page);return{stable:false,passes:maxPasses,inventory,logical:logicalInventory(inventory),history};
}

export async function normalizeAnimationsStable(page,finiteProgress=1){
  const before=await stableAnimationInventory(page);if(!before.stable)return{stable:false,stage:'pre-normalization',progress:finiteProgress,before};
  const normalized=await page.evaluate(progress=>{
    const hero=document.querySelector('#home'),elementKey=el=>{if(!el)return'unknown';if(el.id)return`#${el.id}`;const classes=[...el.classList||[]].filter(Boolean).slice(0,3);let key=el.tagName?.toLowerCase?.()||'node';if(classes.length)key+='.'+classes.join('.');if(el.parentElement){const siblings=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);if(siblings.length>1)key+=`:nth-of-type(${siblings.indexOf(el)+1})`;}return key;},out=[];
    for(const a of document.getAnimations({subtree:true})){
      const effect=a.effect,target=effect?.target,el=target instanceof Element?target:(target?.element instanceof Element?target.element:null);if(!effect||!el||!(el===hero||hero?.contains(el)))continue;const t=effect.getTiming(),duration=Number(t.duration),delay=Number(t.delay)||0,iterations=Number(t.iterations),type=a.constructor?.name||'Animation',pseudo=effect?.pseudoElement||target?.type||null,logicalName=type==='CSSAnimation'?(a.animationName||''):(type==='CSSTransition'?(a.transitionProperty||''):(a.animationName||a.transitionProperty||'')),key=`${elementKey(el)}${pseudo||''}|${type}|${logicalName}`;
      try{
        a.pause();let desired=null;
        if(t.iterations!==Infinity&&Number.isFinite(duration)&&Number.isFinite(iterations)){const active=duration*iterations;desired=delay+active*progress;if(Number.isFinite(desired))a.currentTime=desired;}
        const c=effect.getComputedTiming();out.push({key,type,desiredCurrentTime:desired,currentTime:a.currentTime,computedProgress:c.progress,playState:a.playState,duration:t.duration,delay:t.delay,iterations:t.iterations});
      }catch(e){out.push({key,type,error:String(e)});}
    }
    document.documentElement.getBoundingClientRect();return out;
  },finiteProgress);
  const after=await stableAnimationInventory(page);if(!after.stable)return{stable:false,stage:'post-normalization',progress:finiteProgress,before,normalized,after};
  const expectedByKey=new Map(normalized.filter(x=>!x.error).map(x=>[x.key,x])),positionProblems=[];
  for(const a of after.inventory){if(a.iterations===Infinity)continue;const e=expectedByKey.get(a.key);if(!e)continue;if(Number.isFinite(e.desiredCurrentTime)&&Math.abs(Number(a.currentTime)-e.desiredCurrentTime)>1e-6)positionProblems.push({key:a.key,currentTime:a.currentTime,expectedCurrentTime:e.desiredCurrentTime});if(typeof e.computedProgress==='number'&&typeof a.progress==='number'&&Math.abs(a.progress-e.computedProgress)>1e-9)positionProblems.push({key:a.key,computedProgress:a.progress,expectedComputedProgress:e.computedProgress});}
  return{stable:positionProblems.length===0,stage:positionProblems.length?'position-check':'ok',progress:finiteProgress,before,normalized,after,positionProblems};
}

export async function waitScrollStable(page,maxFrames=12){
  return page.evaluate(async max=>{let prev=null,stable=0,last=null;for(let i=0;i<max;i++){await new Promise(r=>requestAnimationFrame(()=>r()));last={x:scrollX,y:scrollY};const key=`${last.x},${last.y}`;if(key===prev)stable++;else stable=0;if(stable>=1)return{stable:true,frames:i+1,...last};prev=key;}return{stable:false,frames:max,...last};},maxFrames);
}

export async function waitAckReset(page){await page.waitForFunction(()=>!document.querySelector('#home .hero-primary-cta')?.classList.contains('is-acknowledged')&&!document.querySelector('#home .hero-secondary-cta')?.classList.contains('is-acknowledged'),{timeout:2500});}

export async function pointerBaseline(page){return page.evaluate(()=>{const p=document.querySelector('#home .hero-primary-cta'),s=document.querySelector('#home .hero-secondary-cta'),pcs=p?getComputedStyle(p):null,scs=s?getComputedStyle(s):null;return{primaryHover:p?.matches(':hover')||false,secondaryHover:s?.matches(':hover')||false,primaryActive:p?.matches(':active')||false,secondaryActive:s?.matches(':active')||false,primaryAck:p?.classList.contains('is-acknowledged')||false,secondaryAck:s?.classList.contains('is-acknowledged')||false,primaryCtaX:pcs?.getPropertyValue('--hero-cta-x').trim()||'',primaryCtaY:pcs?.getPropertyValue('--hero-cta-y').trim()||'',secondaryCtaX:scs?.getPropertyValue('--hero-cta-x').trim()||'',secondaryCtaY:scs?.getPropertyValue('--hero-cta-y').trim()||''};});}

export async function resetPointer(page,{waitAck=true}={}){
  try{await page.mouse.up();}catch{}
  await page.mouse.move(1,1);
  await page.evaluate(()=>document.activeElement?.blur?.());
  if(waitAck)try{await waitAckReset(page);}catch{}
  await forceMaterialization(page);
  const baseline=await pointerBaseline(page);
  const problems=[];
  if(baseline.primaryHover||baseline.secondaryHover)problems.push('hover retained after reset');
  if(baseline.primaryActive||baseline.secondaryActive)problems.push('active retained after reset');
  if(waitAck&&(baseline.primaryAck||baseline.secondaryAck))problems.push('ack retained after reset');
  for(const [name,value] of [['primaryCtaX',baseline.primaryCtaX],['primaryCtaY',baseline.primaryCtaY],['secondaryCtaX',baseline.secondaryCtaX],['secondaryCtaY',baseline.secondaryCtaY]])if(value!=='50%')problems.push(`${name}=${value} after reset`);
  return{baseline,problems};
}

export async function openPage(browser,origin,config={}){const page=await browser.newPage(),monitor=await configurePage(page,origin,config);await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:30000});await waitForProductionReady(page);return{page,monitor};}

export async function setRequestedViewport(page,width,height){const requested={width,height,deviceScaleFactor:1,isMobile:false,hasTouch:false};await page.setViewport(requested);return requested;}

export async function prepareStatic(page,{lang='en',phase='entered',width=1440,height=900}={}){
  const requestedViewport=await setRequestedViewport(page,width,height);await setLocale(page,lang);await setControllerState(page,phase);const pointerReset=await resetPointer(page);if(pointerReset.problems.length)throw new Error(`pointer baseline failed in prepareStatic: ${JSON.stringify(pointerReset.problems)}`);const normalization=await normalizeAnimationsStable(page,1);await page.evaluate(()=>scrollTo(0,0));await waitScrollStable(page);return{requestedViewport,normalization,pointerReset};
}

export async function readiness(page,meta,expected={}){
  return page.evaluate(({meta,expected})=>{
    const hero=document.querySelector('#home'),title=document.querySelector('#home .hero-title'),primary=document.querySelector('#home .hero-primary-cta');
    const stylesheetLinks=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(l=>{try{return new URL(l.href,location.href).origin===location.origin}catch{return false}}).map(l=>({href:new URL(l.href,location.href).pathname,loaded:Boolean(l.sheet),ruleCount:(()=>{try{return l.sheet?.cssRules?.length??null}catch{return null}})()}));
    const images=[...document.querySelectorAll('#home img')].map(img=>{const r=img.getBoundingClientRect();return{src:img.getAttribute('src'),currentSrc:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,renderedWidth:+r.width.toFixed(3),renderedHeight:+r.height.toFixed(3),decode:img.dataset.evidenceDecode||'not-recorded'};});
    const fontInfo=el=>{if(!el)return null;const cs=getComputedStyle(el),family=cs.fontFamily,first=family.split(',')[0].trim().replace(/^['"]|['"]$/g,'');return{fontFamily:family,fontSize:cs.fontSize,firstFamily:first,loaded:first?document.fonts.check(`${cs.fontSize} "${first}"`):null};};
    return{...meta,readyState:document.readyState,heroExists:Boolean(hero),setLangReady:typeof window.setLang==='function',lang:document.documentElement.lang,dir:document.documentElement.dir,fontsStatus:document.fonts.status,titleFont:fontInfo(title),primaryFont:fontInfo(primary),images,localStylesheets:stylesheetLinks,localStylesheetsLoaded:stylesheetLinks.every(x=>x.loaded&&x.ruleCount!==null),viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,visualWidth:visualViewport?.width??null,visualHeight:visualViewport?.height??null},scroll:{x:scrollX,y:scrollY},capabilities:{pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches,pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,forced:matchMedia('(forced-colors: active)').matches},bootState:window.BasairBoot?.state?.()||null,bodyClasses:[...document.body.classList].sort(),heroClasses:hero?[...hero.classList].sort():[],routeClassOk:expected.lang?document.body.classList.contains(`route-${expected.lang}`):true,controllerStateOk:expected.phase==='prep'?(document.body.classList.contains('motion-prep')&&!document.body.classList.contains('motion-entered')):expected.phase==='entered'?(document.body.classList.contains('motion-entered')&&!document.body.classList.contains('motion-prep')):true};
  },{meta,expected});
}

export function absoluteReadinessProblems(f,expected){
  const p=[];if(f.readyState!=='complete')p.push(`readyState=${f.readyState}`);if(!f.heroExists)p.push('hero missing');if(!f.setLangReady)p.push('setLang missing');if(expected.lang&&f.lang!==expected.lang)p.push(`lang=${f.lang}`);if(expected.dir&&f.dir!==expected.dir)p.push(`dir=${f.dir}`);if(f.fontsStatus!=='loaded')p.push(`fontsStatus=${f.fontsStatus}`);if(!f.localStylesheetsLoaded)p.push('local stylesheets not loaded');if(f.bootState!=='released')p.push(`bootState=${f.bootState}`);if(!f.routeClassOk)p.push('route class mismatch');if(!f.controllerStateOk)p.push('controller state mismatch');if(f.images.some(x=>!x.complete||x.decode.startsWith('error:')))p.push('hero image readiness failure');return p;
}
export function pairReadinessProblems(a,b,{allowNonzeroScroll=false}={}){
  const pa=[],pb=[];
  if(a.viewport.width!==b.viewport.width||a.viewport.height!==b.viewport.height){pa.push(`actual viewport mismatch ${a.viewport.width}x${a.viewport.height} vs ${b.viewport.width}x${b.viewport.height}`);pb.push(`actual viewport mismatch ${b.viewport.width}x${b.viewport.height} vs ${a.viewport.width}x${a.viewport.height}`);}
  if(a.viewport.devicePixelRatio!==b.viewport.devicePixelRatio){pa.push('devicePixelRatio mismatch');pb.push('devicePixelRatio mismatch');}
  if(JSON.stringify(a.capabilities)!==JSON.stringify(b.capabilities)){pa.push('capabilities mismatch');pb.push('capabilities mismatch');}
  if(Math.abs(a.scroll.x-b.scroll.x)>GEOMETRY_TOLERANCE||Math.abs(a.scroll.y-b.scroll.y)>GEOMETRY_TOLERANCE){pa.push(`scroll mismatch ${a.scroll.x},${a.scroll.y} vs ${b.scroll.x},${b.scroll.y}`);pb.push(`scroll mismatch ${b.scroll.x},${b.scroll.y} vs ${a.scroll.x},${a.scroll.y}`);}
  if(!allowNonzeroScroll&&(Math.abs(a.scroll.x)>GEOMETRY_TOLERANCE||Math.abs(a.scroll.y)>GEOMETRY_TOLERANCE)){pa.push(`unexpected nonzero scroll ${a.scroll.x},${a.scroll.y}`);}
  if(!allowNonzeroScroll&&(Math.abs(b.scroll.x)>GEOMETRY_TOLERANCE||Math.abs(b.scroll.y)>GEOMETRY_TOLERANCE)){pb.push(`unexpected nonzero scroll ${b.scroll.x},${b.scroll.y}`);}
  return{A:pa,B:pb};
}
