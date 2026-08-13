// Command palette (⌘K / Ctrl+K). Any module can register a command.

import { el, qs, qsa, createModal } from '../core/dom.js';
import { unlock } from './achievements.js';

const commands = [];
let modal = null;
let input = null;
let list = null;
let filtered = [];
let cursor = 0;

/**
 * @param {{id:string,label:string,icon?:string,tag?:string,keywords?:string,run:Function}} cmd
 */
export function registerCommand(cmd) {
  commands.push(cmd);
}

export function registerCommands(cmds) {
  cmds.forEach(registerCommand);
}

function score(cmd, query) {
  if (!query) return 1;
  const haystack = `${cmd.label} ${cmd.tag ?? ''} ${cmd.keywords ?? ''}`.toLowerCase();
  const needle = query.toLowerCase();
  if (haystack.includes(needle)) return 3;
  // Loose subsequence match so "pxst" finds "Pixel Studio".
  let i = 0;
  for (const char of haystack) {
    if (char === needle[i]) i++;
    if (i === needle.length) return 1;
  }
  return 0;
}

function render() {
  const query = input.value.trim();
  filtered = commands
    .map((cmd) => ({ cmd, s: score(cmd, query) }))
    .filter((entry) => entry.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((entry) => entry.cmd);

  cursor = 0;

  if (!filtered.length) {
    list.replaceChildren(el('li', { class: 'palette__empty', text: 'Nothing matches that.' }));
    return;
  }

  list.replaceChildren(
    ...filtered.map((cmd, index) =>
      el(
        'li',
        {
          class: 'palette__item',
          role: 'option',
          'aria-selected': String(index === 0),
          dataset: { index: String(index) },
          onclick: () => execute(cmd)
        },
        el('span', { class: 'palette__item-icon', text: cmd.icon ?? '›' }),
        el('span', { text: cmd.label }),
        cmd.tag ? el('span', { class: 'palette__item-tag', text: cmd.tag }) : null
      )
    )
  );
}

function moveCursor(delta) {
  if (!filtered.length) return;
  cursor = (cursor + delta + filtered.length) % filtered.length;
  Array.from(list.children).forEach((node, index) => {
    node.setAttribute('aria-selected', String(index === cursor));
    if (index === cursor) node.scrollIntoView({ block: 'nearest' });
  });
}

function execute(cmd) {
  modal.close();
  // Let the overlay finish closing before the command moves the page.
  setTimeout(() => cmd.run(), 90);
}

export function openPalette() {
  modal.open();
  input.value = '';
  render();
  unlock('palette');
}

export function initPalette() {
  modal = createModal('palette');
  input = qs('#paletteInput');
  list = qs('#paletteList');
  if (!modal.root || !input || !list) return;

  input.addEventListener('input', render);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveCursor(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveCursor(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = filtered[cursor];
      if (cmd) execute(cmd);
    }
  });

  document.addEventListener('keydown', (event) => {
    const isToggle = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (!isToggle) return;
    event.preventDefault();
    if (modal.isOpen()) modal.close();
    else openPalette();
  });

  qsa('[data-open-palette]').forEach((btn) => btn.addEventListener('click', openPalette));
  render();
}
