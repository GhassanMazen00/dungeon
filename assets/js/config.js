// App-wide constants and wiring.

export const FIREBASE_CONFIG = {
  databaseURL: 'https://dungeon-data-base-default-rtdb.firebaseio.com/'
};

// NOTE: this is a client-side convenience gate only. Anyone can read it in the
// page source — it hides UI, it does not protect data. Real protection has to
// live in Firebase Realtime Database security rules.
export const ADMIN_PASSCODE = 'ananke';

export const DB_PATHS = {
  notes: 'notes',
  art: 'artGallery'
};

export const STORAGE_KEYS = {
  theme: 'gh_theme_v1',
  motion: 'gh_motion_v1',
  crt: 'gh_crt_v1',
  canvas: 'gh_canvas_v1',
  fortuneFavs: 'gh_fortune_favs_v1',
  fortuneSeen: 'gh_fortune_seen_v1',
  fortuneCount: 'gh_fortune_count_v1',
  achievements: 'gh_achievements_v1',
  guestbookLast: 'gh_guestbook_last_v1'
};

// Sections registered here power the nav, the scroll-spy and the command palette.
// `nav: false` keeps a section out of the top bar (it stays in the palette and
// the scroll-spy) so the bar does not overflow on a laptop.
export const SECTIONS = [
  { id: 'hero', label: 'Home', icon: '◆', nav: false },
  { id: 'build', label: 'Build', icon: '◧' },
  { id: 'work', label: 'Work', icon: '◆' },
  { id: 'process', label: 'Process', icon: '◇' },
  { id: 'about', label: 'About', icon: '◈' },
  { id: 'studio', label: 'Studio', icon: '▩' },
  { id: 'oracle', label: 'Oracle', icon: '◉', nav: false },
  { id: 'crew', label: 'Crew', icon: '◍', nav: false },
  { id: 'guestbook', label: 'Guestbook', icon: '✎', nav: false },
  { id: 'contact', label: 'Contact', icon: '✉' }
];

export const THEMES = [
  { id: 'crimson', label: 'Crimson', swatch: '#ff3b3b' },
  { id: 'cyber', label: 'Cyber', swatch: '#36d1ff' },
  { id: 'toxic', label: 'Toxic', swatch: '#4ade80' },
  { id: 'amber', label: 'Amber', swatch: '#fbbf24' },
  { id: 'violet', label: 'Violet', swatch: '#a78bfa' }
];

// Guestbook: minimum gap between two posts from the same browser.
export const POST_COOLDOWN_MS = 30_000;
