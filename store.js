// store.js
// Home.cell - Kingdom Store 2.0, Custom Creation Requests, Feedback Hub & My Library

let storeProductsListener = null;
let storeRequestsListener = null;
let storeFeedbackListener = null;
let storeLibraryListener = null;

let activeStoreCategory = 'all';
let activeStoreCollection = 'all';
let storeSearchQuery = '';
let activeFeedbackFilter = 'all'; // 'all' | 'popular' | 'under_review' | 'planned' | 'completed'

// Default sample products if Firestore is empty to ensure immediate richness
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
    coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    fileUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1920&q=80",
    priceKC: 40,
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
    author: "Super Admin",
    tags: ["Journal", "Devotional", "Prayer", "PDF"],
    featured: true,
    published: true,
    downloadable: true,
    createdAt: new Date().toISOString()
  }
];

// Initialize Kingdom Store Module
function initKingdomStoreModule() {
  renderStoreKcHeader();
  syncStoreProducts();
  syncCustomRequests();
  syncFeedbackHub();
  syncMyLibrary();
  syncKcTransactionHistory();
  setupRequestPriceCalculator();
}

// 1. Render KC Header Balance
function renderStoreKcHeader() {
  const user = window.auth?.currentUser;
  const userKc = window.currentUserProfile?.kingdomCoins || currentChampionUserData?.kingdomCoins || 0;
  
  const balanceEls = document.querySelectorAll('.store-kc-balance-display');
  balanceEls.forEach(el => {
    el.innerText = `${userKc.toLocaleString()} KC`;
  });
}

// 2. Sync Store Products
function syncStoreProducts() {
  const container = document.getElementById('store-products-grid');
  if (!container) return;

  if (storeProductsListener) storeProductsListener();

  const db = window.db;
  if (!db) return;

  storeProductsListener = db.collection('products').where('published', '==', true).onSnapshot(snap => {
    let products = [];
    if (!snap.empty) {
      snap.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
    } else {
      // Seed default products if collection is brand new
      products = DEFAULT_KINGDOM_PRODUCTS;
      seedDefaultProductsIfEmpty();
    }

    renderProductsGrid(products);
  }, err => {
    console.warn("Store products listener error:", err);
    renderProductsGrid(DEFAULT_KINGDOM_PRODUCTS);
  });
}

// Seed default products to Firestore automatically
async function seedDefaultProductsIfEmpty() {
  try {
    const db = window.db;
    if (!db) return;
    const snap = await db.collection('products').limit(1).get();
    if (snap.empty && (window.currentUserRole === 'Super Admin' || window.auth?.currentUser?.email === 'danielgiobari644@gmail.com')) {
      for (const prod of DEFAULT_KINGDOM_PRODUCTS) {
        await db.collection('products').doc(prod.id).set(prod, { merge: true });
      }
      console.log("Seeded default Kingdom Store products");
    }
  } catch (e) {
    console.warn("Seeding error:", e);
  }
}

// Filter and render products grid
function renderProductsGrid(products) {
  const container = document.getElementById('store-products-grid');
  if (!container) return;

  let filtered = products;

  // Category Filter
  if (activeStoreCategory !== 'all') {
    filtered = filtered.filter(p => (p.category || '').toLowerCase() === activeStoreCategory.toLowerCase());
  }

  // Collection Filter
  if (activeStoreCollection !== 'all') {
    filtered = filtered.filter(p => (p.collectionName || '').toLowerCase() === activeStoreCollection.toLowerCase());
  }

  // Search Query Filter
  if (storeSearchQuery.trim()) {
    const q = storeSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.collectionName || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400 dark:text-zinc-500">
        <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
        <p class="font-bold text-slate-700 dark:text-zinc-300">No resources found matching your search.</p>
        <p class="text-xs mt-1">Try selecting another category or clear your search filter.</p>
        <button onclick="clearStoreFilters()" class="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-blue-700 transition-all">Clear Filters</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const purchasedItemIds = window.currentUserPurchasedItemIds || [];

  container.innerHTML = filtered.map(p => {
    const isPurchased = purchasedItemIds.includes(p.id);

    return `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
        <div>
          <div class="relative h-48 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <img src="${p.coverUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            
            <div class="absolute top-3 left-3 flex flex-wrap gap-1">
              <span class="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                ${p.category || 'Resource'}
              </span>
              ${p.featured ? `<span class="px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-[10px] font-black uppercase tracking-wider">🔥 Featured</span>` : ''}
            </div>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <span class="text-xs font-bold text-amber-300 flex items-center gap-1">
                <i data-lucide="coins" class="w-3.5 h-3.5"></i> ${p.priceKC} KC
              </span>
              <span class="text-[10px] text-slate-300 font-medium">${p.collectionName || 'Digital Resource'}</span>
            </div>
          </div>

          <div class="p-5 space-y-2">
            <h4 class="font-black text-slate-900 dark:text-zinc-100 text-base line-clamp-1">${p.title}</h4>
            <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">${p.description}</p>
            
            <div class="flex flex-wrap gap-1 pt-2">
              ${(p.tags || []).slice(0, 3).map(tag => `
                <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[9px] font-bold text-slate-600 dark:text-zinc-400">#${tag}</span>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="p-5 pt-0">
          ${isPurchased ? `
            <button onclick="downloadStoreProductDirect('${p.id}', '${p.fileUrl || p.coverUrl}')" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
              <i data-lucide="download" class="w-4 h-4"></i> Download Resource
            </button>
          ` : `
            <button onclick="promptBuyProductModal('${p.id}')" class="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-500/20">
              <i data-lucide="coins" class="w-4 h-4"></i> Get for ${p.priceKC} KC
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Clear store filters
function clearStoreFilters() {
  activeStoreCategory = 'all';
  activeStoreCollection = 'all';
  storeSearchQuery = '';
  const searchInput = document.getElementById('store-search-input');
  if (searchInput) searchInput.value = '';

  const pills = document.querySelectorAll('.store-category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === 'all') {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer transition-all";
    } else {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all";
    }
  });

  syncStoreProducts();
}

// Select category filter
function selectStoreCategory(cat) {
  activeStoreCategory = cat;
  const pills = document.querySelectorAll('.store-category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === cat) {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 cursor-pointer transition-all shadow-sm";
    } else {
      p.className = "store-category-pill px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all";
    }
  });

  syncStoreProducts();
}

// Handle store search
function handleStoreSearch(query) {
  storeSearchQuery = query;
  syncStoreProducts();
}

// Prompt Buy Product Modal
async function promptBuyProductModal(productId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to buy Kingdom Store resources!", "error");
    return;
  }

  const db = window.db;
  let prod = DEFAULT_KINGDOM_PRODUCTS.find(p => p.id === productId);

  if (db) {
    try {
      const doc = await db.collection('products').doc(productId).get();
      if (doc.exists) prod = { id: doc.id, ...doc.data() };
    } catch (e) {
      console.warn("Get prod error:", e);
    }
  }

  if (!prod) {
    window.showToast?.("Resource details not found.", "error");
    return;
  }

  const currentKc = window.currentUserProfile?.kingdomCoins || currentChampionUserData?.kingdomCoins || 0;

  if (currentKc < prod.priceKC) {
    window.showModalHtml?.(`
      <div class="text-center space-y-4 p-2">
        <div class="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">🪙</div>
        <h3 class="text-xl font-black text-slate-900 dark:text-zinc-100">Insufficient Kingdom Coins</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400">
          This resource costs <strong class="text-amber-500">${prod.priceKC} KC</strong>. You currently have <strong class="text-slate-800 dark:text-zinc-200">${currentKc} KC</strong>.
        </p>
        <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 font-bold">
          💡 Earn more KC by reading daily scripture (+5 KC), taking scripture quizzes (+15-50 KC), and checking in daily!
        </div>
        <button onclick="window.closeModal?.(); switchTab('champions')" class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer">
          Go to Champions League to Earn KC
        </button>
      </div>
    `);
    return;
  }

  // Confirm Purchase
  const remainingKc = currentKc - prod.priceKC;

  window.showModalHtml?.(`
    <div class="space-y-4 p-1">
      <div class="flex items-center gap-3">
        <img src="${prod.coverUrl}" class="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-zinc-700" />
        <div>
          <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-black uppercase">${prod.category}</span>
          <h3 class="text-base font-black text-slate-900 dark:text-zinc-100 mt-1 line-clamp-1">${prod.title}</h3>
          <p class="text-xs text-amber-500 font-bold flex items-center gap-1">🪙 Price: ${prod.priceKC} KC</p>
        </div>
      </div>

      <div class="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-2xl space-y-2 text-xs border border-slate-200 dark:border-zinc-700">
        <div class="flex justify-between text-slate-600 dark:text-zinc-400">
          <span>Current Balance:</span>
          <span class="font-bold text-slate-900 dark:text-zinc-100">${currentKc.toLocaleString()} KC</span>
        </div>
        <div class="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
          <span>Resource Cost:</span>
          <span>-${prod.priceKC.toLocaleString()} KC</span>
        </div>
        <div class="pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-between font-black text-slate-900 dark:text-zinc-100">
          <span>Balance After Purchase:</span>
          <span class="text-emerald-500">${remainingKc.toLocaleString()} KC</span>
        </div>
      </div>

      <p class="text-[11px] text-slate-400 text-center">
        Upon confirmation, this resource will be added to your <strong class="text-slate-700 dark:text-zinc-300">My Library</strong> tab forever.
      </p>

      <div class="flex gap-2 pt-2">
        <button onclick="window.closeModal?.()" class="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
        <button onclick="executeProductPurchase('${prod.id}', ${prod.priceKC}, '${prod.title.replace(/'/g, "\\'")}', '${(prod.fileUrl || prod.coverUrl).replace(/'/g, "\\'")}')" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer shadow-md">
          Confirm Purchase
        </button>
      </div>
    </div>
  `);
}

// Execute Atomic Purchase (with ownership guard and transaction protection)
let _purchaseInProgress = {}; // Prevent double-clicks

async function executeProductPurchase(productId, costKC, title, fileUrl) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to purchase items from the Kingdom Store.", "warning");
    return;
  }

  // Double-click protection
  if (_purchaseInProgress[productId]) {
    window.showToast?.("Purchase is already being processed. Please wait.", "info");
    return;
  }
  _purchaseInProgress[productId] = true;

  const db = window.db;
  if (!db) { delete _purchaseInProgress[productId]; return; }

  window.closeModal?.();
  window.showToast?.("Processing secure Kingdom transaction...", "info");

  try {
    const userRef = db.collection('users').doc(user.uid);
    const rewardRef = db.collection('user_rewards').doc(`${user.uid}_${productId}`);
    const subUserRewardRef = userRef.collection('user_rewards').doc(productId);
    const txnRef = db.collection('kc_transactions').doc();

    // Check ownership FIRST before doing anything
    const existingReward = await rewardRef.get();
    if (existingReward.exists && existingReward.data().claimedAt) {
      window.showToast?.("You already own this item. Check your Library.", "info");
      delete _purchaseInProgress[productId];
      return;
    }

    // Use a transaction for atomic balance check + deduction
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User profile not found. Please complete onboarding first.");

      // Re-check ownership inside transaction
      const rewardDoc = await transaction.get(rewardRef);
      if (rewardDoc.exists && rewardDoc.data().claimedAt) {
        throw new Error("ALREADY_OWNED");
      }

      const userData = userDoc.data();
      const currentKc = userData.kingdomCoins || 0;

      if (currentKc < costKC) {
        throw new Error(`Insufficient Kingdom Coins. You have ${currentKc} KC, but this item costs ${costKC} KC.`);
      }

      const newKc = currentKc - costKC;
      const storePurchases = (userData.storePurchases || 0) + 1;

      // Atomic balance deduction
      transaction.update(userRef, {
        kingdomCoins: newKc,
        storePurchases: storePurchases
      });

      // Create ownership record
      const rewardPayload = {
        id: `${user.uid}_${productId}`,
        userUid: user.uid,
        itemId: productId,
        title: title,
        category: "Kingdom Store",
        kcCost: costKC,
        fileUrl: fileUrl || '',
        claimedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(rewardRef, rewardPayload, { merge: true });
      transaction.set(subUserRewardRef, rewardPayload, { merge: true });

      // Record KC transaction
      transaction.set(txnRef, {
        id: txnRef.id,
        userUid: user.uid,
        type: "debit",
        amount: costKC,
        title: `Kingdom Store Purchase`,
        description: `Purchased "${title}" for ${costKC} KC`,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update local state
      if (window.currentUserProfile) window.currentUserProfile.kingdomCoins = newKc;
      if (window.currentChampionUserData) window.currentChampionUserData.kingdomCoins = newKc;
    });

    // Post-transaction UI updates
    if (!window.currentUserPurchasedItemIds) window.currentUserPurchasedItemIds = [];
    if (!window.currentUserPurchasedItemIds.includes(productId)) {
      window.currentUserPurchasedItemIds.push(productId);
    }

    window.triggerConfetti?.();
    window.showToast?.(`Purchase successful! "${title}" has been added to your Library.`, "success");
    renderStoreKcHeader();
    syncStoreProducts();
    syncMyLibrary();

  } catch (err) {
    console.error("Purchase transaction failed:", err);
    if (err.message === "ALREADY_OWNED") {
      window.showToast?.("You already own this item. Check your Library.", "info");
    } else {
      window.showToast?.(`We couldn't complete your purchase. ${err.message}`, "error");
    }
  } finally {
    delete _purchaseInProgress[productId];
  }
}

// Download Store Product Direct
function downloadBase64Resource(dataUrl, fileName = 'HomeCell_Kingdom_Resource.jpg') {
  try {
    const parts = dataUrl.split(';base64,');
    if (parts.length < 2) {
      window.open(dataUrl, '_blank');
      return;
    }
    const contentType = parts[0].split(':')[1] || 'image/jpeg';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    const blob = new Blob([uInt8Array], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err) {
    console.error("Base64 Blob download error:", err);
    window.open(dataUrl, '_blank');
  }
}

function downloadStoreProductDirect(productId, url, fileName = 'HomeCell_Resource') {
  window.showToast?.("📥 Starting direct resource download...", "info");
  if (!url) {
    window.showToast?.("Download link is unavailable for this item.", "warning");
    return;
  }

  if (url.startsWith('data:')) {
    downloadBase64Resource(url, `${fileName}_${productId}.jpg`);
  } else if (url.startsWith('/uploads/')) {
    const fullUrl = `${window.location.origin}${url}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = "_blank";
    link.download = `${fileName}_${productId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (url.startsWith('http')) {
    const link = document.createElement('a');
    link.href = url;
    link.target = "_blank";
    link.download = `${fileName}_${productId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open(url, '_blank');
  }
}
window.downloadBase64Resource = downloadBase64Resource;
window.downloadStoreProductDirect = downloadStoreProductDirect;

// Client-side Canvas Image Compression for Firestore Storage
async function compressImageForFirestore(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error("Selected file is not an image. Please select a JPG, PNG, or WebP file."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        const stringLength = dataUrl.length - dataUrl.indexOf(',') - 1;
        const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896;
        const sizeInKB = Math.round(sizeInBytes / 1024);

        if (sizeInKB > 850) {
          reject(new Error(`Optimized image size (${sizeInKB} KB) exceeds the safe 850 KB limit for Firestore documents. Please crop or resize before uploading.`));
        } else {
          // Generate small thumbnail (~240px)
          const thumbCanvas = document.createElement('canvas');
          const thumbWidth = Math.min(width, 240);
          const thumbHeight = Math.round((height * thumbWidth) / width);
          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;
          const thumbCtx = thumbCanvas.getContext('2d');
          thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
          const previewData = thumbCanvas.toDataURL('image/jpeg', 0.6);

          resolve({
            dataUrl,
            previewData,
            sizeInKB,
            width,
            height,
            fileName: file.name
          });
        }
      };
      img.onerror = () => reject(new Error("Failed to load image file into canvas."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
window.compressImageForFirestore = compressImageForFirestore;

// ---------------------------------------------------------------------------
// 3. CUSTOM CREATION REQUESTS SYSTEM ✨
// ---------------------------------------------------------------------------

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
    'church': 300,
    'youth': 150,
    'editing': 200,
    'other': 200
  };

  const updateCalc = () => {
    const type = typeSelect.value || 'wallpaper';
    const cost = PRICE_MAP[type] || 200;
    const userKc = window.currentUserProfile?.kingdomCoins || currentChampionUserData?.kingdomCoins || 0;
    const afterKc = userKc - cost;

    const costEl = document.getElementById('custom-req-cost-display');
    const userBalanceEl = document.getElementById('custom-req-user-balance');
    const afterEl = document.getElementById('custom-req-after-balance');

    if (costEl) costEl.innerText = `${cost} KC`;
    if (userBalanceEl) userBalanceEl.innerText = `${userKc.toLocaleString()} KC`;
    if (afterEl) {
      afterEl.innerText = `${afterKc.toLocaleString()} KC`;
      if (afterKc < 0) {
        afterEl.className = "font-extrabold text-red-500";
      } else {
        afterEl.className = "font-extrabold text-emerald-500 dark:text-emerald-400";
      }
    }
  };

  typeSelect.addEventListener('change', updateCalc);
  updateCalc();
}

// Preview Source Image for Request
function previewCustomRequestSourceImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const previewBox = document.getElementById('custom-req-img-preview-box');
    const previewImg = document.getElementById('custom-req-img-preview');
    if (previewImg) previewImg.src = e.target.result;
    if (previewBox) previewBox.classList.remove('hidden');
    window.customRequestUploadedImageData = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Submit Custom Creation Request
async function handleCustomRequestSubmit(e) {
  e.preventDefault();

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to submit custom requests!", "error");
    return;
  }

  const type = document.getElementById('custom-req-type')?.value || 'wallpaper';
  const description = document.getElementById('custom-req-desc')?.value?.trim();
  const desiredResult = document.getElementById('custom-req-desired')?.value?.trim();
  const sourceImgUrl = window.customRequestUploadedImageData || document.getElementById('custom-req-url')?.value?.trim() || '';

  if (!description || !desiredResult) {
    window.showToast?.("Please fill out both the description and desired result!", "error");
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
    'church': 300,
    'youth': 150,
    'editing': 200,
    'other': 200
  };

  const costKC = PRICE_MAP[type] || 200;
  const userKc = window.currentUserProfile?.kingdomCoins || currentChampionUserData?.kingdomCoins || 0;

  if (userKc < costKC) {
    window.showToast?.(`Insufficient Kingdom Coins. You need ${costKC} KC for this request!`, "error");
    return;
  }

  const reqNum = Math.floor(100000 + Math.random() * 900000);
  const reqId = `REQ-2026-${reqNum}`;

  window.showToast?.("Submitting your custom creation request...", "info");

  const db = window.db;
  if (!db) return;

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
        kingdomCoins: currentBalance - costKC,
        customRequestsCount: (userDoc.data().customRequestsCount || 0) + 1
      });

      transaction.set(reqRef, {
        id: reqId,
        userUid: user.uid,
        userName: window.currentUserProfile?.displayName || user.displayName || user.email || 'Faith Member',
        userEmail: user.email || '',
        type: type,
        description: description,
        desiredResult: desiredResult,
        sourceImageUrl: sourceImgUrl,
        costKC: costKC,
        status: "Submitted", // Submitted, In Progress, Ready, Completed, Needs Information
        resultUrl: "",
        adminNotes: "",
        rating: 0,
        review: "",
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      transaction.set(txnRef, {
        id: txnRef.id,
        userUid: user.uid,
        type: "debit",
        amount: costKC,
        title: `Custom Request (${reqId})`,
        description: `Reserved ${costKC} KC for ${type} request`,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // Reset Form
    document.getElementById('custom-req-form')?.reset();
    document.getElementById('custom-req-img-preview-box')?.classList.add('hidden');
    window.customRequestUploadedImageData = null;

    if (window.currentUserProfile) window.currentUserProfile.kingdomCoins = userKc - costKC;
    renderStoreKcHeader();

    window.showToast?.(`🎉 Request ${reqId} submitted! Super Admin has been notified.`, "success");
    syncCustomRequests();

  } catch (err) {
    console.error("Custom request submission failed:", err);
    window.showToast?.(`Request failed: ${err.message}`, "error");
  }
}

// Sync Custom Requests List
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
          <div class="text-center py-8 text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
            <i data-lucide="sparkles" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
            <p class="font-bold text-slate-700 dark:text-zinc-300">No custom creation requests yet.</p>
            <p class="text-xs mt-0.5">Use the form above to request custom wallpapers, quote graphics, or event designs!</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const requests = [];
      snap.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));

      renderMyRequestsCards(requests);
    }, err => console.warn("Requests snapshot error:", err));
}

// Render My Requests Cards
function renderMyRequestsCards(requests) {
  const container = document.getElementById('my-custom-requests-list');
  if (!container) return;

  const STATUS_BADGES = {
    'Submitted': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
    'Ready': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
    'Completed': 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
    'Needs Information': 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300'
  };

  container.innerHTML = requests.map(r => `
    <div class="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xs">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
            ${r.id}
          </span>
          <span class="text-xs font-bold text-slate-600 dark:text-zinc-400 capitalize">${r.type} Design</span>
        </div>
        <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_BADGES[r.status] || 'bg-slate-100 text-slate-600'}">
          ${r.status}
        </span>
      </div>

      <div class="space-y-1">
        <p class="text-xs text-slate-800 dark:text-zinc-200 font-medium"><strong>Target:</strong> ${r.desiredResult}</p>
        <p class="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">${r.description}</p>
      </div>

      ${r.adminNotes ? `
        <div class="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl text-xs text-purple-900 dark:text-purple-200">
          <span class="font-bold">👑 Super Admin Note:</span> ${r.adminNotes}
        </div>
      ` : ''}

      ${r.resultUrl ? `
        <div class="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> Result Ready!
            </span>
            <button onclick="downloadCustomResultFile('${r.id}', '${r.resultUrl}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-sm">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Download Result
            </button>
          </div>

          ${r.rating ? `
            <div class="text-xs text-amber-500 font-bold flex items-center gap-1">
              Your Rating: ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
            </div>
          ` : `
            <button onclick="promptRequestReviewModal('${r.id}')" class="text-xs text-purple-600 dark:text-purple-400 font-bold underline cursor-pointer hover:text-purple-800">
              ⭐ Rate & Review Creation
            </button>
          `}
        </div>
      ` : ''}
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Download Custom Result File
function downloadCustomResultFile(reqId, url) {
  window.showToast?.(`📥 Downloading custom creation for ${reqId}...`, "success");
  if (url && url.startsWith('http')) {
    window.open(url, '_blank');
  } else {
    window.triggerDirectFileDownload?.('pwa');
  }
}

// Prompt Request Review Modal
function promptRequestReviewModal(reqId) {
  window.showModalHtml?.(`
    <div class="space-y-4 p-1">
      <h3 class="text-lg font-black text-slate-900 dark:text-zinc-100">Rate Your Custom Creation</h3>
      <p class="text-xs text-slate-500 dark:text-zinc-400">Your feedback helps Super Admin refine future design quality!</p>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">Rating Stars</label>
        <select id="modal-req-rating-stars" class="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 font-bold text-sm">
          <option value="5">⭐⭐⭐⭐⭐ Excellent (5 Stars)</option>
          <option value="4">⭐⭐⭐⭐ Good (4 Stars)</option>
          <option value="3">⭐⭐⭐ Average (3 Stars)</option>
          <option value="2">⭐⭐ Needs Improvement (2 Stars)</option>
          <option value="1">⭐ Poor (1 Star)</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">Comments / Testimonial</label>
        <textarea id="modal-req-review-text" rows="3" class="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100" placeholder="God bless! The wallpaper was amazing..."></textarea>
      </div>

      <div class="flex gap-2 pt-2">
        <button onclick="window.closeModal?.()" class="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
        <button onclick="submitCustomRequestRating('${reqId}')" class="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer">Submit Rating</button>
      </div>
    </div>
  `);
}

// Submit Custom Request Rating
async function submitCustomRequestRating(reqId) {
  const rating = parseInt(document.getElementById('modal-req-rating-stars')?.value || '5');
  const review = document.getElementById('modal-req-review-text')?.value?.trim() || '';

  const db = window.db;
  if (!db) return;

  try {
    await db.collection('custom_requests').doc(reqId).update({
      rating: rating,
      review: review,
      status: "Completed"
    });

    window.closeModal?.();
    window.showToast?.("Thank you for your rating!", "success");
    syncCustomRequests();
  } catch (e) {
    console.error("Submit rating error:", e);
    window.showToast?.("Error submitting rating.", "error");
  }
}

// ---------------------------------------------------------------------------
// 4. FEEDBACK HUB SYSTEM 💡
// ---------------------------------------------------------------------------

function syncFeedbackHub() {
  const container = document.getElementById('feedback-hub-list');
  if (!container) return;

  if (storeFeedbackListener) storeFeedbackListener();

  const db = window.db;
  if (!db) return;

  storeFeedbackListener = db.collection('feedback_items').onSnapshot(snap => {
    let items = [];
    if (!snap.empty) {
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    }

    renderFeedbackList(items);
  }, err => console.warn("Feedback snapshot error:", err));
}

// Render Feedback Hub List
function renderFeedbackList(items) {
  const container = document.getElementById('feedback-hub-list');
  if (!container) return;

  let filtered = items;

  if (activeFeedbackFilter === 'popular') {
    filtered.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
  } else if (activeFeedbackFilter !== 'all') {
    filtered = filtered.filter(i => (i.status || '').toLowerCase().replace(' ', '_') === activeFeedbackFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-400 dark:text-zinc-500">
        <i data-lucide="lightbulb" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="font-bold text-slate-700 dark:text-zinc-300">No suggestions submitted yet.</p>
        <p class="text-xs mt-0.5">Be the first to suggest what Home.cell should build next!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const userUid = window.auth?.currentUser?.uid;

  const STATUS_COLORS = {
    'Under Review': 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    'Planned': 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    'In Development': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    'Completed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    'Declined': 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
  };

  container.innerHTML = filtered.map(item => {
    const hasUpvoted = userUid && item.upvotes && item.upvotes[userUid];

    return `
      <div class="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex items-start gap-4">
        <!-- Upvote Button -->
        <button onclick="toggleFeedbackUpvote('${item.id}')" class="flex flex-col items-center justify-center p-3 rounded-2xl border ${hasUpvoted ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'} transition-all cursor-pointer shrink-0">
          <i data-lucide="chevron-up" class="w-5 h-5"></i>
          <span class="text-xs font-black font-mono mt-0.5">${item.upvotesCount || 0}</span>
        </button>

        <!-- Feedback Content -->
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
              ${item.type || 'Suggestion'}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[item.status] || 'bg-slate-100'}">
              ${item.status || 'Under Review'}
            </span>
          </div>

          <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-sm mt-1">${item.title}</h4>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">${item.description}</p>

          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-2">
            <span>By <strong>${item.userName || 'Member'}</strong></span>
            ${item.rewardAwarded ? `<span class="text-amber-500 font-bold">✨ Super Admin Rewarded +10 KC</span>` : ''}
          </div>

          ${item.adminNotes ? `
            <div class="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200">
              <strong class="font-bold">Home.cell Team:</strong> ${item.adminNotes}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Submit Feedback Hub Item
async function handleFeedbackSubmit(e) {
  e.preventDefault();

  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to submit suggestions!", "error");
    return;
  }

  const type = document.getElementById('feedback-type')?.value || 'Feature Request';
  const title = document.getElementById('feedback-title')?.value?.trim();
  const description = document.getElementById('feedback-desc')?.value?.trim();

  if (!title || !description) {
    window.showToast?.("Please enter both a title and description!", "error");
    return;
  }

  window.showToast?.("Submitting suggestion to Feedback Hub...", "info");

  const db = window.db;
  if (!db) return;

  const itemRef = db.collection('feedback_items').doc();

  try {
    await itemRef.set({
      id: itemRef.id,
      userUid: user.uid,
      userName: window.currentUserProfile?.displayName || user.displayName || user.email || 'Faith Member',
      type: type,
      title: title,
      description: description,
      upvotesCount: 1,
      upvotes: { [user.uid]: true },
      status: "Under Review",
      adminNotes: "",
      rewardAwarded: false,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('feedback-form')?.reset();
    window.showToast?.("💡 Suggestion posted! Community members can now upvote it.", "success");
    syncFeedbackHub();
  } catch (err) {
    console.error("Feedback submit error:", err);
    window.showToast?.("Error submitting suggestion.", "error");
  }
}

// Toggle Feedback Upvote
async function toggleFeedbackUpvote(itemId) {
  const user = window.auth?.currentUser;
  if (!user) {
    window.showToast?.("Please sign in to upvote suggestions!", "error");
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

  } catch (e) {
    console.error("Upvote transaction error:", e);
  }
}

// Filter Feedback
function filterFeedback(filterKey) {
  activeFeedbackFilter = filterKey;
  const pills = document.querySelectorAll('.feedback-filter-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-filter') === filterKey) {
      p.className = "feedback-filter-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white cursor-pointer";
    } else {
      p.className = "feedback-filter-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-700";
    }
  });

  syncFeedbackHub();
}

// ---------------------------------------------------------------------------
// 5. MY LIBRARY SYSTEM 📚
// ---------------------------------------------------------------------------

function syncMyLibrary() {
  const container = document.getElementById('my-library-grid');
  if (!container) return;

  const user = window.auth?.currentUser;
  if (!user) {
    container.innerHTML = `<p class="col-span-full text-xs text-slate-400 text-center py-8">Sign in to view your purchased resources and downloads.</p>`;
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
    }, err => console.warn("Library snapshot error:", err));
}

function renderMyLibraryGrid(items) {
  const container = document.getElementById('my-library-grid');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-10 text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
        <i data-lucide="book-open" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="font-bold text-slate-700 dark:text-zinc-300">Your library is currently empty.</p>
        <p class="text-xs mt-0.5">Explore the Kingdom Store marketplace and unlock Christian resources using your Kingdom Coins!</p>
        <button onclick="switchStoreTab('marketplace')" class="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all">Browse Kingdom Store</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-4 flex flex-col justify-between shadow-xs">
      <div class="space-y-1">
        <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase">
          ${item.category || 'Unlocked'}
        </span>
        <h4 class="font-black text-slate-900 dark:text-zinc-100 text-sm mt-1 line-clamp-1">${item.title}</h4>
        <p class="text-[11px] text-slate-400 font-mono">Unlocked for ${item.kcCost || 0} KC</p>
      </div>

      <button onclick="downloadStoreProductDirect('${item.itemId || item.id}', '${item.fileUrl || ''}')" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all">
        <i data-lucide="download" class="w-4 h-4"></i> Download Resource
      </button>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// KC Transaction History Listener
let storeKcTxListener = null;
function syncKcTransactionHistory() {
  const container = document.getElementById('kc-transactions-list');
  const countEl = document.getElementById('kc-history-count');
  if (!container) return;

  const user = window.auth?.currentUser;
  if (!user) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">Sign in to view your Kingdom Coin activity.</p>`;
    if (countEl) countEl.textContent = '0 transactions';
    return;
  }

  if (storeKcTxListener) storeKcTxListener();

  const db = window.db;
  if (!db) return;

  storeKcTxListener = db.collection('kc_transactions')
    .where('userUid', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(snap => {
      const txs = [];
      snap.forEach(doc => txs.push({ id: doc.id, ...doc.data() }));

      if (countEl) countEl.textContent = `${txs.length} transaction${txs.length !== 1 ? 's' : ''}`;

      if (txs.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">No Kingdom Coin activity yet.</p>`;
        return;
      }

      container.innerHTML = txs.map(tx => {
        const isDebit = tx.type === 'debit' || tx.amount < 0;
        const absAmount = Math.abs(tx.amount || 0);
        const dateStr = tx.createdAt?.toDate
          ? tx.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—';
        const colorClass = isDebit
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-emerald-600 dark:text-emerald-400';
        const sign = isDebit ? '-' : '+';
        const desc = tx.description || (isDebit ? 'Spent' : 'Earned');

        return `
          <div class="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs flex items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">${desc}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">${dateStr}</p>
            </div>
            <span class="text-sm font-black ${colorClass} shrink-0">${sign}${absAmount.toLocaleString()} KC</span>
          </div>
        `;
      }).join('');
    }, err => {
      console.warn("KC transactions listener error:", err);
      container.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">Unable to load transaction history.</p>`;
      if (countEl) countEl.textContent = 'Error';
    });
}

// Inner Tab Switcher for Kingdom Store
function switchStoreTab(tabKey) {
  const sections = ['marketplace', 'custom-requests', 'feedback-hub', 'my-library', 'rewards', 'installers', 'kc-history'];
  sections.forEach(s => {
    const el = document.getElementById(`store-section-${s}`);
    const btn = document.getElementById(`store-tab-btn-${s}`);
    if (el) {
      if (s === tabKey) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
    if (btn) {
      if (s === tabKey) {
        btn.className = "store-nav-btn px-4 py-2.5 rounded-2xl text-xs font-black bg-amber-500 text-slate-950 cursor-pointer shadow-sm transition-all flex items-center gap-2 shrink-0";
      } else {
        btn.className = "store-nav-btn px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-all flex items-center gap-2 shrink-0";
      }
    }
  });
}

// Global Exports
window.initKingdomStoreModule = initKingdomStoreModule;
window.selectStoreCategory = selectStoreCategory;
window.handleStoreSearch = handleStoreSearch;
window.clearStoreFilters = clearStoreFilters;
window.promptBuyProductModal = promptBuyProductModal;
window.executeProductPurchase = executeProductPurchase;
window.downloadStoreProductDirect = downloadStoreProductDirect;
window.previewCustomRequestSourceImage = previewCustomRequestSourceImage;
window.handleCustomRequestSubmit = handleCustomRequestSubmit;
window.downloadCustomResultFile = downloadCustomResultFile;
window.promptRequestReviewModal = promptRequestReviewModal;
window.submitCustomRequestRating = submitCustomRequestRating;
window.handleFeedbackSubmit = handleFeedbackSubmit;
window.toggleFeedbackUpvote = toggleFeedbackUpvote;
window.filterFeedback = filterFeedback;
window.switchStoreTab = switchStoreTab;
window.syncKcTransactionHistory = syncKcTransactionHistory;
