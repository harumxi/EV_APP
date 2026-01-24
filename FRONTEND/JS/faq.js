document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();

  const helpDrawer = document.getElementById("helpDrawer");
  const helpPanel = document.getElementById("helpPanel");
  const helpBackdrop = document.getElementById("helpBackdrop");

  const openHelpBtn = document.getElementById("openHelpDrawer");
  const closeHelpBtn = document.getElementById("closeHelpDrawer");
  const helpOk = document.getElementById("helpOk");

  const faqList = document.getElementById("faqList");
  const faqSearch = document.getElementById("faqSearch");

  const helpContact = document.getElementById("helpContact");
  const helpReportBug = document.getElementById("helpReportBug");
  const helpReset = document.getElementById("helpReset");

  if (!helpDrawer || !helpPanel || !openHelpBtn) {
    console.error("Missing Help drawer elements. Check your IDs.");
    return;
  }

  function openDrawer() {
    helpDrawer.classList.remove("hidden");
    requestAnimationFrame(() => helpPanel.setAttribute("data-open", "true"));
    setTimeout(() => faqSearch?.focus(), 240);
  }

  function closeDrawer() {
    helpPanel.setAttribute("data-open", "false");
    setTimeout(() => helpDrawer.classList.add("hidden"), 220);
  }

  openHelpBtn.addEventListener("click", openDrawer);
  closeHelpBtn?.addEventListener("click", closeDrawer);
  helpBackdrop?.addEventListener("click", closeDrawer);
  helpOk?.addEventListener("click", closeDrawer);

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !helpDrawer.classList.contains("hidden")) {
      closeDrawer();
    }
  });

  // Accordion
  faqList?.querySelectorAll(".faq-item > button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const open = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", open ? "false" : "true");
    });
  });

  // Search filter
  faqSearch?.addEventListener("input", (e) => {
    const q = String(e.target.value || "").toLowerCase().trim();
    faqList?.querySelectorAll(".faq-item").forEach((item) => {
      const text = String(item.getAttribute("data-q") || "").toLowerCase();
      item.classList.toggle("hidden", q && !text.includes(q));
    });
  });

  // Quick actions (placeholders)
  helpContact?.addEventListener("click", () => {
    alert("Contact support clicked (hook this to your support link/chat).");
  });
  helpReportBug?.addEventListener("click", () => {
    alert("Report a bug clicked (hook this to your bug form).");
  });
  helpReset?.addEventListener("click", () => {
    alert("Reset settings clicked (hook this to your reset flow).");
  });
});
