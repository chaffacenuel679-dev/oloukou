// Animations du site public : apparition au défilement, compteurs, parcours.
// Optimisations : un seul calcul par image au défilement (requestAnimationFrame),
// animations en boucle mises en pause quand l'accueil n'est plus visible.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let revealIO, counterIO;

function observeNew() {
  document.querySelectorAll('[data-reveal]:not(.in):not([data-obs])').forEach(el => {
    if (reduced) { el.classList.add('in'); return; }
    el.dataset.obs = '';
    revealIO.observe(el);
  });
}

function animateCounter(el) {
  const end = Number(el.dataset.target), suffix = el.dataset.count === 'years' ? '+' : '';
  if (reduced || !end) { el.textContent = end + suffix; return; }
  el.dataset.animating = '1';
  const t0 = performance.now(), dur = 1400;
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(Number(el.dataset.target) * ease) + (k === 1 ? suffix : '');
    if (k < 1) requestAnimationFrame(step); else delete el.dataset.animating;
  };
  requestAnimationFrame(step);
}

function start() {
  /* Apparition des blocs quand ils entrent à l'écran */
  revealIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  observeNew();
  document.addEventListener('content-updated', observeNew);

  /* Compteurs des chiffres clés */
  counterIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    counterIO.unobserve(e.target);
    animateCounter(e.target);
  }), { threshold: 0.6 });
  document.querySelectorAll('[data-target]').forEach(el => counterIO.observe(el));

  /* Pause des animations en boucle de l'accueil quand il est hors écran */
  const loopIO = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('paused-loop', !e.isIntersecting)));
  document.querySelectorAll('.hero, .travel').forEach(el => loopIO.observe(el));

  /* En-tête + ligne du parcours : un seul calcul par image */
  const topbar = document.querySelector('.topbar'), tl = document.querySelector('.timeline');
  let ticking = false, scrolled = null, progress = '';
  const update = () => {
    ticking = false;
    const s = scrollY > 10;
    if (s !== scrolled) topbar.classList.toggle('scrolled', scrolled = s);
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.7 - r.top) / (r.height || 1))).toFixed(3);
    if (p !== progress) tl.style.setProperty('--progress', progress = p);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('content-updated', onScroll);
  update();
}

if (document.documentElement.dataset.ready) start();
else document.addEventListener('content-ready', start, { once: true });
