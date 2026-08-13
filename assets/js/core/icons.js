// Inline SVG icon set — replaces the Font Awesome CDN dependency.
// Every icon is a 24x24 viewBox and inherits currentColor.

const wrap = (body, opts = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${opts}>${body}</svg>`;

const filled = (body) =>
  `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  github: filled(
    '<path d="M12 1.5A10.5 10.5 0 0 0 1.5 12c0 4.64 3 8.58 7.18 9.97.52.1.71-.23.71-.5v-1.9c-2.92.64-3.54-1.24-3.54-1.24-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.61 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.42-2.33-.26-4.78-1.17-4.78-5.19 0-1.15.41-2.09 1.08-2.82-.11-.27-.47-1.33.1-2.78 0 0 .88-.28 2.88 1.08a9.9 9.9 0 0 1 5.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.45.21 2.51.1 2.78.67.73 1.08 1.67 1.08 2.82 0 4.03-2.46 4.92-4.8 5.18.38.33.72.97.72 1.96v2.9c0 .28.19.61.72.5A10.5 10.5 0 0 0 22.5 12 10.5 10.5 0 0 0 12 1.5Z"/>'
  ),
  instagram: wrap(
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/>'
  ),
  snapchat: filled(
    '<path d="M12 2c2.9 0 5 2.2 5 5.1 0 .8-.05 1.6-.1 2.2.4.2.9.2 1.4 0 .3-.1.6 0 .8.2.3.3.3.8 0 1.1-.4.4-1.1.7-1.8.9-.2.1-.3.3-.2.5.5 1.6 1.9 3 3.4 3.3.3.1.5.4.5.7 0 .5-.6.8-1.2 1-.5.1-1 .2-1.2.4-.1.2-.1.5-.2.7-.1.3-.4.5-.8.4-.4-.05-.9-.2-1.6-.2-1.1 0-1.6.2-2.3.8-.7.5-1.4 1-2.7 1s-2-.5-2.7-1c-.7-.6-1.2-.8-2.3-.8-.7 0-1.2.15-1.6.2-.4.1-.7-.1-.8-.4-.1-.2-.1-.5-.2-.7-.2-.2-.7-.3-1.2-.4-.6-.2-1.2-.5-1.2-1 0-.3.2-.6.5-.7 1.5-.3 2.9-1.7 3.4-3.3.1-.2 0-.4-.2-.5-.7-.2-1.4-.5-1.8-.9a.78.78 0 0 1 0-1.1c.2-.2.5-.3.8-.2.5.2 1 .2 1.4 0-.05-.6-.1-1.4-.1-2.2C7 4.2 9.1 2 12 2Z"/>'
  ),
  mail: wrap('<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/>'),
  search: wrap('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  chevron: wrap('<path d="m6 9 6 6 6-6"/>'),
  arrowUp: wrap('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  arrowRight: wrap('<path d="M5 12h14M13 5l7 7-7 7"/>'),
  menu: wrap('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: wrap('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: wrap('<path d="m5 13 4 4L19 7"/>'),
  sparkle: wrap('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/>'),
  brush: wrap('<path d="M15.5 3.5 20.5 8.5 10 19H5v-5z"/><path d="m13 6 5 5"/>'),
  eraser: wrap('<path d="M4 16.5 11.5 9l5.5 5.5L12.5 19H7z"/><path d="M11.5 9 16 4.5 21.5 10 17 14.5"/>'),
  fill: wrap('<path d="M6 11 12 5l7 7-6 6a2 2 0 0 1-2.8 0L6 13.8A2 2 0 0 1 6 11Z"/><path d="M9 8 7 6"/><path d="M20 16c0 1.1-.9 2-2 2s-2-.9-2-2 2-3.5 2-3.5S20 14.9 20 16Z" fill="currentColor" stroke="none"/>'),
  picker: wrap('<path d="m14 5 5 5"/><path d="M17.5 2.5 21.5 6.5 9 19H5v-4z"/>'),
  undo: wrap('<path d="M4 9h11a5 5 0 0 1 0 10h-6"/><path d="M8 5 4 9l4 4"/>'),
  redo: wrap('<path d="M20 9H9a5 5 0 0 0 0 10h6"/><path d="m16 5 4 4-4 4"/>'),
  grid: wrap('<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17"/>'),
  download: wrap('<path d="M12 4v11M8 11l4 4 4-4"/><path d="M4 19h16"/>'),
  send: wrap('<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5z"/>'),
  trash: wrap('<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6.5 7 7.5 20h9L17.5 7"/>'),
  lock: wrap('<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>'),
  palette: wrap('<path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-1 .8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3Z"/><circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="11" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/>'),
  motion: wrap('<path d="M3 12h4l3-7 4 14 3-7h4"/>'),
  star: wrap('<path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z"/>'),
  starFilled: filled('<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  copy: wrap('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  refresh: wrap('<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v5h-5"/>'),
  terminal: wrap('<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="m7.5 10 2.5 2-2.5 2M12.5 14H16"/>'),
  trophy: wrap('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5.5v1A3.5 3.5 0 0 0 8 9.8M16 5.5h2.5v1A3.5 3.5 0 0 1 16 9.8"/><path d="M12 13v3M9 20h6M10 20l.5-4h3l.5 4"/>'),
  mirror: wrap('<path d="M12 3v18"/><path d="M8 7 4 12l4 5z"/><path d="m16 7 4 5-4 5z"/>')
};

/** Returns an SVG string; unknown keys render nothing rather than breaking layout. */
export const icon = (name) => ICONS[name] ?? '';
