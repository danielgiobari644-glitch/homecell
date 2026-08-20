// cover-manager.js
// Super Admin Universal Cover Photo Management Engine for Quizzes, Events & Daily Devotionals
// Supports direct device file upload, custom image URL, curated worship presets, and Firestore synchronization

let activeCoverTarget = null; // { type: 'event' | 'devotional' | 'quiz', id: string, title: string, imageUrl: string }
let selectedCoverDataUrl = null;

// Curated high-resolution Christian & Worship themed presets
const COVER_PRESETS = [
  {
    name: "Golden Sunrise Devotion",
    category: "Morning",
    url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Sanctuary & Worship Assembly",
    category: "Gathering",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Holy Scripture & Open Bible",
    category: "Word",
    url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Cross of Grace & Light",
    category: "Worship",
    url: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Deep Altar Prayer & Candles",
    category: "Prayer",
    url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Cell Fellowship & Community",
    category: "Fellowship",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Mountain Majesty & Faith",
    category: "Creation",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Hands Lifted in Praise",
    category: "Praise",
    url: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Crown of Life & Victory",
    category: "Quiz",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Scrolls of Wisdom & Prophecy",
    category: "Quiz",
    url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80"
  }
];

function openChangeCoverModal(target) {
  if (!target || !target.id || !target.type) {
    console.warn("Invalid cover target:", target);
    return;
  }

  // Check admin status
  const isSuperAdmin = window.checkIsSuperAdmin ? window.checkIsSuperAdmin() : (
    window.currentUserRole === 'Super Admin' ||
    window.auth?.currentUser?.email?.toLowerCase() === 'danielgiobari644@gmail.com'
  );

  if (!isSuperAdmin) {
    window.showToast?.("Super Admin access required to update cover photos.", "warning");
    return;
  }

  activeCoverTarget = target;
  selectedCoverDataUrl = target.imageUrl || target.coverUrl || '';

  const modal = document.getElementById('universal-cover-modal') || document.getElementById('change-cover-modal');
  const titleEl = document.getElementById('cover-modal-item-title') || document.getElementById('cover-modal-target-title');
  const typeBadge = document.getElementById('cover-modal-item-type') || document.getElementById('cover-modal-target-badge');
  const urlInput = document.getElementById('cover-modal-url-input');
  const presetsContainer = document.getElementById('cover-modal-presets-grid');

  if (titleEl) {
    titleEl.innerText = target.title || (
      target.type === 'event' ? 'Church Gathering Cover' :
      target.type === 'quiz' ? 'Bible Trivia Quiz Cover' : 'Daily Devotional Cover'
    );
  }
  
  if (typeBadge) {
    if (target.type === 'event') {
      typeBadge.innerHTML = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">📅 Church Gathering Cover</span>`;
    } else if (target.type === 'quiz') {
      typeBadge.innerHTML = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">🏆 Live Trivia Quiz Cover</span>`;
    } else {
      typeBadge.innerHTML = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">☀️ Daily Devotional Cover</span>`;
    }
  }

  if (urlInput) {
    urlInput.value = (selectedCoverDataUrl && !selectedCoverDataUrl.startsWith('data:')) ? selectedCoverDataUrl : '';
  }

  updateCoverModalPreview(selectedCoverDataUrl);

  // Render presets
  if (presetsContainer) {
    presetsContainer.innerHTML = COVER_PRESETS.map((p) => `
      <div onclick="window.selectPresetCover('${p.url}')" class="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 cursor-pointer hover:border-amber-500 transition-all aspect-video bg-slate-100 dark:bg-zinc-800 shadow-2xs">
        <img src="${p.url}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
          <span class="text-[9px] font-bold text-white leading-tight line-clamp-1">${p.name}</span>
        </div>
      </div>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeChangeCoverModal() {
  const modal = document.getElementById('universal-cover-modal') || document.getElementById('change-cover-modal');
  if (modal) modal.classList.add('hidden');
  activeCoverTarget = null;
  selectedCoverDataUrl = null;
}

function updateCoverModalPreview(url) {
  const previewImg = document.getElementById('cover-modal-preview-img');
  const noPreviewBox = document.getElementById('cover-modal-no-preview');
  
  if (previewImg) {
    if (url && url.trim() !== '') {
      previewImg.src = url.trim();
      previewImg.classList.remove('hidden');
      if (noPreviewBox) noPreviewBox.classList.add('hidden');
    } else {
      previewImg.src = 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80';
      previewImg.classList.remove('hidden');
      if (noPreviewBox) noPreviewBox.classList.add('hidden');
    }
  }
}

function applyCoverModalUrlInput() {
  const urlInput = document.getElementById('cover-modal-url-input');
  if (!urlInput) return;
  const url = urlInput.value.trim();
  if (!url) {
    window.showToast?.("Please enter a valid image URL.", "warning");
    return;
  }
  selectedCoverDataUrl = url;
  updateCoverModalPreview(url);
  window.showToast?.("Image URL preview loaded. Click 'Save & Apply' to finalize.", "info");
}

function handleCoverUrlInput(e) {
  const url = e.target.value.trim();
  selectedCoverDataUrl = url;
  updateCoverModalPreview(url);
}

function selectPresetCover(presetUrl) {
  selectedCoverDataUrl = presetUrl;
  const urlInput = document.getElementById('cover-modal-url-input');
  if (urlInput) urlInput.value = presetUrl;
  updateCoverModalPreview(presetUrl);
  window.showToast?.("Preset banner selected. Click 'Save & Apply Cover' to update.", "info");
}

function handleCoverModalFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    window.showToast?.("Please select a valid image file (JPG, PNG, WebP).", "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const rawDataUrl = event.target.result;
    
    // Scale and compress image to avoid huge payloads while maintaining crisp HD quality
    compressImageToDataUrl(rawDataUrl, 1280, 720, 0.85, (compressedUrl) => {
      selectedCoverDataUrl = compressedUrl;
      const urlInput = document.getElementById('cover-modal-url-input');
      if (urlInput) urlInput.value = ''; // clear url input when file is selected
      updateCoverModalPreview(compressedUrl);
      window.showToast?.("Image loaded from device. Ready to save!", "success");
    });
  };
  reader.readAsDataURL(file);
}

function compressImageToDataUrl(dataUrl, maxWidth, maxHeight, quality, callback) {
  const img = new Image();
  img.onload = () => {
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      width = maxHeight;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    callback(compressed);
  };
  img.onerror = () => callback(dataUrl);
  img.src = dataUrl;
}

function clearCurrentCoverPhoto() {
  selectedCoverDataUrl = '';
  const urlInput = document.getElementById('cover-modal-url-input');
  const fileInput = document.getElementById('cover-modal-file-input');
  if (urlInput) urlInput.value = '';
  if (fileInput) fileInput.value = '';
  updateCoverModalPreview('');
  window.showToast?.("Cover photo cleared. Click 'Save & Apply' to confirm.", "info");
}

async function saveSelectedCoverPhoto() {
  if (!activeCoverTarget) return;

  const db = window.db;
  if (!db) {
    window.showToast?.("Database connection unavailable.", "error");
    return;
  }

  const finalImageUrl = selectedCoverDataUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80';
  const targetType = activeCoverTarget.type;
  const targetId = activeCoverTarget.id;

  const saveBtn = document.getElementById('cover-modal-save-btn') || document.getElementById('btn-save-cover-photo');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> Updating Cover...`;
  }

  try {
    if (targetType === 'event') {
      const updateData = {
        imageUrl: finalImageUrl,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('upcoming_events').doc(targetId).update(updateData).catch(async () => {
        await db.collection('events').doc(targetId).update(updateData);
      });
      await db.collection('events').doc(targetId).update(updateData).catch(() => {});

      window.soundEngine?.playSuccess?.();
      window.showToast?.("🎉 Event cover photo updated successfully!", "success");
    } else if (targetType === 'devotional') {
      const updateData = {
        imageUrl: finalImageUrl,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('daily_devotionals').doc(targetId).update(updateData).catch(async () => {
        await db.collection('devotionals').doc(targetId).update(updateData);
      });
      await db.collection('devotionals').doc(targetId).update(updateData).catch(() => {});

      if (window.devotionalsCache && window.devotionalsCache[targetId]) {
        window.devotionalsCache[targetId].imageUrl = finalImageUrl;
      }
      const fullImg = document.getElementById('modal-devotional-img');
      if (fullImg && fullImg.parentElement) {
        fullImg.src = finalImageUrl;
        fullImg.parentElement.classList.remove('hidden');
      }

      window.soundEngine?.playSuccess?.();
      window.showToast?.("☀️ Devotional cover photo updated successfully!", "success");
    } else if (targetType === 'quiz') {
      const updateData = {
        imageUrl: finalImageUrl,
        coverUrl: finalImageUrl,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('custom_quizzes').doc(targetId).update(updateData);

      window.soundEngine?.playSuccess?.();
      window.showToast?.("🏆 Quiz cover photo updated successfully!", "success");
    }

    closeChangeCoverModal();
  } catch (err) {
    console.error("Error saving cover photo:", err);
    window.showToast?.("Failed to update cover photo: " + err.message, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Save & Apply Cover</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

// Global Exports
window.openChangeCoverModal = openChangeCoverModal;
window.closeChangeCoverModal = closeChangeCoverModal;
window.handleCoverUrlInput = handleCoverUrlInput;
window.handleCoverModalFileSelect = handleCoverModalFileSelect;
window.handleCoverFileSelect = handleCoverModalFileSelect;
window.selectPresetCover = selectPresetCover;
window.clearCurrentCoverPhoto = clearCurrentCoverPhoto;
window.applyCoverModalUrlInput = applyCoverModalUrlInput;
window.saveSelectedCoverPhoto = saveSelectedCoverPhoto;
window.saveCoverPhoto = saveSelectedCoverPhoto;
window.compressImageToDataUrl = compressImageToDataUrl;
window.COVER_PRESETS = COVER_PRESETS;
