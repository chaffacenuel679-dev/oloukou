// Animations du site public : engrenages, apparition au défilement, compteurs, parcours.
import { mountGears, reduced } from './gears.js';

/* 1. Engrenages de l'accueil : la photo est au centre de la grande roue bleue. */
mountGears(document.getElementById('gears'), [
  { n: 24, m: 10, x: 180, y: 240, color: '#1d4f91', hole: 90 },
  { n: 12, m: 10, parent: 0, angle: -45, color: '#2e8b57' },
  { n: 8, m: 10, parent: 0, angle: 120, color: '#c8102e' },
  { n: 6, m: 10, parent: 1, angle: 35, color: '#8fb3dc' }
]);

function start() {
  /* 2. Apparition des blocs quand ils entrent à l'écran */
  const items = document.querySelectorAll('[data-reveal]');
  if (reduced) items.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
  }

  /* 3. Compteurs des chiffres clés */
  const counters = document.querySelectorAll('[data-target]');
  const cio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = Number(el.dataset.target), t0 = performance.now(), dur = 1400;
    if (reduced) return;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * ease) + (k === 1 && el.dataset.count === 'years' ? '+' : '');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  counters.forEach(el => cio.observe(el));

  /* 4. La ligne du parcours se remplit au fil du défilement */
  const tl = document.querySelector('.timeline');
  const onScroll = () => {
    document.querySelector('.topbar').classList.toggle('scrolled', scrollY > 10);
    if (!tl) return;
    const r = tl.getBoundingClientRect(), h = innerHeight * 0.7;
    tl.style.setProperty('--progress', Math.max(0, Math.min(1, (h - r.top) / r.height)).toFixed(3));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

if (document.documentElement.dataset.ready) start();
else document.addEventListener('content-ready', start, { once: true });
