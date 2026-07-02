// Basair automatic editable-text map + premium splash enhancement
// This file gives stable dynamic text IDs to visible multilingual texts.

(function () {
  "use strict";

  const LANGS = ["ar", "en", "fr", "ru"];

  const SELECTOR = LANGS.map(function (lang) {
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

    function isEditableCandidate(element) {
    if (!element || SKIP_TAGS.has(element.tagName)) {
      return false;
    }

    if (element.closest("#admin-modal")) {
      return false;
    }

    if (element.closest("#splash-screen")) {
      return false;
    }

    if (element.closest("a, button, summary, label")) {
      return false;
    }

    const text = cleanText(element.textContent);

    if (!text || text.length < 2 || text.length > 900) {
      return false;
    }

    const hasChildLanguageElement = Array.from(element.children || []).some(function (child) {
      return child.matches && child.matches(SELECTOR);
    });

    if (hasChildLanguageElement) {
      return false;
    }

    const hasStructuralChildren = Array.from(element.children || []).some(function (child) {
      return !SKIP_TAGS.has(child.tagName);
    });

    if (hasStructuralChildren) {
      return false;
    }

    if (element.querySelector("br")) {
      return false;
    }

    return true;
  }
  function collect(root) {
    const counters = Object.create(null);
    const output = [];
    const elements = Array.from(root.querySelectorAll(SELECTOR));

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

  
  function injectPremiumSplashStyles() {
  if (document.getElementById("basair-premium-splash-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "basair-premium-splash-style";

  style.textContent = `
    #splash-screen.basair-premium-splash {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      overflow: hidden;
      isolation: isolate;
      background:
        radial-gradient(circle at 50% 34%, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0) 42%),
        linear-gradient(180deg, #08152f 0%, #0b1d3d 45%, #071126 100%);
      transition:
        opacity 1s cubic-bezier(.16, 1, .3, 1),
        visibility 1s cubic-bezier(.16, 1, .3, 1),
        transform 1s cubic-bezier(.16, 1, .3, 1),
        filter 1s cubic-bezier(.16, 1, .3, 1);
    }

    #splash-screen.basair-premium-splash::before,
    #splash-screen.basair-premium-splash::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
      z-index: -2;
      filter: blur(20px);
      opacity: .9;
    }

    #splash-screen.basair-premium-splash::before {
      width: 34rem;
      height: 34rem;
      top: -10rem;
      right: -8rem;
      background: radial-gradient(circle, rgba(212,175,55,.18), rgba(212,175,55,0) 70%);
      animation: basair-splash-orb-1 8s ease-in-out infinite alternate;
    }

    #splash-screen.basair-premium-splash::after {
      width: 28rem;
      height: 28rem;
      left: -8rem;
      bottom: -10rem;
      background: radial-gradient(circle, rgba(255,255,255,.08), rgba(255,255,255,0) 72%);
      animation: basair-splash-orb-2 9s ease-in-out infinite alternate;
    }

    .basair-splash-noise {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: .06;
      background-image:
        radial-gradient(rgba(255,255,255,.95) 0.8px, transparent 0.8px);
      background-size: 18px 18px;
      mask-image: linear-gradient(to bottom, rgba(0,0,0,.75), rgba(0,0,0,.18));
      -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,.75), rgba(0,0,0,.18));
    }

    .basair-splash-shell {
      width: min(92vw, 560px);
      min-height: min(90vh, 680px);
      display: grid;
      place-items: center;
      text-align: center;
      position: relative;
      padding: 2rem 1.25rem;
    }

    .basair-splash-stage {
      position: relative;
      width: min(90vw, 420px);
      aspect-ratio: 1 / 1;
      display: grid;
      place-items: center;
    }

    .basair-splash-ring,
    .basair-splash-ring::before,
    .basair-splash-ring::after {
      position: absolute;
      inset: 50%;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      pointer-events: none;
    }

    .basair-splash-ring {
      width: 100%;
      height: 100%;
      border: 1px solid rgba(255,255,255,.08);
      box-shadow:
        0 0 0 1px rgba(212,175,55,.06) inset,
        0 0 80px rgba(212,175,55,.07);
      animation: basair-ring-rotate 14s linear infinite;
    }

    .basair-splash-ring::before {
      content: "";
      width: 82%;
      height: 82%;
      border: 1px solid rgba(212,175,55,.22);
      opacity: .85;
      animation: basair-ring-float 5s ease-in-out infinite;
    }

    .basair-splash-ring::after {
      content: "";
      width: 62%;
      height: 62%;
      border: 1px solid rgba(255,255,255,.12);
      animation: basair-ring-float 4.2s ease-in-out infinite reverse;
    }

    .basair-splash-card {
      position: relative;
      z-index: 2;
      width: min(100%, 320px);
      padding: 2rem 1.2rem 1.5rem;
      border-radius: 32px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04));
      border: 1px solid rgba(255,255,255,.10);
      box-shadow:
        0 30px 80px rgba(0,0,0,.34),
        inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      animation: basair-card-reveal 1.15s cubic-bezier(.16, 1, .3, 1) both;
    }

    .basair-splash-logo-wrap {
      width: clamp(112px, 24vw, 152px);
      height: clamp(112px, 24vw, 152px);
      margin: 0 auto;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background:
        radial-gradient(circle at 50% 42%, rgba(255,255,255,.13), rgba(255,255,255,.05) 58%, rgba(255,255,255,.02) 100%);
      border: 1px solid rgba(212,175,55,.24);
      box-shadow:
        0 0 0 10px rgba(255,255,255,.025),
        0 20px 60px rgba(0,0,0,.28),
        0 0 35px rgba(212,175,55,.12);
      position: relative;
      animation: basair-logo-float 4.2s ease-in-out infinite;
    }

    .basair-splash-logo-wrap::before {
      content: "";
      position: absolute;
      inset: -10px;
      border-radius: inherit;
      border: 1px solid rgba(255,255,255,.08);
      opacity: .85;
      animation: basair-halo-pulse 3.4s ease-in-out infinite;
    }

    .basair-splash-logo-wrap::after {
      content: "";
      position: absolute;
      inset: -22px;
      border-radius: inherit;
      border: 1px solid rgba(212,175,55,.10);
      opacity: .55;
      animation: basair-halo-pulse 3.4s ease-in-out infinite 1s;
    }

    .basair-splash-logo {
      width: 62%;
      height: 62%;
      object-fit: contain;
      display: block;
      filter:
        drop-shadow(0 10px 24px rgba(0,0,0,.25))
        drop-shadow(0 0 18px rgba(212,175,55,.10));
    }

    .basair-splash-wordmark {
      margin-top: 1.1rem;
      color: #F6F1E6;
      font-size: clamp(1rem, 2.5vw, 1.12rem);
      font-weight: 800;
      letter-spacing: .34em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .basair-splash-divider {
      width: 86px;
      height: 1px;
      margin: .95rem auto 0;
      background: linear-gradient(90deg, rgba(212,175,55,0), rgba(212,175,55,.9), rgba(212,175,55,0));
      opacity: .95;
    }

    .basair-splash-dots {
      display: inline-flex;
      gap: 8px;
      margin-top: 1rem;
      align-items: center;
      justify-content: center;
    }

    .basair-splash-dots span {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: rgba(255,255,255,.34);
      box-shadow: 0 0 0 1px rgba(255,255,255,.04);
      animation: basair-dot-wave 1.5s infinite ease-in-out;
    }

    .basair-splash-dots span:nth-child(2) {
      animation-delay: .16s;
    }

    .basair-splash-dots span:nth-child(3) {
      animation-delay: .32s;
    }

    #splash-screen.basair-premium-splash.splash-hidden {
      opacity: 0;
      visibility: hidden;
      transform: scale(1.03);
      filter: blur(10px);
    }

    @keyframes basair-card-reveal {
      from {
        opacity: 0;
        transform: translateY(24px) scale(.96);
        filter: blur(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
    }

    @keyframes basair-logo-float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    @keyframes basair-halo-pulse {
      0%, 100% {
        transform: scale(.985);
        opacity: .42;
      }
      50% {
        transform: scale(1.03);
        opacity: .95;
      }
    }

    @keyframes basair-ring-rotate {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }

    @keyframes basair-ring-float {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        transform: translate(-50%, -50%) scale(1.025);
      }
    }

    @keyframes basair-dot-wave {
      0%, 80%, 100% {
        transform: translateY(0) scale(.9);
        background: rgba(255,255,255,.28);
      }
      40% {
        transform: translateY(-4px) scale(1.15);
        background: #D4AF37;
      }
    }

    @keyframes basair-splash-orb-1 {
      from {
        transform: translate3d(0, 0, 0) scale(1);
      }
      to {
        transform: translate3d(16px, 20px, 0) scale(1.08);
      }
    }

    @keyframes basair-splash-orb-2 {
      from {
        transform: translate3d(0, 0, 0) scale(1);
      }
      to {
        transform: translate3d(-18px, -12px, 0) scale(1.1);
      }
    }

    @media (max-width: 640px) {
      .basair-splash-shell {
        min-height: 100vh;
        padding: 1.25rem;
      }

      .basair-splash-stage {
        width: min(90vw, 320px);
      }

      .basair-splash-card {
        width: min(100%, 270px);
        padding: 1.6rem 1rem 1.25rem;
        border-radius: 26px;
      }

      .basair-splash-wordmark {
        letter-spacing: .26em;
        font-size: .92rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #splash-screen.basair-premium-splash *,
      #splash-screen.basair-premium-splash::before,
      #splash-screen.basair-premium-splash::after {
        animation: none !important;
        transition-duration: .01ms !important;
      }
    }
  `;

  document.head.appendChild(style);
}

  function enhanceSplashScreen() {
    const splash = document.getElementById("splash-screen");

    if (!splash || splash.dataset.basairPremiumSplash === "true") {
      return;
    }

    injectPremiumSplashStyles();

    splash.dataset.basairPremiumSplash = "true";
    splash.classList.add("basair-premium-splash");
    splash.setAttribute("aria-live", "polite");
    splash.setAttribute("aria-label", "Loading Basair Academy");

    splash.innerHTML = `
      <div class="basair-splash-noise" aria-hidden="true"></div>

      <div class="basair-splash-shell">
        <div class="basair-splash-stage">
          <div class="basair-splash-ring" aria-hidden="true"></div>

          <div class="basair-splash-card">
            <div class="basair-splash-logo-wrap">
              <img
                src="./logo.png"
                alt="Basair Academy"
                class="basair-splash-logo"
              >
            </div>

            <div class="basair-splash-wordmark">BASAIR ACADEMY</div>
            <div class="basair-splash-divider" aria-hidden="true"></div>

            <div class="basair-splash-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  window.BasairTextMap = {
    assign: assign,
    extractFromHtml: extractFromHtml,
    cleanText: cleanText,
    enhanceSplashScreen: enhanceSplashScreen
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      enhanceSplashScreen();
      assign(document);
    }, { once: true });
  } else {
    enhanceSplashScreen();
    assign(document);
  }
})();
