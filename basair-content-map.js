// Basair editable text map
// Responsibility:
// - Discover editable text elements.
// - Add stable data-content-id keys for important visible website text.
// - Prefer explicit stable data-content-id values already written in HTML.
// - Auto-generate fallback IDs only for simple plain multilingual text.
// - Do not create UI.
// - Do not inject CSS.
// - Do not control splash/loading screens.

(function () {
  "use strict";

  const LANGS = ["ar", "en", "fr", "ru"];

  const LANGUAGE_SELECTOR = LANGS.map(function (lang) {
    return ".lang-" + lang;
  }).join(",");

  const EDITABLE_SELECTOR = "[data-content-id]," + LANGUAGE_SELECTOR;

  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "IMG",
    "SVG",
    "PATH",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "OPTION"
  ]);

  const NEVER_EDIT_CONTAINERS = [
    "#admin-modal",
    "#splash-screen"
  ].join(",");

  const STABLE_TEXT_RULES = [
    {
      scope: "#navbar",
      key: "navbar-brand",
      text: {
        ar: "أكاديمية بصائر",
        en: "Basair Academy",
        fr: "Académie Bassaïr",
        ru: "Академия Басаир"
      }
    },
    {
      scope: "#navbar nav",
      key: "nav-about",
      text: {
        ar: "عن الأكاديمية",
        en: "About Us",
        fr: "À Propos",
        ru: "О Нас"
      }
    },
    {
      scope: "#navbar nav",
      key: "nav-tracks",
      text: {
        ar: "المسارات الأكاديمية",
        en: "Academic Tracks",
        fr: "Parcours",
        ru: "Учебные Пути"
      }
    },
    {
      scope: "#navbar nav",
      key: "nav-testimonials",
      text: {
        ar: "الآراء",
        en: "Testimonials",
        fr: "Avis",
        ru: "Отзывы"
      }
    },
    {
      scope: "#navbar nav",
      key: "nav-faq",
      text: {
        ar: "الأسئلة الشائعة",
        en: "FAQ",
        fr: "FAQ",
        ru: "ЧаВо"
      }
    },
    {
      scope: "#navbar",
      key: "nav-enroll",
      text: {
        ar: "طلب الالتحاق",
        en: "Enroll Now",
        fr: "S'inscrire",
        ru: "Записаться"
      }
    },
    {
      scope: "#mobile-menu",
      key: "mobile-nav-about",
      text: {
        ar: "عن الأكاديمية",
        en: "About Us",
        fr: "À Propos",
        ru: "О Нас"
      }
    },
    {
      scope: "#mobile-menu",
      key: "mobile-nav-tracks",
      text: {
        ar: "المسارات الأكاديمية",
        en: "Academic Tracks",
        fr: "Parcours Académiques",
        ru: "Учебные Пути"
      }
    },
    {
      scope: "#mobile-menu",
      key: "mobile-nav-testimonials",
      text: {
        ar: "الآراء",
        en: "Testimonials",
        fr: "Avis",
        ru: "Отзывы"
      }
    },
    {
      scope: "#mobile-menu",
      key: "mobile-nav-faq",
      text: {
        ar: "الأسئلة الشائعة",
        en: "FAQ",
        fr: "FAQ",
        ru: "ЧаВо"
      }
    },
    {
      scope: "#mobile-menu",
      key: "mobile-language-settings",
      text: {
        ar: "إعدادات اللغة",
        en: "Language Settings",
        fr: "Paramètres de Langue",
        ru: "Настройки языка"
      }
    },
    {
      scope: "#mobile-menu",
      key: "mobile-enroll",
      text: {
        ar: "طلب الالتحاق",
        en: "Enroll Now",
        fr: "S'inscrire",
        ru: "Записаться"
      }
    },
    {
      scope: "#home",
      key: "hero-badge",
      text: {
        ar: "نور يهدي، وعلم يبني",
        en: "A Guiding Light, Building Knowledge",
        fr: "Une Lumière qui Guide, un Savoir qui Bâtit",
        ru: "Свет, который направляет, и знание, которое строит"
      }
    },
    {
      scope: "#home",
      key: "hero-title-line-1",
      text: {
        ar: "صرح علمي يجمع بين",
        en: "A Scientific Edifice Combining",
        fr: "Un Édifice Scientifique Alliant",
        ru: "Научное учреждение, объединяющее"
      }
    },
    {
      scope: "#home",
      key: "hero-title-line-2",
      text: {
        ar: "أصالة التراث",
        en: "Heritage Authenticity",
        fr: "Authenticité du Patrimoine",
        ru: "Подлинность наследия"
      }
    },
    {
      scope: "#home",
      key: "hero-title-line-3",
      text: {
        ar: "وحداثة التعليم",
        en: "and Modern Education",
        fr: "et Éducation Moderne",
        ru: "и современное образование"
      }
    },
    {
      scope: "#home",
      key: "hero-description",
      text: {
        ar: "نقدم تعليمًا إسلاميًا ولغويًا متكاملًا، يقوم عليه نخبة من المعلمين المختصين، وهم مجازون بإجازات معتبرة في القراءات، لنرسخ في النفوس لغة القرآن وعلومه بمنهجية رصينة ومباشرة.",
        en: "We provide comprehensive Islamic and linguistic education, supervised by elite specialized and certified teachers holding recognized Ijazahs in Quranic readings, instilling the language of the Quran and its sciences through a rigorous and direct methodology.",
        fr: "Nous offrons un enseignement islamique et linguistique complet, supervisé par une élite d'enseignants spécialisés et certifiés détenant des Ijazahs reconnues dans les lectures coraniques, inculquant la langue du Coran et ses sciences par une méthodologie rigoureuse et directe.",
        ru: "Мы предоставляем комплексное исламское и лингвистическое образование под руководством элитных специализированных преподавателей, имеющих признанные Иджазы в чтениях Корана, прививая язык Корана и его науки с помощью строгой и прямой методологии."
      }
    },
    {
      scope: "#home",
      key: "hero-primary-button",
      text: {
        ar: "تصفح الدليل الأكاديمي",
        en: "Explore Academic Guide",
        fr: "Explorer le Guide Académique",
        ru: "Изучить Академическое руководство"
      }
    },
    {
      scope: "#about h2",
      key: "about-title",
      text: {
        ar: "هيئة التدريس والمنهجية",
        en: "Faculty & Methodology",
        fr: "Corps Professoral & Méthodologie",
        ru: "Факультет и методология"
      }
    },
    {
      scope: "#tracks .text-center",
      key: "tracks-eyebrow",
      text: {
        ar: "الدليل الأكاديمي الشامل",
        en: "Comprehensive Academic Guide",
        fr: "Guide Académique Complet",
        ru: "Комплексное академическое руководство"
      }
    },
    {
      scope: "#tracks .text-center",
      key: "tracks-title",
      text: {
        ar: "المسارات الأكاديمية",
        en: "Academic Tracks",
        fr: "Parcours Académiques",
        ru: "Учебные Пути"
      }
    }
  ];

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function slug(value) {
    const raw = String(value || "global").toLowerCase();

    return raw
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 46) || "global";
  }

  function getLang(element) {
    for (const lang of LANGS) {
      if (element.classList && element.classList.contains("lang-" + lang)) {
        return lang;
      }
    }

    const langElement = element.closest ? element.closest(LANGUAGE_SELECTOR) : null;

    if (langElement) {
      return getLang(langElement);
    }

    const id = element.getAttribute && element.getAttribute("data-content-id") || "";
    const match = String(id).match(/(?:^|-)(ar|en|fr|ru)(?:-|$)/i);

    return match ? match[1].toLowerCase() : "general";
  }

  function nearestSectionId(element) {
    const section = element.closest("section[id], header[id], footer[id], nav[id], main[id], div[id]");

    if (section && section.id) {
      return slug(section.id);
    }

    const sectionTag = element.closest("section, header, footer, nav, main");

    if (sectionTag && sectionTag.tagName) {
      return slug(sectionTag.tagName.toLowerCase());
    }

    return "global";
  }

  function hasNestedLanguageElement(element) {
    return Array.from(element.children || []).some(function (child) {
      return child.matches && child.matches(LANGUAGE_SELECTOR);
    });
  }

  function hasStructuralChildren(element) {
    return Array.from(element.children || []).some(function (child) {
      return !SKIP_TAGS.has(child.tagName);
    });
  }

  function isExplicitEditable(element) {
    return Boolean(element && element.getAttribute("data-content-id"));
  }

  function isForbiddenElement(element) {
    return !element ||
      SKIP_TAGS.has(element.tagName) ||
      Boolean(element.closest(NEVER_EDIT_CONTAINERS));
  }

  function isSafeTextElement(element) {
    if (isForbiddenElement(element)) {
      return false;
    }

    if (element.querySelector("br")) {
      return false;
    }

    if (hasNestedLanguageElement(element)) {
      return false;
    }

    if (hasStructuralChildren(element)) {
      return false;
    }

    const text = cleanText(element.textContent);

    return text.length >= 2 && text.length <= 900;
  }

  function shouldCollect(element) {
    if (isExplicitEditable(element)) {
      return isSafeTextElement(element);
    }

    if (!element.matches || !element.matches(LANGUAGE_SELECTOR)) {
      return false;
    }

    if (element.closest("a, button, summary, label")) {
      return false;
    }

    return isSafeTextElement(element);
  }

  function getStableId(parent, text) {
    const lang = getLang(parent);

    if (!LANGS.includes(lang)) {
      return "";
    }

    for (const rule of STABLE_TEXT_RULES) {
      if (!rule.text || rule.text[lang] !== text) {
        continue;
      }

      if (parent.closest && parent.closest(rule.scope)) {
        return rule.key + "-" + lang;
      }
    }

    return "";
  }

  function wrapTextNode(textNode, id) {
    if (!textNode || !textNode.parentNode || !id) {
      return;
    }

    const doc = textNode.ownerDocument || document;
    const span = doc.createElement("span");
    span.setAttribute("data-content-id", id);
    span.setAttribute("data-stable-content-id", "true");
    span.textContent = textNode.nodeValue;
    textNode.parentNode.replaceChild(span, textNode);
  }

  function stabilizeTextNodes(root) {
    const doc = root.nodeType === 9 ? root : root.ownerDocument || document;
    const start = root.body || root;

    if (!start || !doc.createTreeWalker) {
      return;
    }

    const walker = doc.createTreeWalker(start, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        const text = cleanText(node.nodeValue);
        const parent = node.parentElement;

        if (!text || !parent) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest("[data-content-id]")) {
          return NodeFilter.FILTER_REJECT;
        }

        if (isForbiddenElement(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!parent.closest(LANGUAGE_SELECTOR)) {
          return NodeFilter.FILTER_REJECT;
        }

        return getStableId(parent, text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes = [];
    let node = walker.nextNode();

    while (node) {
      nodes.push(node);
      node = walker.nextNode();
    }

    nodes.forEach(function (textNode) {
      const parent = textNode.parentElement;
      const id = getStableId(parent, cleanText(textNode.nodeValue));
      wrapTextNode(textNode, id);
    });
  }

  function collect(root) {
    stabilizeTextNodes(root || document);

    const counters = Object.create(null);
    const output = [];
    const elements = Array.from((root || document).querySelectorAll(EDITABLE_SELECTOR));
    const seen = new Set();

    elements.forEach(function (element) {
      if (seen.has(element)) {
        return;
      }

      seen.add(element);

      if (!shouldCollect(element)) {
        return;
      }

      const explicitId = element.getAttribute("data-content-id");
      const lang = getLang(element);
      const section = nearestSectionId(element);
      const tag = slug(element.tagName.toLowerCase());
      const key = section + "-" + lang + "-" + tag;

      counters[key] = (counters[key] || 0) + 1;

      const id = explicitId ||
        key + "-" + String(counters[key]).padStart(2, "0");

      const text = cleanText(element.textContent);

      element.setAttribute("data-content-id", id);

      if (!explicitId) {
        element.setAttribute("data-auto-content-id", "true");
      }

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
