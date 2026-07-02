(function () {
  "use strict";

  const LANGS = ["ar", "en", "fr", "ru"];

  const LANGUAGE_SELECTOR = LANGS.map(function (lang) {
    return ".lang-" + lang;
  }).join(",");

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

  const NON_EDITABLE_CONTAINERS = [
    "#admin-modal",
    "#splash-screen",
    "a",
    "button",
    "summary",
    "label"
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

    return "general";
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

  function isEditableCandidate(element) {
    if (!element || SKIP_TAGS.has(element.tagName)) {
      return false;
    }

    if (element.closest(NON_EDITABLE_CONTAINERS)) {
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

  function collect(root) {
    const counters = Object.create(null);
    const output = [];
    const elements = Array.from(root.querySelectorAll(LANGUAGE_SELECTOR));

    elements.forEach(function (element) {
      if (!isEditableCandidate(element)) {
        return;
      }

      const lang = getLang(element);
      const section = nearestSectionId(element);
      const tag = slug(element.tagName.toLowerCase());
      const key = section + "-" + lang + "-" + tag;

      counters[key] = (counters[key] || 0) + 1;

      const id = element.getAttribute("data-content-id") ||
        key + "-" + String(counters[key]).padStart(2, "0");

      const text = cleanText(element.textContent);

      element.setAttribute("data-content-id", id);
      element.setAttribute("data-auto-content-id", "true");

      output.push({
        id: id,
        text: text,
        lang: lang,
        section: section,
        tag: tag,
        index: counters[key]
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
