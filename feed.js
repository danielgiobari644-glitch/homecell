// feed.js
// Home.cell - Global Fellowship Feed & Global Cross-Fellowship Chat Lounge with Fellowship Identity Markers

let feedListener = null;
let globalChatListener = null;
window.currentFeedFilter = 'all';

function initFeedEngine() {
  const user = window.auth?.currentUser;
  const avatarEl = document.getElementById('feed-user-avatar');
  if (avatarEl && user) {
    const photo = window.currentUserProfile?.photoURL || user.photoURL;
    if (photo) {
      avatarEl.innerHTML = `<img src="${photo}" class="w-full h-full rounded-full object-cover" />`;
    } else {
      avatarEl.innerText = (window.currentUserProfile?.displayName || user.displayName || user.email || '?').charAt(0).toUpperCase();
    }
  }

  // Set current active fellowship label in composer
  const fellowshipBadge = document.getElementById('feed-composer-fellowship-badge');
  if (fellowshipBadge) {
    const fName = window.activeFellowship?.name || 'Local Fellowship';
    fellowshipBadge.innerText = `Posting as member of ${fName}`;
  }

  loadGlobalFeedStream();
  syncDailyDevotionalSnippet();
}

// -------------------------------------------------------------
// GLOBAL FEED
// -------------------------------------------------------------

let activeFeedPosts = [];

function loadGlobalFeedStream() {
  const container = document.getElementById('community-posts-stream');
  if (!container) return;

  if (feedListener) feedListener();

  feedListener = window.db.collection('global_posts')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(snap => {
      activeFeedPosts = [];
      snap.forEach(doc => {
        activeFeedPosts.push({ id: doc.id, ...doc.data() });
      });
      renderGlobalFeed();
    }, err => {
      console.warn("Global feed error, checking fallback:", err);
      // Fallback for transition
      window.db.collection('community_feed')
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot(fallbackSnap => {
          activeFeedPosts = [];
          fallbackSnap.forEach(d => {
            const data = d.data();
            activeFeedPosts.push({
              id: d.id,
              authorId: data.authorUid || data.authorId,
              authorName: data.authorName || 'Believer',
              authorPhoto: data.authorPhotoURL || data.authorPhoto,
              fellowshipName: data.fellowshipName || 'Home Fellowship',
              content: data.text || data.content,
              mediaUrl: data.imageUrl || data.videoUrl || data.mediaUrl,
              mediaType: data.videoUrl ? 'video' : 'image',
              type: data.type || 'post',
              likesCount: data.likesCount || 0,
              createdAt: data.createdAt
            });
          });
          renderGlobalFeed();
        }, () => {});
    });
}

function renderGlobalFeed() {
  const container = document.getElementById('community-posts-stream');
  if (!container) return;

  container.innerHTML = '';

  const filtered = activeFeedPosts.filter(p => {
    if (!window.currentFeedFilter || window.currentFeedFilter === 'all') return true;
    return p.type === window.currentFeedFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel rounded-3xl p-12 text-center space-y-3 text-slate-400">
        <i data-lucide="book-open" class="w-12 h-12 mx-auto opacity-40 mb-2"></i>
        <h4 class="font-bold text-sm text-slate-700 dark:text-zinc-300">The Global Feed is Peaceful</h4>
        <p class="text-xs">Be the first to share an encouragement, scripture, or testimony with all Home.cell fellowships!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const currentUser = window.auth?.currentUser;
  const isSuperAdmin = window.checkIsSuperAdmin();

  filtered.forEach(post => {
    const isAuthor = currentUser && post.authorId === currentUser.uid;
    const canDelete = isAuthor || isSuperAdmin;
    const timeStr = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

    const card = document.createElement('div');
    card.className = "glass-panel rounded-3xl p-6 space-y-4 border border-slate-200 dark:border-zinc-800 shadow-xs";

    card.innerHTML = `
      <!-- Post Header with Author & Prominent Fellowship Identity -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-xs">
            ${post.authorPhoto ? `<img src="${post.authorPhoto}" class="w-full h-full object-cover" />` : (post.authorName || 'B').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">${post.authorName}</h4>
              ${post.type === 'testimony' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Testimony 🙏</span>' : ''}
              ${post.type === 'announcement' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Announcement 📢</span>' : ''}
            </div>
            <!-- Fellowship Identity Marker -->
            <div class="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <i data-lucide="home" class="w-3 h-3"></i>
              <span>${post.fellowshipName || 'Home.cell Fellowship'}</span>
            </div>
            <div class="text-[10px] text-slate-400 font-mono mt-0.5">${timeStr}</div>
          </div>
        </div>

        ${canDelete ? `
          <button onclick="window.deleteGlobalPost('${post.id}')" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer" title="Delete Post">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>

      <!-- Post Body -->
      <div class="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
        ${post.content || ''}
      </div>

      <!-- Media Attachment (Image or Video) -->
      ${post.mediaUrl ? `
        <div class="rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-black/5 dark:bg-black/30">
          ${post.mediaType === 'video'
            ? `<video src="${post.mediaUrl}" controls class="w-full max-h-[450px] object-contain bg-black"></video>`
            : `<img src="${post.mediaUrl}" class="w-full max-h-[480px] object-cover" loading="lazy" />`
          }
        </div>
      ` : ''}

      <!-- Footer Interactions -->
      <div class="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500">
        <button onclick="window.likeGlobalPost('${post.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 font-bold cursor-pointer">
          <i data-lucide="heart" class="w-4 h-4 text-rose-500"></i>
          <span>${post.likesCount || 0} Amen</span>
        </button>
        <span class="text-[10px] font-mono text-slate-400">Home.cell Worldwide</span>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

window.publishGlobalPost = async function(e) {
  if (e) e.preventDefault();
  const user = window.auth?.currentUser;
  if (!user) return;

  const textInput = document.getElementById('feed-composer-text');
  const typeSelect = document.getElementById('feed-post-type');
  const fileInput = document.getElementById('feed-composer-file');
  const btn = document.getElementById('feed-publish-btn');

  const text = textInput ? textInput.value.trim() : '';
  const postType = typeSelect ? typeSelect.value : 'post';
  const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

  if (!text && !hasFile) {
    window.showToast?.("Please enter a message or select an image/video to share.", "error");
    return;
  }

  const originalText = btn ? btn.innerHTML : 'Publish';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-1">⌛</span> Uploading...`;
  }

  try {
    let mediaUrl = null;
    let mediaType = null;

    if (hasFile) {
      const file = fileInput.files[0];
      const uploadRes = await window.uploadToCloudinary(file, 'homecell/feed');
      mediaUrl = uploadRes.url;
      mediaType = uploadRes.resourceType;
    }

    const currentFellowship = window.activeFellowship || (window.allFellowships || []).find(f => f.id === window.activeFellowshipId);
    const fId = currentFellowship?.id || 'general';
    const fName = currentFellowship?.name || 'Home.cell Fellowship';

    await window.db.collection('global_posts').add({
      authorId: user.uid,
      authorName: window.currentUserProfile?.displayName || user.displayName || user.email.split('@')[0],
      authorPhoto: window.currentUserProfile?.photoURL || user.photoURL || '',
      fellowshipId: fId,
      fellowshipName: fName,
      content: text,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      type: postType,
      likesCount: 0,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    if (textInput) textInput.value = '';
    if (fileInput) fileInput.value = '';
    document.getElementById('feed-media-preview-container')?.classList.add('hidden');

    window.soundEngine?.playSuccess?.();
    window.showToast?.("Encouragement shared to Global Feed!", "success");
  } catch (err) {
    console.error("Publish post error:", err);
    window.showToast?.(err.message || "Failed to publish post.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
};

window.deleteGlobalPost = async function(postId) {
  if (!confirm("Are you sure you want to remove this post?")) return;
  try {
    await window.db.collection('global_posts').doc(postId).delete();
    window.showToast?.("Post removed.", "info");
  } catch (err) {
    console.error("Delete post error:", err);
    window.showToast?.("Failed to delete post: " + err.message, "error");
  }
};

window.likeGlobalPost = async function(postId) {
  try {
    await window.db.collection('global_posts').doc(postId).update({
      likesCount: window.firebase.firestore.FieldValue.increment(1)
    });
    window.soundEngine?.playClick?.();
  } catch (e) {
    console.warn("Like error:", e);
  }
};

// -------------------------------------------------------------
// GLOBAL HOME.CELL CHAT LOUNGE
// -------------------------------------------------------------

window.loadGlobalChatMessages = function() {
  const container = document.getElementById('global-chat-messages-container');
  if (!container) return;

  if (globalChatListener) globalChatListener();

  globalChatListener = window.db.collection('global_messages')
    .orderBy('createdAt', 'asc')
    .limit(100)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `
          <div class="py-16 text-center space-y-2 text-slate-400">
            <i data-lucide="message-circle" class="w-10 h-10 mx-auto opacity-40 mb-2"></i>
            <p class="font-bold text-xs">The Global Fellowship Lounge is open.</p>
            <p class="text-[11px]">Connect with brothers and sisters across all fellowships!</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const currentUser = window.auth?.currentUser;

      snap.forEach(doc => {
        const msg = doc.data();
        const isMe = currentUser && msg.authorId === currentUser.uid;
        const timeStr = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';

        const row = document.createElement('div');
        row.className = `flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`;

        row.innerHTML = `
          <div class="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-800 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            ${msg.authorPhoto ? `<img src="${msg.authorPhoto}" class="w-full h-full object-cover" />` : (msg.authorName || 'B').charAt(0).toUpperCase()}
          </div>
          <div class="space-y-1 max-w-[85%]">
            <div class="flex items-center gap-2 ${isMe ? 'justify-end' : ''}">
              <span class="text-[11px] font-black text-slate-700 dark:text-zinc-300">${isMe ? 'You' : msg.authorName}</span>
              <!-- Fellowship Marker -->
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">${msg.fellowshipName || 'Home.cell'}</span>
              <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
            </div>
            <div class="p-3.5 rounded-2xl text-xs leading-relaxed ${
              isMe
                ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 rounded-tl-xs shadow-xs'
            }">
              ${msg.text ? `<p class="whitespace-pre-wrap break-words">${msg.text}</p>` : ''}
              ${msg.mediaUrl ? `
                <div class="mt-2 rounded-xl overflow-hidden max-w-sm">
                  ${msg.mediaType === 'video'
                    ? `<video src="${msg.mediaUrl}" controls class="w-full max-h-64 rounded-xl object-contain bg-black"></video>`
                    : `<img src="${msg.mediaUrl}" class="w-full max-h-64 object-cover rounded-xl" onclick="window.open('${msg.mediaUrl}', '_blank')" />`
                  }
                </div>
              ` : ''}
            </div>
          </div>
        `;

        container.appendChild(row);
      });

      if (window.lucide) window.lucide.createIcons();
      container.scrollTop = container.scrollHeight;
    }, err => console.warn("Global chat error:", err));
};

window.sendGlobalChatMessage = async function(e) {
  if (e) e.preventDefault();
  const user = window.auth?.currentUser;
  if (!user) return;

  const input = document.getElementById('global-chat-input');
  const fileInput = document.getElementById('global-chat-file-input');
  const text = input ? input.value.trim() : '';

  if (!text && (!fileInput || !fileInput.files || fileInput.files.length === 0)) return;

  let mediaUrl = null;
  let mediaType = null;

  try {
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      window.showToast?.("Uploading media...", "info");
      const uploadRes = await window.uploadToCloudinary(file, 'homecell/feed');
      mediaUrl = uploadRes.url;
      mediaType = uploadRes.resourceType;
    }

    const currentFellowship = window.activeFellowship || (window.allFellowships || []).find(f => f.id === window.activeFellowshipId);

    await window.db.collection('global_messages').add({
      authorId: user.uid,
      authorName: window.currentUserProfile?.displayName || user.displayName || 'Believer',
      authorPhoto: window.currentUserProfile?.photoURL || user.photoURL || '',
      fellowshipId: currentFellowship?.id || 'general',
      fellowshipName: currentFellowship?.name || 'Home Fellowship',
      text: text,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    if (input) input.value = '';
    if (fileInput) fileInput.value = '';
    document.getElementById('global-chat-attachment-preview')?.classList.add('hidden');
    window.soundEngine?.playMessage?.();
  } catch (err) {
    console.error("Send global chat error:", err);
    window.showToast?.("Failed to send message: " + err.message, "error");
  }
};

function syncDailyDevotionalSnippet() {
  const container = document.getElementById('feed-devotional-card');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];
  window.db.collection('daily_devotionals').doc(todayStr).get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      container.innerHTML = `
        <div class="p-5 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white space-y-2 border border-blue-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Daily Bread</span>
          <h4 class="font-display font-black text-lg text-white">${d.title || 'Walking in His Grace'}</h4>
          <p class="text-xs text-slate-300 italic">"${d.scripture || 'The Lord is my shepherd; I shall not want.'}"</p>
          <button onclick="window.switchTab('fellowship'); window.switchFellowshipSubTab('resources');" class="pt-1 text-xs font-black text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Read Reflection <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }).catch(() => {});
}

window.initFeedEngine = initFeedEngine;
