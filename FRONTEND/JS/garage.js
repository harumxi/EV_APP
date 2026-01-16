// Check authentication on page load
window.addEventListener('load', () => {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        // No user logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
});

// Data
const evData = {
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
    'Nissan': ['Leaf', 'Ariya', 'e-NV200'],
    'Chevrolet': ['Bolt EV', 'Bolt EUV', 'Blazer EV', 'Equinox EV', 'Silverado EV'],
    'BMW': ['i4', 'iX', 'i7', 'iX1', 'iX3'],
    'Audi': ['e-tron', 'e-tron GT', 'Q4 e-tron', 'Q8 e-tron'],
    'Mercedes-Benz': ['EQS', 'EQE', 'EQB', 'EQC', 'EQA'],
    'Hyundai': ['Ioniq 5', 'Ioniq 6', 'Kona Electric', 'Ioniq Electric'],
    'Kia': ['EV6', 'EV9', 'Niro EV', 'Soul EV'],
    'Volkswagen': ['ID.4', 'ID.Buzz', 'ID.3', 'e-Golf'],
    'Porsche': ['Taycan', 'Taycan Cross Turismo', 'Macan Electric'],
    'Rivian': ['R1T', 'R1S'],
    'Lucid': ['Air Pure', 'Air Touring', 'Air Grand Touring', 'Air Sapphire'],
    'Polestar': ['Polestar 2', 'Polestar 3', 'Polestar 4'],
    'Ford': ['Mustang Mach-E', 'F-150 Lightning', 'E-Transit'],
    'Renault': ['Zoe E-Tech', 'Megane E-Tech', 'Kangoo E-Tech'],
    'Bugatti': ['Chiron EV', 'Bolide Electric'],
    'BYD': ['Atto 3', 'Dolphin', 'Seal', 'Han EV'],
    'NIO': ['ET5', 'ET7', 'ES6', 'ES8', 'EC6']
};

const brandColors = {
    'Tesla': 'gradient-tesla',
    'Nissan': 'gradient-nissan',
    'BMW': 'gradient-bmw',
    'Renault': 'gradient-renault',
    'Bugatti': 'gradient-bugatti'
};

let vehicles = [
    { id: 1, ownerName: 'John Doe', brand: 'Bugatti', model: 'Chiron EV', image: '🏎️' },
    { id: 2, ownerName: 'Jane Smith', brand: 'Renault', model: 'Zoe E-Tech', image: '🚗' }
];

let vehicleToDelete = null;

// Initialize
function init() {
    populateBrands();
    renderVehicles();
    setupEventListeners();
}

function populateBrands() {
    const brandSelect = document.getElementById('brandSelect');
    Object.keys(evData).forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });
}

function renderVehicles() {
    const grid = document.getElementById('vehicleGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (vehicles.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = vehicles.map(vehicle => {
        const colorClass = brandColors[vehicle.brand] || 'gradient-default';
        return `
            <div class="${colorClass} backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 flex items-center justify-between">
                <div class="flex-shrink-0">
                    <div class="text-6xl transform hover:scale-110 transition-transform duration-300">${vehicle.image}</div>
                </div>
                
                <div class="flex-1 px-8">
                    <p class="text-sm text-gray-600 font-medium mb-1">Owner: ${vehicle.ownerName}</p>
                    <h3 class="text-2xl font-semibold text-gray-900">${vehicle.brand}</h3>
                    <p class="text-gray-700">${vehicle.model}</p>
                </div>
                
                <div class="flex-shrink-0 flex gap-3">
                    <button onclick="openDeleteModal(${vehicle.id})" class="px-6 py-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600/90 transition-all font-medium text-sm shadow-md">
                        Delete
                    </button>
                    <button onclick="proceedToNext(${vehicle.id})" class="px-6 py-2 bg-green-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-green-600/90 transition-all font-medium text-sm shadow-md flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    document.getElementById('addCarBtn').addEventListener('click', () => {
        document.getElementById('addModal').classList.add('active');
    });

    document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
    document.getElementById('cancelAdd').addEventListener('click', closeAddModal);

    document.getElementById('brandSelect').addEventListener('change', (e) => {
        const brand = e.target.value;
        const modelSelect = document.getElementById('modelSelect');
        
        if (brand) {
            modelSelect.disabled = false;
            modelSelect.innerHTML = '<option value="">Select model</option>';
            evData[brand].forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        } else {
            modelSelect.disabled = true;
            modelSelect.innerHTML = '<option value="">Select brand first</option>';
        }
    });

    document.getElementById('confirmAdd').addEventListener('click', addVehicle);
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', deleteVehicle);
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('ownerName').value = '';
    document.getElementById('brandSelect').value = '';
    document.getElementById('modelSelect').value = '';
    document.getElementById('modelSelect').disabled = true;
    document.getElementById('modelSelect').innerHTML = '<option value="">Select brand first</option>';
}

function addVehicle() {
    const ownerName = document.getElementById('ownerName').value;
    const brand = document.getElementById('brandSelect').value;
    const model = document.getElementById('modelSelect').value;

    if (ownerName && brand && model) {
        const newVehicle = {
            id: Date.now(),
            ownerName,
            brand,
            model,
            image: '🚙'
        };
        vehicles.push(newVehicle);
        renderVehicles();
        closeAddModal();
    }
}

function openDeleteModal(id) {
    vehicleToDelete = id;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    vehicleToDelete = null;
}

function deleteVehicle() {
    vehicles = vehicles.filter(v => v.id !== vehicleToDelete);
    renderVehicles();
    closeDeleteModal();
}

function proceedToNext(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);

    localStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
    
    console.log('Proceeding to next screen with vehicle:', vehicle);
    alert(`Proceeding with ${vehicle.brand} ${vehicle.model}`);
}

init();

function proceedToNext(vehicleId) {
  const vehicle = vehicles.find(v => v.id === vehicleId);

  localStorage.setItem("selectedVehicle", JSON.stringify(vehicle));

  window.location.href = "../UI_HTML/dashboard.html";
}

function proceedToNext(vehicleId) {
  const vehicle = vehicles.find(v => v.id === vehicleId);

  localStorage.setItem("selectedVehicle", JSON.stringify(vehicle));

  window.location.href = "dashboard.html";
}