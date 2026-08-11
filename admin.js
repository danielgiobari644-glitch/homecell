// admin.js
// Super Admin Controls Desk - membership registry, parish events, trivia factory, installer publisher, and system settings

let usersListListener = null;
let adminCellsListener = null;
let adminEventsListener = null;
let adminTriviaListener = null;
let adminBundlesListener = null;

function initAdminModule() {
  const adminBtns = document.querySelectorAll('#nav-admin, #mobile-nav-admin, .nav-item-admin');
  const unauthBanner = document.getElementById('admin-unauthorized-banner');
  const mainContent = document.getElementById('admin-main-content');

  const authEmail = (window.auth?.currentUser?.email || window.auth?.currentUser?.providerData?.[0]?.email || '').toLowerCase().trim();
  const profileEmail = (window.currentUserProfile?.email || '').toLowerCase().trim();
  const isSuperAdmin = window.currentUserRole === 'Super Admin' ||
                       authEmail === 'danielgiobari644@gmail.com' ||
                       profileEmail === 'danielgiobari644@gmail.com';

  if (!isSuperAdmin) {
    if (usersListListener) { usersListListener(); usersListListener = null; }
    if (adminCellsListener) { adminCellsListener(); adminCellsListener = null; }
    if (adminEventsListener) { adminEventsListener(); adminEventsListener = null; }
    if (adminTriviaListener) { adminTriviaListener(); adminTriviaListener = null; }
    if (adminBundlesListener) { adminBundlesListener(); adminBundlesListener = null; }

    adminBtns.forEach(btn => btn.classList.add('hidden'));
    if (unauthBanner) unauthBanner.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    return;
  }

  // User is confirmed Super Admin
  window.currentUserRole = 'Super Admin';
  adminBtns.forEach(btn => btn.classList.remove('hidden'));
  if (unauthBanner) unauthBanner.classList.add('hidden');
  if (mainContent) mainContent.classList.remove('hidden');

  const adminSep = document.getElementById('admin-nav-separator');
  if (adminSep) adminSep.classList.remove('hidden');

  syncMembershipRegistry();
  syncAdminCells();
  syncAdminEvents();
  syncAdminUpcomingEvents();
  syncAdminDailyDevotionals();
  syncAdminTrivia();
  syncAdminQuizzes();
  syncAdminBundles();
  syncAdminApkConfig();
  syncAdminStreams();
  syncAdminStoreProducts();
  syncAdminCustomRequests();
  syncAdminFeedbackHub();
  loadGlobalDeskSettings();
}

// 1. Unified Membership Registry
function syncMembershipRegistry() {
  const container = document.getElementById('admin-users-rows');
  if (!container) return;

  if (usersListListener) usersListListener();

  // Fetch all cells first so we can map names and populate selects
  window.db.collection('cells').get().then(cellsSnap => {
    const cellsList = [];
    cellsSnap.forEach(cdoc => {
      cellsList.push({ id: cdoc.id, name: cdoc.data().name });
    });

    usersListListener = window.db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snap => {
      container.innerHTML = '';
      window.allUsersList = [];
      if (snap.empty) {
        container.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">No registered members found.</td></tr>`;
        return;
      }

      snap.forEach(doc => {
        const u = doc.data();
        const uid = doc.id;
        window.allUsersList.push({ uid, ...u });

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200";

        const roles = ['Member', 'Cell Leader', 'Cell Coordinator', 'Pastor', 'Super Admin'];
        const roleOptions = roles.map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`).join('');

        const cellOptions = `
          <option value="none" ${u.cellId === 'none' ? 'selected' : ''}>None</option>
          ${cellsList.map(c => `<option value="${c.id}" ${u.cellId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        `;

        tr.innerHTML = `
          <td class="p-4 font-bold text-slate-900 dark:text-zinc-100">${u.displayName || 'No Name'}</td>
          <td class="p-4 font-mono text-xs text-slate-500">${u.email}</td>
          <td class="p-4">
            <select onchange="updateUserRole('${uid}', this.value)" class="text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800 dark:text-zinc-200">
              ${roleOptions}
            </select>
          </td>
          <td class="p-4">
            <select onchange="updateUserCellAssignment('${uid}', this.value)" class="text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800 dark:text-zinc-200">
              ${cellOptions}
            </select>
          </td>
          <td class="p-4 text-center">
            <div class="flex items-center justify-center gap-1">
              <button onclick="sendUserPasswordResetEmail('${u.email}')" class="text-blue-500 hover:text-blue-700 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer" title="Send Password Reset Email">
                <i data-lucide="key-round" class="w-4 h-4"></i>
              </button>
              <button onclick="evictUser('${uid}')" class="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer" title="Evict User">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        `;

        container.appendChild(tr);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => window.handleFirestoreError(err, 'list', 'users'));
  });
}

function updateUserRole(uid, role) {
  window.db.collection('users').doc(uid).update({ role })
    .then(() => window.showToast?.(`Updated user role to ${role}`))
    .catch(err => window.handleFirestoreError(err, 'write', `users/${uid}`));
}

function updateUserCellAssignment(uid, cellId) {
  window.db.collection('users').doc(uid).update({ cellId })
    .then(() => window.showToast?.(`Updated member fellowship assignment.`))
    .catch(err => window.handleFirestoreError(err, 'write', `users/${uid}`));
}

function evictUser(uid) {
  const isConfirmed = confirm("Are you sure you want to permanently evict this user from the portal registry?");
  if (!isConfirmed) return;

  window.db.collection('users').doc(uid).delete()
    .then(() => window.showToast?.("User profile evicted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `users/${uid}`));
}

// 2. Fellowship Cell Suspensions & Listings
function syncAdminCells() {
  const container = document.getElementById('admin-cells-controls-box');
  if (!container) return;

  if (adminCellsListener) adminCellsListener();

  adminCellsListener = window.db.collection('cells').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<p class="text-slate-400 text-center py-6">No cell registries active.</p>`;
      return;
    }

    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 md:grid-cols-2 gap-6";

    snap.forEach(doc => {
      const cell = doc.data();
      const cellId = doc.id;
      const isPending = cell.status === 'pending_approval';
      const isSuspended = cell.status === 'suspended';

      const card = document.createElement('div');
      card.className = `p-5 bg-slate-50 dark:bg-zinc-800/40 border rounded-2xl flex flex-col justify-between ${
        isPending ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20' :
        isSuspended ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 dark:border-zinc-800'
      }`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest">${cell.city}</span>
            ${isPending ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">PENDING APPROVAL</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <h5 class="font-black font-display text-slate-900 dark:text-zinc-100">${cell.name}</h5>
            <button onclick="window.renameCellGroup('${cellId}', \`${cell.name.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)" class="p-1 hover:text-blue-600 text-slate-400 dark:text-zinc-500 rounded transition-colors cursor-pointer" title="Rename Cell">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <p class="text-xs text-slate-500 mt-1">${cell.description}</p>
          <div class="text-[10px] text-slate-400 font-semibold mt-2">Leader: ${cell.leaderName} (${cell.leaderEmail})</div>
        </div>

        <div class="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
          ${isPending ? `
            <button onclick="window.approveCellGroup('${cellId}')" class="w-full py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5">
              <i data-lucide="check-circle" class="w-4 h-4"></i> Approve & Activate Cell Group
            </button>
          ` : ''}
          <div class="flex gap-2">
            <button onclick="toggleCellSuspension('${cellId}', '${cell.status}')" class="flex-grow py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isSuspended
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }">
              ${isSuspended ? 'Activate Cell' : 'Suspend Cell'}
            </button>
            <button onclick="deleteCellGroup('${cellId}')" class="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg cursor-pointer">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
          <button onclick="openChangeCellLeaderModal('${cellId}')" class="w-full py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all cursor-pointer text-center">
            Change Cell Leader
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    container.appendChild(grid);

    if (window.lucide) window.lucide.createIcons();
  }, err => window.handleFirestoreError(err, 'list', 'cells'));
}

window.approveCellGroup = function(cellId) {
  const db = window.db;
  if (!db) return;
  db.collection('cells').doc(cellId).update({
    status: 'active',
    approvedByAdmin: true,
    approvedAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    window.showToast?.("✅ Cell group approved and activated successfully!", "success");
  }).catch(err => {
    window.showToast?.("Error approving cell: " + err.message, "error");
  });
};

function toggleCellSuspension(cellId, currentStatus) {
  const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
  window.db.collection('cells').doc(cellId).update({ status: nextStatus })
    .then(() => window.showToast?.(`Cell status shifted to ${nextStatus}.`))
    .catch(err => window.handleFirestoreError(err, 'write', `cells/${cellId}`));
}

function deleteCellGroup(cellId) {
  const isConfirmed = confirm("Are you sure you want to permanently delete this Fellowship Cell? All associated messages and events will remain inaccessible.");
  if (!isConfirmed) return;

  window.db.collection('cells').doc(cellId).delete()
    .then(() => window.showToast?.("Cell group deleted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `cells/${cellId}`));
}

function renameCellGroup(cellId, currentName) {
  const newName = prompt("Enter new name for the Fellowship Cell Group:", currentName);
  if (newName === null) return;
  const trimmed = newName.trim();
  if (!trimmed) {
    window.showToast?.("Cell name cannot be empty.", "error");
    return;
  }
  window.db.collection('cells').doc(cellId).update({ name: trimmed })
    .then(() => window.showToast?.("Cell renamed successfully."))
    .catch(err => window.handleFirestoreError(err, 'write', `cells/${cellId}`));
}

// 3. Fellowship Gatherings Manager
function syncAdminEvents() {
  const container = document.getElementById('admin-events-list');
  if (!container) return;

  if (adminEventsListener) adminEventsListener();

  adminEventsListener = window.db.collection('parish_events').orderBy('date', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<p class="text-xs text-slate-400">No scheduled gatherings.</p>`;
      return;
    }

    snap.forEach(doc => {
      const ev = doc.data();
      const evId = doc.id;

      const item = document.createElement('div');
      item.className = "flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl";
      item.innerHTML = `
        <div>
          <h6 class="font-bold text-sm text-slate-800 dark:text-zinc-200">${ev.title}</h6>
          <span class="text-[10px] font-mono text-slate-400">${ev.date}</span>
        </div>
        <button onclick="deleteParishEvent('${evId}')" class="text-rose-500 hover:text-rose-700 cursor-pointer p-1">
          <i data-lucide="trash-2" class="w-4.5 h-4.5"></i>
        </button>
      `;

      container.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => window.handleFirestoreError(err, 'list', 'parish_events'));
}

function createParishEvent(title, date, description) {
  const docId = window.db.collection('parish_events').doc().id;
  window.db.collection('parish_events').doc(docId).set({
    id: docId,
    title,
    date,
    description,
    rsvps: {},
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => window.showToast?.("Created Universal Fellowship gathering."))
    .catch(err => window.handleFirestoreError(err, 'create', `parish_events/${docId}`));
}

function deleteParishEvent(eventId) {
  const isConfirmed = confirm("Are you sure you want to delete this Fellowship Gathering?");
  if (!isConfirmed) return;

  window.db.collection('parish_events').doc(eventId).delete()
    .then(() => window.showToast?.("Gathering deleted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `parish_events/${eventId}`));
}

// 4. Trivia Q&A Factory
function syncAdminTrivia() {
  const container = document.getElementById('admin-trivia-list');
  if (!container) return;

  if (adminTriviaListener) adminTriviaListener();

  adminTriviaListener = window.db.collection('trivia_questions').orderBy('createdAt', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    
    // Also update public trivia listing under Bible tab
    const publicContainer = document.getElementById('bible-trivia-deck');
    if (publicContainer) publicContainer.innerHTML = '';

    if (snap.empty) {
      container.innerHTML = `<p class="text-xs text-slate-400">No trivia questions manufactured yet.</p>`;
      if (publicContainer) {
        publicContainer.innerHTML = `<p class="text-slate-400 italic text-center py-6">No Bible trivia Q&As published yet.</p>`;
      }
      return;
    }

    let qIdx = 1;
    snap.forEach(doc => {
      const q = doc.data();
      const qid = doc.id;

      // Render in Admin Panel
      const item = document.createElement('div');
      item.className = "p-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1 relative group";
      item.innerHTML = `
        <div class="text-xs font-bold text-slate-800 dark:text-zinc-200">Q: ${q.question}</div>
        <div class="text-[10px] text-slate-400">Answer Index: ${q.answerIdx} (${q.options[q.answerIdx]})</div>
        <button onclick="deleteTriviaQuestion('${qid}')" class="absolute hidden group-hover:block top-2 right-2 text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;
      container.appendChild(item);

      // Render in Bible study pane for public interaction
      if (publicContainer) {
        const pcard = document.createElement('div');
        pcard.className = "p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4";
        
        const optionBlocks = q.options.map((opt, oIdx) => `
          <button onclick="checkTriviaAnswer('${qid}', ${oIdx}, ${q.answerIdx})" id="trivia-opt-${qid}-${oIdx}" class="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all font-semibold text-xs text-slate-700 dark:text-zinc-300 cursor-pointer flex justify-between items-center">
            <span>${opt}</span>
          </button>
        `).join('');

        pcard.innerHTML = `
          <div class="space-y-1">
            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">Bible Trivia Q${qIdx++}</span>
            <h5 class="text-sm font-black text-slate-900 dark:text-zinc-100 pt-1">${q.question}</h5>
          </div>
          <div class="space-y-2">
            ${optionBlocks}
          </div>
        `;
        publicContainer.appendChild(pcard);
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => window.handleFirestoreError(err, 'list', 'trivia_questions'));
}

function createTriviaQuestion(question, options, answerIdx) {
  const docId = window.db.collection('trivia_questions').doc().id;
  window.db.collection('trivia_questions').doc(docId).set({
    id: docId,
    question,
    options,
    answerIdx,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => window.showToast?.("Bible Trivia Q&A manufactured successfully!"))
    .catch(err => window.handleFirestoreError(err, 'create', `trivia_questions/${docId}`));
}

function deleteTriviaQuestion(qid) {
  const isConfirmed = confirm("Are you sure you want to delete this Trivia Question?");
  if (!isConfirmed) return;

  window.db.collection('trivia_questions').doc(qid).delete()
    .then(() => window.showToast?.("Trivia question deleted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `trivia_questions/${qid}`));
}

// Client check handler
function checkTriviaAnswer(qid, selectedIdx, correctIdx) {
  const btn = document.getElementById(`trivia-opt-${qid}-${selectedIdx}`);
  if (!btn) return;

  // Clear previous highlights for this question
  for (let i = 0; i < 4; i++) {
    const obtn = document.getElementById(`trivia-opt-${qid}-${i}`);
    if (obtn) {
      obtn.className = "w-full text-left p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-slate-700 dark:text-zinc-300 font-semibold text-xs";
    }
  }

  if (selectedIdx === correctIdx) {
    btn.className = "w-full text-left p-3 rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 font-semibold text-xs flex justify-between items-center";
    btn.innerHTML += `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i>`;
    window.showToast?.("Amen! Correct Answer!");
  } else {
    btn.className = "w-full text-left p-3 rounded-xl border border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 font-semibold text-xs flex justify-between items-center";
    btn.innerHTML += `<i data-lucide="x-circle" class="w-4 h-4 text-rose-500"></i>`;
    
    // Highlight correct option as well
    const correctBtn = document.getElementById(`trivia-opt-${qid}-${correctIdx}`);
    if (correctBtn) {
      correctBtn.className = "w-full text-left p-3 rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 font-semibold text-xs";
    }
    window.showToast?.("Wrong answer. Try searching scripture details!", "error");
  }

  if (window.lucide) window.lucide.createIcons();
}

// 5. Installer Packages Publisher
function syncAdminBundles() {
  const container = document.getElementById('admin-bundles-list');
  if (!container) return;

  if (adminBundlesListener) adminBundlesListener();

  adminBundlesListener = window.db.collection('download_bundles').orderBy('createdAt', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<p class="text-xs text-slate-400">No active trigger installers registered.</p>`;
      return;
    }

    snap.forEach(doc => {
      const b = doc.data();
      const bid = doc.id;

      const item = document.createElement('div');
      item.className = "flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl relative group";
      item.innerHTML = `
        <div>
          <h6 class="font-bold text-xs text-slate-800 dark:text-zinc-200">${b.title} [${b.category}]</h6>
          <span class="text-[9px] font-mono text-slate-400">${b.size} • ${b.tag}</span>
        </div>
        <button onclick="deleteDownloadBundle('${bid}')" class="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      `;

      container.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => window.handleFirestoreError(err, 'list', 'download_bundles'));
}

function createDownloadBundle(title, size, url, tag, category) {
  const docId = window.db.collection('download_bundles').doc().id;
  window.db.collection('download_bundles').doc(docId).set({
    id: docId,
    title,
    size,
    url,
    tag,
    category,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => window.showToast?.("Installer Trigger Bundle registered successfully!"))
    .catch(err => window.handleFirestoreError(err, 'create', `download_bundles/${docId}`));
}

function deleteDownloadBundle(bundleId) {
  const isConfirmed = confirm("Are you sure you want to permanently delete this Download Bundle?");
  if (!isConfirmed) return;

  window.db.collection('download_bundles').doc(bundleId).delete()
    .then(() => window.showToast?.("Bundle trigger removed."))
    .catch(err => window.handleFirestoreError(err, 'delete', `download_bundles/${bundleId}`));
}

// Admin Official Android APK Management
let adminApkListener = null;

function syncAdminApkConfig() {
  const badge = document.getElementById('admin-apk-status-badge');
  const box = document.getElementById('admin-current-apk-box');
  const filenameEl = document.getElementById('admin-apk-filename');
  const metaEl = document.getElementById('admin-apk-meta');

  if (!badge || !box) return;

  if (adminApkListener) adminApkListener();

  const db = window.db;
  if (!db) return;

  adminApkListener = db.collection('system_configs').doc('apk').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data && (data.apkDataUrl || data.externalUrl)) {
        badge.className = "px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
        badge.innerText = "Active Published APK";

        box.classList.remove('hidden');
        if (filenameEl) filenameEl.innerText = data.fileName || 'HomeCell_Android_Release.apk';
        if (metaEl) metaEl.innerText = `Size: ${data.fileSize || 'Standard APK'} • Ready for Android Users`;
        return;
      }
    }

    badge.className = "px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30";
    badge.innerText = "No Custom APK Uploaded (Using Default Fallback)";
    box.classList.add('hidden');
  }, err => console.warn("APK config listener error:", err));
}

window.handleAdminApkUploadSubmit = function(event) {
  if (event) event.preventDefault();
  const fileInput = document.getElementById('admin-apk-file-input');
  const urlInput = document.getElementById('admin-apk-url-input');
  const submitBtn = document.getElementById('btn-upload-apk-submit');

  const externalUrl = urlInput ? urlInput.value.trim() : '';
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!file && !externalUrl) {
    window.showToast?.("Please select an .apk file or enter an external APK link.", "error");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing APK...";
  }

  const saveApkToDb = (apkDataUrl, fileName, fileSize) => {
    const db = window.db;
    db.collection('system_configs').doc('apk').set({
      apkDataUrl: apkDataUrl || '',
      externalUrl: externalUrl || '',
      fileName: fileName || 'HomeCell_Android_App.apk',
      fileSize: fileSize || 'Direct Download',
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
      window.showToast?.("🚀 Official Android APK published successfully for all users!", "success");
      if (fileInput) fileInput.value = '';
      if (urlInput) urlInput.value = '';
      createDownloadBundle(fileName, fileSize, externalUrl || 'Uploaded File', 'v1.0.4', 'android');
    }).catch(err => {
      window.showToast?.("Failed to publish APK: " + err.message, "error");
    }).finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="upload-cloud" class="w-4 h-4"></i> Upload & Publish APK`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const formattedSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      saveApkToDb(dataUrl, file.name, formattedSize);
    };
    reader.onerror = function() {
      window.showToast?.("Error reading file.", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="upload-cloud" class="w-4 h-4"></i> Upload & Publish APK`;
      }
    };
    reader.readAsDataURL(file);
  } else {
    saveApkToDb('', 'HomeCell_Android_App.apk', 'External Direct Link');
  }
};
window.syncAdminApkConfig = syncAdminApkConfig;

// 6. Global Desktop Support & YouTube Stream Config
function loadGlobalDeskSettings() {
  const phone = document.getElementById('desk-form-phone');
  const wa = document.getElementById('desk-form-whatsapp');
  const email = document.getElementById('desk-form-email');

  const active = document.getElementById('admin-stream-active');
  const title = document.getElementById('admin-stream-title');
  const desc = document.getElementById('admin-stream-desc');
  const url = document.getElementById('admin-stream-url');
  const type = document.getElementById('admin-stream-type');

  window.db.collection('system_configs').doc('contacts').get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      if (phone) phone.value = d.phone || '';
      if (wa) wa.value = d.whatsapp || '';
      if (email) email.value = d.email || '';
    }
  });

  window.db.collection('system_configs').doc('stream').get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      if (active) active.checked = d.streamActive || false;
      if (title) title.value = d.streamTitle || '';
      if (desc) desc.value = d.streamDesc || '';
      if (url) url.value = d.streamUrl || '';
      if (type) type.value = d.streamType || 'hls';
    }
  });

  const triviaTimerInput = document.getElementById('trivia-settings-timer');
  const triviaPointsInput = document.getElementById('trivia-settings-points');
  const triviaThemeInput = document.getElementById('trivia-settings-theme');

  window.db.collection('system_configs').doc('trivia').get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      if (triviaTimerInput) triviaTimerInput.value = d.timerLimit || 15;
      if (triviaPointsInput) triviaPointsInput.value = d.pointsPerQuestion || 100;
      if (triviaThemeInput) triviaThemeInput.value = d.weeklyTheme || 'The Pentecost Acts';
    }
  });
}

function updateSupportDesk() {
  const phone = document.getElementById('desk-form-phone').value.trim();
  const wa = document.getElementById('desk-form-whatsapp').value.trim();
  const email = document.getElementById('desk-form-email').value.trim();

  window.db.collection('system_configs').doc('contacts').set({
    phone,
    whatsapp: wa,
    email
  })
    .then(() => window.showToast?.("Support desk channels updated."))
    .catch(err => window.handleFirestoreError(err, 'write', 'system_configs/contacts'));
}

function updateStreamDesk() {
  const streamId = document.getElementById('admin-stream-id').value.trim();
  const active = document.getElementById('admin-stream-active').checked;
  const title = document.getElementById('admin-stream-title').value.trim();
  const desc = document.getElementById('admin-stream-desc').value.trim();
  const url = document.getElementById('admin-stream-url').value.trim();
  const type = document.getElementById('admin-stream-type').value;
  const position = document.getElementById('admin-stream-position').value || 'top';
  const schedule = document.getElementById('admin-stream-schedule').value || '';
  const status = document.getElementById('admin-stream-status').value || 'scheduled';
  const thumbnail = document.getElementById('admin-stream-thumbnail').value.trim() || '';

  const docId = streamId || window.db.collection('live_streams').doc().id;

  const streamObj = {
    id: docId,
    streamActive: active,
    streamTitle: title,
    streamDesc: desc,
    streamUrl: url,
    streamType: type,
    position: position,
    schedule: schedule,
    status: status,
    thumbnail: thumbnail,
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
  };

  window.db.collection('live_streams').doc(docId).set(streamObj)
    .then(() => {
      // If active stream is Live, sync legacy system_configs/stream so the dashboard banner lights up
      if (status === 'live' || active) {
        window.db.collection('system_configs').doc('stream').set({
          streamActive: active,
          streamTitle: title,
          streamDesc: desc,
          streamUrl: url,
          streamType: type
        }).catch(err => console.error("Legacy stream config sync failed:", err));

        // Trigger system-wide background notification off-app
        if (window.sendPushNotification) {
          window.sendPushNotification(
            "📹 LIVE STREAM BROADCAST IS ACTIVE!",
            `We are streaming: "${title || 'Holy Fellowship'}" live now! Tap to gather with us in prayer.`,
            "/?tab=dashboard"
          );
        }
      }

      window.showToast?.("Livestream broadcast successfully updated and synchronized!", "success");
      resetStreamForm();
    })
    .catch(err => window.handleFirestoreError(err, 'write', `live_streams/${docId}`));
}

let adminStreamsListener = null;
function syncAdminStreams() {
  const container = document.getElementById('admin-streams-list');
  if (!container) return;

  if (adminStreamsListener) adminStreamsListener();

  adminStreamsListener = window.db.collection('live_streams').orderBy('updatedAt', 'desc').onSnapshot(snap => {
    container.innerHTML = '';
    
    if (snap.empty) {
      container.innerHTML = `<p class="text-xs text-slate-400 italic">No custom broadcasts registered yet.</p>`;
      return;
    }

    snap.forEach(doc => {
      const s = doc.data();
      const card = document.createElement('div');
      card.className = "p-4 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 rounded-2xl flex flex-col justify-between space-y-4 text-xs";
      
      let badgeHTML = '';
      if (s.status === 'live') {
        badgeHTML = `<span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 animate-pulse rounded-md">🔴 Live Now</span>`;
      } else if (s.status === 'scheduled') {
        badgeHTML = `<span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 rounded-md">⏳ Scheduled</span>`;
      } else {
        badgeHTML = `<span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 rounded-md">⚫ Offline</span>`;
      }

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h5 class="font-extrabold text-slate-900 dark:text-zinc-50 line-clamp-1">${s.streamTitle}</h5>
            ${badgeHTML}
          </div>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">${s.streamDesc}</p>
          <div class="text-[10px] text-slate-400 font-bold space-y-1">
            <p>Placement: <span class="text-blue-500 capitalize">${s.position}</span></p>
            ${s.schedule ? `<p>Scheduled: <span class="text-purple-500 font-mono">${new Date(s.schedule).toLocaleString()}</span></p>` : ''}
            <p class="truncate">Source: <span class="font-mono text-[9px]">${s.streamUrl}</span></p>
          </div>
        </div>
        <div class="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
          ${s.status === 'live' ? `
            <button onclick="window.endLiveStream('${s.id}')" class="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all cursor-pointer text-center">
              End Live Broadcast
            </button>
          ` : ''}
          <div class="flex items-center gap-2 w-full">
            <button onclick="window.editStream('${s.id}')" class="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 font-bold rounded-lg transition-all cursor-pointer text-center">
              Edit
            </button>
            <button onclick="window.deleteStream('${s.id}')" class="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 font-bold rounded-lg transition-all cursor-pointer text-center">
              Delete
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }, err => console.error("Admin streams sync failed:", err));
}

function editStream(streamId) {
  window.db.collection('live_streams').doc(streamId).get().then(doc => {
    if (!doc.exists) return;
    const s = doc.data();

    document.getElementById('admin-stream-id').value = s.id;
    document.getElementById('admin-stream-active').checked = s.streamActive || false;
    document.getElementById('admin-stream-title').value = s.streamTitle || '';
    document.getElementById('admin-stream-desc').value = s.streamDesc || '';
    document.getElementById('admin-stream-url').value = s.streamUrl || '';
    document.getElementById('admin-stream-type').value = s.streamType || 'hls';
    document.getElementById('admin-stream-position').value = s.position || 'top';
    document.getElementById('admin-stream-schedule').value = s.schedule || '';
    document.getElementById('admin-stream-status').value = s.status || 'scheduled';
    document.getElementById('admin-stream-thumbnail').value = s.thumbnail || '';

    window.showToast?.("Loaded livestream settings into editing form!", "info");
  }).catch(err => window.handleFirestoreError(err, 'get', `live_streams/${streamId}`));
}

function deleteStream(streamId) {
  const isConfirmed = confirm("Are you sure you want to permanently delete this broadcast configuration?");
  if (!isConfirmed) return;

  window.db.collection('live_streams').doc(streamId).delete()
    .then(() => {
      window.showToast?.("Broadcast configuration successfully deleted.");
    })
    .catch(err => window.handleFirestoreError(err, 'delete', `live_streams/${streamId}`));
}

function endLiveStream(streamId) {
  const isConfirmed = confirm("Are you sure you want to end this live broadcast and save it as a recorded replay?");
  if (!isConfirmed) return;

  window.db.collection('live_streams').doc(streamId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (window.saveStreamAsReplay) {
        window.saveStreamAsReplay(data).catch(err => console.warn("Replay save error:", err));
      }
    }

    return window.db.collection('live_streams').doc(streamId).set({
      status: 'offline',
      streamActive: false,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  })
  .then(() => {
    return window.db.collection('system_configs').doc('stream').set({
      streamActive: false
    }, { merge: true }).catch(err => console.warn("Failed to update legacy stream config:", err));
  })
  .then(() => {
    window.showToast?.("Live broadcast ended and saved as replay successfully!", "success");
  })
  .catch(err => window.handleFirestoreError(err, 'write', `live_streams/${streamId}`));
}

function resetStreamForm() {
  document.getElementById('admin-stream-form').reset();
  document.getElementById('admin-stream-id').value = '';
}

// Admin Panel Sub Tab switches
function setAdminSubTab(subTabId) {
  const subTabs = ['users', 'store', 'custom-requests', 'feedback-hub', 'cells', 'events', 'devotionals', 'trivia', 'bundles', 'configs', 'stream'];
  subTabs.forEach(tab => {
    const pane = document.getElementById(`atab-${tab}`);
    const btn = document.getElementById(`btn-atab-${tab}`);
    if (pane) {
      if (tab === subTabId) pane.classList.remove('hidden');
      else pane.classList.add('hidden');
    }
    if (btn) {
      if (tab === subTabId) {
        btn.className = "px-4 py-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold";
      } else {
        btn.className = "px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-semibold";
      }
    }
  });
}

// Helper function: Compress image to small base64 JPEG
function compressAndResizeImage(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 7. Upcoming Events Manager Functions
let adminEventImageBase64 = '';
window.editingAdminEventId = null;
window.adminUpcomingEventsCache = {};

window.addAdminEventExtraDateField = function(val = '') {
  const container = document.getElementById('admin-event-extra-dates-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = "flex items-center gap-2 animate-fade-in admin-event-extra-date-row";
  row.innerHTML = `
    <input type="datetime-local" class="admin-event-extra-date-input flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500" value="${val}" />
    <button type="button" onclick="this.parentElement.remove()" class="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors" title="Remove this date">
      <i data-lucide="trash-2" class="w-4 h-4"></i>
    </button>
  `;
  container.appendChild(row);
  if (window.lucide) window.lucide.createIcons();
};

window.getAdminEventExtraDates = function() {
  const inputs = document.querySelectorAll('.admin-event-extra-date-input');
  const dates = [];
  inputs.forEach(inp => {
    const v = inp.value.trim();
    if (v) dates.push(v);
  });
  return dates;
};

window.formatEventDatesDisplay = function(ev) {
  if (!ev) return "";
  const formatSingle = (dtStr) => {
    if (!dtStr) return "";
    try {
      return new Date(dtStr).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dtStr;
    }
  };

  const startFormatted = formatSingle(ev.eventDate);

  if (ev.eventEndDate) {
    const endFormatted = formatSingle(ev.eventEndDate);
    return `${startFormatted} – ${endFormatted}`;
  }

  if (ev.extraDates && Array.isArray(ev.extraDates) && ev.extraDates.length > 0) {
    const validCount = ev.extraDates.filter(Boolean).length;
    if (validCount > 0) {
      return `${startFormatted} (+${validCount} extra date${validCount > 1 ? 's' : ''})`;
    }
  }

  return startFormatted;
};

window.previewAdminEventImage = function(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;
  compressAndResizeImage(file, 800, 0.75).then(base64 => {
    adminEventImageBase64 = base64;
    const box = document.getElementById('admin-event-img-preview-box');
    const img = document.getElementById('admin-event-img-preview');
    if (box && img) {
      img.src = base64;
      box.classList.remove('hidden');
    }
  }).catch(err => {
    window.showToast?.("Error processing image file: " + err.message, "error");
  });
};

window.previewAdminEventUrl = function(url) {
  if (!url) return;
  adminEventImageBase64 = url.trim();
  const box = document.getElementById('admin-event-img-preview-box');
  const img = document.getElementById('admin-event-img-preview');
  if (box && img) {
    img.src = url.trim();
    box.classList.remove('hidden');
  }
};

window.clearAdminEventImage = function() {
  adminEventImageBase64 = '';
  const fileInput = document.getElementById('admin-event-file');
  const urlInput = document.getElementById('admin-event-url');
  const box = document.getElementById('admin-event-img-preview-box');
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (box) box.classList.add('hidden');
};

window.editUpcomingEvent = function(eventId) {
  const ev = window.adminUpcomingEventsCache[eventId];
  if (!ev) return;

  window.editingAdminEventId = eventId;

  const titleInput = document.getElementById('admin-event-title');
  const dateInput = document.getElementById('admin-event-date');
  const endDateInput = document.getElementById('admin-event-end-date');
  const locInput = document.getElementById('admin-event-location');
  const descInput = document.getElementById('admin-event-desc');
  const urlInput = document.getElementById('admin-event-url');
  const extraContainer = document.getElementById('admin-event-extra-dates-container');
  const submitBtn = document.getElementById('btn-save-event');
  const cancelBtn = document.getElementById('btn-cancel-edit-event');
  const modeBanner = document.getElementById('admin-event-form-mode-banner');
  const modeText = document.getElementById('admin-event-editing-title-text');

  if (titleInput) titleInput.value = ev.title || '';
  if (dateInput) dateInput.value = ev.eventDate || '';
  if (endDateInput) endDateInput.value = ev.eventEndDate || '';
  if (locInput) locInput.value = ev.location || '';
  if (descInput) descInput.value = ev.description || '';

  if (extraContainer) extraContainer.innerHTML = '';
  if (ev.extraDates && Array.isArray(ev.extraDates)) {
    ev.extraDates.forEach(d => window.addAdminEventExtraDateField(d));
  }

  if (ev.imageUrl) {
    adminEventImageBase64 = ev.imageUrl;
    const box = document.getElementById('admin-event-img-preview-box');
    const img = document.getElementById('admin-event-img-preview');
    if (urlInput) urlInput.value = ev.imageUrl.startsWith('http') ? ev.imageUrl : '';
    if (box && img) {
      img.src = ev.imageUrl;
      box.classList.remove('hidden');
    }
  }

  if (modeBanner) modeBanner.classList.remove('hidden');
  if (modeText) modeText.innerText = `Editing Event: "${ev.title}"`;
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  if (submitBtn) {
    submitBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> Save Updated Event`;
  }

  const formEl = document.getElementById('admin-event-form');
  if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (window.lucide) window.lucide.createIcons();
};

window.cancelAdminEventEdit = function() {
  window.editingAdminEventId = null;
  const formEl = document.getElementById('admin-event-form');
  if (formEl) formEl.reset();

  const extraContainer = document.getElementById('admin-event-extra-dates-container');
  if (extraContainer) extraContainer.innerHTML = '';

  window.clearAdminEventImage();

  const modeBanner = document.getElementById('admin-event-form-mode-banner');
  if (modeBanner) modeBanner.classList.add('hidden');

  const cancelBtn = document.getElementById('btn-cancel-edit-event');
  if (cancelBtn) cancelBtn.classList.add('hidden');

  const submitBtn = document.getElementById('btn-save-event');
  if (submitBtn) {
    submitBtn.innerHTML = `<i data-lucide="calendar-plus" class="w-4 h-4"></i> Publish Upcoming Event`;
  }
  if (window.lucide) window.lucide.createIcons();
};

window.handleAdminEventSubmit = function(event) {
  if (event) event.preventDefault();
  const title = document.getElementById('admin-event-title').value.trim();
  const eventDate = document.getElementById('admin-event-date').value;
  const eventEndDate = document.getElementById('admin-event-end-date')?.value || null;
  const extraDates = window.getAdminEventExtraDates();
  const location = document.getElementById('admin-event-location').value.trim();
  const description = document.getElementById('admin-event-desc').value.trim();
  const submitBtn = document.getElementById('btn-save-event');

  const imageUrl = adminEventImageBase64 || document.getElementById('admin-event-url')?.value.trim();

  if (!title || !eventDate || !location || !description) {
    window.showToast?.("Please complete all required event fields.", "error");
    return;
  }
  if (!imageUrl) {
    window.showToast?.("Please attach an event banner picture (file or URL).", "error");
    return;
  }

  const isEditing = Boolean(window.editingAdminEventId);

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = isEditing ? "Saving Changes..." : "Publishing Event...";
  }

  const payload = {
    title,
    eventDate,
    eventEndDate,
    extraDates,
    location,
    description,
    imageUrl,
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
  };

  if (isEditing) {
    window.db.collection('upcoming_events').doc(window.editingAdminEventId).update(payload)
      .then(() => {
        window.showToast?.("🎉 Upcoming Event updated successfully!", "success");
        window.cancelAdminEventEdit();
      })
      .catch(err => {
        window.handleFirestoreError(err, 'update', `upcoming_events/${window.editingAdminEventId}`);
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  } else {
    const docId = window.db.collection('upcoming_events').doc().id;
    payload.id = docId;
    payload.createdBy = window.currentUserProfile?.displayName || 'Super Admin';
    payload.createdAt = window.firebase.firestore.FieldValue.serverTimestamp();

    window.db.collection('upcoming_events').doc(docId).set(payload)
      .then(() => {
        window.showToast?.("🎉 Upcoming Event published successfully!", "success");
        window.cancelAdminEventEdit();
      })
      .catch(err => {
        window.handleFirestoreError(err, 'create', `upcoming_events/${docId}`);
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  }
};

let adminUpcomingEventsListener = null;
function syncAdminUpcomingEvents() {
  const container = document.getElementById('admin-upcoming-events-list');
  if (!container) return;

  if (adminUpcomingEventsListener) adminUpcomingEventsListener();

  adminUpcomingEventsListener = window.db.collection('upcoming_events')
    .orderBy('eventDate', 'asc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      window.adminUpcomingEventsCache = {};

      if (snap.empty) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic">No upcoming events published yet.</p>`;
        return;
      }

      snap.forEach(doc => {
        const ev = doc.data();
        const evId = doc.id;
        window.adminUpcomingEventsCache[evId] = ev;

        const dateSummary = window.formatEventDatesDisplay(ev);
        const card = document.createElement('div');
        card.className = "p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3";
        
        let extraDatesBadges = '';
        if (ev.extraDates && Array.isArray(ev.extraDates) && ev.extraDates.length > 0) {
          extraDatesBadges = `
            <div class="mt-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Additional Sessions:</span>
              <div class="flex flex-wrap gap-1">
                ${ev.extraDates.map(d => `<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">📅 ${new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>`).join('')}
              </div>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="space-y-2">
            ${ev.imageUrl ? `<img src="${ev.imageUrl}" class="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 shadow-xs" />` : ''}
            <div>
              <span class="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 inline-block">
                📅 ${dateSummary}
              </span>
              <h5 class="font-extrabold text-slate-900 dark:text-zinc-100 text-sm mt-1.5">${ev.title}</h5>
              <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">${ev.description}</p>
              <div class="text-[10px] text-slate-400 font-bold mt-1">📍 ${ev.location}</div>
              ${extraDatesBadges}
            </div>
          </div>
          <div class="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <button onclick="window.editUpcomingEvent('${evId}')" class="px-3 py-1.5 text-xs font-bold bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg transition-all cursor-pointer flex items-center gap-1">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit Event
            </button>
            <button onclick="window.deleteUpcomingEvent('${evId}')" class="px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 rounded-lg transition-all cursor-pointer flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete
            </button>
          </div>
        `;
        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => window.handleFirestoreError(err, 'list', 'upcoming_events'));
}

window.deleteUpcomingEvent = function(eventId) {
  const isConfirmed = confirm("Are you sure you want to delete this upcoming event?");
  if (!isConfirmed) return;

  window.db.collection('upcoming_events').doc(eventId).delete()
    .then(() => window.showToast?.("Upcoming event deleted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `upcoming_events/${eventId}`));
};

// 8. Daily Devotionals Manager Functions
let adminDevotionalImageBase64 = '';

window.previewAdminDevotionalImage = function(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;
  compressAndResizeImage(file, 800, 0.75).then(base64 => {
    adminDevotionalImageBase64 = base64;
    const box = document.getElementById('admin-devotional-img-preview-box');
    const img = document.getElementById('admin-devotional-img-preview');
    if (box && img) {
      img.src = base64;
      box.classList.remove('hidden');
    }
  }).catch(err => {
    window.showToast?.("Error processing devotional image: " + err.message, "error");
  });
};

window.previewAdminDevotionalUrl = function(url) {
  if (!url) return;
  adminDevotionalImageBase64 = url.trim();
  const box = document.getElementById('admin-devotional-img-preview-box');
  const img = document.getElementById('admin-devotional-img-preview');
  if (box && img) {
    img.src = url.trim();
    box.classList.remove('hidden');
  }
};

window.clearAdminDevotionalImage = function() {
  adminDevotionalImageBase64 = '';
  const fileInput = document.getElementById('admin-devotional-file');
  const urlInput = document.getElementById('admin-devotional-url');
  const box = document.getElementById('admin-devotional-img-preview-box');
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (box) box.classList.add('hidden');
};

window.handleAdminDevotionalSubmit = function(event) {
  if (event) event.preventDefault();
  const title = document.getElementById('admin-devotional-title').value.trim();
  const scripture = document.getElementById('admin-devotional-scripture').value.trim();
  const devotionalDate = document.getElementById('admin-devotional-date').value;
  const body = document.getElementById('admin-devotional-body').value.trim();
  const submitBtn = document.getElementById('btn-save-devotional');

  const imageUrl = adminDevotionalImageBase64 || document.getElementById('admin-devotional-url')?.value.trim();

  if (!title || !scripture || !devotionalDate || !body) {
    window.showToast?.("Please fill out all devotional fields.", "error");
    return;
  }
  if (!imageUrl) {
    window.showToast?.("Please attach a devotional picture (file or URL).", "error");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Publishing Devotional...";
  }

  const docId = window.db.collection('daily_devotionals').doc().id;
  window.db.collection('daily_devotionals').doc(docId).set({
    id: docId,
    title,
    scripture,
    devotionalDate,
    body,
    imageUrl,
    createdBy: window.currentUserProfile?.displayName || 'Super Admin',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    window.showToast?.("☀️ Daily Devotional published successfully!", "success");
    document.getElementById('admin-devotional-form')?.reset();
    window.clearAdminDevotionalImage();
  }).catch(err => {
    window.handleFirestoreError(err, 'create', `daily_devotionals/${docId}`);
  }).finally(() => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="sun" class="w-4 h-4"></i> Publish Daily Devotional`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
};

let adminDailyDevotionalsListener = null;
function syncAdminDailyDevotionals() {
  const container = document.getElementById('admin-daily-devotionals-list');
  if (!container) return;

  if (adminDailyDevotionalsListener) adminDailyDevotionalsListener();

  adminDailyDevotionalsListener = window.db.collection('daily_devotionals')
    .orderBy('devotionalDate', 'desc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic">No daily devotionals published yet.</p>`;
        return;
      }

      window.devotionalsCache = window.devotionalsCache || {};

      snap.forEach(doc => {
        const d = doc.data();
        const dId = doc.id;
        d.id = doc.id;
        window.devotionalsCache[doc.id] = d;

        const card = document.createElement('div');
        card.className = "p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3";
        
        card.innerHTML = `
          <div class="space-y-2">
            ${d.imageUrl ? `<img src="${d.imageUrl}" class="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 shadow-xs cursor-pointer" onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" />` : ''}
            <div>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                ${d.devotionalDate} • ${d.scripture}
              </span>
              <h5 class="font-extrabold text-slate-900 dark:text-zinc-100 text-sm mt-1 cursor-pointer hover:text-amber-600" onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])">${d.title}</h5>
              <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-3 mt-0.5 leading-relaxed">${d.body}</p>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <button onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" class="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-lg transition-all cursor-pointer flex items-center gap-1">
              <i data-lucide="book-open" class="w-3.5 h-3.5"></i> Read Full
            </button>
            <button onclick="window.deleteDailyDevotional('${dId}')" class="px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 rounded-lg transition-all cursor-pointer flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete
            </button>
          </div>
        `;
        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => window.handleFirestoreError(err, 'list', 'daily_devotionals'));
}

window.deleteDailyDevotional = function(devotionalId) {
  const isConfirmed = confirm("Are you sure you want to delete this daily devotional?");
  if (!isConfirmed) return;

  window.db.collection('daily_devotionals').doc(devotionalId).delete()
    .then(() => window.showToast?.("Daily devotional deleted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `daily_devotionals/${devotionalId}`));
};

// Form Listeners
document.addEventListener("DOMContentLoaded", () => {
  const qForm = document.getElementById('trivia-creator-form');
  if (qForm) {
    qForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const question = document.getElementById('trivia-q').value.trim();
      const opt0 = document.getElementById('trivia-o0').value.trim();
      const opt1 = document.getElementById('trivia-o1').value.trim();
      const opt2 = document.getElementById('trivia-o2').value.trim();
      const opt3 = document.getElementById('trivia-o3').value.trim();
      const answerIdx = parseInt(document.getElementById('trivia-answer-idx').value);

      if (!question || !opt0 || !opt1) return;

      createTriviaQuestion(question, [opt0, opt1, opt2, opt3], answerIdx);
      qForm.reset();
    });
  }

  const bForm = document.getElementById('admin-bundle-form');
  if (bForm) {
    bForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('bundle-title').value.trim();
      const size = document.getElementById('bundle-size').value.trim();
      const url = document.getElementById('bundle-url').value.trim();
      const tag = document.getElementById('bundle-tag').value.trim();
      const category = document.getElementById('bundle-category').value;

      if (!title || !url) return;

      createDownloadBundle(title, size, url, tag, category);
      bForm.reset();
    });
  }

  const cForm = document.getElementById('admin-desk-form');
  if (cForm) {
    cForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateSupportDesk();
    });
  }

  const tsForm = document.getElementById('admin-trivia-settings-form');
  if (tsForm) {
    tsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const timerLimit = parseInt(document.getElementById('trivia-settings-timer').value) || 15;
      const pointsPerQuestion = parseInt(document.getElementById('trivia-settings-points').value) || 100;
      const weeklyTheme = document.getElementById('trivia-settings-theme').value.trim() || 'The Pentecost Acts';

      window.db.collection('system_configs').doc('trivia').set({
        timerLimit,
        pointsPerQuestion,
        weeklyTheme
      })
        .then(() => window.showToast?.("Trivia engine rules updated successfully!"))
        .catch(err => window.handleFirestoreError(err, 'write', 'system_configs/trivia'));
    });
  }

  const sForm = document.getElementById('admin-stream-form');
  if (sForm) {
    sForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateStreamDesk();
    });
  }

  const clForm = document.getElementById('change-leader-form');
  if (clForm) {
    clForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cellId = document.getElementById('change-leader-cell-id').value;
      const newLeaderUid = document.getElementById('change-leader-select').value;
      const newLeader = (window.allUsersList || []).find(u => u.uid === newLeaderUid);
      if (!newLeader) return;

      window.db.collection('cells').doc(cellId).get().then(cellDoc => {
        if (!cellDoc.exists) {
          window.showToast?.("Cell fellowship group not found.", "error");
          return;
        }

        const cellData = cellDoc.data();
        const oldLeaderUid = cellData.leaderUid;

        const batch = window.db.batch();

        // Update Cell Doc
        batch.update(window.db.collection('cells').doc(cellId), {
          leaderUid: newLeaderUid,
          leaderName: newLeader.displayName || newLeader.email,
          leaderEmail: newLeader.email
        });

        // Promote new leader
        batch.update(window.db.collection('users').doc(newLeaderUid), {
          role: 'Cell Leader',
          cellId: cellId
        });

        // Demote old leader (if different from new leader)
        if (oldLeaderUid && oldLeaderUid !== newLeaderUid) {
          batch.update(window.db.collection('users').doc(oldLeaderUid), {
            role: 'Member'
          });
        }

        return batch.commit().then(() => {
          window.showToast?.("Cell leadership reassigned successfully.");
          closeChangeLeaderModal();
        });
      })
      .catch(err => window.handleFirestoreError(err, 'write', 'reassign_leader'));
    });
  }
});

function openChangeCellLeaderModal(cellId) {
  const cellIdInput = document.getElementById('change-leader-cell-id');
  if (cellIdInput) cellIdInput.value = cellId;

  const select = document.getElementById('change-leader-select');
  if (select) {
    select.innerHTML = (window.allUsersList || []).map(u => `
      <option value="${u.uid}">${u.displayName || u.email} (${u.role || 'Member'})</option>
    `).join('');
  }

  const modal = document.getElementById('change-leader-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeChangeLeaderModal() {
  const modal = document.getElementById('change-leader-modal');
  if (modal) modal.classList.add('hidden');
}

// Support for off-app push notifications nudges
function applyNudgePreset() {
  const select = document.getElementById('nudge-preset-select');
  const titleInput = document.getElementById('admin-nudge-title');
  const bodyInput = document.getElementById('admin-nudge-body');
  const targetSelect = document.getElementById('admin-nudge-target');

  if (!select || !titleInput || !bodyInput) return;

  const choice = select.value;
  if (choice === 'devotion') {
    titleInput.value = "☀️ Keep Your Streak Alive!";
    bodyInput.value = "Your personal devotion streak is a beautiful testimony of your faith. Complete today's daily devotional check-in now to maintain it!";
    if (targetSelect) targetSelect.value = "/?tab=dashboard";
  } else if (choice === 'trivia') {
    titleInput.value = "🔥 Live Trivia Active Now!";
    bodyInput.value = "The Pentecost Trivia arena is buzzing! Come test your bible knowledge in real-time with fellow members of the assembly!";
    if (targetSelect) targetSelect.value = "/?tab=bible";
  } else if (choice === 'testimony') {
    titleInput.value = "🙏 Power-packed Testimony Shared!";
    bodyInput.value = "A member of the cohort just shared a magnificent testimony of God's grace. Read it, support them, and get encouraged!";
    if (targetSelect) targetSelect.value = "/?tab=feed";
  } else if (choice === 'stream') {
    titleInput.value = "📹 Live Fellowship Broadcast Active!";
    bodyInput.value = "We are gathering online right now. Come tune into the live broadcast stream to connect, share, and grow together!";
    if (targetSelect) targetSelect.value = "/?tab=dashboard";
  }
}

function sendAdminNudge(event) {
  event.preventDefault();
  const title = document.getElementById('admin-nudge-title').value.trim();
  const body = document.getElementById('admin-nudge-body').value.trim();
  const target = document.getElementById('admin-nudge-target').value;
  const targetRoleSelect = document.getElementById('admin-nudge-role');
  const targetRole = (targetRoleSelect && targetRoleSelect.value !== 'all') ? targetRoleSelect.value : null;

  if (!title || !body) return;

  // Utilize our real push notification helper!
  if (window.sendPushNotification) {
    window.sendPushNotification(title, body, target, targetRole);
    if (targetRole) {
      window.showToast?.(`Push notification nudge successfully broadcasted off-app to all ${targetRole}s!`, "success");
    } else {
      window.showToast?.("Push notification nudge successfully broadcasted off-app to all members!", "success");
    }
    
    // Clear form
    const form = document.getElementById('admin-push-nudge-form');
    if (form) form.reset();
    const select = document.getElementById('nudge-preset-select');
    if (select) select.value = "";
  } else {
    window.showToast?.("Push Notification engine is currently initializing, please wait.", "error");
  }
}

// ==========================================
// 5. ULTIMATE INTERACTIVE QUIZ BUILDER CONSOLE
// ==========================================
let activeQuizQuestions = [];
let editingQuestionIdx = null;

function toggleAdminQuestionFormat() {
  const qType = document.getElementById('admin-q-type').value;
  const mcGroup = document.getElementById('admin-mc-group');
  const ansSelect = document.getElementById('admin-q-correct');

  if (qType === 'tf') {
    if (mcGroup) mcGroup.classList.add('hidden');
    if (ansSelect) {
      ansSelect.innerHTML = `
        <option value="0">True</option>
        <option value="1">False</option>
      `;
    }
  } else {
    if (mcGroup) mcGroup.classList.remove('hidden');
    if (ansSelect) {
      ansSelect.innerHTML = `
        <option value="0">Option A</option>
        <option value="1">Option B</option>
        <option value="2">Option C</option>
        <option value="3">Option D</option>
      `;
    }
  }
}

function addQuestionToActiveQuiz() {
  const promptEl = document.getElementById('admin-q-prompt');
  if (!promptEl) return;
  const prompt = promptEl.value.trim();
  if (!prompt) {
    window.showToast?.("Question prompt cannot be empty!", "error");
    return;
  }

  const qType = document.getElementById('admin-q-type').value;
  let options = [];
  let answerIdx = parseInt(document.getElementById('admin-q-correct').value);

  if (qType === 'tf') {
    options = ["True", "False"];
    if (answerIdx > 1) answerIdx = 0;
  } else {
    const o0 = document.getElementById('admin-q-o0').value.trim();
    const o1 = document.getElementById('admin-q-o1').value.trim();
    const o2 = document.getElementById('admin-q-o2').value.trim();
    const o3 = document.getElementById('admin-q-o3').value.trim();

    if (!o0 || !o1 || !o2 || !o3) {
      window.showToast?.("All 4 options must be supplied for Multiple Choice questions!", "error");
      return;
    }
    options = [o0, o1, o2, o3];
  }

  const newQ = { question: prompt, options, answerIdx, type: qType };

  if (editingQuestionIdx !== null) {
    activeQuizQuestions[editingQuestionIdx] = newQ;
    editingQuestionIdx = null;
    window.showToast?.("Question updated in builder queue.");
  } else {
    activeQuizQuestions.push(newQ);
    window.showToast?.("Question added to builder queue.");
  }

  // Reset question form
  promptEl.value = '';
  const o0 = document.getElementById('admin-q-o0'); if (o0) o0.value = '';
  const o1 = document.getElementById('admin-q-o1'); if (o1) o1.value = '';
  const o2 = document.getElementById('admin-q-o2'); if (o2) o2.value = '';
  const o3 = document.getElementById('admin-q-o3'); if (o3) o3.value = '';
  const correct = document.getElementById('admin-q-correct'); if (correct) correct.value = '0';

  renderActiveQuestionsQueue();
}

function renderActiveQuestionsQueue() {
  const queueContainer = document.getElementById('admin-questions-queue');
  const countEl = document.getElementById('admin-builder-count');
  if (!queueContainer) return;

  if (countEl) countEl.innerText = `${activeQuizQuestions.length} Questions Added`;

  if (activeQuizQuestions.length === 0) {
    queueContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">Add questions on the left to begin building this quiz.</p>`;
    return;
  }

  queueContainer.innerHTML = '';
  activeQuizQuestions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = "p-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1 text-xs relative group flex items-start justify-between gap-4";
    card.innerHTML = `
      <div class="space-y-1 flex-1">
        <div class="font-bold text-slate-800 dark:text-zinc-200">
          <span class="text-blue-600 dark:text-blue-400 font-extrabold pr-1">Q${idx + 1}.</span> ${q.question}
        </div>
        <div class="text-[10px] text-slate-400 flex items-center gap-2 pt-1">
          <span class="uppercase tracking-wider font-black text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">${q.type === 'tf' ? 'True/False' : 'Multi Choice'}</span>
          <span>Correct: ${q.options[q.answerIdx]}</span>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button onclick="window.reorderBuilderQuestion(${idx}, -1)" class="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-500 cursor-pointer" title="Move Up">
          <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.reorderBuilderQuestion(${idx}, 1)" class="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-500 cursor-pointer" title="Move Down">
          <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.editBuilderQuestion(${idx})" class="p-1 hover:bg-blue-100 dark:hover:bg-blue-950/40 rounded text-blue-600 cursor-pointer" title="Edit Question">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.deleteBuilderQuestion(${idx})" class="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded text-rose-500 cursor-pointer" title="Delete Question">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    queueContainer.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

function reorderBuilderQuestion(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= activeQuizQuestions.length) return;
  const temp = activeQuizQuestions[index];
  activeQuizQuestions[index] = activeQuizQuestions[newIndex];
  activeQuizQuestions[newIndex] = temp;
  renderActiveQuestionsQueue();
}

function editBuilderQuestion(index) {
  const q = activeQuizQuestions[index];
  editingQuestionIdx = index;

  document.getElementById('admin-q-prompt').value = q.question;
  document.getElementById('admin-q-type').value = q.type || 'mc';
  toggleAdminQuestionFormat();

  if (q.type !== 'tf') {
    document.getElementById('admin-q-o0').value = q.options[0] || '';
    document.getElementById('admin-q-o1').value = q.options[1] || '';
    document.getElementById('admin-q-o2').value = q.options[2] || '';
    document.getElementById('admin-q-o3').value = q.options[3] || '';
  }

  document.getElementById('admin-q-correct').value = q.answerIdx;
}

function deleteBuilderQuestion(index) {
  activeQuizQuestions.splice(index, 1);
  if (editingQuestionIdx === index) editingQuestionIdx = null;
  renderActiveQuestionsQueue();
}

function clearActiveQuizBuilder() {
  activeQuizQuestions = [];
  editingQuestionIdx = null;
  const editId = document.getElementById('admin-quiz-edit-id'); if (editId) editId.value = '';
  const title = document.getElementById('admin-quiz-title'); if (title) title.value = '';
  const topic = document.getElementById('admin-quiz-topic'); if (topic) topic.value = '';
  const diff = document.getElementById('admin-quiz-difficulty'); if (diff) diff.value = 'Beginner';
  const emoji = document.getElementById('admin-quiz-emoji'); if (emoji) emoji.value = '📖';
  const grad = document.getElementById('admin-quiz-gradient'); if (grad) grad.value = 'from-blue-600 to-indigo-700';
  const imgUrl = document.getElementById('admin-quiz-image-url'); if (imgUrl) imgUrl.value = '';
  const desc = document.getElementById('admin-quiz-desc'); if (desc) desc.value = '';
  renderActiveQuestionsQueue();
}

function publishQuizToCloud() {
  const editId = document.getElementById('admin-quiz-edit-id').value;
  const title = document.getElementById('admin-quiz-title').value.trim();
  const topic = document.getElementById('admin-quiz-topic').value.trim();
  const difficulty = document.getElementById('admin-quiz-difficulty').value;
  const coverEmoji = document.getElementById('admin-quiz-emoji').value.trim();
  const coverGradient = document.getElementById('admin-quiz-gradient').value;
  const coverImageUrl = document.getElementById('admin-quiz-image-url')?.value.trim() || '';
  const description = document.getElementById('admin-quiz-desc').value.trim();

  if (!title || !topic || !description) {
    window.showToast?.("Quiz Title, Topic Category, and Description are required!", "error");
    return;
  }

  if (activeQuizQuestions.length === 0) {
    window.showToast?.("Please add at least one question to the builder queue!", "error");
    return;
  }

  const docId = editId || window.db.collection('quizzes').doc().id;

  window.db.collection('quizzes').doc(docId).set({
    id: docId,
    title,
    topic,
    difficulty,
    coverEmoji,
    coverGradient,
    coverImageUrl,
    description,
    questions: activeQuizQuestions,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    window.showToast?.("Sunday Congregational Quiz published successfully!", "success");
    clearActiveQuizBuilder();
    syncAdminQuizzes();
    if (window.renderQuizSelectionGrid) window.renderQuizSelectionGrid();
  })
  .catch(err => window.handleFirestoreError(err, 'create', `quizzes/${docId}`));
}

// Admin JSON Upload & Download Template Helpers
function handleQuizJsonUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.questions && Array.isArray(data.questions)) {
        if (data.title) document.getElementById('admin-quiz-title').value = data.title;
        if (data.topic) document.getElementById('admin-quiz-topic').value = data.topic;
        if (data.difficulty) document.getElementById('admin-quiz-difficulty').value = data.difficulty;
        if (data.coverEmoji) document.getElementById('admin-quiz-emoji').value = data.coverEmoji;
        if (data.coverGradient) document.getElementById('admin-quiz-gradient').value = data.coverGradient;
        if (data.coverImageUrl) document.getElementById('admin-quiz-image-url').value = data.coverImageUrl;
        if (data.description) document.getElementById('admin-quiz-desc').value = data.description;
        
        activeQuizQuestions = data.questions;
        window.showToast?.(`Loaded full quiz (${data.questions.length} questions) from JSON file!`, "success");
      } else if (Array.isArray(data)) {
        activeQuizQuestions = data;
        window.showToast?.(`Loaded ${data.length} questions into builder queue from JSON array!`, "success");
      } else {
        window.showToast?.("Invalid JSON format. Expected quiz object with questions array or array of questions.", "error");
        return;
      }

      renderActiveQuestionsQueue();
    } catch (err) {
      window.showToast?.("Failed to parse JSON file: " + err.message, "error");
    }
  };
  reader.readAsText(file);
}

function downloadQuizJsonTemplate() {
  const template = {
    title: "Acts of the Apostles & Early Church",
    topic: "New Testament",
    difficulty: "Intermediate",
    coverEmoji: "🔥",
    coverGradient: "from-purple-600 to-indigo-700",
    coverImageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
    description: "Explore the explosive growth of the early church following Pentecost.",
    questions: [
      {
        question: "On which festival did the Holy Spirit descend upon the apostles?",
        options: ["Passover", "Pentecost", "Tabernacles", "Unleavened Bread"],
        answerIdx: 1,
        type: "mc"
      },
      {
        question: "In what city were the disciples first called 'Christians'?",
        options: ["Jerusalem", "Antioch", "Damascus", "Rome"],
        answerIdx: 1,
        type: "mc"
      },
      {
        question: "Saul of Tarsus was converted on the road to Damascus.",
        options: ["True", "False"],
        answerIdx: 0,
        type: "tf"
      }
    ]
  };

  const jsonStr = JSON.stringify(template, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = "HomeCell_Quiz_Template.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  window.showToast?.("📥 Sample Quiz JSON Template downloaded!", "success");
}

function parseAndApplyQuizJson(jsonText, publishDirectly = false) {
  if (!jsonText || !jsonText.trim()) {
    window.showToast?.("Please paste valid JSON code into the text area first.", "error");
    return;
  }
  try {
    const data = JSON.parse(jsonText.trim());
    
    if (data.questions && Array.isArray(data.questions)) {
      if (data.title) document.getElementById('admin-quiz-title').value = data.title;
      if (data.topic) document.getElementById('admin-quiz-topic').value = data.topic;
      if (data.difficulty) document.getElementById('admin-quiz-difficulty').value = data.difficulty;
      if (data.coverEmoji) document.getElementById('admin-quiz-emoji').value = data.coverEmoji;
      if (data.coverGradient) document.getElementById('admin-quiz-gradient').value = data.coverGradient;
      if (data.coverImageUrl) document.getElementById('admin-quiz-image-url').value = data.coverImageUrl;
      if (data.description) document.getElementById('admin-quiz-desc').value = data.description;
      
      activeQuizQuestions = data.questions;

      if (publishDirectly) {
        publishQuizToCloud();
        return;
      }

      window.showToast?.(`Loaded quiz "${data.title || 'Untitled'}" (${data.questions.length} questions) into builder!`, "success");
    } else if (Array.isArray(data)) {
      activeQuizQuestions = data;
      window.showToast?.(`Loaded ${data.length} questions into builder queue from JSON!`, "success");
    } else {
      window.showToast?.("Invalid JSON format. Expected quiz object with questions array or an array of question objects.", "error");
      return;
    }

    renderActiveQuestionsQueue();
  } catch (err) {
    window.showToast?.("Failed to parse pasted JSON code: " + err.message, "error");
  }
}

function handleQuizJsonPasteSubmit() {
  const jsonText = document.getElementById('admin-quiz-json-textarea')?.value;
  parseAndApplyQuizJson(jsonText, false);
}

function handleQuizJsonPasteDirectPublish() {
  const jsonText = document.getElementById('admin-quiz-json-textarea')?.value;
  parseAndApplyQuizJson(jsonText, true);
}

function copySampleQuizJsonToTextarea() {
  const sample = {
    title: "The Book of Acts & Early Church Miracles",
    topic: "New Testament History",
    difficulty: "Intermediate",
    coverEmoji: "🔥",
    coverGradient: "from-purple-600 to-indigo-700",
    coverImageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
    description: "Explore the Holy Spirit movement in the early apostolic church.",
    questions: [
      {
        question: "On which Jewish festival did the Holy Spirit descend upon the disciples?",
        options: ["Passover", "Pentecost", "Tabernacles", "Yom Kippur"],
        answerIdx: 1,
        type: "mc"
      },
      {
        question: "In which city were believers first called 'Christians'?",
        options: ["Jerusalem", "Antioch", "Damascus", "Ephesus"],
        answerIdx: 1,
        type: "mc"
      },
      {
        question: "Saul of Tarsus encountered Jesus on the road to Damascus.",
        options: ["True", "False"],
        answerIdx: 0,
        type: "tf"
      }
    ]
  };

  const textarea = document.getElementById('admin-quiz-json-textarea');
  if (textarea) {
    textarea.value = JSON.stringify(sample, null, 2);
    window.showToast?.("Sample quiz JSON code loaded into textarea!");
  }
}

window.handleQuizJsonUpload = handleQuizJsonUpload;
window.downloadQuizJsonTemplate = downloadQuizJsonTemplate;
window.handleQuizJsonPasteSubmit = handleQuizJsonPasteSubmit;
window.handleQuizJsonPasteDirectPublish = handleQuizJsonPasteDirectPublish;
window.copySampleQuizJsonToTextarea = copySampleQuizJsonToTextarea;

function copyDirectQuizLink(quizId) {
  const url = `${window.location.origin}${window.location.pathname}?quiz=${encodeURIComponent(quizId || 'power_of_thanksgiving')}&mode=quiz`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      window.showToast?.("🔗 Direct quiz link copied to clipboard!", "success");
    }).catch(() => {
      prompt("Copy direct quiz link:", url);
    });
  } else {
    prompt("Copy direct quiz link:", url);
  }
}
window.copyDirectQuizLink = copyDirectQuizLink;

let adminQuizzesListener = null;
function syncAdminQuizzes() {
  const catalogContainer = document.getElementById('admin-quizzes-catalog');
  if (!catalogContainer) return;

  if (adminQuizzesListener) adminQuizzesListener();

  adminQuizzesListener = window.db.collection('quizzes').orderBy('createdAt', 'desc').onSnapshot(snap => {
    catalogContainer.innerHTML = '';

    if (snap.empty) {
      catalogContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">No custom quizzes published to the catalog yet.</p>`;
      return;
    }

    snap.forEach(doc => {
      const q = doc.data();
      const card = document.createElement('div');
      card.className = "p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 text-xs";
      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            ${q.coverImageUrl ? `<img src="${q.coverImageUrl}" class="w-10 h-10 object-cover rounded-xl shrink-0" />` : `<span class="text-xl shrink-0">${q.coverEmoji || '📖'}</span>`}
            <div class="leading-tight">
              <h5 class="font-extrabold text-slate-900 dark:text-zinc-50 line-clamp-1">${q.title}</h5>
              <span class="text-[9px] uppercase tracking-wider text-slate-400">${q.topic} • ${q.difficulty}</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">${q.description}</p>
          <div class="text-[10px] text-slate-400 font-bold">${q.questions ? q.questions.length : 0} Questions published</div>
        </div>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
          <button onclick="window.editQuizFromCatalog('${q.id}')" class="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 font-bold rounded-lg transition-all cursor-pointer text-center">
            Edit
          </button>
          <button onclick="window.copyDirectQuizLink('${q.id}')" class="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-600 font-bold rounded-lg transition-all cursor-pointer text-center flex items-center gap-1" title="Copy Direct Link">
            🔗 Link
          </button>
          <button onclick="window.deleteQuizFromCatalog('${q.id}')" class="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 font-bold rounded-lg transition-all cursor-pointer text-center">
            Delete
          </button>
        </div>
      `;
      catalogContainer.appendChild(card);
    });
  }, err => console.warn("Published quizzes catalog stream failed:", err));
}

function editQuizFromCatalog(quizId) {
  window.db.collection('quizzes').doc(quizId).get().then(doc => {
    if (!doc.exists) return;
    const q = doc.data();

    document.getElementById('admin-quiz-edit-id').value = q.id;
    document.getElementById('admin-quiz-title').value = q.title || '';
    document.getElementById('admin-quiz-topic').value = q.topic || '';
    document.getElementById('admin-quiz-difficulty').value = q.difficulty || 'Beginner';
    document.getElementById('admin-quiz-emoji').value = q.coverEmoji || '📖';
    document.getElementById('admin-quiz-gradient').value = q.coverGradient || 'from-blue-600 to-indigo-700';
    if (document.getElementById('admin-quiz-image-url')) {
      document.getElementById('admin-quiz-image-url').value = q.coverImageUrl || '';
    }
    document.getElementById('admin-quiz-desc').value = q.description || '';

    activeQuizQuestions = q.questions || [];
    editingQuestionIdx = null;

    renderActiveQuestionsQueue();
    window.showToast?.("Loaded quiz into builder queue! Scroll up to edit.");
  }).catch(err => window.handleFirestoreError(err, 'get', `quizzes/${quizId}`));
}

function deleteQuizFromCatalog(quizId) {
  const isConfirmed = confirm("Are you sure you want to delete this Custom Quiz from the assembly database?");
  if (!isConfirmed) return;

  window.db.collection('quizzes').doc(quizId).delete()
    .then(() => {
      window.showToast?.("Custom quiz deleted from catalog successfully.");
      if (window.renderQuizSelectionGrid) window.renderQuizSelectionGrid();
    })
    .catch(err => window.handleFirestoreError(err, 'delete', `quizzes/${quizId}`));
}

function handleAdminPasswordChangeSubmit(e) {
  if (e) e.preventDefault();
  const user = window.auth.currentUser;
  if (!user) {
    window.showToast?.("You must be logged in as Super Admin to change password.", "error");
    return;
  }

  const newPass = document.getElementById('admin-new-password')?.value.trim();
  const confirmPass = document.getElementById('admin-confirm-password')?.value.trim();

  if (!newPass || newPass.length < 6) {
    window.showToast?.("Password must be at least 6 characters long.", "error");
    return;
  }

  if (newPass !== confirmPass) {
    window.showToast?.("Passwords do not match. Please verify and try again.", "error");
    return;
  }

  const btn = document.getElementById('btn-change-admin-pass');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Updating...`;
  }

  user.updatePassword(newPass)
    .then(() => {
      window.showToast?.("🔑 Admin password updated successfully!", "success");
      if (document.getElementById('admin-new-password')) document.getElementById('admin-new-password').value = '';
      if (document.getElementById('admin-confirm-password')) document.getElementById('admin-confirm-password').value = '';
    })
    .catch(err => {
      console.error("Admin password change error:", err);
      if (err.code === 'auth/requires-recent-login') {
        window.showToast?.("Security requirement: Please sign out and log back in before changing password directly, or click 'Send Password Reset Link'.", "error");
      } else {
        window.showToast?.("Failed to update password: " + err.message, "error");
      }
    })
    .finally(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="key" class="w-4 h-4"></i> Update Password Now`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
}

function sendAdminPasswordResetEmail() {
  const adminEmail = 'danielgiobari644@gmail.com';
  window.auth.sendPasswordResetEmail(adminEmail)
    .then(() => {
      window.showToast?.(`📧 Password reset email sent to ${adminEmail}! Check your inbox.`, "success");
    })
    .catch(err => {
      console.error("Password reset email error:", err);
      window.showToast?.("Failed to send reset email: " + err.message, "error");
    });
}

function sendUserPasswordResetEmail(email) {
  if (!email) return;
  window.auth.sendPasswordResetEmail(email)
    .then(() => {
      window.showToast?.(`📧 Password reset link sent to ${email}`, "success");
    })
    .catch(err => {
      console.error("User password reset error:", err);
      window.showToast?.("Failed to send reset email: " + err.message, "error");
    });
}

// ---------------------------------------------------------------------------
// SUPER ADMIN KINGDOM STORE PRODUCTS MANAGER 🏪
// ---------------------------------------------------------------------------

function syncAdminStoreProducts() {
  const container = document.getElementById('admin-products-catalog');
  if (!container) return;

  const db = window.db;
  if (!db) return;

  db.collection('products').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<div class="col-span-full text-center py-6 text-slate-400">No store products found. Add one above!</div>`;
      return;
    }

    snap.forEach(doc => {
      const p = doc.data();
      const pid = doc.id;

      const card = document.createElement('div');
      card.className = "p-4 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 rounded-2xl flex flex-col justify-between space-y-3";

      card.innerHTML = `
        <div class="space-y-2">
          <div class="relative h-28 rounded-xl overflow-hidden bg-slate-200">
            <img src="${p.coverUrl || 'https://images.unsplash.com/photo-1509021436468-d0f075e24b7a?auto=format&fit=crop&w=800&q=80'}" class="w-full h-full object-cover" />
            <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-amber-400 text-[9px] font-black uppercase">
              ${p.category}
            </span>
          </div>

          <h5 class="font-bold text-slate-900 dark:text-zinc-100 text-sm line-clamp-1">${p.title}</h5>
          <p class="text-xs text-amber-500 font-bold">🪙 ${p.priceKC} KC</p>
        </div>

        <button onclick="deleteAdminProduct('${pid}')" class="w-full py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer">
          Delete Product
        </button>
      `;

      container.appendChild(card);
    });
  }, err => console.warn("Admin products snapshot error:", err));
}

// Submit New Store Product
async function handleAdminProductSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('admin-prod-title')?.value?.trim();
  const category = document.getElementById('admin-prod-category')?.value || 'Wallpapers';
  const collectionName = document.getElementById('admin-prod-collection')?.value?.trim() || 'General';
  const priceKC = parseInt(document.getElementById('admin-prod-price')?.value || '50');
  const coverUrl = document.getElementById('admin-prod-cover-url')?.value?.trim() || '';
  const fileUrl = document.getElementById('admin-prod-file-url')?.value?.trim() || coverUrl;
  const description = document.getElementById('admin-prod-desc')?.value?.trim() || '';
  const tagsStr = document.getElementById('admin-prod-tags')?.value?.trim() || '';
  const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

  if (!title || !priceKC) {
    window.showToast?.("Please enter a title and Kingdom Coin price!", "error");
    return;
  }

  const db = window.db;
  if (!db) return;

  const prodRef = db.collection('products').doc();

  try {
    await prodRef.set({
      id: prodRef.id,
      title: title,
      category: category,
      collectionName: collectionName,
      priceKC: priceKC,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1509021436468-d0f075e24b7a?auto=format&fit=crop&w=800&q=80',
      fileUrl: fileUrl || coverUrl,
      description: description,
      author: "Super Admin",
      tags: tags.length ? tags : ["Kingdom", "Digital"],
      featured: true,
      published: true,
      downloadable: true,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('admin-product-form')?.reset();
    window.showToast?.(`🎉 Store product "${title}" published to Kingdom Store!`, "success");
    syncAdminStoreProducts();
  } catch (err) {
    console.error("Admin product submit error:", err);
    window.showToast?.("Error publishing store product.", "error");
  }
}

// Delete Admin Product
async function deleteAdminProduct(prodId) {
  if (!confirm("Are you sure you want to delete this store product?")) return;

  const db = window.db;
  if (!db) return;

  try {
    await db.collection('products').doc(prodId).delete();
    window.showToast?.("Product deleted.", "info");
    syncAdminStoreProducts();
  } catch (e) {
    console.error("Delete product error:", e);
  }
}

// ---------------------------------------------------------------------------
// SUPER ADMIN CUSTOM REQUESTS MANAGER ✨
// ---------------------------------------------------------------------------

function syncAdminCustomRequests() {
  const container = document.getElementById('admin-custom-requests-rows');
  if (!container) return;

  const db = window.db;
  if (!db) return;

  db.collection('custom_requests').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">No custom creation requests found.</td></tr>`;
      return;
    }

    snap.forEach(doc => {
      const r = doc.data();
      const reqId = doc.id;

      const tr = document.createElement('tr');
      tr.className = "border-b border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs";

      tr.innerHTML = `
        <td class="p-3 font-mono font-bold">${reqId}</td>
        <td class="p-3 font-bold">${r.userName || 'Member'} <span class="block text-[10px] text-slate-400">${r.userEmail || ''}</span></td>
        <td class="p-3 capitalize font-bold text-purple-600 dark:text-purple-400">${r.type}</td>
        <td class="p-3">
          <p class="font-bold line-clamp-1">${r.desiredResult}</p>
          <p class="text-[11px] text-slate-400 line-clamp-2">${r.description}</p>
        </td>
        <td class="p-3">
          <select onchange="updateAdminRequestStatus('${reqId}', this.value)" class="px-2 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-200">
            <option value="Submitted" ${r.status === 'Submitted' ? 'selected' : ''}>🟡 Submitted</option>
            <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>🔵 In Progress</option>
            <option value="Ready" ${r.status === 'Ready' ? 'selected' : ''}>🟢 Ready</option>
            <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>⚪ Completed</option>
            <option value="Needs Information" ${r.status === 'Needs Information' ? 'selected' : ''}>🔴 Needs Info</option>
          </select>
        </td>
        <td class="p-3 space-y-1">
          <button onclick="promptUploadRequestResultModal('${reqId}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] uppercase cursor-pointer">
            Upload Result
          </button>
        </td>
      `;

      container.appendChild(tr);
    });
  }, err => console.warn("Admin requests snapshot error:", err));
}

// Update Request Status
async function updateAdminRequestStatus(reqId, status) {
  const db = window.db;
  if (!db) return;

  try {
    await db.collection('custom_requests').doc(reqId).update({ status: status });
    window.showToast?.(`Updated request status to ${status}`, "success");
  } catch (e) {
    console.error("Update request status error:", e);
  }
}

// Prompt Upload Request Result Modal
function promptUploadRequestResultModal(reqId) {
  window.showModalHtml?.(`
    <div class="space-y-4 p-1">
      <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Fulfill Request ${reqId}</h3>
      <p class="text-xs text-slate-500 dark:text-zinc-400">Provide the final result URL or note to complete this creation request.</p>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">Result Image / File URL</label>
        <input type="url" id="modal-req-result-url" class="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100" placeholder="https://images.unsplash.com/... or link" />
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">Admin Note for User</label>
        <textarea id="modal-req-admin-note" rows="3" class="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100" placeholder="Praise God! Here is your requested custom wallpaper..."></textarea>
      </div>

      <div class="flex gap-2 pt-2">
        <button onclick="window.closeModal?.()" class="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
        <button onclick="saveAdminRequestResult('${reqId}')" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer">Publish Result</button>
      </div>
    </div>
  `);
}

// Save Admin Request Result
async function saveAdminRequestResult(reqId) {
  const resultUrl = document.getElementById('modal-req-result-url')?.value?.trim();
  const adminNote = document.getElementById('modal-req-admin-note')?.value?.trim();

  if (!resultUrl) {
    window.showToast?.("Please enter a result file URL!", "error");
    return;
  }

  const db = window.db;
  if (!db) return;

  try {
    await db.collection('custom_requests').doc(reqId).update({
      resultUrl: resultUrl,
      adminNotes: adminNote || '',
      status: "Ready"
    });

    window.closeModal?.();
    window.showToast?.("🎉 Custom request result published!", "success");
    syncAdminCustomRequests();
  } catch (e) {
    console.error("Save request result error:", e);
    window.showToast?.("Error saving result.", "error");
  }
}

// ---------------------------------------------------------------------------
// SUPER ADMIN FEEDBACK HUB MANAGER 💡
// ---------------------------------------------------------------------------

function syncAdminFeedbackHub() {
  const container = document.getElementById('admin-feedback-rows');
  if (!container) return;

  const db = window.db;
  if (!db) return;

  db.collection('feedback_items').onSnapshot(snap => {
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">No suggestions submitted yet.</td></tr>`;
      return;
    }

    snap.forEach(doc => {
      const f = doc.data();
      const fid = doc.id;

      const tr = document.createElement('tr');
      tr.className = "border-b border-slate-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs";

      tr.innerHTML = `
        <td class="p-3 font-bold">${f.title} <span class="block text-[10px] font-normal text-slate-400">${f.description}</span></td>
        <td class="p-3 font-bold">${f.userName || 'Member'}</td>
        <td class="p-3 font-mono font-bold text-purple-600">▲ ${f.upvotesCount || 0}</td>
        <td class="p-3">
          <select onchange="updateAdminFeedbackStatus('${fid}', this.value)" class="px-2 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-200">
            <option value="Under Review" ${f.status === 'Under Review' ? 'selected' : ''}>🟣 Under Review</option>
            <option value="Planned" ${f.status === 'Planned' ? 'selected' : ''}>🔵 Planned</option>
            <option value="In Development" ${f.status === 'In Development' ? 'selected' : ''}>🟡 In Development</option>
            <option value="Completed" ${f.status === 'Completed' ? 'selected' : ''}>🟢 Completed</option>
            <option value="Declined" ${f.status === 'Declined' ? 'selected' : ''}>🔴 Declined</option>
          </select>
        </td>
        <td class="p-3">
          ${f.rewardAwarded ? `<span class="text-emerald-500 font-bold">✨ +10 KC Awarded</span>` : `
            <button onclick="rewardAdminFeedbackUser('${fid}', '${f.userUid}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] uppercase cursor-pointer">
              Award +10 KC
            </button>
          `}
        </td>
      `;

      container.appendChild(tr);
    });
  }, err => console.warn("Admin feedback snapshot error:", err));
}

// Update Feedback Status
async function updateAdminFeedbackStatus(fid, status) {
  const db = window.db;
  if (!db) return;

  try {
    await db.collection('feedback_items').doc(fid).update({ status: status });
    window.showToast?.(`Feedback status updated to ${status}`, "success");
  } catch (e) {
    console.error("Update feedback status error:", e);
  }
}

// Award KC to User for Approved Feedback
async function rewardAdminFeedbackUser(fid, userUid) {
  if (!userUid) return;

  const db = window.db;
  if (!db) return;

  try {
    const userRef = db.collection('users').doc(userUid);
    const itemRef = db.collection('feedback_items').doc(fid);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) return;

      const currentKc = userDoc.data().kingdomCoins || 0;
      transaction.update(userRef, { kingdomCoins: currentKc + 10 });
      transaction.update(itemRef, { rewardAwarded: true });
    });

    window.showToast?.("✨ Awarded +10 Kingdom Coins to user for great feedback!", "success");
    syncAdminFeedbackHub();
  } catch (e) {
    console.error("Reward feedback error:", e);
  }
}

// Expose globally
window.syncAdminStoreProducts = syncAdminStoreProducts;
window.handleAdminProductSubmit = handleAdminProductSubmit;
window.deleteAdminProduct = deleteAdminProduct;
window.syncAdminCustomRequests = syncAdminCustomRequests;
window.updateAdminRequestStatus = updateAdminRequestStatus;
window.promptUploadRequestResultModal = promptUploadRequestResultModal;
window.saveAdminRequestResult = saveAdminRequestResult;
window.syncAdminFeedbackHub = syncAdminFeedbackHub;
window.updateAdminFeedbackStatus = updateAdminFeedbackStatus;
window.rewardAdminFeedbackUser = rewardAdminFeedbackUser;


// Expose globally
window.initAdminModule = initAdminModule;
window.toggleAdminQuestionFormat = toggleAdminQuestionFormat;
window.addQuestionToActiveQuiz = addQuestionToActiveQuiz;
window.reorderBuilderQuestion = reorderBuilderQuestion;
window.editBuilderQuestion = editBuilderQuestion;
window.deleteBuilderQuestion = deleteBuilderQuestion;
window.clearActiveQuizBuilder = clearActiveQuizBuilder;
window.publishQuizToCloud = publishQuizToCloud;
window.syncAdminQuizzes = syncAdminQuizzes;
window.editQuizFromCatalog = editQuizFromCatalog;
window.deleteQuizFromCatalog = deleteQuizFromCatalog;
window.updateUserRole = updateUserRole;
window.updateUserCellAssignment = updateUserCellAssignment;
window.evictUser = evictUser;
window.toggleCellSuspension = toggleCellSuspension;
window.deleteCellGroup = deleteCellGroup;
window.deleteParishEvent = deleteParishEvent;
window.deleteTriviaQuestion = deleteTriviaQuestion;
window.deleteDownloadBundle = deleteDownloadBundle;
window.checkTriviaAnswer = checkTriviaAnswer;
window.updateSupportDesk = updateSupportDesk;
window.updateStreamDesk = updateStreamDesk;
window.syncAdminStreams = syncAdminStreams;
window.editStream = editStream;
window.deleteStream = deleteStream;
window.endLiveStream = endLiveStream;
window.resetStreamForm = resetStreamForm;
window.setAdminSubTab = setAdminSubTab;
window.openChangeCellLeaderModal = openChangeCellLeaderModal;
window.closeChangeLeaderModal = closeChangeLeaderModal;
window.applyNudgePreset = applyNudgePreset;
window.sendAdminNudge = sendAdminNudge;
window.renameCellGroup = renameCellGroup;
window.handleAdminPasswordChangeSubmit = handleAdminPasswordChangeSubmit;
window.sendAdminPasswordResetEmail = sendAdminPasswordResetEmail;
window.sendUserPasswordResetEmail = sendUserPasswordResetEmail;
