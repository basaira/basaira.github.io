// BASAIR V1R8: NON-MUTATING Pages-only release simulation and built asset integrity.
// Does not deploy, write to GitHub Pages, or interact with Firebase services.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root=process.cwd(),dist=path.resolve('dist');
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const base='9cc2439970459bd8d4ed5c57b05dbf91cd1ea3ba',expectedTree='02c16252787467e8b5a142bc212a10d96e603524';
assert.equal(git('merge-base',base,'HEAD'),base,'source ancestor drift');
assert.equal(git('rev-parse',base+'^{tree}'),expectedTree,'source tree drift');
assert.equal(git('rev-parse','cef59ba05b3382978b4c18e83592f08227b2f9c4^{commit}'),'cef59ba05b3382978b4c18e83592f08227b2f9c4','published authority drift');
const files=[];
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory())walk(p);else if(e.isFile())files.push(path.relative(dist,p).replaceAll(path.sep,'/'));
  else throw Error('unsafe snapshot symlink or special file: '+p);
 }
}
walk(dist);files.sort();
assert.ok(files.includes('admin.html'),'no compiled Admin entrypoint');
const required=['index.html','en/index.html','en/arabic/index.html','en/quran-kids/index.html','en/quran-adults/index.html','ru/index.html','ru/arabic/index.html','ru/quran/index.html','uz/index.html','uz/arabic/index.html','uz/quran/index.html'];
for(const p of required)assert.ok(files.includes(p),'missing expected built HTML '+p);
assert.ok(files.every(f=>!/^(firestore\.rules|firebase\.json|\.firebaserc|deploy-firestore-rules\.bat|package(?:-lock)?\.json)$/i.test(f)),'release snapshot contains Firebase Rules or source');
assert.ok(files.every(f=>!/(^|\/)folio/i.test(f)),'obsolete Folio in generated snapshot');
const all=new Set(files);
const references=[];
for(const f of files){
 if(!/\.(html|css)$/i.test(f))continue;
 const c=fs.readFileSync(path.join(dist,f),'utf8');
 const refs=[];
 if(f.endsWith('.html')){
  for(const m of c.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="([^"]+)"/gi))refs.push(m[1]);
 }
 if(f.endsWith('.css')){
  for(const m of c.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi))refs.push(m[2]);
 }
 for(const raw of refs){
  if(/^(?:data:|https?:|\/\/|#|mailto:|tel:|javascript:)/i.test(raw))continue;
  const clean=raw.split(/[?#]/)[0];
  if(!clean)continue;
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(f),clean));
  // One root-relative deployment would need a separate review; Vite base is relative.
  assert.ok(!clean.startsWith('/'),'root-relative reference in client snapshot: '+f+' -> '+raw);
  assert.ok(!resolved.startsWith('../'),'asset escapes snapshot: '+f+' -> '+raw);
  assert.ok(all.has(resolved),'broken built reference: '+f+' -> '+raw+' -> '+resolved);
  references.push({from:f,to:resolved});
 }
}
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
const firebaseJson=JSON.parse(fs.readFileSync('firebase.json','utf8'));
const vite=fs.readFileSync('vite.config.ts','utf8');
const scripts=packageJson.scripts||{};
assert.equal(scripts.build,'vite build');
assert.ok(/base:\s*['"]\.\//.test(vite),'relative Pages asset base not proven');
assert.ok(/firestore\.rules/.test(JSON.stringify(firebaseJson)),'Firestore rule config not present for separate isolation');
assert.ok(/firebase-tools.*deploy --only firestore:rules/.test(scripts['deploy:firestore-rules']||''),'explicit dangerous script detection changed');
assert.ok(/firebase-tools.*deploy --only firestore:rules/.test(fs.readFileSync('deploy-firestore-rules.bat','utf8')),'explicit batch deploy path detection changed');
const workflowPaths=git('ls-tree','-r','--name-only','HEAD','.github/workflows').split('\n').filter(Boolean);
const workflowContent=workflowPaths.map(p=>({path:p,content:fs.readFileSync(p,'utf8')}));
const deployWorkflows=workflowContent.filter(x=>/(^|\n)\s*(?:run:|-\s*)[\s\S]*?firebase(?:-tools)?(?:@[\d.]+)?\s+deploy\b/.test(x.content)||/\bfirebase deploy\b/.test(x.content));
const snapshot=files.map(p=>{
 const v=fs.readFileSync(path.join(dist,p));
 return{path:p,bytes:v.length,sha256:sha256(v)};
});
const source=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
const lockSha=sha256(fs.readFileSync('package-lock.json'));
const oldFiles=git('ls-tree','-r','--name-only','cef59ba05b3382978b4c18e83592f08227b2f9c4').split('\n').filter(Boolean);
const oldAbsent=oldFiles.filter(v=>!all.has(v));
const newOnly=files.filter(v=>!oldFiles.includes(v));
// Non-mutating simulation of a clean Pages snapshot: only dist/ is copied to temp,
// no legacy gh-pages files can survive; no GitHub or Firebase publishing involved.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'basair-v1r8-snapshot-'));
try{
 fs.cpSync(dist,temp,{recursive:true,force:false});
 const copied=[];
 (function crawl(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
   const p=path.join(d,e.name);
   if(e.isDirectory())crawl(p);
   else copied.push({path:path.relative(temp,p).replaceAll(path.sep,'/'),sha256:sha256(fs.readFileSync(p))});
  }
 })(temp);
 assert.deepEqual(copied.sort((a,b)=>a.path.localeCompare(b.path)),snapshot.map(v=>({path:v.path,sha256:v.sha256})).sort((a,b)=>a.path.localeCompare(b.path)),'non-mutating snapshot copy mismatch');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
const html=fs.readFileSync('dist/admin.html','utf8');
const entryScripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].map(m=>m[1]);
const css=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*\bhref="([^"]+)"/gi)].map(m=>m[1]);
const csp=[...html.matchAll(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi)].map(m=>m[0]);
const allBuiltJs=files.filter(x=>x.endsWith('.js')).map(x=>fs.readFileSync(path.join(dist,x),'utf8')).join('\n');
const report={
 result:'PASS_STATIC_CLIENT_ONLY_BOUNDARY',
 sourceHead:source,sourceTree:tree,baseHead:base,lockfileSha256:lockSha,
 buildEntrypoints:required.concat('admin.html'),
 admin:{bytes:fs.statSync('dist/admin.html').size,entryScripts,css,csp},
 snapshot:{files:snapshot,totalFiles:files.length,linkedAssets:references.length,deletedOldFiles:oldAbsent,newFiles:newOnly,priorPagesHead:'cef59ba05b3382978b4c18e83592f08227b2f9c4'},
 firestoreSeparation:{configPath:firebaseJson.firestore.rules,explicitNpmDeployCommand:scripts['deploy:firestore-rules'],
  batchScript:'deploy-firestore-rules.bat',workflowsMentioningDeploy:deployWorkflows.map(x=>x.path),
  snapshotContainsRules:false,simulation:'local copy of dist only; zero Firebase/Pages commands'},
 serviceWorkerStringsInBuiltJs:/serviceWorker\.register\s*\(/.test(allBuiltJs),
 rollback:'Needs new immutable snapshot manifest, fixed prior Pages SHA and independent approval; open tabs and in-flight requests not terminated by Pages update'
};
fs.writeFileSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r8-release-snapshot-preflight.json'),JSON.stringify(report,null,2));
console.log('V1R8_RELEASE='+JSON.stringify({
 result:report.result,sourceHead:source,sourceTree:tree,lockfileSha256:lockSha,totalFiles:files.length,
 adminScripts:entryScripts,adminCss:css,assetReferencesVerified:references.length,
 oldFilesToDelete:oldAbsent.length,newFiles:newOnly.length,serviceWorkerStringsInBuiltJs:report.serviceWorkerStringsInBuiltJs,
 explicitFirebaseDeploymentPaths:['package.json scripts.deploy:firestore-rules','deploy-firestore-rules.bat'],
 workflowDeployments:report.firestoreSeparation.workflowsMentioningDeploy
}));
