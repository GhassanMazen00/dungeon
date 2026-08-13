// Accent themes, reduced-motion toggle and CRT mode.

import { THEMES, STORAGE_KEYS } from '../config.js';
import { read, write } from '../core/store.js';
import { el, qs, qsa, toast } from '../core/dom.js';
import { unlock } from './achievements.js';

let current = read(STORAGE_KEYS.theme, 'crimson');

export function applyTheme(id, { announce = false } = {}) {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
  current = theme.id;
  document.documentElement.dataset.theme = theme.id;
  write(STORAGE_KEYS.theme, theme.id);

  const meta = qs('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.swatch);

  qsa('.theme-dot').forEach((dot) => {
    dot.classList.toggle('is-active', dot.dataset.theme === theme.id);
    dot.setAttribute('aria-pressed', String(dot.dataset.theme === theme.id));
  });

  if (announce) {
    toast(`Theme: ${theme.label}`, 'info', 1600);
    unlock('themer');
  }
}

export function cycleTheme() {
  const index = THEMES.findIndex((t) => t.id === current);
  applyTheme(THEMES[(index + 1) % THEMES.length].id, { announce: true });
}

export function toggleMotion() {
  const off = document.body.dataset.motion === 'off';
  document.body.dataset.motion = off ? 'on' : 'off';
  write(STORAGE_KEYS.motion, off ? 'on' : 'off');
  qs('[data-toggle-motion]')?.classList.toggle('is-on', !off);
  toast(off ? 'Motion enabled.' : 'Motion reduced.', 'info', 1600);
}

export function toggleCRT(force) {
  const on = force ?? document.body.dataset.crt !== 'on';
  document.body.dataset.crt = on ? 'on' : 'off';
  write(STORAGE_KEYS.crt, on ? 'on' : 'off');
  toast(on ? 'CRT mode engaged.' : 'CRT mode off.', 'info', 1600);
  return on;
}

export function initTheme() {
  const host = qs('#themeRow');
  if (host) {
    host.replaceChildren(
      ...THEMES.map((theme) =>
        el('button', {
          class: 'theme-dot',
          type: 'button',
          title: theme.label,
          'aria-label': `${theme.label} theme`,
          dataset: { theme: theme.id },
          style: `background:${theme.swatch}`,
          onclick: () => applyTheme(theme.id, { announce: true })
        })
      )
    );
  }

  applyTheme(current);

  document.body.dataset.motion = read(STORAGE_KEYS.motion, 'on');
  document.body.dataset.crt = read(STORAGE_KEYS.crt, 'off');
  qs('[data-toggle-motion]')?.classList.toggle('is-on', document.body.dataset.motion === 'off');
  qs('[data-toggle-motion]')?.addEventListener('click', toggleMotion);
}
