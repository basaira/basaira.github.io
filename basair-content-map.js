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

    const text = cleanText(element.textContent);

    if (!text || text.length < 2 || text.length > 900) {
      return false;
    }

    const childLang = Array.from(element.children || []).some(function (child) {
      return child.matches && child.matches(SELECTOR);
    });

    if (childLang) {
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
  if (document.getElementById("basair-premium-splash-style")) return;

  const style = document.createElement("style");
  style.id = "basair-premium-splash-style";

  style.textContent = 
    #splash-screen.basair-premium-splash {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      isolation: isolate;
      background:
        radial-gradient(circle at 50% 18%, rgba(255,255,255,.92) 0%, rgba(248,244,230,.92) 22%, rgba(232,221,190,.70) 40%, rgba(10,31,68,.18) 100%),
        linear-gradient(180deg, #07162F 0%, #0A1F44 58%, #07162F 100%);
      transition:
        opacity .9s cubic-bezier(.16, 1, .3, 1),
        visibility .9s cubic-bezier(.16, 1, .3, 1),
        transform .9s cubic-bezier(.16, 1, .3, 1),
        filter .9s cubic-bezier(.16, 1, .3, 1);
    }

    #splash-screen.basair-premium-splash::before,
    #splash-screen.basair-premium-splash::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
      z-index: -2;
    }

    #splash-screen.basair-premium-splash::before {
      width: 42rem;
      height: 42rem;
      top: -14rem;
      right: -10rem;
      background: radial-gradient(circle, rgba(212,175,55,.22), rgba(212,175,55,0) 70%);
      filter: blur(4px);
      animation: basair-orb-float 7s ease-in-out infinite alternate;
    }

    #splash-screen.basair-premium-splash::after {
      width: 34rem;
      height: 34rem;
      bottom: -12rem;
      left: -10rem;
      background: radial-gradient(circle, rgba(255,255,255,.09), rgba(255,255,255,0) 72%);
      filter: blur(8px);
      animation: basair-orb-float 8.5s ease-in-out infinite alternate-reverse;
    }

    .basair-splash-shell {
      position: relative;
      width: min(92vw, 540px);
      padding: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .basair-splash-rings {
      position: absolute;
      inset: 50% auto auto 50%;
      width: min(78vw, 420px);
      aspect-ratio: 1;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 1px solid rgba(212,175,55,.14);
      box-shadow:
        0 0 0 20px rgba(212,175,55,.04),
        0 0 0 60px rgba(255,255,255,.025);
      opacity: .9;
      animation: basair-ring-rotate 16s linear infinite;
    }

    .basair-splash-rings::before,
    .basair-splash-rings::after {
      content: "";
      position: absolute;
      inset: 10%;
      border-radius: 50%;
      border: 1px dashed rgba(212,175,55,.18);
    }

    .basair-splash-rings::after {
      inset: 22%;
      border-style: solid;
      border-color: rgba(255,255,255,.08);
      animation: basair-ring-rotate 10s linear infinite reverse;
    }

    .basair-splash-card {
      position: relative;
      width: min(100%, 440px);
      border-radius: 32px;
      padding: 2rem 1.35rem 1.5rem;
      text-align: center;
      background:
        linear-gradient(180deg, rgba(255,255,255,.11), rgba(255,255,255,.06));
      border: 1px solid rgba(255,255,255,.12);
      box-shadow:
        0 24px 80px rgba(0,0,0,.32),
        inset 0 1px 0 rgba(255,255,255,.06);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      animation: basair-card-enter 1s cubic-bezier(.16,1,.3,1) both;
    }

    .basair-splash-logo-wrap {
      width: clamp(96px, 25vw, 148px);
      height: clamp(96px, 25vw, 148px);
      margin: 0 auto .95rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background:
        radial-gradient(circle at 35% 30%, #fffdf7 0%, #f6efd8 65%, #ead69a 100%);
      border: 1px solid rgba(212,175,55,.36);
      box-shadow:
        0 10px 30px rgba(0,0,0,.24),
        0 0 0 8px rgba(255,255,255,.03),
        inset 0 1px 6px rgba(255,255,255,.55);
      position: relative;
      overflow: hidden;
      animation: basair-logo-float 3s ease-in-out infinite;
    }

    .basair-splash-logo-wrap::before {
      content: "";
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      border: 1px solid rgba(212,175,55,.26);
      pointer-events: none;
    }

    .basair-splash-logo {
      width: 78%;
      height: 78%;
      object-fit: contain;
      display: block;
      filter: drop-shadow(0 8px 18px rgba(10,31,68,.18));
      position: relative;
      z-index: 2;
    }

    .basair-splash-logo-fallback {
      width: 78%;
      height: 78%;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: clamp(1.15rem, 3vw, 1.5rem);
      font-weight: 900;
      color: #0A1F44;
      position: relative;
      z-index: 2;
    }

    .basair-splash-kicker {
      margin: 0 0 .65rem;
      color: rgba(255,255,255,.62);
      font-size: .74rem;
      letter-spacing: .28em;
      text-transform: uppercase;
      font-weight: 800;
    }

    .basair-splash-title {
      margin: 0;
      font-size: clamp(2.1rem, 7.6vw, 4.2rem);
      line-height: .92;
      font-weight: 900;
      letter-spacing: -.04em;
      color: #ffffff;
      text-shadow: 0 8px 30px rgba(0,0,0,.18);
    }

    .basair-splash-title .gold {
      display: block;
      color: #D4AF37;
      text-shadow: 0 10px 26px rgba(212,175,55,.18);
    }

    .basair-splash-title .light {
      display: block;
      color: #F8F4E6;
    }

    .basair-splash-subtitle {
      margin: .75rem auto 0;
      max-width: 28rem;
      color: rgba(255,255,255,.72);
      font-size: clamp(.92rem, 2.8vw, 1.05rem);
      line-height: 1.8;
      font-weight: 600;
    }

    .basair-splash-progress {
      width: min(220px, 62vw);
      height: 4px;
      margin: 1.2rem auto 0;
      border-radius: 999px;
      background: rgba(255,255,255,.10);
      overflow: hidden;
      position: relative;
    }

    .basair-splash-progress::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: -35%;
      width: 35%;
      border-radius: inherit;
      background: linear-gradient(90deg, rgba(255,255,255,0), #D4AF37, #FFF7D1, rgba(255,255,255,0));
      animation: basair-progress-slide 1.5s cubic-bezier(.65,0,.35,1) infinite;
      box-shadow: 0 0 18px rgba(212,175,55,.35);
    }

    .basair-splash-loading {
      margin-top: .7rem;
      color: rgba(255,255,255,.48);
      font-size: .82rem;
      font-weight: 700;
      letter-spacing: .04em;
    }

    #splash-screen.basair-premium-splash.splash-hidden {
      opacity: 0;
      visibility: hidden;
      transform: scale(1.02);
      filter: blur(8px);
    }

    @keyframes basair-card-enter {
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
        transform: translateY(-6px);
      }
    }

    @keyframes basair-progress-slide {
      0% {
        left: -35%;
      }
      100% {
        left: 100%;
      }
    }

    @keyframes basair-orb-float {
      from {
        transform: translate3d(0, 0, 0) scale(1);
      }
      to {
        transform: translate3d(18px, 12px, 0) scale(1.08);
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

    @media (max-width: 640px) {
      .basair-splash-shell {
        width: min(94vw, 420px);
        padding: 1rem;
      }

      .basair-splash-card {
        padding: 1.6rem 1rem 1.2rem;
        border-radius: 26px;
      }

      .basair-splash-kicker {
        font-size: .66rem;
        letter-spacing: .22em;
      }

      .basair-splash-subtitle {
        font-size: .9rem;
        line-height: 1.7;
      }

      .basair-splash-rings {
        width: min(84vw, 340px);
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

  if (!splash || splash.dataset.basairPremiumSplash === "true") return;

  injectPremiumSplashStyles();

  splash.dataset.basairPremiumSplash = "true";
  splash.classList.add("basair-premium-splash");
  splash.setAttribute("aria-live", "polite");
  splash.setAttribute("aria-label", "جار تحميل أكاديمية بصائر");

  splash.innerHTML = `
    <div class="basair-splash-shell">
      <div class="basair-splash-rings" aria-hidden="true"></div>

      <div class="basair-splash-card">
        <div class="basair-splash-logo-wrap">
          <img
            src="./logo.png"
            alt="شعار أكاديمية بصائر"
            class="basair-splash-logo"
            onerror="
              this.style.display='none';
              var fallback=this.nextElementSibling;
              if(fallback) fallback.style.display='flex';
            "
          >
          <div class="basair-splash-logo-fallback">بصائر</div>
        </div>

        <p class="basair-splash-kicker">BASAIR ACADEMY</p>

        <h2 class="basair-splash-title">
          <span class="gold">نور يهدي</span>
          <span class="light">وعلم يبني</span>
        </h2>

        <p class="basair-splash-subtitle">
          منصة رصينة لتعليم القرآن الكريم واللغة العربية وعلوم الآلة بأسلوب بصري أنيق.
        </p>

        <div class="basair-splash-progress" aria-hidden="true"></div>
        <div class="basair-splash-loading">جارِ التهيئة...</div>
      </div>
    </div>
  ;
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
