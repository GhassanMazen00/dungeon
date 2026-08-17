// Authoring script for THE VAULT.
//
// Chamber N+1 is AES-GCM encrypted with the answer to chamber N, so the shipped
// page contains only ciphertext for every chamber the player has not reached.
// Run:  node tools/build-vault.mjs
// Emits: vault/assets/js/chambers.js
//
// Edit CHAMBERS below to change the puzzle, then re-run. Nothing else to touch.

import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const ITERATIONS = 250_000; // ~0.3s per guess in a browser — brute force is dead

/* ------------------------------------------------------------------- lattice */

const GLYPHS = {
  S: ['01110', '10001', '10000', '01110', '00001', '10001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100']
};

function buildLattice(word, givens) {
  const rows = [];
  for (let r = 0; r < 7; r++) {
    const line = [];
    [...word].forEach((ch, i) => {
      if (i) line.push(0);
      line.push(...GLYPHS[ch][r].split('').map(Number));
    });
    rows.push(line);
  }
  const runs = (line) => {
    const out = [];
    let n = 0;
    for (const v of line) {
      if (v) n++;
      else if (n) { out.push(n); n = 0; }
    }
    if (n) out.push(n);
    return out.length ? out : [0];
  };
  const width = rows[0].length;
  return {
    word,
    data: {
      width,
      height: rows.length,
      rowClues: rows.map(runs),
      colClues: Array.from({ length: width }, (_, c) => runs(rows.map((r) => r[c]))),
      givens,
      solution: rows.map((r) => r.join('')).join('|')
    }
  };
}

/* ------------------------------------------------------------------ content */

// Chamber III: verified solvable by pure deduction with these four givens.
const LATTICE = buildLattice('SALT', [[0, 0], [0, 6], [3, 1], [4, 0]]);

const CHAMBERS = [
  {
    roman: 'I',
    name: 'THE PLATE',
    tool: 'lamp',
    brief:
      'A photographic plate, exposed and never developed. Three words sleep in it, ' +
      'each in a different light. Only one of them is a stone.',
    aside: 'The first word you take will be the first letter you need.',
    data: { image: 'assets/img/plate.png' },
    // Chamber I ships in plaintext — it is the way in. Its hints must therefore
    // nudge without ever naming the answer, or the source would give it away.
    hints: [
      'The lamp has filters as well as a brightness window. A word that is invisible under one filter can be plain under another.',
      'Narrow the window until it is very tight, then sweep it slowly across the range. Three words, three different filters.',
      'You are looking for the one you could hold in your hand. The other two are things that happen to it.'
    ],
    answer: 'OBSIDIAN'
  },
  {
    roman: 'II',
    name: 'THE CHOIR',
    tool: 'choir',
    brief:
      'Sixteen voices. They belong to four families, four to a family — and every ' +
      'voice is carrying something smaller than itself. Sort them, learn what the ' +
      'four families are called, and read what their initials build.',
    aside: 'The second letter of this chamber\'s key is the one you want.',
    data: {
      words: [
        'MARCHED', 'SCOWL', 'GALILEO', 'NEONATE',
        'CRATE', 'MAYHEM', 'LIBRARY', 'ARGONAUT',
        'DOGMA', 'AUGUSTUS', 'VARIES', 'CARBONATE',
        'CATALOGUE', 'JUNEAU', 'CANCEROUS', 'SILICONE'
      ],
      groups: [
        { name: 'MONTHS', words: ['MARCHED', 'MAYHEM', 'AUGUSTUS', 'JUNEAU'] },
        { name: 'ANIMALS', words: ['SCOWL', 'CRATE', 'DOGMA', 'CATALOGUE'] },
        { name: 'ZODIAC', words: ['GALILEO', 'LIBRARY', 'VARIES', 'CANCEROUS'] },
        { name: 'ELEMENTS', words: ['NEONATE', 'ARGONAUT', 'CARBONATE', 'SILICONE'] }
      ]
    },
    hints: [
      'Each word contains a shorter word hidden inside it, spelled straight through. MARCHED hides MARCH.',
      'The four families are MONTHS, ANIMALS, ZODIAC and ELEMENTS.',
      'M, A, Z, E. Rearrange them into something you can get lost in.'
    ],
    answer: 'MAZE'
  },
  {
    roman: 'III',
    name: 'THE LATTICE',
    tool: 'lattice',
    brief:
      'A grid, and a set of counts down the side and across the top. Each count is ' +
      'a run of filled squares in that line, in order, with at least one gap between ' +
      'runs. Four squares have been filled for you. Finish it and it will spell what it is.',
    aside: 'Take the fourth letter of what the grid spells.',
    data: LATTICE.data,
    hints: [
      'Start with the longest counts. In a line of 7, a run of 7 fills the whole line; a run of 6 fills the middle 5 whichever way it slides.',
      'Mark squares you know are EMPTY as well as the filled ones — the empties are what break the remaining runs apart.',
      'It spells a four-letter word. It is something you put on food.'
    ],
    answer: 'SALT'
  },
  {
    roman: 'IV',
    name: 'THE LOCK',
    tool: 'lock',
    brief:
      'Five wheels, eight symbols, one arrangement. Set the wheels and pull; the ' +
      'lock will tell you how many are exactly right, and how many are right but ' +
      'in the wrong place. It will not tell you which.',
    aside: 'The first letter of the word behind this lock is the last one you need.',
    data: {
      // Deliberately no repeated symbol: keeps the deduction clean and fair.
      symbols: ['◆', '●', '▲', '■', '★', '✚', '☾', '☀'],
      secret: [4, 1, 6, 0, 3],
      reveal: 'HOLLOW'
    },
    hints: [
      'No symbol is used twice. That alone rules out most of the arrangements.',
      'A pull that scores zero is worth more than one that scores three — it eliminates five symbols at once.',
      'Change exactly one wheel between pulls and the score tells you about that wheel alone.'
    ],
    answer: 'HOLLOW'
  },
  {
    roman: 'V',
    name: 'THE DOOR',
    tool: 'door',
    brief:
      'Four keys opened four chambers. Each chamber told you which of its letters ' +
      'it was lending to the door. Take them in the order you earned them.',
    aside: 'Four letters. One word. The thing you swear.',
    data: { length: 4 },
    hints: [
      'Go back and re-read the small line under each chamber\'s riddle. Each one names a position.',
      'First letter of the first key, second of the second, fourth of the third, first of the fourth.',
      'O from OBSIDIAN, A from MAZE, T from SALT, H from HOLLOW.'
    ],
    answer: 'OATH'
  }
];

// Revealed only after the final answer. This is what a winner sends to claim.
const CLAIM = {
  title: 'THE VAULT IS OPEN',
  body:
    'You are through. Send the code below and the time on your screen — that code ' +
    'exists nowhere else, and nobody who has not stood here can produce it.',
  code: 'OATH-OF-THE-QUIET-LAMP-7731'
};

/* -------------------------------------------------------------------- crypto */

// Answers are compared and keyed on this form, so spacing, case and punctuation
// never cost anyone a correct solve.
const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const b64 = (buf) => Buffer.from(buf).toString('base64');

async function deriveKey(answer, salt) {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(normalise(answer)), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

async function seal(payload, answer) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(answer, salt);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload))
  );
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

/* --------------------------------------------------------------------- build */

const publicPart = (c) => ({
  roman: c.roman, name: c.name, tool: c.tool,
  brief: c.brief, aside: c.aside, data: c.data, hints: c.hints
});

const out = [];
for (let i = 0; i < CHAMBERS.length; i++) {
  if (i === 0) {
    out.push({ open: true, ...publicPart(CHAMBERS[0]) });
  } else {
    // Locked behind the PREVIOUS chamber's answer.
    out.push({ open: false, sealed: await seal(publicPart(CHAMBERS[i]), CHAMBERS[i - 1].answer) });
  }
}
const claim = await seal(CLAIM, CHAMBERS.at(-1).answer);

const file = `// GENERATED by tools/build-vault.mjs — do not edit by hand.
// Every chamber past the first is AES-GCM ciphertext. The key is the previous
// chamber's answer, stretched with ${ITERATIONS.toLocaleString('en-US')} rounds of PBKDF2.
// There is nothing to read here.

export const ITERATIONS = ${ITERATIONS};
export const CHAMBERS = ${JSON.stringify(out, null, 2)};
export const CLAIM = ${JSON.stringify(claim, null, 2)};
`;

writeFileSync('vault/assets/js/chambers.js', file);

console.log(`sealed ${out.length} chambers -> vault/assets/js/chambers.js`);
console.log('answers:', CHAMBERS.map((c) => `${c.roman}=${c.answer}`).join('  '));
console.log('final claim code:', CLAIM.code);
