let tripsChartInstance = null;
let stationsChartInstance = null;

// Fetch analytics data from API
async function fetchAnalyticsData() {
  try {
    const response = await fetch('/EV_APP/BACKEND/API/ANALYTICS/get_analytics_data.php');
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.status}`);
    }
    const data = await response.json();
    
    console.log('Analytics Data:', data);
    
    // Update summary cards
    document.getElementById('totalTripsCount').textContent = data.total_trips.toLocaleString();
    document.getElementById('chargingSessionsCount').textContent = data.total_charging_sessions.toLocaleString();
    document.getElementById('avgEfficiencyCount').textContent = data.avg_efficiency + '%';
    
    // Update charts
    updateTripsChart(data.trips_by_location);
    updateStationsChart(data.charging_by_region);
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
}

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { top: 5, bottom: 5 }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        boxWidth: 6,
        font: { family: 'Inter', size: 11, weight: '500' },
        color: '#64748b',
        padding: 10
      }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#f1f5f9',
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      titleFont: { family: 'Inter', size: 13, weight: '600' },
      bodyFont: { family: 'Inter', size: 12, weight: '500' },
      yAlign: 'bottom',
      caretSize: 6
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9', drawBorder: false },
      ticks: { font: { family: 'Inter', size: 11, weight: '500' }, color: '#94a3b8', padding: 8 },
      border: { display: false }
    },
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { font: { family: 'Inter', size: 11, weight: '500' }, color: '#64748b' },
      border: { display: false }
    }
  }
};

// Update Trips Chart with real data
function updateTripsChart(tripsData) {
  const labels = tripsData.map(item => item.city);
  const data = tripsData.map(item => item.count);
  
  const tripsCtx = document.getElementById("tripsChart").getContext('2d');
  const tripsOpts = JSON.parse(JSON.stringify(commonOptions));
  
  if (tripsChartInstance) {
    tripsChartInstance.destroy();
  }
  
  tripsChartInstance = new Chart(tripsCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Trips (Locations)",
          data: data,
          backgroundColor: "#3b82f6",
          hoverBackgroundColor: "#1d4ed8",
          barPercentage: 0.6,
          categoryPercentage: 0.7,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: tripsOpts
  });
}

// Update Stations Chart with real data
function updateStationsChart(stationsData) {
  const labels = stationsData.map(item => item.region || item.operator_name || 'Station');
  const data = stationsData.map(item => item.station_count);
  
  const stationsCtx = document.getElementById("stationsChart").getContext('2d');
  const stationsOpts = JSON.parse(JSON.stringify(commonOptions));
  
  if (stationsChartInstance) {
    stationsChartInstance.destroy();
  }
  
  stationsChartInstance = new Chart(stationsCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Charging Stations",
          data: data,
          backgroundColor: "#10b981",
          hoverBackgroundColor: "#047857",
          barPercentage: 0.6,
          categoryPercentage: 0.7,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: stationsOpts
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchAnalyticsData();
  // Refresh every 30 seconds
  setInterval(fetchAnalyticsData, 30000);
});
