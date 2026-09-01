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
  initVideoInputListeners();
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

    ${getMediaHTML(post)}

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

  // Asynchronously trigger lazy loading for any chunked media
  setTimeout(() => triggerFeedMediaChunkLoader(post), 10);

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

  const imageUrlInput = document.getElementById('feed-image-url')?.value?.trim();
  const videoUrlInput = document.getElementById('feed-video-url')?.value?.trim();

  const attachedImg = window.attachedImageBase64;
  const attachedVid = window.attachedVideoBase64;
  const attachedDoc = window.attachedDocBase64;

  if (!textVal && !attachedImg && !attachedVid && !attachedDoc && !imageUrlInput && !videoUrlInput) {
    window.showToast?.("Please enter a message or attach media before publishing.", "warning");
    return;
  }

  const finalType = isAnn ? 'announcement' : selectType;
  const profile = window.currentUserProfile || {};
  const newPostId = window.db.collection('community_feed').doc().id;

  isPublishingPost = true;
  const publishBtn = document.getElementById('btn-publish-feed-post');
  if (publishBtn) {
    publishBtn.disabled = true;
    publishBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Publishing...`;
  }
  window.showToast?.("Publishing post with media chunks...", "info");

  try {
    let imageChunkId = null;
    let imageTotalChunks = 0;
    let videoChunkId = null;
    let videoTotalChunks = 0;
    let docChunkId = null;
    let docTotalChunks = 0;
    let docName = window.attachedDocName || null;
    let docSize = window.attachedDocSize || null;
    let docMime = window.attachedDocMime || null;

    let finalImageUrl = imageUrlInput || null;
    let finalVideoUrl = videoUrlInput || null;

    // 1. Process & chunk image if attached locally
    if (attachedImg) {
      if (window.saveBase64InChunks) {
        const fileId = `fc_feed_img_${newPostId}`;
        const saveRes = await window.saveBase64InChunks({
          fileId: fileId,
          base64Data: attachedImg,
          mimeType: 'image/jpeg',
          fileName: 'post_image.jpg',
          uploaderUid: user.uid,
          onProgress: (pct) => {
            window.showToast?.(`Uploading photo chunks: ${pct}%`, "info");
          }
        });
        imageChunkId = saveRes.fileId;
        imageTotalChunks = saveRes.totalChunks;
        finalImageUrl = null; // Stored securely in chunks
      } else {
        finalImageUrl = attachedImg;
      }
    }

    // 2. Process & chunk video if attached locally
    if (attachedVid) {
      if (window.saveBase64InChunks) {
        const fileId = `fc_feed_vid_${newPostId}`;
        const saveRes = await window.saveBase64InChunks({
          fileId: fileId,
          base64Data: attachedVid,
          mimeType: 'video/mp4',
          fileName: 'post_video.mp4',
          uploaderUid: user.uid,
          onProgress: (pct) => {
            window.showToast?.(`Uploading video chunks: ${pct}%`, "info");
          }
        });
        videoChunkId = saveRes.fileId;
        videoTotalChunks = saveRes.totalChunks;
        finalVideoUrl = null; // Stored securely in chunks
      } else {
        finalVideoUrl = attachedVid;
      }
    }

    // 3. Process & chunk document / file if attached locally
    if (attachedDoc) {
      if (window.saveBase64InChunks) {
        const fileId = `fc_feed_doc_${newPostId}`;
        const saveRes = await window.saveBase64InChunks({
          fileId: fileId,
          base64Data: attachedDoc,
          mimeType: docMime || 'application/octet-stream',
          fileName: docName || 'document',
          fileSize: docSize || 0,
          uploaderUid: user.uid,
          onProgress: (pct) => {
            window.showToast?.(`Uploading file chunks: ${pct}%`, "info");
          }
        });
        docChunkId = saveRes.fileId;
        docTotalChunks = saveRes.totalChunks;
      }
    }

    const postDoc = {
      id: newPostId,
      text: textVal || '',
      type: finalType,
      authorUid: user.uid,
      authorName: profile.displayName || user.displayName || user.email || 'Member',
      authorRole: window.currentUserRole || profile.role || 'Member',
      authorPhotoURL: profile.photoURL || null,
      imageUrl: finalImageUrl,
      videoUrl: finalVideoUrl,
      imageChunkId: imageChunkId,
      imageTotalChunks: imageTotalChunks,
      videoChunkId: videoChunkId,
      videoTotalChunks: videoTotalChunks,
      docChunkId: docChunkId,
      docTotalChunks: docTotalChunks,
      docName: docName,
      docSize: docSize,
      docMime: docMime,
      likesCount: 0,
      likes: {},
      comments: [],
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    await window.db.collection('community_feed').doc(newPostId).set(postDoc);

    // Mark user activity for daily missions
    await window.db.collection('users').doc(user.uid).update({
      postedToday: true,
      hasSharedTestimony: true
    }).catch(() => {});

    // Reset Composer inputs
    const composerInput = document.getElementById('feed-composer-text');
    if (composerInput) composerInput.value = '';
    if (isAnnCheckbox) isAnnCheckbox.checked = false;

    window.clearAttachment?.('image');
    window.clearAttachment?.('video');
    window.clearAttachment?.('doc');
    document.getElementById('attachment-image-box')?.classList.add('hidden');
    document.getElementById('attachment-video-box')?.classList.add('hidden');
    document.getElementById('attachment-doc-box')?.classList.add('hidden');
    window.toggleFeedComposer?.(false);

    window.soundEngine?.playSuccess?.();
    window.showToast?.("🎉 Post published to community feed!", "success");

  } catch (err) {
    console.error("Publish post error:", err);
    window.showToast?.("We couldn't publish your post. Check your connection and try again.", "error");
  } finally {
    isPublishingPost = false;
    if (publishBtn) {
      publishBtn.disabled = false;
      publishBtn.innerText = "Publish Post 🚀";
    }
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

async function deleteFeedPost(postId) {
  let isConfirmed = false;
  if (window.showConfirmDialog) {
    isConfirmed = await window.showConfirmDialog({
      title: "Delete Feed Post?",
      message: "Are you sure you want to permanently remove this post and all associated media chunks from the community feed?",
      confirmText: "Delete Post",
      cancelText: "Cancel",
      isDanger: true,
      icon: "trash-2"
    });
  } else {
    isConfirmed = confirm("Are you sure you want to delete this post?");
  }
  if (!isConfirmed) return;

  try {
    const post = (activeCommunityPosts || []).find(p => p.id === postId);
    if (post && window.deleteBase64Chunks) {
      if (post.imageChunkId) {
        await window.deleteBase64Chunks({ fileId: post.imageChunkId, totalChunks: post.imageTotalChunks }).catch(() => {});
      }
      if (post.videoChunkId) {
        await window.deleteBase64Chunks({ fileId: post.videoChunkId, totalChunks: post.videoTotalChunks }).catch(() => {});
      }
      if (post.docChunkId) {
        await window.deleteBase64Chunks({ fileId: post.docChunkId, totalChunks: post.docTotalChunks }).catch(() => {});
      }
    }

    await window.db.collection('community_feed').doc(postId).delete();
    window.soundEngine?.playSuccess?.();
    window.showToast?.("Post deleted successfully.");
  } catch (err) {
    console.error("Delete post error:", err);
    window.showToast?.("Could not delete post.", "error");
  }
}

function extractVideoEmbedInfo(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // YouTube (standard, watch, shorts, live, embed, youtu.be)
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
      originalUrl: cleanUrl,
      videoId: ytMatch[1],
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
    };
  }

  // Vimeo
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: cleanUrl,
      videoId: vimeoMatch[1]
    };
  }

  // DailyMotion
  const dmMatch = cleanUrl.match(/(?:dailymotion\.com\/(?:video|hub)\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  if (dmMatch && dmMatch[1]) {
    return {
      type: 'dailymotion',
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`,
      originalUrl: cleanUrl,
      videoId: dmMatch[1]
    };
  }

  // Direct video file, blob, or base64
  if (
    cleanUrl.startsWith('data:video/') || 
    cleanUrl.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(cleanUrl) ||
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://')
  ) {
    return {
      type: 'direct',
      embedUrl: cleanUrl,
      originalUrl: cleanUrl
    };
  }

  return null;
}

window.extractVideoEmbedInfo = extractVideoEmbedInfo;

function getMediaHTML(post) {
  if (!post) return '';
  const imageUrl = typeof post === 'string' ? post : post.imageUrl;
  const videoUrl = typeof post === 'object' ? post.videoUrl : null;
  const imageChunkId = typeof post === 'object' ? post.imageChunkId : null;
  const videoChunkId = typeof post === 'object' ? post.videoChunkId : null;
  const docChunkId = typeof post === 'object' ? post.docChunkId : null;
  const postId = typeof post === 'object' ? post.id : `p_${Date.now()}`;

  let html = '';

  // 1. Chunked Image Presentation
  if (imageChunkId) {
    html += `
      <div class="relative rounded-2xl overflow-hidden max-h-[480px] border border-slate-100 dark:border-zinc-800 shadow-sm mt-3 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center min-h-[160px]">
        <div id="feed-img-loader-${postId}" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-xs z-10 transition-opacity duration-300">
          <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Loading full fidelity photo...</span>
        </div>
        <img id="feed-chunk-img-${postId}" src="" class="w-full h-auto max-h-[480px] object-contain opacity-0 transition-opacity duration-300" alt="Post picture" />
      </div>
    `;
  } else if (imageUrl) {
    html += `
      <div class="rounded-2xl overflow-hidden max-h-[450px] border border-slate-100 dark:border-zinc-800 shadow-sm mt-3 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <img src="${imageUrl}" class="w-full h-auto max-h-[450px] object-contain" alt="Post picture" referrerPolicy="no-referrer" />
      </div>
    `;
  }

  // 2. Chunked Video Presentation
  if (videoChunkId) {
    html += `
      <div class="relative w-full rounded-2xl overflow-hidden max-h-[480px] border border-slate-200 dark:border-zinc-800 shadow-md mt-3 bg-black flex items-center justify-center min-h-[220px]">
        <div id="feed-vid-loader-${postId}" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/90 z-10 transition-opacity duration-300">
          <div class="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-[11px] font-bold text-purple-300">Reconstructing video chunks...</span>
        </div>
        <video 
          id="feed-chunk-vid-${postId}" 
          src="" 
          class="w-full h-auto max-h-[480px] rounded-2xl object-contain hidden" 
          controls 
          playsinline 
          preload="metadata"
        ></video>
      </div>
    `;
  } else if (videoUrl) {
    const videoInfo = extractVideoEmbedInfo(videoUrl);

    if (videoInfo && (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo' || videoInfo.type === 'dailymotion')) {
      html += `
        <div class="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-md mt-3 aspect-video bg-slate-950">
          <iframe 
            src="${videoInfo.embedUrl}" 
            class="absolute inset-0 w-full h-full" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen 
            loading="lazy"
          ></iframe>
        </div>
      `;
    } else {
      html += `
        <div class="relative w-full rounded-2xl overflow-hidden max-h-[480px] border border-slate-200 dark:border-zinc-800 shadow-md mt-3 bg-black flex items-center justify-center">
          <video 
            src="${videoUrl}" 
            class="w-full h-auto max-h-[480px] rounded-2xl object-contain" 
            controls 
            playsinline 
            preload="metadata"
          ></video>
        </div>
      `;
    }
  }

  // 3. Chunked File / Resource Presentation
  if (docChunkId) {
    const docName = post.docName || 'Kingdom_Resource_Document';
    const formattedSize = post.docSize ? window.formatFileSize ? window.formatFileSize(post.docSize) : `${Math.round(post.docSize / 1024)} KB` : 'Full Chunk File';
    html += `
      <div class="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <i data-lucide="file-text" class="w-5 h-5"></i>
          </div>
          <div class="overflow-hidden">
            <div class="font-black text-xs text-slate-900 dark:text-zinc-100 truncate">${docName}</div>
            <div class="text-[10px] text-slate-400 font-medium">${formattedSize} • Base64 Chunked Storage</div>
          </div>
        </div>
        <button 
          onclick="window.downloadFeedChunkDoc('${docChunkId}', ${post.docTotalChunks || 1}, '${encodeURIComponent(docName)}')" 
          class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Download</span>
        </button>
      </div>
    `;
  }

  return html;
}

// Asynchronously load chunked media in background and render without blocking feed UI
async function triggerFeedMediaChunkLoader(post) {
  if (!post || typeof post !== 'object') return;
  const postId = post.id;

  // 1. Chunked Image Loader
  if (post.imageChunkId && window.loadBase64FromChunks) {
    try {
      const base64Data = await window.loadBase64FromChunks({
        fileId: post.imageChunkId,
        totalChunks: post.imageTotalChunks
      });

      const imgEl = document.getElementById(`feed-chunk-img-${postId}`);
      const loaderEl = document.getElementById(`feed-img-loader-${postId}`);
      if (imgEl && base64Data) {
        imgEl.src = base64Data;
        imgEl.classList.remove('opacity-0');
        if (loaderEl) loaderEl.classList.add('hidden');
      }
    } catch (e) {
      console.warn("Feed image chunk load note:", e);
      const loaderEl = document.getElementById(`feed-img-loader-${postId}`);
      if (loaderEl) loaderEl.innerHTML = `<span class="text-[10px] text-slate-400">Photo unavailable</span>`;
    }
  }

  // 2. Chunked Video Loader
  if (post.videoChunkId && window.loadBase64FromChunks) {
    try {
      const base64Data = await window.loadBase64FromChunks({
        fileId: post.videoChunkId,
        totalChunks: post.videoTotalChunks
      });

      const vidEl = document.getElementById(`feed-chunk-vid-${postId}`);
      const loaderEl = document.getElementById(`feed-vid-loader-${postId}`);
      if (vidEl && base64Data) {
        const blob = window.chunkedDataUrlToBlob ? window.chunkedDataUrlToBlob(base64Data) : null;
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          vidEl.src = blobUrl;
          vidEl.classList.remove('hidden');
          if (loaderEl) loaderEl.classList.add('hidden');
        } else {
          vidEl.src = base64Data;
          vidEl.classList.remove('hidden');
          if (loaderEl) loaderEl.classList.add('hidden');
        }
      }
    } catch (e) {
      console.warn("Feed video chunk load note:", e);
      const loaderEl = document.getElementById(`feed-vid-loader-${postId}`);
      if (loaderEl) loaderEl.innerHTML = `<span class="text-[10px] text-slate-400">Video unavailable</span>`;
    }
  }
}

// Download chunked document/file to user's device
window.downloadFeedChunkDoc = async function(fileId, totalChunks, encodedFileName) {
  const fileName = decodeURIComponent(encodedFileName || 'Kingdom_Resource_Document');
  window.showToast?.(`📥 Fetching "${fileName}" from Base64 chunks...`, "info");

  try {
    if (!window.loadBase64FromChunks) {
      throw new Error("Chunk engine is unavailable.");
    }

    const base64Data = await window.loadBase64FromChunks({
      fileId: fileId,
      totalChunks: totalChunks,
      onProgress: (pct) => {
        window.showToast?.(`📥 Assembling file chunks: ${pct}%`, "info");
      }
    });

    if (!base64Data) {
      throw new Error("Could not assemble file chunks.");
    }

    const blob = window.chunkedDataUrlToBlob ? window.chunkedDataUrlToBlob(base64Data) : null;
    if (blob) {
      window.triggerBlobFileDownload?.(blob, fileName);
      window.soundEngine?.playSuccess?.();
      window.showToast?.(`✅ "${fileName}" downloaded successfully!`, "success");
    } else {
      window.showToast?.("Error converting chunks to file.", "error");
    }
  } catch (err) {
    console.error("Feed doc download error:", err);
    window.showToast?.("Error downloading file: " + err.message, "error");
  }
};

window.attachedImageBase64 = null;
window.attachedVideoBase64 = null;
window.attachedDocBase64 = null;
window.attachedDocName = null;
window.attachedDocSize = null;
window.attachedDocMime = null;

window.toggleAttachmentInput = function(type) {
  const box = document.getElementById(`attachment-${type}-box`);
  if (box) {
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden')) {
      if (type === 'video') {
        initVideoInputListeners();
      }
    }
  }
};

function initVideoInputListeners() {
  const urlInput = document.getElementById('feed-video-url');
  if (urlInput && !urlInput.dataset.listenerAttached) {
    urlInput.dataset.listenerAttached = 'true';
    const updatePreview = () => {
      const val = urlInput.value.trim();
      const previewBox = document.getElementById('attachment-video-preview');
      const previewVid = document.getElementById('video-preview-vid');
      const previewIframe = document.getElementById('video-preview-iframe');
      const previewStatus = document.getElementById('video-preview-status');

      if (!val) {
        if (!window.attachedVideoBase64 && previewBox) previewBox.classList.add('hidden');
        return;
      }

      const info = extractVideoEmbedInfo(val);
      if (info) {
        if (previewBox) previewBox.classList.remove('hidden');
        if (info.type === 'youtube' || info.type === 'vimeo' || info.type === 'dailymotion') {
          if (previewVid) previewVid.classList.add('hidden');
          if (previewIframe) {
            previewIframe.classList.remove('hidden');
            previewIframe.src = info.embedUrl;
          }
          if (previewStatus) {
            previewStatus.innerHTML = `<span class="text-purple-600 dark:text-purple-400 font-bold">✓ ${info.type.toUpperCase()} Video Linked</span>`;
          }
        } else {
          if (previewIframe) previewIframe.classList.add('hidden');
          if (previewVid) {
            previewVid.classList.remove('hidden');
            previewVid.src = val;
            previewVid.load();
          }
          if (previewStatus) {
            previewStatus.innerHTML = `<span class="text-blue-600 dark:text-blue-400 font-bold">✓ Direct Video Link</span>`;
          }
        }
      }
    };

    urlInput.addEventListener('input', updatePreview);
    urlInput.addEventListener('change', updatePreview);
    urlInput.addEventListener('paste', () => setTimeout(updatePreview, 50));
  }
}

window.handleFileAttachment = function(type) {
  const fileInput = document.getElementById(`feed-${type}-file`);
  const previewBox = document.getElementById(`attachment-${type}-preview`);
  const previewMedia = document.getElementById(`${type}-preview-${type === 'image' ? 'img' : 'vid'}`);

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

  const file = fileInput.files[0];

  if (type === 'image') {
    window.showToast?.("Reading image file from device...", "info");
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      window.attachedImageBase64 = base64Data;
      if (previewMedia) previewMedia.src = base64Data;
      if (previewBox) previewBox.classList.remove('hidden');
      window.soundEngine?.playSuccess?.();
      window.showToast?.("✅ Photo attached! Will be stored in Base64 chunks.", "success");
    };
    reader.readAsDataURL(file);
  } else if (type === 'video') {
    // Video handling: Read full Base64 without any truncation or shortening
    const objectUrl = URL.createObjectURL(file);
    const previewIframe = document.getElementById('video-preview-iframe');
    const previewStatus = document.getElementById('video-preview-status');
    if (previewIframe) previewIframe.classList.add('hidden');
    if (previewMedia) {
      previewMedia.classList.remove('hidden');
      previewMedia.src = objectUrl;
      previewMedia.load();
    }
    if (previewBox) previewBox.classList.remove('hidden');
    if (previewStatus) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      previewStatus.innerHTML = `<span class="text-purple-600 dark:text-purple-400 font-bold">📹 Video Loaded (${sizeMb} MB) — Storing in Chunks</span>`;
    }

    window.showToast?.("Reading video file from device into Base64...", "info");

    const reader = new FileReader();
    reader.onload = function(e) {
      window.attachedVideoBase64 = e.target.result;
      window.soundEngine?.playSuccess?.();
      window.showToast?.("✅ Video ready! Will be stored in Base64 chunks.", "success");
    };
    reader.readAsDataURL(file);
  } else if (type === 'doc') {
    // Document / Resource handling: Read full Base64
    window.attachedDocName = file.name;
    window.attachedDocSize = file.size;
    window.attachedDocMime = file.type || 'application/octet-stream';

    const reader = new FileReader();
    reader.onload = function(e) {
      window.attachedDocBase64 = e.target.result;
      const statusBox = document.getElementById('attachment-doc-status');
      const sizeStr = window.formatFileSize ? window.formatFileSize(file.size) : `${Math.round(file.size / 1024)} KB`;
      if (statusBox) {
        statusBox.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold">📄 Selected: ${file.name} (${sizeStr})</span>`;
      }
      if (previewBox) previewBox.classList.remove('hidden');
      window.soundEngine?.playSuccess?.();
      window.showToast?.(`✅ "${file.name}" ready to post in chunks!`, "success");
    };
    reader.readAsDataURL(file);
  }
};

window.setSampleVideoUrl = function(sampleUrl) {
  const input = document.getElementById('feed-video-url');
  if (input) {
    input.value = sampleUrl;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
};

window.clearAttachment = function(type) {
  const fileInput = document.getElementById(`feed-${type}-file`);
  const urlInput = document.getElementById(`feed-${type}-url`);
  const previewBox = document.getElementById(`attachment-${type}-preview`);
  const previewVid = document.getElementById('video-preview-vid');
  const previewIframe = document.getElementById('video-preview-iframe');
  
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (previewBox) previewBox.classList.add('hidden');
  if (previewVid) previewVid.src = '';
  if (previewIframe) previewIframe.src = '';

  if (type === 'image') {
    window.attachedImageBase64 = null;
  } else if (type === 'video') {
    window.attachedVideoBase64 = null;
  } else if (type === 'doc') {
    window.attachedDocBase64 = null;
    window.attachedDocName = null;
    window.attachedDocSize = null;
    window.attachedDocMime = null;
    const statusBox = document.getElementById('attachment-doc-status');
    if (statusBox) statusBox.innerHTML = '';
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
                <button onclick="window.openChangeCoverModal('devotional', '${doc.id}')" class="text-[10px] font-bold px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full flex items-center gap-1 shadow-2xs cursor-pointer transition-all">
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
              <div onclick="window.openFullDevotionalModal('${doc.id}')" class="md:col-span-1 rounded-2xl overflow-hidden shadow-xs border border-amber-200/60 dark:border-amber-900/40 h-44 cursor-pointer group relative">
                <img src="${d.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${d.title}" />
              </div>
            ` : ''}
            <div class="${d.imageUrl ? 'md:col-span-2' : 'md:col-span-3'} space-y-2">
              <h3 onclick="window.openFullDevotionalModal('${doc.id}')" class="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-zinc-50 tracking-tight cursor-pointer hover:text-amber-600 transition-colors">${d.title}</h3>
              <p class="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed line-clamp-3">${d.body}</p>
              
              <div class="pt-2 flex items-center gap-3">
                <button onclick="window.openFullDevotionalModal('${doc.id}')" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs">
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
              <button onclick="window.openChangeCoverModal('event', '${docId}')" class="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-purple-500/30 cursor-pointer shrink-0">
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
