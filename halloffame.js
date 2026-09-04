// halloffame.js
// Home.cell - Global Hall of Fame with Prominent Fellowship Identity Markers

let hofLeaderboardUnsubscribe = null;
let activeHofCategory = 'streak'; // 'streak' | 'chaptersRead' | 'quizWins'

function initHallOfFameModule() {
  syncGlobalHofLeaderboard();
}

window.setHofCategory = function(cat) {
  activeHofCategory = cat;
  const cats = ['streak', 'chaptersRead', 'quizWins'];
  cats.forEach(c => {
    const btn = document.getElementById(`hof-tab-${c}`);
    if (btn) {
      if (c === cat) {
        btn.className = "px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1.5";
      } else {
        btn.className = "px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1.5";
      }
    }
  });

  syncGlobalHofLeaderboard();
};

function syncGlobalHofLeaderboard() {
  if (hofLeaderboardUnsubscribe) hofLeaderboardUnsubscribe();

  const db = window.db;
  if (!db) return;

  hofLeaderboardUnsubscribe = db.collection('users').onSnapshot(snap => {
    let users = [];
    snap.forEach(doc => {
      const u = doc.data();
      users.push({ uid: doc.id, ...u });
    });

    renderGlobalHofView(users);
  }, err => console.warn("Global HOF error:", err));
}

function renderGlobalHofView(users) {
  const container = document.getElementById('hof-ranking-rows');
  const podiumContainer = document.getElementById('hof-podium-container');
  if (!container || !users) return;

  let sortField = 'streak';
  let unitLabel = 'Days';

  if (activeHofCategory === 'chaptersRead') {
    sortField = 'chaptersReadCount';
    unitLabel = 'Chapters';
  } else if (activeHofCategory === 'quizWins') {
    sortField = 'quizWinsCount';
    unitLabel = 'Wins';
  }

  // Sort descending by selected category
  users.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  // Render Podium (Top 3)
  if (podiumContainer) {
    const top3 = users.slice(0, 3);
    podiumContainer.innerHTML = top3.map((u, idx) => {
      const rank = idx + 1;
      const score = u[sortField] || 0;
      const rankBadge = rank === 1 ? '🥇 1st' : (rank === 2 ? '🥈 2nd' : '🥉 3rd');
      const badgeColor = rank === 1 ? 'border-amber-400 bg-amber-500/10 text-amber-500' : (rank === 2 ? 'border-slate-300 bg-slate-500/10 text-slate-400' : 'border-amber-700 bg-amber-700/10 text-amber-700');

      return `
        <div class="glass-panel rounded-3xl p-6 text-center space-y-3 border ${rank === 1 ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-zinc-800'} shadow-md flex flex-col justify-between">
          <div class="space-y-2">
            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${badgeColor}">
              ${rankBadge}
            </span>
            <div class="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 border-amber-400/60 bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
              ${u.photoURL ? `<img src="${u.photoURL}" class="w-full h-full object-cover" />` : (u.displayName || 'B').charAt(0).toUpperCase()}
            </div>
            <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">${u.displayName || 'Believer'}</h4>
            <!-- Prominent Fellowship Identity -->
            <div class="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
              <i data-lucide="home" class="w-3 h-3"></i>
              <span class="truncate">${u.activeFellowshipName || 'Home.cell Fellowship'}</span>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-zinc-800">
            <span class="font-mono font-black text-xl text-amber-500">${score.toLocaleString()}</span>
            <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">${unitLabel}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Full Ranking List
  container.innerHTML = users.map((u, idx) => {
    const rank = idx + 1;
    const score = u[sortField] || 0;
    const isCurrentUser = window.auth?.currentUser?.uid === u.uid;

    return `
      <div class="p-4 rounded-2xl glass-panel flex items-center justify-between gap-4 border ${
        isCurrentUser ? 'border-amber-400 bg-amber-500/5' : 'border-slate-200 dark:border-zinc-800'
      } shadow-xs">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-xl ${rank <= 3 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'} flex items-center justify-center font-bold text-xs shrink-0">
            #${rank}
          </div>
          <div class="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-800 bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            ${u.photoURL ? `<img src="${u.photoURL}" class="w-full h-full object-cover" />` : (u.displayName || 'B').charAt(0).toUpperCase()}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h5 class="font-black text-xs sm:text-sm text-slate-900 dark:text-zinc-100 truncate">${u.displayName || 'Believer'}</h5>
              ${isCurrentUser ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">You</span>' : ''}
            </div>
            <!-- Fellowship Identity Marker -->
            <div class="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 truncate">
              <i data-lucide="home" class="w-3 h-3 shrink-0"></i>
              <span class="truncate">${u.activeFellowshipName || 'Home.cell Fellowship'}</span>
            </div>
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="font-mono font-black text-sm sm:text-base text-amber-500">${score.toLocaleString()}</span>
          <span class="text-[10px] text-slate-400 block uppercase font-bold">${unitLabel}</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.initHallOfFameModule = initHallOfFameModule;
