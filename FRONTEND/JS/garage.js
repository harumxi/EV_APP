// Sample EV database
const evDatabase = [
  {
    id: "tesla-model-3-rwd-2024",
    brand: "Tesla",
    model: "Model 3 RWD",
    year: 2024,
    officialRangeKm: 513,
    realWorldKm: 436,
    batteryKwh: 60,
    plugType: "Type 2 / CCS2",
    heroImage:
      "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "nissan-leaf-2024",
    brand: "Nissan",
    model: "LEAF",
    year: 2024,
    officialRangeKm: 311,
    realWorldKm: 260,
    batteryKwh: 40,
    plugType: "Type 2 / CHAdeMO",
    heroImage:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1b?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "byd-seal-2024",
    brand: "BYD",
    model: "Seal",
    year: 2024,
    officialRangeKm: 570,
    realWorldKm: 480,
    batteryKwh: 82,
    plugType: "Type 2 / CCS2",
    heroImage:
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1400&q=80"
  }
];

// Garage state
let garage = [
  {
    garageId: crypto.randomUUID(),
    evId: "tesla-model-3-rwd-2024",
    nickname: null,
    isActive: true
  }
];

let pendingDeleteGarageId = null;
let openSpecsGarageId = null;

// DOM
const searchInput = document.getElementById("searchInput");
const resultsWrap = document.getElementById("resultsWrap");
const vehiclesGrid = document.getElementById("vehiclesGrid");
const emptyState = document.getElementById("emptyState");
const carCount = document.getElementById("carCount");

const specsModal = document.getElementById("specsModal");
const closeSpecs = document.getElementById("closeSpecs");
const specsHero = document.getElementById("specsHero");
const specsBrand = document.getElementById("specsBrand");
const specsModel = document.getElementById("specsModel");
const specsYear = document.getElementById("specsYear");
const specsOfficial = document.getElementById("specsOfficial");
const specsReal = document.getElementById("specsReal");
const specsBattery = document.getElementById("specsBattery");
const specsPlug = document.getElementById("specsPlug");
const setActiveBtn = document.getElementById("setActiveBtn");
const activeBtnText = document.getElementById("activeBtnText");

const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

function findEVById(evId) {
  return evDatabase.find((e) => e.id === evId);
}

function normalize(s) {
  return (s || "").toString().toLowerCase().trim();
}

function searchEVs(query) {
  const q = normalize(query);
  if (!q) return [];
  return evDatabase
    .filter((ev) => normalize(ev.brand + " " + ev.model).includes(q))
    .slice(0, 6);
}

function isInGarage(evId) {
  return garage.some((g) => g.evId === evId);
}

function addToGarage(evId) {
  if (isInGarage(evId)) return;
  garage.push({
    garageId: crypto.randomUUID(),
    evId,
    nickname: null,
    isActive: garage.length === 0
  });
  renderGarage();
}

function removeFromGarage(garageId) {
  garage = garage.filter((g) => g.garageId !== garageId);
  if (garage.length > 0 && !garage.some((g) => g.isActive)) {
    garage[0].isActive = true;
  }
  renderGarage();
}

function setActive(garageId) {
  garage = garage.map((g) => ({ ...g, isActive: g.garageId === garageId }));
  renderGarage();
}

// --- Search results (COMPACT) ---
function renderResults(list) {
  if (!searchInput.value.trim()) {
    resultsWrap.classList.add("hidden");
    resultsWrap.innerHTML = "";
    return;
  }

  resultsWrap.classList.remove("hidden");

  if (list.length === 0) {
    resultsWrap.innerHTML = `
      <div class="result-row rounded-xl px-4 py-3 text-left">
        <p class="text-gray-700 font-medium text-sm">No matches found.</p>
        <p class="text-gray-500 text-xs mt-1">Try searching “Tesla”, “Nissan”, “BYD”, etc.</p>
      </div>
    `;
    return;
  }

  resultsWrap.innerHTML = list
    .map((ev) => {
      const disabled = isInGarage(ev.id);
      return `
        <div class="result-row rounded-xl px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
              EV
            </div>
            <div class="text-left leading-tight">
              <div class="text-base font-bold text-gray-900">${ev.brand} ${ev.model}</div>
              <div class="text-xs text-gray-500">${ev.year} • ${ev.officialRangeKm} km</div>
            </div>
          </div>

          <button
            data-evid="${ev.id}"
            class="addBtn text-sm font-semibold text-gray-900 hover:text-black disabled:text-gray-300 disabled:cursor-not-allowed"
            ${disabled ? "disabled" : ""}
            title="${disabled ? "Already in your garage" : "Add to garage"}"
          >
            Add +
          </button>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".addBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const evId = e.currentTarget.getAttribute("data-evid");
      addToGarage(evId);
      renderResults(searchEVs(searchInput.value));
    });
  });
}

// --- Garage cards (three dots -> opens specs modal; NO Specs button) ---
function renderGarage() {
  carCount.textContent = String(garage.length);

  if (garage.length === 0) {
    vehiclesGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  vehiclesGrid.innerHTML = garage
    .map((g) => {
      const ev = findEVById(g.evId);
      const activePill = g.isActive
        ? `<div class="absolute top-3 left-3 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold shadow-soft">
             Active
           </div>`
        : "";

      return `
        <div class="rounded-3xl overflow-hidden bg-white border border-gray-200/70 shadow-soft ${g.isActive ? "card-border" : ""}">
          <div class="relative">
            ${activePill}

            <!-- three dots -->
            <button class="menuBtn absolute top-3 right-3 w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-gray-200 flex items-center justify-center"
                    data-gid="${g.garageId}"
                    title="More">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>

            <img src="${ev.heroImage}" alt="${ev.brand} ${ev.model}" class="h-52 w-full object-cover"/>
          </div>

          <div class="p-5 bg-gray-50/60">
            <div class="flex items-end justify-between">
              <div>
                <div class="text-xs font-bold text-gray-500 uppercase tracking-wide">${ev.brand}</div>
                <div class="text-2xl font-extrabold leading-tight">${ev.model}</div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-extrabold">${ev.officialRangeKm}</div>
                <div class="text-xs font-bold text-gray-600 -mt-1">KM RANGE</div>
              </div>
            </div>

            <div class="mt-4 flex gap-2">
              <button class="deleteBtn flex-1 h-11 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-bold"
                      data-gid="${g.garageId}">
                Delete
              </button>
              <button class="activeBtn flex-1 h-11 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold"
                      data-gid="${g.garageId}">
                Set Active
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".deleteBtn").forEach((b) =>
    b.addEventListener("click", (e) => openDelete(e.currentTarget.dataset.gid))
  );
  document.querySelectorAll(".activeBtn").forEach((b) =>
    b.addEventListener("click", (e) => setActive(e.currentTarget.dataset.gid))
  );
  document.querySelectorAll(".menuBtn").forEach((b) =>
    b.addEventListener("click", (e) => openSpecs(e.currentTarget.dataset.gid))
  );
}

// --- Specs modal open/close ---
function openSpecs(garageId) {
  openSpecsGarageId = garageId;
  const g = garage.find((x) => x.garageId === garageId);
  if (!g) return;
  const ev = findEVById(g.evId);

  specsHero.innerHTML = `<img src="${ev.heroImage}" class="w-full h-full object-cover" alt="${ev.brand} ${ev.model}" />`;

  specsBrand.textContent = ev.brand.toUpperCase();
  specsModel.textContent = ev.model;
  specsYear.textContent = String(ev.year);
  specsOfficial.textContent = String(ev.officialRangeKm);
  specsReal.textContent = String(ev.realWorldKm);
  specsBattery.textContent = String(ev.batteryKwh);
  specsPlug.textContent = ev.plugType;

  activeBtnText.textContent = g.isActive ? "Currently Active" : "Set as Active";
  specsModal.classList.add("active");
}

function closeSpecsModal() {
  specsModal.classList.remove("active");
  openSpecsGarageId = null;
}

setActiveBtn.addEventListener("click", () => {
  if (!openSpecsGarageId) return;
  setActive(openSpecsGarageId);
  closeSpecsModal();
});

closeSpecs.addEventListener("click", closeSpecsModal);

specsModal.addEventListener("click", (e) => {
  if (e.target === specsModal) closeSpecsModal();
});

// --- Delete modal ---
function openDelete(garageId) {
  pendingDeleteGarageId = garageId;
  deleteModal.classList.add("active");
}
function closeDelete() {
  pendingDeleteGarageId = null;
  deleteModal.classList.remove("active");
}
cancelDelete.addEventListener("click", closeDelete);
confirmDelete.addEventListener("click", () => {
  if (pendingDeleteGarageId) removeFromGarage(pendingDeleteGarageId);
  closeDelete();
});
deleteModal.addEventListener("click", (e) => {
  if (e.target === deleteModal) closeDelete();
});

// --- Search wiring ---
searchInput.addEventListener("input", () => {
  renderResults(searchEVs(searchInput.value));
});

// escape key closes modals
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSpecsModal();
    closeDelete();
  }
});

// initial render
renderGarage();