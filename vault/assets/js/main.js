// THE VAULT — chamber progression, answer checking, hints, claim.

import { CHAMBERS, CLAIM } from './chambers.js';
import { unseal, normalise } from './crypto.js';
import { TOOLS } from './tools.js';
import { initEmbers } from './embers.js';

const KEY = 'vault_progress_v1';
const HINT_GATES = [10, 30, 60]; // minutes on a chamber before each hint opens

const qs = (s) => document.querySelector(s);

/* ------------------------------------------------------------------- state */

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
};

const save = (s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private browsing — progress just won't survive a reload */
  }
};

let progress = load();
progress.keys ??= [];        // answers earned, in order
progress.arrived ??= {};     // chamber index -> first-seen timestamp
progress.opened ??= false;

let index = Math.min(progress.keys.length, CHAMBERS.length - 1);
let chamber = null;          // decrypted payload of the current chamber
let checking = false;

/* ---------------------------------------------------------------- unsealing */

/** Walks the chain from the start using stored keys. */
async function openTo(target) {
  let payload = { ...CHAMBERS[0] };
  for (let i = 1; i <= target; i++) {
    const key = progress.keys[i - 1];
    const next = key ? await unseal(CHAMBERS[i].sealed, key) : null;
    if (!next) return { index: i - 1, payload };
    payload = next;
  }
  return { index: target, payload };
}

/* ----------------------------------------------------------------- rendering */

function renderProgress() {
  qs('#track').replaceChildren(
    ...CHAMBERS.map((_, i) => {
      const node = document.createElement('span');
      node.className = 'track__pip';
      if (i < progress.keys.length) node.classList.add('is-done');
      if (i === index) node.classList.add('is-here');
      node.title = `Chamber ${CHAMBERS[i].roman ?? i + 1}`;
      return node;
    })
  );
  qs('#trackCount').textContent = `${progress.keys.length} / ${CHAMBERS.length}`;
}

function renderHints() {
  const host = qs('#hints');
  const since = progress.arrived[index];
  const minutes = since ? (Date.now() - since) / 60000 : 0;

  host.replaceChildren(
    ...chamber.hints.map((text, i) => {
      const open = minutes >= HINT_GATES[i];
      if (!open) {
        const wait = Math.ceil(HINT_GATES[i] - minutes);
        return Object.assign(document.createElement('div'), {
          className: 'hint is-locked',
          textContent: `hint ${i + 1} — opens after ${HINT_GATES[i]} minutes in this chamber (${wait} to go)`
        });
      }
      const d = document.createElement('details');
      d.className = 'hint';
      const s = document.createElement('summary');
      s.textContent = `hint ${i + 1}`;
      const p = document.createElement('p');
      p.textContent = text;
      d.append(s, p);
      return d;
    })
  );
}

function renderChamber() {
  progress.arrived[index] ??= Date.now();
  save(progress);

  qs('#roman').textContent = chamber.roman;
  qs('#ghost').textContent = chamber.roman;
  qs('#chamberName').textContent = chamber.name;
  qs('#brief').textContent = chamber.brief;
  qs('#aside').textContent = chamber.aside;

  const stage = qs('#stage');
  stage.replaceChildren();
  TOOLS[chamber.tool]?.(stage, chamber.data);

  qs('#answer').value = '';
  qs('#verdict').textContent = '';
  qs('#verdict').className = 'verdict';

  renderProgress();
  renderHints();
  qs('#vault').hidden = false;
  qs('#opened').hidden = true;
}

async function showClaim() {
  const payload = await unseal(CLAIM, progress.keys.at(-1));
  if (!payload) return;
  index = CHAMBERS.length;  // so the track reads a full 5 / 5, not 4 / 5
  renderProgress();
  qs('#vault').hidden = true;
  qs('#opened').hidden = false;
  qs('#claimTitle').textContent = payload.title;
  qs('#claimBody').textContent = payload.body;
  qs('#claimCode').textContent = payload.code;
  progress.opened = true;
  save(progress);
}

/* ------------------------------------------------------------------ answering */

async function submit() {
  if (checking) return;
  const raw = qs('#answer').value;
  if (!normalise(raw)) return;

  checking = true;
  const button = qs('#tryKey');
  button.disabled = true;
  const verdict = qs('#verdict');
  verdict.className = 'verdict is-working';
  verdict.textContent = 'turning…';

  // Last chamber unlocks the claim; the others unlock the next chamber.
  const sealed = index === CHAMBERS.length - 1 ? CLAIM : CHAMBERS[index + 1].sealed;
  const payload = await unseal(sealed, raw);

  if (!payload) {
    verdict.className = 'verdict is-bad';
    verdict.textContent = 'The mechanism does not move.';
    qs('#stage').classList.add('is-wrong');
    setTimeout(() => qs('#stage').classList.remove('is-wrong'), 420);
  } else {
    progress.keys[index] = normalise(raw);
    progress.keys.length = index + 1;
    save(progress);

    verdict.className = 'verdict is-good';
    verdict.textContent = 'It gives.';

    setTimeout(async () => {
      if (index === CHAMBERS.length - 1) {
        await showClaim();
      } else {
        index += 1;
        chamber = payload;
        renderChamber();
      }
    }, 700);
  }

  button.disabled = false;
  checking = false;
}

/* ----------------------------------------------------------------------- boot */

async function boot() {
  initEmbers(document.getElementById('embers'));

  const resumed = await openTo(index);
  index = resumed.index;
  chamber = resumed.payload;

  if (progress.opened && progress.keys.length === CHAMBERS.length) {
    renderProgress();
    await showClaim();
  } else {
    renderChamber();
  }

  qs('#tryKey').addEventListener('click', submit);
  qs('#answer').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });

  qs('#abandon').addEventListener('click', () => {
    if (!confirm('Erase your progress and start from the first chamber?')) return;
    localStorage.removeItem(KEY);
    location.reload();
  });

  // Hint countdowns tick without needing a reload.
  setInterval(() => {
    if (!qs('#vault').hidden && chamber) renderHints();
  }, 30000);
}

boot();
