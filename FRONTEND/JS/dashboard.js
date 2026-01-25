// c:\Users\Alexa\Documents\GitHub\EV_APP\FRONTEND\UI_JS\dashboard.js

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

    // Initial Fetch for Location & Weather
    fetchDashboardData();
    setInterval(fetchDashboardData, 5 * 60 * 1000); // Refresh every 5 mins
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
        // Glass List Item: Frosted strip, lighter border, soft shadow
        div.className = "flex items-center justify-between rounded-[20px] border border-white/40 bg-white/40 backdrop-blur-md p-4 shadow-sm mb-3 last:mb-0 transition-all hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5";
        div.innerHTML = `
            <div>
              <div class="text-sm font-bold text-gray-900">${trip.to}</div>
              <div class="text-xs text-gray-500 mt-1.5">${trip.date} · ${(trip.dist * DIST_FACTOR).toFixed(1)} ${DIST_LABEL}</div>
            </div>
            <div class="px-3 py-1.5 rounded-full bg-white/60 border border-white/50 text-xs font-bold text-emerald-600 shadow-sm backdrop-blur-sm">${savings} kg saved</div>
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
                dataMap[key] += (t.dist * 0.192);
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
                    label: 'CO₂ Saved',
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
                            label: (context) => `${context.parsed.y} kg CO₂ Saved`
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
