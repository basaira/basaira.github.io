// Execute the frozen Admin client against one frozen ruleset in a dedicated emulator.
// Authentication is synthetic; Firestore operations and security rules are real.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {initializeTestEnvironment, assertFails} from '@firebase/rules-unit-testing';
import {collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch} from 'firebase/firestore';

const OLD='2fd0973b2ff68f0ba960ff2aa83d3520d9c3c243';
const NEW='aa7cdd9698914e212eef2956df0fbf62a06c94c0';
const blobs={
  old:{'admin.js':'90c86f2b3010f1392a92626f3b76e8a11ee59c74',
    'firestore.rules':'40f80ac892bfa03f90b933d6c26d51d4a513b6c6'},
  new:{'admin.js':'b41ff9047a9a767741e0c97f9aa2fc67ff0ac1e6',
    'firestore.rules':'ea30c6d8b74e428d783a58d9a8fd5681ef723d76'}
};
const pair=process.env.TEST_PAIR;
const variants={A:['old','old'],B:['old','new'],C:['new','old'],D:['new','new']};
assert.ok(Object.hasOwn(variants,pair),'TEST_PAIR must be A, B, C or D');
const [clientKind,ruleKind]=variants[pair];
const endpoint=process.env.FIRESTORE_EMULATOR_HOST;
assert.match(endpoint||'',/^127\.0\.0\.1:\d+$/,'loopback Firestore Emulator required');
const port=Number(endpoint.split(':')[1]);
const projectId=`demo-basair-compat-${pair.toLowerCase()}`;
assert.equal(process.env.GCLOUD_PROJECT||projectId,projectId,'wrong emulator project');
const BASE='http://127.0.0.1:4179';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'});
const revision=kind=>kind==='old'?OLD:NEW;
for(const kind of ['old','new'])for(const [path,expected] of Object.entries(blobs[kind]))
  assert.equal(git('rev-parse',`${revision(kind)}:${path}`).trim(),expected,`${kind} ${path} identity`);
assert.equal(git('rev-parse',`${OLD}:admin.html`).trim(),'8a57f75206a5088db783705208886b693caef2eb');
assert.equal(git('rev-parse',`${NEW}:admin.html`).trim(),'8a57f75206a5088db783705208886b693caef2eb');
const client=git('show',`${revision(clientKind)}:admin.js`);
const rules=git('show',`${revision(ruleKind)}:firestore.rules`);
const html=git('show',`${revision(clientKind)}:admin.html`);

// The real Firebase Firestore SDK is bundled locally. Only the external Auth
// provider is simulated. The SDK is connected before any application reads.
// Wrappers hold a pending SDK operation for the role-revocation race; they do
// not implement, decide or bypass the application transaction/batch.
const shim=[
  "import {initializeApp as app} from 'firebase/app';",
  "import * as f from 'firebase/firestore';",
  `export const initializeApp=()=>app({projectId:'${projectId}',apiKey:'synthetic',appId:'synthetic'});`,
  `export function initializeFirestore(a,o){const db=f.initializeFirestore(a,o);f.connectFirestoreEmulator(db,'127.0.0.1',${port},{mockUserToken:window.__identity.email?{sub:window.__identity.uid,email:window.__identity.email}:{sub:window.__identity.uid}});return db}`,
  "export const {collection,doc,serverTimestamp,query,orderBy,documentId,startAfter,onSnapshot,limit}=f;",
  "export const getDoc=f.getDoc;export const getDocs=f.getDocs;",
  "async function pending(){if(window.__holdWrite){window.__holdWrite=false;window.__paused=true;await new Promise(resolve=>window.__resumeWrite=resolve);window.__paused=false}}",
  "export function writeBatch(db){const b=f.writeBatch(db);return new Proxy(b,{get(t,p){if(p==='commit')return async()=>{await pending();const result=await t.commit();window.__commits=(window.__commits||0)+1;return result};const v=t[p];return typeof v==='function'?v.bind(t):v}})}",
  "export async function runTransaction(db,fn){const result=await f.runTransaction(db,async tx=>{const value=await fn(tx);await pending();return value});window.__commits=(window.__commits||0)+1;return result}",
  "export class GoogleAuthProvider{setCustomParameters(){}}",
  "export const browserLocalPersistence={};export const setPersistence=async()=>{};",
  "export const getAuth=()=>window.__auth||(window.__auth={currentUser:window.__identity.preauth?{uid:window.__identity.uid,email:window.__identity.email}:null,cb:null});",
  "export function onAuthStateChanged(a,cb){a.cb=cb;queueMicrotask(()=>cb(a.currentUser));return ()=>{a.cb=null}}",
  "export async function signInWithEmailAndPassword(a,email){a.currentUser={uid:window.__identity.uid,email};void a.cb(a.currentUser);return {user:a.currentUser}}",
  "export const signInWithPopup=a=>signInWithEmailAndPassword(a,'admin@example.invalid');",
  "export async function signOut(a){a.currentUser=null;void a.cb(null)}"
].join('\n');
const bundle=(await build({stdin:{contents:shim,resolveDir:process.cwd(),sourcefile:'isolated-emulator-sdk.mjs'},
  bundle:true,write:false,format:'esm',platform:'browser'})).outputFiles[0].text;
const registry="export default {items:[{id:'welcome',text:'Original Welcome',lang:'en',section:'home',page:'index.html'},{id:'title',text:'Original Title',lang:'en',section:'home',page:'index.html'}]}";

let env,browser,db;
const unexpectedExternal=[];
const readContent=async()=>(await getDoc(doc(db,'site_content','public'))).data();
const readRequest=async id=>(await getDoc(doc(db,'enrollment_requests',id))).data();
const readAudits=async()=> (await getDocs(collection(db,'admin_audit'))).docs.map(d=>d.data());
async function browserFor(identity){
  const context=await browser.newContext({locale:'ar-EG'});
  await context.addInitScript(value=>{window.__identity=value;window.confirm=()=>true},identity);
  await context.route('**/*',async route=>{
    const url=route.request().url();
    if(url===BASE+'/admin.html')return route.fulfill({body:html.replace(/<meta[^>]+Content-Security-Policy[^>]*\/>/,'') ,contentType:'text/html'});
    if(url.startsWith(BASE+'/admin.js?'))return route.fulfill({body:client,contentType:'text/javascript'});
    if(url===BASE+'/firebase-config.js')return route.fulfill({body:`export const firebaseConfig={projectId:'${projectId}',apiKey:'synthetic',appId:'synthetic'};export const FIREBASE_PROJECT_ID='${projectId}';`,contentType:'text/javascript'});
    if(url===BASE+'/content-registry.js')return route.fulfill({body:registry,contentType:'text/javascript'});
    if(url===BASE+'/__compat_sdk.mjs')return route.fulfill({body:bundle,contentType:'text/javascript'});
    if(url.startsWith('https://www.gstatic.com/firebasejs/'))return route.fulfill({body:`export * from '${BASE}/__compat_sdk.mjs';`,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}});
    if(url.startsWith(BASE+'/')||url.startsWith(`http://127.0.0.1:${port}/`))return route.continue();
    if(!url.startsWith('https://fonts.googleapis.com/')&&!url.startsWith('https://fonts.gstatic.com/'))
      unexpectedExternal.push(url);
    return route.abort('blockedbyclient');
  });
  const page=await context.newPage();
  await page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded'});
  return {page,context};
}
async function status(page,type){
  await page.waitForFunction(t=>document.querySelector('#status')?.dataset.statusType===t,type,{timeout:20000});
}
async function action(page,click,kind,verify){
  const before=await readAudits();
  const committed=await page.evaluate(()=>window.__commits||0);
  await click();
  const receipt={
    'request.status':'تم تحديث حالة الطلب','text.update':'تم حفظ النص',
    'text.restore':'النص','video.create':'تم حفظ الفيديو',
    'video.update':'تم حفظ الفيديو','video.delete':'تم حذف بيانات الفيديو',
    'settings.update':'تم حفظ إعدادات التواصل'
  }[kind];
  await page.waitForFunction(([n,previous])=>(window.__commits||0)>previous &&
    document.querySelector('#status')?.dataset.statusType==='success' &&
    document.querySelector('#status')?.textContent.includes(n),[receipt,committed],{timeout:20000});
  const after=await readAudits();
  assert.equal(after.length,before.length+1,`${pair} ${kind} audit atomicity`);
  assert.equal(after.filter(e=>e.action===kind).length,before.filter(e=>e.action===kind).length+1);
  assert.equal(after.at(-1)?.actorUid,'admin1');
  await verify();
}
async function selectText(page,id){
  await page.locator('.nav-btn[data-tab="texts"]').click();
  await page.locator('#text-search').fill(id);
  await page.locator('#texts-list .item').first().click();
  assert.equal(await page.locator('#text-id').inputValue(),id);
}
async function updateStatus(page,lead,next){
  await page.locator('.nav-btn[data-tab="requests"]').click();
  const card=page.locator('#requests-list .item').filter({hasText:lead});
  await card.locator('select.request-status').selectOption(next);
  await card.locator('button.ok').click();
}
async function unauthorized(identity){
  const {page,context}=await browserFor(identity);
  try{
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('لا يملك صلاحية') ||
      document.querySelector('#status')?.textContent.includes('ليس مديرًا'),null,{timeout:20000});
    assert.equal(await page.locator('#admin-dashboard').evaluate(e=>e.classList.contains('hidden')),true);
  }finally{await context.close()}
  const outsider=identity.uid==='student'?env.authenticatedContext('student',{email:'student@example.invalid'}).firestore():
    env.authenticatedContext('inactive',{email:'inactive@example.invalid'}).firestore();
  await assertFails(getDocs(collection(outsider,'enrollment_requests')));
  const before=await readAudits();
  const original=await readRequest('email-lead');
  const batch=writeBatch(outsider);
  batch.update(doc(outsider,'enrollment_requests','email-lead'),{status:'accepted',handledBy:identity.uid});
  batch.set(doc(outsider,'admin_audit','denied-'+identity.uid),{actorUid:identity.uid,action:'request.status'});
  await assertFails(batch.commit());
  assert.deepEqual(await readRequest('email-lead'),original);
  assert.equal((await readAudits()).length,before.length);
}

try{
  env=await initializeTestEnvironment({projectId,firestore:{rules}});
  db=env.authenticatedContext('admin1',{email:'admin@example.invalid'}).firestore();
  await env.withSecurityRulesDisabled(async c=>{
    const seed=c.firestore();
    await setDoc(doc(seed,'admin_roles','admin1'),{active:true});
    await setDoc(doc(seed,'admin_roles','adminNoEmail'),{active:true});
    await setDoc(doc(seed,'admin_roles','inactive'),{active:false});
    await setDoc(doc(seed,'site_content','public'),{
      texts:{welcome:'Modified Welcome',title:'Modified Title',keep:'Preserved'},
      videos:[{title:'Seed',category:'all',videoUrl:'https://example.invalid/seed',posterUrl:'',published:true,createdAt:'synthetic',updatedAt:''}],
      settings:{whatsappNumber:'201234567890',telegramUsername:'synthetic_user',updatedAt:''}
    });
    await setDoc(doc(seed,'enrollment_requests','email-lead'),{status:'new',fullName:'Synthetic Email Lead'});
    await setDoc(doc(seed,'enrollment_requests','noemail-lead'),{status:'new',fullName:'Synthetic No Email Lead'});
  });
  browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
  const guest=env.unauthenticatedContext().firestore();
  await assertFails(getDocs(collection(guest,'enrollment_requests')));
  await assertFails(setDoc(doc(guest,'site_content','public'),{texts:{welcome:'unauthorized'}},{merge:true}));
  for(const identity of [{uid:'student',email:'student@example.invalid',preauth:true},
    {uid:'inactive',email:'inactive@example.invalid',preauth:true}])await unauthorized(identity);
  const {page,context}=await browserFor({uid:'admin1',email:'admin@example.invalid',preauth:true});
  try{
    await page.locator('#admin-dashboard:not(.hidden)').waitFor();
    await page.waitForFunction(()=>document.querySelector('#requests-list')?.textContent.includes('Synthetic Email Lead'));
    const initial=await readContent();
    if(pair==='B'){
      const before=await readAudits();
      await updateStatus(page,'Synthetic Email Lead','contacted');
      await status(page,'error');
      assert.equal((await readRequest('email-lead')).status,'new');
      assert.equal((await readAudits()).length,before.length,'denied batch must create no audit');
      assert.notEqual(await page.locator('#status').getAttribute('data-status-type'),'success');
    }else await action(page,()=>updateStatus(page,'Synthetic Email Lead','contacted'),'request.status',async()=>{
      const now=await readRequest('email-lead');
      assert.equal(now.status,'contacted');
      assert.equal(now.handledBy,clientKind==='old'?'admin@example.invalid':'admin1');
    });

    await selectText(page,'title');
    await action(page,async()=>{
      await page.locator('#text-value').fill('Updated Title');
      await page.locator('#text-form button[type=submit]').click();
    },'text.update',async()=>{
      assert.equal((await readContent()).texts.title,'Updated Title');
      assert.equal((await readContent()).texts.keep,'Preserved');
    });
    await selectText(page,'welcome');
    await action(page,async()=>{
      await page.locator('#text-value').fill('Original Welcome');
      await page.locator('#text-form button[type=submit]').click();
    },'text.restore',async()=>{
      const now=await readContent();
      assert.equal(Object.hasOwn(now.texts,'welcome'),clientKind==='old','old nested merge restore defect');
      assert.equal(now.texts.keep,'Preserved');
      assert.deepEqual(now.videos,initial.videos);
      assert.deepEqual(now.settings,initial.settings);
    });
    await selectText(page,'title');
    await action(page,()=>page.locator('#delete-text-btn').click(),'text.restore',async()=>{
      const now=await readContent();
      assert.equal(Object.hasOwn(now.texts,'title'),clientKind==='old','deleteText restore behavior');
      assert.equal(now.texts.keep,'Preserved');
    });
    await page.locator('.nav-btn[data-tab="videos"]').click();
    await action(page,async()=>{
      await page.locator('#video-title').fill('Created synthetic');
      await page.locator('#video-url').fill('https://example.invalid/video');
      await page.locator('#video-form button[type=submit]').click();
    },'video.create',async()=>assert.equal((await readContent()).videos.length,2));
    await page.locator('#videos-list .item').last().locator('button').first().click();
    await action(page,async()=>{
      await page.locator('#video-title').fill('Updated synthetic');
      await page.locator('#video-form button[type=submit]').click();
    },'video.update',async()=>assert.equal((await readContent()).videos.at(-1).title,'Updated synthetic'));
    await action(page,()=>page.locator('#videos-list .item').last().locator('button').last().click(),
      'video.delete',async()=>assert.equal((await readContent()).videos.length,1));
    await action(page,async()=>{
      await page.locator('.nav-btn[data-tab="settings"]').click();
      await page.locator('#settings-whatsapp').fill('201111111111');
      await page.locator('#contact-settings-form button[type=submit]').click();
    },'settings.update',async()=>assert.equal((await readContent()).settings.whatsappNumber,'201111111111'));

    // A real SDK batch/transaction is paused before commit, then the role is
    // revoked independently. Security rules must reject both data and audit.
    await selectText(page,'title');
    const before=await readAudits(),contentBefore=await readContent();
    await page.evaluate(()=>window.__holdWrite=true);
    await page.locator('#text-value').fill('Forbidden after revocation');
    await page.locator('#text-form button[type=submit]').click();
    await page.waitForFunction(()=>window.__paused===true);
    await env.withSecurityRulesDisabled(async c=>updateDoc(doc(c.firestore(),'admin_roles','admin1'),{active:false}));
    await page.evaluate(()=>window.__resumeWrite());
    await status(page,'error');
    await env.withSecurityRulesDisabled(async c=>{
      const privileged=c.firestore();
      assert.deepEqual((await getDoc(doc(privileged,'site_content','public'))).data(),contentBefore);
      assert.equal((await getDocs(collection(privileged,'admin_audit'))).size,before.length);
    });
    await assertFails(getDocs(collection(db,'enrollment_requests')));
    if(clientKind==='new'){
      await page.locator('#admin-dashboard.hidden').waitFor();
      assert.equal(await page.locator('#requests-list').textContent(),'');
    }else{
      assert.equal(await page.locator('#admin-dashboard').evaluate(e=>e.classList.contains('hidden')),false,
        'old client leaves already rendered private DOM visible after remote revocation');
    }
  }finally{await context.close()}

  // The missing-email case distinguishes the old client's UID fallback from
  // its ordinary email attribution. It has its own active role and request.
  const noEmail=env.authenticatedContext('adminNoEmail').firestore();
  const {page:second,context:secondContext}=await browserFor({uid:'adminNoEmail',email:null,preauth:true});
  try{
    const browserErrors=[];
    second.on('pageerror',error=>browserErrors.push(String(error)));
    await second.locator('#admin-dashboard:not(.hidden)').waitFor();
    await second.waitForFunction(()=>document.querySelector('#requests-list')?.textContent.includes('Synthetic No Email Lead'));
    const before=(await getDocs(collection(noEmail,'admin_audit'))).size;
    await updateStatus(second,'Synthetic No Email Lead','contacted');
    try{
      await second.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('تم تحديث حالة الطلب') ||
        document.querySelector('#status')?.dataset.statusType==='error',null,{timeout:15000});
    }catch(error){
      const ui=await second.locator('#status').evaluate(e=>({text:e.textContent,type:e.dataset.statusType}));
      const request=(await getDoc(doc(noEmail,'enrollment_requests','noemail-lead'))).data();
      const auditCount=(await getDocs(collection(noEmail,'admin_audit'))).size;
      throw Error(`No-email Admin handler stalled: ${JSON.stringify({ui,request,auditCount,before,browserErrors})}`,{cause:error});
    }
    const ui=await second.locator('#status').evaluate(e=>({text:e.textContent,type:e.dataset.statusType}));
    if(ui.type==='error'){
      const request=(await getDoc(doc(noEmail,'enrollment_requests','noemail-lead'))).data();
      const auditCount=(await getDocs(collection(noEmail,'admin_audit'))).size;
      throw Error(`No-email Admin status denied: ${JSON.stringify({ui,request,auditCount,before,browserErrors})}`);
    }
    assert.equal((await getDoc(doc(noEmail,'enrollment_requests','noemail-lead'))).data().handledBy,'adminNoEmail');
    assert.equal((await getDocs(collection(noEmail,'admin_audit'))).size,before+1);
  }finally{await secondContext.close()}
  assert.deepEqual(unexpectedExternal,[],'any non-loopback Firebase endpoint or unexpected request aborts the test');
  console.log(JSON.stringify({result:'PASS',pair,client:clientKind,rules:ruleKind,
    expectedEmailStatusDenial:pair==='B',oldRestoreDefect:clientKind==='old',
    actualAdminHandlers:true,realFirestoreSDK:true,projectId}));
}finally{await browser?.close();await env?.cleanup()}
