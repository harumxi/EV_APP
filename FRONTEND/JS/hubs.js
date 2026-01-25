const API_URL = "http://localhost/WEBPROG_PROJ/BACKEND/API/CHARGING/nearby.php"; // Default OCM
const FAV_API = "http://localhost/WEBPROG_PROJ/BACKEND/API/CHARGING";
const USER_ID = localStorage.getItem("user_id");
let map;
let markers = [];
let currentStations = [];
let favoriteIds = new Set();
let currentReviewStationId = null;
let debounceTimer;

// UNIT PREFERENCES
const PREF_UNIT = localStorage.getItem('pref_units') || 'KM';
const DIST_FACTOR = PREF_UNIT === 'MILES' ? 0.621371 : 1;
const DIST_LABEL = PREF_UNIT === 'MILES' ? 'mi' : 'km';

const thunderIcon = L.divIcon({
    html: '<div style="background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 2px solid #eab308;"><i class="fa-solid fa-bolt text-yellow-500 text-xl"></i></div>',
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
});

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    fetchFavorites();
    setupFilters();

  // Suggestion Logic
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchSuggestions(e.target.value), 300);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.suggest-wrap')) {
        const sl = document.getElementById('search-suggest');
        if (sl) sl.style.display = 'none';
      }
    });
  }
});

function showToast(msg) {
    const t = document.getElementById("toast");
    document.getElementById("toast-msg").textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2500);
}

async function fetchFavorites() {
    if (!USER_ID) return;
    try {
        const res = await fetch(`${FAV_API}/get_favorites.php?user_id=${USER_ID}`);
        const data = await res.json();
        if (data.ok) favoriteIds = new Set(data.favorites);
    } catch (e) { console.error("Fav fetch error", e); }
}

function initMap() {
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: 'OpenStreetMap' });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri Satellite' });

    map = L.map('map', { zoomControl: false, layers: [streetLayer] }).setView([14.5995, 120.9842], 12);
    const baseMaps = { "Street Map": streetLayer, "Satellite": satelliteLayer };
    L.control.layers(baseMaps, null, { position: 'topleft' }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 14);
            fetchChargers(latitude, longitude);
        });
    }
}

function setupFilters() {
    const activeCar = JSON.parse(localStorage.getItem('active_car'));
    if (activeCar && activeCar.plug_type) {
        // Display Active Plug Type (Info Only)
        const container = document.querySelector('.search-area');
        const filters = document.querySelector('.flex.gap-2.flex-wrap');

        const info = document.createElement('div');
        info.className = "mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 flex items-center gap-2";
        info.innerHTML = `<i class="fa-solid fa-car"></i> Active: ${activeCar.plug_type}`;

        container.insertBefore(info, filters);
    }
}

function handleEnter(e) { if(e.key === 'Enter') performSearch(); }

async function performSearch() {
    const query = document.getElementById('search-input').value;
    if(!query) return;
    document.getElementById('results-list').innerHTML = `<div class="p-4 text-center text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Searching location...</div>`;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph`);
        const data = await res.json();
        if(data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.flyTo([lat, lon], 14);
            fetchChargers(lat, lon);
        } else {
            alert("Location not found.");
            document.getElementById('results-list').innerHTML = "";
        }
    } catch(e) { alert("Search failed."); }
}

async function fetchChargers(lat, lon) {
    document.getElementById('results-list').innerHTML = `<div class="p-4 text-center text-gray-500"><i class="fa-solid fa-bolt fa-bounce"></i> Finding hubs...</div>`;
    try {
        const res = await fetch(`${API_URL}?lat=${lat}&lon=${lon}`);
        const stations = await res.json();
        currentStations = stations;
        renderList(stations);
        plotMap(stations);
  } catch(e) { 
    console.error(e);
    document.getElementById('results-list').innerHTML = 
      `<div class="p-4 text-center text-red-500">
         <i class="fa-solid fa-circle-exclamation"></i> Failed to load stations.<br><span class="text-xs text-gray-400">Check connection or try again.</span>
       </div>`;
  }
}

// --- NEW NAVIGATION TRIGGER ---
function triggerNavigation(name, lat, lng) {
    const destination = { name, lat, lng };
    localStorage.setItem('nav_destination', JSON.stringify(destination));
    alert(`Ready to navigate to ${name}. Opening Trip Planner...`);
    window.location.href = 'trip_planner.html';
}

function renderList(stations) {
    const container = document.getElementById('results-list');
    container.innerHTML = "";
    if(stations.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-gray-400">No chargers found.</div>`;
        return;
    }
    stations.forEach((st, index) => {
        // Use REAL data from backend
        const iconColor = "text-blue-500";
        const isFav = favoriteIds.has(st.id);
        const heartClass = isFav ? "fa-solid text-red-500" : "fa-regular text-gray-400";

        const div = document.createElement('div');
        div.className = "hub-card";
        div.innerHTML = `
            <div class="hub-icon"><i class="fa-solid fa-charging-station ${iconColor}"></i></div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-gray-900 text-sm truncate pr-2">${st.name}</h3>
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="event.stopPropagation(); toggleFavorite('${st.id}', '${st.name.replace(/'/g, "\\'")}', '${st.address.town || ''}')" class="hover:scale-110 transition"><i class="${heartClass} fa-heart"></i></button>
                    </div>
                </div>
                <div class="text-xs text-gray-500 mt-1 truncate">${st.address.town || st.address.city || 'Nearby'}</div>
            </div>
        `;
        div.onclick = () => focusStation(st, div);
        container.appendChild(div);
    });
}

async function toggleFavorite(stationId, name, address) {
    if (!USER_ID) return alert("Please login to save favorites.");

    let msg = "";
    // Optimistic UI Update
    if (favoriteIds.has(stationId)) {
        favoriteIds.delete(stationId);
        msg = "Removed from Favorites";
    } else {
        favoriteIds.add(stationId);
        msg = "Added to Favorites";
    }

    showToast(msg);

    // Re-render immediately to show change
    const activeFilter = document.querySelector('.filter-chip.active');
    if (activeFilter) activeFilter.click(); // Refresh current view

    // Background API Call
    await fetch(`${FAV_API}/toggle_favorite.php`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: USER_ID, station_id: stationId, name, address })
    });
}

function plotMap(stations) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    stations.forEach(st => {
        const marker = L.marker([st.location.latitude, st.location.longitude], { icon: thunderIcon }).addTo(map);
        // Open Details Modal on Click
        marker.on('click', () => {
            openDetailsModal(st);
        });
        markers.push(marker);
    });
}

function focusStation(st, cardElement) {
    document.querySelectorAll('.hub-card').forEach(c => c.classList.remove('active'));
    cardElement.classList.add('active');
    map.flyTo([st.location.latitude, st.location.longitude], 16);
}

function toggleFilter(btn, type) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    if(type === 'all') {
        renderList(currentStations);
    } else if (type === 'my_plug') {
        const activeCar = JSON.parse(localStorage.getItem('active_car'));
        if (!activeCar) return;

        // Split car plugs (e.g. "Type 2 / CCS2" -> ["type 2", "ccs2"])
        const carPlugs = activeCar.plug_type.toLowerCase().split('/').map(p => p.trim());

        const filtered = currentStations.filter(st => {
            if (!st.plugs) return false;
            // Check if ANY of the station's plugs match ANY of the car's plugs
            return st.plugs.some(stationPlug => {
                const sPlug = stationPlug.toLowerCase();
                return carPlugs.some(cPlug => sPlug.includes(cPlug) || cPlug.includes(sPlug));
            });
        });
        renderList(filtered);
    } else if (type === 'Favorites') {
        // Filter by Favorites
        const filtered = currentStations.filter(st => favoriteIds.has(st.id));
        renderList(filtered);
    }
}

// --- REVIEWS LOGIC ---
function openReviewsModal(stationId, stationName) {
    currentReviewStationId = stationId;
    document.getElementById('review-station-name').innerText = stationName;
    document.getElementById('reviews-modal').classList.remove('hidden');
    document.getElementById('review-form-box').classList.add('hidden');
    loadReviews(stationId);
}

function closeReviewsModal() {
    document.getElementById('reviews-modal').classList.add('hidden');
}

function toggleReviewForm() {
    if (!USER_ID) return alert("Please login to write a review.");
    document.getElementById('review-form-box').classList.toggle('hidden');
}

function setRating(n) {
    document.getElementById('review-rating').value = n;
    const stars = document.getElementById('star-container').children;
    for(let i=0; i<5; i++) {
        stars[i].classList.toggle('text-yellow-400', i < n);
        stars[i].classList.toggle('text-gray-200', i >= n);
    }
}

async function loadReviews(stationId) {
    const list = document.getElementById('reviews-list');
    list.innerHTML = '<div class="text-center text-gray-400 py-10 italic">Loading reviews...</div>';

    try {
        const res = await fetch(`${FAV_API}/get_reviews.php?station_id=${stationId}`);
        const data = await res.json();

        document.getElementById('review-avg').innerText = data.average || '--';
        list.innerHTML = '';

        if (data.reviews.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-10">No reviews yet. Be the first!</div>';
            return;
        }

        data.reviews.forEach(r => {
            const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
            list.innerHTML += `
                <div class="border-b border-gray-50 pb-3 last:border-0">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-sm text-gray-900">@${r.username}</span>
                        <span class="text-xs text-gray-400">${new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="text-yellow-400 text-xs mb-1">${stars}</div>
                    <p class="text-sm text-gray-600 leading-relaxed">${r.comment}</p>
                </div>
            `;
        });
    } catch(e) { list.innerHTML = '<div class="text-center text-red-400">Failed to load reviews.</div>'; }
}

async function submitReview() {
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-comment').value;
    if(rating == 0) return alert("Please select a star rating.");

    await fetch(`${FAV_API}/add_review.php`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: USER_ID, station_id: currentReviewStationId, rating, comment })
    });

    document.getElementById('review-comment').value = '';
    setRating(0);
    toggleReviewForm();
    loadReviews(currentReviewStationId);
    showToast("Review posted!");
}

// --- DETAILS MODAL LOGIC ---
function openDetailsModal(st) {
    document.getElementById('detail-title').innerText = st.name;

    // Station Photo
    const imageHtml = (st.photos && st.photos.length > 0)
        ? `<img src="${st.photos[0]}" class="w-full h-48 object-cover rounded-xl mb-4 border border-gray-100" onerror="this.style.display='none'">`
        : '';

    const content = `
        <div class="space-y-6">
            ${imageHtml}
            <div>
                <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location Details</div>
                <div class="font-bold text-gray-900 text-lg">${st.name}</div>
                <div class="text-gray-600">${st.address.line1 || ''}</div>
                ${st.address.line2 ? `<div class="text-gray-600">${st.address.line2}</div>` : ''}
                <div class="text-gray-600">${st.address.town || ''} ${st.address.state ? ', ' + st.address.state : ''}</div>
                <div class="text-gray-600">${st.address.postcode || ''}</div>
                <div class="text-gray-600">${st.address.country || ''}</div>
                <div class="text-xs text-gray-400 mt-1">Lat/Long: ${st.location.latitude.toFixed(6)}, ${st.location.longitude.toFixed(6)}</div>
            </div>

            <button onclick="triggerNavigation('${st.name.replace(/'/g, "\\'")}', ${st.location.latitude}, ${st.location.longitude})" class="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95">
                <i class="fa-solid fa-location-arrow"></i> Navigate Here
            </button>
        </div>
    `;
    document.getElementById('detail-content').innerHTML = content;
    document.getElementById('details-modal').classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('details-modal').classList.add('hidden');
}
