// V1R12 — RUN ONLY AFTER an operator publishes an explicitly scoped preview.
// READ ONLY / UNAUTHENTICATED. Blocks production Auth and Firestore endpoints.
// Never guessed preview URL; supply exact CLI-provided BASAIR_PREVIEW_URL.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const raw=process.env.BASAIR_PREVIEW_URL;
assert.ok(raw,'Provide exact preview URL returned by Firebase CLI');
const u=new URL(raw);
assert.equal(u.protocol,'https:');
assert.ok(/^basair-admin--[a-z0-9-]+\.web\.app$/.test(u.hostname),
 'Unrecognized preview hostname; refuse production/default Hosting URLs: '+u.hostname);
assert.equal(u.pathname,'/','Provide a bare preview origin; script appends /admin.html');
assert.equal(u.search,'');
assert.equal(u.hash,'');
const origin=u.origin,admin=origin+'/admin.html';
const file=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r12-real-preview-http-browser.json');
const requireTools=createRequire(path.join(process.env.BASAIR_TEST_TOOLS||process.cwd(),'loader.cjs'));
const {chromium}=requireTools('playwright');
const responses=[],consoleMessages=[],pageErrors=[],productionBlocked=[],requestFailures=[];
const server=http.createServer((req,res)=>{
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end('<!doctype html><html><body><iframe id="admin-embed-probe" src="'+admin.replace(/&/g,'&amp;')+'" width="900" height="700"></iframe></body></html>');
});
await new Promise((res,rej)=>{server.once('error',rej);server.listen(4189,'127.0.0.1',res)});
let browser=null;
try{
 browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'ar-EG',serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  const local=url.hostname==='127.0.0.1'&&url.port==='4189';
  const hosting=url.origin===origin;
  const sdk=url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/12.15.0/');
  const fonts=['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)&&req.method()==='GET';
  if(local||hosting||sdk||fonts)return route.continue();
  productionBlocked.push({url:req.url(),method:req.method()});
  return route.abort('blockedbyclient');
 });
 const p=await context.newPage();
 p.on('response',res=>responses.push({url:res.url(),status:res.status(),headers:res.headers()}));
 p.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')consoleMessages.push(msg.text().slice(0,1200))});
 p.on('pageerror',e=>pageErrors.push(String(e)));
 p.on('requestfailed',req=>requestFailures.push({url:req.url(),error:req.failure()?.errorText||'unknown'}));
 const top=await p.goto(admin,{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(top.status(),200,'real Hosting preview Admin did not return HTTP 200');
 const hd=top.headers();
 assert.equal(hd['content-security-policy'],"frame-ancestors 'none'",'missing real Hosting response CSP header');
 assert.equal(hd['x-frame-options'],'DENY','missing real Hosting response XFO');
 await p.locator('#login-screen:not(.hidden)').waitFor({timeout:20000});
 await p.waitForTimeout(1600);
 const state=await p.evaluate(()=>({
   lang:document.documentElement.lang,
   direction:getComputedStyle(document.documentElement).direction,
   overflow:document.documentElement.scrollWidth-window.innerWidth,
   login:!document.getElementById('login-screen')?.classList.contains('hidden'),
   dashboardHidden:document.getElementById('admin-dashboard')?.classList.contains('hidden'),
   counters:['request-counts','request-total-count','request-new-count','request-filtered-count'].every(x=>!!document.getElementById(x)),
   meta:document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')||''
 }));
 assert.equal(state.lang,'ar');assert.equal(state.direction,'rtl');
 assert.ok(state.overflow<=2);
 assert.ok(state.login&&state.dashboardHidden&&state.counters);
 assert.ok(state.meta.includes("script-src 'self' https://www.gstatic.com https://apis.google.com"));
 assert.ok(state.meta.includes("connect-src 'self'"));
 const assets=responses.filter(r=>r.url.startsWith(origin+'/assets/'));
 assert.ok(assets.length>=4,'Admin assets did not load on remote preview');
 assert.deepEqual(assets.filter(x=>x.status!==200),[],'missing/failed preview assets');
 assert.equal(pageErrors.length,0);
 const sdk=[...new Set(responses.filter(r=>r.url.startsWith('https://www.gstatic.com/firebasejs/12.15.0/')&&r.status===200).map(r=>r.url.split('/').at(-1)))];
 assert.ok(['firebase-app.js','firebase-auth.js','firebase-firestore.js'].every(n=>sdk.includes(n)), 'real gstatic Firebase SDK HTTP 200 incomplete');
 const before=consoleMessages.length;
 await p.goto('http://127.0.0.1:4189/',{waitUntil:'domcontentloaded',timeout:18000});
 await p.waitForTimeout(2400);
 const frame=p.frames().find(f=>f.url()===admin);
 const frameAdminDom=!!frame&&(await frame.locator('#login-screen').count())>0;
 assert.equal(frameAdminDom,false,'remote Admin was embedded from separate origin');
 const errors=consoleMessages.slice(before).filter(x=>/Refused to frame|frame-ancestors|X-Frame-Options|frame because/i.test(x));
 assert.ok(errors.length>0,'no browser-level cross-origin framing refusal evidence');
 const extra=responses.filter(x=>x.url===admin);
 assert.ok(extra.length>=2,'iframe did not actually request real preview Admin');
 assert.ok(extra.every(x=>x.headers['content-security-policy']==="frame-ancestors 'none'"));
 const result={
  status:'REMOTE_PREVIEW_HTTP_AND_CHROMIUM_PASS',
  site:'basair-admin',previewOrigin:origin,realFirebaseBackendAccessPermitted:false,
  responseHeaders:{csp:hd['content-security-policy'],xfo:hd['x-frame-options']},
  protectedIframeRejected:true,browserSecurityMessages:errors,
  topLevelState:state,assets:assets.map(x=>({url:x.url,status:x.status})),
  sdkHttp200:sdk,unexpectedPageErrors:pageErrors,
  blockedProductionRequests:productionBlocked,requestFailures:requestFailures.slice(0,30),
  noProductionAuthOrFirestoreDataUsed:true,
  caution:'Successful remote smoke is not proof of authenticated Admin functionality or of Firestore/R0 compatibility.'
 };
 fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 console.log('V1R12_REMOTE_PREVIEW_PROOF='+JSON.stringify({status:result.status,
  origin,protectedIframeRejected:true,htmlHttp:200,assetCount:assets.length,
  sdkHttp200:sdk,productionRequestsAllowed:false,browserErrors:errors}));
 await context.close();
}finally{
 if(browser)await browser.close();
 await new Promise(res=>server.close(res));
}
