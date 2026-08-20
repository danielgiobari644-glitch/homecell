// feed.js
// Real-time Community Fellowship Feed, Image/Video Posts & Testimonies

let feedListener = null;
window.currentFeedFilter = 'all';

function initFeedEngine() {
  const user = window.auth.currentUser;
  const avatarEl = document.getElementById('feed-user-avatar');
  const toggleBox = document.getElementById('feed-announcement-toggle-box');

  if (avatarEl) {
    const photo = window.currentUserProfile?.photoURL;
    if (photo) {
      avatarEl.innerHTML = `<img src="${photo}" class="w-full h-full rounded-full object-cover" />`;
    } else if (user) {
      avatarEl.innerText = (window.currentUserProfile?.displayName || user.email || '?').charAt(0).toUpperCase();
    } else {
      avatarEl.innerText = '?';
    }
  }

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

  const postTypeSelect = document.getElementById('feed-post-type');
  const composerTextarea = document.getElementById('feed-composer-text');
  if (postTypeSelect && composerTextarea) {
    postTypeSelect.addEventListener('change', () => {
      if (postTypeSelect.value === 'testimony') {
        composerTextarea.placeholder = "Share what God is doing in your life today. Let your testimony encourage others! 🙏✨";
      } else {
        composerTextarea.placeholder = "Share a thought, encouragement, or scripture...";
      }
    });
  }

  window.setFeedFilter(window.currentFeedFilter || 'all');
  loadFeedStream();
  syncFeedDailyDevotionals();
  syncFeedUpcomingEvents();
}

window.setFeedFilter = function(filter) {
  window.currentFeedFilter = filter;
  
  const filters = ['all', 'testimony', 'announcement'];
  filters.forEach(f => {
    const btn = document.getElementById(`feed-filter-${f}`);
    if (btn) {
      if (f === filter) {
        btn.className = "px-4 py-2 text-xs font-black rounded-2xl transition-all cursor-pointer bg-blue-600 text-white shadow-sm flex items-center gap-1.5";
      } else {
        btn.className = "px-4 py-2 text-xs font-black rounded-2xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1.5";
      }
    }
  });

  loadFeedStream();
};

let activeCommunityPosts = [];

function loadFeedStream() {
  const container = document.getElementById('community-posts-stream');
  if (!container) return;

  if (feedListener) feedListener();

  feedListener = window.db.collection('community_feed')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      activeCommunityPosts = [];
      snap.forEach(doc => {
        activeCommunityPosts.push({ id: doc.id, ...doc.data() });
      });
      renderFeedWithStreams();
    }, err => {
      console.warn("Feed listener error:", err);
    });
}

function renderFeedWithStreams() {
  const container = document.getElementById('community-posts-stream');
  if (!container) return;

  container.innerHTML = '';

  const filteredPosts = activeCommunityPosts.filter(post => {
    if (window.currentFeedFilter && window.currentFeedFilter !== 'all') {
      return post.type === window.currentFeedFilter;
    }
    return true;
  });

  if (filteredPosts.length === 0) {
    let emptyMessage = "No updates found in this category yet. Be the first to share!";
    container.innerHTML = `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
        <span class="text-3xl">🕊️</span>
        <p class="font-bold text-slate-700 dark:text-zinc-300">No posts yet.</p>
        <p class="text-xs max-w-sm mx-auto leading-relaxed">${emptyMessage}</p>
      </div>
    `;
    updateFeedBadge(0);
    return;
  }

  filteredPosts.forEach(post => {
    container.appendChild(createFeedPostCard(post));
  });

  updateFeedBadge(filteredPosts.length);
  if (window.lucide) window.lucide.createIcons();
}

function createFeedPostCard(post) {
  const postId = post.id;
  const currentUser = window.auth?.currentUser;
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
  const avatarImg = post.authorPhotoURL ? `<img src="${post.authorPhotoURL}" class="w-full h-full rounded-full object-cover" />` : (post.authorName || '?').charAt(0).toUpperCase();

  const postCard = document.createElement('div');
  postCard.className = `bg-white dark:bg-zinc-900 border ${
    isTestimony 
      ? 'border-emerald-200 dark:border-emerald-950/60 border-l-4 border-l-emerald-500' 
      : isAnnouncement 
      ? 'border-purple-200 dark:border-purple-950/60 border-l-4 border-l-purple-600' 
      : 'border-slate-200 dark:border-zinc-800'
  } rounded-3xl p-6 shadow-xs space-y-4 transition-all`;

  const commentsHTML = comments.map(c => `
    <div class="bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 rounded-2xl p-3 text-xs space-y-1">
      <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200">
        <span>${c.authorName}</span>
        <span class="text-[9px] uppercase tracking-wider bg-slate-200 dark:bg-zinc-700 text-slate-500 px-1 rounded font-mono">${c.authorRole}</span>
        <span class="text-[10px] font-normal text-slate-400 ml-auto">${c.dateStr || 'Just now'}</span>
      </div>
      <p class="text-slate-600 dark:text-zinc-300 leading-relaxed">${c.text}</p>
    </div>
  `).join('');

  postCard.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full text-slate-700 dark:text-zinc-300 font-bold flex items-center justify-center text-sm font-display shadow-inner shrink-0 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        ${avatarImg}
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <span class="font-black text-sm text-slate-900 dark:text-zinc-100">${post.authorName}</span>
          <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">${post.authorRole || 'Member'}</span>
        </div>
        <div class="text-[10px] text-slate-400 font-medium">${dateStr}</div>
      </div>

      <div class="ml-auto flex items-center gap-2">
        ${isAnnouncement ? `
          <span class="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-950/60 px-2.5 py-1 rounded-full">
            📢 Announcement
          </span>
        ` : ''}
        ${isTestimony ? `
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/20">
            🙏 Praise Testimony
          </span>
        ` : ''}

        ${canDelete ? `
          <button onclick="deleteFeedPost('${postId}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer" title="Delete Post">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>
    </div>

    <div class="text-sm text-slate-700 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">${post.text}</div>

    ${getMediaHTML(post.imageUrl, post.videoUrl)}

    <div class="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
      <button onclick="toggleLikePost('${postId}')" class="flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
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

    <div id="comments-pane-${postId}" class="hidden space-y-4 pt-4 border-t border-slate-50 dark:border-zinc-800/40">
      <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
        ${commentsHTML || '<p class="text-center text-[11px] text-slate-400">No comments yet. Write an encouraging message!</p>'}
      </div>

      <form onsubmit="submitPostComment(event, '${postId}')" class="flex gap-2">
        <input type="text" placeholder="Write a supportive comment..." required class="flex-grow text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer">
          Send
        </button>
      </form>
    </div>
  `;

  return postCard;
}

function updateFeedBadge(visibleCount) {
  const badge = document.getElementById('feed-items-count-badge');
  if (badge) {
    badge.innerHTML = `<span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span> ${visibleCount} updates`;
  }
}

let isPublishingPost = false;

async function publishToFeed() {
  if (isPublishingPost) return;

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to publish to the community feed.", "error");
    return;
  }

  const textVal = document.getElementById('feed-composer-text')?.value?.trim();
  const selectType = document.getElementById('feed-post-type')?.value || 'testimony';
  const isAnnCheckbox = document.getElementById('feed-is-announcement');
  const isAnn = isAnnCheckbox ? isAnnCheckbox.checked : false;

  const imageUrlVal = document.getElementById('feed-image-url')?.value?.trim() || window.attachedImageBase64;
  const videoUrlVal = document.getElementById('feed-video-url')?.value?.trim() || window.attachedVideoBase64;

  if (!textVal) {
    window.showToast?.("Please enter a message before publishing.", "warning");
    return;
  }

  const finalType = isAnn ? 'announcement' : selectType;
  const profile = window.currentUserProfile || {};
  const newPostId = window.db.collection('community_feed').doc().id;

  isPublishingPost = true;
  window.showToast?.("Publishing post...", "info");

  try {
    await window.db.collection('community_feed').doc(newPostId).set({
      id: newPostId,
      text: textVal,
      type: finalType,
      authorUid: user.uid,
      authorName: profile.displayName || user.displayName || user.email || 'Member',
      authorRole: window.currentUserRole || profile.role || 'Member',
      authorPhotoURL: profile.photoURL || null,
      imageUrl: imageUrlVal || null,
      videoUrl: videoUrlVal || null,
      likesCount: 0,
      likes: {},
      comments: [],
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    // Mark user activity for daily missions
    await window.db.collection('users').doc(user.uid).update({
      postedToday: true,
      hasSharedTestimony: true
    }).catch(() => {});

    document.getElementById('feed-composer-text').value = '';
    if (isAnnCheckbox) isAnnCheckbox.checked = false;

    window.clearAttachment?.('image');
    window.clearAttachment?.('video');
    document.getElementById('attachment-image-box')?.classList.add('hidden');
    document.getElementById('attachment-video-box')?.classList.add('hidden');
    window.toggleFeedComposer?.(false);

    window.showToast?.("🎉 Post published to community feed!", "success");

  } catch (err) {
    console.error("Publish post error:", err);
    window.showToast?.("We couldn't publish your post. Check your connection and try again.", "error");
  } finally {
    isPublishingPost = false;
  }
}

function toggleLikePost(postId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to like posts.", "error");
    return;
  }

  const postRef = window.db.collection('community_feed').doc(postId);

  window.db.runTransaction(async (transaction) => {
    const doc = await transaction.get(postRef);
    if (!doc.exists) return;

    const p = doc.data();
    const likes = p.likes || {};
    const alreadyLiked = likes[user.uid] === true;

    if (alreadyLiked) {
      delete likes[user.uid];
      transaction.update(postRef, {
        likes: likes,
        likesCount: Math.max(0, (p.likesCount || 1) - 1)
      });
    } else {
      likes[user.uid] = true;
      transaction.update(postRef, {
        likes: likes,
        likesCount: (p.likesCount || 0) + 1
      });
    }
  }).catch(err => console.warn("Like error:", err));
}

function toggleCommentsSection(postId) {
  const pane = document.getElementById(`comments-pane-${postId}`);
  if (pane) {
    pane.classList.toggle('hidden');
  }
}

function submitPostComment(e, postId) {
  e.preventDefault();
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to leave comments.", "error");
    return;
  }

  const form = e.target;
  const input = form.querySelector('input');
  const commentText = input.value.trim();

  if (!commentText) return;

  const postRef = window.db.collection('community_feed').doc(postId);
  const profile = window.currentUserProfile || {};

  const commentObj = {
    authorUid: user.uid,
    authorName: profile.displayName || user.displayName || user.email || 'Member',
    authorRole: window.currentUserRole || 'Member',
    text: commentText,
    dateStr: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  postRef.update({
    comments: window.firebase.firestore.FieldValue.arrayUnion(commentObj)
  }).then(() => {
    input.value = '';
  }).catch(err => console.warn("Comment error:", err));
}

function deleteFeedPost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  window.db.collection('community_feed').doc(postId).delete()
    .then(() => window.showToast?.("Post deleted successfully."))
    .catch(err => window.showToast?.("Could not delete post.", "error"));
}

function getMediaHTML(imageUrl, videoUrl) {
  let html = '';
  if (imageUrl) {
    html += `
      <div class="rounded-2xl overflow-hidden max-h-[450px] border border-slate-100 dark:border-zinc-800 shadow-sm mt-3 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <img src="${imageUrl}" class="w-full h-auto max-h-[450px] object-contain" alt="Post picture" referrerPolicy="no-referrer" />
      </div>
    `;
  }
  if (videoUrl) {
    let isYoutube = false;
    let embedUrl = '';
    try {
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        isYoutube = true;
        let videoId = '';
        if (videoUrl.includes('youtu.be/')) {
          videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        } else if (videoUrl.includes('v=')) {
          videoId = videoUrl.split('v=')[1].split('&')[0];
        } else if (videoUrl.includes('embed/')) {
          videoId = videoUrl.split('embed/')[1].split('?')[0];
        }
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {}

    if (isYoutube && embedUrl) {
      html += `
        <div class="rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-sm mt-3 aspect-video">
          <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
        </div>
      `;
    } else {
      html += `
        <div class="rounded-2xl overflow-hidden max-h-[450px] border border-slate-100 dark:border-zinc-800 shadow-sm mt-3 bg-black flex items-center justify-center">
          <video src="${videoUrl}" class="w-full h-auto max-h-[450px]" controls></video>
        </div>
      `;
    }
  }
  return html;
}

window.attachedImageBase64 = null;
window.attachedVideoBase64 = null;

window.toggleAttachmentInput = function(type) {
  const box = document.getElementById(`attachment-${type}-box`);
  if (box) {
    box.classList.toggle('hidden');
  }
};

window.handleFileAttachment = function(type) {
  const fileInput = document.getElementById(`feed-${type}-file`);
  const previewBox = document.getElementById(`attachment-${type}-preview`);
  const previewMedia = document.getElementById(`${type}-preview-${type === 'image' ? 'img' : 'vid'}`);

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  if (file.size > 8 * 1024 * 1024) {
    window.showToast?.("This file is too large. Please choose a smaller file (under 8MB).", "warning");
    fileInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    if (type === 'image') {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        window.attachedImageBase64 = compressed;
        if (previewMedia) previewMedia.src = compressed;
        if (previewBox) previewBox.classList.remove('hidden');
      };
      img.src = base64Data;
    } else {
      window.attachedVideoBase64 = base64Data;
      if (previewMedia) {
        previewMedia.src = base64Data;
        previewMedia.load();
      }
      if (previewBox) previewBox.classList.remove('hidden');
    }
  };
  reader.readAsDataURL(file);
};

window.clearAttachment = function(type) {
  const fileInput = document.getElementById(`feed-${type}-file`);
  const urlInput = document.getElementById(`feed-${type}-url`);
  const previewBox = document.getElementById(`attachment-${type}-preview`);
  
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (previewBox) previewBox.classList.add('hidden');

  if (type === 'image') {
    window.attachedImageBase64 = null;
  } else {
    window.attachedVideoBase64 = null;
  }
};

window.toggleFeedComposer = function(forceShow) {
  const container = document.getElementById('feed-composer-form-container');
  const toggleBtnText = document.getElementById('btn-toggle-feed-composer-text');
  if (!container) return;

  const shouldShow = forceShow !== undefined ? forceShow : container.classList.contains('hidden');
  if (shouldShow) {
    container.classList.remove('hidden');
    if (toggleBtnText) toggleBtnText.innerText = "Close Post Composer";
    const txt = document.getElementById('feed-composer-text');
    if (txt) txt.focus();
  } else {
    container.classList.add('hidden');
    if (toggleBtnText) toggleBtnText.innerText = "Create a Post";
  }
  if (window.lucide) window.lucide.createIcons();
};

window.scrollToComposerAndSelectTestimony = function() {
  window.toggleFeedComposer(true);
  const container = document.getElementById('feed-composer-form-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const select = document.getElementById('feed-post-type');
    if (select) select.value = 'testimony';
    const txt = document.getElementById('feed-composer-text');
    if (txt) {
      txt.focus();
      txt.placeholder = "Write your real praise testimony to encourage the brethren...";
    }
  }
};

let feedDevotionalListener = null;
function syncFeedDailyDevotionals() {
  const container = document.getElementById('feed-daily-devotional-container');
  if (!container) return;

  if (feedDevotionalListener) feedDevotionalListener();

  feedDevotionalListener = window.db.collection('daily_devotionals')
    .orderBy('devotionalDate', 'desc')
    .limit(1)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) return;

      const isSuperAdmin = window.checkIsSuperAdmin ? window.checkIsSuperAdmin() : (
        window.currentUserRole === 'Super Admin' ||
        window.auth?.currentUser?.email?.toLowerCase() === 'danielgiobari644@gmail.com'
      );

      window.devotionalsCache = window.devotionalsCache || {};

      snap.forEach(doc => {
        const d = doc.data();
        d.id = doc.id;
        window.devotionalsCache[doc.id] = d;

        const safeTitle = (d.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeImg = (d.imageUrl || '').replace(/'/g, "\\'");

        const card = document.createElement('div');
        card.className = "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 shadow-xs space-y-4 animate-fade-in";
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/40 pb-3">
            <div class="flex items-center gap-2">
              <span class="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <i data-lucide="sun" class="w-4 h-4"></i>
              </span>
              <div>
                <span class="text-[10px] uppercase font-black tracking-widest text-amber-600 dark:text-amber-400 block">Today's Daily Devotional</span>
                <span class="text-xs font-bold text-slate-500 dark:text-zinc-400">${d.devotionalDate} • ${d.scripture}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${isSuperAdmin ? `
                <button onclick="window.openChangeCoverModal({ type: 'devotional', id: '${doc.id}', title: '${safeTitle}', imageUrl: '${safeImg}' })" class="text-[10px] font-bold px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full flex items-center gap-1 shadow-2xs cursor-pointer transition-all">
                  <i data-lucide="camera" class="w-3 h-3"></i>
                  <span>Change Cover</span>
                </button>
              ` : `
                <span class="text-[10px] font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full">
                  ☀️ Faith Bread
                </span>
              `}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            ${d.imageUrl ? `
              <div onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" class="md:col-span-1 rounded-2xl overflow-hidden shadow-xs border border-amber-200/60 dark:border-amber-900/40 h-44 cursor-pointer group relative">
                <img src="${d.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${d.title}" />
              </div>
            ` : ''}
            <div class="${d.imageUrl ? 'md:col-span-2' : 'md:col-span-3'} space-y-2">
              <h3 onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" class="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-zinc-50 tracking-tight cursor-pointer hover:text-amber-600 transition-colors">${d.title}</h3>
              <p class="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed line-clamp-3">${d.body}</p>
              
              <div class="pt-2 flex items-center gap-3">
                <button onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs">
                  <span>Read Full Devotional</span>
                  <i data-lucide="book-open" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Feed devotional listener error:", err));
}

let feedEventsListener = null;
function syncFeedUpcomingEvents() {
  const container = document.getElementById('feed-upcoming-events-container');
  if (!container) return;

  if (feedEventsListener) feedEventsListener();

  feedEventsListener = window.db.collection('upcoming_events')
    .orderBy('eventDate', 'asc')
    .limit(2)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) return;

      const isSuperAdmin = window.checkIsSuperAdmin ? window.checkIsSuperAdmin() : (
        window.currentUserRole === 'Super Admin' ||
        window.auth?.currentUser?.email?.toLowerCase() === 'danielgiobari644@gmail.com'
      );

      const section = document.createElement('div');
      section.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4";
      
      let eventsHTML = '';
      snap.forEach(doc => {
        const ev = doc.data();
        const docId = doc.id;
        const formattedDate = window.formatEventDatesDisplay ? window.formatEventDatesDisplay(ev) : new Date(ev.eventDate).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const safeTitle = (ev.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeImg = (ev.imageUrl || '').replace(/'/g, "\\'");

        eventsHTML += `
          <div class="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div class="flex items-center gap-4">
              ${ev.imageUrl ? `
                <img src="${ev.imageUrl}" class="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shadow-2xs shrink-0" alt="${ev.title}" />
              ` : `
                <div class="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                  <i data-lucide="calendar" class="w-6 h-6"></i>
                </div>
              `}
              <div class="space-y-1">
                <span class="px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 inline-block">
                  📅 ${formattedDate}
                </span>
                <h4 class="font-black text-slate-900 dark:text-zinc-100 text-sm font-display">${ev.title}</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">${ev.description}</p>
                <span class="text-[10px] font-semibold text-slate-400 block">📍 ${ev.location}</span>
              </div>
            </div>

            ${isSuperAdmin ? `
              <button onclick="window.openChangeCoverModal({ type: 'event', id: '${docId}', title: '${safeTitle}', imageUrl: '${safeImg}' })" class="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-purple-500/30 cursor-pointer shrink-0">
                <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                <span>Change Cover</span>
              </button>
            ` : ''}
          </div>
        `;
      });

      section.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <h3 class="font-black font-display text-slate-900 dark:text-zinc-100 text-xs uppercase tracking-wider flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <i data-lucide="calendar" class="w-4 h-4"></i> Upcoming Gatherings
          </h3>
        </div>
        <div class="space-y-3">
          ${eventsHTML}
        </div>
      `;

      container.appendChild(section);
      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Feed events listener error:", err));
}

window.initFeedEngine = initFeedEngine;
window.publishToFeed = publishToFeed;
window.toggleLikePost = toggleLikePost;
window.toggleCommentsSection = toggleCommentsSection;
window.submitPostComment = submitPostComment;
window.deleteFeedPost = deleteFeedPost;
window.getMediaHTML = getMediaHTML;
