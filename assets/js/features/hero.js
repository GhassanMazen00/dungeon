// Hero: role typewriter, portrait flip, speech bubble, photo fallback.

import { PROFILE, DIALOGUES } from '../data/site.js';
import { qs, prefersReducedMotion } from '../core/dom.js';
import { unlock } from './achievements.js';

function typewriter(node, words) {
  if (prefersReducedMotion()) {
    node.textContent = words[0];
    return;
  }

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const word = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    node.textContent = word.slice(0, charIndex);

    let delay = deleting ? 45 : 85;
    if (!deleting && charIndex === word.length) {
      delay = 1700;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 320;
    }
    setTimeout(tick, delay);
  };

  tick();
}

export function initHero() {
  /* --- Portrait --------------------------------------------------------- */

  const photo = qs('#heroPhoto');
  const portrait = qs('#portrait');
  const flipBtn = qs('#portraitFlip');

  if (photo) {
    photo.src = PROFILE.photo;
    // If the real photo is not in place yet, fall back to the pixel avatar so
    // the hero never renders a broken image.
    photo.addEventListener(
      'error',
      () => {
        photo.src = PROFILE.pixelAvatar;
        photo.classList.add('portrait__img--pixel');
        photo.closest('.portrait__face')?.classList.add('portrait__face--placeholder');
      },
      { once: true }
    );
  }

  const flip = () => {
    const flipped = portrait?.classList.toggle('is-flipped');
    flipBtn?.setAttribute('aria-pressed', String(Boolean(flipped)));
    unlock('flip');
  };

  flipBtn?.addEventListener('click', flip);

  /* --- Speech bubble ----------------------------------------------------- */

  const bubble = qs('#speech');
  const bubbleText = qs('#speechText');
  let line = -1;
  let hideTimer = null;

  const say = () => {
    if (!bubble || !bubbleText) return;
    line = (line + 1) % DIALOGUES.length;
    bubbleText.textContent = DIALOGUES[line];
    bubble.classList.add('is-shown');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bubble.classList.remove('is-shown'), 4200);
  };

  qs('#portraitFace')?.addEventListener('click', say);

  /* --- Roles ------------------------------------------------------------- */

  const role = qs('#heroRole');
  if (role) typewriter(role, PROFILE.roles);

  /* --- Static copy ------------------------------------------------------- */

  const name = qs('#heroName');
  if (name) {
    name.textContent = PROFILE.name;
    name.dataset.text = PROFILE.name;
  }

  const tagline = qs('#heroTagline');
  if (tagline) tagline.textContent = PROFILE.tagline;
}
