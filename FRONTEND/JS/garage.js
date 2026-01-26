// ===== AUTH GUARD =====
const USER_ID = localStorage.getItem("user_id");
if (!USER_ID) {
  window.location.href = "login.html";
}

const API_URL = "http://localhost/WEBPROG_PROJ/BACKEND/API/GARAGE";

// ===== ELEMENTS =====
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

const dashboardBtn = document.getElementById("dashboardBtn");

let pendingDeleteGarageId = null;
let openSpecsGarageId = null;
let currentGarageCars = [];

// ===== MODALS =====
closeSpecs?.addEventListener("click", closeSpecsModal);
specsModal?.addEventListener("click", (e) => { if (e.target === specsModal) closeSpecsModal(); });

setActiveBtn?.addEventListener("click", () => {
  if (!openSpecsGarageId) return;
  setActive(openSpecsGarageId);
  closeSpecsModal();
});

cancelDelete?.addEventListener("click", () => {
  closeDelete();
});

confirmDelete?.addEventListener("click", async () => {
  if (!pendingDeleteGarageId) return;
  await removeCar(pendingDeleteGarageId);
  closeDelete();
});

dashboardBtn?.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

function closeDelete() {
  pendingDeleteGarageId = null;
  deleteModal.classList.remove("active");
  const dialog = deleteModal.querySelector('div');
  if (dialog) {
    dialog.style.removeProperty('background-color');
    dialog.style.removeProperty('backdrop-filter');
    dialog.style.removeProperty('-webkit-backdrop-filter');
  }
}

function updateHeaderInfo() {
  const headerUser = document.getElementById('header-user-name');
  const headerCar = document.getElementById('header-car-name');
  if(headerUser) headerUser.textContent = localStorage.getItem('full_display_name') || 'User';
  
  const activeCar = currentGarageCars.find(c => parseInt(c.is_active) === 1);
  if(headerCar && activeCar) {
      headerCar.textContent = `${activeCar.brand_name} ${activeCar.model_name}`;
  }
}

function closeAdd() {
  if (searchInput) searchInput.value = "";
  if (resultsWrap) {
    resultsWrap.innerHTML = "";
    resultsWrap.classList.add("hidden");
  }
}

function closeSpecsModal() {
  specsModal?.classList.remove("active");
  openSpecsGarageId = null;
}

function renderSkeletons() {
  vehiclesGrid.innerHTML = Array(4).fill(0).map(() => `
    <div class="vehicle-card overflow-hidden">
      <div class="skeleton h-40 w-full"></div>
      <div class="p-4 space-y-3">
        <div class="skeleton h-4 w-1/3 rounded"></div>
        <div class="skeleton h-6 w-2/3 rounded"></div>
        <div class="flex gap-2 pt-2">
          <div class="skeleton h-10 flex-1 rounded-xl"></div>
          <div class="skeleton h-10 flex-1 rounded-xl"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== LOAD GARAGE =====
async function loadGarage() {
  renderSkeletons();
  emptyState.classList.add("hidden");
  carCount.textContent = "0";

  try {
    const res = await fetch(`${API_URL}/list.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID }),
    });

    const data = await res.json();

    if (!data.ok) {
      vehiclesGrid.innerHTML = `
        <div class="col-span-full p-8 text-center bg-red-50/50 border border-red-100 rounded-[32px]">
          <div class="text-red-500 font-bold mb-2">Unable to load your garage</div>
          <p class="text-xs text-red-400 mb-4">Please check your connection and try again.</p>
          <button onclick="loadGarage()" class="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg">Retry</button>
        </div>
      `;
      return;
    }

    const cars = data.cars || [];
    currentGarageCars = cars;
    carCount.textContent = String(cars.length);
    updateHeaderInfo();
    if (cars.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    cars.forEach((car) => {
      const isActive = parseInt(car.is_active) === 1;

      const card = document.createElement("div");
      card.className = `group relative flex flex-col rounded-[24px] border border-white/40 overflow-hidden transition-all duration-500 hover:-translate-y-1 mb-4 ${isActive ? 'ring-2 ring-white/60' : ''}`;
      
      card.style.setProperty('background-color', 'rgba(255, 255, 255, 0.3)', 'important');
      card.style.setProperty('backdrop-filter', 'blur(16px)', 'important');
      card.style.setProperty('-webkit-backdrop-filter', 'blur(16px)', 'important');
      card.style.setProperty('box-shadow', '0 4px 30px rgba(0, 0, 0, 0.1)', 'important');

      card.innerHTML = `
        <!-- Radial Glow -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_70%)] pointer-events-none"></div>

        <!-- Image Header -->
        <div class="relative h-48 w-full overflow-hidden">
          <img src="${car.image || 'https://via.placeholder.com/400x200?text=No+Image'}" 
               alt="${car.brand_name}" 
               class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
          
          <!-- Active Pill -->
          ${isActive ? `
            <div class="absolute top-4 left-4 px-3 py-1 rounded-full bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider shadow-lg border border-white/10">
              ACTIVE
            </div>
          ` : ""}

          <!-- 3-Dot Menu -->
          <button data-action="specs" data-id="${car.garage_id}" 
                  class="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/40 flex items-center justify-center text-gray-900 hover:bg-white transition-all shadow-sm active:scale-95"
                  title="View Specs">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-4 flex flex-col flex-1">
          <div class="flex justify-between items-start mb-1">
            <div class="min-w-0">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">${escapeHtml(car.brand_name)}</p>
              <h3 class="text-sm font-bold text-gray-900 truncate leading-tight">
                ${escapeHtml(car.nickname || car.model_name)}
              </h3>
            </div>
            <div class="text-right shrink-0">
              <p class="text-base font-black text-gray-900">${Math.round(car.range_km || 0)}</p>
              <p class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter -mt-1">KM RANGE</p>
            </div>
          </div>
          
          <div class="text-[11px] text-gray-600 font-medium mb-4">
            ${escapeHtml(car.variant_name)} • ${car.battery_capacity_kwh} kWh
          </div>

          <!-- Actions -->
          <div class="mt-auto flex gap-2 pt-2">
            <button data-action="delete" data-id="${car.garage_id}" 
                    class="flex-1 h-10 text-xs font-bold rounded-xl border border-gray-200 bg-white/50 text-gray-600 hover:bg-white hover:text-red-600 hover:border-red-100 transition-all">
              Delete
            </button>
            ${!isActive ? `
              <button data-action="active" data-id="${car.garage_id}" 
                      class="flex-1 h-10 text-xs font-bold rounded-xl bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/10 transition-all active:scale-95">
                Set Active
              </button>
            ` : `
              <div class="flex-1 h-10 flex items-center justify-center text-[10px] font-bold text-emerald-700 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                Currently Active
              </div>
            `}
          </div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);

        if (action === "active") setActive(id);
        if (action === "delete") openDeleteModal(id);
        if (action === "specs") openSpecs(id);
      });

      vehiclesGrid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    vehiclesGrid.innerHTML = `<div class="col-span-full p-8 text-center text-red-500">Connection error</div>`;
  }
}

function openSpecs(garageId) {
  openSpecsGarageId = garageId;
  const car = currentGarageCars.find((c) => parseInt(c.garage_id) === garageId);
  if (!car) return;

  if (specsHero) specsHero.innerHTML = `<img src="${car.image || 'https://via.placeholder.com/400x200?text=No+Image'}" class="w-full h-full object-cover" alt="${car.brand_name}" />`;
  if (specsBrand) specsBrand.textContent = car.brand_name.toUpperCase();
  if (specsModel) specsModel.textContent = car.model_name;
  if (specsYear) specsYear.textContent = String(car.year || '2024');
  if (specsOfficial) specsOfficial.textContent = Math.round(car.range_km || 0);
  if (specsReal) specsReal.textContent = Math.round((car.range_km || 0) * 0.85);
  if (specsBattery) specsBattery.textContent = car.battery_capacity_kwh;
  if (specsPlug) specsPlug.textContent = car.variant_name || 'Type 2';

  if (activeBtnText) activeBtnText.textContent = (parseInt(car.is_active) === 1) ? "Currently Active" : "Set as Active";
  
  specsModal?.classList.add("active");
}

function openDeleteModal(garageId) {
  pendingDeleteGarageId = garageId;
  const dialog = deleteModal.querySelector('div');
  if (dialog) dialog.className = "modal-dialog p-6 max-w-xs text-center";
  
  deleteModal.classList.add("active");
}

// ===== SEARCH =====
document.getElementById("searchCarBtn")?.addEventListener("click", doSearch);
searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;

  resultsWrap.innerHTML = `<div class="text-center text-xs text-gray-500 py-4 italic">Searching...</div>`;

  try {
    const res = await fetch(`${API_URL}/garage_search.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: q }),
    });

    const data = await res.json();

    if (!data.ok) {
      resultsWrap.innerHTML = `<div class="text-center text-xs text-red-500 py-4">Search failed</div>`;
      return;
    }

    const results = data.results || [];
    if (results.length === 0) {
      resultsWrap.innerHTML = `<div class="result-row rounded-xl px-4 py-3 text-left text-sm text-gray-700">No matches found.</div>`;
      return;
    }

    resultsWrap.innerHTML = "";
    results.forEach((r) => {
      const row = document.createElement("div");
      row.className = "result-row rounded-xl px-4 py-3 flex items-center justify-between";

      row.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">EV</div>
          <div class="text-left leading-tight">
            <div class="text-base font-bold text-gray-900">${escapeHtml(r.brand_name)} ${escapeHtml(r.model_name)}</div>
            <div class="text-xs text-gray-500">${r.year || '2024'} • ${Math.round(r.range_km || 0)} km</div>
          </div>
        </div>
        <button data-evid="${r.variant_id}" class="addBtn text-sm font-semibold text-gray-900 hover:text-black">Add +</button>
      `;

      row.querySelector(".addBtn").addEventListener("click", async () => {
        await addCar(r.variant_id);
        closeAdd();
      });
      resultsWrap.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    resultsWrap.innerHTML = `<div class="result-row rounded-xl px-4 py-3 text-left text-xs text-red-500">Connection error</div>`;
  }
}

// ===== ADD =====
async function addCar(variantId) {
  const nickname = ""; // Simplified for current UI consistency

  try {
    const res = await fetch(`${API_URL}/add.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, variant_id: variantId, nickname }),
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error || "Failed to add vehicle");
      return;
    }

    closeAdd();
    await loadGarage();
  } catch (err) {
    console.error(err);
    alert("Connection error");
  }
}

// ===== SET ACTIVE =====
async function setActive(garageId) {
  try {
    await fetch(`${API_URL}/set_active.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, garage_id: garageId }),
    });
    await loadGarage();
  } catch (err) {
    console.error(err);
  }
}

// ===== REMOVE =====
async function removeCar(garageId) {
  try {
    await fetch(`${API_URL}/remove.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, garage_id: garageId }),
    });
    await loadGarage();
  } catch (err) {
    console.error(err);
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Polish Hero Area & Section Labels
document.addEventListener("DOMContentLoaded", () => {
  // Add Scoped Wrapper
  document.body.classList.add('garage-ui');
  document.querySelector('main')?.classList.add('garage-ui');
  
  const heroTitle = document.querySelector('h1');
  if (heroTitle) {
    heroTitle.classList.remove('text-4xl');
    heroTitle.classList.add('text-3xl', 'tracking-tight', 'text-gray-900');
  }
  const sectionLabels = document.querySelectorAll('h2');
  sectionLabels.forEach(l => l.classList.add('text-gray-900', 'font-black', 'tracking-tight'));
});

// INIT
loadGarage();
