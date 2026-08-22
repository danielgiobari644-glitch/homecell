// toast.js
// Custom Toast Notification System for Home.cell

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[99999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 max-w-sm backdrop-blur-md ${
    type === 'success'
      ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200'
      : type === 'error'
      ? 'bg-rose-900/90 border-rose-500/40 text-rose-100 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200'
      : type === 'warning'
      ? 'bg-amber-900/90 border-amber-500/40 text-amber-100 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-200'
      : 'bg-slate-900/90 border-blue-500/40 text-slate-100 dark:bg-zinc-900/90 dark:border-blue-800 dark:text-zinc-200'
  }`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : type === 'warning' ? 'alert-circle' : 'info';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
    <span class="flex-grow leading-relaxed">${message}</span>
    <button type="button" class="text-slate-400 hover:text-white cursor-pointer ml-1 p-1">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  const autoRemoveTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);

  const closeBtn = toast.querySelector('button');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoRemoveTimer);
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
      setTimeout(() => {
        toast.remove();
      }, 300);
    });
  }
}

window.showToast = showToast;
