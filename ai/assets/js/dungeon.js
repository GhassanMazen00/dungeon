// Dungeon mode: an AI dungeon master with real state.
//
// The model is asked for a strict JSON object each turn. Everything it returns
// is treated as untrusted: parsed defensively, clamped, and degraded to plain
// narration if the JSON is malformed — a bad turn never breaks the run.

import { STORAGE, DUNGEON_PARAMS } from './config.js';
import { completeJSON, extractJSON, current } from './openrouter.js';
import { sfx } from './sfx.js';
import { el, qs, toast, prefersReducedMotion } from '../../../assets/js/core/dom.js';
import { read, write, remove } from '../../../assets/js/core/store.js';

const MAX_HP = 100;
const CONTEXT_TURNS = 8;

export const CLASSES = [
  { id: 'knight', name: 'Knight', emoji: '🛡️', blurb: 'Heavy armour, light reading.' },
  { id: 'thief', name: 'Thief', emoji: '🗝️', blurb: 'Owns nothing. Has everything.' },
  { id: 'wizard', name: 'Wizard', emoji: '🔮', blurb: 'Knows four spells. Three are cosmetic.' },
  { id: 'intern', name: 'Intern', emoji: '📎', blurb: 'Unpaid. Unarmed. Unbothered.' }
];

const LOADING_LINES = [
  'the dungeon considers you…',
  'something shuffles in the dark…',
  'rolling dice you cannot see…',
  'the walls are deciding…',
  'consulting the bestiary…',
  'a door unlocks somewhere…'
];

function systemPrompt(hero) {
  return `You are the Dungeon Master of an absurd, funny, slightly grim text dungeon.
The player is "${hero.name}", a ${hero.class.name}. ${hero.class.blurb}

STYLE
- Second person, present tense. Dry, deadpan comedy. Dark but never gross or cruel.
- Scenes are 2-4 short sentences. Concrete and specific, never vague fantasy filler.
- Consequences are real: bad choices hurt, clever choices pay off, silly choices get
  rewarded with something strange.
- Nothing sexual, no slurs, no real people.

RULES
- Always offer exactly 3 choices. Make them genuinely different, and make at least one funny.
- Damage is between 0 and 35. Healing is negative damage. Gold between -20 and 40.
- Only award an item when it is earned. Items are short, e.g. "rusty key", "cursed spoon".
- Set status to "dead" only when the player's actions truly kill them.
- Set status to "win" only after a long run with a real climax (20+ turns).

OUTPUT
Reply with ONE JSON object and NOTHING else. No prose, no code fences.
{
  "location": "short place name",
  "scene": "2-4 sentences of narration",
  "choices": ["option one", "option two", "option three"],
  "hp": 0,
  "gold": 0,
  "item": null,
  "lose_item": null,
  "status": "continue"
}`;
}

/* --- State ---------------------------------------------------------------- */

const blankRun = () => ({
  hero: null,
  hp: MAX_HP,
  gold: 0,
  inventory: [],
  turn: 0,
  location: 'The Threshold',
  scene: '',
  choices: [],
  status: 'idle',
  transcript: []
});

let run = read(STORAGE.run, null) ?? blankRun();
let busy = false;
let onStatus = () => {};

const persist = () => write(STORAGE.run, run);

/* --- Turn parsing --------------------------------------------------------- */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toInt = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

const cleanItem = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === 'null' || trimmed === 'none' || trimmed.length > 40) return null;
  return trimmed;
};

/** Normalises whatever the model returned into a turn we can trust. */
function normaliseTurn(raw, fallbackText) {
  if (!raw || typeof raw !== 'object') {
    return {
      location: run.location,
      scene: fallbackText.slice(0, 600),
      choices: ['Press on', 'Look around', 'Reconsider your life'],
      hp: 0,
      gold: 0,
      item: null,
      lose_item: null,
      status: 'continue'
    };
  }

  let choices = Array.isArray(raw.choices)
    ? raw.choices.filter((c) => typeof c === 'string' && c.trim()).map((c) => c.trim().slice(0, 120))
    : [];
  if (choices.length < 2) choices = [...choices, 'Press on', 'Look around'].slice(0, 3);
  choices = choices.slice(0, 3);

  const status = ['continue', 'dead', 'win'].includes(raw.status) ? raw.status : 'continue';

  return {
    location: typeof raw.location === 'string' ? raw.location.trim().slice(0, 60) : run.location,
    scene: typeof raw.scene === 'string' ? raw.scene.trim().slice(0, 900) : fallbackText.slice(0, 600),
    choices,
    hp: clamp(toInt(raw.hp), -60, 40),
    gold: clamp(toInt(raw.gold), -50, 80),
    item: cleanItem(raw.item),
    lose_item: cleanItem(raw.lose_item),
    status
  };
}

/* --- Rendering ------------------------------------------------------------ */

function renderHUD() {
  const pct = clamp((run.hp / MAX_HP) * 100, 0, 100);
  const bar = qs('#hpFill');
  bar.style.width = `${pct}%`;
  bar.dataset.level = pct > 60 ? 'high' : pct > 25 ? 'mid' : 'low';

  qs('#hpText').textContent = `${Math.max(0, run.hp)} / ${MAX_HP}`;
  qs('#goldText').textContent = String(run.gold);
  qs('#turnText').textContent = String(run.turn);
  qs('#locText').textContent = run.location;

  const bag = qs('#bag');
  bag.replaceChildren(
    ...(run.inventory.length
      ? run.inventory.map((item) => el('span', { class: 'chip bag__item', text: item }))
      : [el('span', { class: 'bag__empty', text: 'empty' })])
  );
}

function typeInto(node, text) {
  if (prefersReducedMotion()) {
    node.textContent = text;
    return;
  }
  node.textContent = '';
  let i = 0;
  const step = () => {
    // A few characters per frame keeps long scenes from dragging.
    i += 2;
    node.textContent = text.slice(0, i);
    qs('#dungeonScroll').scrollTop = qs('#dungeonScroll').scrollHeight;
    if (i < text.length) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function pushEntry(turn, { effects = [] } = {}) {
  const feed = qs('#dungeonFeed');

  const body = el('p', { class: 'scene__text' });
  const entry = el(
    'article',
    { class: 'scene' },
    el(
      'header',
      { class: 'scene__head' },
      el('span', { class: 'scene__loc', text: turn.location }),
      el('span', { class: 'scene__turn', text: `turn ${run.turn}` })
    ),
    body,
    effects.length
      ? el('div', { class: 'scene__effects' }, ...effects.map((e) => el('span', { class: `fx fx--${e.kind}`, text: e.text })))
      : null
  );

  feed.append(entry);
  typeInto(body, turn.scene);
  qs('#dungeonScroll').scrollTop = qs('#dungeonScroll').scrollHeight;
}

function renderChoices() {
  const host = qs('#choices');

  // When the run is over the end overlay sits on top of this area, so the
  // restart button lives there instead (see showEnd).
  if (run.status === 'dead' || run.status === 'win') {
    host.replaceChildren();
    return;
  }

  host.replaceChildren(
    ...run.choices.map((choice, i) =>
      el(
        'button',
        { class: 'choice', type: 'button', disabled: busy, onclick: () => act(choice) },
        el('span', { class: 'choice__key', text: String(i + 1) }),
        el('span', { class: 'choice__text', text: choice })
      )
    )
  );
}

function setBusy(state) {
  busy = state;
  qs('#freeAction').disabled = state;
  qs('#btnFreeGo').disabled = state;
  qs('#dungeonLoader').hidden = !state;
  if (state) {
    qs('#dungeonLoader span').textContent =
      LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)];
  }
  renderChoices();
}

function showEnd() {
  const dead = run.status === 'dead';
  qs('#dungeonEnd').hidden = false;
  qs('#dungeonEnd').dataset.kind = dead ? 'dead' : 'win';
  qs('#endTitle').textContent = dead ? 'YOU DIED' : 'YOU MADE IT OUT';
  qs('#endLine').textContent = dead
    ? `${run.hero.name} the ${run.hero.class.name} — ${run.turn} turns, ${run.gold} gold, zero dignity.`
    : `${run.hero.name} the ${run.hero.class.name} escaped with ${run.gold} gold after ${run.turn} turns.`;

  qs('#endActions').replaceChildren(
    el('button', {
      class: 'btn btn--primary',
      type: 'button',
      text: dead ? 'Try again, coward' : 'Descend again',
      onclick: reset
    })
  );

  if (dead) sfx.death();
  else sfx.good();
}

/* --- Turn loop ------------------------------------------------------------ */

function buildMessages(action) {
  const window = run.transcript.slice(-CONTEXT_TURNS * 2);
  return [
    { role: 'system', content: systemPrompt(run.hero) },
    ...window,
    { role: 'user', content: action }
  ];
}

async function takeTurn(action) {
  if (busy) return;
  setBusy(true);

  try {
    const { text } = await completeJSON({
      messages: buildMessages(action),
      params: DUNGEON_PARAMS,
      onModelChange: (model) => onStatus({ model, note: 'switching model…' })
    });

    const turn = normaliseTurn(extractJSON(text), text);

    run.turn += 1;
    run.location = turn.location;
    run.scene = turn.scene;
    run.choices = turn.choices;

    const effects = [];

    if (turn.hp) {
      run.hp = clamp(run.hp - turn.hp, 0, MAX_HP);
      if (turn.hp > 0) {
        effects.push({ kind: 'hurt', text: `−${turn.hp} HP` });
        sfx.hurt();
      } else {
        effects.push({ kind: 'heal', text: `+${Math.abs(turn.hp)} HP` });
      }
    }

    if (turn.gold) {
      run.gold = Math.max(0, run.gold + turn.gold);
      effects.push({
        kind: turn.gold > 0 ? 'loot' : 'hurt',
        text: `${turn.gold > 0 ? '+' : ''}${turn.gold} gold`
      });
      if (turn.gold > 0) sfx.loot();
    }

    if (turn.item && !run.inventory.includes(turn.item)) {
      run.inventory = [...run.inventory, turn.item].slice(-12);
      effects.push({ kind: 'loot', text: `got ${turn.item}` });
      sfx.loot();
    }

    if (turn.lose_item) {
      run.inventory = run.inventory.filter((i) => i !== turn.lose_item);
      effects.push({ kind: 'hurt', text: `lost ${turn.lose_item}` });
    }

    run.status = run.hp <= 0 ? 'dead' : turn.status;

    // Keep a compact transcript so the DM remembers the run without blowing up tokens.
    run.transcript.push(
      { role: 'user', content: action },
      {
        role: 'assistant',
        content: JSON.stringify({
          location: turn.location,
          scene: turn.scene,
          choices: turn.choices,
          status: run.status
        })
      }
    );
    run.transcript = run.transcript.slice(-CONTEXT_TURNS * 2);

    pushEntry(turn, { effects });
    renderHUD();
    persist();

    if (run.status !== 'continue') showEnd();
  } catch (error) {
    console.error('[dungeon]', error);
    qs('#dungeonFeed').append(
      el('p', { class: 'sys-line sys-line--bad', text: `The dungeon master lost their voice: ${error.message}` })
    );
    sfx.bad();
  } finally {
    setBusy(false);
  }
}

function act(choice) {
  qs('#dungeonFeed').append(el('p', { class: 'action-echo', text: `› ${choice}` }));
  sfx.click();
  takeTurn(choice);
}

/* --- Lifecycle ------------------------------------------------------------ */

function reset() {
  remove(STORAGE.run);
  run = blankRun();
  qs('#dungeonEnd').hidden = true;
  qs('#dungeonFeed').replaceChildren();
  qs('#dungeonSetup').hidden = false;
  qs('#dungeonPlay').hidden = true;
}

function begin(heroName, klass) {
  run = blankRun();
  run.hero = { name: heroName || 'Nobody', class: klass };
  run.status = 'continue';
  persist();

  qs('#dungeonSetup').hidden = true;
  qs('#dungeonPlay').hidden = false;
  qs('#dungeonEnd').hidden = true;
  qs('#dungeonFeed').replaceChildren();
  qs('#heroTag').textContent = `${klass.emoji} ${run.hero.name} the ${klass.name}`;
  renderHUD();

  takeTurn(
    `Begin the run. ${run.hero.name} the ${klass.name} steps through the dungeon door for the first time. ` +
      `Open with the first room and three choices.`
  );
}

function restoreRun() {
  if (!run.hero || run.status === 'idle') return false;

  qs('#dungeonSetup').hidden = true;
  qs('#dungeonPlay').hidden = false;
  qs('#heroTag').textContent = `${run.hero.class.emoji} ${run.hero.name} the ${run.hero.class.name}`;
  renderHUD();

  qs('#dungeonFeed').replaceChildren(
    el('p', { class: 'sys-line', text: 'resuming your run…' })
  );
  if (run.scene) {
    pushEntry({ location: run.location, scene: run.scene, choices: run.choices });
  }
  if (run.status !== 'continue') showEnd();
  else renderChoices();

  return true;
}

export function initDungeon({ onStatusChange }) {
  onStatus = onStatusChange ?? (() => {});

  let picked = CLASSES[0];

  qs('#classGrid').replaceChildren(
    ...CLASSES.map((klass) =>
      el(
        'button',
        {
          class: `class-card${klass.id === picked.id ? ' is-active' : ''}`,
          type: 'button',
          onclick: (event) => {
            picked = klass;
            document
              .querySelectorAll('.class-card')
              .forEach((c) => c.classList.remove('is-active'));
            event.currentTarget.classList.add('is-active');
            sfx.click();
          }
        },
        el('span', { class: 'class-card__emoji', text: klass.emoji }),
        el('span', { class: 'class-card__name', text: klass.name }),
        el('span', { class: 'class-card__blurb', text: klass.blurb })
      )
    )
  );

  qs('#btnBegin').addEventListener('click', () => {
    if (!current()) {
      toast('Still finding a free model — one second.', 'info');
      return;
    }
    begin(qs('#heroName').value.trim(), picked);
  });

  qs('#heroName').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') qs('#btnBegin').click();
  });

  qs('#btnAbandon').addEventListener('click', () => {
    if (confirm('Abandon this run? Your gold dies with you.')) reset();
  });

  const freeGo = () => {
    const text = qs('#freeAction').value.trim();
    if (!text || busy || run.status !== 'continue') return;
    qs('#freeAction').value = '';
    act(text);
  };

  qs('#btnFreeGo').addEventListener('click', freeGo);
  qs('#freeAction').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') freeGo();
  });

  // Number keys pick a choice, as long as you are not typing.
  document.addEventListener('keydown', (event) => {
    if (qs('#dungeonPanel').hidden || busy) return;
    if (event.target.matches('input, textarea')) return;
    const n = Number(event.key);
    if (n >= 1 && n <= run.choices.length && run.status === 'continue') {
      act(run.choices[n - 1]);
    }
  });

  restoreRun();
}
