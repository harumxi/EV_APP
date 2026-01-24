const stations = [
  { id: 1, name: "Poblacion, Manila", location: "Metro Manila", eta: "18 min", power: "150 kW", available: "6/10", battery: "10%", energy: "15 kWh", mapX: "45%", mapY: "50%", chargerType: 1 },
  { id: 2, name: "Cebu IT Park Free", location: "Cebu City", eta: "45 min", power: "120 kW", available: "4/8", free: true, mapX: "70%", mapY: "30%", chargerType: 2 },
  { id: 3, name: "BGC Taguig", location: "BGC Taguig", eta: "1 hr 10 min", power: "150 kW", available: "7/10", mapX: "55%", mapY: "65%", chargerType: 3 },
  { id: 4, name: "Clark Freeport Zone", location: "Clark Freeport Zone", eta: "1 hr 25 min", power: "150 kW", available: "8/10", mapX: "60%", mapY: "80%", chargerType: 1 },
  { id: 5, name: "Manila Bay Area", location: "Metro Manila", eta: "22 min", power: "150 kW", available: "5/10", mapX: "25%", mapY: "45%", chargerType: 2 },
  { id: 6, name: "Makati Central", location: "Makati", eta: "35 min", power: "150 kW", available: "9/10", mapX: "48%", mapY: "55%", chargerType: 3 },
  { id: 7, name: "Quezon City Hub", location: "Quezon City", eta: "28 min", power: "150 kW", available: "3/10", mapX: "35%", mapY: "25%", chargerType: 1 },
  { id: 8, name: "Pasig Station", location: "Pasig", eta: "40 min", power: "150 kW", available: "6/10", mapX: "65%", mapY: "45%", chargerType: 2 },
];

let selectedId = null;
let filterType = null;
let panelOpen = window.matchMedia("(min-width: 1024px)").matches;

const markersEl = document.getElementById("markers");
const popupEl = document.getElementById("popup");
const panelEl = document.getElementById("panel");
const listEl = document.getElementById("list");
const overlayEl = document.getElementById("overlay");
const toggleBtn = document.getElementById("toggleBtn");
const toggleText = document.getElementById("toggleText");
const toggleChev = document.getElementById("toggleChev");

const pt = (id) => document.getElementById(id);

function setPopup(station) {
  pt("popupTitle").textContent = station.name;
  pt("popupSub").textContent = station.location;
  pt("popupPower").textContent = `${station.power} max`;
  pt("popupEta").textContent = station.eta;
  pt("popupBattery").textContent = station.battery ? `Battery Consumption: ${station.battery}` : "";
  pt("popupEnergy").textContent = station.energy ? `Energy: ${station.energy}` : "";
}

function showPopup(station) {
  popupEl.classList.remove("hidden");
  popupEl.style.left = station.mapX;
  popupEl.style.top = station.mapY;
  setPopup(station);
}

function hidePopup() {
  popupEl.classList.add("hidden");
}

function renderMarkers() {
  markersEl.innerHTML = "";
  stations.forEach((s) => {
    const m = document.createElement("div");
    m.className = "marker";
    m.style.left = s.mapX;
    m.style.top = s.mapY;
    if (filterType && s.chargerType !== filterType) m.style.opacity = "0.35";

    const dot = document.createElement("div");
    dot.className = "dot";
    dot.textContent = "⚡";

    if (selectedId === s.id) m.classList.add("active");

    m.appendChild(dot);

    m.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedId = s.id;
      renderAll();
      showPopup(s);
      if (!window.matchMedia("(min-width: 1024px)").matches) closePanel();
    });

    markersEl.appendChild(m);
  });
}

function renderList() {
  const data = filterType ? stations.filter((s) => s.chargerType === filterType) : stations;

  listEl.innerHTML = "";
  data.forEach((s) => {
    const card = document.createElement("div");
    card.className = "card" + (selectedId === s.id ? " active" : "");

    const row = document.createElement("div");
    row.className = "card-row";

    const pin = document.createElement("div");
    pin.className = "pin";
    pin.textContent = "📍";

    const left = document.createElement("div");
    left.style.minWidth = "0";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = s.name;

    if (s.free) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "Free";
      title.appendChild(badge);
    }

    const sub = document.createElement("div");
    sub.className = "card-sub";
    sub.textContent = s.location;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${s.available} available`;

    left.appendChild(title);
    left.appendChild(sub);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "right";
    right.innerHTML = `<div class="eta">${s.eta}</div><div class="kw">${s.power}</div>`;

    row.appendChild(pin);
    row.appendChild(left);
    row.appendChild(right);

    card.appendChild(row);

    card.addEventListener("click", () => {
      selectedId = s.id;
      renderAll();
      showPopup(s);
      if (!window.matchMedia("(min-width: 1024px)").matches) closePanel();
    });

    listEl.appendChild(card);
  });
}

function openPanel() {
  panelOpen = true;
  panelEl.classList.add("show");
  panelEl.classList.remove("hidden");
  overlayEl.classList.remove("hidden");
  toggleText.textContent = "Hide";
  toggleChev.textContent = "›";
}

function closePanel() {
  panelOpen = false;
  panelEl.classList.remove("show");
  overlayEl.classList.add("hidden");
  toggleText.textContent = "Show";
  toggleChev.textContent = "‹";
}

function syncPanelOnResize() {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  if (isDesktop) {
    panelEl.classList.remove("hidden");
    panelEl.classList.add("show");
    overlayEl.classList.add("hidden");
    toggleText.textContent = "Hide";
    toggleChev.textContent = "›";
    panelOpen = true;
  } else {
    panelEl.classList.add("hidden");
    panelEl.classList.remove("show");
    overlayEl.classList.add("hidden");
    toggleText.textContent = "Show";
    toggleChev.textContent = "‹";
    panelOpen = false;
  }
}

function renderTypes() {
  document.querySelectorAll(".type").forEach((btn) => {
    const t = Number(btn.dataset.type);
    btn.classList.toggle("active", filterType === t);
    btn.onclick = () => {
      filterType = filterType === t ? null : t;
      renderAll();
    };
  });
}

function renderAll() {
  renderMarkers();
  renderList();
  renderTypes();
}

toggleBtn.addEventListener("click", () => {
  if (panelOpen) closePanel();
  else openPanel();
});

overlayEl.addEventListener("click", () => closePanel());

document.body.addEventListener("click", () => {
  selectedId = null;
  hidePopup();
  renderAll();
});

window.addEventListener("resize", syncPanelOnResize);

syncPanelOnResize();
renderAll();
