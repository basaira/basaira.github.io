```js
// ==========================================
// استيراد مكتبات Firebase عبر الـ CDN
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
// حماية عاجلة: لا تترك شاشة البداية معلقة أبدًا
// ==========================================
function hideSplashScreenSafely(delay = 1200) {
  const splashScreen = document.getElementById("splash-screen");
  if (!splashScreen) return;

  window.setTimeout(() => {
    splashScreen.classList.add("splash-hidden");

    window.setTimeout(() => {
      splashScreen.style.display = "none";
    }, 800);
  }, delay);
}

// ==========================================
// 1. Firebase Service (Core Infrastructure)
// ==========================================
class FirebaseService {
  constructor() {
    this.config = {
      apiKey: "AIzaSyBTsosPoNUekZNywFgrBkVmtTrOSK-XyB8",
      authDomain: "jumping-unfolding-3v7sv.firebaseapp.com",
      projectId: "jumping-unfolding-3v7sv",
      storageBucket: "jumping-unfolding-3v7sv.firebasestorage.app",
      messagingSenderId: "998742851624",
      appId: "1:998742851624:web:98cab99ce0bc19505cf51d",
    };

    this.app = initializeApp(this.config);

    this.db = initializeFirestore(
      this.app,
      { experimentalForceLongPolling: true },
      "ai-studio-6df2ea0b-0738-4940-b98e-7efdd9b010d0"
    );
  }
}

const firebaseService = new FirebaseService();

// ==========================================
// 2. Language Service
// ==========================================
class LanguageService {
  constructor() {
    this.supportedLanguages = ["ar", "en", "fr", "ru"];

    this.trackTranslations = {
      ar: [
        { value: "", text: "-- اختر المسار الأكاديمي --" },
        { value: "Quran and Tajweed", text: "مسار حفظ القرآن وإتقان التجويد" },
        { value: "Arabic from Scratch", text: "دورة اللغة العربية من الصفر" },
        { value: "Specialization", text: "التخصص اللغوي وعلوم الآلة" },
      ],
      en: [
        { value: "", text: "-- Select Academic Track --" },
        { value: "Quran and Tajweed", text: "Track of Quran Memorization & Tajweed" },
        { value: "Arabic from Scratch", text: "Arabic Language from Scratch" },
        { value: "Specialization", text: "Linguistic Specialization & Instrumental" },
      ],
      fr: [
        { value: "", text: "-- Choisir le Parcours --" },
        { value: "Quran and Tajweed", text: "Parcours de Mémorisation du Coran" },
        { value: "Arabic from Scratch", text: "Langue Arabe de Zéro" },
        { value: "Specialization", text: "Spécialisation Linguistique" },
      ],
      ru: [
        { value: "", text: "-- Выберите курс --" },
        { value: "Quran and Tajweed", text: "Путь заучивания Корана" },
        { value: "Arabic from Scratch", text: "Арабский язык с нуля" },
        { value: "Specialization", text: "Лингвистическая специализация" },
      ],
    };

    this.init();
  }

  init() {
    const savedLang = localStorage.getItem("academy_lang") || "ar";
    this.setLang(savedLang);

    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const targetBtn = event.target.closest("[data-lang]");
        if (!targetBtn) return;

        const selectedLang = targetBtn.getAttribute("data-lang");
        this.setLang(selectedLang);
      });
    });
  }

  getSafeLang(langCode) {
    return this.supportedLanguages.includes(langCode) ? langCode : "ar";
  }

  setLang(langCode) {
    const safeLang = this.getSafeLang(langCode);

    const root = document.getElementById("html-root");
    const body = document.getElementById("body-root");

    if (!root || !body) return;

    body.className = "route-" + safeLang + " relative";
    root.lang = safeLang;
    root.dir = safeLang === "ar" ? "rtl" : "ltr";
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      const titles = {
        ar: "أكاديمية بصائر | نور يهدي، وعلم يبني",
        en: "Basair Academy | Guided by Light",
        fr: "Académie Bassaïr | Lumière qui guide",
        ru: "Академия Басаир | Свет, который ведет",
      };

      pageTitle.textContent = titles[safeLang] || titles.ar;
    }

    localStorage.setItem("academy_lang", safeLang);
    this.updateDynamicSelect(safeLang);

    if (window.uiService) {
      window.uiService.closeDropdown();
      window.uiService.closeMobileMenu();
    }
  }

  updateDynamicSelect(lang) {
    const selectEl = document.getElementById("dynamic-track-select");
    if (!selectEl) return;

    selectEl.textContent = "";

    const options = this.trackTranslations[lang] || this.trackTranslations.ar;

    options.forEach((opt) => {
      const optionEl = document.createElement("option");
      optionEl.value = opt.value;
      optionEl.textContent = opt.text;

      if (opt.value === "") {
        optionEl.disabled = true;
        optionEl.selected = true;
      }

      selectEl.appendChild(optionEl);
    });
  }
}

// ==========================================
// 3. UI Service
// ==========================================
class UIService {
  constructor() {
    this.videoFilterInitialized = false;
    this.scrollEffectsInitialized = false;
    this.globalClicksInitialized = false;
    this.sliderInitialized = false;
    this.splashInitialized = false;

    this.initSplashScreen();
    this.initScrollEffects();
    this.initGlobalClicks();
    this.initVideoFilter();
    this.initSlider();
  }

  toggleLangMenu() {
    const dropdown = document.getElementById("langDropdown");
    const btn = document.getElementById("lang-btn");

    if (!dropdown || !btn) return;

    dropdown.classList.toggle("active");
    btn.setAttribute("aria-expanded", dropdown.classList.contains("active"));
  }

  closeDropdown() {
    const menu = document.getElementById("langDropdown");
    const btn = document.getElementById("lang-btn");

    if (!menu) return;

    if (menu.classList.contains("active")) {
      menu.classList.remove("active");
    }

    if (btn) {
      btn.setAttribute("aria-expanded", "false");
    }
  }

  toggleMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    const backdrop = document.getElementById("mobile-backdrop");
    const btn = document.getElementById("mobile-menu-btn");

    if (!menu) return;

    const isActive = menu.classList.contains("active");

    if (!isActive) {
      menu.classList.add("active");
      if (backdrop) backdrop.classList.add("active");
      if (btn) btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    } else {
      this.closeMobileMenu();
    }
  }

  closeMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    const backdrop = document.getElementById("mobile-backdrop");
    const btn = document.getElementById("mobile-menu-btn");

    if (menu && menu.classList.contains("active")) {
      menu.classList.remove("active");
    }

    if (backdrop && backdrop.classList.contains("active")) {
      backdrop.classList.remove("active");
    }

    if (btn) {
      btn.setAttribute("aria-expanded", "false");
    }

    document.body.style.overflow = "";
  }

  initGlobalClicks() {
    if (this.globalClicksInitialized) return;
    this.globalClicksInitialized = true;

    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const clickedInsideLangButton = target.closest("#lang-btn");
      const clickedInsideLangDropdown = target.closest("#langDropdown");

      if (!clickedInsideLangButton && !clickedInsideLangDropdown) {
        this.closeDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeDropdown();
        this.closeMobileMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) {
        this.closeMobileMenu();
      }
    });
  }

  initScrollEffects() {
    if (this.scrollEffectsInitialized) return;
    this.scrollEffectsInitialized = true;

    let ticking = false;

    const runScrollEffects = () => {
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

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;

        if (window.scrollY >= sectionTop - 100) {
          current = section.getAttribute("id") || "";
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active-section");

        const href = link.getAttribute("href") || "";
        if (current && href.includes(current)) {
          link.classList.add("active-section");
        }
      });
    };

    window.addEventListener("scroll", () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        runScrollEffects();
        ticking = false;
      });

      ticking = true;
    });

    runScrollEffects();
  }

  initVideoFilter() {
    const filterBtns = document.querySelectorAll(".filter-btn");

    if (!filterBtns.length) return;

    if (this.videoFilterInitialized) {
      this.applyCurrentVideoFilter();
      return;
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => {
          b.classList.remove(
            "bg-[#D4AF37]",
            "text-[#0A1F44]",
            "shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          );

          b.classList.add("bg-white/10", "text-white");
          b.setAttribute("aria-pressed", "false");
        });

        btn.classList.remove("bg-white/10", "text-white");

        btn.classList.add(
          "bg-[#D4AF37]",
          "text-[#0A1F44]",
          "shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        );

        btn.setAttribute("aria-pressed", "true");

        this.applyVideoFilter(btn.getAttribute("data-filter") || "all");
      });
    });

    this.videoFilterInitialized = true;
    this.applyCurrentVideoFilter();
  }

  applyCurrentVideoFilter() {
    const buttons = Array.from(document.querySelectorAll(".filter-btn"));

    const activeBtn =
      buttons.find((btn) => btn.getAttribute("aria-pressed") === "true") ||
      buttons.find((btn) => btn.classList.contains("bg-[#D4AF37]")) ||
      buttons.find((btn) => btn.getAttribute("data-filter") === "all");

    const filterValue = activeBtn?.getAttribute("data-filter") || "all";
    this.applyVideoFilter(filterValue);
  }

  applyVideoFilter(filterValue) {
    const videoCards = document.querySelectorAll(".video-card");

    videoCards.forEach((card) => {
      const category = card.getAttribute("data-category") || "all";

      if (filterValue === "all" || category === filterValue) {
        card.style.display = "block";

        window.setTimeout(() => {
          card.style.opacity = "1";
        }, 50);
      } else {
        card.style.opacity = "0";

        window.setTimeout(() => {
          card.style.display = "none";
        }, 300);
      }
    });
  }

  initSlider() {
    if (this.sliderInitialized) return;
    this.sliderInitialized = true;

    const setupSlider = () => {
      const track = document.getElementById("testimonials-track");
      if (!track) return;

      if (track.dataset.sliderInitialized === "true") return;
      track.dataset.sliderInitialized = "true";

      const slides = Array.from(document.querySelectorAll(".testimonial-slide"));
      if (slides.length === 0) return;

      const firstClone = slides[0].cloneNode(true);
      const lastClone = slides[slides.length - 1].cloneNode(true);

      track.appendChild(firstClone);
      track.insertBefore(lastClone, slides[0]);

      const allSlides = document.querySelectorAll(".testimonial-slide");
      let currentIndex = 1;
      const slideWidth = 100;

      track.style.transition = "none";
      track.style.transform = `translateX(${currentIndex * slideWidth}%)`;

      const updateSlider = (animate = true) => {
        track.style.transition = animate ? "transform 0.7s ease-in-out" : "none";
        track.style.transform = `translateX(${currentIndex * slideWidth}%)`;
      };

      track.addEventListener("transitionend", () => {
        if (allSlides[currentIndex]?.isEqualNode(firstClone)) {
          currentIndex = 1;
          updateSlider(false);
        }

        if (allSlides[currentIndex]?.isEqualNode(lastClone)) {
          currentIndex = allSlides.length - 2;
          updateSlider(false);
        }
      });

      const moveToNext = () => {
        if (currentIndex >= allSlides.length - 1) return;
        currentIndex++;
        updateSlider();
      };

      const moveToPrev = () => {
        if (currentIndex <= 0) return;
        currentIndex--;
        updateSlider();
      };

      const nextBtn = document.getElementById("slider-next-btn");
      const prevBtn = document.getElementById("slider-prev-btn");

      if (nextBtn) nextBtn.addEventListener("click", moveToNext);
      if (prevBtn) prevBtn.addEventListener("click", moveToPrev);

      let autoPlay = window.setInterval(moveToNext, 6000);

      [nextBtn, prevBtn].forEach((btn) => {
        if (!btn) return;

        btn.addEventListener("mouseenter", () => {
          window.clearInterval(autoPlay);
        });

        btn.addEventListener("mouseleave", () => {
          autoPlay = window.setInterval(moveToNext, 6000);
        });
      });
    };

    if (document.readyState === "complete") {
      setupSlider();
    } else {
      window.addEventListener("load", setupSlider, { once: true });
    }
  }

  initSplashScreen() {
    if (this.splashInitialized) return;
    this.splashInitialized = true;

    const hideSplash = () => hideSplashScreenSafely(1200);

    if (document.readyState === "complete") {
      hideSplash();
    } else {
      window.addEventListener("load", hideSplash, { once: true });

      // حماية إضافية: لا نترك شاشة البداية معلقة أبدًا
      window.setTimeout(() => hideSplashScreenSafely(0), 3500);
    }
  }
}

// ==========================================
// 4. Enrollment Service
// ==========================================
class EnrollmentService {
  constructor(firebaseService) {
    this.db = firebaseService.db;
    this.initForm();
  }

  initForm() {
    const form = document.getElementById("enrollment-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.handleSubmission(form);
    });
  }

  async handleSubmission(form) {
    const submitBtn = document.getElementById("submit-btn");
    const btnText = document.getElementById("btn-text");
    const btnSpinner = document.getElementById("btn-spinner");
    const successMsg = document.getElementById("success-message");
    const errorMsg = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");

    if (!submitBtn || !btnText || !btnSpinner || !successMsg || !errorMsg || !errorText) {
      console.error("Enrollment form UI elements are missing.");
      return;
    }

    const COOLDOWN_PERIOD_MS = 60 * 60 * 1000;
    const lastSubmissionTime = localStorage.getItem("basair_last_submission");
    const currentTime = Date.now();

    if (
      lastSubmissionTime &&
      currentTime - Number.parseInt(lastSubmissionTime, 10) < COOLDOWN_PERIOD_MS
    ) {
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
    const trackValue = String(formData.get("track") || "").trim();

    if (!trackValue) {
      errorText.textContent = "يرجى اختيار المسار الأكاديمي أولاً.";
      errorMsg.classList.remove("hidden");
      successMsg.classList.add("hidden");
      this.unlockFormUI(submitBtn, btnText, btnSpinner);
      return;
    }

    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (fullName.length < 3 || fullName.length > 80) {
      errorText.textContent = "يرجى إدخال الاسم كاملًا إدخالًا صحيحًا.";
      errorMsg.classList.remove("hidden");
      successMsg.classList.add("hidden");
      this.unlockFormUI(submitBtn, btnText, btnSpinner);
      return;
    }

    if (phone.length < 6 || phone.length > 30) {
      errorText.textContent = "يرجى إدخال رقم هاتف صحيح.";
      errorMsg.classList.remove("hidden");
      successMsg.classList.add("hidden");
      this.unlockFormUI(submitBtn, btnText, btnSpinner);
      return;
    }

    if (message.length > 1000) {
      errorText.textContent = "الرسالة طويلة جدًا. يرجى اختصارها.";
      errorMsg.classList.remove("hidden");
      successMsg.classList.add("hidden");
      this.unlockFormUI(submitBtn, btnText, btnSpinner);
      return;
    }

    const requestData = {
      fullName,
      phone,
      track: trackValue,
      message: message || "لا يوجد",
      submissionDate: serverTimestamp(),
      status: "new",
    };

    try {
      const timeoutPromise = new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), 15000);
      });

      const firebasePromise = addDoc(
        collection(this.db, "enrollment_requests"),
        requestData
      );

      await Promise.race([firebasePromise, timeoutPromise]);

      localStorage.setItem("basair_last_submission", currentTime.toString());

      form.reset();
      successMsg.classList.remove("hidden");

      window.setTimeout(() => {
        successMsg.classList.add("hidden");
      }, 8000);
    } catch (error) {
      console.error("Enrollment Error:", error);
      errorText.textContent = "فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.";
      errorMsg.classList.remove("hidden");
      successMsg.classList.add("hidden");
    } finally {
      this.unlockFormUI(submitBtn, btnText, btnSpinner);
    }
  }

  unlockFormUI(submitBtn, btnText, btnSpinner) {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
    btnText.classList.remove("hidden");
    btnSpinner.classList.add("hidden");
  }
}

// ==========================================
// 5. Content Service — Safe Public Content Loader
// ==========================================
class ContentService {
  constructor(firebaseService) {
    this.db = firebaseService.db;
    this.loadDynamicContent();
  }

  async loadDynamicContent() {
    try {
      const docRef = doc(this.db, "site_content", "public");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.info("لا يوجد محتوى ديناميكي عام محفوظ حتى الآن.");
        return;
      }

      const data = docSnap.data();

      if (data.texts && typeof data.texts === "object") {
        this.renderTexts(data.texts);
      }

      if (Array.isArray(data.videos)) {
        this.renderVideos(data.videos);
      }
    } catch (error) {
      console.error("خطأ في تحميل المحتوى العام:", error);
    }
  }

  renderTexts(texts) {
    Object.entries(texts).forEach(([id, value]) => {
      if (typeof id !== "string") return;
      if (typeof value !== "string") return;

      const selector = `[data-content-id="${this.escapeCssIdentifier(id)}"]`;
      const el = document.querySelector(selector);

      if (!el) return;

      el.textContent = value;
    });
  }

  renderVideos(videos) {
    const grid = document.getElementById("video-grid");
    if (!grid) return;

    document.querySelectorAll(".dynamic-video").forEach((video) => {
      video.remove();
    });

    [...videos].reverse().forEach((video) => {
      const safeVideo = this.normalizeVideo(video);
      if (!safeVideo) return;

      const card = this.createVideoCard(safeVideo);
      grid.prepend(card);
    });

    if (window.uiService) {
      window.uiService.initVideoFilter();
    }
  }

  normalizeVideo(video) {
    if (!video || typeof video !== "object") return null;

    const title = typeof video.title === "string" ? video.title.trim() : "";
    const category = typeof video.category === "string" ? video.category.trim() : "all";
    const imageUrl = typeof video.imageUrl === "string" ? video.imageUrl.trim() : "";
    const videoUrl = typeof video.videoUrl === "string" ? video.videoUrl.trim() : "";

    if (!title || title.length > 120) return null;

    const allowedCategories = [
      "all",
      "quran",
      "arabic",
      "islamic",
      "tajweed",
      "grammar",
      "specialization"
    ];

    const finalCategory = allowedCategories.includes(category) ? category : "all";

    const fallbackImage =
      "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?q=80&w=1000";

    return {
      title,
      category: finalCategory,
      imageUrl: this.isSafeUrl(imageUrl) ? imageUrl : fallbackImage,
      videoUrl: this.isSafeUrl(videoUrl) ? videoUrl : "#",
    };
  }

  isSafeUrl(url) {
    if (!url) return false;

    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  escapeCssIdentifier(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }

    return value.replace(/["\\]/g, "\\$&");
  }

  createVideoCard(video) {
    const card = document.createElement("article");
    card.className = "video-card group cursor-pointer animate-fade-in-up dynamic-video";
    card.setAttribute("data-category", video.category);

    const imageWrapper = document.createElement("div");
    imageWrapper.className =
      "relative w-full h-56 rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-lg";

    const overlay = document.createElement("div");
    overlay.className =
      "absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10";

    const img = document.createElement("img");
    img.src = video.imageUrl;
    img.alt = video.title;
    img.loading = "lazy";
    img.className =
      "w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700";

    const playLayer = document.createElement("div");
    playLayer.className = "absolute inset-0 flex items-center justify-center z-20";

    const playCircle = document.createElement("a");
    playCircle.href = video.videoUrl;
    playCircle.target = "_blank";
    playCircle.rel = "noopener noreferrer";
    playCircle.setAttribute("aria-label", `تشغيل فيديو: ${video.title}`);
    playCircle.className =
      "w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:bg-[#D4AF37]/90 transition-all";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "w-6 h-6 text-white translate-x-0.5");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M5.536 21.886a1.004 1.004 0 001.033-.064l13-9a1 1 0 000-1.644l-13-9A1 1 0 005 3v18a1 1 0 00.536.886z"
    );

    svg.appendChild(path);
    playCircle.appendChild(svg);

    const title = document.createElement("h3");
    title.className =
      "text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors";
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
}

// ==========================================
// 6. Admin Service
// ==========================================
// تم تعطيل لوحة الإدارة القديمة عمدًا.
// السبب: لا يجوز استعمال كلمة سر داخل كود الواجهة، ولا حفظ HTML خام في Firestore.
// ستُعاد لوحة الإدارة لاحقًا بنظام Firebase Authentication وصلاحيات Admin آمنة.

// ==========================================
// 7. Application Bootstrap & Global Binding
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  try {
    const langService = new LanguageService();
    const uiService = new UIService();
    const enrollmentService = new EnrollmentService(firebaseService);
    const contentService = new ContentService(firebaseService);

    window.uiService = uiService;
    window.contentService = contentService;

    window.setLang = (lang) => langService.setLang(lang);

    window.toggleLangMenu = () => uiService.toggleLangMenu();
    window.closeDropdown = () => uiService.closeDropdown();

    window.toggleMobileMenu = () => uiService.toggleMobileMenu();
    window.closeMobileMenu = () => uiService.closeMobileMenu();

    window.showPasswordModal = () => {
      alert("لوحة الإدارة معطلة مؤقتًا حتى تركيب نظام دخول آمن.");
    };

    window.hidePasswordModal = () => {};

    void enrollmentService;
    void contentService;
  } catch (error) {
    console.error("Application bootstrap error:", error);
    hideSplashScreenSafely(0);
  }
});
```
