// Mock-only adversarial tests of the SAME policy executed by the future manual job.
// Never touches Firebase/Auth/GitHub APIs or production records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceGate,ownerGate,wifGate,environmentGate,V13,V13_TREE,BRANCH,LOCK,FILES} from '../scripts/admin-preview-guards-v1r14.mjs';
const good={
  ref:'refs/heads/'+BRANCH,repository:'basaira/basaira.github.io',
  actualHead:'a'.repeat(40),reviewedHead:'a'.repeat(40),
  actualTree:'b'.repeat(40),reviewedTree:'b'.repeat(40),
  securityHead:V13,securityTree:V13_TREE,descendsFromV13:true,
  site:'basair-admin',lock:LOCK,vite:'6.4.4',changedFiles:FILES
};
// Realistic shapes modeled on GitHub's documented GET environment and list policy responses.
const requiredReviewers={id:3755,node_id:'MDQ6R2F0ZTM3NTU=',type:'required_reviewers',
  prevent_self_review:true,reviewers:[{type:'User',reviewer:{login:'engineer-reviewer',id:123,node_id:'MDQ6VXNlcjE='}}]};
const env={id:161088068,node_id:'MDExOkVudmlyb25tZW50MTYxMDg4MDY4',
  name:'basair-admin-preview-approval',can_admins_bypass:false,
  protection_rules:[{id:3736,type:'wait_timer',wait_timer:30},requiredReviewers,{id:3756,type:'branch_policy'}],
  deployment_branch_policy:{protected_branches:false,custom_branch_policies:true}};
const branches={total_count:1,branch_policies:[{id:361471,node_id:'MDE2OkdhdGVCcmFuY2hQb2xpY3kzNjE0NzE=',name:BRANCH}]};
const rejects=[];
function reject(name,fn){assert.throws(fn,undefined,name); rejects.push(name);}
assert.equal(sourceGate(good),true);
reject('wrong SHA',()=>sourceGate({...good,reviewedHead:'c'.repeat(40)}));
reject('wrong TREE',()=>sourceGate({...good,reviewedTree:'c'.repeat(40)}));
reject('wrong branch',()=>sourceGate({...good,ref:'refs/heads/main'}));
reject('unapproved path',()=>sourceGate({...good,changedFiles:[...FILES,'admin.js']}));
reject('missing expected file',()=>sourceGate({...good,changedFiles:FILES.slice(0,4)}));
reject('wrong site default',()=>sourceGate({...good,site:'basair-academy-4a1d0'}));
reject('wrong parent',()=>sourceGate({...good,descendsFromV13:false}));
reject('V13 tree drift',()=>sourceGate({...good,securityTree:'0'.repeat(40)}));
reject('old insecure vite',()=>sourceGate({...good,vite:'6.4.3'}));
reject('wrong lock',()=>sourceGate({...good,lock:'0'.repeat(64)}));
reject('unexpected repository',()=>sourceGate({...good,repository:'example/rogue'}));
assert.equal(ownerGate('APPROVE_ONE_DAY_PREVIEW_ONLY'),true);
reject('DO_NOT_DEPLOY',()=>ownerGate('DO_NOT_DEPLOY'));
reject('no owner approval',()=>ownerGate(''));
const wp='projects/123456/locations/global/workloadIdentityPools/basair/providers/github';
const sa='preview@basair-academy-4a1d0.iam.gserviceaccount.com';
assert.equal(wifGate(wp,sa,''),true);
reject('missing WIF',()=>wifGate('',sa,''));
reject('wrong WIF',()=>wifGate('projects/a/locations/eu/pools/x',sa,''));
reject('unapproved service account',()=>wifGate(wp,'preview@another.iam.gserviceaccount.com',''));
reject('permanent token',()=>wifGate(wp,sa,'token'));
assert.equal(environmentGate(env,branches,'owner'),true);
assert.equal(environmentGate({...env,prevent_self_review:false},branches,'owner'),true); // root field cannot override protected nested rule
const withRule=(replacement)=>({...env,protection_rules:env.protection_rules.map(r=>r.type==='required_reviewers'?replacement:r)});
const withExtra=(extra)=>({total_count:2,branch_policies:[...branches.branch_policies,extra]});
reject('missing required reviewer rule',()=>environmentGate({...env,protection_rules:[]},branches,'owner'));
reject('missing protection_rules',()=>environmentGate({...env,protection_rules:undefined},branches,'owner'));
reject('missing nested prevent_self_review',()=>environmentGate(withRule({...requiredReviewers,prevent_self_review:undefined}),branches,'owner'));
reject('nested self review false',()=>environmentGate(withRule({...requiredReviewers,prevent_self_review:false}),branches,'owner'));
reject('nested self review null',()=>environmentGate(withRule({...requiredReviewers,prevent_self_review:null}),branches,'owner'));
reject('root self review true cannot rescue unsafe nested false',()=>environmentGate({...withRule({...requiredReviewers,prevent_self_review:false}),prevent_self_review:true},branches,'owner'));
reject('missing reviewer list',()=>environmentGate(withRule({...requiredReviewers,reviewers:undefined}),branches,'owner'));
reject('self reviewer only',()=>environmentGate(withRule({...requiredReviewers,reviewers:[{type:'User',reviewer:{login:'owner'}}]}),branches,'owner'));
reject('self reviewer case insensitive',()=>environmentGate(withRule({...requiredReviewers,reviewers:[{type:'User',reviewer:{login:'Owner'}}]}),branches,'owner'));
reject('team only',()=>environmentGate(withRule({...requiredReviewers,reviewers:[{type:'Team',reviewer:{slug:'team'}}]}),branches,'owner'));
reject('missing actor',()=>environmentGate(env,branches,''));
reject('duplicate required reviewers rules',()=>environmentGate({...env,protection_rules:[...env.protection_rules,requiredReviewers]},branches,'owner'));
reject('admin bypass allowed',()=>environmentGate({...env,can_admins_bypass:true},branches,'owner'));
reject('admin bypass not reported',()=>environmentGate({...env,can_admins_bypass:undefined},branches,'owner'));
reject('old branch only',()=>environmentGate(env,{total_count:1,branch_policies:[{name:'basair/admin-preview-manual-release-v1r12r2'}]},'owner'));
reject('no branch restrictions',()=>environmentGate({...env,deployment_branch_policy:{protected_branches:false,custom_branch_policies:false}},branches,'owner'));
reject('protected branches policy instead of custom',()=>environmentGate({...env,deployment_branch_policy:{protected_branches:true,custom_branch_policies:false}},branches,'owner'));
reject('extra main rule',()=>environmentGate(env,withExtra({id:2,name:'main'}),'owner'));
reject('extra general wildcard rule',()=>environmentGate(env,withExtra({id:2,name:'*'}),'owner'));
reject('extra release pattern rule',()=>environmentGate(env,withExtra({id:2,name:'release/*'}),'owner'));
reject('extra prior branch rule',()=>environmentGate(env,withExtra({id:2,name:'basair/admin-preview-manual-release-v1r12r2'}),'owner'));
reject('extra tag rule',()=>environmentGate(env,withExtra({id:2,name:'v*',type:'tag'}),'owner'));
reject('duplicate exact rule',()=>environmentGate(env,withExtra({id:2,name:BRANCH}),'owner'));
reject('missing V1R14 rule',()=>environmentGate(env,{total_count:0,branch_policies:[]},'owner'));
reject('missing policy array',()=>environmentGate(env,{total_count:1},'owner'));
reject('missing total_count',()=>environmentGate(env,{branch_policies:branches.branch_policies},'owner'));
reject('unread next page despite one visible rule',()=>environmentGate(env,{total_count:2,branch_policies:branches.branch_policies},'owner'));
reject('mismatched count with two visible rules',()=>environmentGate(env,{total_count:1,branch_policies:[...branches.branch_policies,{name:'main'}]},'owner'));
reject('only wildcard rule',()=>environmentGate(env,{total_count:1,branch_policies:[{name:'basair/*'}]},'owner'));
reject('only main rule',()=>environmentGate(env,{total_count:1,branch_policies:[{name:'main'}]},'owner'));
reject('tag masquerading as exact branch name',()=>environmentGate(env,{total_count:1,branch_policies:[{name:BRANCH,type:'tag'}]},'owner'));
const manual=fs.readFileSync('.github/workflows/admin-preview-guarded-v1r14.yml','utf8');
const ci=fs.readFileSync('.github/workflows/admin-preview-guarded-ci-v1r14.yml','utf8');
assert.match(manual,/^on:\n  workflow_dispatch:\n/m);
assert.ok(!/^  (push|pull_request|schedule|workflow_run|repository_dispatch):/m.test(manual));
assert.match(manual,/default: DO_NOT_DEPLOY/);
assert.match(manual,/candidate_tree:/);
assert.match(manual,/APPROVE_ONE_DAY_PREVIEW_ONLY/);
assert.match(manual,/actions: read/);
assert.match(manual,/environment:\n      name: basair-admin-preview-approval/);
assert.match(manual,/google-github-actions\/auth@v3/);
assert.match(manual,/--only admin-v1r11-only/);
assert.match(manual,/hosting:channel:deploy v1r12-admin-only/);
assert.match(manual,/--expires 1d/);
assert.match(manual,/admin-preview-guards-v1r14\.mjs source/);
assert.match(manual,/admin-preview-guards-v1r14\.mjs approval/);
assert.ok(!/(^|\s)firebase deploy(?:\s|$)|hosting:clone|--only hosting:admin-v1r11-only/.test(manual));
assert.ok(!/credentials_json|service_account_key|FIREBASE_TOKEN:/.test(manual));
assert.equal((manual.match(/id-token: write/g)||[]).length,1);
assert.match(ci,/^on:\n  push:\n    branches:\n      - basair\/admin-preview-guarded-release-qualification-v1r14/m);
assert.ok(!/id-token: write|google-github-actions\/auth|hosting:channel:deploy|FIREBASE_TOKEN/.test(ci));
console.log('V1R14_R1_REST_SHAPE_POSITIVE=PASS');
console.log('V1R14_POSITIVE_GATE_TESTS=PASS');
console.log('V1R14_R1_NEGATIVE_COUNT='+rejects.length);
console.log('V1R14_NEGATIVE_GATE_TESTS=PASS count='+rejects.length+' names='+rejects.join(','));
