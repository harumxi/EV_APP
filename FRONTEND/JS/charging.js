document.addEventListener("DOMContentLoaded", () => {
    // 1. Check if we are in a "Locked" state from the Trip Planner
    checkLockState();
});

function checkLockState() {
    const lockStatus = localStorage.getItem('ev_lock_status'); // 'critical', 'emergency', or 'unlocked'
    const mode = localStorage.getItem('ev_charging_mode');     // 'home' or 'public'
    
    // A. NORMAL MODE (Not locked)
    if (!lockStatus || lockStatus === 'unlocked') {
        initNormalMap();
        return;
    }

    // B. LOCKED MODE (Critical/Emergency)
    // Add a class to body to styling (optional) and prevent "Back" navigation
    document.body.classList.add('charging-lock-active'); 
    
    if (mode === 'home') {
        renderHomeChargingUI(lockStatus);
    } else if (mode === 'public') {
        renderPublicChargingUI(lockStatus);
    }
}

// --- 1. HOME CHARGING UI ---
function renderHomeChargingUI(severity) {
    // Overwrite the Sidebar content entirely
    const sidebar = document.querySelector('.sidebar');
    const colorClass = severity === 'emergency' ? 'text-red-600' : 'text-orange-600';
    
    sidebar.innerHTML = `
        <div class="p-6 h-full flex flex-col">
            <h1 class="text-3xl font-black ${colorClass} mb-2 tracking-tight">Home Charging</h1>
            <p class="text-gray-500 mb-6 font-medium">Connect your vehicle. You cannot drive until charged.</p>
            
            <div class="flex-1 flex flex-col justify-center items-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mb-6">
                <div class="text-6xl mb-4 animate-bounce">🔌</div>
                <label class="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Current Charge Level</label>
                <div class="flex items-baseline">
                    <input type="number" id="charge-input" class="text-6xl font-black text-center w-32 bg-transparent focus:outline-none text-gray-900 placeholder-gray-200" placeholder="0" min="0" max="100">
                    <span class="text-3xl text-gray-400 font-bold">%</span>
                </div>
            </div>

            <div id="unlock-msg" class="text-center text-sm font-bold text-red-500 mb-4 bg-red-50 p-2 rounded-lg hidden">
                <i class="fa-solid fa-lock"></i> Must be at least 70% to unlock.
            </div>

            <button onclick="validateChargeLevel()" class="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-xl hover:bg-gray-800 transition shadow-lg transform active:scale-95">
                Update & Unlock Trip Planner
            </button>
        </div>
    `;
    
    // Disable map interaction visually to focus on the sidebar
    const mapDiv = document.getElementById('map');
    if(mapDiv) {
        mapDiv.style.opacity = "0.5";
        mapDiv.style.pointerEvents = "none";
        mapDiv.style.filter = "grayscale(100%)";
    }
}

// --- 2. PUBLIC CHARGING UI ---
function renderPublicChargingUI(severity) {
    // Get the target station details we saved in trip_planner
    const targetRaw = localStorage.getItem('ev_target_charger');
    
    // Fallback if data is missing
    if (!targetRaw) { 
        renderHomeChargingUI(severity); 
        return; 
    } 
    
    const target = JSON.parse(targetRaw);

    // Initialize Map centered EXACTLY on the target station
    const map = L.map('map', { zoomControl: false }).setView([target.location.latitude, target.location.longitude], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Add a big pulsing marker
    const chargerIcon = L.divIcon({
        html: '<div style="font-size:40px; filter:drop-shadow(0 4px 4px rgba(0,0,0,0.2));">⚡</div>',
        className: 'animate-bounce',
        iconSize: [40, 40], iconAnchor: [20, 40]
    });

    L.marker([target.location.latitude, target.location.longitude], {icon: chargerIcon})
        .addTo(map)
        .bindPopup(`<b>${target.name}</b><br>Target Destination`)
        .openPopup();

    // Modify Sidebar to show "Navigation Mode"
    const sidebar = document.querySelector('.sidebar');
    sidebar.innerHTML = `
        <div class="p-6 h-full flex flex-col">
            <div class="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded-r-lg">
                <h3 class="font-bold text-blue-800 text-lg">⚠️ Emergency Routing Active</h3>
                <p class="text-sm text-blue-600 mt-1">Navigate to <b>${target.name}</b> immediately. Do not make other stops.</p>
            </div>

            <div class="flex-1">
                 <div class="text-gray-400 text-center mt-10 text-sm">
                    <i class="fa-solid fa-route text-4xl mb-2"></i><br>
                    Follow safe route to charger.
                 </div>
            </div>
            
            <button onclick="renderHomeChargingUI('${severity}')" class="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg animate-pulse hover:bg-green-700 transition">
                ✅ I Have Arrived & Charged
            </button>
            
            <div class="mt-4 text-center text-xs text-gray-400 font-medium">
                Trip Planner is locked until charging is complete.
            </div>
        </div>
    `;
}

// --- 3. UNLOCK LOGIC ---
function validateChargeLevel() {
    const input = document.getElementById('charge-input');
    const val = parseInt(input.value);
    const msg = document.getElementById('unlock-msg');

    if (isNaN(val)) return;

    // RULE: BYD Logic - Unlock only if >= 70%
    if (val >= 70) {
        // SUCCESS: Unlock the app
        localStorage.setItem('user_battery_level', val); // Sync with Dashboard
        localStorage.setItem('ev_lock_status', 'unlocked');
        localStorage.removeItem('ev_charging_mode');
        
        alert("Battery Level Confirmed. System Unlocked. Drive Safely! 🚗💨");
        window.location.href = 'trip_planner.html';
    } else {
        // FAIL: Keep locked
        msg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Charge is only ${val}%. System unlocks at 70%.`;
        msg.classList.remove('hidden');
        input.classList.add('text-red-600');
        input.classList.remove('text-gray-900');
    }
}

// --- 4. STANDARD MAP (Normal Browsing) ---
function initNormalMap() {
    // This runs if the user just clicked "Find Chargers" normally (not emergency)
    // You can paste your ORIGINAL charging.html map code here if you want it distinct.
    // For now, I'll initialize a basic view or call your existing logic.
    
    // (If you kept your original logic inside a function called init(), just call it here)
    if (typeof init === 'function') {
        init();
    }
}