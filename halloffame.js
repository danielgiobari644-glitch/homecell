// halloffame.js
// Home.cell - Hall of Fame, Multi-Category Leaderboards, Profiles & KC Audit Log

let hofLeaderboardUnsubscribe = null;
let hofTransactionsUnsubscribe = null;

let activeHofCategory = 'kingdomCoins'; // 'kingdomCoins' | 'streak' | 'bibleChapters' | 'quizWins' | 'storePurchases' | 'devotionals'
let activeHofTimePeriod = 'alltime'; // 'today' | 'weekly' | 'monthly' | 'alltime'

// Global Helper: Transparently log Kingdom Coin Transactions into Firestore
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
      type: type, // "credit" or "debit"
      amount: amount,
      title: title,
      description: description || '',
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.warn("KC transaction log error:", e);
  }
}

// Module Initializer
function initHallOfFameModule() {
  syncHofLeaderboard();
  syncMyProfileStatsCard();
  syncMyKcTransactionsLog();
}

// 1. Sync Hall of Fame Leaderboard
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

// Render Hall of Fame Podium & Ranking List
function renderHofLeaderboardView(users) {
  const podiumContainer = document.getElementById('hof-podium-container');
  const rowsContainer = document.getElementById('hof-ranking-rows');
  const myRankBanner = document.getElementById('hof-my-position-banner');

  if (!users || users.length === 0) return;

  // Field mapper based on active category
  let sortField = 'kingdomCoins';
  let unitLabel = 'KC';
  if (activeHofCategory === 'streak') { sortField = 'streakCount'; unitLabel = 'Days'; }
  else if (activeHofCategory === 'bibleChapters') { sortField = 'chaptersReadCount'; unitLabel = 'Chapters'; }
  else if (activeHofCategory === 'quizWins') { sortField = 'quizWinsCount'; unitLabel = 'Wins'; }
  else if (activeHofCategory === 'storePurchases') { sortField = 'storePurchases'; unitLabel = 'Purchases'; }
  else if (activeHofCategory === 'devotionals') { sortField = 'devotionalsCompletedCount'; unitLabel = 'Completed'; }

  // Sort descending
  users.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  const currentUserUid = window.auth?.currentUser?.uid;
  const myIndex = users.findIndex(u => u.uid === currentUserUid);

  // Render My Position Banner
  if (myRankBanner && myIndex !== -1) {
    const myUser = users[myIndex];
    const myVal = myUser[sortField] || 0;
    const rankNum = myIndex + 1;
    const prevUser = users[myIndex - 1];
    const diffToPrev = prevUser ? ((prevUser[sortField] || 0) - myVal) + 1 : 0;

    myRankBanner.innerHTML = `
      <div class="p-4 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 border border-purple-500/40 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
            #${rankNum}
          </div>
          <div>
            <h4 class="font-extrabold text-sm text-amber-300">Your Current Rank: #${rankNum} of ${users.length}</h4>
            <p class="text-xs text-slate-300 mt-0.5">
              ${myVal.toLocaleString()} ${unitLabel} ${diffToPrev > 0 ? `— You're <strong class="text-amber-400">${diffToPrev} ${unitLabel}</strong> away from #${rankNum - 1}!` : '— You are at the top! 🔥'}
            </p>
          </div>
        </div>

        <button onclick="switchTab('champions')" class="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0">
          Climb Rankings
        </button>
      </div>
    `;
  }

  // Render Top 3 Podium (#1 Gold, #2 Silver, #3 Bronze)
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
              <h4 class="font-black text-slate-900 dark:text-zinc-100 text-sm line-clamp-1">${user.displayName || 'Warrior'}</h4>
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
        <!-- Rank #2 Silver -->
        <div class="order-2 md:order-1">
          ${renderPodiumCard(top2, 2, '🥈', 'from-slate-100 via-slate-200 to-slate-300 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800', 'min-h-[220px]')}
        </div>

        <!-- Rank #1 Gold (Taller) -->
        <div class="order-1 md:order-2 -mt-2">
          ${renderPodiumCard(top1, 1, '🥇', 'from-amber-200 via-amber-300 to-yellow-400 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-900', 'min-h-[260px] border-amber-400')}
        </div>

        <!-- Rank #3 Bronze -->
        <div class="order-3 md:order-3">
          ${renderPodiumCard(top3, 3, '🥉', 'from-amber-800/20 via-amber-900/30 to-amber-950/40 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800', 'min-h-[200px]')}
        </div>
      </div>
    `;
  }

  // Render Remaining Leaderboard Rows (#4+)
  if (rowsContainer) {
    const remaining = users.slice(3);

    if (remaining.length === 0) {
      rowsContainer.innerHTML = `
        <div class="text-center py-6 text-slate-400 text-xs">
          No additional members listed in rankings yet.
        </div>
      `;
      return;
    }

    rowsContainer.innerHTML = remaining.map((u, idx) => {
      const rank = idx + 4;
      const isMe = u.uid === currentUserUid;
      const val = u[sortField] || 0;
      const avatar = u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`;

      return `
        <div class="p-4 ${isMe ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'} border rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
          <div class="flex items-center gap-3">
            <span class="w-8 font-black font-mono text-sm text-slate-400 text-center">#${rank}</span>
            <img src="${avatar}" class="w-10 h-10 rounded-full object-cover bg-slate-800 shrink-0" />
            <div>
              <h5 class="font-bold text-slate-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                ${u.displayName || 'Faith Warrior'}
                ${isMe ? `<span class="px-2 py-0.5 rounded bg-purple-600 text-white text-[9px] font-black uppercase">YOU</span>` : ''}
              </h5>
              <p class="text-[11px] text-slate-400">${u.role || 'Member'} • 🔥 ${u.streakCount || 0}d streak</p>
            </div>
          </div>

          <div class="text-right font-mono">
            <span class="font-black text-sm text-slate-900 dark:text-zinc-100">${val.toLocaleString()}</span>
            <span class="block text-[9px] text-slate-400 uppercase font-bold">${unitLabel}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Select Leaderboard Category Filter
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

// Select Leaderboard Time Period Filter
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
// 2. PROFILE & AVATAR MANAGER
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
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <!-- Avatar + Edit Button -->
        <div class="relative group">
          <img id="my-profile-avatar-img" src="${avatar}" class="w-20 h-20 rounded-full object-cover bg-slate-800 border-2 border-amber-400 shadow-md" />
          <label for="profile-avatar-file-input" class="absolute bottom-0 right-0 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full cursor-pointer shadow-md transition-all">
            <i data-lucide="camera" class="w-3.5 h-3.5"></i>
          </label>
          <input type="file" id="profile-avatar-file-input" accept="image/*" onchange="handleProfileAvatarUpload(event)" class="hidden" />
        </div>

        <div class="space-y-1">
          <div class="flex items-center justify-center sm:justify-start gap-2">
            <h3 class="text-xl font-black text-slate-900 dark:text-zinc-100">${p.displayName || user.displayName || 'Faith Warrior'}</h3>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
              ${p.role || 'Member'}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400">${user.email}</p>
          <span class="text-xs font-bold text-amber-500 block">${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div class="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Coins</span>
          <span class="text-lg font-black font-mono text-amber-500">${kc.toLocaleString()} KC</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Streak</span>
          <span class="text-lg font-black font-mono text-blue-500">🔥 ${p.streakCount || 0}d</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chapters</span>
          <span class="text-lg font-black font-mono text-purple-500">📖 ${p.chaptersReadCount || 0}</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quizzes</span>
          <span class="text-lg font-black font-mono text-emerald-500">📝 ${p.quizWinsCount || 0}</span>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// Handle Profile Avatar Upload
function handleProfileAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    const avatarImg = document.getElementById('my-profile-avatar-img');
    if (avatarImg) avatarImg.src = dataUrl;

    const user = window.auth?.currentUser;
    if (!user) return;

    window.showToast?.("Updating profile picture...", "info");

    const db = window.db;
    if (db) {
      try {
        await db.collection('users').doc(user.uid).update({
          photoURL: dataUrl
        });

        if (window.currentUserProfile) window.currentUserProfile.photoURL = dataUrl;
        window.showToast?.("Profile picture updated successfully!", "success");
        syncHofLeaderboard();
      } catch (err) {
        console.error("Avatar update error:", err);
        window.showToast?.("Failed to update profile picture.", "error");
      }
    }
  };
  reader.readAsDataURL(file);
}

// ---------------------------------------------------------------------------
// 3. KINGDOM COIN AUDIT TRAIL (`kc_transactions`)
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
            No coin transactions recorded yet. Earn coins by reading scriptures and taking quizzes!
          </div>
        `;
        return;
      }

      const txns = [];
      snap.forEach(doc => txns.push({ id: doc.id, ...doc.data() }));
      txns.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      container.innerHTML = txns.map(t => {
        const isCredit = t.type === 'credit';
        return `
          <div class="p-3.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
            <div class="space-y-0.5">
              <h5 class="font-bold text-slate-900 dark:text-zinc-100">${t.title || 'Kingdom Transaction'}</h5>
              <p class="text-[11px] text-slate-400">${t.description || ''}</p>
            </div>

            <span class="font-black font-mono text-sm ${isCredit ? 'text-emerald-500' : 'text-amber-500'}">
              ${isCredit ? '+' : '-'}${t.amount} KC
            </span>
          </div>
        `;
      }).join('');

    }, err => console.warn("KC txns snapshot error:", err));
}

// Exports
window.recordKcTransaction = recordKcTransaction;
window.initHallOfFameModule = initHallOfFameModule;
window.selectHofCategory = selectHofCategory;
window.selectHofTimePeriod = selectHofTimePeriod;
window.handleProfileAvatarUpload = handleProfileAvatarUpload;
