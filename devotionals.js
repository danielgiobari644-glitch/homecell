// devotionals.js
// Daily Devotionals Engine with audio narration, streak tracking & reflections

let devotionalsListener = null;
let currentDevotionalModalData = null;

function initDevotionalsModule() {
  syncDevotionalsList();
}

function syncDevotionalsList() {
  const container = document.getElementById('devotionals-list-container');
  if (!container) return;

  if (devotionalsListener) devotionalsListener();

  const db = window.db;
  if (!db) return;

  devotionalsListener = db.collection('daily_devotionals')
    .onSnapshot(snap => {
      if (snap.empty) {
        db.collection('devotionals').get().then(fallbackSnap => {
          if (fallbackSnap.empty) {
            container.innerHTML = `
              <div class="col-span-full text-center py-12 text-slate-400">
                <i data-lucide="sun" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                <p class="font-bold">No devotionals published yet.</p>
              </div>
            `;
            return;
          }
          const items = [];
          window.devotionalsCache = window.devotionalsCache || {};
          fallbackSnap.forEach(doc => {
            const d = doc.data();
            d.id = doc.id;
            window.devotionalsCache[doc.id] = d;
            items.push(d);
          });
          renderDevotionalsGrid(items);
        }).catch(() => {
          container.innerHTML = `
            <div class="col-span-full text-center py-12 text-slate-400">
              <i data-lucide="sun" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
              <p class="font-bold">No devotionals published yet.</p>
            </div>
          `;
        });
        return;
      }

      const items = [];
      window.devotionalsCache = window.devotionalsCache || {};
      snap.forEach(doc => {
        const d = doc.data();
        d.id = doc.id;
        window.devotionalsCache[doc.id] = d;
        items.push(d);
      });

      renderDevotionalsGrid(items);
    }, err => console.warn("Devotionals error:", err));
}

function renderDevotionalsGrid(items) {
  const container = document.getElementById('devotionals-list-container');
  if (!container) return;

  container.innerHTML = items.map(d => `
    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        ${d.imageUrl ? `
          <div class="relative h-44 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <img src="${d.imageUrl}" alt="${d.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase font-mono">
              ${d.devotionalDate}
            </div>
          </div>
        ` : ''}

        <div class="p-5 space-y-2">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">${d.scripture}</span>
          <h4 class="font-black text-slate-900 dark:text-zinc-100 text-base line-clamp-1">${d.title}</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">${d.body}</p>
        </div>
      </div>

      <div class="p-5 pt-0">
        <button onclick="openFullDevotionalModal(window.devotionalsCache['${d.id}'])" class="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all">
          <i data-lucide="book-open" class="w-4 h-4"></i> Read Devotional
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openFullDevotionalModal(devotional) {
  if (!devotional) return;
  currentDevotionalModalData = devotional;

  const modal = document.getElementById('devotional-full-modal');
  const titleEl = document.getElementById('modal-devotional-title');
  const scriptureEl = document.getElementById('modal-devotional-scripture');
  const dateEl = document.getElementById('modal-devotional-date');
  const bodyEl = document.getElementById('modal-devotional-body');
  const prayerEl = document.getElementById('modal-devotional-prayer');
  const imgEl = document.getElementById('modal-devotional-img');

  if (titleEl) titleEl.innerText = devotional.title;
  if (scriptureEl) scriptureEl.innerText = devotional.scripture;
  if (dateEl) dateEl.innerText = devotional.devotionalDate;
  if (bodyEl) bodyEl.innerText = devotional.body;
  if (prayerEl) prayerEl.innerText = devotional.prayer || "Lord, let Your Word guide my steps today and transform my heart. In Jesus' name, Amen.";

  if (imgEl) {
    if (devotional.imageUrl) {
      imgEl.src = devotional.imageUrl;
      imgEl.parentElement.classList.remove('hidden');
    } else {
      imgEl.parentElement.classList.add('hidden');
    }
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();

  // Mark devotional as completed for the day
  markDevotionalCompleted(devotional.id);
}

function closeFullDevotionalModal() {
  const modal = document.getElementById('devotional-full-modal');
  if (modal) modal.classList.add('hidden');
  if (window.stopDevotionalSpeech) window.stopDevotionalSpeech();
}

async function markDevotionalCompleted(devotionalId) {
  const user = window.auth?.currentUser;
  const db = window.db;
  if (!user || !db) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const readKey = `devotional_read_${user.uid}_${todayStr}`;
  if (sessionStorage.getItem(readKey)) return;
  sessionStorage.setItem(readKey, 'true');

  try {
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    if (doc.exists) {
      const u = doc.data();
      const devotions = (u.totalDevotions || 0) + 1;
      const curKc = u.kingdomCoins || 0;

      await userRef.update({
        readDevotionalToday: true,
        totalDevotions: devotions,
        kingdomCoins: curKc + 10,
        totalKcEarned: (u.totalKcEarned || curKc) + 10
      });

      if (window.currentUserProfile) {
        window.currentUserProfile.readDevotionalToday = true;
        window.currentUserProfile.totalDevotions = devotions;
        window.currentUserProfile.kingdomCoins = curKc + 10;
      }

      window.recordKcTransaction?.('credit', 10, 'Daily Devotional Reward', 'Completed morning devotional study');
      window.soundEngine?.playCoins?.();
      window.showToast?.("☀️ Devotional completed! +10 Kingdom Coins earned!", "success");
    }
  } catch (e) {}
}

window.initDevotionalsModule = initDevotionalsModule;
window.openFullDevotionalModal = openFullDevotionalModal;
window.closeFullDevotionalModal = closeFullDevotionalModal;
