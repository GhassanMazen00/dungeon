// Easter eggs: the Konami code (now toggles CRT mode) and the 18+ prank.

import { qs } from '../core/dom.js';
import { toggleCRT } from './theme.js';
import { unlock } from './achievements.js';

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

function initKonami() {
  let index = 0;
  document.addEventListener('keydown', (event) => {
    if (event.code === KONAMI[index]) {
      index += 1;
      if (index === KONAMI.length) {
        index = 0;
        toggleCRT();
        unlock('konami');
      }
    } else {
      index = event.code === KONAMI[0] ? 1 : 0;
    }
  });
}

/** The classic bait button. Hides the page behind a full-screen overlay. */
export function openShame() {
  const shame = qs('#shame');
  if (!shame) return;
  shame.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  unlock('trapped');
}

function closeShame() {
  qs('#shame')?.classList.remove('is-open');
  document.body.style.overflow = '';
}

function initTrap() {
  qs('#btnTrap')?.addEventListener('click', () => {
    const sure = confirm('⚠️ WARNING: explicit material ahead.\nAre you absolutely sure?');
    if (sure) openShame();
  });

  qs('#btnSorry')?.addEventListener('click', closeShame);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeShame();
  });
}

export function initEggs() {
  initKonami();
  initTrap();
}
