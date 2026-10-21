import { testimonialsConfig } from "./testimonials-config.js";

const configured = Boolean(testimonialsConfig.supabaseUrl && testimonialsConfig.supabaseAnonKey);
const TESTIMONIAL_PREVIEW_LENGTH = 250;
let testimonialSequence = 0;

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function safeLinkedInUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "linkedin.com" || host.endsWith(".linkedin.com")) ? url.href : null;
  } catch {
    return null;
  }
}

function buildStars(rating) {
  const stars = createElement("div", "testimonial-stars");
  const safeRating = Math.min(5, Math.max(1, Number(rating) || 1));
  stars.setAttribute("aria-label", `${safeRating} out of 5 stars`);
  for (let index = 1; index <= 5; index += 1) {
    const star = createElement("span", index <= safeRating ? "is-filled" : "", "★");
    star.setAttribute("aria-hidden", "true");
    stars.append(star);
  }
  return stars;
}

function createTestimonialPreview(text, limit = TESTIMONIAL_PREVIEW_LENGTH) {
  if (text.length <= limit) return text;

  const candidate = text.slice(0, limit + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const cutoff = lastSpace >= Math.floor(limit * 0.8) ? lastSpace : limit;
  return `${text.slice(0, cutoff).trimEnd()}…`;
}

function addTestimonialExpansion(card, quote, testimonial) {
  const fullText = String(testimonial.testimonial || "");
  if (fullText.length <= TESTIMONIAL_PREVIEW_LENGTH) return;

  testimonialSequence += 1;
  const safeRecordId = String(testimonial.id || "").replace(/[^a-zA-Z0-9_-]/g, "");
  quote.id = `testimonial-text-${safeRecordId || testimonialSequence}`;
  quote.textContent = createTestimonialPreview(fullText);
  card.classList.add("testimonial-card--expandable");

  const button = createElement("button", "testimonial-expand", "");
  const label = createElement("span", "testimonial-expand__label", "Read More");
  const chevron = createElement("span", "testimonial-expand__chevron");
  chevron.setAttribute("aria-hidden", "true");
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", quote.id);
  button.setAttribute("aria-label", `Read more of ${testimonial.name}'s testimonial`);
  button.append(label, chevron);

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    const nextExpanded = !expanded;
    quote.textContent = nextExpanded ? fullText : createTestimonialPreview(fullText);
    button.setAttribute("aria-expanded", String(nextExpanded));
    button.setAttribute("aria-label", `${nextExpanded ? "Read less of" : "Read more of"} ${testimonial.name}'s testimonial`);
    button.classList.toggle("is-expanded", nextExpanded);
    label.textContent = nextExpanded ? "Read Less" : "Read More";
  });

  quote.after(button);
}

function buildTestimonialCard(testimonial) {
  const card = createElement("article", "glass-card testimonial-card testimonial-card--public p-4 h-100");
  const header = createElement("div", "testimonial-card__header");
  const organization = createElement("div", "testimonial-title", testimonial.organization);
  header.append(organization, buildStars(testimonial.rating));

  const quote = createElement("blockquote", "testimonial-quote", testimonial.testimonial);
  const footer = createElement("footer", "testimonial-card__footer");
  const identity = createElement("div");
  identity.append(createElement("div", "fw-semibold", testimonial.name));
  const details = [testimonial.job_title, testimonial.relationship].filter(Boolean).join(" · ");
  identity.append(createElement("div", "text-muted-2 small", details));

  const meta = createElement("div", "testimonial-card__meta");
  meta.append(createElement("time", "", formatDate(testimonial.created_at)));
  meta.querySelector("time").dateTime = testimonial.created_at || "";
  const linkedIn = safeLinkedInUrl(testimonial.linkedin_url);
  if (linkedIn) {
    const link = createElement("a", "link-soft", "LinkedIn");
    link.href = linkedIn;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${testimonial.name}'s LinkedIn profile (opens in a new tab)`);
    meta.append(link);
  }

  footer.append(identity, meta);
  card.append(header, quote, footer);
  addTestimonialExpansion(card, quote, testimonial);
  return card;
}

function renderMessage(container, message) {
  container.replaceChildren(createElement("div", "testimonial-empty glass-card p-4", message));
  container.closest("[data-testimonials-carousel]")?.classList.add("is-empty");
}

async function fetchApprovedTestimonials(limit) {
  const baseUrl = testimonialsConfig.supabaseUrl.replace(/\/$/, "");
  const fields = "id,name,organization,job_title,relationship,rating,testimonial,linkedin_url,created_at,approved_at";
  const params = new URLSearchParams({
    select: fields,
    status: "eq.approved",
    consent_given: "eq.true",
    order: "approved_at.desc,created_at.desc"
  });
  if (limit) params.set("limit", String(limit));

  const response = await fetch(`${baseUrl}/rest/v1/testimonials?${params}`, {
    headers: {
      apikey: testimonialsConfig.supabaseAnonKey,
      Authorization: `Bearer ${testimonialsConfig.supabaseAnonKey}`
    }
  });

  if (!response.ok) throw new Error("Unable to load testimonials");
  return response.json();
}

function initializeCarousel(root) {
  const track = root.querySelector(".testimonials-track");
  const slides = Array.from(track?.querySelectorAll(".testi-slide") || []);
  const previous = root.querySelector(".testi-prev");
  const next = root.querySelector(".testi-next");
  if (!track || !slides.length) {
    root.classList.add("is-empty");
    return;
  }

  let currentIndex = 0;
  const visibleCount = () => window.innerWidth <= 575 ? 1 : window.innerWidth <= 991 ? 2 : 3;
  const maximumIndex = () => Math.max(0, slides.length - visibleCount());
  const update = () => {
    const width = slides[0].getBoundingClientRect().width;
    const gap = Number.parseFloat(window.getComputedStyle(track).gap || "16");
    currentIndex = Math.min(Math.max(currentIndex, 0), maximumIndex());
    track.style.transform = `translateX(${-currentIndex * (width + gap)}px)`;
    if (previous) previous.disabled = currentIndex === 0;
    if (next) next.disabled = currentIndex === maximumIndex();
    root.classList.toggle("has-no-overflow", maximumIndex() === 0);
  };

  previous?.addEventListener("click", () => { currentIndex -= 1; update(); });
  next?.addEventListener("click", () => { currentIndex += 1; update(); });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function initializeMobilePageCarousel(root) {
  const viewport = root.querySelector(".testimonials-page-viewport");
  const track = root.querySelector(".testimonials-grid");
  const slides = Array.from(track?.children || []).filter((slide) => !slide.classList.contains("testimonial-empty"));
  const previous = root.querySelector(".testimonials-page-prev");
  const next = root.querySelector(".testimonials-page-next");
  const dots = root.querySelector(".testimonials-page-dots");
  if (!viewport || !track || !slides.length || !previous || !next || !dots) {
    root.classList.add("is-empty");
    return;
  }

  let currentIndex = 0;
  let scrollFrame = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileViewport = window.matchMedia("(max-width: 767.98px)");
  const dotButtons = slides.map((slide, index) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${index + 1} of ${slides.length}`);
    const dot = createElement("button", "testimonials-page-dot");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show testimonial ${index + 1}`);
    dot.addEventListener("click", () => goTo(index));
    dots.append(dot);
    return dot;
  });

  function updateActive(index) {
    currentIndex = Math.min(Math.max(index, 0), slides.length - 1);
    dotButtons.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
      dot.setAttribute("aria-current", dotIndex === currentIndex ? "true" : "false");
    });
  }

  function goTo(index) {
    const wrappedIndex = (index + slides.length) % slides.length;
    updateActive(wrappedIndex);
    viewport.scrollTo({
      left: slides[wrappedIndex].offsetLeft - track.offsetLeft,
      behavior: reduceMotion.matches ? "auto" : "smooth"
    });
  }

  viewport.addEventListener("scroll", () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const nearest = slides.reduce((best, slide, index) => {
        const center = slide.offsetLeft - track.offsetLeft + slide.offsetWidth / 2;
        return Math.abs(center - viewportCenter) < best.distance
          ? { index, distance: Math.abs(center - viewportCenter) }
          : best;
      }, { index: 0, distance: Number.POSITIVE_INFINITY });
      updateActive(nearest.index);
    });
  }, { passive: true });

  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goTo(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
  });
  previous.addEventListener("click", () => goTo(currentIndex - 1));
  next.addEventListener("click", () => goTo(currentIndex + 1));
  mobileViewport.addEventListener("change", (event) => {
    if (!event.matches) viewport.scrollTo({ left: 0, behavior: "auto" });
    else goTo(currentIndex);
  });
  root.classList.toggle("has-no-overflow", slides.length === 1);
  updateActive(0);
}

async function loadTestimonials() {
  const containers = Array.from(document.querySelectorAll("[data-testimonials-list]"));
  if (!containers.length) return;

  if (!configured) {
    containers.forEach((container) => renderMessage(container, "Testimonials are being connected. Please check back soon."));
    return;
  }

  await Promise.all(containers.map(async (container) => {
    const limit = Number.parseInt(container.dataset.limit || "", 10) || null;
    try {
      const testimonials = await fetchApprovedTestimonials(limit);
      if (!testimonials.length) {
        renderMessage(container, "No approved testimonials have been published yet. Be the first to share your experience.");
        return;
      }

      const fragment = document.createDocumentFragment();
      testimonials.forEach((testimonial) => {
        const card = buildTestimonialCard(testimonial);
        if (container.classList.contains("testimonials-track")) {
          const slide = createElement("div", "testi-slide");
          slide.append(card);
          fragment.append(slide);
        } else {
          const column = createElement("div", "col-12 col-md-6 col-lg-4 d-flex");
          column.append(card);
          fragment.append(column);
        }
      });
      container.replaceChildren(fragment);
      const carousel = container.closest("[data-testimonials-carousel]");
      if (carousel) initializeCarousel(carousel);
      const mobileCarousel = container.closest("[data-mobile-testimonials-carousel]");
      if (mobileCarousel) initializeMobilePageCarousel(mobileCarousel);
    } catch {
      renderMessage(container, "Testimonials are temporarily unavailable. Please try again later.");
    }
  }));
}

function showFieldError(field, message) {
  field.setCustomValidity(message);
  const feedback = field.closest(".form-field")?.querySelector(".invalid-feedback");
  if (feedback) feedback.textContent = message;
}

function validateLinkedIn(field) {
  field.setCustomValidity("");
  if (!field.value.trim()) return true;
  if (!safeLinkedInUrl(field.value.trim())) {
    showFieldError(field, "Enter a full https://linkedin.com profile URL.");
    return false;
  }
  return true;
}

function loadTurnstile(siteKey, container, onToken) {
  return new Promise((resolve, reject) => {
    const render = () => {
      try {
        const widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: "dark",
          callback: onToken,
          "expired-callback": () => onToken("")
        });
        resolve(widgetId);
      } catch (error) {
        reject(error);
      }
    };

    if (window.turnstile) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = render;
    script.onerror = reject;
    document.head.append(script);
  });
}

async function initializeSubmissionForm() {
  const form = document.getElementById("testimonial-form");
  if (!form) return;

  const status = document.getElementById("testimonial-form-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const message = form.elements.testimonial;
  const counter = document.getElementById("testimonial-character-count");
  const linkedIn = form.elements.linkedin_url;
  const turnstileContainer = document.getElementById("testimonial-turnstile");
  let turnstileToken = "";
  let turnstileWidgetId = null;

  form.elements.form_started_at.value = String(Date.now());

  const updateCount = () => { if (counter) counter.textContent = `${message.value.length} / 1,500`; };
  message.addEventListener("input", updateCount);
  linkedIn.addEventListener("input", () => linkedIn.setCustomValidity(""));
  updateCount();

  if (!configured || !testimonialsConfig.turnstileSiteKey) {
    submitButton.disabled = true;
    status.textContent = "Submissions will open after the secure backend is configured.";
  } else {
    try {
      turnstileWidgetId = await loadTurnstile(testimonialsConfig.turnstileSiteKey, turnstileContainer, (token) => { turnstileToken = token; });
    } catch {
      submitButton.disabled = true;
      status.textContent = "Bot protection could not load. Please try again later.";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    linkedIn.setCustomValidity("");
    validateLinkedIn(linkedIn);
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.querySelector(":invalid")?.focus();
      status.textContent = "Please correct the highlighted fields.";
      return;
    }
    if (!turnstileToken) {
      status.textContent = "Please complete the bot-protection check.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Submitting your testimonial…";
    const data = new FormData(form);
    const payload = {
      name: data.get("name")?.toString().trim(),
      organization: data.get("organization")?.toString().trim(),
      job_title: data.get("job_title")?.toString().trim() || null,
      relationship: data.get("relationship")?.toString(),
      rating: Number(data.get("rating")),
      testimonial: data.get("testimonial")?.toString().trim(),
      linkedin_url: data.get("linkedin_url")?.toString().trim() || null,
      consent_given: data.get("consent_given") === "on",
      website: data.get("website")?.toString() || "",
      form_started_at: data.get("form_started_at")?.toString(),
      turnstile_token: turnstileToken
    };

    try {
      const response = await fetch(`${testimonialsConfig.supabaseUrl.replace(/\/$/, "")}/functions/v1/submit-testimonial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: testimonialsConfig.supabaseAnonKey,
          Authorization: `Bearer ${testimonialsConfig.supabaseAnonKey}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Submission failed");

      form.reset();
      form.classList.remove("was-validated");
      form.elements.form_started_at.value = String(Date.now());
      updateCount();
      status.textContent = "Thank you. Your testimonial was submitted for review and will appear after approval.";
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
      turnstileToken = "";
    } catch (error) {
      status.textContent = error.message === "Rate limit exceeded"
        ? "Too many recent submissions. Please try again later."
        : "Your testimonial could not be submitted. Please try again later.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadTestimonials();
  initializeSubmissionForm();
});
