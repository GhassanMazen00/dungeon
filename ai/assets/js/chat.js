// Chat mode: streaming replies, personas, slash commands, markdown, history.

import { STORAGE, CHAT_PARAMS, HISTORY_TURNS } from './config.js';
import { PERSONAS, DEFAULT_PERSONA, getPersona, STARTERS } from './personas.js';
import { streamChat, current, getChain, pinModel } from './openrouter.js';
import { renderMarkdown, bindCodeCopy } from './markdown.js';
import { sfx } from './sfx.js';
import { el, qs, toast, createModal } from '../../../assets/js/core/dom.js';
import { read, write } from '../../../assets/js/core/store.js';

let personaId = read(STORAGE.persona, DEFAULT_PERSONA);
let messages = read(STORAGE.chat, []);
let controller = null;
let busy = false;

let msgArea;
let input;
let personaModal;
let onStatus = () => {};

/* --- Persistence ---------------------------------------------------------- */

const save = () => write(STORAGE.chat, messages.slice(-HISTORY_TURNS * 2));

/** System prompt + a rolling window of turns. */
function buildPayload() {
  const persona = getPersona(personaId);
  return [
    { role: 'system', content: persona.prompt },
    ...messages.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content }))
  ];
}

/* --- Rendering ------------------------------------------------------------ */

function avatarFor(role) {
  const persona = getPersona(personaId);
  return el('div', {
    class: `msg__avatar msg__avatar--${role}`,
    text: role === 'user' ? 'YOU' : persona.emoji
  });
}

function renderEmpty() {
  const persona = getPersona(personaId);
  msgArea.replaceChildren(
    el(
      'div',
      { class: 'empty-state' },
      el('div', { class: 'empty-state__mark', text: persona.emoji }),
      el('h2', { class: 'empty-state__title', text: persona.name }),
      el('p', { class: 'empty-state__sub', text: persona.tagline }),
      el(
        'div',
        { class: 'starters' },
        ...STARTERS.map((text) =>
          el('button', {
            class: 'chip starter',
            type: 'button',
            text,
            onclick: () => {
              input.value = text;
              send();
            }
          })
        )
      ),
      el('p', {
        class: 'empty-state__hint',
        html: 'Type <code>/help</code> for commands · <code>/persona</code> to change who you are talking to'
      })
    )
  );
}

function messageNode(message, index) {
  const bubble = el('div', { class: 'msg__bubble' });

  if (message.role === 'assistant') {
    bubble.innerHTML = renderMarkdown(message.content);
    bindCodeCopy(bubble);
  } else {
    bubble.textContent = message.content;
  }

  const actions = el(
    'div',
    { class: 'msg__actions' },
    el('button', {
      class: 'msg__action',
      type: 'button',
      text: 'copy',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(message.content);
          toast('Copied.', 'ok', 1200);
        } catch {
          toast('Clipboard blocked.', 'bad');
        }
      }
    }),
    message.role === 'assistant' && index === messages.length - 1
      ? el('button', { class: 'msg__action', type: 'button', text: 'retry', onclick: regenerate })
      : null
  );

  return el(
    'div',
    { class: `msg msg--${message.role}` },
    avatarFor(message.role),
    el('div', { class: 'msg__body' }, bubble, actions)
  );
}

function render() {
  if (!messages.length) {
    renderEmpty();
    return;
  }
  msgArea.replaceChildren(...messages.map(messageNode));
  scrollDown();
}

const scrollDown = () => {
  requestAnimationFrame(() => {
    msgArea.scrollTop = msgArea.scrollHeight;
  });
};

const nearBottom = () => msgArea.scrollHeight - msgArea.scrollTop - msgArea.clientHeight < 120;

/* --- Slash commands ------------------------------------------------------- */

function systemLine(html) {
  msgArea.append(el('div', { class: 'sys-line', html }));
  scrollDown();
}

function handleCommand(raw) {
  const [cmd, ...rest] = raw.slice(1).trim().split(/\s+/);
  const arg = rest.join(' ').toLowerCase();

  switch (cmd.toLowerCase()) {
    case 'help':
      systemLine(
        '<strong>commands</strong><br>' +
          '<code>/persona</code> — open the persona picker<br>' +
          `<code>/persona &lt;name&gt;</code> — ${PERSONAS.map((p) => p.id).join(', ')}<br>` +
          '<code>/dungeon</code> — enter the dungeon<br>' +
          '<code>/model</code> — which free model is running<br>' +
          '<code>/models</code> — list available free models<br>' +
          '<code>/clear</code> — wipe the conversation'
      );
      return true;

    case 'persona': {
      if (!arg) {
        personaModal.open();
        return true;
      }
      const found = PERSONAS.find((p) => p.id === arg || p.name.toLowerCase() === arg);
      if (!found) {
        systemLine(`no persona called <code>${arg}</code>. try <code>/persona</code>`);
        return true;
      }
      setPersona(found.id);
      return true;
    }

    case 'model': {
      const model = current();
      systemLine(model ? `running <code>${model.id}</code> — free tier` : 'no model connected');
      return true;
    }

    case 'models': {
      const chain = getChain();
      systemLine(
        chain.length
          ? `<strong>free models in the chain</strong><br>${chain
              .map((m, i) => `${i === 0 ? '▸' : '·'} <code>${m.id}</code>`)
              .join('<br>')}`
          : 'no models discovered yet'
      );
      return true;
    }

    case 'clear':
      clearChat();
      return true;

    case 'dungeon':
      document.dispatchEvent(new CustomEvent('arcade:mode', { detail: 'dungeon' }));
      return true;

    default:
      systemLine(`unknown command <code>/${cmd}</code> — try <code>/help</code>`);
      return true;
  }
}

/* --- Sending -------------------------------------------------------------- */

function setBusy(state) {
  busy = state;
  qs('#btnSend').hidden = state;
  qs('#btnStop').hidden = !state;
  input.disabled = false;
}

async function stream(intoBubble) {
  const started = performance.now();
  controller = new AbortController();
  let firstToken = true;

  try {
    const result = await streamChat({
      messages: buildPayload(),
      params: CHAT_PARAMS,
      signal: controller.signal,
      onModelChange: (model) => onStatus({ model, note: 'switching model…' }),
      onToken: (_delta, full) => {
        if (firstToken) {
          firstToken = false;
          intoBubble.classList.remove('is-thinking');
          sfx.receive();
        }
        const stick = nearBottom();
        intoBubble.innerHTML = renderMarkdown(full);
        if (stick) scrollDown();
      }
    });

    intoBubble.innerHTML = renderMarkdown(result.text);
    bindCodeCopy(intoBubble);
    onStatus({ model: result.model, ms: Math.round(performance.now() - started) });
    return result.text;
  } finally {
    controller = null;
  }
}

async function runTurn() {
  const row = el(
    'div',
    { class: 'msg msg--assistant' },
    avatarFor('assistant'),
    el(
      'div',
      { class: 'msg__body' },
      el('div', { class: 'msg__bubble is-thinking', html: '<span></span><span></span><span></span>' })
    )
  );
  msgArea.append(row);
  scrollDown();

  const bubble = row.querySelector('.msg__bubble');
  setBusy(true);

  try {
    const text = await stream(bubble);
    messages.push({ role: 'assistant', content: text });
    save();
    render();
  } catch (error) {
    row.remove();
    if (error.name === 'AbortError') {
      systemLine('stopped.');
    } else {
      console.error('[chat]', error);
      systemLine(`<span class="sys-line--bad">${error.message}</span>`);
      sfx.bad();
    }
  } finally {
    setBusy(false);
    input.focus();
  }
}

async function send() {
  if (busy) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  autosize();

  if (text.startsWith('/')) {
    if (!messages.length) msgArea.replaceChildren();
    handleCommand(text);
    return;
  }

  sfx.send();
  messages.push({ role: 'user', content: text });
  save();
  render();
  await runTurn();
}

async function regenerate() {
  if (busy || !messages.length) return;
  if (messages[messages.length - 1].role === 'assistant') messages.pop();
  save();
  render();
  await runTurn();
}

export function stop() {
  controller?.abort();
}

function clearChat() {
  messages = [];
  save();
  render();
  toast('Conversation cleared.', 'info', 1400);
}

/* --- Personas ------------------------------------------------------------- */

function setPersona(id) {
  personaId = id;
  write(STORAGE.persona, id);
  const persona = getPersona(id);

  qs('#personaEmoji').textContent = persona.emoji;
  qs('#personaName').textContent = persona.name;

  document
    .querySelectorAll('.persona-card')
    .forEach((card) => card.classList.toggle('is-active', card.dataset.persona === id));

  if (messages.length) systemLine(`now speaking to <strong>${persona.name}</strong> — ${persona.tagline}`);
  else render();

  personaModal?.close();
  sfx.click();
}

function buildPersonaPicker() {
  qs('#personaGrid').replaceChildren(
    ...PERSONAS.map((persona) =>
      el(
        'button',
        {
          class: `persona-card${persona.id === personaId ? ' is-active' : ''}`,
          type: 'button',
          dataset: { persona: persona.id },
          onclick: () => setPersona(persona.id)
        },
        el('span', { class: 'persona-card__emoji', text: persona.emoji }),
        el('span', { class: 'persona-card__name', text: persona.name }),
        el('span', { class: 'persona-card__tag', text: persona.tagline })
      )
    )
  );
}

/* --- Composer ------------------------------------------------------------- */

function autosize() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(160, input.scrollHeight)}px`;
}

/* --- Init ----------------------------------------------------------------- */

export function initChat({ onStatusChange }) {
  msgArea = qs('#msgArea');
  input = qs('#chatInput');
  onStatus = onStatusChange ?? (() => {});
  personaModal = createModal('personaModal');

  buildPersonaPicker();
  setPersona(personaId);

  qs('#btnSend').addEventListener('click', send);
  qs('#btnStop').addEventListener('click', stop);
  qs('#btnNewChat').addEventListener('click', clearChat);
  qs('#personaBtn').addEventListener('click', () => personaModal.open());

  qs('#modelSelect').addEventListener('change', (event) => {
    const model = pinModel(event.target.value);
    onStatus({ model, note: 'pinned' });
    toast(`Model pinned: ${model.name}`, 'info', 1600);
  });

  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });

  render();
}

export const focusChat = () => input?.focus();
