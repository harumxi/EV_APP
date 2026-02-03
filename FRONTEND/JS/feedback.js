// Feedback modal UI (frontend-only)
document.addEventListener('DOMContentLoaded', () => {
  const openHelpBtn = document.getElementById('openHelpBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackClose = document.getElementById('feedbackCloseBtn');
  const feedbackOpenFromHelp = document.getElementById('openFeedbackFromHelp');
  const floatingBtn = document.getElementById('feedbackFloatingBtn');
  const starButtons = document.querySelectorAll('[data-star]');
  const ratingInput = document.getElementById('feedbackRating');
  const categoryInput = document.getElementById('feedbackCategory');
  const feedbackForm = document.getElementById('feedbackForm');
  const feedbackMessage = document.getElementById('feedbackMessage');
  const feedbackTextarea = document.getElementById('feedbackText');
  const charToast = document.getElementById('feedbackCharToast');

  // Track current rating for persistence during hover
  let currentRating = 0;

  function openModal() {
    if (!feedbackModal) return;
    feedbackModal.classList.remove('hidden');
    setTimeout(() => feedbackModal.classList.add('show'), 10);
    // reset
    currentRating = 0;
    ratingInput.value = '';
    updateStars(0);
    feedbackTextarea.value = '';
    if (categoryInput) { categoryInput.value = ''; }
    if (charToast) { charToast.classList.add('hidden'); }
    feedbackMessage.textContent = '';
  }

  function closeModal() {
    if (!feedbackModal) return;
    feedbackModal.classList.remove('show');
    setTimeout(() => feedbackModal.classList.add('hidden'), 220);
  }

  function updateStars(rating) {
    starButtons.forEach(btn => {
      const val = Number(btn.getAttribute('data-star'));
      if (val <= rating) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    ratingInput.value = rating || '';
  }

  starButtons.forEach(btn => {
    // Click to set persistent rating
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = Number(btn.getAttribute('data-star'));
      currentRating = val;
      updateStars(val);
    });

    // Hover to preview rating (show temporary filled state)
    btn.addEventListener('mouseenter', () => {
      const val = Number(btn.getAttribute('data-star'));
      updateStars(val);
    });

    // Leave to restore persisted rating
    btn.addEventListener('mouseleave', () => {
      updateStars(currentRating);
    });
  });

  // Open modal from Help button (Profile -> Help / FAQ -> Feedback)
  openHelpBtn?.addEventListener('click', () => {
    // open help panel then feedback; simpler: open modal directly
    openModal();
  });

  // Optional: help panel link to open feedback (if present inside help drawer)
  feedbackOpenFromHelp?.addEventListener('click', (e) => { e.preventDefault(); openModal(); });

  floatingBtn?.addEventListener('click', openModal);
  feedbackClose?.addEventListener('click', closeModal);

  feedbackForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Validate: rating required
    const rating = Number(ratingInput.value || 0);
    if (!rating) {
      feedbackMessage.textContent = 'Please select a rating (1–5 stars).';
      feedbackMessage.classList.add('error');
      return;
    }
    // Enforce 500-char limit (UI-only) and trim if needed
    if (feedbackTextarea && feedbackTextarea.value.length > 500) {
      feedbackTextarea.value = feedbackTextarea.value.slice(0, 500);
    }

    // Show subtle success confirmation and close modal
    feedbackMessage.textContent = 'Thanks — your feedback was received.';
    feedbackMessage.classList.remove('error');
    feedbackMessage.classList.add('success');

    setTimeout(() => {
      closeModal();
      // small ephemeral toast
      const toast = document.createElement('div');
      toast.className = 'feedback-toast';
      toast.textContent = 'Feedback submitted. Thank you!';
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => toast.classList.remove('show'), 2400);
      setTimeout(() => document.body.removeChild(toast), 2800);
    }, 700);
  });

  // close on overlay click
  feedbackModal?.addEventListener('click', (e) => {
    if (e.target === feedbackModal) closeModal();
  });

  // Character limit UI feedback
  if (feedbackTextarea) {
    feedbackTextarea.addEventListener('input', (e) => {
      const val = e.target.value || '';
      if (val.length >= 500) {
        if (charToast) { charToast.classList.remove('hidden'); }
      } else {
        if (charToast) { charToast.classList.add('hidden'); }
      }
    });
  }

  // Wire the new primary "Write a review" button to open the modal
  const openFeedbackBtn = document.getElementById('openFeedbackBtn');
  openFeedbackBtn?.addEventListener('click', openModal);
});
