// admin.js
// Complete Super Admin & Leadership Command Center with Trivia Quiz Builder & Participant Tracking

let adminUsersListener = null;
let adminRequestsListener = null;
let adminCellsListener = null;
let adminStatsListener = null;
let adminQuizzesListener = null;
let adminEventsListener = null;
let adminDevotionalsListener = null;
let adminDevDraftCover = 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80';
let adminEventDraftCover = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80';
let currentAdminSubTab = 'members';

function initAdminModule() {
  const user = window.auth?.currentUser;
  const isSuperAdmin = window.currentUserRole === 'Super Admin' || user?.email === 'danielgiobari644@gmail.com';

  const adminNavBtn = document.getElementById('nav-btn-admin');
  if (adminNavBtn && isSuperAdmin) {
    adminNavBtn.classList.remove('hidden');
  }

  const pane = document.getElementById('admin-management-pane');
  if (!pane) return;

  if (!isSuperAdmin) {
    pane.innerHTML = `
      <div class="glass-panel rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl font-black">
          🛡️
        </div>
        <h3 class="text-xl font-black font-display text-slate-900 dark:text-zinc-100">Super Admin Access Required</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          The Leadership Command Center is reserved for ordained pastors, cell coordinators, and system administrators.
        </p>
        <div class="pt-2">
          <span class="text-[11px] font-mono text-slate-400">Current email: ${user?.email || 'Guest'}</span>
        </div>
      </div>
    `;
    return;
  }

  renderAdminInterface();
  syncAdminKPIStats();
  switchAdminSubTab(currentAdminSubTab);
}

function renderAdminInterface() {
  const pane = document.getElementById('admin-management-pane');
  if (!pane) return;

  pane.innerHTML = `
    <!-- Top Admin Header Banner -->
    <div class="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-blue-500/30 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="space-y-2 text-center md:text-left">
        <span class="px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase tracking-wider inline-block border border-blue-400/30">
          🛡️ Executive Command Center
        </span>
        <h2 class="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">Super Admin Control Hub</h2>
        <p class="text-xs sm:text-sm text-slate-300 max-w-xl">
          Manage member roles, build Live Trivia Quizzes, track live participants, publish official broadcasts, and manage House Cells.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl shrink-0 border border-white/10">
        <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
        <div class="text-left">
          <span class="text-[10px] uppercase font-black text-slate-300 block">Leadership Status</span>
          <span class="text-sm font-black font-mono text-amber-400">Super Admin Active</span>
        </div>
      </div>
    </div>

    <!-- Admin KPI Stats Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4" id="admin-kpi-grid">
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">Total Members</span>
        <span id="kpi-total-members" class="text-xl font-black font-mono text-blue-600 dark:text-blue-400 block">...</span>
      </div>
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">House Cells</span>
        <span id="kpi-total-cells" class="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">...</span>
      </div>
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">Live Quizzes</span>
        <span id="kpi-total-quizzes" class="text-xl font-black font-mono text-purple-600 dark:text-purple-400 block">...</span>
      </div>
      <div class="glass-panel rounded-2xl p-4 text-center space-y-1">
        <span class="text-[10px] uppercase font-black text-slate-400">Store Products</span>
        <span id="kpi-total-products" class="text-xl font-black font-mono text-amber-500 block">...</span>
      </div>
    </div>

    <!-- Admin Sub-Navigation Pills -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-zinc-800 pb-3">
      <button id="admin-tab-members" onclick="switchAdminSubTab('members')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white cursor-pointer shadow-xs transition-all shrink-0">
        👥 Members & Roles
      </button>
      <button id="admin-tab-quizzes" onclick="switchAdminSubTab('quizzes')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0">
        🏆 Live Trivia Builder
      </button>
      <button id="admin-tab-cells" onclick="switchAdminSubTab('cells')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0">
        🏡 House Cells
      </button>
      <button id="admin-tab-broadcast" onclick="switchAdminSubTab('broadcast')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0">
        📢 Church Broadcast
      </button>
      <button id="admin-tab-devotionals" onclick="switchAdminSubTab('devotionals')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0">
        ☀️ Devotionals
      </button>
      <button id="admin-tab-events" onclick="switchAdminSubTab('events')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0">
        📅 Gatherings
      </button>
      <button id="admin-tab-requests" onclick="switchAdminSubTab('requests')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0">
        ✨ Custom Orders
      </button>
      <button id="admin-tab-inventory" onclick="switchAdminSubTab('inventory')" class="admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0">
        🛍️ Store Inventory
      </button>
    </div>

    <!-- Admin Tab Panes Container -->
    <div id="admin-sub-panes" class="space-y-6"></div>
  `;
}

function switchAdminSubTab(tabId) {
  currentAdminSubTab = tabId;
  const btns = document.querySelectorAll('.admin-sub-btn');
  btns.forEach(b => {
    if (b.id === `admin-tab-${tabId}`) {
      b.className = "admin-sub-btn px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white cursor-pointer shadow-xs transition-all shrink-0";
    } else {
      b.className = "admin-sub-btn px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all shrink-0";
    }
  });

  const container = document.getElementById('admin-sub-panes');
  if (!container) return;

  if (tabId === 'members') renderAdminMembersPane(container);
  else if (tabId === 'quizzes') renderAdminQuizzesPane(container);
  else if (tabId === 'cells') renderAdminCellsPane(container);
  else if (tabId === 'broadcast') renderAdminBroadcastPane(container);
  else if (tabId === 'devotionals') renderAdminDevotionalsPane(container);
  else if (tabId === 'events') renderAdminEventsPane(container);
  else if (tabId === 'requests') renderAdminRequestsPane(container);
  else if (tabId === 'inventory') renderAdminInventoryPane(container);

  if (window.lucide) window.lucide.createIcons();
}

// 1. Members & Roles Management
function renderAdminMembersPane(container) {
  container.innerHTML = `
    <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Member Directory & Access Management</h3>
          <p class="text-xs text-slate-400">Promote leaders, assign House Cells, and adjust Kingdom Coin allocations.</p>
        </div>
        <div class="relative min-w-[240px]">
          <input type="text" id="admin-user-search" oninput="filterAdminUsers(this.value)" placeholder="Search members by name/email..." class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2.5" />
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase font-black text-slate-400">
              <th class="py-3 px-4">Member</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4">Assigned Role</th>
              <th class="py-3 px-4">Kingdom Coins</th>
              <th class="py-3 px-4">Quick Coin Grant</th>
            </tr>
          </thead>
          <tbody id="admin-users-table-body">
            <tr><td colspan="5" class="py-8 text-center text-xs text-slate-400">Loading directory...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  syncAdminUsers();
}

function syncAdminUsers() {
  const container = document.getElementById('admin-users-table-body');
  if (!container) return;

  if (adminUsersListener) adminUsersListener();
  const db = window.db;
  if (!db) return;

  adminUsersListener = db.collection('users').orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">No users registered yet.</td></tr>`;
      return;
    }

    snap.forEach(doc => {
      const u = doc.data();
      const tr = document.createElement('tr');
      tr.className = "border-b border-slate-100 dark:border-zinc-800/60 text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors";
      
      tr.innerHTML = `
        <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-3">
          <img src="${u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.id}`}" class="w-8 h-8 rounded-full object-cover bg-slate-800 shrink-0" />
          <div>
            <span class="block">${u.displayName || 'Member'}</span>
            <span class="text-[10px] font-normal text-slate-400">Streak: ${u.streak || 1}d</span>
          </div>
        </td>
        <td class="py-3.5 px-4 text-slate-500 font-mono text-[11px]">${u.email || doc.id}</td>
        <td class="py-3.5 px-4">
          <select onchange="updateUserRoleDirect('${doc.id}', this.value)" class="text-xs p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 font-bold cursor-pointer">
            <option value="Member" ${u.role === 'Member' ? 'selected' : ''}>Member</option>
            <option value="Cell Leader" ${u.role === 'Cell Leader' ? 'selected' : ''}>Cell Leader</option>
            <option value="Cell Coordinator" ${u.role === 'Cell Coordinator' ? 'selected' : ''}>Cell Coordinator</option>
            <option value="Pastor" ${u.role === 'Pastor' ? 'selected' : ''}>Pastor</option>
            <option value="Super Admin" ${u.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
          </select>
        </td>
        <td class="py-3.5 px-4 font-mono font-black text-amber-500">${(u.kingdomCoins || 0).toLocaleString()} KC</td>
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-1.5">
            <button onclick="grantAdminCoins('${doc.id}', 100)" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-xl cursor-pointer shadow-xs transition-all">
              +100 KC
            </button>
            <button onclick="grantAdminCoins('${doc.id}', 500)" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] rounded-xl cursor-pointer shadow-xs transition-all">
              +500 KC
            </button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });
  }, err => console.warn("Admin users error:", err));
}

// 2. Super Admin Trivia Quiz Builder & Live Manager
let adminDraftQuizCover = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80';
let adminEditingQuizId = null;
let adminEditingQuizCover = '';
let adminEditingQuizQuestions = [];

let adminEditingDevId = null;
let adminEditingDevCover = '';

const SAMPLE_QUIZ_JSON_DATA = {
  title: "Heroes of Faith & Gospel Miracles",
  category: "Gospels & Miracles",
  description: "Challenge your biblical knowledge on the miracles, parables, and faith heroes of the New and Old Testament.",
  coverUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80",
  rewardPerCorrect: 10,
  bonusReward: 25,
  questions: [
    {
      question: "Who was called the friend of God in scripture?",
      options: ["Moses", "Abraham", "David", "Elijah"],
      answerIndex: 1,
      scriptureReference: "James 2:23 / Genesis 15:6",
      explanation: "Abraham believed God, and it was credited to him as righteousness, and he was called God's friend."
    },
    {
      question: "In what town was Jesus Christ born?",
      options: ["Nazareth", "Jerusalem", "Bethlehem", "Capernaum"],
      answerIndex: 2,
      scriptureReference: "Micah 5:2 / Luke 2:4-7",
      explanation: "Jesus was born in Bethlehem of Judea, fulfilling the ancient prophecy in Micah 5:2."
    },
    {
      question: "How many books are in the New Testament?",
      options: ["27", "39", "66", "12"],
      answerIndex: 0,
      scriptureReference: "Canonical New Testament",
      explanation: "There are 27 books in the New Testament and 39 in the Old Testament, making 66 in total."
    },
    {
      question: "Who walked on water towards Jesus during the storm on the Sea of Galilee?",
      options: ["John", "Peter", "James", "Andrew"],
      answerIndex: 1,
      scriptureReference: "Matthew 14:29",
      explanation: "Peter stepped out of the boat and walked on the water toward Jesus before his faith faltered."
    },
    {
      question: "What is the fruit of the Spirit listed first in Galatians 5:22?",
      options: ["Joy", "Peace", "Love", "Patience"],
      answerIndex: 2,
      scriptureReference: "Galatians 5:22",
      explanation: "The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness..."
    }
  ]
};

let adminDraftQuizQuestions = [
  {
    question: "Who was called the friend of God in scripture?",
    options: ["Moses", "Abraham", "David", "Elijah"],
    answerIndex: 1,
    scriptureReference: "James 2:23 / Genesis 15:6"
  },
  {
    question: "In what city was Jesus Christ born?",
    options: ["Jerusalem", "Nazareth", "Bethlehem", "Capernaum"],
    answerIndex: 2,
    scriptureReference: "Micah 5:2 / Luke 2:4-7"
  },
  {
    question: "How many books are in the New Testament?",
    options: ["27", "39", "66", "12"],
    answerIndex: 0,
    scriptureReference: "27 canonical books"
  }
];

function compressImageToDataUrlSafe(dataUrl, maxWidth = 1280, maxHeight = 720, quality = 0.85, callback) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    let { width, height } = img;
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

function renderAdminQuizzesPane(container) {
  adminDraftQuizCover = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80';

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Quiz Creator Form -->
      <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <span class="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-black uppercase font-mono">
            👑 Super Admin Live Tool
          </span>
          <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100 mt-1">Create Live Trivia Quiz</h3>
          <p class="text-xs text-slate-400">Launch real-time Bible competitions with custom cover banners, rewards, and real-time chat.</p>
        </div>

        <!-- JSON Bulk Import / Sample Card -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/30 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <span>📥</span> JSON Quick Import
            </span>
            <button type="button" onclick="downloadSampleQuizJson()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs">
              <i data-lucide="download" class="w-3 h-3"></i>
              <span>Sample JSON</span>
            </button>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-zinc-300 leading-snug">
            Import an entire quiz from a JSON file or download our ready-to-use template.
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <label class="cursor-pointer py-2 px-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800/60 hover:border-purple-500 text-[10px] font-bold text-center text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1 shadow-2xs">
              <i data-lucide="file-up" class="w-3 h-3 text-purple-500"></i>
              <span>Upload JSON</span>
              <input type="file" accept=".json,application/json" onchange="handleQuizJsonFileInput(event)" class="hidden" />
            </label>

            <button type="button" onclick="handlePasteJsonImport()" class="py-2 px-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800/60 hover:border-purple-500 text-[10px] font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-1 shadow-2xs cursor-pointer">
              <i data-lucide="clipboard" class="w-3 h-3 text-blue-500"></i>
              <span>Paste JSON</span>
            </button>

            <button type="button" onclick="openJsonSampleModal()" class="col-span-2 sm:col-span-1 py-2 px-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800/60 hover:border-purple-500 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 shadow-2xs cursor-pointer">
              <i data-lucide="code" class="w-3 h-3"></i>
              <span>View Schema</span>
            </button>
          </div>
        </div>

        <form id="admin-create-quiz-form" onsubmit="handleCreateQuizSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Quiz Title *</label>
            <input type="text" id="admin-quiz-title" required placeholder="e.g. Acts of the Apostles Champions Sprint" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Category *</label>
            <select id="admin-quiz-category" class="w-full text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100">
              <option value="New Testament">New Testament</option>
              <option value="Old Testament">Old Testament</option>
              <option value="Gospels & Miracles">Gospels & Miracles</option>
              <option value="General Scripture">General Scripture</option>
              <option value="Prophets & Kings">Prophets & Kings</option>
              <option value="Parables & Teachings">Parables & Teachings</option>
              <option value="Youth & Teens">Youth & Teens</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">KC per Correct</label>
              <input type="number" id="admin-quiz-reward-per-q" value="10" min="1" max="100" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 font-mono font-bold text-slate-900 dark:text-zinc-100" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Bonus KC</label>
              <input type="number" id="admin-quiz-bonus-reward" value="25" min="0" max="500" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 font-mono font-bold text-slate-900 dark:text-zinc-100" />
            </div>
          </div>

          <!-- Cover Photo Picker Box -->
          <div class="p-4 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-800 dark:text-zinc-200">
                🖼️ Quiz Cover Banner
              </label>
              <span class="text-[10px] text-purple-500 font-bold font-mono">Custom Artwork</span>
            </div>

            <div class="relative h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 shadow-inner">
              <img id="admin-quiz-cover-preview" src="${adminDraftQuizCover}" class="w-full h-full object-cover" alt="Quiz Banner Preview" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <label class="cursor-pointer py-2 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:border-purple-500 text-[11px] font-bold text-center text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-purple-500"></i>
                <span>Upload File</span>
                <input type="file" id="admin-quiz-cover-file" accept="image/*" onchange="handleAdminQuizCoverSelect(event)" class="hidden" />
              </label>

              <button type="button" onclick="promptAdminQuizCoverUrl()" class="py-2 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:border-purple-500 text-[11px] font-bold text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                <i data-lucide="link" class="w-3.5 h-3.5 text-blue-500"></i>
                <span>Paste URL</span>
              </button>
            </div>
          </div>

          <!-- Questions Builder Box -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-slate-800 dark:text-zinc-200">Questions (<span id="admin-draft-q-count">3</span>)</span>
              <button type="button" onclick="openAddQuestionModal()" class="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
                + Add Question
              </button>
            </div>
            <div id="admin-draft-questions-list" class="space-y-2 max-h-48 overflow-y-auto pr-1"></div>
          </div>

          <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/25 cursor-pointer transition-all">
            Launch Live Quiz 🚀
          </button>
        </form>
      </div>

      <!-- Live Quizzes List & Participant Tracking -->
      <div class="lg:col-span-2 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Live Quizzes & Real-Time Participants</h3>
            <p class="text-xs text-slate-400">Edit existing quizzes, modify artwork, export JSON, and monitor participant activity.</p>
          </div>
        </div>

        <div id="admin-quizzes-list-container" class="space-y-4">
          <div class="py-12 text-center text-xs text-slate-400">Loading quizzes...</div>
        </div>
      </div>
    </div>
  `;

  renderDraftQuestionsList();
  syncAdminQuizzesList();
  if (window.lucide) window.lucide.createIcons();
}

function handleAdminQuizCoverSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    compressImageToDataUrlSafe(event.target.result, 1280, 720, 0.85, (compressed) => {
      adminDraftQuizCover = compressed;
      const prev = document.getElementById('admin-quiz-cover-preview');
      if (prev) prev.src = adminDraftQuizCover;
    });
  };
  reader.readAsDataURL(file);
}

function promptAdminQuizCoverUrl() {
  const url = prompt("Enter Image URL for Quiz Cover Banner:", adminDraftQuizCover);
  if (url && url.trim()) {
    adminDraftQuizCover = url.trim();
    const prev = document.getElementById('admin-quiz-cover-preview');
    if (prev) prev.src = adminDraftQuizCover;
  }
}

function downloadSampleQuizJson() {
  const jsonStr = JSON.stringify(SAMPLE_QUIZ_JSON_DATA, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_kingdom_quiz.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.showToast?.("📥 Downloaded sample_kingdom_quiz.json!", "success");
}

function openJsonSampleModal() {
  const modal = document.getElementById('json-sample-modal');
  const codeBlock = document.getElementById('sample-json-code-block');
  if (codeBlock) {
    codeBlock.textContent = JSON.stringify(SAMPLE_QUIZ_JSON_DATA, null, 2);
  }
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeJsonSampleModal() {
  const modal = document.getElementById('json-sample-modal');
  if (modal) modal.classList.add('hidden');
}

async function copySampleJsonToClipboard() {
  const jsonStr = JSON.stringify(SAMPLE_QUIZ_JSON_DATA, null, 2);
  try {
    await navigator.clipboard.writeText(jsonStr);
    const label = document.getElementById('copy-json-btn-label');
    if (label) label.innerText = "Copied to Clipboard! ✓";
    window.showToast?.("Sample JSON copied to clipboard!", "success");
    setTimeout(() => {
      if (label) label.innerText = "Copy Template to Clipboard";
    }, 2500);
  } catch (err) {
    window.showToast?.("Failed to copy. Please select and copy manually.", "info");
  }
}

function handleQuizJsonFileInput(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      applyImportedQuizJson(parsed);
      e.target.value = '';
    } catch (err) {
      window.showToast?.("Invalid JSON file: " + err.message, "error");
    }
  };
  reader.readAsText(file);
}

function handlePasteJsonImport() {
  const input = prompt("Paste your Quiz JSON structure below:");
  if (!input || !input.trim()) return;
  try {
    const parsed = JSON.parse(input.trim());
    applyImportedQuizJson(parsed);
  } catch (err) {
    window.showToast?.("Invalid JSON format: " + err.message, "error");
  }
}

function applyImportedQuizJson(data) {
  const quiz = Array.isArray(data) ? data[0] : data;
  if (!quiz) {
    window.showToast?.("JSON contains no quiz data.", "error");
    return;
  }

  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    window.showToast?.("JSON must contain a non-empty 'questions' array.", "error");
    return;
  }

  const normalizedQuestions = quiz.questions.map((q, idx) => {
    let qText = q.question || q.prompt || q.title || `Question ${idx + 1}`;
    let opts = q.options || q.choices || ["Option A", "Option B", "Option C", "Option D"];
    if (!Array.isArray(opts) || opts.length === 0) {
      opts = ["True", "False"];
    }

    let ansIdx = 0;
    if (typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < opts.length) {
      ansIdx = q.answerIndex;
    } else if (typeof q.answer === 'string') {
      const letterIdx = ['A', 'B', 'C', 'D'].indexOf(q.answer.toUpperCase());
      if (letterIdx !== -1 && letterIdx < opts.length) {
        ansIdx = letterIdx;
      } else {
        const textIdx = opts.findIndex(o => o.toLowerCase() === q.answer.toLowerCase());
        if (textIdx !== -1) ansIdx = textIdx;
      }
    }

    return {
      question: qText,
      options: opts,
      answerIndex: ansIdx,
      scriptureReference: q.scriptureReference || q.reference || q.scripture || '',
      explanation: q.explanation || ''
    };
  });

  adminDraftQuizQuestions = normalizedQuestions;

  const titleEl = document.getElementById('admin-quiz-title');
  const catEl = document.getElementById('admin-quiz-category');
  const rewardEl = document.getElementById('admin-quiz-reward-per-q');
  const bonusEl = document.getElementById('admin-quiz-bonus-reward');

  if (titleEl && quiz.title) titleEl.value = quiz.title;
  if (catEl && quiz.category) catEl.value = quiz.category;
  if (rewardEl && quiz.rewardPerCorrect) rewardEl.value = quiz.rewardPerCorrect;
  if (bonusEl && quiz.bonusReward) bonusEl.value = quiz.bonusReward;

  if (quiz.coverUrl || quiz.imageUrl) {
    adminDraftQuizCover = quiz.coverUrl || quiz.imageUrl;
    const prev = document.getElementById('admin-quiz-cover-preview');
    if (prev) prev.src = adminDraftQuizCover;
  }

  renderDraftQuestionsList();
  window.soundEngine?.playSuccess?.();
  window.showToast?.(`✓ Imported "${quiz.title || 'Bible Quiz'}" (${normalizedQuestions.length} questions)!`, "success");
}

async function exportQuizToJson(quizId) {
  try {
    const doc = await window.db.collection('custom_quizzes').doc(quizId).get();
    if (!doc.exists) {
      window.showToast?.("Quiz not found.", "error");
      return;
    }
    const q = doc.data();
    const exportData = {
      title: q.title || 'Kingdom Quiz',
      category: q.category || 'General',
      description: q.description || '',
      coverUrl: q.coverUrl || q.imageUrl || '',
      rewardPerCorrect: q.rewardPerCorrect || 10,
      bonusReward: q.bonusReward || 25,
      questions: q.questions || []
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(q.title || 'quiz').toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast?.("📥 Quiz exported as JSON!", "success");
  } catch (err) {
    window.showToast?.("Error exporting quiz: " + err.message, "error");
  }
}

function renderDraftQuestionsList() {
  const container = document.getElementById('admin-draft-questions-list');
  const countEl = document.getElementById('admin-draft-q-count');
  if (countEl) countEl.innerText = adminDraftQuizQuestions.length;
  if (!container) return;

  container.innerHTML = adminDraftQuizQuestions.map((q, idx) => `
    <div class="p-3 bg-slate-50 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs flex items-center justify-between gap-2">
      <div class="truncate">
        <span class="font-bold text-slate-900 dark:text-zinc-100">Q${idx + 1}: ${q.question}</span>
        <span class="text-[10px] text-emerald-600 block">Answer: ${q.options[q.answerIndex]} (${q.scriptureReference || ''})</span>
      </div>
      <button type="button" onclick="removeDraftQuestion(${idx})" class="text-red-500 hover:text-red-700 p-1 font-bold cursor-pointer">✕</button>
    </div>
  `).join('');
}

function removeDraftQuestion(idx) {
  adminDraftQuizQuestions.splice(idx, 1);
  renderDraftQuestionsList();
}

function openAddQuestionModal() {
  const qPrompt = prompt("Enter the question prompt:");
  if (!qPrompt) return;
  const optA = prompt("Option A:") || "Option A";
  const optB = prompt("Option B:") || "Option B";
  const optC = prompt("Option C:") || "Option C";
  const optD = prompt("Option D:") || "Option D";
  const correctLetter = (prompt("Which option is correct? (A, B, C, or D):") || "A").toUpperCase();
  const scriptRef = prompt("Scripture Reference (optional):") || "";

  let answerIdx = 0;
  if (correctLetter === 'B') answerIdx = 1;
  if (correctLetter === 'C') answerIdx = 2;
  if (correctLetter === 'D') answerIdx = 3;

  adminDraftQuizQuestions.push({
    question: qPrompt,
    options: [optA, optB, optC, optD],
    answerIndex: answerIdx,
    scriptureReference: scriptRef
  });

  renderDraftQuestionsList();
}

async function handleCreateQuizSubmit(e) {
  e.preventDefault();
  if (adminDraftQuizQuestions.length === 0) {
    window.showToast?.("Please add at least 1 question to the quiz.", "warning");
    return;
  }

  const title = document.getElementById('admin-quiz-title')?.value?.trim();
  const category = document.getElementById('admin-quiz-category')?.value;
  const rewardPerQ = parseInt(document.getElementById('admin-quiz-reward-per-q')?.value) || 10;
  const bonusReward = parseInt(document.getElementById('admin-quiz-bonus-reward')?.value) || 25;

  const user = window.auth?.currentUser;

  try {
    await window.db.collection('custom_quizzes').add({
      title: title,
      category: category,
      rewardPerCorrect: rewardPerQ,
      bonusReward: bonusReward,
      questions: adminDraftQuizQuestions,
      coverUrl: adminDraftQuizCover,
      imageUrl: adminDraftQuizCover,
      participantsCount: 0,
      status: 'live',
      createdById: user?.uid || 'admin',
      createdByName: user?.displayName || 'Pastor Daniel (Super Admin)',
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    window.soundEngine?.playSuccess?.();
    window.showToast?.("🎉 Live Quiz launched successfully! Believers can now participate and chat in real-time.", "success");
    document.getElementById('admin-create-quiz-form')?.reset();
    adminDraftQuizCover = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80';
    const prev = document.getElementById('admin-quiz-cover-preview');
    if (prev) prev.src = adminDraftQuizCover;
  } catch (err) {
    console.error("Error creating quiz:", err);
    window.showToast?.("Error creating quiz: " + err.message, "error");
  }
}

function syncAdminQuizzesList() {
  const container = document.getElementById('admin-quizzes-list-container');
  if (!container) return;

  if (adminQuizzesListener) adminQuizzesListener();
  const db = window.db;
  if (!db) return;

  adminQuizzesListener = db.collection('custom_quizzes').orderBy('createdAt', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<div class="py-8 text-center text-xs text-slate-400">No custom live quizzes launched yet. Use the form on the left or import JSON to create one!</div>`;
      return;
    }

    snap.forEach(doc => {
      const q = doc.data();
      const isLive = q.status === 'live';
      const card = document.createElement('div');
      card.className = "glass-panel rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-zinc-800";

      const coverUrl = q.coverUrl || q.imageUrl || '';

      card.innerHTML = `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3.5">
            <div class="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200 dark:border-zinc-700">
              ${coverUrl ? `
                <img src="${coverUrl}" class="w-full h-full object-cover" alt="${q.title}" />
              ` : `
                <div class="w-full h-full flex items-center justify-center text-purple-500"><i data-lucide="trophy" class="w-6 h-6"></i></div>
              `}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full ${isLive ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-100 text-slate-600'} text-[10px] font-black uppercase font-mono">
                  ${isLive ? '🔴 LIVE NOW' : 'ENDED'}
                </span>
                <span class="text-xs font-bold text-amber-500 font-mono">🪙 +${q.rewardPerCorrect || 10} KC/Q</span>
              </div>
              <h4 class="font-black text-base text-slate-900 dark:text-zinc-100 font-display mt-1">${q.title}</h4>
              <p class="text-xs text-slate-400">${q.questions ? q.questions.length : 0} Questions • Category: ${q.category || 'General'}</p>
            </div>
          </div>

          <!-- Real-time Participant Count Badge -->
          <div class="flex items-center gap-3 bg-purple-50 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200 dark:border-purple-900 shrink-0">
            <i data-lucide="users" class="w-5 h-5 text-purple-600 dark:text-purple-400"></i>
            <div>
              <span class="text-[10px] uppercase font-black text-purple-600 dark:text-purple-400 block">Participants</span>
              <span class="text-base font-black font-mono text-slate-900 dark:text-zinc-100">${q.participantsCount || 0} Believers</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="switchTab('quiz'); window.joinSuperAdminQuiz('${doc.id}');" class="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5">
              <i data-lucide="play" class="w-3.5 h-3.5"></i> Enter Room
            </button>
            <button onclick="openEditQuizModal('${doc.id}')" class="px-3 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-700 dark:text-purple-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-purple-500/30">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit Quiz
            </button>
            <button onclick="window.openChangeCoverModal('quiz', '${doc.id}')" class="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-purple-500"></i> Change Cover
            </button>
            <button onclick="exportQuizToJson('${doc.id}')" class="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1">
              <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-500"></i> Export JSON
            </button>
            <button onclick="toggleQuizLiveStatus('${doc.id}', '${isLive ? 'ended' : 'live'}')" class="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer">
              ${isLive ? 'End Quiz' : 'Re-Open Quiz'}
            </button>
          </div>

          <button onclick="deleteQuizDirect('${doc.id}')" class="px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs rounded-xl transition-all cursor-pointer">
            Delete
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Admin quizzes sync error:", err));
}

// Edit Quiz Modal Logic
async function openEditQuizModal(quizId) {
  adminEditingQuizId = quizId;
  const modal = document.getElementById('edit-quiz-modal');
  if (!modal) return;

  try {
    const doc = await window.db.collection('custom_quizzes').doc(quizId).get();
    if (!doc.exists) {
      window.showToast?.("Quiz not found.", "error");
      return;
    }
    const q = doc.data();

    const idEl = document.getElementById('edit-quiz-id');
    const titleEl = document.getElementById('edit-quiz-title');
    const catEl = document.getElementById('edit-quiz-category');
    const descEl = document.getElementById('edit-quiz-desc');
    const rewardEl = document.getElementById('edit-quiz-reward-per-q');
    const bonusEl = document.getElementById('edit-quiz-bonus-reward');
    const statusEl = document.getElementById('edit-quiz-status');

    if (idEl) idEl.value = quizId;
    if (titleEl) titleEl.value = q.title || '';
    if (catEl) catEl.value = q.category || 'New Testament';
    if (descEl) descEl.value = q.description || '';
    if (rewardEl) rewardEl.value = q.rewardPerCorrect || 10;
    if (bonusEl) bonusEl.value = q.bonusReward || 25;
    if (statusEl) statusEl.value = q.status || 'live';

    adminEditingQuizCover = q.coverUrl || q.imageUrl || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80';
    const prev = document.getElementById('edit-quiz-cover-preview');
    if (prev) prev.src = adminEditingQuizCover;

    adminEditingQuizQuestions = (q.questions || []).map(item => ({ ...item }));
    renderEditQuizQuestionsList();

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    window.showToast?.("Error loading quiz: " + err.message, "error");
  }
}

function closeEditQuizModal() {
  const modal = document.getElementById('edit-quiz-modal');
  if (modal) modal.classList.add('hidden');
}

function renderEditQuizQuestionsList() {
  const container = document.getElementById('edit-quiz-questions-list');
  const countEl = document.getElementById('edit-quiz-q-count');
  if (countEl) countEl.innerText = adminEditingQuizQuestions.length;
  if (!container) return;

  if (adminEditingQuizQuestions.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No questions. Click "+ Add Question" to add one.</div>`;
    return;
  }

  container.innerHTML = adminEditingQuizQuestions.map((q, idx) => `
    <div class="p-3 bg-slate-50 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs flex items-center justify-between gap-2">
      <div class="truncate">
        <span class="font-bold text-slate-900 dark:text-zinc-100">Q${idx + 1}: ${q.question}</span>
        <span class="text-[10px] text-purple-600 dark:text-purple-400 block font-semibold">Answer: ${q.options[q.answerIndex] || 'None'} ${q.scriptureReference ? `(${q.scriptureReference})` : ''}</span>
      </div>
      <button type="button" onclick="removeQuestionFromEditQuiz(${idx})" class="text-red-500 hover:text-red-700 p-1 font-bold cursor-pointer">✕</button>
    </div>
  `).join('');
}

function removeQuestionFromEditQuiz(idx) {
  adminEditingQuizQuestions.splice(idx, 1);
  renderEditQuizQuestionsList();
}

function openAddQuestionToEditQuizModal() {
  const qPrompt = prompt("Enter the question prompt:");
  if (!qPrompt) return;
  const optA = prompt("Option A:") || "Option A";
  const optB = prompt("Option B:") || "Option B";
  const optC = prompt("Option C:") || "Option C";
  const optD = prompt("Option D:") || "Option D";
  const correctLetter = (prompt("Which option is correct? (A, B, C, or D):") || "A").toUpperCase();
  const scriptRef = prompt("Scripture Reference (optional):") || "";

  let answerIdx = 0;
  if (correctLetter === 'B') answerIdx = 1;
  if (correctLetter === 'C') answerIdx = 2;
  if (correctLetter === 'D') answerIdx = 3;

  adminEditingQuizQuestions.push({
    question: qPrompt,
    options: [optA, optB, optC, optD],
    answerIndex: answerIdx,
    scriptureReference: scriptRef
  });

  renderEditQuizQuestionsList();
}

function handleEditQuizCoverSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    compressImageToDataUrlSafe(event.target.result, 1280, 720, 0.85, (compressed) => {
      adminEditingQuizCover = compressed;
      const prev = document.getElementById('edit-quiz-cover-preview');
      if (prev) prev.src = adminEditingQuizCover;
    });
  };
  reader.readAsDataURL(file);
}

function promptEditQuizCoverUrl() {
  const url = prompt("Enter Image URL for Quiz Cover Banner:", adminEditingQuizCover);
  if (url && url.trim()) {
    adminEditingQuizCover = url.trim();
    const prev = document.getElementById('edit-quiz-cover-preview');
    if (prev) prev.src = adminEditingQuizCover;
  }
}

async function handleSaveEditedQuiz(e) {
  e.preventDefault();
  if (!adminEditingQuizId) return;

  if (adminEditingQuizQuestions.length === 0) {
    window.showToast?.("Please keep at least 1 question in the quiz.", "warning");
    return;
  }

  const title = document.getElementById('edit-quiz-title')?.value?.trim();
  const category = document.getElementById('edit-quiz-category')?.value;
  const desc = document.getElementById('edit-quiz-desc')?.value?.trim();
  const rewardPerQ = parseInt(document.getElementById('edit-quiz-reward-per-q')?.value) || 10;
  const bonusReward = parseInt(document.getElementById('edit-quiz-bonus-reward')?.value) || 25;
  const status = document.getElementById('edit-quiz-status')?.value || 'live';

  try {
    await window.db.collection('custom_quizzes').doc(adminEditingQuizId).update({
      title: title,
      category: category,
      description: desc,
      rewardPerCorrect: rewardPerQ,
      bonusReward: bonusReward,
      status: status,
      coverUrl: adminEditingQuizCover,
      imageUrl: adminEditingQuizCover,
      questions: adminEditingQuizQuestions,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    window.soundEngine?.playSuccess?.();
    window.showToast?.("🚀 Quiz updated successfully!", "success");
    closeEditQuizModal();
  } catch (err) {
    window.showToast?.("Error updating quiz: " + err.message, "error");
  }
}

async function toggleQuizLiveStatus(quizId, newStatus) {
  try {
    await window.db.collection('custom_quizzes').doc(quizId).update({
      status: newStatus
    });
    window.showToast?.(`Quiz status set to ${newStatus}.`, "info");
  } catch (err) {
    window.showToast?.("Error updating quiz: " + err.message, "error");
  }
}

async function deleteQuizDirect(quizId) {
  let isConfirmed = false;
  if (window.showConfirmDialog) {
    isConfirmed = await window.showConfirmDialog({
      title: "Delete Live Quiz?",
      message: "Are you sure you want to delete this live quiz? This will remove it from the Kingdom Hub for all members.",
      confirmText: "Delete Quiz",
      cancelText: "Cancel",
      isDanger: true,
      icon: "trash-2"
    });
  } else {
    try {
      isConfirmed = confirm("Are you sure you want to delete this live quiz?");
    } catch (e) {
      isConfirmed = true;
    }
  }
  if (!isConfirmed) return;

  try {
    await window.db.collection('custom_quizzes').doc(quizId).delete();
    window.soundEngine?.playSuccess?.();
    window.showToast?.("Quiz deleted.", "info");
  } catch (err) {
    window.showToast?.("Error deleting quiz: " + err.message, "error");
  }
}

// 3. House Cell Creator
function renderAdminCellsPane(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
        <div>
          <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Create New House Cell</h3>
          <p class="text-xs text-slate-400">Establish a new geographical fellowship unit for weekly discipleship.</p>
        </div>

        <form onsubmit="handleCreateCellSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Cell Name</label>
            <input type="text" id="admin-cell-name" required placeholder="e.g. Grace & Truth Cell" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">City / Location</label>
            <input type="text" id="admin-cell-city" required placeholder="e.g. Port Harcourt, GRA Phase 2" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Cell Leader Name & Email</label>
            <input type="text" id="admin-cell-leader" required placeholder="e.g. Brother Emmanuel (leader@example.com)" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Weekly Meeting Schedule</label>
            <input type="text" id="admin-cell-schedule" required placeholder="e.g. Every Wednesday 6:00 PM" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Vision / Description</label>
            <textarea id="admin-cell-desc" rows="3" required placeholder="Brief description of fellowship focus..." class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3"></textarea>
          </div>
          <button type="submit" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl shadow cursor-pointer transition-all">
            Establish Cell Group
          </button>
        </form>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">Active House Cells Network</h4>
        <div id="admin-cells-list-container" class="space-y-3"></div>
      </div>
    </div>
  `;
  syncAdminCells();
}

function syncAdminCells() {
  const container = document.getElementById('admin-cells-list-container');
  if (!container) return;

  if (adminCellsListener) adminCellsListener();
  const db = window.db;
  if (!db) return;

  adminCellsListener = db.collection('cells').orderBy('createdAt', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No house cells created yet.</div>`;
      return;
    }

    snap.forEach(doc => {
      const c = doc.data();
      const card = document.createElement('div');
      card.className = "glass-panel rounded-2xl p-5 space-y-2 border border-slate-200 dark:border-zinc-800 flex items-center justify-between";
      card.innerHTML = `
        <div>
          <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">${c.name}</h4>
          <p class="text-xs text-slate-500">${c.city} • Leader: ${c.leaderName}</p>
          <span class="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">${c.meetingDayTime || 'Wednesdays 6:00 PM'}</span>
        </div>
        <button onclick="deleteCellDirect('${doc.id}')" class="text-red-500 hover:text-red-700 text-xs font-bold p-2">Delete</button>
      `;
      container.appendChild(card);
    });
  }, err => console.warn("Admin cells sync error:", err));
}

async function handleCreateCellSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('admin-cell-name')?.value?.trim();
  const city = document.getElementById('admin-cell-city')?.value?.trim();
  const leader = document.getElementById('admin-cell-leader')?.value?.trim();
  const schedule = document.getElementById('admin-cell-schedule')?.value?.trim();
  const desc = document.getElementById('admin-cell-desc')?.value?.trim();

  try {
    await window.db.collection('cells').add({
      name: name,
      city: city,
      leaderName: leader,
      meetingDayTime: schedule,
      description: desc,
      membersCount: 1,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
    window.showToast?.("🎉 House cell group established successfully!", "success");
    switchAdminSubTab('cells');
  } catch (err) {
    window.showToast?.("Error: " + err.message, "error");
  }
}

async function deleteCellDirect(cellId) {
  let isConfirmed = false;
  if (window.showConfirmDialog) {
    isConfirmed = await window.showConfirmDialog({
      title: "Delete House Cell?",
      message: "Are you sure you want to delete this house cell from the church network?",
      confirmText: "Delete Cell",
      cancelText: "Cancel",
      isDanger: true,
      icon: "trash-2"
    });
  } else {
    try {
      isConfirmed = confirm("Are you sure you want to delete this house cell?");
    } catch (e) {
      isConfirmed = true;
    }
  }
  if (!isConfirmed) return;

  try {
    await window.db.collection('cells').doc(cellId).delete();
    window.soundEngine?.playSuccess?.();
    window.showToast?.("Cell removed.", "info");
  } catch (err) {
    window.showToast?.("Error deleting cell: " + err.message, "error");
  }
}

// 4. Church Broadcast Announcement
function renderAdminBroadcastPane(container) {
  container.innerHTML = `
    <div class="max-w-2xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div>
        <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Publish Church-Wide Broadcast</h3>
        <p class="text-xs text-slate-400">Broadcast official messages, pastoral updates, and urgent ministry alerts directly to all believer feeds.</p>
      </div>

      <form onsubmit="handleAdminBroadcastSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Broadcast Title</label>
          <input type="text" id="broadcast-title" required placeholder="e.g. All-Night Miracle Service Announcement" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Message Body</label>
          <textarea id="broadcast-content" rows="4" required placeholder="Write the announcement message to the fellowship..." class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3"></textarea>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="broadcast-push" class="rounded text-purple-600 cursor-pointer" checked />
          <label for="broadcast-push" class="text-xs font-bold text-purple-600 dark:text-purple-400 cursor-pointer">Send instant push notification banner</label>
        </div>

        <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg cursor-pointer transition-all">
          Broadcast Message 📢
        </button>
      </form>
    </div>
  `;
}

async function handleAdminBroadcastSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('broadcast-title')?.value?.trim();
  const content = document.getElementById('broadcast-content')?.value?.trim();
  const push = document.getElementById('broadcast-push')?.checked;

  if (!title || !content) {
    window.showToast?.("Please enter broadcast title and message.", "warning");
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Broadcasting to Fellowship...`;
  }

  const user = window.auth?.currentUser;
  const newPostId = window.db ? window.db.collection('community_feed').doc().id : `post_${Date.now()}`;

  try {
    const postData = {
      id: newPostId,
      type: 'announcement',
      authorUid: user?.uid || 'super-admin',
      authorName: user?.displayName || 'Pastor Daniel (Super Admin)',
      authorPhotoURL: user?.photoURL || null,
      authorRole: 'Super Admin',
      title: title,
      text: content,
      likesCount: 0,
      likes: {},
      comments: [],
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    if (window.db) {
      // Save to primary community_feed collection
      await window.db.collection('community_feed').doc(newPostId).set(postData);
      // Also save to posts collection for backwards compatibility
      await window.db.collection('posts').doc(newPostId).set(postData).catch(() => {});
    }

    if (push) {
      if (window.dispatchPushNotification) {
        await window.dispatchPushNotification(title, content, 'announcement', './#view-feed');
      } else if (window.recordNotification) {
        await window.recordNotification(title, content, 'announcement', './#view-feed', 'all');
      }
    }

    window.soundEngine?.playSuccess?.();
    window.showToast?.("📢 Church broadcast published to feed & dispatched off-app!", "success");
    e.target.reset();
    if (window.switchTab) switchTab('feed');
  } catch (err) {
    window.showToast?.("Error: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Broadcast Message 📢`;
    }
  }
}

// 5. Devotionals Publisher & Cover Photo Management
function renderAdminDevotionalsPane(container) {
  adminDevDraftCover = 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80';

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Create Devotional Form -->
      <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Publish Daily Devotional</h3>
          <p class="text-xs text-slate-400">Release the morning bread of life with a high-definition cover for members to read and earn +10 KC.</p>
        </div>

        <form onsubmit="handlePublishDevotionalSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Title</label>
            <input type="text" id="admin-dev-title" required placeholder="e.g. Walking in Divine Favor" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Scripture Reference</label>
            <input type="text" id="admin-dev-scripture" required placeholder="e.g. Psalm 5:12" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Devotional Body</label>
            <textarea id="admin-dev-body" rows="4" required placeholder="Inspirational reflection and teaching..." class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Guided Prayer</label>
            <textarea id="admin-dev-prayer" rows="2" required placeholder="Lord, surround me with Your favor today..." class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100"></textarea>
          </div>

          <!-- Cover Photo Picker Box -->
          <div class="p-4 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-800 dark:text-zinc-200">
                🖼️ Devotional Cover Photo
              </label>
              <span class="text-[10px] text-amber-500 font-bold">HD Banner</span>
            </div>

            <div class="relative h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600">
              <img id="admin-dev-cover-preview" src="${adminDevDraftCover}" class="w-full h-full object-cover" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <label class="cursor-pointer py-2 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:border-amber-500 text-[11px] font-bold text-center text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-amber-500"></i>
                <span>Upload File</span>
                <input type="file" id="admin-dev-cover-file" accept="image/*" onchange="handleAdminDevCoverSelect(event)" class="hidden" />
              </label>

              <button type="button" onclick="promptAdminDevCoverUrl()" class="py-2 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:border-amber-500 text-[11px] font-bold text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                <i data-lucide="link" class="w-3.5 h-3.5 text-blue-500"></i>
                <span>Paste URL</span>
              </button>
            </div>
          </div>

          <button type="submit" class="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl shadow cursor-pointer transition-all">
            Publish Devotional ☀️
          </button>
        </form>
      </div>

      <!-- Published Devotionals List with Cover Manager -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-black text-base text-slate-900 dark:text-zinc-100">Published Daily Devotionals</h4>
            <p class="text-xs text-slate-400">Edit devotional text, update cover banners, or delete devotionals.</p>
          </div>
        </div>
        <div id="admin-devotionals-list-container" class="space-y-3 max-h-[750px] overflow-y-auto pr-1">
          <div class="p-8 text-center text-xs text-slate-400">Loading devotionals...</div>
        </div>
      </div>
    </div>
  `;

  syncAdminDevotionalsList();
  if (window.lucide) window.lucide.createIcons();
}

function handleAdminDevCoverSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    compressImageToDataUrlSafe(event.target.result, 1280, 720, 0.85, (compressed) => {
      adminDevDraftCover = compressed;
      const prev = document.getElementById('admin-dev-cover-preview');
      if (prev) prev.src = adminDevDraftCover;
    });
  };
  reader.readAsDataURL(file);
}

function promptAdminDevCoverUrl() {
  const url = prompt("Enter Image URL for Devotional Cover:", adminDevDraftCover);
  if (url && url.trim()) {
    adminDevDraftCover = url.trim();
    const prev = document.getElementById('admin-dev-cover-preview');
    if (prev) prev.src = adminDevDraftCover;
  }
}

function syncAdminDevotionalsList() {
  const container = document.getElementById('admin-devotionals-list-container');
  if (!container) return;

  if (adminDevotionalsListener) adminDevotionalsListener();
  const db = window.db;
  if (!db) return;

  adminDevotionalsListener = db.collection('daily_devotionals')
    .orderBy('devotionalDate', 'desc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        // Try fallback
        db.collection('devotionals').get().then(fallbackSnap => {
          if (fallbackSnap.empty) {
            container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No devotionals published yet.</div>`;
            return;
          }
          renderAdminDevotionalsCards(fallbackSnap);
        }).catch(() => {
          container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No devotionals published yet.</div>`;
        });
        return;
      }
      renderAdminDevotionalsCards(snap);
    }, err => console.warn("Admin devotionals sync error:", err));
}

function renderAdminDevotionalsCards(snap) {
  const container = document.getElementById('admin-devotionals-list-container');
  if (!container) return;
  container.innerHTML = '';

  snap.forEach(doc => {
    const d = doc.data();
    const docId = doc.id;
    const card = document.createElement('div');
    card.className = "glass-panel rounded-2xl p-4 sm:p-5 space-y-3 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4";

    card.innerHTML = `
      <div class="flex items-center gap-3.5">
        <div class="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200 dark:border-zinc-700">
          ${d.imageUrl ? `
            <img src="${d.imageUrl}" class="w-full h-full object-cover" alt="${d.title}" />
          ` : `
            <div class="w-full h-full flex items-center justify-center text-amber-500"><i data-lucide="sun" class="w-6 h-6"></i></div>
          `}
        </div>
        <div class="space-y-0.5">
          <span class="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 font-mono">${d.devotionalDate || d.date || 'Daily'} • ${d.scripture || ''}</span>
          <h5 class="font-black text-sm text-slate-900 dark:text-zinc-100 line-clamp-1">${d.title}</h5>
          <p class="text-xs text-slate-400 line-clamp-1">${d.body || ''}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
        <button onclick="openEditDevotionalModal('${docId}')" class="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-amber-500/30">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          <span>Edit</span>
        </button>

        <button onclick="window.openChangeCoverModal('devotional', '${docId}')" class="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
          <i data-lucide="camera" class="w-3.5 h-3.5 text-amber-500"></i>
          <span>Change Cover</span>
        </button>

        <button onclick="deleteDevotionalDirect('${docId}')" class="px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs rounded-xl transition-all cursor-pointer">
          Delete
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

async function openEditDevotionalModal(devId) {
  adminEditingDevId = devId;
  const modal = document.getElementById('edit-devotional-modal');
  if (!modal) return;

  try {
    let d = window.devotionalsCache?.[devId];
    if (!d) {
      const doc = await window.db.collection('daily_devotionals').doc(devId).get();
      if (doc.exists) {
        d = { id: doc.id, ...doc.data() };
      } else {
        const fallbackDoc = await window.db.collection('devotionals').doc(devId).get();
        if (fallbackDoc.exists) d = { id: fallbackDoc.id, ...fallbackDoc.data() };
      }
    }

    if (!d) {
      window.showToast?.("Devotional not found.", "error");
      return;
    }

    const idEl = document.getElementById('edit-dev-id');
    const titleEl = document.getElementById('edit-dev-title');
    const scriptureEl = document.getElementById('edit-dev-scripture');
    const dateEl = document.getElementById('edit-dev-date');
    const bodyEl = document.getElementById('edit-dev-body');
    const prayerEl = document.getElementById('edit-dev-prayer');

    if (idEl) idEl.value = devId;
    if (titleEl) titleEl.value = d.title || '';
    if (scriptureEl) scriptureEl.value = d.scripture || '';
    if (dateEl) dateEl.value = d.devotionalDate || d.date || new Date().toISOString().split('T')[0];
    if (bodyEl) bodyEl.value = d.body || '';
    if (prayerEl) prayerEl.value = d.prayer || '';

    adminEditingDevCover = d.imageUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80';
    const prev = document.getElementById('edit-dev-cover-preview');
    if (prev) prev.src = adminEditingDevCover;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    window.showToast?.("Error opening devotional: " + err.message, "error");
  }
}

function closeEditDevotionalModal() {
  const modal = document.getElementById('edit-devotional-modal');
  if (modal) modal.classList.add('hidden');
}

function handleEditDevCoverSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    compressImageToDataUrlSafe(event.target.result, 1280, 720, 0.85, (compressed) => {
      adminEditingDevCover = compressed;
      const prev = document.getElementById('edit-dev-cover-preview');
      if (prev) prev.src = adminEditingDevCover;
    });
  };
  reader.readAsDataURL(file);
}

function promptEditDevCoverUrl() {
  const url = prompt("Enter Image URL for Devotional Cover:", adminEditingDevCover);
  if (url && url.trim()) {
    adminEditingDevCover = url.trim();
    const prev = document.getElementById('edit-dev-cover-preview');
    if (prev) prev.src = adminEditingDevCover;
  }
}

async function handleSaveEditedDevotional(e) {
  e.preventDefault();
  if (!adminEditingDevId) return;

  const title = document.getElementById('edit-dev-title')?.value?.trim();
  const scripture = document.getElementById('edit-dev-scripture')?.value?.trim();
  const devDate = document.getElementById('edit-dev-date')?.value?.trim();
  const body = document.getElementById('edit-dev-body')?.value?.trim();
  const prayer = document.getElementById('edit-dev-prayer')?.value?.trim();

  try {
    const updateData = {
      title: title,
      scripture: scripture,
      devotionalDate: devDate,
      date: devDate,
      body: body,
      prayer: prayer,
      imageUrl: adminEditingDevCover,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    await window.db.collection('daily_devotionals').doc(adminEditingDevId).update(updateData);
    await window.db.collection('devotionals').doc(adminEditingDevId).update(updateData).catch(() => {});

    if (window.devotionalsCache && window.devotionalsCache[adminEditingDevId]) {
      Object.assign(window.devotionalsCache[adminEditingDevId], updateData);
    }

    const modalTitle = document.getElementById('modal-devotional-title');
    if (modalTitle) {
      const modalDate = document.getElementById('modal-devotional-date');
      const modalScripture = document.getElementById('modal-devotional-scripture');
      const modalBody = document.getElementById('modal-devotional-body');
      const modalPrayer = document.getElementById('modal-devotional-prayer');
      const modalImg = document.getElementById('modal-devotional-img');

      if (modalDate) modalDate.innerText = devDate;
      if (modalScripture) modalScripture.innerText = scripture;
      if (modalTitle) modalTitle.innerText = title;
      if (modalBody) modalBody.innerText = body;
      if (modalPrayer) modalPrayer.innerText = prayer;
      if (modalImg && adminEditingDevCover) {
        modalImg.src = adminEditingDevCover;
        modalImg.parentElement?.classList?.remove('hidden');
      }
    }

    window.soundEngine?.playSuccess?.();
    window.showToast?.("☀️ Devotional updated successfully!", "success");
    closeEditDevotionalModal();
  } catch (err) {
    window.showToast?.("Error updating devotional: " + err.message, "error");
  }
}

async function deleteDevotionalDirect(devId) {
  let isConfirmed = false;
  if (window.showConfirmDialog) {
    isConfirmed = await window.showConfirmDialog({
      title: "Delete Devotional?",
      message: "Are you sure you want to delete this devotional message?",
      confirmText: "Delete Devotional",
      cancelText: "Cancel",
      isDanger: true,
      icon: "trash-2"
    });
  } else {
    try {
      isConfirmed = confirm("Are you sure you want to delete this devotional?");
    } catch (e) {
      isConfirmed = true;
    }
  }
  if (!isConfirmed) return;

  try {
    await window.db.collection('daily_devotionals').doc(devId).delete();
    await window.db.collection('devotionals').doc(devId).delete().catch(() => {});
    window.soundEngine?.playSuccess?.();
    window.showToast?.("Devotional deleted.", "info");
  } catch (err) {
    window.showToast?.("Error deleting: " + err.message, "error");
  }
}

async function handlePublishDevotionalSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('admin-dev-title')?.value?.trim();
  const scripture = document.getElementById('admin-dev-scripture')?.value?.trim();
  const body = document.getElementById('admin-dev-body')?.value?.trim();
  const prayer = document.getElementById('admin-dev-prayer')?.value?.trim();
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const devData = {
      title: title,
      scripture: scripture,
      body: body,
      prayer: prayer,
      devotionalDate: todayStr,
      date: todayStr,
      author: 'Pastor Daniel Giobari (Super Admin)',
      imageUrl: adminDevDraftCover || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    await window.db.collection('daily_devotionals').add(devData);
    await window.db.collection('devotionals').add(devData).catch(() => {});

    window.soundEngine?.playSuccess?.();
    window.showToast?.("☀️ Devotional published successfully!", "success");
    switchTab('devotionals');
  } catch (err) {
    window.showToast?.("Error: " + err.message, "error");
  }
}

// 6. Gatherings Scheduler & Cover Photo Management
function renderAdminEventsPane(container) {
  adminEventDraftCover = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80';

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Schedule Event Form -->
      <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Schedule Church Gathering</h3>
          <p class="text-xs text-slate-400">Post upcoming conferences, cell rallies, and prayer meetings with custom cover artwork.</p>
        </div>

        <form onsubmit="handleCreateEventSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Event Title</label>
            <input type="text" id="admin-event-title" required placeholder="e.g. Kingdom Leaders Summit" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Date & Time</label>
            <input type="text" id="admin-event-datetime" required placeholder="e.g. Sunday, 10:00 AM" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Location / Venue</label>
            <input type="text" id="admin-event-location" required placeholder="e.g. Main Sanctuary & Online Livestream" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea id="admin-event-desc" rows="3" required placeholder="Details about this gathering..." class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-900 dark:text-zinc-100"></textarea>
          </div>

          <!-- Cover Photo Picker Box -->
          <div class="p-4 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-800 dark:text-zinc-200">
                🖼️ Gathering Cover Artwork
              </label>
              <span class="text-[10px] text-purple-500 font-bold">HD Banner</span>
            </div>

            <div class="relative h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600">
              <img id="admin-event-cover-preview" src="${adminEventDraftCover}" class="w-full h-full object-cover" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <label class="cursor-pointer py-2 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:border-purple-500 text-[11px] font-bold text-center text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-purple-500"></i>
                <span>Upload File</span>
                <input type="file" id="admin-event-cover-file" accept="image/*" onchange="handleAdminEventCoverSelect(event)" class="hidden" />
              </label>

              <button type="button" onclick="promptAdminEventCoverUrl()" class="py-2 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:border-purple-500 text-[11px] font-bold text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                <i data-lucide="link" class="w-3.5 h-3.5 text-blue-500"></i>
                <span>Paste URL</span>
              </button>
            </div>
          </div>

          <button type="submit" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl shadow cursor-pointer transition-all">
            Schedule Gathering 📅
          </button>
        </form>
      </div>

      <!-- Scheduled Events List with Cover Manager -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-black text-base text-slate-900 dark:text-zinc-100">Scheduled Gatherings & Events</h4>
            <p class="text-xs text-slate-400">Click 'Change Cover' on any event to update its banner image with an uploaded file or URL.</p>
          </div>
        </div>
        <div id="admin-events-list-container" class="space-y-3 max-h-[750px] overflow-y-auto pr-1">
          <div class="p-8 text-center text-xs text-slate-400">Loading scheduled gatherings...</div>
        </div>
      </div>
    </div>
  `;

  syncAdminEventsList();
  if (window.lucide) window.lucide.createIcons();
}

function handleAdminEventCoverSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    adminEventDraftCover = event.target.result;
    const prev = document.getElementById('admin-event-cover-preview');
    if (prev) prev.src = adminEventDraftCover;
  };
  reader.readAsDataURL(file);
}

function promptAdminEventCoverUrl() {
  const url = prompt("Enter Image URL for Gathering Cover:", adminEventDraftCover);
  if (url && url.trim()) {
    adminEventDraftCover = url.trim();
    const prev = document.getElementById('admin-event-cover-preview');
    if (prev) prev.src = adminEventDraftCover;
  }
}

function syncAdminEventsList() {
  const container = document.getElementById('admin-events-list-container');
  if (!container) return;

  if (adminEventsListener) adminEventsListener();
  const db = window.db;
  if (!db) return;

  adminEventsListener = db.collection('upcoming_events')
    .orderBy('eventDate', 'desc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        db.collection('events').get().then(fallbackSnap => {
          if (fallbackSnap.empty) {
            container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No upcoming events scheduled yet.</div>`;
            return;
          }
          renderAdminEventsCards(fallbackSnap);
        }).catch(() => {
          container.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">No upcoming events scheduled yet.</div>`;
        });
        return;
      }
      renderAdminEventsCards(snap);
    }, err => console.warn("Admin events sync error:", err));
}

function renderAdminEventsCards(snap) {
  const container = document.getElementById('admin-events-list-container');
  if (!container) return;
  container.innerHTML = '';

  snap.forEach(doc => {
    const ev = doc.data();
    const docId = doc.id;
    const card = document.createElement('div');
    card.className = "glass-panel rounded-2xl p-4 sm:p-5 space-y-3 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4";

    card.innerHTML = `
      <div class="flex items-center gap-3.5">
        <div class="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200 dark:border-zinc-700">
          ${ev.imageUrl ? `
            <img src="${ev.imageUrl}" class="w-full h-full object-cover" alt="${ev.title}" />
          ` : `
            <div class="w-full h-full flex items-center justify-center text-purple-500"><i data-lucide="calendar" class="w-6 h-6"></i></div>
          `}
        </div>
        <div class="space-y-0.5">
          <span class="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 font-mono">${ev.eventDate || 'Date TBA'}</span>
          <h5 class="font-black text-sm text-slate-900 dark:text-zinc-100 line-clamp-1">${ev.title}</h5>
          <p class="text-xs text-slate-400 line-clamp-1">📍 ${ev.location || 'Church'} • ${ev.attendeesCount || 0} RSVPs</p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button onclick="window.openChangeCoverModal('event', '${docId}')" class="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-purple-500/30">
          <i data-lucide="camera" class="w-3.5 h-3.5"></i>
          <span>Change Cover</span>
        </button>

        <button onclick="deleteEventDirect('${docId}')" class="px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs rounded-xl transition-all cursor-pointer">
          Delete
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

async function deleteEventDirect(eventId) {
  let isConfirmed = false;
  if (window.showConfirmDialog) {
    isConfirmed = await window.showConfirmDialog({
      title: "Delete Event?",
      message: "Are you sure you want to delete this upcoming church gathering?",
      confirmText: "Delete Event",
      cancelText: "Cancel",
      isDanger: true,
      icon: "trash-2"
    });
  } else {
    try {
      isConfirmed = confirm("Are you sure you want to delete this event?");
    } catch (e) {
      isConfirmed = true;
    }
  }
  if (!isConfirmed) return;

  try {
    await window.db.collection('upcoming_events').doc(eventId).delete();
    await window.db.collection('events').doc(eventId).delete().catch(() => {});
    window.soundEngine?.playSuccess?.();
    window.showToast?.("Gathering removed.", "info");
  } catch (err) {
    window.showToast?.("Error deleting: " + err.message, "error");
  }
}

async function handleCreateEventSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('admin-event-title')?.value?.trim();
  const dt = document.getElementById('admin-event-datetime')?.value?.trim();
  const loc = document.getElementById('admin-event-location')?.value?.trim();
  const desc = document.getElementById('admin-event-desc')?.value?.trim();

  try {
    const eventData = {
      title: title,
      eventDate: dt,
      dateTime: dt,
      time: '10:00 AM',
      location: loc,
      description: desc,
      attendeesCount: 0,
      attendees: {},
      imageUrl: adminEventDraftCover || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    await window.db.collection('upcoming_events').add(eventData);
    await window.db.collection('events').add(eventData).catch(() => {});

    window.soundEngine?.playSuccess?.();
    window.showToast?.("📅 Gathering scheduled successfully!", "success");
    switchTab('events');
  } catch (err) {
    window.showToast?.("Error: " + err.message, "error");
  }
}

// 7. Custom Requests Orders Fulfillment
function renderAdminRequestsPane(container) {
  container.innerHTML = `
    <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div>
        <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Custom Media Orders Fulfillment</h3>
        <p class="text-xs text-slate-400">Review member custom wallpaper and poster orders, attach high-res links, and deliver.</p>
      </div>
      <div id="admin-requests-list" class="space-y-4"></div>
    </div>
  `;
  syncAdminRequests();
}

function syncAdminRequests() {
  const container = document.getElementById('admin-requests-list');
  if (!container) return;

  if (adminRequestsListener) adminRequestsListener();
  const db = window.db;
  if (!db) return;

  adminRequestsListener = db.collection('custom_requests').orderBy('createdAt', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No custom orders submitted yet.</div>`;
      return;
    }

    snap.forEach(doc => {
      const r = doc.data();
      const card = document.createElement('div');
      card.className = "p-5 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 space-y-3";
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm text-slate-900 dark:text-zinc-100">${r.desiredText}</span>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono ${r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${r.status || 'Pending'}</span>
        </div>
        <p class="text-xs text-slate-500">${r.description}</p>
        <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs">
          <span class="text-slate-400 font-mono">By: ${r.userName || r.userId}</span>
          <button onclick="deliverCustomOrder('${doc.id}')" class="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs">Fulfill & Deliver</button>
        </div>
      `;
      container.appendChild(card);
    });
  }, err => console.warn("Admin requests sync error:", err));
}

async function deliverCustomOrder(reqId) {
  const deliverableUrl = prompt("Enter the High-Res Download URL for this custom request:", "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1920&q=80");
  if (!deliverableUrl) return;

  try {
    await window.db.collection('custom_requests').doc(reqId).update({
      status: 'Completed',
      deliverableUrl: deliverableUrl,
      completedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
    window.showToast?.("Custom request marked as completed!", "success");
  } catch (err) {
    window.showToast?.("Error: " + err.message, "error");
  }
}

// 8. Store Inventory Creator & Catalog Management
let adminUploadedCoverBase64 = null;
let adminUploadedFileBase64 = null;
let adminProductsListener = null;

function renderAdminInventoryPane(container) {
  container.innerHTML = `
    <div class="space-y-8">
      <!-- Upload Resource Form -->
      <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>🛍️</span> Upload Resource to Kingdom Store
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Upload wallpapers, devotionals, guides, and scripture cards directly from your phone or computer.</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase font-mono border border-emerald-500/30">
            Direct Device Upload Ready
          </span>
        </div>

        <form id="admin-product-upload-form" onsubmit="handleAdminStoreProductUploadSubmit(event)" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Product Title *</label>
              <input type="text" id="admin-prod-title" required placeholder="e.g. Psalms of Peace 4K Wallpaper Pack" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Category *</label>
              <select id="admin-prod-category" class="w-full text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="Wallpapers">4K Wallpapers</option>
                <option value="Quotes">Inspirational Quotes</option>
                <option value="Scripture Collections">Scripture Collections</option>
                <option value="Devotionals & Guides">Devotionals & Guides</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Price (Kingdom Coins) *</label>
              <input type="number" id="admin-prod-price" required value="50" min="1" max="5000" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 font-mono font-black text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Collection Name</label>
              <input type="text" id="admin-prod-collection" placeholder="e.g. Morning & Night Prayer" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Author / Ministry</label>
              <input type="text" id="admin-prod-author" value="Pastor Daniel (Super Admin)" class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>

          <!-- Direct Device File Uploaders -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-zinc-850/60 rounded-3xl border border-slate-200 dark:border-zinc-750">
            <!-- 1. Cover Image Upload from Device -->
            <div class="space-y-3">
              <label class="block text-xs font-black text-slate-800 dark:text-zinc-200">
                🖼️ Cover Artwork (Direct from Device or URL)
              </label>
              
              <div class="flex items-center gap-3">
                <label class="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800 border border-dashed border-slate-300 dark:border-zinc-600 hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-all shadow-xs">
                  <i data-lucide="upload-cloud" class="w-4 h-4 text-amber-500"></i>
                  <span>Choose Image File</span>
                  <input type="file" id="admin-prod-cover-file" accept="image/*" onchange="handleAdminCoverFileSelect(event)" class="hidden" />
                </label>
              </div>

              <div id="admin-prod-cover-preview-box" class="hidden relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 h-32 bg-slate-100 dark:bg-zinc-800">
                <img id="admin-prod-cover-preview" class="w-full h-full object-cover" />
                <button type="button" onclick="clearAdminCoverFile()" class="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white text-xs hover:bg-red-600 cursor-pointer">✕</button>
              </div>

              <div>
                <span class="text-[10px] text-slate-400 block mb-1">Or paste Image URL:</span>
                <input type="url" id="admin-prod-img-url" placeholder="https://images.unsplash.com/..." class="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100" />
              </div>
            </div>

            <!-- 2. Resource File Download Upload from Device -->
            <div class="space-y-3">
              <label class="block text-xs font-black text-slate-800 dark:text-zinc-200">
                📦 Digital Download File (Direct from Device or URL)
              </label>

              <div class="flex items-center gap-3">
                <label class="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800 border border-dashed border-slate-300 dark:border-zinc-600 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-all shadow-xs">
                  <i data-lucide="file-up" class="w-4 h-4 text-emerald-500"></i>
                  <span>Choose Resource File (PDF/Zip/Image)</span>
                  <input type="file" id="admin-prod-resource-file" onchange="handleAdminResourceFileSelect(event)" class="hidden" />
                </label>
              </div>

              <div id="admin-prod-file-status" class="hidden p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-300 dark:border-emerald-800"></div>

              <div>
                <span class="text-[10px] text-slate-400 block mb-1">Or paste File Download URL:</span>
                <input type="url" id="admin-prod-file-url" placeholder="https://..." class="w-full text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100" />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Description *</label>
            <textarea id="admin-prod-desc" rows="3" required placeholder="Describe the spiritual value, format, resolution, and usage..." class="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
            <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
              <input type="checkbox" id="admin-prod-featured" class="w-4 h-4 rounded text-amber-500 focus:ring-amber-400" />
              <span>Feature on Store Home Banner ★</span>
            </label>

            <button type="submit" id="btn-admin-upload-prod" class="px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-105 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/25 cursor-pointer transition-all">
              Upload & Publish to Kingdom Store 🛍️
            </button>
          </div>
        </form>
      </div>

      <!-- Live Catalog Table -->
      <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Live Kingdom Store Catalog</h3>
            <p class="text-xs text-slate-400">Manage all listed products, pricing, and active listings.</p>
          </div>
          <button onclick="syncAdminStoreProductsCatalog()" class="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
            Refresh Catalog
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase font-black text-slate-400">
                <th class="py-3 px-4">Item</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Price</th>
                <th class="py-3 px-4">Collection</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-store-catalog-body">
              <tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">Loading catalog...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  syncAdminStoreProductsCatalog();
  if (window.lucide) window.lucide.createIcons();
}

let adminUploadedFileBlob = null;
let adminUploadedFileName = null;
let adminUploadedFileMime = null;

function handleAdminCoverFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  window.showToast?.("Optimizing cover photo from device...", "info");

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const maxWidth = 1280;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      adminUploadedCoverBase64 = canvas.toDataURL('image/jpeg', 0.82);

      const previewBox = document.getElementById('admin-prod-cover-preview-box');
      const previewImg = document.getElementById('admin-prod-cover-preview');
      if (previewImg) previewImg.src = adminUploadedCoverBase64;
      if (previewBox) previewBox.classList.remove('hidden');
      window.soundEngine?.playSuccess?.();
      window.showToast?.("Cover image ready from device!", "success");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearAdminCoverFile() {
  adminUploadedCoverBase64 = null;
  const input = document.getElementById('admin-prod-cover-file');
  if (input) input.value = '';
  const previewBox = document.getElementById('admin-prod-cover-preview-box');
  if (previewBox) previewBox.classList.add('hidden');
}

function handleAdminResourceFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  adminUploadedFileName = file.name;
  adminUploadedFileMime = file.type || 'application/octet-stream';
  adminUploadedFileBlob = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    adminUploadedFileBase64 = e.target.result;
    const statusBox = document.getElementById('admin-prod-file-status');
    if (statusBox) {
      statusBox.innerText = `✓ Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      statusBox.classList.remove('hidden');
    }
    window.soundEngine?.playSuccess?.();
    window.showToast?.(`Resource "${file.name}" loaded from device!`, "success");
  };
  reader.readAsDataURL(file);
}

async function handleAdminStoreProductUploadSubmit(e) {
  if (e) e.preventDefault();

  const title = document.getElementById('admin-prod-title')?.value?.trim();
  const category = document.getElementById('admin-prod-category')?.value || 'Wallpapers';
  const price = parseInt(document.getElementById('admin-prod-price')?.value) || 50;
  const collectionName = document.getElementById('admin-prod-collection')?.value?.trim() || 'Kingdom Collection';
  const author = document.getElementById('admin-prod-author')?.value?.trim() || 'Pastor Daniel (Super Admin)';
  const desc = document.getElementById('admin-prod-desc')?.value?.trim();
  const featured = document.getElementById('admin-prod-featured')?.checked || false;

  const urlCover = document.getElementById('admin-prod-img-url')?.value?.trim();
  const urlFile = document.getElementById('admin-prod-file-url')?.value?.trim();

  const coverUrl = adminUploadedCoverBase64 || urlCover || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80';
  const fileUrl = adminUploadedFileBase64 || urlFile || coverUrl;

  if (!title || !desc) {
    window.showToast?.("Please enter product title and description.", "warning");
    return;
  }

  const btn = document.getElementById('btn-admin-upload-prod');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Publishing to Store...`;
  }

  try {
    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Save full asset in client IndexedDB cache
    if (adminUploadedFileBlob || adminUploadedFileBase64 || adminUploadedCoverBase64) {
      if (window.saveStoreAssetIndexedDB) {
        await window.saveStoreAssetIndexedDB(
          prodId, 
          adminUploadedFileBlob || adminUploadedFileBase64 || adminUploadedCoverBase64, 
          adminUploadedFileName || `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.jpg`, 
          adminUploadedFileMime || 'image/jpeg'
        );
      }
    }

    const productPayload = {
      id: prodId,
      title: title,
      category: category,
      collectionName: collectionName,
      priceKC: price,
      price: price,
      description: desc,
      author: author,
      coverUrl: coverUrl,
      imageUrl: coverUrl,
      fileUrl: fileUrl,
      downloadUrl: fileUrl,
      fileName: adminUploadedFileName || `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.jpg`,
      featured: featured,
      published: true,
      downloadable: true,
      downloadsCount: 0,
      tags: [category, "Kingdom", "Spiritual"],
      uploadedBy: window.auth?.currentUser?.email || 'danielgiobari644@gmail.com',
      createdAt: new Date().toISOString()
    };

    // Save locally for instant reactivity
    if (window.saveUploadedStoreProductLocal) {
      window.saveUploadedStoreProductLocal(productPayload);
    }

    if (window.db) {
      const firestorePayload = {
        ...productPayload,
        createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
      };
      await window.db.collection('products').doc(prodId).set(firestorePayload);
      await window.db.collection('storeProducts').doc(prodId).set(firestorePayload).catch(() => {});
    }

    window.soundEngine?.playSuccess?.();
    window.showToast?.(`🛍️ "${title}" uploaded to Kingdom Store!`, "success");

    // Reset Form
    document.getElementById('admin-product-upload-form')?.reset();
    clearAdminCoverFile();
    adminUploadedFileBase64 = null;
    adminUploadedFileBlob = null;
    adminUploadedFileName = null;
    adminUploadedFileMime = null;
    const statusBox = document.getElementById('admin-prod-file-status');
    if (statusBox) statusBox.classList.add('hidden');

    syncAdminStoreProductsCatalog();
    if (window.syncStoreProducts) window.syncStoreProducts();

  } catch (err) {
    console.error("Admin store upload error:", err);
    window.showToast?.("Error: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Upload & Publish to Kingdom Store 🛍️";
    }
  }
}

function syncAdminStoreProductsCatalog() {
  const tbody = document.getElementById('admin-store-catalog-body');
  if (!tbody) return;

  const db = window.db;
  const deletedIds = window.getDeletedStoreProductIds ? window.getDeletedStoreProductIds() : [];
  const localUploads = window.getUploadedStoreProductsLocal ? window.getUploadedStoreProductsLocal().filter(p => !deletedIds.includes(p.id)) : [];

  const renderTableRows = (docs) => {
    tbody.innerHTML = '';
    if (!docs || docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">No active products in catalog. Upload resources using the form above!</td></tr>`;
      return;
    }

    docs.forEach(p => {
      const tr = document.createElement('tr');
      tr.id = `admin-store-row-${p.id}`;
      tr.className = "border-b border-slate-100 dark:border-zinc-800 text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/40";
      
      const itemPrice = p.priceKC !== undefined ? p.priceKC : (p.price !== undefined ? p.price : 50);
      const cover = p.coverUrl || p.imageUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80';

      tr.innerHTML = `
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${cover}" class="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0" onerror="this.src='https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'" />
            <div>
              <span class="font-bold text-slate-900 dark:text-zinc-100 block">${p.title || 'Untitled Resource'}</span>
              <span class="text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1">${p.description || ''}</span>
            </div>
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
            ${p.category || 'Resource'}
          </span>
        </td>
        <td class="py-3 px-4 font-mono font-black text-amber-500">
          🪙 ${itemPrice} KC
        </td>
        <td class="py-3 px-4 text-slate-600 dark:text-zinc-400">
          ${p.collectionName || 'General'}
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="deleteAdminStoreProduct('${p.id}', '${encodeURIComponent(p.title || '')}')" class="px-3 py-1.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  if (!db) {
    let combined = [...localUploads];
    if (window.DEFAULT_KINGDOM_PRODUCTS) {
      window.DEFAULT_KINGDOM_PRODUCTS.forEach(dp => {
        if (!deletedIds.includes(dp.id) && !combined.some(c => c.id === dp.id)) combined.push(dp);
      });
    }
    renderTableRows(combined);
    return;
  }

  if (adminProductsListener) adminProductsListener();

  // Snapshot without strict index order to guarantee fast retrieval on all accounts
  adminProductsListener = db.collection('products').onSnapshot(snap => {
    const docs = [];
    const seenIds = new Set();
    const currentDeletedIds = window.getDeletedStoreProductIds ? window.getDeletedStoreProductIds() : [];
    const currentLocalUploads = window.getUploadedStoreProductsLocal ? window.getUploadedStoreProductsLocal().filter(p => !currentDeletedIds.includes(p.id)) : [];

    if (!snap.empty) {
      snap.forEach(doc => {
        const d = doc.data();
        if (!currentDeletedIds.includes(doc.id) && d.isDeleted !== true && d.published !== false) {
          docs.push({ id: doc.id, ...d });
          seenIds.add(doc.id);
        }
      });
    }

    currentLocalUploads.forEach(lp => {
      if (!seenIds.has(lp.id) && !currentDeletedIds.includes(lp.id)) {
        docs.push(lp);
        seenIds.add(lp.id);
      }
    });

    if (docs.length === 0 && window.DEFAULT_KINGDOM_PRODUCTS) {
      window.DEFAULT_KINGDOM_PRODUCTS.forEach(dp => {
        if (!currentDeletedIds.includes(dp.id)) docs.push(dp);
      });
    }

    // Sort newest first
    docs.sort((a, b) => {
      const getT = (item) => {
        if (!item?.createdAt) return 0;
        if (typeof item.createdAt === 'number') return item.createdAt;
        if (item.createdAt.toMillis) return item.createdAt.toMillis();
        if (item.createdAt.seconds) return item.createdAt.seconds * 1000;
        return new Date(item.createdAt).getTime() || 0;
      };
      return getT(b) - getT(a);
    });

    renderTableRows(docs);
  }, err => {
    console.warn("Catalog sync note:", err);
    let combined = [...localUploads];
    if (window.DEFAULT_KINGDOM_PRODUCTS) {
      window.DEFAULT_KINGDOM_PRODUCTS.forEach(dp => {
        if (!deletedIds.includes(dp.id) && !combined.some(c => c.id === dp.id)) combined.push(dp);
      });
    }
    renderTableRows(combined);
  });
}

async function deleteAdminStoreProduct(prodId, encodedTitle) {
  if (window.deleteStoreProductDirect) {
    return await window.deleteStoreProductDirect(prodId, encodedTitle);
  }

  const title = decodeURIComponent(encodedTitle || 'Resource');
  let isConfirmed = false;
  if (window.showConfirmDialog) {
    isConfirmed = await window.showConfirmDialog({
      title: "Delete Store Resource?",
      message: `Delete product "${title}" permanently from the Kingdom Store catalog?`,
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      isDanger: true,
      icon: "trash-2"
    });
  } else {
    try {
      isConfirmed = confirm(`Delete product "${title}" permanently from the Kingdom Store catalog?`);
    } catch (e) {
      isConfirmed = true;
    }
  }

  if (!isConfirmed) return;

  try {
    if (window.markStoreProductAsDeleted) {
      window.markStoreProductAsDeleted(prodId);
    }
    if (window.removeUploadedStoreProductLocal) {
      window.removeUploadedStoreProductLocal(prodId);
    }
    if (window.deleteStoreAssetIndexedDB) {
      await window.deleteStoreAssetIndexedDB(prodId);
    }

    if (window.db) {
      const FieldValue = window.firebase?.firestore?.FieldValue;
      if (FieldValue) {
        window.db.collection('system_configs').doc('store_config').set({
          deletedProductIds: FieldValue.arrayUnion(prodId),
          lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }

      await window.db.collection('products').doc(prodId).set({
        published: false,
        isDeleted: true
      }, { merge: true }).catch(() => {});

      await window.db.collection('products').doc(prodId).delete().catch(() => {});
      await window.db.collection('storeProducts').doc(prodId).delete().catch(() => {});
    }

    window.soundEngine?.playSuccess?.();
    window.showToast?.(`"${title}" permanently removed from Kingdom Store.`, "info");
    
    syncAdminStoreProductsCatalog();
    if (window.syncStoreProducts) {
      window.syncStoreProducts();
    }
  } catch (err) {
    window.showToast?.("Error: " + err.message, "error");
  }
}

window.syncAdminStoreProductsCatalog = syncAdminStoreProductsCatalog;
window.deleteAdminStoreProduct = deleteAdminStoreProduct;
window.handleAdminStoreProductUploadSubmit = handleAdminStoreProductUploadSubmit;

// KPI Stats Counter
function syncAdminKPIStats() {
  const db = window.db;
  if (!db) return;

  db.collection('users').get().then(s => {
    const el = document.getElementById('kpi-total-members');
    if (el) el.innerText = s.size.toString();
  }).catch(() => {});

  db.collection('cells').get().then(s => {
    const el = document.getElementById('kpi-total-cells');
    if (el) el.innerText = s.size.toString();
  }).catch(() => {});

  db.collection('custom_quizzes').get().then(s => {
    const el = document.getElementById('kpi-total-quizzes');
    if (el) el.innerText = s.size.toString();
  }).catch(() => {});

  db.collection('products').get().then(s => {
    const el = document.getElementById('kpi-total-products');
    if (el) el.innerText = s.size.toString();
  }).catch(() => {});
}

async function updateUserRoleDirect(userId, newRole) {
  try {
    await window.db.collection('users').doc(userId).update({
      role: newRole
    });
    window.showToast?.(`User role updated to ${newRole}`, "success");
  } catch (err) {
    window.showToast?.("Error updating role: " + err.message, "error");
  }
}

async function grantAdminCoins(userId, amount) {
  try {
    const userRef = window.db.collection('users').doc(userId);
    const doc = await userRef.get();
    if (doc.exists) {
      const cur = doc.data().kingdomCoins || 0;
      await userRef.update({
        kingdomCoins: cur + amount,
        totalKcEarned: (doc.data().totalKcEarned || cur) + amount
      });
      window.soundEngine?.playCoins?.();
      window.showToast?.(`Granted +${amount} KC to believer!`, "success");
    }
  } catch (err) {
    window.showToast?.("Error granting coins: " + err.message, "error");
  }
}

window.initAdminModule = initAdminModule;
window.switchAdminSubTab = switchAdminSubTab;
window.updateUserRoleDirect = updateUserRoleDirect;
window.grantAdminCoins = grantAdminCoins;
window.openAddQuestionModal = openAddQuestionModal;
window.removeDraftQuestion = removeDraftQuestion;
window.handleCreateQuizSubmit = handleCreateQuizSubmit;
window.toggleQuizLiveStatus = toggleQuizLiveStatus;
window.deleteQuizDirect = deleteQuizDirect;
window.handleAdminCoverFileSelect = handleAdminCoverFileSelect;
window.clearAdminCoverFile = clearAdminCoverFile;
window.handleAdminResourceFileSelect = handleAdminResourceFileSelect;
window.handleAdminStoreProductUploadSubmit = handleAdminStoreProductUploadSubmit;
window.syncAdminStoreProductsCatalog = syncAdminStoreProductsCatalog;
window.deleteAdminStoreProduct = deleteAdminStoreProduct;

// Quiz cover & JSON import/export & editor bindings
window.handleAdminQuizCoverSelect = handleAdminQuizCoverSelect;
window.promptAdminQuizCoverUrl = promptAdminQuizCoverUrl;
window.downloadSampleQuizJson = downloadSampleQuizJson;
window.openJsonSampleModal = openJsonSampleModal;
window.closeJsonSampleModal = closeJsonSampleModal;
window.copySampleJsonToClipboard = copySampleJsonToClipboard;
window.handleQuizJsonFileInput = handleQuizJsonFileInput;
window.handlePasteJsonImport = handlePasteJsonImport;
window.exportQuizToJson = exportQuizToJson;
window.openEditQuizModal = openEditQuizModal;
window.closeEditQuizModal = closeEditQuizModal;
window.handleEditQuizCoverSelect = handleEditQuizCoverSelect;
window.promptEditQuizCoverUrl = promptEditQuizCoverUrl;
window.openAddQuestionToEditQuizModal = openAddQuestionToEditQuizModal;
window.removeQuestionFromEditQuiz = removeQuestionFromEditQuiz;
window.handleSaveEditedQuiz = handleSaveEditedQuiz;

// Devotionals editor & cover bindings
window.openEditDevotionalModal = openEditDevotionalModal;
window.closeEditDevotionalModal = closeEditDevotionalModal;
window.handleEditDevCoverSelect = handleEditDevCoverSelect;
window.promptEditDevCoverUrl = promptEditDevCoverUrl;
window.handleSaveEditedDevotional = handleSaveEditedDevotional;
window.deleteDevotionalDirect = deleteDevotionalDirect;
window.handleAdminDevCoverSelect = handleAdminDevCoverSelect;
window.promptAdminDevCoverUrl = promptAdminDevCoverUrl;
window.handlePublishDevotionalSubmit = handlePublishDevotionalSubmit;


