from __future__ import annotations

import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("usage: phase-3b2c-patch-network.py <characterize.mjs>")

path = Path(sys.argv[1])
s = path.read_text()

old = "const browser=await puppeteer.launch({headless:true,executablePath,protocolTimeout:600000,args:['--no-sandbox','--disable-setuid-sandbox']});"
new = """const browserSource=await puppeteer.launch({headless:true,executablePath,protocolTimeout:600000,args:['--no-sandbox','--disable-setuid-sandbox']});
const browserSynthetic=await puppeteer.launch({headless:true,executablePath,protocolTimeout:600000,args:['--no-sandbox','--disable-setuid-sandbox']});"""
if old not in s:
    raise SystemExit("missing browser launch anchor")
s = s.replace(old, new, 1)

old = "async function prepPage(base,route,vp,reduced=false){"
new = "async function prepPage(browser,base,route,vp,reduced=false){"
if old not in s:
    raise SystemExit("missing prepPage signature anchor")
s = s.replace(old, new, 1)

old = "  const p=await browser.newPage();\n  await p.setViewport({width:vp.width,height:vp.height,isMobile:vp.isMobile,hasTouch:vp.hasTouch,deviceScaleFactor:1});"
new = """  const p=await browser.newPage();
  await p.setRequestInterception(true);
  p.on('request',req=>{
    try{
      const u=new URL(req.url());
      if(u.origin!==base)return req.abort('blockedbyclient');
      if(u.pathname==='/tailwindcss')return req.respond({status:200,contentType:'text/css',body:'/* build-time Tailwind import stub for raw-source characterization only */'});
    }catch{}
    return req.continue();
  });
  await p.setViewport({width:vp.width,height:vp.height,isMobile:vp.isMobile,hasTouch:vp.hasTouch,deviceScaleFactor:1});"""
if old not in s:
    raise SystemExit("missing prepPage newPage anchor")
s = s.replace(old, new, 1)

old = "  await p.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});\n  await p.evaluate(()=>document.fonts?.ready);"
new = """  await p.goto(base+route,{waitUntil:'domcontentloaded',timeout:10000});
  await Promise.race([
    p.evaluate(()=>document.fonts?.ready),
    new Promise(resolve=>setTimeout(resolve,1000))
  ]);
  await p.evaluate(async()=>{
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    for(const animation of document.getAnimations()){
      try{
        const timing=animation.effect?.getComputedTiming?.();
        if(timing && Number.isFinite(timing.endTime)) animation.finish();
        else { animation.currentTime=0; animation.pause(); }
      }catch{}
    }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    document.documentElement.style.setProperty('scroll-behavior','auto','important');
    window.scrollTo(0,0);
  });"""
if old not in s:
    raise SystemExit("missing navigation/font anchor")
s = s.replace(old, new, 1)

old = "async function inventory(p){"
new = """async function settleState(p){
  await p.evaluate(async()=>{
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    for(const animation of document.getAnimations()){
      try{
        const timing=animation.effect?.getComputedTiming?.();
        if(timing && Number.isFinite(timing.endTime)) animation.finish();
        else { animation.currentTime=0; animation.pause(); }
      }catch{}
    }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
}
async function inventory(p){"""
if old not in s:
    raise SystemExit("missing settle helper anchor")
s = s.replace(old, new, 1)

old = "    document.activeElement?.blur?.();"
new = """    document.activeElement?.blur?.();
    document.documentElement.style.setProperty('scroll-behavior','auto','important');
    window.scrollTo(0,0);"""
if old not in s:
    raise SystemExit("missing reset scroll anchor")
s = s.replace(old, new, 1)

old = """for(const state of states){
      console.log(`PROGRESS ${r.route} ${vp.name} ${state}`);
      if(state!=='idle'){await resetState(sa.p);await resetState(sb.p);}"""
new = """for(const state of states){
      console.log(`PROGRESS ${r.route} ${vp.name} ${state}`);
      await Promise.all([freeze(sa.p),freeze(sb.p)]);
      if(state!=='idle'){await Promise.all([resetState(sa.p),resetState(sb.p)]);}"""
if old not in s:
    raise SystemExit("missing synchronized freeze/reset anchor")
s = s.replace(old, new, 1)

old = "await applyState(sa.p,state);await applyState(sb.p,state);"
new = """await Promise.all([sa.p.bringToFront(),sb.p.bringToFront()]);
      await Promise.all([applyState(sa.p,state),applyState(sb.p,state)]);
      await Promise.all([settleState(sa.p),settleState(sb.p)]);"""
if old not in s:
    raise SystemExit("missing synchronized applyState anchor")
s = s.replace(old, new, 1)

old = "rect:{x:round(r.x),y:round(r.y),width:round(r.width),height:round(r.height),top:round(r.top),right:round(r.right),bottom:round(r.bottom),left:round(r.left),scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight}"
new = "rect:{x:round(r.x+scrollX),y:round(r.y+scrollY),width:round(r.width),height:round(r.height),top:round(r.top+scrollY),right:round(r.right+scrollX),bottom:round(r.bottom+scrollY),left:round(r.left+scrollX),scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight}"
if old not in s:
    raise SystemExit("missing document-space geometry anchor")
s = s.replace(old, new, 1)

old = "const sa=await prepPage(bases.source,r.route,vp,false), sb=await prepPage(bases.synthetic,r.route,vp,false);"
new = "const [sa,sb]=await Promise.all([prepPage(browserSource,bases.source,r.route,vp,false),prepPage(browserSynthetic,bases.synthetic,r.route,vp,false)]);"
if old not in s:
    raise SystemExit("missing paired normal prep anchor")
s = s.replace(old, new, 1)

old = "const ra=await prepPage(bases.source,r.route,vp,true), rb=await prepPage(bases.synthetic,r.route,vp,true);"
new = "const [ra,rb]=await Promise.all([prepPage(browserSource,bases.source,r.route,vp,true),prepPage(browserSynthetic,bases.synthetic,r.route,vp,true)]);"
if old not in s:
    raise SystemExit("missing paired reduced prep anchor")
s = s.replace(old, new, 1)

old = "await browser.close();"
new = "await Promise.all([browserSource.close(),browserSynthetic.close()]);"
if old not in s:
    raise SystemExit("missing browser close anchor")
s = s.replace(old, new, 1)

for required in (
    "browserSource=await puppeteer.launch",
    "browserSynthetic=await puppeteer.launch",
    "setRequestInterception(true)",
    "u.origin!==base",
    "u.pathname==='/tailwindcss'",
    "timeout:10000",
    "async function settleState(p)",
    "document.getAnimations()",
    "Number.isFinite(timing.endTime)",
    "scroll-behavior','auto','important'",
    "Promise.all([freeze(sa.p),freeze(sb.p)])",
    "Promise.all([resetState(sa.p),resetState(sb.p)])",
    "Promise.all([applyState(sa.p,state),applyState(sb.p,state)])",
    "Promise.all([settleState(sa.p),settleState(sb.p)])",
    "r.y+scrollY",
    "r.bottom+scrollY",
    "prepPage(browserSource,bases.source",
    "prepPage(browserSynthetic,bases.synthetic",
):
    if required not in s:
        raise SystemExit(f"required network/determinism patch marker missing: {required}")

path.write_text(s)
print("PHASE_3B2C_NETWORK_ISOLATION_PATCH_PASS")
print("PHASE_3B2C_SYNCHRONIZED_STATE_PATCH_PASS")
print("PHASE_3B2C_INDEPENDENT_BROWSER_PATCH_PASS")
print("PHASE_3B2C_ANIMATION_SETTLE_PATCH_PASS")
print("PHASE_3B2C_POST_STATE_SETTLE_PATCH_PASS")
print("PHASE_3B2C_DOCUMENT_GEOMETRY_PATCH_PASS")
