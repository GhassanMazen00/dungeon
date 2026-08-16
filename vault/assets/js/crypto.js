// Unsealing chambers.
//
// A chamber opens only if the supplied answer derives the exact AES-GCM key its
// payload was sealed with. There is no separate "is this right?" check to
// bypass — a wrong answer produces a failed authentication tag and nothing else.

import { ITERATIONS } from './chambers.js';

/** Case, spacing and punctuation never cost anyone a correct solve. */
export const normalise = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(answer, salt) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(normalise(answer)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * @returns the decrypted payload, or null if the answer was wrong.
 * Deliberately slow (~0.3s) — that cost is what makes guessing impractical.
 */
export async function unseal(sealed, answer) {
  if (!normalise(answer)) return null;
  try {
    const key = await deriveKey(answer, fromB64(sealed.salt));
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(sealed.iv) },
      key,
      fromB64(sealed.ct)
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null; // bad tag == wrong answer
  }
}
