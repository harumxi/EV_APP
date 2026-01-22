lucide.createIcons();

window.addEventListener("load", () => {
  const selected = localStorage.getItem("selectedVehicle");

  if (!selected) {
    window.location.href = "garage.html";
    return;
  }

  const vehicle = JSON.parse(selected);

  document.getElementById("evOwner").textContent =
    `Owner: ${vehicle.ownerName}`;

  document.getElementById("evBrand").textContent =
    vehicle.brand;

  document.getElementById("evModel").textContent =
    vehicle.model;

  document.getElementById("evIcon").textContent =
    vehicle.image || "🚗";

  const toggleBtn = document.getElementById("toggleAnalytics");
  const body = document.getElementById("analyticsBody");
  const chevron = document.getElementById("analyticsChevron");

  if (toggleBtn && body && chevron) {
    toggleBtn.addEventListener("click", () => {
      body.classList.toggle("hidden");
      chevron.classList.toggle("rotate");
    });
  }
});

function goToTripPlanner() {
  const selected = localStorage.getItem("selectedVehicle");

  if (!selected) {
    window.location.href = "garage.html";
    return;
  }

  window.location.href = "../UI_HTML/trip_planner.html";
}