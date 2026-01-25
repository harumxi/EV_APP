JS
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();

  const aboutDrawer = document.getElementById("aboutDrawer");
  const aboutPanel = document.getElementById("aboutPanel");
  const aboutBackdrop = document.getElementById("aboutBackdrop");

  const openAboutBtn = document.getElementById("openAboutDrawer");
  const closeAboutBtn = document.getElementById("closeAboutDrawer");
  const aboutOk = document.getElementById("aboutOk");

  // ✅ If any element is missing, stop (prevents crashing)
  if (!openAboutBtn || !aboutDrawer || !aboutPanel) {
    console.error("❌ Missing drawer elements. Check your IDs in about.html.");
    return;
  }

  function openDrawer() {
    aboutDrawer.classList.remove("hidden");
    requestAnimationFrame(() => aboutPanel.setAttribute("data-open", "true"));
  }

  function closeDrawer() {
    aboutPanel.setAttribute("data-open", "false");
    setTimeout(() => aboutDrawer.classList.add("hidden"), 220);
  }

  openAboutBtn.addEventListener("click", openDrawer);

  if (closeAboutBtn) closeAboutBtn.addEventListener("click", closeDrawer);
  if (aboutOk) aboutOk.addEventListener("click", closeDrawer);
  if (aboutBackdrop) aboutBackdrop.addEventListener("click", closeDrawer);

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !aboutDrawer.classList.contains("hidden")) {
      closeDrawer();
    }
  });

  // Auto-open if requested via URL
  const params = new URLSearchParams(window.location.search);
  if (params.get("open") === "true") {
    setTimeout(openDrawer, 100);
  }
});
