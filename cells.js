// cells.js
// Fellowship Cell Groups, directory, join/leave, cell-specific chats, events, members & presence

let activeCellListener = null;
let chatMessagesListener = null;
let cellEventsListener = null;
let presenceListener = null;
let membersListener = null;

let currentReplyTarget = null;
let scriptureBannerInterval = null;
let currentScriptureIndex = 0;
let chatTypingTimeout = null;

const scriptureList = [
  "📖 'Let everything that has breath praise the Lord. – Psalm 150:6'",
  "⏰ 'Prayer meeting starts soon! Join us online or at the cell host house.'",
  "🙏 'Remember to complete today's devotional in the Scripture Hub.'",
  "✨ 'For where two or three gather in my name, there am I with them. – Matthew 18:20'",
  "🔥 'Iron sharpens iron, and one person sharpens another. – Proverbs 27:17'",
  "🕊️ 'Love one another deeply, from the heart. – 1 Peter 1:22'"
];

function initCellsModule() {
  loadCellDirectory();
  syncActiveUserCellState();
  startScriptureBannerRotation();
}

// ----------------------------------------------------
// 1. ROTATING SCRIPTURE & ANNOUNCEMENT BANNER
// ----------------------------------------------------
function startScriptureBannerRotation() {
  if (scriptureBannerInterval) clearInterval(scriptureBannerInterval);
  updateScriptureBannerText();
  scriptureBannerInterval = setInterval(() => {
    rotateScriptureBanner();
  }, 7000);
}

function rotateScriptureBanner() {
  currentScriptureIndex = (currentScriptureIndex + 1) % scriptureList.length;
  updateScriptureBannerText();
}

function updateScriptureBannerText() {
  const bannerEl = document.getElementById('chat-banner-text');
  if (bannerEl) {
    bannerEl.classList.add('opacity-0');
    setTimeout(() => {
      bannerEl.innerText = scriptureList[currentScriptureIndex];
      bannerEl.classList.remove('opacity-0');
    }, 200);
  }
}

// ----------------------------------------------------
// 2. CELL SUB-TAB NAVIGATION & QUICK ACTIONS
// ----------------------------------------------------
function switchCellSubTab(tabName) {
  const tabs = ['chat', 'members', 'events', 'info'];
  tabs.forEach(t => {
    const btn = document.getElementById(`cell-tab-btn-${t}`);
    const panel = document.getElementById(`cell-subpanel-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = "px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 bg-blue-600 text-white shadow-xs cursor-pointer";
      } else {
        btn.className = "px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer";
      }
    }
    if (panel) {
      if (t === tabName) panel.classList.remove('hidden');
      else panel.classList.add('hidden');
    }
  });

  if (tabName === 'members' && window.currentUserProfile?.cellId) {
    loadCellMembers(window.currentUserProfile.cellId);
  }
}

function toggleCellQuickActionsMenu(forceState) {
  const menu = document.getElementById('cell-quick-actions-menu');
  if (!menu) return;
  if (typeof forceState === 'boolean') {
    if (forceState) menu.classList.remove('hidden');
    else menu.classList.add('hidden');
  } else {
    menu.classList.toggle('hidden');
  }
}

function copyCellInviteCode() {
  const profile = window.currentUserProfile;
  if (!profile || !profile.cellId || profile.cellId === 'none') return;
  const inviteText = `Join my Home.cell Fellowship Group! Cell ID: ${profile.cellId}\nDownload Home.cell app to stay connected in local fellowship!`;
  navigator.clipboard.writeText(inviteText)
    .then(() => window.showToast?.("Cell invite link copied to clipboard!"))
    .catch(() => window.showToast?.(`Invite Code: ${profile.cellId}`));
}

function toggleCellMute() {
  const isMuted = localStorage.getItem('cell_muted') === 'true';
  localStorage.setItem('cell_muted', (!isMuted).toString());
  window.showToast?.(!isMuted ? "Cell notifications muted." : "Cell notifications unmuted.");
}

// ----------------------------------------------------
// 3. CELL DIRECTORY & JOIN/LEAVE
// ----------------------------------------------------
function loadCellDirectory() {
  const container = document.getElementById('cells-directory');
  if (!container) return;

  window.db.collection('cells').onSnapshot(snap => {
    container.innerHTML = '';
    
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

      if (obSelect && (cell.status === 'active' || !cell.status)) {
        const opt = document.createElement('option');
        opt.value = cellId;
        opt.innerText = `🏡 ${cell.name} (${cell.city}) - Leader: ${cell.leaderName}`;
        obSelect.appendChild(opt);
      }

      const card = document.createElement('div');
      card.className = `p-6 bg-white dark:bg-zinc-900 border rounded-3xl space-y-4 shadow-sm flex flex-col justify-between ${
        cell.status === 'suspended' ? 'border-amber-500 opacity-60' : 'border-slate-200 dark:border-zinc-800'
      }`;

      const userJoinedThis = window.currentUserProfile?.cellId === cellId;

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
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${cell.description || 'Love God. Love People. Grow Together.'}</p>
          
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

  if (activeCellListener) activeCellListener();
  if (chatMessagesListener) chatMessagesListener();
  if (cellEventsListener) cellEventsListener();
  if (presenceListener) presenceListener();

  const noCellNotice = document.getElementById('no-cell-notice');
  const activeCellCard = document.getElementById('active-cell-card');
  const chatNoCellNotice = document.getElementById('chat-no-cell-notice');
  const chatActiveBox = document.getElementById('chat-active-box');

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
      updateUserPresence('offline', null);
      return;
    }

    // User is active in cell group
    activeCellListener = window.db.collection('cells').doc(cellId).onSnapshot(cellDoc => {
      if (!cellDoc.exists || cellDoc.data().status === 'suspended') {
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

      // Populate hero header and info fields
      const nameEl = document.getElementById('active-cell-name');
      const cityEl = document.getElementById('active-cell-city');
      const descEl = document.getElementById('active-cell-desc');
      const chatActiveCellName = document.getElementById('chat-active-cell-name');
      const chatActiveCellMotto = document.getElementById('chat-active-cell-motto');
      
      const infoName = document.getElementById('active-cell-name-info');
      const infoCity = document.getElementById('active-cell-city-info');
      const infoDesc = document.getElementById('active-cell-desc-info');

      if (nameEl) nameEl.innerText = cell.name;
      if (cityEl) cityEl.innerText = cell.city;
      if (descEl) descEl.innerText = cell.description || 'Love God. Love People. Grow Together.';
      if (chatActiveCellName) chatActiveCellName.innerText = cell.name;
      if (chatActiveCellMotto) chatActiveCellMotto.innerText = cell.description || 'Love God. Love People. Grow Together.';

      if (infoName) infoName.innerText = cell.name;
      if (infoCity) infoCity.innerText = cell.city;
      if (infoDesc) infoDesc.innerText = cell.description || 'Love God. Love People. Grow Together.';

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

      // Sync Chat, Events, Members, and Presence
      startCellChatMessagesSync(cellId);
      startCellEventsSync(cellId);
      loadCellMembers(cellId);
      startCellPresenceSync(cellId);
      updateUserPresence('online', null);

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

  const isConfirmed = confirm("Are you sure you want to leave your active fellowship cell group?");
  if (!isConfirmed) return;

  window.db.collection('users').doc(uid).update({ cellId: 'none' })
    .then(() => {
      window.showToast?.("You left the cell group successfully.");
    })
    .catch(err => window.handleFirestoreError(err, 'write', `users/${uid}`));
}

// ----------------------------------------------------
// 4. REALTIME MEMBER PRESENCE & TYPING STATE
// ----------------------------------------------------
function updateUserPresence(status, typingInCell) {
  const uid = window.auth.currentUser?.uid;
  if (!uid) return;

  const profile = window.currentUserProfile || {};
  const presenceData = {
    uid: uid,
    displayName: profile.displayName || window.auth.currentUser?.email || 'Member',
    photoURL: profile.photoURL || null,
    cellId: profile.cellId || 'none',
    status: status,
    typingInCell: typingInCell || null,
    lastSeen: window.firebase.firestore.FieldValue.serverTimestamp()
  };

  window.db.collection('presence').doc(uid).set(presenceData, { merge: true })
    .catch(err => console.warn("Presence update failed:", err));
}

function startCellPresenceSync(cellId) {
  const onlineCountEl = document.getElementById('chat-online-count');
  const avatarsContainer = document.getElementById('chat-online-avatars');
  const typingIndicator = document.getElementById('chat-typing-indicator');
  const typingUsersText = document.getElementById('chat-typing-users-text');

  if (presenceListener) presenceListener();

  presenceListener = window.db.collection('presence')
    .where('cellId', '==', cellId)
    .where('status', '==', 'online')
    .onSnapshot(snap => {
      const onlineMembers = [];
      const typingUsers = [];

      snap.forEach(doc => {
        const data = doc.data();
        onlineMembers.push(data);
        if (data.typingInCell === cellId && data.uid !== window.auth.currentUser?.uid) {
          typingUsers.push(data.displayName || 'A member');
        }
      });

      const count = Math.max(onlineMembers.length, 1);
      if (onlineCountEl) onlineCountEl.innerText = `${count} online`;

      if (avatarsContainer) {
        avatarsContainer.innerHTML = '';
        onlineMembers.slice(0, 4).forEach(m => {
          const initial = (m.displayName || 'M').charAt(0).toUpperCase();
          const av = document.createElement('div');
          av.className = "w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 text-slate-950 font-black text-[10px] flex items-center justify-center ring-2 ring-white/20 shadow-xs";
          av.innerText = initial;
          avatarsContainer.appendChild(av);
        });
      }

      if (typingIndicator && typingUsersText) {
        if (typingUsers.length > 0) {
          typingUsersText.innerText = `${typingUsers.join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`;
          typingIndicator.classList.remove('hidden');
        } else {
          typingIndicator.classList.add('hidden');
        }
      }
    }, err => console.warn("Cell presence sync error:", err));
}

function handleChatTyping() {
  const profile = window.currentUserProfile;
  if (!profile || !profile.cellId || profile.cellId === 'none') return;

  updateUserPresence('online', profile.cellId);

  if (chatTypingTimeout) clearTimeout(chatTypingTimeout);
  chatTypingTimeout = setTimeout(() => {
    updateUserPresence('online', null);
  }, 2500);
}

// ----------------------------------------------------
// 5. CHAT MESSAGES STREAM, REACTIONS & REPLIES
// ----------------------------------------------------
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

        // Sender Role Badge
        let roleBadge = '';
        if (msg.role === 'Leader') roleBadge = '<span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[9px] font-black uppercase">LEADER</span>';
        else if (msg.role === 'Co-Leader') roleBadge = '<span class="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[9px] font-black uppercase">CO-LEADER</span>';

        // Render Reactions
        let reactionsHtml = '';
        if (msg.reactions && Object.keys(msg.reactions).length > 0) {
          const emojiCounts = {};
          Object.values(msg.reactions).forEach(emoji => {
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
          });
          reactionsHtml = `
            <div class="flex flex-wrap gap-1 mt-1">
              ${Object.entries(emojiCounts).map(([emoji, count]) => `
                <span class="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-[11px] font-bold border border-slate-300/50 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center gap-1">
                  ${emoji} ${count}
                </span>
              `).join('')}
            </div>
          `;
        }

        // Render Quoted Reply
        let replyHtml = '';
        if (msg.replyTo) {
          replyHtml = `
            <div class="mb-1 p-2 rounded-xl bg-black/10 dark:bg-white/10 border-l-2 border-blue-400 text-[11px] italic">
              <span class="font-bold opacity-80 block">${msg.replyTo.senderName}</span>
              <p class="truncate opacity-90">${msg.replyTo.text}</p>
            </div>
          `;
        }

        wrapper.innerHTML = `
          <div class="flex items-center gap-1.5 px-1 mb-0.5">
            <span class="text-[10px] font-bold text-slate-400">${msg.senderName}</span>
            ${roleBadge}
            <span class="text-[9px] text-slate-400">${formattedTime}</span>
          </div>

          <div class="group relative px-4 py-2.5 rounded-2xl text-sm ${
            isSelf
              ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-none border border-slate-200/60 dark:border-zinc-700/60'
          }">
            ${replyHtml}
            <p class="leading-relaxed break-words">${msg.text}</p>
            ${reactionsHtml}

            <!-- Quick Hover Action Bar (Reply, React, Delete) -->
            <div class="absolute hidden group-hover:flex items-center gap-1 -top-3.5 ${isSelf ? 'right-2' : 'left-2'} bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-1 rounded-full shadow-lg z-20">
              <button onclick="window.reactToChatMessage('${cellId}', '${msgId}', '🙏')" class="px-1 hover:scale-125 transition-transform text-xs" title="React Amen">🙏</button>
              <button onclick="window.reactToChatMessage('${cellId}', '${msgId}', '❤️')" class="px-1 hover:scale-125 transition-transform text-xs" title="React Love">❤️</button>
              <button onclick="window.reactToChatMessage('${cellId}', '${msgId}', '🙌')" class="px-1 hover:scale-125 transition-transform text-xs" title="React Praise">🙌</button>
              <button onclick="window.setReplyTarget('${msgId}', '${msg.senderName.replace(/'/g, "\\'")}', '${msg.text.replace(/'/g, "\\'")}')" class="px-1.5 text-blue-500 hover:text-blue-700 text-xs font-bold" title="Reply">
                <i data-lucide="reply" class="w-3.5 h-3.5 inline"></i>
              </button>
              ${
                isSelf || window.currentUserRole === 'Super Admin'
                  ? `<button onclick="deleteChatMessage('${cellId}', '${msgId}')" class="px-1 text-rose-500 hover:text-rose-700 text-xs" title="Delete">
                       <i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i>
                     </button>`
                  : ''
              }
            </div>
          </div>
        `;

        messagesBox.appendChild(wrapper);
      });

      if (window.lucide) window.lucide.createIcons();
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }, err => console.warn("Lounge security restriction: Join cell to sync messages."));
}

function sendCellChatMessage(text) {
  const profile = window.currentUserProfile;
  if (!profile || !profile.cellId || profile.cellId === 'none') return;

  const msgData = {
    senderUid: window.auth.currentUser.uid,
    senderName: profile.displayName || window.auth.currentUser.email || 'Member',
    role: profile.role || 'Member',
    text: text,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  };

  if (currentReplyTarget) {
    msgData.replyTo = currentReplyTarget;
  }

  window.db.collection('cells').doc(profile.cellId).collection('messages').add(msgData)
    .then(() => {
      cancelReply();
      updateUserPresence('online', null);
      window.checkAndCompleteMissionsForEvent?.('chat_message_sent');
    })
    .catch(err => window.handleFirestoreError(err, 'create', `cells/${profile.cellId}/messages`));
}

function reactToChatMessage(cellId, msgId, emoji) {
  const uid = window.auth.currentUser?.uid;
  if (!uid) return;

  const msgRef = window.db.collection('cells').doc(cellId).collection('messages').doc(msgId);
  msgRef.get().then(doc => {
    if (!doc.exists) return;
    const reactions = doc.data().reactions || {};
    if (reactions[uid] === emoji) {
      delete reactions[uid];
    } else {
      reactions[uid] = emoji;
    }
    msgRef.update({ reactions }).catch(err => console.warn("Reaction update failed:", err));
  });
}

function setReplyTarget(msgId, senderName, text) {
  currentReplyTarget = { msgId, senderName, text };
  const replyBox = document.getElementById('cell-reply-preview');
  const targetSender = document.getElementById('reply-target-sender');
  const targetText = document.getElementById('reply-target-text');

  if (targetSender) targetSender.innerText = senderName;
  if (targetText) targetText.innerText = text;
  if (replyBox) replyBox.classList.remove('hidden');

  const chatInput = document.getElementById('cell-chat-input');
  if (chatInput) chatInput.focus();
}

function cancelReply() {
  currentReplyTarget = null;
  const replyBox = document.getElementById('cell-reply-preview');
  if (replyBox) replyBox.classList.add('hidden');
}

function insertQuickPraise(text) {
  const input = document.getElementById('cell-chat-input');
  if (!input) return;
  input.value = input.value ? `${input.value} ${text}` : text;
  input.focus();
}

function deleteChatMessage(cellId, msgId) {
  const isConfirmed = confirm("Are you sure you want to delete this chat message?");
  if (!isConfirmed) return;

  window.db.collection('cells').doc(cellId).collection('messages').doc(msgId).delete()
    .then(() => window.showToast?.("Message deleted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `cells/${cellId}/messages/${msgId}`));
}

// ----------------------------------------------------
// 6. MEMBERS TAB & SEARCH
// ----------------------------------------------------
function loadCellMembers(cellId, searchQuery = '') {
  const container = document.getElementById('cell-members-list');
  const countEl = document.getElementById('cell-tab-members-count');
  if (!container) return;

  if (membersListener) membersListener();

  membersListener = window.db.collection('users')
    .where('cellId', '==', cellId)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (countEl) countEl.innerText = snap.size.toString();

      if (snap.empty) {
        container.innerHTML = `<p class="col-span-full text-center py-6 text-slate-400 text-xs">No registered members in this cell yet.</p>`;
        return;
      }

      snap.forEach(doc => {
        const u = doc.data();
        const name = u.displayName || u.email || 'Member';
        
        if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) {
          return;
        }

        const isLeader = u.role === 'Leader' || u.role === 'Super Admin';
        const initial = name.charAt(0).toUpperCase();

        const card = document.createElement('div');
        card.className = "p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center gap-3";
        card.innerHTML = `
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-inner relative">
            ${initial}
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"></span>
          </div>
          <div class="truncate flex-1">
            <h5 class="font-bold text-xs text-slate-800 dark:text-zinc-100 truncate">${name}</h5>
            <span class="text-[9px] font-bold uppercase ${isLeader ? 'text-amber-500' : 'text-slate-400'}">${u.role || 'Member'}</span>
          </div>
        `;
        container.appendChild(card);
      });
    }, err => console.warn("Members fetch error:", err));
}

function filterCellMembers(val) {
  if (window.currentUserProfile?.cellId) {
    loadCellMembers(window.currentUserProfile.cellId, val);
  }
}

// ----------------------------------------------------
// 7. CELL EVENTS & APPOINT CO-LEADER
// ----------------------------------------------------
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
        container.innerHTML = `<p class="text-slate-400 italic text-xs py-4 text-center">No cell gathers scheduled yet.</p>`;
        return;
      }

      snap.forEach(doc => {
        const ev = doc.data();
        const evId = doc.id;

        const formattedDate = new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

        const item = document.createElement('div');
        item.className = "p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1 relative group";
        
        item.innerHTML = `
          <div class="font-bold text-slate-800 dark:text-zinc-200 text-xs">${ev.title}</div>
          <div class="text-[10px] text-blue-500 font-mono font-bold">${formattedDate}</div>
          <div class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${ev.description}</div>
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
      window.showToast?.("Cell gathering scheduled successfully!");
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

// ----------------------------------------------------
// EVENT LISTENERS & GLOBAL EXPORTS
// ----------------------------------------------------
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
window.switchCellSubTab = switchCellSubTab;
window.toggleCellQuickActionsMenu = toggleCellQuickActionsMenu;
window.copyCellInviteCode = copyCellInviteCode;
window.toggleCellMute = toggleCellMute;
window.rotateScriptureBanner = rotateScriptureBanner;
window.insertQuickPraise = insertQuickPraise;
window.handleChatTyping = handleChatTyping;
window.reactToChatMessage = reactToChatMessage;
window.setReplyTarget = setReplyTarget;
window.cancelReply = cancelReply;
window.filterCellMembers = filterCellMembers;
