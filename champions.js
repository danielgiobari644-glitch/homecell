// champions.js
// Home.cell - Champions Referral, Missions, Rewards & Engagement Hub
// Real mission progress tracking, reward duplicate prevention, Kingdom Coins balance synchronization

let championsUserUnsubscribe = null;
let championsLeaderboardUnsubscribe = null;
let currentChampionUserData = null;
let activeLeaderboardTab = 'weekly';
let activeLeaderboardCategory = 'kingdomCoins';
let activeRewardCategory = 'all';

// Level Thresholds
const CHAMPION_LEVELS = [
  { name: 'Bronze Champion', minKc: 0, badge: '🥉', color: 'from-amber-700 to-amber-900', border: 'border-amber-700/60', text: 'text-amber-500' },
  { name: 'Silver Champion', minKc: 500, badge: '🥈', color: 'from-slate-400 to-slate-600', border: 'border-slate-400/60', text: 'text-slate-300' },
  { name: 'Gold Champion', minKc: 1500, badge: '🥇', color: 'from-amber-400 to-yellow-600', border: 'border-amber-400/60', text: 'text-amber-400' },
  { name: 'Platinum Champion', minKc: 3500, badge: '💎', color: 'from-cyan-400 to-blue-600', border: 'border-cyan-400/60', text: 'text-cyan-300' },
  { name: 'Diamond Champion', minKc: 7000, badge: '💠', color: 'from-indigo-400 to-purple-600', border: 'border-indigo-400/60', text: 'text-indigo-300' },
  { name: 'Kingdom Ambassador', minKc: 12000, badge: '👑', color: 'from-yellow-300 via-amber-500 to-purple-700', border: 'border-yellow-400/80', text: 'text-yellow-300' }
];

function getChampionLevelInfo(kc = 0) {
  let currentLevel = CHAMPION_LEVELS[0];
  let nextLevel = CHAMPION_LEVELS[1];

  for (let i = 0; i < CHAMPION_LEVELS.length; i++) {
    if (kc >= CHAMPION_LEVELS[i].minKc) {
      currentLevel = CHAMPION_LEVELS[i];
      nextLevel = CHAMPION_LEVELS[i + 1] || null;
    }
  }

  const kcInCurrentLevel = kc - currentLevel.minKc;
  const kcNeededForNext = nextLevel ? (nextLevel.minKc - currentLevel.minKc) : 1;
  const progressPercent = nextLevel ? Math.min(100, Math.round((kcInCurrentLevel / kcNeededForNext) * 100)) : 100;

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    kcNeeded: nextLevel ? (nextLevel.minKc - kc) : 0
  };
}

// Module Initializer
function initChampionsModule() {
  checkUrlReferralCode();
  
  const user = window.auth?.currentUser;
  if (!user) return;

  syncChampionsUserData(user.uid);
  syncChampionsLeaderboard();
  syncRealMissionsState(user.uid);
  renderWeeklyChallengesList();
  renderAchievementsList();
  renderRewardCenterCatalog();
  renderMyRewardsLibrary();
}

function checkUrlReferralCode() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('r') || urlParams.get('ref');
    if (refCode && refCode.trim().length > 0) {
      const cleanCode = refCode.trim().toUpperCase();
      localStorage.setItem('homecell_referrer_code', cleanCode);

      const trackKey = `ref_click_tracked_${cleanCode}`;
      if (!sessionStorage.getItem(trackKey)) {
        sessionStorage.setItem(trackKey, 'true');
        recordReferralLinkClick(cleanCode);
      }
    }
  } catch (e) {
    console.warn("Referral check error:", e);
  }
}
window.checkUrlReferralCode = checkUrlReferralCode;

async function recordReferralLinkClick(code) {
  try {
    if (!window.db) return;
    await window.db.collection('referral_clicks').add({
      referrerCode: code,
      session: sessionStorage.getItem(`ref_click_session`) || Math.random().toString(36).substring(2),
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {}
}

async function processReferralForNewUser(userUid, userEmail, userName) {
  const code = localStorage.getItem('homecell_referrer_code');
  if (!code || !window.db) return;

  try {
    const cleanCode = code.trim().toUpperCase();
    const snap = await window.db.collection('users').where('referralCode', '==', cleanCode).limit(1).get();
    if (snap.empty) {
      localStorage.removeItem('homecell_referrer_code');
      return;
    }

    const referrerDoc = snap.docs[0];

    if (referrerDoc.id === userUid) {
      localStorage.removeItem('homecell_referrer_code');
      return;
    }

    const userDocRef = window.db.collection('users').doc(userUid);
    const userDoc = await userDocRef.get();
    if (userDoc.exists && userDoc.data().referredBy) {
      localStorage.removeItem('homecell_referrer_code');
      return;
    }

    const refDocId = `ref_${userUid}`;
    await window.db.collection('referrals').doc(refDocId).set({
      id: refDocId,
      referrerUid: referrerDoc.id,
      referrerCode: cleanCode,
      referredUid: userUid,
      referredEmail: userEmail || '',
      referredName: userName || 'New Member',
      status: 'active',
      rewardClaimed: false,
      kcAwarded: 100,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const currentKc = userDoc.exists ? (userDoc.data().kingdomCoins || 0) : 0;
    await userDocRef.set({
      referredBy: cleanCode,
      referredByUid: referrerDoc.id,
      kingdomCoins: currentKc + 100,
      totalKcEarned: currentKc + 100
    }, { merge: true });

    // Record transaction
    window.recordKcTransaction?.('credit', 100, 'Referral Welcome Bonus', `Joined using referral code ${cleanCode}`);

    localStorage.removeItem('homecell_referrer_code');
    window.showToast?.(`🎉 Referral link connected! You received +100 Kingdom Coins welcome bonus!`, 'success');
  } catch (err) {
    console.warn("Process referral error:", err);
  }
}
window.processReferralForNewUser = processReferralForNewUser;

function syncChampionsUserData(uid) {
  if (championsUserUnsubscribe) championsUserUnsubscribe();

  const userRef = window.db.collection('users').doc(uid);
  championsUserUnsubscribe = userRef.onSnapshot(async doc => {
    if (!doc.exists) return;

    const data = doc.data();
    currentChampionUserData = data;
    if (window.currentUserProfile) {
      window.currentUserProfile.kingdomCoins = data.kingdomCoins || 0;
      window.currentUserProfile.photoURL = data.photoURL || window.currentUserProfile.photoURL;
    }

    let userReferralCode = data.referralCode;
    if (!userReferralCode) {
      userReferralCode = 'HC-' + uid.substring(0, 6).toUpperCase();
      userRef.update({ referralCode: userReferralCode }).catch(() => {});
      data.referralCode = userReferralCode;
    }

    // Check unclaimed referral rewards
    try {
      const refSnap = await window.db.collection('referrals').where('referrerUid', '==', uid).get();
      let pendingKc = 0;
      let totalRefs = refSnap.size;
      let batchClaims = [];

      refSnap.forEach(rDoc => {
        const rData = rDoc.data();
        if (rData.rewardClaimed === false) {
          pendingKc += (rData.kcAwarded || 100);
          batchClaims.push(rDoc.ref);
        }
      });

      if (pendingKc > 0) {
        const updatedKc = (data.kingdomCoins || 0) + pendingKc;
        const updatedTotalKc = (data.totalKcEarned || data.kingdomCoins || 0) + pendingKc;
        await userRef.update({
          kingdomCoins: updatedKc,
          totalKcEarned: updatedTotalKc,
          totalReferrals: totalRefs
        });
        for (const rRef of batchClaims) {
          await rRef.update({ rewardClaimed: true }).catch(() => {});
        }
        window.recordKcTransaction?.('credit', pendingKc, 'Referral Reward', `Earned from ${totalRefs} successful member referral(s)`);
        window.showToast?.(`🎁 You received +${pendingKc} Kingdom Coins from referrals!`, 'success');
        data.kingdomCoins = updatedKc;
        data.totalReferrals = totalRefs;
      }
    } catch (refCheckErr) {}

    const kc = data.kingdomCoins || 0;
    const referrals = data.totalReferrals || 0;
    const streak = data.streak || 0;
    const levelInfo = getChampionLevelInfo(kc);

    // Update UI elements
    const kcBalanceEl = document.getElementById('champ-kc-balance');
    const levelNameEl = document.getElementById('champ-level-name');
    const levelBadgeEl = document.getElementById('champ-level-badge');
    const totalRefsEl = document.getElementById('champ-total-refs');
    const streakEl = document.getElementById('champ-current-streak');
    const progressPercentEl = document.getElementById('champ-progress-percent');
    const progressBarEl = document.getElementById('champ-progress-bar');
    const nextLevelMsgEl = document.getElementById('champ-next-level-msg');

    if (kcBalanceEl) kcBalanceEl.innerText = `${kc.toLocaleString()} KC`;
    if (levelNameEl) levelNameEl.innerText = levelInfo.currentLevel.name;
    if (levelBadgeEl) levelBadgeEl.innerText = `${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}`;
    if (totalRefsEl) totalRefsEl.innerText = referrals;
    if (streakEl) streakEl.innerText = `${streak} Days`;
    if (progressPercentEl) progressPercentEl.innerText = `${levelInfo.progressPercent}%`;
    if (progressBarEl) progressBarEl.style.width = `${levelInfo.progressPercent}%`;
    if (nextLevelMsgEl) {
      if (levelInfo.nextLevel) {
        nextLevelMsgEl.innerText = `${levelInfo.kcNeeded.toLocaleString()} KC needed to reach ${levelInfo.nextLevel.name} ${levelInfo.nextLevel.badge}`;
      } else {
        nextLevelMsgEl.innerText = `👑 You have attained the highest Champion Rank: Kingdom Ambassador!`;
      }
    }

    const refCodeInput = document.getElementById('champ-ref-code-input');
    const refCodeText = document.getElementById('champ-referral-code-text');
    const refLinkInput = document.getElementById('champ-ref-link-input');
    const refClicksEl = document.getElementById('champ-stat-clicks');
    const refSignupsEl = document.getElementById('champ-stat-signups');
    const refKcEl = document.getElementById('champ-stat-kc');

    const shareUrl = `${window.location.origin}${window.location.pathname}?r=${userReferralCode}`;
    if (refCodeInput) refCodeInput.value = userReferralCode;
    if (refCodeText) refCodeText.innerText = userReferralCode;
    if (refLinkInput) refLinkInput.value = shareUrl;
    if (refClicksEl) refClicksEl.innerText = data.referralLinkClicks || 0;
    if (refSignupsEl) refSignupsEl.innerText = referrals;
    if (refKcEl) refKcEl.innerText = `${referrals * 100} KC`;

    if (window.renderStoreKcHeader) window.renderStoreKcHeader();
    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Champions user sync error:", err));
}

// ----------------------------------------------------
// REAL MISSIONS ENGINE WITH REWARD PROTECTION
// ----------------------------------------------------
const DAILY_MISSIONS_DEF = [
  {
    id: 'm_devotional',
    title: "Complete Today's Daily Devotional",
    desc: "Read today's faith bread and complete your devotional check-in",
    target: 1,
    rewardKC: 30,
    icon: '📖',
    actionLabel: 'Read Devotional',
    checkProgress: (u, dateStr) => (u?.lastCheckIn === dateStr || u?.lastCheckinDate === dateStr ? 1 : 0),
    executeAction: () => {
      window.switchTab?.('dashboard');
      const devEl = document.getElementById('dashboard-daily-devotional-container');
      if (devEl) devEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    id: 'm_bible_chapters',
    title: "Read 2 Bible Chapters",
    desc: "Engage deeply with Holy Scripture in the Bible Reader",
    target: 2,
    rewardKC: 40,
    icon: '📜',
    actionLabel: 'Open Bible',
    checkProgress: (u, dateStr) => Math.min(2, u?.chaptersReadToday || (u?.chaptersReadCount ? Math.min(2, u.chaptersReadCount) : 0)),
    executeAction: () => {
      window.switchTab?.('bible');
      window.setBibleSubMode?.('read');
    }
  },
  {
    id: 'm_quiz_complete',
    title: "Conquer a Bible Quiz / Trivia Session",
    desc: "Test your biblical knowledge and complete a quiz challenge",
    target: 1,
    rewardKC: 50,
    icon: '🧠',
    actionLabel: 'Play Quiz',
    checkProgress: (u, dateStr) => (u?.completedQuizToday ? 1 : (u?.quizWinsCount && u.quizWinsCount > 0 ? 1 : 0)),
    executeAction: () => {
      window.switchTab?.('bible');
      window.setBibleSubMode?.('quiz');
    }
  },
  {
    id: 'm_streak_maintain',
    title: "Maintain a 3-Day Consecrated Streak",
    desc: "Build consistency in your daily spiritual walk",
    target: 3,
    rewardKC: 40,
    icon: '🔥',
    actionLabel: 'Check Streak',
    checkProgress: (u) => Math.min(3, u?.streak || 0),
    executeAction: () => window.switchTab?.('streak')
  },
  {
    id: 'm_community_testimony',
    title: "Share a Praise Testimony or Prayer",
    desc: "Encourage brethren on the community feed or prayer desk",
    target: 1,
    rewardKC: 30,
    icon: '🙏',
    actionLabel: 'Post Praise',
    checkProgress: (u) => (u?.postedToday ? 1 : (u?.hasSharedTestimony ? 1 : 0)),
    executeAction: () => {
      window.switchTab?.('feed');
      window.scrollToComposerAndSelectTestimony?.();
    }
  },
  {
    id: 'm_cell_fellowship',
    title: "Connect with Your Cell Group Chat",
    desc: "Send an encouraging message or greeting to your cell family",
    target: 1,
    rewardKC: 25,
    icon: '💬',
    actionLabel: 'Open Group Chat',
    checkProgress: (u) => (u?.cellId && u.cellId !== 'none' ? 1 : 0),
    executeAction: () => window.switchTab?.('chat')
  }
];

let missionsCompletionCache = {};

function syncRealMissionsState(uid) {
  const todayStr = new Date().toISOString().split('T')[0];
  const db = window.db;
  if (!db) return;

  db.collection('mission_completions')
    .where('userUid', '==', uid)
    .where('date', '==', todayStr)
    .onSnapshot(snap => {
      missionsCompletionCache = {};
      snap.forEach(doc => {
        const d = doc.data();
        missionsCompletionCache[d.missionId] = true;
      });
      renderRealMissionsList();
    }, err => {
      console.warn("Mission completions listener error:", err);
      renderRealMissionsList();
    });
}

function renderRealMissionsList() {
  const container = document.getElementById('daily-missions-container');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const userData = currentChampionUserData || window.currentUserProfile || {};

  container.innerHTML = '';
  let completedCount = 0;

  DAILY_MISSIONS_DEF.forEach(m => {
    const progressVal = m.checkProgress(userData, todayStr);
    const isGoalMet = progressVal >= m.target;
    const isClaimed = !!missionsCompletionCache[m.id];

    if (isClaimed) completedCount++;

    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
      isClaimed
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-xs'
        : isGoalMet
        ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border-amber-400 dark:border-amber-600 shadow-md ring-1 ring-amber-400/40'
        : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800'
    }`;

    let actionButtonHTML = '';
    if (isClaimed) {
      actionButtonHTML = `
        <span class="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase flex items-center gap-1.5 border border-emerald-500/30">
          <i data-lucide="check-circle" class="w-4 h-4"></i> Claimed (+${m.rewardKC} KC)
        </span>
      `;
    } else if (isGoalMet) {
      actionButtonHTML = `
        <button onclick="window.claimMissionReward('${m.id}')" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
          <span>Claim +${m.rewardKC} KC</span> <i data-lucide="gift" class="w-4 h-4"></i>
        </button>
      `;
    } else {
      actionButtonHTML = `
        <button onclick="window.handleMissionAction('${m.id}')" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
          <span>${m.actionLabel}</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      `;
    }

    card.innerHTML = `
      <div class="flex items-center gap-3.5 min-w-0">
        <div class="w-12 h-12 rounded-2xl ${isClaimed ? 'bg-emerald-500/20 text-emerald-500' : isGoalMet ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'} flex items-center justify-center text-2xl shrink-0">
          ${m.icon}
        </div>
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100">${m.title}</h4>
            <span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 font-mono font-black text-[10px]">
              +${m.rewardKC} KC
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 leading-normal">${m.desc}</p>
          <div class="flex items-center gap-2 pt-0.5">
            <div class="w-24 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 transition-all duration-300" style="width: ${Math.min(100, (progressVal / m.target) * 100)}%"></div>
            </div>
            <span class="text-[10px] font-mono font-bold text-slate-400">${progressVal}/${m.target}</span>
          </div>
        </div>
      </div>

      <div class="w-full sm:w-auto shrink-0">
        ${actionButtonHTML}
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Atomic Claim Mission Reward (Prevents duplicate reward exploits, refresh exploits, double clicks)
let isClaimingMission = false;

window.claimMissionReward = async function(missionId) {
  if (isClaimingMission) return;
  
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to claim mission rewards.", "error");
    return;
  }

  const mission = DAILY_MISSIONS_DEF.find(m => m.id === missionId);
  if (!mission) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const completionDocId = `comp_${user.uid}_${missionId}_${todayStr}`;
  const db = window.db;
  if (!db) return;

  isClaimingMission = true;

  try {
    const compRef = db.collection('mission_completions').doc(completionDocId);
    const userRef = db.collection('users').doc(user.uid);
    const txnRef = db.collection('kc_transactions').doc();

    await db.runTransaction(async (transaction) => {
      const compDoc = await transaction.get(compRef);
      if (compDoc.exists) {
        throw new Error("This mission reward has already been claimed for today.");
      }

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User profile not found.");

      const currentKc = userDoc.data().kingdomCoins || 0;
      const newKc = currentKc + mission.rewardKC;
      const totalEarned = (userDoc.data().totalKcEarned || currentKc) + mission.rewardKC;

      // Mark completion document to permanently prevent duplicate claims
      transaction.set(compRef, {
        id: completionDocId,
        userUid: user.uid,
        missionId: missionId,
        missionTitle: mission.title,
        date: todayStr,
        rewardKC: mission.rewardKC,
        claimedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update User balance
      transaction.update(userRef, {
        kingdomCoins: newKc,
        totalKcEarned: totalEarned
      });

      // Record in transaction audit trail
      transaction.set(txnRef, {
        id: txnRef.id,
        userUid: user.uid,
        type: 'credit',
        amount: mission.rewardKC,
        title: `Mission Completed: ${mission.title}`,
        description: `Daily mission completion reward`,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    missionsCompletionCache[missionId] = true;
    window.soundEngine?.playCoins?.();
    window.triggerConfetti?.();
    window.showToast?.(`🎉 Mission Complete! You claimed +${mission.rewardKC} Kingdom Coins!`, "success");
    renderRealMissionsList();
  } catch (err) {
    console.warn("Claim mission error:", err);
    window.showToast?.(err.message || "Failed to claim mission reward.", "warning");
  } finally {
    isClaimingMission = false;
  }
};

window.handleMissionAction = function(missionId) {
  const mission = DAILY_MISSIONS_DEF.find(m => m.id === missionId);
  if (mission && mission.executeAction) {
    mission.executeAction();
  }
};

// Copy Referral Link & Share Helpers
function copyReferralLink() {
  const linkInput = document.getElementById('champ-ref-link-input');
  const code = currentChampionUserData?.referralCode || 'HOMECELL';
  const url = `${window.location.origin}${window.location.pathname}?r=${code}`;
  
  const textToCopy = linkInput && linkInput.value ? linkInput.value : url;

  navigator.clipboard.writeText(textToCopy).then(() => {
    window.showToast?.("📋 Referral link copied to clipboard!", "success");
  }).catch(() => {
    prompt("Copy Referral Link:", textToCopy);
  });
}

function copyReferralCode() {
  const code = currentChampionUserData?.referralCode || 'HOMECELL';
  navigator.clipboard.writeText(code).then(() => {
    window.showToast?.(`📋 Referral Code "${code}" copied!`, "success");
  }).catch(() => {
    prompt("Copy Referral Code:", code);
  });
}

function shareReferralNative() {
  const code = currentChampionUserData?.referralCode || 'HOMECELL';
  const url = `${window.location.origin}${window.location.pathname}?r=${code}`;
  const shareText = `Join me on Home.cell! Experience daily devotionals, Bible study, and house fellowship gatherings. Use my code: ${code}`;

  if (navigator.share) {
    navigator.share({
      title: 'Join Home.cell Fellowship',
      text: shareText,
      url: url
    }).catch(() => {});
  } else {
    copyReferralLink();
  }
}

function showReferralQRCodeModal() {
  const code = currentChampionUserData?.referralCode || 'HOMECELL';
  const url = `${window.location.origin}${window.location.pathname}?r=${code}`;
  const qrModal = document.getElementById('referral-qrcode-modal');
  const qrBox = document.getElementById('referral-qr-code-img');
  const codeText = document.getElementById('modal-qr-ref-code');

  if (codeText) codeText.innerText = code;
  if (qrBox) {
    qrBox.innerHTML = `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}" class="w-full h-full object-contain" alt="QR Code" />
    `;
  }
  if (qrModal) {
    qrModal.classList.remove('hidden');
    qrModal.classList.add('flex');
  }
}

function closeReferralQRCodeModal() {
  const qrModal = document.getElementById('referral-qrcode-modal');
  if (qrModal) {
    qrModal.classList.add('hidden');
    qrModal.classList.remove('flex');
  }
}

// Sub-Tab Switcher
function switchChampionsSubTab(tabName) {
  const tabs = ['referrals', 'leaderboards', 'missions', 'store'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const panel = document.getElementById(`champ-subtab-${t}`);
    if (t === tabName) {
      if (btn) {
        btn.className = "champ-subtab-btn px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 bg-amber-500 text-slate-950 shadow-md";
      }
      if (panel) panel.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = "champ-subtab-btn px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800";
      }
      if (panel) panel.classList.add('hidden');
    }
  });

  if (tabName === 'store') {
    if (window.initKingdomStoreModule) window.initKingdomStoreModule();
  } else if (tabName === 'leaderboards') {
    if (window.initHallOfFameModule) window.initHallOfFameModule();
  }

  if (window.lucide) window.lucide.createIcons();
}

function syncChampionsLeaderboard() {
  const db = window.db;
  if (!db) return;
  db.collection('users').orderBy('kingdomCoins', 'desc').limit(20).get().then(snap => {
    const list = [];
    snap.forEach(doc => list.push({ uid: doc.id, ...doc.data() }));
    // Update Hall of Fame if active
  }).catch(() => {});
}

function renderWeeklyChallengesList() {
  const container = document.getElementById('weekly-challenges-container');
  if (!container) return;

  const challenges = [
    { title: 'Invite 3 Friends to Home.cell', reward: 300, icon: '🚀', progress: `${Math.min(3, currentChampionUserData?.totalReferrals || 0)}/3` },
    { title: '7-Day Devotional Consistency', reward: 250, icon: '📅', progress: `${Math.min(7, currentChampionUserData?.streak || 0)}/7` },
    { title: 'Achieve 5 Quiz Victories', reward: 200, icon: '🧠', progress: `${Math.min(5, currentChampionUserData?.quizWinsCount || 0)}/5` }
  ];

  container.innerHTML = challenges.map(c => `
    <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl">
          ${c.icon}
        </div>
        <div>
          <h4 class="text-xs font-black text-slate-900 dark:text-zinc-100">${c.title}</h4>
          <p class="text-[10px] text-slate-400 mt-0.5">Progress: <strong class="text-purple-600 dark:text-purple-400 font-mono">${c.progress}</strong></p>
        </div>
      </div>
      <span class="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-black text-xs block">
        +${c.reward} KC
      </span>
    </div>
  `).join('');
}

function renderAchievementsList() {
  const container = document.getElementById('champ-achievements-grid');
  if (!container) return;

  const achievements = [
    { title: '🏆 Gold Champion', desc: 'Reach Gold Level (1,500 KC) in the Champions League.', reward: 200, isUnlocked: (currentChampionUserData?.kingdomCoins >= 1500) },
    { title: '📖 Scripture Seeker', desc: 'Read 20 Holy Scripture chapters in the Bible Reader.', reward: 150, isUnlocked: (currentChampionUserData?.chaptersReadCount >= 20) },
    { title: '⚡ Consecrated Fire', desc: 'Maintain an unshakeable 14-day devotion streak.', reward: 300, isUnlocked: (currentChampionUserData?.streak >= 14) },
    { title: '❤️ Faithful Believer', desc: 'Belong to an active House Cell Group.', reward: 100, isUnlocked: (currentChampionUserData?.cellId && currentChampionUserData.cellId !== 'none') },
    { title: '🌍 Kingdom Ambassador', desc: 'Successfully invite 5 active friends to Home.cell.', reward: 500, isUnlocked: (currentChampionUserData?.totalReferrals >= 5) },
    { title: '🛍️ Resource Collector', desc: 'Acquire 3 digital items from the Kingdom Store.', reward: 150, isUnlocked: (currentChampionUserData?.storePurchases >= 3) }
  ];

  container.innerHTML = achievements.map(a => `
    <div class="p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
      a.isUnlocked
        ? 'bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-transparent border-amber-400 dark:border-amber-600 shadow-md'
        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 opacity-60'
    }">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-black text-slate-900 dark:text-zinc-100 font-display">${a.title}</h4>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${a.isUnlocked ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/40' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}">
          ${a.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
        </span>
      </div>
      <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${a.desc}</p>
      <div class="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
        <span>Reward: +${a.reward} KC</span>
        <span>${a.isUnlocked ? 'Claimed ✓' : 'In Progress'}</span>
      </div>
    </div>
  `).join('');
}

function renderRewardCenterCatalog() {}
function renderMyRewardsLibrary() {}

window.initChampionsModule = initChampionsModule;
window.initChampionsHub = initChampionsModule;
window.switchChampionsSubTab = switchChampionsSubTab;
window.copyReferralLink = copyReferralLink;
window.copyReferralCode = copyReferralCode;
window.shareReferralNative = shareReferralNative;
window.showReferralQRCodeModal = showReferralQRCodeModal;
window.closeReferralQRCodeModal = closeReferralQRCodeModal;
