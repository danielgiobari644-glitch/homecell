// profile.js
// Home.cell - Believer Profile, Fellowship Memberships & Roles, Cloudinary Photo Upload & Spiritual Milestones

window.initProfileModule = function() {
  syncProfileData();
};

window.syncProfileData = function() {
  const user = window.auth?.currentUser;
  const profile = window.currentUserProfile;

  const nameEl = document.getElementById('profile-user-name');
  const emailEl = document.getElementById('profile-user-email');
  const roleEl = document.getElementById('profile-user-role');
  const avatarEl = document.getElementById('profile-user-avatar');
  const bioEl = document.getElementById('profile-user-bio');
  const phoneEl = document.getElementById('profile-user-phone');

  const statStreakEl = document.getElementById('profile-stat-streak');
  const statChaptersEl = document.getElementById('profile-stat-chapters');
  const statQuizWinsEl = document.getElementById('profile-stat-quiz-wins');
  const statFellowshipsEl = document.getElementById('profile-stat-fellowships');

  if (!user) {
    if (nameEl) nameEl.innerText = "Guest Believer";
    if (emailEl) emailEl.innerText = "Sign in to access your spiritual sanctuary";
    return;
  }

  const dName = profile?.displayName || user.displayName || user.email.split('@')[0];
  const photo = profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;
  const bio = profile?.bio || "Walking in faith, abiding in fellowship.";
  const phone = profile?.phone || "";

  if (nameEl) nameEl.innerText = dName;
  if (emailEl) emailEl.innerText = user.email;
  if (roleEl) roleEl.innerText = window.currentUserRole || 'Member';
  if (bioEl) bioEl.innerText = bio;
  if (phoneEl) phoneEl.innerText = phone;

  if (avatarEl) {
    avatarEl.innerHTML = `<img src="${photo}" class="w-full h-full object-cover rounded-full" />`;
  }

  // Edit fields
  const editName = document.getElementById('profile-edit-name');
  const editBio = document.getElementById('profile-edit-bio');
  const editPhone = document.getElementById('profile-edit-phone');
  if (editName) editName.value = dName;
  if (editBio) editBio.value = bio;
  if (editPhone) editPhone.value = phone;

  // Stats
  if (statStreakEl) statStreakEl.innerText = `${profile?.streak || 1} Days`;
  if (statChaptersEl) statChaptersEl.innerText = `${profile?.chaptersReadCount || 0}`;
  if (statQuizWinsEl) statQuizWinsEl.innerText = `${profile?.quizWinsCount || 0}`;
  if (statFellowshipsEl) statFellowshipsEl.innerText = `${(window.userMemberships || []).length}`;

  // Fellowships list
  renderProfileFellowships();
  loadUserSavedNotes();
};

function renderProfileFellowships() {
  const container = document.getElementById('profile-fellowships-list');
  if (!container) return;

  const memberships = window.userMemberships || [];
  if (memberships.length === 0) {
    container.innerHTML = `
      <div class="glass-panel rounded-2xl p-6 text-center text-slate-400 text-xs">
        <p class="font-bold">You have not joined any Home Fellowship yet.</p>
        <button onclick="window.showDiscoveryView()" class="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all">
          Find Your Home Fellowship
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = memberships.map(m => {
    const isActive = m.fellowshipId === window.activeFellowshipId;
    const roleBadge = m.role === 'leader' ? '👑 Cell Leader' : (m.role === 'moderator' ? '🛡️ Moderator' : '👤 Member');
    const roleColor = m.role === 'leader' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : (m.role === 'moderator' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400');

    return `
      <div class="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border ${
        isActive ? 'border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20' : 'border-slate-200 dark:border-zinc-800'
      } shadow-xs">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">${m.fellowshipName || 'Home Fellowship'}</h4>
            ${isActive ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">Active</span>' : ''}
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">${m.fellowshipMotto || 'Faith • Fellowship • Growth'}</p>
          <div class="pt-1">
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${roleColor}">${roleBadge}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          ${!isActive ? `
            <button onclick="window.switchActiveFellowship('${m.fellowshipId}')" class="px-3.5 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer">
              Switch
            </button>
          ` : ''}
          <button onclick="window.leaveFellowship('${m.fellowshipId}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer" title="Leave Fellowship">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Cloudinary Avatar Upload
window.handleProfileAvatarUpload = async function(e) {
  const file = e.target?.files?.[0];
  const user = window.auth?.currentUser;
  if (!file || !user) return;

  const progressEl = document.getElementById('profile-avatar-upload-status');
  if (progressEl) {
    progressEl.classList.remove('hidden');
    progressEl.innerText = "Uploading avatar to Cloudinary...";
  }

  try {
    const uploadRes = await window.uploadToCloudinary(file, 'homecell/profiles', (percent) => {
      if (progressEl) progressEl.innerText = `Uploading: ${percent}%`;
    });

    const newPhotoUrl = uploadRes.url;

    // Update in Firestore
    await window.db.collection('users').doc(user.uid).update({
      photoURL: newPhotoUrl
    });

    // Also update auth user profile if supported
    await user.updateProfile({ photoURL: newPhotoUrl }).catch(() => {});

    if (window.currentUserProfile) {
      window.currentUserProfile.photoURL = newPhotoUrl;
    }

    if (progressEl) {
      progressEl.innerText = "Avatar updated!";
      setTimeout(() => progressEl.classList.add('hidden'), 2000);
    }

    syncProfileData();
    window.showToast?.("Profile photo updated successfully!", "success");
  } catch (err) {
    console.error("Avatar upload error:", err);
    if (progressEl) progressEl.innerText = "Upload failed: " + err.message;
    window.showToast?.("Failed to upload photo: " + err.message, "error");
  }
};

window.saveProfileDetails = async function(e) {
  if (e) e.preventDefault();
  const user = window.auth?.currentUser;
  if (!user) return;

  const name = document.getElementById('profile-edit-name')?.value.trim();
  const bio = document.getElementById('profile-edit-bio')?.value.trim();
  const phone = document.getElementById('profile-edit-phone')?.value.trim();

  if (!name) {
    window.showToast?.("Name cannot be empty.", "error");
    return;
  }

  try {
    await window.db.collection('users').doc(user.uid).update({
      displayName: name,
      bio: bio,
      phone: phone
    });

    await user.updateProfile({ displayName: name }).catch(() => {});

    if (window.currentUserProfile) {
      window.currentUserProfile.displayName = name;
      window.currentUserProfile.bio = bio;
      window.currentUserProfile.phone = phone;
    }

    syncProfileData();
    window.closeProfileEditModal();
    window.showToast?.("Profile details saved.", "success");
  } catch (err) {
    console.error("Save profile error:", err);
    window.showToast?.("Failed to save: " + err.message, "error");
  }
};

window.openProfileEditModal = function() {
  document.getElementById('profile-edit-modal')?.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.closeProfileEditModal = function() {
  document.getElementById('profile-edit-modal')?.classList.add('hidden');
};

function loadUserSavedNotes() {
  const container = document.getElementById('profile-notes-list');
  const user = window.auth?.currentUser;
  if (!container || !user) return;

  window.db.collection('user_notes')
    .where('userUid', '==', user.uid)
    .limit(10)
    .get()
    .then(snap => {
      if (snap.empty) {
        container.innerHTML = `<div class="text-slate-400 text-xs text-center py-4">No personal study notes yet. Use the Bible study tab to save verse reflections.</div>`;
        return;
      }
      container.innerHTML = snap.docs.map(d => {
        const n = d.data();
        return `
          <div class="p-3.5 rounded-2xl glass-panel border border-slate-200 dark:border-zinc-800 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-black text-xs text-blue-600 dark:text-blue-400">${n.verseReference || 'Scripture Note'}</span>
              <span class="text-[10px] text-slate-400 font-mono">${n.date || ''}</span>
            </div>
            <p class="text-xs text-slate-700 dark:text-zinc-300">${n.noteText || ''}</p>
          </div>
        `;
      }).join('');
    }).catch(() => {});
}
