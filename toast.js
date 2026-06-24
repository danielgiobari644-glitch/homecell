// toast.js
// Custom Toast Notification System

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 max-w-sm ${
    type === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
      : type === 'error'
      ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
      : 'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300'
  }`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
    <span class="flex-grow">${message}</span>
    <button class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer ml-2">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);

  // Initialize Lucide icons for the newly added elements
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto remove
  const autoRemoveTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);

  // Close on click
  toast.querySelector('button').addEventListener('click', () => {
    clearTimeout(autoRemoveTimer);
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
}

// Expose toast
window.showToast = showToast;
