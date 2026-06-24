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

// Expose functions globally
window.initDashboard = initDashboard;
window.refreshScriptureQuote = refreshScriptureQuote;
window.syncSystemConfigs = syncSystemConfigs;
