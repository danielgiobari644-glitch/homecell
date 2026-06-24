// js/prayers.js
// Prayer & Intercession Room logic with filters, urgent flare animation, and transactions for agreement tracking

let selectedPrayerCategory = 'all';

function initPrayersModule() {
  syncPrayersFeed();
}

function syncPrayersFeed() {
  const deck = document.getElementById('prayers-deck');
  if (!deck) return;

  window.db.collection('prayer_petitions')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      renderPrayers(snap);
    }, err => window.handleFirestoreError(err, 'list', 'prayer_petitions'));
}

function renderPrayers(snap) {
  const deck = document.getElementById('prayers-deck');
  if (!deck) return;

  deck.innerHTML = '';
  
  let visibleCount = 0;

  snap.forEach(doc => {
    const p = doc.data();
    const pid = doc.id;

    // Filter by selected category
    if (selectedPrayerCategory !== 'all' && p.category !== selectedPrayerCategory) {
      return;
    }

    visibleCount++;

    const isUrgent = p.urgency === true;
    const userAgreed = p.agreements?.[window.auth.currentUser?.uid] === true;
    const formattedDate = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    const card = document.createElement('div');
    card.className = `p-6 bg-white dark:bg-zinc-900 border rounded-3xl space-y-4 shadow-sm transition-all duration-300 relative group ${
      isUrgent
        ? 'border-rose-400 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/5'
        : 'border-slate-200 dark:border-zinc-800'
    }`;

    card.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider ${
              isUrgent
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'
            }">${p.category}</span>
            ${
              isUrgent
                ? `<span class="flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 animate-pulse bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-lg">
                     <i data-lucide="flame" class="w-3 h-3 text-rose-500 fill-current animate-bounce"></i> URGENT
                   </span>`
                : ''
            }
          </div>
          <p class="text-sm text-slate-800 dark:text-zinc-200 font-medium leading-relaxed pt-2">${p.text}</p>
        </div>
        
        ${
          p.authorUid === window.auth.currentUser?.uid || window.currentUserRole === 'Super Admin'
            ? `<button onclick="deletePrayerPetition('${pid}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer">
                 <i data-lucide="trash-2" class="w-4 h-4"></i>
               </button>`
            : ''
        }
      </div>

      <div class="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
        <span class="flex items-center gap-1"><i data-lucide="user" class="w-3.5 h-3.5 text-blue-500"></i> ${p.authorName} • <span class="font-normal font-mono">${formattedDate}</span></span>
        
        <button onclick="toggleAgreement('${pid}')" class="px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer border ${
          userAgreed
            ? 'bg-rose-600 text-white border-transparent shadow-md'
            : 'bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
        }">
          <i data-lucide="heart" class="w-4 h-4 ${userAgreed ? 'fill-current text-white animate-pulse' : 'text-rose-500'}"></i>
          <span>${userAgreed ? 'Standing in Agreement' : 'Stand in Agreement'}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] ${
            userAgreed
              ? 'bg-rose-700 text-rose-100'
              : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
          }">${p.agreementsCount || 0}</span>
        </button>
      </div>
    `;

    deck.appendChild(card);
  });

  if (visibleCount === 0) {
    deck.innerHTML = `
      <div class="text-center py-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400">
        <i data-lucide="heart-handshake" class="w-12 h-12 mx-auto mb-3 opacity-50 text-slate-300"></i>
        <p class="font-bold">No intercession requests published yet in this category.</p>
        <p class="text-xs mt-1">Be the first to publish your request and stand in agreement with others!</p>
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function filterPrayers(category) {
  selectedPrayerCategory = category;
  
  // Update button active state classes
  const filterBtns = ['all', 'Health', 'Family', 'Career', 'Spiritual Growth'];
  filterBtns.forEach(btn => {
    const el = document.getElementById(`btn-pfilter-${btn === 'Spiritual Growth' ? 'Spiritual' : btn}`);
    if (el) {
      if (category === btn) {
        el.className = "px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 shadow-sm";
      } else {
        el.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors";
      }
    }
  });

  syncPrayersFeed();
}

function toggleAgreement(petitionId) {
  const uid = window.auth.currentUser?.uid;
  if (!uid) return;

  const ref = window.db.collection('prayer_petitions').doc(petitionId);

  window.db.runTransaction(transaction => {
    return transaction.get(ref).then(doc => {
      if (!doc.exists) return;
      const data = doc.data();
      const agreements = data.agreements || {};
      
      let isRemoved = false;
      if (agreements[uid]) {
        delete agreements[uid];
        isRemoved = true;
      } else {
        agreements[uid] = true;
      }

      const count = Object.keys(agreements).length;
      transaction.update(ref, {
        agreements: agreements,
        agreementsCount: count
      });
      return isRemoved;
    });
  }).then(isRemoved => {
    if (isRemoved) {
      window.showToast?.("Agreement removed.");
    } else {
      window.showToast?.("Amen! You are standing in agreement for this petition.");
    }
  }).catch(err => window.handleFirestoreError(err, 'write', `prayer_petitions/${petitionId}`));
}

function submitPrayerPetition(category, urgency, text) {
  const user = window.auth.currentUser;
  const profile = window.currentUserProfile;
  if (!user || !profile) return;

  const docId = window.db.collection('prayer_petitions').doc().id;

  window.db.collection('prayer_petitions').doc(docId).set({
    id: docId,
    category,
    urgency,
    text,
    authorUid: user.uid,
    authorName: profile.displayName || user.email,
    agreementsCount: 0,
    agreements: {},
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => {
      window.showToast?.("Your intercession petition has been published globally.");
    })
    .catch(err => window.handleFirestoreError(err, 'create', `prayer_petitions/${docId}`));
}

function deletePrayerPetition(petitionId) {
  const isConfirmed = confirm("Are you sure you want to permanently delete this prayer request?");
  if (!isConfirmed) return;

  window.db.collection('prayer_petitions').doc(petitionId).delete()
    .then(() => window.showToast?.("Petition evicted."))
    .catch(err => window.handleFirestoreError(err, 'delete', `prayer_petitions/${petitionId}`));
}

// Form listener
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('prayer-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('prayer-category').value;
      const urgency = document.getElementById('prayer-urgency').checked;
      const text = document.getElementById('prayer-text').value.trim();

      if (!text) return;

      submitPrayerPetition(category, urgency, text);
      form.reset();
    });
  }
});

// Expose globally
window.initPrayersModule = initPrayersModule;
window.filterPrayers = filterPrayers;
window.toggleAgreement = toggleAgreement;
window.deletePrayerPetition = deletePrayerPetition;
