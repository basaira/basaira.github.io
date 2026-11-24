// V1R10-R1: actual disposable Admin package, real HTTP headers, real Chromium iframe checks.
// No emulator/production Firebase API traffic, credentials, deployments or source rewrites.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';

const requireTools=createRequire(path.join(process.env.BASAIR_TEST_TOOLS||process.cwd(),'loader.cjs'));
const {chromium}=requireTools('playwright');
const root=path.resolve(process.env.BASAIR_ADMIN_ONLY_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r10r1-admin-only'));
const manifest=JSON.parse(fs.readFileSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r10r1-asset-manifest.json'),'utf8'));
assert.equal(manifest.noMissingAssets,true);
assert.ok(manifest.files.length>2);
const ports={protected:4179,attacker:4180,unprotected:4181};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const contentPath=url=>{
 const uri=new URL(url,'http://localhost'),decoded=decodeURIComponent(uri.pathname);
 const rel=decoded.replace(/^\/+/, '');
 assert.ok(rel && !rel.split('/').includes('..'),'invalid test fixture path');
 return path.join(root,rel);
};
function startServer(port,protectedHeader){
 const server=http.createServer((req,res)=>{
  if(port===ports.attacker){
   const mode=new URL(req.url,'http://localhost').searchParams.get('mode');
   if(!['protected','unprotected'].includes(mode)){res.writeHead(404);res.end('unknown mode');return}
   const frameSrc='http://127.0.0.1:'+(mode==='protected'?ports.protected:ports.unprotected)+'/admin.html';
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end('<!doctype html><html><body><h1>cross origin frame proof</h1><iframe id="test-frame" src="'+frameSrc+'" width="890" height="600"></iframe></body></html>');
   return;
  }
  let resolved;
  try{resolved=contentPath(req.url)}catch{res.writeHead(400);res.end('invalid path');return}
  if(!resolved.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  if(!fs.existsSync(resolved)||!fs.statSync(resolved).isFile()){res.writeHead(404);res.end('missing local asset');return}
  const headers={'Content-Type':types[path.extname(resolved)]||'application/octet-stream','Cache-Control':'no-store'};
  if(protectedHeader && new URL(req.url,'http://localhost').pathname==='/admin.html'){
   headers['Content-Security-Policy']="frame-ancestors 'none'";
   headers['X-Frame-Options']='DENY';
  }
  res.writeHead(200,headers);fs.createReadStream(resolved).pipe(res);
 });
 return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>resolve(server))});
}
const servers=[];
const result={realBrowser:'chromium',actualAdminBuiltPackage:true,syntheticFirebaseData:false,realProductionAuth:false,localOnly:true};
const browserFindings={};
const browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
try{
 for(const mode of [['protected',true],['attacker',false],['unprotected',false]]){
  servers.push(await startServer(ports[mode[0]],mode[1]));
 }
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'ar-EG',serviceWorkers:'block'});
 const denied=[],sdkResponses=[],localResponses=[],failures=[],consoleMessages=[],pageErrors=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='127.0.0.1' && Object.values(ports).includes(Number(url.port)))return route.continue();
  if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/12.15.0/'))return route.continue();
  if((url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com')&&route.request().method()==='GET')return route.continue();
  denied.push({url:route.request().url(),method:route.request().method()});
  return route.abort('blockedbyclient');
 });
 const page=await context.newPage();
 page.on('response',res=>{
  const u=res.url();if(u.startsWith('http://127.0.0.1:'))localResponses.push({url:u,status:res.status(),headers:res.headers()});
  if(/^https:\/\/www\.gstatic\.com\/firebasejs\/12\.15\.0\/firebase-(app|auth|firestore)\.js$/.test(u))sdkResponses.push({url:u,status:res.status()});
 });
 page.on('console',v=>{if(v.type()==='error'||v.type()==='warning')consoleMessages.push({type:v.type(),text:v.text().slice(0,650)})});
 page.on('pageerror',e=>pageErrors.push(String(e)));
 page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
 const response=await page.goto('http://127.0.0.1:4179/admin.html',{waitUntil:'domcontentloaded',timeout:50000});
 assert.equal(response.status(),200);
 assert.equal(response.headers()['content-security-policy'],"frame-ancestors 'none'");
 assert.equal(response.headers()['x-frame-options'],'DENY');
 await page.locator('#login-screen:not(.hidden)').waitFor({timeout:17000});
 await page.waitForTimeout(2300);
 const smoke=await page.evaluate(()=>{
  const ids=['request-counts','request-total-count','request-new-count','request-filtered-count','request-search','request-status-filter','email-login-btn','google-login-btn','admin-dashboard','login-screen'];
  return {
   rtl:getComputedStyle(document.documentElement).direction,
   lang:document.documentElement.lang,
   overflow:document.documentElement.scrollWidth-window.innerWidth,
   loginVisible:!document.getElementById('login-screen')?.classList.contains('hidden'),
   dashboardHidden:document.getElementById('admin-dashboard')?.classList.contains('hidden'),
   ids:Object.fromEntries(ids.map(id=>[id,!!document.getElementById(id)])),
   countText:document.getElementById('request-counts')?.textContent||'',
   originalMeta:document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')||''
  };
 });
 assert.equal(smoke.rtl,'rtl');assert.equal(smoke.lang,'ar');
 assert.ok(smoke.overflow<=2,'horizontal overflow');
 assert.ok(smoke.loginVisible && smoke.dashboardHidden,'unexpected Auth UI state');
 assert.ok(Object.values(smoke.ids).every(Boolean),'required Admin UI element missing');
 assert.ok(smoke.countText.includes('الإجمالي')&&smoke.countText.includes('طلبات جديدة')&&smoke.countText.includes('المطابق'),'counter distinction missing');
 assert.equal(smoke.originalMeta,manifest.protectedMetaPolicy.match(/content="([^"]+)"/i)?.[1],'original Admin CSP content changed');
 assert.equal(pageErrors.length,0,'unexpected JS page errors: '+pageErrors.join(';'));
 const localBad=localResponses.filter(x=>x.status>=400);
 assert.deepEqual(localBad,[],'missing/failed local Admin assets');
 // CSP meta remains enforceable for scripts while HTTP adds frame ancestor policy.
 await page.evaluate(()=>{const s=document.createElement('script');s.textContent='window.__unauthorizedInlineRan=true';document.head.append(s)});
 const ran=await page.evaluate(()=>window.__unauthorizedInlineRan===true);
 assert.equal(ran,false,'original script-src unexpectedly weakened');
 browserFindings.protectedTopLevel={headers:response.headers(),smoke,localRequests:localResponses.length,
  localBad,realSdkResponses:sdkResponses,failedRequests:failures,deniedExternalRequests:denied,pageErrors,consoleErrors:consoleMessages};
 await context.close();

 const probes=[];
 for(const mode of ['unprotected','protected']){
  const ctx=await browser.newContext({viewport:{width:1100,height:800},serviceWorkers:'block'});
  // Contain all external traffic while permitting test-only loopback.
  await ctx.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='127.0.0.1'&&Object.values(ports).includes(Number(u.port)))return route.continue();
   return route.abort('blockedbyclient');
  });
  const targetPort=mode==='protected'?ports.protected:ports.unprotected;
  const observed={mode,targetPort,console:[],responses:[],failed:[],navigations:[]};
  const p=await ctx.newPage();
  p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')observed.console.push(m.text().slice(0,850))});
  p.on('frameattached',f=>observed.navigations.push({event:'attached',url:f.url()}));
  p.on('framenavigated',f=>observed.navigations.push({event:'navigated',url:f.url()}));
  p.on('response',resp=>{if(resp.url().includes('/admin.html'))observed.responses.push({url:resp.url(),status:resp.status(),headers:resp.headers()})});
  p.on('requestfailed',q=>observed.failed.push({url:q.url(),error:q.failure()?.errorText}));
  const parent=await p.goto('http://127.0.0.1:4180/?mode='+mode,{waitUntil:'domcontentloaded',timeout:15000});
  assert.equal(parent.status(),200);
  await p.waitForTimeout(3300);
  const f=p.frames().find(fr=>fr.url()==='http://127.0.0.1:'+targetPort+'/admin.html');
  observed.frameDocumentAccessible=!!f && (await f.locator('html').count())>0;
  observed.frameAdminDOM=!!f && (await f.locator('#login-screen').count())>0;
  observed.blockingConsole=observed.console.filter(t=>/Refused to frame|frame-ancestors|X-Frame-Options|frame because/i.test(t));
  observed.response=observed.responses.find(q=>q.url.includes('/admin.html'));
  assert.ok(observed.response && observed.response.status===200,'the frame target was not actually served');
  if(mode==='unprotected'){
   assert.equal(observed.frameAdminDOM,true,'negative control did not embed unprotected Admin');
   assert.ok(!observed.response.headers['content-security-policy'],'negative control accidentally protected');
   assert.ok(!observed.response.headers['x-frame-options'],'negative control has XFO');
  }else{
   assert.equal(observed.response.headers['content-security-policy'],"frame-ancestors 'none'");
   assert.equal(observed.response.headers['x-frame-options'],'DENY');
   assert.equal(observed.frameAdminDOM,false,'protected real Admin was rendered inside cross-origin iframe');
   assert.ok(observed.blockingConsole.length>0,'no Chromium security console evidence of frame rejection');
  }
  probes.push(observed);
  await ctx.close();
 }
 result.browser=browserFindings;
 result.negativeControl=probes[0];result.protectedCrossOrigin=probes[1];
 result.result='PASS_LOCAL_REAL_HTTP_FRAME_PROTECTION_AND_NEGATIVE_CONTROL';
 const reportPath=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v1r10r1-http-frame-proof.json');
 fs.writeFileSync(reportPath,JSON.stringify(result,null,2));
 const names=[...new Set(sdkResponses.filter(x=>x.status===200).map(x=>x.url.split('/').at(-1)))];
 console.log('V1R10R1_FRAME_PROOF='+JSON.stringify({
  result:result.result,
  negativeControl:{httpStatus:probes[0].response.status,iframeContainsRealAdmin:probes[0].frameAdminDOM},
  protected:{httpStatus:probes[1].response.status,headers:{
    csp:probes[1].response.headers['content-security-policy'],xfo:probes[1].response.headers['x-frame-options']},
    iframeContainsRealAdmin:probes[1].frameAdminDOM,
    chromiumSecurityErrors:probes[1].blockingConsole},
  topLevel:{rtl:smoke.rtl,noOverflow:smoke.overflow<=2,countersPresent:true,authPanelVisible:smoke.loginVisible,
    originalMetaUnmodified:true,localAsset404:localBad.length,unexpectedJsErrors:pageErrors.length,
    realGstaticSdkHttp200:names,productionFirebaseRequestsPermitted:false}
 }));
}finally{
 await browser.close();
 await Promise.all(servers.map(s=>new Promise(resolve=>s.close(resolve))));
}
