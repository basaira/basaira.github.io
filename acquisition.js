import { firebaseConfig } from "./firebase-config.js";
import { focusInvalidField, safeStorage, createSubmissionToken, clearSubmissionToken, sanitizeAttributionMap } from "./harden-v1.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initializeFirestore, setDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

const root = document.documentElement;
const body = document.body;
const locale = body.dataset.locale || "en";
const track = body.dataset.track || "unknown";
const persona = body.dataset.persona || "general";
const route = window.location.pathname;

async function applyPublicTextOverrides() {
  try {
    const snap = await getDoc(doc(db, "site_content", "public"));
    if (!snap.exists()) return;
    const data = snap.data() || {};
    const texts = data.texts && typeof data.texts === "object" ? data.texts : {};
    Object.entries(texts).slice(0, 5000).forEach(([id, value]) => {
      if (typeof id !== "string" || typeof value !== "string") return;
      const safeId = window.CSS && typeof window.CSS.escape === "function" ? window.CSS.escape(id) : id.replace(/["\\]/g, "\\$&");
      document.querySelectorAll(`[data-content-id="${safeId}"]`).forEach((element) => {
        element.textContent = value;
      });
    });

    const settings = data.settings && typeof data.settings === "object" ? data.settings : {};
    const whatsapp = String(settings.whatsappNumber || "").replace(/\D/g, "");
    const telegram = String(settings.telegramUsername || "").trim().replace(/^@+/, "");
    if (whatsapp.length >= 8 && whatsapp.length <= 15) {
      document.querySelectorAll('[data-contact-channel="whatsapp"]').forEach((anchor) => {
        if (!(anchor instanceof HTMLAnchorElement)) return;
        let query = "";
        try { query = new URL(anchor.href, window.location.href).search || ""; } catch (_) {}
        anchor.href = `https://wa.me/${whatsapp}${query}`;
      });
    }
    if (/^[A-Za-z0-9_]{5,32}$/.test(telegram)) {
      document.querySelectorAll('[data-contact-channel="telegram"]').forEach((anchor) => {
        if (anchor instanceof HTMLAnchorElement) anchor.href = `https://t.me/${telegram}`;
      });
    }
  } catch (error) {
    console.warn("Basair content overrides unavailable:", error && error.code ? error.code : error);
  }
}

applyPublicTextOverrides();

const translations = {
  en: {
    requiredContact: "Please provide a WhatsApp number or email address.",
    invalidName: "Please enter a valid name.",
    invalidAge: "Please enter a valid learner age.",
    invalidCountry: "Please enter your country.",
    invalidWhatsapp: "Please enter a valid WhatsApp number.",
    invalidEmail: "Please enter a valid email address.",
    sending: "Sending your assessment request…",
    success: "Your free assessment request has been received. Our admissions team will contact you using your selected contact details.",
    failure: "We could not submit the request right now. Please try again, or contact us through WhatsApp/Telegram below.",
    cooldown: "This request was submitted recently. You can still contact us directly through WhatsApp or Telegram.",
    offline: "You are offline. Your data is still in the form; submit again when the connection returns.",
    uncertain: "We could not confirm the submission result. It may already have been received; avoid repeated submissions and use direct follow-up below.",
    whatsappText: "Hello Basair Academy, I have submitted a free assessment request and would like to follow up.",
    nextStep: "Request received. You can follow up directly here if useful.",
    recoveryLead: "Submission was not completed. You can continue directly through one of these channels."
  },
  ru: {
    requiredContact: "Укажите номер WhatsApp или адрес электронной почты.",
    invalidName: "Введите корректное имя.",
    invalidAge: "Введите корректный возраст ученика.",
    invalidCountry: "Укажите страну.",
    invalidWhatsapp: "Укажите корректный номер WhatsApp.",
    invalidEmail: "Укажите корректный адрес электронной почты.",
    sending: "Отправляем заявку на бесплатную диагностику…",
    success: "Заявка на бесплатную диагностику получена. Приёмная команда свяжется с вами по указанным контактам.",
    failure: "Сейчас не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами через WhatsApp/Telegram ниже.",
    cooldown: "Такая заявка уже была отправлена недавно. Вы можете связаться с нами напрямую через WhatsApp или Telegram.",
    offline: "Нет подключения к Интернету. Данные остаются в форме; отправьте снова после восстановления связи.",
    uncertain: "Не удалось подтвердить результат отправки. Заявка могла уже поступить; не отправляйте её многократно и воспользуйтесь прямой связью ниже.",
    whatsappText: "Здравствуйте, Академия Басаир. Я отправил(а) заявку на бесплатную диагностику и хочу уточнить дальнейшие шаги.",
    nextStep: "Заявка получена. При необходимости можно сразу продолжить через один из этих каналов.",
    recoveryLead: "Отправка не завершилась. Можно продолжить напрямую через один из этих каналов."
  },
  uz: {
    requiredContact: "WhatsApp raqamingizni yoki e-mail manzilingizni kiriting.",
    invalidName: "Iltimos, ismni to‘g‘ri kiriting.",
    invalidAge: "Iltimos, o‘quvchining yoshini to‘g‘ri kiriting.",
    invalidCountry: "Iltimos, mamlakatni kiriting.",
    invalidWhatsapp: "Iltimos, to‘g‘ri WhatsApp raqamini kiriting.",
    invalidEmail: "Iltimos, to‘g‘ri e-mail manzilini kiriting.",
    sending: "Bepul baholash so‘rovingiz yuborilmoqda…",
    success: "Bepul baholash so‘rovingiz qabul qilindi. Qabul jamoamiz ko‘rsatgan aloqa ma’lumotlaringiz orqali siz bilan bog‘lanadi.",
    failure: "Hozir so‘rovni yuborib bo‘lmadi. Qayta urinib ko‘ring yoki quyidagi WhatsApp/Telegram orqali bog‘laning.",
    cooldown: "Bu qurilmadan yaqinda so‘rov yuborilgan. WhatsApp yoki Telegram orqali to‘g‘ridan-to‘g‘ri bog‘lanishingiz mumkin.",
    offline: "Internet aloqasi yo‘q. Ma’lumotlaringiz formada qoladi; aloqa qaytgach yana yuboring.",
    uncertain: "Yuborish natijasini tasdiqlab bo‘lmadi. So‘rov yetib borgan bo‘lishi mumkin; qayta-qayta yubormang va quyidagi aloqa yo‘lidan foydalaning.",
    whatsappText: "Assalomu alaykum, Basair Academy. Men bepul baholash uchun so‘rov yubordim va keyingi qadamlarni bilmoqchiman.",
    nextStep: "So‘rov qabul qilindi. Zarur bo‘lsa, shu kanallardan biri orqali darhol davom etishingiz mumkin.",
    recoveryLead: "Yuborish yakunlanmadi. Shu kanallardan biri orqali bevosita davom etishingiz mumkin."
  }
};
const t = translations[locale] || translations.en;

function sanitize(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function collectAttribution() {
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"];
  const current = {};
  keys.forEach((key) => {
    const value = params.get(key);
    if (value) current[key] = sanitize(value, 200);
  });
  current.landing_path = route;
  current.referrer = sanitize(document.referrer, 500);
  current.captured_at = new Date().toISOString();

  try {
    const firstKey = "basair_first_touch_attribution";
    if (!localStorage.getItem(firstKey)) localStorage.setItem(firstKey, JSON.stringify(current));
    localStorage.setItem("basair_last_touch_attribution", JSON.stringify(current));
    let storedFirst = {}; try { storedFirst = JSON.parse(localStorage.getItem(firstKey) || "{}"); } catch (_) {}
    return { firstTouch: sanitizeAttributionMap(storedFirst), lastTouch: sanitizeAttributionMap(current) };
  } catch {
    return { firstTouch: sanitizeAttributionMap(current), lastTouch: sanitizeAttributionMap(current) };
  }
}

const attribution = collectAttribution();

function fireEvent(name, params = {}) {
  const payload = { route, locale, track, persona, ...params };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...payload });
  if (typeof window.gtag === "function") window.gtag("event", name, payload);
  if (typeof window.fbq === "function") {
    const map = { basair_page_view: "PageView", assessment_start: "Lead", assessment_submit_success: "CompleteRegistration" };
    if (map[name]) window.fbq("track", map[name], payload);
    else window.fbq("trackCustom", name, payload);
  }
}

fireEvent("basair_page_view", {
  utm_source: attribution.lastTouch.utm_source || "",
  utm_campaign: attribution.lastTouch.utm_campaign || ""
});

const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion && "IntersectionObserver" in window) {
  root.classList.add("motion-enabled");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: "0px 0px -4% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
}

const assessmentSection = document.getElementById("assessment");
let assessmentViewed = false;
if (assessmentSection && "IntersectionObserver" in window) {
  const assessmentObserver = new IntersectionObserver((entries) => {
    if (!assessmentViewed && entries.some((entry) => entry.isIntersecting)) {
      assessmentViewed = true;
      fireEvent("assessment_view");
      assessmentObserver.disconnect();
    }
  }, { threshold: .25 });
  assessmentObserver.observe(assessmentSection);
}

document.querySelectorAll("[data-track-event]").forEach((el) => {
  el.addEventListener("click", () => fireEvent(el.dataset.trackEvent || "cta_click", { label: el.dataset.eventLabel || "" }));
});

const form = document.getElementById("assessment-form");
if (form) {
  let started = false;
  let submissionInFlight = false;
  form.addEventListener("input", () => {
    if (form.dataset.delightState) {
      form.removeAttribute("data-delight-state");
      const status = document.getElementById("form-status");
      const postSubmit = document.getElementById("post-submit");
      if (status) {
        status.className = "form-status";
        status.textContent = "";
        status.removeAttribute("data-delight-state");
      }
      if (postSubmit) {
        postSubmit.classList.remove("show", "is-recovery", "is-success");
        postSubmit.removeAttribute("data-delight-label");
      }
    }
    if (!started) {
      started = true;
      fireEvent("assessment_start");
    }
  }, { passive: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submissionInFlight) return;
    const honeypot = form.elements.namedItem("website");
    if (honeypot && String(honeypot.value || "").trim()) {
      form.reset();
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    const status = document.getElementById("form-status");
    const postSubmit = document.getElementById("post-submit");
    const data = new FormData(form);
    const fullName = sanitize(data.get("fullName"), 80);
    const age = sanitize(data.get("age"), 20);
    const country = sanitize(data.get("country"), 90);
    const whatsapp = sanitize(data.get("whatsapp"), 30);
    const email = sanitize(data.get("email"), 120);
    const preferredTime = sanitize(data.get("preferredTime"), 120);
    const goal = sanitize(data.get("goal"), 1000);
    const contactPreference = sanitize(data.get("contactPreference"), 30);

    const showStatus = (message, type) => {
      if (!status) return;
      status.textContent = message;
      status.className = "form-status show " + type;
      status.dataset.delightState = type;
      status.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    };

    const setPostSubmit = (mode, label) => {
      if (!postSubmit) return;
      postSubmit.classList.add("show");
      postSubmit.classList.toggle("is-recovery", mode === "recovery");
      postSubmit.classList.toggle("is-success", mode === "success");
      postSubmit.dataset.delightLabel = label || "";
    };

    const clearPostSubmit = () => {
      if (!postSubmit) return;
      postSubmit.classList.remove("show", "is-recovery", "is-success");
      postSubmit.removeAttribute("data-delight-label");
    };

    clearPostSubmit();
    form.removeAttribute("data-delight-state");
    if (fullName.length < 2 || fullName.length > 80) { showStatus(t.invalidName, "error"); focusInvalidField(form, "fullName"); return; }
    if (age && (!/^\d{1,2}$/.test(age) || Number(age) < 3 || Number(age) > 99)) { showStatus(t.invalidAge, "error"); focusInvalidField(form, "age"); return; }
    if (country.length < 2 || country.length > 90) { showStatus(t.invalidCountry, "error"); focusInvalidField(form, "country"); return; }
    const whatsappDigits = whatsapp.replace(/\D/g, "");
    if (whatsapp && (whatsapp.length < 6 || whatsapp.length > 30 || whatsappDigits.length < 6 || whatsappDigits.length > 15 || !/^[+\d().\-\s]+$/.test(whatsapp))) { showStatus(t.invalidWhatsapp, "error"); focusInvalidField(form, "whatsapp"); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showStatus(t.invalidEmail, "error"); focusInvalidField(form, "email"); return; }
    if (!whatsapp && !email) { showStatus(t.requiredContact, "error"); focusInvalidField(form, "whatsapp"); return; }

    const cooldownKey = `basair_assessment_${track}_${persona}`;
    const last = Number(safeStorage(window.localStorage, "get", cooldownKey) || 0);
    if (last && Date.now() - last < 15 * 60 * 1000) {
      showStatus(t.cooldown, "success");
      form.dataset.delightState = "recovery";
      setPostSubmit("recovery", t.recoveryLead);
      return;
    }

    if (navigator.onLine === false) { showStatus(t.offline, "error"); form.dataset.delightState = "recovery"; setPostSubmit("recovery", t.recoveryLead); return; }

    submissionInFlight = true;
    let submissionToken = null;
    form.setAttribute("aria-busy", "true");
    if (submit) {
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      submit.dataset.originalText = submit.textContent;
      submit.textContent = t.sending;
      submit.classList.add("is-loading");
    }
    showStatus(t.sending, "loading");

    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), 15000));
      const leadPayload = {
        requestType: "free_assessment",
        fullName,
        age: age || null,
        country,
        whatsapp: whatsapp || null,
        email: email || null,
        contactPreference: contactPreference || null,
        preferredTime: preferredTime || null,
        goal: goal || null,
        track,
        persona,
        locale,
        language: locale,
        route,
        pagePath: route,
        pageTitle: document.title,
        firstTouchAttribution: attribution.firstTouch,
        lastTouchAttribution: attribution.lastTouch,
        userAgent: sanitize(navigator.userAgent, 350),
        submittedAt: serverTimestamp(),
        submissionDate: serverTimestamp(),
        status: "new"
      };

      const fingerprint = JSON.stringify([fullName, age || "", country, whatsapp || "", email || "", track, persona, goal || ""]);
      submissionToken = createSubmissionToken(`acquisition-${track}-${persona}`, fingerprint);
      const ref = doc(db, "assessment_requests", submissionToken.id);
      const saveLead = async () => { await setDoc(ref, leadPayload); return { ref, source: "assessment_requests" }; };

      const result = await Promise.race([saveLead(), timeout]);
      if (result?.ref?.id && status) status.dataset.requestId = result.ref.id;
      clearSubmissionToken(submissionToken.storageKey);
      safeStorage(window.localStorage, "set", cooldownKey, String(Date.now()));
      showStatus(t.success, "success");
      form.reset();
      form.dataset.delightState = "received";
      setPostSubmit("success", t.nextStep);
      fireEvent("assessment_submit_success", { contact_preference: contactPreference });
    } catch (error) {
      console.error("Assessment submission failed:", error);
      const code = error?.code ? String(error.code) : ""; const messageText = error?.message ? String(error.message) : "";
      const uncertain = messageText === "NETWORK_TIMEOUT" || (code === "permission-denied" && submissionToken?.reused);
      showStatus(navigator.onLine === false ? t.offline : uncertain ? t.uncertain : t.failure, "error");
      form.dataset.delightState = "recovery";
      setPostSubmit("recovery", t.recoveryLead);
      fireEvent("assessment_submit_error", { reason: error?.message || "unknown" });
    } finally {
      submissionInFlight = false;
      form.removeAttribute("aria-busy");
      if (submit) {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        submit.classList.remove("is-loading");
        submit.textContent = submit.dataset.originalText || submit.textContent;
      }
    }
  });
}

const whatsappFollowup = document.getElementById("whatsapp-followup");
if (whatsappFollowup) {
  whatsappFollowup.href = `https://wa.me/201070441115?text=${encodeURIComponent(t.whatsappText)}`;
}

const year = document.querySelector("[data-current-year]");
if (year) year.textContent = String(new Date().getFullYear());

if (root.lang !== locale) root.lang = locale;
