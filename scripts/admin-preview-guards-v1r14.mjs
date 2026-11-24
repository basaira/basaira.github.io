// V1R14: Pure policy + real Git identity gate; no network/cloud access.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

export const V13='fe93498beadf3d4f6efe65acc63559741e0f7006';
export const V13_TREE='90caf98980935a1c98010a33fbb39510bd3e28d4';
export const BRANCH='basair/admin-preview-guarded-release-qualification-v1r14';
export const LOCK='62a543b624975ff938f77490ffcedd17a5771176af5a63e9e20809429013525a';
export const FILES=[
  '.github/workflows/admin-preview-guarded-v1r14.yml',
  '.github/workflows/admin-preview-guarded-ci-v1r14.yml',
  'scripts/admin-preview-guards-v1r14.mjs',
  'tests/admin-preview-guards-v1r14.mjs',
  'docs/admin-preview-guarded-qualification-v1r14.md'
].sort();
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const validSha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
export function sourceGate(x) {
  assert.equal(x.ref,'refs/heads/'+BRANCH);
  assert.equal(x.repository,'basaira/basaira.github.io');
  assert.ok(validSha(x.actualHead)&&validSha(x.reviewedHead));
  assert.equal(x.actualHead,x.reviewedHead,'HEAD mismatch');
  assert.ok(validSha(x.actualTree)&&validSha(x.reviewedTree));
  assert.equal(x.actualTree,x.reviewedTree,'TREE mismatch');
  assert.equal(x.securityHead,V13);
  assert.equal(x.securityTree,V13_TREE);
  assert.equal(x.descendsFromV13,true,'security-verified V1R13 ancestor missing');
  assert.equal(x.site,'basair-admin','only USER_SITE permitted');
  assert.equal(x.lock,LOCK,'frozen Vite 6.4.4 lock mismatch');
  assert.equal(x.vite,'6.4.4');
  assert.deepEqual([...x.changedFiles].sort(),FILES,'unapproved, missing or modified path');
  return true;
}
export function ownerGate(authorization) {
  assert.equal(authorization,'APPROVE_ONE_DAY_PREVIEW_ONLY','owner has not authorized the separate preview');
  return true;
}
export function wifGate(provider,serviceAccount,firebaseToken) {
  assert.equal(firebaseToken||'','', 'FIREBASE_TOKEN permanent secret prohibited');
  assert.match(provider||'',/^projects\/[0-9]+\/locations\/global\/workloadIdentityPools\/[A-Za-z0-9_-]+\/providers\/[A-Za-z0-9_-]+$/);
  assert.match(serviceAccount||'',/^[a-zA-Z0-9._-]+@basair-academy-4a1d0\.iam\.gserviceaccount\.com$/);
  return true;
}
// Consume the documented GitHub REST get-environment and branch-policies shapes.
// A single extra policy (including main, wildcard, tag, or old release branch) fails closed.
export function environmentGate(env,policies,actor) {
  assert.equal(env?.name,'basair-admin-preview-approval');
  assert.equal(env.can_admins_bypass,false,'administrator bypass must be disabled');
  assert.ok(typeof actor==='string' && actor.trim().length>0,'initiating actor unavailable');
  assert.ok(Array.isArray(env.protection_rules),'missing REST protection_rules');
  const reviewerRules=env.protection_rules.filter(x=>x?.type==='required_reviewers');
  assert.equal(reviewerRules.length,1,'exactly one required_reviewers rule expected');
  const rule=reviewerRules[0];
  assert.equal(rule.prevent_self_review,true,'self-review must be prevented by required_reviewers');
  assert.ok(Array.isArray(rule.reviewers)&&rule.reviewers.length>0,'required reviewer missing');
  assert.ok(rule.reviewers.some(x=>x?.type==='User' &&
    typeof x.reviewer?.login==='string' &&
    x.reviewer.login.trim().length>0 &&
    x.reviewer.login.toLowerCase()!==actor.toLowerCase()),'independent user reviewer missing');
  assert.equal(env.deployment_branch_policy?.protected_branches,false,'expected explicit custom branch policy');
  assert.equal(env.deployment_branch_policy?.custom_branch_policies,true,'custom branch restriction required');
  assert.equal(policies?.total_count,1,'additional/unread deployment policy or incomplete page');
  assert.ok(Array.isArray(policies.branch_policies),'missing REST branch_policies');
  assert.equal(policies.branch_policies.length,1,'only one explicit V1R14 branch rule permitted');
  const only=policies.branch_policies[0];
  assert.equal(only?.name,BRANCH,'branch wildcard, main, tag or other branch forbidden');
  if(Object.hasOwn(only,'type')) assert.equal(only.type,'branch','tag deployment policy forbidden');
  return true;
}
function run() {
  if(process.argv[2]==='source') {
    const anc=git('merge-base',V13,'HEAD')===V13;
    const files=git('diff','--name-only',V13,'HEAD').split('\n').filter(Boolean);
    const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
    sourceGate({
      ref:process.env.GITHUB_REF, repository:process.env.GITHUB_REPOSITORY,
      actualHead:git('rev-parse','HEAD'), reviewedHead:process.env.REVIEWED_SHA,
      actualTree:git('rev-parse','HEAD^{tree}'), reviewedTree:process.env.REVIEWED_TREE,
      securityHead:V13, securityTree:git('rev-parse',V13+'^{tree}'),
      descendsFromV13:anc,site:process.env.SITE_ID,
      lock:hash(fs.readFileSync('package-lock.json')),vite:packageJson.devDependencies.vite,
      changedFiles:files
    });
    console.log('V1R14_REAL_SOURCE_VERIFICATION=PASS');
  } else if(process.argv[2]==='approval') {
    ownerGate(process.env.EXECUTION_AUTHORIZATION);
    wifGate(process.env.WIF_PROVIDER,process.env.SERVICE_ACCOUNT,process.env.FIREBASE_TOKEN);
    const root=process.env.RUNNER_TEMP||os.tmpdir();
    const environment=JSON.parse(fs.readFileSync(path.join(root,'environment.json'),'utf8'));
    const branches=JSON.parse(fs.readFileSync(path.join(root,'branch-policies.json'),'utf8'));
    environmentGate(environment,branches,process.env.GITHUB_ACTOR);
    console.log('V1R14_INDEPENDENT_ENVIRONMENT_GATE=PASS');
  } else throw Error('unsupported gate command');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
