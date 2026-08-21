// profile.js
// Believer Profile, Spiritual Progress Statistics & Unlocked Christian Library

let profileRewardsListener = null;

window.initProfileModule = function() {
  syncProfileData();
};

window.syncProfileData = function() {
  const user = window.auth?.currentUser;
  const db = window.db;

  const nameEl = document.getElementById('profile-user-name');
  const emailEl = document.getElementById('profile-user-email');
  const roleEl = document.getElementById('profile-user-role');
  const avatarEl = document.getElementById('profile-user-avatar');
  const joinedEl = document.getElementById('profile-user-joined');
  const refCodeEl = document.getElementById('profile-referral-code');
  const refLinkInput = document.getElementById('profile-referral-link-input');
  const refCountEl = document.getElementById('profile-stat-referrals');

  const statKcEl = document.getElementById('profile-stat-kc');
  const statStreakEl = document.getElementById('profile-stat-streak');
  const statQuizWinsEl = document.getElementById('profile-stat-quiz-wins');
  const statLibraryCountEl = document.getElementById('profile-stat-library-count');

  if (!user) {
    if (nameEl) nameEl.innerText = "Guest Believer";
    if (emailEl) emailEl.innerText = "Sign in to save your spiritual journey";
    if (roleEl) roleEl.innerText = "Guest";
    if (avatarEl) avatarEl.innerText = "✝";
    if (statKcEl) statKcEl.innerText = "0 KC";
    if (statStreakEl) statStreakEl.innerText = "0 Days";
    if (statQuizWinsEl) statQuizWinsEl.innerText = "0";
    if (statLibraryCountEl) statLibraryCountEl.innerText = "0 Items";
    if (refCodeEl) refCodeEl.innerText = "SIGNIN";
    if (refLinkInput) refLinkInput.value = `${window.location.origin}${window.location.pathname}?r=SIGNIN`;
    if (refCountEl) refCountEl.innerText = "0";
    renderProfileLibrary([]);
    return;
  }

  const displayName = user.displayName || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  if (nameEl) nameEl.innerText = displayName;
  if (emailEl) emailEl.innerText = user.email;
  if (avatarEl) {
    if (user.photoURL) {
      avatarEl.innerHTML = `<img src="${user.photoURL}" class="w-full h-full object-cover" />`;
    } else {
      avatarEl.innerText = initial;
    }
  }

  const nameInput = document.getElementById('profile-edit-name-input');
  if (nameInput) nameInput.value = displayName;

  if (db) {
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        const code = data.referralCode || user.uid.substring(0, 7).toUpperCase();
        const fullLink = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;

        if (roleEl) roleEl.innerText = data.role || 'Member';
        if (statKcEl) statKcEl.innerText = `${(data.kingdomCoins || 0).toLocaleString()} KC`;
        if (statStreakEl) statStreakEl.innerText = `${data.streak || data.streakDays || 1} Days`;
        if (statQuizWinsEl) statQuizWinsEl.innerText = `${data.quizWinsCount || 0}`;
        if (refCodeEl) refCodeEl.innerText = code;
        if (refLinkInput) refLinkInput.value = fullLink;
        if (refCountEl) refCountEl.innerText = `${data.totalReferrals || data.referralsCount || 0}`;

        if (joinedEl && data.createdAt) {
          try {
            const d = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            joinedEl.innerText = `Believer since ${d.toLocaleDateString([], { month: 'short', year: 'numeric' })}`;
          } catch (e) {}
        }
      }
    }).catch(e => console.warn("Error loading profile details:", e));

    // Listen to purchased library from both user_rewards collection and subcollection
    if (profileRewardsListener) profileRewardsListener();
    profileRewardsListener = db.collection('user_rewards')
      .where('userUid', '==', user.uid)
      .onSnapshot(snap => {
        let items = [];
        if (!snap.empty) {
          snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        }
        if (statLibraryCountEl) statLibraryCountEl.innerText = `${items.length} Items`;
        renderProfileLibrary(items);
      }, err => {
        console.warn("Profile library listener fallback note:", err);
        // Fallback to subcollection
        db.collection('users').doc(user.uid).collection('user_rewards').get().then(subSnap => {
          let subItems = [];
          if (!subSnap.empty) {
            subSnap.forEach(d => subItems.push({ id: d.id, ...d.data() }));
          }
          if (statLibraryCountEl) statLibraryCountEl.innerText = `${subItems.length} Items`;
          renderProfileLibrary(subItems);
        }).catch(() => {});
      });
  }
};

function renderProfileLibrary(items) {
  const container = document.getElementById('profile-library-container');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-400 dark:text-zinc-500 bg-white/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-6">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 text-xl font-black">
          🎁
        </div>
        <h4 class="font-black text-sm text-slate-800 dark:text-zinc-200">No Unlocked Resources Yet</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">Visit the Kingdom Store to redeem Christian wallpapers, Bible study PDF guides, and worship bundles with your KC!</p>
        <button onclick="switchTab('store')" class="mt-4 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-102 transition-all cursor-pointer">
          Explore Kingdom Store →
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      ${items.map(item => `
        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-black uppercase">Unlocked</span>
              <span class="text-[10px] text-slate-400 font-mono">${item.purchasedAt?.toDate ? item.purchasedAt.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Saved'}</span>
            </div>
            <h4 class="font-black text-xs text-slate-900 dark:text-zinc-100 line-clamp-1">${item.title || item.resourceTitle || 'Kingdom Resource'}</h4>
            <p class="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">${item.description || 'Spiritual discipleship resource from Kingdom Store.'}</p>
          </div>
          <button onclick="window.downloadPurchasedResource('${item.rewardId || item.id}', '${encodeURIComponent(item.title || 'resource')}')" class="w-full py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-zinc-800 dark:hover:bg-emerald-600 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Download Asset</span>
          </button>
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

window.saveProfileName = async function(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('profile-edit-name-input');
  if (!input) return;

  const newName = input.value.trim();
  if (!newName) {
    window.showToast?.("Please enter a valid display name", "warning");
    return;
  }

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in first", "warning");
    return;
  }

  try {
    await user.updateProfile({ displayName: newName });
    if (window.db) {
      await window.db.collection('users').doc(user.uid).update({
        displayName: newName,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    window.showToast?.("Profile name updated successfully!", "success");
    window.syncProfileData();
    if (window.syncHeaderUserUI) window.syncHeaderUserUI();
  } catch (error) {
    console.error("Failed to update profile name:", error);
    window.showToast?.("Could not update name: " + error.message, "error");
  }
};

window.copyReferralCode = function() {
  const linkInput = document.getElementById('profile-referral-link-input');
  const codeEl = document.getElementById('profile-referral-code');
  const code = codeEl ? codeEl.innerText.trim() : '';
  const url = linkInput && linkInput.value ? linkInput.value : (window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`);

  if (window.copyReferralLink) {
    window.copyReferralLink(code);
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      window.showToast?.(`📋 Whole Referral Link copied to clipboard! Share with friends to give & receive Kingdom Coins!`, "success");
    }).catch(() => {
      fallbackCopy(url);
    });
  } else {
    fallbackCopy(url);
  }
};

window.copyReferralLink = function(explicitCode) {
  const codeEl = document.getElementById('profile-referral-code');
  const code = explicitCode || (codeEl ? codeEl.innerText.trim() : '') || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      window.showToast?.(`📋 Whole Referral Link copied to clipboard! Share with friends to give & receive Kingdom Coins!`, "success");
    }).catch(() => {
      fallbackCopy(url);
    });
  } else {
    fallbackCopy(url);
  }
};

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  window.showToast?.(`📋 Referral Link copied!`, "success");
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.auth) {
    window.auth.onAuthStateChanged(() => {
      window.syncProfileData();
    });
  }
});
