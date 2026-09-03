/* Basair Academy — Hero Overdrive v2
   Pointer-local decoration only. No CMS/Firebase ownership. */
const heroReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const heroFinePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');

function initHeroOverdriveV2(){
  const hero = document.getElementById('home');
  const stage = hero?.querySelector('.hero-visual-stage');
  const cta = hero?.querySelector('.hero-primary-cta');
  if(!hero || !stage) return;

  if(!heroReducedMotion?.matches && heroFinePointer?.matches){
    let raf = 0;
    let last = null;
    const paint = () => {
      raf = 0;
      if(!last) return;
      const rect = stage.getBoundingClientRect();
      if(!rect.width || !rect.height) return;
      const nx = Math.max(-1,Math.min(1,((last.clientX-rect.left)/rect.width-.5)*2));
      const ny = Math.max(-1,Math.min(1,((last.clientY-rect.top)/rect.height-.5)*2));
      hero.style.setProperty('--hero-vx',nx.toFixed(3));
      hero.style.setProperty('--hero-vy',ny.toFixed(3));
      hero.style.setProperty('--hero-glow-x',`${((nx+1)*50).toFixed(1)}%`);
      hero.style.setProperty('--hero-glow-y',`${((ny+1)*50).toFixed(1)}%`);
    };
    stage.addEventListener('pointermove',(event)=>{
      last=event;
      if(!raf) raf=requestAnimationFrame(paint);
    },{passive:true});
    stage.addEventListener('pointerleave',()=>{
      last=null;
      hero.style.setProperty('--hero-vx','0');
      hero.style.setProperty('--hero-vy','0');
      hero.style.setProperty('--hero-glow-x','52%');
      hero.style.setProperty('--hero-glow-y','40%');
    },{passive:true});

    if(cta){
      let ctaRaf=0;
      let ctaEvent=null;
      const paintCta=()=>{
        ctaRaf=0;
        if(!ctaEvent) return;
        const rect=cta.getBoundingClientRect();
        if(!rect.width || !rect.height) return;
        const x=((ctaEvent.clientX-rect.left)/rect.width)*100;
        const y=((ctaEvent.clientY-rect.top)/rect.height)*100;
        cta.style.setProperty('--hero-cta-x',`${Math.max(0,Math.min(100,x)).toFixed(1)}%`);
        cta.style.setProperty('--hero-cta-y',`${Math.max(0,Math.min(100,y)).toFixed(1)}%`);
      };
      cta.addEventListener('pointermove',(event)=>{
        ctaEvent=event;
        if(!ctaRaf) ctaRaf=requestAnimationFrame(paintCta);
      },{passive:true});
      cta.addEventListener('pointerleave',()=>{
        ctaEvent=null;
        cta.style.setProperty('--hero-cta-x','50%');
        cta.style.setProperty('--hero-cta-y','50%');
      },{passive:true});
    }
  }
}

window.addEventListener('DOMContentLoaded',initHeroOverdriveV2,{once:true});
