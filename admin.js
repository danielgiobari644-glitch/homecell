// admin.js
// Home.cell - Executive Super Admin Command Center & Full Platform Governance
// Complete authority over Fellowships, Memberships, Global Feed, Quizzes & Users

let adminUsersList = [];
let adminFellowshipsList = [];
let adminQuizzesList = [];
let currentAdminTab = 'fellowships'; // 'fellowships' | 'users' | 'quizzes' | 'feed'

function initAdminModule() {
  const isSuperAdmin = window.checkIsSuperAdmin();
  const pane = document.getElementById('admin-management-pane');
  if (!pane) return;

  if (!isSuperAdmin) {
    pane.innerHTML = `
      <div class="glass-panel rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto my-12">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl font-black">
          🛡️
        </div>
        <h3 class="text-xl font-black font-display text-slate-900 dark:text-zinc-100">Super Admin Required</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          The Executive Leadership Command Center is reserved exclusively for the system administrator (danielgiobari644@gmail.com).
        </p>
      </div>
    `;
    return;
  }

  renderAdminDashboardSkeleton();
  loadAdminKPIs();
  switchAdminTab(currentAdminTab);
}

function renderAdminDashboardSkeleton() {
  const pane = document.getElementById('admin-management-pane');
  if (!pane) return;

  pane.innerHTML = `
    <!-- Top Executive Header Banner -->
    <div class="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border border-blue-500/30 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-2">
        <span class="px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase tracking-wider inline-block border border-blue-400/30">
          🛡️ Sovereign Administrative Governance
        </span>
        <h2 class="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">Super Admin Command Center</h2>
        <p class="text-xs sm:text-sm text-slate-300 max-w-xl">
          Complete authority to manage fellowships, assign leaders, oversee memberships, moderate global feed posts, and review trivia quizzes.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl shrink-0 border border-white/10">
        <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
        <div class="text-left">
          <span class="text-[10px] uppercase font-black text-slate-300 block">Root Authority</span>
          <span class="text-xs font-black font-mono text-amber-400 truncate max-w-[180px] block">${window.auth?.currentUser?.email || 'danielgiobari644@gmail.com'}</span>
        </div>
      </div>
    </div>

    <!-- Administrative KPI Stats Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4" id="admin-kpi-grid">
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">Total Fellowships</span>
        <span id="kpi-admin-fellowships" class="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 block">...</span>
      </div>
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">Registered Believers</span>
        <span id="kpi-admin-users" class="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">...</span>
      </div>
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">Fellowship Quizzes</span>
        <span id="kpi-admin-quizzes" class="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 block">...</span>
      </div>
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">Global Posts</span>
        <span id="kpi-admin-posts" class="text-2xl font-black font-mono text-amber-500 block">...</span>
      </div>
    </div>

    <!-- Admin Sub-Navigation Pills -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-zinc-800 pb-3">
      <button id="admin-tab-btn-fellowships" onclick="switchAdminTab('fellowships')" class="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white cursor-pointer shadow-xs transition-all shrink-0">
        🏛️ Manage Fellowships
      </button>
      <button id="admin-tab-btn-users" onclick="switchAdminTab('users')" class="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer transition-all shrink-0">
        👥 Believers & Roles
      </button>
      <button id="admin-tab-btn-quizzes" onclick="switchAdminTab('quizzes')" class="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer transition-all shrink-0">
        ❓ Moderate Quizzes
      </button>
      <button id="admin-tab-btn-feed" onclick="switchAdminTab('feed')" class="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer transition-all shrink-0">
        📰 Global Feed Moderation
      </button>
    </div>

    <!-- Dynamic Admin Content Pane -->
    <div id="admin-tab-content" class="space-y-6"></div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  const tabs = ['fellowships', 'users', 'quizzes', 'feed'];
  tabs.forEach(t => {
    const btn = document.getElementById(`admin-tab-btn-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = "px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white cursor-pointer shadow-xs transition-all shrink-0";
      } else {
        btn.className = "px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer transition-all shrink-0";
      }
    }
  });

  if (tabName === 'fellowships') renderAdminFellowshipsView();
  else if (tabName === 'users') renderAdminUsersView();
  else if (tabName === 'quizzes') renderAdminQuizzesView();
  else if (tabName === 'feed') renderAdminFeedView();
}

function loadAdminKPIs() {
  const db = window.db;
  if (!db) return;

  db.collection('fellowships').onSnapshot(snap => {
    const el = document.getElementById('kpi-admin-fellowships');
    if (el) el.innerText = snap.size;
  });

  db.collection('users').onSnapshot(snap => {
    const el = document.getElementById('kpi-admin-users');
    if (el) el.innerText = snap.size;
  });

  db.collection('quizzes').onSnapshot(snap => {
    const el = document.getElementById('kpi-admin-quizzes');
    if (el) el.innerText = snap.size;
  });

  db.collection('global_posts').onSnapshot(snap => {
    const el = document.getElementById('kpi-admin-posts');
    if (el) el.innerText = snap.size;
  });
}

// -------------------------------------------------------------
// 1. MANAGE FELLOWSHIPS
// -------------------------------------------------------------

function renderAdminFellowshipsView() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h3 class="font-display font-black text-xl text-slate-900 dark:text-zinc-100">All Home Fellowships</h3>
        <p class="text-xs text-slate-500">Edit information, change leaders, or manage membership rosters.</p>
      </div>
      <button onclick="window.openCreateFellowshipModal()" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5">
        <i data-lucide="plus" class="w-4 h-4"></i> Plant Fellowship
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="admin-fellowships-list">
      <div class="col-span-full py-8 text-center text-slate-400 text-xs">Loading fellowships...</div>
    </div>
  `;

  renderAdminFellowshipsList();
}

window.renderAdminFellowshipsList = function() {
  const listEl = document.getElementById('admin-fellowships-list');
  if (!listEl) return;

  const fellowships = window.allFellowships || [];
  if (fellowships.length === 0) {
    listEl.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-xs">No fellowships found in the registry.</div>`;
    return;
  }

  listEl.innerHTML = fellowships.map(f => {
    return `
      <div class="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 space-y-4 flex flex-col justify-between shadow-xs">
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">${f.city || 'Local Fellowship'}</span>
              <h4 class="font-black text-lg text-slate-900 dark:text-zinc-100 mt-0.5">${f.name}</h4>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              ${f.memberCount || 1} Believers
            </span>
          </div>

          ${f.motto ? `<p class="text-xs italic text-slate-500 font-serif">"${f.motto}"</p>` : ''}
          <p class="text-xs text-slate-600 dark:text-zinc-400">${f.address}</p>

          <div class="pt-2 text-xs text-slate-500 space-y-1">
            <div>Leader: <strong class="text-slate-800 dark:text-zinc-200">${f.leaderName || 'Unknown'}</strong> (${f.phone || 'No phone'})</div>
            <div>Schedule: <strong>Every ${f.day || 'Wednesday'} at ${f.time || '6:00 PM'}</strong></div>
            ${f.additionalInfo ? `<div class="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-zinc-300"><strong class="text-slate-800 dark:text-zinc-100">Notice:</strong> ${f.additionalInfo}</div>` : ''}
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-2">
          <button onclick="window.adminOpenEditFellowship('${f.id}')" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer text-center">
            Edit Info & Notice
          </button>
          <button onclick="window.adminViewFellowshipMembers('${f.id}')" class="py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-all cursor-pointer">
            Manage Members
          </button>
          <button onclick="window.adminDeleteFellowship('${f.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer" title="Delete Fellowship">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
};

window.adminOpenEditFellowship = function(fellowshipId) {
  const f = (window.allFellowships || []).find(x => x.id === fellowshipId);
  if (!f) return;

  const modal = document.getElementById('admin-edit-fellowship-modal');
  if (!modal) return;

  document.getElementById('admin-edit-f-id').value = f.id;
  document.getElementById('admin-edit-f-name').value = f.name || '';
  document.getElementById('admin-edit-f-motto').value = f.motto || '';
  document.getElementById('admin-edit-f-address').value = f.address || '';
  document.getElementById('admin-edit-f-city').value = f.city || '';
  document.getElementById('admin-edit-f-day').value = f.day || 'Wednesday';
  document.getElementById('admin-edit-f-time').value = f.time || '6:00 PM';
  document.getElementById('admin-edit-f-phone').value = f.phone || '';
  document.getElementById('admin-edit-f-leader-name').value = f.leaderName || '';
  document.getElementById('admin-edit-f-desc').value = f.description || '';
  document.getElementById('admin-edit-f-info').value = f.additionalInfo || '';

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.adminCloseEditFellowship = function() {
  document.getElementById('admin-edit-fellowship-modal')?.classList.add('hidden');
};

window.adminSaveEditFellowship = async function(e) {
  if (e) e.preventDefault();
  const fId = document.getElementById('admin-edit-f-id')?.value;
  if (!fId) return;

  try {
    await window.db.collection('fellowships').doc(fId).update({
      name: document.getElementById('admin-edit-f-name').value.trim(),
      motto: document.getElementById('admin-edit-f-motto').value.trim(),
      address: document.getElementById('admin-edit-f-address').value.trim(),
      city: document.getElementById('admin-edit-f-city').value.trim(),
      day: document.getElementById('admin-edit-f-day').value,
      time: document.getElementById('admin-edit-f-time').value,
      phone: document.getElementById('admin-edit-f-phone').value.trim(),
      leaderName: document.getElementById('admin-edit-f-leader-name').value.trim(),
      description: document.getElementById('admin-edit-f-desc').value.trim(),
      additionalInfo: document.getElementById('admin-edit-f-info').value.trim()
    });

    window.adminCloseEditFellowship();
    window.showToast?.("Fellowship updated successfully.", "success");
  } catch (err) {
    console.error("Admin save fellowship error:", err);
    window.showToast?.("Failed to update fellowship: " + err.message, "error");
  }
};

window.adminDeleteFellowship = async function(fellowshipId) {
  const f = (window.allFellowships || []).find(x => x.id === fellowshipId);
  const name = f?.name || 'this fellowship';
  if (!confirm(`DANGER: Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) return;

  try {
    await window.db.collection('fellowships').doc(fellowshipId).delete();
    window.showToast?.(`Fellowship "${name}" deleted.`, "info");
  } catch (err) {
    console.error("Delete fellowship error:", err);
    window.showToast?.("Failed to delete fellowship: " + err.message, "error");
  }
};

window.adminViewFellowshipMembers = function(fellowshipId) {
  window.db.collection('memberships').where('fellowshipId', '==', fellowshipId).get().then(snap => {
    let msg = `Members (${snap.size}):\n\n`;
    snap.forEach(d => {
      const m = d.data();
      msg += `• ${m.userDisplayName || 'Believer'} (${m.userEmail}) — Role: ${m.role}\n`;
    });
    alert(msg);
  }).catch(e => alert(e.message));
};

// -------------------------------------------------------------
// 2. MANAGE USERS & ROLES
// -------------------------------------------------------------

function renderAdminUsersView() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="font-display font-black text-xl text-slate-900 dark:text-zinc-100">Registered Believers</h3>
        <p class="text-xs text-slate-500">Promote administrators or manage user privileges.</p>
      </div>

      <div class="glass-panel rounded-3xl p-4 overflow-x-auto border border-slate-200 dark:border-zinc-800">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-zinc-800 text-slate-400 uppercase text-[10px] font-mono">
              <th class="py-3 px-3">Believer</th>
              <th class="py-3 px-3">Email</th>
              <th class="py-3 px-3">Global Role</th>
              <th class="py-3 px-3">Streak</th>
              <th class="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="admin-users-table-body">
            <tr><td colspan="5" class="text-center py-6 text-slate-400">Loading believers...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  window.db.collection('users').limit(50).onSnapshot(snap => {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = snap.docs.map(doc => {
      const u = doc.data();
      const isDaniel = u.email && u.email.toLowerCase() === 'danielgiobari644@gmail.com';
      const isSuperAdmin = u.role === 'Super Admin' || isDaniel;

      return `
        <tr class="border-b border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800/30">
          <td class="py-3 px-3 flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
              ${u.photoURL ? `<img src="${u.photoURL}" class="w-full h-full object-cover" />` : (u.displayName || 'B').charAt(0).toUpperCase()}
            </div>
            <span class="font-bold text-slate-800 dark:text-zinc-200">${u.displayName || 'Believer'}</span>
          </td>
          <td class="py-3 px-3 text-slate-500">${u.email || ''}</td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isSuperAdmin ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            }">${isSuperAdmin ? 'Super Admin' : 'Member'}</span>
          </td>
          <td class="py-3 px-3 font-mono text-slate-600 dark:text-zinc-300">${u.streak || 1}d</td>
          <td class="py-3 px-3 text-right">
            ${!isDaniel ? `
              <button onclick="window.adminToggleUserAdmin('${doc.id}', ${!isSuperAdmin})" class="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                ${isSuperAdmin ? 'Demote to Member' : 'Promote to Super Admin'}
              </button>
            ` : '<span class="text-[10px] font-mono text-slate-400">Root Owner</span>'}
          </td>
        </tr>
      `;
    }).join('');
  });
}

window.adminToggleUserAdmin = async function(uid, makeAdmin) {
  try {
    await window.db.collection('users').doc(uid).update({
      role: makeAdmin ? 'Super Admin' : 'Member'
    });
    window.showToast?.(`User role updated to ${makeAdmin ? 'Super Admin' : 'Member'}.`, "success");
  } catch (err) {
    console.error("Toggle admin error:", err);
    window.showToast?.("Failed to update role: " + err.message, "error");
  }
};

// -------------------------------------------------------------
// 3. MODERATE QUIZZES
// -------------------------------------------------------------

function renderAdminQuizzesView() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="font-display font-black text-xl text-slate-900 dark:text-zinc-100">All Fellowship Quizzes</h3>
        <p class="text-xs text-slate-500">Delete inappropriate quizzes or review questions across all fellowships.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="admin-quizzes-grid">
        <div class="col-span-full py-8 text-center text-slate-400 text-xs">Loading quizzes...</div>
      </div>
    </div>
  `;

  window.db.collection('quizzes').orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
    const grid = document.getElementById('admin-quizzes-grid');
    if (!grid) return;

    if (snap.empty) {
      grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-xs">No quizzes currently exist.</div>`;
      return;
    }

    grid.innerHTML = snap.docs.map(doc => {
      const q = doc.data();
      return `
        <div class="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">${q.fellowshipName || 'Fellowship'}</span>
            <h4 class="font-black text-base text-slate-900 dark:text-zinc-100">${q.title}</h4>
            <p class="text-xs text-slate-500">${q.description || 'Scripture challenge'}</p>
            <div class="pt-2 text-[11px] text-slate-400">Questions: ${q.questions?.length || 0} • Created by: ${q.creatorName || 'Member'}</div>
          </div>
          <div class="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <button onclick="window.startQuizGameplay('${doc.id}')" class="px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl text-xs font-bold cursor-pointer">
              Test Quiz
            </button>
            <button onclick="window.deleteFellowshipQuiz('${doc.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer" title="Delete Quiz">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  });
}

// -------------------------------------------------------------
// 4. GLOBAL FEED MODERATION
// -------------------------------------------------------------

function renderAdminFeedView() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="font-display font-black text-xl text-slate-900 dark:text-zinc-100">Global Feed Moderation</h3>
        <p class="text-xs text-slate-500">Super Admin authority to delete any global post or testimony.</p>
      </div>

      <div class="space-y-3" id="admin-feed-posts-stream">
        <div class="py-8 text-center text-slate-400 text-xs">Loading feed posts...</div>
      </div>
    </div>
  `;

  window.db.collection('global_posts').orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
    const stream = document.getElementById('admin-feed-posts-stream');
    if (!stream) return;

    if (snap.empty) {
      stream.innerHTML = `<div class="py-8 text-center text-slate-400 text-xs">No posts to moderate.</div>`;
      return;
    }

    stream.innerHTML = snap.docs.map(doc => {
      const p = doc.data();
      return `
        <div class="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-black text-xs text-slate-900 dark:text-zinc-100">${p.authorName}</span>
              <span class="text-[10px] text-blue-600 dark:text-blue-400 font-bold">• ${p.fellowshipName}</span>
            </div>
            <p class="text-xs text-slate-700 dark:text-zinc-300 line-clamp-2">${p.content || ''}</p>
            ${p.mediaUrl ? `<span class="text-[10px] font-mono text-purple-500">Has media attachment (${p.mediaType || 'image'})</span>` : ''}
          </div>
          <button onclick="window.deleteGlobalPost('${doc.id}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl shrink-0 cursor-pointer" title="Delete Post">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  });
}

window.initAdminModule = initAdminModule;
window.switchAdminTab = switchAdminTab;
