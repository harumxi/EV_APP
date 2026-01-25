// c:\Users\Alexa\Documents\GitHub\EV_APP\FRONTEND\UI_JS\dashboard.js

// ===== UI LOGIC (PROVIDED) =====
(function initBottomNav(){
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  const items = Array.from(nav.querySelectorAll('button.nav-item'));

  function setActive(btn){
    items.forEach(b => b.removeAttribute('aria-current'));
    btn.setAttribute('aria-current', 'page');
  }

  items.forEach(btn => {
    btn.addEventListener('click', () => setActive(btn));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActive(btn);
      }
    });
  });
})();

// ===== BACKEND LOGIC (MIGRATED & ADAPTED) =====

const API_BASE = "http://localhost/WEBPROG_PROJ/BACKEND/API";
let trips = [];
let socket;

// UNIT PREFERENCES
const PREF_UNIT = localStorage.getItem('pref_units') || 'KM';
const IS_MILES = PREF_UNIT === 'MILES';
const DIST_FACTOR = IS_MILES ? 0.621371 : 1;
const DIST_LABEL = IS_MILES ? 'mi' : 'km';

document.addEventListener("DOMContentLoaded", () => {
    // Auth Guard
    if(!localStorage.getItem("user_id")) window.location.href = "login.html";

    loadActiveCar();
    // initBatterySync(); // Disabled: No UI element in new design
    fetchTripHistory();
    
    // Socket for SOS (Logic kept, though trigger button is missing in UI)
    try {
        if(typeof io !== 'undefined') {
             socket = io("http://localhost:3000");
             socket.on("connect", () => socket.emit("register", localStorage.getItem("user_id")));
        }
    } catch(e) { console.error("Socket error", e); }
});

async function fetchTripHistory() {
    const userId = localStorage.getItem("user_id");
    try {
        const res = await fetch(`${API_BASE}/BATTERY/logs.php?user_id=${userId}`);
        const data = await res.json();
        
        if(data.ok && data.logs) {
            trips = data.logs.map(log => ({
                id: log.id,
                rawDate: new Date(log.created_at),
                date: new Date(log.created_at).toLocaleDateString(),
                from: log.origin || 'Unknown',
                to: log.destination || 'Unknown',
                dist: parseFloat(log.distance_km),
                drained: parseFloat(log.battery_drained || 0)
            }));
            updateDashboard();
        }
    } catch(e) { console.error("Failed to fetch trips", e); }
}

function loadActiveCar() {
    const activeCar = JSON.parse(localStorage.getItem('active_car') || "null");
    
    // Adapt to New UI Header
    const userNameEl = document.getElementById('header-user-name');
    const carNameEl = document.getElementById('header-car-name');

    if(userNameEl) userNameEl.innerText = localStorage.getItem('full_display_name') || 'User';

    if(activeCar && carNameEl) {
        carNameEl.innerText = `${activeCar.brand} · ${activeCar.model}`;
    }
}

function updateDashboard() {
    calculateStats();
    renderTable();
    renderCharts();
}

function calculateStats() {
    let totalDist = 0;
    let totalSavings = 0;
    let totalEnergy = 0;

    trips.forEach(trip => {
        totalDist += trip.dist;
        totalSavings += (trip.dist * 0.192); // kg CO2
        totalEnergy += (trip.dist * 0.16); // kWh (Assuming 160Wh/km avg)
    });

    const totalHoursDriven = (totalDist / 30);
    const timeSaved = totalHoursDriven * 0.15; 

    // Map to New UI Elements (Using IDs added to HTML or finding by context)
    // Note: I added IDs to the new HTML for easier targeting: stat-efficiency, stat-co2, stat-time
    
    const effEl = document.getElementById('stat-efficiency');
    if(effEl) effEl.innerText = Math.round(160 / DIST_FACTOR) + ` Wh/${DIST_LABEL}`; // Avg efficiency

    const co2El = document.getElementById('stat-co2');
    if(co2El) co2El.innerText = totalSavings.toFixed(1) + " kg CO₂e";

    const timeEl = document.getElementById('stat-time');
    if(timeEl) timeEl.innerText = (timeSaved * 60).toFixed(0) + " min";
}

function renderTable() {
    const container = document.getElementById('recent-trips-list');
    if(!container) return;
    
    container.innerHTML = '';

    // Sort by date descending and take top 3 to fit UI
    const recentTrips = [...trips].sort((a, b) => b.rawDate - a.rawDate).slice(0, 3);
    
    if(recentTrips.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-black/40">No recent trips.</div>`;
        return;
    }

    recentTrips.forEach(trip => {
        const savings = (trip.dist * 0.192).toFixed(1);
        
        const div = document.createElement('div');
        div.className = "flex items-center justify-between rounded-xl border border-black/10 bg-white p-3";
        div.innerHTML = `
            <div>
              <div class="text-sm font-semibold">${trip.to}</div>
              <div class="text-xs text-black/60">${trip.date} · ${(trip.dist * DIST_FACTOR).toFixed(1)} ${DIST_LABEL}</div>
            </div>
            <div class="text-xs font-semibold text-green-600">${savings} kg saved</div>
        `;
        container.appendChild(div);
    });
}

function renderCharts() {
    // Inject Canvas into Placeholder
    const container = document.getElementById('chart-container');
    if(container && typeof Chart !== 'undefined') {
        container.innerHTML = '<canvas id="co2Chart" style="width:100%; height:100%;"></canvas>';
        
        // Prepare Data
        const dailyStats = {};
        const sortedTrips = [...trips].sort((a, b) => a.rawDate - b.rawDate);

        sortedTrips.forEach(t => {
            const day = t.rawDate.toLocaleDateString(undefined, { weekday: 'short' });
            if (!dailyStats[day]) dailyStats[day] = 0;
            dailyStats[day] += (t.dist * 0.192);
        });

        const labels = Object.keys(dailyStats).slice(-7);
        const data = labels.map(d => dailyStats[d].toFixed(1));

        const ctx = document.getElementById('co2Chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    label: 'CO₂ Saved',
                    data: data.length ? data : [0],
                    borderColor: '#10b981',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
}

// SOS Function (Preserved but not bound to UI)
async function triggerSOS() {
    if (!confirm("🚨 ARE YOU SURE?")) return;
    if (!navigator.geolocation) return alert("GPS not supported.");

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const userId = localStorage.getItem("user_id");
            let contacts = JSON.parse(localStorage.getItem(`emergency_contacts_`) || "[]");
            
            if (contacts.length === 0) return alert("No emergency contacts saved.");

            await fetch(`${API_BASE}/SOS/trigger.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    contact_emails: contacts,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                })
            });

            if(socket && socket.connected) {
                socket.emit("sos_signal", {
                    name: localStorage.getItem("user_name") || "User",
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            }
            alert("SOS Signal Sent");
        } catch (e) { alert("Connection Error"); }
    });
}
