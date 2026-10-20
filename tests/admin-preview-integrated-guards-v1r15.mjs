// V1R15: Negative/positive tests for the ACTUAL integrated gate module used by manual workflow.
// Mocks only: no network, Firebase, Google identity, Auth or deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  sourceGate,ownerGate,wifGate,environmentGate,manualWorkflowGate,
  V13,V13_TREE,V1R14,V1R14_TREE,V1R14_R1,V1R14_R1_TREE,BRANCH,LOCK,FILES
} from '../scripts/admin-preview-integrated-guards-v1r15.mjs';
import {environmentGate as reviewedEnvironmentGate,BRANCH as historicalBranch} from '../scripts/admin-preview-guards-v1r14.mjs';
const valid={
  ref:'refs/heads/'+BRANCH,repository:'basaira/basaira.github.io',
  actualHead:'a'.repeat(40), reviewedHead:'a'.repeat(40),
  actualTree:'b'.repeat(40), reviewedTree:'b'.repeat(40),
  securityHead:V13,securityTree:V13_TREE,descendsFromV13:true,
  v14Head:V1R14,v14Tree:V1R14_TREE,
  v14r1Head:V1R14_R1,v14r1Tree:V1R14_R1_TREE,descendsFromR1:true,
  site:'basair-admin', ownerAuthorization:'APPROVE_ONE_DAY_PREVIEW_ONLY',
  lock:LOCK,vite:'6.4.4',changedFiles:FILES
};
let names=[];
const rejects=(name,action)=>{assert.throws(action,undefined,name);names.push(name);};
assert.equal(sourceGate(valid),true);
const mutations=[
  ['unapproved-main',{ref:'refs/heads/main'}],
  ['unapproved-old-r1-branch',{ref:'refs/heads/basair/admin-preview-environment-gate-repair-v1r14r1'}],
  ['unapproved-v14-branch',{ref:'refs/heads/basair/admin-preview-guarded-release-qualification-v1r14'}],
  ['unapproved-repository',{repository:'other/project'}],
  ['wrong-head',{reviewedHead:'c'.repeat(40)}],
  ['invalid-head',{reviewedHead:'not-a-sha'}],
  ['wrong-tree',{reviewedTree:'c'.repeat(40)}],
  ['missing-tree',{reviewedTree:undefined}],
  ['wrong-v13-head',{securityHead:'0'.repeat(40)}],
  ['wrong-v13-tree',{securityTree:'0'.repeat(40)}],
  ['wrong-v14-head',{v14Head:'0'.repeat(40)}],
  ['wrong-v14-tree',{v14Tree:'0'.repeat(40)}],
  ['wrong-v14-r1-head',{v14r1Head:'0'.repeat(40)}],
  ['wrong-v14-r1-tree',{v14r1Tree:'0'.repeat(40)}],
  ['not-descended-from-v13',{descendsFromV13:false}],
  ['not-descended-from-r1',{descendsFromR1:false}],
  ['bad-lock',{lock:'0'.repeat(64)}],
  ['old-vite',{vite:'6.4.3'}],
  ['unapproved-file',{changedFiles:[...FILES,'admin.js']}],
  ['missing-file',{changedFiles:FILES.slice(1)}],
  ['default-firebase-site',{site:'basair-academy-4a1d0'}],
  ['other-firebase-site',{site:'another-admin'}],
  ['missing-owner-authorization',{ownerAuthorization:undefined}],
  ['default-no-deploy',{ownerAuthorization:'DO_NOT_DEPLOY'}]
];
for (const [name,replace] of mutations) rejects(name,()=>sourceGate({...valid,...replace}));
assert.equal(ownerGate('APPROVE_ONE_DAY_PREVIEW_ONLY'),true);
rejects('owner-gate-default',()=>ownerGate('DO_NOT_DEPLOY'));
rejects('owner-gate-missing',()=>ownerGate(''));
const provider='projects/123456/locations/global/workloadIdentityPools/basair/providers/github';
const account='preview@basair-academy-4a1d0.iam.gserviceaccount.com';
assert.equal(wifGate(provider,account,''),true);
rejects('missing-wif',()=>wifGate('',account,''));
rejects('malformed-wif',()=>wifGate('other/resource',account,''));
rejects('missing-service-account',()=>wifGate(provider,'',''));
rejects('other-service-account-project',()=>wifGate(provider,'admin@other.iam.gserviceaccount.com',''));
rejects('permanent-firebase-token',()=>wifGate(provider,account,'secret'));
const reviewers={type:'required_reviewers',prevent_self_review:true,reviewers:[{type:'User',reviewer:{login:'independent-reviewer',id:9001}}]};
const env={
  name:'basair-admin-preview-approval',can_admins_bypass:false,
  protection_rules:[{type:'wait_timer',wait_timer:0},reviewers,{type:'branch_policy'}],
  deployment_branch_policy:{protected_branches:false,custom_branch_policies:true}
};
const policy={total_count:1,branch_policies:[{id:999,name:BRANCH}]};
assert.equal(environmentGate(env,policy,'owner'),true);
const envWithReview=rule=>({...env,protection_rules:[{type:'wait_timer',wait_timer:0},rule,{type:'branch_policy'}]});
rejects('root-field-does-not-rescue-missing-nested',()=>environmentGate({...envWithReview({...reviewers,prevent_self_review:undefined}),prevent_self_review:true},policy,'owner'));
rejects('self-review-false',()=>environmentGate(envWithReview({...reviewers,prevent_self_review:false}),policy,'owner'));
rejects('self-review-null',()=>environmentGate(envWithReview({...reviewers,prevent_self_review:null}),policy,'owner'));
rejects('self-review-only',()=>environmentGate(envWithReview({...reviewers,reviewers:[{type:'User',reviewer:{login:'Owner'}}]}),policy,'owner'));
rejects('missing-review-rule',()=>environmentGate({...env,protection_rules:[]},policy,'owner'));
rejects('admin-bypass',()=>environmentGate({...env,can_admins_bypass:true},policy,'owner'));
rejects('missing-actor',()=>environmentGate(env,policy,''));
rejects('main-policy',()=>environmentGate(env,{total_count:1,branch_policies:[{name:'main'}]},'owner'));
rejects('wildcard-policy',()=>environmentGate(env,{total_count:1,branch_policies:[{name:'*'}]},'owner'));
rejects('historical-v14-policy',()=>environmentGate(env,{total_count:1,branch_policies:[{name:historicalBranch}]},'owner'));
rejects('historical-r1-policy',()=>environmentGate(env,{total_count:1,branch_policies:[{name:'basair/admin-preview-environment-gate-repair-v1r14r1'}]},'owner'));
rejects('extra-main-policy',()=>environmentGate(env,{total_count:2,branch_policies:[...policy.branch_policies,{name:'main'}]},'owner'));
rejects('extra-wildcard-policy',()=>environmentGate(env,{total_count:2,branch_policies:[...policy.branch_policies,{name:'release/*'}]},'owner'));
rejects('hidden-page',()=>environmentGate(env,{total_count:2,branch_policies:policy.branch_policies},'owner'));
rejects('missing-total-count',()=>environmentGate(env,{branch_policies:policy.branch_policies},'owner'));
rejects('duplicate-rule',()=>environmentGate(env,{total_count:2,branch_policies:[...policy.branch_policies,...policy.branch_policies]},'owner'));
rejects('tag-policy',()=>environmentGate(env,{total_count:1,branch_policies:[{name:BRANCH,type:'tag'}]},'owner'));
rejects('missing-branch-rule',()=>environmentGate(env,{total_count:0,branch_policies:[]},'owner'));
rejects('no-custom-policies',()=>environmentGate({...env,deployment_branch_policy:{protected_branches:true,custom_branch_policies:false}},policy,'owner'));
// Backwards-reviewed R1 gate remains byte-immutable and independently rejects V15 policy.
rejects('v14-r1-rejects-v15',()=>reviewedEnvironmentGate(env,policy,'owner'));
const oldRule={total_count:1,branch_policies:[{name:historicalBranch}]};
assert.equal(reviewedEnvironmentGate(env,oldRule,'owner'),true);
const manual=fs.readFileSync('.github/workflows/admin-preview-integrated-manual-v1r15.yml','utf8');
assert.equal(manualWorkflowGate(manual),true);
const alterations=[
 ['added-auto-schedule', manual.replace('on:\n  workflow_dispatch:','on:\n  schedule:\n    - cron: "0 0 * * *"\n  workflow_dispatch:')],
 ['default-deploy',manual.replace('default: DO_NOT_DEPLOY','default: APPROVE_ONE_DAY_PREVIEW_ONLY')],
 ['missing-approval-option',manual.replaceAll('APPROVE_ONE_DAY_PREVIEW_ONLY','UNKNOWN')],
 ['changed-site',manual.replace('--only admin-v1r11-only','--only basair-academy-4a1d0')],
 ['live-deploy',manual.replace('hosting:channel:deploy v1r12-admin-only','firebase deploy --only hosting:basair-academy-4a1d0')],
 ['removed-one-day-expiry',manual.replace('--expires 1d','--expires 365d')],
 ['broaden-oidc-permissions',manual.replace('permissions:\n  contents: read','permissions:\n  contents: read\n  id-token: write')],
 ['added-permanent-key',manual+' \n  credentials_json: SECRET\n'],
 ['removed-approval-gate',manual.replace('node scripts/admin-preview-integrated-guards-v1r15.mjs approval','echo skip_approval')],
 ['removed-source-gate',manual.replaceAll('node scripts/admin-preview-integrated-guards-v1r15.mjs source','echo skip_source')],
 ['removed-independent-environment',manual.replace('environment:\n      name: basair-admin-preview-approval','environment:\n      name: free-deploy')],
 ['removed-WIF-action',manual.replace('google-github-actions/auth@v3','insecure/key-auth@v1')]
];
for(const [name,attack] of alterations)rejects(name,()=>manualWorkflowGate(attack));
const ci=fs.readFileSync('.github/workflows/admin-preview-integrated-ci-v1r15.yml','utf8');
assert.match(ci,/^on:\n  push:\n    branches:\n      - basair\/admin-preview-integrated-candidate-v1r15/m);
assert.ok(!/id-token: write|hosting:channel:deploy|google-github-actions\/auth|FIREBASE_TOKEN/.test(ci),'CI must remain credential-free');
assert.match(ci,/npm audit --json/);
assert.match(ci,/npm run verify/);
assert.match(ci,/admin-http-frame-proof-v1r10r1/);
console.log('V1R15_POSITIVE_MOCK_GATES=PASS');
console.log('V1R15_NEGATIVE_GATES=PASS count='+names.length+' names='+names.join(','));
