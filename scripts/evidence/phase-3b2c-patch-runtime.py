from __future__ import annotations

import sys
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"missing patch anchor: {label}")
    return text.replace(old, new, 1)


if len(sys.argv) != 2:
    raise SystemExit("usage: phase-3b2c-patch-runtime.py <characterize.mjs>")

path = Path(sys.argv[1])
s = path.read_text()

s = replace_once(
    s,
    "const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-setuid-sandbox']});",
    "const browser=await puppeteer.launch({headless:true,executablePath,protocolTimeout:600000,args:['--no-sandbox','--disable-setuid-sandbox']});",
    "browser protocol timeout",
)

s = replace_once(
    s,
    "async function freeze(p){ await p.addStyleTag({content:'*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;}'}); }",
    """async function freeze(p){
  await p.evaluate(()=>{
    if(document.getElementById('__phase3b2c_freeze')) return;
    const style=document.createElement('style');
    style.id='__phase3b2c_freeze';
    style.textContent='*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;}';
    document.documentElement.appendChild(style);
  });
}""",
    "deterministic transition freeze",
)

marker = "async function applyState(p,state){"
helpers = r'''async function resetState(p){
  try{await p.mouse.up();}catch{}
  try{await p.mouse.move(1,1);}catch{}
  await p.evaluate(()=>{
    const f=document.querySelector('.overdrive-form'); if(!f)return;
    f.removeAttribute('data-overdrive-submit-state');
    for(const field of f.querySelectorAll('.overdrive-field'))field.classList.remove('is-focused','is-valid','is-invalid');
    for(const el of f.querySelectorAll('input,textarea,select,[type="submit"]')){
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-disabled');
      el.removeAttribute('aria-busy');
      el.classList.remove('is-loading');
      if('disabled' in el)el.disabled=false;
      if(el.matches('select'))el.selectedIndex=0;
      else if(el.matches('input[type="checkbox"],input[type="radio"]'))el.checked=false;
      else if(!el.matches('[type="submit"],[type="button"],[type="hidden"]'))el.value='';
    }
    document.activeElement?.blur?.();
    document.querySelector('#success-message')?.classList.add('hidden');
    document.querySelector('#error-message')?.classList.add('hidden');
    document.querySelector('#form-status')?.classList.remove('show','success','error');
    document.querySelector('#post-submit')?.classList.remove('show');
  });
}
async function pointFor(p,selector){
  return p.evaluate((selector)=>{
    const el=document.querySelector(selector); if(!el)return null;
    const r=el.getBoundingClientRect();
    if(!r.width&&!r.height)return null;
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  },selector);
}
async function tabTo(p,selector){
  await p.evaluate(()=>document.activeElement?.blur?.());
  for(let i=0;i<160;i++){
    await p.keyboard.press('Tab');
    const hit=await p.evaluate((selector)=>document.activeElement?.matches?.(selector)===true,selector);
    if(hit)return true;
  }
  return false;
}
'''
s = replace_once(s, marker, helpers + marker, "state helpers")

s = replace_once(
    s,
    "hasForcedColorsCss:[...document.styleSheets].some(ss=>{try{return [...ss.cssRules].some(r=>String(r.conditionText||'').includes('forced-colors'));}catch{return false;}})",
    "capabilities:{pointerFine:matchMedia('(pointer: fine)').matches,pointerCoarse:matchMedia('(pointer: coarse)').matches,hoverHover:matchMedia('(hover: hover)').matches,hoverNone:matchMedia('(hover: none)').matches},hasForcedColorsCss:[...document.styleSheets].some(ss=>{try{return [...ss.cssRules].some(r=>String(r.conditionText||'').includes('forced-colors'));}catch{return false;}})",
    "input capability inventory",
)

s = replace_once(
    s,
    "const email=f.querySelector('input[type=\"email\"]'); const text=f.querySelector('input:not([type=\"hidden\"]):not([type=\"submit\"]),textarea');\n    const select=f.querySelector('select'); const submit=f.querySelector('[type=\"submit\"]');",
    "const email=f.querySelector('input[type=\"email\"]'); const tel=f.querySelector('input[type=\"tel\"],input[inputmode=\"tel\"]'); const text=f.querySelector('input:not([type=\"hidden\"]):not([type=\"submit\"]),textarea'); const textarea=f.querySelector('textarea');\n    const select=f.querySelector('select'); const submit=f.querySelector('[type=\"submit\"]');",
    "state controls",
)

s = replace_once(
    s,
    "if(state==='focus-control'){control?.focus(); first?.classList.add('is-focused');}\n    if(state==='focus-select'){select?.focus(); select?.closest('.overdrive-field')?.classList.add('is-focused');}\n    if(state==='partial'){setValue(text,'A');}\n    if(state==='valid'){setValue(text,'Basair Test'); first?.classList.add('is-valid');}",
    """if(state==='focus-control'){control?.focus(); first?.classList.add('is-focused');}
    if(state==='focus-select'){select?.focus(); select?.closest('.overdrive-field')?.classList.add('is-focused');}
    if(state==='focus-textarea'){textarea?.focus(); textarea?.closest('.overdrive-field')?.classList.add('is-focused');}
    if(state==='partial'){setValue(text,'A');}
    if(state==='filled-textarea'){setValue(textarea,'Characterization text'); textarea?.closest('.overdrive-field')?.classList.add('is-valid');}
    if(state==='filled-email'){setValue(email,'test@example.test'); email?.closest('.overdrive-field')?.classList.add('is-valid');}
    if(state==='filled-tel'){setValue(tel,'+201000000000'); tel?.closest('.overdrive-field')?.classList.add('is-valid');}
    if(state==='select-changed'&&select){select.selectedIndex=Math.min(1,select.options.length-1);select.dispatchEvent(new Event('change',{bubbles:true}));select.closest('.overdrive-field')?.classList.add('is-valid');}
    if(state==='contact-combo'){setValue(email,'test@example.test');setValue(tel,'+201000000000');if(select){select.selectedIndex=Math.min(1,select.options.length-1);select.dispatchEvent(new Event('change',{bubbles:true}));}email?.closest('.overdrive-field')?.classList.add('is-valid');tel?.closest('.overdrive-field')?.classList.add('is-valid');}
    if(state==='valid'){setValue(text,'Basair Test'); first?.classList.add('is-valid');}""",
    "filled and focus states",
)

s = replace_once(
    s,
    "if(state==='busy'){f.dataset.overdriveSubmitState='submitting';submit?.classList.add('is-loading');submit?.setAttribute('aria-busy','true');}\n    if(state==='success')",
    "if(state==='busy'){f.dataset.overdriveSubmitState='submitting';submit?.setAttribute('aria-busy','true');}\n    if(state==='loading'){f.dataset.overdriveSubmitState='submitting';submit?.classList.add('is-loading');}\n    if(state==='success')",
    "busy versus loading",
)

s = replace_once(
    s,
    """  if(state==='hover-submit'){await freeze(p); const el=await p.$('.overdrive-form [type="submit"]'); if(el) await el.hover();}
  if(state==='hover-control'){await freeze(p); const el=await p.$('.overdrive-form input:not([type="hidden"]),.overdrive-form textarea,.overdrive-form select'); if(el) await el.hover();}
  if(state==='active-submit'){await freeze(p); const el=await p.$('.overdrive-form [type="submit"]'); if(el){const b=await el.boundingBox();if(b){await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();}}}
""",
    """  if(state==='focus-visible-control') await tabTo(p,'.overdrive-form input:not([type="hidden"]),.overdrive-form textarea,.overdrive-form select');
  if(state==='focus-visible-submit') await tabTo(p,'.overdrive-form [type="submit"]');
  if(state==='hover-submit'){await freeze(p); const pt=await pointFor(p,'.overdrive-form [type="submit"]'); if(pt) await p.mouse.move(pt.x,pt.y);}
  if(state==='hover-control'){await freeze(p); const pt=await pointFor(p,'.overdrive-form input:not([type="hidden"]),.overdrive-form textarea,.overdrive-form select'); if(pt) await p.mouse.move(pt.x,pt.y);}
  if(state==='active-submit'){await freeze(p); const pt=await pointFor(p,'.overdrive-form [type="submit"]'); if(pt){await p.mouse.move(pt.x,pt.y);await p.mouse.down();}}
""",
    "keyboard hover active mechanics",
)

s = replace_once(
    s,
    "for(const state of states){\n      if(state!=='idle'){await sa.p.reload({waitUntil:'domcontentloaded'});await sb.p.reload({waitUntil:'domcontentloaded'});}",
    "for(const state of states){\n      console.log(`PROGRESS ${r.route} ${vp.name} ${state}`);\n      if(state!=='idle'){await resetState(sa.p);await resetState(sb.p);}",
    "state reset loop",
)

s = replace_once(
    s,
    "const states=['idle','focus-control','partial','valid','invalid-required','disabled','aria-disabled','busy','success','error','hover-submit','active-submit','hover-control'];\n    if(invA?.selects?.length) states.push('focus-select');\n    if(invA?.inputs?.some(x=>x.type==='email')) states.push('malformed');",
    """const states=['idle','focus-control','focus-visible-control','partial','valid','invalid-required','disabled','aria-disabled','busy','loading','success','error','hover-submit','active-submit','focus-visible-submit','hover-control'];
    if(invA?.selects?.length) states.push('focus-select','select-changed');
    if(invA?.textareas?.length) states.push('focus-textarea','filled-textarea');
    if(invA?.inputs?.some(x=>x.type==='email')) states.push('malformed','filled-email');
    if(invA?.inputs?.some(x=>x.type==='tel'||x.name==='whatsapp'||x.name==='phone')) states.push('filled-tel');
    if(invA?.inputs?.some(x=>x.type==='email')&&invA?.inputs?.some(x=>x.type==='tel'||x.name==='whatsapp'||x.name==='phone')) states.push('contact-combo');""",
    "expanded state inventory",
)

s = replace_once(
    s,
    "if(['valid','invalid-required','malformed','busy','success','error','disabled','aria-disabled'].includes(state))browserResult.validationStates++;",
    "if(['valid','invalid-required','malformed','busy','loading','success','error','disabled','aria-disabled','filled-email','filled-tel','contact-combo'].includes(state))browserResult.validationStates++;",
    "validation counters",
)

s = replace_once(
    s,
    "const browserResult={routeCount:routes.length,",
    "const browserRoutes=routes.filter((_,i)=>i % Number(process.env.SHARD_COUNT||1) === Number(process.env.SHARD_INDEX||0));\nconsole.log(`SHARD ${process.env.SHARD_INDEX||0}/${process.env.SHARD_COUNT||1} routes=${browserRoutes.map(r=>r.route).join(',')}`);\nconst browserResult={routeCount:browserRoutes.length,",
    "route sharding",
)
idx = s.index("const browserResult=")
tail = s[idx:]
if "for(const r of routes){" not in tail:
    raise SystemExit("missing patch anchor: browser route loop")
tail = tail.replace("for(const r of routes){", "for(const r of browserRoutes){", 1)
s = s[:idx] + tail

for forbidden in ("await el.hover()", "await el.boundingBox()", "await p.addStyleTag"):
    if forbidden in s:
        raise SystemExit(f"forbidden stale harness call remains: {forbidden}")
for required in ("focus-visible-submit", "contact-combo", "pointerCoarse", "browserRoutes=routes.filter", "__phase3b2c_freeze"):
    if required not in s:
        raise SystemExit(f"required patched marker missing: {required}")

path.write_text(s)
print("PHASE_3B2C_RUNTIME_PATCH_PASS")
