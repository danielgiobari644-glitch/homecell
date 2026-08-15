// feed.js
// Real-time Community Fellowship Feed & Social Stream

let feedListener = null;
window.currentFeedFilter = 'all';

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

  // Set up smart placeholders for testimony / post types
  const postTypeSelect = document.getElementById('feed-post-type');
  const composerTextarea = document.getElementById('feed-composer-text');
  if (postTypeSelect && composerTextarea) {
    postTypeSelect.addEventListener('change', () => {
      if (postTypeSelect.value === 'testimony') {
        composerTextarea.placeholder = "Share how God is moving in your life today. Let your testimony inspire, encourage, and uplift others! 🙏✨";
      } else {
        composerTextarea.placeholder = "What is God doing in your life today? Share a testimony or praise...";
      }
    });
  }

  // Set up initial filter styles
  window.setFeedFilter(window.currentFeedFilter || 'all');

  // Load Feed Stream
  loadFeedStream();

  // Load Member Journeys in Sidebar
  loadSidebarJourneys();

  // Load Daily Devotionals and Upcoming Events
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

let activeFeedStreams = [];
let activeFeaturedTestimonies = [];
let activeCommunityPosts = [];
let streamsListener = null;
let featuredTestimoniesListener = null;
let currentFeaturedIndex = 0;
let featuredInterval = null;

function initStreamsAndFeaturedListeners() {
  if (!streamsListener) {
    streamsListener = window.db.collection('live_streams')
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snap => {
        activeFeedStreams = [];
        snap.forEach(doc => {
          activeFeedStreams.push({ id: doc.id, ...doc.data() });
        });
        renderFeedWithStreams();
      }, err => console.error("Feed streams listener error:", err));
  }

  if (!featuredTestimoniesListener) {
    featuredTestimoniesListener = window.db.collection('featured_testimonies')
      .orderBy('pinnedAt', 'desc')
      .onSnapshot(snap => {
        activeFeaturedTestimonies = [];
        snap.forEach(doc => {
          activeFeaturedTestimonies.push({ id: doc.id, ...doc.data() });
        });
        renderFeaturedTestimoniesCarousel();
      }, err => console.error("Featured testimonies listener error:", err));
  }
}

function renderFeaturedTestimoniesCarousel() {
  const section = document.getElementById('featured-testimonies-carousel-section');
  const container = document.getElementById('featured-testimonies-carousel-container');
  if (!section || !container) return;

  if (activeFeaturedTestimonies.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  
  if (currentFeaturedIndex >= activeFeaturedTestimonies.length) {
    currentFeaturedIndex = 0;
  }

  const t = activeFeaturedTestimonies[currentFeaturedIndex];
  
  let dateStr = 'Recently Pinned';
  if (t.pinnedAt) {
    const dt = t.pinnedAt.toDate ? t.pinnedAt.toDate() : new Date(t.pinnedAt.seconds * 1000);
    dateStr = dt.toLocaleDateString();
  }

  const isSuperAdmin = window.currentUserRole === 'Super Admin';

  container.innerHTML = `
    <div class="w-full space-y-3 animate-fade-in py-2">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 flex items-center justify-center font-bold text-xs text-amber-800 dark:text-amber-300">
          ${(t.authorName || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <span class="font-extrabold text-xs text-slate-900 dark:text-zinc-100 block">${t.authorName || 'Fellowship Member'}</span>
          <span class="text-[9px] text-slate-400 font-mono">${dateStr}</span>
        </div>
        ${isSuperAdmin ? `
          <button onclick="window.unpinTestimony('${t.id}')" class="ml-auto px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer" title="Unpin Testimony">
            Unpin ⭐
          </button>
        ` : ''}
      </div>
      <p class="text-xs font-serif italic text-slate-700 dark:text-zinc-200 pl-4 border-l-2 border-amber-300 whitespace-pre-wrap leading-relaxed">
        "${t.text}"
      </p>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  if (featuredInterval) clearInterval(featuredInterval);
  if (activeFeaturedTestimonies.length > 1) {
    featuredInterval = setInterval(() => {
      window.nextFeaturedTestimony();
    }, 6000);
  }
}

window.nextFeaturedTestimony = function() {
  if (activeFeaturedTestimonies.length === 0) return;
  currentFeaturedIndex = (currentFeaturedIndex + 1) % activeFeaturedTestimonies.length;
  renderFeaturedTestimoniesCarousel();
};

window.prevFeaturedTestimony = function() {
  if (activeFeaturedTestimonies.length === 0) return;
  currentFeaturedIndex = (currentFeaturedIndex - 1 + activeFeaturedTestimonies.length) % activeFeaturedTestimonies.length;
  renderFeaturedTestimoniesCarousel();
};

window.pinTestimonyToCarousel = function(postId) {
  const post = activeCommunityPosts.find(p => p.id === postId);
  if (!post) return;

  const pinId = `pinned_${postId}`;
  window.db.collection('featured_testimonies').doc(pinId).set({
    id: pinId,
    originalPostId: postId,
    text: post.text,
    authorName: post.authorName,
    authorUid: post.authorUid,
    authorRole: post.authorRole,
    pinnedAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => {
      window.showToast?.("Testimony pinned to Featured Carousel successfully!", "success");
    })
    .catch(err => window.handleFirestoreError(err, 'write', `featured_testimonies/${pinId}`));
};

window.unpinTestimony = function(pinnedId) {
  window.db.collection('featured_testimonies').doc(pinnedId).delete()
    .then(() => {
      window.showToast?.("Testimony removed from Featured Carousel.");
    })
    .catch(err => window.handleFirestoreError(err, 'delete', `featured_testimonies/${pinnedId}`));
};

function loadFeedStream() {
  const container = document.getElementById('community-posts-stream');
  if (!container) return;

  initStreamsAndFeaturedListeners();

  if (feedListener) feedListener();

  feedListener = window.db.collection('community_feed')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      activeCommunityPosts = [];
      snap.forEach(doc => {
        activeCommunityPosts.push({ id: doc.id, ...doc.data() });
      });
      renderFeedWithStreams();
    }, err => window.handleFirestoreError(err, 'list', 'community_feed'));
}

let countdownInterval = null;
function startFeedCountdownTimers() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    activeFeedStreams.forEach(s => {
      let isUpcoming = s.status === 'scheduled';
      if (isUpcoming && s.schedule) {
        const startTime = new Date(s.schedule).getTime();
        const diff = startTime - Date.now();
        
        if (diff <= 0) {
          renderFeedWithStreams();
          return;
        }

        const el = document.getElementById(`feed-countdown-${s.id}`);
        if (el) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);

          const dSpan = el.querySelector('.days');
          const hSpan = el.querySelector('.hours');
          const mSpan = el.querySelector('.minutes');
          const sSpan = el.querySelector('.seconds');

          if (dSpan) dSpan.innerText = String(days).padStart(2, '0');
          if (hSpan) hSpan.innerText = String(hours).padStart(2, '0');
          if (mSpan) mSpan.innerText = String(minutes).padStart(2, '0');
          if (sSpan) sSpan.innerText = String(seconds).padStart(2, '0');
        }
      }
    });
  }, 1000);
}

function renderFeedWithStreams() {
  const container = document.getElementById('community-posts-stream');
  if (!container) return;

  container.innerHTML = '';

  const activeStreams = activeFeedStreams.filter(s => s.streamActive === true || s.status !== 'offline');
  const topStreams = activeStreams.filter(s => s.position === 'top');
  const featuredStreams = activeStreams.filter(s => s.position === 'featured');

  topStreams.forEach(s => {
    const streamWrapper = document.createElement('div');
    streamWrapper.className = "mb-6";
    streamWrapper.innerHTML = getLiveStreamCardHTML(s);
    container.appendChild(streamWrapper);
    
    let isLive = s.status === 'live';
    if (s.status === 'scheduled' && s.schedule && Date.now() >= new Date(s.schedule).getTime()) {
      isLive = true;
    }
    if (isLive && s.streamUrl) {
      setupPlayerInFeed(s.id, s.streamUrl, s.streamType);
    }
  });

  const filteredPosts = activeCommunityPosts.filter(post => {
    if (window.currentFeedFilter && window.currentFeedFilter !== 'all') {
      return post.type === window.currentFeedFilter;
    }
    return true;
  });

  let visibleCount = filteredPosts.length;

  if (visibleCount === 0 && topStreams.length === 0 && featuredStreams.length === 0) {
    let emptyMessage = "No updates found.";
    if (window.currentFeedFilter === 'testimony') {
      emptyMessage = "No testimonies shared here yet. Be the first to share your testimony using the composer above!";
    } else if (window.currentFeedFilter === 'announcement') {
      emptyMessage = "No official announcements have been broadcasted yet.";
    }
    container.innerHTML += `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
        <span class="text-3xl">🕊️</span>
        <p class="font-bold text-slate-700 dark:text-zinc-300">Peace be with you.</p>
        <p class="text-xs max-w-sm mx-auto leading-relaxed">${emptyMessage}</p>
      </div>
    `;
    updateFeedBadge(0);
    return;
  }

  filteredPosts.forEach((post, i) => {
    if (i === 1 && featuredStreams.length > 0) {
      featuredStreams.forEach(s => {
        const streamWrapper = document.createElement('div');
        streamWrapper.className = "mb-6";
        streamWrapper.innerHTML = getLiveStreamCardHTML(s);
        container.appendChild(streamWrapper);
        
        let isLive = s.status === 'live';
        if (s.status === 'scheduled' && s.schedule && Date.now() >= new Date(s.schedule).getTime()) {
          isLive = true;
        }
        if (isLive && s.streamUrl) {
          setupPlayerInFeed(s.id, s.streamUrl, s.streamType);
        }
      });
    }

    const postCard = createFeedPostCard(post);
    container.appendChild(postCard);
  });

  updateFeedBadge(visibleCount);
  startFeedCountdownTimers();

  if (window.lucide) window.lucide.createIcons();
}

function setupPlayerInFeed(streamId, url, streamType) {
  setTimeout(() => {
    const container = document.getElementById(`feed-player-container-${streamId}`);
    if (!container) return;

    if (window.setupUnifiedStreamPlayer) {
      window.setupUnifiedStreamPlayer(container, {
        streamUrl: url,
        protocol: streamType || 'auto',
        autoplay: true,
        controls: true
      });
    }
  }, 100);
}

function getLiveStreamCardHTML(s) {
  const hasThumbnail = !!s.thumbnail;
  
  let isLive = s.status === 'live';
  let isUpcoming = s.status === 'scheduled';
  
  if (isUpcoming && s.schedule) {
    const startTime = new Date(s.schedule).getTime();
    if (Date.now() >= startTime) {
      isLive = true;
      isUpcoming = false;
    }
  }

  let mediaAreaHTML = '';
  if (isLive) {
    if (s.streamUrl) {
      mediaAreaHTML = `
        <div id="feed-player-container-${s.id}" class="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 relative border border-slate-800 shadow-inner">
          <!-- Loaded via setupPlayerInFeed -->
        </div>
      `;
    } else {
      mediaAreaHTML = `
        <div class="aspect-video w-full bg-slate-900/40 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6">
          <i data-lucide="video-off" class="w-8 h-8 mb-2"></i>
          <p class="text-xs font-bold">Waiting for connection...</p>
        </div>
      `;
    }
  } else if (isUpcoming) {
    mediaAreaHTML = `
      <div class="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center min-h-[180px]">
        ${hasThumbnail ? `<img src="${s.thumbnail}" class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />` : ''}
        <div class="relative z-10 space-y-4">
          <div class="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] uppercase font-bold w-max mx-auto tracking-widest">
            ⏳ Scheduled Broadcast
          </div>
          <div class="text-xs text-slate-300 font-medium">Starts in:</div>
          <div id="feed-countdown-${s.id}" class="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            <div class="bg-white/5 backdrop-blur-sm p-2 rounded-xl border border-white/10">
              <span class="days text-lg font-black font-mono block text-blue-400">00</span>
              <span class="text-[8px] uppercase font-bold text-slate-500">Days</span>
            </div>
            <div class="bg-white/5 backdrop-blur-sm p-2 rounded-xl border border-white/10">
              <span class="hours text-lg font-black font-mono block text-blue-400">00</span>
              <span class="text-[8px] uppercase font-bold text-slate-500">Hours</span>
            </div>
            <div class="bg-white/5 backdrop-blur-sm p-2 rounded-xl border border-white/10">
              <span class="minutes text-lg font-black font-mono block text-blue-400">00</span>
              <span class="text-[8px] uppercase font-bold text-slate-500">Mins</span>
            </div>
            <div class="bg-white/5 backdrop-blur-sm p-2 rounded-xl border border-white/10">
              <span class="seconds text-lg font-black font-mono block text-rose-500 animate-pulse">00</span>
              <span class="text-[8px] uppercase font-bold text-slate-500">Secs</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    mediaAreaHTML = `
      <div class="aspect-video w-full bg-slate-900/40 rounded-2xl flex flex-col items-center justify-center text-slate-500 p-6 text-center">
        <i data-lucide="video-off" class="w-8 h-8 mb-2"></i>
        <p class="text-xs font-bold">Broadcast Ended / Offline</p>
      </div>
    `;
  }

  const liveHeaderBadge = isLive 
    ? `<span class="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 animate-pulse rounded-md flex items-center gap-1">🔴 Live Broadcast</span>`
    : `<span class="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 rounded-md flex items-center gap-1">⏳ Upcoming Stream</span>`;

  return `
    <div class="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 rounded-[2.2rem] p-6 shadow-xl space-y-4 relative overflow-hidden transition-all duration-300">
      <div class="absolute -right-24 -top-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
            <i data-lucide="video" class="w-4 h-4 animate-pulse"></i>
          </div>
          <div>
            <span class="text-xs font-black text-slate-300 block uppercase tracking-widest">HomeCell Live</span>
          </div>
        </div>
        ${liveHeaderBadge}
      </div>

      <div class="space-y-1">
        <h4 class="text-lg font-black text-white font-display tracking-tight leading-snug">${s.streamTitle || 'Untitled stream'}</h4>
        <p class="text-xs text-slate-400 leading-relaxed">${s.streamDesc || ''}</p>
      </div>

      ${mediaAreaHTML}
    </div>
  `;
}

function createFeedPostCard(post) {
  const postId = post.id;
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
  const isSuperAdmin = window.currentUserRole === 'Super Admin';

  const postCard = document.createElement('div');
  if (isTestimony) {
    postCard.className = "bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-950/40 rounded-3xl p-6 shadow-sm space-y-4 transition-all hover:border-emerald-200 dark:hover:border-zinc-800 border-l-4 border-l-emerald-500 dark:border-l-emerald-600";
  } else if (isAnnouncement) {
    postCard.className = "bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-950 bg-purple-50/5 dark:bg-purple-950/5 rounded-3xl p-6 shadow-sm space-y-4 transition-all hover:border-purple-300 dark:hover:border-purple-900";
  } else {
    postCard.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700";
  }

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
      <div class="w-10 h-10 rounded-full text-slate-700 dark:text-zinc-300 font-bold flex items-center justify-center text-sm font-display shadow-inner ${
        isTestimony 
          ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
          : 'bg-slate-100 dark:bg-zinc-800'
      }">
        ${(post.authorName || '?').charAt(0).toUpperCase()}
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <span class="font-black text-sm text-slate-900 dark:text-zinc-100">${post.authorName}</span>
          <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">${post.authorRole}</span>
          ${isTestimony ? `<span class="text-[10px] animate-bounce">🕊️</span>` : ''}
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
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/20">
            ✨ Praise Testimony 🙏
          </span>
        ` : ''}

        ${isTestimony && isSuperAdmin ? `
          <button onclick="window.pinTestimonyToCarousel('${postId}')" class="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer" title="Pin to Featured Testimonies">
            <i data-lucide="star" class="w-4 h-4 fill-current"></i>
          </button>
        ` : ''}

        ${canDelete ? `
          <button onclick="deleteFeedPost('${postId}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer" title="Delete Post">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Content Body -->
    ${isTestimony ? `
      <div class="relative bg-slate-50/50 dark:bg-zinc-800/20 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800/40">
        <!-- Quote watermark decoration -->
        <div class="absolute -top-3 left-2 text-4xl text-emerald-300/20 dark:text-emerald-700/20 font-serif leading-none select-none">“</div>
        <div class="text-[15px] font-serif italic text-slate-800 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed pl-5 pr-2">
          ${post.text}
        </div>
        <div class="absolute right-6 top-6 opacity-[0.03] text-emerald-600 dark:text-emerald-400 pointer-events-none">
          <i data-lucide="sparkles" class="w-16 h-16"></i>
        </div>
      </div>
    ` : `
      <div class="text-sm text-slate-700 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">${post.text}</div>
    `}

    <!-- Attachments -->
    ${getMediaHTML(post.imageUrl, post.videoUrl)}

    <!-- Actions Footer bar -->
    <div class="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
      ${isTestimony ? `
        <button onclick="toggleLikePost('${postId}')" class="flex items-center gap-2 text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer ${
          isLiked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400'
        }">
          <span class="text-base">${isLiked ? '🙌' : '🙏'}</span>
          <span>${isLiked ? 'Hallelujah!' : 'Amen'} (${likesCount})</span>
        </button>
      ` : `
        <button onclick="toggleLikePost('${postId}')" class="flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
          isLiked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400'
        }">
          <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i>
          <span>${likesCount} Likes</span>
        </button>
      `}

      <button onclick="toggleCommentsSection('${postId}')" class="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 cursor-pointer">
        <i data-lucide="message-circle" class="w-4 h-4"></i>
        <span>${comments.length} Comments</span>
      </button>
    </div>

    <!-- Comments Section (collapsible) -->
    <div id="comments-pane-${postId}" class="hidden space-y-4 pt-4 border-t border-slate-50 dark:border-zinc-800/40">
      <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
        ${commentsHTML || '<p class="text-center text-[11px] text-slate-400">No comments yet. Be the first to share support!</p>'}
      </div>

      <form onsubmit="submitPostComment(event, '${postId}')" class="flex gap-2">
        <input type="text" placeholder="Write a comment of support..." required class="flex-grow text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-105 cursor-pointer">
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
    let typeLabel = "items";
    if (window.currentFeedFilter === 'testimony') typeLabel = "testimonies";
    else if (window.currentFeedFilter === 'announcement') typeLabel = "announcements";
    badge.innerHTML = `<span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span> ${visibleCount} ${typeLabel} filtered`;
  }
}

let sidebarJourneys = [];
let activeSidebarJourneyIndex = 0;
let sidebarJourneyInterval = null;

function renderActiveSidebarJourney() {
  const sidebar = document.getElementById('sidebar-testimonies-list');
  const navPanel = document.getElementById('sidebar-journeys-nav');
  if (!sidebar) return;

  if (sidebarJourneys.length === 0) {
    sidebar.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-2">No praise testimonies published yet.</p>`;
    if (navPanel) navPanel.classList.add('hidden');
    return;
  }

  if (navPanel) {
    if (sidebarJourneys.length > 1) {
      navPanel.classList.remove('hidden');
    } else {
      navPanel.classList.add('hidden');
    }
  }

  if (activeSidebarJourneyIndex >= sidebarJourneys.length) {
    activeSidebarJourneyIndex = 0;
  }

  const u = sidebarJourneys[activeSidebarJourneyIndex];
  const displayName = u.authorName || u.displayName || 'Fellowship Member';
  const displayRole = u.authorRole || u.coordinates || 'Member';
  const testimonyText = u.text || u.bio || '';
  
  sidebar.innerHTML = `
    <div class="p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800/60 space-y-2 animate-fade-in transition-all">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center font-display">
          ${displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 block">${displayName}</span>
          <span class="text-[9px] font-mono text-slate-400">${displayRole}</span>
        </div>
      </div>
      <p class="text-xs text-slate-600 dark:text-zinc-300 italic font-medium leading-relaxed">"${testimonyText}"</p>
    </div>
  `;

  // Stagger or refresh automatic slide rotation
  if (sidebarJourneyInterval) clearInterval(sidebarJourneyInterval);
  if (sidebarJourneys.length > 1) {
    sidebarJourneyInterval = setInterval(() => {
      window.nextSidebarJourney();
    }, 8000);
  }
}

window.nextSidebarJourney = function() {
  if (sidebarJourneys.length === 0) return;
  activeSidebarJourneyIndex = (activeSidebarJourneyIndex + 1) % sidebarJourneys.length;
  renderActiveSidebarJourney();
};

window.prevSidebarJourney = function() {
  if (sidebarJourneys.length === 0) return;
  activeSidebarJourneyIndex = (activeSidebarJourneyIndex - 1 + sidebarJourneys.length) % sidebarJourneys.length;
  renderActiveSidebarJourney();
};

function loadSidebarJourneys() {
  const sidebar = document.getElementById('sidebar-testimonies-list');
  if (!sidebar) return;

  window.db.collection('community_feed')
    .where('type', '==', 'testimony')
    .onSnapshot(snap => {
      sidebarJourneys = [];
      snap.forEach(doc => {
        const u = doc.data();
        if (u.text && u.text.trim() !== '') {
          sidebarJourneys.push(u);
        }
      });
      // Sort client-side by createdAt descending to avoid composite index requirements
      sidebarJourneys.sort((a, b) => {
        const tA = (a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds : 0;
        const tB = (b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds : 0;
        return tB - tA;
      });
      // Preserve current slide position if possible
      if (activeSidebarJourneyIndex >= sidebarJourneys.length) {
        activeSidebarJourneyIndex = 0;
      }
      renderActiveSidebarJourney();
    }, err => {
      console.warn("Error loading sidebar testimonies:", err);
      sidebar.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-2">No praise testimonies published yet.</p>`;
    });
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

  const imageUrlVal = document.getElementById('feed-image-url')?.value.trim() || window.attachedImageBase64;
  const videoUrlVal = document.getElementById('feed-video-url')?.value.trim() || window.attachedVideoBase64;

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
    authorName: window.currentUserProfile?.displayName || user.email || 'Fellowship Member',
    authorRole: window.currentUserRole || 'Member',
    imageUrl: imageUrlVal || null,
    videoUrl: videoUrlVal || null,
    likesCount: 0,
    likes: {},
    comments: [],
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => {
      window.showToast?.("Feed post published successfully.");
      document.getElementById('feed-composer-text').value = '';
      if (isAnnCheckbox) isAnnCheckbox.checked = false;

      // Trigger feed post streak increase
      setTimeout(() => {
        window.incrementUserStreak?.(`sharing a ${finalType} with the cohort`);
      }, 1000);

      // Reset attachment elements
      window.clearAttachment?.('image');
      window.clearAttachment?.('video');
      document.getElementById('attachment-image-box')?.classList.add('hidden');
      document.getElementById('attachment-video-box')?.classList.add('hidden');
      window.toggleFeedComposer?.(false);

      // Trigger standard background push notification
      if (window.sendPushNotification) {
        const titleStr = finalType === 'announcement' ? '📢 Official Announcement' : `🙏 New Testimony from ${window.currentUserProfile?.displayName || user.email}`;
        const snippet = textVal.length > 80 ? textVal.substring(0, 80) + '...' : textVal;
        
        if (finalType === 'testimony') {
          // Notify Super Admins offline/off-app of new testimonies to review/moderate
          window.sendPushNotification(
            "🙏 New Testimony Published!",
            `Member ${window.currentUserProfile?.displayName || user.email} shared: "${snippet}"`,
            '/?tab=feed',
            "Super Admin"
          );
        }

        // Broadcast to other members, excluding the author themselves
        window.sendPushNotification(
          titleStr,
          snippet,
          '/?tab=feed',
          null, // targetRole
          null, // targetUid
          user.uid // excludeUid: exclude the author of the post!
        );
      }
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
    authorName: window.currentUserProfile?.displayName || user.email || 'Fellowship Member',
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

// Helper to render picture and video attachments safely
function getMediaHTML(imageUrl, videoUrl) {
  let html = '';
  if (imageUrl) {
    html += `
      <div class="rounded-2xl overflow-hidden max-h-[450px] border border-slate-100 dark:border-zinc-800 shadow-sm mt-3 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <img src="${imageUrl}" class="w-full h-auto max-h-[450px] object-contain" alt="Attached picture" referrerPolicy="no-referrer" />
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
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
    } catch (e) {
      console.warn("Failed parsing YT link:", e);
    }

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

// Media uploads & attachments controllers
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
  if (file.size > 4 * 1024 * 1024) {
    window.showToast?.("File too large. Choose a file smaller than 4MB.", "error");
    fileInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    if (type === 'image') {
      window.attachedImageBase64 = base64Data;
      if (previewMedia) previewMedia.src = base64Data;
    } else {
      window.attachedVideoBase64 = base64Data;
      if (previewMedia) {
        previewMedia.src = base64Data;
        previewMedia.load();
      }
    }
    if (previewBox) previewBox.classList.remove('hidden');
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
  const toggleBtnIcon = document.getElementById('btn-toggle-feed-composer-icon');
  if (!container) return;

  const shouldShow = forceShow !== undefined ? forceShow : container.classList.contains('hidden');
  if (shouldShow) {
    container.classList.remove('hidden');
    if (toggleBtnText) toggleBtnText.innerText = "Close Post Composer";
    if (toggleBtnIcon) toggleBtnIcon.setAttribute('data-lucide', 'chevron-up');
    const txt = document.getElementById('feed-composer-text');
    if (txt) txt.focus();
  } else {
    container.classList.add('hidden');
    if (toggleBtnText) toggleBtnText.innerText = "Create a Post";
    if (toggleBtnIcon) toggleBtnIcon.setAttribute('data-lucide', 'edit-3');
  }
  if (window.lucide) window.lucide.createIcons();
};

window.scrollToComposerAndSelectTestimony = function() {
  window.toggleFeedComposer(true);
  const container = document.getElementById('feed-composer-form-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const select = document.getElementById('feed-post-type');
    if (select) {
      select.value = 'testimony';
    }
    const txt = document.getElementById('feed-composer-text');
    if (txt) {
      txt.focus();
      txt.placeholder = "Write your real, authentic praise testimony here to inspire the saints...";
    }
  } else {
    // If we are not on the feed tab, switch to feed tab first!
    const btn = document.getElementById('tab-feed-btn');
    if (btn) {
      btn.click();
      setTimeout(() => {
        window.scrollToComposerAndSelectTestimony();
      }, 300);
    }
  }
};

// Expose globally
window.initFeedEngine = initFeedEngine;
window.publishToFeed = publishToFeed;
window.toggleLikePost = toggleLikePost;
window.toggleCommentsSection = toggleCommentsSection;
window.submitPostComment = submitPostComment;
window.deleteFeedPost = deleteFeedPost;
window.getMediaHTML = getMediaHTML;
window.scrollToComposerAndSelectTestimony = window.scrollToComposerAndSelectTestimony;

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

      window.devotionalsCache = window.devotionalsCache || {};

      snap.forEach(doc => {
        const d = doc.data();
        d.id = doc.id;
        window.devotionalsCache[doc.id] = d;

        const card = document.createElement('div');
        card.className = "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-[2rem] p-6 shadow-sm space-y-4 animate-fade-in relative overflow-hidden";
        
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
            <span class="text-[10px] font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
              Spiritual Food
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            ${d.imageUrl ? `
              <div onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" class="md:col-span-1 rounded-2xl overflow-hidden shadow-sm border border-amber-200/60 dark:border-amber-900/40 h-44 cursor-pointer group">
                <img src="${d.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${d.title}" />
              </div>
            ` : ''}
            <div class="${d.imageUrl ? 'md:col-span-2' : 'md:col-span-3'} space-y-2">
              <h3 onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" class="text-xl font-black font-display text-slate-900 dark:text-zinc-50 tracking-tight cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors">${d.title}</h3>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-800/80 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                <i data-lucide="book-open" class="w-3.5 h-3.5"></i> ${d.scripture}
              </div>
              <p class="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed line-clamp-3 whitespace-pre-wrap">${d.body}</p>
              
              <div class="pt-2">
                <button onclick="window.openFullDevotionalModal(window.devotionalsCache['${doc.id}'])" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md">
                  <span>Read Full Devotional</span>
                  <i data-lucide="book-open-check" class="w-4 h-4"></i>
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
    .limit(3)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) return;

      const section = document.createElement('div');
      section.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-4 animate-fade-in";
      
      let eventsHTML = '';
      snap.forEach(doc => {
        const ev = doc.data();
        const formattedDate = window.formatEventDatesDisplay ? window.formatEventDatesDisplay(ev) : new Date(ev.eventDate).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        let extraDatesBadges = '';
        if (ev.extraDates && Array.isArray(ev.extraDates) && ev.extraDates.length > 0) {
          extraDatesBadges = `
            <div class="flex flex-wrap gap-1 mt-1">
              ${ev.extraDates.map(d => `<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">📅 ${new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>`).join('')}
            </div>
          `;
        }

        eventsHTML += `
          <div class="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-purple-300 dark:hover:border-purple-800 transition-all">
            <div class="flex items-center gap-4">
              ${ev.imageUrl ? `
                <img src="${ev.imageUrl}" class="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shadow-2xs shrink-0" alt="${ev.title}" />
              ` : `
                <div class="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-purple-200 dark:border-purple-800">
                  <i data-lucide="calendar" class="w-6 h-6"></i>
                </div>
              `}
              <div class="space-y-1">
                <span class="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 inline-block">
                  📅 ${formattedDate}
                </span>
                <h4 class="font-black text-slate-900 dark:text-zinc-100 text-base font-display">${ev.title}</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">${ev.description}</p>
                <span class="text-[10px] font-semibold text-slate-400 block">📍 ${ev.location}</span>
                ${extraDatesBadges}
              </div>
            </div>
          </div>
        `;
      });

      section.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <h3 class="font-black font-display text-slate-900 dark:text-zinc-100 text-sm uppercase tracking-wider flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <i data-lucide="calendar-heart" class="w-4.5 h-4.5"></i> Upcoming Events
          </h3>
          <span class="text-xs font-bold text-slate-400">Community Schedule</span>
        </div>
        <div class="space-y-3">
          ${eventsHTML}
        </div>
      `;

      container.appendChild(section);
      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Feed events listener error:", err));
}
