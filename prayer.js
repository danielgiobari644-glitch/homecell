// prayer.js
// Prayer Request Wall, Intercessory Prayer Counters & Answered Praise

let prayerWallListener = null;

function initPrayerModule() {
  syncPrayerWall();
}

function syncPrayerWall() {
  const container = document.getElementById('prayer-requests-container');
  if (!container) return;

  if (prayerWallListener) prayerWallListener();

  const db = window.db;
  if (!db) return;

  prayerWallListener = db.collection('prayer_requests')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      if (snap.empty) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12 text-slate-400">
            <span class="text-3xl">🙏</span>
            <p class="font-bold mt-2">No active prayer requests.</p>
            <p class="text-xs">Be the first to share your petition or praise!</p>
          </div>
        `;
        return;
      }

      const items = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      renderPrayerGrid(items);
    }, err => console.warn("Prayer wall error:", err));
}

function renderPrayerGrid(items) {
  const container = document.getElementById('prayer-requests-container');
  if (!container) return;

  const user = window.auth?.currentUser;

  container.innerHTML = items.map(p => {
    const isAnswered = p.status === 'Answered';
    const prayCount = p.prayerCount || 0;
    const hasPrayed = user && p.prayingUsers && p.prayingUsers[user.uid] === true;

    return `
      <div class="p-6 bg-white dark:bg-zinc-900 border ${isAnswered ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20' : 'border-slate-200 dark:border-zinc-800'} rounded-3xl space-y-4 shadow-xs flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isAnswered ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'}">
              ${isAnswered ? '🙌 Praise Report / Answered' : '🙏 Prayer Need'}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">${p.authorName || 'Anonymous Believer'}</span>
          </div>

          <h4 class="font-black text-slate-900 dark:text-zinc-100 text-sm">${p.title}</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">${p.description}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400">${prayCount} people prayed</span>
          
          <button onclick="prayForRequest('${p.id}')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            hasPrayed 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300' 
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
          }">
            <span>🙏</span> ${hasPrayed ? 'Prayed' : 'Pray for This'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

async function prayForRequest(prayerId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to pray with brethren.", "warning");
    return;
  }

  const db = window.db;
  if (!db) return;

  const prayerRef = db.collection('prayer_requests').doc(prayerId);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(prayerRef);
      if (!doc.exists) return;

      const data = doc.data();
      const prayingUsers = data.prayingUsers || {};
      let count = data.prayerCount || 0;

      if (prayingUsers[user.uid]) {
        delete prayingUsers[user.uid];
        count = Math.max(0, count - 1);
      } else {
        prayingUsers[user.uid] = true;
        count += 1;
      }

      transaction.update(prayerRef, {
        prayingUsers: prayingUsers,
        prayerCount: count
      });
    });

    // Award mission progress
    await db.collection('users').doc(user.uid).update({
      hasPrayedForOthersToday: true
    }).catch(() => {});

    window.soundEngine?.playSuccess?.();
    window.showToast?.("🙏 You lifted up this prayer request!", "success");
  } catch (e) {
    window.showToast?.("Could not register prayer.", "error");
  }
}

async function submitPrayerRequest(e) {
  e.preventDefault();

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to submit a prayer request.", "error");
    return;
  }

  const title = document.getElementById('prayer-input-title')?.value?.trim();
  const desc = document.getElementById('prayer-input-desc')?.value?.trim();
  const isAnon = document.getElementById('prayer-is-anon')?.checked || false;

  if (!title || !desc) return;

  const db = window.db;
  if (!db) return;

  const reqRef = db.collection('prayer_requests').doc();
  const name = isAnon ? 'Anonymous Believer' : (window.currentUserProfile?.displayName || user.displayName || user.email || 'Member');

  try {
    await reqRef.set({
      id: reqRef.id,
      authorUid: user.uid,
      authorName: name,
      title: title,
      description: desc,
      isAnonymous: isAnon,
      status: "Active",
      prayerCount: 1,
      prayingUsers: { [user.uid]: true },
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('prayer-form')?.reset();
    window.showToast?.("🙏 Prayer request posted to the Fellowship Wall!", "success");
    syncPrayerWall();
  } catch (err) {
    window.showToast?.("Failed to post prayer request.", "error");
  }
}

window.initPrayerModule = initPrayerModule;
window.prayForRequest = prayForRequest;
window.submitPrayerRequest = submitPrayerRequest;
