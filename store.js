// store.js
// Home.cell - Kingdom Store 2.0, Real Purchases, Ownership Protection, Custom Requests & My Library

let storeProductsListener = null;
let storeRequestsListener = null;
let storeFeedbackListener = null;
let storeLibraryListener = null;

let activeStoreCategory = 'all';
let activeStoreCollection = 'all';
let storeSearchQuery = '';
let activeFeedbackFilter = 'all';

const DEFAULT_KINGDOM_PRODUCTS = [
  {
    id: "prod_wallpaper_morning_prayer",
    title: "Morning Light Scripture Wallpaper",
    description: "4K High-Resolution Christian wallpaper featuring Psalm 143:8 in elegant golden typography.",
    category: "Wallpapers",
    collectionName: "Morning & Night Prayer",
    coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    fileUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1920&q=80",
    priceKC: 50,
    price: 50,
    author: "Home.cell Creative",
    tags: ["Wallpaper", "Morning", "Psalm", "Scripture"],
    featured: true,
    published: true,
    downloadable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_wallpaper_unshakable_faith",
    title: "Unshakable Faith Poster Wallpaper",
    description: "A majestic mountain peak background paired with Hebrews 11:1 for mobile and desktop displays.",
    category: "Wallpapers",
    collectionName: "Faith & Purpose",
    coverUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    fileUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80",
    priceKC: 75,
    price: 75,
    author: "Home.cell Creative",
    tags: ["Faith", "Hebrews", "4K", "Mountains"],
    featured: true,
    published: true,
    downloadable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_quote_leadership",
    title: "Servant Leadership Quote Graphic",
    description: "Inspirational quote on Christlike leadership in printable PDF and high-res PNG formats.",
    category: "Quotes",
    collectionName: "Leadership & Framing",
    coverUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
    fileUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80",
    priceKC: 40,
    price: 40,
    author: "Home.cell Ministry",
    tags: ["Quote", "Leadership", "Printable"],
    featured: false,
    published: true,
    downloadable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_scripture_victory_pack",
    title: "Overcomer's Scripture Collection",
    description: "Handcrafted 10-card digital scripture memory pack focusing on spiritual victory and peace.",
    category: "Scripture Collections",
    collectionName: "Victory & Peace",
    coverUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
    fileUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1920&q=80",
    priceKC: 100,
    price: 100,
    author: "Super Admin",
    tags: ["Scripture", "Memory Cards", "Victory"],
    featured: true,
    published: true,
    downloadable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_devotional_journal_30day",
    title: "30-Day Spiritual Growth Journal",
    description: "Complete printable PDF prayer journal with guided daily prompts, scriptures, and reflection spaces.",
    category: "Devotionals & Guides",
    collectionName: "Prayer & Reflection",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    fileUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1920&q=80",
    priceKC: 150,
    price: 150,
    author: "Super Admin",
    tags: ["Journal", "Devotional", "Prayer", "PDF"],
    featured: true,
    published: true,
    downloadable: true,
    createdAt: new Date().toISOString()
  }
];

window.currentUserPurchasedItemIds = [];
let isPurchasingItem = false;
let storeCachedProducts = [];

function initKingdomStoreModule() {
  renderStoreKcHeader();
  checkSuperAdminStoreControls();
  syncStoreProducts();
  syncCustomRequests();
  syncFeedbackHub();
  syncMyLibrary();
  setupRequestPriceCalculator();
}

function checkSuperAdminStoreControls() {
  const user = window.auth?.currentUser;
  const isSuperAdmin = window.currentUserRole === 'Super Admin' || user?.email === 'danielgiobari644@gmail.com';
  const uploadBtn = document.getElementById('store-superadmin-upload-btn');
  if (uploadBtn) {
    if (isSuperAdmin) uploadBtn.classList.remove('hidden');
    else uploadBtn.classList.add('hidden');
  }
}

function renderStoreKcHeader() {
  const user = window.auth?.currentUser;
  let userKc = 100;
  if (window.currentKcBalance !== undefined) {
    userKc = window.currentKcBalance;
  } else if (window.currentUserProfile?.kingdomCoins !== undefined) {
    userKc = window.currentUserProfile.kingdomCoins;
  } else if (typeof currentChampionUserData !== 'undefined' && currentChampionUserData?.kingdomCoins !== undefined) {
    userKc = currentChampionUserData.kingdomCoins;
  }

  const balanceEls = document.querySelectorAll('.store-kc-balance-display');
  balanceEls.forEach(el => {
    el.innerText = `${userKc.toLocaleString()} KC`;
  });
}

function syncStoreProducts() {
  const container = document.getElementById('store-products-grid');
  if (!container) return;

  if (storeProductsListener) storeProductsListener();

  const db = window.db;
  if (!db) {
    storeCachedProducts = DEFAULT_KINGDOM_PRODUCTS;
    renderProductsGrid(DEFAULT_KINGDOM_PRODUCTS);
    return;
  }

  // Subscribe in real-time to all products
  storeProductsListener = db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snap => {
    let products = [];
    if (!snap.empty) {
      snap.forEach(doc => {
        const d = doc.data();
        if (d.published !== false) {
          products.push({ id: doc.id, ...d });
        }
      });
    }
    
    if (products.length === 0) {
      products = DEFAULT_KINGDOM_PRODUCTS;
      seedDefaultProductsIfEmpty();
    }

    storeCachedProducts = products;
    renderProductsGrid(products);
  }, err => {
    console.warn("Store products listener error:", err);
    storeCachedProducts = DEFAULT_KINGDOM_PRODUCTS;
    renderProductsGrid(DEFAULT_KINGDOM_PRODUCTS);
  });
}

async function seedDefaultProductsIfEmpty() {
  try {
    const db = window.db;
    if (!db) return;
    const isSuperAdmin = window.currentUserRole === 'Super Admin' || window.auth?.currentUser?.email === 'danielgiobari644@gmail.com';
    if (!isSuperAdmin) return;

    const snap = await db.collection('products').limit(1).get();
    if (snap.empty) {
      for (const prod of DEFAULT_KINGDOM_PRODUCTS) {
        await db.collection('products').doc(prod.id).set({
          ...prod,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }
  } catch (e) {
    console.warn("Error seeding default products:", e);
  }
}

function renderProductsGrid(products) {
  const container = document.getElementById('store-products-grid');
  if (!container) return;

  let filtered = products || storeCachedProducts || DEFAULT_KINGDOM_PRODUCTS;

  if (activeStoreCategory !== 'all') {
    filtered = filtered.filter(p => (p.category || '').toLowerCase() === activeStoreCategory.toLowerCase());
  }

  if (storeSearchQuery.trim()) {
    const q = storeSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.collectionName || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => String(t).toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 text-slate-400 dark:text-zinc-500 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
        <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl font-black">
          🛍️
        </div>
        <h4 class="font-black text-base text-slate-800 dark:text-zinc-200">No resources found matching your filter</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">Try selecting another category or clear your search query to see all Kingdom assets.</p>
        <button onclick="clearStoreFilters()" class="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer hover:shadow-md transition-all">Clear Filters</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const purchasedItemIds = window.currentUserPurchasedItemIds || [];
  let currentKc = 100;
  if (window.currentKcBalance !== undefined) currentKc = window.currentKcBalance;
  else if (window.currentUserProfile?.kingdomCoins !== undefined) currentKc = window.currentUserProfile.kingdomCoins;

  const isSuperAdmin = window.currentUserRole === 'Super Admin' || window.auth?.currentUser?.email === 'danielgiobari644@gmail.com';

  container.innerHTML = filtered.map(p => {
    const itemPrice = parseInt(p.priceKC !== undefined ? p.priceKC : (p.price !== undefined ? p.price : 50)) || 50;
    const isOwned = purchasedItemIds.includes(p.id);
    const hasEnoughKc = currentKc >= itemPrice;
    const coverImage = p.coverUrl || p.imageUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80';
    const downloadLink = p.fileUrl || p.downloadUrl || coverImage;

    let buttonHtml = '';
    if (isOwned) {
      buttonHtml = `
        <div class="flex items-center gap-2">
          <button disabled class="flex-1 py-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-500/30 cursor-default shadow-xs">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> Owned
          </button>
          <button onclick="downloadStoreProductDirect('${p.id}', '${encodeURIComponent(downloadLink)}', '${encodeURIComponent(p.title || 'Resource')}')" class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-600/20 active:scale-95" title="Download Resource to Device">
            <i data-lucide="download" class="w-4 h-4"></i> Download
          </button>
        </div>
      `;
    } else {
      buttonHtml = `
        <button id="btn-buy-prod-${p.id}" onclick="promptBuyProductModal('${p.id}')" class="w-full py-3.5 ${hasEnoughKc ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 hover:brightness-105 shadow-md shadow-amber-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'} font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98">
          <i data-lucide="${hasEnoughKc ? 'shopping-cart' : 'lock'}" class="w-4 h-4"></i>
          <span>${hasEnoughKc ? `Buy for ${itemPrice} KC` : `Unlock (${itemPrice} KC)`}</span>
        </button>
      `;
    }

    return `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:border-amber-500/40 relative">
        ${isSuperAdmin ? `
          <div class="absolute top-3 right-3 z-20 flex items-center gap-1">
            <button onclick="deleteStoreProductDirect('${p.id}', '${encodeURIComponent(p.title || '')}')" class="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-md" title="Delete Product (Super Admin)">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ''}

        <div>
          <div class="relative h-48 sm:h-52 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <img src="${coverImage}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"></div>
            
            <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              <span class="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30 shadow-xs">
                ${p.category || 'Resource'}
              </span>
              ${p.featured ? `<span class="px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">★ Featured</span>` : ''}
              ${isOwned ? `<span class="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">✓ Owned</span>` : ''}
            </div>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10">
              <span class="text-xs font-black text-amber-300 font-mono flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/70 backdrop-blur-sm border border-amber-400/20">
                🪙 ${itemPrice} KC
              </span>
              <span class="text-[10px] text-slate-300 font-semibold px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-xs">${p.collectionName || p.author || 'Home.cell Digital'}</span>
            </div>
          </div>

          <div class="p-5 space-y-2">
            <h4 class="font-black text-slate-900 dark:text-zinc-100 text-sm sm:text-base line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${p.title}</h4>
            <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">${p.description || 'High-quality Christian resource for spiritual nourishment.'}</p>
            ${(p.tags && p.tags.length > 0) ? `
              <div class="flex flex-wrap gap-1 pt-1">
                ${p.tags.slice(0, 3).map(tag => `<span class="text-[9px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">#${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="p-5 pt-0">
          ${buttonHtml}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function clearStoreFilters() {
  activeStoreCategory = 'all';
  storeSearchQuery = '';
  const searchInput = document.getElementById('store-search-input');
  if (searchInput) searchInput.value = '';

  const pills = document.querySelectorAll('.store-category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === 'all') {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer transition-all shadow-xs";
    } else {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all";
    }
  });

  renderProductsGrid(storeCachedProducts);
}

function selectStoreCategory(cat) {
  activeStoreCategory = cat;
  const pills = document.querySelectorAll('.store-category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === cat) {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer transition-all shadow-xs";
    } else {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all";
    }
  });

  renderProductsGrid(storeCachedProducts);
}

function handleStoreSearch(query) {
  storeSearchQuery = query || '';
  renderProductsGrid(storeCachedProducts);
}

async function promptBuyProductModal(productId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in or create an account to purchase Kingdom resources!", "info");
    if (window.openAuthModal) window.openAuthModal();
    return;
  }

  const db = window.db;
  let prod = storeCachedProducts.find(p => p.id === productId) || DEFAULT_KINGDOM_PRODUCTS.find(p => p.id === productId);

  if (db && (!prod || !prod.title)) {
    try {
      const doc = await db.collection('products').doc(productId).get();
      if (doc.exists) prod = { id: doc.id, ...doc.data() };
    } catch (e) {}
  }

  if (!prod) {
    window.showToast?.("Resource details not found.", "error");
    return;
  }

  const itemPrice = parseInt(prod.priceKC !== undefined ? prod.priceKC : (prod.price !== undefined ? prod.price : 50)) || 50;

  // Check ownership
  const purchasedItemIds = window.currentUserPurchasedItemIds || [];
  if (purchasedItemIds.includes(productId)) {
    window.showToast?.(`You already own "${prod.title}"! Open My Library to download.`, "info");
    switchStoreTab('my-library');
    return;
  }

  let currentKc = 100;
  if (window.currentKcBalance !== undefined) currentKc = window.currentKcBalance;
  else if (window.currentUserProfile?.kingdomCoins !== undefined) currentKc = window.currentUserProfile.kingdomCoins;

  if (currentKc < itemPrice) {
    const needed = itemPrice - currentKc;
    const shouldGoToMissions = confirm(`🪙 Insufficient Kingdom Coins!\n\nYou have: ${currentKc} KC\nThis item costs: ${itemPrice} KC\nYou need: ${needed} more KC.\n\nWould you like to open Daily Missions to earn free Kingdom Coins now?`);
    if (shouldGoToMissions) {
      if (window.switchTab) window.switchTab('champions');
      if (window.switchChampionsSubTab) window.switchChampionsSubTab('missions');
    }
    return;
  }

  const isConfirmed = confirm(`🛍️ Confirm Kingdom Store Purchase:\n\nResource: "${prod.title}"\nPrice: ${itemPrice} Kingdom Coins\n\nYour Current Balance: ${currentKc.toLocaleString()} KC\nBalance After Purchase: ${(currentKc - itemPrice).toLocaleString()} KC\n\nWould you like to complete this purchase now?`);
  if (!isConfirmed) return;

  const downloadLink = prod.fileUrl || prod.downloadUrl || prod.coverUrl || prod.imageUrl || '';
  executeProductPurchase(prod.id, itemPrice, prod.title, downloadLink, prod.category || 'Resource');
}

// Atomic Product Purchase Execution
async function executeProductPurchase(productId, costKC, title, fileUrl, category = 'Kingdom Store') {
  if (isPurchasingItem) return;

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to purchase items.", "warning");
    return;
  }

  if (window.currentUserPurchasedItemIds && window.currentUserPurchasedItemIds.includes(productId)) {
    window.showToast?.("You already own this item. Access it in My Library.", "info");
    switchStoreTab('my-library');
    return;
  }

  const db = window.db;
  if (!db) return;

  isPurchasingItem = true;
  const buyBtn = document.getElementById(`btn-buy-prod-${productId}`);
  if (buyBtn) {
    buyBtn.disabled = true;
    buyBtn.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> Purchasing...`;
  }

  window.showToast?.("Processing Kingdom Coins purchase...", "info");

  try {
    const userRef = db.collection('users').doc(user.uid);
    const rewardDocId = `${user.uid}_${productId}`;
    const rewardRef = db.collection('user_rewards').doc(rewardDocId);
    const purchaseRef = db.collection('purchases').doc(rewardDocId);
    const txnRef = db.collection('kc_transactions').doc();

    let newKcBalance = 0;

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User profile not found. Please log in again.");

      const userData = userDoc.data();
      const currentKc = parseInt(userData.kingdomCoins !== undefined ? userData.kingdomCoins : 100);

      if (currentKc < costKC) {
        throw new Error(`Insufficient KC. You have ${currentKc} KC, but this item requires ${costKC} KC.`);
      }

      newKcBalance = currentKc - costKC;
      const storePurchases = (userData.storePurchases || 0) + 1;

      transaction.update(userRef, {
        kingdomCoins: newKcBalance,
        storePurchases: storePurchases
      });

      const rewardPayload = {
        id: rewardDocId,
        userUid: user.uid,
        itemId: productId,
        title: title,
        category: category,
        kcCost: costKC,
        fileUrl: fileUrl || '',
        claimedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(rewardRef, rewardPayload);
      transaction.set(purchaseRef, rewardPayload);

      transaction.set(txnRef, {
        id: txnRef.id,
        userUid: user.uid,
        type: "debit",
        amount: costKC,
        title: `Purchased "${title}"`,
        description: `Kingdom Store resource unlock for ${costKC} KC`,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // Update Local and Global State
    if (!window.currentUserPurchasedItemIds) window.currentUserPurchasedItemIds = [];
    if (!window.currentUserPurchasedItemIds.includes(productId)) {
      window.currentUserPurchasedItemIds.push(productId);
    }

    window.currentKcBalance = newKcBalance;
    if (window.currentUserProfile) window.currentUserProfile.kingdomCoins = newKcBalance;
    if (typeof currentChampionUserData !== 'undefined' && currentChampionUserData) {
      currentChampionUserData.kingdomCoins = newKcBalance;
    }

    // Sound and Visual Feedback
    window.soundEngine?.playCoins?.();
    if (window.triggerConfetti) window.triggerConfetti();
    window.showToast?.(`🎉 Purchase successful! "${title}" is now available in My Library.`, "success");

    renderStoreKcHeader();
    renderProductsGrid(storeCachedProducts);
    syncMyLibrary();

    // Auto-prompt to switch to My Library or download
    setTimeout(() => {
      const wantToDownload = confirm(`Resource "${title}" unlocked successfully!\n\nWould you like to view it in My Library and download now?`);
      if (wantToDownload) {
        switchStoreTab('my-library');
      }
    }, 400);

  } catch (err) {
    console.error("Purchase failed:", err);
    window.showToast?.(err.message || "Purchase failed. Your Kingdom Coins were not deducted.", "error");
  } finally {
    isPurchasingItem = false;
    if (buyBtn) {
      buyBtn.disabled = false;
    }
  }
}

// Direct File Download for Base64 Data URLs and Web links
function downloadStoreProductDirect(productId, encodedUrl, encodedFileName) {
  const url = decodeURIComponent(encodedUrl || '');
  const fileName = decodeURIComponent(encodedFileName || 'HomeCell_Resource');
  
  if (!url) {
    window.showToast?.("Download link is currently unavailable for this item.", "warning");
    return;
  }

  window.showToast?.("Preparing your download...", "info");

  try {
    if (url.startsWith('data:')) {
      // Base64 Data URL Download
      const link = document.createElement('a');
      link.href = url;
      let ext = '.jpg';
      if (url.startsWith('data:application/pdf')) ext = '.pdf';
      else if (url.startsWith('data:image/png')) ext = '.png';
      else if (url.startsWith('data:audio/')) ext = '.mp3';
      else if (url.startsWith('data:application/zip')) ext = '.zip';
      
      const safeName = fileName.replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.download = `${safeName}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.showToast?.(`Downloaded "${fileName}" to your device!`, "success");
    } else {
      // Direct Web URL
      const link = document.createElement('a');
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `${fileName.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.showToast?.(`Opening resource download...`, "success");
    }
  } catch (err) {
    console.warn("Direct download trigger:", err);
    window.open(url, '_blank');
  }
}

function syncMyLibrary() {
  const container = document.getElementById('my-library-grid');
  if (!container) return;

  const user = window.auth?.currentUser;
  if (!user) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400 dark:text-zinc-500 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
          🔒
        </div>
        <p class="font-bold text-slate-700 dark:text-zinc-300">Sign in to view your purchased resources.</p>
        <button onclick="if(window.openAuthModal) window.openAuthModal();" class="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-blue-700 transition-all">Sign In</button>
      </div>
    `;
    return;
  }

  if (storeLibraryListener) storeLibraryListener();

  const db = window.db;
  if (!db) return;

  storeLibraryListener = db.collection('user_rewards')
    .where('userUid', '==', user.uid)
    .onSnapshot(snap => {
      window.currentUserPurchasedItemIds = [];
      const items = [];

      if (!snap.empty) {
        snap.forEach(doc => {
          const d = doc.data();
          items.push(d);
          if (d.itemId) window.currentUserPurchasedItemIds.push(d.itemId);
        });
      }

      renderMyLibraryGrid(items);
      renderProductsGrid(storeCachedProducts);
    }, err => {
      console.warn("Library snapshot error:", err);
    });
}

function renderMyLibraryGrid(items) {
  const container = document.getElementById('my-library-grid');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 text-slate-400 dark:text-zinc-500 bg-white/50 dark:bg-zinc-900/50 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-8">
        <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 text-2xl font-black">
          📥
        </div>
        <h4 class="font-black text-base text-slate-800 dark:text-zinc-200">Your Kingdom Library is Empty</h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">Explore the Kingdom Store and unlock Christian 4K wallpapers, scripture cards, and devotionals with your Kingdom Coins!</p>
        <button onclick="switchStoreTab('marketplace')" class="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer hover:shadow-md transition-all">Browse Kingdom Store</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = items.map(item => {
    const downloadLink = item.fileUrl || '';
    const safeTitle = item.title || 'Kingdom Resource';

    return `
      <div class="p-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800/90 rounded-3xl space-y-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              ${item.category || 'Unlocked'}
            </span>
            <span class="text-[10px] font-mono text-amber-500 font-bold">🪙 ${item.kcCost || 0} KC</span>
          </div>
          <h4 class="font-black text-slate-900 dark:text-zinc-100 text-sm sm:text-base line-clamp-1">${safeTitle}</h4>
          <p class="text-[11px] text-slate-400">Ready to download to your phone or computer</p>
        </div>

        <button onclick="downloadStoreProductDirect('${item.itemId || item.id}', '${encodeURIComponent(downloadLink)}', '${encodeURIComponent(safeTitle)}')" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all">
          <i data-lucide="download" class="w-4 h-4"></i> Download Resource
        </button>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function setupRequestPriceCalculator() {
  const typeSelect = document.getElementById('custom-req-type');
  if (!typeSelect) return;

  const PRICE_MAP = {
    'wallpaper': 150,
    'poster': 200,
    'quote': 100,
    'scripture': 120,
    'social': 150,
    'birthday': 180,
    'event': 250,
    'editing': 200,
    'other': 200
  };

  const updateCalc = () => {
    const type = typeSelect.value || 'wallpaper';
    const cost = PRICE_MAP[type] || 150;
    let userKc = 100;
    if (window.currentKcBalance !== undefined) userKc = window.currentKcBalance;
    else if (window.currentUserProfile?.kingdomCoins !== undefined) userKc = window.currentUserProfile.kingdomCoins;

    const afterKc = userKc - cost;

    const costEl = document.getElementById('custom-req-cost-display');
    const userBalanceEl = document.getElementById('custom-req-user-balance');
    const afterEl = document.getElementById('custom-req-after-balance');

    if (costEl) costEl.innerText = `${cost} KC`;
    if (userBalanceEl) userBalanceEl.innerText = `${userKc.toLocaleString()} KC`;
    if (afterEl) {
      afterEl.innerText = `${afterKc.toLocaleString()} KC`;
      afterEl.className = afterKc < 0 ? "font-extrabold text-red-500 font-mono" : "font-extrabold text-emerald-500 dark:text-emerald-400 font-mono";
    }
  };

  typeSelect.addEventListener('change', updateCalc);
  updateCalc();
}

// Super Admin Direct Product Upload Helpers
let uploadedStoreCoverBase64 = null;
let uploadedStoreFileBase64 = null;

function handleStoreCoverFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 8 * 1024 * 1024) {
    window.showToast?.("Image is too large. Please select an image under 8MB.", "warning");
    event.target.value = '';
    return;
  }

  // Compress image on client-side to ensure swift Firestore performance
  compressImageToDataUrl(file, 1200, 0.82).then(dataUrl => {
    uploadedStoreCoverBase64 = dataUrl;
    const previewBox = document.getElementById('store-upload-cover-preview-box');
    const previewImg = document.getElementById('store-upload-cover-preview');
    if (previewImg) previewImg.src = dataUrl;
    if (previewBox) previewBox.classList.remove('hidden');
    window.showToast?.("Cover image loaded directly from device!", "success");
  }).catch(err => {
    console.error("Image compression error:", err);
    window.showToast?.("Error loading image from device.", "error");
  });
}

function handleStoreResourceFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 6 * 1024 * 1024) {
    window.showToast?.("File is large. Files up to 6MB can be uploaded directly.", "warning");
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedStoreFileBase64 = e.target.result;
    const fileLabel = document.getElementById('store-upload-file-status');
    if (fileLabel) {
      fileLabel.innerText = `✓ Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      fileLabel.classList.remove('hidden');
    }
    window.showToast?.(`File "${file.name}" ready to upload!`, "success");
  };
  reader.readAsDataURL(file);
}

function clearStoreUploadCover() {
  uploadedStoreCoverBase64 = null;
  const input = document.getElementById('store-upload-cover-input');
  if (input) input.value = '';
  const previewBox = document.getElementById('store-upload-cover-preview-box');
  if (previewBox) previewBox.classList.add('hidden');
}

// Client-side Image Resizer & Compressor
function compressImageToDataUrl(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openSuperAdminStoreUploadModal() {
  const isSuperAdmin = window.currentUserRole === 'Super Admin' || window.auth?.currentUser?.email === 'danielgiobari644@gmail.com';
  if (!isSuperAdmin) {
    window.showToast?.("Super Admin credentials required to upload store resources.", "error");
    return;
  }
  const modal = document.getElementById('store-upload-modal');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeSuperAdminStoreUploadModal() {
  const modal = document.getElementById('store-upload-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleSuperAdminStoreUploadSubmit(e) {
  e.preventDefault();

  const isSuperAdmin = window.currentUserRole === 'Super Admin' || window.auth?.currentUser?.email === 'danielgiobari644@gmail.com';
  if (!isSuperAdmin) {
    window.showToast?.("Super Admin access required.", "error");
    return;
  }

  const title = document.getElementById('store-up-title')?.value?.trim();
  const category = document.getElementById('store-up-category')?.value || 'Wallpapers';
  const collectionName = document.getElementById('store-up-collection')?.value?.trim() || 'Home.cell Digital';
  const priceKC = parseInt(document.getElementById('store-up-price')?.value) || 50;
  const description = document.getElementById('store-up-desc')?.value?.trim();
  const author = document.getElementById('store-up-author')?.value?.trim() || 'Pastor Daniel (Super Admin)';
  const tagsStr = document.getElementById('store-up-tags')?.value?.trim() || '';
  const isFeatured = document.getElementById('store-up-featured')?.checked || false;

  const urlCoverInput = document.getElementById('store-up-cover-url')?.value?.trim();
  const urlFileInput = document.getElementById('store-up-file-url')?.value?.trim();

  const finalCoverUrl = uploadedStoreCoverBase64 || urlCoverInput || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80';
  const finalFileUrl = uploadedStoreFileBase64 || urlFileInput || finalCoverUrl;

  if (!title || !description) {
    window.showToast?.("Please enter both title and description.", "warning");
    return;
  }

  const submitBtn = document.getElementById('btn-store-upload-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Publishing to Store...`;
  }

  try {
    const db = window.db;
    if (!db) throw new Error("Database offline.");

    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      id: prodId,
      title: title,
      category: category,
      collectionName: collectionName,
      priceKC: priceKC,
      price: priceKC,
      description: description,
      author: author,
      coverUrl: finalCoverUrl,
      imageUrl: finalCoverUrl,
      fileUrl: finalFileUrl,
      downloadUrl: finalFileUrl,
      tags: tags.length > 0 ? tags : [category, "Kingdom"],
      featured: isFeatured,
      published: true,
      downloadable: true,
      downloadsCount: 0,
      uploadedByEmail: window.auth?.currentUser?.email || 'danielgiobari644@gmail.com',
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('products').doc(prodId).set(payload);
    await db.collection('storeProducts').doc(prodId).set(payload).catch(() => {});

    window.soundEngine?.playSuccess?.();
    window.showToast?.(`🎉 "${title}" uploaded to Kingdom Store successfully!`, "success");

    // Reset Form
    document.getElementById('store-upload-form')?.reset();
    clearStoreUploadCover();
    uploadedStoreFileBase64 = null;
    const fileStatus = document.getElementById('store-upload-file-status');
    if (fileStatus) fileStatus.classList.add('hidden');

    closeSuperAdminStoreUploadModal();
    syncStoreProducts();

  } catch (err) {
    console.error("Upload product error:", err);
    window.showToast?.("Failed to upload product: " + err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Publish to Kingdom Store 🛍️";
    }
  }
}

async function deleteStoreProductDirect(productId, encodedTitle) {
  const isSuperAdmin = window.currentUserRole === 'Super Admin' || window.auth?.currentUser?.email === 'danielgiobari644@gmail.com';
  if (!isSuperAdmin) {
    window.showToast?.("Super Admin access required.", "error");
    return;
  }

  const title = decodeURIComponent(encodedTitle || 'Product');
  const confirmDelete = confirm(`Are you sure you want to remove "${title}" from the Kingdom Store catalog?`);
  if (!confirmDelete) return;

  try {
    const db = window.db;
    if (!db) return;

    await db.collection('products').doc(productId).delete();
    await db.collection('storeProducts').doc(productId).delete().catch(() => {});

    window.showToast?.(`"${title}" deleted from Kingdom Store.`, "info");
    syncStoreProducts();
  } catch (err) {
    window.showToast?.("Error deleting product: " + err.message, "error");
  }
}

// Custom Requests Handling
async function handleCustomRequestSubmit(e) {
  e.preventDefault();

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to submit custom requests!", "error");
    if (window.openAuthModal) window.openAuthModal();
    return;
  }

  const type = document.getElementById('custom-req-type')?.value || 'wallpaper';
  const description = document.getElementById('custom-req-desc')?.value?.trim();
  const desiredResult = document.getElementById('custom-req-desired')?.value?.trim();

  if (!description || !desiredResult) {
    window.showToast?.("Please fill out both description and desired text.", "warning");
    return;
  }

  const PRICE_MAP = {
    'wallpaper': 150,
    'poster': 200,
    'quote': 100,
    'scripture': 120,
    'social': 150,
    'birthday': 180,
    'event': 250,
    'editing': 200,
    'other': 200
  };

  const costKC = PRICE_MAP[type] || 150;
  let userKc = 100;
  if (window.currentKcBalance !== undefined) userKc = window.currentKcBalance;
  else if (window.currentUserProfile?.kingdomCoins !== undefined) userKc = window.currentUserProfile.kingdomCoins;

  if (userKc < costKC) {
    window.showToast?.(`Not enough KC. You have ${userKc} KC, but this request requires ${costKC} KC.`, "warning");
    return;
  }

  const reqNum = Math.floor(100000 + Math.random() * 900000);
  const reqId = `REQ-2026-${reqNum}`;
  const db = window.db;
  if (!db) return;

  window.showToast?.("Submitting custom design request...", "info");

  try {
    const userRef = db.collection('users').doc(user.uid);
    const reqRef = db.collection('custom_requests').doc(reqId);
    const txnRef = db.collection('kc_transactions').doc();

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User profile not found.");

      const currentBalance = userDoc.data().kingdomCoins || 0;
      if (currentBalance < costKC) throw new Error("Insufficient balance.");

      transaction.update(userRef, {
        kingdomCoins: currentBalance - costKC
      });

      transaction.set(reqRef, {
        id: reqId,
        userUid: user.uid,
        userName: window.currentUserProfile?.displayName || user.displayName || user.email || 'Member',
        userEmail: user.email || '',
        type: type,
        description: description,
        desiredResult: desiredResult,
        desiredText: desiredResult,
        costKC: costKC,
        status: "Submitted",
        resultUrl: "",
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      transaction.set(txnRef, {
        id: txnRef.id,
        userUid: user.uid,
        type: "debit",
        amount: costKC,
        title: `Custom Request (${reqId})`,
        description: `Reserved ${costKC} KC for ${type} creation`,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    document.getElementById('custom-req-form')?.reset();

    const newBal = userKc - costKC;
    window.currentKcBalance = newBal;
    if (window.currentUserProfile) window.currentUserProfile.kingdomCoins = newBal;
    
    renderStoreKcHeader();
    window.soundEngine?.playCoins?.();
    window.showToast?.(`🎉 Request ${reqId} submitted! Our media team is on it.`, "success");
    syncCustomRequests();

  } catch (err) {
    console.error("Custom request failed:", err);
    window.showToast?.(err.message || "Failed to submit request.", "error");
  }
}

function syncCustomRequests() {
  const container = document.getElementById('my-custom-requests-list');
  if (!container) return;

  const user = window.auth?.currentUser;
  if (!user) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Sign in to view your custom creation requests.</p>`;
    return;
  }

  if (storeRequestsListener) storeRequestsListener();

  const db = window.db;
  if (!db) return;

  storeRequestsListener = db.collection('custom_requests')
    .where('userUid', '==', user.uid)
    .onSnapshot(snap => {
      if (snap.empty) {
        container.innerHTML = `
          <div class="col-span-full text-center py-8 text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
            <i data-lucide="sparkles" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="font-bold text-slate-700 dark:text-zinc-300">No custom orders yet.</p>
            <p class="text-xs mt-0.5">Submit a custom wallpaper or banner request above!</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const requests = [];
      snap.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));

      container.innerHTML = requests.map(r => `
        <div class="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-3 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-mono bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
              ${r.id}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'}">
              ${r.status}
            </span>
          </div>

          <div>
            <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">${r.desiredResult || r.desiredText || 'Custom Design'}</p>
            <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">${r.description || ''}</p>
          </div>

          ${(r.resultUrl || r.deliverableUrl) ? `
            <button onclick="downloadStoreProductDirect('${r.id}', '${encodeURIComponent(r.resultUrl || r.deliverableUrl)}', '${encodeURIComponent(r.desiredResult || 'Custom_Design')}')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Download Finished Graphic
            </button>
          ` : ''}
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    }, err => console.warn("Requests snapshot error:", err));
}

function syncFeedbackHub() {
  const container = document.getElementById('feedback-hub-list');
  if (!container) return;

  if (storeFeedbackListener) storeFeedbackListener();

  const db = window.db;
  if (!db) return;

  storeFeedbackListener = db.collection('feedback_items').orderBy('createdAt', 'desc').onSnapshot(snap => {
    let items = [];
    if (!snap.empty) {
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    }

    if (items.length === 0) {
      container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">No feedback submitted yet. Share your suggestions above!</div>`;
      return;
    }

    const userUid = window.auth?.currentUser?.uid;

    container.innerHTML = items.map(item => {
      const hasUpvoted = userUid && item.upvotes && item.upvotes[userUid];
      return `
        <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-start gap-3 shadow-xs">
          <button onclick="toggleFeedbackUpvote('${item.id}')" class="flex flex-col items-center justify-center p-2.5 rounded-xl border ${hasUpvoted ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'} transition-all cursor-pointer shrink-0">
            <i data-lucide="chevron-up" class="w-4 h-4"></i>
            <span class="text-xs font-black font-mono">${item.upvotesCount || 0}</span>
          </button>
          <div class="flex-1 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">${item.type || 'Suggestion'}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500">${item.status || 'Under Review'}</span>
            </div>
            <h5 class="font-bold text-slate-900 dark:text-zinc-100 text-xs">${item.title}</h5>
            <p class="text-xs text-slate-500 dark:text-zinc-400">${item.description}</p>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }, err => console.warn("Feedback snapshot error:", err));
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to submit suggestions.", "warning");
    return;
  }

  const type = document.getElementById('feedback-type')?.value || 'Feature Request';
  const title = document.getElementById('feedback-title')?.value?.trim();
  const description = document.getElementById('feedback-desc')?.value?.trim();

  if (!title || !description) return;

  const db = window.db;
  if (!db) return;

  const itemRef = db.collection('feedback_items').doc();

  try {
    await itemRef.set({
      id: itemRef.id,
      userUid: user.uid,
      userName: window.currentUserProfile?.displayName || user.displayName || user.email || 'Member',
      type: type,
      title: title,
      description: description,
      upvotesCount: 1,
      upvotes: { [user.uid]: true },
      status: "Under Review",
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('feedback-form')?.reset();
    window.showToast?.("Suggestion posted to Feedback Hub!", "success");
    syncFeedbackHub();
  } catch (err) {
    window.showToast?.("Failed to post suggestion.", "error");
  }
}

async function toggleFeedbackUpvote(itemId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to upvote suggestions.", "warning");
    return;
  }

  const db = window.db;
  if (!db) return;

  const itemRef = db.collection('feedback_items').doc(itemId);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(itemRef);
      if (!doc.exists) return;

      const data = doc.data();
      const upvotes = data.upvotes || {};
      let count = data.upvotesCount || 0;

      if (upvotes[user.uid]) {
        delete upvotes[user.uid];
        count = Math.max(0, count - 1);
      } else {
        upvotes[user.uid] = true;
        count += 1;
      }

      transaction.update(itemRef, {
        upvotes: upvotes,
        upvotesCount: count
      });
    });
  } catch (e) {}
}

function switchStoreTab(tabKey) {
  const sections = ['marketplace', 'custom-requests', 'feedback-hub', 'my-library'];
  sections.forEach(s => {
    const el = document.getElementById(`store-section-${s}`);
    const btn = document.getElementById(`store-tab-btn-${s}`);
    if (el) {
      if (s === tabKey) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
    if (btn) {
      if (s === tabKey) {
        btn.className = "store-nav-btn px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black bg-amber-500 text-slate-950 cursor-pointer shadow-sm transition-all flex items-center gap-2 shrink-0";
      } else {
        btn.className = "store-nav-btn px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all flex items-center gap-2 shrink-0";
      }
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

window.initKingdomStoreModule = initKingdomStoreModule;
window.selectStoreCategory = selectStoreCategory;
window.handleStoreSearch = handleStoreSearch;
window.clearStoreFilters = clearStoreFilters;
window.promptBuyProductModal = promptBuyProductModal;
window.executeProductPurchase = executeProductPurchase;
window.downloadStoreProductDirect = downloadStoreProductDirect;
window.handleCustomRequestSubmit = handleCustomRequestSubmit;
window.handleFeedbackSubmit = handleFeedbackSubmit;
window.toggleFeedbackUpvote = toggleFeedbackUpvote;
window.switchStoreTab = switchStoreTab;
window.openSuperAdminStoreUploadModal = openSuperAdminStoreUploadModal;
window.closeSuperAdminStoreUploadModal = closeSuperAdminStoreUploadModal;
window.openStoreUploadModal = openSuperAdminStoreUploadModal;
window.closeStoreUploadModal = closeSuperAdminStoreUploadModal;
window.handleStoreCoverFileSelect = handleStoreCoverFileSelect;
window.handleStoreResourceFileSelect = handleStoreResourceFileSelect;
window.clearStoreUploadCover = clearStoreUploadCover;
window.handleSuperAdminStoreUploadSubmit = handleSuperAdminStoreUploadSubmit;
window.deleteStoreProductDirect = deleteStoreProductDirect;
