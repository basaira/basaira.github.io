import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. تهيئة فايربيس (Firebase Config)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBTsosPoNUekZNywFgrBkVmtTrOSK-XyB8",
  authDomain: "jumping-unfolding-3v7sv.firebaseapp.com",
  projectId: "jumping-unfolding-3v7sv",
  storageBucket: "jumping-unfolding-3v7sv.firebasestorage.app",
  messagingSenderId: "998742851624",
  appId: "1:998742851624:web:98cab99ce0bc19505cf51d",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  "ai-studio-6df2ea0b-0738-4940-b98e-7efdd9b010d0"
);

// ==========================================
// 2. القواميس واللغات (Language & Translation)
// ==========================================
const trackTranslations = {
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

function updateDynamicSelect(lang) {
  const selectEl = document.getElementById("dynamic-track-select");
  if (!selectEl) return;

  selectEl.innerHTML = "";
  const options = trackTranslations[lang] || trackTranslations["ar"];

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

window.setLang = function (langCode) {
  const root = document.getElementById("html-root");
  const body = document.getElementById("body-root");

  body.className = "route-" + langCode + " relative";
  root.lang = langCode;
  root.dir = langCode === "ar" ? "rtl" : "ltr";

  const pageTitle = document.getElementById("page-title");
  if (pageTitle) {
    if (langCode === "ar") pageTitle.textContent = "أكاديمية بصائر | نور يهدي، وعلم يبني";
    else if (langCode === "en") pageTitle.textContent = "Basair Academy | Guided by Light";
    else if (langCode === "fr") pageTitle.textContent = "Académie Bassaïr | Lumière qui guide";
    else if (langCode === "ru") pageTitle.textContent = "Академия Басаир | Свет, который ведет";
  }

  localStorage.setItem("academy_lang", langCode);
  updateDynamicSelect(langCode);
  window.closeDropdown();
  window.closeMobileMenu();
};

window.toggleLangMenu = function () {
  const dropdown = document.getElementById("langDropdown");
  const btn = document.getElementById("lang-btn");
  if (dropdown && btn) {
    dropdown.classList.toggle("active");
    btn.setAttribute("aria-expanded", dropdown.classList.contains("active"));
  }
};

window.closeDropdown = function () {
  const menu = document.getElementById("langDropdown");
  const btn = document.getElementById("lang-btn");
  if (menu && menu.classList.contains("active")) {
    menu.classList.remove("active");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
};

window.toggleMobileMenu = function () {
  const menu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-backdrop");
  const btn = document.getElementById("mobile-menu-btn");

  const isActive = menu.classList.contains("active");

  if (!isActive) {
    menu.classList.add("active");
    if (backdrop) backdrop.classList.add("active");
    if (btn) btn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  } else {
    window.closeMobileMenu();
  }
};

window.closeMobileMenu = function () {
  const menu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-backdrop");
  const btn = document.getElementById("mobile-menu-btn");

  if (menu && menu.classList.contains("active")) {
    menu.classList.remove("active");
    if (backdrop) backdrop.classList.remove("active");
    if (btn) btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
};

// ==========================================
// 3. وضع المعمار الأعظم وحالة التطبيق (Global States)
// ==========================================
window.isEditingMode = false;
window.godModeActive = false;

window.disableEditing = function () {
  window.isEditingMode = false;
  const btn = document.getElementById("dev-edit-btn");
  if (btn) btn.classList.remove("text-[#D4AF37]", "bg-white/10");

  document.body.classList.remove("god-mode-editing");

  const textElements = document.querySelectorAll('[contenteditable="true"]');
  textElements.forEach((el) => {
    el.removeAttribute("contenteditable");
    el.style.outline = "none";
    el.style.cursor = "";
  });
};

window.toggleGodMode = function (forceOpen = false) {
  const dock = document.getElementById("dev-god-mode");
  if (!dock) return;

  if (forceOpen) window.godModeActive = true;
  else window.godModeActive = !window.godModeActive;

  if (window.godModeActive) {
    dock.classList.remove("translate-y-32", "opacity-0", "pointer-events-none");
    dock.classList.add("translate-y-0", "opacity-100", "pointer-events-auto");
  } else {
    dock.classList.add("translate-y-32", "opacity-0", "pointer-events-none");
    dock.classList.remove("translate-y-0", "opacity-100", "pointer-events-auto");
    window.disableEditing();
  }
};

window.showPasswordModal = function () {
  const modal = document.getElementById("password-modal");
  const input = document.getElementById("god-mode-password");
  const errorTxt = document.getElementById("password-error");

  if (!modal || !input) return;

  input.value = "";
  if (errorTxt) errorTxt.classList.add("hidden");
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    document.getElementById("password-modal-content")?.classList.remove("scale-95");
    input.focus();
  }, 10);
};

window.hidePasswordModal = function () {
  const modal = document.getElementById("password-modal");
  if (!modal) return;
  
  modal.classList.add("opacity-0");
  document.getElementById("password-modal-content")?.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
};

// ==========================================
// 4. الأحداث الرئيسية (DOM Content Loaded)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // --- إعداد اللغة ---
  const savedLang = localStorage.getItem("academy_lang") || "ar";
  window.setLang(savedLang);

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const targetBtn = e.target.closest("[data-lang]");
      if (targetBtn) window.setLang(targetBtn.getAttribute("data-lang"));
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".relative")) window.closeDropdown();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) window.closeMobileMenu();
  });

  window.addEventListener("scroll", () => {
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
      if (scrollY >= sectionTop - 100) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active-section");
      if (link.getAttribute("href").includes(current)) {
        link.classList.add("active-section");
      }
    });
  });

  // --- معالجة الاستمارة ---
  const form = document.getElementById("enrollment-form");
  const submitBtn = document.getElementById("submit-btn");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");
  const successMsg = document.getElementById("success-message");
  const errorMsg = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-70", "cursor-not-allowed");
      btnText.classList.add("hidden");
      btnSpinner.classList.remove("hidden");
      successMsg.classList.add("hidden");
      errorMsg.classList.add("hidden");

      const formData = new FormData(form);
      const trackValue = formData.get("track");

      if (!trackValue) {
        errorText.textContent = "يرجى اختيار المسار الأكاديمي أولاً.";
        errorMsg.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
        btnText.classList.remove("hidden");
        btnSpinner.classList.add("hidden");
        return;
      }

      const data = {
        fullName: formData.get("fullName"),
        phone: formData.get("phone"),
        track: trackValue,
        message: formData.get("message") || "لا يوجد",
        submissionDate: serverTimestamp(),
        status: "new",
      };

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), 15000)
        );

        const firebasePromise = addDoc(collection(db, "enrollment_requests"), data);

        await Promise.race([firebasePromise, timeoutPromise]);

        form.reset();
        successMsg.classList.remove("hidden");
        setTimeout(() => successMsg.classList.add("hidden"), 5000);
      } catch (error) {
        console.error("Firebase/Network Error: ", error);
        if (error.message === "NETWORK_TIMEOUT") {
          errorText.textContent = "فشل الاتصال. تأكد من تفعيل قاعدة بيانات Firestore في مشروعك.";
        } else {
          errorText.textContent = "حدث خطأ: " + error.message;
        }
        errorMsg.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
        btnText.classList.remove("hidden");
        btnSpinner.classList.add("hidden");
      }
    });
  }

  // --- المكتبة المرئية (Video Filter Logic) ---
  const filterBtns = document.querySelectorAll(".filter-btn");
  const videoCards = document.querySelectorAll(".video-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.classList.remove("bg-[#D4AF37]", "text-[#0A1F44]", "shadow-[0_0_15px_rgba(212,175,55,0.4)]");
        b.classList.add("bg-white/10", "text-white");
      });
      btn.classList.remove("bg-white/10", "text-white");
      btn.classList.add("bg-[#D4AF37]", "text-[#0A1F44]", "shadow-[0_0_15px_rgba(212,175,55,0.4)]");

      const filterValue = btn.getAttribute("data-filter");
      videoCards.forEach((card) => {
        if (filterValue === "all" || card.getAttribute("data-category") === filterValue) {
          card.style.display = "block";
          setTimeout(() => (card.style.opacity = "1"), 50);
        } else {
          card.style.opacity = "0";
          setTimeout(() => (card.style.display = "none"), 300);
        }
      });
    });
  });

  // --- وضع المعمار الأعظم و أحداث الأزرار ---
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "m" || e.key === "M")) {
      e.preventDefault();
      if (!window.godModeActive) window.showPasswordModal();
      else window.toggleGodMode();
    }
  });

  document.getElementById("verify-password-btn")?.addEventListener("click", async () => {
    const passInput = document.getElementById("god-mode-password").value;
    const errorTxt = document.getElementById("password-error");
    const btnText = document.getElementById("verify-btn-text");
    const spinner = document.getElementById("verify-spinner");

    if (!passInput) {
      errorTxt.textContent = "يرجى إدخال المفتاح!";
      errorTxt.classList.remove("hidden");
      return;
    }

    btnText.classList.add("hidden");
    spinner.classList.remove("hidden");
    errorTxt.classList.add("hidden");

    try {
      const docRef = doc(db, "settings", "security");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        try {
          await setDoc(docRef, { adminPassword: "Basair@2026" });
          if (passInput === "Basair@2026") {
            window.hidePasswordModal();
            window.toggleGodMode(true);
            return;
          } else {
            errorTxt.textContent = "المفتاح الأمني غير صحيح!";
            errorTxt.classList.remove("hidden");
            return;
          }
        } catch (e) {
          if (passInput === "Basair@2026") {
            window.hidePasswordModal();
            window.toggleGodMode(true);
            return;
          }
          errorTxt.textContent = "المستند غير موجود وتفقد الصلاحيات.";
          errorTxt.classList.remove("hidden");
          return;
        }
      }

      if (docSnap.data().adminPassword === passInput) {
        window.hidePasswordModal();
        window.toggleGodMode(true);
      } else {
        errorTxt.textContent = "المفتاح الأمني غير صحيح!";
        errorTxt.classList.remove("hidden");
      }
    } catch (error) {
      errorTxt.textContent = "تأكد من صلاحيات قاعدة البيانات.";
      errorTxt.classList.remove("hidden");
    } finally {
      btnText.classList.remove("hidden");
      spinner.classList.add("hidden");
    }
  });

  document.getElementById("god-mode-password")?.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("verify-password-btn").click();
    }
  });

  // أزرار لوحة المطور
  document.getElementById("dev-close-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.toggleGodMode();
  });

  document.getElementById("dev-edit-btn")?.addEventListener("click", function (e) {
    e.preventDefault();
    window.isEditingMode = !window.isEditingMode;

    const textElements = document.querySelectorAll(".lang-ar, .lang-en, .lang-fr, .lang-ru, h1, h2, h3, h4, p, li, blockquote, span:not(.logo-fallback)");

    if (window.isEditingMode) {
      this.classList.add("text-[#D4AF37]", "bg-white/10");
      document.body.classList.add("god-mode-editing");

      textElements.forEach((el) => {
        el.setAttribute("contenteditable", "true");
        el.style.cursor = "text";
        if (!el.className.includes("lang-")) {
          el.style.outline = "1px dashed rgba(212, 175, 55, 0.4)";
        }
      });
    } else {
      window.disableEditing();
    }
  });

  document.getElementById("dev-add-video-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const modal = document.getElementById("add-video-modal");
    if (modal) {
      modal.classList.remove("hidden");
      setTimeout(() => {
        modal.classList.remove("opacity-0");
        document.getElementById("video-modal-content")?.classList.remove("scale-95");
      }, 10);
    }
  });

  document.getElementById("confirm-add-video")?.addEventListener("click", () => {
    const title = document.getElementById("new-vid-title").value;
    const cat = document.getElementById("new-vid-cat").value;
    const imgUrl = document.getElementById("new-vid-img").value || "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?q=80&w=1000";

    if (!title) {
      alert("أدخل العنوان");
      return;
    }

    const newVideoHTML = `
      <div class="video-card group cursor-pointer animate-fade-in-up" data-category="${cat}">
          <div class="relative w-full h-56 rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-lg">
              <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
              <img src="${imgUrl}" alt="${title}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">
              <div class="absolute inset-0 flex items-center justify-center z-20">
                  <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:bg-[#D4AF37]/90 transition-all">
                      <svg class="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5.536 21.886a1.004 1.004 0 001.033-.064l13-9a1 1 0 000-1.644l-13-9A1 1 0 005 3v18a1 1 0 00.536.886z"/></svg>
                  </div>
              </div>
          </div>
          <h3 class="text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">${title}</h3>
          <p class="text-white/60 text-sm font-medium">فيديو مضاف حديثاً عبر وضع المطور.</p>
      </div>
    `;

    document.getElementById("video-grid")?.insertAdjacentHTML("afterbegin", newVideoHTML);

    const modal = document.getElementById("add-video-modal");
    modal.classList.add("opacity-0");
    document.getElementById("video-modal-content")?.classList.add("scale-95");
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 300);
  });

  document.getElementById("dev-save-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.disableEditing();
    alert("تم تجميد التعديلات. تم حفظ التعديلات محلياً بنجاح.");
  });
});

window.addEventListener("load", function () {
  const splashScreen = document.getElementById("splash-screen");
  if (splashScreen) {
    setTimeout(function () {
      splashScreen.classList.add("splash-hidden");
      setTimeout(function () {
        splashScreen.style.display = "none";
      }, 800);
    }, 2500);
  }

  // إعداد حركة الآراء
  const track = document.getElementById("testimonials-track");
  if (track) {
    const slides = Array.from(document.querySelectorAll(".testimonial-slide"));
    if (slides.length > 0) {
      const firstClone = slides[0].cloneNode(true);
      const lastClone = slides[slides.length - 1].cloneNode(true);
      track.appendChild(firstClone);
      track.insertBefore(lastClone, slides[0]);

      let allSlides = document.querySelectorAll(".testimonial-slide");
      let currentIndex = 1;
      const slideWidth = 100;

      track.style.transition = "none";
      track.style.transform = `translateX(${currentIndex * slideWidth}%)`;

      function updateSlider(animate = true) {
        track.style.transition = animate ? "transform 0.7s ease-in-out" : "none";
        track.style.transform = `translateX(${currentIndex * slideWidth}%)`;
      }

      track.addEventListener("transitionend", () => {
        if (allSlides[currentIndex].isEqualNode(firstClone)) {
          currentIndex = 1;
          updateSlider(false);
        }
        if (allSlides[currentIndex].isEqualNode(lastClone)) {
          currentIndex = allSlides.length - 2;
          updateSlider(false);
        }
      });

      const nextBtn = document.getElementById("slider-next-btn");
      const prevBtn = document.getElementById("slider-prev-btn");

      function moveToNext() {
        if (currentIndex >= allSlides.length - 1) return;
        currentIndex++;
        updateSlider();
      }

      function moveToPrev() {
        if (currentIndex <= 0) return;
        currentIndex--;
        updateSlider();
      }

      if (nextBtn) nextBtn.addEventListener("click", moveToNext);
      if (prevBtn) prevBtn.addEventListener("click", moveToPrev);

      let autoPlay = setInterval(moveToNext, 6000);
      [nextBtn, prevBtn].forEach((btn) => {
        if (btn) {
          btn.addEventListener("mouseenter", () => clearInterval(autoPlay));
          btn.addEventListener("mouseleave", () => (autoPlay = setInterval(moveToNext, 6000)));
        }
      });
    }
  }
});