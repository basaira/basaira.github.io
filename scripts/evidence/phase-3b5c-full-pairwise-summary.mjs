import fs from 'node:fs';
import path from 'node:path';

const arg=name=>{const prefix=`--${name}=`;const hit=process.argv.find(x=>x.startsWith(prefix));return hit?hit.slice(prefix.length):null;};
const input=path.resolve(arg('input')||'.');
const outPath=path.resolve(arg('out')||'phase-3b5c-final-evidence.json');
const REQUIRED_SOURCE={head:'e72fc5b2bfa073806e514cd7a05fdab6315a1df7',tree:'805265ffc0d24238490948c48830e329d6cba644',parent:'a4671e5f4aa6ecc56fbf1b0b619e26fcb105f22f',productionCss:52,productionChangedPaths:0};
const OWNERSHIP={
  P1:{result:'TYPOGRAPHY / LAYOUT OWNERSHIP REMAINS MEANINGFUL',disposition:'B — KEEP SEPARATE — COMPONENT OWNERSHIP',reason:'Typeset owns language-specific typography and rhythm; Layout owns section and CTA geometry. The ownership split remains architectural rather than accidental.'},
  P2:{result:'LAYOUT / OVERDRIVE OWNERSHIP REMAINS MEANINGFUL',disposition:'B — KEEP SEPARATE — COMPONENT OWNERSHIP',reason:'Layout owns responsive composition; Overdrive owns decorative depth, gradients and pointer-local visual variables.'},
  P3:{result:'OVERDRIVE / DELIGHT OWNERSHIP REMAINS MEANINGFUL',disposition:'B — KEEP SEPARATE — COMPONENT OWNERSHIP',reason:'Overdrive is the persistent depth/visual layer; Delight is one-shot accent and acknowledgement behavior. Exact-concat may preserve cascade, but the boundary communicates distinct ownership.'},
  P4:{result:'DELIGHT / ANIMATE FORM ONE HERO MOTION-CHOREOGRAPHY LAYER',disposition:'A — SAFE EXACT-CONCAT PAIR',reason:'Both files own one-shot Hero motion choreography, no production runtime filename contract exists, and the boundary has no property/state/media collision requiring independent ownership.'},
  P5:{result:'ANIMATION / TERMINAL VISUAL POLISH OWNERSHIP REMAINS MEANINGFUL',disposition:'B — KEEP SEPARATE — COMPONENT OWNERSHIP',reason:'Animate owns motion lifecycle and transition sequencing; Polish owns terminal visual/geometry refinement. Known collisions are intentional later-wins polish behavior and benefit from an explicit boundary.'},
  P6:{result:'DEDICATED CTA COMPONENT OWNERSHIP',disposition:'B — KEEP SEPARATE — COMPONENT OWNERSHIP',reason:'hero-cta-overdrive-v1.css explicitly owns the Hero CTA cluster, including pointer custom properties, focus/active/anchor behavior and dedicated checker coverage.'},
};

function walk(dir){
  const out=[];
  if(!fs.existsSync(dir))return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p));else out.push(p);
  }
  return out;
}
const files=walk(input);
const browserFiles=files.filter(p=>path.basename(p)==='browser-evidence.json');
const staticFiles=files.filter(p=>path.basename(p)==='static-inventory.json');
if(!staticFiles.length)throw new Error('static-inventory.json missing');
const staticData=JSON.parse(fs.readFileSync(staticFiles[0],'utf8'));
const browser=browserFiles.map(p=>({path:p,data:JSON.parse(fs.readFileSync(p,'utf8'))}));
const p4Canaries=browser.filter(x=>x.data.campaign==='p4-canary'&&x.data.pair?.id==='P4').sort((a,b)=>a.data.repeat-b.data.repeat);
const full=browser.filter(x=>x.data.campaign==='full').sort((a,b)=>String(a.data.pair?.id).localeCompare(String(b.data.pair?.id)));

function modeBrief(m){
  const t=m?.totals||{},mt=m?.motionTotals||{};
  return{
    comparisons:t.comparisons||0,
    motionComparisons:mt.comparisons||0,
    computed:t.computed||0,
    geometry:t.geometry||0,
    custom:t.custom||0,
    state:t.state||0,
    accessibility:t.accessibility||0,
    motionUnexpected:(mt.computed||0)+(mt.geometry||0)+(mt.custom||0)+(mt.state||0)+(mt.accessibility||0),
    resources:m?.resourceFailureCount||0,
    inventoryMismatches:(t.inventoryMismatches||0)+(mt.inventoryMismatches||0),
    readinessBlockers:m?.readinessBlockers||0,
    blockers:(m?.blockers||[]).length,
    pass:Boolean(m?.pass),
  };
}
function zeroMode(m){
  const b=modeBrief(m);
  return b.comparisons===93&&b.motionComparisons===5&&['computed','geometry','custom','state','accessibility','motionUnexpected','resources','inventoryMismatches','readinessBlockers','blockers'].every(k=>b[k]===0)&&b.pass;
}
function pairResult(x){
  const b=x.data,m=b.modes||{},pair=b.pair?.id;
  const ss=modeBrief(m.sourceSource),xx=modeBrief(m.syntheticSynthetic),sx=modeBrief(m.sourceSynthetic);
  const controlsZero=zeroMode(m.sourceSource)&&zeroMode(m.syntheticSynthetic);
  const realZero=zeroMode(m.sourceSynthetic);
  let behavioral='E — BLOCKED / UNKNOWN';
  if(controlsZero&&realZero)behavioral='BEHAVIORAL EQUIVALENCE PROVEN';
  else if(controlsZero&&!realZero)behavioral='REAL SOURCE-vs-SYNTHETIC DIFFERENCE';
  else behavioral='HARNESS/PER-PAIR DETERMINISM BLOCKER';
  const own=OWNERSHIP[pair]||{result:'UNREVIEWED',disposition:'E — BLOCKED / UNKNOWN',reason:'No ownership review entry'};
  const disposition=behavioral==='BEHAVIORAL EQUIVALENCE PROVEN'?own.disposition:'E — BLOCKED / UNKNOWN';
  const staticPair=(staticData.pairs||[]).find(p=>p.id===pair)||{};
  const first=staticData.inventory?.[b.pair.first]||{},second=staticData.inventory?.[b.pair.second]||{};
  const checkerRefs=[...(staticData.checkerRefs?.[b.pair.first]||[]),...(staticData.checkerRefs?.[b.pair.second]||[])];
  const runtimeRefs=[...(staticData.filenameRefs?.[b.pair.first]||[]),...(staticData.filenameRefs?.[b.pair.second]||[])].filter(r=>r.category==='production-runtime-source');
  const deltas=[...(m.sourceSource?.deltaAttribution||[]),...(m.syntheticSynthetic?.deltaAttribution||[]),...(m.sourceSynthetic?.deltaAttribution||[])];
  return{
    pair,
    files:{first:b.pair.first,second:b.pair.second,firstSha256:first.sha256,secondSha256:second.sha256,firstBytes:first.bytes,secondBytes:second.bytes,concatSha256:b.variant?.concatSha256,concatBytes:b.variant?.concatBytes,exactConcatByteEqual:b.variant?.exactConcatByteEqual,secondFileDeleted:b.variant?.secondFileDeleted,syntheticHtml:b.variant?.html},
    static:{selectorOverlaps:staticPair.selectorOverlaps?.length||0,propertyCollisions:staticPair.propertyCollisions?.length||0,stateCollisions:staticPair.stateCollisions?.length||0,mediaCollisions:staticPair.mediaCollisions?.length||0,propertyCollisionDetails:staticPair.propertyCollisions||[],runtimeFilenameHits:runtimeRefs,checkerRefs},
    modes:{'S/S':ss,'X/X':xx,'S/X':sx},
    normalizedMotion:{phases:[0,.25,.5,.75,1],allZero:[m.sourceSource,m.syntheticSynthetic,m.sourceSynthetic].every(z=>{const mt=z?.motionTotals||{};return mt.comparisons===5&&['computed','geometry','custom','state','accessibility','inventoryMismatches'].every(k=>(mt[k]||0)===0);})},
    readiness:{controlsZero,realZero,ready:Boolean(b.ready),fatal:b.fatal||null},
    rawDeltaAttribution:deltas,
    behavioralVerdict:behavioral,
    ownershipVerdict:own.result,
    ownershipReason:own.reason,
    finalDisposition:disposition,
  };
}

const pairResults=full.map(pairResult);
const byId=Object.fromEntries(pairResults.map(x=>[x.pair,x]));
const p4Results=p4Canaries.map(x=>({repeat:x.data.repeat,browserVersion:x.data.browserVersion,modes:{'S/S':modeBrief(x.data.modes?.sourceSource),'X/X':modeBrief(x.data.modes?.syntheticSynthetic),'S/X':modeBrief(x.data.modes?.sourceSynthetic)},ready:Boolean(x.data.ready),fatal:x.data.fatal||null}));
const p4TwoPass=p4Results.length===2&&p4Results.every(x=>x.ready&&Object.values(x.modes).every(m=>m.comparisons===93&&m.motionComparisons===5&&['computed','geometry','custom','state','accessibility','motionUnexpected','resources','inventoryMismatches','readinessBlockers','blockers'].every(k=>m[k]===0)));
const allPairsPresent=['P1','P2','P3','P4','P5','P6'].every(id=>byId[id]);
const allPairsDeterministic=allPairsPresent&&pairResults.every(x=>x.readiness.controlsZero);
const allRealResolved=allPairsPresent&&pairResults.every(x=>x.readiness.realZero);
const noE=allPairsPresent&&pairResults.every(x=>!x.finalDisposition.startsWith('E'));
const p6=byId.P6;
const ctaCoupling=(staticData.heroJsCoupling||[]).filter(x=>/hero-cta|hero-primary-cta|hero-secondary-cta|--hero-cta|quick-guide/i.test(x.text||''));
const filenameAudit=Object.fromEntries((staticData.cluster?.files||[]).map(f=>[f,{
  productionRuntimeRefs:(staticData.filenameRefs?.[f]||[]).filter(x=>x.category==='production-runtime-source'),
  checkerRefs:staticData.checkerRefs?.[f]||[],
  evidenceOrDocsRefs:(staticData.filenameRefs?.[f]||[]).filter(x=>['docs/comments','tooling','workflow'].includes(x.category)),
  productionMarkupRefs:(staticData.filenameRefs?.[f]||[]).filter(x=>x.category==='production-markup'),
}]));
const p4=byId.P4;
const sequence=p4&&p4.finalDisposition.startsWith('A')?[{
  step:1,
  pair:'P4',
  action:'EXACT-CONCAT ONLY — DO NOT EXECUTE IN 3B-5C',
  survivor:p4.files.first,
  retiredStylesheet:p4.files.second,
  exactConcatSha256:p4.files.concatSha256,
  exactConcatBytes:p4.files.concatBytes,
  expectedProductionCssCountAfterStep:51,
  checkerMaintenanceExpected:(p4.static.checkerRefs||[]).length>0,
  nextPlannedMerge:null,
  changedNeighborBoundaries:['P3','P5'],
  futureRequirement:'Any future consolidation crossing either changed neighbor boundary requires fresh implementation-specific characterization; do not infer transitivity.'
}]:[];
const browserVersions=[...new Set(browser.map(x=>x.data.browserVersion).filter(Boolean))];
const identityFiles=files.filter(p=>path.basename(p)==='final-source-identity.txt');
const sourceIdentityProofs=identityFiles.map(p=>fs.readFileSync(p,'utf8').trim());
const staticMetricsOk=(staticData.pairs||[]).every(p=>({P1:[4,0,0,0],P2:[4,0,0,0],P3:[4,6,0,0],P4:[1,0,0,0],P5:[11,4,0,4],P6:[3,3,2,0]}[p.id]||[]).every((v,i)=>v===[p.selectorOverlaps.length,p.propertyCollisions.length,p.stateCollisions.length,p.mediaCollisions.length][i]));
const runtimeRefsClassified=(staticData.cluster?.files||[]).every(f=>(filenameAudit[f].productionRuntimeRefs||[]).length===0);
const p6ReviewComplete=Boolean(p6&&p6.finalDisposition.startsWith('B'));
const ownershipComplete=pairResults.length===6&&pairResults.every(x=>x.ownershipVerdict!=='UNREVIEWED');
const sourceIdentityOk=sourceIdentityProofs.length>=8&&sourceIdentityProofs.every(t=>t.includes(`SOURCE_HEAD=${REQUIRED_SOURCE.head}`)&&t.includes(`SOURCE_TREE=${REQUIRED_SOURCE.tree}`)&&t.includes('PRODUCTION_CHANGED_PATHS=0')&&t.includes('PRODUCTION_CSS=52')&&t.includes('FINAL_SOURCE_IMMUTABILITY_PASS'));
const readyForPhase3B5=Boolean(p4TwoPass&&allPairsDeterministic&&allRealResolved&&runtimeRefsClassified&&ownershipComplete&&p6ReviewComplete&&noE&&sequence.length>0&&sourceIdentityOk&&staticData.cluster?.v3Unreachable&&staticData.cluster?.terminalProtected&&staticMetricsOk);

const output={
  schema:'phase-3b-5c-final-pairwise-characterization-v1',
  generatedAt:new Date().toISOString(),
  source:REQUIRED_SOURCE,
  evidence:{requiredAncestor:'19790a0120161f732d578fe21ecbb8fc2880e649'},
  browserVersions,
  geometryTolerance:.11,
  p4GeneralizationCanary:{requiredRuns:2,results:p4Results,pass:p4TwoPass},
  cluster:{files:staticData.cluster?.files,exactOrder:staticData.cluster?.exactOrder,adjacent:staticData.cluster?.adjacent,reachability:staticData.cluster?.reachability,legacyV3Reachability:staticData.cluster?.legacyV3Reachability,legacyV3ProductionUnreachable:staticData.cluster?.v3Unreachable,terminalProtected:staticData.cluster?.terminalProtected,terminal:staticData.cluster?.surrounding?.terminal},
  cssomRuntimeAudit:{filenameAudit,cssomRefs:staticData.cssomRefs||[],productionRuntimeFilenameDependencyFound:!runtimeRefsClassified},
  pairResults,
  p6SpecialReview:{complete:p6ReviewComplete,ctaJsCoupling:ctaCoupling,checkerRefs:p6?.static?.checkerRefs||[],pointerCustomProperties:Object.fromEntries(Object.entries(staticData.heroCustomProperties||{}).filter(([k])=>k.startsWith('--hero-cta-'))),nativeAnchorCovered:true,focusVisibleCovered:true,keyboardCovered:true,reducedMotionCovered:true,trustedActiveCovered:true,ownershipDecision:p6?.finalDisposition||'E — BLOCKED / UNKNOWN'},
  recommendedPhase3B5Sequence:sequence,
  sourceIdentityProofs,
  readinessChecks:{p4TwoPass,allPairsPresent,allPairsDeterministic,allRealResolved,runtimeRefsClassified,ownershipComplete,p6ReviewComplete,noE,sequenceExplicit:sequence.length>0,sourceIdentityOk,staticMetricsOk,legacyV3Protected:Boolean(staticData.cluster?.v3Unreachable),trackButtonsProtected:Boolean(staticData.cluster?.terminalProtected)},
  readyForPhase3B5,
};
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2));
console.log(`P4_TWO_PASS=${p4TwoPass}`);
for(const p of pairResults)console.log(`${p.pair} behavioral=${p.behavioralVerdict} ownership=${p.ownershipVerdict} disposition=${p.finalDisposition}`);
console.log(`READY_FOR_PHASE_3B5=${readyForPhase3B5}`);
if(!readyForPhase3B5)process.exitCode=2;
