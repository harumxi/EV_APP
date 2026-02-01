// CONFIGURATION
const API_BASE = "http://localhost/WEBPROG_PROJ/BACKEND/API";
const USER_ID = localStorage.getItem("user_id");

// UNIT PREFERENCES
const RAW_UNIT = localStorage.getItem('units') || localStorage.getItem('pref_units') || 'metric';
const IS_MILES = RAW_UNIT === 'imperial' || RAW_UNIT === 'MILES';
const DIST_FACTOR = IS_MILES ? 0.621371 : 1;
const DIST_LABEL = IS_MILES ? 'mi' : 'km';

let trips = [];
let isDeleteMode = false;
let selectedIds = new Set();
let activeTrip = null;
let filterMode = 'drive'; // 'drive' | 'charge'
let filterDate = null;
let searchQuery = "";

const app = document.getElementById('app');
const detailModal = document.getElementById('detailModal');
const confirmModal = document.getElementById('confirmModal');

const closeDetailBtn = document.getElementById('closeDetailBtn');
const closeConfirmBtn = document.getElementById('closeConfirmBtn');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');

const ICONS = {
  calendar: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  route: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><line x1="6" y1="9" x2="6" y2="21"/><line x1="18" y1="3" x2="18" y2="15"/><path d="M6 21a3 3 0 0 0 3-3h6a3 3 0 0 1 3 3"/></svg>`,
  clock: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  file: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  zap: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
};

document.addEventListener("DOMContentLoaded", async () => {
    if(!USER_ID) window.location.href = 'login.html';
    await fetchTrips();
    render();
});

async function fetchTrips() {
    try {
        const res = await fetch(`${API_BASE}/BATTERY/logs.php?user_id=${USER_ID}`);
        const data = await res.json();
        
        if(data.ok && data.logs) {
            trips = data.logs.map(log => {
                const isCharge = log.origin === 'Emergency Location';
                const dest = (log.destination || '').toLowerCase();
                const isStationTrip = !isCharge && (dest.includes('charging station') || dest.includes('hub') || dest.includes('e-vehicle'));
                
                let type = 'drive';
                if (isCharge) type = 'charge';
                else if (isStationTrip) type = 'station_trip';

                return {
                id: String(log.id),
                type: type,
                title: isCharge ? `Charging at ${log.destination}` : `Trip to ${log.destination || 'Unknown'}`,
                date: log.created_at,
                from: log.origin || 'Unknown',
                to: log.destination || 'Unknown',
                location: (log.destination || '').split(',')[0],
                distanceKm: parseFloat(log.distance_km),
                durationMinutes: Math.round(parseFloat(log.distance_km) * 1.5), // Estimate
                etaMinutes: Math.round(parseFloat(log.distance_km) * 1.5),
                emissionsSavedKgCO2e: (parseFloat(log.distance_km) * 0.192).toFixed(1),
                timeSavedMinutes: Math.round(parseFloat(log.distance_km) * 0.5),
                energyEfficiencyWhPerKm: 160,
                stops: [],
                reflections: 'No notes added.',
                fileName: `report-${log.id}.json`
                };
            });
        }
    } catch(e) { 
        console.error("Fetch error", e);
        app.innerHTML = `<div class="text-center text-red-500 py-10">Failed to load reports.</div>`;
    }
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function computeStats() {
  const total = trips.length;
  const emissions = trips.reduce((s, t) => s + (parseFloat(t.emissionsSavedKgCO2e) || 0), 0);
  const timeSaved = trips.reduce((s, t) => s + (t.timeSavedMinutes || 0), 0);
  const avgEff = trips.length
    ? Math.round(trips.reduce((s, t) => s + (t.energyEfficiencyWhPerKm || 0), 0) / trips.length)
    : 0;
  return { total, emissions, timeSaved, avgEff };
}

function sortedTrips() {
  return trips
    .filter(t => {
        if (t.type !== filterMode) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matches = (
                (t.title && t.title.toLowerCase().includes(q)) ||
                (t.location && t.location.toLowerCase().includes(q)) ||
                (t.from && t.from.toLowerCase().includes(q)) ||
                (t.to && t.to.toLowerCase().includes(q))
            );
            if (!matches) return false;
        }
        if (filterDate) {
            const tripD = new Date(t.date);
            const filterD = new Date(filterDate + 'T00:00:00');
            if (tripD.toDateString() !== filterD.toDateString()) return false;
        }
        return true;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function setFilter(mode) {
  filterMode = mode;
  selectedIds = new Set();
  render();
}

window.updateDateFilter = (val) => {
    filterDate = val;
    render();
};

window.updateSearch = (val) => {
    searchQuery = val;
    render();
};

window.clearDateFilter = () => {
    filterDate = null;
    render();
};

function masterState() {
  const visibleTrips = sortedTrips();
  const total = visibleTrips.length;
  const selected = selectedIds.size;
  return {
    checked: total > 0 && selected === total,
    indeterminate: selected > 0 && selected < total,
  };
}

function openConfirm({ title, message, confirmText, onConfirm }) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  const btn = document.getElementById('confirmActionBtn');
  btn.textContent = confirmText;
  btn.onclick = () => { onConfirm(); closeConfirmModal(); };
  confirmModal.showModal();
}

function render() {
  const ms = masterState();
  const visibleTrips = sortedTrips();
  
  // Preserve focus state for search input
  let restoreFocus = false;
  let cursorPosition = 0;
  const activeEl = document.activeElement;
  if (activeEl && activeEl.id === 'historySearchInput') {
      restoreFocus = true;
      cursorPosition = activeEl.selectionStart;
  }

  app.innerHTML = `
    <!-- Summary Header -->
    <section class="rounded-[24px] border border-white/60 bg-white/40 shadow-sm backdrop-blur-xl p-5 space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="mt-1 rounded-xl bg-white/60 border border-white/60 p-2 shadow-sm text-gray-900">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
          </div>
          <div>
            <div class="text-xl font-bold tracking-tight text-gray-900">History</div>
            ${isDeleteMode ? `
              <div class="mt-0.5 text-sm text-gray-500 font-medium">
                Select reports to delete.
              </div>
            ` : `
              <div class="mt-0.5 text-sm text-gray-500 font-medium">
                Your recent activity
              </div>
            `}
          </div>
        </div>

        <div class="flex items-center gap-2">
          ${isDeleteMode ? `
            <button id="deleteAllBtn" class="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition">
              Delete all
            </button>
            <button id="doneBtn" class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition shadow-lg shadow-gray-900/10">
              Done
            </button>
          ` : `
            <button id="enterDeleteBtn" class="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/40 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-white/80 hover:text-gray-900 transition ${visibleTrips.length ? '' : 'opacity-50'}" ${visibleTrips.length ? '' : 'disabled'}>
              Manage
            </button>
          `}
        </div>
      </div>

      <div class="flex flex-col gap-3">
          <!-- Filters -->
          <div class="flex items-center gap-2">
            <div class="relative group w-96">
                <input id="historySearchInput" type="text" placeholder="Search..." 
                    class="w-full bg-white/40 border border-white/60 text-xs font-medium text-gray-600 placeholder:text-gray-400 focus:bg-white focus:ring-0 px-3 py-1.5 h-9 rounded-xl shadow-sm backdrop-blur-sm pl-9 transition-all" 
                    value="${searchQuery || ''}" 
                    oninput="updateSearch(this.value)">
                <svg class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>

            <div class="flex items-center gap-2 bg-white/40 border border-white/60 p-1 rounded-xl shadow-sm backdrop-blur-sm shrink-0">
                <input type="date" class="bg-transparent border-none text-xs font-medium text-gray-600 focus:ring-0 px-2 py-0.5 h-7" value="${filterDate || ''}" onchange="updateDateFilter(this.value)">
                ${filterDate ? `
                    <button onclick="clearDateFilter()" class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6 18 18"/></svg>
                    </button>
                ` : ''}
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex p-1 bg-gray-100/50 rounded-xl w-fit">
            <button onclick="setFilter('drive')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'drive' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}">Drives</button>
            <button onclick="setFilter('station_trip')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'station_trip' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}">Station Trips</button>
            <button onclick="setFilter('charge')" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'charge' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}">Charging</button>
          </div>
      </div>

      ${isDeleteMode ? `
        <div class="mt-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100/50">
          <div class="flex items-center gap-2">
            <label class="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/40 px-3 py-2 text-sm cursor-pointer hover:bg-white/60 transition ${visibleTrips.length ? '' : 'opacity-50'}">
              <input id="masterCheckbox" type="checkbox" ${ms.checked ? 'checked' : ''} ${visibleTrips.length ? '' : 'disabled'} class="rounded border-gray-300 text-black focus:ring-black" />
              <span class="text-xs font-bold text-gray-700">${ms.checked ? 'Clear all' : 'Select all'}</span>
            </label>
            ${selectedIds.size ? `<span class="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-1 text-xs font-bold text-white shadow-sm">${selectedIds.size} selected</span>` : ''}
          </div>
          <button id="deleteSelectedBtn" class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-lg shadow-red-600/20 ${selectedIds.size ? '' : 'opacity-50'}" ${selectedIds.size ? '' : 'disabled'}>
            Delete selected
          </button>
        </div>
      ` : ''}
    </section>

    <!-- Trip List Section -->
    <section class="rounded-[24px] border border-white/60 bg-white/40 shadow-sm backdrop-blur-xl overflow-hidden mt-4">
      <div class="${isDeleteMode ? 'grid grid-cols-[44px_1fr]' : 'grid grid-cols-1'} items-center border-b border-white/20 bg-white/30 px-4 py-3">
        ${isDeleteMode ? `<div class="flex items-center justify-center text-xs text-gray-400">✓</div>` : ''}
        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent ${filterMode === 'drive' ? 'Trips' : (filterMode === 'station_trip' ? 'Station Trips' : 'Sessions')}</div>
      </div>

      ${visibleTrips.length ? `
        <div class="divide-y divide-gray-200">
          ${visibleTrips.map(t => {
            const checked = selectedIds.has(t.id);
            return `
              <div class="${isDeleteMode ? 'grid grid-cols-[44px_1fr]' : 'grid grid-cols-1'} items-stretch group transition-colors hover:bg-white/40 ${checked ? 'bg-blue-50/50' : ''}">
                
                ${isDeleteMode ? `
                  <div class="flex items-center justify-center">
                    <input type="checkbox" data-id="${t.id}" class="row-checkbox w-5 h-5 rounded-md border-gray-300 text-black focus:ring-black" ${checked ? 'checked' : ''} />
                  </div>
                ` : ''}

                <button type="button" class="row-open w-full text-left py-4 px-4 flex items-center gap-4" data-id="${t.id}">
                  
                  <!-- Leading Icon -->
                  <div class="hidden sm:flex flex-none w-10 h-10 rounded-full bg-white border border-white/60 shadow-sm items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                    ${t.type === 'charge' ? ICONS.zap : ICONS.route}
                  </div>

                  <!-- Main Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-[16px] font-bold text-gray-900 leading-tight truncate">${t.title}</h3>
                    </div>
                    <div class="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1.5">
                        <span>${formatDate(t.date)}</span>
                        <span class="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                        <span>${t.location}</span>
                    </div>
                    ${t.type === 'drive' || t.type === 'station_trip' ? `
                        <div class="text-[13px] text-gray-600 truncate font-normal flex items-center gap-1.5">
                            <span class="text-gray-900">${t.from}</span>
                            <svg class="w-3 h-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                            <span class="text-gray-900">${t.to}</span>
                        </div>
                    ` : `
                        <div class="text-[13px] text-gray-600 truncate font-normal">
                            Charging Session
                        </div>
                    `}
                  </div>

                  <!-- Right Actions -->
                  <div class="flex flex-col items-end gap-2 pl-2">
                    <!-- CO2 Pill -->
                    ${t.type === 'drive' || t.type === 'station_trip' ? `
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50/40 border border-emerald-100/50 backdrop-blur-md">
                        <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3-3-.928.857-1.928.857-3 3 0 1.071.5 1.693 1 3a2.5 2.5 0 0 0 2.5 2.5z"/><path d="M15.5 14.5A2.5 2.5 0 0 0 18 12c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3-3-.928.857-1.928.857-3 3 0 1.071.5 1.693 1 3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                        <span class="text-xs font-bold text-emerald-600">${t.emissionsSavedKgCO2e} kg</span>
                    </div>` : ''}
                    
                    <!-- Report Ghost Button -->
                    <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-black/5 transition-all">
                        ${ICONS.file}
                        <span class="text-[11px] font-semibold uppercase tracking-wide">Report</span>
                    </div>
                  </div>

                </button>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="p-12 text-center">
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                ${filterMode === 'charge' ? ICONS.zap : ICONS.route}
            </div>
            <div class="text-sm font-medium text-gray-900">No ${filterMode === 'drive' ? 'trips' : (filterMode === 'station_trip' ? 'station trips' : 'charging sessions')} found</div>
            <div class="text-xs text-gray-500 mt-1">Your history will appear here.</div>
        </div>
      `}
    </section>
  `;

  if (!isDeleteMode) {
    const enter = document.getElementById('enterDeleteBtn');
    if (enter) enter.onclick = () => { isDeleteMode = true; selectedIds = new Set(); render(); };
  } else {
    const done = document.getElementById('doneBtn');
    if (done) done.onclick = () => { isDeleteMode = false; selectedIds = new Set(); render(); };

    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
      deleteAllBtn.onclick = () => openConfirm({
        title: 'Delete all reports?',
        message: 'This will permanently remove your entire trip history. This action can’t be undone.',
        confirmText: 'Yes, delete all',
        onConfirm: () => {
          trips.length = 0;
          selectedIds = new Set();
          isDeleteMode = false;
          activeTrip = null;
          closeDetailModal();
          render();
        }
      });
    }

    const masterCheckbox = document.getElementById('masterCheckbox');
    if (masterCheckbox) {
      masterCheckbox.indeterminate = ms.indeterminate;

      masterCheckbox.onchange = () => {
        const visibleTrips = sortedTrips();
        if (!visibleTrips.length) return;
        const next = new Set();
        const shouldSelectAll = !(selectedIds.size === visibleTrips.length);
        if (shouldSelectAll) visibleTrips.forEach(t => next.add(t.id));
        selectedIds = next;
        render();
      };
    }

    const delSel = document.getElementById('deleteSelectedBtn');
    if (delSel) {
      delSel.onclick = () => openConfirm({
        title: `Delete selected (${selectedIds.size})?`,
        message: 'Only the checked reports will be deleted. This action can’t be undone.',
        confirmText: 'Yes, delete selected',
        onConfirm: () => {
          for (const id of selectedIds) {
            const idx = trips.findIndex(t => t.id === id);
            if (idx >= 0) trips.splice(idx, 1);
          }
          selectedIds = new Set();
          isDeleteMode = false;
          activeTrip = null;
          closeDetailModal();
          render();
        }
      });
    }

    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (!id) return;
        if (e.target.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        render();
      });
    });
  }
  
  // Restore focus if needed
  if (restoreFocus) {
      const input = document.getElementById('historySearchInput');
      input.focus();
      input.setSelectionRange(cursorPosition, cursorPosition);
  }

  document.querySelectorAll('.row-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!id) return;
      openDetailModal(id);
    });
  });
}

function openDetailModal(id) {
  activeTrip = trips.find(t => t.id == id) || null;
  if (!activeTrip) return;

  const batteryPct = Math.max(1, Math.min(100, 100 - Math.round((activeTrip.energyEfficiencyWhPerKm || 0) / 2)));

  document.getElementById('modalTitle').textContent = activeTrip.title;

  document.getElementById('modalContent').innerHTML = `
    <div class="rounded-2xl border border-black/10 bg-black/5 p-4">
      <div class="flex flex-wrap items-center gap-2 text-sm text-black/70">
        <span class="inline-flex items-center gap-1">${ICONS.calendar} <span>${formatDate(activeTrip.date)}</span></span>
        <span class="text-black/30">•</span>
        <span class="inline-flex items-center gap-1">${ICONS.route} <span>${activeTrip.from} → ${activeTrip.to}</span></span>
        <span class="text-black/30">•</span>
        <span class="inline-flex items-center gap-1">${ICONS.clock} <span>~${activeTrip.durationMinutes} min</span></span>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">Emissions saved</div>
        <div class="mt-1 text-sm font-semibold">${activeTrip.emissionsSavedKgCO2e} kg CO₂e</div>
      </div>
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">Energy efficiency</div>
        <div class="mt-1 text-sm font-semibold">${activeTrip.energyEfficiencyWhPerKm} Wh/km</div>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">Distance</div>
        <div class="mt-1 text-sm font-semibold">${(activeTrip.distanceKm * DIST_FACTOR).toFixed(1)} ${DIST_LABEL}</div>
      </div>
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">ETA</div>
        <div class="mt-1 text-sm font-semibold">~${activeTrip.etaMinutes} min</div>
      </div>
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">File</div>
        <div class="mt-1 truncate text-sm font-semibold" title="${activeTrip.fileName}">${activeTrip.fileName}</div>
      </div>
    </div>

    <div class="rounded-2xl border border-black/10 bg-white p-4">
      <div class="text-xs font-semibold text-black/70">Notes</div>

      <div class="mt-2 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl border border-black/10 bg-white p-3">
          <div class="text-xs text-black/60">Battery Status</div>
          <div class="mt-1 text-2xl font-semibold tracking-tight">${batteryPct}%</div>
          <div class="mt-1 text-sm text-black/70">Battery usage remained steady.</div>
        </div>

        <div class="rounded-2xl border border-black/10 bg-white p-3">
          <div class="text-xs text-black/60">Route Status</div>
          <div class="mt-1 text-sm font-semibold text-black/80">Consistent</div>
          <div class="mt-1 text-sm text-black/70">Route conditions remained consistent.</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('downloadBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(activeTrip, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTrip.fileName || 'trip-report.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  document.getElementById('deleteOneBtn').onclick = () => {
    openConfirm({
      title: 'Delete this report?',
      message: 'This will permanently remove this report. This action can’t be undone.',
      confirmText: 'Yes, delete',
      onConfirm: () => {
        const idx = trips.findIndex(t => t.id === activeTrip.id);
        if (idx >= 0) trips.splice(idx, 1);
        activeTrip = null;
        closeDetailModal();
        selectedIds.delete(id);
        render();
      }
    });
  };

  detailModal.showModal();
}

function closeDetailModal() {
  if (detailModal.open) detailModal.close();
}

function closeConfirmModal() {
  if (confirmModal.open) confirmModal.close();
}

/* Modal close buttons */
closeDetailBtn.addEventListener('click', closeDetailModal);
closeConfirmBtn.addEventListener('click', closeConfirmModal);
cancelConfirmBtn.addEventListener('click', closeConfirmModal);

/* Click outside closes */
detailModal.addEventListener('click', (e) => {
  const rect = detailModal.getBoundingClientRect();
  const inDialog =
    rect.top <= e.clientY && e.clientY <= rect.bottom &&
    rect.left <= e.clientX && e.clientX <= rect.right;
  if (!inDialog) closeDetailModal();
});

confirmModal.addEventListener('click', (e) => {
  const rect = confirmModal.getBoundingClientRect();
  const inDialog =
    rect.top <= e.clientY && e.clientY <= rect.bottom &&
    rect.left <= e.clientX && e.clientX <= rect.right;
  if (!inDialog) closeConfirmModal();
});