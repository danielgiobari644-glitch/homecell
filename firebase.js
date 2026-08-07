// firebase.js
// Firebase configuration and auth services

// Prevent circular JSON errors when logging objects (e.g., Firestore errors) to console in sandbox preview
(function() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

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
        try {
          if (arg.message) return `[Unsafe Object]: ${arg.message}`;
          return `[Unsafe ${arg.constructor ? arg.constructor.name : 'Object'}]`;
        } catch (err) {
          return "[Unsafe Object]";
        }
      }
    }
    return arg;
  }

  console.error = function(...args) {
    originalError.apply(console, args.map(sanitizeArg));
  };
  console.warn = function(...args) {
    originalWarn.apply(console, args.map(sanitizeArg));
  };
  console.log = function(...args) {
    originalLog.apply(console, args.map(sanitizeArg));
  };
})();

const firebaseConfig = {
  apiKey: "AIzaSyAzsQYW0YvR8KT_RkWnpCADv3Hvwnyqdmw",
  authDomain: "homecell-net.firebaseapp.com",
  projectId: "homecell-net",
  storageBucket: "homecell-net.firebasestorage.app",
  messagingSenderId: "615303092749",
  appId: "1:615303092749:web:732246e106d71b38b49344",
  measurementId: "G-MX95QZVWH5"
};

// Initialize Firebase Compat
if (!window.firebase) {
  console.error("Firebase SDK not loaded via CDNs.");
}

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

try {
  db.settings({
    experimentalAutoDetectLongPolling: true,
    merge: true
  });
} catch (e) {
  try {
    db.settings({
      merge: true
    });
  } catch (err) {
    // Ignore if settings already initialized
  }
}

// Enable offline persistence so client operates smoothly even during connectivity drops
if (db.enablePersistence) {
  db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence enabled in first tab
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
    }
  });
}

const auth = firebase.auth();

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

// Safe stringifier to handle potential circular structures
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

// Standard Firestore Error Handler as specified by the system skill
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
  window.showToast?.(error.message || 'Operation failed due to lack of permissions.', 'error');
  throw new Error(safeStringify(errInfo));
}

// Test Connection gracefully
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

// Expose to window for modular usage across scripts
window.db = db;
window.auth = auth;
window.firebase = firebase;
window.handleFirestoreError = handleFirestoreError;
window.OperationType = OperationType;

console.log("Firebase Engine initialized successfully.");
