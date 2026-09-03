const COURSE_CARD_COPY = {
  ar: {
    kicker: 'مسار أكاديمي',
    chipMethod: 'منهج أكاديمي',
    chipPath: 'مسار منظم',
    ready: 'جاهز للاستكشاف',
    selected: 'المسار الحالي',
    note: 'زر المسار هو بوابة التفاصيل'
  },
  en: {
    kicker: 'Academic pathway',
    chipMethod: 'Academic method',
    chipPath: 'Structured pathway',
    ready: 'Ready to explore',
    selected: 'Current pathway',
    note: 'Use the track button for full details'
  },
  fr: {
    kicker: 'Parcours académique',
    chipMethod: 'Méthode académique',
    chipPath: 'Parcours structuré',
    ready: 'Prêt à explorer',
    selected: 'Parcours actuel',
    note: 'Le bouton du parcours ouvre tous les détails'
  },
  ru: {
    kicker: 'Академический путь',
    chipMethod: 'Академический метод',
    chipPath: 'Структурный путь',
    ready: 'Готово к изучению',
    selected: 'Текущий путь',
    note: 'Кнопка пути открывает подробности'
  },
  uz: {
    kicker: 'Akademik yo‘nalish',
    chipMethod: 'Akademik metod',
    chipPath: 'Tuzilgan yo‘nalish',
    ready: 'Ko‘rib chiqishga tayyor',
    selected: 'Joriy yo‘nalish',
    note: 'To‘liq ma’lumot uchun yo‘nalish tugmasidan foydalaning'
  }
};

function detectCourseCardLocale() {
  const body = document.body;
  const classes = body ? Array.from(body.classList) : [];
  const routeClass = classes.find((c) => c.startsWith('route-'));
  const lang = routeClass ? routeClass.replace('route-', '') : (document.documentElement.lang || 'en').toLowerCase();
  return COURSE_CARD_COPY[lang] ? lang : 'en';
}

function setActiveCourseCard(article) {
  const articles = Array.from(document.querySelectorAll('#tracks article'));
  articles.forEach((item) => {
    const active = item === article;
    item.classList.toggle('is-course-card-active', active);
    const card = item.querySelector('.course-dossier-card');
    if (card) {
      const status = card.querySelector('[data-course-status]');
      const copy = COURSE_CARD_COPY[detectCourseCardLocale()] || COURSE_CARD_COPY.en;
      if (status) status.textContent = active ? copy.selected : copy.ready;
    }
  });
}

function refreshCourseCardCopy() {
  const copy = COURSE_CARD_COPY[detectCourseCardLocale()] || COURSE_CARD_COPY.en;
  document.querySelectorAll('#tracks .course-dossier-card').forEach((card) => {
    const kicker = card.querySelector('[data-course-kicker]');
    const method = card.querySelector('[data-course-chip="method"]');
    const path = card.querySelector('[data-course-chip="path"]');
    const status = card.querySelector('[data-course-status]');
    const note = card.querySelector('[data-course-note]');
    if (kicker) kicker.textContent = copy.kicker;
    if (method) method.textContent = copy.chipMethod;
    if (path) path.textContent = copy.chipPath;
    if (note) note.textContent = copy.note;
    if (status) {
      const active = card.closest('article')?.classList.contains('is-course-card-active');
      status.textContent = active ? copy.selected : copy.ready;
    }
  });
}

function installCourseCardOverdrive() {
  const articles = Array.from(document.querySelectorAll('#tracks article'));
  if (!articles.length) return;
  const tones = ['emerald', 'gold', 'navy'];

  articles.forEach((article, index) => {
    const [card] = Array.from(article.children);
    if (!card || card.classList.contains('course-dossier-card')) return;
    const inner = card.querySelector(':scope > .relative.z-10') || card.firstElementChild;
    card.classList.add('course-dossier-card');
    card.dataset.dossierTone = tones[index] || 'emerald';
    card.dataset.courseIndex = String(index + 1);

    if (inner) inner.classList.add('course-dossier-card__inner');

    const head = document.createElement('div');
    head.className = 'course-dossier-head';
    head.innerHTML = `<span class="course-dossier-kicker" data-course-kicker></span><span class="course-dossier-index">${String(index + 1).padStart(2, '0')}</span>`;

    const meta = document.createElement('div');
    meta.className = 'course-dossier-meta';
    meta.innerHTML = `<span class="course-dossier-chip" data-course-chip="method"></span><span class="course-dossier-chip" data-course-chip="path"></span>`;

    const divider = document.createElement('div');
    divider.className = 'course-dossier-divider';

    const footer = document.createElement('div');
    footer.className = 'course-dossier-footer';
    footer.innerHTML = `<span class="course-dossier-status"><span aria-hidden="true" class="course-dossier-status-dot"></span><span data-course-status></span></span><span class="course-dossier-note" data-course-note></span>`;

    if (inner) {
      inner.insertBefore(head, inner.firstChild);
      const subtitle = Array.from(inner.children).find((el) => el.tagName === 'P');
      const firstCta = inner.querySelector('.track-detail-cta-v6');
      if (subtitle && subtitle.nextSibling) inner.insertBefore(meta, firstCta || subtitle.nextSibling);
      else if (subtitle) inner.appendChild(meta);
      else inner.insertBefore(meta, firstCta || inner.lastChild);
      inner.insertBefore(divider, firstCta || null);
      inner.insertBefore(footer, firstCta || null);
    }

    card.addEventListener('mouseenter', () => setActiveCourseCard(article));
    card.addEventListener('focusin', () => setActiveCourseCard(article));
  });

  setActiveCourseCard(articles[0]);
  refreshCourseCardCopy();

  // IntersectionObserver is retained because it is compositor-friendly and avoids scroll-event work.
  if ('IntersectionObserver' in window) {
    const readingObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target) setActiveCourseCard(visible.target);
    }, { rootMargin: '-22% 0px -60% 0px', threshold: [0.12, 0.32] });
    articles.forEach((article) => readingObserver.observe(article));
  }

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.attributeName === 'class')) {
      refreshCourseCardCopy();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

window.addEventListener('DOMContentLoaded', installCourseCardOverdrive);
