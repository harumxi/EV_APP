// =======================================================
// 1. CONFIGURATION & SETUP
// =======================================================
const API_BASE = 'http://localhost/WEBPROG_PROJ/BACKEND/API';
let map, userMarker, destMarker, routeLayers = [];
let selectedRoute = null;

// EV SPECS (BYD Atto 3 Default)
const EV_SPECS = {
    capacity_kwh: 60.4, 
    efficiency_wh_km: 160 
};

// UNIT PREFERENCES
const RAW_UNIT = localStorage.getItem('units') || localStorage.getItem('pref_units') || 'metric';
const IS_MILES = RAW_UNIT === 'imperial' || RAW_UNIT === 'MILES';
const DIST_FACTOR = IS_MILES ? 0.621371 : 1;
const DIST_LABEL = IS_MILES ? 'mi' : 'km';

// =======================================================
// 2. INITIALIZATION (Runs on Load)
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Trip Planner Script Loaded");

    // A. ROBUST INPUT FINDER
    // We look for 'battery_level' OR 'battery-input' to prevent crashes
    const batteryInput = document.getElementById('battery_level') || document.getElementById('battery-input');
    
    if (!batteryInput) {
        alert("❌ CRITICAL ERROR: Input ID 'battery_level' not found in HTML.\nPlease add id='battery_level' to your input tag.");
        return; // Stop execution if input is missing
    }

    // Sync: Load saved battery level from Dashboard
    const savedBatt = localStorage.getItem('user_battery_level');
    if (savedBatt) batteryInput.value = savedBatt;

    // B. CHECK LOCK STATE IMMEDIATELY
    // If locked from before, block access immediately
    if (enforceBatteryLock(batteryInput)) return; 

    // C. SETUP EVENT LISTENERS
    batteryInput.addEventListener('input', () => {
        localStorage.setItem('user_battery_level', batteryInput.value);
        updateBatteryStats(batteryInput);
        monitorBatteryStatus(batteryInput);
    });

    // Listen for changes from other tabs (Dashboard)
    window.addEventListener('storage', (e) => {
        if (e.key === 'user_battery_level') {
            batteryInput.value = e.newValue;
            updateBatteryStats(batteryInput);
            monitorBatteryStatus(batteryInput);
        }
    });

    // D. INITIALIZE TOOLS
    initMap();
    getWeather();
    if (window.lucide) lucide.createIcons();
    updateBatteryStats(batteryInput); // Initial calculation
});

// =======================================================
// 3. BATTERY LOGIC & GATES
// =======================================================

// HELPER: Calculate Range Display
function updateBatteryStats(inputElement) {
    const val = parseInt(inputElement.value) || 0;
    const energy = (val / 100) * EV_SPECS.capacity_kwh;
    const range = Math.round(lnmnergy-val').innerText = energy.toFixed(1) + " kWh";
    
    if(document.getElementById('range-val')) 
        document.getElementById('range-val'
n
function monitorBatteryStatus(inputElement)t
    
    // 1. HEALTHY (>20%) - Release Lock
    if (currentSoc > 20) {
        localStorage.setItem("forceCharging", "0");
        return; 
    }

    // 2. LOW WARNING (11-20%)
    if (currentSoc <= 20 && currentSoc > 10) {
        showToastWarning("⚠️ Low Battery (≤20%). Plan charging soon.");
        return;
    }

    // 3. CRITICAL (≤10%) - LOCK APP
    if (currentSoc <= 10) {
        console.log("⚠️ Battery Critical! Locking App...");
        localStorage.setItem("forceCharging", "1");
        
        const severity = currentSoc <= 5 ? 'emergency' : 'critical';
        showCriticalBatteryModal(currentSoc, severity);
    }
}

// GATEKEEPER: Prevents actions if locked
function enforceBatteryLock(inputElement) {
    const isLocked = localStorage.getItem("forceCharging") === "1";
    
    if (isLocked) {
        const val = inputElement ? parseInt(inputElement.value) : 0;
        
        // Only enforce if the value is STILL low
        if (val <= 10) {
            const severity = val <= 5 ? 'emergency' : 'critical';
            showCriticalBatteryModal(val, severity);
            return true; // We are locked
        } else {
            // Auto-unlock if value is high now
            localStorage.setItem("forceCharging", "0");
            return false;
        }
    }
    return false; // Safe to proceed
}

// =======================================================
// 4. MODALS & UI
// =======================================================
function showCriticalBatteryModal(soc, severity) {
    if (document.getElementById('critical-modal')) return; // No duplicates

    const isEmerg = severity === 'emergency';
    const color = isEmerg ? 'bg-red-600' : 'bg-orange-600';
    const title = isEmerg ? '🚨 EMERGENCY STOP' : '⚠️ CRITICAL BATTERY';
    const msg = isEmerg ? 'Battery Critical. Do not drive.' : 'You must charge now.';

    const html = `
        <div id="critical-modal" class="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-bounce-in">
                <div class="${color} p-6 text-white text-center">
                    <h2 class="text-3xl font-black uppercase">${title}</h2>
                    <p class="mt-2 font-bold">${msg}</p>
                </div>
                <div class="p-6 space-y-4">
                    <p class="text-gray-700 font-bold text-center">Select Charging Option:</p>
                    
                    <button onclick="handleHomeCharging()" class="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg flex justify-center gap-2">
                        <i class="fa-solid fa-house"></i> Home / Private Charger
                    </button>
                    
                    <button id="btn-reroute" onclick="handlePublicCharging(event)" class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg flex justify-center gap-2">
                        <i class="fa-solid fa-bolt"></i> Reroute to Charger
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function showToastWarning(msg) {
    const div = document.createElement('div');
    div.className = "fixed top-5 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold z-[100] animate-pulse";
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// =======================================================
// 5. REDIRECT HANDLERS (THE FIX)
// =======================================================

// A. HOME CHARGING
function handleHomeCharging() {
    localStorage.setItem('ev_charging_mode', 'home');
    window.location.replace("charging.html");
}

// B. PUBLIC CHARGING (Reroute)
async function handlePublicCharging(event) {
    if(event) event.preventDefault(); // Stop form submit
    console.log("🚀 Initiating Reroute...");

    const btn = document.getElementById('btn-reroute');
    if(btn) {
        btn.innerHTML = "🔍 Locating...";
        btn.disabled = true;
    }

    // 1. SET LOCK STATE FIRST
    localStorage.setItem("forceCharging", "1");
    localStorage.setItem('ev_lock_status', 'critical');
    localStorage.setItem('ev_charging_mode', 'public');

    try {
        // 2. GET LOCATION & DATA
        const pos = await getCurrentPosition();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        localStorage.setItem("lastLat", lat);
        localStorage.setItem("lastLng", lng);

        const response = await fetch(`${API_BASE}/CHARGING/nearby.php?lat=${lat}&lon=${lng}`);
        const stations = await response.json();

        if (stations && stations.length > 0) {
            localStorage.setItem('ev_target_charger', JSON.stringify(stations[0]));
        }

        // 3. EXECUTE REDIRECT
        console.log("➡ Redirecting to charging.html");
        
        // Try Absolute Path First (Adjust 'WEBPROG_PROJ' if your folder name is different)
        // window.location.href = "/WEBPROG_PROJ/FRONTEND/HTML/charging.html";
        
        // Try Relative Path (Standard)
        window.location.replace("charging.html");

    } catch (err) {
        console.error("Redirect Error:", err);
        // Fallback: Force redirect anyway
        window.location.replace("charging.html");
    }
}

// C. NAVIGATION START (Blocked)
function startNavigation() {
    console.log("🛑 Checking battery before Nav start...");
    const isLocked = localStorage.getItem("forceCharging") === "1";
    
    // ⛔ THE WALL: Stops test_navigation.html leak
    if (isLocked) {
        alert("⛔ BATTERY CRITICAL. Cannot start trip.");
        window.location.replace("charging.html");
        return; 
    }

    if(!selectedRoute) return;
    localStorage.setItem('activeTrip', JSON.stringify(selectedRoute));
    window.location.href = '../test/test_navigation.html'; 
}

// =======================================================
// 6. UTILITIES & MAP
// =======================================================
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

function initMap() {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    map = L.map('map', { center: [14.5995, 120.9842], zoom: 12, layers: [osm], zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

async function getWeather() {
    try {
        const res = await fetch(`${API_BASE}/WEATHER/current.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lat: 14.5995, lng: 120.9842 })
        });
        const data = await res.json();
        if(data.ok) document.getElementById('weather-widget').innerHTML = `${data.weather.temp}°C`;
    } catch(e) {}
}

async function calculateTrip() {
    // Also block calculation if critical
    const isLocked = localStorage.getItem("forceCharging") === "1";
    if (isLocked) {
        alert("Battery Critical. Please charge.");
        return;
    }

    // Your Existing Calc Logic...
    const origin = document.getElementById('from-loc').value;
    const dest = document.getElementById('to-loc').value;
    const batt = document.getElementById('battery_level')?.value || document.getElementById('battery-input')?.value;
    
    // UI Code...
    const loader = document.getElementById('loading-overlay');
    const errorBox = document.getElementById('error-msg');

    if(!origin || !dest) {
        if(errorBox) { errorBox.innerText = "Please enter both Start and Destination."; errorBox.classList.remove('hidden'); }
        return;
    }
    if(loader) loader.classList.remove('hidden');
    
    try {
        const res = await fetch(`${API_BASE}/TRIPS/calculate.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: 1, origin, destination: dest, battery_percent: batt })
        });
        const data = await res.json();
        if(loader) loader.classList.add('hidden');
        if(!data.ok) throw new Error(data.error);

        document.getElementById('plan-section').classList.add('hidden');
        document.getElementById('results-section').classList.remove('hidden');
        setTimeout(() => map.invalidateSize(), 200);
        renderResults(data);
    } catch (err) {
        if(loader) loader.classList.add('hidden');
        if(errorBox) { errorBox.innerText = err.message; errorBox.classList.remove('hidden'); }
    }
}

function renderResults(data) {
    const container = document.getElementById('routes-container');
    container.innerHTML = '';
    
    routeLayers.forEach(l => map.removeLayer(l)); routeLayers = [];
    if(destMarker) map.removeLayer(destMarker);
    if(userMarker) map.removeLayer(userMarker);

    if(data.destination_coords) {
        const {lat, lng} = data.destination_coords;
        destMarker = L.marker([lat, lng]).addTo(map).bindPopup("Destination");
        const originVal = document.getElementById('from-loc').value;
        if(originVal.includes(',')) {
            const [olat, olng] = originVal.split(',');
            userMarker = L.marker([olat, olng]).addTo(map).bindPopup("Start");
        }
    }

    data.routes.forEach((route, index) => {
        const isRec = index === 0;
        const points = polyline.decode(route.geometry);
        const color = isRec ? '#3b82f6' : '#94a3b8';
        const weight = isRec ? 6 : 4;
        const line = L.polyline(points, { color, weight, opacity: 0.8 }).addTo(map);
        routeLayers.push({ id: index, layer: line });

        if(isRec) {
            map.fitBounds(line.getBounds().pad(0.1));
            selectedRoute = { route, car: data.car, destLabel: data.destination_label };
            document.getElementById('start-nav-box').classList.remove('hidden');
        }

        const card = document.createElement('div');
        card.className = `route-item ${isRec ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="badge ${isRec ? 'rec' : 'alt'}">${isRec ? 'Recommended' : 'Alternative'}</div>
            <div style="flex justify-between items-center">
                <div>
                    <div style="font-weight:800; font-size:18px;">${route.distance_km} km</div>
                    <div style="font-size:13px; color:#64748b;">${route.duration_min} min</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700; color:#ef4444;">-${route.est_usage}%</div>
                </div>
            </div>
        `;
        card.onclick = () => selectRoute(index, route, data, card);
        container.appendChild(card);
    });
}

function selectRoute(index, route, data, cardEl) {
    document.querySelectorAll('.route-item').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    routeLayers.forEach(item => {
        if(item.id === index) {
            item.layer.setStyle({ color: '#3b82f6', weight: 6 });
            item.layer.bringToFront();
            map.fitBounds(item.layer.getBounds().pad(0.1));
        } else {
            item.layer.setStyle({ color: '#94a3b8', weight: 4 });
        }
    });
    selectedRoute = { route, car: data.car, destLabel: data.destination_label };
}

// Use Location Helper
function useMyLocation() {
    if(!navigator.geolocation) return alert("GPS not supported");
    navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById('from-loc').value = `${pos.coords.latitude}, ${pos.coords.longitude}`;
    });
}
