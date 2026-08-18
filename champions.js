// champions.js
// Home.cell - Champions Referral, Rewards & Engagement Hub
// Manages Levels, Kingdom Coins (KC), Referrals, Leaderboards, Missions, Achievements, Reward Center & My Rewards

let championsUserUnsubscribe = null;
let championsLeaderboardUnsubscribe = null;
let currentChampionUserData = null;
let activeLeaderboardTab = 'weekly'; // 'weekly' | 'monthly' | 'alltime'
let activeLeaderboardCategory = 'kingdomCoins'; // 'kingdomCoins' | 'referrals' | 'streak' | 'quiz' | 'overall'
let activeRewardCategory = 'all';

// Level Thresholds Def
const CHAMPION_LEVELS = [
  { name: 'Bronze Champion', minKc: 0, badge: '🥉', color: 'from-amber-700 to-amber-900', border: 'border-amber-700/60', text: 'text-amber-500' },
  { name: 'Silver Champion', minKc: 500, badge: '🥈', color: 'from-slate-400 to-slate-600', border: 'border-slate-400/60', text: 'text-slate-300' },
  { name: 'Gold Champion', minKc: 1500, badge: '🥇', color: 'from-amber-400 to-yellow-600', border: 'border-amber-400/60', text: 'text-amber-400' },
  { name: 'Platinum Champion', minKc: 3500, badge: '💎', color: 'from-cyan-400 to-blue-600', border: 'border-cyan-400/60', text: 'text-cyan-300' },
  { name: 'Diamond Champion', minKc: 7000, badge: '💠', color: 'from-indigo-400 to-purple-600', border: 'border-indigo-400/60', text: 'text-indigo-300' },
  { name: 'Kingdom Ambassador', minKc: 12000, badge: '👑', color: 'from-yellow-300 via-amber-500 to-purple-700', border: 'border-yellow-400/80', text: 'text-yellow-300' }
];

// Helper: Get user's champion level
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
  renderDailyMissionsList();
  renderWeeklyChallengesList();
  renderAchievementsList();
  renderRewardCenterCatalog();
  renderMyRewardsLibrary();
}

// Check incoming URL for referral code e.g. ?r=HC-XXXXXX
function checkUrlReferralCode() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('r') || urlParams.get('ref');
    if (refCode && refCode.trim().length > 0) {
      const cleanCode = refCode.trim().toUpperCase();
      localStorage.setItem('homecell_referrer_code', cleanCode);

      // Prevent tracking duplicate link clicks in same session
      const trackKey = `ref_click_tracked_${cleanCode}`;
      if (!sessionStorage.getItem(trackKey)) {
        sessionStorage.setItem(trackKey, 'true');
        recordReferralLinkClick(cleanCode);
      }
    }
  } catch (e) {
    console.warn("Referral URL check error:", e);
  }
}
window.checkUrlReferralCode = checkUrlReferralCode;

// Record referral link click in Firestore
async function recordReferralLinkClick(code) {
  try {
    if (!window.db) return;
    await window.db.collection('referral_clicks').add({
      referrerCode: code,
      session: sessionStorage.getItem(`ref_click_session`) || Math.random().toString(36).substring(2),
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Referral link click recorded for code:", code);
  } catch (e) {
    console.warn("Failed to record referral click:", e);
  }
}

// Attach referral to newly registered user
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
    const referrerData = referrerDoc.data();

    // Anti-cheat: cannot self-refer
    if (referrerDoc.id === userUid) {
      localStorage.removeItem('homecell_referrer_code');
      return;
    }

    // Check if user already processed a referral
    const userDocRef = window.db.collection('users').doc(userUid);
    const userDoc = await userDocRef.get();
    if (userDoc.exists && userDoc.data().referredBy) {
      localStorage.removeItem('homecell_referrer_code');
      return;
    }

    // Record referral document
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

    // Grant +100 KC welcome bonus to the newly referred member
    const currentKc = userDoc.exists ? (userDoc.data().kingdomCoins || 0) : 0;
    await userDocRef.update({
      referredBy: cleanCode,
      referredByUid: referrerDoc.id,
      kingdomCoins: currentKc + 100,
      totalKcEarned: currentKc + 100
    }).catch(async () => {
      await userDocRef.set({
        referredBy: cleanCode,
        referredByUid: referrerDoc.id,
        kingdomCoins: currentKc + 100,
        totalKcEarned: currentKc + 100
      }, { merge: true });
    });

    localStorage.removeItem('homecell_referrer_code');
    window.showToast?.(`🎉 Referral link connected! You received +100 Kingdom Coins welcome bonus!`, 'success');
  } catch (err) {
    console.warn("Process referral error:", err);
  }
}
window.processReferralForNewUser = processReferralForNewUser;

// Synchronize User's Champions Data
function syncChampionsUserData(uid) {
  if (championsUserUnsubscribe) championsUserUnsubscribe();

  const userRef = window.db.collection('users').doc(uid);
  championsUserUnsubscribe = userRef.onSnapshot(async doc => {
    if (!doc.exists) return;

    const data = doc.data();
    currentChampionUserData = data;
    if (window.currentUserProfile) {
      window.currentUserProfile.kingdomCoins = data.kingdomCoins || 0;
    }

    // Ensure referral code exists for current user
    let userReferralCode = data.referralCode;
    if (!userReferralCode) {
      userReferralCode = 'HC-' + uid.substring(0, 6).toUpperCase();
      userRef.update({ referralCode: userReferralCode }).catch(e => console.warn("Ref code update err:", e));
      data.referralCode = userReferralCode;
    }

    // Automatically check for unclaimed referral rewards
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
        window.showToast?.(`🎁 You received +${pendingKc} Kingdom Coins from your successful referrals!`, 'success');
        data.kingdomCoins = updatedKc;
        data.totalReferrals = totalRefs;
      }
    } catch (refCheckErr) {
      console.warn("Referral sync check warning:", refCheckErr);
    }

    // Sync Click Count
    let totalClicks = data.referralLinkClicks || 0;
    try {
      const clicksSnap = await window.db.collection('referral_clicks').where('referrerCode', '==', userReferralCode).get();
      if (!clicksSnap.empty && clicksSnap.size > totalClicks) {
        totalClicks = clicksSnap.size;
        userRef.update({ referralLinkClicks: totalClicks }).catch(() => {});
      }
    } catch (cErr) {
      console.warn("Clicks fetch warning:", cErr);
    }

    const kc = data.kingdomCoins || 0;
    const referrals = data.totalReferrals || 0;
    const streak = data.streak || 0;
    const levelInfo = getChampionLevelInfo(kc);

    // Update Welcome Card
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
    if (levelBadgeEl) levelBadgeEl.innerText = levelInfo.currentLevel.badge;
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

    // Update Referral Link UI
    const refCodeInput = document.getElementById('champ-ref-code-input');
    const refLinkInput = document.getElementById('champ-ref-link-input');
    const refClicksEl = document.getElementById('champ-ref-clicks');
    const refSignupsEl = document.getElementById('champ-ref-signups');

    const shareUrl = `${window.location.origin}${window.location.pathname}?r=${userReferralCode}`;
    if (refCodeInput) refCodeInput.value = userReferralCode;
    if (refLinkInput) refLinkInput.value = shareUrl;
    if (refClicksEl) refClicksEl.innerText = totalClicks;
    if (refSignupsEl) refSignupsEl.innerText = referrals;

    // Render Equipped Theme/Frame
    applyEquippedUserCustomizations(data);
    if (window.renderStoreKcHeader) window.renderStoreKcHeader();

    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Champions user sync error:", err));
}

// Copy Referral Link or Code
function copyReferralLink() {
  const linkInput = document.getElementById('champ-ref-link-input');
  if (linkInput && linkInput.value) {
    navigator.clipboard.writeText(linkInput.value).then(() => {
      window.showToast?.("📋 Referral link copied to clipboard!", "success");
      // Grant +5 KC bonus for sharing referral link (Max once per day)
      grantShareBonusOnceDaily();
    }).catch(() => {
      window.showToast?.("Failed to copy automatically. Please select and copy.", "warning");
    });
  }
}

// Native Web Share API
function shareReferralLink() {
  const code = currentChampionUserData?.referralCode || '';
  const shareUrl = `${window.location.origin}${window.location.pathname}?r=${code}`;

  if (navigator.share) {
    navigator.share({
      title: 'Join me on Home.cell!',
      text: 'Experience daily devotionals, fellowship cell groups, and Christian community growth on Home.cell!',
      url: shareUrl
    }).then(() => {
      window.showToast?.("Shared successfully!", "success");
      grantShareBonusOnceDaily();
    }).catch(e => console.warn("Share cancelled:", e));
  } else {
    copyReferralLink();
  }
}

// Grant Share Bonus once daily
function grantShareBonusOnceDaily() {
  const user = window.auth?.currentUser;
  if (!user || !window.db) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const shareKey = `kc_share_bonus_${todayStr}_${user.uid}`;

  if (localStorage.getItem(shareKey)) return;

  localStorage.setItem(shareKey, 'true');
  const userRef = window.db.collection('users').doc(user.uid);
  userRef.get().then(doc => {
    if (doc.exists) {
      const currentKc = doc.data().kingdomCoins || 0;
      userRef.update({
        kingdomCoins: currentKc + 5,
        totalKcEarned: (doc.data().totalKcEarned || currentKc) + 5
      }).then(() => {
        window.showToast?.("🪙 +5 Kingdom Coins awarded for sharing your link!", "success");
      });
    }
  });
}

// Show QR Code Modal for Referral
function openReferralQrModal() {
  const modal = document.getElementById('referral-qr-modal');
  const code = currentChampionUserData?.referralCode || '';
  const shareUrl = `${window.location.origin}${window.location.pathname}?r=${code}`;

  const qrContainer = document.getElementById('referral-qr-code-box');
  if (qrContainer) {
    // Generate QR Image using standard Google Charts QR API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;
    qrContainer.innerHTML = `
      <img src="${qrApiUrl}" alt="Referral QR Code" class="w-48 h-48 rounded-2xl border-4 border-white dark:border-zinc-800 shadow-xl mx-auto animate-fade-in" />
      <div class="text-xs font-mono font-bold text-center mt-3 text-slate-500">${code}</div>
    `;
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeReferralQrModal() {
  const modal = document.getElementById('referral-qr-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Synchronize Leaderboards
function setLeaderboardTab(tabName) {
  activeLeaderboardTab = tabName;
  updateLeaderboardFilterButtons();
  syncChampionsLeaderboard();
}

function setLeaderboardCategory(catName) {
  activeLeaderboardCategory = catName;
  updateLeaderboardFilterButtons();
  syncChampionsLeaderboard();
}

function updateLeaderboardFilterButtons() {
  const tabs = ['weekly', 'monthly', 'alltime'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btn-lb-tab-${t}`);
    if (btn) {
      if (t === activeLeaderboardTab) {
        btn.className = "px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-md cursor-pointer transition-all";
      } else {
        btn.className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-all";
      }
    }
  });
}

function syncChampionsLeaderboard() {
  if (championsLeaderboardUnsubscribe) championsLeaderboardUnsubscribe();

  const currentUid = window.auth?.currentUser?.uid;
  const boardList = document.getElementById('champions-leaderboard-list');
  const podiumContainer = document.getElementById('champions-leaderboard-podium');
  const myRankBanner = document.getElementById('champions-my-rank-banner');

  if (!boardList) return;

  let sortField = 'kingdomCoins';
  if (activeLeaderboardCategory === 'referrals') sortField = 'totalReferrals';
  else if (activeLeaderboardCategory === 'streak') sortField = 'streak';
  else if (activeLeaderboardCategory === 'quiz') sortField = 'quizScore';

  championsLeaderboardUnsubscribe = window.db.collection('users')
    .orderBy(sortField, 'desc')
    .limit(100)
    .onSnapshot(snap => {
      const users = [];
      let myRank = null;
      let index = 1;

      snap.forEach(doc => {
        const u = doc.data();
        u.uid = doc.id;
        u.rank = index;
        if (doc.id === currentUid) myRank = index;
        users.push(u);
        index++;
      });

      // Render Top 3 Podium
      if (podiumContainer) {
        renderPodiumLayout(podiumContainer, users.slice(0, 3), sortField);
      }

      // Render Positions 4-100
      boardList.innerHTML = '';
      const listUsers = users.length > 3 ? users.slice(3) : users;

      listUsers.forEach(u => {
        const levelInfo = getChampionLevelInfo(u.kingdomCoins || 0);
        const isMe = (u.uid === currentUid);
        const val = u[sortField] || 0;

        const row = document.createElement('div');
        row.className = `p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
          isMe
            ? "bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40"
            : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
        }`;

        row.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-xs font-black font-mono w-7 text-center text-slate-400">#${u.rank}</span>
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr ${levelInfo.currentLevel.color} text-white font-black text-xs flex items-center justify-center shadow-xs">
              ${(u.displayName || u.email || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>${u.displayName || u.email || 'Member'}</span>
                <span class="text-[10px]">${levelInfo.currentLevel.badge}</span>
                ${isMe ? '<span class="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase">YOU</span>' : ''}
              </div>
              <div class="text-[10px] text-slate-400">${levelInfo.currentLevel.name}</div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
              ${val.toLocaleString()} ${sortField === 'kingdomCoins' ? 'KC' : sortField === 'totalReferrals' ? 'Invites' : sortField === 'streak' ? 'Days' : 'Pts'}
            </div>
          </div>
        `;

        boardList.appendChild(row);
      });

      // Update My Rank Banner
      if (myRankBanner) {
        const userKc = currentChampionUserData?.kingdomCoins || 0;
        const myLevel = getChampionLevelInfo(userKc);
        const rankText = myRank ? `#${myRank}` : 'Unranked (Top 100+)';

        myRankBanner.innerHTML = `
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 text-white rounded-2xl border border-blue-500/30 shadow-lg">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shadow-inner">
                ${myLevel.currentLevel.badge}
              </div>
              <div>
                <div class="text-xs font-bold text-blue-200">Your Current Position</div>
                <div class="text-sm font-black font-display">${myLevel.currentLevel.name} • <span class="text-amber-300 font-mono">${userKc.toLocaleString()} KC</span></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-black font-mono text-yellow-300">${rankText}</div>
              <div class="text-[10px] text-blue-200 uppercase tracking-wider font-bold">Global Rank</div>
            </div>
          </div>
        `;
      }
    }, err => console.warn("Leaderboard sync error:", err));
}

// Render Podium Layout for Top 3
function renderPodiumLayout(container, topThree, sortField) {
  if (!topThree || topThree.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-xs text-slate-400">No leaderboard entries yet.</div>`;
    return;
  }

  const p1 = topThree[0] || null;
  const p2 = topThree[1] || null;
  const p3 = topThree[2] || null;

  function renderPodiumCard(user, place, crown, borderColor, bgGradient, height) {
    if (!user) return `<div class="w-1/3"></div>`;
    const levelInfo = getChampionLevelInfo(user.kingdomCoins || 0);
    const val = user[sortField] || 0;

    return `
      <div class="flex-1 flex flex-col items-center">
        <div class="relative mb-2">
          <div class="text-2xl absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce-slow">${crown}</div>
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-gradient-to-tr ${borderColor} shadow-xl">
            <div class="w-full h-full rounded-full bg-slate-900 text-white font-black text-lg flex items-center justify-center border-2 border-white/20">
              ${(user.displayName || user.email || 'M').charAt(0).toUpperCase()}
            </div>
          </div>
          <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono font-black text-[10px] border border-white/20">
            #${place}
          </span>
        </div>

        <div class="w-full ${bgGradient} border ${borderColor} rounded-2xl p-3 text-center shadow-lg flex flex-col justify-center ${height}">
          <div class="text-xs font-black truncate text-slate-900 dark:text-zinc-100">${user.displayName || user.email || 'Champion'}</div>
          <div class="text-[10px] text-slate-500 dark:text-zinc-400">${levelInfo.currentLevel.badge} ${levelInfo.currentLevel.name}</div>
          <div class="text-xs font-black font-mono text-amber-500 mt-1">${val.toLocaleString()} KC</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="flex items-end justify-center gap-2 sm:gap-4 pt-6 pb-2">
      ${renderPodiumCard(p2, 2, '🥈', 'from-slate-300 to-slate-500', 'bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900/60 dark:to-slate-800/60', 'h-28')}
      ${renderPodiumCard(p1, 1, '👑', 'from-amber-300 via-amber-500 to-yellow-600', 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-yellow-900/40 ring-2 ring-amber-400/50', 'h-36')}
      ${renderPodiumCard(p3, 3, '🥉', 'from-amber-700 to-amber-900', 'bg-gradient-to-b from-orange-50 to-amber-100/60 dark:from-amber-950/20 dark:to-amber-900/30', 'h-24')}
    </div>
  `;
}

// Daily Missions Checklist
const DAILY_MISSIONS_DEF = [
  { id: 'm_devotional', title: "Read Today's Devotional", reward: 25, icon: '📖', check: () => currentChampionUserData?.lastCheckIn === new Date().toISOString().split('T')[0] },
  { id: 'm_quiz', title: "Complete Today's Bible Quiz", reward: 30, icon: '❓', check: () => (currentChampionUserData?.completedQuizToday === true) },
  { id: 'm_streak', title: "Maintain Your Streak", reward: 25, icon: '⚡', check: () => (currentChampionUserData?.streak > 0) },
  { id: 'm_invite', title: "Invite 1 Friend to Home.cell", reward: 100, icon: '👥', check: () => (currentChampionUserData?.totalReferrals > 0) },
  { id: 'm_cell', title: "Join or Chat in your Home Cell", reward: 30, icon: '🏠', check: () => (currentChampionUserData?.cellId && currentChampionUserData.cellId !== 'none') },
  { id: 'm_social', title: "React to Community Feed Posts", reward: 15, icon: '❤️', check: () => true }
];

function renderDailyMissionsList() {
  const container = document.getElementById('daily-missions-container');
  if (!container) return;

  container.innerHTML = '';
  let completedCount = 0;

  DAILY_MISSIONS_DEF.forEach(m => {
    const isCompleted = m.check();
    if (isCompleted) completedCount++;

    const card = document.createElement('div');
    card.className = `p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
      isCompleted
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
        : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800"
    }`;

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl ${isCompleted ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'} flex items-center justify-center text-xl">
          ${m.icon}
        </div>
        <div>
          <div class="text-xs font-black text-slate-900 dark:text-zinc-100">${m.title}</div>
          <div class="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono">+${m.reward} KC Reward</div>
        </div>
      </div>

      <div>
        ${isCompleted 
          ? `<span class="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">✓ Completed</span>`
          : `<button onclick="handleMissionAction('${m.id}')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer">Go →</button>`
        }
      </div>
    `;

    container.appendChild(card);
  });

  // Daily Bonus Banner
  const bonusBanner = document.getElementById('daily-missions-bonus-banner');
  if (bonusBanner) {
    const isAllDone = completedCount === DAILY_MISSIONS_DEF.length;
    bonusBanner.className = `p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
      isAllDone ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black shadow-lg" : "bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800"
    }`;
    bonusBanner.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">🎁</span>
        <div>
          <div class="text-xs font-black">Daily All-Mission Completion Bonus</div>
          <div class="text-[11px] opacity-90">${completedCount}/${DAILY_MISSIONS_DEF.length} Missions Completed Today</div>
        </div>
      </div>
      <button onclick="claimDailyMissionBonus()" ${!isAllDone ? 'disabled' : ''} class="px-4 py-2 rounded-xl bg-slate-950 text-amber-400 font-mono font-black text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all cursor-pointer">
        +100 KC Bonus
      </button>
    `;
  }
}

function handleMissionAction(id) {
  if (id === 'm_devotional' || id === 'm_streak') window.switchTab?.('streak');
  else if (id === 'm_quiz') window.switchTab?.('bible');
  else if (id === 'm_invite') copyReferralLink();
  else if (id === 'm_cell') window.switchTab?.('cells');
  else if (id === 'm_social') window.switchTab?.('feed');
}

function claimDailyMissionBonus() {
  const user = window.auth?.currentUser;
  if (!user) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const claimKey = `kc_daily_bonus_${todayStr}_${user.uid}`;

  if (localStorage.getItem(claimKey)) {
    window.showToast?.("You have already claimed today's mission bonus!", "info");
    return;
  }

  localStorage.setItem(claimKey, 'true');
  const docRef = window.db.collection('users').doc(user.uid);
  docRef.get().then(doc => {
    if (doc.exists) {
      const currentKc = doc.data().kingdomCoins || 0;
      docRef.update({
        kingdomCoins: currentKc + 100,
        totalKcEarned: (doc.data().totalKcEarned || currentKc) + 100
      }).then(() => {
        window.triggerConfetti?.();
        window.showToast?.("🎉 Daily All-Mission Bonus claimed! +100 Kingdom Coins!", "success");
      });
    }
  });
}

// Weekly Challenges
function renderWeeklyChallengesList() {
  const container = document.getElementById('weekly-challenges-container');
  if (!container) return;

  const challenges = [
    { title: 'Invite 3 Friends to Home.cell', reward: 300, icon: '🚀', progress: `${Math.min(3, currentChampionUserData?.totalReferrals || 0)}/3` },
    { title: 'Read Devotionals for 7 Consecutive Days', reward: 250, icon: '📅', progress: `${Math.min(7, currentChampionUserData?.streak || 0)}/7` },
    { title: 'Complete 5 Bible Quizzes', reward: 200, icon: '🧠', progress: '3/5' },
    { title: 'Earn 1,000 Kingdom Coins', reward: 500, icon: '🪙', progress: `${Math.min(1000, currentChampionUserData?.kingdomCoins || 0)}/1000` }
  ];

  container.innerHTML = '';
  challenges.forEach(c => {
    const card = document.createElement('div');
    card.className = "p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs";
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl">
          ${c.icon}
        </div>
        <div>
          <div class="text-xs font-black text-slate-900 dark:text-zinc-100">${c.title}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Progress: <strong class="text-blue-600 dark:text-blue-400 font-mono">${c.progress}</strong></div>
        </div>
      </div>
      <div class="text-right">
        <span class="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-black text-xs block">
          +${c.reward} KC
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Achievements List
const ACHIEVEMENTS_DEF = [
  { id: 'ach_champion', title: '🏆 Champion', desc: 'Reach Gold Level or higher in the Kingdom Champions League.', reward: 200, check: (u) => (u?.kingdomCoins >= 1500) },
  { id: 'ach_scripture', title: '📖 Scripture Master', desc: 'Score 100% on 10 Bible Quizzes & Trivia rounds.', reward: 250, check: () => true },
  { id: 'ach_fire', title: '⚡ Faith Carrier', desc: 'Maintain a 14-day consecutive devotional check-in streak.', reward: 300, check: (u) => (u?.streak >= 14) },
  { id: 'ach_cell', title: '❤️ Faithful Member', desc: 'Join a Fellowship Cell and participate actively.', reward: 150, check: (u) => (u?.cellId && u.cellId !== 'none') },
  { id: 'ach_ambassador', title: '🌍 Kingdom Ambassador', desc: 'Successfully invite 10 active friends using your link.', reward: 500, check: (u) => (u?.totalReferrals >= 10) },
  { id: 'ach_prayer', title: '🙏 Prayer Warrior', desc: 'Agree in prayer on 20 community prayer petitions.', reward: 200, check: () => true },
  { id: 'ach_disciple', title: '🎯 Consistent Disciple', desc: 'Maintain an unshakeable 30-day streak in daily devotions.', reward: 1000, check: (u) => (u?.streak >= 30) }
];

function renderAchievementsList() {
  const container = document.getElementById('champions-achievements-grid');
  if (!container) return;

  container.innerHTML = '';
  ACHIEVEMENTS_DEF.forEach(a => {
    const isUnlocked = a.check(currentChampionUserData);

    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
      isUnlocked
        ? "bg-gradient-to-br from-amber-500/10 via-blue-500/10 to-transparent border-amber-500/40 shadow-md hover:scale-[1.02]"
        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 opacity-60 grayscale hover:grayscale-0"
    }`;

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-black text-slate-900 dark:text-zinc-100 font-display">${a.title}</h4>
        <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${isUnlocked ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}">
          ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
        </span>
      </div>
      <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${a.desc}</p>
      <div class="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
        <span>Reward: +${a.reward} KC</span>
        <span>${isUnlocked ? 'Claimed ✓' : 'In Progress'}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// Digital Reward Catalog (Store)
const REWARDS_CATALOG = [
  { id: 'r_theme_gold', title: 'Celestial Gold Theme', category: 'Themes', cost: 500, icon: '🎨', desc: 'Luxurious golden accent theme with glowing buttons and polished gold borders.', preview: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: 'r_theme_purple', title: 'Kingdom Purple Theme', category: 'Themes', cost: 500, icon: '👑', desc: 'Royal purple and violet aesthetic symbolizing spiritual majesty.', preview: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  { id: 'r_frame_halo', title: 'Golden Halo Frame', category: 'Frames', cost: 750, icon: '💫', desc: 'Animated glowing gold halo border around your avatar picture.', preview: 'circle' },
  { id: 'r_frame_sparkle', title: 'Sparkle Pulse Frame', category: 'Frames', cost: 1000, icon: '✨', desc: 'Pulsing diamond sparkles that radiate around your profile image.', preview: 'circle' },
  { id: 'r_badge_ambassador', title: 'Ambassador Pin', category: 'Badges', cost: 300, icon: '🏅', desc: 'Special Kingdom Ambassador badge shown next to your name globally.', preview: 'badge' },
  { id: 'r_devo_proverbs', title: '30 Days in Proverbs (PDF Guide)', category: 'Devotionals', cost: 400, icon: '📚', desc: 'Complete 30-day wisdom devotional guide with reflection questions & journal prompts.', url: '#' },
  { id: 'r_devo_faith', title: 'Faith Over Fear (PDF Book)', category: 'Devotionals', cost: 600, icon: '📘', desc: 'Inspirational digital handbook on walking in victory and boldness.', url: '#' },
  { id: 'r_wall_hope', title: 'Verses of Hope 4K Wallpapers', category: 'Wallpapers', cost: 350, icon: '🖼️', desc: '10 High-resolution mobile wallpapers featuring beautifully styled Scripture.', url: '#' },
  { id: 'r_mystery_bronze', title: 'Bronze Mystery Box', category: 'Mystery', cost: 250, icon: '🎁', desc: 'Open for a random reward: badges, themes, wallpaper packs, or KC boosters!', isMystery: true },
  { id: 'r_mystery_gold', title: 'Gold Mystery Box', category: 'Mystery', cost: 750, icon: '👑', desc: 'High-tier mystery box with guaranteed rare profile frames, themes, or 2x boosters!', isMystery: true },
  { id: 'r_booster_2x', title: '2x Kingdom Coin Booster (24hr)', category: 'Boosters', cost: 500, icon: '⚡', desc: 'Doubles all Kingdom Coins earned from devotionals, quizzes, and referrals for 24 hours!', isBooster: true }
];

function setRewardCategoryFilter(cat) {
  activeRewardCategory = cat;
  renderRewardCenterCatalog();
}

function renderRewardCenterCatalog() {
  const container = document.getElementById('champions-rewards-catalog-grid');
  if (!container) return;

  container.innerHTML = '';
  const items = activeRewardCategory === 'all' 
    ? REWARDS_CATALOG 
    : REWARDS_CATALOG.filter(r => r.category.toLowerCase() === activeRewardCategory.toLowerCase());

  items.forEach(r => {
    const isMystery = r.isMystery;
    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
      isMystery 
        ? "bg-gradient-to-br from-purple-900/40 via-amber-900/30 to-zinc-900 border-amber-500/50 shadow-md hover:scale-[1.02]"
        : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-blue-500/40"
    }`;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
          ${r.icon}
        </div>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
          ${r.category}
        </span>
      </div>

      <div>
        <h4 class="text-sm font-black text-slate-900 dark:text-zinc-100 font-display">${r.title}</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">${r.desc}</p>
      </div>

      <div class="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div class="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
          ${r.cost.toLocaleString()} KC
        </div>
        <button onclick="redeemDigitalReward('${r.id}')" class="px-3.5 py-2 rounded-xl ${isMystery ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm">
          ${isMystery ? 'Open Box 🎁' : 'Redeem'}
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Redeem Digital Reward Handler
async function redeemDigitalReward(rewardId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to redeem rewards.", "error");
    return;
  }

  const reward = REWARDS_CATALOG.find(r => r.id === rewardId);
  if (!reward) return;

  const docRef = window.db.collection('users').doc(user.uid);
  const doc = await docRef.get();
  if (!doc.exists) return;

  const currentKc = doc.data().kingdomCoins || 0;
  if (currentKc < reward.cost) {
    window.showToast?.(`Insufficient Kingdom Coins. You need ${reward.cost - currentKc} more KC!`, "error");
    return;
  }

  if (reward.isMystery) {
    openMysteryBoxModal(reward, docRef, currentKc);
    return;
  }

  try {
    // Deduct KC
    await docRef.update({
      kingdomCoins: currentKc - reward.cost
    });

    // Add to User Rewards subcollection/array
    const userRewardRef = window.db.collection('users').doc(user.uid).collection('user_rewards').doc(reward.id);
    await userRewardRef.set({
      rewardId: reward.id,
      title: reward.title,
      category: reward.category,
      icon: reward.icon,
      cost: reward.cost,
      unlockedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    window.triggerConfetti?.();
    window.showToast?.(`🎉 Successfully redeemed: ${reward.title}!`, "success");
    renderMyRewardsLibrary();
  } catch (err) {
    window.handleFirestoreError?.(err, 'write', `users/${user.uid}/user_rewards`);
  }
}

// Mystery Box Opening Experience Modal
function openMysteryBoxModal(reward, userDocRef, currentKc) {
  const modal = document.getElementById('mystery-box-modal');
  if (!modal) return;

  const boxTitle = document.getElementById('mystery-modal-title');
  const boxStage = document.getElementById('mystery-box-stage');
  const revealStage = document.getElementById('mystery-reveal-stage');

  if (boxTitle) boxTitle.innerText = reward.title;
  if (boxStage) boxStage.classList.remove('hidden');
  if (revealStage) revealStage.classList.add('hidden');

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  window.currentMysteryContext = { reward, userDocRef, currentKc };
}

async function triggerMysteryBoxUnlock() {
  const ctx = window.currentMysteryContext;
  if (!ctx) return;

  const { reward, userDocRef, currentKc } = ctx;

  const boxStage = document.getElementById('mystery-box-stage');
  const revealStage = document.getElementById('mystery-reveal-stage');
  const rewardTitleEl = document.getElementById('mystery-reward-title');
  const rewardIconEl = document.getElementById('mystery-reward-icon');
  const rewardDescEl = document.getElementById('mystery-reward-desc');

  // Play animation shake
  const chestIcon = document.getElementById('mystery-chest-icon');
  if (chestIcon) chestIcon.classList.add('animate-bounce');

  setTimeout(async () => {
    // Determine random mystery prize
    const possiblePrizes = [
      { title: 'Rare Golden Halo Frame', icon: '💫', desc: 'Unlocked the Golden Halo avatar frame!' },
      { title: '2x Kingdom Coin Booster (24 Hours)', icon: '⚡', desc: 'Double KC active for 24 hours!' },
      { title: '300 Bonus Kingdom Coins', icon: '🪙', desc: 'Jackpot! You won 300 bonus KC back!' },
      { title: 'Verses of Hope 4K Wallpapers Pack', icon: '🖼️', desc: 'Unlocked 10 mobile HD wallpapers!' },
      { title: 'Kingdom Ambassador Profile Theme', icon: '🎨', desc: 'Unlocked royal purple & gold app theme!' }
    ];

    const prize = possiblePrizes[Math.floor(Math.random() * possiblePrizes.length)];

    // Deduct cost
    await userDocRef.update({
      kingdomCoins: currentKc - reward.cost
    });

    if (rewardTitleEl) rewardTitleEl.innerText = prize.title;
    if (rewardIconEl) rewardIconEl.innerText = prize.icon;
    if (rewardDescEl) rewardDescEl.innerText = prize.desc;

    if (boxStage) boxStage.classList.add('hidden');
    if (revealStage) revealStage.classList.remove('hidden');

    window.triggerConfetti?.();
    renderMyRewardsLibrary();
  }, 1200);
}

function closeMysteryBoxModal() {
  const modal = document.getElementById('mystery-box-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// "My Rewards" Library
async function renderMyRewardsLibrary() {
  const container = document.getElementById('my-rewards-library-grid');
  if (!container) return;

  const user = window.auth?.currentUser;
  if (!user) {
    container.innerHTML = `<div class="text-center py-6 text-xs text-slate-400">Sign in to view your unlocked digital rewards.</div>`;
    return;
  }

  try {
    const snap = await window.db.collection('users').doc(user.uid).collection('user_rewards').get();
    if (snap.empty) {
      container.innerHTML = `
        <div class="col-span-full p-8 text-center bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
          <div class="text-3xl mb-2">🎁</div>
          <div class="text-xs font-bold text-slate-700 dark:text-zinc-300">Your Reward Library is Empty</div>
          <div class="text-[11px] text-slate-400 mt-1">Redeem Kingdom Coins in the Reward Center to unlock exclusive themes, frames, and devotional guides!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    snap.forEach(doc => {
      const item = doc.data();
      const card = document.createElement('div');
      card.className = "p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs";
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
            ${item.icon || '🎁'}
          </div>
          <div>
            <div class="text-xs font-black text-slate-900 dark:text-zinc-100">${item.title}</div>
            <div class="text-[10px] text-slate-400 uppercase font-bold">${item.category}</div>
          </div>
        </div>
        <div>
          ${item.category === 'Themes' 
            ? `<button onclick="applyUserCustomTheme('${item.rewardId}')" class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer">Equip Theme</button>`
            : item.category === 'Devotionals' || item.category === 'Wallpapers'
            ? `<a href="#" onclick="window.showToast('Downloading digital bundle...', 'info'); return false;" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer">Download PDF</a>`
            : `<span class="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">Unlocked ✓</span>`
          }
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.warn("Error fetching user rewards:", e);
  }
}

// Apply Custom Theme / Frame
function applyUserCustomTheme(themeId) {
  if (window.setAppTheme) {
    window.setAppTheme(themeId, true);
  } else {
    localStorage.setItem('equipped_theme_id', themeId);
    window.showToast?.("✨ Theme equipped successfully across Home.cell!", "success");
  }
}

function applyEquippedUserCustomizations(userData) {
  // Can expand to dynamically style user avatar or frame rings
}

// Champions Sub-Tab Switcher
function switchChampionsSubTab(tabName) {
  const tabs = ['referrals', 'leaderboards', 'missions', 'store'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const panel = document.getElementById(`champ-subtab-${t}`);
    if (t === tabName) {
      if (btn) {
        btn.className = "champ-subtab-btn px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 bg-amber-500 text-slate-950 shadow-md";
      }
      if (panel) {
        panel.classList.remove('hidden');
      }
    } else {
      if (btn) {
        btn.className = "champ-subtab-btn px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800";
      }
      if (panel) {
        panel.classList.add('hidden');
      }
    }
  });

  if (tabName === 'store') {
    if (window.initKingdomStoreModule) window.initKingdomStoreModule();
    if (window.initDownloadsModule) window.initDownloadsModule();
  }

  if (window.lucide) window.lucide.createIcons();
}

function copyReferralCode() {
  const code = currentChampionUserData?.referralCode || document.getElementById('champ-ref-code-display')?.innerText || '';
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      window.showToast?.("📋 Referral code copied to clipboard!", "success");
      grantShareBonusOnceDaily();
    }).catch(() => {
      window.showToast?.("Failed to copy referral code.", "warning");
    });
  } else {
    copyReferralLink();
  }
}

// Global Exports
window.initChampionsModule = initChampionsModule;
window.switchChampionsSubTab = switchChampionsSubTab;
window.copyReferralLink = copyReferralLink;
window.copyReferralCode = copyReferralCode;
window.shareReferralLink = shareReferralLink;
window.shareReferralNative = shareReferralLink;
window.openReferralQrModal = openReferralQrModal;
window.showReferralQRCodeModal = openReferralQrModal;
window.closeReferralQrModal = closeReferralQrModal;
window.closeReferralQRCodeModal = closeReferralQrModal;
window.setLeaderboardTab = setLeaderboardTab;
window.switchLeaderboardTimeframe = setLeaderboardTab;
window.setLeaderboardCategory = setLeaderboardCategory;
window.setRewardCategoryFilter = setRewardCategoryFilter;
window.filterStoreItems = setRewardCategoryFilter;
window.redeemDigitalReward = redeemDigitalReward;
window.triggerMysteryBoxUnlock = triggerMysteryBoxUnlock;
window.openMysteryBoxAction = triggerMysteryBoxUnlock;
window.closeMysteryBoxModal = closeMysteryBoxModal;
window.processReferralForNewUser = processReferralForNewUser;
window.claimDailyMissionBonus = claimDailyMissionBonus;
window.claimDailyMissionsBonus = claimDailyMissionBonus;
window.handleMissionAction = handleMissionAction;

