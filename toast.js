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

function showConfirmDialog({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  icon = 'trash-2'
} = {}) {
  return new Promise((resolve) => {
    let modal = document.getElementById('global-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'global-confirm-modal';
      modal.className = 'fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    const iconHtml = isDanger 
      ? `<div class="w-14 h-14 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center mx-auto text-2xl shadow-inner border border-red-500/20"><i data-lucide="${icon || 'trash-2'}" class="w-7 h-7"></i></div>`
      : `<div class="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mx-auto text-2xl shadow-inner border border-blue-500/20"><i data-lucide="${icon || 'help-circle'}" class="w-7 h-7"></i></div>`;

    const confirmBtnClass = isDanger
      ? "flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/25 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
      : "flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5";

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 text-center relative border border-slate-200 dark:border-zinc-800 shadow-2xl animate-fade-in bg-white dark:bg-zinc-900">
        ${iconHtml}
        
        <div class="space-y-1.5">
          <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100 font-display">${title}</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">${message}</p>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="button" id="confirm-modal-cancel-btn" class="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer transition-all">
            ${cancelText}
          </button>
          <button type="button" id="confirm-modal-action-btn" class="${confirmBtnClass}">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();

    const cleanup = (result) => {
      modal.classList.add('hidden');
      modal.innerHTML = '';
      resolve(result);
    };

    const actionBtn = modal.querySelector('#confirm-modal-action-btn');
    const cancelBtn = modal.querySelector('#confirm-modal-cancel-btn');

    if (actionBtn) actionBtn.onclick = () => cleanup(true);
    if (cancelBtn) cancelBtn.onclick = () => cleanup(false);
    modal.onclick = (e) => {
      if (e.target === modal) cleanup(false);
    };
  });
}

window.showToast = showToast;
window.showConfirmDialog = showConfirmDialog;
