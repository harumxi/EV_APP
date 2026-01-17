// CONFIGURATION
const API_BASE = 'http://localhost/WEBPROG_PROJ/BACKEND/api';
let map, userMarker, destMarker, routeLayers = [];
let selectedRoute = null;

// 1. INITIALIZE ICONS
lucide.createIcons();

// 2. WEATHER & MAP SETUP ON LOAD
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    getWeather();
    updateBatteryStats(); // Initial calc
});

// 3. BATTERY INPUT LISTENER
document.getElementById('battery-input').addEventListener('input', updateBatteryStats);

function updateBatteryStats() {
    const pct = document.getElementById('battery-input').value;
    // Assuming 75kWh battery capacity for Model 3 Long Range
    const capacity = 75; 
    const energy = (pct / 100) * capacity;
    // Avg efficiency ~150Wh/km -> 6.6 km/kWh
    const range = Math.round(energy * 6.6);

    document.getElementById('energy-val').innerText = energy.toFixed(1) + " kWh";
    document.getElementById('range-val').innerText = range + " km";
}

// 4. MAP INITIALIZATION (Leaflet)
function initMap() {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 });

    map = L.map('map', {
        center: [14.5995, 120.9842], // Manila
        zoom: 12,
        layers: [osm], // Default
        zoomControl: false
    });
    
    L.control.layers({ "Map": osm, "Satellite": satellite, "Dark": dark }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

// 5. GET WEATHER
async function getWeather() {
    try {
        // Default Manila
        const res = await fetch(`${API_BASE}/WEATHER/current.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lat: 14.5995, lng: 120.9842 })
        });
        const data = await res.json();
        if(data.ok) {
            document.getElementById('weather-widget').innerHTML = 
                `<i class="fa-solid fa-cloud-sun"></i> ${data.weather.temp}°C ${data.weather.condition}`;
        }
    } catch(e) { console.warn("Weather error", e); }
}

// 6. USE MY LOCATION
function useMyLocation() {
    const btn = document.querySelector('.loc-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    if(!navigator.geolocation) return alert("GPS not supported");
    
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        document.getElementById('from-loc').value = `${latitude}, ${longitude}`;
        btn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
    }, err => {
        alert("Location access denied. Please enable GPS.");
        btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';
    });
}

// 7. MAIN FUNCTION: CALCULATE TRIP
async function calculateTrip() {
    const origin = document.getElementById('from-loc').value;
    const dest = document.getElementById('to-loc').value;
    const batt = document.getElementById('battery-input').value;
    const loader = document.getElementById('loading-overlay');
    const errorBox = document.getElementById('error-msg');

    if(!origin || !dest) {
        errorBox.innerText = "Please enter both Start and Destination.";
        errorBox.classList.remove('hidden');
        return;
    }

    // UI Transition
    loader.classList.remove('hidden');
    errorBox.classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/TRIPS/calculate.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: 1, origin, destination: dest, battery_percent: batt })
        });
        
        const data = await res.json();
        loader.classList.add('hidden');

        if(!data.ok) throw new Error(data.error);

        // SUCCESS: Switch Views
        document.getElementById('plan-section').classList.add('hidden');
        document.getElementById('results-section').classList.remove('hidden');
        
        // Re-size map (Leaflet bug fix when showing hidden div)
        setTimeout(() => map.invalidateSize(), 200);

        renderResults(data);

    } catch (err) {
        loader.classList.add('hidden');
        errorBox.innerText = err.message;
        errorBox.classList.remove('hidden');
    }
}

// 8. RENDER ROUTES & MAP
function renderResults(data) {
    const container = document.getElementById('routes-container');
    container.innerHTML = '';
    
    // Clear Map
    routeLayers.forEach(l => map.removeLayer(l)); routeLayers = [];
    if(destMarker) map.removeLayer(destMarker);
    if(userMarker) map.removeLayer(userMarker);

    // Add Markers
    if(data.destination_coords) {
        const {lat, lng} = data.destination_coords;
        destMarker = L.marker([lat, lng]).addTo(map).bindPopup("Destination");
        
        // Try to parse origin if it's coordinates
        const originVal = document.getElementById('from-loc').value;
        if(originVal.includes(',')) {
            const [olat, olng] = originVal.split(',');
            userMarker = L.marker([olat, olng]).addTo(map).bindPopup("Start");
        }
    }

    // Process Routes
    data.routes.forEach((route, index) => {
        const isRec = index === 0;
        
        // Draw on Map
        const points = polyline.decode(route.geometry);
        const color = isRec ? '#3b82f6' : '#94a3b8';
        const weight = isRec ? 6 : 4;
        const line = L.polyline(points, { color, weight, opacity: 0.8 }).addTo(map);
        routeLayers.push({ id: index, layer: line });

        // Auto-select first route
        if(isRec) {
            map.fitBounds(line.getBounds().pad(0.1));
            selectedRoute = { route, car: data.car, destLabel: data.destination_label };
            document.getElementById('start-nav-box').classList.remove('hidden');
        }

        // Create UI Card
        const card = document.createElement('div');
        card.className = `route-item ${isRec ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="badge ${isRec ? 'rec' : 'alt'}">${isRec ? 'Recommended' : 'Alternative'}</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:800; font-size:18px;">${route.distance_km} km</div>
                    <div style="font-size:13px; color:#64748b;">Est. Time: ${route.duration_min} min</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700; color:#ef4444;">-${route.est_usage}%</div>
                    <div style="font-size:12px; font-weight:600; color:#10b981;">End: ${route.end_battery}%</div>
                </div>
            </div>
        `;

        card.onclick = () => selectRoute(index, route, data, card);
        container.appendChild(card);
    });
}

function selectRoute(index, route, data, cardEl) {
    // UI Update
    document.querySelectorAll('.route-item').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');

    // Map Update
    routeLayers.forEach(item => {
        if(item.id === index) {
            item.layer.setStyle({ color: '#3b82f6', weight: 6 });
            item.layer.bringToFront();
            map.fitBounds(item.layer.getBounds().pad(0.1));
        } else {
            item.layer.setStyle({ color: '#94a3b8', weight: 4 });
        }
    });

    // Save Data
    selectedRoute = { route, car: data.car, destLabel: data.destination_label };
}

// 9. START & RESET
function startNavigation() {
    if(!selectedRoute) return;
    localStorage.setItem('activeTrip', JSON.stringify(selectedRoute));
    // Assuming navigation page is at root or similar level
    window.location.href = '../test/test_navigation.html'; 
}

function resetPlanner() {
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('plan-section').classList.remove('hidden');
    document.getElementById('start-nav-box').classList.add('hidden');
    document.getElementById('from-loc').value = '';
    document.getElementById('to-loc').value = '';
}