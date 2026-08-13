// Guestbook — Firebase-backed notes with live updates, search, paging,
// generated avatars, character counters and a simple client-side post cooldown.

import { POST_COOLDOWN_MS, STORAGE_KEYS } from '../config.js';
import { read, write } from '../core/store.js';
import { el, qs, toast, relativeTime, hashHue } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { notesRef, isOnline, snapshotToArray } from '../core/db.js';
import { unlock } from './achievements.js';

const PAGE_SIZE = 12;

let allNotes = [];
let visible = PAGE_SIZE;
let filter = '';
let adminMode = false;

function avatarFor(name) {
  const hue = hashHue(name || '?');
  return el('span', {
    class: 'note__avatar',
    style: `background: linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 48) % 360} 70% 48%))`,
    text: (name || '?').trim().charAt(0).toUpperCase()
  });
}

function render() {
  const wall = qs('#notesWall');
  const countEl = qs('#notesCount');
  const moreBtn = qs('#btnMoreNotes');
  if (!wall) return;

  const needle = filter.trim().toLowerCase();
  const matched = needle
    ? allNotes.filter(
        (note) =>
          String(note.nickname ?? '').toLowerCase().includes(needle) ||
          String(note.noteText ?? '').toLowerCase().includes(needle)
      )
    : allNotes;

  if (countEl) {
    countEl.textContent = needle
      ? `${matched.length} of ${allNotes.length}`
      : `${allNotes.length} message${allNotes.length === 1 ? '' : 's'}`;
  }

  if (!matched.length) {
    wall.replaceChildren(
      el('p', {
        class: 'empty',
        text: needle ? 'No messages match that search.' : 'No messages yet. Be the first.'
      })
    );
    if (moreBtn) moreBtn.hidden = true;
    return;
  }

  const slice = matched.slice(0, visible);

  wall.replaceChildren(
    ...slice.map((note) =>
      el(
        'article',
        { class: 'note' },
        el(
          'header',
          { class: 'note__head' },
          avatarFor(note.nickname),
          el('span', { class: 'note__author', text: note.nickname || 'anon' }),
          el('time', { class: 'note__time', text: relativeTime(note.timestamp) })
        ),
        el('p', { class: 'note__body', text: note.noteText || '' }),
        adminMode
          ? el('button', {
              class: 'btn btn--sm btn--danger note__del',
              type: 'button',
              text: 'Delete',
              onclick: () => deleteNote(note.key)
            })
          : null
      )
    )
  );

  if (moreBtn) {
    moreBtn.hidden = matched.length <= visible;
    moreBtn.textContent = `Load ${Math.min(PAGE_SIZE, matched.length - visible)} more`;
  }
}

async function deleteNote(key) {
  if (!adminMode || !isOnline()) return;
  if (!confirm('Delete this message?')) return;
  try {
    await notesRef().child(key).remove();
    toast('Message deleted.', 'ok');
  } catch (error) {
    console.error('[guestbook] delete failed', error);
    toast('Could not delete that message.', 'bad');
  }
}

async function postNote() {
  const nameInput = qs('#gbName');
  const textInput = qs('#gbText');
  const button = qs('#btnPost');

  const nickname = nameInput.value.trim();
  const noteText = textInput.value.trim();

  if (!nickname || !noteText) {
    toast('Both a name and a message are required.', 'bad');
    return;
  }
  if (!isOnline()) {
    toast('Cloud is offline — try again later.', 'bad');
    return;
  }

  const last = read(STORAGE_KEYS.guestbookLast, 0);
  const waited = Date.now() - last;
  if (waited < POST_COOLDOWN_MS) {
    toast(`Hold on ${Math.ceil((POST_COOLDOWN_MS - waited) / 1000)}s before posting again.`, 'info');
    return;
  }

  button.disabled = true;
  try {
    await notesRef().push().set({
      nickname: nickname.slice(0, 30),
      noteText: noteText.slice(0, 500),
      timestamp: Date.now()
    });
    write(STORAGE_KEYS.guestbookLast, Date.now());
    textInput.value = '';
    syncCounters();
    toast('Message posted. Thanks for signing.', 'ok');
    unlock('signed');
  } catch (error) {
    console.error('[guestbook] post failed', error);
    toast('Could not post your message.', 'bad');
  } finally {
    button.disabled = false;
  }
}

function syncCounters() {
  const text = qs('#gbText');
  const counter = qs('#gbCount');
  if (!text || !counter) return;
  const used = text.value.length;
  counter.textContent = `${used}/500`;
  counter.classList.toggle('is-warn', used > 450);
}

/** Called by the admin module so delete buttons appear/disappear live. */
export function setGuestbookAdmin(on) {
  adminMode = on;
  render();
}

export function initGuestbook() {
  if (!qs('#notesWall')) return;

  qs('#btnPost')?.addEventListener('click', postNote);
  qs('#gbText')?.addEventListener('input', syncCounters);

  qs('#gbText')?.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') postNote();
  });

  qs('#gbSearch')?.addEventListener('input', (event) => {
    filter = event.target.value;
    visible = PAGE_SIZE;
    render();
  });

  qs('#btnMoreNotes')?.addEventListener('click', () => {
    visible += PAGE_SIZE;
    render();
  });

  syncCounters();

  if (!isOnline()) {
    qs('#notesWall').replaceChildren(
      el('p', { class: 'empty', text: 'Guestbook is offline right now.' })
    );
    return;
  }

  notesRef().on(
    'value',
    (snapshot) => {
      allNotes = snapshot.exists() ? snapshotToArray(snapshot) : [];
      allNotes.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
      render();
    },
    (error) => {
      console.error('[guestbook] read failed', error);
      qs('#notesWall').replaceChildren(
        el('p', { class: 'empty', text: 'Could not load messages.' })
      );
    }
  );
}
