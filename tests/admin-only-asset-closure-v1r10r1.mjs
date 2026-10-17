// V1R10-R1: read-only, disposable closure of the EXACT dist/admin.html build.
// Does not modify source/dist, deploy, connect to Firebase project APIs or publish assets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const frozen='e4ace99a4dfa876f9597f1cc0dbc0e0c3e7dc0a6';
const baseTree='6695ffe2a119dc99bce77575d77120aee08586df';
assert.equal(git('merge-base',frozen,'HEAD'),frozen);
assert.equal(git('rev-parse',frozen+'^{tree}'),baseTree);
const base=path.resolve('dist');
assert.ok(fs.statSync(base).isDirectory(),'frozen Vite dist is unavailable');
const out=path.resolve(process.env.BASAIR_ADMIN_ONLY_DIR || path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r10r1-admin-only'));
assert.ok(!out.startsWith(base+path.sep),'disposable output must be separate from dist');
assert.ok(!out.startsWith(process.cwd()+path.sep),'disposable output must not be in Git source checkout');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
const originalHTML=fs.readFileSync(path.join(base,'admin.html'),'utf8');
assert.match(originalHTML,/<html\b[^>]*dir="rtl"[^>]*lang="ar"/i);
const metaTag=originalHTML.match(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/i)?.[0];
assert.ok(metaTag,'built Admin CSP meta missing');
const expectedExternal=[], edges=[],visited=new Set(),pending=['admin.html'];
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=(rel)=>fs.readFileSync(path.join(base,rel));
const resolveRef=(from,raw,type)=>{
 const url=String(raw).trim().replace(/&amp;/g,'&');
 if(!url||url.startsWith('#')||/^(?:data:|blob:|mailto:|tel:)/i.test(url))return;
 if(/^(?:https?:)?\/\//i.test(url)){expectedExternal.push({from,kind:type,url});return}
 if(/^[a-z][a-z0-9+.-]*:/i.test(url))throw Error('unsupported URL scheme in '+from+': '+url);
 const p=url.split(/[?#]/)[0];
 if(!p)return;
 assert.ok(!p.startsWith('/'),'root-relative unsafe asset: '+from+' => '+url);
 const norm=path.posix.normalize(path.posix.join(path.posix.dirname(from),p));
 assert.ok(norm&&!norm.startsWith('../')&&norm!=='..'&&!path.posix.isAbsolute(norm),'escaping dependency '+from+' => '+url);
 assert.ok(fs.existsSync(path.join(base,norm)),'missing asset '+from+' => '+url+' => '+norm);
 assert.ok(fs.statSync(path.join(base,norm)).isFile(),'not a regular asset: '+norm);
 edges.push({from,to:norm,kind:type,original:url});
 if(!visited.has(norm)&&!pending.includes(norm))pending.push(norm);
};
function attribute(tag,name){for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)){if(m[1].toLowerCase()===name)return m[3]}return null}
function parseHtml(rel,source){
 for(const m of source.matchAll(/<(script|link|img|source|video|audio|iframe)\b[^>]*>/gi)){
  const tag=m[0],kind=m[1].toLowerCase();
  if(kind==='iframe')continue; // Runtime auth iframe may be external; not local file dependency.
  if(kind==='link'){
   const relation=attribute(tag,'rel')||'';
   if(!/\b(?:stylesheet|icon|modulepreload|preload|apple-touch-icon)\b/i.test(relation))continue;
   if(/\bpreconnect\b/i.test(relation))continue;
  }
  for(const key of ['src','href','poster']){
   const value=attribute(tag,key);if(value)resolveRef(rel,value,'html-'+kind+'-'+key);
  }
  const srcset=attribute(tag,'srcset');
  if(srcset)for(const item of srcset.split(',')){const first=item.trim().split(/\s+/)[0];if(first)resolveRef(rel,first,'html-srcset')}
 }
 for(const m of source.matchAll(/(?:url)\(\s*(['"]?)([^)"']+)\1\s*\)/gi))resolveRef(rel,m[2],'html-style-url');
}
function parseCss(rel,source){
 for(const m of source.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/gi))resolveRef(rel,m[1],'css-import');
 for(const m of source.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi))resolveRef(rel,m[2],'css-url');
}
function parseJs(rel,source){
 // Vite built ES module imports. Dynamic literals, modulepreload, asset new URL
 // and local string references are included conservatively (no minimality assumption).
 const patterns=[
  /(?:\bimport|\bexport)\s*(?:[^'"]{0,200}?\bfrom\s*)?['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bnew\s+URL\s*\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g,
  /['"](\.?\.?\/assets\/[^'"?#]+(?:[?#][^'"]*)?)['"]/g
 ];
 for(const [i,re] of patterns.entries())for(const m of source.matchAll(re)){
  const p=m[1];
  if(!p.startsWith('.')&&!p.startsWith('/')&&!/^https?:/.test(p))continue; // bare npm specifiers are not dist paths
  resolveRef(rel,p,'js-import-'+i);
 }
 // Catch unresolved local imports where syntax is not a literal via browser smoke/404 gate.
}
while(pending.length){
 const rel=pending.shift();
 if(visited.has(rel))continue;
 const abs=path.join(base,rel),stat=fs.lstatSync(abs);
 assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'asset symlink/non-file not permitted '+rel);
 visited.add(rel);
 const data=read(rel),ext=path.extname(rel).toLowerCase();
 if(ext==='.html')parseHtml(rel,data.toString('utf8'));
 if(ext==='.css')parseCss(rel,data.toString('utf8'));
 if(ext==='.js'||ext==='.mjs')parseJs(rel,data.toString('utf8'));
}
assert.ok(visited.has('admin.html'));
assert.ok(![...visited].some(p=>/(^|\/)(?:index\.html|firestore\.rules|firebase\.json|\.firebaserc|deploy-firestore-rules\.bat|package(?:-lock)?\.json)$/i.test(p)),'public pages or Firebase deploy files bundled');
assert.ok(![...visited].some(p=>/(^|\/)folio/i.test(p)),'Folio asset included');
for(const rel of visited){
 const target=path.join(out,rel);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.copyFileSync(path.join(base,rel),target,fs.constants.COPYFILE_EXCL);
 assert.equal(sha256(fs.readFileSync(target)),sha256(read(rel)),'asset mutated during copy: '+rel);
}
assert.equal(fs.readFileSync(path.join(out,'admin.html'),'utf8'),originalHTML,'production Admin HTML changed');
assert.ok(fs.readFileSync(path.join(out,'admin.html'),'utf8').includes(metaTag),'CSP meta unexpectedly replaced');
const paths=[...visited].sort();
const manifest=paths.map(rel=>({path:rel,bytes:fs.statSync(path.join(out,rel)).size,sha256:sha256(fs.readFileSync(path.join(out,rel)))}));
const lockfileSha256=sha256(fs.readFileSync('package-lock.json'));
assert.equal(lockfileSha256,'1a4b3f5403ceb7e516ee1c13d0a79be1ba4276784a792c17064cf7fdf424cc76','unexpected lockfile');
const fullTree=(()=>{const a=[];function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile())a.push(path.relative(out,p).split(path.sep).join('/'));else throw Error('nonfile in package: '+p)}}walk(out);return a.sort()})();
assert.deepEqual(fullTree,paths,'copied assets differ from closed dependency graph');
const allJs=paths.filter(p=>p.endsWith('.js')).map(p=>fs.readFileSync(path.join(out,p),'utf8')).join('\n');
const configOk=allJs.includes('basair-academy-4a1d0.firebaseapp.com')&&allJs.includes('basair-academy-4a1d0');
assert.ok(configOk,'frozen Firebase client configuration absent from package');
const allData=paths.filter(p=>/\.(js|css|html)$/i.test(p)).map(p=>fs.readFileSync(path.join(out,p),'utf8')).join('\n');
assert.ok(!/BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY/.test(allData),'private key material detected');
const result={
 classification:'DISPOSABLE_ADMIN_ONLY_CLOSURE',
 authority:{v1r8Head:frozen,v1r8Tree:baseTree,candidateHead:git('rev-parse','HEAD'),candidateTree:git('rev-parse','HEAD^{tree}'),node:process.version,npm:process.env.BASAIR_NPM_VERSION||null,lockfileSha256},
 count:manifest.length,bytes:manifest.reduce((n,a)=>n+a.bytes,0),
 files:manifest,graph:edges,externals:expectedExternal,protectedMetaPolicy:metaTag,
 clientConfigPreserved:configOk,noMissingAssets:true,noPublicHtml:paths.filter(p=>p.endsWith('.html')).length===1,
 noRulesOrSecrets:true,packageLocation:'RUNNER_TEMP_ONLY'
};
const reportPath=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r10r1-asset-manifest.json');
fs.writeFileSync(reportPath,JSON.stringify(result,null,2));
console.log('V1R10R1_ASSET_MANIFEST='+JSON.stringify({authority:result.authority,count:result.count,bytes:result.bytes,files:result.files,edges:edges.length,externalSources:[...new Set(expectedExternal.map(e=>{try{return new URL(e.url).hostname}catch{return e.url}}))],configPreserved:configOk,noMissingAssets:true}));
console.log('V1R10R1_DISPOSABLE_PATH='+out);
