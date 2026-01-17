// ===== AUTH GUARD =====
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !currentUser.id) {
  window.location.href = "login.html";
}

const USER_ID = currentUser.id;
const API_URL = "http://localhost/WEBPROG_PROJ/BACKEND/api/GARAGE";

// ===== ELEMENTS =====
const addCarBtn = document.getElementById("addCarBtn");
const addModal = document.getElementById("addModal");
const deleteModal = document.getElementById("deleteModal");

const closeAddModal = document.getElementById("closeAddModal");
const cancelAdd = document.getElementById("cancelAdd");

const searchCarBtn = document.getElementById("searchCarBtn");
const searchCarInput = document.getElementById("searchCarInput");
const ownerNameInput = document.getElementById("ownerName");
const searchResults = document.getElementById("searchResults");

const vehicleGrid = document.getElementById("vehicleGrid");
const emptyState = document.getElementById("emptyState");

const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

let pendingDeleteGarageId = null;

// ===== MODALS =====
addCarBtn?.addEventListener("click", () => {
  addModal.style.display = "flex";
});

closeAddModal?.addEventListener("click", closeAdd);
cancelAdd?.addEventListener("click", closeAdd);

function closeAdd() {
  addModal.style.display = "none";
  searchResults.innerHTML = `<div class="text-center text-sm text-gray-500 py-4">Results will appear here...</div>`;
  searchCarInput.value = "";
  ownerNameInput.value = "";
}

cancelDelete?.addEventListener("click", () => {
  pendingDeleteGarageId = null;
  deleteModal.style.display = "none";
});

confirmDelete?.addEventListener("click", async () => {
  if (!pendingDeleteGarageId) return;
  await removeCar(pendingDeleteGarageId);
  pendingDeleteGarageId = null;
  deleteModal.style.display = "none";
});

// ===== LOAD GARAGE =====
async function loadGarage() {
  vehicleGrid.innerHTML = "";
  emptyState.classList.add("hidden");

  try {
    const res = await fetch(`${API_URL}/list.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID }),
    });

    const data = await res.json();

    if (!data.ok) {
      vehicleGrid.innerHTML = `<div class="text-red-500">Failed to load garage</div>`;
      return;
    }

    const cars = data.cars || [];
    if (cars.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    cars.forEach((car) => {
      const isActive = parseInt(car.is_active) === 1;

      const title =
        car.nickname && car.nickname.trim() !== ""
          ? car.nickname
          : `${car.brand_name} ${car.model_name} ${car.variant_name}`;

      const sub = `${car.brand_name} ${car.model_name} • ${car.variant_name}`;
      const specs = `${car.battery_capacity_kwh} kWh • ${car.efficiency_wh_per_km} Wh/km`;

      const card = document.createElement("div");
      card.className =
        "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between";

      card.innerHTML = `
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-800">${escapeHtml(title)}</h3>
            ${
              isActive
                ? `<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">ACTIVE</span>`
                : ""
            }
          </div>
          <div class="text-sm text-gray-500 mt-1">${escapeHtml(sub)}</div>
          <div class="text-xs text-gray-400 mt-1">${escapeHtml(specs)}</div>
        </div>

        <div class="flex items-center gap-2">
          ${
            !isActive
              ? `<button data-action="active" data-id="${car.garage_id}" class="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Set Active</button>`
              : ""
          }
          <button data-action="delete" data-id="${car.garage_id}" class="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100">Delete</button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);

        if (action === "active") setActive(id);
        if (action === "delete") openDeleteModal(id);
      });

      vehicleGrid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    vehicleGrid.innerHTML = `<div class="text-red-500">Connection error</div>`;
  }
}

function openDeleteModal(garageId) {
  pendingDeleteGarageId = garageId;
  deleteModal.style.display = "flex";
}

// ===== SEARCH =====
searchCarBtn?.addEventListener("click", doSearch);
searchCarInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

async function doSearch() {
  const q = searchCarInput.value.trim();
  if (!q) return;

  searchResults.innerHTML = `<div class="text-center text-sm text-gray-500 py-4">Searching...</div>`;

  try {
    const res = await fetch(`${API_URL}/garage_search.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: q }),
    });

    const data = await res.json();

    if (!data.ok) {
      searchResults.innerHTML = `<div class="text-center text-sm text-red-500 py-4">Search failed</div>`;
      return;
    }

    const results = data.results || [];
    if (results.length === 0) {
      searchResults.innerHTML = `<div class="text-center text-sm text-gray-500 py-4">No results found.</div>`;
      return;
    }

    searchResults.innerHTML = "";
    results.forEach((r) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50";

      row.innerHTML = `
        <div>
          <div class="font-semibold text-gray-800">${escapeHtml(r.brand_name)} ${escapeHtml(r.model_name)}</div>
          <div class="text-xs text-gray-500">${escapeHtml(r.variant_name)} • ${r.battery_capacity_kwh} kWh • ${r.efficiency_wh_per_km} Wh/km</div>
        </div>
        <button class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-sm">Add</button>
      `;

      row.querySelector("button").addEventListener("click", async () => {
        await addCar(r.variant_id);
      });

      searchResults.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    searchResults.innerHTML = `<div class="text-center text-sm text-red-500 py-4">Connection error</div>`;
  }
}

// ===== ADD =====
async function addCar(variantId) {
  const nickname = ownerNameInput.value.trim();

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

// INIT
loadGarage();
