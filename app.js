import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc
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
// 3. نظام المحتوى الديناميكي (Headless CMS Logic)
// ==========================================
function indexEditableElements() {
  const textElements = document.querySelectorAll(
    ".lang-ar, .lang-en, .lang-fr, .lang-ru, h1, h2, h3, h4, p, li, blockquote, span:not(.logo-fallback)"
  );
  textElements.forEach((el, index) => {
    el.setAttribute("data-edit-id", "content_" + index);
  });
  return textElements;
}

async function loadSavedContent() {
  const textElements = indexEditableElements();
  try {
    const snap = await getDoc(doc(db, "settings", "content"));
    if (snap.exists()) {
      const data = snap.data();
      textElements.forEach((el) => {
        const id = el.getAttribute("data-edit-id");
        if (data[id]) {
          el.innerHTML = data[id];
        }
      });
    }
  } catch (error) {
    console.warn("لم يتم العثور على تعديلات سابقة للنصوص.");
  }
}

async function loadSavedVideos() {
  const grid = document.getElementById("video-grid");
  if (!grid) return;

  try {
    const querySnapshot = await getDocs(collection(db, "videos"));
    querySnapshot.forEach((docSnap) => {
      const vid = docSnap.data();
      renderVideoCard(docSnap.id, vid.title, vid.category, vid.imgUrl, grid);
    });
  } catch (error) {
    console.error("خطأ في جلب الفيديوهات:", error);
  }
}

function renderVideoCard(id, title, cat, imgUrl, grid) {
  const newVideoHTML = `
      <div class="video-card group cursor-pointer animate-fade-in-up relative" data-category="${cat}" id="vid-${id}">
          <button data-delete-id="${id}" class="delete-vid-btn absolute top-2 right-2 z-30 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="حذف الفيديو نهائياً">
              <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
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
          <p class="text-white/60 text-sm font-medium">مكتبة بصائر المرئية</p>
      </div>
  `;
  grid.insertAdjacentHTML("afterbegin", newVideoHTML);
}

// ==========================================
// 4. وضع المعمار الأعظم (Global States)
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
// 5. الأحداث الرئيسية (DOM Content Loaded)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // تحميل المحتوى الديناميكي والفيديوهات
  await loadSavedContent();
  await loadSavedVideos();

  // إعداد اللغة
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

  // معالجة استمارة التسجيل
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

  // تصفية المكتبة المرئية
  const filterBtns = document.querySelectorAll(".filter-btn");
  const videoGrid = document.getElementById("video-grid");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.classList.remove("bg-[#D4AF37]", "text-[#0A1F44]", "shadow-[0_0_15px_rgba(212,175,55,0.4)]");
        b.classList.add("bg-white/10", "text-white");
      });
      btn.classList.remove("bg-white/10", "text-white");
      btn.classList.add("bg-[#D4AF37]", "text-[#0A1F44]", "shadow-[0_0_15px_rgba(212,175,55,0.4)]");

      const filterValue = btn.getAttribute("data-filter");
      const videoCards = document.querySelectorAll(".video-card");
      
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

  // حذف الفيديو من قاعدة البيانات
  videoGrid?.addEventListener("click", async (e) => {
    if (e.target.closest('.delete-vid-btn')) {
        e.stopPropagation();
        if (!window.isEditingMode) {
            alert("يرجى تفعيل وضع التحرير (أيقونة القلم) أولاً لتتمكن من حذف الفيديوهات.");
            return;
        }
        
        const btn = e.target.closest('.delete-vid-btn');
        const id = btn.getAttribute("data-delete-id");
        
        if (confirm("تحذير أمني حاسم: هل أنت متأكد من حذف هذا الفيديو نهائياً من قاعدة البيانات السحابية؟")) {
            try {
                await deleteDoc(doc(db, "videos", id));
                const card = document.getElementById(`vid-${id}`);
                if (card) card.remove();
                alert("تم الحذف بنجاح.");
            } catch (err) {
                console.error(err);
                alert("حدث خطأ أثناء الحذف. تأكد من الصلاحيات.");
            }
        }
    }
  });

  // وضع المعمار الأعظم و أحداث الأزرار
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

  document.getElementById("confirm-add-video")?.addEventListener("click", async () => {
    const title = document.getElementById("new-vid-title").value;
    const cat = document.getElementById("new-vid-cat").value;
    const imgUrl = document.getElementById("new-vid-img").value || "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?q=80&w=1000";
    const btn = document.getElementById("confirm-add-video");

    if (!title) {
      alert("أدخل عنوان الفيديو أولاً");
      return;
    }

    btn.textContent = "جاري الحفظ...";
    btn.disabled = true;

    try {
        const docRef = await addDoc(collection(db, "videos"), {
            title: title,
            category: cat,
            imgUrl: imgUrl,
            createdAt: serverTimestamp()
        });

        renderVideoCard(docRef.id, title, cat, imgUrl, document.getElementById("video-grid"));

        const modal = document.getElementById("add-video-modal");
        modal.classList.add("opacity-0");
        document.getElementById("video-modal-content")?.classList.add("scale-95");
        setTimeout(() => { modal.classList.add("hidden"); }, 300);
        
        document.getElementById("new-vid-title").value = "";
        document.getElementById("new-vid-img").value = "";

    } catch (error) {
        console.error("خطأ في حفظ الفيديو:", error);
        alert("حدث خطأ أثناء الحفظ. تأكد من قواعد الأمان في فايربيس.");
    } finally {
        btn.textContent = "إدراج في المكتبة";
        btn.disabled = false;
    }
  });

  document.getElementById("dev-save-btn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalHTML = btn.innerHTML;
    
    btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-[#0A1F44]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

    try {
        const textElements = document.querySelectorAll('[data-edit-id]');
        const dataToSave = {};
        
        textElements.forEach(el => {
            const id = el.getAttribute('data-edit-id');
            if(id) dataToSave[id] = el.innerHTML;
        });

        await setDoc(doc(db, "settings", "content"), dataToSave, { merge: true });
        
        window.disableEditing();
        alert("نجاح معماري: تم حفظ التعديلات بنجاح في قاعدة البيانات!");
    } catch (err) {
        console.error("خطأ الحفظ:", err);
        alert("فشل الحفظ. تأكد من الصلاحيات.");
    } finally {
        btn.innerHTML = originalHTML;
    }
  });
});

// ==========================================
// 6. شاشة البداية والآراء (Splash Screen & Testimonials)
// ==========================================
window.addEventListener("load", function () {
    
    // 1. نظام الفشل الآمن لإخفاء السبلاش
    const splashScreen = document.getElementById("splash-screen");
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add("opacity-0");
            splashScreen.style.pointerEvents = "none";
            setTimeout(() => {
                splashScreen.style.display = "none";
            }, 1000);
        }, 4500); 
    }

    // 2. محرك الجسيمات
    try {
        const canvas = document.getElementById("particle-canvas");
        const logoContainer = document.getElementById("splash-logo-container");
        
        if (canvas && splashScreen && logoContainer) {
            const ctx = canvas.getContext("2d");
            let w = canvas.width = window.innerWidth;
            let h = canvas.height = window.innerHeight;
            
            let particles = [];
            const particleCount = window.innerWidth < 768 ? 150 : 300;
            let phase = "gathering";
            
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    angle: Math.random() * Math.PI * 2,
                    radius: Math.random() * Math.max(w, h),
                    speed: 0.02 + Math.random() * 0.04,
                    size: Math.random() * 2.5 + 0.5,
                    color: `rgba(212, 175, 55, ${Math.random() * 0.8 + 0.2})`,
                    friction: 0.95
                });
            }
            
            let animationFrame;
            const centerX = w / 2;
            const centerY = h / 2;
            
            function renderParticles() {
                ctx.fillStyle = "rgba(5, 16, 36, 0.15)";
                ctx.fillRect(0, 0, w, h);
                
                let allGathered = true;

                particles.forEach(p => {
                    if (phase === "gathering") {
                        p.radius -= p.radius * 0.06;
                        p.angle += p.speed;
                        if (p.radius > 10) allGathered = false;
                    } else if (phase === "exploding") {
                        p.radius += (p.radius * 0.15) + 15;
                        p.angle += p.speed * 0.5;
                    }
                    
                    const x = centerX + Math.cos(p.angle) * p.radius;
                    const y = centerY + Math.sin(p.angle) * p.radius;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    
                    if (phase === "gathering" && p.radius < 150) {
                        ctx.lineTo(centerX, centerY);
                        ctx.strokeStyle = `rgba(212, 175, 55, ${0.1 - p.radius/1500})`;
                        ctx.stroke();
                    }
                });
                
                if (phase === "gathering" && allGathered) {
                    phase = "exploding";
                    logoContainer.classList.remove("opacity-0", "scale-50");
                    logoContainer.classList.add("opacity-100", "scale-100");
                }
                
                animationFrame = requestAnimationFrame(renderParticles);
            }
            
            renderParticles();
            
            window.addEventListener("resize", () => {
                w = canvas.width = window.innerWidth;
                h = canvas.height = window.innerHeight;
            });

            setTimeout(() => {
                cancelAnimationFrame(animationFrame);
            }, 4500);
        }
    } catch (err) {
        console.error("تم تجاوز خطأ الرسوميات لضمان عمل الموقع:", err);
    }

    // 3. استعادة كود حركة الآراء (Testimonials)
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
