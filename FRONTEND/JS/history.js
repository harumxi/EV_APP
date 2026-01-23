const trips = [
  {
    id: 't-2026-01-12',
    title: 'Intramuros Walk + Fort Santiago',
    date: '2026-01-12',
    from: 'Taft Avenue, Manila',
    to: 'Intramuros, Manila',
    location: 'Manila',
    distanceKm: 9.6,
    durationMinutes: 330,
    etaMinutes: 28,
    emissionsSavedKgCO2e: 2.4,
    timeSavedMinutes: 12,
    energyEfficiencyWhPerKm: 132,
    stops: ['Intramuros', 'Fort Santiago', 'Casa Manila'],
    reflections: 'Noted how the walls shaped the city’s movement and defense strategy.',
    fileName: 'evida-report-2026-01-12.json',
  },
  {
    id: 't-2025-12-02',
    title: 'Corregidor WWII Day Trip',
    date: '2025-12-02',
    from: 'MOA, Pasay',
    to: 'Corregidor Ferry Terminal',
    location: 'Cavite',
    distanceKm: 31.2,
    durationMinutes: 420,
    etaMinutes: 62,
    emissionsSavedKgCO2e: 4.1,
    timeSavedMinutes: 18,
    energyEfficiencyWhPerKm: 145,
    stops: ['Mile-Long Barracks', 'Malinta Tunnel', 'Battery Way'],
    reflections: 'Strong emphasis on remembrance and resilience—collect primary-source plaques.',
    fileName: 'evida-report-2025-12-02.json',
  },
  {
    id: 't-2025-11-19',
    title: 'Vigan Heritage Night Walk',
    date: '2025-11-19',
    from: 'Bantay Church',
    to: 'Calle Crisologo',
    location: 'Ilocos Sur',
    distanceKm: 4.8,
    durationMinutes: 210,
    etaMinutes: 14,
    emissionsSavedKgCO2e: 1.1,
    timeSavedMinutes: 6,
    energyEfficiencyWhPerKm: 118,
    stops: ['Bantay Bell Tower', 'Calle Crisologo', 'Plaza Salcedo'],
    reflections: 'Architecture details are easier to compare at night under consistent lighting.',
    fileName: 'evida-report-2025-11-19.json',
  }
];

let isDeleteMode = false;
let selectedIds = new Set();
let activeTrip = null;

const app = document.getElementById('app');
const detailModal = document.getElementById('detailModal');
const confirmModal = document.getElementById('confirmModal');

const closeDetailBtn = document.getElementById('closeDetailBtn');
const closeConfirmBtn = document.getElementById('closeConfirmBtn');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');

const ICONS = {
  calendar: `<svg class="w-4 h-4 inline-block text-black/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 7V5M16 7V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M4.5 9.5H19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M7 21h10c2.2 0 3.5-1.3 3.5-3.5V9c0-2.2-1.3-3.5-3.5-3.5H7C4.8 5.5 3.5 6.8 3.5 9v8.5C3.5 19.7 4.8 21 7 21Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
  </svg>`,
  route: `<svg class="w-4 h-4 inline-block text-black/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M7 18a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M17 12a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M9.3 13.2c1.7-1.1 3.7-1.7 6.2-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M8.4 16.9c2.2 1.1 4.6 1.6 7.6 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  clock: `<svg class="w-4 h-4 inline-block text-black/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  file: `<svg class="w-4 h-4 inline-block text-black/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 3H8c-2 0-3 1-3 3v12c0 2 1 3 3 3h8c2 0 3-1 3-3V8l-5-5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M14 3v5h5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M8 13h8M8 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`
};

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function computeStats() {
  const total = trips.length;
  const emissions = trips.reduce((s, t) => s + (t.emissionsSavedKgCO2e || 0), 0);
  const timeSaved = trips.reduce((s, t) => s + (t.timeSavedMinutes || 0), 0);
  const avgEff = trips.length
    ? Math.round(trips.reduce((s, t) => s + (t.energyEfficiencyWhPerKm || 0), 0) / trips.length)
    : 0;
  return { total, emissions, timeSaved, avgEff };
}

function sortedTrips() {
  return trips.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

function masterState() {
  const total = trips.length;
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
  const s = computeStats();
  const ms = masterState();

  app.innerHTML = `
    <section class="rounded-2xl border border-black/10 bg-white/80 shadow-sm backdrop-blur p-4 space-y-3">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
            <span class="font-semibold">R</span>
          </div>
          <div>
            <div class="text-lg font-semibold tracking-tight text-black">My trips</div>
            ${isDeleteMode ? `
              <div class="mt-0.5 text-sm text-black/60">
                Select reports to delete.
              </div>
            ` : ``}
          </div>
        </div>

        <div class="flex items-center gap-2">
          ${isDeleteMode ? `
            <button id="deleteAllBtn" class="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-black/80">
              Delete all
            </button>
            <button id="doneBtn" class="inline-flex items-center gap-2 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white">
              Done
            </button>
          ` : `
            <button id="enterDeleteBtn" class="inline-flex items-center gap-2 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white ${trips.length ? '' : 'opacity-50'}" ${trips.length ? '' : 'disabled'}>
              Delete
            </button>
          `}
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-xl border border-black/10 bg-white p-3">
          <div class="text-xs text-black/60">Total reports</div>
          <div class="mt-0.5 text-lg font-semibold text-black">${s.total}</div>
        </div>
        <div class="rounded-xl border border-black/10 bg-white p-3">
          <div class="text-xs text-black/60">Emissions saved</div>
          <div class="mt-0.5 text-lg font-semibold text-green-600">${s.emissions.toFixed(1)} kg</div>
        </div>
        <div class="rounded-xl border border-black/10 bg-white p-3">
          <div class="text-xs text-black/60">Time saved</div>
          <div class="mt-0.5 text-lg font-semibold text-black">${s.timeSaved} min</div>
        </div>
        <div class="rounded-xl border border-black/10 bg-white p-3">
          <div class="text-xs text-black/60">Avg efficiency</div>
          <div class="mt-0.5 text-lg font-semibold text-black">${s.avgEff} Wh/km</div>
        </div>
      </div>

      ${isDeleteMode ? `
        <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <label class="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm cursor-pointer ${trips.length ? '' : 'opacity-50'}">
              <input id="masterCheckbox" type="checkbox" ${ms.checked ? 'checked' : ''} ${trips.length ? '' : 'disabled'} />
              <span class="text-sm">${ms.checked ? 'Clear all' : 'Select all'}</span>
            </label>
            ${selectedIds.size ? `<span class="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-black/70 shadow-sm">${selectedIds.size} selected</span>` : ''}
          </div>
          <button id="deleteSelectedBtn" class="inline-flex items-center gap-2 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white ${selectedIds.size ? '' : 'opacity-50'}" ${selectedIds.size ? '' : 'disabled'}>
            Delete selected (${selectedIds.size})
          </button>
        </div>
      ` : ''}
    </section>

    <section class="rounded-2xl border border-black/10 bg-white overflow-hidden">
      <div class="${isDeleteMode ? 'grid grid-cols-[44px_1fr]' : 'grid grid-cols-1'} items-center border-b border-black/10 bg-black/5 px-2 py-2">
        ${isDeleteMode ? `<div class="flex items-center justify-center text-xs text-black/60">✓</div>` : ''}
        <div class="text-xs font-semibold text-black/70">Trip</div>
      </div>

      ${sortedTrips().length ? `
        <div class="divide-y divide-black/10">
          ${sortedTrips().map(t => {
            const checked = selectedIds.has(t.id);
            return `
              <div class="${isDeleteMode ? 'grid grid-cols-[44px_1fr]' : 'grid grid-cols-1'} items-stretch ${checked ? 'bg-black/[0.03]' : 'bg-white'}">
                ${isDeleteMode ? `
                  <div class="flex items-center justify-center p-2">
                    <input type="checkbox" data-id="${t.id}" class="row-checkbox" ${checked ? 'checked' : ''} />
                  </div>
                ` : ''}
                <button type="button" class="row-open w-full px-3 py-3 text-left transition hover:bg-black/5" data-id="${t.id}">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-sm font-semibold leading-snug">${t.title}</div>
                      <div class="mt-1 text-xs text-black/60">${formatDate(t.date)} • ${t.location}</div>
                      <div class="mt-1 text-xs text-black/60">${t.from} → ${t.to}</div>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <span class="rounded-full bg-black/5 px-2 py-0.5 text-[11px]">${t.emissionsSavedKgCO2e} kg CO₂e saved</span>
                        <span class="rounded-full bg-black/5 px-2 py-0.5 text-[11px]">${t.timeSavedMinutes} min saved</span>
                      </div>
                    </div>
                    <div class="mt-0.5 text-xs text-black/60">
                      <span class="inline-flex items-center gap-1">${ICONS.file} <span>Report</span></span>
                    </div>
                  </div>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="p-10 text-center text-sm text-black/60">No reports yet.</div>
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
        if (!trips.length) return;
        const next = new Set();
        const shouldSelectAll = !(selectedIds.size === trips.length);
        if (shouldSelectAll) trips.forEach(t => next.add(t.id));
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

  document.querySelectorAll('.row-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!id) return;
      openDetailModal(id);
    });
  });
}

function openDetailModal(id) {
  activeTrip = trips.find(t => t.id === id) || null;
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

    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">Emissions saved</div>
        <div class="mt-1 text-sm font-semibold">${activeTrip.emissionsSavedKgCO2e} kg CO₂e</div>
      </div>
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">Time saved</div>
        <div class="mt-1 text-sm font-semibold">${activeTrip.timeSavedMinutes} min</div>
      </div>
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">Energy efficiency</div>
        <div class="mt-1 text-sm font-semibold">${activeTrip.energyEfficiencyWhPerKm} Wh/km</div>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-black/10 bg-white p-3">
        <div class="text-xs text-black/60">Distance</div>
        <div class="mt-1 text-sm font-semibold">${activeTrip.distanceKm} km</div>
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
      <div class="text-xs font-semibold text-black/70">Key points</div>
      <div class="mt-2 flex flex-wrap gap-2">
        ${activeTrip.stops.map(s => `<span class="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs text-black/70 shadow-sm">${s}</span>`).join('')}
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

/* Start */
render();
