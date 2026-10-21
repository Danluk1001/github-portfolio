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
    'Google / Coursera': 'UX research, wireframing, prototyping, usability testing, Figma, Adobe XD, and responsive design.',
    'HubSpot Academy': 'CMS development, reusable modules, responsive implementation, and production content systems.'
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
  const categoryOrder = ['UX/UI Design', 'Web Development', 'AI & Python'];

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

})();
