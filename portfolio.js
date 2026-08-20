(() => {
  const certifications = window.portfolioData?.certifications || [];
  const root = document.getElementById('certification-root');
  if (!root || !certifications.length) return;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  const featuredDescriptions = {
    IBM: 'Generative AI, LLMs, transformers, fine-tuning, RAG, LangChain, Python, Flask, and machine learning.',
    'Google / Coursera': 'UX research, wireframing, prototyping, usability testing, Figma, Adobe XD, and responsive design.'
  };

  const featuredWrap = element('div', 'featured-certifications');
  featuredWrap.setAttribute('aria-label', 'Featured credentials');

  certifications.filter((credential) => credential.featured).forEach((credential) => {
    const card = element('article', 'featured-certification');
    const meta = element('div', 'certification-meta');
    meta.append(element('span', 'certification-badge', 'Featured'));
    meta.append(element('span', 'certification-focus', credential.issuer));
    card.append(meta);
    card.append(element('h3', '', credential.title));
    card.append(element('p', '', featuredDescriptions[credential.issuer] || credential.skills.join(', ')));
    featuredWrap.append(card);
  });

  const details = element('details', 'certification-details');
  const summary = element('summary');
  const summaryCopy = element('span');
  summaryCopy.append(element('strong', '', `${certifications.length} Professional Credentials`));
  summaryCopy.append(element('small', '', 'View all certifications by category'));
  summary.append(summaryCopy);
  const toggle = element('span', 'certification-toggle');
  toggle.setAttribute('aria-hidden', 'true');
  summary.append(toggle);
  details.append(summary);

  const groupsWrap = element('div', 'certification-groups');
  const categoryOrder = ['AI & Machine Learning', 'UX & Product Design', 'Web Development'];

  categoryOrder.forEach((category) => {
    const credentials = certifications.filter((credential) => credential.category === category);
    if (!credentials.length) return;

    const group = element('section', 'certification-group');
    const heading = element('h4', '', category);
    heading.append(element('span', '', String(credentials.length)));
    group.append(heading);

    const list = element('ul', 'certification-data-list');
    credentials.forEach((credential) => {
      const item = element('li');
      const copy = element('div');
      copy.append(element('strong', '', credential.title));
      copy.append(element('small', '', credential.issuer));
      item.append(copy);

      if (credential.status === 'expired') {
        item.classList.add('is-expired');
        item.append(element('span', 'credential-status credential-status--expired', 'Expired'));
      }

      list.append(item);
    });

    group.append(list);
    groupsWrap.append(group);
  });

  details.append(groupsWrap);
  root.append(featuredWrap, details);

  const testimonialTrack = document.getElementById('testimonialsTrack');
  const testimonials = (window.portfolioData?.testimonials || [])
    .filter((testimonial) => testimonial.status === 'approved');

  if (testimonialTrack) {
    testimonials.forEach((testimonial) => {
      const slide = element('div', 'testi-slide');
      const card = element('article', 'glass-card p-4 testimonial-card h-100');
      const layout = element('div', 'd-flex align-items-start gap-3');
      layout.append(element('div', 'quote-dot'));

      const content = element('div');
      content.append(element('div', 'testimonial-title', testimonial.company));
      const quote = element('p', 'card-body-text mb-3', `“${testimonial.quote}”`);
      content.append(quote);

      const person = element('div', 'testimonial-person');
      person.append(element('div', 'fw-semibold', testimonial.name));
      person.append(element('div', 'text-muted-2 small', [testimonial.role, testimonial.company].filter(Boolean).join(' · ')));
      content.append(person);
      layout.append(content);
      card.append(layout);
      slide.append(card);
      testimonialTrack.append(slide);
    });
  }

  const testimonialForm = document.getElementById('testimonial-form');
  const testimonialStatus = document.getElementById('testimonial-form-status');

  testimonialForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = testimonialForm.querySelector('button[type="submit"]');
    testimonialStatus.textContent = 'Sending your testimonial…';
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(testimonialForm.action, {
        method: 'POST', body: new FormData(testimonialForm), headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('Submission failed');
      testimonialForm.reset();
      testimonialStatus.textContent = 'Thank you! Your testimonial was submitted for review.';
    } catch {
      testimonialStatus.textContent = 'Your testimonial could not be sent. Please try again or contact me by email.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
})();
