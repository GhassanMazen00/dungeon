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
ai/index.html           The Doctor — the AI chat page, see below
vault/index.html        The Vault — the puzzle, see below
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

## The Doctor (`/ai`)

A single-purpose chat page. One persona — a cold, rude, faintly sinister
therapist — that answers in whatever language you write in, English or Arabic.

```
ai/index.html
ai/assets/
  css/ai.css            one self-contained stylesheet, no imports, no web fonts
  js/
    config.js           provider keys, model choice, tunables
    providers.js        one streaming interface over Gemini / Groq / OpenRouter
    persona.js          the system prompt  ← edit the character here
    markdown.js         escape-first markdown renderer
    chat.js             the conversation, RTL handling
    main.js             boot + mobile keyboard tracking
```

### Providers

`providers.js` speaks three APIs behind one interface. The first provider with
a key is used and the rest are failover, so a rate limit falls through to the
next instead of showing an error.

| Provider | Why | Key from |
| --- | --- | --- |
| **Gemini Flash** (default) | free quota resets daily, fastest of the three for this workload, strongest Arabic | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | fastest raw tokens/sec | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenRouter | already configured, free models only | openrouter.ai |

Gemini serves CORS headers for browser origins, so the page calls it directly
with no backend — same as OpenRouter today.

To trial a key on one device without committing it:

```js
localStorage.setItem('ai_keys', JSON.stringify({ gemini: 'AIza...' }))
```

### Speed

Each provider lists candidate models rather than one hardcoded ID, because
providers retire IDs without warning. OpenRouter in particular keeps removing
`:free` variants, and its 404 helpfully suggests the **paid** slug — which the
client deliberately ignores, since following it would start billing the account.

When every configured model is stale, the client fetches OpenRouter's live
catalogue, keeps only models priced at exactly zero, and tries those. Whatever
answers is remembered in `localStorage` and tried first from then on, so the
repair costs one slow message once and nothing afterwards.

Visitors never enter a key. The page ships ready to use.

Time-to-first-word is the only metric that matters here, so: no model-catalogue
round trip, no web fonts, one stylesheet, a short system prompt, a 12-turn
history window, a 400-token ceiling, `preconnect` to the model host, and
streaming so the first word paints before the sentence exists.

### The safety override

The persona is deliberately unpleasant, and a page that calls itself a therapist
will be handed real distress eventually. The system prompt opens — before any
character description — with an instruction to drop the act entirely on any sign
of genuine crisis and point the person to real help. It is written to outrank
the rest of the prompt. Keep it there if you edit `persona.js`.

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
| `Enter` / `Shift+Enter` | Chat: send / newline |

## Security notes

Two things on this site are **not** secret, because a static page has nowhere
to hide them:

1. **The admin passcode** in `assets/js/config.js` ships in the page source.
   It only hides UI. Anything that must actually be protected has to be
   enforced with [Firebase Realtime Database rules](https://firebase.google.com/docs/database/security)
   on the server side — right now the database is world-writable, so anyone can
   post to the guestbook or the art gallery directly. **This one is worth fixing.**

2. **The model API keys** in `ai/assets/js/config.js` are visible to anyone who
   views the source. This is a deliberate trade: every provider is pointed at a
   free tier, so the worst case is someone burning a daily quota, not a bill.
   If that becomes annoying, rotate the key and put it behind a small proxy (a
   Cloudflare Worker) that holds it server-side.
