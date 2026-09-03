(function () {
  'use strict';

  function getLang() {
    return String(document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  }

  function applyLocaleDirection() {
    const lang = getLang();
    const isRTL = lang === 'ar';
    const form = document.getElementById('enrollment-form');
    const shell = document.querySelector('#contact .registration-shell');
    const nextDir = isRTL ? 'rtl' : 'ltr';
    if (form && form.getAttribute('dir') !== nextDir) form.setAttribute('dir', nextDir);
    if (shell && shell.getAttribute('dir') !== nextDir) shell.setAttribute('dir', nextDir);

    const directionalControls = document.querySelectorAll('#enrollment-form input:not([dir="ltr"]), #enrollment-form select, #enrollment-form textarea');
    directionalControls.forEach((control) => {
      if (control.getAttribute('dir') !== nextDir) control.setAttribute('dir', nextDir);
      const nextAlign = isRTL ? 'right' : 'left';
      if (control.style.textAlign !== nextAlign) control.style.textAlign = nextAlign;
    });
  }

  function stripPublicFormExtras() {
    const form = document.getElementById('enrollment-form');
    if (!form) return;
    form.querySelectorAll('.form-overdrive-panel, .form-section-pill, .form-submit-caption').forEach((el) => el.remove());
    form.querySelectorAll('.submit-seal, .field-status-row').forEach((el) => el.remove());
    form.querySelectorAll('.field-status-badge').forEach((badge) => badge.remove());
  }

  function stripTrackNoise() {
    document.querySelectorAll('#tracks .course-dossier-index, #tracks .course-dossier-status, #tracks .course-dossier-note').forEach((el) => el.remove());
  }

  function init() {
    stripPublicFormExtras();
    stripTrackNoise();
    applyLocaleDirection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  const observer = new MutationObserver(() => {
    stripPublicFormExtras();
    stripTrackNoise();
    applyLocaleDirection();
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'lang']
  });
})();
