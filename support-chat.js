// support-chat.js
// Handles direct support and spiritual guidance chat with Super Admin

let activeSupportChatListener = null;
let allSupportThreadsListener = null;
let currentChatMode = 'group'; // 'group' or 'support'
let adminSelectedUserUid = null;
let adminSelectedUserEmail = null;
let adminSelectedUserName = null;

function initSupportChatModule() {
  setupChatSegmentToggle();
  setupSupportChatForm();
  
  // Keep check on auth state changes to load support chat correctly
  window.auth.onAuthStateChanged(user => {
    if (user) {
      if (currentChatMode === 'support') {
        startSupportChatSync();
      }
    } else {
      stopSupportChatSync();
    }
  });
}

function setupChatSegmentToggle() {
  window.switchChatMode = function(mode) {
    currentChatMode = mode;
    const groupBtn = document.getElementById('chat-tab-group-btn');
    const supportBtn = document.getElementById('chat-tab-support-btn');
    const groupWorkspace = document.getElementById('chat-group-workspace');
    const supportWorkspace = document.getElementById('chat-support-workspace');

    if (!groupBtn || !supportBtn || !groupWorkspace || !supportWorkspace) return;

    if (mode === 'group') {
      // Show group, hide support
      groupWorkspace.classList.remove('hidden');
      supportWorkspace.classList.add('hidden');

      groupBtn.className = "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950";
      supportBtn.className = "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200";
    } else {
      // Show support, hide group
      groupWorkspace.classList.add('hidden');
      supportWorkspace.classList.remove('hidden');

      groupBtn.className = "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200";
      supportBtn.className = "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950";

      // Start sync
      startSupportChatSync();
    }
  };

  window.openSupportChat = function() {
    window.switchTab('chat');
    window.switchChatMode('support');
  };
}

function startSupportChatSync() {
  const user = window.auth.currentUser;
  if (!user) return;

  const isAdmin = window.currentUserRole === 'Super Admin';
  const listPane = document.getElementById('admin-support-list-pane');
  const chatPane = document.getElementById('chat-support-box-pane');

  if (isAdmin) {
    if (listPane) listPane.classList.remove('hidden');
    if (chatPane) {
      chatPane.className = "col-span-12 md:col-span-8 flex flex-col justify-between h-full overflow-hidden";
    }
    // Start listening to all conversations to group them
    syncAllSupportThreads();
  } else {
    if (listPane) listPane.classList.add('hidden');
    if (chatPane) {
      chatPane.className = "col-span-12 flex flex-col justify-between h-full overflow-hidden";
    }
    // Just sync messages for this specific user
    syncUserSupportMessages(user.uid);
  }
}

function stopSupportChatSync() {
  if (activeSupportChatListener) {
    activeSupportChatListener();
    activeSupportChatListener = null;
  }
  if (allSupportThreadsListener) {
    allSupportThreadsListener();
    allSupportThreadsListener = null;
  }
}

function syncAllSupportThreads() {
  if (allSupportThreadsListener) allSupportThreadsListener();

  const listContainer = document.getElementById('admin-support-conversations-list');
  if (!listContainer) return;

  // Listen to all support messages ordered by createdAt desc to group them
  allSupportThreadsListener = window.db.collection('support_chats')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      listContainer.innerHTML = '';
      if (snap.empty) {
        listContainer.innerHTML = `<div class="text-center py-8 text-slate-400 text-[10px]">No active threads yet.</div>`;
        return;
      }

      const threads = {};
      snap.forEach(doc => {
        const data = doc.data();
        if (!data.userUid) return;
        if (!threads[data.userUid]) {
          threads[data.userUid] = {
            userUid: data.userUid,
            userEmail: data.userEmail || 'Unknown Email',
            userName: data.userName || 'Anonymous user',
            latestText: data.text || '',
            latestTime: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date()
          };
        }
      });

      const threadList = Object.values(threads);
      if (threadList.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-8 text-slate-400 text-[10px]">No active threads yet.</div>`;
        return;
      }

      // If no active thread is selected yet, select the first one automatically
      if (!adminSelectedUserUid && threadList.length > 0) {
        selectSupportThread(threadList[0].userUid, threadList[0].userEmail, threadList[0].userName);
      }

      threadList.forEach(t => {
        const isSelected = t.userUid === adminSelectedUserUid;
        const btn = document.createElement('button');
        btn.onclick = () => selectSupportThread(t.userUid, t.userEmail, t.userName);
        btn.className = `w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex flex-col gap-1 ${
          isSelected 
            ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50' 
            : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 border border-transparent'
        }`;

        const timeStr = t.latestTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        btn.innerHTML = `
          <div class="flex justify-between items-center w-full">
            <span class="font-bold text-xs text-slate-800 dark:text-zinc-100 font-display truncate max-w-[70%]">${t.userName}</span>
            <span class="text-[9px] text-slate-400 font-mono">${timeStr}</span>
          </div>
          <span class="text-[9px] text-slate-400 truncate w-full block">${t.userEmail}</span>
          <span class="text-[10px] text-slate-500 dark:text-zinc-400 truncate w-full block mt-0.5">${t.latestText}</span>
        `;

        listContainer.appendChild(btn);
      });
    }, err => console.warn("Admin threads listener subscription issue:", err));
}

function selectSupportThread(uid, email, name) {
  adminSelectedUserUid = uid;
  adminSelectedUserEmail = email;
  adminSelectedUserName = name;

  const activeTitle = document.getElementById('support-active-chat-title');
  if (activeTitle) {
    activeTitle.innerText = `Chatting with ${name}`;
  }

  // Refresh thread list highlighting
  const listContainer = document.getElementById('admin-support-conversations-list');
  if (listContainer) {
    syncAllSupportThreads();
  }

  // Sync messages for the selected user
  syncUserSupportMessages(uid);
}

function syncUserSupportMessages(userUid) {
  if (activeSupportChatListener) activeSupportChatListener();

  const messagesBox = document.getElementById('support-chat-messages');
  if (!messagesBox) return;

  activeSupportChatListener = window.db.collection('support_chats')
    .where('userUid', '==', userUid)
    .orderBy('createdAt', 'asc')
    .onSnapshot(snap => {
      messagesBox.innerHTML = '';
      if (snap.empty) {
        messagesBox.innerHTML = `
          <div class="text-center py-12 text-slate-400 h-full flex flex-col items-center justify-center">
            <i data-lucide="message-square" class="w-8 h-8 opacity-40 mb-2"></i>
            <p class="text-xs font-bold">No support messages yet.</p>
            <p class="text-[10px] text-slate-400 mt-1 max-w-xs text-center">Ask any questions - app-wise, spiritual, or otherwise! The Super Admin is ready to assist.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      snap.forEach(doc => {
        const msg = doc.data();
        const isSelf = msg.senderUid === window.auth.currentUser?.uid;

        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`;

        const formattedTime = msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        wrapper.innerHTML = `
          <span class="text-[10px] font-bold text-slate-400 px-1 mb-0.5">${msg.senderName} • ${formattedTime}</span>
          <div class="group relative px-4 py-2.5 rounded-2xl text-sm ${
            isSelf
              ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-none shadow-sm'
          }">
            <p>${msg.text}</p>
          </div>
        `;

        messagesBox.appendChild(wrapper);
      });

      // Scroll to bottom
      messagesBox.scrollTop = messagesBox.scrollHeight;

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Support messages listener security constraint:", err));
}

function setupSupportChatForm() {
  const form = document.getElementById('support-chat-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('support-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const user = window.auth.currentUser;
    if (!user) {
      window.showToast?.("You must be logged in to send support messages.", "error");
      return;
    }

    const isAdmin = window.currentUserRole === 'Super Admin';
    const profile = window.currentUserProfile || {};

    let targetUserUid = user.uid;
    let targetUserEmail = user.email;
    let targetUserName = profile.displayName || user.email;

    if (isAdmin) {
      if (!adminSelectedUserUid) {
        window.showToast?.("Please select a support conversation from the list first.", "error");
        return;
      }
      targetUserUid = adminSelectedUserUid;
      targetUserEmail = adminSelectedUserEmail;
      targetUserName = adminSelectedUserName;
    }

    const messageData = {
      userUid: targetUserUid,
      userEmail: targetUserEmail,
      userName: targetUserName,
      senderUid: user.uid,
      senderName: isAdmin ? `Super Admin (${profile.displayName || 'Daniel'})` : (profile.displayName || user.email),
      text: text,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    window.db.collection('support_chats').add(messageData)
      .then(() => {
        input.value = '';

        // Trigger push notifications!
        if (window.sendPushNotification) {
          if (isAdmin) {
            // Push notification to the targeted user
            window.sendPushNotification(
              `🛡️ Support Reply from Super Admin`,
              text,
              '/?tab=chat&mode=support',
              null, // targetRole
              targetUserUid, // targetUid
              user.uid // excludeUid
            );
          } else {
            // Push notification to the Super Admin role
            window.sendPushNotification(
              `🛡️ New Support Question: ${profile.displayName || user.email}`,
              text,
              '/?tab=chat&mode=support',
              'Super Admin', // targetRole
              null, // targetUid
              user.uid // excludeUid
            );
          }
        }
      })
      .catch(err => window.handleFirestoreError(err, 'create', 'support_chats'));
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initSupportChatModule();
});
