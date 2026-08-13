# Images

| File | Size | Used for |
| --- | --- | --- |
| `ghassan.jpg` | 900×900 | Hero portrait |
| `og-cover.jpg` | 1200×630 | Link previews (Open Graph / Twitter cards) |

Overwrite `ghassan.jpg` to change the portrait — the hero picks it up with no
code changes. See `PROFILE.photo` in `assets/js/data/site.js` if you want a
different filename or a hosted URL.

If `ghassan.jpg` is missing the hero falls back to the pixel avatar, so the
page never renders a broken image.
