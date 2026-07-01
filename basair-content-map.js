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
          radial-gradient(circle at 50% 35%, rgba(255, 247, 212, .96) 0, rgba(253, 253, 245, .94) 18rem, rgba(253, 253, 245, .82) 34rem, rgba(10, 31, 68, .14) 100%),
          linear-gradient(135deg, #FDFDF5 0%, #F8F1D8 45%, #EFF5EF 100%);
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
        inset: auto;
        border-radius: 999px;
        pointer-events: none;
        z-index: -2;
        filter: blur(2px);
      }

      #splash-screen.basair-premium-splash::before {
        width: 48rem;
        height: 48rem;
        top: -18rem;
        right: -18rem;
        background: radial-gradient(circle, rgba(212, 175, 55, .36), rgba(212, 175, 55, 0) 68%);
        animation: basair-orb-drift 4.8s ease-in-out infinite alternate;
      }

      #splash-screen.basair-premium-splash::after {
        width: 40rem;
        height: 40rem;
        left: -16rem;
        bottom: -18rem;
        background: radial-gradient(circle, rgba(0, 86, 63, .22), rgba(0, 86, 63, 0) 70%);
        animation: basair-orb-drift 5.6s ease-in-out infinite alternate-reverse;
      }

      .basair-splash-shell {
        width: min(92vw, 560px);
        min-height: min(82vh, 640px);
        display: grid;
        place-items: center;
        text-align: center;
        position: relative;
        padding: 2rem 1.25rem;
      }

      .basair-splash-geometry {
        position: absolute;
        inset: 50% auto auto 50%;
        width: min(82vw, 430px);
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background:
          conic-gradient(from 90deg, rgba(212,175,55,0), rgba(212,175,55,.72), rgba(0,86,63,.18), rgba(212,175,55,0)),
          radial-gradient(circle, rgba(253,253,245,.84) 0 57%, rgba(212,175,55,.18) 58% 59%, transparent 60%);
        mask: radial-gradient(circle, transparent 0 55%, #000 56% 59%, transparent 60% 100%);
        -webkit-mask: radial-gradient(circle, transparent 0 55%, #000 56% 59%, transparent 60% 100%);
        opacity: .92;
        animation: basair-ring-spin 7s linear infinite;
      }

      .basair-splash-geometry::before,
      .basair-splash-geometry::after {
        content: "";
        position: absolute;
        inset: 12%;
        border-radius: 34% 66% 44% 56% / 48% 42% 58% 52%;
        border: 1px solid rgba(212, 175, 55, .42);
        transform: rotate(18deg);
      }

      .basair-splash-geometry::after {
        inset: 20%;
        border-color: rgba(10, 31, 68, .18);
        transform: rotate(-22deg);
      }

      .basair-splash-card {
        position: relative;
        display: grid;
        justify-items: center;
        gap: .72rem;
        padding: 2.25rem 1.45rem 1.45rem;
        width: min(100%, 430px);
        border-radius: 2rem;
        background: linear-gradient(180deg, rgba(255,255,255,.52), rgba(255,255,255,.20));
        border: 1px solid rgba(255,255,255,.72);
        box-shadow:
          0 2rem 5rem rgba(10, 31, 68, .14),
          inset 0 1px 0 rgba(255,255,255,.78);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        animation: basair-card-reveal .95s cubic-bezier(.16, 1, .3, 1) both;
      }

      .basair-splash-logo-wrap {
        width: clamp(8.5rem, 28vw, 13rem);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background:
          radial-gradient(circle, rgba(255,255,255,.95) 0 58%, rgba(212,175,55,.16) 59% 100%);
        box-shadow:
          0 1.2rem 3rem rgba(10,31,68,.14),
          0 0 0 1px rgba(212,175,55,.24),
          inset 0 0 0 .6rem rgba(255,255,255,.48);
        position: relative;
        animation: basair-logo-float 2.8s ease-in-out infinite;
      }

      .basair-splash-logo-wrap::before {
        content: "";
        position: absolute;
        inset: -.45rem;
        border-radius: inherit;
        border: 1px solid rgba(212,175,55,.28);
        animation: basair-halo 2.4s ease-in-out infinite;
      }

      .basair-splash-logo {
        width: 86%;
        height: 86%;
        object-fit: contain;
        filter: drop-shadow(0 .8rem 1.2rem rgba(10,31,68,.16));
      }

      .basair-splash-kicker {
        margin-top: .45rem;
        color: rgba(10, 31, 68, .58);
        font-size: .82rem;
        letter-spacing: .26em;
        text-transform: uppercase;
        font-weight: 900;
      }

      .basair-splash-title {
        margin: 0;
        color: #0A1F44;
        font-size: clamp(2.15rem, 7vw, 4.5rem);
        line-height: .95;
        font-weight: 900;
        letter-spacing: -.03em;
      }

      .basair-splash-title span {
        display: block;
      }

      .basair-splash-title .gold {
        color: #D4AF37;
        text-shadow: 0 .55rem 1.8rem rgba(212,175,55,.22);
      }

      .basair-splash-subtitle {
        margin: .2rem 0 0;
        color: rgba(10,31,68,.66);
        font-size: clamp(.95rem, 2.8vw, 1.15rem);
        font-weight: 800;
      }

      .basair-splash-progress {
        position: relative;
        width: min(18rem, 70vw);
        height: .28rem;
        margin-top: .9rem;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(10,31,68,.10);
      }

      .basair-splash-progress::before {
        content: "";
        position: absolute;
        inset: 0;
        width: 42%;
        border-radius: inherit;
        background: linear-gradient(90deg, transparent, #D4AF37, #00563F, transparent);
        animation: basair-progress 1.35s cubic-bezier(.65, 0, .35, 1) infinite;
      }

      #splash-screen.basair-premium-splash.splash-hidden {
        opacity: 0;
        visibility: hidden;
        transform: scale(1.025);
        filter: blur(8px);
      }

      @keyframes basair-ring-spin {
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }

      @keyframes basair-card-reveal {
        from {
          opacity: 0;
          transform: translateY(22px) scale(.97);
          filter: blur(8px);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      @keyframes basair-logo-float {
        0%, 100% {
          transform: translateY(0) scale(1);
        }

        50% {
          transform: translateY(-7px) scale(1.025);
        }
      }

      @keyframes basair-halo {
        0%, 100% {
          opacity: .28;
          transform: scale(.98);
        }

        50% {
          opacity: .72;
          transform: scale(1.04);
        }
      }

      @keyframes basair-progress {
        0% {
          transform: translateX(145%);
        }

        100% {
          transform: translateX(-245%);
        }
      }

      @keyframes basair-orb-drift {
        from {
          transform: translate3d(0, 0, 0) scale(1);
        }

        to {
          transform: translate3d(2rem, 1.2rem, 0) scale(1.08);
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
        <div class="basair-splash-geometry" aria-hidden="true"></div>

        <div class="basair-splash-card">
          <div class="basair-splash-logo-wrap">
            <img
              src="logo.png"
              alt="أكاديمية بصائر"
              class="basair-splash-logo"
              onerror="this.style.display='none'"
            >
          </div>

          <div class="basair-splash-kicker">BASAIR ACADEMY</div>

          <h2 class="basair-splash-title">
            <span class="gold">نور يهدي</span>
            <span>وعلم يبني</span>
          </h2>

          <p class="basair-splash-subtitle">منصة تعليم القرآن والعربية وعلوم الآلة</p>

          <div class="basair-splash-progress" aria-hidden="true"></div>
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
