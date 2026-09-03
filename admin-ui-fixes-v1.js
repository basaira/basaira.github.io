(function () {
  'use strict';

  function syncBadges() {
    document.querySelectorAll('.nav-btn .badge').forEach((badge) => {
      const text = (badge.textContent || '').trim();
      const hide = text === '' || text === '0' || text === '•' || text === '?' || text === '؟';
      const next = hide ? 'true' : 'false';
      if (badge.dataset.empty !== next) badge.dataset.empty = next;
      if (badge.classList.contains('is-hidden') !== hide) badge.classList.toggle('is-hidden', hide);
    });
  }

  function hideDebugHelp() {
    const help = document.getElementById('auth-help');
    if (help) {
      help.hidden = true;
      help.style.display = 'none';
    }
  }

  function init() {
    hideDebugHelp();
    syncBadges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  const observer = new MutationObserver(init);
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
})();
