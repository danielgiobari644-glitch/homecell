// feed.js
// Home.cell - Global Fellowship Feed & Global Cross-Fellowship Chat Lounge with Fellowship Identity Markers

let feedListener = null;
let globalChatListener = null;
window.currentFeedFilter = 'all';
const activeCommentsListeners = {}; // { postId: unsubscribeFn }

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

window.toggleFeedComposerDropdown = function() {
  const body = document.getElementById('feed-composer-dropdown-body');
  const chevron = document.getElementById('feed-composer-chevron');
  if (!body) return;

  const isHidden = body.classList.contains('hidden');
  if (isHidden) {
    body.classList.remove('hidden');
    chevron?.classList.add('rotate-180');
    document.getElementById('feed-composer-text')?.focus();
  } else {
    body.classList.add('hidden');
    chevron?.classList.remove('rotate-180');
  }
};

// -------------------------------------------------------------
// GLOBAL FEED
// -------------------------------------------------------------

let activeFeedPosts = [];

const REACTION_CONFIGS = [
  { type: 'amen', label: 'Amen', icon: '🙏' },
  { type: 'love', label: 'Love', icon: '❤️' },
  { type: 'fire', label: 'Fire', icon: '🔥' },
  { type: 'praise', label: 'Praise', icon: '🙌' },
  { type: 'praying', label: 'Praying', icon: '✝️' },
  { type: 'insight', label: 'Insight', icon: '💡' }
];

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

    // Reactions calculations
    const reactions = post.reactions || {};
    const userReactions = post.userReactions || {};
    const myReaction = currentUser ? userReactions[currentUser.uid] : null;
    let totalReactionsCount = post.likesCount || 0;
    Object.values(reactions).forEach(count => {
      if (typeof count === 'number') totalReactionsCount += count;
    });

    const optimizedMediaUrl = window.getOptimizedMediaUrl ? window.getOptimizedMediaUrl(post.mediaUrl, post.mediaType, 850) : post.mediaUrl;

    const card = document.createElement('div');
    card.className = "glass-panel rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-zinc-800 shadow-xs";
    card.id = `global-post-card-${post.id}`;

    card.innerHTML = `
      <!-- Post Header with Author & Moderately Noticeable Fellowship Identity Marker -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-xs">
            ${post.authorPhoto ? `<img src="${post.authorPhoto}" class="w-full h-full object-cover" loading="lazy" />` : (post.authorName || 'B').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">${post.authorName}</h4>
              ${post.type === 'testimony' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Testimony 🙏</span>' : ''}
              ${post.type === 'announcement' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Announcement 📢</span>' : ''}
              
              <!-- Moderately Noticeable Fellowship Identity Badge -->
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold border border-slate-200/60 dark:border-zinc-700/60">
                <i data-lucide="home" class="w-3 h-3 text-blue-500"></i>
                <span class="truncate max-w-[160px]">${post.fellowshipName || 'Home Fellowship'}</span>
              </span>
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

      <!-- High-Performance Optimized Media Attachment (Image or Video) -->
      ${post.mediaUrl ? `
        <div class="rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-black/5 dark:bg-black/30">
          ${post.mediaType === 'video'
            ? `<video src="${optimizedMediaUrl}" preload="metadata" playsinline controls class="w-full max-h-[450px] object-contain bg-black rounded-xl"></video>`
            : `<img src="${optimizedMediaUrl}" class="w-full max-h-[480px] object-cover rounded-xl" loading="lazy" decoding="async" />`
          }
        </div>
      ` : ''}

      <!-- Multi-Reactions Bar & Comments Trigger -->
      <div class="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
          <!-- Quick Reaction Buttons -->
          <div class="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            ${REACTION_CONFIGS.map(r => {
              const count = reactions[r.type] || 0;
              const isSelected = myReaction === r.type;
              return `
                <button 
                  onclick="window.reactToGlobalPost('${post.id}', '${r.type}')" 
                  class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 scale-105 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-transparent'
                  }"
                  title="${r.label}"
                >
                  <span class="text-sm">${r.icon}</span>
                  ${count > 0 ? `<span class="text-[11px] font-mono">${count}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Comments Drawer Toggle Button -->
          <button 
            onclick="window.togglePostComments('${post.id}')" 
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 font-bold cursor-pointer ml-auto"
          >
            <i data-lucide="message-square" class="w-4 h-4 text-blue-500"></i>
            <span id="post-comments-count-badge-${post.id}">${post.commentsCount || 0} Comments</span>
          </button>
        </div>

        <!-- Collapsible Comments Section -->
        <div id="post-comments-drawer-${post.id}" class="hidden pt-3 border-t border-slate-100 dark:border-zinc-800/60 space-y-3">
          <!-- Comments List Container -->
          <div id="post-comments-list-${post.id}" class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            <div class="py-4 text-center text-[11px] text-slate-400">Loading comments...</div>
          </div>

          <!-- Add Comment Input Box -->
          <form onsubmit="window.submitPostComment('${post.id}', event)" class="flex items-center gap-2 pt-1">
            <input 
              type="text" 
              id="post-comment-input-${post.id}" 
              placeholder="Write a comment or prayer response..." 
              required
              class="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-zinc-100"
            />
            <button 
              type="submit" 
              id="post-comment-btn-${post.id}"
              class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

window.reactToGlobalPost = async function(postId, reactionType) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to react to posts.", "warning");
    return;
  }

  const post = activeFeedPosts.find(p => p.id === postId);
  if (!post) return;

  const currentReactions = post.reactions || {};
  const currentUserReactions = post.userReactions || {};
  const currentMyReaction = currentUserReactions[user.uid];

  const newReactions = { ...currentReactions };
  const newUserReactions = { ...currentUserReactions };

  if (currentMyReaction === reactionType) {
    // Toggle off
    delete newUserReactions[user.uid];
    newReactions[reactionType] = Math.max(0, (newReactions[reactionType] || 1) - 1);
  } else {
    // If was reacting to something else, remove prior
    if (currentMyReaction && newReactions[currentMyReaction]) {
      newReactions[currentMyReaction] = Math.max(0, newReactions[currentMyReaction] - 1);
    }
    newUserReactions[user.uid] = reactionType;
    newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
  }

  // Optimistic UI update
  post.reactions = newReactions;
  post.userReactions = newUserReactions;
  renderGlobalFeed();
  window.soundEngine?.playClick?.();

  try {
    await window.db.collection('global_posts').doc(postId).update({
      reactions: newReactions,
      userReactions: newUserReactions,
      likesCount: Object.values(newReactions).reduce((a, b) => a + b, 0)
    });
  } catch (err) {
    console.warn("React error:", err);
  }
};

window.togglePostComments = function(postId) {
  const drawer = document.getElementById(`post-comments-drawer-${postId}`);
  if (!drawer) return;

  const isHidden = drawer.classList.contains('hidden');
  if (isHidden) {
    drawer.classList.remove('hidden');
    loadPostComments(postId);
    document.getElementById(`post-comment-input-${postId}`)?.focus();
  } else {
    drawer.classList.add('hidden');
    if (activeCommentsListeners[postId]) {
      activeCommentsListeners[postId]();
      delete activeCommentsListeners[postId];
    }
  }
  if (window.lucide) window.lucide.createIcons();
};

function loadPostComments(postId) {
  const listEl = document.getElementById(`post-comments-list-${postId}`);
  if (!listEl) return;

  if (activeCommentsListeners[postId]) {
    activeCommentsListeners[postId]();
  }

  activeCommentsListeners[postId] = window.db.collection('global_posts')
    .doc(postId)
    .collection('comments')
    .orderBy('createdAt', 'asc')
    .limit(50)
    .onSnapshot(snap => {
      listEl.innerHTML = '';
      if (snap.empty) {
        listEl.innerHTML = `
          <div class="py-3 text-center text-[11px] text-slate-400">
            No comments yet. Share an uplifting thought or prayer!
          </div>
        `;
        return;
      }

      snap.forEach(doc => {
        const c = doc.data();
        const timeStr = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
        const commentDiv = document.createElement('div');
        commentDiv.className = "flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 text-xs";
        commentDiv.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden mt-0.5">
            ${c.authorPhoto ? `<img src="${c.authorPhoto}" class="w-full h-full object-cover" />` : (c.authorName || 'B').charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="font-black text-[11px] text-slate-800 dark:text-zinc-200">${c.authorName || 'Believer'}</span>
              <span class="text-[9px] font-mono text-slate-400">${timeStr}</span>
            </div>
            <p class="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed mt-0.5 whitespace-pre-wrap">${c.text || ''}</p>
          </div>
        `;
        listEl.appendChild(commentDiv);
      });
      listEl.scrollTop = listEl.scrollHeight;
    }, err => console.warn("Comments error:", err));
}

window.submitPostComment = async function(postId, e) {
  if (e) e.preventDefault();
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to comment.", "warning");
    return;
  }

  const input = document.getElementById(`post-comment-input-${postId}`);
  const btn = document.getElementById(`post-comment-btn-${postId}`);
  const text = input ? input.value.trim() : '';
  if (!text) return;

  if (btn) btn.disabled = true;

  try {
    const authorName = window.currentUserProfile?.displayName || user.displayName || user.email.split('@')[0];
    const authorPhoto = window.currentUserProfile?.photoURL || user.photoURL || '';

    await window.db.collection('global_posts').doc(postId).collection('comments').add({
      authorId: user.uid,
      authorName: authorName,
      authorPhoto: authorPhoto,
      text: text,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    await window.db.collection('global_posts').doc(postId).update({
      commentsCount: window.firebase.firestore.FieldValue.increment(1)
    });

    if (input) input.value = '';
    window.soundEngine?.playSuccess?.();
    window.showToast?.("Comment added.", "info");

    const badge = document.getElementById(`post-comments-count-badge-${postId}`);
    if (badge) {
      const current = parseInt(badge.innerText, 10) || 0;
      badge.innerText = `${current + 1} Comments`;
    }
  } catch (err) {
    console.error("Comment submit error:", err);
    window.showToast?.("Could not post comment: " + err.message, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
};

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
      commentsCount: 0,
      reactions: { amen: 0, love: 0, fire: 0, praise: 0, praying: 0, insight: 0 },
      userReactions: {},
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    if (textInput) textInput.value = '';
    if (fileInput) fileInput.value = '';
    document.getElementById('feed-media-preview-container')?.classList.add('hidden');

    // Automatically collapse the dropdown composer after posting
    window.toggleFeedComposerDropdown();

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
  window.reactToGlobalPost(postId, 'amen');
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
