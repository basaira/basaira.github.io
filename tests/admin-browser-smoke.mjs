// BASAIR isolated, synthetic, read-only browser verification.
// All external requests are blocked except in-memory Firebase SDK mocks.
import fs from 'node:fs';
import { chromium } from 'playwright';
const BASE='http://127.0.0.1:4179';
const appMock=String.raw`export function initializeApp(){return {name:'synthetic-admin-browser'}}`;
const firestoreMock=String.raw`
export function initializeFirestore(){return {}}
export function doc(_db,...parts){return {path:parts.join('/'),id:parts.at(-1)}}
export function collection(_db,...parts){return {path:parts.join('/')}}
export function query(...args){return {args}}
export function orderBy(){return {}}
export function documentId(){return {}}
export function startAfter(){return {}}
export function limit(){return {}}
export function serverTimestamp(){return {synthetic:true}}
export function writeBatch(){throw Error('Synthetic smoke prohibits all Firestore writes')}
export function runTransaction(){throw Error('Synthetic smoke prohibits all Firestore writes')}
export async function getDocs(){return {docs:[],size:0}}
export async function getDoc(reference){
  if(reference.path.startsWith('admin_roles/')){
    await new Promise(r=>setTimeout(r,window.__mockRoleDelayMs||0));
    const active=window.__mockAdminAllowed!==false;
    return {exists:()=>active,data:()=>({active})};
  }
  return {exists:()=>true,data:()=>({texts:{},videos:[],settings:{}})};
}
export function onSnapshot(ref,ok){
  if(ref.path.startsWith('admin_roles/'))window.__mockRole=(active)=>ok({exists:()=>active,data:()=>({active})});
  return ()=>{window.__mockRole=null};
}
`;
const authMock=String.raw`
export class GoogleAuthProvider{setCustomParameters(){}}
export const browserLocalPersistence={}
export function getAuth(){
  if(!window.__mockAuth)window.__mockAuth={currentUser:null,cb:null};
  return window.__mockAuth;
}
export async function setPersistence(){return undefined}
export function onAuthStateChanged(auth,cb){
  auth.cb=cb;
  queueMicrotask(()=>cb(auth.currentUser));
  return ()=>{auth.cb=null};
}
export async function signInWithEmailAndPassword(auth,email){
  const uid=window.__mockAdminAllowed===false?'student':'admin1';
  auth.currentUser={uid,email};
  void auth.cb(auth.currentUser);
  return {user:auth.currentUser};
}
export async function signInWithPopup(auth){
  return signInWithEmailAndPassword(auth,'synthetic-admin@example.invalid');
}
export async function signOut(auth){
  auth.currentUser=null;
  void auth.cb(null);
}
`;
const modules=new Map([
  ['firebase-app.js',appMock],
  ['firebase-firestore.js',firestoreMock],
  ['firebase-auth.js',authMock]
]);
const browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
const results=[];
let unsafeDispatches=0;
async function newPage(vp,adminAllowed=true){
  const context=await browser.newContext({viewport:vp,locale:'ar-EG',colorScheme:'light',reducedMotion:'reduce'});
  await context.addInitScript(flag=>{window.__mockAdminAllowed=flag;window.__mockRoleDelayMs=0},adminAllowed);
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  await context.route('**/*',async route=>{
    const req=route.request(),url=req.url();
    if(!['GET','HEAD','OPTIONS'].includes(req.method())) {unsafeDispatches++;return route.abort('blockedbyclient')}
    if(url.startsWith(BASE+'/'))return route.continue();
    const name=url.split('/').at(-1).split('?')[0];
    if(url.startsWith('https://www.gstatic.com/firebasejs/')&&modules.has(name)){
      return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:modules.get(name)});
    }
    return route.abort('blockedbyclient');
  });
  return {context,page,pageErrors};
}
async function visit(vp,label){
  const x=await newPage(vp);
  const res=await x.page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:25000});
  await x.page.locator('#login-screen:not(.hidden)').waitFor({timeout:10000});
  const nonAdminHidden=await x.page.locator('#admin-dashboard').evaluate(el=>el.classList.contains('hidden'));
  if(res.status()!==200||!nonAdminHidden)throw Error(label+': authentication gate not closed');
  const initial=await x.page.evaluate(()=>({lang:document.documentElement.lang,dir:getComputedStyle(document.documentElement).direction,overflow:document.documentElement.scrollWidth-innerWidth}));
  if(initial.lang!=='ar'||initial.dir!=='rtl'||initial.overflow>2)throw Error(label+': initial viewport RTL/overflow '+JSON.stringify(initial));
  await x.page.fill('#admin-email','synthetic-admin@example.invalid');
  await x.page.fill('#admin-password','synthetic-passphrase');
  await x.page.locator('#email-login-btn').click();
  await x.page.locator('#admin-dashboard:not(.hidden)').waitFor({timeout:20000});
  await x.page.locator('.nav-btn[data-tab="requests"]').click();
  if(!await x.page.locator('#tab-requests').evaluate(el=>el.classList.contains('active')))throw Error(label+': tab navigation failed');
  const openDashboard=await x.page.locator('#admin-dashboard').isVisible();
  if(!openDashboard)throw Error(label+': active admin dashboard hidden');
  await x.page.evaluate(()=>window.__mockRole?.(false));
  await x.page.waitForFunction(() => document.querySelector('#admin-dashboard')?.classList.contains('hidden'), {timeout:10000});
  if(x.pageErrors.length)throw Error(label+': JS exceptions '+x.pageErrors.join(';'));
  results.push({label,viewport:vp,unauthenticatedDenied:nonAdminHidden,adminNavigable:openDashboard,roleRevocationClosed:true,rtl:true,overflowPx:initial.overflow,pageErrors:0});
  await x.context.close();
}
try{
  for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844],['below760',759,900],['above760',761,900]]){
    await visit({width,height},label);
  }
  const forbidden=await newPage({width:390,height:844},false);
  await forbidden.page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded'});
  await forbidden.page.locator('#login-screen:not(.hidden)').waitFor();
  await forbidden.page.fill('#admin-email','student@example.invalid');
  await forbidden.page.fill('#admin-password','synthetic-passphrase');
  await forbidden.page.locator('#email-login-btn').click();
  await forbidden.page.waitForTimeout(350);
  if(!await forbidden.page.locator('#admin-dashboard').evaluate(el=>el.classList.contains('hidden')))throw Error('non-admin exposed dashboard');
  if(forbidden.pageErrors.length)throw Error('non-admin JS error '+forbidden.pageErrors.join(';'));
  results.push({label:'nonadmin',dashboardDenied:true});
  await forbidden.context.close();
  const race=await newPage({width:390,height:844},true);
  await race.page.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded'});
  await race.page.locator('#login-screen:not(.hidden)').waitFor();
  await race.page.evaluate(()=>{window.__mockRoleDelayMs=350});
  await race.page.fill('#admin-email','admin@example.invalid');
  await race.page.fill('#admin-password','synthetic-passphrase');
  await race.page.locator('#email-login-btn').click();
  await race.page.evaluate(()=>{window.__mockAuth.currentUser=null;void window.__mockAuth.cb(null)});
  await race.page.waitForTimeout(700);
  if(!await race.page.locator('#admin-dashboard').evaluate(el=>el.classList.contains('hidden')))throw Error('stale admin role reopened dashboard');
  results.push({label:'signout-race',staleAuthorizationRejected:true});
  await race.context.close();
  if(unsafeDispatches)throw Error('Blocked mutating outbound attempts occurred: '+unsafeDispatches);
  fs.writeFileSync((process.env.RUNNER_TEMP || '/tmp')+'/admin-browser-results.json',JSON.stringify({results,unsafeDispatches,provider:'SYNTHETIC MOCK — NOT LIVE FIREBASE'},null,2));
  console.log(JSON.stringify({cases:results.length,result:'PASS',unsafeDispatches}));
} finally {await browser.close()}
