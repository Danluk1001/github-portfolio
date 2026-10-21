class CaseStudyMedia extends HTMLElement {
  connectedCallback() {
    const label = this.getAttribute("label") || "Project image";
    const caption = this.getAttribute("caption") || "Replaceable project asset";
    const ratio = this.getAttribute("ratio") || "wide";

    this.classList.add("case-media", `case-media--${ratio}`);
    this.setAttribute("role", "img");
    this.setAttribute("aria-label", `${label}: ${caption}`);
    this.innerHTML = `
      <span class="case-media__chrome" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="case-media__content" aria-hidden="true">
        <strong>${label}</strong>
        <small>${caption}</small>
        <em>Image placeholder</em>
      </span>`;
  }
}

customElements.define("case-study-media", CaseStudyMedia);

const mobileDisclosureQuery = window.matchMedia("(max-width: 575px)");
const mobileDisclosures = document.querySelectorAll(".case-mobile-disclosure");

const syncMobileDisclosures = (event) => {
  mobileDisclosures.forEach((disclosure) => {
    if (event.matches) disclosure.removeAttribute("open");
    else disclosure.setAttribute("open", "");
  });
};

syncMobileDisclosures(mobileDisclosureQuery);
mobileDisclosureQuery.addEventListener("change", syncMobileDisclosures);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const lightbox = document.createElement("dialog");
lightbox.className = "case-lightbox";
lightbox.setAttribute("aria-label", "Project image viewer");
lightbox.innerHTML = `
  <div class="case-lightbox__panel">
    <button class="case-lightbox__close" type="button" aria-label="Close image viewer">×</button>
    <img class="case-lightbox__image" src="" alt="">
    <p class="case-lightbox__caption"></p>
  </div>`;
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector(".case-lightbox__image");
const lightboxCaption = lightbox.querySelector(".case-lightbox__caption");
const lightboxClose = lightbox.querySelector(".case-lightbox__close");

document.querySelectorAll(".case-lightbox-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const image = trigger.querySelector("img");
    const figure = trigger.closest("figure");
    if (!image) return;

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = figure?.querySelector("figcaption")?.textContent.trim() || "";
    lightbox.showModal();
    lightboxClose.focus();
  });
});

lightboxClose.addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

const caseStudyRail = document.querySelector(".case-study-rail");
const caseStudyRailHandle = caseStudyRail?.querySelector(".case-study-rail__label");
const railStorageKey = "jerseystem-case-study-rail-position";

const clampRailPosition = (left, top) => {
  const padding = 12;
  const width = caseStudyRail.offsetWidth;
  const height = caseStudyRail.offsetHeight;
  return {
    left: Math.min(Math.max(left, padding), window.innerWidth - width - padding),
    top: Math.min(Math.max(top, padding), window.innerHeight - height - padding)
  };
};

const positionRail = (left, top, save = false) => {
  if (!caseStudyRail) return;
  const position = clampRailPosition(left, top);
  caseStudyRail.style.animation = "none";
  caseStudyRail.style.transform = "none";
  caseStudyRail.style.left = `${position.left}px`;
  caseStudyRail.style.top = `${position.top}px`;
  if (save) {
    try { localStorage.setItem(railStorageKey, JSON.stringify(position)); } catch (_) { /* storage may be unavailable */ }
  }
};

if (caseStudyRail && caseStudyRailHandle) {
  try {
    const savedPosition = JSON.parse(localStorage.getItem(railStorageKey));
    if (Number.isFinite(savedPosition?.left) && Number.isFinite(savedPosition?.top)) {
      positionRail(savedPosition.left, savedPosition.top);
    }
  } catch (_) { /* use the default CSS position */ }

  let dragOffsetX = 0;
  let dragOffsetY = 0;

  caseStudyRailHandle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const rect = caseStudyRail.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    caseStudyRail.classList.add("is-dragging");
    caseStudyRailHandle.setPointerCapture(event.pointerId);
    positionRail(rect.left, rect.top);
  });

  caseStudyRailHandle.addEventListener("pointermove", (event) => {
    if (!caseStudyRail.classList.contains("is-dragging")) return;
    positionRail(event.clientX - dragOffsetX, event.clientY - dragOffsetY);
  });

  const finishRailDrag = (event) => {
    if (!caseStudyRail.classList.contains("is-dragging")) return;
    caseStudyRail.classList.remove("is-dragging");
    if (caseStudyRailHandle.hasPointerCapture(event.pointerId)) caseStudyRailHandle.releasePointerCapture(event.pointerId);
    const rect = caseStudyRail.getBoundingClientRect();
    positionRail(rect.left, rect.top, true);
  };

  caseStudyRailHandle.addEventListener("pointerup", finishRailDrag);
  caseStudyRailHandle.addEventListener("pointercancel", finishRailDrag);
  caseStudyRailHandle.addEventListener("dblclick", () => {
    try { localStorage.removeItem(railStorageKey); } catch (_) { /* storage may be unavailable */ }
    caseStudyRail.removeAttribute("style");
  });

  window.addEventListener("resize", () => {
    if (!caseStudyRail.style.left || caseStudyRail.offsetParent === null) return;
    const rect = caseStudyRail.getBoundingClientRect();
    positionRail(rect.left, rect.top, true);
  });
}

const railLinks = Array.from(document.querySelectorAll(".case-study-rail a"));
const railSections = railLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (railSections.length) {
  const railObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    railLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-18% 0px -62%", threshold: [0, .2, .5] });

  railSections.forEach((section) => railObserver.observe(section));
}

if (!prefersReducedMotion) {
  document.body.classList.add("case-page-enter");

  document.querySelectorAll(".case-media--actual img").forEach((image) => {
    const startBreathing = () => image.classList.add("is-loaded");
    if (image.complete) startBreathing();
    else image.addEventListener("load", startBreathing, { once: true });
  });

  const revealItems = document.querySelectorAll(".case-section, .case-media");
  revealItems.forEach((item) => item.classList.add("case-reveal"));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealItems.forEach((item) => observer.observe(item));
}
