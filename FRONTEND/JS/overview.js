// API Configuration
const API_BASE_URL = 'http://localhost/EV_APP/BACKEND/API';

// Global chart instance for updating
let growthChartInstance = null;

// Fetch overview data from API
async function fetchOverviewData() {
  try {
    const response = await fetch(`${API_BASE_URL}/ANALYTICS/overview.php`);
    
    if (!response.ok) {
      console.error('API Error:', response.statusText);
      return;
    }

    const result = await response.json();

    if (!result.ok) {
      console.error('API Response Error:', result.error);
      return;
    }

    const data = result.data;

    // Update user statistics
    document.getElementById('activeUsersCount').textContent = data.active_users.toLocaleString();
    document.getElementById('inactiveUsersCount').textContent = data.inactive_users.toLocaleString();
    document.getElementById('unverifiedUsersCount').textContent = data.unverified_users.toLocaleString();

    // Update sustainability metrics
    document.getElementById('totalEnergyUsed').textContent = data.total_energy_kwh.toLocaleString();
    document.getElementById('co2Saved').textContent = data.co2_saved_kg.toLocaleString();
    document.getElementById('avgEfficiency').textContent = data.avg_energy_efficiency + '%';

    // Update growth chart with monthly data
    updateGrowthChart(data.monthly_users);

  } catch (error) {
    console.error('Error fetching overview data:', error);
  }
}

// Fetch and display users
async function fetchAndDisplayUsers() {
  try {
    const response = await fetch(`/EV_APP/BACKEND/API/ANALYTICS/get_all_users.php`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }
    const users = await response.json();
    
    const tableBody = document.getElementById('recentUsersBody');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 32px 12px; color: #6b7280;">No users found</td></tr>';
      return;
    }
    
    users.forEach(user => {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom: 1px solid #f3f4f6; transition: background-color 0.15s ease;';
      row.onmouseover = () => row.style.backgroundColor = '#f9fafb';
      row.onmouseout = () => row.style.backgroundColor = '';
      
      const statusColor = user.status === 'Active' ? '#059669' : '#6b7280';
      const statusBg = user.status === 'Active' ? '#ecfdf5' : '#f3f4f6';
      
      row.innerHTML = `
        <td style="padding: 16px 0; font-size: 14px; font-weight: 600; color: #111827;">${user.name}</td>
        <td style="padding: 16px 0; font-size: 14px; color: #6b7280;">${user.email}</td>
        <td style="padding: 16px 0; font-size: 14px; color: #6b7280; text-align: center;">${user.evs > 0 ? user.evs : '—'}</td>
        <td style="padding: 16px 0; font-size: 14px;">
          <span style="display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: ${statusBg}; color: ${statusColor};">
            ${user.status}
          </span>
        </td>
        <td style="padding: 16px 0; font-size: 14px; color: #6b7280;">${user.joined}</td>
      `;
      tableBody.appendChild(row);
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    const tableBody = document.getElementById('recentUsersBody');
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 32px 12px; color: #ef4444;">Error loading users</td></tr>`;
  }
}

// Update Growth Chart with real-time data
function updateGrowthChart(monthlyData) {
  const months = monthlyData.map(item => item.month);
  const users = monthlyData.map(item => parseInt(item.users));

  // If chart already exists, update it
  if (growthChartInstance) {
    growthChartInstance.data.labels = months;
    growthChartInstance.data.datasets[0].data = users;
    growthChartInstance.update('none');
    return;
  }

  // Create new chart
  const growthCtx = document.getElementById("growthChart").getContext('2d');

  // Create gradient
  const gradient = growthCtx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

  growthChartInstance = new Chart(growthCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Monthly Active Users",
        data: users,
        backgroundColor: gradient,
        borderColor: '#3b82f6',
        borderWidth: 3,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#111827',
          bodyColor: '#4b5563',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          titleFont: { family: 'Inter', size: 12 },
          bodyFont: { family: 'Inter', size: 12 },
          callbacks: { label: (c) => c.parsed.y + ' Active Users' }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#9ca3af' } },
        y: { grid: { color: '#f3f4f6', borderDash: [4, 4] }, ticks: { font: { family: 'Inter', size: 12 }, color: '#9ca3af' }, beginAtZero: true }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Fetch data immediately
  fetchOverviewData();
  fetchAndDisplayUsers();

  // Refresh data every 30 seconds for real-time updates
  setInterval(fetchOverviewData, 30000);
  setInterval(fetchAndDisplayUsers, 30000);
});
