// champions.js
// Home.cell - Discipleship Journey, Spiritual Milestones, 7-Day Streak & Brethren Outreach
// Focus: Pure spiritual growth, scripture study consistency, fellowship community milestones (Zero Coins / Zero Store)

let championsUserUnsubscribe = null;
let currentChampionUserData = null;
let activeChampionsTab = 'missions';

// Discipleship Ranks Definition (Based purely on spiritual milestones completed)
const CHAMPION_LEVELS = [
  { name: 'Bronze Believer', minMilestones: 0, badge: '🥉', border: 'border-amber-700/60', text: 'text-amber-500', perk: 'Full Access to Home Fellowship Community & Sanctuary' },
  { name: 'Silver Disciple', minMilestones: 5, badge: '🥈', border: 'border-slate-400/60', text: 'text-slate-300', perk: 'Scripture Study Journaling & Daily Verse Reflection Tools' },
  { name: 'Gold Minister', minMilestones: 15, badge: '🥇', border: 'border-amber-400/60', text: 'text-amber-400', perk: 'Fellowship Discussion Leader & Prayer Support Advocate' },
  { name: 'Platinum Elder', minMilestones: 35, badge: '💎', border: 'border-cyan-400/60', text: 'text-cyan-400', perk: 'Plant & Organize New House Cell Sanctuary Gatherings' },
  { name: 'Diamond Shepherd', minMilestones: 70, badge: '💠', border: 'border-indigo-400/60', text: 'text-indigo-400', perk: 'Verified Fellowship Leader Badge & Hall of Fame Honor' },
  { name: 'Kingdom Ambassador', minMilestones: 120, badge: '👑', border: 'border-yellow-400/80', text: 'text-yellow-400', perk: 'Global Fellowship Mentor & Direct Ministry Fellowship' }
];

function getChampionLevelInfo(milestones = 0) {
  let currentLevel = CHAMPION_LEVELS[0];
  let nextLevel = CHAMPION_LEVELS[1];

  for (let i = 0; i < CHAMPION_LEVELS.length; i++) {
    if (milestones >= CHAMPION_LEVELS[i].minMilestones) {
      currentLevel = CHAMPION_LEVELS[i];
      nextLevel = CHAMPION_LEVELS[i + 1] || null;
    }
  }

  const milestonesInLevel = milestones - currentLevel.minMilestones;
  const milestonesNeededForNext = nextLevel ? (nextLevel.minMilestones - currentLevel.minMilestones) : 1;
  const progressPercent = nextLevel ? Math.min(100, Math.round((milestonesInLevel / milestonesNeededForNext) * 100)) : 100;

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    milestonesNeeded: nextLevel ? (nextLevel.minMilestones - milestones) : 0
  };
}

// Module Initializer
function initChampionsModule() {
  checkUrlReferralCode();
  
  const user = window.auth?.currentUser;
  if (!user) {
    renderChampionOverviewCards({ milestones: 1, streak: 1, totalReferrals: 0 });
    renderRealMissionsList();
    renderStreakTracker({ streak: 1 });
    renderChampionLevelsPath(1);
    renderReferralHub(null);
    return;
  }

  syncChampionsUserData(user.uid);
}

window.initChampionsHub = initChampionsModule;

// Global Referral Link Helper
window.getReferralLink = function(code) {
  const user = window.auth?.currentUser;
  const userCode = code || (currentChampionUserData && currentChampionUserData.referralCode) || (window.currentUserProfile && window.currentUserProfile.referralCode) || (user ? 'HC-' + user.uid.substring(0, 6).toUpperCase() : 'HOMECELL');
  const cleanCode = (userCode || 'HOMECELL').trim().toUpperCase();
  const origin = window.location.origin;
  const path = window.location.pathname.replace(/\/$/, '');
  return `${origin}${path}/?r=${encodeURIComponent(cleanCode)}`;
};

async function checkUrlReferralCode() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('r') || urlParams.get('ref');
    if (refCode && refCode.trim().length > 0) {
      const cleanCode = refCode.trim().toUpperCase();
      localStorage.setItem('homecell_referrer_code', cleanCode);

      const trackKey = `ref_opened_${cleanCode}`;
      if (!sessionStorage.getItem(trackKey)) {
        sessionStorage.setItem(trackKey, 'true');
        await recordReferralOpen(cleanCode);
      }
    }
  } catch (e) {
    console.warn("Referral check note:", e);
  }
}
window.checkUrlReferralCode = checkUrlReferralCode;

// Auto-trigger referral check
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => checkUrlReferralCode(), 300);
    });
  } else {
    setTimeout(() => checkUrlReferralCode(), 300);
  }
}

async function recordReferralOpen(code) {
  try {
    const user = window.auth?.currentUser;
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;

    if (window.db) {
      await window.db.collection('referral_clicks').add({
        referrerCode: cleanCode,
        visitorUid: user ? user.uid : 'guest',
        session: sessionStorage.getItem('ref_click_session') || Math.random().toString(36).substring(2),
        createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
      });
    }
  } catch (err) {
    console.warn("Record referral open note:", err);
  }
}

window.connectUserReferralOnAuth = async function(newUserUid, userName) {
  const code = localStorage.getItem('homecell_referrer_code');
  if (!code || !newUserUid || !window.db) return;

  try {
    const cleanCode = code.trim().toUpperCase();
    const snap = await window.db.collection('users').where('referralCode', '==', cleanCode).limit(1).get();
    if (snap.empty) return;

    const refDoc = snap.docs[0];
    const referrerUid = refDoc.id;

    if (referrerUid === newUserUid) return;

    await window.db.collection('users').doc(referrerUid).update({
      totalReferrals: window.firebase.firestore.FieldValue.increment(1),
      milestonesCompleted: window.firebase.firestore.FieldValue.increment(1)
    });

    await window.db.collection('notifications').add({
      recipientUid: referrerUid,
      title: '✝ New Brother/Sister Welcomed!',
      message: `${userName || 'A new believer'} joined Home.cell through your fellowship invitation (${cleanCode})!`,
      type: 'fellowship',
      read: false,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    localStorage.removeItem('homecell_referrer_code');
  } catch (err) {
    console.warn("Connect referral error:", err);
  }
};

function syncChampionsUserData(uid) {
  if (!window.db || !uid) return;
  if (championsUserUnsubscribe) championsUserUnsubscribe();

  championsUserUnsubscribe = window.db.collection('users').doc(uid).onSnapshot(doc => {
    if (!doc.exists) return;
    const data = doc.data();
    currentChampionUserData = data;

    const totalMilestones = (data.milestonesCompleted || 0) + (data.totalDevotions || 0) + (data.chaptersReadCount || 0) + (data.totalReferrals || 0);
    renderChampionOverviewCards({ ...data, milestones: totalMilestones });
    renderRealMissionsList();
    renderStreakTracker(data);
    renderChampionLevelsPath(totalMilestones);
    renderReferralHub(data);
  }, err => console.warn("Champions sync note:", err));
}

function renderChampionOverviewCards(data) {
  const milestones = data.milestones || (data.milestonesCompleted || 0) + (data.totalDevotions || 0);
  const referrals = data.totalReferrals || 0;
  const streak = data.streak || 1;
  const levelInfo = getChampionLevelInfo(milestones);

  const headerStreakEl = document.getElementById('header-streak-count');
  if (headerStreakEl) headerStreakEl.innerText = `${streak}d`;

  const levelNameEl = document.getElementById('champ-level-name');
  const levelBadgeEl = document.getElementById('champ-level-badge');
  const totalRefsEl = document.getElementById('champ-total-refs');
  const streakEl = document.getElementById('champ-current-streak');
  const progressPercentEl = document.getElementById('champ-progress-percent');
  const progressBarEl = document.getElementById('champ-progress-bar');
  const nextLevelMsgEl = document.getElementById('champ-next-level-msg');

  if (levelNameEl) levelNameEl.innerText = levelInfo.currentLevel.name;
  if (levelBadgeEl) levelBadgeEl.innerText = `${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}`;
  if (totalRefsEl) totalRefsEl.innerText = referrals;
  if (streakEl) streakEl.innerText = `${streak} Days`;
  if (progressPercentEl) progressPercentEl.innerText = `${levelInfo.progressPercent}%`;
  if (progressBarEl) progressBarEl.style.width = `${levelInfo.progressPercent}%`;
  if (nextLevelMsgEl) {
    if (levelInfo.nextLevel) {
      nextLevelMsgEl.innerText = `${levelInfo.milestonesNeeded} more spiritual milestones to attain ${levelInfo.nextLevel.name} ${levelInfo.nextLevel.badge}`;
    } else {
      nextLevelMsgEl.innerText = `👑 You have attained the highest Discipleship Rank: Kingdom Ambassador!`;
    }
  }
}

// Spiritual Objectives & Daily Missions
const DAILY_MISSIONS_DEF = [
  {
    id: 'm_devotional',
    title: "Read Today's Daily Bread Devotional",
    desc: "Feed on the Living Word and reflect with guided prayer",
    icon: '📖',
    actionLabel: 'Read Devotional',
    checkProgress: (u, dateStr) => (u?.lastCheckIn === dateStr || u?.lastDevotionalDate === dateStr ? 1 : 0),
    executeAction: () => window.switchTab?.('devotionals')
  },
  {
    id: 'm_quiz_sprint',
    title: "Complete Scripture Trivia Challenge",
    desc: "Sharpen your biblical sword with fellowship quizzes",
    icon: '⚡',
    actionLabel: 'Play Quiz',
    checkProgress: (u, dateStr) => (u?.lastQuizDate === dateStr || (u?.quizWinsCount && u.quizWinsCount > 0) ? 1 : 0),
    executeAction: () => window.switchTab?.('quiz')
  },
  {
    id: 'm_scripture',
    title: "Holy Scripture Chapter Study",
    desc: "Study at least one chapter from the Old or New Testament today",
    icon: '📜',
    actionLabel: 'Open Bible',
    checkProgress: (u, dateStr) => (u?.chaptersReadToday && u.chaptersReadToday > 0 ? 1 : 0),
    executeAction: () => window.switchTab?.('bible')
  },
  {
    id: 'm_fellowship_chat',
    title: "Fellowship Gathering & Community Post",
    desc: "Share an encouraging word, praise report or prayer request in the Global Feed",
    icon: '💬',
    actionLabel: 'Visit Feed',
    checkProgress: (u, dateStr) => (u?.lastPostDate === dateStr || (u?.postsCount && u.postsCount > 0) ? 1 : 0),
    executeAction: () => window.switchTab?.('feed')
  }
];

function renderRealMissionsList() {
  const container = document.getElementById('daily-missions-list');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const userData = currentChampionUserData || window.currentUserProfile || {};

  container.innerHTML = DAILY_MISSIONS_DEF.map(m => {
    const isDone = m.checkProgress(userData, todayStr) >= 1;

    return `
      <div class="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${isDone ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-indigo-900/30 bg-[#0f152e]'} transition-all">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-11 h-11 rounded-2xl ${isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'} flex items-center justify-center text-xl shrink-0">
            ${m.icon}
          </div>
          <div class="space-y-1 min-w-0">
            <h4 class="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span class="truncate">${m.title}</span>
              ${isDone ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">Completed</span>' : ''}
            </h4>
            <p class="text-xs text-slate-400 line-clamp-1">${m.desc}</p>
          </div>
        </div>

        <div class="shrink-0 self-end sm:self-center">
          ${isDone ? `
            <span class="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <i data-lucide="check-circle" class="w-4 h-4"></i> Completed
            </span>
          ` : `
            <button onclick="window.triggerMissionAction('${m.id}')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm">
              ${m.actionLabel}
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.triggerMissionAction = function(missionId) {
  const mission = DAILY_MISSIONS_DEF.find(m => m.id === missionId);
  if (mission && typeof mission.executeAction === 'function') {
    mission.executeAction();
  }
};

function renderStreakTracker(data) {
  const container = document.getElementById('streak-tracker-container');
  if (!container) return;

  const streak = data?.streak || 1;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = (new Date().getDay() + 6) % 7;

  container.innerHTML = `
    <div class="glass-panel rounded-3xl p-6 border border-indigo-900/30 bg-[#0f152e] space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-indigo-400">7-Day Journey</span>
          <h4 class="text-base font-black text-slate-100">Daily Scripture & Devotion Consistency</h4>
        </div>
        <span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/30">
          🔥 ${streak} Day Streak
        </span>
      </div>

      <div class="grid grid-cols-7 gap-2">
        ${days.map((day, idx) => {
          const isPast = idx < todayIdx;
          const isToday = idx === todayIdx;
          return `
            <div class="p-2.5 rounded-2xl text-center space-y-1.5 border ${
              isToday ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/30' : (isPast ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-500')
            }">
              <div class="text-[10px] font-bold uppercase">${day}</div>
              <div class="text-sm">${isPast ? '✓' : (isToday ? '🔥' : '○')}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderChampionLevelsPath(milestones = 0) {
  const container = document.getElementById('champion-levels-path-container');
  if (!container) return;

  const levelInfo = getChampionLevelInfo(milestones);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-black text-slate-100">Discipleship Ranks & Spiritual Milestones</h3>
          <p class="text-xs text-slate-400">Grow spiritually through daily devotionals, Bible study, and active fellowship participation.</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black font-mono border border-amber-500/30">
          Current: ${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${CHAMPION_LEVELS.map(lvl => {
          const isUnlocked = milestones >= lvl.minMilestones;
          const isCurrent = levelInfo.currentLevel.name === lvl.name;

          return `
            <div class="p-5 rounded-3xl border transition-all space-y-3 ${
              isCurrent
                ? 'bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-transparent border-indigo-400 ring-2 ring-indigo-400/30 shadow-lg'
                : isUnlocked
                ? 'bg-[#0f152e] border-indigo-950/50 shadow-xs'
                : 'bg-[#0a0e20]/60 border-slate-900/60 opacity-60'
            }">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${lvl.badge}</span>
                  <div>
                    <h4 class="font-black text-sm text-slate-100">${lvl.name}</h4>
                    <span class="text-[10px] font-mono font-bold text-indigo-400">${lvl.minMilestones} Milestones Required</span>
                  </div>
                </div>
                ${isCurrent ? `
                  <span class="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-black text-[9px] uppercase font-mono">Current</span>
                ` : isUnlocked ? `
                  <span class="text-emerald-400 text-xs font-black">✓ Attained</span>
                ` : `
                  <span class="text-slate-500 text-xs">🔒 In Progress</span>
                `}
              </div>

              <div class="p-3 bg-[#0a0e20]/60 rounded-2xl text-xs text-slate-300 border border-indigo-950/40">
                <strong class="text-slate-100 block text-[11px] mb-0.5">Sanctuary Privilege:</strong>
                ${lvl.perk}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function renderReferralHub(userData) {
  const container = document.getElementById('kingdom-referral-container');
  if (!container) return;

  const code = userData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;
  const totalRefs = userData?.totalReferrals || 0;

  container.innerHTML = `
    <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-indigo-900/30 bg-[#0f152e]">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-indigo-950/60 text-indigo-300 text-xs font-black font-mono border border-indigo-500/30">
              ✝ BRETHREN OUTREACH
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-mono text-[10px] font-black border border-purple-500/30">
              Code: ${code}
            </span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-black font-display text-slate-100">
            Invite Brethren into Home Fellowship
          </h3>
          <p class="text-xs text-slate-400 max-w-xl leading-relaxed">
            Share your personal fellowship link with friends and family. When they join Home.cell, they join our global digital sanctuary and build spiritual community.
          </p>
        </div>

        <div class="text-left lg:text-right shrink-0">
          <div class="text-2xl font-black font-mono text-indigo-400">${totalRefs}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brethren Welcomed</div>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-[#0a0e20] border border-indigo-950 flex flex-col sm:flex-row items-center gap-3">
        <div class="text-xs font-mono text-indigo-300 truncate flex-1 select-all px-2">
          ${url}
        </div>
        <button onclick="window.copyReferralLink('${url}')" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer">
          <i data-lucide="copy" class="w-4 h-4"></i> Copy Link
        </button>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

window.copyReferralLink = function(url) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      window.showToast?.("📋 Fellowship link copied to clipboard!", "success");
    }).catch(() => {
      prompt("Copy your fellowship link:", url);
    });
  } else {
    prompt("Copy your fellowship link:", url);
  }
};
