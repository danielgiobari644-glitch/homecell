// theme.js
// Global Persistent Theme System (Daybreak Grace, Midnight Cathedral, Sanctuary, Parchment, Olive, Covenant)

(function() {
  'use strict';

  if (window.__theme_system_loaded) return;
  window.__theme_system_loaded = true;

  const THEME_KEY = 'homecell_theme_v3';

  const AVAILABLE_THEMES = [
    { id: 'navy', name: 'Deep Navy (Official)', icon: 'shield', desc: 'Home.cell signature dark navy & violet ambiance', isDark: true, bgHex: '#080c1a' },
    { id: 'dark', name: 'Midnight Cathedral', icon: 'moon', desc: 'Deep obsidian starry night mode', isDark: true, bgHex: '#080c1a' },
    { id: 'sanctuary', name: 'Celestial Sanctuary', icon: 'sparkles', desc: 'Midnight indigo with golden accents', isDark: true, bgHex: '#080912' },
    { id: 'covenant', name: 'Royal Covenant', icon: 'crown', desc: 'Regal imperial violet & majestic gold', isDark: true, bgHex: '#12091f' },
    { id: 'olive', name: 'Mount of Olives', icon: 'leaf', desc: 'Sacred deep forest green & emerald peace', isDark: true, bgHex: '#0b140f' },
    { id: 'light', name: 'Daybreak Grace', icon: 'sun', desc: 'Luminous light mode', isDark: false, bgHex: '#f8fafd' },
  ];

  function initThemeSystem() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'navy';
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
    root.classList.remove('dark', 'navy', 'sanctuary', 'parchment', 'olive', 'covenant', 'sepia-theme');

    const themeMeta = AVAILABLE_THEMES.find(t => t.id === themeName) || AVAILABLE_THEMES[0];

    if (themeName === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark', 'navy');
    } else if (themeName === 'light') {
      // light mode
    } else if (themeName === 'navy' || themeName === 'dark') {
      root.classList.add('dark', 'navy');
    } else if (themeName === 'sanctuary') {
      root.classList.add('dark', 'sanctuary');
    } else if (themeName === 'parchment') {
      root.classList.add('parchment');
    } else if (themeName === 'olive') {
      root.classList.add('dark', 'olive');
    } else if (themeName === 'covenant') {
      root.classList.add('dark', 'covenant');
    } else {
      root.classList.add('dark', 'navy');
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

  // Universal Home.cell Loading API
  window.renderHomecellLoader = function(size = 'md', label = '', extraClass = '') {
    if (size === 'btn' || size === 'inline') {
      return `
        <span class="homecell-loader-inline ${extraClass}">
          <svg class="homecell-loader-svg" width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 14 L86 44 L86 86 L14 86 L14 44 Z" stroke="currentColor" stroke-width="8" stroke-linejoin="miter" />
            <circle class="homecell-loader-dot-1" cx="37" cy="56" r="8" />
            <circle class="homecell-loader-dot-2" cx="63" cy="56" r="8" />
          </svg>
          ${label ? `<span class="ml-1.5">${label}</span>` : ''}
        </span>
      `;
    }

    const dims = size === 'sm' ? { w: 32, h: 32, stroke: 6, r: 5 } : (size === 'lg' ? { w: 68, h: 68, stroke: 5, r: 8 } : { w: 48, h: 48, stroke: 6, r: 6 });
    const containerPad = size === 'sm' ? 'py-4' : (size === 'lg' ? 'py-14' : 'py-8');

    return `
      <div class="homecell-loader-container ${containerPad} ${extraClass}" role="status" aria-live="polite">
        <div class="relative flex items-center justify-center">
          <svg class="homecell-loader-svg" width="${dims.w}" height="${dims.h}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="homecell-loader-path-left" d="M50 14 L14 44 L14 86 L50 86" stroke="currentColor" stroke-width="${dims.stroke}" stroke-linejoin="miter" />
            <path class="homecell-loader-path-right" d="M50 14 L86 44 L86 86 L50 86" stroke="currentColor" stroke-width="${dims.stroke}" stroke-linejoin="miter" />
            <circle class="homecell-loader-dot-1" cx="37" cy="56" r="${dims.r}" />
            <circle class="homecell-loader-dot-2" cx="63" cy="56" r="${dims.r}" />
          </svg>
        </div>
        ${label ? `<p class="mt-3 text-xs font-semibold tracking-wide text-slate-300">${label}</p>` : ''}
        <span class="sr-only">Loading...</span>
      </div>
    `;
  };

  window.setButtonLoading = function(buttonEl, isLoading, loadingText = 'Processing...') {
    if (!buttonEl) return;
    if (isLoading) {
      if (!buttonEl.dataset.originalHtml) {
        buttonEl.dataset.originalHtml = buttonEl.innerHTML;
      }
      buttonEl.disabled = true;
      buttonEl.classList.add('opacity-80', 'cursor-not-allowed');
      buttonEl.innerHTML = window.renderHomecellLoader('btn', loadingText);
    } else {
      buttonEl.disabled = false;
      buttonEl.classList.remove('opacity-80', 'cursor-not-allowed');
      if (buttonEl.dataset.originalHtml) {
        buttonEl.innerHTML = buttonEl.dataset.originalHtml;
      }
    }
  };

  window.renderHomecellError = function(message = 'Something went wrong.', retryAction = null, extraClass = '') {
    return `
      <div class="glass-panel rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto ${extraClass}">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 14 L86 44 L86 86 L14 86 L14 44 Z" stroke="currentColor" stroke-width="7" />
            <circle cx="50" cy="55" r="8" fill="#f43f5e" />
          </svg>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed font-medium">${message}</p>
        ${retryAction ? `
          <button onclick="${retryAction}" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer">
            Try Again
          </button>
        ` : ''}
      </div>
    `;
  };

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

