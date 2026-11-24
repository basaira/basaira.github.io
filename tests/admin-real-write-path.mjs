// Real admin.js handlers, real Firestore SDK transactions, local emulator only.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import {collection,doc,getDoc,getDocs,setDoc,updateDoc,writeBatch} from 'firebase/firestore';

const endpoint=process.env.FIRESTORE_EMULATOR_HOST;
if(!endpoint?.startsWith('127.0.0.1:'))throw Error('Local emulator required; production forbidden');
const port=Number(endpoint.split(':')[1]),projectId='demo-basair-admin-write-path';
const BASE='http://127.0.0.1:4179';
const source=[
  "import {initializeApp as app} from 'firebase/app';",
  "import * as f from 'firebase/firestore';",
  "export const initializeApp=()=>app({projectId:'"+projectId+"',apiKey:'synthetic',appId:'synthetic'});",
  "export function initializeFirestore(a,o){const db=f.initializeFirestore(a,o);f.connectFirestoreEmulator(db,'127.0.0.1',"+port+",{mockUserToken:{sub:window.__uid||'admin1',email:window.__email||'admin@example.invalid'}});return db}",
  "export const {collection,doc,serverTimestamp,writeBatch,query,orderBy,documentId,startAfter,limit}=f;",
  "export function onSnapshot(ref,next,error){return f.onSnapshot(ref,snapshot=>{if(window.__holdAdminRoleListener&&ref.path==='admin_roles/'+(window.__uid||'admin1')){if(!snapshot.exists()||snapshot.data().active!==true)window.__suppressedRoleRevocation=true;return}next(snapshot)},error)}",
  "export async function getDoc(ref){if(window.__failRefresh){window.__failRefresh=false;throw Error('synthetic refresh failure')}return f.getDoc(ref)}",
  "export async function getDocs(q){const path=q._query?.path?.canonicalString?.()||'';if(path.includes('requests'))window.__requestReads=(window.__requestReads||0)+1;if(window.__failAssessmentRead&&path.includes('assessment_requests')){window.__failAssessmentRead=false;throw Object.assign(Error('synthetic permission denied'),{code:'permission-denied'})}const result=await f.getDocs(q);if(window.__holdRequestReadOnce&&path.includes('assessment_requests')){window.__holdRequestReadOnce=false;window.__requestReadHeld=true;await new Promise(resolve=>window.__releaseRequestRead=resolve);window.__requestReadHeld=false;}return result}",
  "export async function runTransaction(db,fn){if(window.__failWrite)throw Object.assign(Error('synthetic network failure'),{code:'unavailable'});const result=await f.runTransaction(db,async tx=>{window.__txAttempts=(window.__txAttempts||0)+1;const value=await fn(tx);if(window.__holdTransactionOnce){window.__holdTransactionOnce=false;window.__txPaused=true;await new Promise(resolve=>window.__resumeTx=resolve);window.__txPaused=false}return value});window.__txDone=(window.__txDone||0)+1;if(window.__failAfterCommit)window.__failRefresh=true;return result}",
  "export class GoogleAuthProvider{setCustomParameters(){}}",
  "export const browserLocalPersistence={};export const setPersistence=async()=>{};",
  "export const getAuth=()=>window.__auth||(window.__auth={currentUser:null,cb:null});",
  "export function onAuthStateChanged(a,cb){a.cb=cb;queueMicrotask(()=>cb(a.currentUser));return ()=>{a.cb=null}}",
  "export async function signInWithEmailAndPassword(a,email){a.currentUser={uid:window.__uid||'admin1',email};void a.cb(a.currentUser);return {user:a.currentUser}}",
  "export const signInWithPopup=a=>signInWithEmailAndPassword(a,'admin@example.invalid');",
  "export async function signOut(a){a.currentUser=null;void a.cb(null)}"
].join('\n');
const bundle=(await build({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'synthetic-emulator-sdk.mjs'},
  bundle:true,write:false,format:'esm',platform:'browser'})).outputFiles[0].text;
const registry="export default {items:[{id:'welcome',text:'Original Welcome',lang:'en',section:'home',page:'index.html'},{id:'title',text:'Original Title',lang:'en',section:'home',page:'index.html'},{id:'a.b',text:'Original Dot',lang:'en',section:'home',page:'index.html'}]}";
let env,browser,context,page,db;
const content=async()=>(await getDoc(doc(db,'site_content','public'))).data();
const audits=async()=>(await getDocs(collection(db,'admin_audit'))).docs.map(d=>d.data());
async function action(click,receipt,kind,verify){
  const previous=await audits(),before=previous.length;
  const completed=await page.evaluate(()=>window.__txDone||0);
  await click();
  try {
    await page.waitForFunction(([s,count])=>(window.__txDone||0)>count &&
      document.querySelector('#status')?.textContent.includes(s),[receipt,completed],{timeout:20000});
  } catch (error) {
    console.error('Write-path diagnostic',JSON.stringify(await page.evaluate(()=>({
      txDone:window.__txDone||0,status:document.querySelector('#status')?.textContent,
      statusType:document.querySelector('#status')?.dataset.statusType,
      requestCounterState:document.querySelector('#request-counts')?.dataset.state,
      requestsText:document.querySelector('#requests-list')?.textContent.slice(0,500)
    }))));
    throw error;
  }
  const entries=await audits();
  assert.equal(entries.length,before+1,'audit must commit exactly once');
  assert.equal(entries.filter(e=>e.action===kind).length,
    previous.filter(e=>e.action===kind).length+1,'expected audit action');
  assert.ok(entries.filter(e=>e.action===kind).every(e=>e.actorUid==='admin1'));
  await verify();
}
async function selectText(id){
  await page.locator('.nav-btn[data-tab="texts"]').click();
  await page.locator('#text-search').fill(id);
  await page.locator('#texts-list .item').first().click();
  assert.equal(await page.locator('#text-id').inputValue(),id);
}
async function login(){
  await page.locator('#admin-email').fill('admin@example.invalid');
  await page.locator('#admin-password').fill('synthetic-password');
  await page.locator('#email-login-btn').click();
  await page.locator('#admin-dashboard:not(.hidden)').waitFor();
  await page.waitForFunction(()=>document.querySelector('#request-counts')?.dataset.state==='complete');
}
async function waitCounter(id,value){
  await page.waitForFunction(([selector,expected])=>document.querySelector(selector)?.textContent===expected,[id,value]);
}
async function privateDomEmpty(){
  return page.evaluate(()=>['requests-list','audit-list','texts-list','videos-list','text-id','text-value',
    'video-title','video-url','video-image','settings-whatsapp','settings-telegram',
    'text-original-preview','uid-box'].every(id=>{
      const e=document.getElementById(id);return !(e?.value||e?.textContent);
    }));
}
try{
  env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});
  db=env.authenticatedContext('admin1',{email:'admin@example.invalid'}).firestore();
  await env.withSecurityRulesDisabled(async c=>{
    const seed=c.firestore();
    await setDoc(doc(seed,'admin_roles','admin1'),{active:true});
    await setDoc(doc(seed,'admin_roles','student'),{active:false});
    await setDoc(doc(seed,'site_content','public'),{
      texts:{welcome:'Modified Welcome',title:'Modified Title','a.b':'Modified Dot'},
      videos:[{title:'Seed video',category:'all',videoUrl:'https://example.invalid/seed',
        posterUrl:'',published:true,createdAt:'2026-10-10T00:00:00.000Z',updatedAt:''}],
      settings:{whatsappNumber:'201234567890',telegramUsername:'synthetic_user',updatedAt:''}
    });
    await setDoc(doc(seed,'enrollment_requests','synthetic-lead'),
      {status:'new',fullName:'Synthetic Student',email:'synthetic@example.invalid',submissionDate:'2026-10-10T00:00:00Z'});
    const statuses=['new','contacted','pending','accepted','rejected'];
    for(let offset=0;offset<1002;offset+=450){
      const batch=writeBatch(seed);
      for(let i=offset;i<Math.min(offset+450,1002);i++)batch.set(doc(seed,'enrollment_requests','synthetic-'+String(i).padStart(4,'0')),
        {status:statuses[i%statuses.length],fullName:i<2?'Counter Needle':'Large fixture '+i});
      await batch.commit();
    }
    for(const status of statuses)await setDoc(doc(seed,'assessment_requests','assessment-'+status),
      {status,fullName:'Assessment '+status});
  });
  browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
  context=await browser.newContext({locale:'ar-EG'});
  await context.addInitScript(()=>{window.__uid='admin1';window.__email='admin@example.invalid';window.confirm=()=>true});
  await context.route('**/*',async route=>{
    const url=route.request().url();
    if(url===BASE+'/admin.html')return route.fulfill({body:fs.readFileSync('admin.html','utf8')
      .replace(/<meta[^>]+Content-Security-Policy[^>]*\/>/,'') ,contentType:'text/html'});
    if(url===BASE+'/__integration_firebase.mjs')return route.fulfill({body:bundle,contentType:'text/javascript'});
    if(url.endsWith('/content-registry.js'))return route.fulfill({body:registry,contentType:'text/javascript'});
    if(url.startsWith('https://www.gstatic.com/firebasejs/'))
      return route.fulfill({body:'export * from "'+BASE+'/__integration_firebase.mjs";',
        contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}});
    if(url.startsWith(BASE+'/')||url.startsWith('http://127.0.0.1:'+port+'/'))return route.continue();
    return route.abort('blockedbyclient');
  });
  page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded'});
  const requestLoadStarted=Date.now();
  await login();
  const requestLoadMs=Date.now()-requestLoadStarted;
  const requestReads=await page.evaluate(()=>window.__requestReads||0);
  await page.locator('.nav-btn[data-tab="requests"]').click();
  assert.ok(requestReads>=3,'both server pages plus assessment read before first render');
  assert.equal(await page.locator('#requests-list .item').count(),100,'only first 100 displayed');
  assert.equal(await page.locator('#badge-requests').textContent(),'1008','sidebar badge is total across both collections');
  assert.equal(await page.locator('#stat-requests').textContent(),'1008','overview is total across both collections');
  assert.equal(await page.locator('#overview-new-requests').textContent(),'203','new-only count is separate');
  assert.equal(await page.locator('#request-total-count').textContent(),'1008','all loaded records counted once');
  assert.equal(await page.locator('#request-new-count').textContent(),'203','new-only count matches mixed statuses');
  assert.equal(await page.locator('#request-filtered-count').textContent(),'1008','initial filter matches all loaded requests');

  await page.locator('#request-search').fill('Counter Needle');
  await waitCounter('#request-filtered-count','2');
  await page.locator('#request-status-filter').selectOption('new');
  await waitCounter('#request-filtered-count','1');
  assert.equal(await page.locator('#badge-requests').textContent(),'1008','filters never alter sidebar total');
  await page.locator('#request-status-filter').selectOption('all');
  await waitCounter('#request-filtered-count','2');
  await page.locator('#request-search').fill('no matching synthetic record');
  await waitCounter('#request-filtered-count','0');
  assert.equal(await page.locator('#badge-requests').textContent(),'1008','zero search results do not replace total');
  await page.locator('#request-search').fill('');
  await page.locator('#request-status-filter').selectOption('contacted');
  await waitCounter('#request-filtered-count','202');
  await page.locator('#request-status-filter').selectOption('all');

  // A one-collection read failure must not present a zero or partial total.
  await page.evaluate(()=>window.__failAssessmentRead=true);
  await page.locator('#refresh-requests-btn').click();
  await page.waitForFunction(()=>document.querySelector('#request-counts')?.dataset.state==='partial');
  assert.equal(await page.locator('#request-total-count').textContent(),'غير مكتمل');
  assert.equal(await page.locator('#request-new-count').textContent(),'غير مكتمل');
  assert.equal(await page.locator('#request-filtered-count').textContent(),'غير مكتمل');
  assert.equal(await page.locator('#badge-requests').textContent(),'غير مكتمل');
  assert.match(await page.locator('#requests-list').textContent(),/غير مكتملة/);
  await page.locator('#refresh-requests-btn').click();
  await page.waitForFunction(()=>document.querySelector('#request-counts')?.dataset.state==='complete');
  assert.equal(await page.locator('#request-total-count').textContent(),'1008','successful refresh restores complete total');
  assert.equal(await page.locator('#request-filtered-count').textContent(),'1008','successful refresh restores matching count');
  const initial=await content();
  await selectText('welcome');
  await action(async()=>{
    await page.locator('#text-value').fill('Original Welcome');
    await page.locator('#text-form button[type=submit]').click();
  },'استُعيد النص الأصلي','text.restore',async()=>{
    const now=await content();
    assert.equal(Object.hasOwn(now.texts,'welcome'),false);
    assert.equal(now.texts.title,'Modified Title');
    assert.deepEqual(now.videos,initial.videos);assert.deepEqual(now.settings,initial.settings);
  });
  await selectText('a.b');
  await action(()=>page.locator('#delete-text-btn').click(),'تمت استعادة النص الأصلي','text.restore',async()=>{
    const now=await content();
    assert.equal(Object.hasOwn(now.texts,'a.b'),false);
    assert.equal(now.texts.title,'Modified Title');
  });
  await selectText('title');
  await action(async()=>{
    await page.locator('#text-value').fill('Updated Title');
    await page.locator('#text-form button[type=submit]').click();
  },'تم حفظ النص','text.update',async()=>assert.equal((await content()).texts.title,'Updated Title'));
  await action(async()=>{
    await page.locator('.nav-btn[data-tab="requests"]').click();
    await page.locator('#request-search').fill('Synthetic Student');
  await waitCounter('#request-filtered-count','1');
    const card=page.locator('#requests-list .item').filter({hasText:'Synthetic Student'});
    await card.locator('select.request-status').selectOption('contacted');
  assert.equal(await card.locator('select.request-status').inputValue(),'contacted','status selection is applied before save');
    await card.locator('button.ok').click();
  },'تم تحديث حالة الطلب','request.status',async()=>
    assert.equal((await getDoc(doc(db,'enrollment_requests','synthetic-lead'))).data().status,'contacted'));
  assert.equal(await page.locator('#badge-requests').textContent(),'1008','status update preserves total');
  assert.equal(await page.locator('#request-new-count').textContent(),'202','status update removes one from new count');
  assert.equal(await page.locator('#request-filtered-count').textContent(),'1','status update refreshes active search count');

  // A permission-denied transaction response rolls back the optimistic row UI and leaves counts unchanged.
  const deniedCard=page.locator('#requests-list .item').filter({hasText:'Synthetic Student'});
  const oldPill=await deniedCard.locator('.pill').textContent();
  const auditBeforeDenied=(await audits()).length;
  await page.evaluate(()=>window.__holdAdminRoleListener=true);
  await env.withSecurityRulesDisabled(async c=>updateDoc(doc(c.firestore(),'admin_roles','admin1'),{active:false}));
  await page.waitForFunction(()=>window.__suppressedRoleRevocation===true);
  await deniedCard.locator('select.request-status').selectOption('accepted');
  await deniedCard.locator('button.ok').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.dataset.statusType==='error');
  assert.equal(await deniedCard.locator('.pill').textContent(),oldPill,'rejected write restores prior status label');
  assert.equal(await deniedCard.locator('select.request-status').inputValue(),'contacted','rejected write restores select value');
  await env.withSecurityRulesDisabled(async c=>{
    const privileged=c.firestore();
    assert.equal((await getDoc(doc(privileged,'enrollment_requests','synthetic-lead'))).data().status,'contacted');
    assert.equal((await getDocs(collection(privileged,'admin_audit'))).size,auditBeforeDenied,'rejected write adds no audit record');
  });
  assert.equal(await page.locator('#request-total-count').textContent(),'1008','rejected write leaves total unchanged');
  assert.equal(await page.locator('#request-new-count').textContent(),'202','rejected write leaves new count unchanged');
  assert.equal(await page.locator('#request-filtered-count').textContent(),'1','rejected write leaves filtered count unchanged');
  await env.withSecurityRulesDisabled(async c=>updateDoc(doc(c.firestore(),'admin_roles','admin1'),{active:true}));
  await page.evaluate(()=>window.__holdAdminRoleListener=false);

  // V1R6: a successful REAL Firestore status transaction races an older
  // post-commit request reload against a newer request-only refresh.
  // Only the latest request-loading generation may render or report completion.
  const beforeConcurrentAudit=(await audits()).length;
  await page.evaluate(()=>window.__holdRequestReadOnce=true);
  await deniedCard.locator('select.request-status').selectOption('pending');
  await deniedCard.locator('button.ok').click();
  await page.waitForFunction(()=>window.__requestReadHeld===true);
  assert.equal((await getDoc(doc(db,'enrollment_requests','synthetic-lead'))).data().status,'pending',
    'actual Emulator transaction committed before delayed refresh');
  assert.equal((await audits()).length,beforeConcurrentAudit+1,
    'actual Emulator transaction created exactly one atomic audit');
  await page.locator('#refresh-requests-btn').click();
  await page.waitForFunction(()=>document.querySelector('#request-counts')?.dataset.state==='complete');
  await waitCounter('#request-total-count','1008');
  await waitCounter('#request-new-count','202');
  await waitCounter('#request-filtered-count','1');
  await page.waitForFunction(()=>document.querySelector('#status .status-copy')?.textContent==='تم تحديث الطلبات.');
  await page.evaluate(()=>window.__releaseRequestRead());
  await page.waitForFunction(()=>window.__requestReadHeld===false);
  await page.evaluate(async()=>{for(let i=0;i<10;i++)await Promise.resolve()});
  assert.equal(await page.locator('#request-total-count').textContent(),'1008',
    'stale post-commit read cannot replace new request total');
  assert.equal(await page.locator('#request-new-count').textContent(),'202');
  assert.equal(await page.locator('#request-filtered-count').textContent(),'1');
  assert.equal(await page.locator('#status .status-copy').textContent(),'تم تحديث الطلبات.',
    'superseded post-commit refresh cannot overwrite newer toast');
  assert.equal((await getDoc(doc(db,'enrollment_requests','synthetic-lead'))).data().status,'pending');
  assert.equal((await audits()).length,beforeConcurrentAudit+1,
    'overlap does not duplicate audit records');

  // A fully loaded empty pair of collections is a verified zero, distinct from a failed load.
  await env.withSecurityRulesDisabled(async c=>{
    const privileged=c.firestore();
    for(const name of ['enrollment_requests','assessment_requests']){
      const docs=(await getDocs(collection(privileged,name))).docs;
      for(let offset=0;offset<docs.length;offset+=400){
        const batch=writeBatch(privileged);
        docs.slice(offset,offset+400).forEach(snapshot=>batch.delete(snapshot.ref));
        await batch.commit();
      }
    }
  });
  await page.locator('#refresh-requests-btn').click();
  await page.waitForFunction(()=>document.querySelector('#request-counts')?.dataset.state==='complete');
  assert.equal(await page.locator('#badge-requests').textContent(),'0','empty collections display a verified zero total');
  assert.equal(await page.locator('#request-total-count').textContent(),'0');
  assert.equal(await page.locator('#request-new-count').textContent(),'0');
  assert.equal(await page.locator('#request-filtered-count').textContent(),'0');
  assert.match(await page.locator('#requests-list').textContent(),/لا توجد طلبات مطابقة/);
  await action(async()=>{
    await page.locator('.nav-btn[data-tab="videos"]').click();
    await page.locator('#video-title').fill('Created synthetic');
    await page.locator('#video-url').fill('https://example.invalid/video');
    await page.locator('#video-form button[type=submit]').click();
  },'تم حفظ الفيديو','video.create',async()=>assert.equal((await content()).videos.length,2));
  await page.locator('#videos-list .item').last().locator('button').first().click();
  await action(async()=>{
    await page.locator('#video-title').fill('Updated synthetic');
    await page.locator('#video-form button[type=submit]').click();
  },'تم حفظ الفيديو','video.update',async()=>assert.equal((await content()).videos.at(-1).title,'Updated synthetic'));
  await action(()=>page.locator('#videos-list .item').last().locator('button').last().click(),
    'تم حذف بيانات الفيديو','video.delete',async()=>assert.equal((await content()).videos.length,1));
  await action(async()=>{
    await page.locator('.nav-btn[data-tab="settings"]').click();
    await page.locator('#settings-whatsapp').fill('201111111111');
    await page.locator('#contact-settings-form button[type=submit]').click();
  },'تم حفظ إعدادات التواصل','settings.update',async()=>
    assert.equal((await content()).settings.whatsappNumber,'201111111111'));
  const before=(await audits()).length;
  await selectText('title');
  await page.evaluate(()=>window.__failWrite=true);
  await page.locator('#text-value').fill('Rejected network write');
  await page.locator('#text-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.dataset.statusType==='error');
  assert.equal((await content()).texts.title,'Updated Title');
  assert.equal((await audits()).length,before);
  await page.evaluate(()=>window.__failWrite=false);

  // A committed write followed by a failed read must report a refresh warning.
  await selectText('welcome');
  await page.evaluate(()=>window.__failAfterCommit=true);
  const beforeRefresh=(await audits()).length;
  await page.locator('#text-value').fill('Committed despite refresh failure');
  await page.locator('#text-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('تعذر تحديث'));
  assert.equal((await content()).texts.welcome,'Committed despite refresh failure');
  assert.equal((await audits()).length,beforeRefresh+1);
  assert.equal((await page.locator('#status').getAttribute('data-status-type')),'warning');
  await page.evaluate(()=>window.__failAfterCommit=false);
  await page.locator('#refresh-all-btn').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('تم تحديث البيانات بنجاح'));

  // Race a second admin against the real transaction, then observe conflict rejection.
  await selectText('title');
  await page.evaluate(()=>window.__holdTransactionOnce=true);
  const beforeConflict=(await audits()).length;
  await page.locator('#text-value').fill('Stale update');
  await page.locator('#text-form button[type=submit]').click();
  await page.waitForFunction(()=>window.__txPaused===true);
  await updateDoc(doc(db,'site_content','public'),{'texts.title':'Concurrent update'});
  await page.evaluate(()=>window.__resumeTx());
  await page.waitForFunction(()=>document.querySelector('#status')?.dataset.statusType==='error');
  assert.equal((await content()).texts.title,'Concurrent update');
  assert.equal((await audits()).length,beforeConflict);
  await page.locator('#refresh-all-btn').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('تم تحديث البيانات بنجاح'));

  // An unrelated document change causes a genuine SDK transaction retry.
  await selectText('welcome');
  await page.evaluate(()=>{window.__holdTransactionOnce=true;window.__txAttempts=0});
  await page.locator('#text-value').fill('Retry preserved another edit');
  await page.locator('#text-form button[type=submit]').click();
  await page.waitForFunction(()=>window.__txPaused===true);
  await updateDoc(doc(db,'site_content','public'),{'texts.title':'Concurrent other key'});
  await page.evaluate(()=>window.__resumeTx());
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('تم حفظ النص'));
  assert.ok(await page.evaluate(()=>window.__txAttempts)>=2,'real Firestore retry');
  assert.equal((await content()).texts.welcome,'Retry preserved another edit');
  assert.equal((await content()).texts.title,'Concurrent other key');

  await page.locator('#logout-btn').click();
  await page.locator('#login-screen:not(.hidden)').waitFor();
  assert.equal(await privateDomEmpty(),true,'sign-out private DOM');
  await login();
  const finalAuditCount=(await audits()).length;
  await selectText('title');
  await page.evaluate(()=>window.__holdTransactionOnce=true);
  await page.locator('#text-value').fill('Forbidden after revocation');
  await page.locator('#text-form button[type=submit]').click();
  await page.waitForFunction(()=>window.__txPaused===true);
  await env.withSecurityRulesDisabled(async c=>{
    await updateDoc(doc(c.firestore(),'admin_roles','admin1'),{active:false});
  });
  await page.evaluate(()=>window.__resumeTx());
  await page.waitForFunction(()=>document.querySelector('#admin-dashboard')?.classList.contains('hidden'));
  assert.equal(await privateDomEmpty(),true,'revocation private DOM');
  await env.withSecurityRulesDisabled(async c=>{
    const privileged=c.firestore();
    assert.equal((await getDocs(collection(privileged,'admin_audit'))).size,finalAuditCount);
    assert.equal((await getDoc(doc(privileged,'site_content','public'))).data().texts.title,'Concurrent other key');
  });
  await assertFails(getDocs(collection(env.authenticatedContext('student',{email:'student@example.invalid'}).firestore(),'enrollment_requests')));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',actualHandlers:true,realEmulatorTransactions:true,
    auditEvents:finalAuditCount,privateDomCleared:true,networkFailureDenied:true,
    requestCounters:{syntheticRecords:1008,initialTotal:1008,initialNew:203,searchMatches:2,combinedMatches:1,
      permissionDeniedRollback:true,partialLoadMarkedIncomplete:true,verifiedEmptyTotal:0},
    pagination:{syntheticEnrollmentRecords:1003,serverReadsBeforeFirst100:requestReads,
      initialSignInAndLoadMs:requestLoadMs,initialRenderedRows:100}}));
}finally{
  await context?.close();await browser?.close();await env?.cleanup();
}
