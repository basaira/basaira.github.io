/* Basair Academy — Hero Delight v4
   One tiny acknowledgement; navigation remains native and immediate. */
const heroDelightV4ReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

function initHeroDelightV4(){
  const hero = document.getElementById('home');
  const cta = hero?.querySelector('.hero-primary-cta');
  if(!hero || !cta) return;

  let ackTimer = 0;
  const acknowledge = () => {
    if(heroDelightV4ReducedMotion?.matches) return;
    window.clearTimeout(ackTimer);
    cta.classList.add('is-acknowledged');
    ackTimer = window.setTimeout(() => cta.classList.remove('is-acknowledged'), 420);
  };

  cta.addEventListener('pointerdown', acknowledge, {passive:true});
  cta.addEventListener('keydown', (event) => {
    if(event.key === 'Enter' || event.key === ' ') acknowledge();
  });
}

window.addEventListener('DOMContentLoaded', initHeroDelightV4, {once:true});
