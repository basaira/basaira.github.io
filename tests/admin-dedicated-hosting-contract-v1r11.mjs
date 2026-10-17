// V1R11: read-only static verifier of generated disposable Hosting candidate.
// This file never imports firebase-tools or executes deploy commands.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'basair-v1r11-candidate');
const read=f=>fs.readFileSync(path.join(root,f));
const sha=f=>crypto.createHash('sha256').update(read(f)).digest('hex');
const config=JSON.parse(read('firebase.json').toString());
const rc=JSON.parse(read('.firebaserc').toString());
const m=JSON.parse(read('manifest.json').toString());
const s=JSON.parse(fs.readFileSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r11-candidate-summary.json'),'utf8'));
assert.deepEqual(Object.keys(config),['hosting'],'additional Firebase resources in config');
assert.deepEqual(Object.keys(rc.targets),['basair-academy-4a1d0']);
assert.deepEqual(Object.keys(rc.targets['basair-academy-4a1d0'].hosting),['admin-v1r11-only']);
assert.deepEqual(rc.targets['basair-academy-4a1d0'].hosting['admin-v1r11-only'],['basair-admin']);
assert.equal(config.hosting.target,'admin-v1r11-only');
assert.equal(config.hosting.public,'admin-only');
assert.ok(!('site' in config.hosting),'must use explicit target mapping');
assert.ok(!('rewrites' in config.hosting),'no unexpected HTML alias');
assert.ok(!('redirects' in config.hosting),'no unexpected HTML redirect');
const all=config.hosting.headers.find(x=>x.source==='**');
assert.ok(all,'missing global protection of served static paths');
assert.equal(all.headers.find(x=>x.key==='Content-Security-Policy')?.value,"frame-ancestors 'none'");
assert.equal(all.headers.find(x=>x.key==='X-Frame-Options')?.value,'DENY');
assert.equal(config.hosting.headers.find(x=>x.source==='/admin.html')?.headers.find(x=>x.key==='Cache-Control')?.value,'no-store, max-age=0');
assert.deepEqual(m.hosting.siteId,'basair-admin');
assert.deepEqual(m.hosting.projectId,'basair-academy-4a1d0');
assert.equal(m.hosting.siteType,'USER_SITE_OWNER_VERIFIED');
assert.equal(m.hosting.defaultSiteId,'basair-academy-4a1d0');
assert.equal(m.hosting.productionHostingReadbackVerified,false);
assert.equal(m.hosting.productionAuthDomainsVerified,false);
assert.equal(sha('firebase.json'),m.hosting.configSha256);
assert.equal(sha('.firebaserc'),m.hosting.targetMapSha256);
assert.equal(sha('manifest.json'),s.manifestSha256);
assert.equal(m.assets.entries.length,5);
assert.equal(m.assets.totalBytes,484821);
for(const e of m.assets.entries){const p='admin-only/'+e.path;assert.equal(read(p).length,e.bytes);assert.equal(sha(p),e.sha256);}
assert.equal(m.assets.entries.filter(e=>e.path.endsWith('.html')).length,1);
const html=read('admin-only/admin.html').toString();
assert.ok(html.includes('http-equiv="Content-Security-Policy"'));
assert.ok(html.includes("frame-ancestors 'none'"),'original meta present and unchanged');
assert.ok(!fs.existsSync(path.join(root,'admin-only','firebase.json')));
assert.ok(!fs.existsSync(path.join(root,'admin-only','index.html')));
assert.ok(!fs.existsSync(path.join(root,'admin-only','firestore.rules')));
assert.ok(!fs.existsSync(path.join(root,'admin-only','404.html')));
assert.ok(!fs.existsSync(path.join(root,'admin-only','.firebaserc')));
const dangerous=/\b(?:firebase\s+deploy|hosting:channel:deploy|target:apply|firebase\s+init)\b/i;
assert.ok(!dangerous.test(JSON.stringify(config)),'unexpected operation text in config');
assert.match(m.allowedFutureCommandTemplate,/--only hosting:admin-v1r11-only$/);
assert.ok(!m.allowedFutureCommandTemplate.includes('firestore:rules'));
assert.ok(!m.allowedFutureCommandTemplate.includes('--only hosting '),'site scope not explicit');
assert.ok(!m.allowedFutureCommandTemplate.includes('--only hosting,'));
assert.ok(!m.allowedFutureCommandTemplate.includes('basair-academy-4a1d0.web.app'));
assert.ok(m.authorization.includes('NOT GRANTED'));
console.log('V1R11_HOSTING_CONTRACT='+JSON.stringify({result:'PASS_CONFIG_AND_SITE_ISOLATION_STATIC',
 project:m.hosting.projectId,site:m.hosting.siteId,target:m.hosting.target,
 onlyResource:Object.keys(config),matchingHttpHeaderPaths:'**',adminHtmlOnly:true,
 metadataOutsidePublic:true,sourceMetaUnchanged:true,configSha256:m.hosting.configSha256,
 manifestSha256:s.manifestSha256,defaultHostingProtected:true,firestoreRulesDeployExcluded:true}));
