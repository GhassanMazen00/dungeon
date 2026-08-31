// Entry point.

import { initChat } from './chat.js';

// Keep the composer above the on-screen keyboard on mobile. visualViewport is
// the only reliable signal for this on iOS; without it the input hides behind
// the keyboard when it opens.
function trackViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const apply = () => {
    const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', `${overlap}px`);
  };
  vv.addEventListener('resize', apply);
  vv.addEventListener('scroll', apply);
  apply();
}

function boot() {
  trackViewport();
  initChat();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
