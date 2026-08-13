// Admin mode: unlocks guestbook deletion and the art gallery.
//
// IMPORTANT: this is a UI convenience gate, not security. The passcode ships in
// the page source. Anything that must actually be protected has to be enforced
// by Firebase Realtime Database rules on the server side.

import { ADMIN_PASSCODE } from '../config.js';
import { el, qs, toast, createModal } from '../core/dom.js';
import { artRef, isOnline, snapshotToArray } from '../core/db.js';
import { setGuestbookAdmin } from './guestbook.js';

let isAdmin = false;
let modal = null;
let galleryBound = false;

function renderGallery(pieces) {
  const host = qs('#artGallery');
  if (!host) return;

  if (!pieces.length) {
    host.replaceChildren(el('p', { class: 'empty', text: 'No art has been sent yet.' }));
    return;
  }

  host.replaceChildren(
    ...pieces.map((art) => {
      const canvas = el('canvas', { width: 96, height: 96 });
      const ctx = canvas.getContext('2d');
      const size = Number(art.size) || 16;
      const cell = 96 / size;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          ctx.fillStyle = art.colors?.[y * size + x] || '#000000';
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }

      return el(
        'div',
        { class: 'art-item' },
        canvas,
        el('div', { class: 'art-item__time', text: art.timestamp || 'unknown date' }),
        el('button', {
          class: 'art-item__del',
          type: 'button',
          text: '✕',
          'aria-label': 'Delete this art',
          onclick: () => deleteArt(art.key)
        })
      );
    })
  );
}

function bindGallery() {
  if (galleryBound || !isOnline()) return;
  galleryBound = true;

  artRef().on('value', (snapshot) => {
    if (!isAdmin) return;
    const pieces = snapshot.exists() ? snapshotToArray(snapshot) : [];
    pieces.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    renderGallery(pieces);
  });
}

async function deleteArt(key) {
  if (!isAdmin || !confirm('Delete this art piece?')) return;
  try {
    await artRef().child(key).remove();
    toast('Art deleted.', 'ok');
  } catch (error) {
    console.error('[admin] delete art failed', error);
    toast('Could not delete that piece.', 'bad');
  }
}

async function clearAllArt() {
  if (!isAdmin || !confirm('Delete ALL art from the cloud? This cannot be undone.')) return;
  try {
    await artRef().remove();
    toast('Gallery cleared.', 'ok');
  } catch (error) {
    console.error('[admin] clear failed', error);
    toast('Could not clear the gallery.', 'bad');
  }
}

function setAdmin(on) {
  isAdmin = on;
  setGuestbookAdmin(on);
  qs('#adminGallery').hidden = !on;
  qs('#adminBadge').hidden = !on;
  qs('#adminState').textContent = on
    ? 'Admin mode active — you can delete messages and manage the gallery.'
    : 'Admin mode inactive.';
  if (on) bindGallery();
}

export const openAdmin = () => modal?.open();

export function initAdmin() {
  modal = createModal('adminModal');

  const submit = () => {
    const input = qs('#adminPass');
    if (input.value === ADMIN_PASSCODE) {
      input.value = '';
      setAdmin(true);
      modal.close();
      toast('Admin mode activated.', 'ok');
    } else {
      toast('Wrong passcode.', 'bad');
      input.select();
    }
  };

  qs('#btnAdminGo')?.addEventListener('click', submit);
  qs('#adminPass')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
  });

  qs('#btnAdminOff')?.addEventListener('click', () => {
    setAdmin(false);
    toast('Admin mode off.', 'info');
    modal.close();
  });

  qs('#btnClearArt')?.addEventListener('click', clearAllArt);
  qs('[data-open-admin]')?.addEventListener('click', () => modal.open());

  setAdmin(false);
}
