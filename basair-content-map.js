// Basair editable text map
// Responsibilities:
// - Provide stable editable text IDs for important website copy.
// - Expose BasairTextMap.assign and BasairTextMap.extractFromHtml for admin indexing.
// - Apply a small splash-screen runtime tuning without changing index.html.

(function () {
  "use strict";

  const LANGS = ["ar", "en", "fr", "ru"];
  const LANG_SELECTOR = LANGS.map((lang) => ".lang-" + lang).join(",");
  const EDITABLE_SELECTOR = "[data-content-id]," + LANG_SELECTOR;
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IMG", "SVG", "PATH", "INPUT", "TEXTAREA", "SELECT", "OPTION"]);
  const NEVER_EDIT = "#admin-modal,#splash-screen";

  const STABLE_RULES = [
    ["#navbar", "navbar-brand", { ar: "أكاديمية بصائر", en: "Basair Academy", fr: "Académie Bassaïr", ru: "Академия Басаир" }],
    ["#navbar nav", "nav-about", { ar: "عن الأكاديمية", en: "About Us", fr: "À Propos", ru: "О Нас" }],
    ["#navbar nav", "nav-tracks", { ar: "المسارات الأكاديمية", en: "Academic Tracks", fr: "Parcours", ru: "Учебные Пути" }],
    ["#navbar nav", "nav-testimonials", { ar: "الآراء", en: "Testimonials", fr: "Avis", ru: "Отзывы" }],
    ["#navbar nav", "nav-faq", { ar: "الأسئلة الشائعة", en: "FAQ", fr: "FAQ", ru: "ЧаВо" }],
    ["#navbar", "nav-enroll", { ar: "طلب الالتحاق", en: "Enroll Now", fr: "S'inscrire", ru: "Записаться" }],
    ["#mobile-menu", "mobile-nav-about", { ar: "عن الأكاديمية", en: "About Us", fr: "À Propos", ru: "О Нас" }],
    ["#mobile-menu", "mobile-nav-tracks", { ar: "المسارات الأكاديمية", en: "Academic Tracks", fr: "Parcours Académiques", ru: "Учебные Пути" }],
    ["#mobile-menu", "mobile-nav-testimonials", { ar: "الآراء", en: "Testimonials", fr: "Avis", ru: "Отзывы" }],
    ["#mobile-menu", "mobile-nav-faq", { ar: "الأسئلة الشائعة", en: "FAQ", fr: "FAQ", ru: "ЧаВо" }],
    ["#mobile-menu", "mobile-language-settings", { ar: "إعدادات اللغة", en: "Language Settings", fr: "Paramètres de Langue", ru: "Настройки языка" }],
    ["#mobile-menu", "mobile-enroll", { ar: "طلب الالتحاق", en: "Enroll Now", fr: "S'inscrire", ru: "Записаться" }],
    ["#home", "hero-badge", { ar: "نور يهدي، وعلم يبني", en: "A Guiding Light, Building Knowledge", fr: "Une Lumière qui Guide, un Savoir qui Bâtit", ru: "Свет, который направляет, и знание, которое строит" }],
    ["#home", "hero-title-line-1", { ar: "صرح علمي يجمع بين", en: "A Scientific Edifice Combining", fr: "Un Édifice Scientifique Alliant", ru: "Научное учреждение, объединяющее" }],
    ["#home", "hero-title-line-2", { ar: "أصالة التراث", en: "Heritage Authenticity", fr: "Authenticité du Patrimoine", ru: "Подлинность наследия" }],
    ["#home", "hero-title-line-3", { ar: "وحداثة التعليم", en: "and Modern Education", fr: "et Éducation Moderne", ru: "и современное образование" }],
    ["#home", "hero-description", {
      ar: "نقدم تعليمًا إسلاميًا ولغويًا متكاملًا، يقوم عليه نخبة من المعلمين المختصين، وهم مجازون بإجازات معتبرة في القراءات، لنرسخ في النفوس لغة القرآن وعلومه بمنهجية رصينة ومباشرة.",
      en: "We provide comprehensive Islamic and linguistic education, supervised by elite specialized and certified teachers holding recognized Ijazahs in Quranic readings, instilling the language of the Quran and its sciences through a rigorous and direct methodology.",
      fr: "Nous offrons un enseignement islamique et linguistique complet, supervisé par une élite d'enseignants spécialisés et certifiés détenant des Ijazahs reconnues dans les lectures coraniques, inculquant la langue du Coran et ses sciences par une méthodologie rigoureuse et directe.",
      ru: "Мы предоставляем комплексное исламское и лингвистическое образование под руководством элитных специализированных преподавателей, имеющих признанные Иджазы в чтениях Корана, прививая язык Корана и его науки с помощью строгой и прямой методологии."
    }],
    ["#home", "hero-primary-button", { ar: "تصفح الدليل الأكاديمي", en: "Explore Academic Guide", fr: "Explorer le Guide Académique", ru: "Изучить Академическое руководство" }],
    ["#about h2", "about-title", { ar: "هيئة التدريس والمنهجية", en: "Faculty & Methodology", fr: "Corps Professoral & Méthodologie", ru: "Факультет и методология" }],
    ["#tracks .text-center", "tracks-eyebrow", { ar: "الدليل الأكاديمي الشامل", en: "Comprehensive Academic Guide", fr: "Guide Académique Complet", ru: "Комплексное академическое руководство" }],
    ["#tracks .text-center", "tracks-title", { ar: "المسارات الأكاديمية", en: "Academic Tracks", fr: "Parcours Académiques", ru: "Учебные Пути" }]
  ];

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function slug(value) {
    return String(value || "global")
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 46) || "global";
  }

  function getLang(element) {
    for (const lang of LANGS) {
      if (element.classList && element.classList.contains("lang-" + lang)) return lang;
    }

    const langParent = element.closest ? element.closest(LANG_SELECTOR) : null;
    if (langParent && langParent !== element) return getLang(langParent);

    const id = element.getAttribute && element.getAttribute("data-content-id") || "";
    const match = String(id).match(/(?:^|-)(ar|en|fr|ru)(?:-|$)/i);
    return match ? match[1].toLowerCase() : "general";
  }

  function nearestSectionId(element) {
    const section = element.closest("section[id], header[id], footer[id], nav[id], main[id], div[id]");
    if (section && section.id) return slug(section.id);

    const tag = element.closest("section, header, footer, nav, main");
    return tag && tag.tagName ? slug(tag.tagName.toLowerCase()) : "global";
  }

  function isForbidden(element) {
    return !element || SKIP_TAGS.has(element.tagName) || Boolean(element.closest && element.closest(NEVER_EDIT));
  }

  function hasNestedLang(element) {
    return Array.from(element.children || []).some((child) => child.matches && child.matches(LANG_SELECTOR));
  }

  function hasStructuralChildren(element) {
    return Array.from(element.children || []).some((child) => !SKIP_TAGS.has(child.tagName));
  }

  function isSafeTextElement(element) {
    if (isForbidden(element)) return false;
    if (element.querySelector("br")) return false;
    if (hasNestedLang(element)) return false;
    if (hasStructuralChildren(element)) return false;

    const text = cleanText(element.textContent);
    return text.length >= 2 && text.length <= 900;
  }

  function shouldCollect(element) {
    if (element.getAttribute("data-content-id")) return isSafeTextElement(element);
    if (!element.matches || !element.matches(LANG_SELECTOR)) return false;
    if (element.closest("a, button, summary, label")) return false;
    return isSafeTextElement(element);
  }

  function stableIdFor(parent, text) {
    const lang = getLang(parent);
    if (!LANGS.includes(lang)) return "";

    for (const [scope, key, values] of STABLE_RULES) {
      if (values[lang] === text && parent.closest && parent.closest(scope)) {
        return key + "-" + lang;
      }
    }

    return "";
  }

  function wrapTextNode(textNode, id) {
    const doc = textNode.ownerDocument || document;
    const span = doc.createElement("span");
    span.setAttribute("data-content-id", id);
    span.setAttribute("data-stable-content-id", "true");
    span.textContent = textNode.nodeValue;
    textNode.parentNode.replaceChild(span, textNode);
  }

  function installSplashTuning() {
    if (document.getElementById("basair-splash-runtime-tuning")) return;

    const style = document.createElement("style");
    style.id = "basair-splash-runtime-tuning";
    style.textContent = `
#splash-screen.basair-splash {
  display: grid !important;
  pointer-events: auto;
  animation: basair-splash-runtime-release 0.95s ease 4.8s forwards !important;
}
#splash-screen.basair-splash.splash-hidden {
  opacity: 1 !important;
  visibility: visible !important;
  filter: none !important;
}
.basair-splash__logo {
  width: clamp(230px, 26vw, 380px) !important;
  filter: drop-shadow(0 20px 40px rgba(10, 31, 68, 0.12)) !important;
}
.basair-splash__content { gap: 1.45rem !important; }
.basair-splash__loader { width: 168px !important; }
@keyframes basair-splash-runtime-release {
  0%, 72% { opacity: 1; visibility: visible; filter: none; pointer-events: auto; }
  100% { opacity: 0; visibility: hidden; filter: blur(6px); pointer-events: none; }
}
@media (max-width: 640px) {
  .basair-splash__logo { width: clamp(200px, 64vw, 300px) !important; }
  .basair-splash__loader { width: 148px !important; }
}`;
    document.head.appendChild(style);
  }

  function stabilizeTextNodes(root) {
    const doc = root.nodeType === 9 ? root : root.ownerDocument || document;
    const start = root.body || root;
    if (!start || !doc.createTreeWalker) return;

    const walker = doc.createTreeWalker(start, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        const text = cleanText(node.nodeValue);
        const parent = node.parentElement;
        if (!text || !parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-content-id]")) return NodeFilter.FILTER_REJECT;
        if (isForbidden(parent)) return NodeFilter.FILTER_REJECT;
        if (!parent.closest(LANG_SELECTOR)) return NodeFilter.FILTER_REJECT;
        return stableIdFor(parent, text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes = [];
    let node = walker.nextNode();
    while (node) {
      nodes.push(node);
      node = walker.nextNode();
    }

    nodes.forEach(function (textNode) {
      const id = stableIdFor(textNode.parentElement, cleanText(textNode.nodeValue));
      if (id) wrapTextNode(textNode, id);
    });
  }

  function collect(root) {
    installSplashTuning();
    stabilizeTextNodes(root || document);

    const counters = Object.create(null);
    const output = [];
    const elements = Array.from((root || document).querySelectorAll(EDITABLE_SELECTOR));
    const seen = new Set();

    elements.forEach(function (element) {
      if (seen.has(element)) return;
      seen.add(element);
      if (!shouldCollect(element)) return;

      const explicitId = element.getAttribute("data-content-id");
      const lang = getLang(element);
      const section = nearestSectionId(element);
      const tag = slug(element.tagName.toLowerCase());
      const key = section + "-" + lang + "-" + tag;

      counters[key] = (counters[key] || 0) + 1;

      const id = explicitId || key + "-" + String(counters[key]).padStart(2, "0");
      const text = cleanText(element.textContent);

      element.setAttribute("data-content-id", id);
      if (!explicitId) element.setAttribute("data-auto-content-id", "true");

      output.push({
        id: id,
        text: text,
        lang: lang,
        section: section,
        tag: tag,
        index: counters[key],
        explicit: Boolean(explicitId)
      });
    });

    return output;
  }

  function assign(root) {
    return collect(root || document);
  }

  function extractFromHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html || ""), "text/html");
    return collect(doc);
  }

  window.BasairTextMap = {
    assign: assign,
    extractFromHtml: extractFromHtml,
    cleanText: cleanText
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      assign(document);
    }, { once: true });
  } else {
    assign(document);
  }
})();
