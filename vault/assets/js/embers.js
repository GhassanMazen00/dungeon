// SLOW COMBUSTION — the vault's living backdrop. See ART.md.
//
// A curl-noise field with an upward bias. Particles carry a decaying heat
// scalar; colour is derived from heat alone, never assigned. Population is
// conserved: an ember is only born when one dies.
//
// No dependencies, deterministic from a seed, and it stands down entirely when
// the visitor prefers reduced motion or the tab is hidden.

const SEED = 20773;
const POPULATION = 334; // see ART.md — this number is not arbitrary

/* ------------------------------------------------- deterministic randomness */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise with smootherstep interpolation — cheap, and smooth enough
 *  that its gradient (which is what we actually use) has no visible seams. */
function makeNoise(rand) {
  const SIZE = 256;
  const perm = Uint8Array.from({ length: SIZE }, (_, i) => i);
  for (let i = SIZE - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const grad = Array.from({ length: SIZE }, () => rand() * 2 - 1);
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const at = (x, y) => grad[(perm[x & 255] + perm[y & 255]) & 255];

  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = fade(x - xi);
    const yf = fade(y - yi);
    const a = at(xi, yi) + xf * (at(xi + 1, yi) - at(xi, yi));
    const b = at(xi, yi + 1) + xf * (at(xi + 1, yi + 1) - at(xi, yi + 1));
    return a + yf * (b - a);
  };
}

/* -------------------------------------------------------------- the system */

export function initEmbers(canvas) {
  if (!canvas) return;

  const reduced =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = canvas.getContext('2d', { alpha: false });
  const rand = mulberry32(SEED);
  const noise = makeNoise(rand);

  // Tuned, not derived. Small changes here are not small.
  const P = {
    coarse: 0.0016,   // low-frequency octave — places the shear zones
    fine: 0.0061,     // irrational-ish ratio to coarse so the field never tiles
    curl: 0.9,        // how hard the field turns the embers
    buoyancy: 0.52,   // embers know which way is out
    drag: 0.94,
    decay: 0.0042,    // heat loss per frame
    veil: 0.085,      // trail persistence — the narrow band between dots and mud
    drift: 0.00013    // the field itself creeps, so equilibrium never settles
  };

  let w = 0;
  let h = 0;
  let dpr = 1;
  let t = 0;
  let frame = null;
  const embers = [];

  /* Colour is earned by staying hot: bone → ember → oxidised iron. */
  const heatColour = (heat) => {
    const k = Math.max(0, Math.min(1, heat));
    if (k > 0.72) {
      const u = (k - 0.72) / 0.28;
      return `rgba(${255},${210 + u * 40},${170 + u * 60},`;
    }
    if (k > 0.34) {
      const u = (k - 0.34) / 0.38;
      return `rgba(${232 + u * 23},${90 + u * 120},${40 + u * 130},`;
    }
    const u = k / 0.34;
    return `rgba(${120 + u * 112},${18 + u * 72},${16 + u * 24},`;
  };

  const spawn = (e) => {
    e.x = rand() * w;
    // Born along the lower margin, a few seeded higher so the field is never empty.
    e.y = h * (0.82 + rand() * 0.3);
    e.vx = (rand() - 0.5) * 0.2;
    e.vy = -rand() * 0.3;
    // Long-tailed lifespan: most die low, a rare few cross the whole frame.
    e.heat = 0.25 + Math.pow(rand(), 2.6) * 0.85;
    e.size = 0.5 + Math.pow(rand(), 3) * 2.1;
    return e;
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080203';
    ctx.fillRect(0, 0, w, h);
  };

  const step = () => {
    // The veil: a translucent wash instead of a clear, so trails decay rather
    // than vanish. This single value is the difference between sparks and mud.
    ctx.fillStyle = `rgba(8, 2, 3, ${P.veil})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    t += 1;
    const drift = t * P.drift;

    for (const e of embers) {
      // Curl of the layered field: rotate the gradient 90° to get a
      // divergence-free flow, which is what makes it read as convection.
      const cx = e.x * P.coarse;
      const cy = e.y * P.coarse + drift;
      const fx = e.x * P.fine;
      const fy = e.y * P.fine + drift * 2.3;

      const n1 = noise(cx, cy);
      const n2 = noise(cx + 100, cy + 100);
      const n3 = noise(fx, fy) * 0.42;
      const n4 = noise(fx + 100, fy + 100) * 0.42;

      const angle = (n1 + n3) * Math.PI * 2;
      const shear = (n2 + n4) * 0.6;

      e.vx += Math.cos(angle) * P.curl * 0.06 + shear * 0.02;
      e.vy += Math.sin(angle) * P.curl * 0.06 - P.buoyancy * 0.06;

      e.vx *= P.drag;
      e.vy *= P.drag;
      e.x += e.vx;
      e.y += e.vy;
      e.heat -= P.decay;

      // Conservation: a new ember only exists because an old one stopped.
      if (e.heat <= 0 || e.y < -40 || e.x < -60 || e.x > w + 60) {
        spawn(e);
        continue;
      }

      const alpha = Math.min(0.85, e.heat * 0.9);
      ctx.fillStyle = `${heatColour(e.heat)}${alpha})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * (0.4 + e.heat * 0.9), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    frame = requestAnimationFrame(step);
  };

  const start = () => {
    if (frame === null) frame = requestAnimationFrame(step);
  };
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  resize();
  for (let i = 0; i < POPULATION; i++) {
    const e = spawn({});
    // Stagger the initial field so it opens already at equilibrium.
    e.y = rand() * h;
    e.heat = rand();
    embers.push(e);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  if (reduced) {
    // One settled frame: the composition without the motion.
    for (let i = 0; i < 220; i++) step();
    stop();
  } else {
    start();
  }
}
