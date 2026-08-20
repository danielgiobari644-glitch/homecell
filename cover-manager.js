// cover-manager.js
// Super Admin Cover Photo Management Engine for Events & Daily Devotionals
// Supports direct device file upload, custom image URL, curated worship presets, and Firestore synchronization

let activeCoverTarget = null; // { type: 'event' | 'devotional', id: string, title: string, imageUrl: string }
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
  selectedCoverDataUrl = target.imageUrl || '';

  const modal = document.getElementById('change-cover-modal');
  const titleEl = document.getElementById('cover-modal-target-title');
  const typeBadge = document.getElementById('cover-modal-target-badge');
  const urlInput = document.getElementById('cover-modal-url-input');
  const previewImg = document.getElementById('cover-modal-preview-img');
  const noPreviewBox = document.getElementById('cover-modal-no-preview');
  const presetsContainer = document.getElementById('cover-modal-presets-grid');

  if (titleEl) titleEl.innerText = target.title || (target.type === 'event' ? 'Church Gathering' : 'Daily Devotional');
  
  if (typeBadge) {
    if (target.type === 'event') {
      typeBadge.innerHTML = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">📅 Church Event Cover</span>`;
    } else {
      typeBadge.innerHTML = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">☀️ Daily Devotional Cover</span>`;
    }
  }

  if (urlInput) urlInput.value = target.imageUrl && !target.imageUrl.startsWith('data:') ? target.imageUrl : '';

  updateCoverModalPreview(selectedCoverDataUrl);

  // Render presets
  if (presetsContainer) {
    presetsContainer.innerHTML = COVER_PRESETS.map((p, idx) => `
      <div onclick="selectPresetCover('${p.url}')" class="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 cursor-pointer hover:border-amber-500 transition-all aspect-video bg-slate-100 dark:bg-zinc-800">
        <img src="${p.url}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
          <span class="text-[10px] font-bold text-white leading-tight line-clamp-1">${p.name}</span>
        </div>
      </div>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeChangeCoverModal() {
  const modal = document.getElementById('change-cover-modal');
  if (modal) modal.classList.add('hidden');
  activeCoverTarget = null;
  selectedCoverDataUrl = null;
}

function updateCoverModalPreview(url) {
  const previewImg = document.getElementById('cover-modal-preview-img');
  const noPreviewBox = document.getElementById('cover-modal-no-preview');
  
  if (!previewImg || !noPreviewBox) return;

  if (url && url.trim() !== '') {
    previewImg.src = url.trim();
    previewImg.classList.remove('hidden');
    noPreviewBox.classList.add('hidden');
  } else {
    previewImg.src = '';
    previewImg.classList.add('hidden');
    noPreviewBox.classList.remove('hidden');
  }
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
  window.showToast?.("Preset banner selected. Click 'Save Cover Photo' to apply.", "info");
}

function handleCoverFileSelect(e) {
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
      height = maxHeight;
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
  window.showToast?.("Cover photo cleared. Click 'Save' to apply.", "info");
}

async function saveCoverPhoto() {
  if (!activeCoverTarget) return;

  const db = window.db;
  if (!db) {
    window.showToast?.("Database connection unavailable.", "error");
    return;
  }

  const finalImageUrl = selectedCoverDataUrl || '';
  const targetType = activeCoverTarget.type;
  const targetId = activeCoverTarget.id;

  const saveBtn = document.getElementById('btn-save-cover-photo');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerText = "Updating Cover...";
  }

  try {
    if (targetType === 'event') {
      const updateData = {
        imageUrl: finalImageUrl,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      // Update primary collection
      await db.collection('upcoming_events').doc(targetId).update(updateData).catch(async (e) => {
        // If not in upcoming_events, try set or try events collection
        await db.collection('events').doc(targetId).update(updateData);
      });

      // Also update mirror collection if exists
      await db.collection('events').doc(targetId).update(updateData).catch(() => {});

      window.soundEngine?.playSuccess?.();
      window.showToast?.("🎉 Event cover photo updated successfully!", "success");
    } else if (targetType === 'devotional') {
      const updateData = {
        imageUrl: finalImageUrl,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      // Update primary collection
      await db.collection('daily_devotionals').doc(targetId).update(updateData).catch(async (e) => {
        await db.collection('devotionals').doc(targetId).update(updateData);
      });

      // Also update mirror collection if exists
      await db.collection('devotionals').doc(targetId).update(updateData).catch(() => {});

      // Update local cache if available
      if (window.devotionalsCache && window.devotionalsCache[targetId]) {
        window.devotionalsCache[targetId].imageUrl = finalImageUrl;
      }

      window.soundEngine?.playSuccess?.();
      window.showToast?.("☀️ Devotional cover photo updated successfully!", "success");
    }

    closeChangeCoverModal();
  } catch (err) {
    console.error("Error saving cover photo:", err);
    window.showToast?.("Failed to update cover photo: " + err.message, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = "Save Cover Photo ✨";
    }
  }
}

// Global Exports
window.openChangeCoverModal = openChangeCoverModal;
window.closeChangeCoverModal = closeChangeCoverModal;
window.handleCoverUrlInput = handleCoverUrlInput;
window.handleCoverFileSelect = handleCoverFileSelect;
window.selectPresetCover = selectPresetCover;
window.clearCurrentCoverPhoto = clearCurrentCoverPhoto;
window.saveCoverPhoto = saveCoverPhoto;
window.COVER_PRESETS = COVER_PRESETS;
