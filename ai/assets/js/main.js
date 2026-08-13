// Entry point for the AI arcade: theme, model discovery, mode switching.

import { STORAGE } from './config.js';
import { discoverModels, setChain, current } from './openrouter.js';
import { initChat, focusChat } from './chat.js';
import { initDungeon } from './dungeon.js';
import { toggleSound, soundEnabled, sfx } from './sfx.js';
import { el, qs, qsa, toast } from '../../../assets/js/core/dom.js';
import { read } from '../../../assets/js/core/store.js';

/* --- Theme (shared with the main site) ------------------------------------ */

function initTheme() {
  const theme = read('gh_theme_v1', 'crimson');
  document.documentElement.dataset.theme = theme;
  document.body.dataset.motion = read('gh_motion_v1', 'on');
}

/* --- Status bar ----------------------------------------------------------- */

function setStatus({ model, ms, note } = {}) {
  if (model) {
    qs('#modelName').textContent = model.name || model.id;
    qs('#modelName').title = model.id;
    qs('#modelSelect').value = model.id;
  }
  if (ms !== undefined) qs('#statLatency').textContent = `${ms} ms`;
  qs('#statNote').textContent = note ?? '';
  qs('#connDot').dataset.state = model ? 'on' : 'off';
}

/* --- Modes ---------------------------------------------------------------- */

function setMode(mode) {
  qsa('[data-mode-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.modePanel !== mode;
  });
  qsa('[data-mode]').forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.body.dataset.mode = mode;
  if (mode === 'chat') focusChat();
  sfx.click();
}

/* --- Boot ----------------------------------------------------------------- */

async function connect() {
  setStatus({ note: 'finding a free model…' });

  const models = await discoverModels();
  const preferred = read(STORAGE.model, null);
  const model = setChain(models, preferred);

  qs('#modelSelect').replaceChildren(
    ...models.slice(0, 25).map((m) => el('option', { value: m.id, text: m.name }))
  );

  if (model) {
    setStatus({ model, note: '' });
    qs('#modelCount').textContent = `${models.length} free`;
  } else {
    setStatus({ note: 'no free models reachable' });
    toast('Could not reach OpenRouter. Try a refresh.', 'bad', 4000);
  }
}

function boot() {
  initTheme();

  initChat({ onStatusChange: setStatus });
  initDungeon({ onStatusChange: setStatus });

  qsa('[data-mode]').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
  document.addEventListener('arcade:mode', (event) => setMode(event.detail));

  const soundBtn = qs('#btnSound');
  soundBtn.classList.toggle('is-on', soundEnabled());
  soundBtn.addEventListener('click', () => {
    soundBtn.classList.toggle('is-on', toggleSound());
  });

  setMode('chat');
  connect();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
