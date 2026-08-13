// The Oracle — fortune draws with a no-repeat shuffle bag, favourites,
// copy/share and a deterministic "fortune of the day".

import { FORTUNES } from '../data/fortunes.js';
import { STORAGE_KEYS } from '../config.js';
import { read, write } from '../core/store.js';
import { el, qs, toast, prefersReducedMotion } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { unlock } from './achievements.js';

const SIGNATURES = [
  "Ghassan's Oracle",
  'The Oracle Speaks',
  'Fortune Cookie Wisdom',
  'Mystical Insight',
  'Ancient Prophecy',
  'Digital Divination',
  'Pixel Fortune'
];

let bag = [];
let current = '';
let count = 0;
let favourites = [];

/** Refills and shuffles the draw bag so no fortune repeats until all are seen. */
function refill() {
  bag = FORTUNES.map((_, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
}

/** Same fortune for everyone, all day — index derived from the date. */
function fortuneOfTheDay() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return FORTUNES[seed % FORTUNES.length];
}

function renderFavourites() {
  const host = qs('#favList');
  const wrapper = qs('#favWrap');
  if (!host || !wrapper) return;

  wrapper.hidden = favourites.length === 0;
  host.replaceChildren(
    ...favourites.map((text) =>
      el(
        'div',
        { class: 'fav' },
        el('span', { text: `"${text}"` }),
        el('button', {
          class: 'btn btn--sm btn--ghost',
          type: 'button',
          'aria-label': 'Remove favourite',
          html: icon('close'),
          onclick: () => {
            favourites = favourites.filter((f) => f !== text);
            write(STORAGE_KEYS.fortuneFavs, favourites);
            renderFavourites();
            syncFavButton();
          }
        })
      )
    )
  );
}

function syncFavButton() {
  const button = qs('#btnFav');
  if (!button) return;
  const saved = favourites.includes(current);
  button.innerHTML = icon(saved ? 'starFilled' : 'star');
  button.setAttribute('aria-pressed', String(saved));
  button.title = saved ? 'Remove from favourites' : 'Save this fortune';
}

function updateMeta() {
  const meta = qs('#oracleMeta');
  if (!meta) return;
  if (count === 0) meta.textContent = 'Touch the orb for your first reading.';
  else if (count === 1) meta.textContent = '1 fortune revealed.';
  else meta.textContent = `${count} fortunes revealed · ${bag.length} left in this cycle.`;
}

function show(text, signature) {
  current = text;
  const card = qs('#fortuneCard');
  qs('#fortuneText').textContent = `"${text}"`;
  qs('#fortuneBy').textContent = `— ${signature}`;

  if (!prefersReducedMotion() && card) {
    card.classList.remove('is-new');
    void card.offsetWidth; // restart the animation
    card.classList.add('is-new');
  }
  syncFavButton();
}

export function drawFortune() {
  if (!bag.length) refill();
  const index = bag.pop();
  const signature = SIGNATURES[Math.floor(Math.random() * SIGNATURES.length)];

  const orb = qs('#orb');
  if (orb && !prefersReducedMotion()) {
    orb.classList.add('is-reading');
    setTimeout(() => orb.classList.remove('is-reading'), 520);
  }

  show(FORTUNES[index], signature);

  count += 1;
  write(STORAGE_KEYS.fortuneCount, count);
  write(STORAGE_KEYS.fortuneSeen, bag);
  updateMeta();

  if (count >= 10) unlock('oracle');
}

async function shareFortune() {
  if (!current) return;
  const text = `"${current}" — ghassan's oracle`;
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast('Fortune copied.', 'ok');
  } catch {
    // User dismissed the share sheet, or the clipboard is blocked.
  }
}

export function initOracle() {
  if (!qs('#fortuneCard')) return;

  count = read(STORAGE_KEYS.fortuneCount, 0);
  favourites = read(STORAGE_KEYS.fortuneFavs, []);
  const storedBag = read(STORAGE_KEYS.fortuneSeen, null);
  if (Array.isArray(storedBag) && storedBag.length) bag = storedBag;
  else refill();

  const orb = qs('#orb');
  orb?.addEventListener('click', drawFortune);
  orb?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      drawFortune();
    }
  });

  qs('#btnDraw')?.addEventListener('click', drawFortune);
  qs('#btnShare')?.addEventListener('click', shareFortune);

  qs('#btnDaily')?.addEventListener('click', () => {
    show(fortuneOfTheDay(), "Today's reading");
    toast('Fortune of the day — same for everyone until midnight.', 'info', 3200);
  });

  qs('#btnFav')?.addEventListener('click', () => {
    if (!current) return;
    if (favourites.includes(current)) {
      favourites = favourites.filter((f) => f !== current);
    } else {
      favourites = [current, ...favourites].slice(0, 20);
      unlock('favorite');
    }
    write(STORAGE_KEYS.fortuneFavs, favourites);
    renderFavourites();
    syncFavButton();
  });

  show(fortuneOfTheDay(), "Today's reading");
  renderFavourites();
  updateMeta();
}
