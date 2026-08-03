// cells.js
// Fellowship Cell Groups, directory, join/leave, cell-specific chats, events, and co-leader appointment

let activeCellListener = null;
let chatMessagesListener = null;
let cellEventsListener = null;

function initCellsModule() {
  loadCellDirectory();
  syncActiveUserCellState();
}

function loadCellDirectory() {
  const container = document.getElementById('cells-directory');
  if (!container) return;

  window.db.collection('cells').onSnapshot(snap => {
    container.innerHTML = '';
    
    // Also update Onboarding cell choice select dropdown
    const obSelect = document.getElementById('ob-cell-choice');
    if (obSelect) {
      obSelect.innerHTML = `
        <option value="" disabled selected>-- Choose an available Cell Group to join (Required) --</option>
        <option value="request_new">➕ Request a new Fellowship Cell Group (Requires Super Admin Approval)</option>
      `;
    }

    if (snap.empty) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-400">
          <i data-lucide="info" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p class="font-bold">No active fellowship cells found in the registry.</p>
          <p class="text-xs mt-1">Please request a new cell group during onboarding for Super Admin approval.</p>
        </div>
      `;
      return;
    }

    snap.forEach(doc => {
      const cell = doc.data();
      const cellId = doc.id;

      // Populate onboarding select only with active cells or approved cells
      if (obSelect && (cell.status === 'active' || !cell.status)) {
        const opt = document.createElement('option');
        opt.value = cellId;
        opt.innerText = `🏡 ${cell.name} (${cell.city}) - Leader: ${cell.leaderName}`;
        obSelect.appendChild(opt);
      }

      // Render cell card in directory
      const card = document.createElement('div');
      card.className = `p-6 bg-white dark:bg-zinc-900 border rounded-3xl space-y-4 shadow-sm flex flex-col justify-between ${
        cell.status === 'suspended' ? 'border-amber-500 opacity-60' : 'border-slate-200 dark:border-zinc-800'
      }`;

      const userJoinedThis = window.currentUserProfile?.cellId === cellId;
      const isLeader = cell.leaderUid === window.auth.currentUser?.uid;

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex justify-between items-start gap-2">
            <div>
              <span class="text-xs font-bold text-blue-500 uppercase tracking-widest block">${cell.city}</span>
              <h4 class="text-xl font-black font-display text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                ${cell.name}
                ${cell.status === 'suspended' ? '<span class="text-xs font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded">SUSPENDED</span>' : ''}
              </h4>
            </div>
            ${userJoinedThis ? '<span class="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full tracking-wider border border-emerald-200 dark:border-emerald-900">JOINED</span>' : ''}
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${cell.description}</p>
          
          <div class="pt-2 text-xs text-slate-400 font-semibold space-y-1">
            <div class="flex items-center gap-1.5"><i data-lucide="user" class="w-3.5 h-3.5"></i> Leader: <span class="text-slate-700 dark:text-zinc-300">${cell.leaderName}</span></div>
            ${cell.coLeaders && cell.coLeaders.length > 0 ? `<div class="flex items-center gap-1.5"><i data-lucide="shield" class="w-3.5 h-3.5"></i> Co-Leaders: <span class="text-slate-700 dark:text-zinc-300 text-[10px] truncate">${cell.coLeaders.join(', ')}</span></div>` : ''}
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex gap-2">
          ${
            userJoinedThis
              ? `<button onclick="leaveActiveCell()" class="flex-1 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer">Leave Cell</button>`
              : cell.status === 'suspended'
              ? `<button disabled class="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 text-xs font-bold uppercase cursor-not-allowed">Suspended</button>`
              : `<button onclick="joinCell('${cellId}')" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5">Join Cell <i data-lucide="plus-circle" class="w-4 h-4"></i></button>`
          }
        </div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => window.handleFirestoreError(err, 'list', 'cells'));
}

function syncActiveUserCellState() {
  const uid = window.auth.currentUser?.uid;
  if (!uid) return;

  // Unsubscribe old listeners
  if (activeCellListener) activeCellListener();
  if (chatMessagesListener) chatMessagesListener();
  if (cellEventsListener) cellEventsListener();

  const noCellNotice = document.getElementById('no-cell-notice');
  const activeCellCard = document.getElementById('active-cell-card');
  const chatNoCellNotice = document.getElementById('chat-no-cell-notice');
  const chatActiveBox = document.getElementById('chat-active-box');
  const chatActiveCellName = document.getElementById('chat-active-cell-name');

  // Watch current user profile's cellId
  window.db.collection('users').doc(uid).onSnapshot(userDoc => {
    if (!userDoc.exists) return;
    const profile = userDoc.data();
    window.currentUserProfile = profile;
    const cellId = profile.cellId;

    if (!cellId || cellId === 'none') {
      if (noCellNotice) noCellNotice.classList.remove('hidden');
      if (activeCellCard) activeCellCard.classList.add('hidden');
      if (chatNoCellNotice) chatNoCellNotice.classList.remove('hidden');
      if (chatActiveBox) chatActiveBox.classList.add('hidden');
      return;
    }

    // User is in a cell group, fetch active cell details
    activeCellListener = window.db.collection('cells').doc(cellId).onSnapshot(cellDoc => {
      if (!cellDoc.exists || cellDoc.data().status === 'suspended') {
        // Automatically eject user if cell suspended or deleted
        window.db.collection('users').doc(uid).update({ cellId: 'none' })
          .then(() => window.showToast?.("The cell group is suspended or no longer active.", "error"))
          .catch(err => console.error("Auto ejection failed:", err));
        return;
      }

      const cell = cellDoc.data();

      if (noCellNotice) noCellNotice.classList.add('hidden');
      if (activeCellCard) activeCellCard.classList.remove('hidden');
      if (chatNoCellNotice) chatNoCellNotice.classList.add('hidden');
      if (chatActiveBox) chatActiveBox.classList.remove('hidden');

      // Update active cell UI elements
      const nameEl = document.getElementById('active-cell-name');
      const cityEl = document.getElementById('active-cell-city');
      const descEl = document.getElementById('active-cell-desc');

      if (nameEl) nameEl.innerText = cell.name;
      if (cityEl) cityEl.innerText = cell.city;
      if (descEl) descEl.innerText = cell.description;
      if (chatActiveCellName) chatActiveCellName.innerText = `${cell.name} Chat Lounge`;

      // Check co-leader permission
      const isPrimaryLeader = cell.leaderUid === uid;
      const isCoLeader = cell.coLeaders?.includes(window.auth.currentUser?.email);

      const coLeaderModule = document.getElementById('co-leader-appointment');
      if (coLeaderModule) {
        if (isPrimaryLeader) coLeaderModule.classList.remove('hidden');
        else coLeaderModule.classList.add('hidden');
      }

      const btnAddEvent = document.getElementById('btn-add-cell-event');
      if (btnAddEvent) {
        if (isPrimaryLeader || isCoLeader) btnAddEvent.classList.remove('hidden');
        else btnAddEvent.classList.add('hidden');
      }

      // Connect Cell-specific Lounge and events
      startCellChatMessagesSync(cellId);
      startCellEventsSync(cellId);

    }, err => window.handleFirestoreError(err, 'get', `cells/${cellId}`));
  });
}

function joinCell(cellId) {
  const uid = window.auth.currentUser?.uid;
  if (!uid) return;

  window.db.collection('users').doc(uid).update({ cellId })
    .then(() => {
      window.showToast?.("Successfully joined fellowship cell group!");
      switchTab('cells');
    })
    .catch(err => window.handleFirestoreError(err, 'write', `users/${uid}`));
}

function leaveActiveCell() {
  const uid = window.auth.currentUser?.uid;
  if (!uid) return;

  // Confirm using dynamic custom style prompt (replace standard confirm)
  const isConfirmed = confirm("Are you sure you want to leave your active fellowship cell group?");
  if (!isConfirmed) return;

  window.db.collection('users').doc(uid).update({ cellId: 'none' })
    .then(() => {
      window.showToast?.("You left the cell group successfully.");
    })
    .catch(err => window.handleFirestoreError(err, 'write', `users/${uid}`));
}

function startCellChatMessagesSync(cellId) {
  const messagesBox = document.getElementById('cell-chat-messages');
  if (!messagesBox) return;

  if (chatMessagesListener) chatMessagesListener();

  chatMessagesListener = window.db.collection('cells').doc(cellId).collection('messages')
    .orderBy('createdAt', 'asc')
    .limit(100)
    .onSnapshot(snap => {
      messagesBox.innerHTML = '';
      if (snap.empty) {
        messagesBox.innerHTML = `
          <div class="text-center py-12 text-slate-400 h-full flex flex-col items-center justify-center">
            <i data-lucide="message-circle" class="w-8 h-8 opacity-40 mb-2"></i>
            <p class="text-xs font-bold">No chat messages yet. Spark a holy greeting!</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      snap.forEach(doc => {
        const msg = doc.data();
        const msgId = doc.id;
        const isSelf = msg.senderUid === window.auth.currentUser?.uid;

        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`;

        const formattedTime = msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        wrapper.innerHTML = `
          <span class="text-[10px] font-bold text-slate-400 px-1 mb-0.5">${msg.senderName} • ${formattedTime}</span>
          <div class="group relative px-4 py-2.5 rounded-2xl text-sm ${
            isSelf
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-none'
          }">
            <p>${msg.text}</p>
            ${
              isSelf || window.currentUserRole === 'Super Admin'
                ? `<button onclick="deleteChatMessage('${cellId}', '${msgId}')" class="absolute hidden group-hover:block -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg cursor-pointer hover:bg-rose-600 transition-all">
                     <i data-lucide="trash-2" class="w-3 h-3"></i>
                   </button>`
                : ''
            }
          </div>
        `;

        messagesBox.appendChild(wrapper);
      });

      // Scroll to bottom
      messagesBox.scrollTop = messagesBox.scrollHeight;
      
      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Lounge security restriction: Join the cell first to sync logs."));
}

function sendCellChatMessage(text) {
  const user = window.auth.currentUser;
  const profile = window.currentUserProfile;
  if (!user || !profile || !profile.cellId || profile.cellId === 'none') return;

  window.db.collection('cells').doc(profile.cellId).collection('messages').add({
    senderUid: user.uid,
    senderName: profile.displayName || user.email,
    text: text,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    if (window.sendPushNotification) {
      window.sendPushNotification(
        `💬 Chat Lounge: ${profile.displayName || user.email}`,
        text,
        '/?tab=chat',
        null, // targetRole
        null, // targetUid
        user.uid // excludeUid: exclude the sender themselves!
      );
    }
  })
  .catch(err => window.handleFirestoreError(err, 'create', `cells/${profile.cellId}/messages`));
}

function deleteChatMessage(cellId, msgId) {
  const isConfirmed = confirm("Do you want to permanently delete this chat message?");
  if (!isConfirmed) return;

  window.db.collection('cells').doc(cellId).collection('messages').doc(msgId).delete()
    .then(() => window.showToast?.("Message deleted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `cells/${cellId}/messages/${msgId}`));
}

function appointCoLeader() {
  const emailInput = document.getElementById('co-leader-email');
  if (!emailInput) return;
  const email = emailInput.value.trim().toLowerCase();
  if (!email) return;

  const profile = window.currentUserProfile;
  if (!profile || !profile.cellId || profile.cellId === 'none') return;

  window.db.collection('cells').doc(profile.cellId).get().then(doc => {
    if (!doc.exists) return;
    const data = doc.data();
    const coLeaders = data.coLeaders || [];
    
    if (coLeaders.includes(email)) {
      window.showToast?.("This member is already registered as a co-leader.", "error");
      return;
    }

    coLeaders.push(email);

    window.db.collection('cells').doc(profile.cellId).update({ coLeaders })
      .then(() => {
        window.showToast?.(`Successfully appointed ${email} as co-leader!`);
        emailInput.value = '';
      })
      .catch(err => window.handleFirestoreError(err, 'write', `cells/${profile.cellId}`));
  });
}

function startCellEventsSync(cellId) {
  const container = document.getElementById('active-cell-events');
  if (!container) return;

  if (cellEventsListener) cellEventsListener();

  cellEventsListener = window.db.collection('cells').doc(cellId).collection('events')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `<p class="text-slate-400 italic">No cell gathers scheduled</p>`;
        return;
      }

      snap.forEach(doc => {
        const ev = doc.data();
        const evId = doc.id;

        const formattedDate = new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

        const item = document.createElement('div');
        item.className = "p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1 relative group";
        
        item.innerHTML = `
          <div class="font-bold text-slate-800 dark:text-zinc-200 text-sm">${ev.title}</div>
          <div class="text-[10px] text-slate-400 font-mono">${formattedDate}</div>
          <div class="text-slate-500 dark:text-zinc-400">${ev.description}</div>
          ${
            window.currentUserProfile?.cellId === cellId && (window.currentUserProfile?.uid === doc.ref.parent.parent.id || window.currentUserRole === 'Super Admin')
              ? `<button onclick="deleteCellEvent('${cellId}', '${evId}')" class="absolute hidden group-hover:block top-3 right-3 text-rose-500 hover:text-rose-700">
                   <i data-lucide="trash" class="w-3.5 h-3.5"></i>
                 </button>`
              : ''
          }
        `;

        container.appendChild(item);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Lounge security restriction: Join the cell first to sync events."));
}

function addCellEvent(title, date, description) {
  const profile = window.currentUserProfile;
  if (!profile || !profile.cellId || profile.cellId === 'none') return;

  window.db.collection('cells').doc(profile.cellId).collection('events').add({
    title,
    date,
    description,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => {
      window.showToast?.("Cell event scheduled successfully!");
      closeCellEventModal();
    })
    .catch(err => window.handleFirestoreError(err, 'create', `cells/${profile.cellId}/events`));
}

function deleteCellEvent(cellId, evId) {
  const isConfirmed = confirm("Are you sure you want to cancel this scheduled cell event?");
  if (!isConfirmed) return;

  window.db.collection('cells').doc(cellId).collection('events').doc(evId).delete()
    .then(() => window.showToast?.("Event canceled."))
    .catch(err => window.handleFirestoreError(err, 'delete', `cells/${cellId}/events/${evId}`));
}

// Event handlers
document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById('cell-chat-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('cell-chat-input');
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      sendCellChatMessage(val);
      input.value = '';
    });
  }

  const cellEventForm = document.getElementById('cell-event-form');
  if (cellEventForm) {
    cellEventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('cell-ev-title').value.trim();
      const date = document.getElementById('cell-ev-date').value;
      const desc = document.getElementById('cell-ev-desc').value.trim();
      addCellEvent(title, date, desc);
      cellEventForm.reset();
    });
  }
});

// Modals management
function openAddCellEventModal() {
  const m = document.getElementById('cell-event-modal');
  if (m) m.classList.remove('hidden');
}

function closeCellEventModal() {
  const m = document.getElementById('cell-event-modal');
  if (m) m.classList.add('hidden');
}

// Expose globally
window.initCellsModule = initCellsModule;
window.joinCell = joinCell;
window.leaveActiveCell = leaveActiveCell;
window.appointCoLeader = appointCoLeader;
window.deleteChatMessage = deleteChatMessage;
window.deleteCellEvent = deleteCellEvent;
window.openAddCellEventModal = openAddCellEventModal;
window.closeCellEventModal = closeCellEventModal;
