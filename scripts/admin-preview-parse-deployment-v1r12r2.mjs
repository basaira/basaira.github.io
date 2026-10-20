// Parse only actual Firebase CLI --json output; never guess or synthesize a preview URL.
// Run only AFTER a separately authorized preview deployment. Sanitized evidence only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
assert.equal(process.argv.length,3,'exactly one CLI result path required');
const response=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
assert.equal(response.status,'success','Firebase CLI did not confirm successful preview deployment');
const entries=[];
function collect(value) {
  if(typeof value==='string') {
    const found=value.match(/https:\/\/[a-z0-9-]+\.web\.app\/?/g);
    if(found)for(const candidate of found)entries.push(candidate);
  }else if(Array.isArray(value)){for(const v of value)collect(v);}
  else if(value && typeof value==='object'){for(const v of Object.values(value))collect(v);}
}
collect(response.result);
const allowed=/^basair-admin--v1r12-admin-only-[a-z0-9-]+\.web\.app$/;
const urls=[...new Set(entries.map(x=>new URL(x).origin).filter(x=>allowed.test(new URL(x).hostname)))];
assert.equal(urls.length,1,'no single real Firebase-returned USER_SITE preview URL');
const origin=urls[0];
assert.ok(!origin.includes('basair-academy-4a1d0.web.app'));
assert.ok(!origin.includes('basair-admin.web.app/'));
const proof={status:'FIREBASE_CLI_REPORTED_PREVIEW_SUCCESS_REMOTE_SMOKE_PENDING',previewUrl:origin,project:'basair-academy-4a1d0',site:'basair-admin',channel:'v1r12-admin-only',expiryRequested:'1d',actualExpiryReadbackVerified:false,backendIsProduction:true,remoteChromiumResult:'NOT_YET_EXECUTED',liveSiteUnaffectedNotIndependentlyReadBack:true};
fs.writeFileSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'preview-sanitized-proof.json'),JSON.stringify(proof,null,2)+'\n');
assert.ok(process.env.GITHUB_ENV,'GitHub Actions environment file required');
fs.appendFileSync(process.env.GITHUB_ENV,'BASAIR_PREVIEW_URL='+origin+'\n');
console.log('VERIFIED_FIREBASE_PREVIEW_URL='+origin);
