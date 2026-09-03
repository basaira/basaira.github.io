// Basair Academy — Floating Academic Command Bar, performance pass v4.
// Navbar-only progressive enhancement. No scroll-progress line and no pointer-driven repaint.
(function(){
  "use strict";

  const nav=document.getElementById("navbar");
  if(!nav) return;

  const desktopNav=nav.querySelector("nav.hidden.lg\\:flex");
  const links=Array.from(nav.querySelectorAll(".nav-link[href^='#']"));
  let rail=null;
  let raf=0;

  if(desktopNav){
    rail=document.createElement("span");
    rail.className="topbar-active-rail";
    rail.setAttribute("aria-hidden","true");
    desktopNav.appendChild(rail);
  }

  function syncRail(){
    raf=0;
    if(!rail||!desktopNav) return;
    const active=links.find((link)=>link.classList.contains("active-section"))||null;
    if(!active||desktopNav.offsetParent===null){
      rail.classList.remove("is-visible");
      return;
    }
    const navRect=desktopNav.getBoundingClientRect();
    const linkRect=active.getBoundingClientRect();
    nav.style.setProperty("--bar-rail-x",`${Math.round(linkRect.left-navRect.left)}px`);
    nav.style.setProperty("--bar-rail-w",`${Math.round(linkRect.width)}px`);
    rail.classList.add("is-visible");
  }

  function requestRailSync(){
    if(raf) return;
    raf=requestAnimationFrame(syncRail);
  }

  const classObserver=new MutationObserver((mutations)=>{
    if(mutations.some((mutation)=>mutation.attributeName==="class")) requestRailSync();
  });
  links.forEach((link)=>classObserver.observe(link,{attributes:true,attributeFilter:["class"]}));

  window.addEventListener("resize",requestRailSync,{passive:true});
  window.addEventListener("orientationchange",requestRailSync,{passive:true});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)requestRailSync();});
  links.forEach((link)=>link.addEventListener("click",()=>setTimeout(requestRailSync,0)));

  requestRailSync();
})();
