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
      if (data.lastCheckinDate === todayStr) {
        if (checkinBtn) {
          checkinBtn.innerText = "☀️ Today's Devotional Complete ✅";
          checkinBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
          checkinBtn.classList.add('bg-zinc-200', 'dark:bg-zinc-800', 'text-slate-400', 'cursor-not-allowed');
          checkinBtn.disabled = true;
        }
      } else {
        if (checkinBtn) {
          checkinBtn.innerText = "☀️ Complete Daily Devotional Check-in";
          checkinBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
          checkinBtn.classList.remove('bg-zinc-200', 'dark:bg-zinc-800', 'text-slate-400', 'cursor-not-allowed');
          checkinBtn.disabled = false;
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

      if (champNameEl) champNameEl.innerText = champData.displayName || champData.email;
      if (champStreakValEl) champStreakValEl.innerText = `${champData.streak || 0} days`;

      // If the current logged in user IS the reigning champion
      if (champDoc.id === user.uid) {
        if (arenaEl) {
          arenaEl.className = "lg:col-span-2 bg-gradient-to-br from-amber-400/90 to-orange-500/95 text-white border border-orange-300 rounded-[2.5rem] p-8 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden";
        }
        if (congratsTitleEl) {
          congratsTitleEl.innerText = "👑 YOU are the reigning Fellowship Streak Champion!";
          congratsTitleEl.className = "text-xs font-bold text-white uppercase tracking-wider";
        }
        if (congratsDescEl) {
          congratsDescEl.innerText = "Outstanding! Your constant spiritual devotion shines as a beautiful beacon of hope for the entire cohort! Keep pushing!";
          congratsDescEl.className = "text-[11px] text-orange-50 mt-1";
        }
      } else {
        // Render regular card design for other users
        if (arenaEl) {
          arenaEl.className = "lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-zinc-950/40 dark:to-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden";
        }
        if (congratsTitleEl) {
          congratsTitleEl.innerText = "Congratulations Screen & Special Rewards";
          congratsTitleEl.className = "text-xs font-bold text-slate-900 dark:text-zinc-100";
        }
        if (congratsDescEl) {
          congratsDescEl.innerText = "This champion has unlocked the sacred Hall of Faith and is featured on the main community feed!";
          congratsDescEl.className = "text-[11px] text-slate-500 dark:text-zinc-400 mt-1";
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

