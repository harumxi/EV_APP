// c:\Users\Alexa\Documents\GitHub\EV_APP\FRONTEND\UI_JS\dashboard.js

// ===== BACKEND LOGIC (MIGRATED & ADAPTED) =====

const API_BASE = "http://localhost/WEBPROG_PROJ/BACKEND/API";
let trips = [];
let socket;

// UNIT PREFERENCES
const RAW_UNIT = localStorage.getItem('units') || localStorage.getItem('pref_units') || 'metric';
const IS_MILES = RAW_UNIT === 'imperial' || RAW_UNIT === 'MILES';
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

    // Initial Fetch for Location & Weather
    fetchDashboardData();
    setInterval(fetchDashboardData, 5 * 60 * 1000); // Refresh every 5 mins

    // Add Warning/SOS Button to Header (Right Cluster)
    const headerUser = document.getElementById('header-user-name');
    const headerRightGroup = headerUser ? headerUser.closest('.flex') : null;

    if (headerRightGroup) {
        const sosBtn = document.createElement("button");
        sosBtn.id = "header-warning-btn";
        sosBtn.className = "relative p-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all mr-1 active:scale-95";
        sosBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <span id="warning-badge" class="absolute top-2 right-2 flex h-2.5 w-2.5 hidden">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
        `;
        sosBtn.title = "Warnings";
        sosBtn.setAttribute("aria-label", "Open warnings");
        sosBtn.onclick = triggerSOS;
        
        // Insert before the profile section to sit in the cluster
        headerRightGroup.insertBefore(sosBtn, headerRightGroup.firstChild);
    }
});

async function fetchTripHistory() {
    const userId = localStorage.getItem("user_id");
    const list = document.getElementById('recent-trips-list');
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
        } else {
            if(list) list.innerHTML = `<div class="p-4 text-center text-xs text-black/40">No recent trips found.</div>`;
        }
    } catch(e) { 
        console.error("Failed to fetch trips", e);
        if(list) list.innerHTML = `<div class="p-4 text-center text-xs text-red-400">Unable to load trips.</div>`;
    }
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
    const activeCar = JSON.parse(localStorage.getItem('active_car') || "null");
    // Default to 160 Wh/km and 60 kWh if no active car found
    const carEff = activeCar ? parseFloat(activeCar.efficiency) : 160;
    const carBatt = activeCar ? parseFloat(activeCar.battery_kwh) : 60;

    let totalDist = 0;
    let totalSavings = 0;
    let totalEnergyWh = 0;

    trips.forEach(trip => {
        totalDist += trip.dist;
        totalSavings += (trip.dist * 0.192); // kg CO2
        
        // Calculate energy based on actual drain if available, else use car efficiency
        if (trip.drained > 0) {
            const kwhUsed = (trip.drained / 100) * carBatt;
            totalEnergyWh += (kwhUsed * 1000);
        } else {
            totalEnergyWh += (trip.dist * carEff);
        }
    });

    const avgEfficiency = totalDist > 0 ? (totalEnergyWh / totalDist) : carEff;
    const totalHoursDriven = (totalDist / 30);
    const timeSaved = totalHoursDriven * 0.15; 
    
    const effEl = document.getElementById('stat-efficiency');
    if(effEl) effEl.innerText = Math.round(avgEfficiency / DIST_FACTOR) + ` Wh/${DIST_LABEL}`;

    const co2El = document.getElementById('stat-co2');
    if(co2El) co2El.innerText = (totalEnergyWh / 1000).toFixed(1) + " kWh";

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
        const energy = (trip.dist * 0.16).toFixed(1);
        
        const div = document.createElement('div');
        // Glass List Item: Frosted strip, lighter border, soft shadow
        div.className = "flex items-center justify-between rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-md p-4 shadow-sm mb-3 last:mb-0 transition-all hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5";
        div.innerHTML = `
            <div>
              <div class="text-sm font-bold text-gray-900">${trip.to}</div>
              <div class="text-xs text-gray-500 mt-1.5">${trip.date} · ${(trip.dist * DIST_FACTOR).toFixed(1)} ${DIST_LABEL}</div>
            </div>
            <div class="px-3 py-1.5 rounded-full bg-white/60 border border-white/50 text-xs font-bold text-emerald-600 shadow-sm backdrop-blur-sm">${energy} kWh</div>
        `;
        container.appendChild(div);
    });
}

function renderCharts() {
    // Inject Canvas into Placeholder
    const container = document.getElementById('chart-container');
    if(container && typeof Chart !== 'undefined') {
        container.innerHTML = '<canvas id="co2Chart" style="width:100%; height:100%;"></canvas>';
        
        // Prepare Data: Last 7 Days (Accurate Timeline)
        const last7Days = [];
        const dataMap = {};
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0,0,0,0);
            const key = d.getTime();
            last7Days.push({ 
                key: key, 
                label: d.toLocaleDateString('en-US', { weekday: 'short' }) 
            });
            dataMap[key] = 0;
        }

        trips.forEach(t => {
            const tDate = new Date(t.rawDate);
            tDate.setHours(0,0,0,0);
            const key = tDate.getTime();
            if (dataMap.hasOwnProperty(key)) {
                dataMap[key] += (t.dist * 0.16);
            }
        });

        const labels = last7Days.map(d => d.label);
        const data = last7Days.map(d => dataMap[d.key].toFixed(2));

        const ctx = document.getElementById('co2Chart').getContext('2d');
        
        // UI: Gradient Fill
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Energy Used',
                    data: data,
                    borderColor: '#10b981',
                    borderWidth: 3,
                    tension: 0.4, // Smooth curves
                    pointRadius: 4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    fill: true,
                    backgroundColor: gradient
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)', // More transparent glass tooltip
                        titleColor: '#111827',
                        bodyColor: '#6B7280',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 16,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `${context.parsed.y} kWh`
                        }
                    }
                },
                scales: {
                    x: { 
                        display: true,
                        grid: { display: false },
                        ticks: {
                            color: '#9ca3af',
                            font: { size: 11, weight: '500' }
                        }
                    },
                    y: { 
                        display: false,
                        min: 0
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                }
            }
        });
    }
}

// SOS Function (Preserved but not bound to UI)
async function triggerSOS() {
    if (document.getElementById('sos-confirm-modal')) return;

    const html = `
        <div id="sos-confirm-modal" class="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white/90 backdrop-blur-xl rounded-[32px] max-w-sm w-full overflow-hidden shadow-2xl border border-white/40 animate-in fade-in zoom-in duration-300">
                <div class="bg-red-600 p-6 text-white text-center">
                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    </div>
                    <h2 class="text-2xl font-black uppercase tracking-tight">Emergency SOS</h2>
                    <p class="mt-1 font-bold opacity-90">Are you sure?</p>
                </div>
                <div class="p-6 space-y-3">
                    <p class="text-gray-600 text-sm text-center px-2">This will send your current location to all emergency contacts and signal nearby hubs.</p>
                    
                    <div class="flex gap-3 pt-2">
                        <button id="cancel-sos" class="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all active:scale-95">
                            Cancel
                        </button>
                        <button id="confirm-sos" class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95">
                            Send SOS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('cancel-sos').onclick = () => document.getElementById('sos-confirm-modal').remove();
    document.getElementById('confirm-sos').onclick = async () => {
        document.getElementById('sos-confirm-modal').remove();
        
        if (!navigator.geolocation) return alert("GPS not supported.");

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const userId = localStorage.getItem("user_id");
                let contacts = JSON.parse(localStorage.getItem(`emergency_contacts_`) || "[]");
                
                if (contacts.length === 0) {
                    showNoContactsModal();
                    return;
                }

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
                showSOSSuccessModal();
            } catch (e) { alert("Connection Error"); }
        });
    };
}

function showSOSSuccessModal() {
    const html = `
        <div id="sos-success-modal" class="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white/90 backdrop-blur-xl rounded-[32px] max-w-sm w-full overflow-hidden shadow-2xl border border-white/40 animate-in fade-in zoom-in duration-300">
                <div class="bg-emerald-600 p-6 text-white text-center">
                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h2 class="text-2xl font-black uppercase tracking-tight">Signal Sent</h2>
                    <p class="mt-1 font-bold opacity-90">Help is on the way</p>
                </div>
                <div class="p-6 space-y-3">
                    <p class="text-gray-600 text-sm text-center px-2 text-gray-600">Your emergency contacts have been notified with your current location.</p>
                    <button id="close-sos-success" class="w-full py-3 bg-black text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-black/10">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('close-sos-success').onclick = () => document.getElementById('sos-success-modal').remove();
}

function showNoContactsModal() {
    const html = `
        <div id="no-contacts-modal" class="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white/90 backdrop-blur-xl rounded-[32px] max-w-sm w-full overflow-hidden shadow-2xl border border-white/40 animate-in fade-in zoom-in duration-300">
                <div class="bg-orange-500 p-6 text-white text-center">
                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h2 class="text-2xl font-black uppercase tracking-tight">No Contacts</h2>
                    <p class="mt-1 font-bold opacity-90">Emergency SOS</p>
                </div>
                <div class="p-6 space-y-3">
                    <p class="text-gray-600 text-sm text-center px-2">No emergency contacts saved. Please add contacts in your profile to use this feature.</p>
                    <button id="close-no-contacts" class="w-full py-3 bg-black text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-black/10">
                        OK
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('close-no-contacts').onclick = () => document.getElementById('no-contacts-modal').remove();
}

// ===== WEATHER & LOCATION INTEGRATION =====

async function fetchDashboardData() {
    setLoadingState(true);

    try {
        let lat = 14.5995, lng = 120.9842; // Default to Manila if GPS fails
        try {
            const pos = await getCurrentPosition();
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
        } catch(e) { console.warn("GPS error, using default", e); }
        
        // Weather
        const weatherRes = await fetch(`${API_BASE}/WEATHER/current.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng })
        });
        const weatherData = await weatherRes.json();

        if (weatherData.ok && weatherData.weather) {
            updateWeatherCard(weatherData.weather);
        } else {
            throw new Error("Weather data unavailable");
        }

        // Location (Using Nominatim)
        const locRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const locData = await locRes.json();

        if (locData && locData.display_name) {
             updateLocationCard({
                address: locData.display_name.split(',').slice(0, 2).join(','),
                details: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            });
        } else {
             throw new Error("Location data unavailable");
        }

        setLoadingState(false);

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        setErrorState();
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    });
}

function updateWeatherCard(data) {
    const cityEl = document.getElementById('weather-city');
    const tempEl = document.getElementById('weather-temp');
    const condEl = document.getElementById('weather-condition');
    const feelsEl = document.getElementById('weather-feels');
    const humEl = document.getElementById('weather-humidity');
    const windEl = document.getElementById('weather-wind');

    if(cityEl) cityEl.textContent = data.city || 'Local';
    if(tempEl) tempEl.textContent = `${Math.round(data.temp)}°C`;
    if(condEl) condEl.textContent = data.condition || data.description || '--';
    
    if(feelsEl) feelsEl.textContent = `Feels: ${Math.round(data.feels_like || data.temp)}°C`;
    if(humEl) humEl.textContent = `Humidity: ${data.humidity}%`;
    if(windEl) windEl.textContent = `Wind: ${data.wind_speed || 0} kph`;
}

function updateLocationCard(data) {
    const addrEl = document.getElementById('loc-address');
    const detEl = document.getElementById('loc-details');
    
    if(addrEl) addrEl.textContent = data.address;
    if(detEl) detEl.textContent = data.details;
}

function setLoadingState(isLoading) {
    const ids = ['loc-address', 'weather-temp', 'weather-condition'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (isLoading) el.classList.add('animate-pulse', 'opacity-50');
            else el.classList.remove('animate-pulse', 'opacity-50');
        }
    });
}

function setErrorState() {
    setLoadingState(false);
    const addrEl = document.getElementById('loc-address');
    const tempEl = document.getElementById('weather-temp');
    const condEl = document.getElementById('weather-condition');

    if(addrEl) addrEl.innerHTML = '<span class="text-red-500">Unable to load</span> <button onclick="fetchDashboardData()" class="text-xs underline ml-2">Retry</button>';
    if(tempEl) tempEl.innerHTML = '<span class="text-lg text-red-500">Error</span>';
    if(condEl) condEl.innerHTML = '<button onclick="fetchDashboardData()" class="text-xs underline">Retry</button>';
}
