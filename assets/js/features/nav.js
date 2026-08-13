// Navigation: links, mobile drawer, scroll-spy, progress bar, reveal-on-scroll,
// back-to-top and the collapsible panel behaviour.

import { SECTIONS } from '../config.js';
import { el, qs, qsa } from '../core/dom.js';
import { icon } from '../core/icons.js';

export function initNav() {
  const nav = qs('#nav');
  const links = qs('#navLinks');
  const burger = qs('#navBurger');
  const progress = qs('#progress');
  const toTop = qs('#toTop');

  /* --- Links ------------------------------------------------------------ */

  if (links) {
    links.replaceChildren(
      ...SECTIONS.map((section) =>
        el('a', {
          class: 'nav__link',
          href: `#${section.id}`,
          dataset: { spy: section.id },
          text: section.label
        })
      )
    );
  }

  const closeDrawer = () => {
    links?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
  };

  burger?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  links?.addEventListener('click', (event) => {
    if (event.target.closest('.nav__link')) closeDrawer();
  });

  document.addEventListener('click', (event) => {
    if (!links?.classList.contains('is-open')) return;
    if (event.target.closest('#navLinks') || event.target.closest('#navBurger')) return;
    closeDrawer();
  });

  /* --- Scroll state ----------------------------------------------------- */

  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    nav?.classList.toggle('is-stuck', y > 12);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    toTop?.classList.toggle('is-visible', y > 600);
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    },
    { passive: true }
  );

  onScroll();

  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* --- Scroll-spy ------------------------------------------------------- */

  const spyTargets = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);

  if (spyTargets.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        qsa('.nav__link').forEach((link) =>
          link.classList.toggle('is-active', link.dataset.spy === visible.target.id)
        );
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    spyTargets.forEach((node) => spy.observe(node));
  }

  /* --- Reveal on scroll -------------------------------------------------- */

  const revealables = qsa('.reveal');
  if (revealables.length) {
    const revealer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealables.forEach((node) => revealer.observe(node));
  }
}

/** Collapsible panels — accessible, animated via grid-template-rows. */
export function initPanels() {
  qsa('[data-panel-toggle]').forEach((head) => {
    const body = document.getElementById(head.getAttribute('aria-controls'));
    if (!body) return;

    if (!head.querySelector('.panel__chevron')) {
      head.append(el('span', { class: 'panel__chevron', html: icon('chevron') }));
    }

    head.addEventListener('click', () => {
      const open = body.classList.toggle('is-open');
      head.setAttribute('aria-expanded', String(open));
    });
  });
}

/** Opens a panel by id and scrolls it into view (used by the palette). */
export function openPanel(bodyId) {
  const body = document.getElementById(bodyId);
  const head = qs(`[aria-controls="${bodyId}"]`);
  if (!body || !head) return;
  body.classList.add('is-open');
  head.setAttribute('aria-expanded', 'true');
  head.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
