// firebase.js
// Firebase configuration and auth services for Home.cell

(function() {
  const originalError = console.error;
  const originalWarn = console.warn;

  function sanitizeArg(arg) {
    if (arg instanceof Error) {
      return arg.stack || arg.message || String(arg);
    }
    if (typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement) {
      return `[HTML ${arg.tagName} Element - ID: ${arg.id || 'none'}]`;
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        const cache = new Set();
        const str = JSON.stringify(arg, (key, value) => {
          if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
            return `[HTML ${value.tagName} Element]`;
          }
          if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
              return '[Circular]';
            }
            cache.add(value);
          }
          return value;
        });
        return JSON.parse(str);
      } catch (e) {
        return "[Unsafe Object]";
      }
    }
    return arg;
  }

  console.error = function(...args) {
    const msg = args.map(a => String(a || '')).join(' ');
    if (msg.includes('INTERNAL ASSERTION FAILED')) {
      originalWarn.call(console, 'Firestore SDK internal assertion caught:', msg);
      return;
    }
    originalError.apply(console, args.map(sanitizeArg));
  };
  console.warn = function(...args) {
    const msg = args.map(a => String(a || '')).join(' ');
    if (msg.includes('enableIndexedDbPersistence() will be deprecated')) {
      return;
    }
    originalWarn.apply(console, args.map(sanitizeArg));
  };

  window.addEventListener('unhandledrejection', function(event) {
    const reasonMsg = String(event?.reason?.message || event?.reason || '');
    if (reasonMsg.includes('INTERNAL ASSERTION FAILED') || reasonMsg.includes('Unexpected state')) {
      event.preventDefault();
      console.warn('Caught unhandled Firestore assertion rejection:', reasonMsg);
    }
  });
})();

const firebaseConfig = {
  apiKey: "AIzaSyCL4siNSgWX0gH5QIbl7OtZFDvBiHH9oP0",
  authDomain: "hcell-f3797.firebaseapp.com",
  databaseURL: "https://hcell-f3797-default-rtdb.firebaseio.com",
  projectId: "hcell-f3797",
  storageBucket: "hcell-f3797.firebasestorage.app",
  messagingSenderId: "940294292200",
  appId: "1:940294292200:web:45e38c21c2ea950ba7bf5d",
  measurementId: "G-0YN4548C8Z"
};

if (!window.firebase) {
  console.error("Firebase SDK not loaded via CDNs.");
}

const app = firebase.initializeApp(firebaseConfig);
const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' && typeof firebase.app().firestore === 'function')
  ? firebase.app().firestore(firebaseConfig.firestoreDatabaseId)
  : firebase.firestore();

try {
  db.settings({
    experimentalAutoDetectLongPolling: true,
    merge: true
  });
} catch (e) {}

const auth = firebase.auth();

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function safeStringify(obj) {
  try {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    });
  } catch (e) {
    return "[Serialization Error: " + e.message + "]";
  }
}

function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType: String(operationType || ''),
    path: String(path || '')
  };
  console.error('Firestore Error: ', safeStringify(errInfo));
  window.showToast?.(error.message || 'Operation failed.', 'error');
  throw new Error(safeStringify(errInfo));
}

// Test Connection
async function testConnection() {
  try {
    await db.collection('test').doc('connection').get();
  } catch (error) {
    if (error && error.message && error.message.includes('offline')) {
      console.log("Firestore operating in offline cached mode.");
    }
  }
}
testConnection();

window.db = db;
window.auth = auth;
window.firebase = firebase;
window.handleFirestoreError = handleFirestoreError;
window.OperationType = OperationType;
window.currentUserRole = 'Member';

// Real-time Auth & Role Observer
auth.onAuthStateChanged(async (user) => {
  const headerName = document.getElementById('header-user-name');
  const headerAvatar = document.getElementById('header-avatar-circle');
  const superAdminBadge = document.getElementById('header-super-admin-badge');
  const adminNavBtn = document.getElementById('nav-btn-admin');
  const mobileAdminBtn = document.getElementById('mobile-admin-btn');
  const headerKcCount = document.getElementById('header-kc-count');
  const headerStreakCount = document.getElementById('header-streak-count');

  // Desktop Sidebar Elements
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarRole = document.getElementById('sidebar-user-role');
  const sidebarAvatar = document.getElementById('sidebar-avatar-circle');
  const sidebarKcCount = document.getElementById('sidebar-kc-count');
  const sidebarStreakCount = document.getElementById('sidebar-streak-count');
  const sidebarAdminBtn = document.getElementById('sidebar-btn-admin');

  // Mobile More Sheet Elements
  const moreSheetName = document.getElementById('more-sheet-user-name');
  const moreSheetAvatar = document.getElementById('more-sheet-avatar-circle');
  const moreSheetKcCount = document.getElementById('more-sheet-kc-count');
  const moreSheetStreakCount = document.getElementById('more-sheet-streak-count');
  const moreSheetAdminBtn = document.getElementById('more-sheet-admin-btn');

  // Tablet More Menu Elements
  const tabletMoreAdminItem = document.getElementById('tablet-more-admin-item');

  if (user) {
    const displayName = user.displayName || user.email.split('@')[0];
    const initial = displayName.charAt(0).toUpperCase();
    const avatarHtml = `<img src="${user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}" class="w-full h-full object-cover" />`;

    if (headerName) headerName.innerText = displayName;
    if (headerAvatar) headerAvatar.innerHTML = avatarHtml;
    if (sidebarName) sidebarName.innerText = displayName;
    if (sidebarAvatar) sidebarAvatar.innerHTML = avatarHtml;
    if (moreSheetName) moreSheetName.innerText = displayName;
    if (moreSheetAvatar) moreSheetAvatar.innerHTML = avatarHtml;

    // Process referral bonus if user was referred
    if (window.processReferralForNewUser) {
      window.processReferralForNewUser(user.uid, user.email, user.displayName).catch(() => {});
    }

    try {
      const userDocRef = db.collection('users').doc(user.uid);
      userDocRef.onSnapshot(doc => {
        if (doc.exists) {
          const userData = doc.data();
          const isSuperAdmin = userData.role === 'Super Admin' || user.email === 'danielgiobari644@gmail.com';
          window.currentUserRole = isSuperAdmin ? 'Super Admin' : (userData.role || 'Member');
          window.currentUserProfile = userData;
          window.currentKcBalance = userData.kingdomCoins !== undefined ? userData.kingdomCoins : 100;

          const kcStr = `${(userData.kingdomCoins || 0).toLocaleString()} KC`;
          const streakStr = `🔥 ${userData.streak || 1}d`;

          if (headerKcCount) headerKcCount.innerText = kcStr;
          if (headerStreakCount) headerStreakCount.innerText = `${userData.streak || 1}d`;
          if (sidebarKcCount) sidebarKcCount.innerText = kcStr;
          if (sidebarStreakCount) sidebarStreakCount.innerText = streakStr;
          if (sidebarRole) sidebarRole.innerText = window.currentUserRole;
          if (moreSheetKcCount) moreSheetKcCount.innerText = kcStr;
          if (moreSheetStreakCount) moreSheetStreakCount.innerText = streakStr;

          if (isSuperAdmin) {
            if (superAdminBadge) superAdminBadge.classList.remove('hidden');
            if (adminNavBtn) adminNavBtn.classList.remove('hidden');
            if (mobileAdminBtn) mobileAdminBtn.classList.remove('hidden');
            if (sidebarAdminBtn) { sidebarAdminBtn.classList.remove('hidden'); sidebarAdminBtn.classList.add('flex'); }
            if (moreSheetAdminBtn) moreSheetAdminBtn.classList.remove('hidden');
            if (tabletMoreAdminItem) tabletMoreAdminItem.classList.remove('hidden');
          } else {
            if (superAdminBadge) superAdminBadge.classList.add('hidden');
            if (adminNavBtn) adminNavBtn.classList.add('hidden');
            if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
            if (sidebarAdminBtn) { sidebarAdminBtn.classList.add('hidden'); sidebarAdminBtn.classList.remove('flex'); }
            if (moreSheetAdminBtn) moreSheetAdminBtn.classList.add('hidden');
            if (tabletMoreAdminItem) tabletMoreAdminItem.classList.add('hidden');
          }

          if (window.renderStoreKcHeader) window.renderStoreKcHeader();
          if (window.checkSuperAdminStoreControls) window.checkSuperAdminStoreControls();
          if (window.syncMyLibrary) window.syncMyLibrary();
        }
      });
    } catch (e) {
      console.warn("User snapshot error:", e);
    }
  } else {
    window.currentUserRole = 'Guest';
    window.currentUserProfile = null;
    window.currentKcBalance = 100;
    if (headerName) headerName.innerText = 'Guest Believer';
    if (headerAvatar) headerAvatar.innerText = '✝';
    if (sidebarName) sidebarName.innerText = 'Guest Believer';
    if (sidebarRole) sidebarRole.innerText = 'Guest';
    if (sidebarAvatar) sidebarAvatar.innerText = '✝';
    if (moreSheetName) moreSheetName.innerText = 'Guest Believer';
    if (moreSheetAvatar) moreSheetAvatar.innerText = '✝';
    if (superAdminBadge) superAdminBadge.classList.add('hidden');
    if (adminNavBtn) adminNavBtn.classList.add('hidden');
    if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
    if (sidebarAdminBtn) { sidebarAdminBtn.classList.add('hidden'); sidebarAdminBtn.classList.remove('flex'); }
    if (moreSheetAdminBtn) moreSheetAdminBtn.classList.add('hidden');
    if (tabletMoreAdminItem) tabletMoreAdminItem.classList.add('hidden');
    if (headerKcCount) headerKcCount.innerText = '100 KC';
    if (headerStreakCount) headerStreakCount.innerText = '1d';
    if (sidebarKcCount) sidebarKcCount.innerText = '100 KC';
    if (sidebarStreakCount) sidebarStreakCount.innerText = '🔥 1d';
    if (moreSheetKcCount) moreSheetKcCount.innerText = '100 KC';
    if (moreSheetStreakCount) moreSheetStreakCount.innerText = '🔥 1d';
    if (window.renderStoreKcHeader) window.renderStoreKcHeader();
    if (window.checkSuperAdminStoreControls) window.checkSuperAdminStoreControls();
  }
});

window.checkIsSuperAdmin = function() {
  const user = window.auth?.currentUser;
  if (!user) return false;
  if (user.email && user.email.toLowerCase() === 'danielgiobari644@gmail.com') return true;
  if (window.currentUserRole === 'Super Admin') return true;
  if (window.currentUserProfile && window.currentUserProfile.role === 'Super Admin') return true;
  return false;
};

console.log("Firebase Engine initialized successfully.");

