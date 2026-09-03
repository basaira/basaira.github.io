/* Basair Academy — Precision Native Overdrive v2
   Interaction-only enhancement. It intentionally does not own layout,
   spacing, typography, Firebase, or CMS content. */

const focusableSelector = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function visibleFocusable(container) {
  if (!(container instanceof HTMLElement)) return [];
  return Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
    return element instanceof HTMLElement && !element.hidden && element.getClientRects().length > 0;
  });
}

function focusLanguageOption(dropdown, position) {
  if (!(dropdown instanceof HTMLElement)) return;
  const items = visibleFocusable(dropdown).filter((el) => el.matches('[data-lang]'));
  if (!items.length) return;
  const target = position === 'last' ? items[items.length - 1] : items[0];
  target.focus({ preventScroll: true });
}

function bindLanguageMenu(triggerId, dropdownId, toggleFn, closeFn) {
  const trigger = document.getElementById(triggerId);
  const dropdown = document.getElementById(dropdownId);
  if (!(trigger instanceof HTMLElement) || !(dropdown instanceof HTMLElement)) return;

  dropdown.setAttribute('role', 'menu');
  trigger.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    if (!dropdown.classList.contains('active')) toggleFn?.();
    window.requestAnimationFrame(() => focusLanguageOption(dropdown, event.key === 'ArrowUp' ? 'last' : 'first'));
  });

  dropdown.addEventListener('keydown', (event) => {
    const items = visibleFocusable(dropdown).filter((el) => el.matches('[data-lang]'));
    if (!items.length) return;
    const currentIndex = Math.max(0, items.indexOf(document.activeElement));
    let nextIndex = null;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      closeFn?.();
      trigger.focus({ preventScroll: true });
      return;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    items[nextIndex].focus({ preventScroll: true });
  });
}

function initMobileMenuKeyboard() {
  const menu = document.getElementById('mobile-menu');
  const trigger = document.getElementById('mobile-menu-btn');
  if (!(menu instanceof HTMLElement) || !(trigger instanceof HTMLElement)) return;

  document.addEventListener('keydown', (event) => {
    if (!menu.classList.contains('active')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      window.closeMobileMenu?.();
      trigger.focus({ preventScroll: true });
      return;
    }

    if (event.key !== 'Tab') return;
    const focusables = visibleFocusable(menu);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });
}

function initPrecisionNative() {
  bindLanguageMenu('lang-btn', 'langDropdown', window.toggleLangMenu, window.closeDropdown);
  bindLanguageMenu('mobile-lang-btn', 'mobileLangDropdown', window.toggleMobileLangMenu, window.closeMobileLangMenu);
  initMobileMenuKeyboard();
  document.documentElement.classList.add('precision-native-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrecisionNative, { once: true });
} else {
  initPrecisionNative();
}
