// theme.js
// Global Persistent Theme System (Daybreak Grace, Midnight Cathedral, Sanctuary, Parchment, Olive, Covenant)

(function() {
  'use strict';

  if (window.__theme_system_loaded) return;
  window.__theme_system_loaded = true;

  const THEME_KEY = 'homecell_theme_v3';

  const AVAILABLE_THEMES = [
    { id: 'light', name: 'Daybreak Grace', icon: 'sun', desc: 'Clean, luminous high-contrast light mode', isDark: false, bgHex: '#f8fafd' },
    { id: 'dark', name: 'Midnight Cathedral', icon: 'moon', desc: 'Deep obsidian starry night mode', isDark: true, bgHex: '#09090b' },
    { id: 'sanctuary', name: 'Celestial Sanctuary', icon: 'sparkles', desc: 'Midnight indigo with golden accents', isDark: true, bgHex: '#080912' },
    { id: 'parchment', name: 'Ancient Scrolls', icon: 'scroll', desc: 'Warm biblical papyrus and sepia gold', isDark: false, bgHex: '#f7f2ea' },
    { id: 'olive', name: 'Mount of Olives', icon: 'leaf', desc: 'Sacred deep forest green & emerald peace', isDark: true, bgHex: '#0b140f' },
    { id: 'covenant', name: 'Royal Covenant', icon: 'crown', desc: 'Regal imperial violet & majestic gold', isDark: true, bgHex: '#12091f' },
  ];

  function initThemeSystem() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme, false);

    // Listen for system theme changes if set to system
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const current = localStorage.getItem(THEME_KEY);
        if (current === 'system') {
          const root = document.documentElement;
          if (e.matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          updateThemeSelectorUI('system');
        }
      });
    }
  }

  function applyTheme(themeName, showToastFeedback = true) {
    const root = document.documentElement;
    // Remove all previous theme classes
    root.classList.remove('dark', 'sanctuary', 'parchment', 'olive', 'covenant', 'sepia-theme');

    const themeMeta = AVAILABLE_THEMES.find(t => t.id === themeName) || AVAILABLE_THEMES[0];

    if (themeName === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
    } else if (themeName === 'light') {
      // default light
    } else if (themeName === 'dark') {
      root.classList.add('dark');
    } else if (themeName === 'sanctuary') {
      root.classList.add('dark', 'sanctuary');
    } else if (themeName === 'parchment') {
      root.classList.add('parchment');
    } else if (themeName === 'olive') {
      root.classList.add('dark', 'olive');
    } else if (themeName === 'covenant') {
      root.classList.add('dark', 'covenant');
    }

    localStorage.setItem(THEME_KEY, themeName);
    updateThemeSelectorUI(themeName);

    if (showToastFeedback && window.showToast) {
      window.showToast(`Theme: ${themeMeta.name}`, "info");
    }
  }

  function updateThemeSelectorUI(themeName) {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      const bTheme = btn.getAttribute('data-theme');
      if (bTheme === themeName) {
        btn.className = "theme-toggle-btn px-3.5 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5";
      } else {
        btn.className = "theme-toggle-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all flex items-center gap-1.5";
      }
    });

    const isDark = document.documentElement.classList.contains('dark');
    
    // Update all quick toggle buttons across the app
    const quickToggleButtons = document.querySelectorAll('.quick-theme-toggle-btn, #theme-toggle-btn, #btn-quick-theme-toggle, #discovery-quick-theme-toggle');
    quickToggleButtons.forEach(btn => {
      btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      btn.innerHTML = isDark 
        ? `<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i><span class="sr-only">Light</span>` 
        : `<i data-lucide="moon" class="w-4 h-4 text-slate-700 dark:text-zinc-200"></i><span class="sr-only">Dark</span>`;
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function toggleLightDark() {
    const current = localStorage.getItem(THEME_KEY) || 'light';
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const next = isCurrentlyDark ? 'light' : 'dark';
    applyTheme(next, true);
  }

  function toggleThemePaletteMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('header-theme-palette-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  // Close theme menu if clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('header-theme-palette-menu');
    const btn = document.getElementById('header-theme-palette-btn');
    if (menu && !menu.classList.contains('hidden')) {
      if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
        menu.classList.add('hidden');
      }
    }
  });

  window.initThemeSystem = initThemeSystem;
  window.applyTheme = applyTheme;
  window.setThemeMode = applyTheme;
  window.setTheme = applyTheme;
  window.toggleLightDark = toggleLightDark;
  window.toggleQuickTheme = toggleLightDark;
  window.toggleThemePaletteMenu = toggleThemePaletteMenu;
  window.AVAILABLE_THEMES = AVAILABLE_THEMES;

  // Auto-run at script parse
  initThemeSystem();
})();

