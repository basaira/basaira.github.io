import puppeteer from 'puppeteer-core';
import {MOTION_PROGRESS,VIEWPORT_WIDTHS,LOCALES,chrome,setLocale,setControllerState} from './phase-3b5c-round2-base.mjs';
import {prepareStatic,stableAnimationInventory,waitAckReset,openPage,forceMaterialization,resetPointer} from './phase-3b5c-round2-lifecycle.mjs';
import {measurePair,interactionPoint,aggregate,deltaAttribution,capturePage,finalizePair} from './phase-3b5c-round2-measure.mjs';

async function foregroundReset(page,maxAttempts=4){
  let last=null;
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    await page.bringToFront();
    last=await resetPointer(page);
    if(!last.problems.length)return{...last,attempt,foreground:true};
  }
  throw new Error(`foreground pointer reset failed: ${JSON.stringify(last?.problems||[])}`);
}

async function prepareForeground(page,opts){
  await page.bringToFront();
  const prepared=await prepareStatic(page,opts);
  const reset=await foregroundReset(page);
  return{...prepared,foregroundReset:reset};
}

async function acquireTrustedHover(page,point,selector,maxAttempts=4){
  const attempts=[];
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    await page.bringToFront();
    await page.mouse.move(1,1);
    await forceMaterialization(page);
    await page.mouse.move(point.x,point.y);
    await forceMaterialization(page);
    const state=await page.$eval(selector,e=>{const cs=getComputedStyle(e);return{hover:e.matches(':hover'),active:e.matches(':active'),x:cs.getPropertyValue('--hero-cta-x').trim(),y:cs.getPropertyValue('--hero-cta-y').trim()};});
    attempts.push({attempt,state});
    if(state.hover)return{acquired:true,attempt,state,attempts};
  }
  throw new Error(`trusted hover acquisition failed for ${selector}: ${JSON.stringify(attempts)}`);
}

async function measureSequentialHoverDet(a,b,monA,monB,mode,records,label,selector,rx,ry,ctx={}){
  const resetA=await foregroundReset(a),resetB=await foregroundReset(b),point=await interactionPoint(a,b,selector,rx,ry),meta={interactionApplicable:point.applicable,interactionTarget:point,resetBefore:{source:resetA,synthetic:resetB},sequential:true,trustedState:'hover'};
  if(!point.applicable)return measurePair(a,b,monA,monB,mode,records,label,'interaction',{...ctx,recordMeta:meta});
  const acquiredA=await acquireTrustedHover(a,point,selector);const left=await capturePage(a,monA,mode,label,'interaction',{...ctx,side:'A'});await foregroundReset(a);
  const acquiredB=await acquireTrustedHover(b,point,selector);const right=await capturePage(b,monB,mode,label,'interaction',{...ctx,side:'B'});await foregroundReset(b);
  return finalizePair(records,label,'interaction',left,right,{...ctx,recordMeta:{...meta,acquisition:{source:acquiredA,synthetic:acquiredB}}});
}

async function measureSequentialActiveAndAckDet(a,b,monA,monB,mode,records,ctx={}){
  const resetA=await foregroundReset(a),resetB=await foregroundReset(b),point=await interactionPoint(a,b,'#home .hero-primary-cta',.33,.64);if(!point.applicable)throw new Error('primary CTA unexpectedly non-interactive');
  const run=async(page,mon,side)=>{
    const hover=await acquireTrustedHover(page,point,'#home .hero-primary-cta');
    await page.mouse.down();await forceMaterialization(page);
    const activeState=await page.$eval('#home .hero-primary-cta',e=>({active:e.matches(':active'),hover:e.matches(':hover')}));
    if(!activeState.active)throw new Error(`trusted active acquisition failed on ${side}: ${JSON.stringify(activeState)}`);
    const active=await capturePage(page,mon,mode,'fine-active-primary','interaction',{...ctx,side});
    await page.mouse.move(1,1);await page.mouse.up();await forceMaterialization(page);
    const ack=await capturePage(page,mon,mode,'fine-acknowledged-after-press','interaction',{...ctx,side});
    try{await waitAckReset(page);}catch{}
    const resetAfter=await foregroundReset(page);
    return{hover,activeState,active,ack,resetAfter};
  };
  const A=await run(a,monA,'A'),B=await run(b,monB,'B'),meta={interactionApplicable:true,interactionTarget:point,resetBefore:{source:resetA,synthetic:resetB},sequential:true,trustedState:'active',acquisition:{source:{hover:A.hover,active:A.activeState},synthetic:{hover:B.hover,active:B.activeState}}};
  finalizePair(records,'fine-active-primary','interaction',A.active,B.active,{...ctx,recordMeta:meta});
  finalizePair(records,'fine-acknowledged-after-press','interaction',A.ack,B.ack,{...ctx,recordMeta:{...meta,resetAfter:{source:A.resetAfter,synthetic:B.resetAfter}}});
}

async function waitScrollStableDeep(page,maxFrames=24,requiredStableFrames=3){
  return page.evaluate(async({maxFrames,requiredStableFrames})=>{
    await Promise.resolve();
    let previous=null,stable=0,last={x:scrollX,y:scrollY};
    for(let frame=1;frame<=maxFrames;frame++){
      await new Promise(r=>requestAnimationFrame(()=>r()));
      last={x:scrollX,y:scrollY};const key=`${last.x},${last.y}`;
      if(key===previous)stable++;else stable=0;
      if(stable>=requiredStableFrames)return{stable:true,frames:frame,requiredStableFrames,...last};
      previous=key;
    }
    return{stable:false,frames:maxFrames,requiredStableFrames,...last};
  },{maxFrames,requiredStableFrames});
}

async function focusPrimaryByKeyboardDet(page){
  const reset=await foregroundReset(page);await page.bringToFront();await page.evaluate(()=>document.activeElement?.blur?.());
  for(let i=0;i<50;i++){
    await page.keyboard.press('Tab');
    if(await page.$eval('#home .hero-primary-cta',e=>e.matches(':focus-visible'))){const scroll=await waitScrollStableDeep(page);return{reset,tabs:i+1,scroll};}
  }
  throw new Error('Could not reach primary CTA by keyboard');
}

async function measureSequentialKeyboardDet(a,b,monA,monB,mode,records,ctx={}){
  const run=async(page,mon,side)=>{const primaryFocus=await focusPrimaryByKeyboardDet(page);const primary=await capturePage(page,mon,mode,'keyboard-focus-primary','interaction',{...ctx,side});await page.keyboard.press('Tab');const secondaryScroll=await waitScrollStableDeep(page);const secondary=await capturePage(page,mon,mode,'keyboard-focus-secondary','interaction',{...ctx,side});return{primaryFocus,primary,secondaryScroll,secondary};};
  const A=await run(a,monA,'A'),B=await run(b,monB,'B');
  finalizePair(records,'keyboard-focus-primary','interaction',A.primary,B.primary,{...ctx,allowNonzeroScroll:true,recordMeta:{sequential:true,nativeScroll:true,scrollSettle:{source:A.primaryFocus.scroll,synthetic:B.primaryFocus.scroll}}});
  finalizePair(records,'keyboard-focus-secondary','interaction',A.secondary,B.secondary,{...ctx,allowNonzeroScroll:true,recordMeta:{sequential:true,nativeScroll:true,scrollSettle:{source:A.secondaryScroll,synthetic:B.secondaryScroll}}});
  await foregroundReset(a);await foregroundReset(b);
}

export async function runNormalizedEntranceMotion(a,b,monA,monB,mode,motionRecords){
  const prepA=await prepareForeground(a,{lang:'en',phase:'prep'}),prepB=await prepareForeground(b,{lang:'en',phase:'prep'}),preA=await stableAnimationInventory(a),preB=await stableAnimationInventory(b);
  await Promise.all([setControllerState(a,'entered'),setControllerState(b,'entered')]);
  const triggeredA=await stableAnimationInventory(a),triggeredB=await stableAnimationInventory(b),logicalEqual=triggeredA.stable&&triggeredB.stable&&JSON.stringify(triggeredA.logical)===JSON.stringify(triggeredB.logical);
  if(!preA.stable||!preB.stable||!triggeredA.stable||!triggeredB.stable)throw new Error('entrance animation inventory did not stabilize');
  for(const progress of MOTION_PROGRESS){const ctx={locale:'en',requestedViewport:{width:1440,height:900,deviceScaleFactor:1,isMobile:false,hasTouch:false},motionPhase:`entered@${progress}`,controllerPhase:'entered',normalizedProgress:progress};await measurePair(a,b,monA,monB,mode,motionRecords,`motion:entrance:${Math.round(progress*100)}%`,'motion',ctx);}
  return{pre:{source:preA,synthetic:preB},triggered:{source:triggeredA,synthetic:triggeredB},logicalEqual,prepare:{source:prepA,synthetic:prepB}};
}

export async function run88FineMatrix(a,b,monA,monB,mode,records){
  let prepA=await prepareForeground(a,{lang:'en',phase:'prep'}),prepB=await prepareForeground(b,{lang:'en',phase:'prep'});await measurePair(a,b,monA,monB,mode,records,'initial-pre-animation','static',{locale:'en',requestedViewport:prepA.requestedViewport,motionPhase:'prep'});
  prepA=await prepareForeground(a,{lang:'en',phase:'entered'});prepB=await prepareForeground(b,{lang:'en',phase:'entered'});await measurePair(a,b,monA,monB,mode,records,'initial-settled','static',{locale:'en',requestedViewport:prepA.requestedViewport,motionPhase:'entered'});
  for(const width of VIEWPORT_WIDTHS){const height=width<=640?844:900;for(const lang of LOCALES){prepA=await prepareForeground(a,{lang,phase:'entered',width,height});prepB=await prepareForeground(b,{lang,phase:'entered',width,height});await measurePair(a,b,monA,monB,mode,records,`responsive:${width}:${lang}`,'responsive',{locale:lang,requestedViewport:prepA.requestedViewport,motionPhase:'entered'});}}
  prepA=await prepareForeground(a,{lang:'en',phase:'entered'});prepB=await prepareForeground(b,{lang:'en',phase:'entered'});const fineCtx={locale:'en',requestedViewport:prepA.requestedViewport,motionPhase:'entered'};await measurePair(a,b,monA,monB,mode,records,'fine-idle','interaction',fineCtx);
  await measureSequentialHoverDet(a,b,monA,monB,mode,records,'fine-hover-primary','#home .hero-primary-cta',.55,.45,fineCtx);
  const stageReset={source:await foregroundReset(a),synthetic:await foregroundReset(b)},stagePoint=await interactionPoint(a,b,'#home .hero-visual-stage',.72,.33);await measurePair(a,b,monA,monB,mode,records,'fine-stage-pointer-custom','interaction',{...fineCtx,recordMeta:{interactionApplicable:stagePoint.applicable,interactionTarget:stagePoint,resetBefore:stageReset,sequential:true}});
  await measureSequentialHoverDet(a,b,monA,monB,mode,records,'fine-cta-pointer-custom','#home .hero-primary-cta',.33,.64,fineCtx);
  await measureSequentialActiveAndAckDet(a,b,monA,monB,mode,records,fineCtx);
  await Promise.all([waitAckReset(a).catch(()=>{}),waitAckReset(b).catch(()=>{})]);const leaveReset={source:await foregroundReset(a),synthetic:await foregroundReset(b)};await measurePair(a,b,monA,monB,mode,records,'fine-pointer-leave-reset','interaction',{...fineCtx,recordMeta:{pointerReset:leaveReset}});
  await measureSequentialKeyboardDet(a,b,monA,monB,mode,records,fineCtx);
  prepA=await prepareForeground(a,{lang:'ar',phase:'entered'});prepB=await prepareForeground(b,{lang:'ar',phase:'entered'});await measureSequentialHoverDet(a,b,monA,monB,mode,records,'rtl-primary-hover','#home .hero-primary-cta',.5,.5,{locale:'ar',requestedViewport:prepA.requestedViewport,motionPhase:'entered'});
  prepA=await prepareForeground(a,{lang:'en',phase:'entered'});prepB=await prepareForeground(b,{lang:'en',phase:'entered'});
  const resetAnchorA=await foregroundReset(a);await a.evaluate(()=>document.querySelector('#home .hero-secondary-cta')?.click());await a.waitForFunction(()=>location.hash==='#quick-guide',{timeout:3000});const scrollA=await waitScrollStableDeep(a);if(!scrollA.stable)throw new Error(`native anchor source scroll did not stabilize: ${JSON.stringify(scrollA)}`);await forceMaterialization(a);
  const resetAnchorB=await foregroundReset(b);await b.evaluate(()=>document.querySelector('#home .hero-secondary-cta')?.click());await b.waitForFunction(()=>location.hash==='#quick-guide',{timeout:3000});const scrollB=await waitScrollStableDeep(b);if(!scrollB.stable)throw new Error(`native anchor comparison scroll did not stabilize: ${JSON.stringify(scrollB)}`);await forceMaterialization(b);
  await measurePair(a,b,monA,monB,mode,records,'native-anchor-secondary','interaction',{locale:'en',requestedViewport:prepA.requestedViewport,motionPhase:'entered',allowNonzeroScroll:true,recordMeta:{pointerResetBeforeAnchor:{source:resetAnchorA,synthetic:resetAnchorB},scrollSettle:{source:scrollA,synthetic:scrollB},nativeScroll:true}});
}

export async function sequentialCoarseTouch(C,D,monC,monD,mode,records,ctx){
  const resetC=await foregroundReset(C),resetD=await foregroundReset(D),point=await interactionPoint(C,D,'#home .hero-primary-cta',.5,.5);if(!point.applicable)throw new Error('coarse primary CTA non-interactive');
  const run=async(page,mon,side)=>{await page.bringToFront();const session=await page.target().createCDPSession();await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await forceMaterialization(page);const snap=await capturePage(page,mon,mode,'coarse-touch-active','interaction',{...ctx,side});await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await forceMaterialization(page);return snap;};
  const left=await run(C,monC,'A'),right=await run(D,monD,'B');finalizePair(records,'coarse-touch-active','interaction',left,right,{...ctx,recordMeta:{interactionApplicable:true,interactionTarget:point,resetBefore:{source:resetC,synthetic:resetD},sequential:true,input:'touch'}});
}

export async function runMode(mode,leftOrigin,rightOrigin){
  const records=[],motionRecords=[],blockers=[],browserA=await puppeteer.launch({headless:false,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--metrics-recording-only','--no-first-run']}),browserB=await puppeteer.launch({headless:false,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--metrics-recording-only','--no-first-run']});let fineCaps=null,coarseCaps=null,reducedCaps=null,entranceMotion=null,resourceFailures=[];
  try{
    const A=await openPage(browserA,leftOrigin),B=await openPage(browserB,rightOrigin);fineCaps={source:await A.page.evaluate(()=>({pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches})),synthetic:await B.page.evaluate(()=>({pointerFine:matchMedia('(pointer:fine)').matches,hoverHover:matchMedia('(hover:hover)').matches}))};if(!fineCaps.source.pointerFine||!fineCaps.source.hoverHover||!fineCaps.synthetic.pointerFine||!fineCaps.synthetic.hoverHover)blockers.push({type:'fine-capability',fineCaps});
    entranceMotion=await runNormalizedEntranceMotion(A.page,B.page,A.monitor,B.monitor,mode,motionRecords);if(!entranceMotion.logicalEqual)blockers.push({type:'entrance-animation-inventory-mismatch',details:entranceMotion.triggered});await run88FineMatrix(A.page,B.page,A.monitor,B.monitor,mode,records);resourceFailures.push(...A.monitor.localFailures,...B.monitor.localFailures);if(A.monitor.pageErrors.length||B.monitor.pageErrors.length)blockers.push({type:'page-errors',A:A.monitor.pageErrors,B:B.monitor.pageErrors});await Promise.all([A.page.close(),B.page.close()]);
    const C=await openPage(browserA,leftOrigin,{mobile:true}),D=await openPage(browserB,rightOrigin,{mobile:true});coarseCaps={source:await C.page.evaluate(()=>({pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches})),synthetic:await D.page.evaluate(()=>({pointerCoarse:matchMedia('(pointer:coarse)').matches,hoverNone:matchMedia('(hover:none)').matches}))};if(!coarseCaps.source.pointerCoarse||!coarseCaps.source.hoverNone||!coarseCaps.synthetic.pointerCoarse||!coarseCaps.synthetic.hoverNone)blockers.push({type:'coarse-capability',coarseCaps});if(JSON.stringify(C.monitor.requestedViewport)!==JSON.stringify(D.monitor.requestedViewport))blockers.push({type:'coarse-requested-viewport-mismatch',source:C.monitor.requestedViewport,synthetic:D.monitor.requestedViewport});await Promise.all([setLocale(C.page,'en'),setLocale(D.page,'en')]);await Promise.all([setControllerState(C.page,'entered'),setControllerState(D.page,'entered')]);const coarseRequested={source:C.monitor.requestedViewport,synthetic:D.monitor.requestedViewport},coarseCtx={locale:'en',requestedViewport:C.monitor.requestedViewport,motionPhase:'entered'};await measurePair(C.page,D.page,C.monitor,D.monitor,mode,records,'coarse-idle','interaction',coarseCtx);await sequentialCoarseTouch(C.page,D.page,C.monitor,D.monitor,mode,records,coarseCtx);await Promise.all([waitAckReset(C.page).catch(()=>{}),waitAckReset(D.page).catch(()=>{})]);await measurePair(C.page,D.page,C.monitor,D.monitor,mode,records,'coarse-touch-reset','interaction',{...coarseCtx,recordMeta:{requestedViewportPair:coarseRequested}});resourceFailures.push(...C.monitor.localFailures,...D.monitor.localFailures);if(C.monitor.pageErrors.length||D.monitor.pageErrors.length)blockers.push({type:'coarse-page-errors',A:C.monitor.pageErrors,B:D.monitor.pageErrors});await Promise.all([C.page.close(),D.page.close()]);
    const E=await openPage(browserA,leftOrigin,{reduced:true}),F=await openPage(browserB,rightOrigin,{reduced:true});reducedCaps={source:await E.page.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches})),synthetic:await F.page.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}))};if(!reducedCaps.source.reduced||!reducedCaps.synthetic.reduced)blockers.push({type:'reduced-capability',reducedCaps});await Promise.all([setLocale(E.page,'en'),setLocale(F.page,'en')]);await Promise.all([setControllerState(E.page,'prep'),setControllerState(F.page,'prep')]);const reducedRequested=E.monitor.requestedViewport;await measurePair(E.page,F.page,E.monitor,F.monitor,mode,records,'reduced-initial','static',{locale:'en',requestedViewport:reducedRequested,motionPhase:'prep'});await Promise.all([setControllerState(E.page,'entered'),setControllerState(F.page,'entered')]);await measurePair(E.page,F.page,E.monitor,F.monitor,mode,records,'reduced-settled','static',{locale:'en',requestedViewport:reducedRequested,motionPhase:'entered'});resourceFailures.push(...E.monitor.localFailures,...F.monitor.localFailures);if(E.monitor.pageErrors.length||F.monitor.pageErrors.length)blockers.push({type:'reduced-page-errors',A:E.monitor.pageErrors,B:F.monitor.pageErrors});await Promise.all([E.page.close(),F.page.close()]);
  }catch(e){blockers.push({type:'harness-exception',message:String(e?.stack||e)});}finally{await Promise.allSettled([browserA.close(),browserB.close()]);}
  const totals=aggregate(records),motionTotals=aggregate(motionRecords),readinessBlockers=records.filter(r=>r.readinessBlocker).length+motionRecords.filter(r=>r.readinessBlocker).length,unexpected=totals.computed+totals.geometry+totals.custom+totals.state+totals.accessibility+totals.inventoryMismatches+motionTotals.computed+motionTotals.geometry+motionTotals.custom+motionTotals.state+motionTotals.accessibility+motionTotals.inventoryMismatches+resourceFailures.length+readinessBlockers+blockers.length;
  return{mode,records,motionRecords,totals,motionTotals,resourceFailures,resourceFailureCount:resourceFailures.length,blockers,readinessBlockers,environment:{fineCaps,coarseCaps,reducedCaps},entranceMotion,deltaAttribution:[...deltaAttribution(records,mode),...deltaAttribution(motionRecords,mode)],pass:unexpected===0};
}
