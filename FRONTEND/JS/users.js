const users = [
  { id: 1, name: "John Doe", email: "john@example.com", evs: 1, status: "Active", joined: "Oct 24, 2023", efficiency: "156 Wh/km", saved: "450 kWh", used: "1.2 MWh" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", evs: 1, status: "Inactive", joined: "Nov 12, 2023", efficiency: "162 Wh/km", saved: "120 kWh", used: "0.8 MWh" },
  { id: 3, name: "Alex Brown", email: "alex@example.com", evs: 0, status: "Active", joined: "Jan 05, 2024", efficiency: "—", saved: "0 kWh", used: "0 kWh" }
];

const tableBody = document.getElementById("usersTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

function renderUsers() {
  const filter = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  tableBody.innerHTML = "";

  users
    .filter(user => 
      (user.name.toLowerCase().includes(filter) || user.email.toLowerCase().includes(filter)) &&
      (status === "" || user.status === status)
    )
    .forEach(user => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="user-name">${user.name}</td>
        <td class="text-muted">${user.email}</td>
        <td class="text-muted">${user.evs > 0 ? user.evs : '<span style="color: #d1d5db;">—</span>'}</td>
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
              <span class="stat-value">${user.efficiency}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Energy Saved</span>
              <span class="stat-value">${user.saved}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Energy Used</span>
              <span class="stat-value">${user.used}</span>
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

// Initial render
renderUsers();

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
