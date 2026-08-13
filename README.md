# abomazen.com

Personal site of Ghassan Mazen. Static — no build step, no dependencies to install.
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Adding your photo

Save your portrait as **`assets/img/ghassan.jpg`** and it appears in the hero
automatically. Nothing else to change.

- Square-ish crop works best (the frame is 1:1).
- ~800×800 is plenty; keep it under ~300 KB so the page stays fast.
- If the file is missing, the hero falls back to the pixel avatar, so the site
  never shows a broken image.

To point at a different filename or a hosted URL instead, edit `PROFILE.photo`
in `assets/js/data/site.js`.

## Structure

```
index.html              markup only — all behaviour lives in modules
ai/index.html           the AI chat page (standalone)
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

## Security notes

Two things on this site are **not** secure, by design of how a static page works:

1. **The admin passcode** in `assets/js/config.js` ships in the page source.
   It only hides UI. Anything that must actually be protected has to be
   enforced with [Firebase Realtime Database rules](https://firebase.google.com/docs/database/security)
   on the server side — right now the database is world-writable, so anyone can
   post to the guestbook or the art gallery directly.

2. **The OpenRouter API key** in `ai/index.html` is public to anyone who views
   the source. It should be rotated and moved behind a small proxy (a Cloudflare
   Worker or similar) that holds the key server-side.
