(() => {
  const credentials = window.portfolioData?.certifications || [];
  const listRoot = document.getElementById('credential-list');
  const search = document.getElementById('credential-search');
  const filters = Array.from(document.querySelectorAll('.credential-filter'));
  const results = document.getElementById('credential-results');
  const empty = document.getElementById('credential-empty');
  if (!listRoot || !search || !results || !empty) return;

  let activeCategory = 'All';

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const safeCredentialUrl = (value) => {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch {
      return null;
    }
  };

  const formatIssueDate = (value) => {
    if (!value) return 'Not provided';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  };

  const buildCard = (credential) => {
    const details = element('details', `credential-project-card glass-card project-card h-100${credential.status === 'expired' ? ' is-expired' : ''}`);
    const summary = element('summary', 'credential-project-summary');
    const content = element('div', 'p-4 d-flex flex-column flex-grow-1 credential-project-content');
    const cardHeader = element('div', 'credential-project-header');
    cardHeader.append(element('span', 'credential-page-category', credential.category));
    if (credential.status === 'expired') cardHeader.append(element('span', 'credential-page-status is-expired', 'Expired'));
    content.append(cardHeader);
    content.append(element('h3', 'card-title', credential.title));
    const meta = element('p', 'credential-project-meta');
    meta.append(element('span', '', credential.issuer), element('span', '', `Issued ${formatIssueDate(credential.issueDate)}`));
    content.append(meta);

    const tags = element('ul', 'app-meta webwork-card-tags credential-project-tags');
    (credential.skills || []).forEach((skill) => tags.append(element('li', 'app-tag', skill)));
    content.append(tags);
    content.append(element('span', 'credential-details-cue mt-auto', 'View details'));
    summary.append(content);
    details.append(summary);

    const body = element('div', 'credential-page-details__body');
    const metadata = element('dl', 'credential-page-metadata');
    [['Issuer', credential.issuer], ['Issue date', formatIssueDate(credential.issueDate)], ['Credential ID', credential.credentialId || 'Not provided']].forEach(([term, value]) => {
      metadata.append(element('dt', '', term), element('dd', '', value));
    });
    body.append(metadata);

    if (credential.skills?.length) {
      const skills = element('ul', 'credential-page-skills');
      credential.skills.forEach((skill) => skills.append(element('li', '', skill)));
      body.append(skills);
    }

    const url = safeCredentialUrl(credential.credentialUrl);
    if (url) {
      const link = element('a', 'btn btn-outline-soft credential-verify', 'Verify credential');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Verify ${credential.title} (opens in a new tab)`);
      link.textContent = 'View Credential →';
      body.append(link);
    } else {
      body.append(element('p', 'credential-link-unavailable mb-0', 'Credential verification link not provided.'));
    }
    details.append(body);
    return details;
  };

  const render = () => {
    const term = search.value.trim().toLocaleLowerCase();
    const visible = credentials.filter((credential) => {
      const categoryMatch = activeCategory === 'All' || credential.category === activeCategory;
      const searchable = [credential.title, credential.issuer, credential.credentialId, credential.category, ...(credential.skills || [])].filter(Boolean).join(' ').toLocaleLowerCase();
      return categoryMatch && (!term || searchable.includes(term));
    });

    const fragment = document.createDocumentFragment();
    visible.forEach((credential) => {
      const column = element('div', 'col-12 col-md-6 col-lg-4 d-flex');
      column.append(buildCard(credential));
      fragment.append(column);
    });
    listRoot.replaceChildren(fragment);
    empty.hidden = visible.length !== 0;
    results.textContent = `${visible.length} of ${credentials.length} certifications`;
  };

  search.addEventListener('input', render);
  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      activeCategory = filter.dataset.category || 'All';
      filters.forEach((button) => {
        const active = button === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      render();
    });
  });

  render();
})();
