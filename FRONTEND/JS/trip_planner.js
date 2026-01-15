lucide.createIcons();

const slider = document.getElementById('bat-slider');
const valInput = document.getElementById('bat-val');
const calcBtn = document.getElementById('calculate-trigger');
const loading = document.getElementById('loading-module');

slider.addEventListener('input', () => valInput.value = slider.value);
valInput.addEventListener('input', () => slider.value = valInput.value);

calcBtn.addEventListener('click', () => {
    loading.classList.remove('hidden'); 

    setTimeout(() => {
        loading.classList.add('hidden');
        document.getElementById('plan-phase').classList.add('hidden');
        document.getElementById('result-phase').classList.remove('hidden');
        lucide.createIcons();
        window.scrollTo(0,0); 
    }, 1500);
});