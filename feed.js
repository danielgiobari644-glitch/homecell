// feed.js
// Real-time Community Fellowship Feed & Social Stream

let feedListener = null;

function initFeedEngine() {
  const user = window.auth.currentUser;
  const avatarEl = document.getElementById('feed-user-avatar');
  const toggleBox = document.getElementById('feed-announcement-toggle-box');

  if (avatarEl) {
    if (user) {
      avatarEl.innerText = (window.currentUserProfile?.displayName || user.email || '?').charAt(0).toUpperCase();
    } else {
      avatarEl.innerText = '?';
    }
  }

  // Toggle announcement option based on role
  if (toggleBox) {
    const isLeadership = ['Super Admin', 'Cell Leader', 'Cell Coordinator', 'Pastor'].includes(window.currentUserRole);
    if (isLeadership) {
      toggleBox.classList.remove('hidden');
      toggleBox.classList.add('flex');
    } else {
      toggleBox.classList.remove('flex');
      toggleBox.classList.add('hidden');
    }
  }

  // Load Feed Stream
  loadFeedStream();

  // Load Member Journeys in Sidebar
  loadSidebarJourneys();
}

function loadFeedStream() {
  const container = document.getElementById('community-posts-stream');
  if (!container) return;

  if (feedListener) feedListener();

  feedListener = window.db.collection('community_feed')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) {
        container.innerHTML = `
          <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-slate-400 space-y-2">
            <p class="font-bold">No feed updates active.</p>
            <p class="text-xs">Be the first to share a testimony or a praise report of God's goodness!</p>
          </div>
        `;
        return;
      }

      snap.forEach(doc => {
        const post = doc.data();
        const postId = doc.id;
        const currentUser = window.auth.currentUser;

        const isLiked = currentUser && post.likes && post.likes[currentUser.uid] === true;
        const likesCount = post.likesCount || 0;
        const comments = post.comments || [];

        const isAnnouncement = post.type === 'announcement';
        const isTestimony = post.type === 'testimony';

        let dateStr = 'Just now';
        if (post.createdAt) {
          const dt = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt.seconds * 1000);
          dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const canDelete = currentUser && (post.authorUid === currentUser.uid || window.currentUserRole === 'Super Admin');

        const postCard = document.createElement('div');
        postCard.className = `bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700 ${
          isAnnouncement ? 'border-purple-200 dark:border-purple-950 bg-purple-50/5 dark:bg-purple-950/5' : 'border-slate-200 dark:border-zinc-800'
        }`;

        // Comments list HTML
        const commentsHTML = comments.map(c => `
          <div class="bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 rounded-2xl p-3 text-xs space-y-1">
            <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200">
              <span>${c.authorName}</span>
              <span class="text-[9px] uppercase tracking-wider bg-slate-200 dark:bg-zinc-700 text-slate-500 px-1 rounded font-mono">${c.authorRole}</span>
              <span class="text-[10px] font-normal text-slate-400 ml-auto">${c.dateStr || 'Just now'}</span>
            </div>
            <p class="text-slate-600 dark:text-zinc-300 leading-relaxed">${c.text}</p>
          </div>
        `).join('');

        postCard.innerHTML = `
          <!-- Header -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold flex items-center justify-center text-sm font-display shadow-inner">
              ${(post.authorName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-black text-sm text-slate-900 dark:text-zinc-100">${post.authorName}</span>
                <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">${post.authorRole}</span>
              </div>
              <div class="text-[10px] text-slate-400 font-medium">${dateStr}</div>
            </div>

            <div class="ml-auto flex items-center gap-2">
              ${isAnnouncement ? `
                <span class="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-950/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                  📢 Announcement
                </span>
              ` : ''}
              ${isTestimony ? `
                <span class="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                  🙏 Testimony
                </span>
              ` : ''}

              ${canDelete ? `
                <button onclick="deleteFeedPost('${postId}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer" title="Delete Post">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Content Body -->
          <div class="text-sm text-slate-700 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">${post.text}</div>

          <!-- Actions Footer bar -->
          <div class="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
            <button onclick="toggleLikePost('${postId}')" class="flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
              isLiked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400'
            }">
              <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i>
              <span>${likesCount} Likes</span>
            </button>

            <button onclick="toggleCommentsSection('${postId}')" class="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 cursor-pointer">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>${comments.length} Comments</span>
            </button>
          </div>

          <!-- Comments Section (collapsible) -->
          <div id="comments-pane-${postId}" class="hidden space-y-4 pt-4 border-t border-slate-50 dark:border-zinc-800/40">
            <!-- Comment items -->
            <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
              ${commentsHTML || '<p class="text-center text-[11px] text-slate-400">No comments yet. Be the first to share support!</p>'}
            </div>

            <!-- Comment Composer -->
            <form onsubmit="submitPostComment(event, '${postId}')" class="flex gap-2">
              <input type="text" placeholder="Write a comment of support..." required class="flex-grow text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-105 cursor-pointer">
                Send
              </button>
            </form>
          </div>
        `;

        container.appendChild(postCard);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => window.handleFirestoreError(err, 'list', 'community_feed'));
}

function loadSidebarJourneys() {
  const sidebar = document.getElementById('sidebar-testimonies-list');
  if (!sidebar) return;

  window.db.collection('users')
    .orderBy('createdAt', 'desc')
    .get()
    .then(snap => {
      sidebar.innerHTML = '';
      let count = 0;
      snap.forEach(doc => {
        const u = doc.data();
        if (u.bio && u.bio.trim() !== '' && count < 4) {
          count++;
          const item = document.createElement('div');
          item.className = "p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800/60 space-y-1 transition-all hover:scale-[1.02]";
          item.innerHTML = `
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold flex items-center justify-center font-display">
                ${(u.displayName || '?').charAt(0).toUpperCase()}
              </div>
              <span class="text-[11px] font-bold text-slate-800 dark:text-zinc-200">${u.displayName || 'Parish Member'}</span>
              <span class="text-[9px] font-mono text-slate-400 ml-auto truncate max-w-[80px]">${u.coordinates || ''}</span>
            </div>
            <p class="text-[10px] text-slate-500 italic leading-relaxed">"${u.bio}"</p>
          `;
          sidebar.appendChild(item);
        }
      });

      if (count === 0) {
        sidebar.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-2">No soul testimonies published yet.</p>`;
      }
    })
    .catch(err => window.handleFirestoreError(err, 'get', 'users_testimonies'));
}

function publishToFeed() {
  const user = window.auth.currentUser;
  if (!user) {
    window.showToast?.("Please log in to publish to the community feed.", "error");
    return;
  }

  const textVal = document.getElementById('feed-composer-text').value.trim();
  const selectType = document.getElementById('feed-post-type').value;
  const isAnnCheckbox = document.getElementById('feed-is-announcement');
  const isAnn = isAnnCheckbox ? isAnnCheckbox.checked : false;

  if (!textVal) {
    window.showToast?.("Please input a message before publishing.", "error");
    return;
  }

  const finalType = isAnn ? 'announcement' : selectType;

  const newPostId = window.db.collection('community_feed').doc().id;

  window.db.collection('community_feed').doc(newPostId).set({
    id: newPostId,
    text: textVal,
    type: finalType,
    authorUid: user.uid,
    authorName: window.currentUserProfile?.displayName || user.email || 'Parish Member',
    authorRole: window.currentUserRole || 'Member',
    likesCount: 0,
    likes: {},
    comments: [],
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => {
      window.showToast?.("Feed post published successfully.");
      document.getElementById('feed-composer-text').value = '';
      if (isAnnCheckbox) isAnnCheckbox.checked = false;
    })
    .catch(err => window.handleFirestoreError(err, 'write', 'community_feed'));
}

function toggleLikePost(postId) {
  const user = window.auth.currentUser;
  if (!user) {
    window.showToast?.("Please log in to like posts.", "error");
    return;
  }

  const postRef = window.db.collection('community_feed').doc(postId);

  window.db.runTransaction(transaction => {
    return transaction.get(postRef).then(sfDoc => {
      if (!sfDoc.exists) return;

      const p = sfDoc.data();
      const likes = p.likes || {};
      const alreadyLiked = likes[user.uid] === true;

      if (alreadyLiked) {
        likes[user.uid] = false;
        transaction.update(postRef, {
          likes: likes,
          likesCount: window.firebase.firestore.FieldValue.increment(-1)
        });
      } else {
        likes[user.uid] = true;
        transaction.update(postRef, {
          likes: likes,
          likesCount: window.firebase.firestore.FieldValue.increment(1)
        });
      }
    });
  })
    .catch(err => window.handleFirestoreError(err, 'write', `community_feed/${postId}/like`));
}

function toggleCommentsSection(postId) {
  const pane = document.getElementById(`comments-pane-${postId}`);
  if (pane) {
    pane.classList.toggle('hidden');
  }
}

function submitPostComment(e, postId) {
  e.preventDefault();
  const user = window.auth.currentUser;
  if (!user) {
    window.showToast?.("Please log in to leave comments.", "error");
    return;
  }

  const form = e.target;
  const input = form.querySelector('input');
  const commentText = input.value.trim();

  if (!commentText) return;

  const postRef = window.db.collection('community_feed').doc(postId);

  const commentObj = {
    authorUid: user.uid,
    authorName: window.currentUserProfile?.displayName || user.email || 'Parish Member',
    authorRole: window.currentUserRole || 'Member',
    text: commentText,
    dateStr: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  postRef.update({
    comments: window.firebase.firestore.FieldValue.arrayUnion(commentObj)
  })
    .then(() => {
      input.value = '';
    })
    .catch(err => window.handleFirestoreError(err, 'write', `community_feed/${postId}/comment`));
}

function deleteFeedPost(postId) {
  if (!confirm("Are you sure you want to delete this community feed post?")) return;

  window.db.collection('community_feed').doc(postId).delete()
    .then(() => {
      window.showToast?.("Post deleted successfully.");
    })
    .catch(err => window.handleFirestoreError(err, 'write', `community_feed/${postId}`));
}

// Expose globally
window.initFeedEngine = initFeedEngine;
window.publishToFeed = publishToFeed;
window.toggleLikePost = toggleLikePost;
window.toggleCommentsSection = toggleCommentsSection;
window.submitPostComment = submitPostComment;
window.deleteFeedPost = deleteFeedPost;
