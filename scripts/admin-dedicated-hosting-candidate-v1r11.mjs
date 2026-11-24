// BASAIR ADMIN V1R11 — Prepare ONLY a disposable, reviewable Hosting config,
// Admin-only five-file package and immutable manifest. No Firebase CLI calls.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const base='fd76499bd70e79592a67b41d428960091043c57a';
const appSource='e4ace99a4dfa876f9597f1cc0dbc0e0c3e7dc0a6';
const appTree='6695ffe2a119dc99bce77575d77120aee08586df';
const site='basair-admin',project='basair-academy-4a1d0',target='admin-v1r11-only';
const expected=[
 ['admin.html',34577,'6545428cc7e4dd2230b976bc8f9e7f5eeef6f333910bf83d9c0c9bcadc28fa19'],
 ['assets/admin-DpsaaczE.js',406150,'47c055332a966627d31319779f9f3c58b536fd015c8975a0c4b61d5a444aea42'],
 ['assets/admin-KP_-cv_r.css',38525,'93b2e2b104d2f5916558158fb94fd9404973cd6b25b87ebf99949926d0406ee0'],
 ['assets/firebase-config-CpQW8loC.js',3422,'a0629b17ea76ba5276dec106344c94ea2834f1c99ad910cb7f544e8cab654cc5'],
 ['assets/firebase-config-cd9f7NCj.css',2147,'b55e3d5fe4fb3ef7c10043a2bae20826a000a63963f9b6e8e8f43f90f36b4594']
];
const cwd=process.cwd(),temp=process.env.RUNNER_TEMP||os.tmpdir();
const previous=path.join(temp,'v1r10r1-admin-only');
const evidence=JSON.parse(fs.readFileSync(path.join(temp,'v1r10r1-asset-manifest.json'),'utf8'));
assert.equal(git('merge-base',base,'HEAD'),base,'candidate ancestry diverged');
assert.equal(git('rev-parse',appSource+'^{tree}'),appTree);
assert.deepEqual(evidence.files.map(x=>[x.path,x.bytes,x.sha256]).sort((a,b)=>a[0].localeCompare(b[0])),expected.slice().sort((a,b)=>a[0].localeCompare(b[0])),'V1R10-R1 closure hashes mismatch');
const lockHash=sha(fs.readFileSync('package-lock.json'));
assert.equal(lockHash,'62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a');
const releaseRoot=path.join(temp,'basair-v1r11-candidate'),bundle=path.join(releaseRoot,'admin-only');
assert.ok(!releaseRoot.startsWith(cwd+path.sep),'release files must be outside checkout');
fs.rmSync(releaseRoot,{recursive:true,force:true});fs.mkdirSync(bundle,{recursive:true});
for(const [file,size,digest] of expected){
 const from=path.join(previous,file),dest=path.join(bundle,file);
 assert.ok(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());
 const data=fs.readFileSync(from);
 assert.equal(data.length,size,file+' size drift');
 assert.equal(sha(data),digest,file+' hash drift');
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data,{flag:'wx'});
 assert.equal(sha(fs.readFileSync(dest)),digest,file+' copy drift');
}
const entries=[];
function recurse(root,at){
 for(const item of fs.readdirSync(at,{withFileTypes:true})){
  const full=path.join(at,item.name);
  if(item.isDirectory())recurse(root,full);
  else{
   assert.ok(item.isFile(),'no symlinks or special files');
   const rel=path.relative(root,full).split(path.sep).join('/');
   const data=fs.readFileSync(full);
   entries.push({path:rel,bytes:data.length,sha256:sha(data)});
  }
 }
}
recurse(bundle,bundle);entries.sort((a,b)=>a.path.localeCompare(b.path));
assert.deepEqual(entries,expected.map(([p,bytes,sha256])=>({path:p,bytes,sha256})).sort((a,b)=>a.path.localeCompare(b.path)));
assert.equal(entries.filter(f=>f.path.endsWith('.html')).length,1,'unexpected second Admin entrypoint');
assert.ok(entries.some(f=>f.path==='admin.html'));
assert.ok(entries.every(f=>!/(^|\/)(?:firestore\.rules|firebase\.json|\.firebaserc|package\.json|package-lock\.json|index\.html|404\.html)$/i.test(f.path)),'project config or public page included');
assert.ok(entries.every(f=>!/(^|\/)folio/i.test(f.path)));
const html=fs.readFileSync(path.join(bundle,'admin.html'),'utf8');
assert.ok(html.includes('http-equiv="Content-Security-Policy"'));
assert.ok(html.includes("script-src 'self' https://www.gstatic.com https://apis.google.com"));
const js=entries.filter(e=>e.path.endsWith('.js')).map(e=>fs.readFileSync(path.join(bundle,e.path),'utf8')).join('\n');
assert.ok(js.includes('basair-academy-4a1d0.firebaseapp.com') && js.includes(project));
assert.ok(!/BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY/.test(js));
const config={hosting:{
 target,
 public:'admin-only',
 ignore:['firebase.json','.firebaserc','**/.*','**/node_modules/**'],
 headers:[
  {source:'**',headers:[
   {key:'Content-Security-Policy',value:"frame-ancestors 'none'"},
   {key:'X-Frame-Options',value:'DENY'}
  ]},
  {source:'/admin.html',headers:[{key:'Cache-Control',value:'no-store, max-age=0'}]}
 ]
}};
const rc={projects:{default:project},targets:{[project]:{hosting:{[target]:[site]}}}};
assert.deepEqual(Object.keys(config),['hosting']);
assert.equal(config.hosting.target,target);
assert.equal(config.hosting.public,'admin-only');
assert.deepEqual(rc.targets[project].hosting[target],[site]);
assert.equal(Object.keys(rc.targets[project].hosting).length,1);
assert.ok(!JSON.stringify(config).includes('firestore'));
assert.ok(!JSON.stringify(config).includes('basair-academy-4a1d0.web.app'));
assert.ok(!('site' in config.hosting),'target mapping is source of truth');
assert.ok(!('rewrites' in config.hosting));
assert.ok(!('redirects' in config.hosting));
const data=JSON.stringify(config,null,2)+'\n',rcData=JSON.stringify(rc,null,2)+'\n';
fs.writeFileSync(path.join(releaseRoot,'firebase.json'),data,{flag:'wx'});
fs.writeFileSync(path.join(releaseRoot,'.firebaserc'),rcData,{flag:'wx'});
const manifest={
 kind:'BASAIR_ADMIN_V1R11_IMMUTABLE_CANDIDATE_EVIDENCE',
 git:{candidateHead:git('rev-parse','HEAD'),candidateTree:git('rev-parse','HEAD^{tree}'),v1r10r1Head:base,appSourceHead:appSource,appSourceTree:appTree,
  mainFrozen:'2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243',
  ghPagesFrozen:'cef59ba05b3382978b4c18e83592f08227b2f9c4'},
 toolchain:{node:process.version,npm:process.env.BASAIR_NPM_VERSION||null,lockSha256:lockHash},
 hosting:{projectId:project,siteId:site,siteType:'USER_SITE_OWNER_VERIFIED',target,plannedUrl:'https://basair-admin.web.app',
  defaultSiteId:'basair-academy-4a1d0',defaultSiteMustRemainUnchanged:true,
  ownerConfirmedBillingPlan:'Spark',productionHostingReadbackVerified:false,productionAuthDomainsVerified:false,
  configSha256:sha(Buffer.from(data)),targetMapSha256:sha(Buffer.from(rcData)),entrypoint:'/admin.html',
  htmlResponseHeaders:["Content-Security-Policy: frame-ancestors 'none'","X-Frame-Options: DENY"],
  sourceMetaCspUnchanged:true,noRewritesOrRedirects:true,allStaticRoutesProtected:true},
 assets:{count:entries.length,totalBytes:entries.reduce((acc,x)=>acc+x.bytes,0),entries},
 buildOnly:true,noProductionDeployment:true,noFirestoreRulesInConfig:true,
 sourceChecks:{adminHtmlSha256:entries.find(x=>x.path==='admin.html').sha256,firebaseClientConfigPreserved:true},
 allowedFutureCommandTemplate:'firebase deploy --config <ISOLATED_DIR>/firebase.json --project basair-academy-4a1d0 --only hosting:admin-v1r11-only',
 authorization:'NOT GRANTED. THIS DOCUMENT IS NOT A DEPLOYMENT PERMIT.'
};
fs.writeFileSync(path.join(releaseRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const shaManifest=sha(fs.readFileSync(path.join(releaseRoot,'manifest.json')));
const confirmation={manifest,manifestSha256:shaManifest,releaseRoot,candidateFilePaths:['firebase.json','.firebaserc','manifest.json'].concat(entries.map(x=>'admin-only/'+x.path))};
fs.writeFileSync(path.join(temp,'v1r11-candidate-summary.json'),JSON.stringify(confirmation,null,2));
console.log('V1R11_CANDIDATE='+JSON.stringify({head:manifest.git.candidateHead,tree:manifest.git.candidateTree,
 site,project,target,fileCount:entries.length,bytes:manifest.assets.totalBytes,
 lockSha256:lockHash,manifestSha256:shaManifest,configSha256:manifest.hosting.configSha256,rcSha256:manifest.hosting.targetMapSha256,
 exactAssetHashes:entries,noDefaultsAffected:true,disposableOnly:true}));
