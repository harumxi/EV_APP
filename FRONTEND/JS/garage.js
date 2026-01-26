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

// ===== LOAD GARAGE =====
async function loadGarage() {
  vehiclesGrid.innerHTML = "";
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
      vehiclesGrid.innerHTML = `<div class="p-4 text-center text-red-500 bg-white/40 backdrop-blur-md rounded-[20px] border border-white/40">Failed to load garage</div>`;
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
      card.className = `group relative flex flex-col rounded-[24px] border border-white/40 bg-white/40 backdrop-blur-md overflow-hidden shadow-sm transition-all duration-500 hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 mb-4 ${isActive ? 'ring-2 ring-white/60' : ''}`;

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
        <div class="p-5 flex flex-col flex-1">
          <div class="flex justify-between items-start mb-1">
            <div class="min-w-0">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">${escapeHtml(car.brand_name)}</p>
              <h3 class="text-lg font-bold text-gray-900 truncate leading-tight">
                ${escapeHtml(car.nickname || car.model_name)}
              </h3>
            </div>
            <div class="text-right shrink-0">
              <p class="text-xl font-black text-gray-900">${Math.round(car.range_km || 0)}</p>
              <p class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter -mt-1">KM RANGE</p>
            </div>
          </div>
          
          <div class="text-xs text-gray-600 font-medium mb-4">
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
    vehiclesGrid.innerHTML = `<div class="p-4 text-center text-red-500 bg-white/40 backdrop-blur-md rounded-[20px] border border-white/40">Connection error</div>`;
  }
}

function openSpecs(garageId) {
  openSpecsGarageId = garageId;
  const car = currentGarageCars.find((c) => parseInt(c.garage_id) === garageId);
  if (!car) return;

  // Apply Glassy Modal Container Styles
  const dialog = specsModal.querySelector('div');
  if (dialog) {
    dialog.className = "relative w-full max-w-[280px] border border-white/40 rounded-[32px] shadow-xl overflow-hidden mx-4 animate-in fade-in zoom-in duration-300";
    dialog.style.setProperty('background-color', 'rgba(255, 255, 255, 0.4)', 'important');
    dialog.style.setProperty('backdrop-filter', 'blur(12px)', 'important');
    dialog.style.setProperty('-webkit-backdrop-filter', 'blur(12px)', 'important');
  }
  
  if (closeSpecs) closeSpecs.className = "absolute top-3 right-3 z-20 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-gray-900 hover:bg-white/40 transition-all active:scale-90 shadow-sm";

  if (specsModal) {
    specsModal.style.setProperty('background-color', 'rgba(0, 0, 0, 0.2)', 'important');
    specsModal.style.setProperty('backdrop-filter', 'blur(8px)', 'important');
    specsModal.style.setProperty('-webkit-backdrop-filter', 'blur(8px)', 'important');
  }

  if (specsHero) {
    specsHero.className = "relative h-24 w-full overflow-hidden bg-transparent";
    specsHero.innerHTML = `
      <img src="${car.image || 'https://via.placeholder.com/400x200?text=No+Image'}" class="w-full h-full object-cover" alt="${car.brand_name}" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
    `;
  }

  const content = specsModal.querySelector('.p-6');
  if (content) content.className = "p-3";

  const tileGrid = specsModal.querySelector('.grid.grid-cols-2');
  if (tileGrid) tileGrid.className = "grid grid-cols-2 gap-1.5 mt-2";

  if (specsBrand) {
    specsBrand.className = "text-[6px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-0.5";
    specsBrand.textContent = car.brand_name.toUpperCase();
  }
  if (specsModel) {
    specsModel.className = "text-xs font-black text-gray-900 leading-tight";
    specsModel.textContent = car.model_name;
  }
  if (specsYear) {
    specsYear.className = "px-1 py-0.5 rounded-md bg-gray-900/5 border border-gray-900/10 text-[5px] font-bold text-gray-500";
    specsYear.textContent = car.year || '2024';
  }

  // Restyle Stat Tiles
  specsModal.querySelectorAll('.tile').forEach(tile => {
    tile.className = "tile flex flex-col justify-center bg-white/20 backdrop-blur-md border border-white/20 rounded-[16px] p-2 h-14 transition-all hover:bg-white/30";
    const labels = tile.querySelectorAll('p');
    if (labels[0]) labels[0].className = "text-[6px] font-bold text-gray-400 uppercase tracking-widest mb-0.5";
    if (labels[1]) labels[1].className = "text-xs font-black text-gray-900 leading-none";
  });

  if (specsOfficial) specsOfficial.textContent = Math.round(car.range_km || 0);
  if (specsReal) specsReal.textContent = Math.round((car.range_km || 0) * 0.85);
  if (specsBattery) specsBattery.textContent = car.battery_capacity_kwh;
  if (specsPlug) specsPlug.textContent = car.plug_type || 'Type 2';

  if (setActiveBtn) {
    setActiveBtn.className = "mt-3 w-full h-8 rounded-lg bg-gray-900 text-white font-bold text-[9px] shadow-lg shadow-gray-900/10 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 relative";
    if (activeBtnText) activeBtnText.textContent = (parseInt(car.is_active) === 1) ? "Currently Active" : "Set as Active";
  }
  
  specsModal?.classList.add("active");
}

function openDeleteModal(garageId) {
  pendingDeleteGarageId = garageId;
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
      resultsWrap.innerHTML = `<div class="text-center text-xs text-gray-500 py-4">No results found.</div>`;
      return;
    }

    resultsWrap.innerHTML = "";
    results.forEach((r) => {
      const row = document.createElement("div");
      row.className = "group relative flex items-center justify-between p-4 rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-md mb-3 hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 shadow-sm";

      row.innerHTML = `
        <!-- Radial Glow -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3),transparent_60%)] pointer-events-none"></div>

        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold text-gray-900 truncate">${escapeHtml(r.brand_name)} ${escapeHtml(r.model_name)}</div>
          <div class="text-[11px] text-gray-500 mt-1 truncate font-medium">${escapeHtml(r.variant_name)} • ${r.battery_capacity_kwh} kWh</div>
        </div>
        <button class="ml-4 px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-black text-[11px] font-bold shadow-md transition-all active:scale-95">Add +</button>
      `;

      row.querySelector("button").addEventListener("click", async () => {
        await addCar(r.variant_id);
      });

      resultsWrap.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    resultsWrap.innerHTML = `<div class="text-center text-xs text-red-500 py-4">Connection error</div>`;
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
  const header = document.querySelector('header');
  if (header) {
    header.style.setProperty('background-color', 'rgba(255, 255, 255, 0.55)', 'important');
    header.style.setProperty('backdrop-filter', 'blur(18px)', 'important');
    header.style.setProperty('-webkit-backdrop-filter', 'blur(18px)', 'important');
    header.style.setProperty('border-bottom', '1px solid rgba(255, 255, 255, 0.3)', 'important');
  }

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
