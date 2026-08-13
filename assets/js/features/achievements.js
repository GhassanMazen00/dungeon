// Local-only achievement tracker. Progress lives in localStorage — it is a
// personal "how much of the site did I poke at" counter, nothing more.

import { STORAGE_KEYS } from '../config.js';
import { read, write } from '../core/store.js';
import { el, qs, qsa, toast, createModal } from '../core/dom.js';
import { icon } from '../core/icons.js';

export const ACHIEVEMENTS = [
  { id: 'arrive', emoji: '👋', name: 'First Contact', desc: 'Load the hub.' },
  { id: 'flip', emoji: '🪞', name: 'Two Faced', desc: 'Flip the portrait.' },
  { id: 'artist', emoji: '🎨', name: 'Pixel Pusher', desc: 'Send art to Ghassan.' },
  { id: 'export', emoji: '💾', name: 'Archivist', desc: 'Export a PNG from the studio.' },
  { id: 'oracle', emoji: '🔮', name: 'Curious', desc: 'Pull 10 fortunes.' },
  { id: 'favorite', emoji: '⭐', name: 'Collector', desc: 'Save a fortune to favourites.' },
  { id: 'signed', emoji: '✍️', name: 'Signed In Ink', desc: 'Post in the guestbook.' },
  { id: 'palette', emoji: '⌘', name: 'Power User', desc: 'Open the command palette.' },
  { id: 'themer', emoji: '🎭', name: 'Interior Designer', desc: 'Change the accent theme.' },
  { id: 'konami', emoji: '🕹️', name: 'Old School', desc: 'Enter the Konami code.' },
  { id: 'trapped', emoji: '🙈', name: 'No Shame', desc: 'Fall for the 18+ button.' },
  { id: 'explorer', emoji: '🗺️', name: 'Completionist', desc: 'Visit every section.' }
];

let unlocked = new Set(read(STORAGE_KEYS.achievements, []));
let modal = null;

export function unlock(id) {
  if (unlocked.has(id)) return;
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  if (!found) return;

  unlocked.add(id);
  write(STORAGE_KEYS.achievements, [...unlocked]);
  toast(`${found.emoji} Achievement: ${found.name}`, 'ok', 3200);
  render();
  updateCount();
}

export const isUnlocked = (id) => unlocked.has(id);
export const unlockedCount = () => unlocked.size;

function updateCount() {
  // The counter appears in both the hero stats and the modal header.
  qsa('[data-achv-count]').forEach((badge) => {
    badge.textContent = `${unlocked.size}/${ACHIEVEMENTS.length}`;
  });
}

function render() {
  const host = qs('#achvList');
  if (!host) return;
  host.replaceChildren(
    ...ACHIEVEMENTS.map((a) => {
      const done = unlocked.has(a.id);
      return el(
        'div',
        { class: `achv${done ? ' is-done' : ''}` },
        el('div', { class: 'achv__icon', text: done ? a.emoji : '🔒' }),
        el(
          'div',
          {},
          el('div', { class: 'achv__name', text: a.name }),
          el('div', { class: 'achv__desc', text: a.desc })
        ),
        done ? el('span', { class: 'achv__check', html: icon('check') }) : null
      );
    })
  );
}

/** Marks 'explorer' once the visitor has scrolled past every section. */
function trackSectionVisits(sectionIds) {
  const seen = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        seen.add(entry.target.id);
        if (seen.size >= sectionIds.length) {
          unlock('explorer');
          observer.disconnect();
        }
      }
    },
    { threshold: 0.35 }
  );
  sectionIds.forEach((id) => {
    const node = document.getElementById(id);
    if (node) observer.observe(node);
  });
}

export function initAchievements(sectionIds = []) {
  modal = createModal('achvModal');
  render();
  updateCount();
  unlock('arrive');
  trackSectionVisits(sectionIds);

  qsa('[data-open-achievements]').forEach((btn) =>
    btn.addEventListener('click', () => modal.open())
  );
  return modal;
}

export const openAchievements = () => modal?.open();

/** Wipes local progress — exposed through the command palette. */
export function resetAchievements() {
  unlocked = new Set();
  write(STORAGE_KEYS.achievements, []);
  render();
  updateCount();
  toast('Achievements reset.', 'info');
}
