// --- 1. CONFIGURATION ---
let map, carMarker, routePolyline;
let animationFrameId;
let isExpanded = false;

// UNIT PREFERENCES
const PREF_UNIT = localStorage.getItem('pref_units') || 'KM';
const DIST_FACTOR = PREF_UNIT === 'MILES' ? 0.621371 : 1;
const DIST_LABEL = PREF_UNIT === 'MILES' ? 'mi' : 'km';

const carIcon = L.divIcon({ 
    html: '<div style="font-size:40px; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));">🚗</div>', 
    className: 'car-marker', iconSize: [40, 40], iconAnchor: [20, 20] 
});

const destIcon = L.divIcon({
    html: '<div style="font-size:32px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">🏁</div>',
    className: '', iconSize: [30, 30], iconAnchor: [5, 30]
});

// --- 2. INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadTripData();
    startClock();
    
    // Load Car Name
    const activeCar = JSON.parse(localStorage.getItem('active_car') || "{}");
    const carNameEl = document.getElementById('header-car-name');
    if(activeCar.brand && carNameEl) {
        carNameEl.innerText = `${activeCar.brand} ${activeCar.model}`;
    }
});

function initMap() {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
    
    map = L.map('map', { zoomControl: false, layers: [osm] }).setView([14.5995, 120.9842], 15);
    
    // Store layers
    map.layers = { osm, satellite };
    map.currentLayer = 'osm';
}

function toggleMapLayer() {
    if (map.currentLayer === 'osm') {
        map.removeLayer(map.layers.osm);
        map.addLayer(map.layers.satellite);
        map.currentLayer = 'satellite';
    } else {
        map.removeLayer(map.layers.satellite);
        map.addLayer(map.layers.osm);
        map.currentLayer = 'osm';
    }
}

// --- UI LOGIC ---
function toggleSheet() {
    isExpanded = !isExpanded;
    const sheet = document.getElementById('trip-sheet');
    // 160px is the peek height
    sheet.style.transform = isExpanded ? 'translate(-50%, 0)' : 'translate(-50%, calc(100% - 160px))';
}

function startClock() {
    setInterval(() => {
        const d = new Date();
        document.getElementById('time-display').innerText = d.toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", hour12: false
        });
    }, 1000);
}

// --- 3. LOAD & ANIMATE ---
function loadTripData() {
    try {
        // Get data from Trip Planner
        const tripDataRaw = localStorage.getItem('activeTrip');
        if (!tripDataRaw) {
            alert("No active trip found.");
            window.location.href = "trip_planner.html";
            return;
        }

        const trip = JSON.parse(tripDataRaw);
        const route = trip.route;

        // 1. POPULATE NEW UI
        document.getElementById('origin-display').innerText = trip.origin || "Current Location";
        document.getElementById('dest-display').innerText = trip.destination || trip.destLabel || "Destination";
        
        const distStr = (route.distance_km * DIST_FACTOR).toFixed(1) + " " + DIST_LABEL;
        const etaStr = route.duration_min + " min";

        document.getElementById('dist-small').innerText = distStr;
        document.getElementById('eta-small').innerText = etaStr;
        document.getElementById('dist-large').innerText = distStr;
        document.getElementById('eta-large').innerText = etaStr;
        
        // Battery Ring Logic
        const endBatt = route.end_battery;
        document.getElementById('batt-percent').innerText = endBatt;
        
        // SVG Ring Calculation
        // r=46, Circumference = 2 * PI * 46 ≈ 289.02
        const circle = document.getElementById('batt-ring-circle');
        const circumference = 2 * Math.PI * 46;
        const offset = circumference * (1 - (endBatt / 100));
        circle.style.strokeDashoffset = offset;
        
        // Color logic
        if(endBatt < 20) circle.style.stroke = "#ef4444"; // Red
        else if(endBatt < 50) circle.style.stroke = "#eab308"; // Yellow
        else circle.style.stroke = "#22c55e"; // Green

        // 2. DRAW MAP
        const coords = polyline.decode(route.geometry);
        
        routePolyline = L.polyline(coords, {
            color: '#3b82f6', weight: 8, opacity: 0.8, lineCap: 'round'
        }).addTo(map);

        map.fitBounds(routePolyline.getBounds(), { padding: [80, 80] });

        const endPoint = coords[coords.length - 1];
        L.marker(endPoint, {icon: destIcon}).addTo(map);

        // 3. START CAR
        animateCar(coords);

    } catch (e) {
        console.error("Error:", e);
        alert("Error loading route.");
    }
}

function animateCar(pathCoords) {
    if(carMarker) map.removeLayer(carMarker);
    carMarker = L.marker(pathCoords[0], {icon: carIcon}).addTo(map);
    
    let i = 0;
    const speed = 1; // Animation speed
    
    async function move() {
        if (i >= pathCoords.length) {
            await saveTripLog(); // Save automatically on arrival
            alert("You have arrived! 🏁");
            window.location.href = "trip_planner.html";
            return;
        }
        
        const newPos = pathCoords[i];
        carMarker.setLatLng(newPos);
        map.panTo(newPos, { animate: true, duration: 0.1 }); // Smooth follow

        i += speed;
        animationFrameId = requestAnimationFrame(move);
    }
    move();
}

async function saveTripLog() {
    try {
        const tripDataRaw = localStorage.getItem('activeTrip');
        if (tripDataRaw) {
            const trip = JSON.parse(tripDataRaw);
            
            // Update Dashboard Battery based on trip result
            if (trip.route && trip.route.end_battery !== undefined) {
                localStorage.setItem('user_battery_level', trip.route.end_battery);
            }

            const userId = localStorage.getItem("user_id");
            
            if (!userId) return; // Skip if not logged in

            const res = await fetch('http://localhost/WEBPROG_PROJ/BACKEND/API/BATTERY/logs.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    distance_km: trip.route.distance_km,
                    battery_drained: trip.route.est_usage,
                    origin: trip.origin || "Unknown",
                    destination: trip.destination || trip.destLabel || "Unknown"
                })
            });

            if (!res.ok) {
                console.error("Failed to save trip:", await res.text());
            } else {
                console.log("Trip saved successfully");
            }
        }
    } catch(e) { 
        console.error("Failed to save trip log", e);
    }
}

function openCancelModal() {
    document.getElementById('cancel-modal').classList.remove('hidden');
}

function closeCancelModal() {
    document.getElementById('cancel-modal').classList.add('hidden');
}

async function confirmEndTrip() {
    await saveTripLog();
    window.location.href = "trip_planner.html";
}

