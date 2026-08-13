// Firebase Realtime Database access, isolated behind a tiny facade so the
// feature modules never touch the global `firebase` object directly.
// The compat SDK is loaded from a <script> tag in index.html before this runs.

import { FIREBASE_CONFIG, DB_PATHS } from '../config.js';

let database = null;
let available = false;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(FIREBASE_CONFIG);
    database = firebase.database();
    available = true;
  } else {
    console.warn('[db] Firebase SDK not loaded — cloud features are offline.');
  }
} catch (error) {
  console.error('[db] Failed to initialise Firebase:', error);
}

export const isOnline = () => available;

export const ref = (path) => (available ? database.ref(path) : null);

export const notesRef = () => ref(DB_PATHS.notes);
export const artRef = () => ref(DB_PATHS.art);

/** Turns a Firebase snapshot into a plain array with the key folded in. */
export function snapshotToArray(snapshot) {
  const items = [];
  snapshot.forEach((child) => {
    items.push({ key: child.key, ...child.val() });
  });
  return items;
}
