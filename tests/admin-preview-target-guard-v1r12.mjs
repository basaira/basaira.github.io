// V1R12: fail-closed PREVIEW CHANNEL plan. Never executes Firebase CLI or network actions.
// SOURCE: V1R11 locked Admin-only candidate. Do not put deploy commands in auto-run CI.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const frozen='3ec08740edd956351a091924d35254b6c24d09d4';
const tree='4d12ba83c40eeb5166f66dd21e89d09d42caa04e';
const temp=process.env.RUNNER_TEMP||os.tmpdir();
const root=path.join(temp,'basair-v1r11-candidate');
const read=(n)=>fs.readFileSync(path.join(root,n));
assert.equal(git('merge-base',frozen,'HEAD'),frozen);
assert.equal(git('rev-parse',frozen+'^{tree}'),tree);
const config=JSON.parse(read('firebase.json'));
const rc=JSON.parse(read('.firebaserc'));
const manifest=JSON.parse(read('manifest.json'));
assert.deepEqual(Object.keys(config),['hosting']);
assert.equal(config.hosting.target,'admin-v1r11-only');
assert.equal(config.hosting.public,'admin-only');
assert.ok(!('rewrites' in config.hosting));
assert.ok(!('redirects' in config.hosting));
assert.deepEqual(rc.projects,{default:'basair-academy-4a1d0'});
assert.deepEqual(rc.targets?.['basair-academy-4a1d0']?.hosting,{'admin-v1r11-only':['basair-admin']});
assert.equal(manifest.hosting.siteId,'basair-admin');
assert.equal(manifest.hosting.projectId,'basair-academy-4a1d0');
assert.equal(manifest.hosting.defaultSiteId,'basair-academy-4a1d0');
assert.equal(manifest.assets.count,5);
assert.equal(manifest.assets.totalBytes,484821);
const css=manifest.assets.entries.filter(e=>e.path.endsWith('.css'));
const js=manifest.assets.entries.filter(e=>e.path.endsWith('.js'));
assert.equal(css.length,2);assert.equal(js.length,2);
assert.equal(manifest.assets.entries.filter(e=>e.path.endsWith('.html')).length,1);
for(const item of manifest.assets.entries){
 assert.ok(!item.path.includes('..')&&!item.path.startsWith('/'));
 const buf=read('admin-only/'+item.path);
 assert.equal(buf.length,item.bytes);
 assert.equal(sha256(buf),item.sha256);
}
assert.equal(manifest.hosting.configSha256,sha256(read('firebase.json')));
assert.equal(manifest.hosting.targetMapSha256,sha256(read('.firebaserc')));
assert.equal(manifest.toolchain.lockSha256,'1a4b3f5403ceb7e516ee1c13d0a79be1ba4276784a792c17064cf7fdf424cc76');
assert.ok(config.hosting.headers.some(x=>x.source==='**'&&
 x.headers.some(h=>h.key==='Content-Security-Policy'&&h.value==="frame-ancestors 'none'")&&
 x.headers.some(h=>h.key==='X-Frame-Options'&&h.value==='DENY')));
const forbidden=/(^|\/)(?:firestore\.rules|firebase\.json|\.firebaserc|\.env(?:\..*)?|index\.html|404\.html|package(?:-lock)?\.json)$/i;
assert.ok(manifest.assets.entries.every(x=>!forbidden.test(x.path)));
assert.ok(!fs.existsSync(path.join(root,'admin-only','firestore.rules')));
assert.ok(!fs.existsSync(path.join(root,'admin-only','firebase.json')));
const channel='v1r12-admin-only';
const args=['hosting:channel:deploy',channel,'--only','admin-v1r11-only','--project','basair-academy-4a1d0','--config','firebase.json','--expires','1d'];
assert.equal(args[0],'hosting:channel:deploy');
assert.equal(args[args.indexOf('--only')+1],'admin-v1r11-only'); // NOT hosting:admin-v1r11-only !
assert.ok(!args.includes('hosting:admin-v1r11-only'));
assert.ok(!args.some(x=>x==='deploy'||x==='firebase deploy'||x==='hosting'||x==='firestore:rules'));
const evidence={
 status:'PREVIEW_DEPLOY_INTENT_VALIDATED_NOT_EXECUTED',
 frozenV1R11:{head:frozen,tree},
 currentCandidate:{head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}')},
 site:{project:'basair-academy-4a1d0',id:'basair-admin',type:'USER_SITE_OWNER_VERIFIED',
   defaultSite:'basair-academy-4a1d0',defaultSiteProtected:true,sparkPlanOwnerConfirmed:true},
 deployment:{channel,target:'admin-v1r11-only',arguments:args,expires:'1d',workingDirectory:'DISPOSABLE_V1R11_CANDIDATE_DIR',
   previewOnly:true,actuallyExecuted:false,requiresAuthorizedOperator:true,
   realBackendWarning:'Preview URLs use the real Firebase project backend. Do not sign in or perform production Firestore reads or writes.',
   authorizedDomainsPreviewURLUnknown:true},
 build:{assets:manifest.assets.entries,lockSha256:manifest.toolchain.lockSha256,
   configSha256:manifest.hosting.configSha256,targetMapSha256:manifest.hosting.targetMapSha256,
   manifestSha256:sha256(read('manifest.json'))},
 noFirestoreRulesDeploy:true,noLiveHostingDeploy:true,noDnsOrAuthChanges:true,noBillingChange:true,
 authGate:'Preview domain has not been verified among Firebase Authentication Authorized Domains. Unauthenticated smoke only.',
 previewPublished:false
};
const file=path.join(temp,'v1r12-preview-preflight.json');
fs.writeFileSync(file,JSON.stringify(evidence,null,2)+'\n');
console.log('V1R12_PREVIEW_GUARD='+JSON.stringify({status:evidence.status,site:evidence.site.id,
 target:evidence.deployment.target,channel,onlyArg:args[args.indexOf('--only')+1],expires:'1d',
 artifactHashes:evidence.build.assets.length,executed:false,
 project:evidence.site.project,manifestSha256:evidence.build.manifestSha256}));
