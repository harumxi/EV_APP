const tripsCtx = document.getElementById("tripsChart").getContext('2d');
const stationsCtx = document.getElementById("stationsChart").getContext('2d');

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
      yAlign: 'bottom', // Prevents overlap with bars
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

// Trips Chart
const tripsOpts = JSON.parse(JSON.stringify(commonOptions));

new Chart(tripsCtx, {
  type: "bar",
  data: {
    labels: ["Manila", "Quezon City", "Makati", "Taguig", "Pasig"],
    datasets: [
      {
        label: "Trips (Locations)",
        data: [150, 230, 180, 320, 140],
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

// Stations Chart
const stationsOpts = JSON.parse(JSON.stringify(commonOptions));

new Chart(stationsCtx, {
  type: "bar",
  data: {
    labels: ["Manila", "Quezon City", "Makati", "Taguig", "Pasig"],
    datasets: [
      {
        label: "Charging Stations",
        data: [80, 120, 160, 240, 90],
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
