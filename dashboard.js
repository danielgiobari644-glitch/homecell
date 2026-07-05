// dashboard.js
// Dashboard features, countdown timer, stats, quotes, and stream banner

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

  // Sync Live stream broadcast banner & live stream dashboard pane
  const streamBanner = document.getElementById('live-broadcast-banner');
  const bannerTitle = document.getElementById('broadcast-banner-title');
  const streamPane = document.getElementById('live-stream-pane');
  const paneTitle = document.getElementById('stream-pane-title');
  const paneDesc = document.getElementById('stream-pane-desc');
  const streamIframe = document.getElementById('stream-iframe');

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
          if (streamIframe && streamIframe.src !== data.streamUrl) {
            streamIframe.src = data.streamUrl || '';
          }
        }
      } else {
        if (streamBanner) streamBanner.classList.add('hidden');
        if (streamPane) streamPane.classList.add('hidden');
        if (streamIframe) streamIframe.src = '';
      }
    } else {
      if (window.currentUserRole === 'Super Admin') {
        window.db.collection('system_configs').doc('stream').set({
          streamActive: false,
          streamTitle: 'Saturday Live Fellowship',
          streamDesc: 'Gathering together live to share, connect, and grow.',
          streamUrl: ''
        }).catch(err => console.error("Error seeding stream config: ", err));
      }
    }
  }, err => console.warn("Live stream config read limit:", err));
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
  window.sendPushNotification?.(
    "🙌 Holy Cheer Alert!",
    `${senderName} sent a fellowship cheer celebrating Streak Champion ${champName} (${currentChampionDoc.streak || 0} Days)! Join the celebration now.`,
    "/?tab=dashboard"
  );
}

// Expose functions globally
window.initDashboard = initDashboard;
window.refreshScriptureQuote = refreshScriptureQuote;
window.syncSystemConfigs = syncSystemConfigs;
window.syncStreakChampionship = syncStreakChampionship;
window.triggerDevotionalCheckin = triggerDevotionalCheckin;
window.cheerStreakChampion = cheerStreakChampion;

