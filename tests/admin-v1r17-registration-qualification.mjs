// V1R17 independent positive, malicious-mutation and REAL pinned-V16 checkout tests.
// All execution occurs on disposable CI filesystem. Never pushes or deploys.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {
  PROPOSED_PATH,V16,TREE,BASE_MAIN,FILES,
  registrationContract,sourceRegistrationGate,mainDiffGate,
  extractPinnedValidationScript,digest
} from '../scripts/admin-v1r17-registration-contract.mjs';

const proposal=fs.readFileSync(PROPOSED_PATH,'utf8');
assert.equal(registrationContract(proposal),true);
assert.equal(mainDiffGate([PROPOSED_PATH],'PROPOSAL_ONLY_NO_MAIN_WRITE'),true);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('rev-parse',V16),V16);
assert.equal(git('rev-parse',V16+'^{tree}'),TREE);
assert.equal(git('rev-parse',BASE_MAIN),BASE_MAIN);
assert.equal(git('merge-base','ac644985086e5dbb792a3b1236008257868fecc5','HEAD'),'ac644985086e5dbb792a3b1236008257868fecc5');
assert.deepEqual(git('diff','--name-only',V16,'HEAD').split('\n').filter(Boolean).sort(),FILES);
assert.throws(()=>mainDiffGate([...FILES],'PROPOSAL_ONLY_NO_MAIN_WRITE'));
assert.throws(()=>mainDiffGate([PROPOSED_PATH],'WRITE_MAIN_NOW'));
const base={
  repo:'basaira/basaira.github.io',event:'workflow_dispatch',
  ref:'refs/heads/main',actor:'basaira',
  reviewedSha:V16,reviewedTree:TREE,checkoutSha:V16,checkoutTree:TREE,
  branchTip:V16,mainBase:BASE_MAIN,authorizedExternalMutation:false
};
assert.equal(sourceRegistrationGate(base),true);
let negatives=0;
const deny=(label,fn)=>{assert.throws(fn,undefined,label);negatives++;};
for(const [name,delta] of [
  ['wrong-repository',{repo:'other/rogue'}],
  ['push-is-not-dispatch',{event:'push'}],
  ['wrong-main-ref',{ref:'refs/heads/attacker'}],
  ['tag-not-main',{ref:'refs/tags/v1'}],
  ['wrong-actor',{actor:'attacker'}],
  ['unknown-actor',{actor:''}],
  ['unapproved-user-sha',{reviewedSha:'c'.repeat(40)}],
  ['wrong-user-tree',{reviewedTree:'d'.repeat(40)}],
  ['drifting-checked-out-sha',{checkoutSha:'e'.repeat(40)}],
  ['drifting-source-tree',{checkoutTree:'f'.repeat(40)}],
  ['changed-v16-tip',{branchTip:'e'.repeat(40)}],
  ['missing-frozen-main',{mainBase:'0'.repeat(40)}],
  ['external-mutation-requested',{authorizedExternalMutation:true}]
])deny(name,()=>sourceRegistrationGate({...base,...delta}));
const hostile=[
  ['automatic-push',p=>p.replace('on:\n  workflow_dispatch:','on:\n  push:\n  workflow_dispatch:')],
  ['OIDC',p=>p.replace('permissions:\n  contents: read','permissions:\n  contents: read\n  id-token: write')],
  ['content-write',p=>p.replace('permissions:\n  contents: read','permissions:\n  contents: write')],
  ['checkout-input-ref',p=>p.replace('ref: '+V16,'ref: INPUT_REFERENCE')],
  ['checkout-main',p=>p.replace('ref: '+V16,'ref: main')],
  ['checkout-branch',p=>p.replace('ref: '+V16,'ref: basair/admin-solo-operator-safety-qualification-v1r16')],
  ['remove-source-pin',p=>p.replace('test "$REVIEWED_SHA" = '+V16,'echo skip_SHA')],
  ['remove-tree-pin',p=>p.replace('test "$REVIEWED_TREE" = '+TREE,'echo skip_TREE')],
  ['remove-main-gate',p=>p.replace('test "$GITHUB_REF" = refs/heads/main','echo skip_main')],
  ['remove-actor-gate',p=>p.replace('test "$GITHUB_ACTOR" = basaira','echo skip_actor')],
  ['remove-V16-gate',p=>p.replace('sourceGate({','skipSourceGate({')],
  ['remove-VERIFY_ONLY-gate',p=>p.replace("verifyOnlyGate({mode:'VERIFY_ONLY'","skipVerifyOnlyGate({mode:'VERIFY_ONLY'")],
  ['missing-npm-audit',p=>p.replace('npm audit --json','echo npm_audit_disabled --json')],
  ['missing-Admin-bundle-hash',p=>p.replace('node tests/admin-only-asset-closure-v1r10r1.mjs','echo skip_asset_hash')],
  ['missing-preview-target',p=>p.replace('node tests/admin-preview-target-guard-v1r12.mjs','echo skip_target')],
  ['deploy-preview',p=>p+'\n# hosting:channel:deploy preview'],
  ['live-deploy',p=>p+'\n# firebase deploy --only hosting'],
  ['Google-auth',p=>p+'\n# google-github-actions/auth@v3'],
  ['GitHub-environment',p=>p+'\n  environment: preview'],
  ['added-job',p=>p+'\n  publish_anything:\n    runs-on: ubuntu-latest\n'],
  ['more-actions',p=>p+'\n# uses: attacker/action@main'],
  ['secret-injection',p=>p+'\n# secrets.MY_KEY'],
  ['cancel-source-verification',p=>p.replace('test "$(git rev-parse HEAD)" = '+V16,'echo skip_head')],
  ['enable-token-persistence',p=>p.replace('persist-credentials: false','persist-credentials: true')]
];
for(const [name,mutate] of hostile)deny('hostile-'+name,()=>registrationContract(mutate(proposal)));

const runScript=extractPinnedValidationScript(proposal);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'basair-v1r17-'));
const cwd=path.join(tmp,'pinned-v16');
const run=(env)=>execFileSync('bash',['-e','-o','pipefail','-c',runScript],{
  cwd,env:{...process.env,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',
    GITHUB_REPOSITORY:'basaira/basaira.github.io',GITHUB_ACTOR:'basaira',
    REVIEWED_SHA:V16,REVIEWED_TREE:TREE,
    FIREBASE_TOKEN:'',GOOGLE_APPLICATION_CREDENTIALS:'',GOOGLE_GHA_CREDS_PATH:'',...env},
  encoding:'utf8',timeout:25000,stdio:['ignore','pipe','pipe']
});
try{
  execFileSync('git',['worktree','add','--detach',cwd,V16],{stdio:'pipe'});
  const positive=run({});
  assert.match(positive,/V1R17_PINNED_V16_SOURCE_AND_SOLO_READONLY=PASS/);
  for(const [name,env] of [
    ['other-event',{GITHUB_EVENT_NAME:'push'}],
    ['not-main',{GITHUB_REF:'refs/heads/dev'}],
    ['other-repository',{GITHUB_REPOSITORY:'another/repo'}],
    ['not-owner',{GITHUB_ACTOR:'attacker'}],
    ['other-source',{REVIEWED_SHA:'0'.repeat(40)}],
    ['other-tree',{REVIEWED_TREE:'0'.repeat(40)}],
    ['missing-source',{REVIEWED_SHA:''}],
    ['firebase-token-present',{FIREBASE_TOKEN:'unsafe'}],
    ['google-credentials-present',{GOOGLE_APPLICATION_CREDENTIALS:'/tmp/unsafe'}]
  ])deny('REAL-PINNED-'+name,()=>run(env));
  const proof={classification:'V1R17_ISOLATED_MAIN_DISPATCH_SIMULATION_PASS',
    proposedMainFile:PROPOSED_PATH,
    proposedMainSha256:digest(proposal),
    trustedCheckedOutSource:V16,trustedCheckedOutTree:TREE,
    simulatedGithubDispatchRef:'refs/heads/main',sourcePinnedNotUserSelected:true,
    negativeCases:negatives,realPinnedBashPositive:true,
    realPinnedBashNegativeCases:9,
    noActualWorkflowDispatch:true,noMainMutation:true,noCloudCredentials:true,noDeployment:true};
  const out=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r17-registration-proof.json');
  fs.writeFileSync(out,JSON.stringify(proof,null,2)+'\n');
  console.log('V1R17_REAL_PINNED_V16_BASH_SIMULATION=PASS');
  console.log('V1R17_NEGATIVE_TESTS=PASS count='+negatives);
  console.log('V1R17_PROPOSED_MAIN_SHA256='+proof.proposedMainSha256);
}finally{
  try{execFileSync('git',['worktree','remove','--force',cwd],{stdio:'pipe'});}catch{}
  try{fs.rmSync(tmp,{recursive:true,force:true});}catch{}
}
