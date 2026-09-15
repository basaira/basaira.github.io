import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const HERO_FILES = [
  'hero-typeset-v2.css',
  'hero-layout-v2.css',
  'hero-overdrive-v2.css',
  'hero-delight-v4.css',
  'hero-animate-v4.css',
  'hero-polish-v4.css',
  'hero-cta-overdrive-v1.css',
];
const LEGACY_V3 = ['hero-animate-v3.css','hero-delight-v3.css','hero-polish-v3.css'];
const PAIRS = HERO_FILES.slice(0,-1).map((first,i)=>({id:`P${i+1}`,first,second:HERO_FILES[i+1]}));
const SOURCE_EXT = new Set(['.js','.mjs','.ts','.html','.md','.txt','.yml','.yaml','.json']);

function args(){
  const out={};
  for(const a of process.argv.slice(2)){
    const m=a.match(/^--([^=]+)=(.*)$/s); if(m) out[m[1]]=m[2];
  }
  return out;
}
const opts=args();
if(!opts.source||!opts.out) throw new Error('usage: --source=... --out=...');
const source=path.resolve(opts.source), outPath=path.resolve(opts.out);
const baseSha=process.env.BASE_SHA||null;
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const normHref=h=>h.split('?')[0].replace(/^\.\//,'');

function walk(dir, predicate=()=>true){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','dist','.vite'].includes(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) out.push(...walk(p,predicate));
    else if(predicate(p)) out.push(p);
  }
  return out;
}
const rel=p=>path.relative(source,p).replaceAll(path.sep,'/');
function htmlStyles(text){
  return [...text.matchAll(/<link\s+[^>]*href=["']([^"']+\.css[^"']*)["'][^>]*rel=["']stylesheet["'][^>]*>/gi)].map(m=>({href:m[1],file:normHref(m[1]),raw:m[0],index:m.index}));
}

function contextFor(node){
  const media=[],supports=[],other=[];
  let p=node.parent;
  while(p){
    if(p.type==='atrule'){
      if(p.name==='media') media.unshift(p.params);
      else if(p.name==='supports') supports.unshift(p.params);
      else if(p.name!=='keyframes'&&p.name!=='-webkit-keyframes') other.unshift(`@${p.name} ${p.params}`.trim());
    }
    p=p.parent;
  }
  return {media,supports,other};
}
function addSpec(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function maxSpec(list){return list.reduce((m,s)=>{for(let i=0;i<3;i++){if(s[i]>m[i])return s;if(s[i]<m[i])return m;}return m;},[0,0,0]);}
function specificity(selector){
  try{
    let result=[0,0,0];
    selectorParser(root=>{
      const calcContainer=container=>{
        let s=[0,0,0];
        container.each(node=>{
          if(node.type==='id') s=addSpec(s,[1,0,0]);
          else if(node.type==='class'||node.type==='attribute') s=addSpec(s,[0,1,0]);
          else if(node.type==='tag') s=addSpec(s,[0,0,1]);
          else if(node.type==='pseudo'){
            const v=node.value||'';
            if(v.startsWith('::')) s=addSpec(s,[0,0,1]);
            else if(v===':where') { }
            else if([':is',':not',':has'].includes(v)){
              const nested=(node.nodes||[]).filter(n=>n.type==='selector').map(calcContainer);
              s=addSpec(s,maxSpec(nested));
            } else {
              s=addSpec(s,[0,1,0]);
              if([':nth-child',':nth-last-child'].includes(v) && node.nodes?.length){
                const nested=node.nodes.filter(n=>n.type==='selector').map(calcContainer);
                s=addSpec(s,maxSpec(nested));
              }
            }
          }
        });
        return s;
      };
      const sels=root.nodes.filter(n=>n.type==='selector').map(calcContainer);
      result=maxSpec(sels);
    }).processSync(selector);
    return result;
  }catch{return null;}
}
function selectorMeta(selector){
  const pseudos=[...selector.matchAll(/::?[\w-]+/g)].map(m=>m[0]);
  return {selector,specificity:specificity(selector),pseudoClasses:pseudos.filter(x=>!x.startsWith('::')),pseudoElements:pseudos.filter(x=>x.startsWith('::'))};
}
function analyzeCss(file){
  const p=path.join(source,file); const buf=fs.readFileSync(p); const text=buf.toString('utf8'); const root=postcss.parse(text,{from:file});
  const rules=[]; const customDeclarations=[]; const customConsumers=[]; const imports=[]; const keyframes=[]; const media=[]; const supports=[]; const animations=[]; const transitions=[];
  let declarationCount=0;
  root.walkAtRules(at=>{
    if(at.name==='import') imports.push({params:at.params,line:at.source?.start?.line||null});
    if(at.name==='media') media.push({params:at.params,line:at.source?.start?.line||null});
    if(at.name==='supports') supports.push({params:at.params,line:at.source?.start?.line||null});
    if(['keyframes','-webkit-keyframes'].includes(at.name)) keyframes.push({name:at.params,line:at.source?.start?.line||null});
  });
  root.walkRules(rule=>{
    const ctx=contextFor(rule); const selectors=(rule.selectors||[rule.selector]).map(s=>s.trim());
    const declarations=[];
    rule.each(n=>{
      if(n.type!=='decl')return; declarationCount++;
      const d={property:n.prop,value:n.value,important:Boolean(n.important),line:n.source?.start?.line||null}; declarations.push(d);
      if(n.prop.startsWith('--')) customDeclarations.push({...d,selectors,context:ctx});
      for(const m of n.value.matchAll(/var\(\s*(--[\w-]+)/g)) customConsumers.push({name:m[1],property:n.prop,value:n.value,selectors,context:ctx,line:d.line});
      if(n.prop==='animation'||n.prop==='animation-name') animations.push({...d,selectors,context:ctx});
      if(n.prop==='transition'||n.prop==='transition-property') transitions.push({...d,selectors,context:ctx});
    });
    rules.push({selector:rule.selector,selectors:selectors.map(selectorMeta),context:ctx,declarations,line:rule.source?.start?.line||null});
  });
  return {file,sha256:sha256(buf),bytes:buf.length,ruleCount:rules.length,declarationCount,rules,selectorSequence:rules.flatMap(r=>r.selectors),mediaSequence:media,supports,keyframes,imports,customDeclarations,customConsumers,animations,transitions};
}

const inventory=Object.fromEntries(HERO_FILES.map(f=>[f,analyzeCss(f)]));
const allHtml=walk(source,p=>path.extname(p)==='.html').map(p=>({path:rel(p),text:fs.readFileSync(p,'utf8')}));
const routes=allHtml.map(x=>({path:x.path,styles:htmlStyles(x.text)}));
const reachability={};
for(const file of [...HERO_FILES,...LEGACY_V3]) reachability[file]=routes.filter(r=>r.styles.some(s=>s.file===file)).map(r=>r.path);
const indexRoute=routes.find(r=>r.path==='index.html'); if(!indexRoute) throw new Error('index.html missing');
const order=indexRoute.styles.map(s=>s.file); const heroPositions=HERO_FILES.map(f=>order.indexOf(f));
const heroFound=heroPositions.every(i=>i>=0); const heroExactOrder=heroFound&&heroPositions.every((v,i,a)=>i===0||v>a[i-1]);
const heroAdjacent=heroFound&&heroPositions.every((v,i,a)=>i===0||v===a[i-1]+1);
const terminal=order.at(-1)||null;
const firstPos=Math.min(...heroPositions), lastPos=Math.max(...heroPositions);
const surrounding={before:order.slice(Math.max(0,firstPos-4),firstPos),after:order.slice(lastPos+1,Math.min(order.length,lastPos+6)),terminal};

const textFiles=walk(source,p=>SOURCE_EXT.has(path.extname(p)) && fs.statSync(p).size<2_000_000);
const filenameRefs={};
for(const target of HERO_FILES){
  const hits=[];
  for(const p of textFiles){
    const txt=fs.readFileSync(p,'utf8'); if(!txt.includes(target)) continue;
    const lines=txt.split('\n');
    lines.forEach((line,i)=>{if(line.includes(target)){
      const rp=rel(p), ext=path.extname(p); let category='docs/comments';
      if(ext==='.html') category=rp==='index.html'?'production-markup':'other-html';
      else if(['.js','.ts'].includes(ext)) category='production-runtime-source';
      else if(ext==='.mjs') category=/check|test/i.test(rp)?'checker/test':'tooling';
      else if(['.yml','.yaml'].includes(ext)) category='workflow';
      hits.push({path:rp,line:i+1,category,text:line.trim().slice(0,500)});
    }});
  }
  filenameRefs[target]=hits;
}
const cssomPatterns=[/document\.styleSheets/g,/ownerNode\.href/g,/\.cssRules\b/g,/insertRule\s*\(/g,/deleteRule\s*\(/g,/createElement\(['"]link['"]\)/g,/rel\s*=\s*['"]stylesheet['"]/g];
const cssomRefs=[];
for(const p of textFiles.filter(p=>['.js','.ts','.html'].includes(path.extname(p)))){
  const txt=fs.readFileSync(p,'utf8'); const lines=txt.split('\n');
  lines.forEach((line,i)=>{if(cssomPatterns.some(r=>{r.lastIndex=0;return r.test(line)})) cssomRefs.push({path:rel(p),line:i+1,text:line.trim().slice(0,500)});});
}
const heroJsCoupling=[];
for(const p of textFiles.filter(p=>path.extname(p)==='.js')){
  const txt=fs.readFileSync(p,'utf8'); const lines=txt.split('\n');
  lines.forEach((line,i)=>{
    if(/hero-|motion-entered|motion-prep|--hero-|#home/.test(line)) heroJsCoupling.push({path:rel(p),line:i+1,text:line.trim().slice(0,500)});
  });
}

function perSelector(fileInv){
  const m=new Map();
  for(const r of fileInv.rules){
    for(const sm of r.selectors){
      if(!m.has(sm.selector))m.set(sm.selector,[]);
      const props=Object.fromEntries(r.declarations.map(d=>[d.property,d]));
      m.get(sm.selector).push({specificity:sm.specificity,context:r.context,props,line:r.line});
    }
  }
  return m;
}
function pairAnalysis(pair){
  const a=inventory[pair.first],b=inventory[pair.second],am=perSelector(a),bm=perSelector(b); const selectorOverlaps=[],propertyCollisions=[],stateCollisions=[],mediaCollisions=[],importantInteractions=[],customPropertyOverrides=[];
  for(const [sel,ars] of am){
    const brs=bm.get(sel); if(!brs) continue; selectorOverlaps.push(sel);
    for(const ar of ars) for(const br of brs){
      for(const [prop,ad] of Object.entries(ar.props)){
        const bd=br.props[prop]; if(!bd)continue;
        const rec={selector:sel,property:prop,first:{value:ad.value,important:ad.important,line:ad.line,context:ar.context},second:{value:bd.value,important:bd.important,line:bd.line,context:br.context},specificity:ar.specificity,equalSpecificity:JSON.stringify(ar.specificity)===JSON.stringify(br.specificity)};
        propertyCollisions.push(rec);
        if(/:(hover|active|focus|focus-visible|focus-within|disabled|checked|visited|target|is\(|not\(|has\()/.test(sel)) stateCollisions.push(rec);
        if(ar.context.media.length||br.context.media.length) mediaCollisions.push(rec);
        if(ad.important||bd.important) importantInteractions.push(rec);
        if(prop.startsWith('--')) customPropertyOverrides.push(rec);
      }
    }
  }
  const kA=new Set(a.keyframes.map(k=>k.name)),kB=new Set(b.keyframes.map(k=>k.name));
  const keyframeOverlap=[...kA].filter(x=>kB.has(x));
  const runtimeFilenameHits=[...filenameRefs[pair.first],...filenameRefs[pair.second]].filter(h=>h.category==='production-runtime-source');
  return {...pair,adjacent:order.indexOf(pair.second)===order.indexOf(pair.first)+1,selectorOverlaps,propertyCollisions,stateCollisions,mediaCollisions,importantInteractions,customPropertyOverrides,keyframeOverlap,runtimeFilenameHits};
}
const pairs=PAIRS.map(pairAnalysis);

const heroCustom={};
for(const [file,inv] of Object.entries(inventory)){
  for(const d of inv.customDeclarations){
    const name=d.property; (heroCustom[name]??={owners:[],consumers:[],jsMutations:[]}).owners.push({file,selectors:d.selectors,context:d.context,value:d.value,line:d.line,important:d.important});
  }
  for(const c of inv.customConsumers){(heroCustom[c.name]??={owners:[],consumers:[],jsMutations:[]}).consumers.push({file,...c});}
}
for(const [name,rec] of Object.entries(heroCustom)){
  const needle=`'${name}'`, needle2=`\"${name}\"`;
  for(const h of heroJsCoupling) if(h.text.includes(needle)||h.text.includes(needle2)||h.text.includes(name)) rec.jsMutations.push(h);
}

const checkerRefs={};
for(const f of HERO_FILES) checkerRefs[f]=filenameRefs[f].filter(h=>h.category==='checker/test');
const v3Unreachable=LEGACY_V3.every(f=>reachability[f].length===0);
const forcedColorsUsed=HERO_FILES.some(f=>fs.readFileSync(path.join(source,f),'utf8').includes('forced-colors'));
const output={
  schema:'phase-3b-5c-static-v1',generatedAt:new Date().toISOString(),baseSha,
  cluster:{files:HERO_FILES,found:heroFound,exactOrder:heroExactOrder,adjacent:heroAdjacent,positions:heroPositions,productionOrder:order,reachability:Object.fromEntries(HERO_FILES.map(f=>[f,reachability[f]])),surrounding,imports:Object.fromEntries(HERO_FILES.map(f=>[f,inventory[f].imports])),legacyV3Reachability:Object.fromEntries(LEGACY_V3.map(f=>[f,reachability[f]])),v3Unreachable,terminalProtected:terminal==='track-buttons-v6.css'},
  inventory,filenameRefs,checkerRefs,cssomRefs,heroJsCoupling,heroCustomProperties:heroCustom,pairs,forcedColorsUsed,
};
fs.mkdirSync(path.dirname(outPath),{recursive:true}); fs.writeFileSync(outPath,JSON.stringify(output,null,2));
if(!heroFound||!heroExactOrder||!heroAdjacent) throw new Error('Hero cluster reachability/order/adjacency failed');
if(!v3Unreachable) throw new Error('Legacy v3 unexpectedly production reachable');
if(terminal!=='track-buttons-v6.css') throw new Error(`Protected terminal stylesheet changed: ${terminal}`);
console.log(`HERO_STATIC_PASS files=${HERO_FILES.length} pairs=${pairs.length} productionCssOrder=${heroPositions.join(',')}`);
for(const f of HERO_FILES){const x=inventory[f];console.log(`FILE ${f} sha256=${x.sha256} bytes=${x.bytes} rules=${x.ruleCount} declarations=${x.declarationCount} keyframes=${x.keyframes.length} media=${x.mediaSequence.length} supports=${x.supports.length}`)}
for(const p of pairs) console.log(`PAIR ${p.id} overlaps=${p.selectorOverlaps.length} propertyCollisions=${p.propertyCollisions.length} state=${p.stateCollisions.length} media=${p.mediaCollisions.length} runtimeFilenameHits=${p.runtimeFilenameHits.length}`);
