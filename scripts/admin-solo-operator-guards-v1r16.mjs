// V1R16: audit-friendly offline source and solo-operator request policy.
// This module MUST NEVER obtain a cloud identity or deploy an application.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

export const V15='ac644985086e5dbb792a3b1236008257868fecc5';
export const V15_TREE='d48ef39c2f504c84268e5f529652a1f67980a240';
export const REPO='basaira/basaira.github.io';
export const BRANCH='basair/admin-solo-operator-safety-qualification-v1r16';
export const ADMIN_SITE='basair-admin';
export const LOCK='62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a';
export const REQUEST='REQUEST_REVIEW_ONLY_NOT_DEPLOY';
export const ACK='I_UNDERSTAND_NO_INDEPENDENT_REVIEW_AND_NO_DEPLOYMENT';
export const FILES=[
  '.github/workflows/admin-solo-verification-manual-v1r16.yml',
  '.github/workflows/admin-solo-verification-ci-v1r16.yml',
  'scripts/admin-solo-operator-guards-v1r16.mjs',
  'tests/admin-solo-operator-guards-v1r16.mjs',
  'docs/admin-solo-operator-safety-v1r16.md'
].sort();
const hex40=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

export function sourceGate(x) {
  assert.equal(x.repository,REPO,'repository changed');
  assert.equal(x.ref,'refs/heads/'+BRANCH,'unapproved branch');
  assert.ok(hex40(x.dispatchSha)&&hex40(x.head)&&hex40(x.reviewedHead),'invalid commit identity');
  assert.equal(x.dispatchSha,x.head,'dispatch versus checkout mismatch');
  assert.equal(x.reviewedHead,x.head,'reviewed HEAD mismatch');
  assert.ok(hex40(x.tree)&&hex40(x.reviewedTree),'invalid tree identity');
  assert.equal(x.tree,x.reviewedTree,'reviewed TREE mismatch');
  assert.equal(x.frozenV15Tree,V15_TREE,'V15 base tree changed');
  assert.equal(x.descendsFromV15,true,'V15 ancestry missing');
  assert.equal(x.site,ADMIN_SITE,'default or other Firebase site prohibited');
  assert.equal(x.vite,'6.4.4','security-patched Vite required');
  assert.equal(x.lockSha,LOCK,'security-frozen lock changed');
  assert.deepEqual([...x.changedFiles].sort(),FILES,'unexpected or missing V16 file');
  // This gate deliberately requires NO owner deployment authorization.
  return true;
}
export function noCloudCredentials(x) {
  for(const [name,value] of Object.entries(x)) {
    assert.equal(value||'','',name+' is forbidden in read-only V16');
  }
  return true;
}
export function verifyOnlyGate(x) {
  assert.equal(x.mode,'VERIFY_ONLY','verification must not request a deployment');
  assert.equal(x.independentReviewClaim,false,'no independent reviewer exists in solo mode');
  return {status:'VERIFY_ONLY_PASSED',cloudAuth:false,previewDeployment:false,independentReview:false};
}
export function requestPreviewGate(x) {
  assert.equal(x.mode,'REQUEST_PREVIEW','request-only mode expected');
  assert.equal(x.intent,REQUEST,'separate request acknowledgement required');
  assert.equal(x.ack,ACK,'explicit solo-operator acknowledgement required');
  assert.equal(x.repository,REPO);
  assert.equal(x.ref,'refs/heads/'+BRANCH);
  assert.equal(typeof x.actor,'string');
  assert.equal(x.actor.toLowerCase(),'basaira','only the repository owner can submit the request');
  assert.equal(x.independentReviewClaim,false,'solo acknowledgement is NOT independent review');
  return {status:'PREVIEW_REQUEST_RECORDED_NOT_AUTHORIZED',cloudAuth:false,previewDeployment:false,independentReview:false,requiresSeparateApproval:true};
}
export function manualWorkflowGate(source) {
  assert.match(source,/^on:\n  workflow_dispatch:\n/m);
  assert.ok(!/^  (?:push|pull_request|workflow_run|schedule|repository_dispatch):/m.test(source),'no automatic dispatch');
  assert.match(source,/default: VERIFY_ONLY/);
  assert.match(source,/REQUEST_PREVIEW/);
  assert.match(source,/default: DO_NOT_REQUEST/);
  assert.match(source,/REQUEST_REVIEW_ONLY_NOT_DEPLOY/);
  assert.match(source,/I_UNDERSTAND_NO_INDEPENDENT_REVIEW_AND_NO_DEPLOYMENT/);
  assert.match(source,/^      candidate_sha:\s*$/m);
  assert.match(source,/^      candidate_tree:\s*$/m);
  assert.match(source,/MODE: VERIFY_ONLY/);
  assert.match(source,/MODE: REQUEST_PREVIEW/);
  assert.match(source,/node scripts\/admin-solo-operator-guards-v1r16\.mjs source/);
  assert.ok(!/id-token:\s*write|contents:\s*write|google-github-actions\/auth@|environment:\s*\n|hosting:channel:deploy|firebase[ \t]+deploy(?:[ \t]|$)|firebase-tools|FIREBASE_TOKEN\s*:|credentials_json|service_account_key/i.test(source),'no deployment credentials, extra privileges or deploy command');
  assert.match(source,/^permissions:\n  contents: read\n/m);
  const jobs=source.split('\njobs:\n');
  assert.equal(jobs.length,2);
  const names=[...jobs[1].matchAll(/^  ([a-z][a-z0-9_-]+):\s*$/gm)].map(a=>a[1]);
  assert.deepEqual(names,['verify_only','request_preview'],'only two read-only jobs');
  return true;
}
function run() {
  if(process.argv[2]!=='source') throw Error('unsupported command');
  const mode=process.env.MODE;
  const source={
    repository:process.env.GITHUB_REPOSITORY,
    ref:process.env.GITHUB_REF,
    dispatchSha:process.env.GITHUB_SHA,
    head:git('rev-parse','HEAD'),
    reviewedHead:process.env.REVIEWED_SHA,
    tree:git('rev-parse','HEAD^{tree}'),
    reviewedTree:process.env.REVIEWED_TREE,
    frozenV15Tree:git('rev-parse',V15+'^{tree}'),
    descendsFromV15:git('merge-base',V15,'HEAD')===V15,
    site:process.env.SITE_ID,
    vite:JSON.parse(fs.readFileSync('package.json','utf8')).devDependencies.vite,
    lockSha:sha(fs.readFileSync('package-lock.json')),
    changedFiles:git('diff','--name-only',V15,'HEAD').split('\n').filter(Boolean)
  };
  sourceGate(source);
  assert.equal(git('status','--porcelain'),'','working tree must be clean');
  noCloudCredentials({
    FIREBASE_TOKEN:process.env.FIREBASE_TOKEN,
    GOOGLE_APPLICATION_CREDENTIALS:process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GOOGLE_GHA_CREDS_PATH:process.env.GOOGLE_GHA_CREDS_PATH,
    WIF_PROVIDER:process.env.WIF_PROVIDER,
    SERVICE_ACCOUNT:process.env.SERVICE_ACCOUNT
  });
  const result=mode==='VERIFY_ONLY'
    ?verifyOnlyGate({mode,independentReviewClaim:false})
    :requestPreviewGate({
      mode,intent:process.env.REQUEST_INTENT,ack:process.env.OPERATOR_ACK,
      actor:process.env.GITHUB_ACTOR,repository:source.repository,ref:source.ref,
      independentReviewClaim:false
    });
  const evidence={...result,mode,head:source.head,tree:source.tree,branch:BRANCH,sourceVerified:true};
  fs.writeFileSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r16-'+mode.toLowerCase()+'-proof.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('V1R16_SOURCE_GATE=PASS');
  console.log('V1R16_OPERATION_RESULT='+JSON.stringify(evidence));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))run();
