(function initBottomNav(){
  const nav = document.getElementById('bottomNav');
  if (!nav) return;

  const items = Array.from(nav.querySelectorAll('button.nav-item'));

  function setActive(btn){
    items.forEach(b => b.removeAttribute('aria-current'));
    btn.setAttribute('aria-current', 'page');
  }

  items.forEach(btn => {
    btn.addEventListener('click', () => setActive(btn));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActive(btn);
      }
    });
  });
})();