// admin.js
// Super Admin Controls Desk - membership registry, parish events, trivia factory, installer publisher, and system settings

let usersListListener = null;
let adminCellsListener = null;
let adminEventsListener = null;
let adminTriviaListener = null;
let adminBundlesListener = null;

function initAdminModule() {
  if (window.currentUserRole !== 'Super Admin') {
    const adminBtn = document.getElementById('nav-admin');
    if (adminBtn) adminBtn.classList.add('hidden');
    
    const sec = document.getElementById('tab-admin');
    if (sec) sec.innerHTML = `<div class="p-12 text-center text-slate-400">Unauthorized. This panel is reserved for the Super Admin.</div>`;
    return;
  }

  // Show Admin pane sidebar button and separator if Super Admin
  const adminBtn = document.getElementById('nav-admin');
  if (adminBtn) adminBtn.classList.remove('hidden');

  const adminSep = document.getElementById('admin-nav-separator');
  if (adminSep) adminSep.classList.remove('hidden');

  syncMembershipRegistry();
  syncAdminCells();
  syncAdminEvents();
  syncAdminTrivia();
  syncAdminBundles();
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
      if (snap.empty) {
        container.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">No registered members found.</td></tr>`;
        return;
      }

      snap.forEach(doc => {
        const u = doc.data();
        const uid = doc.id;

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
            <button onclick="evictUser('${uid}')" class="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer" title="Evict User">
              <i data-lucide="trash-2" class="w-4 h-4 mx-auto"></i>
            </button>
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
      const isSuspended = cell.status === 'suspended';

      const card = document.createElement('div');
      card.className = `p-5 bg-slate-50 dark:bg-zinc-800/40 border rounded-2xl flex flex-col justify-between ${
        isSuspended ? 'border-amber-500 bg-amber-50/10' : 'border-slate-200 dark:border-zinc-800'
      }`;

      card.innerHTML = `
        <div>
          <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest">${cell.city}</span>
          <h5 class="font-black font-display text-slate-900 dark:text-zinc-100">${cell.name}</h5>
          <p class="text-xs text-slate-500 mt-1">${cell.description}</p>
          <div class="text-[10px] text-slate-400 font-semibold mt-2">Leader: ${cell.leaderName} (${cell.leaderEmail})</div>
        </div>

        <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
          <button onclick="toggleCellSuspension('${cellId}', '${cell.status}')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
      `;

      grid.appendChild(card);
    });

    container.appendChild(grid);

    if (window.lucide) window.lucide.createIcons();
  }, err => window.handleFirestoreError(err, 'list', 'cells'));
}

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

// 3. Parish Gatherings Manager
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
    .then(() => window.showToast?.("Created Universal Parish gathering."))
    .catch(err => window.handleFirestoreError(err, 'create', `parish_events/${docId}`));
}

function deleteParishEvent(eventId) {
  const isConfirmed = confirm("Are you sure you want to delete this Parish Gathering?");
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

// 6. Global Desktop Support & YouTube Stream Config
function loadGlobalDeskSettings() {
  const phone = document.getElementById('desk-form-phone');
  const wa = document.getElementById('desk-form-whatsapp');
  const email = document.getElementById('desk-form-email');

  const active = document.getElementById('admin-stream-active');
  const title = document.getElementById('admin-stream-title');
  const desc = document.getElementById('admin-stream-desc');
  const url = document.getElementById('admin-stream-url');

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
  const active = document.getElementById('admin-stream-active').checked;
  const title = document.getElementById('admin-stream-title').value.trim();
  const desc = document.getElementById('admin-stream-desc').value.trim();
  const url = document.getElementById('admin-stream-url').value.trim();

  window.db.collection('system_configs').doc('stream').set({
    streamActive: active,
    streamTitle: title,
    streamDesc: desc,
    streamUrl: url
  })
    .then(() => window.showToast?.("Broadcast stream configuration refreshed."))
    .catch(err => window.handleFirestoreError(err, 'write', 'system_configs/stream'));
}

// Admin Panel Sub Tab switches
function setAdminSubTab(subTabId) {
  const subTabs = ['users', 'cells', 'trivia', 'bundles', 'configs', 'stream'];
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

  const sForm = document.getElementById('admin-stream-form');
  if (sForm) {
    sForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateStreamDesk();
    });
  }
});

// Expose globally
window.initAdminModule = initAdminModule;
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
window.setAdminSubTab = setAdminSubTab;
