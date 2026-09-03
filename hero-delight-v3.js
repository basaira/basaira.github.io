/* Basair Academy — Hero Delight v3
   Tiny acknowledgement only; same-document navigation remains native. */
const heroDelightReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

function initHeroDelightV3(){
  const hero = document.getElementById('home');
  const cta = hero?.querySelector('.hero-primary-cta');
  if(!hero || !cta) return;

  let ackTimer = 0;
  const acknowledge = () => {
    if(heroDelightReducedMotion?.matches) return;
    window.clearTimeout(ackTimer);
    cta.classList.add('is-acknowledged');
    ackTimer = window.setTimeout(() => cta.classList.remove('is-acknowledged'), 520);
  };

  cta.addEventListener('click', acknowledge);
  cta.addEventListener('keydown', (event) => {
    if(event.key === 'Enter' || event.key === ' ') acknowledge();
  });
}

window.addEventListener('DOMContentLoaded', initHeroDelightV3, {once:true});
