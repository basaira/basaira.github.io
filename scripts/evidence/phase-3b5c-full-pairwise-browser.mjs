import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {GEOMETRY_TOLERANCE,source,outPath,repeat,serverFor} from './phase-3b5c-round2-base.mjs';
import {runMode} from './phase-3b5c-round2-matrix.mjs';

const HERO_FILES=[
  'hero-typeset-v2.css',
  'hero-layout-v2.css',
  'hero-overdrive-v2.css',
  'hero-delight-v4.css',
  'hero-animate-v4.css',
  'hero-polish-v4.css',
  'hero-cta-overdrive-v1.css',
];
const PAIRS=Object.fromEntries(HERO_FILES.slice(0,-1).map((first,i)=>[`P${i+1}`,{id:`P${i+1}`,first,second:HERO_FILES[i+1]}]));
const arg=name=>{const prefix=`--${name}=`;const hit=process.argv.find(x=>x.startsWith(prefix));return hit?hit.slice(prefix.length):null;};
const pairId=arg('pair')||'P1';
const campaign=arg('campaign')||'full';
const pair=PAIRS[pairId];
if(!pair)throw new Error(`Unknown pair ${pairId}`);
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

function constructVariant(tempRoot){
  const dir=path.join(tempRoot,`${pair.id.toLowerCase()}-synthetic`);
  fs.cpSync(source,dir,{recursive:true,filter:s=>!['.git','node_modules','dist','.vite'].includes(path.basename(s))});
  const first=fs.readFileSync(path.join(source,pair.first));
  const second=fs.readFileSync(path.join(source,pair.second));
  const concat=Buffer.concat([first,second]);
  fs.writeFileSync(path.join(dir,pair.first),concat);
  fs.rmSync(path.join(dir,pair.second));
  const indexPath=path.join(dir,'index.html');
  const originalHtml=fs.readFileSync(indexPath,'utf8');
  const re=new RegExp(`<link\\s+[^>]*href=["'](?:\\./)?${escapeRe(pair.second)}(?:\\?[^"']*)?["'][^>]*rel=["']stylesheet["'][^>]*>`,'g');
  const matches=[...originalHtml.matchAll(re)];
  if(matches.length!==1)throw new Error(`${pair.id} expected exactly one ${pair.second} link, got ${matches.length}`);
  const removedLink=matches[0][0];
  const syntheticHtml=originalHtml.replace(re,'');
  if(!syntheticHtml.includes(pair.first))throw new Error(`${pair.id} survivor link missing`);
  if(Buffer.byteLength(syntheticHtml)!==Buffer.byteLength(originalHtml)-Buffer.byteLength(removedLink))throw new Error(`${pair.id} HTML byte-removal proof failed`);
  fs.writeFileSync(indexPath,syntheticHtml,'utf8');
  const syntheticFirst=fs.readFileSync(path.join(dir,pair.first));
  if(!syntheticFirst.equals(concat))throw new Error(`${pair.id} synthetic survivor is not exact concat`);
  return{
    dir,
    firstFile:pair.first,
    secondFile:pair.second,
    firstSha256:sha256(first),
    secondSha256:sha256(second),
    firstBytes:first.length,
    secondBytes:second.length,
    concatSha256:sha256(concat),
    concatBytes:concat.length,
    syntheticSurvivorSha256:sha256(syntheticFirst),
    exactConcatByteEqual:syntheticFirst.equals(concat),
    secondFileDeleted:!fs.existsSync(path.join(dir,pair.second)),
    html:{originalBytes:Buffer.byteLength(originalHtml),syntheticBytes:Buffer.byteLength(syntheticHtml),removedLinkBytes:Buffer.byteLength(removedLink),removedLink,secondLinkMatches:matches.length,onlySecondLinkRemoved:true},
  };
}

const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),`phase3b5c-${pair.id.toLowerCase()}-`));
const variant=constructVariant(tempRoot);
const sourceServer=await serverFor(source);
const syntheticServer=await serverFor(variant.dir);
const output={
  schema:'phase-3b-5c-full-pairwise-v1',
  generatedAt:new Date().toISOString(),
  campaign,
  repeat,
  baseSha:process.env.BASE_SHA||null,
  pair,
  variant,
  geometryTolerance:GEOMETRY_TOLERANCE,
  modes:{},
  rootCauseRepair:{
    trustedPointer:'Sequential foreground trusted-state acquisition with explicit reset between sides.',
    transitionMaterialization:'Microtask/RAF/style-layout materialization, stable canonical logical inventory, immediate freeze, then deterministic normalization.',
    normalizedMotion:'Finite motion normalized at 0/25/50/75/100 percent from the same materialized lifecycle.',
    keyboardScroll:'Native nonzero keyboard/anchor scroll is preserved; pair readiness requires matched scroll within geometry tolerance.',
    coarseViewport:'Requested emulation settings are distinct from actual layout viewport and actual dimensions must match between sides.',
    hiddenStageInteraction:'Noninteractive/hidden Hero stage is retained in coverage as interactionApplicable=false rather than synthesized coordinates.',
  },
};
let fatal=null;
try{
  output.modes.sourceSource=await runMode('S/S',sourceServer.origin,sourceServer.origin);
  output.modes.syntheticSynthetic=await runMode('X/X',syntheticServer.origin,syntheticServer.origin);
  output.modes.sourceSynthetic=await runMode('S/X',sourceServer.origin,syntheticServer.origin);
}catch(e){fatal=String(e?.stack||e);}
finally{
  await new Promise(r=>sourceServer.server.close(r));
  await new Promise(r=>syntheticServer.server.close(r));
  fs.rmSync(tempRoot,{recursive:true,force:true});
}
output.fatal=fatal;
const modes=Object.values(output.modes);
output.controlsPass=Boolean(output.modes.sourceSource?.pass&&output.modes.syntheticSynthetic?.pass);
output.realPass=Boolean(output.modes.sourceSynthetic?.pass);
output.ready=Boolean(!fatal&&output.controlsPass&&output.realPass&&modes.length===3&&modes.every(m=>m.totals.comparisons===93&&m.motionTotals.comparisons===5));
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2));
for(const m of Object.values(output.modes))console.log(`${pair.id} ${m.mode} comparisons=${m.totals.comparisons} computed=${m.totals.computed} geometry=${m.totals.geometry} custom=${m.totals.custom} state=${m.totals.state} motion=${m.motionTotals.computed+m.motionTotals.geometry+m.motionTotals.custom+m.motionTotals.state+m.motionTotals.accessibility} accessibility=${m.totals.accessibility} resources=${m.resourceFailureCount} inventoryMismatches=${m.totals.inventoryMismatches+m.motionTotals.inventoryMismatches} readinessBlockers=${m.readinessBlockers} blockers=${m.blockers.length} pass=${m.pass}`);
console.log(`${pair.id}_PAIR_READY=${output.ready}`);
if(!output.ready)process.exitCode=2;
