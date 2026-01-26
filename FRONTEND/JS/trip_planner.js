// ===== CONFIG & BACKEND API =====
const BASE_API = "http://localhost/WEBPROG_PROJ/BACKEND/API";
const USER_ID = localStorage.getItem("user_id");
let myLat = 14.5995, myLng = 120.9842; 
let activeCar = null;
let selectedOrigin = null;
let selectedDest = null;
let selectedRouteObject = null;

// UNIT PREFERENCES
const PREF_UNIT = localStorage.getItem('pref_units') || 'KM';
const DIST_FACTOR = PREF_UNIT === 'MILES' ? 0.621371 : 1;
const DIST_LABEL = PREF_UNIT === 'MILES' ? 'mi' : 'km';

// ===== UI HELPERS =====
lucide.createIcons();

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function hasText(v){ return String(v || "").trim().length > 0; }

/* Elements */
const resultsSection = document.getElementById("results-section");
const routesList = document.getElementById("routes-list");
const recalcBtn = document.getElementById("recalc-btn");
const startNavBtn = document.getElementById("start-nav");
const fromInput = document.getElementById("from-input");
const toInput = document.getElementById("to-input");
const afterStartLoading = document.getElementById("after-start-loading");

/* Connector Swap */
const connectorBtn = document.querySelector(".connector");
if (connectorBtn) {
  connectorBtn.addEventListener("click", () => {
    if (fromInput.disabled || toInput.disabled) return;
    const tmp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = tmp;
    // Swap selected objects too
    const tmpObj = selectedOrigin;
    selectedOrigin = selectedDest;
    selectedDest = tmpObj;
  });
}

const batteryBox = document.getElementById("battery-box");
const fromBox = document.getElementById("from-box");
const toBox = document.getElementById("to-box");

/* Inject icons if missing */
function ensureInputIcons() {
  if (fromBox && !fromBox.querySelector("svg") && !fromBox.querySelector("i")) {
    const i = document.createElement("i");
    i.setAttribute("data-lucide", "circle");
    i.style.width = "18px";
    i.style.height = "18px";
    i.style.color = "#9ca3af";
    i.style.fill = "#e5e7eb";
    fromBox.insertBefore(i, fromBox.firstChild);
  }
  if (toBox && !toBox.querySelector("svg") && !toBox.querySelector("i")) {
    const i = document.createElement("i");
    i.setAttribute("data-lucide", "map-pin");
    i.style.width = "18px";
    i.style.height = "18px";
    i.style.color = "#ef4444";
    i.style.fill = "rgba(239,68,68,0.1)";
    toBox.insertBefore(i, toBox.firstChild);
  }
  lucide.createIcons();
}
ensureInputIcons();

function showAfterStartLoading(ms = 900) {
  afterStartLoading.classList.add("show");
  return new Promise((res) => setTimeout(() => {
    afterStartLoading.classList.remove("show");
    res();
  }, ms));
}

/* ✅ Lock/unlock inputs */
function setInputsLocked(locked) {
  batInput.disabled = locked;
  fromInput.disabled = locked;
  toInput.disabled = locked;

  batteryBox.classList.toggle("locked", locked);
  fromBox.classList.toggle("locked", locked);
  toBox.classList.toggle("locked", locked);

  // Hide suggestion dropdowns when locking
  document.getElementById("from-suggest").style.display = "none";
  document.getElementById("to-suggest").style.display = "none";
}

/* Inline Alert & Validation Helpers */
function showInlineAlert(msg) {
    const el = document.getElementById("inline-alert");
    const txt = document.getElementById("inline-alert-msg");
    if(el && txt) {
        txt.textContent = msg;
        el.classList.remove("hidden");
    }
}
function hideInlineAlert() {
    const el = document.getElementById("inline-alert");
    if(el) el.classList.add("hidden");
}
function setInputError(id, active) {
    const el = document.getElementById(id);
    if(el) el.classList.toggle("error", active);
}

/* Map */
const map = L.map("map", { zoomControl: false }).setView([14.5547, 121.0244], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

let routeLayers = [];
let startMarker = null, endMarker = null;

function clearMapLayers(){
  routeLayers.forEach(l => map.removeLayer(l));
  routeLayers = [];
  if (startMarker) { map.removeLayer(startMarker); startMarker = null; }
  if (endMarker) { map.removeLayer(endMarker); endMarker = null; }
}

function addMarker(lat, lng, label, isStart){
  const color = isStart ? '#16a34a' : '#dc2626'; 
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" style="filter:drop-shadow(0 3px 3px rgba(0,0,0,0.5))"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`;
  const icon = L.divIcon({ html: svg, className: '', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
  const m = L.marker([lat, lng], {icon}).addTo(map).bindPopup(label);
  return m;
}

function drawRoute(encoded, isSelected, idx){
  if (typeof polyline === 'undefined') return;
  const pts = polyline.decode(encoded); 
  const color = isSelected ? "#2563eb" : "#94a3b8";
  const line = L.polyline(pts, { color, weight: isSelected?6:4, opacity: isSelected?1:0.6 }).addTo(map);
  line.routeId = idx; 
  if(isSelected) { line.bringToFront(); map.fitBounds(line.getBounds().pad(0.1)); } 
  routeLayers.push(line);
}

function highlightRoute(idx){ 
  routeLayers.forEach(l => { 
    const isSel = (l.routeId === idx); 
    l.setStyle({ color: isSel ? "#2563eb" : "#9ca3af", weight: isSel?6:4, opacity: isSel?1:0.6 }); 
    if(isSel) l.bringToFront(); 
  }); 
}

/* Battery */
const batInput = document.getElementById("bat-input");
const batDisplay = document.getElementById("bat-display");
const energyTxt = document.getElementById("energy-txt");
const rangeTxt  = document.getElementById("range-txt");
const ringProgress = document.querySelector(".ring-progress");
const batError = document.getElementById("bat-error");

const RING_R = 52;
const CIRC = 2 * Math.PI * RING_R;
ringProgress.style.strokeDasharray = `${CIRC}`;
ringProgress.style.strokeDashoffset = `${CIRC}`;

let lastValidBattery = 75;

function setRing(percent){
  const p = clamp(Number(percent || 0), 0, 100);
  const offset = CIRC * (1 - p / 100);
  ringProgress.style.strokeDashoffset = `${offset}`;
}

function estimateRangeKm(batteryPct){ 
    // Use active car efficiency if available
    let maxRange = 300;
    if(activeCar && activeCar.range_km) maxRange = activeCar.range_km;
    return Math.round(maxRange * (batteryPct / 100) * DIST_FACTOR); 
}

function setBatteryError(on){ batError.classList.toggle("show", !!on); }
function isBatteryValid(n){ return Number.isFinite(n) && n >= 0 && n <= 100; }
function readBatteryRaw(){
  const raw = String(batInput.value ?? "").trim();
  if (raw === "") return NaN;
  return Number(raw);
}
function applyBatteryUI(val){
  setRing(val);
  batDisplay.textContent = String(val);
  
  let capacity = 60; // Default 60kWh
  if(activeCar && activeCar.battery_kwh) capacity = parseFloat(activeCar.battery_kwh);
  
  const kwh = (capacity * val / 100);
  const dist = estimateRangeKm(val);
  energyTxt.textContent = `${kwh.toFixed(1)} kWh`;
  rangeTxt.textContent  = `${dist} ${DIST_LABEL}`;
}
function validateAndCommitBattery(){
  const n = readBatteryRaw();
  if (!isBatteryValid(n)) {
    setBatteryError(true);
    batInput.value = String(lastValidBattery);
    applyBatteryUI(lastValidBattery);
    return { ok:false, value:lastValidBattery };
  }
  setBatteryError(false);
  const v = Math.round(n);
  lastValidBattery = v;
  batInput.value = String(v);
  applyBatteryUI(v);
  return { ok:true, value:v };
}

batInput.addEventListener("input", () => {
  if (batInput.disabled) return;
  const n = readBatteryRaw();
  if (isBatteryValid(n)) {
    setBatteryError(false);
    applyBatteryUI(n);
  } else {
    if (Number.isFinite(n) && (n < 0 || n > 100)) setBatteryError(true);
  }
});

/* Suggestions (Photon API) */
async function smartSearch(query) {
    if(!query || query.length < 2) return [];
    // Bias towards Philippines
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${myLat}&lon=${myLng}&limit=5&bbox=116.8,4.5,126.7,21.2`);
    const data = await res.json();
    return data.features || [];
}

function updateStartButtonState() {
    if(fromInput.disabled) return;
    const hasText = fromInput.value.trim().length > 0 && toInput.value.trim().length > 0;
    startNavBtn.disabled = !hasText;
}

function mountSuggest(inputEl, listEl, isOrigin) {
  let debounce;
  
  inputEl.addEventListener("input", () => {
    if(isOrigin) selectedOrigin = null; else selectedDest = null;
    selectedRouteObject = null;
    updateStartButtonState();
    hideInlineAlert();
    setInputError(isOrigin ? "from-box" : "to-box", false);

    clearTimeout(debounce);
    debounce = setTimeout(async () => {
        const q = inputEl.value;
        if(q.length < 2) { listEl.style.display = "none"; return; }
        
        const results = await smartSearch(q);
        if(results.length === 0) { listEl.style.display = "none"; return; }

        listEl.innerHTML = results.map((r) => {
            const p = r.properties;
            const name = p.name || p.street || "Unknown";
            const details = [p.city, p.state, p.country].filter(Boolean).join(", ");
            const lat = r.geometry.coordinates[1];
            const lng = r.geometry.coordinates[0];
            
            return `
              <div class="suggest-item" data-lat="${lat}" data-lng="${lng}" data-name="${name}">
                <i data-lucide="map-pin" style="margin-top:2px;"></i>
                <div class="meta">
                  <b>${name}</b>
                  <span>${details}</span>
                </div>
              </div>
            `;
        }).join("");

        lucide.createIcons();
        listEl.style.display = "block";
    }, 300);
  });

  listEl.addEventListener("click", (e) => {
    const row = e.target.closest(".suggest-item");
    if (!row) return;
    
    inputEl.value = row.getAttribute("data-name");
    const lat = parseFloat(row.getAttribute("data-lat"));
    const lng = parseFloat(row.getAttribute("data-lng"));
    
    if(isOrigin) selectedOrigin = { lat, lng };
    else selectedDest = { lat, lng };

    // Update weather to match new origin
    if(isOrigin) fetchWeather(lat, lng);
    
    listEl.style.display = "none";
    
    // Auto-trigger calculation if both set
    // if(selectedOrigin && selectedDest) calculateRoutes();
    updateStartButtonState();
  });

  document.addEventListener("click", (e) => {
    const within = listEl.contains(e.target) || inputEl.contains(e.target);
    if (!within) listEl.style.display = "none";
  });
}

mountSuggest(fromInput, document.getElementById("from-suggest"), true);
mountSuggest(toInput, document.getElementById("to-suggest"), false);

/* Data & Logic */
let currentRoutes = [];
let selectedIndex = -1;
let mode = "routes";
let resultsVisible = false;
let isNavigating = false;

function setHeaderFor(mode){
  document.getElementById("app-title").textContent = "Trip Planner";
  document.getElementById("app-subtitle").textContent = mode === "charging"
    ? "Nearby charging stations"
    : "Suggested routes";
}

function resetDetails(){
  selectedIndex = -1;
  document.getElementById("rd-title").textContent = "Select an item";
  document.getElementById("rd-note").textContent = "Details will appear here.";
  document.getElementById("rd-energy").textContent = "—";
  document.getElementById("rd-arrival").textContent = "—";
  document.getElementById("rd-eta").textContent = "—";
}

function updateDetails(item) {
  document.getElementById("rd-title").textContent = item.name || "Route " + (selectedIndex + 1);
  document.getElementById("rd-note").textContent = item.note || "Fastest route based on traffic";

  document.getElementById("rd-m1-label").textContent = "Energy";
  document.getElementById("rd-m2-label").textContent = "Arrival";
  document.getElementById("rd-m3-label").textContent = "ETA";
  
  document.getElementById("rd-energy").textContent = `${item.est_usage}%`;
  document.getElementById("rd-arrival").textContent = `${item.end_battery}%`;
  document.getElementById("rd-eta").textContent = `${item.duration_min} min`;
}

function renderList(){
  routesList.innerHTML = currentRoutes.map((it, i) => {
    return `
      <div class="route-card ${i === selectedIndex ? "active" : ""}" data-idx="${i}" tabindex="0" role="button">
        <div class="row-top">
          <div class="left-pack">
            <div class="pin" aria-hidden="true"><i data-lucide="route"></i></div>
            <div class="title-col">
              <div class="title-line">
                <div class="main-title">Route ${i + 1}</div>
              </div>
              <div class="sub-title">${(it.distance_km * DIST_FACTOR).toFixed(1)} ${DIST_LABEL}</div>
              <div class="availability">
                <b>${it.end_battery}%</b> arrival • <b>${it.est_usage}%</b> used
              </div>
            </div>
          </div>
          <div class="right-pack">
            <div class="eta-big">${it.duration_min} min</div>
            <div class="power">ETA</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

routesList.addEventListener("click", (e) => {
  if (!resultsVisible) return;
  const card = e.target.closest(".route-card");
  if (!card) return;

  selectedIndex = Number(card.dataset.idx || 0);
  renderList(); // Re-render to update active class
  
  const route = currentRoutes[selectedIndex];
  updateDetails(route);
  highlightRoute(selectedIndex);
  
  selectedRouteObject = { 
      route: route, 
      origin: fromInput.value, 
      destination: toInput.value 
  };

  startNavBtn.disabled = false;
});

/* Weather */
async function fetchWeather(lat, lng) {
    const useLat = lat || myLat;
    const useLng = lng || myLng;
    
    const w = document.getElementById('weather-widget');
    if(w) w.style.opacity = '0.5';

    try {
        const res = await fetch(`${BASE_API}/WEATHER/current.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lat: useLat, lng: useLng })
        });
        const data = await res.json();
        if(w) w.style.opacity = '1';

        if(data.ok && data.weather) {
            if(w) {
                const { temp, condition } = data.weather;
                let icon = "cloud";
                const c = String(condition).toLowerCase();
                if(c.includes("sun") || c.includes("clear")) icon = "sun";
                else if(c.includes("rain")) icon = "cloud-rain";
                else if(c.includes("storm")) icon = "cloud-lightning";
                else if(c.includes("partly")) icon = "cloud-sun";

                w.innerHTML = `<i data-lucide="${icon}" style="width:14px; height:14px;"></i> ${temp}°C <span style="margin-left:4px; font-weight:400; opacity:0.7;">| ${condition}</span>`;
                w.style.display = 'flex';
                lucide.createIcons();
            }
        }
    } catch(e) { 
        console.error("Weather error", e); 
        if(w) w.style.opacity = '1';
    }
}

/* Low Battery Modal Logic */
const lowBattModal = document.getElementById("low-batt-modal");
const modalBattLevel = document.getElementById("modal-batt-level");

function showLowBattModal(val) {
    if(modalBattLevel) modalBattLevel.textContent = val;
    if(lowBattModal) lowBattModal.classList.add("active");
}

window.closeLowBattModal = function() {
    if(lowBattModal) lowBattModal.classList.remove("active");
}

window.proceedToCharging = function() {
    const val = modalBattLevel ? parseInt(modalBattLevel.textContent) : 0;
    localStorage.setItem("user_battery_level", val);
    localStorage.setItem("forceCharging", "1");
    localStorage.setItem("ev_lock_status", "critical");
    window.location.href = "charging.html";
}

/* Toast Helper */
function showToast(msg) {
    const t = document.getElementById("toast");
    const tm = document.getElementById("toast-msg");
    if (t && tm) {
        tm.textContent = msg;
        t.classList.add("show");
        setTimeout(() => t.classList.remove("show"), 3000);
    }
}

/* Calculate Logic */
async function calculateRoutes() {
    const battRes = validateAndCommitBattery();
    if(!battRes.ok) return;
    
    // Battery Gate
    if(battRes.value <= 20) {
        showLowBattModal(battRes.value);
        return;
    }

    if(!selectedOrigin || !selectedDest) return;

    // UI Loading State
    setInputsLocked(true);
    resultsSection.classList.add("hidden");
    await showAfterStartLoading(500);

    try {
        const res = await fetch(`${BASE_API}/TRIPS/calculate.php`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ 
                user_id: USER_ID, 
                battery_percent: battRes.value, 
                origin: selectedOrigin, 
                destination: selectedDest 
            })
        });
        const data = await res.json();
        
        if(!data.ok || !data.routes || data.routes.length === 0) {
            alert("No routes found.");
            setInputsLocked(false);
            return;
        }

        currentRoutes = data.routes;
        resultsVisible = true;
        resultsSection.classList.remove("hidden");
        
        // Draw Routes
        clearMapLayers();
        startMarker = addMarker(selectedOrigin.lat, selectedOrigin.lng, "Start", true);
        endMarker = addMarker(selectedDest.lat, selectedDest.lng, "End", false);
        
        currentRoutes.forEach((r, idx) => {
            drawRoute(r.geometry, idx === 0, idx);
        });
        
        // Auto-select first
        selectedIndex = 0;
        renderList();
        updateDetails(currentRoutes[0]);
        selectedRouteObject = { route: currentRoutes[0], origin: fromInput.value, destination: toInput.value };
        startNavBtn.disabled = false;
        recalcBtn.style.display = "block";
        
        // Scroll to results
        document.getElementById("panel-scroll").scrollTo({ top: document.getElementById("panel-scroll").scrollHeight, behavior: "smooth" });

    } catch(e) {
        console.error(e);
        alert("Calculation failed.");
        setInputsLocked(false);
    }
}

/* Start Navigation */
startNavBtn.addEventListener("click", async () => {
  hideInlineAlert();
  setInputError("from-box", false);
  setInputError("to-box", false);

  if (!selectedRouteObject) {
      // Attempt to resolve locations if text is present but no route selected
      if (!selectedOrigin && fromInput.value.trim()) {
          const res = await smartSearch(fromInput.value);
          if(res.length) selectedOrigin = { lat: res[0].geometry.coordinates[1], lng: res[0].geometry.coordinates[0] };
      }
      if (!selectedDest && toInput.value.trim()) {
          const res = await smartSearch(toInput.value);
          if(res.length) selectedDest = { lat: res[0].geometry.coordinates[1], lng: res[0].geometry.coordinates[0] };
      }

      if (selectedOrigin && selectedDest) {
          await calculateRoutes();
          return;
      } else {
          let msg = "Please select valid locations";
          if (!selectedOrigin) {
              setInputError("from-box", true);
              if(!fromInput.value.trim()) msg = "Please enter a starting point";
          }
          if (!selectedDest) {
              setInputError("to-box", true);
              if(!toInput.value.trim()) msg = "Please enter a destination";
          }
          
          showInlineAlert(msg);
          return;
      }
  }
  
  if (selectedRouteObject) {
      localStorage.setItem("activeTrip", JSON.stringify(selectedRouteObject));
      window.location.href = "test_navigation.html";
  }
});

/* Recalculate / Reset */
recalcBtn.addEventListener("click", () => {
  setInputsLocked(false);
  resultsVisible = false;
  resultsSection.classList.add("hidden");
  resetDetails();
  recalcBtn.style.display = "none";
  startNavBtn.disabled = true;
  clearMapLayers();
  
  // Reset View
  map.setView([myLat, myLng], 12);
});

/* Init */
document.addEventListener("DOMContentLoaded", () => {
    if(!USER_ID) window.location.href = "login.html";
    
    // Load Active Car (Logic only)
    activeCar = JSON.parse(localStorage.getItem('active_car') || "null");

    // Update UI for Active Car
    const carDisplay = document.getElementById('active-car-info');
    const carName = document.getElementById('car-name-display');
    if (activeCar && carDisplay && carName) {
        carName.textContent = `${activeCar.brand} ${activeCar.model}`;
        carDisplay.style.display = 'block';
    }

    // Update Header User/Car
    const headerUser = document.getElementById('header-user-name');
    const headerCar = document.getElementById('header-car-name');
    if(headerUser) headerUser.textContent = localStorage.getItem('full_display_name') || 'User';
    if(headerCar && activeCar) headerCar.textContent = `${activeCar.brand} ${activeCar.model}`;
    
    // Sync Battery
    const savedBatt = localStorage.getItem('user_battery_level');
    if(savedBatt) {
        batInput.value = savedBatt;
        applyBatteryUI(parseInt(savedBatt));
    } else {
        batInput.value = lastValidBattery;
        applyBatteryUI(lastValidBattery);
    }

    fetchWeather();

    // GPS
    navigator.geolocation.getCurrentPosition(pos => {
        myLat = pos.coords.latitude;
        myLng = pos.coords.longitude;
        
        // Auto-fill Origin
        fromInput.value = "My Location";
        selectedOrigin = { lat: myLat, lng: myLng };
        map.setView([myLat, myLng], 14);
        L.circleMarker([myLat, myLng], { radius: 8, fillColor: "#3b82f6", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(map);
        updateStartButtonState();
        
        // Check for incoming nav request from Hubs
        const navDest = JSON.parse(localStorage.getItem('nav_destination'));
        if (navDest) {
            toInput.value = navDest.name;
            selectedDest = { lat: navDest.lat, lng: navDest.lng };
            localStorage.removeItem('nav_destination');
            calculateRoutes();
        }

        // Refresh weather for actual location
        fetchWeather();
    });
});

/* Mobile sheet */
const panel = document.getElementById("panel");
const sheetHandle = document.getElementById("sheet-handle");
function isMobile() { return window.matchMedia("(max-width: 980px)").matches; }
function setSheetOpen(open) { if (isMobile()) panel.classList.toggle("closed", !open); }
function syncSheetMode() { if (isMobile()) setSheetOpen(true); else panel.classList.remove("closed"); }
syncSheetMode();
window.addEventListener("resize", syncSheetMode);
if (sheetHandle) sheetHandle.addEventListener("click", () => { if (isMobile()) panel.classList.toggle("closed"); });
