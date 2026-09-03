/* Basair Academy — Impeccable Overdrive / Scholar's Manuscript
   Decorative enhancement only. No Firebase or CMS ownership. */

const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const precisePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)");

function initManuscriptHero() {
  const hero = document.getElementById("home");
  if (!hero) return;

  let layer = hero.querySelector(".overdrive-manuscript");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "overdrive-manuscript";
    layer.setAttribute("aria-hidden", "true");
    hero.prepend(layer);
  }

  // Keep the manuscript lighting static. Pointer-tracking repainted a large hero layer
  // continuously and added no information for the learner.
  hero.style.setProperty("--od-pointer-x", "50%");
  hero.style.setProperty("--od-pointer-y", "34%");
  hero.style.setProperty("--od-shift-x", "0px");
  hero.style.setProperty("--od-shift-y", "0px");
}

function initReadingProgress() {
  // Retired after visual/performance QA: no persistent page-progress/loading line.
  document.querySelectorAll(".overdrive-reading-progress").forEach((node) => node.remove());
}

function initFolioMarkers() {
  const sections = Array.from(document.querySelectorAll("main > section")).filter(function (section) {
    return section.id && section.id !== "home";
  });

  sections.forEach(function (section, index) {
    section.classList.add("overdrive-folio");
    if (section.querySelector(":scope > .overdrive-folio-marker")) return;
    const marker = document.createElement("span");
    marker.className = "overdrive-folio-marker";
    marker.dataset.folio = String(index + 1).padStart(2, "0");
    marker.setAttribute("aria-hidden", "true");
    section.prepend(marker);
  });

  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle("is-folio-current", entry.isIntersecting && entry.intersectionRatio > .12);
    });
  }, { rootMargin: "-18% 0px -56% 0px", threshold: [0, .12, .4] });

  sections.forEach(function (section) { observer.observe(section); });
}

function initOverdrive() {
  initManuscriptHero();
  initReadingProgress();
  // Folio separators were intentionally retired after visual QA.
  // Keep the code path dormant rather than injecting hidden nodes/observers.
  document.documentElement.classList.add("overdrive-ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOverdrive, { once: true });
} else {
  initOverdrive();
}
