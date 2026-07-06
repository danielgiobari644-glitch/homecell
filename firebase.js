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
    if (typeof arg === 'object' && arg !== null) {
      try {
        const cache = new Set();
        JSON.stringify(arg, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
              throw new Error("circular");
            }
            cache.add(value);
          }
          return value;
        });
        return arg; // safe
      } catch (e) {
        try {
          if (arg.message) return `[Circular Error/Object]: ${arg.message}`;
          return `[Circular ${arg.constructor ? arg.constructor.name : 'Object'}]`;
        } catch (err) {
          return "[Circular Object]";
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
  "projectId": "hcell-f3797",
  "appId": "1:940294292200:web:45e38c21c2ea950ba7bf5d",
  "apiKey": "AIzaSyCL4siNSgWX0gH5QIbl7OtZFDvBiHH9oP0",
  "authDomain": "hcell-f3797.firebaseapp.com",
  "databaseURL": "https://hcell-f3797-default-rtdb.firebaseio.com",
  "storageBucket": "hcell-f3797.firebasestorage.app",
  "messagingSenderId": "940294292200",
  "measurementId": "G-0YN4548C8Z",
  "firestoreDatabaseId": ""
};

// Initialize Firebase Compat
if (!window.firebase) {
  console.error("Firebase SDK not loaded via CDNs.");
}

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
try {
  db.settings({
    experimentalForceLongPolling: true,
    merge: true
  });
} catch (e) {
  console.warn("Firestore settings apply failed, retrying with fallback:", e);
  try {
    db.settings({
      experimentalForceLongPolling: true
    });
  } catch (err) {
    console.warn("Firestore fallback settings failed as well:", err);
  }
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

// Test Connection
async function testConnection() {
  try {
    await db.collection('test').doc('connection').get({ source: 'server' });
  } catch (error) {
    if (error.message && error.message.includes('offline')) {
      console.warn("Please check your Firebase configuration or internet connection.");
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
