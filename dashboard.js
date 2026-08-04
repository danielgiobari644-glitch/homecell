// dashboard.js
// Dashboard features, countdown timer, stats, quotes, and stream banner

let chatUnsubscribe = null;
let simulatedChatInterval = null;
let viewerCountInterval = null;

const BIBLE_QUOTES = [
  { text: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalms 119:105 (KJV)" },
  { text: "For where two or three are gathered together in my name, there am I in the midst of them.", ref: "Matthew 18:20 (KJV)" },
  { text: "And let us consider one another to provoke unto love and to good works: Not forsaking the assembling of ourselves.", ref: "Hebrews 10:24-25 (KJV)" },
  { text: "Pray without ceasing. In every thing give thanks: for this is the will of God.", ref: "1 Thessalonians 5:17-18 (KJV)" },
  { text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee.", ref: "Deuteronomy 31:6 (KJV)" },
  { text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.", ref: "Psalms 91:1 (KJV)" },
  { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", ref: "Proverbs 3:5 (KJV)" }
];

function initDashboard() {
  startCountdownTicker();
  startLiveClock();
  refreshScriptureQuote();
  syncDashboardStats();
  syncSystemConfigs();
  syncStreakChampionship();
  syncDashboardDailyDevotionals();
  syncDashboardUpcomingEvents();
}

function startLiveClock() {
  const timeEl = document.getElementById('live-time-clock');
  const dateEl = document.getElementById('live-date-clock');
  if (!timeEl || !dateEl) return;

  function update() {
    const now = new Date();
    timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dateEl.innerText = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  update();
  setInterval(update, 1000);
}

function startCountdownTicker() {
  function update() {
    const now = new Date();
    // Next Saturday 6:00 PM (18:00)
    let target = new Date();
    const dayOfWeek = 6; // Saturday
    target.setDate(now.getDate() + (dayOfWeek - now.getDay() + 7) % 7);
    target.setHours(18, 0, 0, 0);

    if (now >= target) {
      target.setDate(target.getDate() + 7);
    }

    const diff = target - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const dEl = document.getElementById('countdown-days');
    const hEl = document.getElementById('countdown-hours');
    const mEl = document.getElementById('countdown-minutes');
    const sEl = document.getElementById('countdown-seconds');

    if (dEl) dEl.innerText = String(days).padStart(2, '0');
    if (hEl) hEl.innerText = String(hours).padStart(2, '0');
    if (mEl) mEl.innerText = String(minutes).padStart(2, '0');
    if (sEl) sEl.innerText = String(seconds).padStart(2, '0');
  }
  update();
  setInterval(update, 1000);
}

function refreshScriptureQuote() {
  const quoteText = document.getElementById('dashboard-quote-text');
  const quoteRef = document.getElementById('dashboard-quote-ref');
  if (!quoteText || !quoteRef) return;

  const randomIdx = Math.floor(Math.random() * BIBLE_QUOTES.length);
  const selected = BIBLE_QUOTES[randomIdx];

  quoteText.innerText = `"${selected.text}"`;
  quoteRef.innerText = selected.ref;
}

function syncDashboardStats() {
  const usersEl = document.getElementById('stat-active-users');
  const cellsEl = document.getElementById('stat-active-cells');
  const prayersEl = document.getElementById('stat-active-prayers');

  if (usersEl) {
    window.db.collection('users').onSnapshot(snap => {
      usersEl.innerText = snap.size;
    }, err => window.handleFirestoreError(err, 'list', 'users'));
  }

  if (cellsEl) {
    window.db.collection('cells').where('status', '==', 'active').onSnapshot(snap => {
      cellsEl.innerText = snap.size;
    }, err => window.handleFirestoreError(err, 'list', 'cells'));
  }

  if (prayersEl) {
    window.db.collection('prayer_petitions').onSnapshot(snap => {
      prayersEl.innerText = snap.size;
    }, err => window.handleFirestoreError(err, 'list', 'prayer_petitions'));
  }
}

function syncSystemConfigs() {
  const phoneVal = document.getElementById('desk-phone-val');
  const phoneLink = document.getElementById('desk-phone');
  const waVal = document.getElementById('desk-whatsapp-val');
  const waLink = document.getElementById('desk-whatsapp');
  const emailVal = document.getElementById('desk-email-val');
  const emailLink = document.getElementById('desk-email');

  // Sync Support Channels
  window.db.collection('system_configs').doc('contacts').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (phoneVal) phoneVal.innerText = data.phone || '+234-803-000-0000';
      if (phoneLink) phoneLink.href = `tel:${data.phone || ''}`;
      if (waVal && data.whatsapp) waVal.innerText = "Connect on WhatsApp";
      if (waLink) waLink.href = data.whatsapp || '#';
      if (emailVal) emailVal.innerText = data.email || 'support@homecell.com';
      if (emailLink) emailLink.href = `mailto:${data.email || ''}`;
    } else {
      // Seed default contacts configuration if missing
      if (window.currentUserRole === 'Super Admin') {
        window.db.collection('system_configs').doc('contacts').set({
          phone: '+234-803-123-4567',
          whatsapp: 'https://wa.me/2348031234567',
          email: 'support@homecell.com'
        }).catch(err => console.error("Error seeding support contacts: ", err));
      }
    }
  }, err => console.warn("Desk setup config read limit:", err));

// Universal Stream Player Setup Engine
window.setupStreamPlayer = function(url, type) {
  const container = document.getElementById('stream-player-container');
  if (!container) return;
  container.innerHTML = '';

  if (!url) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
        <i data-lucide="video-off" class="w-10 h-10 text-slate-400"></i>
        <p class="text-xs font-bold">Broadcast Offline</p>
        <p class="text-[10px] text-slate-400">No active stream URL configured.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const isHls = type === 'hls' || url.includes('.m3u8') || url.includes('/hls/');

  if (isHls) {
    const video = document.createElement('video');
    video.id = 'universal-stream-player';
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.className = 'w-full h-full rounded-2xl bg-slate-950 focus:outline-none';
    container.appendChild(video);

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
        video.play().catch(e => console.log("Auto-play blocked: ", e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', function() {
        video.play().catch(e => console.log("Auto-play blocked: ", e));
      });
    } else {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center text-amber-500 space-y-2">
          <i data-lucide="alert-triangle" class="w-10 h-10"></i>
          <p class="text-xs font-bold">HLS Stream Unsupported</p>
          <p class="text-[10px] text-slate-400">Your browser does not support HLS video playback natively.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  } else if (type === 'rtmp') {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center text-purple-400 space-y-3">
        <div class="p-3 bg-purple-500/10 rounded-full">
          <i data-lucide="hard-drive" class="w-8 h-8"></i>
        </div>
        <div>
          <p class="text-xs font-bold">RTMP Broadcast Active</p>
          <p class="text-[10px] text-slate-400 max-w-sm mt-1">To watch this feed, connect your media client (VLC, OBS) directly to our RTMP ingestion link below.</p>
        </div>
        <div class="flex items-center gap-2 bg-slate-900 border border-zinc-800 rounded-xl px-3 py-1.5 w-full max-w-md">
          <input type="text" readonly value="${url}" class="bg-transparent text-slate-300 text-[10px] focus:outline-none flex-grow" />
          <button onclick="navigator.clipboard.writeText('${url}'); window.showToast?.('RTMP link copied!');" class="p-1 text-purple-400 hover:text-purple-300 cursor-pointer">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  } else if (type === 'webrtc') {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center text-blue-400 space-y-3">
        <div class="p-3 bg-blue-500/10 rounded-full">
          <i data-lucide="zap" class="w-8 h-8"></i>
        </div>
        <div>
          <p class="text-xs font-bold">WebRTC Ultra-Low Latency Active</p>
          <p class="text-[10px] text-slate-400 max-w-sm mt-1">Whip/Whep client broadcast is running. You can stream this feed with low latency.</p>
        </div>
        <div class="flex items-center gap-2 bg-slate-900 border border-zinc-800 rounded-xl px-3 py-1.5 w-full max-w-md">
          <input type="text" readonly value="${url}" class="bg-transparent text-slate-300 text-[10px] focus:outline-none flex-grow" />
          <button onclick="navigator.clipboard.writeText('${url}'); window.showToast?.('WebRTC stream URL copied!');" class="p-1 text-blue-400 hover:text-blue-300 cursor-pointer">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  } else {
    // Treat as iframe / embed
    const iframe = document.createElement('iframe');
    iframe.id = 'stream-iframe';
    iframe.className = 'w-full h-full rounded-2xl overflow-hidden bg-slate-950 border-none';
    iframe.src = url;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
  }
};

  // Real Stream Presence Viewer Tracking
  let streamPresenceInterval = null;
  let streamViewerUnsubscribe = null;

  window.startRealStreamPresence = function(streamId) {
    const user = window.firebase?.auth()?.currentUser;
    const uid = user ? user.uid : (window.anonPresenceId || (window.anonPresenceId = 'anon_' + Math.random().toString(36).substring(2, 9)));
    const targetStreamId = streamId || 'global';

    const docRef = window.db.collection('stream_viewers').doc(`${targetStreamId}_${uid}`);

    const updatePresence = () => {
      docRef.set({
        streamId: targetStreamId,
        uid: uid,
        userName: window.currentUserProfile?.displayName || user?.email || 'Viewer',
        timestamp: Date.now()
      }, { merge: true }).catch(err => console.warn("Stream presence update failed:", err));
    };

    updatePresence();
    if (streamPresenceInterval) clearInterval(streamPresenceInterval);
    streamPresenceInterval = setInterval(updatePresence, 10000);

    if (streamViewerUnsubscribe) streamViewerUnsubscribe();
    streamViewerUnsubscribe = window.db.collection('stream_viewers')
      .where('streamId', '==', targetStreamId)
      .onSnapshot(snap => {
        let count = 0;
        const now = Date.now();
        snap.forEach(doc => {
          const data = doc.data();
          if (data.timestamp && (now - data.timestamp < 30000)) {
            count++;
          }
        });

        const el = document.getElementById('stream-viewer-count');
        if (el) el.innerText = `${Math.max(count, 1)} Watching Live`;

        const feedEl = document.getElementById(`feed-viewer-count-${targetStreamId}`);
        if (feedEl) feedEl.innerText = `${Math.max(count, 1)} Watching Live`;
      }, err => console.warn("Viewer presence snapshot error:", err));
  };

  window.stopRealStreamPresence = function(streamId) {
    if (streamPresenceInterval) {
      clearInterval(streamPresenceInterval);
      streamPresenceInterval = null;
    }
    if (streamViewerUnsubscribe) {
      streamViewerUnsubscribe();
      streamViewerUnsubscribe = null;
    }
  };

  // Sync Live stream broadcast banner & live stream dashboard pane
  const streamBanner = document.getElementById('live-broadcast-banner');
  const bannerTitle = document.getElementById('broadcast-banner-title');
  const streamPane = document.getElementById('live-stream-pane');
  const paneTitle = document.getElementById('stream-pane-title');
  const paneDesc = document.getElementById('stream-pane-desc');

  window.db.collection('system_configs').doc('stream').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.streamActive) {
        if (streamBanner) {
          streamBanner.classList.remove('hidden');
          if (bannerTitle) bannerTitle.innerText = `Gathering Live Now: ${data.streamTitle || 'Tune In!'}`;
        }
        if (streamPane) {
          streamPane.classList.remove('hidden');
          if (paneTitle) paneTitle.innerText = data.streamTitle || '';
          if (paneDesc) paneDesc.innerText = data.streamDesc || '';
          window.setupStreamPlayer(data.streamUrl, data.streamType || 'hls');

          // Start real presence tracking for live viewers
          window.startRealStreamPresence(data.id || 'global');

          // Sync dynamic likes count
          const likesEl = document.getElementById('stream-likes-count');
          if (likesEl) {
            likesEl.innerText = `${data.likesCount !== undefined ? data.likesCount : 0} likes`;
          }

          // Show or hide Super Admin stop button
          const stopContainer = document.getElementById('superadmin-stop-stream-container');
          if (stopContainer) {
            if (window.currentUserRole === 'Super Admin') {
              stopContainer.classList.remove('hidden');
            } else {
              stopContainer.classList.add('hidden');
            }
          }

          // Initialize chat real-time sync with no mock simulators
          syncLiveChat();
        }
      } else {
        if (streamBanner) streamBanner.classList.add('hidden');
        if (streamPane) streamPane.classList.add('hidden');
        const container = document.getElementById('stream-player-container');
        if (container) container.innerHTML = '';

        window.stopRealStreamPresence('global');

        // Disconnect and cleanup chat listeners
        if (chatUnsubscribe) {
          chatUnsubscribe();
          chatUnsubscribe = null;
        }
      }
    } else {
      if (window.currentUserRole === 'Super Admin') {
        window.db.collection('system_configs').doc('stream').set({
          streamActive: false,
          streamTitle: 'Saturday Live Fellowship',
          streamDesc: 'Gathering together live to share, connect, and grow.',
          streamUrl: '',
          streamType: 'hls',
          likesCount: 0
        }).catch(err => console.error("Error seeding stream config: ", err));
      }
    }
  }, err => console.warn("Live stream config read limit:", err));

  // Sync Stream Replays Archive
  syncStreamReplays();
}

// Active user streak synchronization and championship leader identification
let currentChampionDoc = null;

function syncStreakChampionship() {
  const user = window.firebase.auth().currentUser;
  if (!user) return;

  // Real-time synchronization of the current logged-in user's streak
  window.db.collection('users').doc(user.uid).onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      const currentStreak = data.streak || 0;
      
      const countEl = document.getElementById('my-streak-counter');
      const countBubble = document.getElementById('my-streak-counter-bubble');
      const reasonEl = document.getElementById('my-streak-reason');
      const checkinBtn = document.getElementById('btn-devotional-checkin');

      if (countEl) countEl.innerText = currentStreak;
      if (countBubble) countBubble.innerText = currentStreak;
      if (reasonEl) reasonEl.innerText = data.lastStreakReason || 'Welcome back to the fellowship!';
      
      // Check if they completed devotional check-in today
      const todayStr = new Date().toDateString();
      const warningBox = document.getElementById('streak-loss-warning-box');
      const warningCount = document.getElementById('warning-streak-count');

      if (data.lastCheckinDate === todayStr) {
        if (checkinBtn) {
          checkinBtn.innerText = "☀️ Today's Devotional Complete ✅";
          checkinBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
          checkinBtn.classList.add('bg-zinc-200', 'dark:bg-zinc-800', 'text-slate-400', 'cursor-not-allowed');
          checkinBtn.disabled = true;
        }
        if (warningBox) warningBox.classList.add('hidden');
      } else {
        if (checkinBtn) {
          checkinBtn.innerText = "☀️ Complete Daily Devotional Check-in";
          checkinBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
          checkinBtn.classList.remove('bg-zinc-200', 'dark:bg-zinc-800', 'text-slate-400', 'cursor-not-allowed');
          checkinBtn.disabled = false;
        }
        
        // Remind user their streak is being lost if they have a streak (> 0) to protect
        if (currentStreak > 0) {
          if (warningBox) warningBox.classList.remove('hidden');
          if (warningCount) warningCount.innerText = currentStreak;
          
          // Trigger a polite warning toast to grab attention
          if (!window.hasShownStreakWarningToday) {
            window.hasShownStreakWarningToday = true;
            setTimeout(() => {
              window.showToast?.(`⚠️ Alert: Complete your devotion to preserve your ${currentStreak}-day fire streak!`, "warning");
            }, 1000);
          }
        } else {
          if (warningBox) warningBox.classList.add('hidden');
        }
      }
    }
  }, err => console.warn("My streak read limit:", err));

  // Identify who holds the maximum streak currently in the assembly
  window.db.collection('users').orderBy('streak', 'desc').limit(1).onSnapshot(snap => {
    if (!snap.empty) {
      const champDoc = snap.docs[0];
      const champData = champDoc.data();
      currentChampionDoc = { id: champDoc.id, ...champData };

      const champNameEl = document.getElementById('champ-name');
      const champStreakValEl = document.getElementById('champ-streak-val');
      const congratsTitleEl = document.getElementById('champ-congrats-title');
      const congratsDescEl = document.getElementById('champ-congrats-desc');
      const arenaEl = document.getElementById('streak-championship-arena');
      
      const champSubHeaderEl = document.getElementById('champ-sub-header');
      const champStreakDescEl = document.getElementById('champ-streak-desc');
      const champCongratsCardEl = document.getElementById('champ-congrats-card');
      const champCongratsIconBoxEl = document.getElementById('champ-congrats-icon-box');
      const champMultipliersTitleEl = document.getElementById('champ-multipliers-title');
      const champMultiplierCard1 = document.getElementById('champ-multiplier-card-1');
      const champMultiplierCard2 = document.getElementById('champ-multiplier-card-2');
      const champMultiplierCard3 = document.getElementById('champ-multiplier-card-3');
      const btnCheerChamp = document.getElementById('btn-cheer-champ');

      if (champNameEl) champNameEl.innerText = champData.displayName || champData.email;
      if (champStreakValEl) champStreakValEl.innerText = `${champData.streak || 0} days`;

      // If the current logged in user IS the reigning champion
      if (champDoc.id === user.uid) {
        if (arenaEl) {
          arenaEl.className = "lg:col-span-2 bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 text-white border border-amber-300/40 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden glow-amber-active animate-fade-in";
        }
        if (champSubHeaderEl) {
          champSubHeaderEl.className = "flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-100 transition-colors duration-300";
        }
        if (champNameEl) {
          champNameEl.className = "text-3xl sm:text-4xl font-black font-display tracking-tight text-white drop-shadow-sm transition-all duration-300 animate-bounce-slow";
        }
        if (champStreakDescEl) {
          champStreakDescEl.className = "text-sm text-amber-50 font-medium mt-1 transition-colors duration-300";
        }
        if (champStreakValEl) {
          champStreakValEl.className = "font-black text-white underline decoration-amber-300 decoration-2 underline-offset-4 transition-all duration-300";
        }
        if (champCongratsCardEl) {
          champCongratsCardEl.className = "bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex items-center gap-4 shadow-lg ring-1 ring-white/10 transition-all duration-500 relative z-10";
        }
        if (champCongratsIconBoxEl) {
          champCongratsIconBoxEl.className = "w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl shadow-inner transition-all duration-300";
        }
        if (congratsTitleEl) {
          congratsTitleEl.innerText = "👑 YOU are the reigning Fellowship Streak Champion!";
          congratsTitleEl.className = "text-sm font-bold text-white uppercase tracking-wider transition-all duration-300";
        }
        if (congratsDescEl) {
          congratsDescEl.innerText = "Outstanding! Your constant spiritual devotion shines as a beautiful beacon of hope for the entire cohort! Keep pushing!";
          congratsDescEl.className = "text-xs text-amber-50 mt-1 leading-relaxed transition-all duration-300";
        }
        if (champMultipliersTitleEl) {
          champMultipliersTitleEl.className = "text-[10px] font-bold text-amber-200 uppercase tracking-widest block transition-colors duration-300";
        }
        const mCards = [champMultiplierCard1, champMultiplierCard2, champMultiplierCard3];
        mCards.forEach(c => {
          if (c) c.className = "p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 text-center space-y-1 transition-all duration-300 hover:-translate-y-0.5";
        });
        if (btnCheerChamp) {
          btnCheerChamp.innerText = "✨ Rejoice in Victory";
          btnCheerChamp.setAttribute('onclick', 'window.triggerConfetti ? window.triggerConfetti() : null');
          btnCheerChamp.className = "bg-gradient-to-r from-amber-300 to-yellow-500 hover:from-amber-400 hover:to-yellow-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-yellow-500/30 flex items-center gap-2 relative z-10";
        }
      } else {
        // Render regular card design for other users
        if (arenaEl) {
          arenaEl.className = "lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-zinc-950/40 dark:to-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden glow-subtle-warm transition-all duration-500";
        }
        if (champSubHeaderEl) {
          champSubHeaderEl.className = "flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 transition-colors duration-300";
        }
        if (champNameEl) {
          champNameEl.className = "text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-zinc-50 transition-all duration-300";
        }
        if (champStreakDescEl) {
          champStreakDescEl.className = "text-sm text-slate-600 dark:text-zinc-300 mt-1 transition-colors duration-300";
        }
        if (champStreakValEl) {
          champStreakValEl.className = "font-extrabold text-orange-600 dark:text-orange-400 transition-all duration-300";
        }
        if (champCongratsCardEl) {
          champCongratsCardEl.className = "bg-white/85 dark:bg-zinc-900/80 backdrop-blur border border-orange-100 dark:border-orange-900/30 rounded-3xl p-5 flex items-center gap-4 transition-all duration-500 relative z-10";
        }
        if (champCongratsIconBoxEl) {
          champCongratsIconBoxEl.className = "w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl shadow-inner transition-all duration-300";
        }
        if (congratsTitleEl) {
          congratsTitleEl.innerText = "Congratulations Screen & Special Rewards";
          congratsTitleEl.className = "text-sm font-bold text-slate-900 dark:text-zinc-100 transition-all duration-300";
        }
        if (congratsDescEl) {
          congratsDescEl.innerText = "This champion has unlocked the sacred Hall of Faith and is featured on the main community feed!";
          congratsDescEl.className = "text-xs text-slate-500 dark:text-zinc-400 mt-1 transition-colors duration-300 leading-relaxed";
        }
        if (champMultipliersTitleEl) {
          champMultipliersTitleEl.className = "text-[10px] font-bold text-slate-400 uppercase tracking-widest block transition-colors duration-300";
        }
        const mCards = [champMultiplierCard1, champMultiplierCard2, champMultiplierCard3];
        mCards.forEach(c => {
          if (c) c.className = "p-3 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-zinc-800 text-center space-y-1 transition-all duration-300 hover:-translate-y-0.5";
        });
        if (btnCheerChamp) {
          btnCheerChamp.innerText = "🎉 Cheer Champion";
          btnCheerChamp.setAttribute('onclick', 'cheerStreakChampion()');
          btnCheerChamp.className = "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-orange-500/20 flex items-center gap-2 relative z-10";
        }
      }
    } else {
      const champNameEl = document.getElementById('champ-name');
      if (champNameEl) champNameEl.innerText = "No champions yet today";
    }
  }, err => console.warn("Championship streak read limit:", err));
}

// Complete devotional check-in
function triggerDevotionalCheckin() {
  window.incrementUserStreak("completed daily devotion & scripture check-in");
}

// Cheer the current reigning champion with off-app push notifications
function cheerStreakChampion() {
  if (!currentChampionDoc) {
    window.showToast?.("No active champion to cheer right now.", "info");
    return;
  }

  const user = window.firebase.auth().currentUser;
  const senderName = window.currentUserProfile?.displayName || user?.email || "Fellow Believer";
  const champName = currentChampionDoc.displayName || currentChampionDoc.email;

  window.showToast?.(`Sending congratulations and holy cheers to ${champName}!`, "success");

  // Evoke direct push notification to tell users to come to the app!
  if (window.sendPushNotification) {
    // Notify the champion directly if they are a different user
    if (user && currentChampionDoc.uid && currentChampionDoc.uid !== user.uid) {
      window.sendPushNotification(
        "👑 You Have Been Cheered!",
        `${senderName} sent a high-priority fellowship cheer to you! Keep your streak burning.`,
        "/?tab=dashboard",
        null, // targetRole
        currentChampionDoc.uid // targetUid: target the champion!
      );
    }

    // Broadcast globally to everyone else except the sender
    window.sendPushNotification(
      "🙌 Holy Cheer Alert!",
      `${senderName} sent a fellowship cheer celebrating Streak Champion ${champName} (${currentChampionDoc.streak || 0} Days)! Join the celebration now.`,
      "/?tab=dashboard",
      null, // targetRole
      null, // targetUid
      user ? user.uid : null // excludeUid: exclude the sender!
    );
  }
}

// Expose functions globally
window.initDashboard = initDashboard;
window.refreshScriptureQuote = refreshScriptureQuote;
window.syncSystemConfigs = syncSystemConfigs;
window.syncStreakChampionship = syncStreakChampionship;
window.triggerDevotionalCheckin = triggerDevotionalCheckin;
window.cheerStreakChampion = cheerStreakChampion;

// --- YOUTUBE STYLE LIVE CHAT AND VISUALS ENGINE ---

function syncLiveChat() {
  const chatContainer = document.getElementById('stream-chat-messages');
  if (!chatContainer) return;

  // Clean up any existing listeners
  if (chatUnsubscribe) {
    chatUnsubscribe();
    chatUnsubscribe = null;
  }
  if (simulatedChatInterval) {
    clearInterval(simulatedChatInterval);
    simulatedChatInterval = null;
  }

  // Subscribe to real-time chats from Firestore ordered by createdAt
  chatUnsubscribe = window.db.collection('stream_chats')
    .orderBy('createdAt', 'asc')
    .limitToLast(50)
    .onSnapshot(snapshot => {
      chatContainer.innerHTML = '';
      
      if (snapshot.empty) {
        chatContainer.innerHTML = `
          <div class="text-center py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            💬 Welcome to the Live Fellowship Chat!
          </div>
        `;
      }
      
      snapshot.forEach(doc => {
        const msg = doc.data();
        const role = msg.senderRole || 'Member';
        
        let roleBadgeHTML = '';
        if (role === 'Super Admin' || role === 'Pastor') {
          roleBadgeHTML = `<span class="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ml-1.5 tracking-wider">HOST</span>`;
        } else if (role === 'Cell Leader' || role === 'Cell Coordinator') {
          roleBadgeHTML = `<span class="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ml-1.5 tracking-wider">LEADER</span>`;
        }
        
        const avatarChar = (msg.senderName || 'Anonymous').charAt(0).toUpperCase();
        const isSelf = msg.senderUid === window.firebase.auth().currentUser?.uid;
        const bubbleBg = isSelf ? 'bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/30 dark:border-blue-900/10' : '';
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex items-start gap-2.5 p-2 rounded-xl transition-all ${bubbleBg}`;
        msgDiv.innerHTML = `
          <div class="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold flex items-center justify-center text-xs shrink-0 select-none">
            ${avatarChar}
          </div>
          <div class="flex-grow space-y-0.5">
            <div class="flex items-center flex-wrap">
              <span class="font-black text-slate-800 dark:text-zinc-200 text-xs">${msg.senderName || 'Fellow Believer'}</span>
              ${roleBadgeHTML}
            </div>
            <p class="text-slate-600 dark:text-zinc-300 leading-relaxed text-xs break-all">${msg.message}</p>
          </div>
        `;
        chatContainer.appendChild(msgDiv);
      });
      
      // Auto scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, err => {
      console.warn("Live chat messages snapshot limit:", err);
    });
}

window.likeStream = function() {
  const user = window.firebase.auth().currentUser;
  if (!user) {
    window.showToast?.("Please log in to like the stream.", "error");
    return;
  }
  
  const btn = document.getElementById('btn-like-stream');
  const icon = document.getElementById('stream-like-icon');
  if (!btn || !icon) return;

  const isAlreadyLiked = btn.classList.contains('bg-blue-50');
  
  window.db.collection('system_configs').doc('stream').get().then(doc => {
    let currentLikes = 0;
    if (doc.exists && doc.data().likesCount !== undefined) {
      currentLikes = doc.data().likesCount;
    }
    
    const newLikes = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    
    window.db.collection('system_configs').doc('stream').set({
      likesCount: newLikes
    }, { merge: true }).then(() => {
      if (isAlreadyLiked) {
        btn.classList.remove('bg-blue-50', 'text-blue-600', 'border', 'border-blue-200');
        icon.classList.remove('fill-current', 'text-blue-500');
        window.showToast?.("Removed like from stream", "info");
      } else {
        btn.classList.add('bg-blue-50', 'text-blue-600', 'border', 'border-blue-200');
        icon.classList.add('fill-current', 'text-blue-500');
        window.showToast?.("Liked the live stream! 🙌", "success");
      }
    });
  }).catch(err => console.warn("Failed to update like: ", err));
};

window.sendStreamChatMessage = function(event) {
  if (event) event.preventDefault();

  const user = window.firebase.auth().currentUser;
  if (!user) {
    window.showToast?.("Please log in to chat.", "error");
    return;
  }

  const input = document.getElementById('stream-chat-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  const senderName = window.currentUserProfile?.displayName || user.email || "Fellow Believer";
  const senderRole = window.currentUserRole || 'Member';

  const docId = window.db.collection('stream_chats').doc().id;
  window.db.collection('stream_chats').doc(docId).set({
    id: docId,
    senderUid: user.uid,
    senderName,
    senderRole,
    message: text,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    input.focus();
  }).catch(err => {
    console.error("Failed to send chat message: ", err);
    window.showToast?.("Failed to send chat message.", "error");
  });
};

window.sendQuickReaction = function(emoji) {
  const user = window.firebase.auth().currentUser;
  if (!user) {
    window.showToast?.("Please log in to react.", "error");
    return;
  }

  const senderName = window.currentUserProfile?.displayName || user.email || "Fellow Believer";
  const senderRole = window.currentUserRole || 'Member';

  const docId = window.db.collection('stream_chats').doc().id;
  window.db.collection('stream_chats').doc(docId).set({
    id: docId,
    senderUid: user.uid,
    senderName,
    senderRole,
    message: emoji,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    window.showToast?.(`Sent reaction: ${emoji}`, "success");
  }).catch(err => {
    console.error("Failed to send quick reaction: ", err);
  });
};

// Save ending live stream automatically as a Replay
window.saveStreamAsReplay = function(stream) {
  if (!stream || (!stream.streamUrl && !stream.videoUrl && !stream.url)) {
    return Promise.resolve();
  }

  const streamUrl = stream.streamUrl || stream.videoUrl || stream.url;
  const streamId = stream.id || stream.streamId || Date.now().toString();
  const replayId = `replay_${streamId}_${Date.now()}`;

  const replayDoc = {
    id: replayId,
    originalStreamId: streamId,
    title: stream.streamTitle || stream.title || 'Fellowship Livestream Replay',
    description: stream.streamDesc || stream.description || 'Recorded broadcast replay for the congregation.',
    videoUrl: streamUrl,
    streamType: stream.streamType || 'hls',
    thumbnail: stream.thumbnail || '',
    broadcaster: stream.broadcaster || 'Super Admin',
    duration: stream.duration || 'Full Replay',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    viewsCount: stream.viewsCount || 0,
    likesCount: stream.likesCount || 0,
    likes: [],
    type: 'video_replay'
  };

  const p1 = window.db.collection('stream_replays').doc(replayId).set(replayDoc, { merge: true });

  const feedDoc = {
    id: `post_${replayId}`,
    authorUid: 'admin_system',
    authorName: stream.broadcaster || 'Super Admin',
    authorRole: 'Super Admin',
    text: `📼 **Stream Replay**: ${stream.streamTitle || stream.title || 'Fellowship Broadcast'}\n\n${stream.streamDesc || stream.description || ''}`,
    type: 'video_replay',
    mediaUrl: streamUrl,
    videoUrl: streamUrl,
    streamType: stream.streamType || 'hls',
    videoTitle: stream.streamTitle || stream.title || 'Livestream Replay',
    thumbnail: stream.thumbnail || '',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    likes: [],
    likesCount: stream.likesCount || 0,
    commentsCount: 0,
    viewsCount: 0
  };

  const p2 = window.db.collection('community_feed').doc(`post_${replayId}`).set(feedDoc, { merge: true });

  return Promise.all([p1, p2]);
};

let streamReplaysUnsubscribe = null;

function syncStreamReplays() {
  const grid = document.getElementById('stream-replays-grid');
  const badge = document.getElementById('replays-count-badge');
  if (!grid) return;

  if (streamReplaysUnsubscribe) streamReplaysUnsubscribe();

  streamReplaysUnsubscribe = window.db.collection('stream_replays')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      grid.innerHTML = '';
      const replays = [];
      snap.forEach(doc => replays.push(doc.data()));

      if (badge) {
        badge.innerText = `${replays.length} Replay${replays.length === 1 ? '' : 's'} Saved`;
      }

      if (replays.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full p-8 text-center text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-2">
            <i data-lucide="video" class="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600"></i>
            <p class="text-xs font-bold">No recorded stream replays yet.</p>
            <p class="text-[10px] text-slate-400">When live broadcasts end, recorded replays automatically appear here for the congregation!</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      replays.forEach(r => {
        const card = document.createElement('div');
        card.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between";

        let dateStr = 'Recently';
        if (r.createdAt) {
          const dt = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt.seconds * 1000);
          dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }

        const views = r.viewsCount || 0;
        const likes = r.likesCount || 0;
        const encodedUrl = encodeURIComponent(r.videoUrl || '');

        card.innerHTML = `
          <div class="space-y-3">
            <div id="replay-player-box-${r.id}" class="aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden relative group flex items-center justify-center border border-slate-100 dark:border-zinc-800">
              ${r.thumbnail ? `<img src="${r.thumbnail}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />` : ''}
              <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <button onclick="window.playDashboardReplay('${r.id}', '${encodedUrl}', '${r.streamType || 'hls'}')" class="w-14 h-14 rounded-full bg-white/90 text-indigo-600 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <i data-lucide="play" class="w-6 h-6 fill-current ml-1"></i>
                </button>
              </div>
              <span class="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-mono font-bold">${r.duration || 'Replay'}</span>
            </div>

            <div>
              <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <span>📹 ${r.broadcaster || 'Super Admin'}</span>
                <span>•</span>
                <span>${dateStr}</span>
              </div>
              <h4 class="text-base font-black text-slate-900 dark:text-zinc-50 font-display mt-1 leading-snug">${r.title || 'Livestream Replay'}</h4>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">${r.description || ''}</p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500 font-bold">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                <span id="replay-views-${r.id}">${views} views</span>
              </span>
              <button onclick="window.likeReplay('${r.id}')" class="flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer">
                <i data-lucide="heart" class="w-3.5 h-3.5"></i>
                <span>${likes}</span>
              </button>
            </div>
            <button onclick="window.shareReplay('${r.id}', '${encodeURIComponent(r.title || 'Replay')}')" class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer">
              <i data-lucide="share-2" class="w-3.5 h-3.5"></i> Share
            </button>
          </div>
        `;

        grid.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Stream replays snapshot failed:", err));
}

window.playDashboardReplay = function(replayId, encodedUrl, streamType) {
  const box = document.getElementById(`replay-player-box-${replayId}`);
  if (!box) return;

  const url = decodeURIComponent(encodedUrl);
  box.innerHTML = '';

  let isYoutube = false;
  let embedUrl = '';
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      isYoutube = true;
      let videoId = '';
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
      else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
  } catch (e) {}

  if (isYoutube && embedUrl) {
    box.innerHTML = `<iframe src="${embedUrl}" class="w-full h-full border-none" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  } else {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.className = "w-full h-full object-contain bg-black";
    box.appendChild(video);

    if (streamType === 'hls' || url.includes('.m3u8')) {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      }
    }
  }

  // Increment views count in Firestore
  window.db.collection('stream_replays').doc(replayId).update({
    viewsCount: window.firebase.firestore.FieldValue.increment(1)
  }).catch(() => {});
};

window.likeReplay = function(replayId) {
  const user = window.firebase.auth().currentUser;
  if (!user) {
    window.showToast?.("Please log in to like this replay.", "info");
    return;
  }
  window.db.collection('stream_replays').doc(replayId).update({
    likesCount: window.firebase.firestore.FieldValue.increment(1)
  }).then(() => {
    window.showToast?.("Liked recorded broadcast replay! ❤️", "success");
  }).catch(err => console.warn("Replay like error:", err));
};

window.shareReplay = function(replayId, encodedTitle) {
  const title = decodeURIComponent(encodedTitle);
  const shareUrl = window.location.href;
  if (navigator.share) {
    navigator.share({
      title: title,
      text: `Watch this recorded live stream replay on Home.cell: ${title}`,
      url: shareUrl
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareUrl);
    window.showToast?.("Replay link copied to clipboard!", "success");
  }
};

window.stopLiveStream = function() {
  if (window.currentUserRole !== 'Super Admin') {
    window.showToast?.("Only Super Admins can stop a livestream broadcast.", "error");
    return;
  }

  if (confirm("Are you sure you want to stop this live broadcast and save it as a replay?")) {
    window.db.collection('system_configs').doc('stream').get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        // Save stream as replay automatically
        window.saveStreamAsReplay(data).catch(err => console.warn("Save replay error:", err));
      }

      return window.db.collection('system_configs').doc('stream').update({
        streamActive: false
      });
    }).then(() => {
      return window.db.collection('live_streams')
        .where('streamActive', '==', true)
        .get()
        .then(snap => {
          const batch = window.db.batch();
          snap.forEach(d => {
            const data = d.data();
            window.saveStreamAsReplay(data).catch(() => {});
            batch.update(d.ref, {
              streamActive: false,
              status: 'offline'
            });
          });
          return batch.commit();
        });
    }).then(() => {
      window.showToast?.("Livestream ended and saved as replay successfully!", "success");
    }).catch(err => {
      console.error("Error stopping livestream:", err);
      window.showToast?.("Failed to stop livestream.", "error");
    });
  }
};

let dashboardDevotionalListener = null;
function syncDashboardDailyDevotionals() {
  const container = document.getElementById('dashboard-daily-devotional-container');
  if (!container) return;

  if (dashboardDevotionalListener) dashboardDevotionalListener();

  dashboardDevotionalListener = window.db.collection('daily_devotionals')
    .orderBy('devotionalDate', 'desc')
    .limit(1)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) return;

      snap.forEach(doc => {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in";
        
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
              ☀️ Faith Bread
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            ${d.imageUrl ? `
              <div class="md:col-span-1 rounded-2xl overflow-hidden shadow-sm border border-amber-200/60 dark:border-amber-900/40 h-44">
                <img src="${d.imageUrl}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" alt="${d.title}" />
              </div>
            ` : ''}
            <div class="${d.imageUrl ? 'md:col-span-2' : 'md:col-span-3'} space-y-2">
              <h3 class="text-xl font-black font-display text-slate-900 dark:text-zinc-50 tracking-tight">${d.title}</h3>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-800/80 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                <i data-lucide="book-open" class="w-3.5 h-3.5"></i> ${d.scripture}
              </div>
              <p class="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed line-clamp-4 whitespace-pre-wrap">${d.body}</p>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Dashboard devotional error:", err));
}

let dashboardEventsListener = null;
function syncDashboardUpcomingEvents() {
  const container = document.getElementById('dashboard-upcoming-events-container');
  if (!container) return;

  if (dashboardEventsListener) dashboardEventsListener();

  dashboardEventsListener = window.db.collection('upcoming_events')
    .orderBy('eventDate', 'asc')
    .limit(4)
    .onSnapshot(snap => {
      container.innerHTML = '';
      if (snap.empty) return;

      const section = document.createElement('div');
      section.className = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in";

      let eventsCards = '';
      snap.forEach(doc => {
        const ev = doc.data();
        const dateObj = new Date(ev.eventDate);
        const formattedDate = dateObj.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        eventsCards += `
          <div class="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-purple-300 dark:hover:border-purple-800 transition-all">
            <div class="space-y-2">
              ${ev.imageUrl ? `
                <img src="${ev.imageUrl}" class="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs" alt="${ev.title}" />
              ` : ''}
              <div>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  📅 ${formattedDate}
                </span>
                <h4 class="font-extrabold text-slate-900 dark:text-zinc-100 text-sm font-display mt-1">${ev.title}</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">${ev.description}</p>
                <div class="text-[10px] text-slate-400 font-bold mt-1">📍 ${ev.location}</div>
              </div>
            </div>
          </div>
        `;
      });

      section.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <h3 class="font-black font-display text-slate-900 dark:text-zinc-100 text-sm uppercase tracking-wider flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <i data-lucide="calendar-heart" class="w-4.5 h-4.5"></i> Upcoming Parish Events
          </h3>
          <span class="text-xs font-bold text-slate-400">Parish Schedule</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${eventsCards}
        </div>
      `;

      container.appendChild(section);
      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Dashboard events error:", err));
}

