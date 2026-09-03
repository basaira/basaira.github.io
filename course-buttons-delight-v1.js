const COURSE_BUTTON_DELIGHT_COPY = {
  ar: { opening: 'جارٍ فتح WhatsApp', error: 'تعذر فتح الرابط' },
  en: { opening: 'Opening WhatsApp', error: 'Could not open link' },
  fr: { opening: 'Ouverture de WhatsApp', error: 'Impossible d’ouvrir le lien' },
  ru: { opening: 'Открываем WhatsApp', error: 'Не удалось открыть ссылку' },
  uz: { opening: 'WhatsApp ochilmoqda', error: 'Havolani ochib bo‘lmadi' }
};

function courseButtonLocale() {
  const routeClass = Array.from(document.body.classList).find((name) => name.startsWith('route-'));
  const lang = routeClass ? routeClass.slice(6) : (document.documentElement.lang || 'en').toLowerCase();
  return COURSE_BUTTON_DELIGHT_COPY[lang] ? lang : 'en';
}

function visibleCourseButtons() {
  const lang = courseButtonLocale();
  return Array.from(document.querySelectorAll(`#tracks .track-detail-cta-v6.lang-${lang}`));
}

function validWhatsappHref(href) {
  try {
    const url = new URL(href, window.location.href);
    return url.protocol === 'https:' && (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com' || url.hostname.endsWith('.whatsapp.com'));
  } catch (_) {
    return false;
  }
}

function installCourseButtonDelight() {
  const buttons = Array.from(document.querySelectorAll('#tracks .track-detail-cta-v6'));
  if (!buttons.length) return;

  const copy = COURSE_BUTTON_DELIGHT_COPY[courseButtonLocale()] || COURSE_BUTTON_DELIGHT_COPY.en;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const discoveryObserver = !reduced && 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const button = entry.target;
          if (!button.dataset.courseDelightSeen) {
            button.dataset.courseDelightSeen = 'true';
            button.classList.add('course-btn-delight-discovered');
            window.setTimeout(() => button.classList.remove('course-btn-delight-discovered'), 900);
          }
          observer.unobserve(button);
        });
      }, { threshold: .72 })
    : null;

  buttons.forEach((button) => {
    discoveryObserver?.observe(button);
    button.dataset.courseDelight = 'ready';

    button.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = button.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      button.style.setProperty('--course-btn-x', `${x.toFixed(2)}%`);
      button.style.setProperty('--course-btn-y', `${y.toFixed(2)}%`);
    }, { passive: true });

    button.addEventListener('pointerenter', () => button.classList.add('course-btn-delight-hovered'), { passive: true });
    button.addEventListener('pointerleave', () => {
      button.classList.remove('course-btn-delight-hovered', 'course-btn-delight-pressed');
      button.style.removeProperty('--course-btn-x');
      button.style.removeProperty('--course-btn-y');
    }, { passive: true });
    button.addEventListener('focus', () => button.classList.add('course-btn-delight-hovered'));
    button.addEventListener('blur', () => button.classList.remove('course-btn-delight-hovered', 'course-btn-delight-pressed'));
    button.addEventListener('pointerdown', () => button.classList.add('course-btn-delight-pressed'), { passive: true });
    button.addEventListener('pointerup', () => button.classList.remove('course-btn-delight-pressed'), { passive: true });
    button.addEventListener('pointercancel', () => button.classList.remove('course-btn-delight-pressed'), { passive: true });

    button.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = button.getAttribute('href') || '';
      const mark = button.querySelector('.track-detail-cta-v6__mark');
      const oldMark = mark?.textContent || '↗';

      if (!validWhatsappHref(href)) {
        event.preventDefault();
        button.classList.add('course-btn-delight-error');
        button.setAttribute('aria-label', copy.error);
        if (mark) mark.textContent = '!';
        window.setTimeout(() => {
          button.classList.remove('course-btn-delight-error');
          button.removeAttribute('aria-label');
          if (mark) mark.textContent = oldMark;
        }, 1300);
        return;
      }

      if (button.dataset.courseDelightNavigating === 'true') {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      button.dataset.courseDelightNavigating = 'true';
      button.classList.remove('course-btn-delight-pressed');
      button.classList.add('course-btn-delight-activating');
      button.setAttribute('aria-label', copy.opening);
      if (mark) mark.textContent = '✓';

      const navigate = () => { window.location.href = href; };
      if (reduced) navigate();
      else window.setTimeout(navigate, 155);

      window.setTimeout(() => {
        button.dataset.courseDelightNavigating = 'false';
        button.classList.remove('course-btn-delight-activating');
        button.removeAttribute('aria-label');
        if (mark) mark.textContent = oldMark;
      }, 1500);
    });
  });

  // Language switches update which localized CTA receives discovery treatment.
  const bodyObserver = new MutationObserver(() => {
    visibleCourseButtons().forEach((button) => {
      if (!button.dataset.courseDelightSeen && !reduced) discoveryObserver?.observe(button);
    });
  });
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

window.addEventListener('DOMContentLoaded', installCourseButtonDelight);
