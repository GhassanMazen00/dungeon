# abomazen.com

Personal site of Ghassan Mazen. Static — no build step, no dependencies to install.
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## The photo

Two images are in `assets/img/`:

| File | Size | Used for |
| --- | --- | --- |
| `ghassan.jpg` | 900×900, ~67 KB | The hero portrait |
| `og-cover.jpg` | 1200×630, ~50 KB | Link previews (Open Graph / Twitter cards) |

To swap the portrait, overwrite `ghassan.jpg` with another square image — the
hero picks it up with no code changes. A square crop works best (the frame is
1:1) and anything around 900×900 is plenty; keep it under ~150 KB so the page
stays fast. If the file is ever missing the hero falls back to the pixel
avatar, so the site never shows a broken image.

To point at a different filename or a hosted URL instead, edit `PROFILE.photo`
in `assets/js/data/site.js`. If you change the portrait, regenerate
`og-cover.jpg` too, or link previews will still show the old shot.

## Structure

```
index.html              markup only — all behaviour lives in modules
ai/index.html           the AI arcade (chat + dungeon) — see below
assets/
  css/
    tokens.css          colours, type scale, spacing, accent themes
    base.css            reset, typography, layout primitives, utilities
    components.css      nav, buttons, panels, modal, palette, toasts, forms
    sections.css        hero, about, socials, studio, oracle, crew, guestbook
  js/
    config.js           Firebase config, storage keys, section + theme registry
    main.js             entry point; boots features, registers palette commands
    data/
      site.js           profile, socials, crew, hero dialogue  ← edit content here
      fortunes.js       334 fortunes
    core/
      dom.js            DOM helpers, toasts, modal factory, time formatting
      store.js          safe localStorage wrapper
      icons.js          inline SVG icon set (replaces the Font Awesome CDN)
      db.js             Firebase facade
    features/
      nav.js            nav, drawer, scroll-spy, progress, reveal, panels
      palette.js        ⌘K command palette
      theme.js          accent themes, reduced motion, CRT mode
      background.js     canvas particle field (replaces particles.js)
      hero.js           typewriter, portrait flip, speech bubble
      content.js        renders about / socials / crew from data
      studio.js         pixel editor
      oracle.js         fortune draws, favourites, share
      guestbook.js      Firebase-backed messages
      admin.js          admin gate + art gallery
      achievements.js   local progress tracker
      eggs.js           Konami code, the 18+ prank
  img/                  put ghassan.jpg here
```

## The AI arcade (`/ai`)

Two modes, both running on OpenRouter's **free** models only.

```
ai/index.html
ai/assets/
  css/ai.css            app shell, chat, dungeon (reuses the site's tokens)
  js/
    config.js           key, model ranking, tunables
    openrouter.js       free-model discovery, SSE streaming, failover
    personas.js         the 11 personalities  ← edit voices here
    markdown.js         escape-first markdown renderer
    chat.js             chat mode
    dungeon.js          dungeon mode
    sfx.js              WebAudio blips
    main.js             boot + mode switching
```

**Chat** streams replies token by token, renders markdown and code blocks, keeps
history in localStorage, and has 11 personas (pirate, therapist, villain,
Gen Z, noir detective, medieval peasant…). Slash commands: `/help`, `/persona`,
`/models`, `/model`, `/dungeon`, `/clear`.

**Dungeon** is an AI dungeon master with real state — HP, gold, inventory, turn
count — that persists across refreshes. The model returns a strict JSON object
each turn; every field is clamped and validated, and a malformed reply degrades
to plain narration instead of breaking the run. Pick one of three choices
(or press `1`/`2`/`3`), or type any action you like.

### Staying free

`openrouter.js` fetches the live model catalogue on load and keeps only models
priced at zero, so the list can never drift onto a paid model as OpenRouter's
lineup changes. Models are ranked by family, reasoning models are demoted
(their `<think>` blocks ruin the timing of a joke), and the top eight become a
failover chain — a rate-limited model automatically hands off to the next.
`FALLBACK_FREE_MODELS` in `config.js` covers the case where the catalogue itself
is unreachable.

## The Vault (`/vault`)

A standalone five-chamber puzzle with a prize on it. Self-contained — it shares
nothing with the rest of the site and needs no coding, tooling or outside
knowledge to solve. Each chamber lends the player whatever apparatus it needs.

| # | Chamber | Faculty | Apparatus |
| --- | --- | --- | --- |
| I | The Plate | observation | a lamp with colour filters and a brightness window |
| II | The Choir | lateral wordplay | a sorting board |
| III | The Lattice | pure deduction | a nonogram grid |
| IV | The Lock | interactive deduction | five wheels and a feedback readout |
| V | The Door | synthesis | nothing — only the four keys already held |

### How it stays honest

**Chamber N+1 is AES-GCM ciphertext, keyed on the answer to chamber N.** The
shipped page contains no readable content past the chamber you have reached, so
opening devtools shows noise. There is no "is this correct?" branch to bypass —
a wrong answer simply fails the authentication tag. Key derivation runs 250,000
rounds of PBKDF2, so each guess costs ~0.3s and brute force is impractical.

Chamber I ships in plaintext because it is the way in; its hints are written so
that none of them names its answer.

Answers are normalised (case, spacing and punctuation ignored) so nobody loses
on formatting. Hints unlock on a timer — 10, 30 and 60 minutes into a chamber —
identically for everyone. Progress is kept in `localStorage`.

Opening the vault reveals a **claim code** that exists nowhere else in the
source. That code is the proof a winner sends; it cannot be produced by anyone
who has not actually finished.

### Editing the puzzle

Everything lives in `tools/build-vault.mjs` — riddles, answers, hints, the
grid, the lock combination and the claim code. Change it and re-run:

```bash
node tools/build-vault.mjs      # re-seals vault/assets/js/chambers.js
```

The script prints the answer list so you can keep a copy. Never commit that
output anywhere public.

## Editing content

Almost everything readable lives in `assets/js/data/site.js` — bio, skills,
quick facts, social links, crew members, and the lines the portrait says.
You should rarely need to touch `index.html`.

Section names, order, and the nav come from `SECTIONS` in `assets/js/config.js`.

## Keyboard shortcuts

| Key | Does |
| --- | --- |
| `⌘K` / `Ctrl+K` | Command palette |
| `B` `E` `G` `I` | Studio: brush, eraser, fill, pick |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Studio: undo / redo |
| `Ctrl+Enter` | Guestbook: post |
| `↑↑↓↓←→←→BA` | CRT mode |
| `1` `2` `3` | Dungeon: pick a choice |
| `Enter` / `Shift+Enter` | Chat: send / newline |

## Security notes

Two things on this site are **not** secret, because a static page has nowhere
to hide them:

1. **The admin passcode** in `assets/js/config.js` ships in the page source.
   It only hides UI. Anything that must actually be protected has to be
   enforced with [Firebase Realtime Database rules](https://firebase.google.com/docs/database/security)
   on the server side — right now the database is world-writable, so anyone can
   post to the guestbook or the art gallery directly. **This one is worth fixing.**

2. **The OpenRouter API key** in `ai/assets/js/config.js` is visible to anyone
   who views the source. This is a deliberate trade: the client is locked to
   zero-cost models, so the worst case is someone burning through the free rate
   limits, not a bill. If that ever becomes annoying, rotate the key and put it
   behind a small proxy (a Cloudflare Worker) that holds it server-side.
