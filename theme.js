// theme.js
// Home.cell Centralized Two-Theme System:
// 1. Dark Theme (Default for all users) — Sophisticated Deep Navy, High Contrast & Pristine Readability
// 2. Light Theme (Optional) — Luminous Daybreak with Deep Navy Readability

(function() {
  'use strict';

  if (window.__theme_system_loaded) return;
  window.__theme_system_loaded = true;

  const THEME_KEY = 'homecell_theme_v4';

  const AVAILABLE_THEMES = [
    {
      id: 'dark',
      name: 'Dark Theme (Default)',
      icon: 'moon',
      desc: 'Signature deep navy blue & purple ambiance with crisp white readability',
      isDark: true,
      bgHex: '#060914'
    },
    {
      id: 'light',
      name: 'Light Theme',
      icon: 'sun',
      desc: 'Crisp light mode with high-contrast deep navy typography',
      isDark: false,
      bgHex: '#f8fafc'
    }
  ];

  /**
   * Initializes the theme system.
   * Rule: If no saved theme exists, ALWAYS use DARK THEME.
   * Do NOT use system/OS preference to choose light theme.
   */
  function initThemeSystem() {
    let savedTheme = localStorage.getItem(THEME_KEY);

    // Fallback migration from older keys if user explicitly selected light before
    if (!savedTheme) {
      const v3 = localStorage.getItem('homecell_theme_v3');
      if (v3 === 'light') {
        savedTheme = 'light';
      } else {
        // ALWAYS default to DARK THEME
        savedTheme = 'dark';
      }
    }

    // Ensure valid theme name
    if (savedTheme !== 'light') {
      savedTheme = 'dark';
    }

    applyTheme(savedTheme, false);
  }

  /**
   * Applies the chosen theme smoothly across the DOM.
   * @param {string} themeName - 'dark' or 'light'
   * @param {boolean} showToastFeedback - whether to display toast
   */
  function applyTheme(themeName, showToastFeedback = false) {
    const root = document.documentElement;
    // Strip all obsolete or conflicting classes
    root.classList.remove('dark', 'light', 'navy', 'sanctuary', 'parchment', 'olive', 'covenant', 'sepia-theme');

    const normalizedTheme = themeName === 'light' ? 'light' : 'dark';

    if (normalizedTheme === 'light') {
      root.classList.add('light');
    } else {
      // Dark is Default
      root.classList.add('dark', 'navy');
    }

    try {
      localStorage.setItem(THEME_KEY, normalizedTheme);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }

    updateThemeSelectorUI(normalizedTheme);

    // Update meta theme-color tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', normalizedTheme === 'light' ? '#f8fafc' : '#060914');
    }

    if (showToastFeedback && typeof window.showToast === 'function') {
      window.showToast(
        normalizedTheme === 'dark' ? 'Dark Theme active' : 'Light Theme active',
        'info'
      );
    }
  }

  /**
   * Updates all theme toggle buttons, quick icons, and settings controls in the DOM.
   */
  function updateThemeSelectorUI(themeName) {
    const isDark = themeName === 'dark';

    // 1. Update quick toggle icon buttons
    const quickToggleButtons = document.querySelectorAll(
      '.quick-theme-toggle-btn, #theme-toggle-btn, #btn-quick-theme-toggle, #discovery-quick-theme-toggle'
    );
    quickToggleButtons.forEach(btn => {
      btn.setAttribute('title', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme (Default)');
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme (Default)');
      btn.innerHTML = isDark
        ? `<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i><span class="sr-only">Switch to Light Theme</span>`
        : `<i data-lucide="moon" class="w-4 h-4 text-slate-700"></i><span class="sr-only">Switch to Dark Theme</span>`;
    });

    // 2. Update dedicated settings buttons if present in Profile / Settings screen
    const darkSettingBtn = document.getElementById('theme-setting-dark-btn');
    const lightSettingBtn = document.getElementById('theme-setting-light-btn');
    if (darkSettingBtn && lightSettingBtn) {
      if (isDark) {
        darkSettingBtn.className = "flex-1 p-3.5 rounded-2xl border-2 border-blue-500 bg-blue-600/15 text-white font-black text-xs flex items-center justify-between shadow-sm cursor-pointer transition-all";
        lightSettingBtn.className = "flex-1 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700/60 bg-transparent text-slate-600 dark:text-slate-300 hover:border-slate-400 font-bold text-xs flex items-center justify-between cursor-pointer transition-all";
      } else {
        lightSettingBtn.className = "flex-1 p-3.5 rounded-2xl border-2 border-blue-600 bg-blue-50 text-blue-900 font-black text-xs flex items-center justify-between shadow-sm cursor-pointer transition-all";
        darkSettingBtn.className = "flex-1 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700/60 bg-transparent text-slate-600 dark:text-slate-300 hover:border-slate-400 font-bold text-xs flex items-center justify-between cursor-pointer transition-all";
      }
    }

    // 3. Update theme palette menu options
    const menuItems = document.querySelectorAll('#header-theme-palette-menu button[data-theme-choice]');
    menuItems.forEach(item => {
      const choice = item.getAttribute('data-theme-choice');
      if (choice === themeName) {
        item.classList.add('bg-blue-600/15', 'border', 'border-blue-500/40');
      } else {
        item.classList.remove('bg-blue-600/15', 'border', 'border-blue-500/40');
      }
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /**
   * Toggles between Dark Theme (Default) and Light Theme.
   */
  function toggleLightDark() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const nextTheme = isCurrentlyDark ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  }

  function toggleThemePaletteMenu(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const menu = document.getElementById('header-theme-palette-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  // Close theme palette menu if clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('header-theme-palette-menu');
    const btn = document.getElementById('header-theme-palette-btn');
    if (menu && !menu.classList.contains('hidden')) {
      if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
        menu.classList.add('hidden');
      }
    }
  });

  // =========================================================================
  // UNIVERSAL HOME.CELL LOADING PATTERN (House Line Drawing + Two Dots)
  // Consistent across Feed, Cells, Chat, Quizzes, Hall of Fame, Admin & Profile
  // =========================================================================

  window.renderHomecellLoader = function(size = 'md', label = '', extraClass = '') {
    if (size === 'btn' || size === 'inline') {
      return `
        <span class="homecell-loader-inline ${extraClass}">
          <svg class="homecell-loader-svg" width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="homecell-loader-path-static" d="M50 14 L86 44 L86 86 L14 86 L14 44 Z" stroke="currentColor" stroke-width="8" stroke-linejoin="miter" />
            <circle class="homecell-loader-dot-1" cx="37" cy="56" r="8" />
            <circle class="homecell-loader-dot-2" cx="63" cy="56" r="8" />
          </svg>
          ${label ? `<span class="ml-1.5 font-bold">${label}</span>` : ''}
        </span>
      `;
    }

    const dims = size === 'sm'
      ? { w: 32, h: 32, stroke: 6, r: 5 }
      : (size === 'lg' ? { w: 68, h: 68, stroke: 5, r: 8 } : { w: 48, h: 48, stroke: 6, r: 6 });
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
        ${label ? `<p class="mt-3 text-xs font-bold tracking-wide homecell-loader-label">${label}</p>` : ''}
        <span class="sr-only">Loading Home.cell...</span>
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
      buttonEl.classList.add('opacity-85', 'cursor-not-allowed');
      buttonEl.innerHTML = window.renderHomecellLoader('btn', loadingText);
    } else {
      buttonEl.disabled = false;
      buttonEl.classList.remove('opacity-85', 'cursor-not-allowed');
      if (buttonEl.dataset.originalHtml) {
        buttonEl.innerHTML = buttonEl.dataset.originalHtml;
      }
    }
  };

  window.renderHomecellError = function(message = 'Something went wrong.', retryAction = null, extraClass = '') {
    return `
      <div class="glass-panel rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto ${extraClass}">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-400 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 14 L86 44 L86 86 L14 86 L14 44 Z" stroke="currentColor" stroke-width="7" />
            <circle cx="50" cy="55" r="8" fill="#f43f5e" />
          </svg>
        </div>
        <p class="text-xs text-slate-200 dark:text-slate-200 light:text-slate-700 leading-relaxed font-bold">${message}</p>
        ${retryAction ? `
          <button onclick="${retryAction}" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md cursor-pointer border border-blue-400/30">
            Try Again
          </button>
        ` : ''}
      </div>
    `;
  };

  // Expose global helpers
  window.initThemeSystem = initThemeSystem;
  window.applyTheme = applyTheme;
  window.setThemeMode = applyTheme;
  window.setTheme = applyTheme;
  window.toggleLightDark = toggleLightDark;
  window.toggleQuickTheme = toggleLightDark;
  window.toggleThemePaletteMenu = toggleThemePaletteMenu;
  window.AVAILABLE_THEMES = AVAILABLE_THEMES;

  // Immediately execute on load
  initThemeSystem();
})();
