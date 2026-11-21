// Engrenages animés : dessin des roues dentées et rotation synchronisée.
// Les vitesses respectent le rapport des dents (ω₁·n₁ = ω₂·n₂), donc les dents s'emboîtent vraiment.
const NS = 'http://www.w3.org/2000/svg';
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Chemin SVG d'une roue dentée centrée en (0,0). n dents, module m, trou de rayon hole. */
export function gearPath(n, m, hole = 0) {
  const r = (m * n) / 2, ro = r + m, rr = r - 1.25 * m, p = (2 * Math.PI) / n;
  const pt = (a, rad) => `${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`;
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = k * p; // dent centrée sur l'angle a
    d += `${k ? 'L' : 'M'}${pt(a - p * 0.5, rr)} L${pt(a - p * 0.3, rr)} L${pt(a - p * 0.16, ro)} L${pt(a + p * 0.16, ro)} L${pt(a + p * 0.3, rr)} L${pt(a + p * 0.5, rr)} `;
  }
  d += 'Z';
  if (hole) d += ` M${hole},0 A${hole},${hole} 0 1,0 ${-hole},0 A${hole},${hole} 0 1,0 ${hole},0 Z`;
  return d;
}

/**
 * Place une liste de roues et les fait tourner.
 * gears[0] = { n, m, x, y, color, hole } ; gears[i>0] = { n, m, parent, angle (°), color, hole, spokes }
 */
export function mountGears(svg, gears, { speed = 12 } = {}) {
  const deg = Math.PI / 180;
  gears.forEach((g, i) => {
    g.r = (g.m * g.n) / 2;
    g.pitch = 360 / g.n;
    if (i === 0) { g.rot0 = 0; g.dir = 1; g.ratio = 1; }
    else {
      const P = gears[g.parent], dist = P.r + g.r;
      g.x = P.x + Math.cos(g.angle * deg) * dist;
      g.y = P.y + Math.sin(g.angle * deg) * dist;
      // Phase de la roue parente face à la nouvelle roue (0 = dent, 0.5 = creux)
      const f = ((((g.angle - P.rot0) / P.pitch) % 1) + 1) % 1;
      g.rot0 = g.angle + 180 - (0.5 - f) * g.pitch;
      g.dir = -P.dir;
      g.ratio = P.ratio * (P.n / g.n);
    }
    const outer = document.createElementNS(NS, 'g');
    outer.setAttribute('transform', `translate(${g.x} ${g.y})`);
    const inner = document.createElementNS(NS, 'g');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', gearPath(g.n, g.m, g.hole || 0));
    path.setAttribute('fill', g.color);
    path.setAttribute('fill-rule', 'evenodd');
    inner.append(path);
    if (!g.hole) {
      const hub = document.createElementNS(NS, 'circle');
      hub.setAttribute('r', Math.max(4, g.r * 0.22));
      hub.setAttribute('fill', '#fff');
      inner.append(hub);
    }
    outer.append(inner);
    svg.append(outer);
    g.el = inner;
  });
  const set = t => gears.forEach(g => g.el.setAttribute('transform', `rotate(${(g.rot0 + g.dir * g.ratio * t).toFixed(3)})`));
  set(0);
  if (reduced) return;
  let t = 0, last = performance.now(), visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(svg);
  const tick = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible && !document.hidden) { t += dt * speed; set(t); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Petit engrenage du logo (présent sur toutes les pages)
document.querySelectorAll('.logo-gear').forEach(svg => {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', gearPath(10, 8.4, 0));
  p.setAttribute('fill', 'currentColor');
  svg.append(p);
});
