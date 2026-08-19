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

  if (user) {
    if (headerName) headerName.innerText = user.displayName || user.email.split('@')[0];
    if (headerAvatar) {
      headerAvatar.innerHTML = `<img src="${user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}" class="w-full h-full object-cover" />`;
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

          if (headerKcCount) headerKcCount.innerText = `${(userData.kingdomCoins || 0).toLocaleString()} KC`;
          if (headerStreakCount) headerStreakCount.innerText = `${userData.streak || 1}d`;

          if (isSuperAdmin) {
            if (superAdminBadge) superAdminBadge.classList.remove('hidden');
            if (adminNavBtn) adminNavBtn.classList.remove('hidden');
            if (mobileAdminBtn) mobileAdminBtn.classList.remove('hidden');
          } else {
            if (superAdminBadge) superAdminBadge.classList.add('hidden');
            if (adminNavBtn) adminNavBtn.classList.add('hidden');
            if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
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
    if (superAdminBadge) superAdminBadge.classList.add('hidden');
    if (adminNavBtn) adminNavBtn.classList.add('hidden');
    if (mobileAdminBtn) mobileAdminBtn.classList.add('hidden');
    if (headerKcCount) headerKcCount.innerText = '100 KC';
    if (headerStreakCount) headerStreakCount.innerText = '1d';
    if (window.renderStoreKcHeader) window.renderStoreKcHeader();
    if (window.checkSuperAdminStoreControls) window.checkSuperAdminStoreControls();
  }
});

console.log("Firebase Engine initialized successfully.");

