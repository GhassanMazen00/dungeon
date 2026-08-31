// Chat. One conversation, one persona, streaming, bilingual.

import { STORAGE, HISTORY_TURNS } from './config.js';
import { SYSTEM, OPENERS } from './persona.js';
import { streamReply, availableProviders, providerLabel, currentProvider } from './providers.js';
import { renderMarkdown } from './markdown.js';

const qs = (s) => document.querySelector(s);

/** Arabic, Persian and Hebrew blocks — enough to decide text direction. */
const RTL = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** True when a string is *mostly* RTL, so a stray English word doesn't flip it. */
function isRTL(text) {
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (!letters) return false;
  const rtl = (letters.match(new RegExp(RTL, 'gu')) ?? []).length;
  return rtl / letters.length > 0.35;
}

let messages = [];
let controller = null;
let busy = false;

let area;
let input;

/* ------------------------------------------------------------------ storage */

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.chat)) ?? [];
  } catch {
    return [];
  }
};

const save = () => {
  try {
    localStorage.setItem(STORAGE.chat, JSON.stringify(messages.slice(-HISTORY_TURNS * 2)));
  } catch {
    /* private mode — the session just won't persist */
  }
};

/* ---------------------------------------------------------------- rendering */

const atBottom = () => area.scrollHeight - area.scrollTop - area.clientHeight < 140;

const toBottom = () => {
  requestAnimationFrame(() => {
    area.scrollTop = area.scrollHeight;
  });
};

function bubbleFor(message) {
  const row = document.createElement('div');
  row.className = `msg msg--${message.role}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (isRTL(message.content)) {
    bubble.dir = 'rtl';
    bubble.classList.add('is-rtl');
  }

  if (message.role === 'assistant') bubble.innerHTML = renderMarkdown(message.content);
  else bubble.textContent = message.content;

  row.append(bubble);
  return row;
}

function renderEmpty() {
  const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)];
  area.replaceChildren();

  const intro = document.createElement('div');
  intro.className = 'intro';

  const eye = document.createElement('div');
  eye.className = 'intro__eye';
  eye.setAttribute('aria-hidden', 'true');
  eye.append(document.createElement('span'));

  const line = document.createElement('p');
  line.className = 'intro__line';
  line.textContent = opener;

  intro.append(eye, line);
  area.append(intro);
}

function render() {
  if (!messages.length) {
    renderEmpty();
    return;
  }
  area.replaceChildren(...messages.map(bubbleFor));
  toBottom();
}

/* ------------------------------------------------------------------ sending */

function setBusy(state) {
  busy = state;
  qs('#send').hidden = state;
  qs('#stop').hidden = !state;
}

function status(text, kind = '') {
  const node = qs('#status');
  node.textContent = text;
  node.classList.toggle('is-bad', kind === 'is-bad');
}

async function turn() {
  const row = document.createElement('div');
  row.className = 'msg msg--assistant';
  const bubble = document.createElement('div');
  bubble.className = 'bubble is-thinking';
  bubble.innerHTML = '<i></i><i></i><i></i>';
  row.append(bubble);
  area.append(row);
  toBottom();

  setBusy(true);
  controller = new AbortController();
  let first = true;

  try {
    const result = await streamReply({
      system: SYSTEM,
      messages: messages.slice(-HISTORY_TURNS),
      signal: controller.signal,
      onProvider: (id) => status(`switching to ${providerLabel(id)}…`),
      onToken: (_d, full) => {
        if (first) {
          first = false;
          bubble.classList.remove('is-thinking');
          if (isRTL(full)) {
            bubble.dir = 'rtl';
            bubble.classList.add('is-rtl');
          }
        }
        const stick = atBottom();
        bubble.innerHTML = renderMarkdown(full);
        if (stick) toBottom();
      }
    });

    messages.push({ role: 'assistant', content: result.text });
    save();
    render();
    status(`${providerLabel(result.provider)} · ${result.ttft}ms to first word`);
  } catch (error) {
    row.remove();
    if (error.name === 'AbortError') {
      status('stopped');
    } else {
      console.error(error);
      status('failed — tap for details', 'is-bad');

      const note = document.createElement('p');
      note.className = 'sys sys--bad';
      // The provider's own message is the only thing that makes this
      // debuggable from a phone, so show it verbatim.
      note.textContent =
        availableProviders().length === 0
          ? 'No API key configured. Tap the line under THE DOCTOR to add one.'
          : error.detail || error.message;
      area.append(note);

      const help = document.createElement('button');
      help.className = 'sys-action';
      help.type = 'button';
      help.textContent = 'connection check';
      help.addEventListener('click', () => document.getElementById('status').click());
      area.append(help);
      toBottom();
    }
  } finally {
    controller = null;
    setBusy(false);
  }
}

async function send() {
  if (busy) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.dir = 'auto';
  sizeInput();

  messages.push({ role: 'user', content: text });
  save();
  render();
  await turn();
}

export const stop = () => controller?.abort();

function clearChat() {
  messages = [];
  save();
  render();
  status('');
  input.dir = 'auto';
  input.focus();
}

/* ---------------------------------------------------------------- composer */

function sizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(140, input.scrollHeight)}px`;
}

/* --------------------------------------------------------------------- init */

export function initChat() {
  area = qs('#stream');
  input = qs('#input');

  messages = load();
  render();

  qs('#send').addEventListener('click', send);
  qs('#stop').addEventListener('click', stop);
  qs('#clear').addEventListener('click', clearChat);

  input.addEventListener('input', () => {
    sizeInput();
    // Let the field flip direction as the user types Arabic.
    input.dir = isRTL(input.value) ? 'rtl' : 'ltr';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !matchMedia('(max-width: 720px)').matches) {
      event.preventDefault();
      send();
    }
  });

  status(
    availableProviders().length
      ? `${providerLabel(currentProvider())} · ready`
      : 'no key configured'
  );

  if (!matchMedia('(max-width: 720px)').matches) input.focus();
}
