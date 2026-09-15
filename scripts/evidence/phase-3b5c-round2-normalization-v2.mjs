import {stableAnimationInventory,forceMaterialization} from './phase-3b5c-round2-lifecycle.mjs';

const MAX_NORMALIZATION_ROUNDS=8;

function logicalKeyScript(){return `const elementKey=el=>{if(!el)return'unknown';if(el.id)return '#'+el.id;const classes=[...el.classList||[]].filter(Boolean).slice(0,3);let key=el.tagName?.toLowerCase?.()||'node';if(classes.length)key+='.'+classes.join('.');if(el.parentElement){const siblings=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);if(siblings.length>1)key+=':nth-of-type('+(siblings.indexOf(el)+1)+')';}return key;};`;}

async function positionCurrentAnimations(page,progress){
  return page.evaluate(p=>{
    const hero=document.querySelector('#home');
    const elementKey=el=>{if(!el)return'unknown';if(el.id)return`#${el.id}`;const classes=[...el.classList||[]].filter(Boolean).slice(0,3);let key=el.tagName?.toLowerCase?.()||'node';if(classes.length)key+='.'+classes.join('.');if(el.parentElement){const siblings=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);if(siblings.length>1)key+=`:nth-of-type(${siblings.indexOf(el)+1})`;}return key;};
    const out=[];
    for(const a of document.getAnimations({subtree:true})){
      const effect=a.effect,target=effect?.target,el=target instanceof Element?target:(target?.element instanceof Element?target.element:null);if(!effect||!el||!(el===hero||hero?.contains(el)))continue;
      const t=effect.getTiming(),duration=Number(t.duration),delay=Number(t.delay)||0,iterations=Number(t.iterations),type=a.constructor?.name||'Animation',pseudo=effect?.pseudoElement||target?.type||null,logicalName=type==='CSSAnimation'?(a.animationName||''):(type==='CSSTransition'?(a.transitionProperty||''):(a.animationName||a.transitionProperty||'')),key=`${elementKey(el)}${pseudo||''}|${type}|${logicalName}`;
      try{a.pause();let desired=null;if(t.iterations!==Infinity&&Number.isFinite(duration)&&Number.isFinite(iterations)){desired=delay+duration*iterations*p;if(Number.isFinite(desired))a.currentTime=desired;}const c=effect.getComputedTiming();out.push({key,type,desiredCurrentTime:desired,currentTime:a.currentTime,computedProgress:c.progress,duration:t.duration,delay:t.delay,iterations:t.iterations});}catch(e){out.push({key,type,error:String(e)});}
    }
    document.documentElement.getBoundingClientRect();return out;
  },progress);
}

export async function normalizeAnimationsConverged(page,finiteProgress=1){
  const before=await stableAnimationInventory(page);if(!before.stable)return{stable:false,stage:'pre-normalization',progress:finiteProgress,before};
  let previousLogical=null;const rounds=[];
  for(let round=1;round<=MAX_NORMALIZATION_ROUNDS;round++){
    const normalized=await positionCurrentAnimations(page,finiteProgress);await forceMaterialization(page);const after=await stableAnimationInventory(page);if(!after.stable)return{stable:false,stage:'post-normalization-inventory',progress:finiteProgress,before,rounds,normalized,after};
    const expected=new Map(normalized.filter(x=>!x.error).map(x=>[x.key,x])),missingNormalizedKeys=[],positionProblems=[];
    for(const a of after.inventory){if(a.iterations===Infinity)continue;const e=expected.get(a.key);if(!e){missingNormalizedKeys.push(a.key);continue;}if(Number.isFinite(e.desiredCurrentTime)&&Math.abs(Number(a.currentTime)-e.desiredCurrentTime)>1e-6)positionProblems.push({key:a.key,currentTime:a.currentTime,expectedCurrentTime:e.desiredCurrentTime});if(typeof e.computedProgress==='number'&&typeof a.progress==='number'&&Math.abs(a.progress-e.computedProgress)>1e-9)positionProblems.push({key:a.key,computedProgress:a.progress,expectedComputedProgress:e.computedProgress});}
    const serialized=JSON.stringify(after.logical),inventorySameAsPrevious=serialized===previousLogical;rounds.push({round,normalized,after,missingNormalizedKeys,positionProblems,inventorySameAsPrevious});
    if(inventorySameAsPrevious&&!missingNormalizedKeys.length&&!positionProblems.length)return{stable:true,stage:'ok',progress:finiteProgress,before,normalized,after,rounds,positionProblems:[],missingNormalizedKeys:[]};previousLogical=serialized;
  }
  const after=await stableAnimationInventory(page);return{stable:false,stage:'normalization-round-limit',progress:finiteProgress,before,after,rounds};
}
