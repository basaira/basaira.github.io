// Basair Academy — deterministic editable-content registry.
// Only explicit data-content-id nodes are editable. The public renderer always
// writes through textContent, never innerHTML, so Firestore content cannot inject HTML/JS.
(function () {
  "use strict";

  function cleanText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function normalizeId(value) {
    return String(value || "").trim().slice(0, 120);
  }

  function normalizeMeta(value, fallback) {
    var text = String(value || "").trim();
    return text || fallback || "";
  }

  function collect(root) {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    var seen = Object.create(null);
    var items = [];

    root.querySelectorAll("[data-content-id]").forEach(function (element) {
      var id = normalizeId(element.getAttribute("data-content-id"));
      if (!id || seen[id]) return;
      seen[id] = true;
      items.push({
        id: id,
        text: cleanText(element.textContent || ""),
        lang: normalizeMeta(element.getAttribute("data-content-lang"), ""),
        section: normalizeMeta(element.getAttribute("data-content-section"), "global")
      });
    });

    return items;
  }

  function assign(root) {
    return collect(root || document);
  }

  function extractFromHtml(html) {
    if (typeof DOMParser === "undefined") return [];
    var parser = new DOMParser();
    var doc = parser.parseFromString(String(html || ""), "text/html");
    return collect(doc);
  }

  window.BasairTextMap = Object.freeze({
    cleanText: cleanText,
    assign: assign,
    extractFromHtml: extractFromHtml
  });
})();
