#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const [,,cmd,...args]=process.argv;
const routes=[
  {route:'/',file:'index.html'},
  {route:'/en/',file:'en/index.html'},
  {route:'/en/quran-kids/',file:'en/quran-kids/index.html'},
  {route:'/en/quran-adults/',file:'en/quran-adults/index.html'},
  {route:'/en/arabic/',file:'en/arabic/index.html'},
  {route:'/ru/',file:'ru/index.html'},
  {route:'/ru/quran/',file:'ru/quran/index.html'},
  {route:'/ru/arabic/',file:'ru/arabic/index.html'},
  {route:'/uz/',file:'uz/index.html'},
  {route:'/uz/quran/',file:'uz/quran/index.html'},
  {route:'/uz/arabic/',file:'uz/arabic/index.html'},
  {route:'/admin.html',file:'admin.html'}
];
const specialNames=new Set(['.nojekyll','CNAME','404.html']);
const slash=p=>p.split(path.sep).join('/');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(root,dir=root){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(e.name==='.git') continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(root,full));
    else if(e.isFile()) out.push(slash(path.relative(root,full)));
  }
  return out.sort();
}
function writeJson(file,obj){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n');
}
function manifest(root){
  const files=walk(root).map(p=>{
    const b=fs.readFileSync(path.join(root,p));
    return {path:p,size:b.length,sha256:sha256(b)};
  });
  const core={files,totalFileCount:files.length,totalBytes:files.reduce((n,f)=>n+f.size,0)};
  return {...core,manifestDigest:'sha256:'+sha256(Buffer.from(JSON.stringify(files)))};
}
function mapFiles(m){return new Map(m.files.map(f=>[f.path,f]));}
function compare(a,b){
  const A=mapFiles(a),B=mapFiles(b);
  const paths=[...new Set([...A.keys(),...B.keys()])].sort();
  const onlyInA=[],onlyInB=[],byteDifferent=[],identical=[];
  for(const p of paths){
    const x=A.get(p),y=B.get(p);
    if(x&&!y) onlyInA.push(p);
    else if(!x&&y) onlyInB.push(p);
    else if(x.sha256!==y.sha256||x.size!==y.size) byteDifferent.push({path:p,a:x,b:y});
    else identical.push(p);
  }
  return {exactMatch:onlyInA.length===0&&onlyInB.length===0&&byteDifferent.length===0,onlyInA,onlyInB,byteDifferent,identical,identicalCount:identical.length};
}
function resolveLocal(root,fromFile,url){
  let u=url.trim();
  if(!u||u.startsWith('#')||/^(?:[a-z]+:)?\/\//i.test(u)||/^(?:data|mailto|tel|javascript|blob):/i.test(u)) return {external:true};
  u=u.split('#')[0].split('?')[0];
  if(!u) return {external:true};
  const forbidden=u.startsWith('/basaira.github.io/');
  let rel=u.startsWith('/')?u.slice(1):slash(path.posix.normalize(path.posix.join(path.posix.dirname(fromFile),u)));
  rel=rel.replace(/^\.\//,'');
  const candidates=[rel];
  if(rel.endsWith('/')) candidates.push(rel+'index.html');
  else if(!path.posix.extname(rel)) candidates.push(rel+'/index.html');
  const found=candidates.find(c=>fs.existsSync(path.join(root,c))&&fs.statSync(path.join(root,c)).isFile());
  return {external:false,forbidden,raw:url,resolved:found||rel,exists:!!found};
}
function auditRefs(root){
  const files=walk(root);
  const checks=[],forbiddenRepoSubdir=[],missing=[];
  const add=(from,url,kind)=>{
    const r=resolveLocal(root,from,url);
    if(r.external) return;
    const row={from,url,kind,resolved:r.resolved,exists:r.exists,forbiddenRepoSubdir:r.forbidden};
    checks.push(row);
    if(r.forbidden) forbiddenRepoSubdir.push(row);
    if(!r.exists) missing.push(row);
  };
  for(const f of files){
    const full=path.join(root,f);
    const ext=path.extname(f).toLowerCase();
    if(!['.html','.css','.js'].includes(ext)) continue;
    const s=fs.readFileSync(full,'utf8');
    if(s.includes('/basaira.github.io/')) forbiddenRepoSubdir.push({from:f,url:'/basaira.github.io/',kind:'raw-string'});
    if(ext==='.html'){
      for(const m of s.matchAll(/\b(?:src|href)\s*=\s*["']([^"'<>]+)["']/gi)) add(f,m[1],'html-attribute');
    }
    if(ext==='.css'){
      for(const m of s.matchAll(/url\(\s*["']?([^"'()]+)["']?\s*\)/gi)) add(f,m[1],'css-url');
    }
    if(ext==='.js'){
      for(const m of s.matchAll(/(?:import\s*\(|\bfrom\s*)["']([^"']+)["']/g)) add(f,m[1],'js-import');
    }
  }
  return {pass:missing.length===0&&forbiddenRepoSubdir.length===0,checkedLocalReferences:checks.length,missing,forbiddenRepoSubdir,checks};
}
async function staticSmoke(base){
  const results=[];
  for(const r of routes){
    const url=new URL(r.route,base).href;
    try{
      const res=await fetch(url,{redirect:'manual'});
      const body=await res.arrayBuffer();
      results.push({route:r.route,url,status:res.status,ok:res.status>=200&&res.status<300,bytes:body.byteLength,contentType:res.headers.get('content-type')||''});
    }catch(e){results.push({route:r.route,url,status:null,ok:false,error:String(e)});}
  }
  return {pass:results.every(x=>x.ok),results};
}
if(cmd==='manifest'){
  const [root,out]=args; writeJson(out,manifest(root));
}else if(cmd==='compare'){
  const [a,b,out]=args; writeJson(out,compare(JSON.parse(fs.readFileSync(a)),JSON.parse(fs.readFileSync(b))));
}else if(cmd==='classify-gh'){
  const [hist,gh,out]=args;
  const H=mapFiles(JSON.parse(fs.readFileSync(hist))),G=JSON.parse(fs.readFileSync(gh));
  const rows=G.files.map(f=>{
    let classification,reason;
    const h=H.get(f.path);
    if(h&&h.sha256===f.sha256&&h.size===f.size){classification='A';reason='identical historical generated build output';}
    else if(specialNames.has(f.path)){classification='B';reason='Pages-specific root metadata';}
    else if(h){classification='D';reason='path existed in historical dist but bytes differ';}
    else {classification='E';reason='not reproduced by historical dist and not recognized Pages metadata';}
    return {...f,classification,reason};
  });
  const counts=Object.fromEntries(['A','B','C','D','E'].map(k=>[k,rows.filter(x=>x.classification===k).length]));
  writeJson(out,{rows,counts,unknown:rows.filter(x=>x.classification==='E').map(x=>x.path),stale:rows.filter(x=>x.classification==='D').map(x=>x.path)});
}else if(cmd==='delta'){
  const [oldf,newf,out]=args;
  const oldM=JSON.parse(fs.readFileSync(oldf)),newM=JSON.parse(fs.readFileSync(newf));
  const O=mapFiles(oldM),N=mapFiles(newM),paths=[...new Set([...O.keys(),...N.keys()])].sort();
  const rows=[]; const counts={ADD:0,MODIFY:0,DELETE:0,PRESERVE:0};
  for(const p of paths){
    const o=O.get(p),n=N.get(p); let action;
    if(!o&&n) action='ADD'; else if(o&&!n) action='DELETE'; else if(o.sha256===n.sha256&&o.size===n.size) action='PRESERVE'; else action='MODIFY';
    counts[action]++; rows.push({path:p,action,old:o||null,new:n||null,hashedAsset:/^assets\/.*-[A-Za-z0-9_-]{6,}\.[^.]+$/.test(p),specialMetadata:specialNames.has(p)});
  }
  writeJson(out,{counts,rows,deletedHistorical:rows.filter(x=>x.action==='DELETE').map(x=>x.path),renamedHashedAssets:{added:rows.filter(x=>x.action==='ADD'&&x.hashedAsset).map(x=>x.path),deleted:rows.filter(x=>x.action==='DELETE'&&x.hashedAsset).map(x=>x.path)},metadataDeletes:rows.filter(x=>x.action==='DELETE'&&x.specialMetadata).map(x=>x.path)});
}else if(cmd==='root-audit'){
  const [root,out]=args; writeJson(out,auditRefs(root));
}else if(cmd==='routes'){
  const [root,out]=args;
  const entries=routes.map(r=>({...r,exists:fs.existsSync(path.join(root,r.file)),size:fs.existsSync(path.join(root,r.file))?fs.statSync(path.join(root,r.file)).size:null}));
  writeJson(out,{pass:entries.every(x=>x.exists),entries});
}else if(cmd==='static-smoke'){
  const [base,out]=args; writeJson(out,await staticSmoke(base));
}else if(cmd==='history'){
  const [repoDir,out]=args;
  const raw=execFileSync('git',['-C',repoDir,'log','-n','20','--pretty=format:%H%x09%P%x09%s'],{encoding:'utf8'}).trim();
  const commits=raw?raw.split('\n').map(line=>{const [sha,parents,...msg]=line.split('\t');return {sha,parents:parents?parents.split(' ').filter(Boolean):[],message:msg.join('\t')};}):[];
  const orphanCommits=commits.filter(c=>c.parents.length===0).map(c=>c.sha);
  writeJson(out,{commits,orphanCommits,model:orphanCommits.length?'orphan base followed by normal parented deployment commits':'normal parented history'});
}else{
  console.error('Unknown command',cmd);
  process.exit(2);
}
