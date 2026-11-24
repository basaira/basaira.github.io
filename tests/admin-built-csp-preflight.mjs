// BASAIR V1R8: actual built HTML/CSP in Chromium. No production Auth, Firestore, credentials, or mutation.
// No CSP removal, rewriting, overriding or enforcement bypass. External project APIs are network-denied.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const requireTool = createRequire(path.join(process.env.BASAIR_V1R8_TOOL_DIR || process.cwd(), 'index.cjs'));
const { chromium } = requireTool('playwright');
const base = 'http://127.0.0.1:4179';
const attack = 'http://127.0.0.1:4180';
const html = fs.readFileSync('dist/admin.html','utf8');
const cspMatch = html.match(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/i);
assert.ok(cspMatch, 'built Admin is missing actual CSP meta');
const cspTag = cspMatch[0];
const getDirective = directive => {
  const m = cspTag.match(/content="([^"]+)"/i);
  assert.ok(m, 'built CSP content missing');
  return m[1].split(';').map(v=>v.trim()).find(v=>v.startsWith(directive+' ')) || '';
};
for(const directive of ['script-src','connect-src','frame-src','form-action','object-src','base-uri','upgrade-insecure-requests']){
  assert.ok(getDirective(directive)||cspTag.includes(directive),directive+' missing in the emitted policy');
}
assert.match(cspTag,/frame-ancestors 'none'/,'expected frame-ancestors claim for enforcement test');
const viewportCases=[
 {name:'mobile390',width:390,height:844},
 {name:'breakpoint759',width:759,height:900},
 {name:'breakpoint761',width:761,height:900},
 {name:'desktop1440',width:1440,height:1000}
];
const browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
const cases=[],allConsole=[],allViolations=[],blockedByBoundary=[],actualSdkResponses=[],failedRequests=[];
try {
 for(const vp of viewportCases){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},locale:'ar-EG',serviceWorkers:'block'});
  await context.addInitScript(()=>{
    window.__v1r8CspViolations=[];
    document.addEventListener('securitypolicyviolation',e=>{
      window.__v1r8CspViolations.push({
        effectiveDirective:e.effectiveDirective,violatedDirective:e.violatedDirective,
        blockedURI:e.blockedURI,disposition:e.disposition,sourceFile:e.sourceFile,
        originalPolicy:e.originalPolicy
      });
    });
  });
  const page=await context.newPage();
  const consoleMessages=[];
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')consoleMessages.push({type:m.type(),message:m.text().slice(0,500)})});
  page.on('pageerror',err=>consoleMessages.push({type:'pageerror',message:String(err).slice(0,500)}));
  page.on('requestfailed',req=>failedRequests.push({viewport:vp.name,url:req.url(),failure:req.failure()?.errorText||'unknown'}));
  page.on('response',resp=>{
    if(/^https:\/\/www\.gstatic\.com\/firebasejs\/12\.15\.0\/firebase-(?:app|firestore|auth)\.js(?:\?|$)/.test(resp.url()))
      actualSdkResponses.push({viewport:vp.name,url:resp.url(),status:resp.status(),contentType:resp.headers()['content-type']||''});
  });
  await context.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.hostname==='127.0.0.1'&&[4179,4180].includes(Number(u.port)))return route.continue();
    if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/12.15.0/'))return route.continue();
    if((u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com')&&req.method()==='GET')return route.continue();
    // Deny actual Firebase project/Auth/Firestore transport, and all other external hosts.
    blockedByBoundary.push({url:req.url(),method:req.method(),viewport:vp.name});
    return route.abort('blockedbyclient');
  });
  const response=await page.goto(base+'/admin.html',{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(response.status(),200,'built Admin entrypoint not served');
  await page.locator('#login-screen:not(.hidden)').waitFor({timeout:12000});
  await page.waitForTimeout(vp.name==='mobile390'?9000:2500);
  const initial=await page.evaluate(()=>{
    const ids=['request-total-count','request-new-count','request-filtered-count','request-counts','request-search','request-status-filter','email-login-btn','google-login-btn'];
    return {
      lang:document.documentElement.lang,
      rtl:getComputedStyle(document.documentElement).direction,
      overflowPx:document.documentElement.scrollWidth-window.innerWidth,
      bodyOverflowPx:document.body.scrollWidth-window.innerWidth,
      loginVisible:!document.querySelector('#login-screen')?.classList.contains('hidden'),
      dashboardHidden:document.querySelector('#admin-dashboard')?.classList.contains('hidden'),
      elements:Object.fromEntries(ids.map(id=>[id,!!document.getElementById(id)])),
      counterLabels:document.getElementById('request-counts')?.textContent?.slice(0,180),
      scripts:[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')),
      stylesheetLinks:[...document.querySelectorAll('link[rel="stylesheet"]')].map(s=>s.getAttribute('href')),
      policy:document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')
    };
  });
  assert.equal(initial.lang,'ar');
  assert.equal(initial.rtl,'rtl');
  assert.equal(initial.loginVisible,true);
  assert.equal(initial.dashboardHidden,true);
  assert.ok(initial.overflowPx<=2,'horizontal overflow '+vp.name+': '+initial.overflowPx);
  assert.ok(initial.bodyOverflowPx<=2,'body horizontal overflow '+vp.name+': '+initial.bodyOverflowPx);
  assert.ok(Object.values(initial.elements).every(Boolean),'missing counter/auth elements '+vp.name);
  assert.ok(initial.counterLabels.includes('الإجمالي')&&initial.counterLabels.includes('طلبات جديدة'),'counter distinction lost');
  assert.ok(initial.policy&&initial.policy.includes("frame-ancestors 'none'"),'original meta CSP not preserved');
  const input=page.locator('#admin-email');
  await input.focus();
  assert.equal(await input.evaluate(el=>document.activeElement===el),true,'email keyboard focus broken');
  const focus=await input.evaluate(el=>({outlineStyle:getComputedStyle(el).outlineStyle,outlineWidth:getComputedStyle(el).outlineWidth}));
  // Test actual inline-script denial under the production-emitted CSP.
  if(vp.name==='mobile390'){
    await page.evaluate(()=>{
      const tag=document.createElement('script');
      tag.textContent='window.__v1r8UnauthorizedInlineExecuted=true;';
      document.head.append(tag);
    });
    const executed=await page.evaluate(()=>window.__v1r8UnauthorizedInlineExecuted===true);
    assert.equal(executed,false,'CSP allowed unauthorized inline execution');
    // Probe browser-enforced effective directives with unreachable, never-contacted
    // example.invalid resources. Network routing denies anything unexpected.
    await page.evaluate(()=>{
      const origin='https://example.invalid';
      const object=document.createElement('object');
      object.data=origin+'/object-probe';document.body.append(object);
      const frame=document.createElement('iframe');
      frame.src=origin+'/frame-probe';document.body.append(frame);
      const baseTag=document.createElement('base');
      baseTag.href=origin+'/base-probe/';document.head.append(baseTag);
      void fetch(origin+'/connect-probe').catch(()=>{});
      const form=document.createElement('form');
      form.method='post';form.action=origin+'/form-probe';document.body.append(form);
      form.requestSubmit();
    });
    await page.waitForTimeout(900);
  }
  const violations=await page.evaluate(()=>window.__v1r8CspViolations);
  if(vp.name==='mobile390'){
    const enforced=new Set(violations.map(v=>v.effectiveDirective));
    for(const directive of ['script-src-elem','object-src','frame-src','base-uri','connect-src','form-action']){
      assert.ok(enforced.has(directive),'browser did not record enforcement of '+directive+'; observed='+JSON.stringify([...enforced]));
    }
  }
  cases.push({viewport:vp.name,width:vp.width,height:vp.height,overflowPx:initial.overflowPx,bodyOverflowPx:initial.bodyOverflowPx,
    loginVisible:initial.loginVisible,dashboardHidden:initial.dashboardHidden,focus,counterLabels:initial.counterLabels,
    policy:initial.policy,scriptPaths:initial.scripts,stylesheets:initial.stylesheetLinks,
    cspViolations:violations,console:consoleMessages});
  allConsole.push(...consoleMessages.map(x=>({...x,viewport:vp.name})));
  allViolations.push(...violations.map(x=>({...x,viewport:vp.name})));
  await context.close();
 }
 // Cross-origin framing from a separate local port. The local HTTP test servers
 // provide no X-Frame-Options or CSP response header; this specifically tests
 // whether the *meta policy itself* enforces frame-ancestors (it does not).
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='127.0.0.1'&&[4179,4180].includes(Number(u.port)))return route.continue();
  return route.abort('blockedbyclient');
 });
 const page=await context.newPage();
 const parent=await page.goto(attack+'/frame-test.html',{waitUntil:'domcontentloaded',timeout:15000});
 assert.equal(parent.status(),200);
 await page.waitForTimeout(2000);
 const iframe=page.frames().find(f=>f.url().startsWith(base+'/admin.html'));
 const frameLoaded=!!iframe && await iframe.locator('#login-screen').count()>0;
 const frameSecurity={crossOriginFramingAllowedWithoutHeader:frameLoaded,frameUrl:iframe?.url()||null,policyFromBuiltMeta:cspTag};
 assert.equal(frameLoaded,true,'unexpected: browser blocked cross-origin frame (inspect headers)');
 await context.close();
 const sdkUrls=[...new Set(actualSdkResponses.filter(r=>r.status===200).map(r=>new URL(r.url).pathname.split('/').at(-1)))];
 const report={result:'PASS_WITH_SECURITY_FINDING',builtHtml:true,actualUnchangedMetaCsp:true,
  expectedSDK:['firebase-app.js','firebase-firestore.js','firebase-auth.js'],
  actualSdkResponses,confirmedSDK:sdkUrls,realSdkNetworkComplete:['firebase-app.js','firebase-firestore.js','firebase-auth.js'].every(n=>sdkUrls.includes(n)),
  actualFirebaseAuthProductionTest:false,actualFirestoreProductionTest:false,
  crossOriginFrame:frameSecurity,viewports:cases,violations:allViolations,console:allConsole,
  testBoundaryBlockedExternal:blockedByBoundary,requestFailures:failedRequests};
 fs.writeFileSync(process.env.RUNNER_TEMP+'/v1r8-built-admin-csp-browser.json',JSON.stringify(report,null,2));
 console.log('V1R8_BROWSER='+JSON.stringify({
  result:report.result,
  sdk200:report.confirmedSDK,
  sdkComplete:report.realSdkNetworkComplete,
  crossOriginFramingAllowed:frameLoaded,
  viewportChecks:cases.map(c=>({viewport:c.viewport,overflow:c.overflowPx,focus:c.focus,violations:c.cspViolations.map(x=>x.effectiveDirective)})),
  runtimeErrors:allConsole.filter(x=>x.type==='pageerror').slice(0,8),
  blockedOutboundCount:blockedByBoundary.length,
  recordedViolations:allViolations.length
 }));
}finally{await browser.close()}
