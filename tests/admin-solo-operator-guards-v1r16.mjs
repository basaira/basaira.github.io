// V1R16: positive and adversarial tests of the same gates used in manual jobs.
// No network or external credentials; mutations must be rejected, not bypassed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  sourceGate,noCloudCredentials,verifyOnlyGate,requestPreviewGate,manualWorkflowGate,
  V15_TREE,REPO,BRANCH,ADMIN_SITE,LOCK,FILES,REQUEST,ACK
} from '../scripts/admin-solo-operator-guards-v1r16.mjs';

const ok={
  repository:REPO,ref:'refs/heads/'+BRANCH,
  dispatchSha:'a'.repeat(40),head:'a'.repeat(40),reviewedHead:'a'.repeat(40),
  tree:'b'.repeat(40),reviewedTree:'b'.repeat(40),
  frozenV15Tree:V15_TREE,descendsFromV15:true,site:ADMIN_SITE,
  vite:'6.4.4',lockSha:LOCK,changedFiles:FILES
};
const rejected=[];
function deny(name,fn) { assert.throws(fn,undefined,name);rejected.push(name); }
assert.equal(sourceGate(ok),true);
for(const [name,delta] of [
  ['other-repository',{repository:'attacker/other'}],
  ['main-branch',{ref:'refs/heads/main'}],
  ['legacy-branch',{ref:'refs/heads/basair/admin-preview-integrated-candidate-v1r15'}],
  ['sha-not-matching-reviewed',{reviewedHead:'c'.repeat(40)}],
  ['sha-not-matching-dispatch',{dispatchSha:'c'.repeat(40)}],
  ['invalid-reviewed-sha',{reviewedHead:'NOT_A_SHA'}],
  ['missing-reviewed-sha',{reviewedHead:undefined}],
  ['tree-not-reviewed',{reviewedTree:'c'.repeat(40)}],
  ['missing-reviewed-tree',{reviewedTree:undefined}],
  ['frozen-base-tree-drift',{frozenV15Tree:'0'.repeat(40)}],
  ['wrong-ancestry',{descendsFromV15:false}],
  ['default-site',{site:'basair-academy-4a1d0'}],
  ['other-site',{site:'another-firebase-site'}],
  ['vulnerable-vite',{vite:'6.4.3'}],
  ['different-lock',{lockSha:'0'.repeat(64)}],
  ['unauthorized-admin-edit',{changedFiles:[...FILES,'admin.js']}],
  ['unauthorized-firestore-edit',{changedFiles:[...FILES,'firestore.rules']}],
  ['missing-expected-file',{changedFiles:FILES.slice(1)}]
])deny(name,()=>sourceGate({...ok,...delta}));
assert.equal(noCloudCredentials({FIREBASE_TOKEN:'',GOOGLE_APPLICATION_CREDENTIALS:'',WIF_PROVIDER:''}),true);
for(const key of ['FIREBASE_TOKEN','GOOGLE_APPLICATION_CREDENTIALS','GOOGLE_GHA_CREDS_PATH','WIF_PROVIDER','SERVICE_ACCOUNT']) {
  deny('credential-'+key,()=>noCloudCredentials({[key]:'not-allowed'}));
}
const verification=verifyOnlyGate({mode:'VERIFY_ONLY',independentReviewClaim:false});
assert.deepEqual(verification,{status:'VERIFY_ONLY_PASSED',cloudAuth:false,previewDeployment:false,independentReview:false});
deny('verify-is-not-deploy',()=>verifyOnlyGate({mode:'REQUEST_PREVIEW',independentReviewClaim:false}));
deny('verify-is-not-independent-review',()=>verifyOnlyGate({mode:'VERIFY_ONLY',independentReviewClaim:true}));
const request={mode:'REQUEST_PREVIEW',intent:REQUEST,ack:ACK,actor:'basaira',repository:REPO,
  ref:'refs/heads/'+BRANCH,independentReviewClaim:false};
const requestResult=requestPreviewGate(request);
assert.equal(requestResult.status,'PREVIEW_REQUEST_RECORDED_NOT_AUTHORIZED');
assert.equal(requestResult.previewDeployment,false);
assert.equal(requestResult.independentReview,false);
assert.equal(requestResult.requiresSeparateApproval,true);
for(const [name,delta] of [
  ['request-cannot-deploy',{mode:'DEPLOY'}],
  ['request-needs-exact-intent',{intent:'APPROVE_ONE_DAY_PREVIEW_ONLY'}],
  ['request-not-default',{intent:'DO_NOT_REQUEST'}],
  ['request-needs-ack',{ack:''}],
  ['request-ack-not-self-review',{ack:'I_AM_INDEPENDENT_REVIEWER'}],
  ['request-not-external-user',{actor:'guest'}],
  ['request-not-missing-actor',{actor:undefined}],
  ['request-not-main',{ref:'refs/heads/main'}],
  ['request-not-other-repo',{repository:'other/repo'}],
  ['request-does-not-claim-independent-review',{independentReviewClaim:true}]
])deny(name,()=>requestPreviewGate({...request,...delta}));

const workflow=fs.readFileSync('.github/workflows/admin-solo-verification-manual-v1r16.yml','utf8');
assert.equal(manualWorkflowGate(workflow),true);
for(const [name,mutate] of [
  ['auto-push',x=>x.replace('on:\n  workflow_dispatch:','on:\n  push:\n  workflow_dispatch:')],
  ['default-preview-request',x=>x.replace('default: VERIFY_ONLY','default: REQUEST_PREVIEW')],
  ['default-owner-request',x=>x.replace('default: DO_NOT_REQUEST','default: REQUEST_REVIEW_ONLY_NOT_DEPLOY')],
  ['removed-owner-ack',x=>x.replaceAll(ACK,'WRONG_ACK')],
  ['removed-request-intent',x=>x.replaceAll(REQUEST,'OTHER_INTENT')],
  ['no-readonly-source-gate',x=>x.replaceAll('node scripts/admin-solo-operator-guards-v1r16.mjs source','echo skip_source')],
  ['no-verify-path',x=>x.replace('MODE: VERIFY_ONLY','MODE: IGNORE')],
  ['no-request-path',x=>x.replace('MODE: REQUEST_PREVIEW','MODE: IGNORE')],
  ['write-permission',x=>x.replace('permissions:\n  contents: read','permissions:\n  contents: write')],
  ['oidc-permission',x=>x.replace('permissions:\n  contents: read','permissions:\n  contents: read\n  id-token: write')],
  ['google-auth-action',x=>x+'\n# google-github-actions/auth@v3'],
  ['firebase-live-deploy',x=>x+'\n# firebase deploy'],
  ['firebase-channel-deploy',x=>x+'\n# hosting:channel:deploy'],
  ['environment-attached',x=>x+'\n# environment:\n'],
  ['additional-job',x=>x+'\n  secretly_deploy:\n    runs-on: ubuntu-latest\n'],
  ['removed-candidate-tree',x=>x.replace('candidate_tree:', 'no_candidate_tree:')]
])deny('workflow-'+name,()=>manualWorkflowGate(mutate(workflow)));

const v15=fs.readFileSync('.github/workflows/admin-preview-integrated-manual-v1r15.yml','utf8');
assert.match(v15,/default: DO_NOT_DEPLOY/);
assert.match(v15,/environment:\n      name: basair-admin-preview-approval/);
assert.match(v15,/id-token: write/);
const ci=fs.readFileSync('.github/workflows/admin-solo-verification-ci-v1r16.yml','utf8');
assert.match(ci,/^on:\n  push:\n    branches:\n      - basair\/admin-solo-operator-safety-qualification-v1r16/m);
assert.match(ci,/npm audit --json/);
assert.match(ci,/npm run verify/);
assert.ok(!/id-token: write|google-github-actions\/auth@|hosting:channel:deploy|FIREBASE_TOKEN\s*:|firebase\s+deploy/i.test(ci));
console.log('V1R16_VERIFY_ONLY_POSITIVE=PASS');
console.log('V1R16_SOLO_REQUEST_NONDEPLOY_POSITIVE=PASS');
console.log('V1R16_NEGATIVE_TESTS=PASS count='+rejected.length+' cases='+rejected.join(','));
