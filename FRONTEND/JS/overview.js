// User Growth Chart
const growthCtx = document.getElementById("growthChart").getContext('2d');

// Create gradient
const gradient = growthCtx.createLinearGradient(0, 0, 0, 300);
gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)'); // Blue-500 with opacity
gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

new Chart(growthCtx, {
  type: "line",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [{
      label: "Users",
      data: [120, 180, 260, 340],
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
        callbacks: { label: (c) => c.parsed.y + ' Users' }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#9ca3af' } },
      y: { grid: { color: '#f3f4f6', borderDash: [4, 4] }, ticks: { font: { family: 'Inter', size: 12 }, color: '#9ca3af' }, beginAtZero: true }
    },
    interaction: { mode: 'index', intersect: false }
  }
});
