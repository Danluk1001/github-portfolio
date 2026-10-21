import React from 'react';

const normalizePath = (value) =>
  value.replace(/\\/g, '/').replace(/\/index\.html$/i, '/').replace(/\/$/, '') || '/';

const links = [
  { label: 'Home', href: '/' },
  {
    label: 'Work',
    href: '/#professional-work',
    children: [
      { label: 'Web Work', href: '/web-work/' },
      { label: 'Applications', href: '/applications/' }
    ]
  },
  {
    label: 'Case Studies',
    href: '/work/jerseystem/',
    children: [
      { label: 'JerseySTEM', href: '/work/jerseystem/' },
      { label: 'Impact Humanity', href: '/work/impact-humanity/' }
    ]
  },
  {
    label: 'Credentials',
    href: '/resume/',
    children: [
      { label: 'Resume', href: '/resume/' },
      { label: 'Certifications', href: '/certifications/' }
    ]
  },
  { label: 'Testimonials', href: '/testimonials/' },
  { label: 'Contact', href: '/#contact' }
];

export default function Navigation({ currentPath = '/' }) {
  const current = normalizePath(currentPath);
  const isActive = (href) => normalizePath(new URL(href, 'https://portfolio.local').pathname) === current;

  return (
    <header className="site-header py-3">
      <nav className="navbar navbar-expand-lg navbar-dark container nav-glass" aria-label="Primary navigation">
        <a className="navbar-brand brand-logo" href="/">
          <img src="/assets/brand/DM-Logo.png" alt="Daniel Myers Logo" />
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
          aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            {links.map((link) => {
              const childActive = link.children?.some((child) => isActive(child.href));
              return (
                <li className={`nav-item${link.children ? ' dropdown' : ''}`} key={link.label}>
                  <a
                    className={`nav-link${link.children ? ' dropdown-toggle' : ''}${isActive(link.href) || childActive ? ' active' : ''}`}
                    href={link.href}
                    {...(link.children ? { role: 'button', 'data-bs-toggle': 'dropdown', 'aria-expanded': 'false' } : {})}
                  >
                    {link.label}
                  </a>
                  {link.children && (
                    <ul className="dropdown-menu dropdown-menu-dark dropdown-glass">
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <a className={`dropdown-item${isActive(child.href) ? ' active' : ''}`} href={child.href}>
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="ms-lg-3 mt-3 mt-lg-0">
            <a className="btn btn-accent" href="/#contact">Hire Me</a>
          </div>
        </div>
      </nav>
    </header>
  );
}
