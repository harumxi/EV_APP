// Feedbacks admin page script
document.addEventListener('DOMContentLoaded', () => {
  const feedbacksTableBody = document.getElementById('feedbacksTableBody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const ratingFilter = document.getElementById('ratingFilter');
  const sortBy = document.getElementById('sortBy');
  const totalFeedbacksCount = document.getElementById('totalFeedbacksCount');
  const avgRatingDisplay = document.getElementById('avgRating');

  let allFeedbacks = [];

  // Map sources (can be extended if backend provides source data)
  const sourceMap = {
    'app': 'App',
    'trip_planner': 'Trip Planner',
    'charging_hub': 'Charging Hub',
    'profile': 'Profile',
    'analytics': 'Analytics'
  };

  // Load feedbacks from API
  async function loadFeedbacks() {
    try {
      // Fetch user feedbacks - anonymous, from the feedbackForm submission
      const response = await fetch('/BACKEND/API/FEEDBACK/get_all_feedbacks.php');
      if (!response.ok) {
        throw new Error('Failed to load feedbacks');
      }
      const data = await response.json();
      allFeedbacks = (data.feedbacks || []).map(feedback => ({
        ...feedback,
        reviewed: feedback.reviewed || false, // Default status
        source: feedback.source || 'App' // Default source
      }));
      updateStats();
      displayFeedbacks();
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      showEmptyState('No feedbacks available or error loading data');
    }
  }

  // Update summary statistics
  function updateStats() {
    const total = allFeedbacks.length;
    const ratings = allFeedbacks.map(f => f.rating).filter(r => r);
    const avgRating = ratings.length > 0 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : 0;

    totalFeedbacksCount.textContent = total;
    avgRatingDisplay.textContent = avgRating;
  }

  // Sort feedbacks based on selected sort option
  function sortFeedbacks(feedbacks) {
    const sorted = [...feedbacks];
    const sortValue = sortBy.value;

    if (sortValue === 'date-desc') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortValue === 'date-asc') {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortValue === 'rating-desc') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortValue === 'rating-asc') {
      sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }

    return sorted;
  }

  // Display feedbacks in table format with filters
  function displayFeedbacks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedRating = ratingFilter.value;

    let filtered = allFeedbacks.filter(feedback => {
      const matchesSearch = feedback.text && feedback.text.toLowerCase().includes(searchTerm);
      const matchesRating = !selectedRating || feedback.rating == selectedRating;
      return matchesSearch && matchesRating;
    });

    // Apply sorting
    filtered = sortFeedbacks(filtered);

    if (filtered.length === 0) {
      showEmptyState('No feedbacks match your filters');
      return;
    }

    emptyState.style.display = 'none';
    feedbacksTableBody.innerHTML = filtered.map(feedback => createTableRow(feedback)).join('');
  }

  // Show empty state
  function showEmptyState(message) {
    emptyState.style.display = 'block';
    emptyState.querySelector('p').textContent = message;
    feedbacksTableBody.innerHTML = '';
  }

  // Create table row for feedback
  function createTableRow(feedback) {
    const rating = parseInt(feedback.rating) || 0;
    const stars = Array.from({length: 5}, (_, i) => 
      `<i data-lucide="star" class="feedback-star ${i < rating ? 'filled' : 'empty'}" style="width: 16px; height: 16px; display: inline-block;"></i>`
    ).join('');

    const date = new Date(feedback.created_at || new Date());
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const source = sourceMap[feedback.source?.toLowerCase()] || feedback.source || 'App';
    const status = feedback.reviewed ? 'Reviewed' : 'New';
    const statusColor = feedback.reviewed ? '#6b7280' : '#2563eb';
    const statusBgColor = feedback.reviewed ? '#f3f4f6' : '#eff6ff';

    const feedbackText = escapeHtml(feedback.text || '(No comment)');
    const truncatedText = feedbackText.length > 100 
      ? feedbackText.substring(0, 100) + '...' 
      : feedbackText;

    return `
      <tr style="border-bottom: 1px solid #e5e7eb; hover-background: #f9fafb;">
        <td style="text-align: center; padding: 12px 0; color: #6b7280;">
          <div style="display: flex; gap: 2px; justify-content: center;">
            ${stars}
          </div>
        </td>
        <td style="text-align: left; padding: 12px 0; color: #374151; font-size: 0.9375rem;" title="${feedbackText}">
          ${truncatedText}
        </td>
        <td style="text-align: left; padding: 12px 0; color: #6b7280; font-size: 0.875rem;">
          ${source}
        </td>
        <td style="text-align: left; padding: 12px 0; color: #6b7280; font-size: 0.875rem;">
          ${dateStr}<br><span style="font-size: 0.8125rem; color: #9ca3af;">${timeStr}</span>
        </td>
        <td style="text-align: center; padding: 12px 0;">
          <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8125rem; font-weight: 500; background-color: ${statusBgColor}; color: ${statusColor};">
            ${status}
          </span>
        </td>
      </tr>
    `;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Event listeners for filters and sorting
  searchInput.addEventListener('input', displayFeedbacks);
  ratingFilter.addEventListener('change', displayFeedbacks);
  sortBy.addEventListener('change', displayFeedbacks);

  // Initial load
  loadFeedbacks();
});
