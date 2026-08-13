// Tiny DOM helpers used across every feature module.

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Create an element with attributes and children in one call. */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

/** "3 minutes ago" style formatting for guestbook entries. */
export function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - Number(ts);
  if (Number.isNaN(diff)) return '';
  const units = [
    ['y', 31536000000],
    ['mo', 2592000000],
    ['d', 86400000],
    ['h', 3600000],
    ['m', 60000]
  ];
  for (const [label, ms] of units) {
    const value = Math.floor(diff / ms);
    if (value >= 1) return `${value}${label} ago`;
  }
  return 'just now';
}

/** Deterministic hue from a string — used for guestbook avatars. */
export function hashHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 360;
  return hash;
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.body.dataset.motion === 'off';

/* --- Toasts -------------------------------------------------------------- */

let toastHost = null;

export function toast(message, kind = 'info', ms = 2600) {
  if (!toastHost) {
    toastHost = el('div', { class: 'toasts', 'aria-live': 'polite' });
    document.body.append(toastHost);
  }
  const node = el('div', { class: `toast toast--${kind}`, text: message });
  toastHost.append(node);
  setTimeout(() => {
    node.classList.add('is-out');
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }, ms);
}

/* --- Modal --------------------------------------------------------------- */

/** Wires open/close/escape/backdrop behaviour onto a .modal element. */
export function createModal(id) {
  const root = document.getElementById(id);
  if (!root) return { open() {}, close() {}, root: null };

  let lastFocus = null;

  const close = () => {
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  };

  const open = () => {
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    const focusable = root.querySelector('input, button, [tabindex]');
    if (focusable) setTimeout(() => focusable.focus(), 60);
  };

  root.addEventListener('click', (event) => {
    if (event.target === root || event.target.closest('[data-close]')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) close();
  });

  return { open, close, root, isOpen: () => root.classList.contains('is-open') };
}
