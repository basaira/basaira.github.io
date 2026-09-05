import { firebaseConfig } from "./firebase-config.js";
import { focusInvalidField, safeStorage, createSubmissionToken, clearSubmissionToken, sanitizeAttributionMap } from "./harden-v1.js";
// ==========================================
// Firebase imports
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore,
  setDoc,
  serverTimestamp,
  getDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// Firebase setup — basair-academy-4a1d0
// ==========================================
const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true
});

// ==========================================
// Splash screen safety
// ==========================================
let splashReleased = false;

function hideSplash(delay) {
  const wait = typeof delay === "number" ? delay : 420;

  if (window.BasairBoot && typeof window.BasairBoot.ready === "function") {
    window.setTimeout(function () { window.BasairBoot.ready(); }, Math.max(0, wait));
    return;
  }

  window.setTimeout(function () {
    const splash = document.getElementById("splash-screen");
    if (!splash || splashReleased) return;

    splashReleased = true;
    splash.classList.add("splash-hidden");
    splash.style.setProperty("opacity", "0", "important");
    splash.style.setProperty("visibility", "hidden", "important");
    splash.style.setProperty("pointer-events", "none", "important");
    splash.style.setProperty("filter", "blur(6px)", "important");

    window.setTimeout(function () {
      const currentSplash = document.getElementById("splash-screen");
      if (currentSplash) {
        currentSplash.style.setProperty("display", "none", "important");
      }
    }, 360);
  }, wait);
}

/*
 * Preserve the historical fallback timers, but activate them only when the
 * authoritative inline BasairBoot controller is genuinely unavailable.
 */
if (!window.BasairBoot || typeof window.BasairBoot.ready !== "function") {
  window.addEventListener("load", function () {
    hideSplash(420);
  }, { once: true });

  window.setTimeout(function () {
    hideSplash(0);
  }, 2500);
}

// ==========================================
// Language system
// ==========================================
const supportedLanguages = ["ar", "en", "fr", "ru", "uz"];
const DEFAULT_LANGUAGE = "en";

const languageMetadata = Object.freeze({
  ar: { name: "العربية", code: "AR", dir: "rtl" },
  en: { name: "English", code: "EN", dir: "ltr" },
  fr: { name: "Français", code: "FR", dir: "ltr" },
  ru: { name: "Русский", code: "RU", dir: "ltr" },
  uz: { name: "O‘zbekcha", code: "UZ", dir: "ltr" }
});

const accessibilityLabels = Object.freeze({
  ar: { language: "اللغة", openMenu: "إظهار القائمة", closeMenu: "إغلاق القائمة", mobileNavigation: "القائمة المحمولة", previousTestimonial: "الرأي السابق", nextTestimonial: "الرأي التالي" },
  en: { language: "Language", openMenu: "Open menu", closeMenu: "Close menu", mobileNavigation: "Mobile navigation", previousTestimonial: "Previous testimonial", nextTestimonial: "Next testimonial" },
  fr: { language: "Langue", openMenu: "Ouvrir le menu", closeMenu: "Fermer le menu", mobileNavigation: "Navigation mobile", previousTestimonial: "Témoignage précédent", nextTestimonial: "Témoignage suivant" },
  ru: { language: "Язык", openMenu: "Открыть меню", closeMenu: "Закрыть меню", mobileNavigation: "Мобильная навигация", previousTestimonial: "Предыдущий отзыв", nextTestimonial: "Следующий отзыв" },
  uz: { language: "Til", openMenu: "Menyuni ochish", closeMenu: "Menyuni yopish", mobileNavigation: "Mobil navigatsiya", previousTestimonial: "Oldingi fikr", nextTestimonial: "Keyingi fikr" }
});

const pageTitles = {
  ar: "أكاديمية بصائر | نور يهدي، وعلم يبني",
  en: "Basair Academy | A Guiding Light, Building Knowledge",
  fr: "Académie Bassaïr | Une lumière qui guide, un savoir qui bâtit",
  ru: "Академия Басаир | Свет направляет, знание созидает",
  uz: "Basair Academy | Yo‘l ko‘rsatuvchi nur, bunyod etuvchi ilm"
};

const trackTranslations = {
  ar: [
    { value: "", text: "-- اختر المسار الأكاديمي --" },
    { value: "Quran and Tajweed", text: "مسار حفظ القرآن وإتقان التجويد" },
    { value: "Arabic from Scratch", text: "دورة اللغة العربية من الصفر" },
    { value: "Specialization", text: "التخصص اللغوي وعلوم الآلة" }
  ],
  en: [
    { value: "", text: "-- Select Academic Track --" },
    { value: "Quran and Tajweed", text: "Track of Quran Memorization & Tajweed" },
    { value: "Arabic from Scratch", text: "Arabic Language from Scratch" },
    { value: "Specialization", text: "Linguistic Specialization & Instrumental Sciences" }
  ],
  fr: [
    { value: "", text: "-- Choisir le parcours --" },
    { value: "Quran and Tajweed", text: "Mémorisation du Coran et Tajwîd" },
    { value: "Arabic from Scratch", text: "Langue arabe de zéro" },
    { value: "Specialization", text: "Spécialisation linguistique" }
  ],
  ru: [
    { value: "", text: "-- Выберите курс --" },
    { value: "Quran and Tajweed", text: "Заучивание Корана и таджвид" },
    { value: "Arabic from Scratch", text: "Арабский язык с нуля" },
    { value: "Specialization", text: "Лингвистическая специализация" }
  ],
  uz: [
    { value: "", text: "-- Yo‘nalishni tanlang --" },
    { value: "Quran and Tajweed", text: "Qur’on va tajvid" },
    { value: "Arabic from Scratch", text: "Arab tili noldan" },
    { value: "Specialization", text: "Arab tili fanlari bo‘yicha ixtisoslashuv" }
  ]
};

function getSafeLang(lang) {
  return supportedLanguages.includes(lang) ? lang : "en";
}

function getInitialLanguage() {
  // The public site always opens in English. A visitor can switch language
  // instantly for the current page without old localStorage values changing
  // the default on a later visit.
  return DEFAULT_LANGUAGE;
}

function updateLanguageControls(lang) {
  const meta = languageMetadata[lang] || languageMetadata.en;
  const labels = accessibilityLabels[lang] || accessibilityLabels.en;
  const desktopName = document.getElementById("desktop-language-name");
  const desktopCode = document.getElementById("desktop-language-code");
  const mobileCode = document.getElementById("mobile-language-code");
  const desktopButton = document.getElementById("lang-btn");
  const mobileButton = document.getElementById("mobile-lang-btn");
  const mobileMenuButton = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuClose = document.getElementById("mobile-menu-close");
  const previousTestimonial = document.getElementById("slider-prev-btn");
  const nextTestimonial = document.getElementById("slider-next-btn");
  if (desktopName) desktopName.textContent = meta.name;
  if (desktopCode) desktopCode.textContent = meta.code;
  if (mobileCode) mobileCode.textContent = meta.code;
  if (desktopButton) desktopButton.setAttribute("aria-label", labels.language + " — " + meta.name);
  if (mobileButton) mobileButton.setAttribute("aria-label", labels.language + " — " + meta.name);
  if (mobileMenuButton) {
    const isOpen = mobileMenuButton.getAttribute("aria-expanded") === "true";
    mobileMenuButton.setAttribute("aria-label", isOpen ? labels.closeMenu : labels.openMenu);
  }
  if (mobileMenu) mobileMenu.setAttribute("aria-label", labels.mobileNavigation);
  if (mobileMenuClose) mobileMenuClose.setAttribute("aria-label", labels.closeMenu);
  if (previousTestimonial) previousTestimonial.setAttribute("aria-label", labels.previousTestimonial);
  if (nextTestimonial) nextTestimonial.setAttribute("aria-label", labels.nextTestimonial);
  document.querySelectorAll("[data-lang]").forEach(function (element) {
    const isActive = element.getAttribute("data-lang") === lang;
    element.classList.toggle("is-active", isActive);
    if (isActive) element.setAttribute("aria-current", "true");
    else element.removeAttribute("aria-current");
  });
}

function updateDynamicTrackSelect(lang) {
  const select = document.getElementById("dynamic-track-select");
  if (!select) return;

  select.textContent = "";
  const options = trackTranslations[lang] || trackTranslations.en;

  options.forEach(function (item) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.text;

    if (item.value === "") {
      option.disabled = true;
      option.selected = true;
    }

    select.appendChild(option);
  });
}

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function canUseViewTransitions() {
  return typeof document.startViewTransition === "function" && !prefersReducedMotion();
}

function commitLanguageState(safeLang) {
  const root = document.getElementById("html-root");
  const body = document.getElementById("body-root");

  if (root) {
    root.lang = safeLang;
    root.dir = (languageMetadata[safeLang] || languageMetadata.en).dir;
  }

  if (body) {
    Array.from(body.classList).forEach(function (className) {
      if (className.startsWith("route-")) {
        body.classList.remove(className);
      }
    });

    body.classList.add("route-" + safeLang, "relative");
  }

  const title = document.getElementById("page-title");

  if (title) {
    title.textContent = pageTitles[safeLang] || pageTitles.en;
  }

  updateDynamicTrackSelect(safeLang);
  updateLanguageControls(safeLang);
 
}

function setLang(lang) {
  const safeLang = getSafeLang(lang);
  const root = document.getElementById("html-root");
  const currentLang = getSafeLang(root?.lang || DEFAULT_LANGUAGE);

  if (currentLang === safeLang) {
    closeDropdown();
    closeMobileLangMenu();
    return;
  }

  commitLanguageState(safeLang);
}
 


// ==========================================
// Public UI helpers
// ==========================================
function toggleLangMenu() {
  const dropdown = document.getElementById("langDropdown");
  const btn = document.getElementById("lang-btn");
  if (!dropdown || !btn) return;

  dropdown.classList.toggle("active");
  btn.setAttribute("aria-expanded", dropdown.classList.contains("active") ? "true" : "false");
}

function closeDropdown() {
  const dropdown = document.getElementById("langDropdown");
  const btn = document.getElementById("lang-btn");

  if (dropdown) dropdown.classList.remove("active");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function toggleMobileLangMenu() {
  const dropdown = document.getElementById("mobileLangDropdown");
  const btn = document.getElementById("mobile-lang-btn");
  if (!dropdown || !btn) return;
  const nextOpen = !dropdown.classList.contains("active");
  closeDropdown();
  closeMobileMenu();
  dropdown.classList.toggle("active", nextOpen);
  btn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
}

function closeMobileLangMenu() {
  const dropdown = document.getElementById("mobileLangDropdown");
  const btn = document.getElementById("mobile-lang-btn");
  if (dropdown) dropdown.classList.remove("active");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function syncMobileMenuAccessibility(isOpen) {
  const menu = document.getElementById("mobile-menu");
  const btn = document.getElementById("mobile-menu-btn");
  const closeButton = document.getElementById("mobile-menu-close");
  const lang = getSafeLang(document.getElementById("html-root")?.lang || DEFAULT_LANGUAGE);
  const labels = accessibilityLabels[lang] || accessibilityLabels.en;

  if (menu) {
    menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    if (isOpen) menu.removeAttribute("inert");
    else menu.setAttribute("inert", "");
  }
  if (btn) {
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    btn.setAttribute("aria-label", isOpen ? labels.closeMenu : labels.openMenu);
  }
  if (closeButton) closeButton.setAttribute("aria-label", labels.closeMenu);
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-backdrop");
  const closeButton = document.getElementById("mobile-menu-close");
  if (!menu) return;

  if (menu.classList.contains("active")) {
    closeMobileMenu();
    return;
  }

  closeMobileLangMenu();
  menu.classList.add("active");
  if (backdrop) backdrop.classList.add("active");
  syncMobileMenuAccessibility(true);
  document.body.style.overflow = "hidden";
  window.requestAnimationFrame(function () {
    if (closeButton) closeButton.focus({ preventScroll: true });
  });
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-backdrop");
  const btn = document.getElementById("mobile-menu-btn");
  const focusWasInside = Boolean(menu && document.activeElement && menu.contains(document.activeElement));

  if (menu) menu.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
  syncMobileMenuAccessibility(false);
  document.body.style.overflow = "";

  if (focusWasInside && btn && window.innerWidth < 1024) {
    window.requestAnimationFrame(function () {
      btn.focus({ preventScroll: true });
    });
  }
}

window.setLang = setLang;
window.toggleLangMenu = toggleLangMenu;
window.closeDropdown = closeDropdown;
window.toggleMobileLangMenu = toggleMobileLangMenu;
window.closeMobileLangMenu = closeMobileLangMenu;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.hidePasswordModal = function () {};
window.showPasswordModal = function () {
  window.location.href = "./admin.html";
};

// ==========================================
// General UI initialization
// ==========================================
function initLanguageButtons() {
  document.querySelectorAll("[data-lang]").forEach(function (button) {
    if (button.dataset.langBound === "true") return;
    button.dataset.langBound = "true";

    button.addEventListener("click", function (event) {
      const target = event.target.closest("[data-lang]");
      if (!target) return;
      setLang(target.getAttribute("data-lang"));
    });
  });
}

function initGlobalClicks() {
  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (!target.closest("#lang-btn") && !target.closest("#langDropdown")) {
      closeDropdown();
    }
    if (!target.closest("#mobile-lang-btn") && !target.closest("#mobileLangDropdown")) {
      closeMobileLangMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDropdown();
      closeMobileLangMenu();
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024) { closeMobileMenu(); closeMobileLangMenu(); }
  });
}

function initMotionLifecycle() {
  const testimonials = document.getElementById("testimonials");
  if (!testimonials) return;

  function syncPausedState(isVisible) {
    const shouldPause = document.hidden || !isVisible;
    testimonials.classList.toggle("is-motion-paused", shouldPause);
  }

  let isVisible = false;
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== testimonials) return;
        isVisible = entry.isIntersecting;
        syncPausedState(isVisible);
      });
    }, { rootMargin: "120px 0px", threshold: 0.01 });
    observer.observe(testimonials);
  } else {
    isVisible = true;
    syncPausedState(true);
  }

  document.addEventListener("visibilitychange", function () {
    syncPausedState(isVisible);
  });
}

function initScrollEffects() {
  const nav = document.getElementById("navbar");
  const sections = Array.from(document.querySelectorAll("main > section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link[href^='#']"));
  if (!nav && !navLinks.length) return;

  let offsets = [];
  let ticking = false;
  let resizeRaf = 0;
  let activeId = "";
  let scrolledState = null;

  function measureSections() {
    offsets = sections.map(function (section) {
      return { id: section.id, top: section.offsetTop };
    }).sort(function (a, b) { return a.top - b.top; });
  }

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    navLinks.forEach(function (link) {
      link.classList.toggle("active-section", link.getAttribute("href") === "#" + id);
    });
  }

  function run() {
    ticking = false;
    const y = Math.max(0, window.scrollY || 0);
    const nextScrolled = y > 20;

    if (nav && nextScrolled !== scrolledState) {
      scrolledState = nextScrolled;
      nav.classList.toggle("topbar-scrolled", nextScrolled);
      nav.classList.toggle("shadow-sm", nextScrolled);
      nav.classList.toggle("border-[#D4AF37]/20", nextScrolled);
      nav.classList.toggle("border-transparent", !nextScrolled);
    }

    if (offsets.length) {
      const probe = y + Math.min(140, Math.max(88, window.innerHeight * .12));
      let nextId = offsets[0].id;
      for (let i = 0; i < offsets.length; i += 1) {
        if (probe >= offsets[i].top) nextId = offsets[i].id;
        else break;
      }
      setActive(nextId);
    }
  }

  function requestRun() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(run);
  }

  function requestMeasure() {
    if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(function () {
      resizeRaf = 0;
      measureSections();
      requestRun();
    });
  }

  measureSections();
  window.addEventListener("scroll", requestRun, { passive: true });
  window.addEventListener("resize", requestMeasure, { passive: true });
  window.addEventListener("orientationchange", requestMeasure, { passive: true });
  window.addEventListener("load", requestMeasure, { once: true });
  run();
}

// ==========================================
// Videos
// ==========================================
function initVideoFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  if (!filterButtons.length) return;

  filterButtons.forEach(function (btn) {
    if (btn.dataset.filterBound === "true") return;
    btn.dataset.filterBound = "true";

    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) {
        b.classList.remove("bg-[#D4AF37]", "text-[#0A1F44]", "shadow-[0_0_15px_rgba(212,175,55,0.4)]");
        b.classList.add("bg-white/10", "text-white");
        b.setAttribute("aria-pressed", "false");
      });

      btn.classList.remove("bg-white/10", "text-white");
      btn.classList.add("bg-[#D4AF37]", "text-[#0A1F44]", "shadow-[0_0_15px_rgba(212,175,55,0.4)]");
      btn.setAttribute("aria-pressed", "true");
      applyVideoFilter(btn.getAttribute("data-filter") || "all");
    });
  });

  const active = Array.from(filterButtons).find(function (btn) {
    return btn.getAttribute("aria-pressed") === "true" || btn.classList.contains("bg-[#D4AF37]");
  }) || Array.from(filterButtons).find(function (btn) {
    return btn.getAttribute("data-filter") === "all";
  });

  applyVideoFilter(active ? active.getAttribute("data-filter") || "all" : "all");
}

function updateVideoGridLayout(filterValue) {
  const grid = document.getElementById("video-grid");
  if (!grid) return;

  const visibleCards = Array.from(grid.querySelectorAll(".video-card")).filter(function (card) {
    const category = card.getAttribute("data-category") || "all";
    return filterValue === "all" || category === filterValue;
  });

  grid.classList.remove("video-grid--single", "video-grid--double", "video-grid--multi");
  if (visibleCards.length === 1) grid.classList.add("video-grid--single");
  else if (visibleCards.length === 2) grid.classList.add("video-grid--double");
  else if (visibleCards.length > 2) grid.classList.add("video-grid--multi");

  grid.dataset.visibleCount = String(visibleCards.length);
}

const videoFilterTimers = new WeakMap();
let activeVideoFilterTransition = null;

function applyVideoFilterImmediate(filterValue) {
  updateVideoGridLayout(filterValue);
  document.querySelectorAll(".video-card").forEach(function (card) {
    const category = card.getAttribute("data-category") || "all";
    const shouldShow = filterValue === "all" || category === filterValue;
    const pendingTimer = videoFilterTimers.get(card);
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      videoFilterTimers.delete(card);
    }
    card.style.display = shouldShow ? "block" : "none";
    card.style.opacity = shouldShow ? "1" : "0";
    card.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  });
}

function applyVideoFilter(filterValue) {
  const grid = document.getElementById("video-grid");
  const canMorphGrid = Boolean(
    grid &&
    canUseViewTransitions() &&
    document.body?.classList.contains("motion-entered")
  );

  if (canMorphGrid) {
    if (activeVideoFilterTransition && typeof activeVideoFilterTransition.skipTransition === "function") {
      activeVideoFilterTransition.skipTransition();
    }

    grid.style.viewTransitionName = "basair-video-grid";
    document.documentElement.classList.add("basair-filter-transition");
    const transition = document.startViewTransition(function () {
      applyVideoFilterImmediate(filterValue);
    });
    activeVideoFilterTransition = transition;

    transition.finished.finally(function () {
      if (activeVideoFilterTransition === transition) activeVideoFilterTransition = null;
      grid.style.viewTransitionName = "";
      document.documentElement.classList.remove("basair-filter-transition");
    });
    return;
  }

  updateVideoGridLayout(filterValue);
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const exitDuration = reducedMotion ? 0 : 150;

  document.querySelectorAll(".video-card").forEach(function (card) {
    const category = card.getAttribute("data-category") || "all";
    const shouldShow = filterValue === "all" || category === filterValue;
    const pendingTimer = videoFilterTimers.get(card);
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      videoFilterTimers.delete(card);
    }

    if (shouldShow) {
      card.style.display = "block";
      card.setAttribute("aria-hidden", "false");
      window.requestAnimationFrame(function () {
        card.style.opacity = "1";
      });
      return;
    }

    card.style.opacity = "0";
    card.setAttribute("aria-hidden", "true");
    const timer = window.setTimeout(function () {
      card.style.display = "none";
      videoFilterTimers.delete(card);
    }, exitDuration);
    videoFilterTimers.set(card, timer);
  });
}

function isSafeHttpsUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function getYouTubeIdFromUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;

  try {
    const url = new URL(rawUrl.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || null;
    } else if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(hostname)) {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v");
      else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
        if (match) videoId = match[1];
      }
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch (error) {
    return null;
  }
}

function derivePosterFromVideoUrl(rawUrl) {
  const youtubeId = getYouTubeIdFromUrl(rawUrl);
  if (youtubeId) {
    return "https://i.ytimg.com/vi/" + encodeURIComponent(youtubeId) + "/hqdefault.jpg";
  }

  try {
    const url = new URL(String(rawUrl || "").trim());
    const hostname = url.hostname.toLowerCase();
    if (hostname === "res.cloudinary.com" && /\/video\/upload\//.test(url.pathname)) {
      let pathname = url.pathname.replace("/video/upload/", "/video/upload/so_0,q_auto,f_jpg/");
      pathname = pathname.replace(/\.(mp4|webm|mov|m4v|ogg)$/i, ".jpg");
      return url.origin + pathname + url.search;
    }
  } catch (error) {
    // Fall through to the local brand placeholder.
  }

  return "logo.png";
}

function normalizeVideo(video) {
  if (!video || typeof video !== "object") return null;

  const title = typeof video.title === "string" ? video.title.trim() : "";
  const category = typeof video.category === "string" ? video.category.trim() : "all";
  const posterUrlRaw = typeof video.posterUrl === "string"
    ? video.posterUrl.trim()
    : (typeof video.imageUrl === "string" ? video.imageUrl.trim() : "");
  const videoUrl = typeof video.videoUrl === "string" ? video.videoUrl.trim() : "";
  const published = video.published !== false;

  if (!title || title.length > 120 || !published || !isSafeHttpsUrl(videoUrl)) return null;

  const allowedCategories = ["all", "quran", "arabic", "islamic", "tajweed", "grammar", "specialization"];
  const derivedPoster = derivePosterFromVideoUrl(videoUrl);

  return {
    title: title,
    category: allowedCategories.includes(category) ? category : "all",
    posterUrl: isSafeHttpsUrl(posterUrlRaw) ? posterUrlRaw : derivedPoster,
    fallbackPosterUrl: derivedPoster,
    videoUrl: videoUrl,
    published: true
  };
}

// ==========================================
// Embedded Video Player
// Supports YouTube and direct HTTPS media (MP4/WebM/Ogg).
// The media file remains outside Firebase; Firestore stores metadata only.
// ==========================================

const videoPlayer = (function () {
  let modal = null;
  let frame = null;
  let nativeVideo = null;
  let titleElement = null;
  let closeButton = null;
  let lastFocusedElement = null;
  let activeSourceMedia = null;
  let inertSiblings = [];
  let activeModalTransition = null;
  let modalOperation = 0;
  let modalState = "closed";

  function getYouTubeVideoId(rawUrl) {
    return getYouTubeIdFromUrl(rawUrl);
  }

  function getEmbedUrl(rawUrl) {
    const videoId = getYouTubeVideoId(rawUrl);
    if (!videoId) return null;

    const params = new URLSearchParams({
      autoplay: "1",
      playsinline: "1",
      rel: "0"
    });

    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?" + params.toString();
  }

  function ensureModal() {
    if (modal) return;

    modal = document.createElement("div");
    modal.id = "video-player-modal";
    modal.className = "video-player-modal";
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div class="video-player-modal__backdrop" data-video-close aria-hidden="true"></div>
      <div class="video-player-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="video-player-title">
        <div class="video-player-modal__header">
          <h3 id="video-player-title" class="video-player-modal__title"></h3>
          <button type="button" class="video-player-modal__close" data-video-close aria-label="إغلاق الفيديو">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <div class="video-player-modal__stage">
          <iframe
            class="video-player-modal__frame"
            title="مشغل فيديو أكاديمية بصائر"
            src=""
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
          <video
            class="video-player-modal__native"
            controls
            playsinline
            preload="metadata"
            controlslist="nodownload"
          ></video>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    frame = modal.querySelector(".video-player-modal__frame");
    nativeVideo = modal.querySelector(".video-player-modal__native");
    titleElement = modal.querySelector(".video-player-modal__title");
    closeButton = modal.querySelector(".video-player-modal__close");

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-video-close]")) close();
    });

    document.addEventListener("keydown", function (event) {
      if (!modal || !modal.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = [closeButton, frame && !frame.hidden ? frame : null, nativeVideo && !nativeVideo.hidden ? nativeVideo : null]
        .filter(function (element) { return element instanceof HTMLElement; });
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function setBackgroundInert(active) {
    if (!document.body || !modal) return;

    if (active) {
      inertSiblings = Array.from(document.body.children).filter(function (element) {
        return element instanceof HTMLElement &&
          element !== modal &&
          !["SCRIPT", "STYLE"].includes(element.tagName) &&
          !element.inert;
      });
      inertSiblings.forEach(function (element) { element.inert = true; });
      return;
    }

    inertSiblings.forEach(function (element) {
      if (element && element.isConnected) element.inert = false;
    });
    inertSiblings = [];
  }

  function resetMedia() {
    if (frame) {
      frame.src = "";
      frame.hidden = true;
    }

    if (nativeVideo) {
      nativeVideo.pause();
      nativeVideo.removeAttribute("src");
      nativeVideo.removeAttribute("poster");
      nativeVideo.hidden = true;
      nativeVideo.load();
    }
  }

  function populateAndShow(video) {
    resetMedia();
    titleElement.textContent = video.title || "فيديو";

    const embedUrl = getEmbedUrl(video.videoUrl);
    if (embedUrl && frame) {
      frame.hidden = false;
      frame.src = embedUrl;
    } else if (nativeVideo) {
      nativeVideo.hidden = false;
      nativeVideo.src = video.videoUrl;
      if (isSafeHttpsUrl(video.posterUrl)) nativeVideo.poster = video.posterUrl;
      nativeVideo.load();
      const playAttempt = nativeVideo.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {
          // Controls remain available if autoplay is blocked by the browser.
        });
      }
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("video-player-open");
    setBackgroundInert(true);
  }

  function focusCloseButton() {
    window.requestAnimationFrame(function () {
      if (closeButton) closeButton.focus({ preventScroll: true });
    });
  }

  function open(video, sourceMedia) {
    ensureModal();
    if (!video || !isSafeHttpsUrl(video.videoUrl) || !titleElement || modalState !== "closed") return;

    const operation = ++modalOperation;
    modalState = "opening";
    if (activeModalTransition && typeof activeModalTransition.skipTransition === "function") {
      activeModalTransition.skipTransition();
    }

    lastFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    activeSourceMedia = sourceMedia instanceof HTMLElement ? sourceMedia : null;

    const stage = modal.querySelector(".video-player-modal__stage");
    const sourceCanMorph = Boolean(activeSourceMedia && activeSourceMedia.isConnected && activeSourceMedia.getClientRects().length);

    if (canUseViewTransitions() && stage && sourceCanMorph) {
      activeSourceMedia.style.viewTransitionName = "basair-video-media";
      document.documentElement.classList.add("basair-video-transition");
      const transition = document.startViewTransition(function () {
        activeSourceMedia.style.viewTransitionName = "none";
        populateAndShow(video);
        stage.style.viewTransitionName = "basair-video-media";
      });
      activeModalTransition = transition;

      transition.finished.finally(function () {
        if (stage) stage.style.viewTransitionName = "";
        if (activeSourceMedia) activeSourceMedia.style.viewTransitionName = "";
        document.documentElement.classList.remove("basair-video-transition");
        if (activeModalTransition === transition) activeModalTransition = null;
        if (operation !== modalOperation) return;
        modalState = "open";
        focusCloseButton();
      });
      return;
    }

    populateAndShow(video);
    modalState = "open";
    focusCloseButton();
  }

  function close() {
    if (!modal || modalState === "closed" || modalState === "closing") return;

    const operation = ++modalOperation;
    modalState = "closing";
    if (activeModalTransition && typeof activeModalTransition.skipTransition === "function") {
      activeModalTransition.skipTransition();
    }

    const stage = modal.querySelector(".video-player-modal__stage");
    const returnMedia = activeSourceMedia && activeSourceMedia.isConnected && activeSourceMedia.getClientRects().length
      ? activeSourceMedia
      : null;
    const restoreFocus = lastFocusedElement;

    function hideAndReset() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      resetMedia();
      document.body.classList.remove("video-player-open");
      setBackgroundInert(false);
    }

    function finishClose() {
      if (stage) stage.style.viewTransitionName = "";
      if (returnMedia) returnMedia.style.viewTransitionName = "";
      document.documentElement.classList.remove("basair-video-transition");
      activeSourceMedia = null;
      lastFocusedElement = null;
      if (operation !== modalOperation) return;
      modalState = "closed";
      if (restoreFocus && restoreFocus.isConnected) restoreFocus.focus({ preventScroll: true });
    }

    if (canUseViewTransitions() && stage && returnMedia) {
      stage.style.viewTransitionName = "basair-video-media";
      document.documentElement.classList.add("basair-video-transition");
      const transition = document.startViewTransition(function () {
        stage.style.viewTransitionName = "none";
        hideAndReset();
        returnMedia.style.viewTransitionName = "basair-video-media";
      });
      activeModalTransition = transition;
      transition.finished.finally(function () {
        if (activeModalTransition === transition) activeModalTransition = null;
        finishClose();
      });
      return;
    }

    hideAndReset();
    finishClose();
  }

  return { open: open, close: close };
})();

function createVideoCard(video) {
  const card = document.createElement("article");
  card.className = "video-card group cursor-pointer animate-fade-in-up dynamic-video";
  card.setAttribute("data-category", video.category);
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "تشغيل الفيديو: " + video.title);

  function openVideo(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    videoPlayer.open(video, imageWrapper);
  }

  card.addEventListener("click", function (event) {
    if (event.target.closest("button")) return;
    openVideo(event);
  });

  card.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") openVideo(event);
  });

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "video-card__media relative w-full rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-lg";

  const overlay = document.createElement("div");
  overlay.className = "video-card__overlay absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10";

  const img = document.createElement("img");
  img.src = video.posterUrl;
  img.alt = video.title;
  img.loading = "lazy";
  img.decoding = "async";
  img.className = "video-card__poster w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700";
  img.addEventListener("error", function () {
    const fallback = video.fallbackPosterUrl || derivePosterFromVideoUrl(video.videoUrl);
    const fallbackAbsolute = fallback ? new URL(fallback, window.location.href).href : "";

    if (img.dataset.fallbackStage !== "derived" && fallbackAbsolute && img.src !== fallbackAbsolute) {
      img.dataset.fallbackStage = "derived";
      img.src = fallback;
      return;
    }

    if (img.dataset.fallbackStage !== "brand") {
      img.dataset.fallbackStage = "brand";
      img.src = "logo.png";
      img.classList.add("video-card__poster--brand");
    }
  });

  const playLayer = document.createElement("div");
  playLayer.className = "absolute inset-0 flex items-center justify-center z-20";

  const playCircle = document.createElement("button");
  playCircle.type = "button";
  playCircle.setAttribute("aria-label", "تشغيل الفيديو داخل الموقع: " + video.title);
  playCircle.className = "video-card__play rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-[#D4AF37]/90 transition-all";
  playCircle.addEventListener("click", openVideo);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "w-6 h-6 text-white translate-x-0.5");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M5.536 21.886a1.004 1.004 0 001.033-.064l13-9a1 1 0 000-1.644l-13-9A1 1 0 005 3v18a1 1 0 00.536.886z");
  svg.appendChild(path);
  playCircle.appendChild(svg);
  playLayer.appendChild(playCircle);
  imageWrapper.appendChild(overlay);
  imageWrapper.appendChild(img);
  imageWrapper.appendChild(playLayer);

  const title = document.createElement("h3");
  title.className = "video-card__title text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors";
  title.textContent = video.title;

  const desc = document.createElement("p");
  desc.className = "video-card__meta text-white/60 text-sm font-medium";
  const activeLang = getSafeLang(document.documentElement.lang || DEFAULT_LANGUAGE);
  const sourceLabel = getYouTubeSourceLabel(video.videoUrl, activeLang);
  desc.textContent = sourceLabel;

  card.appendChild(imageWrapper);
  card.appendChild(title);
  card.appendChild(desc);
  return card;
}

function getYouTubeSourceLabel(url, lang) {
  const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(String(url || ""));
  const labels = {
    ar: isYouTube ? "مشاهدة داخل بصائر عبر YouTube" : "فيديو مستضاف خارجيًا",
    en: isYouTube ? "Watch in Basair via YouTube" : "Externally hosted video",
    fr: isYouTube ? "Voir dans Bassaïr via YouTube" : "Vidéo hébergée à l’extérieur",
    ru: isYouTube ? "Смотреть в Басаир через YouTube" : "Видео на внешнем хостинге",
    uz: isYouTube ? "Basair ichida YouTube orqali ko‘rish" : "Tashqi xostingdagi video"
  };
  return labels[lang] || labels.en;
}

// ==========================================
// Slider
// ==========================================
function initSlider() {
  const setup = function () {
    const track = document.getElementById("testimonials-track");
    if (!track || track.dataset.sliderInitialized === "true") return;

    const slides = Array.from(document.querySelectorAll(".testimonial-slide"));
    if (!slides.length) return;

    track.dataset.sliderInitialized = "true";

    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    track.appendChild(firstClone);
    track.insertBefore(lastClone, slides[0]);

    const allSlides = document.querySelectorAll(".testimonial-slide");
    let currentIndex = 1;
    const slideWidth = 100;

    function updateSlider(animate) {
      track.style.transition = animate === false ? "none" : "transform 0.7s ease-in-out";
      track.style.transform = "translateX(" + currentIndex * slideWidth + "%)";
    }

    updateSlider(false);

    track.addEventListener("transitionend", function () {
      if (allSlides[currentIndex] && allSlides[currentIndex].isEqualNode(firstClone)) {
        currentIndex = 1;
        updateSlider(false);
      }

      if (allSlides[currentIndex] && allSlides[currentIndex].isEqualNode(lastClone)) {
        currentIndex = allSlides.length - 2;
        updateSlider(false);
      }
    });

    function moveToNext() {
      if (currentIndex >= allSlides.length - 1) return;
      currentIndex += 1;
      updateSlider(true);
    }

    function moveToPrev() {
      if (currentIndex <= 0) return;
      currentIndex -= 1;
      updateSlider(true);
    }

    const nextBtn = document.getElementById("slider-next-btn");
    const prevBtn = document.getElementById("slider-prev-btn");

    if (nextBtn) nextBtn.addEventListener("click", moveToNext);
    if (prevBtn) prevBtn.addEventListener("click", moveToPrev);

    let autoPlay = window.setInterval(moveToNext, 6000);
    [nextBtn, prevBtn].forEach(function (btn) {
      if (!btn) return;

      btn.addEventListener("mouseenter", function () {
        window.clearInterval(autoPlay);
      });

      btn.addEventListener("mouseleave", function () {
        autoPlay = window.setInterval(moveToNext, 6000);
      });
    });
  };

  if (document.readyState === "complete") setup();
  else window.addEventListener("load", setup, { once: true });
}

// ==========================================
// Marketing attribution & funnel tracking
// ==========================================
function sanitizeMarketingValue(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength || 300);
}

function captureMarketingAttribution() {
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"];
  const current = {
    landingPath: window.location.pathname,
    referrer: sanitizeMarketingValue(document.referrer, 500),
    capturedAt: new Date().toISOString()
  };

  keys.forEach(function (key) {
    const value = params.get(key);
    if (value) current[key] = sanitizeMarketingValue(value, 200);
  });

  try {
    const firstKey = "basair_first_touch_attribution";
    if (!localStorage.getItem(firstKey)) {
      localStorage.setItem(firstKey, JSON.stringify(current));
    }
    localStorage.setItem("basair_last_touch_attribution", JSON.stringify(current));
    let storedFirst = {};
    try { storedFirst = JSON.parse(localStorage.getItem(firstKey) || "{}"); } catch (_) {}
    return { firstTouch: sanitizeAttributionMap(storedFirst), lastTouch: sanitizeAttributionMap(current) };
  } catch (error) {
    return { firstTouch: sanitizeAttributionMap(current), lastTouch: sanitizeAttributionMap(current) };
  }
}

const marketingAttribution = captureMarketingAttribution();

function trackMarketingEvent(name, extra) {
  const payload = Object.assign({
    event: name,
    route: window.location.pathname,
    language: getSafeLang(document.documentElement.lang || DEFAULT_LANGUAGE)
  }, extra || {});

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }

  if (typeof window.fbq === "function") {
    if (name === "assessment_submit_success") window.fbq("track", "CompleteRegistration", payload);
    else if (name === "assessment_start") window.fbq("track", "Lead", payload);
    else window.fbq("trackCustom", name, payload);
  }
}

function initMarketingTracking() {
  trackMarketingEvent("academy_page_view", {
    utm_source: marketingAttribution.lastTouch.utm_source || "",
    utm_campaign: marketingAttribution.lastTouch.utm_campaign || ""
  });

  document.querySelectorAll('a[href="#contact"], a[href="#conversion-paths"], a[href*="/en/"], a[href*="/ru/"], a[href*="/uz/"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackMarketingEvent("conversion_cta_click", { href: link.getAttribute("href") || "" });
    });
  });
}

// ==========================================
// Enrollment / free assessment form
// ==========================================
function initEnrollmentForm() {
  const form = document.getElementById("enrollment-form");
  if (!form) return;

  form.addEventListener("input", function () {
    const successMsg = document.getElementById("success-message");
    const errorMsg = document.getElementById("error-message");
    const recovery = document.getElementById("assessment-recovery");
    if (successMsg && successMsg.dataset.delightState === "received") {
      successMsg.classList.add("hidden");
      successMsg.removeAttribute("data-delight-state");
    }
    if (errorMsg && errorMsg.dataset.delightState === "recovery") {
      errorMsg.classList.add("hidden");
      errorMsg.removeAttribute("data-delight-state");
    }
    if (recovery) recovery.remove();
    form.removeAttribute("data-delight-state");
    if (form.dataset.nativeState === "success" || form.dataset.nativeState === "error") {
      delete form.dataset.nativeState;
    }
  }, { passive: true });

  let assessmentSubmissionInFlight = false;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (assessmentSubmissionInFlight) return;
    const honeypot = form.elements.namedItem("website");
    if (honeypot && String(honeypot.value || "").trim()) {
      // Quietly ignore basic bot submissions. Backend protections remain authoritative.
      form.reset();
      return;
    }

    const submitBtn = document.getElementById("submit-btn");
    const btnText = document.getElementById("btn-text");
    const btnSpinner = document.getElementById("btn-spinner");
    const successMsg = document.getElementById("success-message");
    const errorMsg = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");

    if (!submitBtn || !btnText || !btnSpinner || !successMsg || !errorMsg || !errorText) return;

    function unlock() {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
      submitBtn.removeAttribute("aria-busy");
      form.removeAttribute("aria-busy");
      if (form.dataset.nativeState === "submitting") delete form.dataset.nativeState;
      btnText.classList.remove("hidden");
      btnSpinner.classList.add("hidden");
    }

    const activeLang = getSafeLang(document.documentElement.lang || DEFAULT_LANGUAGE);
    const messages = {
      ar: {
        recent: "عذرًا، لقد أرسلت طلب تقييم مؤخرًا. يرجى المحاولة لاحقًا.",
        track: "يرجى اختيار المسار الأكاديمي أولًا.",
        name: "يرجى إدخال الاسم كاملًا إدخالًا صحيحًا.",
        phone: "يرجى إدخال رقم واتساب أو هاتف صحيح.",
        country: "يرجى إدخال البلد إدخالًا صحيحًا.",
        email: "يرجى إدخال بريد إلكتروني صحيح أو تركه فارغًا.",
        message: "الرسالة طويلة جدًا. يرجى اختصارها.",
        server: "تعذر إرسال طلب التقييم الآن. تحقق من اتصالك ثم حاول مرة أخرى.",
        offline: "لا يوجد اتصال بالإنترنت الآن. بياناتك باقية في النموذج؛ أعد الإرسال بعد عودة الاتصال.",
        uncertain: "تعذر تأكيد نتيجة الإرسال. قد يكون الطلب وصل بالفعل؛ تجنب الإرسال المتكرر ويمكنك المتابعة مباشرة أدناه.",
        recoveryLead: "يمكنك المتابعة مباشرة دون إعادة إدخال البيانات:",
        whatsapp: "المتابعة عبر WhatsApp",
        telegram: "المتابعة عبر Telegram"
      },
      en: {
        recent: "You recently sent an assessment request. Please try again later.",
        track: "Please choose an academic track first.",
        name: "Please enter your full name correctly.",
        phone: "Please enter a valid WhatsApp or phone number.",
        country: "Please enter your country.",
        email: "Please enter a valid email address or leave it blank.",
        message: "Your message is too long. Please shorten it.",
        server: "We could not send your assessment request. Check your connection and try again.",
        offline: "You are offline. Your data is still in the form; submit again when the connection returns.",
        uncertain: "We could not confirm the submission result. It may already have been received; avoid repeated submissions and use direct follow-up below.",
        recoveryLead: "You can continue directly without re-entering your details:",
        whatsapp: "Continue on WhatsApp",
        telegram: "Continue on Telegram"
      },
      fr: {
        recent: "Vous avez récemment envoyé une demande d’évaluation. Veuillez réessayer plus tard.",
        track: "Veuillez d’abord choisir un parcours académique.",
        name: "Veuillez saisir correctement votre nom complet.",
        phone: "Veuillez saisir un numéro WhatsApp ou de téléphone valide.",
        country: "Veuillez saisir votre pays.",
        email: "Veuillez saisir une adresse e-mail valide ou laisser ce champ vide.",
        message: "Votre message est trop long. Veuillez le raccourcir.",
        server: "Impossible d’envoyer votre demande d’évaluation. Vérifiez votre connexion et réessayez.",
        offline: "Vous êtes hors ligne. Vos données restent dans le formulaire ; réessayez lorsque la connexion revient.",
        uncertain: "Impossible de confirmer le résultat de l’envoi. La demande a peut-être déjà été reçue ; évitez les envois répétés et utilisez le suivi direct ci-dessous.",
        recoveryLead: "Vous pouvez poursuivre directement sans ressaisir vos informations :",
        whatsapp: "Continuer sur WhatsApp",
        telegram: "Continuer sur Telegram"
      },
      ru: {
        recent: "Вы недавно уже отправляли заявку на диагностику. Пожалуйста, попробуйте позже.",
        track: "Сначала выберите учебное направление.",
        name: "Пожалуйста, правильно укажите полное имя.",
        phone: "Укажите действительный номер WhatsApp или телефона.",
        country: "Пожалуйста, укажите страну.",
        email: "Укажите корректный e-mail или оставьте поле пустым.",
        message: "Сообщение слишком длинное. Пожалуйста, сократите его.",
        server: "Не удалось отправить заявку на диагностику. Проверьте соединение и попробуйте снова.",
        offline: "Нет подключения к Интернету. Данные остаются в форме; отправьте снова после восстановления связи.",
        uncertain: "Не удалось подтвердить результат отправки. Заявка могла уже поступить; не отправляйте её многократно и воспользуйтесь прямой связью ниже.",
        recoveryLead: "Можно продолжить напрямую, не вводя данные повторно:",
        whatsapp: "Продолжить в WhatsApp",
        telegram: "Продолжить в Telegram"
      },
      uz: {
        recent: "Siz yaqinda baholash so‘rovini yuborgansiz. Iltimos, keyinroq qayta urinib ko‘ring.",
        track: "Avval akademik yo‘nalishni tanlang.",
        name: "Iltimos, to‘liq ismingizni to‘g‘ri kiriting.",
        phone: "Iltimos, haqiqiy WhatsApp yoki telefon raqamini kiriting.",
        country: "Iltimos, mamlakatingizni kiriting.",
        email: "To‘g‘ri elektron pochta manzilini kiriting yoki maydonni bo‘sh qoldiring.",
        message: "Izoh juda uzun. Iltimos, uni qisqartiring.",
        server: "Baholash so‘rovini yuborib bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.",
        offline: "Internet aloqasi yo‘q. Ma’lumotlaringiz formada qoladi; aloqa qaytgach yana yuboring.",
        uncertain: "Yuborish natijasini tasdiqlab bo‘lmadi. So‘rov yetib borgan bo‘lishi mumkin; qayta-qayta yubormang va quyidagi aloqa yo‘lidan foydalaning.",
        recoveryLead: "Ma’lumotlarni qayta kiritmasdan bevosita davom etishingiz mumkin:",
        whatsapp: "WhatsApp orqali davom etish",
        telegram: "Telegram orqali davom etish"
      }
    };
    const formMessage = messages[activeLang] || messages.en;

    function currentContactHref(channel, fallback) {
      const existing = document.querySelector(`[data-contact-channel="${channel}"]`);
      return existing instanceof HTMLAnchorElement ? existing.href : fallback;
    }

    function hideRecovery() {
      const recovery = document.getElementById("assessment-recovery");
      if (recovery) recovery.remove();
      form.removeAttribute("data-delight-state");
    }

    function showRecovery() {
      hideRecovery();
      const recovery = document.createElement("div");
      recovery.id = "assessment-recovery";
      recovery.className = "assessment-recovery";
      recovery.setAttribute("aria-label", formMessage.recoveryLead);

      const lead = document.createElement("p");
      lead.className = "assessment-recovery__lead";
      lead.textContent = formMessage.recoveryLead;
      recovery.appendChild(lead);

      const actions = document.createElement("div");
      actions.className = "assessment-recovery__actions";
      [
        ["whatsapp", formMessage.whatsapp, "https://wa.me/201070441115"],
        ["telegram", formMessage.telegram, "https://t.me/BasairAcademy0"]
      ].forEach(function ([channel, label, fallback]) {
        const anchor = document.createElement("a");
        anchor.className = "assessment-recovery__link assessment-recovery__link--" + channel;
        anchor.href = currentContactHref(channel, fallback);
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.dataset.contactChannel = channel;
        anchor.textContent = label;
        anchor.addEventListener("click", function () {
          trackMarketingEvent("assessment_recovery_click", { channel: channel });
        });
        actions.appendChild(anchor);
      });
      recovery.appendChild(actions);
      errorMsg.insertAdjacentElement("afterend", recovery);
      form.dataset.delightState = "recovery";
    }

    const lastSubmissionTime = safeStorage(window.localStorage, "get", "basair_last_submission");
    const currentTime = Date.now();
    const cooldown = 60 * 60 * 1000;

    if (lastSubmissionTime && currentTime - Number.parseInt(lastSubmissionTime, 10) < cooldown) {
      errorText.textContent = formMessage.recent;
      errorMsg.classList.remove("hidden");
      errorMsg.dataset.delightState = "recovery";
      successMsg.classList.add("hidden");
      showRecovery();
      return;
    }

    hideRecovery();
    errorMsg.removeAttribute("data-delight-state");
    successMsg.removeAttribute("data-delight-state");
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-70", "cursor-not-allowed");
    submitBtn.setAttribute("aria-busy", "true");
    form.setAttribute("aria-busy", "true");
    form.dataset.nativeState = "submitting";
    btnText.classList.add("hidden");
    btnSpinner.classList.remove("hidden");
    successMsg.classList.add("hidden");
    errorMsg.classList.add("hidden");

    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const track = String(formData.get("track") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const ageGroup = sanitizeMarketingValue(formData.get("ageGroup"), 60);
    const country = sanitizeMarketingValue(formData.get("country"), 90);
    const email = sanitizeMarketingValue(formData.get("email"), 120);
    const preferredTime = sanitizeMarketingValue(formData.get("preferredTime"), 120);

    if (!track) {
      errorText.textContent = formMessage.track;
      errorMsg.classList.remove("hidden");
      focusInvalidField(form, "track");
      unlock();
      return;
    }

    if (fullName.length < 3 || fullName.length > 80) {
      errorText.textContent = formMessage.name;
      errorMsg.classList.remove("hidden");
      focusInvalidField(form, "fullName");
      unlock();
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phone.length < 6 || phone.length > 30 || phoneDigits.length < 6 || phoneDigits.length > 15 || !/^[+\d().\-\s]+$/.test(phone)) {
      errorText.textContent = formMessage.phone;
      errorMsg.classList.remove("hidden");
      focusInvalidField(form, "phone");
      unlock();
      return;
    }

    if (country.length < 2 || country.length > 90) {
      errorText.textContent = formMessage.country;
      errorMsg.classList.remove("hidden");
      focusInvalidField(form, "country");
      unlock();
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorText.textContent = formMessage.email;
      errorMsg.classList.remove("hidden");
      focusInvalidField(form, "email");
      unlock();
      return;
    }

    if (message.length > 1000) {
      errorText.textContent = formMessage.message;
      errorMsg.classList.remove("hidden");
      focusInvalidField(form, "message");
      unlock();
      return;
    }

    if (navigator.onLine === false) {
      errorText.textContent = formMessage.offline; errorMsg.classList.remove("hidden"); form.dataset.nativeState = "error"; showRecovery(); unlock(); return;
    }

    assessmentSubmissionInFlight = true;
    let submissionToken = null;
    try {
      const timeoutPromise = new Promise(function (_, reject) {
        window.setTimeout(function () {
          reject(new Error("NETWORK_TIMEOUT"));
        }, 15000);
      });

      trackMarketingEvent("assessment_start", { track: track });

      const leadPayload = {
        requestType: "free_assessment",
        fullName: fullName,
        phone: phone,
        email: email || null,
        ageGroup: ageGroup || null,
        country: country,
        preferredTime: preferredTime || null,
        track: track,
        message: message || null,
        language: document.documentElement.lang || DEFAULT_LANGUAGE,
        pagePath: window.location.pathname,
        firstTouchAttribution: marketingAttribution.firstTouch,
        lastTouchAttribution: marketingAttribution.lastTouch,
        submissionDate: serverTimestamp(),
        status: "new"
      };

      const fingerprint = JSON.stringify([fullName, phone, email || "", country, track, message || ""]);
      submissionToken = createSubmissionToken("main-assessment", fingerprint);
      const leadRef = doc(db, "assessment_requests", submissionToken.id);
      const saveLead = async function () { await setDoc(leadRef, leadPayload); return leadRef; };

      await Promise.race([saveLead(), timeoutPromise]);
      clearSubmissionToken(submissionToken.storageKey);
      safeStorage(window.localStorage, "set", "basair_last_submission", String(currentTime));
      form.reset();
      successMsg.classList.remove("hidden");
      successMsg.dataset.delightState = "received";
      form.dataset.delightState = "received";
      form.dataset.nativeState = "success";
      trackMarketingEvent("assessment_submit_success", { track: track });
    } catch (error) {
      console.error("Assessment Error:", error);
      trackMarketingEvent("assessment_submit_error", { track: track, reason: error && error.message ? error.message : "unknown" });
      const code = error && error.code ? String(error.code) : "";
      const messageText = error && error.message ? String(error.message) : "";
      const uncertain = messageText === "NETWORK_TIMEOUT" || (code === "permission-denied" && submissionToken && submissionToken.reused);
      errorText.textContent = navigator.onLine === false ? formMessage.offline : uncertain ? formMessage.uncertain : formMessage.server;
      errorMsg.classList.remove("hidden");
      errorMsg.dataset.delightState = "recovery";
      successMsg.classList.add("hidden");
      form.dataset.nativeState = "error";
      showRecovery();
    } finally {
      assessmentSubmissionInFlight = false;
      unlock();
    }
  });
}

// ==========================================
// Polished action feedback (keeps existing visual identity)
// ==========================================
function enhancePrimaryActions() {
  const selectors = [
    'a[href="#contact"]',
    'a[href="#conversion-paths"]',
    'a[href="#video-library"]',
    'a[href^="https://wa.me/"]',
    'a[href^="https://t.me/"]',
    '#submit-btn',
    '.filter-btn',
    '#lang-btn',
    '#mobile-lang-btn',
    '#mobile-menu-btn'
  ];
  document.querySelectorAll(selectors.join(",")).forEach(function (el) {
    el.classList.add("basair-action");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", enhancePrimaryActions, { once: true });
} else {
  enhancePrimaryActions();
}

// ==========================================
// Dynamic content
// ==========================================
function escapeCssIdentifier(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}

const adminContentRef = doc(db, "site_content", "public");
let adminContentCache = { videos: [], texts: {} };

function normalizeAdminContent(data) {
  const rawVideos = Array.isArray(data && data.videos) ? data.videos : [];
  const videos = rawVideos.slice(0, 250);
  const rawTexts = data && data.texts && typeof data.texts === "object" && !Array.isArray(data.texts) ? data.texts : {};
  const texts = {};
  Object.entries(rawTexts).slice(0, 5000).forEach(function ([id, value]) {
    if (typeof id === "string" && id.length <= 160 && typeof value === "string") texts[id] = value.slice(0, 12000);
  });
  const settings = data && data.settings && typeof data.settings === "object" && !Array.isArray(data.settings) ? data.settings : {};
  return { videos: videos, texts: texts, settings: settings };
}

// ==========================================
// Dynamic Public Content
// Single renderer + real-time Firestore subscription
// ==========================================

let dynamicContentUnsubscribe = null;

function applyPublicContactSettings(settings) {
  const safe = settings && typeof settings === "object" ? settings : {};
  const whatsapp = String(safe.whatsappNumber || "").replace(/\D/g, "");
  const telegram = String(safe.telegramUsername || "").trim().replace(/^@+/, "");

  if (whatsapp.length >= 8 && whatsapp.length <= 15) {
    document.querySelectorAll('[data-contact-channel="whatsapp"]').forEach(function (anchor) {
      if (!(anchor instanceof HTMLAnchorElement)) return;
      let query = "";
      try { query = new URL(anchor.href, window.location.href).search || ""; } catch (_) {}
      anchor.href = "https://wa.me/" + whatsapp + query;
    });
  }

  if (/^[A-Za-z0-9_]{5,32}$/.test(telegram)) {
    document.querySelectorAll('[data-contact-channel="telegram"]').forEach(function (anchor) {
      if (anchor instanceof HTMLAnchorElement) anchor.href = "https://t.me/" + telegram;
    });
  }
}

function renderDynamicContent(data) {
  const safeData =
    data && typeof data === "object"
      ? data
      : {};

  applyPublicContactSettings(safeData.settings);

  // ------------------------------
  // Dynamic texts
  // ------------------------------
  if (
    safeData.texts &&
    typeof safeData.texts === "object"
  ) {
    Object.entries(safeData.texts).slice(0, 5000).forEach(function ([id, value]) {
      if (
        typeof id !== "string" ||
        typeof value !== "string"
      ) {
        return;
      }

      const selector =
        '[data-content-id="' +
        escapeCssIdentifier(id) +
        '"]';

      document
        .querySelectorAll(selector)
        .forEach(function (element) {
          // Content is rendered as plain text only. This deliberately avoids
          // innerHTML so an admin text override cannot become an XSS payload.
          element.textContent = value;
        });
    });
  }

  // ------------------------------
  // Dynamic videos
  // ------------------------------
  const grid = document.getElementById("video-grid");

  if (!grid) return;

  // Remove only dynamically generated cards.
  grid
    .querySelectorAll(".dynamic-video")
    .forEach(function (element) {
      element.remove();
    });

  const videos = Array.isArray(safeData.videos)
    ? safeData.videos
    : [];

  const fragment = document.createDocumentFragment();

  videos
    .slice()
    .reverse()
    .forEach(function (item) {
      const video = normalizeVideo(item);

      if (!video) return;

      fragment.appendChild(
        createVideoCard(video)
      );
    });

  grid.appendChild(fragment);

  /*
   * Re-apply current filter without rebinding
   * duplicate event listeners.
   */
  const activeFilter =
    document.querySelector(
      "#video-filters .filter-btn.active"
    ) ||
    document.querySelector(
      '#video-filters .filter-btn[data-filter="all"]'
    );

  applyVideoFilter(
    activeFilter
      ? activeFilter.getAttribute("data-filter") || "all"
      : "all"
  );
}

function startDynamicContentSubscription() {
  if (dynamicContentUnsubscribe) {
    return;
  }

  if (
    window.BasairTextMap &&
    typeof window.BasairTextMap.assign === "function"
  ) {
    window.BasairTextMap.assign(document);
  }

  dynamicContentUnsubscribe = onSnapshot(
    adminContentRef,

    function (snapshot) {
      if (!snapshot.exists()) {
        renderDynamicContent({
          texts: {},
          videos: []
        });

        return;
      }

      renderDynamicContent(
        normalizeAdminContent(snapshot.data())
      );
    },

    function (error) {
      console.error(
        "Dynamic content realtime subscription failed:",
        error
      );
    }
  );
}

/*
 * Retained as a compatibility function
 * for existing admin-related calls in app.js.
 */
window.addEventListener("pagehide", function () {
  if (dynamicContentUnsubscribe) {
    dynamicContentUnsubscribe();
    dynamicContentUnsubscribe = null;
  }
}, { once: true });

async function loadDynamicContent() {
  try {
    const snapshot =
      await getDoc(adminContentRef);

    if (!snapshot.exists()) {
      renderDynamicContent({
        texts: {},
        videos: []
      });

      return;
    }

    renderDynamicContent(
      snapshot.data()
    );
  } catch (error) {
    console.error(
      "Dynamic content reload failed:",
      error
    );
  }
}

    

// ==========================================
// Bootstrap
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  try {
    setLang(getInitialLanguage());
    initLanguageButtons();
    initGlobalClicks();
    initScrollEffects();
    initMotionLifecycle();
    initVideoFilter();
    initSlider();
    initEnrollmentForm();
    initMarketingTracking();

    /*
     * Firestore realtime subscription must not block first paint.
     */
    startDynamicContentSubscription();

  } catch (error) {
    console.error("Application bootstrap error:", error);

  } finally {
    /*
     * UI readiness must never depend on Firestore/network completion.
     */
    if (
      window.BasairBoot &&
      typeof window.BasairBoot.ready === "function"
    ) {
      window.BasairBoot.ready();
    } else {
      hideSplash(0);
    }
  }
});
