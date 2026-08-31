// Connection panel.
//
// Exists because a failing API call on a static page is otherwise invisible:
// the browser console is not reachable on a phone, and "it doesn't work" is not
// something anyone can debug. This shows what every provider actually returned,
// verbatim, and lets a key be pasted in without editing or committing code.

import { PROVIDERS, PROVIDER_ORDER } from './config.js';
import { probeAll } from './providers.js';

const qs = (s) => document.querySelector(s);

const KEYS = 'ai_keys';

const readKeys = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS) ?? '{}');
  } catch {
    return {};
  }
};

function saveKey(id, key) {
  const keys = readKeys();
  if (key.trim()) keys[id] = key.trim();
  else delete keys[id];
  localStorage.setItem(KEYS, JSON.stringify(keys));
}

function row(result) {
  const li = document.createElement('li');
  li.className = `diag__row ${result.ok ? 'is-ok' : 'is-bad'}`;

  const head = document.createElement('div');
  head.className = 'diag__head';
  head.textContent = `${result.ok ? '✓' : '✕'} ${PROVIDERS[result.id]?.label ?? result.id}`;

  const model = document.createElement('div');
  model.className = 'diag__model';
  model.textContent = result.model;

  const note = document.createElement('div');
  note.className = 'diag__note';
  note.textContent = result.note;

  li.append(head, model, note);
  return li;
}

export function initDiag() {
  const panel = qs('#diag');
  const list = qs('#diagList');
  const input = qs('#diagKey');

  const open = () => {
    panel.hidden = false;
    input.value = readKeys().gemini ?? '';
  };
  const close = () => {
    panel.hidden = true;
  };

  qs('#status').addEventListener('click', open);
  qs('#diagClose').addEventListener('click', close);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });

  qs('#diagSave').addEventListener('click', () => {
    saveKey('gemini', input.value);
    location.reload();
  });

  qs('#diagRun').addEventListener('click', async () => {
    const button = qs('#diagRun');
    button.disabled = true;
    button.textContent = 'checking…';
    list.replaceChildren();

    // Stream results in as they land — a full sweep can take a few seconds.
    await probeAll((result) => list.append(row(result)));

    button.disabled = false;
    button.textContent = 'check again';

    if (!list.children.length) {
      const li = document.createElement('li');
      li.className = 'diag__row is-bad';
      li.textContent = 'No providers configured.';
      list.append(li);
    }
  });

  // Summary line so the panel is useful before running anything.
  qs('#diagKeys').textContent = PROVIDER_ORDER.map(
    (id) => `${PROVIDERS[id].label}: ${PROVIDERS[id].key?.trim() ? 'key set' : 'no key'}`
  ).join('  ·  ');
}
