// streak.js
// Home.cell - My Streak Module
// Manages daily check-ins, streaks, badges, leaderboard, monthly calendar, streak freeze, and motivational verses.

let streakUserUnsubscribe = null;
let streakLeaderboardUnsubscribe = null;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let currentStreakUserData = null;

const STREAK_BADGES_DEF = [
  {
    id: "badge_1",
    name: "🌱 First Step",
    daysRequired: 1,
    desc: "Completed your first daily devotional check-in!",
    icon: "🌱"
  },
  {
    id: "badge_7",
    name: "⚡ Momentum",
    daysRequired: 7,
    desc: "Maintained a 7-day consecutive devotion streak!",
    icon: "⚡"
  },
  {
    id: "badge_30",
    name: "⭐ Consistent",
    daysRequired: 30,
    desc: "30 days of unshakeable spiritual commitment!",
    icon: "⭐"
  },
  {
    id: "badge_100",
    name: "💎 Unstoppable",
    daysRequired: 100,
    desc: "100 consecutive days of walking in devotion!",
    icon: "💎"
  },
  {
    id: "badge_365",
    name: "👑 Legend",
    daysRequired: 365,
    desc: "An entire year of unwavering daily devotion. A true Legend!",
    icon: "👑"
  }
];

const ENCOURAGING_VERSES = [
  { text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.", ref: "Lamentations 3:22-23" },
  { text: "Let us run with perseverance the race marked out for us, fixing our eyes on Jesus.", ref: "Hebrews 12:1-2" },
  { text: "Be faithful, even to the point of death, and I will give you life as your victor's crown.", ref: "Revelation 2:10" },
  { text: "He gives strength to the weary and increases the power of the weak.", ref: "Isaiah 40:29" },
  { text: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.", ref: "Galatians 6:9" },
  { text: "I can do all things through Christ which strengtheneth me.", ref: "Philippians 4:13" },
  { text: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105" }
];

// Helper: Get local date string YYYY-MM-DD
function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get difference in calendar days between two YYYY-MM-DD dates
function getDaysDiff(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
}

// Module Initializer
function initStreakModule() {
  const user = window.auth?.currentUser;
  if (!user) return;

  renderDailyEncouragementVerse();
  syncUserStreakData(user.uid);
  syncStreakLeaderboard(user.uid);
  renderMonthlyCalendar();
  checkDailyStreakReminderToast();
}

// Check-in & Streak Synchronization
function syncUserStreakData(uid) {
  if (streakUserUnsubscribe) streakUserUnsubscribe();

  const docRef = window.db.collection('users').doc(uid);
  streakUserUnsubscribe = docRef.onSnapshot(doc => {
    if (!doc.exists) return;

    const data = doc.data();
    currentStreakUserData = data;

    const todayStr = getLocalDateString();
    let currentStreak = data.streak || 0;
    let longestStreak = data.longestStreak || currentStreak;
    let totalDevotions = data.totalDevotions || (data.lastCheckIn ? 1 : 0);
    let freezeAvailable = !!data.freezeAvailable;
    let lastCheckIn = data.lastCheckIn || data.lastCheckinDate || "";

    // Convert lastCheckIn if it was in Date string format e.g. "Tue Aug 04 2026"
    if (lastCheckIn && !lastCheckIn.includes('-')) {
      try {
        const parsedDate = new Date(lastCheckIn);
        if (!isNaN(parsedDate.getTime())) {
          lastCheckIn = getLocalDateString(parsedDate);
        }
      } catch (e) {
        lastCheckIn = "";
      }
    }

    // Evaluate if user missed a day and if streak freeze applies
    if (lastCheckIn && lastCheckIn !== todayStr) {
      const diffDays = getDaysDiff(lastCheckIn, todayStr);
      if (diffDays > 1) {
        if (diffDays === 2 && freezeAvailable) {
          // Streak Freeze automatically activated for yesterday!
          freezeAvailable = false;
          window.showToast?.("🛡️ Streak Freeze Activated! Your streak was preserved for yesterday's missed devotion.", "success");
          docRef.update({
            freezeAvailable: false,
            freezeUsedOn: todayStr
          }).catch(e => console.warn("Freeze update error:", e));
        } else if (diffDays > 2 || (diffDays === 2 && !freezeAvailable)) {
          // Streak reset to 0
          if (currentStreak > 0) {
            currentStreak = 0;
            docRef.update({
              streak: 0
            }).catch(e => console.warn("Streak reset update error:", e));
            window.showToast?.("Your streak reset due to missed check-in. Complete today's devotion to start again!", "info");
          }
        }
      }
    }

    // Update Header Counter & Info
    const counterEl = document.getElementById('streak-header-count');
    if (counterEl) counterEl.innerText = currentStreak;

    const isCheckedInToday = (lastCheckIn === todayStr);

    const checkInStatusBadge = document.getElementById('streak-today-status');
    if (checkInStatusBadge) {
      if (isCheckedInToday) {
        checkInStatusBadge.className = "px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5 animate-fade-in";
        checkInStatusBadge.innerHTML = `<span>✅</span> Devotion Complete Today`;
      } else {
        checkInStatusBadge.className = "px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5 animate-pulse";
        checkInStatusBadge.innerHTML = `<span>⏳</span> Pending Today's Devotion`;
      }
    }

    const actionBtn = document.getElementById('btn-complete-streak-today');
    if (actionBtn) {
      if (isCheckedInToday) {
        actionBtn.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i><span>Today's Devotion Completed</span>`;
        actionBtn.className = "w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 text-slate-400 font-bold text-xs rounded-2xl cursor-not-allowed border border-slate-700/60 shadow-inner flex items-center justify-center gap-2";
        actionBtn.disabled = true;
      } else {
        actionBtn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i><span>Complete Today's Devotional</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        actionBtn.className = "w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5";
        actionBtn.disabled = false;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    // Render Weekly Check-in Circles
    renderWeeklyCheckinTracker(data.checkInHistory || {}, lastCheckIn, todayStr);

    // Update Stats Cards
    const statCurrent = document.getElementById('stat-streak-current');
    const statLongest = document.getElementById('stat-streak-longest');
    const statTotal = document.getElementById('stat-streak-total');
    const statDaysActive = document.getElementById('stat-streak-active-days');

    if (statCurrent) statCurrent.innerText = currentStreak;
    if (statLongest) statLongest.innerText = longestStreak;
    if (statTotal) statTotal.innerText = totalDevotions;
    if (statDaysActive) {
      const historyKeys = Object.keys(data.checkInHistory || {});
      statDaysActive.innerText = Math.max(historyKeys.length, totalDevotions);
    }

    // Render Streak Freeze Status Card
    const freezeCard = document.getElementById('streak-freeze-status-card');
    if (freezeCard) {
      if (freezeAvailable) {
        freezeCard.innerHTML = `
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 rounded-2xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl shadow-inner">
                🛡️
              </div>
              <div>
                <div class="text-xs font-black text-blue-300">Streak Freeze Shield Active</div>
                <div class="text-[11px] text-slate-400">If you miss 1 day, your streak will be automatically protected!</div>
              </div>
            </div>
            <span class="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase rounded-lg border border-blue-400/30">1 Ready</span>
          </div>
        `;
      } else {
        freezeCard.innerHTML = `
          <div class="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-500 flex items-center justify-center text-xl">
                🛡️
              </div>
              <div>
                <div class="text-xs font-bold text-zinc-400">Streak Freeze Unavailable</div>
                <div class="text-[11px] text-zinc-500">Super Admins can grant Streak Freeze shields to dedicated members.</div>
              </div>
            </div>
            <span class="px-2.5 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase rounded-lg">None</span>
          </div>
        `;
      }
    }

    // Update Progress Ring ( towards 365 Days Legend )
    updateProgressRing(currentStreak, 365);

    // Update Achievement Badges
    updateAchievementBadges(currentStreak, data.badges || [], data.badgeUnlockedDates || {});

    // Re-render Calendar
    renderMonthlyCalendar();

    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Streak user sync limit:", err));
}

// Render Weekly Tracker (Mon - Sun)
function renderWeeklyCheckinTracker(historyMap = {}, lastCheckIn, todayStr) {
  const trackerBox = document.getElementById('weekly-checkin-tracker');
  if (!trackerBox) return;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Get Monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  trackerBox.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(d);

    const isToday = (dateStr === todayStr);
    const isPast = (dateStr < todayStr);
    const isFuture = (dateStr > todayStr);

    const hasCompleted = !!historyMap[dateStr] || (dateStr === lastCheckIn);

    let nodeHtml = '';
    if (hasCompleted) {
      nodeHtml = `
        <div class="flex flex-col items-center gap-1.5">
          <span class="text-[11px] font-bold uppercase text-slate-400">${dayNames[i]}</span>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-amber-400/50 animate-fade-in" title="Completed on ${dateStr}">
            ✅
          </div>
          <span class="text-[9px] font-bold text-amber-400">${d.getDate()}</span>
        </div>
      `;
    } else if (isToday) {
      nodeHtml = `
        <div class="flex flex-col items-center gap-1.5">
          <span class="text-[11px] font-black uppercase text-orange-400 animate-pulse">${dayNames[i]}</span>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-orange-500 bg-orange-500/10 text-orange-400 font-bold flex items-center justify-center animate-bounce-slow shadow-md" title="Today - Pending">
            ⏳
          </div>
          <span class="text-[9px] font-extrabold text-orange-400">Today</span>
        </div>
      `;
    } else if (isPast) {
      nodeHtml = `
        <div class="flex flex-col items-center gap-1.5">
          <span class="text-[11px] font-bold uppercase text-slate-500">${dayNames[i]}</span>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800 text-zinc-600 font-bold flex items-center justify-center border border-zinc-700/60" title="Missed on ${dateStr}">
            ✕
          </div>
          <span class="text-[9px] text-slate-500">${d.getDate()}</span>
        </div>
      `;
    } else {
      nodeHtml = `
        <div class="flex flex-col items-center gap-1.5">
          <span class="text-[11px] font-medium uppercase text-slate-500">${dayNames[i]}</span>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-zinc-700 text-zinc-600 flex items-center justify-center" title="Upcoming ${dateStr}">
            •
          </div>
          <span class="text-[9px] text-slate-500">${d.getDate()}</span>
        </div>
      `;
    }

    trackerBox.insertAdjacentHTML('beforeend', nodeHtml);
  }
}

// Update Progress Ring
function updateProgressRing(currentStreak, targetDays = 365) {
  const percent = Math.min(100, Math.round((currentStreak / targetDays) * 100));
  
  const labelEl = document.getElementById('progress-ring-label');
  const percentEl = document.getElementById('progress-ring-percent');
  const targetLabel = document.getElementById('progress-ring-target');
  const circleEl = document.getElementById('progress-ring-circle');

  if (labelEl) labelEl.innerText = `${currentStreak} / ${targetDays}`;
  if (percentEl) percentEl.innerText = `${percent}%`;
  if (targetLabel) targetLabel.innerText = `${Math.max(0, targetDays - currentStreak)} Days to Legend 👑`;

  if (circleEl) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    circleEl.style.strokeDasharray = `${circumference}`;
    const offset = circumference - (percent / 100) * circumference;
    circleEl.style.strokeDashoffset = `${offset}`;
  }
}

// Update Achievement Badges
function updateAchievementBadges(currentStreak, unlockedList = [], unlockedDates = {}) {
  const container = document.getElementById('streak-badges-grid');
  if (!container) return;

  container.innerHTML = '';

  STREAK_BADGES_DEF.forEach(badge => {
    const isUnlocked = currentStreak >= badge.daysRequired || unlockedList.includes(badge.id);
    const unlockedDate = unlockedDates[badge.id] || (isUnlocked ? "Unlocked" : "");

    const badgeCard = document.createElement('div');
    badgeCard.onclick = () => showBadgeDetailModal(badge, isUnlocked, unlockedDate, currentStreak);
    badgeCard.className = `p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
      isUnlocked
        ? "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-zinc-900 border-orange-500/50 shadow-lg shadow-orange-500/10 hover:border-orange-400 hover:scale-[1.02]"
        : "bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-80 grayscale hover:grayscale-0"
    }`;

    badgeCard.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="w-12 h-12 rounded-2xl ${isUnlocked ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/30' : 'bg-zinc-800 text-zinc-500'} flex items-center justify-center text-2xl">
          ${badge.icon}
        </div>
        <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isUnlocked ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-500'}">
          ${isUnlocked ? 'UNLOCKED' : `${badge.daysRequired} DAYS`}
        </span>
      </div>

      <div>
        <h4 class="text-sm font-black text-white font-display">${badge.name}</h4>
        <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${badge.desc}</p>
      </div>

      <div class="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
        <span class="text-slate-500">${isUnlocked ? '🏆 Achievement Completed' : `Progress: ${currentStreak}/${badge.daysRequired} days`}</span>
        <span class="${isUnlocked ? 'text-amber-400 font-bold' : 'text-zinc-600'}">${isUnlocked ? 'View Details →' : 'Locked'}</span>
      </div>
    `;

    container.appendChild(badgeCard);
  });
}

// Show Badge Detail Modal
function showBadgeDetailModal(badge, isUnlocked, unlockedDate, currentStreak) {
  const modal = document.getElementById('badge-detail-modal');
  if (!modal) return;

  const iconEl = document.getElementById('badge-modal-icon');
  const titleEl = document.getElementById('badge-modal-title');
  const statusEl = document.getElementById('badge-modal-status');
  const descEl = document.getElementById('badge-modal-desc');
  const dateEl = document.getElementById('badge-modal-date');

  if (iconEl) iconEl.innerText = badge.icon;
  if (titleEl) titleEl.innerText = badge.name;
  if (statusEl) {
    if (isUnlocked) {
      statusEl.className = "px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase";
      statusEl.innerText = "✅ UNLOCKED ACHIEVER";
    } else {
      statusEl.className = "px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black uppercase";
      statusEl.innerText = `🔒 LOCKED (${currentStreak}/${badge.daysRequired} Days)`;
    }
  }
  if (descEl) descEl.innerText = badge.desc;
  if (dateEl) dateEl.innerText = isUnlocked ? `Unlocked Date: ${unlockedDate || 'Active'}` : `Required Streak: ${badge.daysRequired} Consecutive Days`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeBadgeDetailModal() {
  const modal = document.getElementById('badge-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Complete Today's Devotional
function completeStreakDevotional() {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to log your daily devotion.", "error");
    return;
  }

  const todayStr = getLocalDateString();
  const docRef = window.db.collection('users').doc(user.uid);

  docRef.get().then(doc => {
    let currentStreak = 0;
    let longestStreak = 0;
    let totalDevotions = 0;
    let lastCheckIn = "";
    let historyMap = {};
    let badges = [];
    let unlockedDates = {};

    if (doc.exists) {
      const data = doc.data();
      currentStreak = data.streak || 0;
      longestStreak = data.longestStreak || currentStreak;
      totalDevotions = data.totalDevotions || 0;
      lastCheckIn = data.lastCheckIn || data.lastCheckinDate || "";
      historyMap = data.checkInHistory || {};
      badges = data.badges || [];
      unlockedDates = data.badgeUnlockedDates || {};
    }

    if (lastCheckIn === todayStr) {
      window.showToast?.("You have already completed today's devotional check-in!", "info");
      return;
    }

    // Calculate new streak
    let newStreak = 1;
    if (lastCheckIn) {
      const diffDays = getDaysDiff(lastCheckIn, todayStr);
      if (diffDays === 1) {
        newStreak = currentStreak + 1;
      } else if (diffDays === 2 && doc.exists && doc.data().freezeAvailable) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
      }
    }

    const newLongest = Math.max(newStreak, longestStreak);
    const newTotal = totalDevotions + 1;

    // Check badges
    const newlyUnlockedBadges = [];
    STREAK_BADGES_DEF.forEach(b => {
      if (newStreak >= b.daysRequired && !badges.includes(b.id)) {
        badges.push(b.id);
        unlockedDates[b.id] = todayStr;
        newlyUnlockedBadges.push(b.name);
      }
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    historyMap[todayStr] = {
      date: todayStr,
      time: nowTime,
      devotionTitle: "Daily Bread Scripture Devotion",
      verseRead: "Hebrews 10:24-25"
    };

    docRef.update({
      streak: newStreak,
      longestStreak: newLongest,
      totalDevotions: newTotal,
      lastCheckIn: todayStr,
      lastCheckinDate: todayStr,
      lastStreakReason: "completed daily streak devotional",
      checkInHistory: historyMap,
      badges: badges,
      badgeUnlockedDates: unlockedDates
    }).then(() => {
      window.triggerConfetti?.();
      window.showToast?.(`✨ Daily Devotional Check-in Complete! Streak: ${newStreak} Days!`, "success");

      if (newlyUnlockedBadges.length > 0) {
        setTimeout(() => {
          window.showToast?.(`🏅 Badge Unlocked: ${newlyUnlockedBadges.join(", ")}!`, "success");
        }, 1200);
      }

      // Sync with global helper
      if (window.checkNewHighStreakMilestone) {
        window.checkNewHighStreakMilestone(newStreak, user.uid);
      }
    }).catch(err => {
      window.handleFirestoreError?.(err, 'write', `users/${user.uid}`);
    });
  }).catch(err => console.error("Streak checkin fetch error:", err));
}

// Leaderboard Sync (Top Users)
function syncStreakLeaderboard(currentUid) {
  if (streakLeaderboardUnsubscribe) streakLeaderboardUnsubscribe();

  const boardContainer = document.getElementById('streak-leaderboard-list');
  const userRankBanner = document.getElementById('streak-user-rank-banner');
  if (!boardContainer) return;

  streakLeaderboardUnsubscribe = window.db.collection('users')
    .orderBy('streak', 'desc')
    .limit(100)
    .onSnapshot(snap => {
      boardContainer.innerHTML = '';
      let myRank = null;
      let rankIndex = 1;

      snap.forEach(doc => {
        const uData = doc.data();
        const uid = doc.id;
        const streakVal = uData.streak || 0;
        const longestVal = uData.longestStreak || streakVal;
        const isMe = (uid === currentUid);

        if (isMe) myRank = rankIndex;

        let rankBadge = `#${rankIndex}`;
        if (rankIndex === 1) rankBadge = "🥇";
        else if (rankIndex === 2) rankBadge = "🥈";
        else if (rankIndex === 3) rankBadge = "🥉";

        const row = document.createElement('div');
        row.className = `p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
          isMe
            ? "bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40"
            : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900"
        }`;

        row.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-base font-black font-display w-7 text-center ${rankIndex <= 3 ? 'text-2xl' : 'text-slate-400'}">
              ${rankBadge}
            </span>
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-inner">
              ${(uData.displayName || uData.email || "M").charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="text-xs font-black text-white flex items-center gap-2">
                <span>${uData.displayName || uData.email || "Fellow Member"}</span>
                ${isMe ? '<span class="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-300 text-[9px] font-black uppercase">YOU</span>' : ''}
              </div>
              <div class="text-[10px] text-slate-400">
                ${uData.cellId && uData.cellId !== 'none' ? 'Fellowship Cell Member' : 'Assembly Member'} • Longest: ${longestVal} days
              </div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm font-black font-mono text-amber-400 flex items-center justify-end gap-1">
              <span>⚡</span> ${streakVal} <span class="text-[10px] font-normal text-slate-400 uppercase">Days</span>
            </div>
            <span class="text-[9px] text-slate-500 block">Rank #${rankIndex}</span>
          </div>
        `;

        boardContainer.appendChild(row);
        rankIndex++;
      });

      // Update User Rank Banner
      if (userRankBanner) {
        const rankDisplay = myRank ? `#${myRank}` : "Top 100+";
        const rankMsg = myRank
          ? `You are currently ranked <strong class="text-amber-400 font-mono font-black text-sm">#${myRank}</strong> in the Congregation Streak Championship!`
          : `Keep checking in daily to reach the Top 100 Leaderboard!`;

        userRankBanner.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl text-xl border border-amber-500/30">
              👑
            </div>
            <div class="text-xs text-slate-300">
              ${rankMsg}
            </div>
          </div>
          <span class="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-xl border border-amber-500/30">
            ${rankDisplay}
          </span>
        `;
      }
    }, err => console.warn("Streak leaderboard error:", err));
}

// Render Monthly Calendar
function renderMonthlyCalendar() {
  const container = document.getElementById('monthly-calendar-grid');
  const monthLabel = document.getElementById('calendar-month-year-label');
  if (!container || !monthLabel) return;

  const dateObj = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  monthLabel.innerText = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;

  const firstDayIndex = dateObj.getDay(); // 0 = Sun
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

  const todayStr = getLocalDateString();
  const historyMap = currentStreakUserData?.checkInHistory || {};
  const lastCheckIn = currentStreakUserData?.lastCheckIn || "";

  container.innerHTML = '';

  // Day header names (S M T W T F S)
  const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  headers.forEach(h => {
    const hEl = document.createElement('div');
    hEl.className = "text-[10px] font-black uppercase text-slate-500 text-center py-1";
    hEl.innerText = h;
    container.appendChild(hEl);
  });

  // Empty padding cells for first week
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = "p-2 opacity-0";
    container.appendChild(emptyCell);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = historyMap[dStr];
    const isCompleted = !!record || (dStr === lastCheckIn);
    const isToday = (dStr === todayStr);
    const isPast = (dStr < todayStr);

    const cell = document.createElement('div');
    cell.onclick = () => showCalendarDayPopover(dStr, record, isCompleted, isToday);

    let cellClass = "p-2 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[48px] ";

    if (isCompleted) {
      cellClass += "bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border-orange-500 text-orange-300 font-black shadow-inner hover:scale-105";
    } else if (isToday) {
      cellClass += "border-2 border-blue-500 bg-blue-500/10 text-blue-400 font-extrabold ring-2 ring-blue-500/30 animate-pulse";
    } else if (isPast) {
      cellClass += "bg-zinc-900/60 border-zinc-800 text-zinc-600 hover:text-zinc-400";
    } else {
      cellClass += "bg-zinc-950/40 border-zinc-800/60 text-zinc-600";
    }

    cell.className = cellClass;
    cell.innerHTML = `
      <span class="text-xs font-bold">${day}</span>
      <span class="text-[9px] mt-0.5">${isCompleted ? '✨' : isToday ? '⏳' : ''}</span>
    `;

    container.appendChild(cell);
  }
}

function prevCalendarMonth() {
  currentCalendarMonth--;
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  renderMonthlyCalendar();
}

function nextCalendarMonth() {
  currentCalendarMonth++;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  renderMonthlyCalendar();
}

function showCalendarDayPopover(dateStr, record, isCompleted, isToday) {
  if (!isCompleted && !isToday) return;

  const modal = document.getElementById('calendar-day-modal');
  if (!modal) return;

  const titleEl = document.getElementById('cal-modal-title');
  const detailsEl = document.getElementById('cal-modal-details');

  if (titleEl) titleEl.innerText = `Date Record: ${dateStr}`;
  if (detailsEl) {
    if (isCompleted) {
      detailsEl.innerHTML = `
        <div class="space-y-2 text-xs">
          <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-bold flex items-center gap-2">
            <span>✨</span> Daily Devotional Successfully Completed!
          </div>
          <div class="text-slate-300"><strong class="text-slate-400">Devotion:</strong> ${record?.devotionTitle || 'Daily Bread Scripture Devotion'}</div>
          <div class="text-slate-300"><strong class="text-slate-400">Completion Time:</strong> ${record?.time || 'Recorded'}</div>
          <div class="text-slate-300"><strong class="text-slate-400">Verse Read:</strong> ${record?.verseRead || 'Hebrews 10:24-25'}</div>
        </div>
      `;
    } else if (isToday) {
      detailsEl.innerHTML = `
        <div class="space-y-3 text-xs">
          <div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 font-bold flex items-center gap-2">
            <span>⏳</span> Today's Check-in Pending
          </div>
          <p class="text-slate-400">Complete today's daily devotional to build your spiritual momentum!</p>
          <button onclick="closeCalendarDayModal(); completeStreakDevotional();" class="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl cursor-pointer">
            Complete Today's Devotional Now
          </button>
        </div>
      `;
    }
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeCalendarDayModal() {
  const modal = document.getElementById('calendar-day-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Random Daily Encouragement Verse
function renderDailyEncouragementVerse() {
  const textEl = document.getElementById('encouragement-verse-text');
  const refEl = document.getElementById('encouragement-verse-ref');
  if (!textEl || !refEl) return;

  const todayDate = new Date().toDateString();
  let seed = 0;
  for (let i = 0; i < todayDate.length; i++) {
    seed += todayDate.charCodeAt(i);
  }

  const selected = ENCOURAGING_VERSES[seed % ENCOURAGING_VERSES.length];
  textEl.innerText = `"${selected.text}"`;
  refEl.innerText = `— ${selected.ref}`;
}

// In-app Notification Toast Reminder
function checkDailyStreakReminderToast() {
  const user = window.auth?.currentUser;
  if (!user) return;

  const todayStr = getLocalDateString();
  const reminderKey = `streak_reminder_shown_${todayStr}_${user.uid}`;

  if (localStorage.getItem(reminderKey)) return;

  window.db.collection('users').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const lastCheckIn = data.lastCheckIn || data.lastCheckinDate || "";
      if (lastCheckIn !== todayStr) {
        localStorage.setItem(reminderKey, 'true');
        setTimeout(() => {
          window.showToast?.("Don't lose your streak today! ✨ Complete today's devotional.", "warning");
        }, 1500);
      }
    }
  }).catch(err => console.warn("Streak reminder check error:", err));
}

// Admin Grant Streak Freeze Function
function grantUserStreakFreeze(targetUid) {
  if (window.currentUserRole !== 'Super Admin') {
    window.showToast?.("Only Super Admins can grant Streak Freeze shields.", "error");
    return;
  }

  window.db.collection('users').doc(targetUid).update({
    freezeAvailable: true
  }).then(() => {
    window.showToast?.("🛡️ Granted 1 Streak Freeze shield to user!", "success");
  }).catch(err => window.handleFirestoreError(err, 'write', `users/${targetUid}`));
}

// Global Exports
window.initStreakModule = initStreakModule;
window.completeStreakDevotional = completeStreakDevotional;
window.closeBadgeDetailModal = closeBadgeDetailModal;
window.prevCalendarMonth = prevCalendarMonth;
window.nextCalendarMonth = nextCalendarMonth;
window.closeCalendarDayModal = closeCalendarDayModal;
window.grantUserStreakFreeze = grantUserStreakFreeze;
