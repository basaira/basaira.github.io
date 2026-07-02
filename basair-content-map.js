// Basair editable text map
// Responsibility:
// - Discover editable text elements.
// - Prefer explicit stable data-content-id values.
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

    const id = element.getAttribute("data-content-id") || "";
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

  function isSafeTextElement(element) {
    if (!element || SKIP_TAGS.has(element.tagName)) {
      return false;
    }

    if (element.closest(NEVER_EDIT_CONTAINERS)) {
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

  function collect(root) {
    const counters = Object.create(null);
    const output = [];
    const elements = Array.from(root.querySelectorAll(EDITABLE_SELECTOR));
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
