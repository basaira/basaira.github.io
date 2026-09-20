#!/usr/bin/env node
import fs from 'node:fs';
import { chromium } from 'playwright';

const [,,baseArg,outFile]=process.argv;
if(!baseArg||!outFile) throw new Error('usage: node release-browser-smoke.mjs <base-url> <out.json>');
const base=new URL(baseArg);
const routes=[
  '/', '/en/', '/en/quran-kids/', '/en/quran-adults/', '/en/arabic/',
  '/ru/', '/ru/quran/', '/ru/arabic/',
  '/uz/', '/uz/quran/', '/uz/arabic/', '/admin.html'
];
const viewports=[
  {name:'desktop',width:1440,height:1000},
  {name:'mobile',width:390,height:844}
];
const browser=await chromium.launch({headless:true});
const results=[];
try{
  for(const vp of viewports){
    for(const route of routes){
      const context=await browser.newContext({viewport:{width:vp.width,height:vp.height}});
      const page=await context.newPage();
      const pageErrors=[],consoleErrors=[],failedLocalResources=[],writeAttempts=[];
      page.on('pageerror',e=>pageErrors.push(String(e)));
      page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
      page.on('requestfailed',req=>{
        const u=new URL(req.url());
        if(u.origin===base.origin) failedLocalResources.push({url:req.url(),method:req.method(),failure:req.failure()?.errorText||''});
      });
      page.on('response',res=>{
        const u=new URL(res.url());
        if(u.origin===base.origin && res.status()>=400) failedLocalResources.push({url:res.url(),method:res.request().method(),status:res.status()});
      });
      await page.route('**/*',async r=>{
        const method=r.request().method().toUpperCase();
        if(!['GET','HEAD','OPTIONS'].includes(method)){
          writeAttempts.push({url:r.request().url(),method});
          await r.abort('blockedbyclient');
        }else{
          await r.continue();
        }
      });
      let navStatus=null,navError=null;
      try{
        const resp=await page.goto(new URL(route,base).href,{waitUntil:'networkidle',timeout:30000});
        navStatus=resp?.status()??null;
      }catch(e){navError=String(e);}
      await page.waitForTimeout(500);
      const metrics=await page.evaluate(()=>{
        const visible=el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
        const forms=[...document.querySelectorAll('form')];
        const interact=[...document.querySelectorAll('a,button,input,select,textarea')];
        const hero=[...document.querySelectorAll('[class*="hero" i],[id*="hero" i],main h1,body h1')];
        return {
          title:document.title,
          bodyTextLength:(document.body?.innerText||'').trim().length,
          htmlLang:document.documentElement.lang||'',
          htmlDirAttribute:document.documentElement.getAttribute('dir')||'',
          computedDirection:getComputedStyle(document.documentElement).direction,
          formCount:forms.length,
          visibleFormCount:forms.filter(visible).length,
          interactiveCount:interact.length,
          visibleInteractiveCount:interact.filter(visible).length,
          heroCandidateCount:hero.length,
          visibleHeroCandidateCount:hero.filter(visible).length
        };
      });
      const isAdmin=route==='/admin.html', isHome=route==='/';
      const checks={
        httpSuccess:navStatus!==null&&navStatus>=200&&navStatus<300,
        htmlLoads:metrics.bodyTextLength>0,
        noUncaughtJsError:pageErrors.length===0,
        noFailedLocalProductionResource:failedLocalResources.length===0,
        noWriteAttempt:writeAttempts.length===0,
        navigationBootstrap:metrics.visibleInteractiveCount>0,
        languageDirectionSanity:metrics.htmlLang.length>0&&['ltr','rtl'].includes(metrics.computedDirection),
        formsRender:metrics.formCount===0||metrics.visibleFormCount>0,
        homepageHeroVisible:!isHome||metrics.visibleHeroCandidateCount>0,
        adminShellExpectedAuthState:!isAdmin||(metrics.bodyTextLength>20&&metrics.visibleInteractiveCount>0)
      };
      const pass=Object.values(checks).every(Boolean);
      results.push({route,viewport:vp,navStatus,navError,metrics,checks,pageErrors,consoleErrors,failedLocalResources,writeAttempts,pass});
      await context.close();
    }
  }
}finally{
  await browser.close();
}
const failures=results.filter(x=>!x.pass);
const report={
  pass:failures.length===0,
  routeCount:routes.length,
  viewportCount:viewports.length,
  caseCount:results.length,
  readOnlyBoundary:'all non-GET/HEAD/OPTIONS requests blocked before network dispatch',
  failures,
  results
};
fs.mkdirSync(new URL('.', 'file://'+outFile).pathname,{recursive:true});
fs.writeFileSync(outFile,JSON.stringify(report,null,2)+'\n');
if(!report.pass){
  console.error('Browser release smoke FAIL',JSON.stringify(failures.map(x=>({route:x.route,viewport:x.viewport.name,checks:x.checks,pageErrors:x.pageErrors,failedLocalResources:x.failedLocalResources,writeAttempts:x.writeAttempts})),null,2));
  process.exit(1);
}
console.log(`Browser release smoke PASS: ${report.caseCount} cases, ${routes.length} routes x ${viewports.length} viewports`);
