// V1R17: validate the SINGLE proposed Main registration artifact. No network/cloud.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

export const PROPOSED_PATH='.github/workflows/admin-verify-only-registration-v1r17.yml';
export const V16='3da010de1c444d956deecead8dd2e39823360e26';
export const TREE='5ed825108eb100de4879b6d5923f9ba4e572e5cc';
export const V15='ac644985086e5dbb792a3b1236008257868fecc5';
export const CHECKOUT_ACTION={repository:'actions/checkout',version:'v4.2.2',sha:'11bd71901bbe5b1630ceea73d27597364c9af683'};
export const SETUP_NODE_ACTION={repository:'actions/setup-node',version:'v4.4.0',sha:'49933ea5288caeca8642d1e84afbd3f7d6820020'};
// Set to the independently checked final proposal digest during final qualification.
export const EXPECTED_MAIN_SHA256='e5ee4c9e6710bc0a7fcf8665b03892800cfbc62d388d3bd007ed5bfe4a1e5f59';
export const BASE_MAIN='2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243';
export const FILES=[
  '.github/workflows/admin-verify-only-registration-v1r17.yml',
  '.github/workflows/admin-v1r17-qualification-ci.yml',
  'scripts/admin-v1r17-registration-contract.mjs',
  'tests/admin-v1r17-registration-qualification.mjs',
  'docs/admin-v1r17-registration-qualification.md'
].sort();

export function registrationContract(yml) {
  assert.ok(typeof yml==='string'&&yml.length>100,'registration missing');
  assert.match(yml,/^on:\n  workflow_dispatch:\n/m,'manual event required');
  assert.equal((yml.match(/^  workflow_dispatch:/gm)||[]).length,1);
  assert.ok(!/^  (?:push|pull_request|schedule|workflow_run|repository_dispatch|workflow_call):/m.test(yml),'no other event allowed');
  assert.match(yml,/^permissions:\n  contents: read\n/m,'read-only top-level permissions');
  assert.ok(!/\bcontents:\s*write\b|\bid-token:\s*write\b|\bactions:\s*write\b/.test(yml),'write or OIDC rights forbidden');
  assert.ok(!/\benvironment\s*:|\bsecrets\.|\bvars\.|\bFIREBASE_TOKEN\s*:|\bcredentials_json\b|\bgoogle-github-actions\/auth\b|\bfirebase-tools\b|\bhosting:channel:deploy\b|\bfirebase[ \t]+deploy\b|\bGITHUB_TOKEN\b/m.test(yml),'cloud credentials or deployment prohibited');
  assert.equal((yml.match(/^jobs:\s*$/gm)||[]).length,1);
  const jobNames=[...yml.split('\njobs:\n')[1].matchAll(/^  ([a-z][a-z0-9_-]+):\s*$/gm)].map(x=>x[1]);
  assert.deepEqual(jobNames,['verify_pinned_v16'],'one approved job only');
  assert.match(yml,/github\.ref == 'refs\/heads\/main'/,'dispatch must be main-only');
  assert.match(yml,/github\.repository == 'basaira\/basaira\.github\.io'/);
  assert.match(yml,/test "\$GITHUB_REF" = refs\/heads\/main/);
  assert.match(yml,/test "\$GITHUB_ACTOR" = basaira/,'solo owner only');
  assert.match(yml,/^          ref: 3da010de1c444d956deecead8dd2e39823360e26$/m,'checkout must be SHA pinned and not user input');
  assert.ok(!/^          ref:\s*.*(?:inputs\.|github\.|HEAD|main)/m.test(yml),'no dynamic checkout');
  assert.equal((yml.match(/\buses:\s*/g)||[]).length,2,'two reviewed actions only');
  assert.match(yml,/^        uses: actions\/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4\.2\.2$/m);
  assert.match(yml,/^        uses: actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4\.4\.0$/m);
  const actionLines=yml.split('\n').filter(line=>/^\s*uses:\s*/.test(line));
  assert.deepEqual(actionLines.map(line=>line.trim()),[
    'uses: actions/checkout@'+CHECKOUT_ACTION.sha+' # '+CHECKOUT_ACTION.version,
    'uses: actions/setup-node@'+SETUP_NODE_ACTION.sha+' # '+SETUP_NODE_ACTION.version
  ],'only exact official pinned action invocations');
  assert.ok(!/^\s*uses:.*@[A-Za-z][A-Za-z0-9_.-]*\s*(?:#.*)?$/m.test(yml),'moving action refs are forbidden');
  assert.match(yml,/persist-credentials: false/);
  assert.match(yml,/fetch-depth: 0/);
  assert.match(yml,/node-version: '22\.16\.0'/);
  assert.match(yml,/test "\$REVIEWED_SHA" = 3da010de1c444d956deecead8dd2e39823360e26/);
  assert.match(yml,/test "\$REVIEWED_TREE" = 5ed825108eb100de4879b6d5923f9ba4e572e5cc/);
  assert.match(yml,/test "\$GITHUB_EVENT_NAME" = workflow_dispatch/);
  assert.match(yml,/test "\$GITHUB_REPOSITORY" = basaira\/basaira\.github\.io/);
  assert.match(yml,/test "\$\(git rev-parse HEAD\)" = 3da010de1c444d956deecead8dd2e39823360e26/);
  assert.match(yml,/test "\$\(git rev-parse HEAD\^\{tree\}\)" = 5ed825108eb100de4879b6d5923f9ba4e572e5cc/);
  assert.match(yml,/test "\$\(git rev-parse refs\/remotes\/origin\/basair\/admin-solo-operator-safety-qualification-v1r16\)" = 3da010de1c444d956deecead8dd2e39823360e26/);
  assert.match(yml,/sourceGate\(\{/,'inherited V16 source validation required');
  assert.match(yml,/verifyOnlyGate\(\{mode:'VERIFY_ONLY'/,'separate verify-only gate required');
  assert.match(yml,/npm audit --json/);
  assert.match(yml,/npm run verify/);
  assert.match(yml,/admin-only-asset-closure-v1r10r1/);
  assert.match(yml,/admin-preview-target-guard-v1r12/);
  assert.match(yml,/V1R17_MAIN_REGISTRATION_VERIFY_ONLY_NO_DEPLOYMENT=PASS/);
  assert.ok(!/\$\{\{\s*inputs\.(?:ref|branch|workflow|command|script|path)\b/.test(yml),'no arbitrary source input');
  // Unlike substring-only checks, final byte-level approval rejects extra shell steps,
  // changes to permissions, untrusted action sources and unrelated YAML additions.
  if(EXPECTED_MAIN_SHA256!=='PENDING_FINAL_DIGEST')
    assert.equal(digest(yml),EXPECTED_MAIN_SHA256,'unreviewed Main registration bytes');
  return true;
}
export function sourceRegistrationGate(x) {
  assert.equal(x.repo,'basaira/basaira.github.io');
  assert.equal(x.event,'workflow_dispatch');
  assert.equal(x.ref,'refs/heads/main');
  assert.equal(x.actor,'basaira');
  assert.equal(x.reviewedSha,V16);
  assert.equal(x.reviewedTree,TREE);
  assert.equal(x.checkoutSha,V16);
  assert.equal(x.checkoutTree,TREE);
  assert.equal(x.branchTip,V16);
  assert.equal(x.mainBase,BASE_MAIN,'frozen Main authority missing');
  assert.equal(x.authorizedExternalMutation,false);
  return true;
}
export function mainDiffGate(files,operation) {
  assert.equal(operation,'PROPOSAL_ONLY_NO_MAIN_WRITE');
  assert.deepEqual(files,[PROPOSED_PATH],'Main would receive exactly ONE standalone new workflow');
  return true;
}
export function extractPinnedValidationScript(yml) {
  const marker='      - name: Verify real Main dispatch, immutable source and no cloud authority';
  const begin=yml.indexOf(marker);
  assert.ok(begin>=0,'pinned verification step absent');
  const step=yml.slice(begin);
  const run=step.indexOf('        run: |\n');
  assert.ok(run>=0,'shell validation absent');
  const lines=step.slice(run+'        run: |\n'.length).split('\n');
  const out=[];
  for(const line of lines) {
    if(line.startsWith('      - name:'))break;
    if(!line.trim()){out.push('');continue;}
    assert.ok(line.startsWith('          '),'unexpected block indentation');
    out.push(line.slice(10));
  }
  const script=out.join('\n').trimEnd()+'\n';
  assert.match(script,/set -euo pipefail/);
  return script;
}
export function officialActionGate(tagRefs) {
  assert.equal(tagRefs?.[CHECKOUT_ACTION.repository+':'+CHECKOUT_ACTION.version],CHECKOUT_ACTION.sha,'checkout official tag mismatch');
  assert.equal(tagRefs?.[SETUP_NODE_ACTION.repository+':'+SETUP_NODE_ACTION.version],SETUP_NODE_ACTION.sha,'setup-node official tag mismatch');
  return true;
}
export function digest(yml){return crypto.createHash('sha256').update(yml).digest('hex');}
if(process.argv[2]==='check') {
  const yml=fs.readFileSync(PROPOSED_PATH,'utf8');
  registrationContract(yml);
  console.log('V1R17_REGISTRATION_CONTRACT=PASS');
  console.log('V1R17_PROPOSED_MAIN_FILE_SHA256='+digest(yml));
}
