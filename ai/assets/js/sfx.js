// Tiny WebAudio blips. No files, no dependencies — just oscillators.

import { STORAGE } from './config.js';
import { read, write } from '../../../assets/js/core/store.js';

let ctx = null;
let enabled = read(STORAGE.sound, false);

const ensure = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freq, duration = 0.08, type = 'square', gain = 0.04) {
  if (!enabled) return;
  try {
    const audio = ensure();
    const osc = audio.createOscillator();
    const vol = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.setValueAtTime(gain, audio.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    osc.connect(vol).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {
    /* audio is a nice-to-have; never let it break the page */
  }
}

export const sfx = {
  send: () => tone(660, 0.06),
  receive: () => tone(440, 0.07),
  click: () => tone(880, 0.03, 'triangle', 0.03),
  good: () => {
    tone(523, 0.07);
    setTimeout(() => tone(784, 0.1), 70);
  },
  bad: () => {
    tone(220, 0.12, 'sawtooth', 0.05);
    setTimeout(() => tone(160, 0.16, 'sawtooth', 0.05), 90);
  },
  hurt: () => tone(140, 0.14, 'sawtooth', 0.05),
  loot: () => {
    tone(880, 0.05);
    setTimeout(() => tone(1175, 0.09), 60);
  },
  death: () => {
    [400, 330, 260, 180].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sawtooth', 0.05), i * 130));
  }
};

export const soundEnabled = () => enabled;

export function toggleSound() {
  enabled = !enabled;
  write(STORAGE.sound, enabled);
  if (enabled) sfx.good();
  return enabled;
}
