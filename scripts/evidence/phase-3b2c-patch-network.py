from __future__ import annotations

import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("usage: phase-3b2c-patch-network.py <characterize.mjs>")

path = Path(sys.argv[1])
s = path.read_text()

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
  ]);"""
if old not in s:
    raise SystemExit("missing navigation/font anchor")
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
new = "await Promise.all([applyState(sa.p,state),applyState(sb.p,state)]);"
if old not in s:
    raise SystemExit("missing synchronized applyState anchor")
s = s.replace(old, new, 1)

for required in (
    "setRequestInterception(true)",
    "u.origin!==base",
    "u.pathname==='/tailwindcss'",
    "timeout:10000",
    "setTimeout(resolve,1000)",
    "Promise.all([freeze(sa.p),freeze(sb.p)])",
    "Promise.all([applyState(sa.p,state),applyState(sb.p,state)])",
):
    if required not in s:
        raise SystemExit(f"required network/determinism patch marker missing: {required}")

path.write_text(s)
print("PHASE_3B2C_NETWORK_ISOLATION_PATCH_PASS")
print("PHASE_3B2C_SYNCHRONIZED_STATE_PATCH_PASS")
