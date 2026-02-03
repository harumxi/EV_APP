let users = [];
const tableBody = document.getElementById("usersTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

// Fetch users data from API
async function fetchUsers() {
  try {
    // Use absolute path from root
    const apiUrl = "/EV_APP/BACKEND/API/ANALYTICS/get_all_users.php";
    console.log("Fetching from:", apiUrl);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Fetched users:", data);
    users = data;
    renderUsers();
  } catch (error) {
    console.error("Error fetching users:", error);
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error loading user data: ' + error.message + '</td></tr>';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderUsers() {
  const filter = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  tableBody.innerHTML = "";

  const filtered = users.filter(user => 
    (user.name.toLowerCase().includes(filter) || user.email.toLowerCase().includes(filter)) &&
    (status === "" || user.status === status)
  );

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6b7280;">No users found</td></tr>';
    return;
  }

  filtered.forEach(user => {
    const row = document.createElement("tr");
    const evCount = user.evs > 0 ? user.evs : '<span style="color: #d1d5db;">—</span>';

    row.innerHTML = `
      <td class="user-name">${user.name}</td>
      <td class="text-muted">${user.email}</td>
      <td class="text-muted">${evCount}</td>
      <td>
        <span class="status-pill ${user.status === "Active" ? "status-active" : "status-inactive"}">
          ${user.status}
        </span>
      </td>
      <td class="text-muted">${user.joined}</td>
      <td class="action-cell">
        <button class="kebab-btn" onclick="toggleStats(event, ${user.id})" title="View energy metrics">
          <i data-lucide="bar-chart-2" style="width: 16px; height: 16px; stroke-width: 2;"></i>
        </button>
        <div id="stats-${user.id}" class="stats-popover">
          <div class="stat-row">
            <span class="stat-label">Efficiency</span>
            <span class="stat-value">${user.efficiency || '—'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Energy Saved</span>
            <span class="stat-value">${user.saved || '—'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Energy Used</span>
            <span class="stat-value">${user.used || '—'}</span>
          </div>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
  lucide.createIcons();
}

searchInput.addEventListener("input", renderUsers);
statusFilter.addEventListener("change", renderUsers);

// Initial fetch and render
fetchUsers();

// Menu Toggle Logic
function toggleStats(event, id) {
  event.stopPropagation();
  // Close all other menus
  document.querySelectorAll('.stats-popover').forEach(p => {
    if (p.id !== `stats-${id}`) p.classList.remove('show');
  });
  const popover = document.getElementById(`stats-${id}`);
  popover.classList.toggle('show');
}

// Close menu when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.stats-popover').forEach(p => p.classList.remove('show'));
});
