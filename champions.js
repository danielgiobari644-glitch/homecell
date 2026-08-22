// champions.js
// Home.cell - Champions Hub, Missions Engine, 7-Day Streak, Ranks & Referral Program
// Real mission progress tracking, atomic reward claiming, and live Kingdom Coins synchronization

let championsUserUnsubscribe = null;
let currentChampionUserData = null;
let activeChampionsTab = 'missions';
let missionsCompletionCache = {};

// Champion Ranks Definition
const CHAMPION_LEVELS = [
  { name: 'Bronze Champion', minKc: 0, badge: '🥉', color: 'from-amber-700 to-amber-900', border: 'border-amber-700/60', text: 'text-amber-600 dark:text-amber-500', perk: 'Access to Kingdom Store 4K Wallpapers' },
  { name: 'Silver Champion', minKc: 500, badge: '🥈', color: 'from-slate-400 to-slate-600', border: 'border-slate-400/60', text: 'text-slate-500 dark:text-slate-300', perk: 'Unlock Inspirational Scripture Cards & Audio' },
  { name: 'Gold Champion', minKc: 1500, badge: '🥇', color: 'from-amber-400 to-yellow-600', border: 'border-amber-400/60', text: 'text-amber-500 dark:text-amber-400', perk: 'Custom Design Requests & Priority Cell Lounge' },
  { name: 'Platinum Champion', minKc: 3500, badge: '💎', color: 'from-cyan-400 to-blue-600', border: 'border-cyan-400/60', text: 'text-cyan-600 dark:text-cyan-300', perk: 'Create Custom House Cell Groups & Host Rallies' },
  { name: 'Diamond Champion', minKc: 7000, badge: '💠', color: 'from-indigo-400 to-purple-600', border: 'border-indigo-400/60', text: 'text-indigo-600 dark:text-indigo-300', perk: 'Verified Fellowship Leader Badge & Hall of Fame Spotlight' },
  { name: 'Kingdom Ambassador', minKc: 12000, badge: '👑', color: 'from-yellow-300 via-amber-500 to-purple-700', border: 'border-yellow-400/80', text: 'text-yellow-600 dark:text-yellow-300', perk: 'All Kingdom Store Assets Unlocked + Direct Ministry Fellowship' }
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

// Global helper to record KC ledger transactions
window.recordKcTransaction = async function(type, amount, title, description = '') {
  const user = window.auth?.currentUser;
  if (!user || !window.db) return;

  try {
    await window.db.collection('kc_transactions').add({
      userUid: user.uid,
      type: type, // 'credit' | 'debit'
      amount: parseInt(amount, 10),
      title: title,
      description: description,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.warn("Could not record KC transaction:", e);
  }
};

// Module Initializer
function initChampionsModule() {
  checkUrlReferralCode();
  
  const user = window.auth?.currentUser;
  if (!user) {
    renderChampionOverviewCards({ kingdomCoins: 100, streak: 1, totalReferrals: 0 });
    renderRealMissionsList();
    renderStreakTracker({ streak: 1 });
    renderChampionLevelsPath(100);
    renderReferralHub(null);
    return;
  }

  syncChampionsUserData(user.uid);
  syncRealMissionsState(user.uid);
  syncKcTransactionsLedger(user.uid);
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

      // Check if opening reward has already been granted in this session
      const trackKey = `ref_opened_awarded_${cleanCode}`;
      if (!sessionStorage.getItem(trackKey)) {
        sessionStorage.setItem(trackKey, 'true');
        await awardReferralLinkOpenBonus(cleanCode);
      }
    }
  } catch (e) {
    console.warn("Referral check error:", e);
  }
}
window.checkUrlReferralCode = checkUrlReferralCode;

// Auto-trigger referral check immediately on load and on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => checkUrlReferralCode(), 300);
    });
  } else {
    setTimeout(() => checkUrlReferralCode(), 300);
  }
}

async function awardReferralLinkOpenBonus(code) {
  try {
    const user = window.auth?.currentUser;
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;

    let referrerDoc = null;
    let referrerUid = null;

    // 1. Locate the Referrer (Owner of the referral code)
    if (window.db) {
      try {
        const snap = await window.db.collection('users').where('referralCode', '==', cleanCode).limit(1).get();
        if (!snap.empty) {
          referrerDoc = snap.docs[0];
          referrerUid = referrerDoc.id;
        }
      } catch (findErr) {
        console.warn("Could not query referrer by code:", findErr);
      }
    }

    // Check if the current user is opening their own link
    const isOwnLink = user && referrerUid && user.uid === referrerUid;
    if (isOwnLink) {
      window.showToast?.(`ℹ️ This is your personal fellowship link! When other brethren open it, you earn +50 KC every time!`, 'info');
      return;
    }

    // 2. Record Click / Open Event in Firestore
    if (window.db) {
      try {
        await window.db.collection('referral_clicks').add({
          referrerCode: cleanCode,
          referrerUid: referrerUid || '',
          visitorUid: user ? user.uid : 'guest',
          visitorEmail: user ? user.email : '',
          session: sessionStorage.getItem(`ref_click_session`) || Math.random().toString(36).substring(2),
          status: 'opened',
          rewardAwarded: true,
          kcAwarded: 50,
          claimed: false,
          createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
        });

        // If referrer exists, credit them immediately and create a notification for them
        if (referrerUid) {
          try {
            const refUserDocRef = window.db.collection('users').doc(referrerUid);
            const refUserDoc = await refUserDocRef.get();
            if (refUserDoc.exists) {
              const rData = refUserDoc.data();
              const rKc = rData.kingdomCoins !== undefined ? rData.kingdomCoins : 100;
              const rTot = rData.totalKcEarned || rKc;
              const rClicks = (rData.totalLinkClicks || 0) + 1;
              await refUserDocRef.update({
                kingdomCoins: rKc + 50,
                totalKcEarned: rTot + 50,
                totalLinkClicks: rClicks
              });
              await window.db.collection('kc_transactions').add({
                userUid: referrerUid,
                type: 'credit',
                amount: 50,
                title: 'Referral Link Open Bonus',
                description: `Someone opened your fellowship invitation link (${cleanCode})`,
                createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
              }).catch(() => {});
            }
          } catch (refDocErr) {
            console.warn("Direct update referrer doc note:", refDocErr);
          }

          await window.db.collection('notifications').add({
            recipientUid: referrerUid,
            title: '🎉 Fellowship Link Opened!',
            message: `A believer just opened your fellowship invitation link (${cleanCode})! You received +50 Kingdom Coins!`,
            type: 'referral_open',
            kc: 50,
            read: false,
            createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("Referral click log error:", e);
      }
    }

    // 3. Award the visitor opening the link with discovery Kingdom Coins
    if (user && window.db) {
      const userRef = window.db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const currentKc = userData.kingdomCoins !== undefined ? userData.kingdomCoins : 100;
        const currentTotal = userData.totalKcEarned || currentKc;
        const newBalance = currentKc + 50;

        await userRef.update({
          kingdomCoins: newBalance,
          totalKcEarned: currentTotal + 50
        });

        window.recordKcTransaction?.('credit', 50, 'Fellowship Link Discovery Bonus', `Opened invitation link from ${cleanCode}`);
        window.soundEngine?.playCoins?.();
        window.showToast?.(`🎉 Fellowship Link Opened! You received +50 Kingdom Coins from ${cleanCode}'s link! (Referrer also rewarded +50 KC!)`, 'success');
      }
    } else {
      // Guest Believer opening the link: give instant local bonus & notify
      window.currentKcBalance = (window.currentKcBalance || 100) + 50;
      
      const headerKcEl = document.getElementById('header-kc-count');
      if (headerKcEl) headerKcEl.innerText = `${window.currentKcBalance.toLocaleString()} KC`;
      const sidebarKcEl = document.getElementById('sidebar-kc-count');
      if (sidebarKcEl) sidebarKcEl.innerText = `${window.currentKcBalance.toLocaleString()} KC`;
      const moreSheetKcEl = document.getElementById('more-sheet-kc-count');
      if (moreSheetKcEl) moreSheetKcEl.innerText = `${window.currentKcBalance.toLocaleString()} KC`;

      window.soundEngine?.playCoins?.();
      window.showToast?.(`🎉 Welcome! You opened a fellowship referral link and earned +50 Kingdom Coins! (Referrer also earned +50 KC!) Sign in or register to keep and multiply your rewards!`, 'success');
    }
  } catch (err) {
    console.warn("Award referral open bonus error:", err);
  }
}
window.awardReferralLinkOpenBonus = awardReferralLinkOpenBonus;

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
      referredName: userName || 'New Believer',
      status: 'active',
      rewardClaimed: true,
      kcAwarded: 100,
      createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
    }, { merge: true });

    // Credit New User
    const currentKc = userDoc.exists ? (userDoc.data().kingdomCoins || 0) : 0;
    const currentTotalKc = userDoc.exists ? (userDoc.data().totalKcEarned || currentKc) : 0;
    await userDocRef.set({
      referredBy: cleanCode,
      referredByUid: referrerDoc.id,
      kingdomCoins: currentKc + 100,
      totalKcEarned: currentTotalKc + 100
    }, { merge: true });

    // Credit Referrer
    try {
      const refData = referrerDoc.data();
      const refKc = refData.kingdomCoins !== undefined ? refData.kingdomCoins : 100;
      const refTotalKc = refData.totalKcEarned || refKc;
      const refCount = (refData.totalReferrals || 0) + 1;

      await window.db.collection('users').doc(referrerDoc.id).update({
        kingdomCoins: refKc + 100,
        totalKcEarned: refTotalKc + 100,
        totalReferrals: refCount
      });

      await window.db.collection('notifications').add({
        targetUid: referrerDoc.id,
        recipientUid: referrerDoc.id,
        title: '🎉 New Believer Joined via Your Link!',
        body: `${userName || 'A new believer'} joined Home.cell through your fellowship link (${cleanCode})! You received +100 Kingdom Coins!`,
        type: 'kc',
        url: './#view-champions',
        read: false,
        createdAt: window.firebase?.firestore?.FieldValue ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
      }).catch(() => {});
    } catch (refUpdateErr) {
      console.warn("Could not directly update referrer doc, will batch on next login:", refUpdateErr);
    }

    window.recordKcTransaction?.('credit', 100, 'Referral Welcome Reward', `Joined fellowship through referral link ${cleanCode}`);
    localStorage.removeItem('homecell_referrer_code');
    window.soundEngine?.playLevelUp?.();
    window.showToast?.(`🎉 Fellowship link connected! You received +100 Kingdom Coins welcome reward!`, 'success');
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
    window.currentKcBalance = data.kingdomCoins !== undefined ? data.kingdomCoins : 100;
    
    if (window.currentUserProfile) {
      window.currentUserProfile.kingdomCoins = window.currentKcBalance;
      window.currentUserProfile.photoURL = data.photoURL || window.currentUserProfile.photoURL;
    }

    let userReferralCode = data.referralCode;
    if (!userReferralCode) {
      userReferralCode = 'HC-' + uid.substring(0, 6).toUpperCase();
      userRef.update({ referralCode: userReferralCode }).catch(() => {});
      data.referralCode = userReferralCode;
    }

    // Check unclaimed referral join & link open rewards
    try {
      // 1. Unclaimed Member Joins (+100 KC each)
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

      // 2. Unclaimed Link Opens (+50 KC each for the owner)
      let pendingClickKc = 0;
      let clickDocsToClaim = [];
      let totalClicksCount = 0;
      try {
        const clickSnap = await window.db.collection('referral_clicks')
          .where('referrerUid', '==', uid)
          .get();
        totalClicksCount = clickSnap.size;
        clickSnap.forEach(cDoc => {
          const cData = cDoc.data();
          if (cData.claimed === false) {
            pendingClickKc += (cData.kcAwarded || 50);
            clickDocsToClaim.push(cDoc.ref);
          }
        });
      } catch (clickErr) {
        console.warn("Click snap query error:", clickErr);
      }

      const totalNewKc = pendingKc + pendingClickKc;
      if (totalNewKc > 0) {
        const updatedKc = (data.kingdomCoins || 0) + totalNewKc;
        const updatedTotalKc = (data.totalKcEarned || data.kingdomCoins || 0) + totalNewKc;
        await userRef.update({
          kingdomCoins: updatedKc,
          totalKcEarned: updatedTotalKc,
          totalReferrals: totalRefs,
          totalLinkClicks: totalClicksCount
        });
        for (const rRef of batchClaims) {
          await rRef.update({ rewardClaimed: true }).catch(() => {});
        }
        for (const cRef of clickDocsToClaim) {
          await cRef.update({ claimed: true }).catch(() => {});
        }
        if (pendingClickKc > 0) {
          window.recordKcTransaction?.('credit', pendingClickKc, 'Referral Link Open Bonus', `Earned from ${clickDocsToClaim.length} person(s) opening your fellowship link`);
        }
        if (pendingKc > 0) {
          window.recordKcTransaction?.('credit', pendingKc, 'Referral Join Bonus', `Earned from ${batchClaims.length} new member(s) joining through your link`);
        }
        window.soundEngine?.playCoins?.();
        window.showToast?.(`🎁 You received +${totalNewKc} Kingdom Coins from your fellowship referral link!`, 'success');
        data.kingdomCoins = updatedKc;
        data.totalReferrals = totalRefs;
        data.totalLinkClicks = totalClicksCount;
        window.currentKcBalance = updatedKc;
      }
    } catch (refCheckErr) {
      console.warn("Referral sync error:", refCheckErr);
    }

    // Attach real-time listener for incoming referral link clicks so owner gets instant KC
    if (window.db && !window._referralClicksListenerActive) {
      window._referralClicksListenerActive = true;
      try {
        window.db.collection('referral_clicks')
          .where('referrerUid', '==', uid)
          .where('claimed', '==', false)
          .onSnapshot(async snap => {
            if (!snap || snap.empty) return;
            let realTimeKc = 0;
            let realTimeRefs = [];
            snap.forEach(doc => {
              realTimeKc += (doc.data().kcAwarded || 50);
              realTimeRefs.push(doc.ref);
            });
            if (realTimeKc > 0) {
              for (const ref of realTimeRefs) {
                await ref.update({ claimed: true }).catch(() => {});
              }
              const currentDoc = await userRef.get();
              if (currentDoc.exists) {
                const curData = currentDoc.data();
                const curKc = curData.kingdomCoins !== undefined ? curData.kingdomCoins : 100;
                const newKc = curKc + realTimeKc;
                const newTot = (curData.totalKcEarned || curKc) + realTimeKc;
                const newClicks = (curData.totalLinkClicks || 0) + realTimeRefs.length;
                await userRef.update({
                  kingdomCoins: newKc,
                  totalKcEarned: newTot,
                  totalLinkClicks: newClicks
                });
                window.recordKcTransaction?.('credit', realTimeKc, 'Referral Link Open Bonus', `Someone just opened your fellowship referral link!`);
                window.soundEngine?.playCoins?.();
                window.showToast?.(`🎉 Someone just opened your fellowship referral link! You earned +${realTimeKc} Kingdom Coins!`, 'success');
              }
            }
          }, () => {});
      } catch (listenerErr) {}
    }

    renderChampionOverviewCards(data);
    renderStreakTracker(data);
    renderChampionLevelsPath(data.kingdomCoins || 0);
    renderReferralHub(data);

    if (window.renderStoreKcHeader) window.renderStoreKcHeader();
    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Champions user sync error:", err));
}

function renderChampionOverviewCards(data) {
  const kc = data.kingdomCoins !== undefined ? data.kingdomCoins : 100;
  const referrals = data.totalReferrals || 0;
  const streak = data.streak || 1;
  const levelInfo = getChampionLevelInfo(kc);

  // Sync Header Balance Displays
  const headerKcEl = document.getElementById('header-kc-count');
  if (headerKcEl) headerKcEl.innerText = `${kc.toLocaleString()} KC`;
  const headerStreakEl = document.getElementById('header-streak-count');
  if (headerStreakEl) headerStreakEl.innerText = `${streak}d`;

  // Champions Hub Displays
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

  // Update Global / Drawer displays
  const drawerKc = document.getElementById('drawer-kc-display');
  if (drawerKc) drawerKc.innerText = `${kc.toLocaleString()} KC`;
  const sidebarKc = document.getElementById('sidebar-kc-display');
  if (sidebarKc) sidebarKc.innerText = `${kc.toLocaleString()} KC`;
}

// ----------------------------------------------------
// REAL MISSIONS ENGINE
// ----------------------------------------------------
const DAILY_MISSIONS_DEF = [
  {
    id: 'm_devotional',
    title: "Read Today's Daily Bread Devotional",
    desc: "Feed on the Living Word and reflect with guided prayer",
    target: 1,
    rewardKC: 10,
    icon: '📖',
    actionLabel: 'Read Devotional',
    checkProgress: (u, dateStr) => (u?.lastCheckIn === dateStr || u?.lastDevotionalDate === dateStr ? 1 : 0),
    executeAction: () => {
      window.switchTab?.('devotionals');
    }
  },
  {
    id: 'm_quiz_sprint',
    title: "Complete Daily Scripture Sprint",
    desc: "Sharpen your biblical sword with 5 daily trivia questions",
    target: 1,
    rewardKC: 25,
    icon: '⚡',
    actionLabel: 'Play Trivia',
    checkProgress: (u, dateStr) => (u?.lastQuizDate === dateStr || (u?.quizWinsCount && u.quizWinsCount > 0) ? 1 : 0),
    executeAction: () => {
      window.switchTab?.('quiz');
      window.startDailyQuickQuiz?.();
    }
  },
  {
    id: 'm_bible_reader',
    title: "Read Holy Scripture in Bible Study",
    desc: "Engage with Old and New Testament chapters in the reader",
    target: 1,
    rewardKC: 15,
    icon: '📜',
    actionLabel: 'Open Bible',
    checkProgress: (u) => (u?.chaptersReadCount && u.chaptersReadCount > 0 ? 1 : 0),
    executeAction: () => {
      window.switchTab?.('bible');
    }
  },
  {
    id: 'm_cell_fellowship',
    title: "Connect with Your Cell Group Chat",
    desc: "Encourage brethren in your house cell fellowship room",
    target: 1,
    rewardKC: 5,
    icon: '💬',
    actionLabel: 'Open Cell Chat',
    checkProgress: (u) => (u?.cellId && u.cellId !== 'none' ? 1 : 0),
    executeAction: () => {
      window.switchTab?.('cells');
    }
  },
  {
    id: 'm_testimony_post',
    title: "Share a Praise Testimony or Encouragement",
    desc: "Lift up the name of Jesus on the Fellowship Feed",
    target: 1,
    rewardKC: 15,
    icon: '🙏',
    actionLabel: 'Post Praise',
    checkProgress: (u) => (u?.hasSharedTestimony || u?.postsCount > 0 ? 1 : 0),
    executeAction: () => {
      window.switchTab?.('feed');
      window.scrollToFeedComposer?.();
    }
  },
  {
    id: 'm_prayer_petition',
    title: "Intercede on the Prayer Wall",
    desc: "Post a petition or stand in faith with a praying believer",
    target: 1,
    rewardKC: 10,
    icon: '🕯️',
    actionLabel: 'Go to Prayer Wall',
    checkProgress: (u) => (u?.prayersCount && u.prayersCount > 0 ? 1 : 0),
    executeAction: () => {
      window.switchTab?.('prayer');
    }
  },
  {
    id: 'm_7day_streak',
    title: "Maintain 7-Day Consecration Streak",
    desc: "Build consistency in your daily discipleship walk",
    target: 7,
    rewardKC: 50,
    icon: '🔥',
    actionLabel: 'View Streak',
    checkProgress: (u) => Math.min(7, u?.streak || 1),
    executeAction: () => {
      switchChampionsSubTab('streak');
    }
  },
  {
    id: 'm_invite_believer',
    title: "Invite a Believer to Home.cell",
    desc: "Share the gospel and invite friends via your referral link",
    target: 1,
    rewardKC: 100,
    icon: '👑',
    actionLabel: 'Share Link',
    checkProgress: (u) => (u?.totalReferrals && u.totalReferrals > 0 ? 1 : 0),
    executeAction: () => {
      switchChampionsSubTab('referral');
    }
  }
];

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
  const container = document.getElementById('daily-missions-grid') || document.getElementById('daily-missions-container');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const userData = currentChampionUserData || window.currentUserProfile || { kingdomCoins: 100, streak: 1 };

  container.innerHTML = '';

  DAILY_MISSIONS_DEF.forEach(m => {
    const progressVal = m.checkProgress(userData, todayStr);
    const isGoalMet = progressVal >= m.target;
    const isClaimed = !!missionsCompletionCache[m.id];

    const card = document.createElement('div');
    card.className = `p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
      isClaimed
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-xs'
        : isGoalMet
        ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border-amber-400 dark:border-amber-600 shadow-md ring-1 ring-amber-400/40'
        : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs'
    }`;

    let actionButtonHTML = '';
    if (isClaimed) {
      actionButtonHTML = `
        <span class="w-full py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase flex items-center justify-center gap-1.5 border border-emerald-500/30">
          <i data-lucide="check-circle" class="w-4 h-4"></i> Claimed (+${m.rewardKC} KC)
        </span>
      `;
    } else if (isGoalMet) {
      actionButtonHTML = `
        <button onclick="window.claimMissionReward('${m.id}')" class="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2">
          <span>Claim +${m.rewardKC} KC</span> <i data-lucide="gift" class="w-4 h-4"></i>
        </button>
      `;
    } else {
      actionButtonHTML = `
        <button onclick="window.handleMissionAction('${m.id}')" class="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
          <span>${m.actionLabel}</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      `;
    }

    card.innerHTML = `
      <div class="flex items-start gap-3.5">
        <div class="w-12 h-12 rounded-2xl ${isClaimed ? 'bg-emerald-500/20 text-emerald-500' : isGoalMet ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'} flex items-center justify-center text-2xl shrink-0">
          ${m.icon}
        </div>
        <div class="space-y-1 min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs sm:text-sm font-black text-slate-900 dark:text-zinc-100 line-clamp-1">${m.title}</h4>
            <span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 font-mono font-black text-[10px] shrink-0">
              +${m.rewardKC} KC
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-normal line-clamp-2">${m.desc}</p>
          
          <div class="flex items-center gap-2 pt-1">
            <div class="flex-1 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 transition-all duration-300" style="width: ${Math.min(100, (progressVal / m.target) * 100)}%"></div>
            </div>
            <span class="text-[10px] font-mono font-bold text-slate-400">${progressVal}/${m.target}</span>
          </div>
        </div>
      </div>

      <div class="pt-1">
        ${actionButtonHTML}
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

let isClaimingMission = false;
window.claimMissionReward = async function(missionId) {
  if (isClaimingMission) return;
  
  const user = window.auth?.currentUser;
  if (!user) {
    if (window.openAuthModal) window.openAuthModal();
    window.showToast?.("Please sign in to claim mission rewards.", "info");
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

    let newBalance = 0;

    await db.runTransaction(async (transaction) => {
      const compDoc = await transaction.get(compRef);
      if (compDoc.exists) {
        throw new Error("This mission reward has already been claimed for today.");
      }

      let userDoc = await transaction.get(userRef);
      let userData = userDoc.exists ? userDoc.data() : {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Believer',
        kingdomCoins: 100,
        totalKcEarned: 100
      };

      const currentKc = userData.kingdomCoins || 0;
      newBalance = currentKc + mission.rewardKC;
      const totalEarned = (userData.totalKcEarned || currentKc) + mission.rewardKC;

      transaction.set(compRef, {
        id: completionDocId,
        userUid: user.uid,
        missionId: missionId,
        missionTitle: mission.title,
        date: todayStr,
        rewardKC: mission.rewardKC,
        claimedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      transaction.set(userRef, {
        kingdomCoins: newBalance,
        totalKcEarned: totalEarned
      }, { merge: true });

      transaction.set(txnRef, {
        id: txnRef.id,
        userUid: user.uid,
        type: 'credit',
        amount: mission.rewardKC,
        title: `Mission Completed: ${mission.title}`,
        description: `Daily spiritual objective completion reward`,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    missionsCompletionCache[missionId] = true;
    window.currentKcBalance = newBalance;
    window.soundEngine?.playCoins?.();
    if (window.triggerConfetti) window.triggerConfetti();
    window.showToast?.(`🎉 Objective Complete! You claimed +${mission.rewardKC} Kingdom Coins!`, "success");
    renderRealMissionsList();
    renderChampionOverviewCards({ kingdomCoins: newBalance });
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

// ----------------------------------------------------
// 7-DAY STREAK TRACKER
// ----------------------------------------------------
function renderStreakTracker(userData = {}) {
  const container = document.getElementById('streak-tracker-container');
  if (!container) return;

  const currentStreak = userData?.streak || 1;
  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckedInToday = userData?.lastStreakCheckin === todayStr;

  const daysOfWeek = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  const dayInCycle = ((currentStreak - 1) % 7) + 1;

  container.innerHTML = `
    <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 text-xs font-black font-mono">
              🔥 CONSECRATION STREAK
            </span>
            <span class="text-xs text-slate-400 font-mono">Cycle: Day ${dayInCycle} of 7</span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-zinc-100 mt-1">
            ${currentStreak} Consecutive Day${currentStreak === 1 ? '' : 's'}
          </h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400">Daily check-in grants +5 KC. Reach Day 7 for a +50 KC milestone reward!</p>
        </div>

        <div>
          ${isCheckedInToday ? `
            <span class="px-5 py-3 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-emerald-500/30">
              <i data-lucide="check-circle" class="w-4 h-4"></i> Checked In Today
            </span>
          ` : `
            <button onclick="window.performDailyStreakCheckin()" class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
              <span>Check In (+5 KC)</span> 🔥
            </button>
          `}
        </div>
      </div>

      <!-- 7-Day Visual Calendar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
        ${daysOfWeek.map((dayLabel, idx) => {
          const dayNum = idx + 1;
          const isDone = dayNum < dayInCycle || (dayNum === dayInCycle && isCheckedInToday);
          const isCurrent = dayNum === dayInCycle && !isCheckedInToday;
          const isDay7 = dayNum === 7;

          return `
            <div class="p-4 rounded-2xl border text-center space-y-2 transition-all ${
              isDone
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-xs'
                : isCurrent
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40 text-amber-900 dark:text-amber-200 animate-pulse'
                : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-400'
            }">
              <span class="text-[10px] font-black uppercase font-mono block">${dayLabel}</span>
              <div class="text-2xl font-black">
                ${isDone ? '✓' : isDay7 ? '👑' : isCurrent ? '🔥' : '🔒'}
              </div>
              <span class="text-[10px] font-mono font-bold block ${isDay7 ? 'text-amber-500 font-black' : ''}">
                ${isDay7 ? '+50 KC' : '+5 KC'}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

window.performDailyStreakCheckin = async function() {
  const user = window.auth?.currentUser;
  if (!user) {
    if (window.openAuthModal) window.openAuthModal();
    window.showToast?.("Please sign in to check in.", "info");
    return;
  }

  const db = window.db;
  if (!db) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const userRef = db.collection('users').doc(user.uid);

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) return;

    const data = userDoc.data();
    if (data.lastStreakCheckin === todayStr) {
      window.showToast?.("You have already checked in today!", "info");
      return;
    }

    const prevStreak = data.streak || 0;
    const newStreak = prevStreak + 1;
    const isDay7 = (newStreak % 7 === 0);
    const rewardKc = isDay7 ? 50 : 5;

    const currentKc = data.kingdomCoins || 0;
    const newKc = currentKc + rewardKc;

    await userRef.update({
      streak: newStreak,
      lastStreakCheckin: todayStr,
      kingdomCoins: newKc,
      totalKcEarned: (data.totalKcEarned || currentKc) + rewardKc
    });

    window.recordKcTransaction?.('credit', rewardKc, isDay7 ? '7-Day Streak Milestone Reward' : 'Daily Streak Check-In', `Day ${newStreak} consecutive devotional streak`);
    window.soundEngine?.playCoins?.();
    if (isDay7 && window.triggerConfetti) window.triggerConfetti();
    window.showToast?.(`🔥 Check-in complete! You earned +${rewardKc} Kingdom Coins!`, "success");
  } catch (e) {
    console.warn("Streak checkin error:", e);
    window.showToast?.("Error checking in: " + e.message, "error");
  }
};

// ----------------------------------------------------
// CHAMPION LEVEL RANKS PATH
// ----------------------------------------------------
function renderChampionLevelsPath(userKc = 0) {
  const container = document.getElementById('champion-levels-path-container');
  if (!container) return;

  const levelInfo = getChampionLevelInfo(userKc);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Discipleship Ranks & Perks</h3>
          <p class="text-xs text-slate-400">Advance by earning Kingdom Coins through scripture study, devotionals, and fellowship.</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-black font-mono">
          Current: ${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${CHAMPION_LEVELS.map(lvl => {
          const isUnlocked = userKc >= lvl.minKc;
          const isCurrent = levelInfo.currentLevel.name === lvl.name;

          return `
            <div class="p-5 rounded-3xl border transition-all space-y-3 ${
              isCurrent
                ? 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : isUnlocked
                ? 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs'
                : 'bg-slate-50/50 dark:bg-zinc-950/50 border-slate-200/40 dark:border-zinc-800/40 opacity-70'
            }">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${lvl.badge}</span>
                  <div>
                    <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">${lvl.name}</h4>
                    <span class="text-[10px] font-mono font-bold text-amber-500">${lvl.minKc.toLocaleString()} KC Required</span>
                  </div>
                </div>
                ${isCurrent ? `
                  <span class="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase font-mono">Active</span>
                ` : isUnlocked ? `
                  <span class="text-emerald-500 text-xs font-black">✓ Unlocked</span>
                ` : `
                  <span class="text-slate-400 text-xs">🔒 Locked</span>
                `}
              </div>

              <div class="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl text-xs text-slate-600 dark:text-zinc-300">
                <strong class="text-slate-900 dark:text-zinc-100 block text-[11px] mb-0.5">Perk:</strong>
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

// ----------------------------------------------------
// REAL REFERRAL HUB & FULL LINK SHARING ENGINE
// ----------------------------------------------------
function renderReferralHub(userData) {
  const container = document.getElementById('kingdom-referral-container');
  if (!container) return;

  const code = userData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;
  const totalRefs = userData?.totalReferrals || (window.currentUserProfile?.totalReferrals) || 0;
  const totalClicks = userData?.totalLinkClicks || 0;
  const earnedKc = (totalRefs * 100) + (totalClicks * 50);

  container.innerHTML = `
    <div class="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-black font-mono">
              👑 KINGDOM REFERRAL PROGRAM
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-black">
              Code: ${code}
            </span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-zinc-100">
            Invite Brethren • Earn Kingdom Coins
          </h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-xl">
            Share your fellowship link. Whenever anyone opens your link, <strong>YOU (the owner) get +50 KC</strong> instantly! When they register, you both receive <strong>+100 Kingdom Coins</strong>!
          </p>
        </div>

        <div class="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div class="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-center flex-1 sm:min-w-[90px] border border-slate-200/60 dark:border-zinc-700/60">
            <span class="text-lg font-black text-slate-900 dark:text-zinc-100 font-mono block">${totalClicks}</span>
            <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Link Opens (+50 KC)</span>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-center flex-1 sm:min-w-[90px] border border-blue-200 dark:border-blue-900/60">
            <span class="text-lg font-black text-blue-600 dark:text-blue-400 font-mono block">${totalRefs}</span>
            <span class="text-[9px] text-blue-700 dark:text-blue-300 uppercase font-bold tracking-wider">Joined (+100 KC)</span>
          </div>
          <div class="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-center flex-1 sm:min-w-[95px] border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <span class="text-lg font-black text-amber-600 dark:text-amber-400 font-mono block">+${earnedKc}</span>
            <span class="text-[9px] text-amber-700 dark:text-amber-300 uppercase font-bold tracking-wider">Total KC Earned</span>
          </div>
        </div>
      </div>

      <!-- Share Link & Controls -->
      <div class="p-5 bg-slate-50 dark:bg-zinc-850/80 rounded-2xl border border-slate-200 dark:border-zinc-700/80 space-y-4">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-[11px] font-black uppercase text-slate-700 dark:text-zinc-300 tracking-wider">
              🔗 Your Whole Referral Link
            </label>
            <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400">Earns +50 KC for you on every open!</span>
          </div>
          
          <div class="flex flex-col sm:flex-row items-center gap-2">
            <input type="text" readonly id="champ-ref-link-input" value="${url}" class="w-full text-xs font-mono font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 select-all shadow-xs" />
            
            <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button onclick="window.copyReferralLink()" class="flex-1 sm:flex-initial px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 active:scale-95">
                <i data-lucide="copy" class="w-4 h-4"></i> Copy Link
              </button>
              <button onclick="window.shareReferralNative()" class="px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5" title="Native Share">
                <i data-lucide="share-2" class="w-4 h-4"></i> Share
              </button>
              <button onclick="window.showReferralQRCodeModal()" class="px-3.5 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs uppercase rounded-xl cursor-pointer transition-all" title="Show QR Code">
                <i data-lucide="qr-code" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Quick 1-Click Social Channels -->
        <div class="pt-3 border-t border-slate-200/60 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <span class="text-xs font-bold text-slate-500 dark:text-zinc-400">Quick Share via:</span>
          
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.shareReferralWhatsApp()" class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
              <span>💬 WhatsApp</span>
            </button>
            <button onclick="window.shareReferralTelegram()" class="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
              <span>✈️ Telegram</span>
            </button>
            <button onclick="window.shareReferralTwitter()" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
              <span>𝕏 / Twitter</span>
            </button>
          </div>
        </div>
      </div>

      <!-- How Fellowship Referral Works -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-800 space-y-1.5">
          <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
            1
          </div>
          <h4 class="font-bold text-xs text-slate-900 dark:text-zinc-100">Share Your Link</h4>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400">Share your whole custom link with church members, family, or cell group friends.</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-800 space-y-1.5">
          <div class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            2
          </div>
          <h4 class="font-bold text-xs text-slate-900 dark:text-zinc-100">When Opened: You Get +50 KC</h4>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400">Every time someone opens your link, YOU (the owner) earn +50 Kingdom Coins immediately, and the visitor also receives +50 KC!</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/60 dark:border-zinc-800 space-y-1.5">
          <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm">
            3
          </div>
          <h4 class="font-bold text-xs text-slate-900 dark:text-zinc-100">When They Join: Both Get +100 KC</h4>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400">When they sign in or register, both of you are rewarded with +100 Kingdom Coins and rank progress!</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

window.copyReferralLink = function(explicitCode) {
  const code = explicitCode || currentChampionUserData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      window.showToast?.("📋 Referral link copied to clipboard! Send to friends to give & receive Kingdom Coins!", "success");
    }).catch(() => {
      fallbackCopy(url);
    });
  } else {
    fallbackCopy(url);
  }
};

window.copyReferralCode = function() {
  window.copyReferralLink();
};

window.shareReferralNative = function(explicitCode) {
  const code = explicitCode || currentChampionUserData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;
  const text = `✝ Join me on Home.cell! Experience daily scripture devotionals, trivia quizzes, and fellowship with believers. Open my referral link to get your Kingdom Coins welcome reward: ${url}`;

  if (navigator.share) {
    navigator.share({ title: 'Join Home.cell Fellowship', text: text, url: url }).catch(() => {});
  } else {
    window.copyReferralLink(code);
  }
};

window.shareReferralWhatsApp = function(explicitCode) {
  const code = explicitCode || currentChampionUserData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;
  const text = `✝ Join me on Home.cell! Experience daily scripture devotionals, live fellowship, and Bible study. Open my link to receive your Kingdom Coins welcome bonus: ${url}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
};

window.shareReferralTelegram = function(explicitCode) {
  const code = explicitCode || currentChampionUserData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;
  const text = `✝ Join me on Home.cell! Experience daily scripture devotionals, live fellowship, and spiritual growth. Open my link to get your Kingdom Coins welcome reward!`;
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
};

window.shareReferralTwitter = function(explicitCode) {
  const code = explicitCode || currentChampionUserData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;
  const text = `Join me on Home.cell! Daily scripture devotionals, live fellowship, and Christian study. Open my link to get your welcome reward:`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
};

window.showReferralQRCodeModal = function(explicitCode) {
  const code = explicitCode || currentChampionUserData?.referralCode || (window.currentUserProfile?.referralCode) || 'HOMECELL';
  const url = window.getReferralLink ? window.getReferralLink(code) : `${window.location.origin}${window.location.pathname}?r=${code}`;
  const modal = document.getElementById('referral-qrcode-modal');
  const qrBox = document.getElementById('referral-qr-code-img');
  const codeText = document.getElementById('modal-qr-ref-code');
  const linkText = document.getElementById('modal-qr-ref-url');

  if (codeText) codeText.innerText = code;
  if (linkText) linkText.innerText = url;
  if (qrBox) {
    qrBox.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" class="w-full h-full object-contain mx-auto rounded-xl shadow-xs" alt="Referral QR Code" />`;
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};

window.closeReferralQRCodeModal = function() {
  const modal = document.getElementById('referral-qrcode-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  window.showToast?.(`📋 Link copied to clipboard!`, "success");
}

// Sub-Tab Switcher for Champions Hub
function switchChampionsSubTab(tabName) {
  activeChampionsTab = tabName;
  const tabs = ['missions', 'streak', 'levels', 'referral'];

  tabs.forEach(t => {
    const btn = document.getElementById(`champions-tab-btn-${t}`);
    const panel = document.getElementById(`champions-panel-${t}`);
    if (t === tabName) {
      if (btn) {
        btn.className = "champions-subtab-btn px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 bg-amber-500 text-slate-950 shadow-md";
      }
      if (panel) panel.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = "champions-subtab-btn px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800";
      }
      if (panel) panel.classList.add('hidden');
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

window.switchChampionsSubTab = switchChampionsSubTab;

// Real KC Transactions Audit Ledger Query
function syncKcTransactionsLedger(uid) {
  const container = document.getElementById('kc-ledger-stream-container');
  if (!container || !window.db) return;

  window.db.collection('kc_transactions')
    .where('userUid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(30)
    .onSnapshot(snap => {
      if (snap.empty) {
        container.innerHTML = `
          <div class="text-center py-10 text-slate-400 text-xs">
            No transactions recorded yet. Complete daily objectives or trivia to earn Kingdom Coins!
          </div>
        `;
        return;
      }

      container.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        const isCredit = d.type === 'credit';
        let timeStr = 'Recently';
        if (d.createdAt && typeof d.createdAt.toDate === 'function') {
          const date = d.createdAt.toDate();
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        return `
          <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl ${isCredit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} flex items-center justify-center text-sm font-black shrink-0">
                ${isCredit ? '↓' : '↑'}
              </div>
              <div class="min-w-0 space-y-0.5">
                <h4 class="font-black text-xs text-slate-900 dark:text-zinc-100 truncate">${d.title}</h4>
                <p class="text-[10px] text-slate-400 truncate">${d.description || timeStr}</p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-xs font-mono font-black ${isCredit ? 'text-emerald-500' : 'text-rose-500'}">
                ${isCredit ? '+' : '-'}${d.amount} KC
              </span>
              <span class="text-[9px] text-slate-400 font-mono block">${timeStr}</span>
            </div>
          </div>
        `;
      }).join('');
    }, err => console.warn("KC transactions error:", err));
}
