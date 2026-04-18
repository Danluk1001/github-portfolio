// Nav markup is inlined so the bar works without fetch() (file://, strict hosts, etc.).
const NAV_HTML = `
<header class="site-header py-3">
  <nav class="navbar navbar-expand-lg navbar-dark container nav-glass">
    <a class="navbar-brand brand-logo" href="../index.html">
      <img src="../assets/DM-Logo.png" alt="Daniel Myers Logo">
    </a>

    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
            aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
        <li class="nav-item"><a class="nav-link" href="../index.html">Home</a></li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="../index.html#web-work"
             role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Work
          </a>
          <ul class="dropdown-menu dropdown-menu-dark dropdown-glass">
            <li><a class="dropdown-item" href="../web-work/index.html">Web Work</a></li>
            <li><a class="dropdown-item" href="../applications/index.html">Applications</a></li>
          </ul>
        </li>

        <li class="nav-item"><a class="nav-link" href="../index.html#resume">Resume</a></li>
        <li class="nav-item"><a class="nav-link" href="../index.html#testimonials">Testimonials</a></li>
        <li class="nav-item"><a class="nav-link" href="../index.html#contact">Contact</a></li>
      </ul>

      <div class="ms-lg-3 mt-3 mt-lg-0">
        <a class="btn btn-accent" href="../index.html#contact">Hire Me</a>
      </div>
    </div>
  </nav>
</header>
`.trim();

function loadNav() {
  const mount = document.getElementById("site-nav");
  if (!mount) return;

  mount.innerHTML = NAV_HTML;

  const normalizePath = (pathname) =>
    pathname.replace(/\\/g, "/").replace(/\/index\.html$/i, "/").replace(/\/$/, "") || "/";

  const current = normalizePath(new URL(window.location.href).pathname);

  document.querySelectorAll(".nav-link, .dropdown-item").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    try {
      const resolved = normalizePath(new URL(href, window.location.href).pathname);
      if (resolved === current) {
        a.classList.add("active");
      }
    } catch (_) {
      /* ignore */
    }
  });
}

// Run as soon as this script executes (end of <body>), so other DOMContentLoaded handlers see the nav.
loadNav();
