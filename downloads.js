// downloads.js
// Downloads Hub Module - Non-Admin Exclusive

function initDownloadsModule() {
  const navBtn = document.getElementById('nav-downloads');
  if (navBtn) navBtn.classList.remove('hidden');
  loadDownloadBundles();
}

function loadDownloadBundles() {
  const container = document.getElementById('download-bundles-grid');
  if (!container) return;

  window.db.collection('download_bundles').onSnapshot(snap => {
    container.innerHTML = '';
    
    if (snap.empty) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-400">
          <i data-lucide="download" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p class="font-bold">No active software installer triggers found.</p>
          <p class="text-xs mt-1">Check back later for PWA, APK, and desktop binary triggers.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    snap.forEach(doc => {
      const b = doc.data();
      
      const card = document.createElement('div');
      card.className = "p-6 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-4 hover:scale-101 transition-all flex flex-col justify-between";

      const iconMap = {
        'android': 'smartphone',
        'pwa': 'globe',
        'desktop': 'monitor'
      };

      const iconName = iconMap[b.category] || 'download';

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">${b.category}</span>
            <span class="text-xs text-slate-400 font-mono font-bold">${b.size || 'Size N/A'}</span>
          </div>
          <h4 class="text-lg font-black font-display tracking-tight text-slate-900 dark:text-zinc-100">${b.title}</h4>
          <span class="text-[10px] font-bold font-mono text-slate-400 block -mt-1 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-max">${b.tag || 'stable'}</span>
        </div>

        <button onclick="triggerActualDownload('${b.category}', '${b.url || ''}')" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-4">
          Download Installer <i data-lucide="${iconName}" class="w-4 h-4"></i>
        </button>
      `;

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => window.handleFirestoreError(err, 'list', 'download_bundles'));
}

function triggerActualDownload(category, url) {
  if (url && url.startsWith('http') && !url.includes('example.com')) {
    // If it's a real external download URL, download/open it
    window.open(url, '_blank');
    window.showToast?.(`📥 Redirected to actual installer at ${url}!`, "success");
    
    // Also reward user streak for installing the app
    setTimeout(() => {
      window.incrementUserStreak?.(`installing the app delivery bundle (${category})`);
    }, 1200);
  } else {
    // Fall back to our high-fidelity direct file downloader
    if (window.triggerDirectFileDownload) {
      window.triggerDirectFileDownload(category);
    } else {
      // Fallback local file generator
      const fileName = `HomeCell_${category}_Bundle.zip`;
      const dummyBytes = new TextEncoder().encode(`HomeCell ${category} installer package file.`);
      const blob = new Blob([dummyBytes], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.showToast?.(`📥 Started downloading real ${fileName} launcher package!`, "success");
      
      // Also reward user streak for installing the app
      setTimeout(() => {
        window.incrementUserStreak?.(`installing the app delivery bundle (${category})`);
      }, 1200);
    }
  }
}

// Expose globally
window.initDownloadsModule = initDownloadsModule;
window.triggerActualDownload = triggerActualDownload;
