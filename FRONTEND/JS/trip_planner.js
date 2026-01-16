lucide.createIcons();

const inputView = document.getElementById("input-view");
const resultsView = document.getElementById("results-view");
const proceedBtn = document.getElementById("proceed-btn");
const recalcBtn = document.getElementById("recalc-btn");
const startNavBtn = document.getElementById("start-nav");
const loading = document.getElementById("loading-overlay");

function showLoading(ms = 800) {
  loading.classList.remove("hidden");
  return new Promise((res) =>
    setTimeout(() => {
      loading.classList.add("hidden");
      res();
    }, ms)
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const batInput = document.getElementById("bat-input");
const batDisplay = document.getElementById("bat-display");
const energyTxt = document.getElementById("energy-txt");
const rangeTxt  = document.getElementById("range-txt");
const ringProgress = document.querySelector(".ring-progress");

const RING_R = 52;
const CIRC = 2 * Math.PI * RING_R;
ringProgress.style.strokeDasharray = `${CIRC}`;
ringProgress.style.strokeDashoffset = `${CIRC}`;

function setRing(percent){
  const p = clamp(Number(percent || 0), 0, 100);
  const offset = CIRC * (1 - p / 100);
  ringProgress.style.strokeDashoffset = `${offset}`;
}

function updateBattery(valRaw) {
  const val = clamp(Number(valRaw || 0), 0, 100);
  setRing(val);
  batDisplay.textContent = String(val);

  const kwh = (75 * val / 100);
  const km  = Math.round(val * 5);

  energyTxt.textContent = `${kwh.toFixed(1)} kWh`;
  rangeTxt.textContent  = `${km} km`;
}

if (!batInput.value) batInput.value = "75";
updateBattery(batInput.value);

batInput.addEventListener("input", (e) => {
  const raw = e.target.value;
  const temp = raw === "" ? 0 : Number(raw);
  const v = clamp(temp, 0, 100);
  setRing(v);
  batDisplay.textContent = String(v);
});
batInput.addEventListener("blur", () => updateBattery(batInput.value));

const PLACES = [
  { name: "SM Mall of Asia, Pasay", area: "Metro Manila" },
  { name: "Makati Central Business District", area: "Metro Manila" },
  { name: "BGC High Street, Taguig", area: "Metro Manila" },
  { name: "Quezon City Memorial Circle", area: "Metro Manila" },
  { name: "NAIA Terminal 3, Pasay", area: "Metro Manila" },
  { name: "Ortigas Center, Pasig", area: "Metro Manila" },
  { name: "UP Diliman, Quezon City", area: "Metro Manila" },
  { name: "Alabang Town Center, Muntinlupa", area: "Metro Manila" },
];

function mountSuggest(inputEl, listEl) {
  function render(query) {
    const q = (query || "").toLowerCase().trim();
    const items = PLACES
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 6);

    listEl.innerHTML = items.map((p) => `
      <div class="suggest-item" data-value="${p.name.replaceAll('"', "&quot;")}">
        <i data-lucide="map-pin" style="margin-top:2px;"></i>
        <div class="meta">
          <b>${p.name}</b>
          <span>${p.area}</span>
        </div>
      </div>
    `).join("");

    lucide.createIcons();
    listEl.style.display = items.length ? "block" : "none";
  }

  inputEl.addEventListener("focus", () => render(inputEl.value));
  inputEl.addEventListener("input", () => render(inputEl.value));

  listEl.addEventListener("click", (e) => {
    const row = e.target.closest(".suggest-item");
    if (!row) return;
    inputEl.value = row.getAttribute("data-value");
    listEl.style.display = "none";
  });

  document.addEventListener("click", (e) => {
    const within = listEl.contains(e.target) || inputEl.contains(e.target);
    if (!within) listEl.style.display = "none";
  });
}

const fromInput = document.getElementById("from-input");
const toInput = document.getElementById("to-input");
mountSuggest(fromInput, document.getElementById("from-suggest"));
mountSuggest(toInput, document.getElementById("to-suggest"));

const routesList = document.getElementById("routes-list");

const rdTitle = document.getElementById("rd-title");
const rdNote = document.getElementById("rd-note");
const rdEnergy = document.getElementById("rd-energy");
const rdArrival = document.getElementById("rd-arrival");
const rdEta = document.getElementById("rd-eta");

function updateRouteDetails(route) {
  rdTitle.textContent = route.name;
  rdNote.textContent = route.note || "—";
  rdEnergy.textContent = `${route.energy.toFixed(1)} kWh`;
  rdArrival.textContent = `${route.arrival}%`;
  rdEta.textContent = route.eta;
}

const ROUTES = [
  { name: "EDSA (Optimal)", energy: 0.9, arrival: 74, eta: "18 min", note: "Best balance of speed and energy use." },
  { name: "Bagumbong Road", energy: 1.2, arrival: 73, eta: "21 min", note: "Alternative route with fewer tolls." },
  { name: "C-5 (Less traffic)", energy: 1.0, arrival: 74, eta: "20 min", note: "Usually smoother during rush hours." },
  { name: "Skyway (Fastest)", energy: 1.4, arrival: 72, eta: "16 min", note: "Fastest but uses more energy." },
  { name: "Coastal Road", energy: 1.1, arrival: 73, eta: "22 min", note: "Scenic option, slightly longer." },
  { name: "Alternate Route", energy: 1.3, arrival: 72, eta: "24 min", note: "Fallback if primary roads are congested." },
];

let selectedRouteIndex = -1;

function renderRoutes() {
  routesList.innerHTML = ROUTES.map((r, i) => `
    <div class="route-card ${i === selectedRouteIndex ? "active" : ""}" data-idx="${i}" tabindex="0" role="button">
      <div class="route-title">
        <strong>${r.name}</strong>
        <small>ETA ${r.eta}</small>
      </div>
    </div>
  `).join("");
}
renderRoutes();

routesList.addEventListener("click", (e) => {
  const card = e.target.closest(".route-card");
  if (!card) return;
  const idx = Number(card.dataset.idx || 0);
  selectedRouteIndex = idx;
  renderRoutes();
  startNavBtn.disabled = (selectedRouteIndex === -1);
  updateRouteDetails(ROUTES[idx]);
});

startNavBtn.addEventListener("click", () => {
  if (selectedRouteIndex === -1) return;
  alert(`Starting navigation via: ${ROUTES[selectedRouteIndex].name}`);
});

function updateMapText() {
  document.getElementById("map-ph").textContent =
    `Map Preview: ${fromInput.value || "Start"} → ${toInput.value || "Destination"}`;
}

const routesPanel = document.getElementById("routes-panel");
const sheetHandle = document.getElementById("sheet-handle");

function isMobile() {
  return window.matchMedia("(max-width: 980px)").matches;
}

function setSheetOpen(open) {
  if (!isMobile()) return;
  routesPanel.classList.toggle("open", !!open);
}

function syncSheetMode() {
  if (isMobile()) {
    setSheetOpen(false);
  } else {
    routesPanel.classList.add("open");
  }
}
syncSheetMode();
window.addEventListener("resize", syncSheetMode);

sheetHandle.addEventListener("click", () => {
  if (!isMobile()) return;
  routesPanel.classList.toggle("open");
});

proceedBtn.onclick = async () => {
  await showLoading(900);
  inputView.classList.add("hidden");
  resultsView.classList.remove("hidden");

  updateMapText();
  selectedRouteIndex = -1;
  renderRoutes();
  startNavBtn.disabled = true;

  rdTitle.textContent = "Select a route";
  rdNote.textContent = "Route details will appear here.";
  rdEnergy.textContent = "—";
  rdArrival.textContent = "—";
  rdEta.textContent = "—";

  if (isMobile()) setSheetOpen(true);
  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

recalcBtn.onclick = async () => {
  await showLoading(700);
  resultsView.classList.add("hidden");
  inputView.classList.remove("hidden");
  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: "smooth" });
};