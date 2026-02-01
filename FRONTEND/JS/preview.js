const getStartedBtn = document.getElementById("getStartedBtn");

getStartedBtn.addEventListener("click", () => {
  window.location.href = "../HTML/login.html";
});

// Scroll Animation Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.1 });

const hiddenElements = document.querySelectorAll(".about h2, .about-details, .car-item, .contact-info, .section-footer");
hiddenElements.forEach((el) => observer.observe(el));
