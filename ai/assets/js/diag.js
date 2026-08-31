// Connection panel.
//
// Exists because a failing API call on a static page is otherwise invisible:
// the browser console is not reachable on a phone, and "it doesn't work" is not
// something anyone can debug. This shows what every provider actually returned,
// verbatim. It asks nothing of the visitor — the page ships ready to use.

import { PROVIDERS, PROVIDER_ORDER, keyShapeWarning } from './config.js';
import { probeAll, availableProviders } from './providers.js';

const qs = (s) => document.querySelector(s);

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

  const open = () => {
    panel.hidden = false;
  };
  const close = () => {
    panel.hidden = true;
  };

  qs('#status').addEventListener('click', open);
  qs('#diagClose').addEventListener('click', close);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
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
  const usable = new Set(availableProviders());
  qs('#diagKeys').textContent = PROVIDER_ORDER.map((id) => {
    const has = PROVIDERS[id].key?.trim();
    const state = !has ? 'no key' : usable.has(id) ? 'in use' : 'key skipped';
    return `${PROVIDERS[id].label}: ${state}`;
  }).join('  ·  ');

  // A wrong-shaped key is the likeliest cause of a blanket 401, so say so
  // before anyone spends time running the check.
  const warnings = PROVIDER_ORDER
    .map((id) => [PROVIDERS[id].label, keyShapeWarning(id)])
    .filter(([, w]) => w);

  const host = qs('#diagWarn');
  host.replaceChildren();
  host.hidden = warnings.length === 0;
  for (const [label, text] of warnings) {
    const p = document.createElement('p');
    p.className = 'diag__warn';
    p.textContent = `${label}: ${text}`;
    host.append(p);
  }
}
