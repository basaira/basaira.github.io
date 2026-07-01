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
        radial-gradient(circle at 50% 16%, rgba(255,255,255,.18), transparent 18rem),
        radial-gradient(circle at 80% 20%, rgba(212,175,55,.20), transparent 24rem),
        radial-gradient(circle at 15% 88%, rgba(255,255,255,.07), transparent 26rem),
        linear-gradient(145deg, #020617 0%, #07162F 42%, #0A1F44 100%);
      transition:
        opacity .95s cubic-bezier(.16, 1, .3, 1),
        visibility .95s cubic-bezier(.16, 1, .3, 1),
        transform .95s cubic-bezier(.16, 1, .3, 1),
        filter .95s cubic-bezier(.16, 1, .3, 1);
    }

    #splash-screen.basair-premium-splash.splash-hidden {
      opacity: 0;
      visibility: hidden;
      transform: scale(1.035);
      filter: blur(10px);
    }

    #splash-screen.basair-premium-splash::before {
      content: "";
      position: absolute;
      inset: -25%;
      background:
        linear-gradient(115deg, transparent 0 38%, rgba(255,255,255,.10) 47%, transparent 56% 100%),
        repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 1px, transparent 1px 90px);
      transform: translateX(26%);
      animation: basair-grand-light 2.8s cubic-bezier(.16, 1, .3, 1) .25s both;
      pointer-events: none;
      z-index: -1;
    }

    #splash-screen.basair-premium-splash::after {
      content: "";
      position: absolute;
      width: 44rem;
      height: 44rem;
      top: -19rem;
      right: -16rem;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(212,175,55,.26), rgba(212,175,55,0) 70%);
      filter: blur(10px);
      animation: basair-orb-drift 7s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: -2;
    }

    .basair-splash-shell {
      position: relative;
      width: min(92vw, 570px);
      min-height: min(84vh, 690px);
      display: grid;
      place-items: center;
      padding: 1.25rem;
      text-align: center;
    }

    .basair-splash-shell::before,
    .basair-splash-shell::after {
      content: "";
      position: absolute;
      inset: 50% auto auto 50%;
      aspect-ratio: 1;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .basair-splash-shell::before {
      width: min(84vw, 450px);
      border: 1px solid rgba(212,175,55,.22);
      box-shadow:
        0 0 0 24px rgba(212,175,55,.035),
        0 0 0 74px rgba(255,255,255,.024),
        inset 0 0 72px rgba(212,175,55,.055);
      animation: basair-ring-breathe 3s ease-in-out infinite;
    }

    .basair-splash-shell::after {
      width: min(72vw, 365px);
      border: 1px dashed rgba(255,255,255,.16);
      animation: basair-ring-rotate 18s linear infinite;
    }

    .basair-splash-card {
      position: relative;
      width: min(100%, 440px);
      display: grid;
      justify-items: center;
      overflow: hidden;
      border-radius: 36px;
      padding: 2.1rem 1.35rem 1.45rem;
      background:
        radial-gradient(circle at 50% 0%, rgba(212,175,55,.18), transparent 15rem),
        linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.045));
      border: 1px solid rgba(255,255,255,.16);
      box-shadow:
        0 34px 92px rgba(0,0,0,.36),
        inset 0 1px 0 rgba(255,255,255,.12);
      -webkit-backdrop-filter: blur(22px);
      backdrop-filter: blur(22px);
      animation: basair-card-enter .95s cubic-bezier(.16,1,.3,1) both;
    }

    .basair-splash-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 0 35%, rgba(255,255,255,.15) 45%, transparent 56% 100%);
      transform: translateX(115%);
      animation: basair-card-shine 1.45s cubic-bezier(.16,1,.3,1) .95s both;
      pointer-events: none;
    }

    .basair-logo-stage {
      position: relative;
      width: clamp(112px, 27vw, 160px);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      margin-bottom: 1rem;
    }

    .basair-logo-stage::before,
    .basair-logo-stage::after {
      content: "";
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }

    .basair-logo-stage::before {
      inset: -11px;
      border: 1px solid rgba(212,175,55,.45);
      animation: basair-halo-pulse 2.4s ease-in-out infinite;
    }

    .basair-logo-stage::after {
      inset: -24px;
      border: 1px dashed rgba(255,255,255,.20);
      animation: basair-ring-rotate 12s linear infinite reverse;
    }

    .basair-logo-medallion {
      position: relative;
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      overflow: hidden;
      border-radius: 50%;
      background:
        radial-gradient(circle at 34% 28%, #fffef8 0%, #f7edcb 57%, #d4af37 100%);
      border: 1px solid rgba(255,255,255,.48);
      box-shadow:
        0 20px 48px rgba(0,0,0,.32),
        0 0 0 9px rgba(255,255,255,.045),
        inset 0 2px 8px rgba(255,255,255,.58);
      animation:
        basair-logo-pop .88s cubic-bezier(.16,1,.3,1) .2s both,
        basair-logo-float 3.4s ease-in-out 1.05s infinite;
    }

    .basair-logo-medallion::before {
      content: "";
      position: absolute;
      width: 125%;
      height: 125%;
      background: linear-gradient(115deg, transparent 0 38%, rgba(255,255,255,.50) 48%, transparent 58% 100%);
      transform: translateX(112%);
      animation: basair-logo-glint 1.15s ease .78s both;
      pointer-events: none;
      z-index: 3;
    }

    .basair-splash-logo {
      position: relative;
      z-index: 2;
      width: 80%;
      height: 80%;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 10px 16px rgba(10,31,68,.18));
    }

    .basair-splash-logo-fallback {
      position: relative;
      z-index: 2;
      display: none;
      align-items: center;
      justify-content: center;
      color: #0A1F44;
      font-size: clamp(1.15rem, 3vw, 1.55rem);
      font-weight: 900;
    }

    .basair-splash-kicker {
      margin: 0 0 .62rem;
      color: rgba(255,255,255,.56);
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .28em;
      text-transform: uppercase;
      animation: basair-text-rise .7s cubic-bezier(.16,1,.3,1) .45s both;
    }

    .basair-splash-title {
      margin: 0;
      color: #F8F4E6;
      font-size: clamp(2.12rem, 7.5vw, 4.35rem);
      line-height: .92;
      font-weight: 900;
      letter-spacing: -.045em;
      text-shadow: 0 14px 36px rgba(0,0,0,.28);
      animation: basair-text-rise .74s cubic-bezier(.16,1,.3,1) .56s both;
    }

    .basair-splash-title span {
      display: block;
    }

    .basair-splash-title .gold {
      color: #D4AF37;
      text-shadow: 0 12px 30px rgba(212,175,55,.22);
    }

    .basair-splash-subtitle {
      max-width: 29rem;
      margin: .78rem auto 0;
      color: rgba(255,255,255,.70);
      font-size: clamp(.92rem, 2.8vw, 1.06rem);
      line-height: 1.82;
      font-weight: 700;
      animation: basair-text-rise .74s cubic-bezier(.16,1,.3,1) .66s both;
    }

    .basair-splash-progress {
      width: min(220px, 62vw);
      height: 4px;
      margin-top: 1.18rem;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(255,255,255,.11);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
      animation: basair-text-rise .7s cubic-bezier(.16,1,.3,1) .76s both;
    }

    .basair-splash-progress::before {
      content: "";
      display: block;
      width: 42%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, transparent, #D4AF37, #FFF7D1, transparent);
      box-shadow: 0 0 20px rgba(212,175,55,.50);
      animation: basair-progress-slide 1.35s cubic-bezier(.65,0,.35,1) infinite;
    }

    .basair-splash-loading {
      margin-top: .72rem;
      color: rgba(255,255,255,.44);
      font-size: .82rem;
      font-weight: 800;
      animation: basair-text-rise .7s cubic-bezier(.16,1,.3,1) .84s both;
    }

    @keyframes basair-card-enter {
      from { opacity: 0; transform: translateY(26px) scale(.955); filter: blur(12px); }
      to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }

    @keyframes basair-logo-pop {
      from { opacity: 0; transform: scale(.72) rotate(-10deg); filter: blur(10px); }
      to { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
    }

    @keyframes basair-logo-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-7px); }
    }

    @keyframes basair-logo-glint {
      to { transform: translateX(-115%); }
    }

    @keyframes basair-halo-pulse {
      0%, 100% { opacity: .30; transform: scale(.98); }
      50% { opacity: .85; transform: scale(1.045); }
    }

    @keyframes basair-ring-breathe {
      0%, 100% { opacity: .72; transform: translate(-50%, -50%) scale(.985); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.025); }
    }

    @keyframes basair-ring-rotate {
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @keyframes basair-text-rise {
      from { opacity: 0; transform: translateY(12px); filter: blur(6px); }
      to { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    @keyframes basair-card-shine {
      to { transform: translateX(-115%); }
    }

    @keyframes basair-progress-slide {
      from { transform: translateX(150%); }
      to { transform: translateX(-260%); }
    }

    @keyframes basair-grand-light {
      from { transform: translateX(26%); opacity: 0; }
      20% { opacity: 1; }
      to { transform: translateX(-26%); opacity: .72; }
    }

    @keyframes basair-orb-drift {
      from { transform: translate3d(0,0,0) scale(1); }
      to { transform: translate3d(22px,16px,0) scale(1.07); }
    }

    @media (max-width: 640px) {
      .basair-splash-shell {
        width: min(94vw, 430px);
        min-height: min(82vh, 650px);
      }

      .basair-splash-card {
        border-radius: 28px;
        padding: 1.72rem 1rem 1.25rem;
      }

      .basair-logo-stage {
        width: clamp(100px, 31vw, 132px);
      }

      .basair-splash-kicker {
        font-size: .66rem;
        letter-spacing: .22em;
      }

      .basair-splash-subtitle {
        font-size: .9rem;
        line-height: 1.72;
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
  splash.setAttribute("aria-label", "جار تحميل أكاديمية بصائر");

  splash.innerHTML = `
    <div class="basair-splash-shell">
      <div class="basair-splash-card">
        <div class="basair-logo-stage">
          <div class="basair-logo-medallion">
            <img
              src="./logo.png"
              alt="شعار أكاديمية بصائر"
              class="basair-splash-logo"
            >
            <div class="basair-splash-logo-fallback">بصائر</div>
          </div>
        </div>

        <p class="basair-splash-kicker">BASAIR ACADEMY</p>

        <h2 class="basair-splash-title">
          <span class="gold">نور يهدي</span>
          <span>وعلم يبني</span>
        </h2>

        <p class="basair-splash-subtitle">
          منصة رصينة لتعليم القرآن الكريم واللغة العربية وعلوم الآلة.
        </p>

        <div class="basair-splash-progress" aria-hidden="true"></div>
        <div class="basair-splash-loading">جارِ التهيئة...</div>
      </div>
    </div>
  `;

  const logo = splash.querySelector(".basair-splash-logo");
  const fallback = splash.querySelector(".basair-splash-logo-fallback");

  if (logo && fallback) {
    logo.addEventListener("error", function () {
      logo.style.display = "none";
      fallback.style.display = "flex";
    });
  }
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
