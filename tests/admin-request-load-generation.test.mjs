// Ten deterministic request-loading scenarios; no production Firebase connections.
// Tests execute the actual functions extracted from the checked-out Admin source.
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync('admin.js','utf8');
function region(first,last){
  const a=source.indexOf(first), b=source.indexOf(last,a+first.length);
  assert.ok(a>=0&&b>a,'Source region missing: '+first);
  return source.slice(a,b);
}
const clear=region('    function clearPrivateState() {','    const $ = ');
const global=region('    async function loadAll() {','    async function loadContent() {');
const load=region('    async function loadRequests() {','    async function loadAudit() {');
const stat=region('    function renderStats() {','    function renderRequests() {');
const filter=region('    function getFilteredRequests() {','    async function updateRequestStatus(');
const refresh=region('    $("refresh-requests-btn").addEventListener("click", () => {','    $("firebase-health-btn").addEventListener(');
assert.match(source,/const generation = \+\+requestLoadGeneration/);
assert.match(source,/generation !== requestLoadGeneration/);
assert.match(source,/if \(refresh\?\.superseded\) return;/);
const stub=[
 "let authRevision=1,requestLoadGeneration=0,isAdmin=true,currentUser={uid:'admin1',email:'admin@example.invalid'},unsubscribeAdminRole=null;",
 "let requestLoadState='idle',requestsCache=[],requestDisplayLimit=100,auditCache=[],auditLoadState='idle',contentCache={texts:{},videos:[],settings:{}},contentRegistry=[];",
 "const pending=[],messages=[],elements=new Map();",
 "function $(id){if(!elements.has(id)){const el={textContent:'',dataset:{},handlers:{},classList:{add(){},remove(){}},replaceChildren(){this.textContent=''},removeAttribute(){},addEventListener(t,cb){this.handlers[t]=cb}};if(/(?:-search|-filter|-id|-value|-email|-password|-url|-telegram|-whatsapp)$/.test(id))el.value=id==='request-status-filter'?'all':'';elements.set(id,el)}return elements.get(id)}",
 "const document={getElementById:$};",
 "function showStatus(message,type='success'){messages.push({message,type})}",
 "function renderAuth(){}",
 "function loadRequestCollection(name){return new Promise((resolve,reject)=>pending.push({name,resolve,reject}))}",
 "function normalizeRequestContactFields(){return {phone:'',whatsapp:'',email:''}}",
 "function sortRequests(rows){return rows}",
 "let contentReadFailure=false; async function loadContentRegistry(){} async function loadContent(){if(contentReadFailure)throw Object.assign(Error('synthetic content denied'),{code:'permission-denied'})} async function loadAudit(){}"
].join('\n');
const renderStub=[
 "function renderRequests(){renderRequestCounts();$('requests-list').textContent=requestLoadState==='complete'?getFilteredRequests().slice(0,requestDisplayLimit).map(x=>x.fullName).join('|'):''}"
].join('\n');
const expose=[
 "return {start:loadRequests,all:loadAll,refresh:()=> $('refresh-requests-btn').handlers.click(),clear:clearPrivateState,revoke:revokeLocalAdminSession,failContent:()=>{contentReadFailure=true},",
 " switchAccount:()=>{authRevision++;clearPrivateState();currentUser={uid:'admin2',email:'admin2@example.invalid'};isAdmin=true},",
 " resolve:(offset,enrollment,assessment)=>{",
 "  const docs=(n,name)=>Array.from({length:n},(_,i)=>({id:name+i,data:()=>({status:i%5===0?'new':'contacted',fullName:name+i})}));",
 "  if(enrollment==='reject')pending[offset].reject(Object.assign(Error('synthetic denied'),{code:'permission-denied'}));else pending[offset].resolve(docs(enrollment,'lead'));",
 "  if(assessment==='reject')pending[offset+1].reject(Object.assign(Error('synthetic denied'),{code:'permission-denied'}));else pending[offset+1].resolve(docs(assessment,'assessment'))},",
 " count:()=>pending.length,state:()=>requestLoadState,total:()=>requestsCache.length,badge:()=> $('badge-requests').textContent,",
 " panel:()=> $('request-counts').dataset.state,cards:()=> $('requests-list').textContent,messages:()=>messages.slice(),",
 " privateEmpty:()=>requestsCache.length===0&&!$('requests-list').textContent&&!$('request-total-count').textContent&&!$('request-filtered-count').textContent,",
 " isAdmin:()=>isAdmin,uid:()=>currentUser?.uid,generation:()=>requestLoadGeneration};"
].join('\n');
function fixture(){return new Function([stub,clear,global,load,stat,renderStub,filter,refresh,expose].join('\n'))()}
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve()};
const done=async p=>{try{return await p}catch(e){return {error:e.message}}};
function check(app,total,state='complete'){
  assert.equal(app.state(),state);assert.equal(app.panel(),state);
  if(state==='complete'){assert.equal(app.total(),total);assert.equal(app.badge(),String(total))}
  else assert.notEqual(app.badge(),String(total));
}
async function pair(){const app=fixture(),A=app.start(),B=app.start();assert.equal(app.count(),4);return {app,A,B}}
test('1 B succeeds before A succeeds: B remains',async()=>{
  const{app,A,B}=await pair();app.resolve(2,2,0);assert.deepEqual(await done(B),{superseded:false});
  app.resolve(0,1,0);assert.deepEqual(await done(A),{superseded:true});check(app,2);assert.match(app.cards(),/lead1/);
});
test('2 B succeeds before A fails: stale error suppressed',async()=>{
  const{app,A,B}=await pair();app.resolve(2,2,0);await done(B);app.resolve(0,'reject',0);
  assert.deepEqual(await done(A),{superseded:true});check(app,2);assert.equal(app.messages().length,0);
});
test('3 B fails before A succeeds: current partial stays',async()=>{
  const{app,A,B}=await pair();app.resolve(2,'reject',0);assert.match((await done(B)).error,/synthetic denied/);
  app.resolve(0,1,0);assert.deepEqual(await done(A),{superseded:true});check(app,1,'partial');assert.equal(app.total(),0);
});
test('4 A fails before B succeeds: B wins',async()=>{
  const{app,A,B}=await pair();app.resolve(0,'reject',0);assert.deepEqual(await done(A),{superseded:true});
  check(app,1,'loading');app.resolve(2,3,0);await done(B);check(app,3);
});
test('5 A succeeds before B succeeds: B wins',async()=>{
  const{app,A,B}=await pair();app.resolve(0,1,0);assert.deepEqual(await done(A),{superseded:true});
  check(app,1,'loading');app.resolve(2,2,0);await done(B);check(app,2);
});
test('6 private session clear invalidates old in-flight load',async()=>{
  const app=fixture(),A=app.start();app.clear();assert.equal(app.privateEmpty(),true);
  app.resolve(0,2,0);assert.deepEqual(await done(A),{superseded:true});
  assert.equal(app.state(),'idle');assert.equal(app.privateEmpty(),true);
});
test('7 role revocation invalidates load and private DOM',async()=>{
  const app=fixture(),A=app.start();app.revoke('revoked');assert.equal(app.isAdmin(),false);
  app.resolve(0,2,0);assert.deepEqual(await done(A),{superseded:true});
  assert.equal(app.state(),'idle');assert.equal(app.privateEmpty(),true);
});
test('8 auth account switch prevents old-account render',async()=>{
  const app=fixture(),A=app.start();app.switchAccount();const B=app.start();
  app.resolve(2,3,0);await done(B);app.resolve(0,1,0);
  assert.deepEqual(await done(A),{superseded:true});assert.equal(app.uid(),'admin2');check(app,3);
});
test('9 global and request-only refresh overlap: no stale global success',async()=>{
  const app=fixture(),A=app.all();await flush();assert.equal(app.count(),2);
  app.refresh();assert.equal(app.count(),4);app.resolve(2,2,0);await flush();check(app,2);
  app.resolve(0,1,0);await done(A);await flush();check(app,2);
  assert.equal(app.messages().filter(x=>x.type==='success').length,1);
  assert.ok(!app.messages().some(x=>x.message==='تم تحديث البيانات بنجاح.'));
});
test('latest active failure is never hidden; both source collections fail',async()=>{
  const app=fixture(),A=app.start();app.resolve(0,'reject','reject');
  assert.match((await done(A)).error,/synthetic denied/);assert.equal(app.state(),'failed');
  assert.equal(app.badge(),'غير مكتمل');assert.equal(app.total(),0);
});

test('11 superseded request does not conceal an independent content read failure',async()=>{
  const app=fixture();app.failContent();
  const A=app.all();await flush();assert.equal(app.count(),2);
  const B=app.start();app.resolve(2,2,0);await done(B);
  app.resolve(0,1,0);await done(A);
  check(app,2);
  assert.ok(app.messages().some(m=>m.type==='error'&&m.message.includes('Firestore')),
    'unrelated failed Admin load must still report an error');
  assert.ok(!app.messages().some(m=>m.message==='تم تحديث البيانات بنجاح.'));
});
