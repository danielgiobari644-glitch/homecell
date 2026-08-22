// cells.js
// House Cell Groups, Directory, Group Chat Lounge, Events, Member Presence

let activeCellListener = null;
let chatMessagesListener = null;
let cellEventsListener = null;
let presenceListener = null;
let membersListener = null;

let currentReplyTarget = null;
let chatTypingTimeout = null;

function initCellsModule() {
  loadCellDirectory();
  syncActiveUserCellState();
}

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

function loadCellDirectory() {
  const container = document.getElementById('cells-directory');
  if (!container) return;

  window.db.collection('cells').onSnapshot(snap => {
    container.innerHTML = '';
    
    if (snap.empty) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-400">
          <i data-lucide="info" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p class="font-bold">No active cell groups in the directory.</p>
        </div>
      `;
      return;
    }

    snap.forEach(doc => {
      const cell = doc.data();
      const cellId = doc.id;
      const userJoinedThis = window.currentUserProfile?.cellId === cellId;

      const card = document.createElement('div');
      card.className = `p-6 bg-white dark:bg-zinc-900 border rounded-3xl space-y-4 shadow-xs flex flex-col justify-between ${
        cell.status === 'suspended' ? 'border-amber-500 opacity-60' : 'border-slate-200 dark:border-zinc-800'
      }`;

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex justify-between items-start gap-2">
            <div>
              <span class="text-xs font-bold text-blue-500 uppercase tracking-widest block">${cell.city || 'Home Cell'}</span>
              <h4 class="text-xl font-black font-display text-slate-900 dark:text-zinc-100">
                ${cell.name}
              </h4>
            </div>
            ${userJoinedThis ? '<span class="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">JOINED</span>' : ''}
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${cell.description || 'Love God. Love People. Grow Together.'}</p>
          <div class="text-xs text-slate-400 font-semibold pt-1">
            Leader: <span class="text-slate-700 dark:text-zinc-300 font-bold">${cell.leaderName}</span>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 flex gap-2">
          ${
            userJoinedThis
              ? `<button onclick="leaveActiveCell()" class="flex-1 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase cursor-pointer transition-all">Leave Cell</button>`
              : `<button onclick="joinCell('${cellId}')" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">Join Cell <i data-lucide="plus-circle" class="w-4 h-4"></i></button>`
          }
        </div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Cells directory error:", err));
}

function syncActiveUserCellState() {
  const uid = window.auth?.currentUser?.uid;
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
      return;
    }

    activeCellListener = window.db.collection('cells').doc(cellId).onSnapshot(cellDoc => {
      if (!cellDoc.exists) return;
      const cell = cellDoc.data();

      if (noCellNotice) noCellNotice.classList.add('hidden');
      if (activeCellCard) activeCellCard.classList.remove('hidden');
      if (chatNoCellNotice) chatNoCellNotice.classList.add('hidden');
      if (chatActiveBox) chatActiveBox.classList.remove('hidden');

      const nameEl = document.getElementById('active-cell-name');
      const cityEl = document.getElementById('active-cell-city');
      const descEl = document.getElementById('active-cell-desc');
      const chatActiveCellName = document.getElementById('chat-active-cell-name');
      const chatActiveCellMotto = document.getElementById('chat-active-cell-motto');

      if (nameEl) nameEl.innerText = cell.name;
      if (cityEl) cityEl.innerText = cell.city || 'Home Cell';
      if (descEl) descEl.innerText = cell.description || 'Love God. Love People. Grow Together.';
      if (chatActiveCellName) chatActiveCellName.innerText = cell.name;
      if (chatActiveCellMotto) chatActiveCellMotto.innerText = cell.description || 'Love God. Love People. Grow Together.';

      startCellChatMessagesSync(cellId);
      startCellEventsSync(cellId);
      loadCellMembers(cellId);
      startCellPresenceSync(cellId);
      updateUserPresence('online', null);

    }, err => console.warn("Cell fetch error:", err));
  });
}

function joinCell(cellId) {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) {
    window.showToast?.("Please sign in to join a cell group.", "warning");
    return;
  }

  window.db.collection('users').doc(uid).update({ cellId })
    .then(() => {
      window.showToast?.("Successfully joined cell group!", "success");
      switchTab('cells');
    })
    .catch(err => window.showToast?.("Could not join cell.", "error"));
}

function leaveActiveCell() {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;

  if (!confirm("Are you sure you want to leave your active cell group?")) return;

  window.db.collection('users').doc(uid).update({ cellId: 'none' })
    .then(() => {
      window.showToast?.("You left the cell group.");
    })
    .catch(err => window.showToast?.("Could not leave cell.", "error"));
}

function updateUserPresence(status, typingInCell) {
  const uid = window.auth?.currentUser?.uid;
  if (!uid) return;

  const profile = window.currentUserProfile || {};
  const presenceData = {
    uid: uid,
    displayName: profile.displayName || window.auth?.currentUser?.email || 'Member',
    photoURL: profile.photoURL || null,
    cellId: profile.cellId || 'none',
    status: status,
    typingInCell: typingInCell || null,
    lastSeen: window.firebase.firestore.FieldValue.serverTimestamp()
  };

  window.db.collection('presence').doc(uid).set(presenceData, { merge: true }).catch(() => {});
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
        if (data.typingInCell === cellId && data.uid !== window.auth?.currentUser?.uid) {
          typingUsers.push(data.displayName || 'A member');
        }
      });

      const count = Math.max(onlineMembers.length, 1);
      if (onlineCountEl) onlineCountEl.innerText = `${count} online`;

      if (avatarsContainer) {
        avatarsContainer.innerHTML = '';
        onlineMembers.slice(0, 4).forEach(m => {
          const av = document.createElement('div');
          av.className = "w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 text-slate-950 font-black text-[10px] flex items-center justify-center ring-2 ring-white/20 shadow-xs overflow-hidden";
          if (m.photoURL) {
            av.innerHTML = `<img src="${m.photoURL}" class="w-full h-full object-cover" />`;
          } else {
            av.innerText = (m.displayName || 'M').charAt(0).toUpperCase();
          }
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
    }, err => {});
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

      window.cellMessagesCache = window.cellMessagesCache || {};
      snap.forEach(doc => {
        const msg = doc.data();
        const msgId = doc.id;
        window.cellMessagesCache[msgId] = msg;
        const isSelf = msg.senderUid === window.auth?.currentUser?.uid;

        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`;

        const formattedTime = msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

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
            <span class="text-[9px] text-slate-400 font-mono">${formattedTime}</span>
          </div>

          <div class="group relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isSelf
              ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-none border border-slate-200/60 dark:border-zinc-700/60'
          }">
            ${replyHtml}
            <p class="break-words">${msg.text}</p>
            ${reactionsHtml}

            <div class="absolute hidden group-hover:flex items-center gap-1 -top-3.5 ${isSelf ? 'right-2' : 'left-2'} bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-1 rounded-full shadow-lg z-20">
              <button onclick="window.reactToChatMessage('${cellId}', '${msgId}', '🙏')" class="px-1 hover:scale-125 transition-transform text-xs" title="Amen">🙏</button>
              <button onclick="window.reactToChatMessage('${cellId}', '${msgId}', '❤️')" class="px-1 hover:scale-125 transition-transform text-xs" title="Love">❤️</button>
              <button onclick="window.reactToChatMessage('${cellId}', '${msgId}', '🙌')" class="px-1 hover:scale-125 transition-transform text-xs" title="Praise">🙌</button>
              <button onclick="window.setReplyTarget('${msgId}')" class="px-1 text-blue-500 hover:text-blue-700 text-xs font-bold" title="Reply">
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
    }, err => {});
}

function sendCellChatMessage(text) {
  const profile = window.currentUserProfile;
  if (!profile || !profile.cellId || profile.cellId === 'none') return;

  const msgData = {
    senderUid: window.auth?.currentUser?.uid,
    senderName: profile.displayName || window.auth?.currentUser?.email || 'Member',
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
    })
    .catch(err => console.warn("Send message error:", err));
}

function reactToChatMessage(cellId, msgId, emoji) {
  const uid = window.auth?.currentUser?.uid;
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
    msgRef.update({ reactions }).catch(() => {});
  });
}

function setReplyTarget(msgId, senderName, text) {
  let name = senderName;
  let body = text;
  if (!name && window.cellMessagesCache?.[msgId]) {
    name = window.cellMessagesCache[msgId].senderName;
    body = window.cellMessagesCache[msgId].text;
  }
  currentReplyTarget = { msgId, senderName: name || 'Believer', text: body || '' };
  const replyBox = document.getElementById('cell-reply-preview');
  const targetSender = document.getElementById('reply-target-sender');
  const targetText = document.getElementById('reply-target-text');

  if (targetSender) targetSender.innerText = currentReplyTarget.senderName;
  if (targetText) targetText.innerText = currentReplyTarget.text;
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
  if (!confirm("Are you sure you want to delete this message?")) return;
  window.db.collection('cells').doc(cellId).collection('messages').doc(msgId).delete().catch(() => {});
}

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
        
        if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return;

        const isLeader = u.role === 'Cell Leader' || u.role === 'Super Admin';
        const card = document.createElement('div');
        card.className = "p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center gap-3";
        card.innerHTML = `
          <div class="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 overflow-hidden">
            ${u.photoURL ? `<img src="${u.photoURL}" class="w-full h-full object-cover" />` : name.charAt(0).toUpperCase()}
          </div>
          <div class="truncate flex-1">
            <h5 class="font-bold text-xs text-slate-800 dark:text-zinc-100 truncate">${name}</h5>
            <span class="text-[9px] font-bold uppercase ${isLeader ? 'text-amber-500' : 'text-slate-400'}">${u.role || 'Member'}</span>
          </div>
        `;
        container.appendChild(card);
      });
    }, err => {});
}

function filterCellMembers(val) {
  if (window.currentUserProfile?.cellId) {
    loadCellMembers(window.currentUserProfile.cellId, val);
  }
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
        container.innerHTML = `<p class="text-slate-400 italic text-xs py-4 text-center">No cell gatherings scheduled yet.</p>`;
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
        `;
        container.appendChild(item);
      });
    }, err => {});
}

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
});

window.initCellsModule = initCellsModule;
window.joinCell = joinCell;
window.leaveActiveCell = leaveActiveCell;
window.switchCellSubTab = switchCellSubTab;
window.insertQuickPraise = insertQuickPraise;
window.handleChatTyping = handleChatTyping;
window.reactToChatMessage = reactToChatMessage;
window.setReplyTarget = setReplyTarget;
window.cancelReply = cancelReply;
window.filterCellMembers = filterCellMembers;
window.deleteChatMessage = deleteChatMessage;
