// Entry point — boots every feature module and registers palette commands.

import { SECTIONS, THEMES } from './config.js';
import { qs } from './core/dom.js';
import { initAchievements, openAchievements, resetAchievements } from './features/achievements.js';
import { initTheme, cycleTheme, toggleMotion, toggleCRT, applyTheme } from './features/theme.js';
import { initBackground } from './features/background.js';
import { initNav, initPanels, openPanel } from './features/nav.js';
import { initPalette, registerCommands, openPalette } from './features/palette.js';
import { initHero } from './features/hero.js';
import { initContent } from './features/content.js';
import { initStudio } from './features/studio.js';
import { initOracle, drawFortune } from './features/oracle.js';
import { initGuestbook } from './features/guestbook.js';
import { initAdmin, openAdmin } from './features/admin.js';
import { initEggs, openShame } from './features/eggs.js';

function goTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function registerPaletteCommands() {
  registerCommands([
    ...SECTIONS.map((section) => ({
      id: `go-${section.id}`,
      label: `Go to ${section.label}`,
      icon: section.icon,
      tag: 'jump',
      keywords: section.id,
      run: () => goTo(section.id)
    })),
    {
      id: 'ai',
      label: 'Open Ghassan AI',
      icon: '🤖',
      tag: 'link',
      keywords: 'chat bot assistant',
      run: () => {
        window.location.href = 'ai/';
      }
    },
    {
      id: 'fortune',
      label: 'Draw a fortune',
      icon: '🔮',
      tag: 'action',
      keywords: 'oracle luck future',
      run: () => {
        goTo('oracle');
        setTimeout(drawFortune, 320);
      }
    },
    {
      id: 'theme-cycle',
      label: 'Cycle accent theme',
      icon: '🎨',
      tag: 'view',
      keywords: 'colour color skin',
      run: cycleTheme
    },
    ...THEMES.map((theme) => ({
      id: `theme-${theme.id}`,
      label: `Theme: ${theme.label}`,
      icon: '●',
      tag: 'view',
      keywords: `colour color ${theme.id}`,
      run: () => applyTheme(theme.id, { announce: true })
    })),
    {
      id: 'crt',
      label: 'Toggle CRT mode',
      icon: '📺',
      tag: 'view',
      keywords: 'retro scanlines',
      run: () => toggleCRT()
    },
    {
      id: 'motion',
      label: 'Toggle reduced motion',
      icon: '🌀',
      tag: 'view',
      keywords: 'animation accessibility',
      run: toggleMotion
    },
    {
      id: 'achievements',
      label: 'View achievements',
      icon: '🏆',
      tag: 'panel',
      keywords: 'progress badges trophies',
      run: openAchievements
    },
    {
      id: 'achievements-reset',
      label: 'Reset achievements',
      icon: '↺',
      tag: 'panel',
      keywords: 'clear progress',
      run: resetAchievements
    },
    {
      id: 'admin',
      label: 'Admin mode',
      icon: '🔐',
      tag: 'panel',
      keywords: 'login gallery moderate',
      run: openAdmin
    },
    {
      id: 'gallery',
      label: 'Open art gallery (admin)',
      icon: '🖼️',
      tag: 'panel',
      keywords: 'pixel art submissions',
      run: () => openPanel('galleryBody')
    },
    {
      id: 'trap',
      label: 'Show the 18+ content',
      icon: '🔞',
      tag: 'secret',
      keywords: 'nudes prank shame',
      run: openShame
    },
    {
      id: 'top',
      label: 'Back to top',
      icon: '↑',
      tag: 'jump',
      keywords: 'scroll home',
      run: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    {
      id: 'source',
      label: 'View source on GitHub',
      icon: '⌥',
      tag: 'link',
      keywords: 'repo code',
      run: () => window.open('https://github.com/GhassanMazen00', '_blank', 'noopener')
    }
  ]);
}

function boot() {
  // Order matters: theme sets CSS vars the background reads; achievements must
  // exist before features try to unlock anything.
  initTheme();
  initAchievements(SECTIONS.map((s) => s.id));
  initBackground();
  initNav();
  initPanels();
  initContent();
  initHero();
  initStudio();
  initOracle();
  initGuestbook();
  initAdmin();
  initEggs();
  initPalette();
  registerPaletteCommands();

  qs('#year').textContent = String(new Date().getFullYear());

  // Expose a couple of entry points for anyone poking at the console.
  window.hub = { openPalette, goTo };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
