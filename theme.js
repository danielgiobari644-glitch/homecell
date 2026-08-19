// theme.js
// Global Persistent Theme System (Light, Dark, Sanctuary, System)

const THEME_KEY = 'homecell_theme_v2';

function initThemeSystem() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme, false);
}

function applyTheme(themeName, showToastFeedback = true) {
  const root = document.documentElement;
  root.classList.remove('dark', 'sanctuary', 'sepia-theme');

  if (themeName === 'system') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) root.classList.add('dark');
  } else if (themeName === 'dark') {
    root.classList.add('dark');
  } else if (themeName === 'sanctuary') {
    root.classList.add('dark', 'sanctuary');
  }

  localStorage.setItem(THEME_KEY, themeName);
  updateThemeSelectorUI(themeName);

  if (showToastFeedback && window.showToast) {
    const capitalized = themeName.charAt(0).toUpperCase() + themeName.slice(1);
    window.showToast(`Theme switched to ${capitalized} Mode`, "info");
  }
}

function updateThemeSelectorUI(themeName) {
  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    const bTheme = btn.getAttribute('data-theme');
    if (bTheme === themeName) {
      btn.className = "theme-toggle-btn px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white cursor-pointer transition-all shadow-xs flex items-center gap-1.5";
    } else {
      btn.className = "theme-toggle-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all flex items-center gap-1.5";
    }
  });

  const quickThemeToggleBtn = document.getElementById('btn-quick-theme-toggle');
  if (quickThemeToggleBtn) {
    const isDark = document.documentElement.classList.contains('dark');
    quickThemeToggleBtn.innerHTML = isDark 
      ? `<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>` 
      : `<i data-lucide="moon" class="w-4 h-4 text-slate-600"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }
}

function toggleQuickTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'light';
  const next = current === 'dark' || current === 'sanctuary' ? 'light' : 'dark';
  applyTheme(next, true);
}

window.initThemeSystem = initThemeSystem;
window.applyTheme = applyTheme;
window.setThemeMode = applyTheme;
window.toggleQuickTheme = toggleQuickTheme;


// Auto-run at script parse
initThemeSystem();
