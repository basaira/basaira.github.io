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
  if (document.getElementById("basair-cinematic-splash-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "basair-cinematic-splash-style";

  style.textContent = `
    #splash-screen.basair-cinematic-splash {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      overflow: hidden;
      isolation: isolate;
      background:
        radial-gradient(circle at 50% 18%, rgba(212,175,55,.20), transparent 34rem),
        radial-gradient(circle at 10% 90%, rgba(0,86,63,.18), transparent 28rem),
        linear-gradient(135deg, #fbfaf2 0%, #f4ecd2 42%, #eef4ee 100%);
      transition:
        opacity 1s cubic-bezier(.16, 1, .3, 1),
        visibility 1s cubic-bezier(.16, 1, .3, 1),
        transform 1s cubic-bezier(.16, 1, .3, 1),
        filter 1s cubic-bezier(.16, 1, .3, 1);
    }

    #splash-screen.basair-cinematic-splash.splash-hidden {
      opacity: 0;
      visibility: hidden;
      transform: scale(1.035);
      filter: blur(10px);
    }

    .basair-cinematic-stage {
      position: relative;
      width: min(92vw, 520px);
      min-height: min(86vh, 680px);
      display: grid;
      place-items: center;
      perspective: 1300px;
    }

    .basair-cinematic-title {
      position: absolute;
      top: clamp(1.4rem, 4vh, 3rem);
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      text-align: center;
      color: #0A1F44;
      font-weight: 900;
      font-size: clamp(1.8rem, 6vw, 3.7rem);
      line-height: 1.05;
      letter-spacing: -.04em;
      opacity: 0;
      animation: basair-title-in .9s cubic-bezier(.16, 1, .3, 1) .15s forwards;
    }

    .basair-cinematic-title span {
      color: #D4AF37;
      display: inline-block;
    }

    .basair-phone-shadow {
      position: absolute;
      width: min(58vw, 260px);
      height: 2rem;
      bottom: 11%;
      border-radius: 999px;
      background: rgba(10, 31, 68, .18);
      filter: blur(18px);
      opacity: 0;
      transform: scale(.7);
      animation: basair-shadow-in .9s cubic-bezier(.16, 1, .3, 1) .2s forwards;
    }

    .basair-phone {
      position: relative;
      width: min(62vw, 250px);
      aspect-ratio: 9 / 18.6;
      border-radius: 2.25rem;
      padding: .62rem;
      background:
        linear-gradient(145deg, rgba(255,255,255,.95), rgba(10,31,68,.22) 18%, rgba(2,6,23,.96) 52%, rgba(255,255,255,.22));
      box-shadow:
        0 2.2rem 5rem rgba(10,31,68,.30),
        inset 0 0 0 1px rgba(255,255,255,.55);
      transform:
        translateY(32px)
        rotateX(9deg)
        rotateY(-11deg)
        rotateZ(-1deg)
        scale(.86);
      opacity: 0;
      animation:
        basair-phone-enter 1.05s cubic-bezier(.16, 1, .3, 1) .15s forwards,
        basair-phone-float 2.8s ease-in-out 1.15s infinite;
    }

    .basair-phone::before {
      content: "";
      position: absolute;
      top: .72rem;
      left: 50%;
      width: 34%;
      height: .72rem;
      border-radius: 999px;
      background: #050816;
      transform: translateX(-50%);
      z-index: 6;
      box-shadow: inset 0 -1px 0 rgba(255,255,255,.16);
    }

    .basair-phone::after {
      content: "";
      position: absolute;
      inset: -.85rem;
      border-radius: 2.9rem;
      border: 1px solid rgba(212,175,55,.26);
      opacity: 0;
      animation: basair-device-halo 1.8s ease-in-out .75s infinite;
      pointer-events: none;
    }

    .basair-phone-screen {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 1.75rem;
      background:
        radial-gradient(circle at 50% 22%, rgba(212,175,55,.12), transparent 9rem),
        linear-gradient(180deg, #07100e 0%, #020617 100%);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
    }

    .basair-screen-topline {
      position: absolute;
      top: 2rem;
      right: 1.1rem;
      width: 2.2rem;
      height: .12rem;
      border-radius: 999px;
      background: #8DE35D;
      transform-origin: right;
      transform: scaleX(0);
      animation: basair-topline .55s ease-out .7s forwards;
      z-index: 4;
    }

    .basair-color-panel {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 50% 25%, rgba(255,255,255,.32), transparent 7rem),
        linear-gradient(180deg, #9BE35F 0%, #73D957 100%);
      transform: translateY(102%);
      animation:
        basair-panel-up .72s cubic-bezier(.65, 0, .35, 1) .65s forwards,
        basair-panel-down .78s cubic-bezier(.65, 0, .35, 1) 1.68s forwards;
      z-index: 3;
    }

    .basair-panel-mark {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: #0A1F44;
      font-weight: 900;
      font-size: 3.4rem;
      opacity: 0;
      transform: scale(.78) rotate(-6deg);
      animation: basair-mark-pop .52s cubic-bezier(.16, 1, .3, 1) 1.05s forwards;
    }

    .basair-final-content {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 1.35rem;
      opacity: 0;
      transform: translateY(14px) scale(.96);
      animation: basair-final-in .9s cubic-bezier(.16, 1, .3, 1) 1.82s forwards;
      z-index: 2;
    }

    .basair-final-stack {
      position: relative;
      display: grid;
      justify-items: center;
      gap: .7rem;
      width: 100%;
    }

    .basair-logo-orb {
      width: 7rem;
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background:
        radial-gradient(circle, rgba(255,255,255,.96) 0 56%, rgba(212,175,55,.18) 57% 100%);
      box-shadow:
        0 1.2rem 2.5rem rgba(0,0,0,.32),
        0 0 0 1px rgba(212,175,55,.30);
      position: relative;
      z-index: 3;
    }

    .basair-logo-orb img {
      width: 88%;
      height: 88%;
      object-fit: contain;
      filter: drop-shadow(0 .7rem 1rem rgba(0,0,0,.22));
    }

    .basair-final-title {
      color: #fff;
      font-weight: 900;
      font-size: 1.52rem;
      line-height: 1.15;
      text-align: center;
      margin-top: .15rem;
      text-shadow: 0 1rem 2rem rgba(0,0,0,.4);
    }

    .basair-final-title span {
      display: block;
      color: #D4AF37;
    }

    .basair-final-subtitle {
      color: rgba(255,255,255,.64);
      font-weight: 800;
      font-size: .72rem;
      line-height: 1.6;
      text-align: center;
      width: 86%;
    }

    .basair-chip {
      position: absolute;
      min-width: 3.6rem;
      padding: .45rem .65rem;
      border-radius: 1rem;
      color: #0A1F44;
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(212,175,55,.28);
      box-shadow: 0 1rem 2rem rgba(0,0,0,.24);
      font-weight: 900;
      font-size: .72rem;
      opacity: 0;
      transform: translateY(16px) scale(.84);
      animation: basair-chip-in .62s cubic-bezier(.16, 1, .3, 1) forwards;
      z-index: 2;
    }

    .basair-chip-1 {
      top: 12%;
      right: 7%;
      animation-delay: 2.08s;
    }

    .basair-chip-2 {
      top: 28%;
      left: 2%;
      animation-delay: 2.18s;
    }

    .basair-chip-3 {
      bottom: 24%;
      right: 0;
      animation-delay: 2.28s;
    }

    .basair-chip-4 {
      bottom: 12%;
      left: 12%;
      animation-delay: 2.38s;
    }

    .basair-bottom-cta {
      position: absolute;
      right: 1.1rem;
      left: 1.1rem;
      bottom: 1.05rem;
      height: 2.25rem;
      border-radius: 999px;
      background: linear-gradient(90deg, #8DE35D, #D4AF37);
      color: #0A1F44;
      display: grid;
      place-items: center;
      font-size: .72rem;
      font-weight: 900;
      opacity: 0;
      transform: translateY(16px);
      animation: basair-cta-in .55s cubic-bezier(.16, 1, .3, 1) 2.18s forwards;
      z-index: 4;
    }

    .basair-scan-light {
      position: absolute;
      inset: -30% -60%;
      background: linear-gradient(115deg, transparent 38%, rgba(255,255,255,.20) 48%, transparent 58%);
      transform: translateX(55%);
      animation: basair-scan 1.15s ease-in-out 1.4s forwards;
      z-index: 5;
      pointer-events: none;
    }

    @keyframes basair-title-in {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-16px);
        filter: blur(8px);
      }

      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
        filter: blur(0);
      }
    }

    @keyframes basair-shadow-in {
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes basair-phone-enter {
      to {
        opacity: 1;
        transform:
          translateY(0)
          rotateX(0deg)
          rotateY(0deg)
          rotateZ(0deg)
          scale(1);
      }
    }

    @keyframes basair-phone-float {
      0%, 100% {
        transform: translateY(0);
      }

      50% {
        transform: translateY(-8px);
      }
    }

    @keyframes basair-device-halo {
      0%, 100% {
        opacity: .16;
        transform: scale(.985);
      }

      50% {
        opacity: .72;
        transform: scale(1.025);
      }
    }

    @keyframes basair-topline {
      to {
        transform: scaleX(1);
      }
    }

    @keyframes basair-panel-up {
      to {
        transform: translateY(0);
      }
    }

    @keyframes basair-panel-down {
      to {
        transform: translateY(-102%);
      }
    }

    @keyframes basair-mark-pop {
      to {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }
    }

    @keyframes basair-final-in {
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes basair-chip-in {
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes basair-cta-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes basair-scan {
      to {
        transform: translateX(-55%);
      }
    }

    @media (max-width: 430px) {
      .basair-cinematic-title {
        top: 1.1rem;
        font-size: 2rem;
      }

      .basair-phone {
        width: min(70vw, 238px);
      }

      .basair-logo-orb {
        width: 6.2rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #splash-screen.basair-cinematic-splash *,
      #splash-screen.basair-cinematic-splash::before,
      #splash-screen.basair-cinematic-splash::after {
        animation: none !important;
        transition-duration: .01ms !important;
      }

      .basair-phone,
      .basair-cinematic-title,
      .basair-final-content,
      .basair-bottom-cta,
      .basair-chip {
        opacity: 1 !important;
        transform: none !important;
      }

      .basair-color-panel {
        display: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function enhanceSplashScreen() {
  const splash = document.getElementById("splash-screen");

  if (!splash || splash.dataset.basairCinematicSplash === "true") {
    return;
  }

  injectPremiumSplashStyles();

  splash.dataset.basairCinematicSplash = "true";
  splash.classList.add("basair-cinematic-splash");
  splash.setAttribute("aria-live", "polite");
  splash.setAttribute("aria-label", "جار تحميل أكاديمية بصائر");

  splash.innerHTML = `
    <div class="basair-cinematic-stage">
      <h2 class="basair-cinematic-title">
        أكاديمية <span>بصائر</span>
      </h2>

      <div class="basair-phone-shadow" aria-hidden="true"></div>

      <div class="basair-phone" aria-hidden="true">
        <div class="basair-phone-screen">
          <div class="basair-screen-topline"></div>

          <div class="basair-color-panel">
            <div class="basair-panel-mark">ب</div>
          </div>

          <div class="basair-final-content">
            <div class="basair-final-stack">
              <div class="basair-logo-orb">
                <img src="logo.png" alt="">
              </div>

              <div class="basair-final-title">
                نور يهدي
                <span>وعلم يبني</span>
              </div>

              <div class="basair-final-subtitle">
                تعليم القرآن والعربية وعلوم الآلة
              </div>

              <div class="basair-chip basair-chip-1">قُرآن</div>
              <div class="basair-chip basair-chip-2">عَرَبِيّة</div>
              <div class="basair-chip basair-chip-3">تَجْوِيد</div>
              <div class="basair-chip basair-chip-4">نَحْو</div>
            </div>
          </div>

          <div class="basair-bottom-cta">ابدأ رحلتك العلمية</div>
          <div class="basair-scan-light"></div>
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
