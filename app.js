// ==========================================
// Firebase imports
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// Firebase setup
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBTsosPoNUekZNywFgrBkVmtTrOSK-XyB8",
  authDomain: "jumping-unfolding-3v7sv.firebaseapp.com",
  projectId: "jumping-unfolding-3v7sv",
  storageBucket: "jumping-unfolding-3v7sv.firebasestorage.app",
  messagingSenderId: "998742851624",
  appId: "1:998742851624:web:98cab99ce0bc19505cf51d"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(
  firebaseApp,
  { experimentalForceLongPolling: true },
  "ai-studio-6df2ea0b-0738-4940-b98e-7efdd9b010d0"
);

// ==========================================
// Splash screen safety
// ==========================================
function hideSplash(delay) {
  const wait = typeof delay === "number" ? delay : 1200;
  window.setTimeout(function () {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;
    splash.classList.add("splash-hidden");
    window.setTimeout(function () {
      splash.style.display = "none";
    }, 800);
  }, wait);
}

window.addEventListener("load", function () { hideSplash(1200); }, { once: true });
window.setTimeout(function () { hideSplash(0); }, 4500);

// ==========================================
// Language system
// ==========================================
const supportedLanguages = ["ar", "en", "fr", "ru"];

const pageTitles = {
  ar: "أكاديمية بصائر | نور يهدي، وعلم يبني",
  en: "Basair Academy | Guided by Light",
  fr: "Académie Bassaïr | Lumière qui guide",
  ru: "Академия Басаир | Свет, который ведет"
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
    { value: "Specialization", text: "Linguistic Specialization & Instrumental" }
  ],
  fr: [
    { value: "", text: "-- Choisir le Parcours --" },
    { value: "Quran and Tajweed", text: "Parcours de Mémorisation du Coran" },
    { value: "Arabic from Scratch", text: "Langue Arabe de Zéro" },
    { value: "Specialization", text: "Spécialisation Linguistique" }
  ],
  ru: [
    { value: "", text: "-- Выберите курс --" },
    { value: "Quran and Tajweed", text: "Путь заучивания Корана" },
    { value: "Arabic from Scratch", text: "Арабский язык с нуля" },
    { value: "Specialization", text: "Лингвистическая специализация" }
  ]
};

function getSafeLang(lang) {
  return supportedLanguages.includes(lang) ? lang : "ar";
}

function updateDynamicTrackSelect(lang) {
  const select = document.getElementById("dynamic-track-select");
  if (!select) return;

  select.textContent = "";
  const options = trackTranslations[lang] || trackTranslations.ar;

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

function setLang(lang) {
  const safeLang = getSafeLang(lang);
  const root = document.getElementById("html-root");
  const body = document.getElementById("body-root");

  if (root) {
    root.lang = safeLang;
    root.dir = safeLang === "ar" ? "rtl" : "ltr";
  }

  if (body) {
    body.className = "route-" + safeLang + " relative";
  }

  const title = document.getElementById("page-title");
  if (title) title.textContent = pageTitles[safeLang] || pageTitles.ar;

  localStorage.setItem("academy_lang", safeLang);
  updateDynamicTrackSelect(safeLang);
  closeDropdown();
  closeMobileMenu();
}

// ==========================================
// UI helpers exposed for inline HTML handlers
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

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-backdrop");
  const btn = document.getElementById("mobile-menu-btn");
  if (!menu) return;

  const active = menu.classList.contains("active");
  if (active) {
    closeMobileMenu();
    return;
  }

  menu.classList.add("active");
  if (backdrop) backdrop.classList.add("active");
  if (btn) btn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-backdrop");
  const btn = document.getElementById("mobile-menu-btn");
  if (menu) menu.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
  if (btn) btn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

window.setLang = setLang;
window.toggleLangMenu = toggleLangMenu;
window.closeDropdown = closeDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.showPasswordModal = function () {
  alert("لوحة الإدارة معطلة مؤقتًا حتى تركيب نظام دخول آمن.");
};
window.hidePasswordModal = function () {};

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
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDropdown();
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024) closeMobileMenu();
  });
}

function initScrollEffects() {
  let ticking = false;

  function run() {
    const nav = document.getElementById("navbar");
    if (nav) {
      if (window.scrollY > 20) {
        nav.classList.add("shadow-sm", "border-[#D4AF37]/20");
        nav.classList.remove("border-transparent");
      } else {
        nav.classList.add("border-transparent");
        nav.classList.remove("shadow-sm", "border-[#D4AF37]/20");
      }
    }

    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");
    let current = "";

    sections.forEach(function (section) {
      if (window.scrollY >= section.offsetTop - 100) {
        current = section.getAttribute("id") || "";
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove("active-section");
      const href = link.getAttribute("href") || "";
      if (current && href.indexOf(current) !== -1) {
        link.classList.add("active-section");
      }
    });
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      run();
      ticking = false;
    });
  });

  run();
}

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

function applyVideoFilter(filterValue) {
  document.querySelectorAll(".video-card").forEach(function (card) {
    const category = card.getAttribute("data-category") || "all";
    if (filterValue === "all" || category === filterValue) {
      card.style.display = "block";
      window.setTimeout(function () {
        card.style.opacity = "1";
      }, 50);
    } else {
      card.style.opacity = "0";
      window.setTimeout(function () {
        card.style.display = "none";
      }, 300);
    }
  });
}

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
      btn.addEventListener("mouseenter", function () { window.clearInterval(autoPlay); });
      btn.addEventListener("mouseleave", function () { autoPlay = window.setInterval(moveToNext, 6000); });
    });
  };

  if (document.readyState === "complete") setup();
  else window.addEventListener("load", setup, { once: true });
}

// ==========================================
// Enrollment form
// ==========================================
function initEnrollmentForm() {
  const form = document.getElementById("enrollment-form");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

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
      btnText.classList.remove("hidden");
      btnSpinner.classList.add("hidden");
    }

    const lastSubmissionTime = localStorage.getItem("basair_last_submission");
    const currentTime = Date.now();
    const cooldown = 60 * 60 * 1000;

    if (lastSubmissionTime && currentTime - Number.parseInt(lastSubmissionTime, 10) < cooldown) {
      errorText.textContent = "عذراً، لقد قمت بإرسال طلب مؤخراً. يرجى المحاولة لاحقاً.";
      errorMsg.classList.remove("hidden");
      successMsg.classList.add("hidden");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-70", "cursor-not-allowed");
    btnText.classList.add("hidden");
    btnSpinner.classList.remove("hidden");
    successMsg.classList.add("hidden");
    errorMsg.classList.add("hidden");

    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const track = String(formData.get("track") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!track) {
      errorText.textContent = "يرجى اختيار المسار الأكاديمي أولاً.";
      errorMsg.classList.remove("hidden");
      unlock();
      return;
    }

    if (fullName.length < 3 || fullName.length > 80) {
      errorText.textContent = "يرجى إدخال الاسم كاملًا إدخالًا صحيحًا.";
      errorMsg.classList.remove("hidden");
      unlock();
      return;
    }

    if (phone.length < 6 || phone.length > 30) {
      errorText.textContent = "يرجى إدخال رقم هاتف صحيح.";
      errorMsg.classList.remove("hidden");
      unlock();
      return;
    }

    if (message.length > 1000) {
      errorText.textContent = "الرسالة طويلة جدًا. يرجى اختصارها.";
      errorMsg.classList.remove("hidden");
      unlock();
      return;
    }

    try {
      const timeoutPromise = new Promise(function (_, reject) {
        window.setTimeout(function () { reject(new Error("NETWORK_TIMEOUT")); }, 15000);
      });

      const writePromise = addDoc(collection(db, "enrollment_requests"), {
        fullName: fullName,
        phone: phone,
        track: track,
        message: message || "لا يوجد",
        submissionDate: serverTimestamp(),
        status: "new"
      });

      await Promise.race([writePromise, timeoutPromise]);
      localStorage.setItem("basair_last_submission", String(currentTime));
      form.reset();
      successMsg.classList.remove("hidden");
      window.setTimeout(function () { successMsg.classList.add("hidden"); }, 8000);
    } catch (error) {
      console.error("Enrollment Error:", error);
      errorText.textContent = "فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.";
      errorMsg.classList.remove("hidden");
      successMsg.classList.add("hidden");
    } finally {
      unlock();
    }
  });
}

// ==========================================
// Dynamic content
// ==========================================
function escapeCssIdentifier(value) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function normalizeVideo(video) {
  if (!video || typeof video !== "object") return null;

  const title = typeof video.title === "string" ? video.title.trim() : "";
  const category = typeof video.category === "string" ? video.category.trim() : "all";
  const imageUrl = typeof video.imageUrl === "string" ? video.imageUrl.trim() : "";
  const videoUrl = typeof video.videoUrl === "string" ? video.videoUrl.trim() : "";

  if (!title || title.length > 120) return null;

  const allowedCategories = ["all", "quran", "arabic", "islamic", "tajweed", "grammar", "specialization"];
  const fallbackImage = "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?q=80&w=1000";

  return {
    title: title,
    category: allowedCategories.includes(category) ? category : "all",
    imageUrl: isSafeUrl(imageUrl) ? imageUrl : fallbackImage,
    videoUrl: isSafeUrl(videoUrl) ? videoUrl : "#"
  };
}

function createVideoCard(video) {
  const card = document.createElement("article");
  card.className = "video-card group cursor-pointer animate-fade-in-up dynamic-video";
  card.setAttribute("data-category", video.category);

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "relative w-full h-56 rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-lg";

  const overlay = document.createElement("div");
  overlay.className = "absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10";

  const img = document.createElement("img");
  img.src = video.imageUrl;
  img.alt = video.title;
  img.loading = "lazy";
  img.className = "w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700";

  const playLayer = document.createElement("div");
  playLayer.className = "absolute inset-0 flex items-center justify-center z-20";

  const playCircle = document.createElement("a");
  playCircle.href = video.videoUrl;
  playCircle.target = "_blank";
  playCircle.rel = "noopener noreferrer";
  playCircle.setAttribute("aria-label", "تشغيل فيديو: " + video.title);
  playCircle.className = "w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:bg-[#D4AF37]/90 transition-all";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "w-6 h-6 text-white translate-x-0.5");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M5.536 21.886a1.004 1.004 0 001.033-.064l13-9a1 1 0 000-1.644l-13-9A1 1 0 005 3v18a1 1 0 00.536.886z");
  svg.appendChild(path);
  playCircle.appendChild(svg);

  const title = document.createElement("h3");
  title.className = "text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors";
  title.textContent = video.title;

  const desc = document.createElement("p");
  desc.className = "text-white/60 text-sm font-medium";
  desc.textContent = "فيديو مضاف حديثًا.";

  playLayer.appendChild(playCircle);
  imageWrapper.appendChild(overlay);
  imageWrapper.appendChild(img);
  imageWrapper.appendChild(playLayer);
  card.appendChild(imageWrapper);
  card.appendChild(title);
  card.appendChild(desc);
  return card;
}

async function loadDynamicContent() {
  try {
    const docRef = doc(db, "site_content", "public");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data();

    if (data.texts && typeof data.texts === "object") {
      Object.entries(data.texts).forEach(function ([id, value]) {
        if (typeof id !== "string" || typeof value !== "string") return;
        const selector = "[data-content-id=\"" + escapeCssIdentifier(id) + "\"]";
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
      });
    }

    if (Array.isArray(data.videos)) {
      const grid = document.getElementById("video-grid");
      if (grid) {
        document.querySelectorAll(".dynamic-video").forEach(function (el) { el.remove(); });
        data.videos.slice().reverse().forEach(function (item) {
          const video = normalizeVideo(item);
          if (video) grid.prepend(createVideoCard(video));
        });
        initVideoFilter();
      }
    }
  } catch (error) {
    console.error("خطأ في تحميل المحتوى العام:", error);
  }
}

// ==========================================
// Bootstrap
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  try {
    setLang(localStorage.getItem("academy_lang") || "ar");
    initLanguageButtons();
    initGlobalClicks();
    initScrollEffects();
    initVideoFilter();
    initSlider();
    initEnrollmentForm();
    loadDynamicContent();
    hideSplash(1200);
  } catch (error) {
    console.error("Application bootstrap error:", error);
    hideSplash(0);
  }
});
