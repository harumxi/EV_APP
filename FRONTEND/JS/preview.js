const intro = document.getElementById("intro-screen");

// Ensure the touch hint text is present
if (!intro.querySelector(".touch-hint")) {
  const hint = document.createElement("div");
  hint.className = "touch-hint";
  hint.textContent = "Touch anywhere to continue";
  intro.appendChild(hint);
}

function closeIntro() {
  intro.classList.add("fade-out-up");
  setTimeout(() => {
    intro.style.display = "none";
  }, 800);
}

document.addEventListener("click", closeIntro);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") closeIntro();
});
