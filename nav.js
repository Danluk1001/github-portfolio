// nav.js
async function loadNav() {
  const mount = document.getElementById("site-nav");
  if (!mount) return;

  try {
    const res = await fetch("partials/nav.html");
    if (!res.ok) throw new Error("Failed to load nav.html");
    mount.innerHTML = await res.text();

    // Optional: highlight active page
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link, .dropdown-item").forEach(a => {
      const href = a.getAttribute("href");
      if (href && href.includes(path)) a.classList.add("active");
    });

  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadNav);