// halloffame.js
// Home.cell - Global Hall of Fame with Verified Real Fellowship Identity Markers

let hofUsersUnsubscribe = null;
let hofMembershipsUnsubscribe = null;
let hofFellowshipsUnsubscribe = null;
let activeHofCategory = 'streak'; // 'streak' | 'chaptersRead' | 'quizWins'
let rawHofUsers = [];
let userFellowshipMap = {}; // { [userId]: { fellowshipId, fellowshipName, role, city } }

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

  renderGlobalHofView(rawHofUsers);
};

function syncGlobalHofLeaderboard() {
  const db = window.db;
  if (!db) return;

  // Clean up any existing listeners
  if (hofUsersUnsubscribe) hofUsersUnsubscribe();
  if (hofMembershipsUnsubscribe) hofMembershipsUnsubscribe();
  if (hofFellowshipsUnsubscribe) hofFellowshipsUnsubscribe();

  // 1. Listen to all memberships to map members to their real home fellowship
  hofMembershipsUnsubscribe = db.collection('memberships').onSnapshot(snap => {
    userFellowshipMap = {};
    snap.forEach(doc => {
      const m = doc.data();
      if (m.userId && m.fellowshipName) {
        // Prefer leader role if user has multiple memberships
        if (!userFellowshipMap[m.userId] || m.role === 'leader') {
          userFellowshipMap[m.userId] = {
            fellowshipId: m.fellowshipId,
            fellowshipName: m.fellowshipName,
            role: m.role || 'member'
          };
        }
      }
    });

    // Also enrich with fellowships list (e.g. city, leaderId)
    enrichFellowshipMapWithCells();

    if (rawHofUsers.length > 0) {
      renderGlobalHofView(rawHofUsers);
    }
  }, err => console.warn("Leaderboard memberships sync error:", err));

  // 2. Listen to fellowships to map cell leaders and details
  hofFellowshipsUnsubscribe = db.collection('fellowships').onSnapshot(snap => {
    const list = [];
    snap.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    window.allFellowships = list;
    enrichFellowshipMapWithCells();
    if (rawHofUsers.length > 0) {
      renderGlobalHofView(rawHofUsers);
    }
  }, err => console.warn("Leaderboard fellowships sync error:", err));

  // 3. Listen to users for rankings
  hofUsersUnsubscribe = db.collection('users').onSnapshot(snap => {
    const users = [];
    snap.forEach(doc => {
      const u = doc.data();
      users.push({ uid: doc.id, ...u });
    });

    rawHofUsers = users;
    renderGlobalHofView(rawHofUsers);
  }, err => console.warn("Global HOF error:", err));
}

function enrichFellowshipMapWithCells() {
  const cells = window.allFellowships || [];
  cells.forEach(f => {
    if (f.leaderId) {
      userFellowshipMap[f.leaderId] = {
        fellowshipId: f.id,
        fellowshipName: f.name,
        role: 'leader',
        city: f.city || ''
      };
    }
    // Enrich existing memberships with city if matching
    Object.keys(userFellowshipMap).forEach(uid => {
      if (userFellowshipMap[uid].fellowshipId === f.id) {
        userFellowshipMap[uid].fellowshipName = f.name;
        if (f.city) userFellowshipMap[uid].city = f.city;
      }
    });
  });
}

function resolveUserFellowship(u) {
  // 1. Direct membership lookup (highest fidelity)
  const mem = userFellowshipMap[u.uid];
  if (mem && mem.fellowshipName) {
    return {
      name: mem.fellowshipName,
      role: mem.role || 'member',
      city: mem.city || ''
    };
  }

  // 2. Check if user is leader in window.allFellowships
  const cells = window.allFellowships || [];
  const ledCell = cells.find(f => f.leaderId === u.uid);
  if (ledCell) {
    return {
      name: ledCell.name,
      role: 'leader',
      city: ledCell.city || ''
    };
  }

  // 3. Check active fellowship stored on user profile
  if (u.activeFellowshipName) {
    const fObj = cells.find(f => f.id === u.activeFellowshipId);
    return {
      name: u.activeFellowshipName,
      role: u.activeFellowshipRole || 'member',
      city: fObj?.city || ''
    };
  }

  // 4. Check if user is in window.userMemberships if current user
  if (window.auth?.currentUser?.uid === u.uid && window.activeFellowship) {
    return {
      name: window.activeFellowship.name,
      role: window.activeFellowshipRole || 'member',
      city: window.activeFellowship.city || ''
    };
  }

  // 5. Fallback for new believers
  return {
    name: 'Home Fellowship Believer',
    role: 'member',
    city: ''
  };
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

  // Copy and sort descending by selected category
  const sorted = [...users].sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  // Render Podium (Top 3)
  if (podiumContainer) {
    const top3 = sorted.slice(0, 3);
    podiumContainer.innerHTML = top3.map((u, idx) => {
      const rank = idx + 1;
      const score = u[sortField] || 0;
      const rankBadge = rank === 1 ? '🥇 1st' : (rank === 2 ? '🥈 2nd' : '🥉 3rd');
      const badgeColor = rank === 1 ? 'border-amber-400 bg-amber-500/10 text-amber-500' : (rank === 2 ? 'border-slate-300 bg-slate-500/10 text-slate-400' : 'border-amber-700 bg-amber-700/10 text-amber-700');

      const fellowshipInfo = resolveUserFellowship(u);
      const isLeader = fellowshipInfo.role === 'leader';
      const cityBadge = fellowshipInfo.city ? ` • ${fellowshipInfo.city}` : '';

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
            
            <!-- Real Verified Home Fellowship Identity -->
            <div class="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 flex-wrap">
              <i data-lucide="home" class="w-3.5 h-3.5 text-blue-500 shrink-0"></i>
              <span class="truncate max-w-[170px]" title="${fellowshipInfo.name}${cityBadge}">${fellowshipInfo.name}${cityBadge}</span>
              ${isLeader ? '<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Leader</span>' : ''}
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
  container.innerHTML = sorted.map((u, idx) => {
    const rank = idx + 1;
    const score = u[sortField] || 0;
    const isCurrentUser = window.auth?.currentUser?.uid === u.uid;
    const fellowshipInfo = resolveUserFellowship(u);
    const isLeader = fellowshipInfo.role === 'leader';
    const cityBadge = fellowshipInfo.city ? ` • ${fellowshipInfo.city}` : '';

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
            <!-- Real Verified Home Fellowship Identity Marker -->
            <div class="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 truncate">
              <i data-lucide="home" class="w-3 h-3 text-blue-500 shrink-0"></i>
              <span class="truncate max-w-[220px]" title="${fellowshipInfo.name}${cityBadge}">${fellowshipInfo.name}${cityBadge}</span>
              ${isLeader ? '<span class="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">Leader</span>' : ''}
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

