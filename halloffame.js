// halloffame.js
// Home.cell - Hall of Fame, Multi-Category Rankings, Profile Avatar Manager & KC Audit Log

let hofLeaderboardUnsubscribe = null;
let hofTransactionsUnsubscribe = null;

let activeHofCategory = 'kingdomCoins';
let activeHofTimePeriod = 'alltime';

async function recordKcTransaction(type, amount, title, description) {
  const user = window.auth?.currentUser;
  if (!user || !amount || amount <= 0) return;

  const db = window.db;
  if (!db) return;

  try {
    const txnRef = db.collection('kc_transactions').doc();
    await txnRef.set({
      id: txnRef.id,
      userUid: user.uid,
      type: type,
      amount: amount,
      title: title,
      description: description || '',
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.warn("KC transaction log error:", e);
  }
}
window.recordKcTransaction = recordKcTransaction;

function initHallOfFameModule() {
  syncHofLeaderboard();
  syncMyProfileStatsCard();
  syncMyKcTransactionsLog();
}

function syncHofLeaderboard() {
  if (hofLeaderboardUnsubscribe) hofLeaderboardUnsubscribe();

  const db = window.db;
  if (!db) return;

  hofLeaderboardUnsubscribe = db.collection('users').onSnapshot(snap => {
    let users = [];
    snap.forEach(doc => {
      const u = doc.data();
      users.push({ uid: doc.id, ...u });
    });

    renderHofLeaderboardView(users);
  }, err => console.warn("HOF snapshot error:", err));
}

function renderHofLeaderboardView(users) {
  const podiumContainer = document.getElementById('hof-podium-container');
  const rowsContainer = document.getElementById('hof-ranking-rows');
  const myRankBanner = document.getElementById('hof-my-position-banner');

  if (!users || users.length === 0) return;

  let sortField = 'kingdomCoins';
  let unitLabel = 'KC';
  if (activeHofCategory === 'streak') { sortField = 'streak'; unitLabel = 'Days'; }
  else if (activeHofCategory === 'bibleChapters') { sortField = 'chaptersReadCount'; unitLabel = 'Chapters'; }
  else if (activeHofCategory === 'quizWins') { sortField = 'quizWinsCount'; unitLabel = 'Wins'; }
  else if (activeHofCategory === 'storePurchases') { sortField = 'storePurchases'; unitLabel = 'Purchases'; }
  else if (activeHofCategory === 'devotionals') { sortField = 'totalDevotions'; unitLabel = 'Devotions'; }

  users.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  const currentUserUid = window.auth?.currentUser?.uid;
  const myIndex = users.findIndex(u => u.uid === currentUserUid);

  if (myRankBanner && myIndex !== -1) {
    const myUser = users[myIndex];
    const myVal = myUser[sortField] || 0;
    const rankNum = myIndex + 1;
    const prevUser = users[myIndex - 1];
    const diffToPrev = prevUser ? ((prevUser[sortField] || 0) - myVal) + 1 : 0;

    myRankBanner.innerHTML = `
      <div class="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
            #${rankNum}
          </div>
          <div>
            <h4 class="font-extrabold text-sm text-amber-300">Your Rank: #${rankNum} of ${users.length} members</h4>
            <p class="text-xs text-slate-300 mt-0.5">
              ${myVal.toLocaleString()} ${unitLabel} ${diffToPrev > 0 ? `— You're <strong class="text-amber-400 font-mono">${diffToPrev} ${unitLabel}</strong> away from #${rankNum - 1}!` : '— You are at the very top! 🔥'}
            </p>
          </div>
        </div>

        <button onclick="switchTab('champions'); if(window.switchChampionsSubTab) window.switchChampionsSubTab('missions');" class="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-md">
          Complete Missions & Climb
        </button>
      </div>
    `;
  }

  if (podiumContainer) {
    const top1 = users[0];
    const top2 = users[1];
    const top3 = users[2];

    const renderPodiumCard = (user, rank, badge, bgGradient, hHeight) => {
      if (!user) return `
        <div class="flex-1 p-4 bg-slate-100 dark:bg-zinc-800/40 rounded-3xl text-center text-slate-400 opacity-60">
          <span class="text-2xl">${badge}</span>
          <p class="text-xs font-bold mt-1">Empty Slot</p>
        </div>
      `;

      const levelInfo = getChampionLevelInfo?.(user.kingdomCoins || 0) || { currentLevel: { name: 'Bronze Champion', badge: '🥉' } };
      const val = user[sortField] || 0;
      const avatar = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;

      return `
        <div class="flex-1 ${hHeight} bg-gradient-to-b ${bgGradient} border border-slate-200 dark:border-zinc-700/80 rounded-3xl p-5 flex flex-col items-center justify-between text-center shadow-lg relative overflow-hidden group">
          <div class="absolute top-3 right-3 text-2xl drop-shadow">${badge}</div>
          
          <div class="space-y-2 mt-2">
            <div class="relative w-16 h-16 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-md">
              <img src="${avatar}" alt="${user.displayName}" class="w-full h-full rounded-full object-cover bg-slate-800" />
            </div>
            <div>
              <h4 class="font-black text-slate-900 dark:text-zinc-100 text-sm line-clamp-1">${user.displayName || 'Believer'}</h4>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/20 dark:bg-zinc-950/40 text-amber-400">
                ${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}
              </span>
            </div>
          </div>

          <div class="w-full pt-3 border-t border-slate-900/10 dark:border-zinc-100/10 space-y-0.5">
            <span class="text-lg font-black font-mono text-slate-900 dark:text-zinc-50">${val.toLocaleString()}</span>
            <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">${unitLabel}</span>
          </div>
        </div>
      `;
    };

    podiumContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
        <div class="order-2 md:order-1">
          ${renderPodiumCard(top2, 2, '🥈', 'from-slate-100 via-slate-200 to-slate-300 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800', 'min-h-[220px]')}
        </div>
        <div class="order-1 md:order-2 -mt-2">
          ${renderPodiumCard(top1, 1, '🥇', 'from-amber-200 via-amber-300 to-yellow-400 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-900', 'min-h-[260px] border-amber-400')}
        </div>
        <div class="order-3 md:order-3">
          ${renderPodiumCard(top3, 3, '🥉', 'from-amber-800/20 via-amber-900/30 to-amber-950/40 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800', 'min-h-[200px]')}
        </div>
      </div>
    `;
  }

  if (rowsContainer) {
    const remaining = users.slice(3);

    if (remaining.length === 0) {
      rowsContainer.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">No additional members listed in rankings yet.</div>`;
      return;
    }

    rowsContainer.innerHTML = remaining.map((u, idx) => {
      const rank = idx + 4;
      const isMe = u.uid === currentUserUid;
      const val = u[sortField] || 0;
      const avatar = u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`;

      return `
        <div class="p-4 ${isMe ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'} border rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-8 font-black font-mono text-sm text-slate-400 text-center shrink-0">#${rank}</span>
            <img src="${avatar}" class="w-10 h-10 rounded-full object-cover bg-slate-800 shrink-0" />
            <div class="min-w-0 truncate">
              <h5 class="font-bold text-slate-900 dark:text-zinc-100 text-sm flex items-center gap-2 truncate">
                <span class="truncate">${u.displayName || 'Faith Member'}</span>
                ${isMe ? `<span class="px-2 py-0.5 rounded bg-purple-600 text-white text-[9px] font-black uppercase shrink-0">YOU</span>` : ''}
              </h5>
              <p class="text-[11px] text-slate-400">${u.role || 'Member'} • 🔥 ${u.streak || 0}d streak</p>
            </div>
          </div>

          <div class="text-right font-mono shrink-0">
            <span class="font-black text-sm text-slate-900 dark:text-zinc-100">${val.toLocaleString()}</span>
            <span class="block text-[9px] text-slate-400 uppercase font-bold">${unitLabel}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

function selectHofCategory(cat) {
  activeHofCategory = cat;
  const pills = document.querySelectorAll('.hof-category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === cat) {
      p.className = "hof-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer shadow-sm transition-all";
    } else {
      p.className = "hof-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all";
    }
  });
  syncHofLeaderboard();
}

function selectHofTimePeriod(period) {
  activeHofTimePeriod = period;
  const btns = document.querySelectorAll('.hof-time-btn');
  btns.forEach(b => {
    if (b.getAttribute('data-period') === period) {
      b.className = "hof-time-btn px-3 py-1.5 rounded-lg text-xs font-extrabold bg-purple-600 text-white cursor-pointer transition-all";
    } else {
      b.className = "hof-time-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all";
    }
  });
  syncHofLeaderboard();
}

// ---------------------------------------------------------------------------
// PROFILE PICTURE UPDATE & PERSISTENCE
// ---------------------------------------------------------------------------
function syncMyProfileStatsCard() {
  const container = document.getElementById('my-profile-stats-card');
  if (!container) return;

  const user = window.auth?.currentUser;
  if (!user) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Sign in to view your profile statistics.</p>`;
    return;
  }

  const p = window.currentUserProfile || {};
  const kc = p.kingdomCoins || 0;
  const avatar = p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;
  const levelInfo = getChampionLevelInfo?.(kc) || { currentLevel: { name: 'Bronze Champion', badge: '🥉' } };

  container.innerHTML = `
    <div class="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-6 shadow-xs">
      <div class="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <!-- Avatar + Live Change Button -->
        <div class="relative group shrink-0">
          <img id="my-profile-avatar-img" src="${avatar}" class="w-20 h-20 rounded-full object-cover bg-slate-800 border-2 border-amber-400 shadow-md" />
          <label for="profile-avatar-file-input" class="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95" title="Change Profile Picture">
            <i data-lucide="camera" class="w-4 h-4"></i>
          </label>
          <input type="file" id="profile-avatar-file-input" accept="image/*" onchange="handleProfileAvatarUpload(event)" class="hidden" />
        </div>

        <div class="space-y-1 flex-1 min-w-0">
          <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h3 class="text-xl font-black text-slate-900 dark:text-zinc-100">${p.displayName || user.displayName || 'Member'}</h3>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
              ${p.role || 'Member'}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 truncate">${user.email}</p>
          <span class="text-xs font-bold text-amber-500 block">${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div class="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kingdom Coins</span>
          <span class="text-lg font-black font-mono text-amber-500">${kc.toLocaleString()} KC</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Streak</span>
          <span class="text-lg font-black font-mono text-blue-500">🔥 ${p.streak || 0}d</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Bible Chapters</span>
          <span class="text-lg font-black font-mono text-purple-500">📖 ${p.chaptersReadCount || 0}</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quiz Victories</span>
          <span class="text-lg font-black font-mono text-emerald-500">🏆 ${p.quizWinsCount || 0}</span>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

async function handleProfileAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 8 * 1024 * 1024) {
    window.showToast?.("This image is too large. Please choose an image under 8MB.", "warning");
    event.target.value = '';
    return;
  }

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to update profile photo.", "error");
    return;
  }

  window.showToast?.("Optimizing and updating profile picture...", "info");

  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const rawDataUrl = e.target.result;
      
      // Client-side canvas compression to ensure safe Firestore document sizing (< 800KB)
      const img = new Image();
      img.onload = async function() {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Update local DOM preview immediately
        const avatarImg = document.getElementById('my-profile-avatar-img');
        if (avatarImg) avatarImg.src = compressedDataUrl;

        const headerAvatar = document.getElementById('header-avatar-circle');
        if (headerAvatar) {
          headerAvatar.innerHTML = `<img src="${compressedDataUrl}" class="w-full h-full rounded-xl object-cover" /><span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"></span>`;
        }

        // Persist to user's Firestore document
        const db = window.db;
        if (db) {
          await db.collection('users').doc(user.uid).update({
            photoURL: compressedDataUrl,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });

          if (window.currentUserProfile) window.currentUserProfile.photoURL = compressedDataUrl;
          window.showToast?.("🎉 Profile picture updated successfully!", "success");
          syncHofLeaderboard();
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error("Avatar update error:", err);
    window.showToast?.("Failed to update profile picture: " + err.message, "error");
  }
}
window.handleProfileAvatarUpload = handleProfileAvatarUpload;

// ---------------------------------------------------------------------------
// KINGDOM COIN AUDIT TRAIL LOG
// ---------------------------------------------------------------------------
function syncMyKcTransactionsLog() {
  const container = document.getElementById('my-kc-transactions-list');
  if (!container) return;

  const user = window.auth?.currentUser;
  if (!user) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Sign in to view your Kingdom Coin transaction history.</p>`;
    return;
  }

  if (hofTransactionsUnsubscribe) hofTransactionsUnsubscribe();

  const db = window.db;
  if (!db) return;

  hofTransactionsUnsubscribe = db.collection('kc_transactions')
    .where('userUid', '==', user.uid)
    .onSnapshot(snap => {
      if (snap.empty) {
        container.innerHTML = `
          <div class="text-center py-6 text-slate-400 text-xs">
            No coin transactions recorded yet. Earn coins by reading scriptures, taking quizzes, and completing daily missions!
          </div>
        `;
        return;
      }

      const txns = [];
      snap.forEach(doc => txns.push({ id: doc.id, ...doc.data() }));
      txns.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      container.innerHTML = txns.map(t => {
        const isCredit = t.type === 'credit';
        const formattedDate = t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';

        return `
          <div class="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
            <div class="space-y-0.5">
              <h5 class="font-bold text-slate-900 dark:text-zinc-100">${t.title || 'Kingdom Transaction'}</h5>
              <p class="text-[11px] text-slate-400">${t.description || ''} • <span class="font-mono text-[10px]">${formattedDate}</span></p>
            </div>

            <span class="font-black font-mono text-sm ${isCredit ? 'text-emerald-500' : 'text-amber-500'}">
              ${isCredit ? '+' : '-'}${t.amount} KC
            </span>
          </div>
        `;
      }).join('');

    }, err => console.warn("KC txns snapshot error:", err));
}

window.initHallOfFameModule = initHallOfFameModule;
window.selectHofCategory = selectHofCategory;
window.selectHofTimePeriod = selectHofTimePeriod;
