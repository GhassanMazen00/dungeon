// Canvas particle field. Replaces the particles.js CDN dependency: it reads the
// active accent colour, pauses when the tab is hidden or the section is
// off-screen, and stands down entirely when the visitor prefers reduced motion.

import { qs, prefersReducedMotion } from '../core/dom.js';

const MAX_LINK_DIST = 130;

export function initBackground() {
  const canvas = qs('#particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let frame = null;
  let accent = '255, 59, 59';
  const pointer = { x: -9999, y: -9999, active: false };

  const readAccent = () => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb');
    if (value.trim()) accent = value.trim();
  };

  const count = () => {
    const area = width * height;
    // Roughly one particle per 22k css pixels, clamped for phones and 4K alike.
    return Math.max(28, Math.min(96, Math.round(area / 22000)));
  };

  const spawn = () => {
    particles = Array.from({ length: count() }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      a: Math.random() * 0.4 + 0.25
    }));
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawn();
  };

  const step = () => {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      // Gentle repulsion around the cursor.
      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110 && dist > 0.1) {
          const push = (110 - dist) / 110 * 0.6;
          p.x += (dx / dist) * push;
          p.y += (dy / dist) * push;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent}, ${p.a})`;
      ctx.fill();
    }

    // Link nearby particles — O(n²) but n is capped at 96.
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > MAX_LINK_DIST) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${accent}, ${(1 - dist / MAX_LINK_DIST) * 0.16})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    frame = requestAnimationFrame(step);
  };

  const start = () => {
    if (frame !== null || prefersReducedMotion()) return;
    frame = requestAnimationFrame(step);
  };

  const stop = () => {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  };

  readAccent();
  resize();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  });

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );

  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // Accent changes should recolour the field immediately.
  new MutationObserver(readAccent).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  if (prefersReducedMotion()) {
    // Draw a single static frame so the background still has texture.
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent}, ${p.a * 0.7})`;
      ctx.fill();
    }
  } else {
    start();
  }
}
