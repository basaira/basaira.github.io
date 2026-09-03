/* Basair Academy — Hero CTA Overdrive + Delight v1
   Decorative interaction only; anchors retain native navigation semantics. */
(() => {
  const hero = document.getElementById('home');
  if (!hero) return;
  const buttons = Array.from(hero.querySelectorAll('.hero-cta'));
  if (!buttons.length) return;

  const precisePointer = window.matchMedia?.('(hover:hover) and (pointer:fine)');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let ackTimer = 0;

  const acknowledge = (button) => {
    if (!button) return;
    window.clearTimeout(ackTimer);
    buttons.forEach((item) => item.classList.remove('is-acknowledged'));
    button.classList.add('is-acknowledged');
    ackTimer = window.setTimeout(() => button.classList.remove('is-acknowledged'), 360);
  };

  buttons.forEach((button) => {
    button.addEventListener('pointerdown', () => acknowledge(button), {passive:true});
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') acknowledge(button);
    });

    if (!precisePointer?.matches || reducedMotion?.matches) return;
    let raf = 0;
    let latest = null;
    const paint = () => {
      raf = 0;
      if (!latest) return;
      const rect = button.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((latest.clientX - rect.left) / rect.width) * 100;
      const y = ((latest.clientY - rect.top) / rect.height) * 100;
      button.style.setProperty('--hero-cta-x', `${Math.max(0,Math.min(100,x)).toFixed(1)}%`);
      button.style.setProperty('--hero-cta-y', `${Math.max(0,Math.min(100,y)).toFixed(1)}%`);
    };
    button.addEventListener('pointermove', (event) => {
      latest = event;
      if (!raf) raf = window.requestAnimationFrame(paint);
    }, {passive:true});
    button.addEventListener('pointerleave', () => {
      latest = null;
      button.style.setProperty('--hero-cta-x','50%');
      button.style.setProperty('--hero-cta-y','50%');
    }, {passive:true});
  });
})();
