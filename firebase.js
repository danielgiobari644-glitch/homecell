// firebase.js
// Firebase configuration, authentication, multi-fellowship membership & global state management for Home.cell

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
    if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes("Backend didn't respond within 10 seconds") || msg.includes('operate in offline mode')) {
      originalWarn.call(console, 'Firestore offline/connection note:', msg);
      return;
    }
    originalError.apply(console, args.map(sanitizeArg));
  };
  console.warn = function(...args) {
    const msg = args.map(a => String(a || '')).join(' ');
    if (msg.includes('enableIndexedDbPersistence() will be deprecated')) {
      return;
    }
    if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes("Backend didn't respond within 10 seconds")) {
      originalWarn.call(console, 'Firestore connectivity status:', msg);
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
    experimentalForceLongPolling: true,
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

window.db = db;
window.auth = auth;
window.firebase = firebase;
window.handleFirestoreError = handleFirestoreError;
window.OperationType = OperationType;

// Application Global State
window.currentUser = null;
window.currentUserProfile = null;
window.currentUserRole = 'Guest';
window.userMemberships = []; // User's joined fellowships
window.activeFellowshipId = localStorage.getItem('homecell_active_fellowship_id') || null;
window.activeFellowship = null;
window.activeFellowshipRole = 'member';
window.allFellowships = [];

let userProfileListener = null;
let userMembershipsListener = null;
let allFellowshipsListener = null;

// Super Admin Check
window.checkIsSuperAdmin = function() {
  const user = window.auth?.currentUser;
  if (!user) return false;
  if (user.email && user.email.toLowerCase() === 'danielgiobari644@gmail.com') return true;
  if (window.currentUserRole === 'Super Admin') return true;
  if (window.currentUserProfile && window.currentUserProfile.role === 'Super Admin') return true;
  return false;
};

// Real-time Auth Observer
auth.onAuthStateChanged(async (user) => {
  window.currentUser = user;

  if (user) {
    // Hide auth screen, proceed to app routing
    document.getElementById('app-auth-screen')?.classList.add('hidden');

    const email = user.email || '';
    const isSuperAdminEmail = email.toLowerCase() === 'danielgiobari644@gmail.com';

    // Ensure user record exists in users/{uid}
    try {
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        const initialProfile = {
          uid: user.uid,
          displayName: user.displayName || email.split('@')[0] || 'Believer',
          email: email,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          role: isSuperAdminEmail ? 'Super Admin' : 'Member',
          streak: 1,
          chaptersReadCount: 0,
          quizWinsCount: 0,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };
        await userRef.set(initialProfile, { merge: true });
      }
    } catch (e) {
      console.warn("User record init error:", e);
    }

    // Subscribe to current user profile
    if (userProfileListener) userProfileListener();
    userProfileListener = db.collection('users').doc(user.uid).onSnapshot(doc => {
      if (doc.exists) {
        window.currentUserProfile = doc.data();
        const isSuperAdmin = window.currentUserProfile.role === 'Super Admin' || isSuperAdminEmail;
        window.currentUserRole = isSuperAdmin ? 'Super Admin' : (window.currentUserProfile.role || 'Member');
        syncUIWithUserProfile();
      }
    }, err => console.warn("User profile listener error:", err));

    // Subscribe to all fellowships (for discovery, directory, and global references)
    if (allFellowshipsListener) allFellowshipsListener();
    allFellowshipsListener = db.collection('fellowships').onSnapshot(snap => {
      const list = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      window.allFellowships = list;

      // Update active fellowship object if set
      if (window.activeFellowshipId) {
        window.activeFellowship = list.find(f => f.id === window.activeFellowshipId) || null;
      }
      syncFellowshipSwitcherUI();
      if (window.renderDiscoveryFellowships) window.renderDiscoveryFellowships();
      if (window.syncFellowshipDashboard) window.syncFellowshipDashboard();
      if (window.renderAdminFellowshipsList) window.renderAdminFellowshipsList();
    }, err => console.warn("Fellowships listener error:", err));

    // Subscribe to user's memberships
    if (userMembershipsListener) userMembershipsListener();
    userMembershipsListener = db.collection('memberships')
      .where('userId', '==', user.uid)
      .onSnapshot(snap => {
        const memberships = [];
        snap.forEach(d => {
          memberships.push({ id: d.id, ...d.data() });
        });
        window.userMemberships = memberships;

        // Auto-select or validate active fellowship
        if (memberships.length > 0) {
          const currentValid = memberships.find(m => m.fellowshipId === window.activeFellowshipId);
          if (!currentValid) {
            window.activeFellowshipId = memberships[0].fellowshipId;
            localStorage.setItem('homecell_active_fellowship_id', window.activeFellowshipId);
          }
          const activeMem = memberships.find(m => m.fellowshipId === window.activeFellowshipId) || memberships[0];
          window.activeFellowshipRole = activeMem?.role || 'member';
          if (window.allFellowships?.length) {
            window.activeFellowship = window.allFellowships.find(f => f.id === window.activeFellowshipId) || null;
          }
        } else {
          window.activeFellowshipId = null;
          window.activeFellowship = null;
          window.activeFellowshipRole = null;
          localStorage.removeItem('homecell_active_fellowship_id');
        }

        syncFellowshipSwitcherUI();
        syncProfileFellowshipsList();

        // Route after login / signup:
        // If user has NO fellowships OR flagged sessionJustAuthenticated, show discovery view
        const justAuth = sessionStorage.getItem('homecell_just_authenticated') === 'true';
        if (memberships.length === 0 || justAuth) {
          window.showDiscoveryView();
        } else {
          window.showMainAppView();
        }
      }, err => console.warn("Memberships listener error:", err));

  } else {
    // User is logged out: teardown listeners & show strict auth screen
    if (userProfileListener) { userProfileListener(); userProfileListener = null; }
    if (userMembershipsListener) { userMembershipsListener(); userMembershipsListener = null; }
    if (allFellowshipsListener) { allFellowshipsListener(); allFellowshipsListener = null; }

    window.currentUser = null;
    window.currentUserProfile = null;
    window.currentUserRole = 'Guest';
    window.userMemberships = [];
    window.activeFellowshipId = null;
    window.activeFellowship = null;
    window.activeFellowshipRole = null;

    showAuthScreen();
  }
});

// UI Sync Helpers
function syncUIWithUserProfile() {
  const profile = window.currentUserProfile;
  const user = window.currentUser;
  if (!profile && !user) return;

  const dName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Believer';
  const photo = profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || '1'}`;
  const role = window.currentUserRole;

  // Header & sidebar elements
  document.querySelectorAll('.user-display-name').forEach(el => el.innerText = dName);
  document.querySelectorAll('.user-role-badge').forEach(el => el.innerText = role);
  document.querySelectorAll('.user-avatar-img').forEach(el => {
    el.innerHTML = `<img src="${photo}" alt="${dName}" class="w-full h-full object-cover rounded-full" />`;
  });

  // Admin buttons visibility
  const isSuperAdmin = window.checkIsSuperAdmin();
  document.querySelectorAll('.super-admin-only').forEach(el => {
    if (isSuperAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  if (window.syncProfileData) window.syncProfileData();
}

function syncFellowshipSwitcherUI() {
  const switcherBtn = document.getElementById('header-fellowship-switcher-btn');
  const currentNameEl = document.getElementById('header-current-fellowship-name');
  const currentRoleEl = document.getElementById('header-current-fellowship-role');
  const dropdownList = document.getElementById('fellowship-switcher-dropdown-list');

  const currentMem = window.userMemberships.find(m => m.fellowshipId === window.activeFellowshipId);
  const currentFellowship = window.activeFellowship || (window.allFellowships || []).find(f => f.id === window.activeFellowshipId);

  if (currentFellowship && currentNameEl) {
    currentNameEl.innerText = currentFellowship.name;
    if (currentRoleEl) {
      const roleText = currentMem?.role === 'leader' ? 'Cell Leader' : (currentMem?.role === 'moderator' ? 'Moderator' : 'Member');
      currentRoleEl.innerText = roleText;
    }
  } else if (currentNameEl) {
    currentNameEl.innerText = 'Select Fellowship';
    if (currentRoleEl) currentRoleEl.innerText = 'None';
  }

  // Populate dropdown list
  if (dropdownList) {
    if (window.userMemberships.length === 0) {
      dropdownList.innerHTML = `
        <div class="p-3 text-center text-xs text-slate-500">
          You haven't joined any Home Fellowship yet.
        </div>
      `;
    } else {
      dropdownList.innerHTML = window.userMemberships.map(m => {
        const isActive = m.fellowshipId === window.activeFellowshipId;
        const roleBadge = m.role === 'leader' ? '👑 Leader' : (m.role === 'moderator' ? '🛡️ Moderator' : '👤 Member');
        return `
          <button onclick="window.switchActiveFellowship('${m.fellowshipId}')" class="w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 ${
            isActive ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
          }">
            <div class="min-w-0">
              <div class="text-xs font-black truncate">${m.fellowshipName || 'Home Fellowship'}</div>
              <div class="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">${m.fellowshipMotto || 'Faith • Fellowship'}</div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                m.role === 'leader' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }">${roleBadge}</span>
              ${isActive ? '<i data-lucide="check" class="w-4 h-4 text-blue-600"></i>' : ''}
            </div>
          </button>
        `;
      }).join('');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function syncProfileFellowshipsList() {
  const container = document.getElementById('profile-fellowships-container');
  if (!container) return;

  if (window.userMemberships.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 glass-panel rounded-2xl">
        <p class="text-xs font-bold">You are not a member of any fellowship yet.</p>
        <button onclick="window.showDiscoveryView()" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">
          Find Your Home Fellowship
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = window.userMemberships.map(m => {
    const isActive = m.fellowshipId === window.activeFellowshipId;
    const roleTitle = m.role === 'leader' ? 'Cell Leader / Fellowship Admin' : (m.role === 'moderator' ? 'Fellowship Moderator' : 'Fellowship Member');
    return `
      <div class="p-4 rounded-2xl border ${isActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h4 class="font-black text-sm text-slate-900 dark:text-zinc-100">${m.fellowshipName || 'Home Fellowship'}</h4>
            ${isActive ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">Active</span>' : ''}
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400">${m.fellowshipMotto || 'In Christ Jesus we grow'}</p>
          <div class="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 pt-0.5">Role: ${roleTitle}</div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${!isActive ? `<button onclick="window.switchActiveFellowship('${m.fellowshipId}')" class="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer">Switch To</button>` : ''}
          <button onclick="window.leaveFellowship('${m.fellowshipId}')" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer" title="Leave Fellowship">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Global Fellowship Operations
window.switchActiveFellowship = function(fellowshipId) {
  if (!fellowshipId) return;
  window.activeFellowshipId = fellowshipId;
  localStorage.setItem('homecell_active_fellowship_id', fellowshipId);

  const mem = window.userMemberships.find(m => m.fellowshipId === fellowshipId);
  window.activeFellowshipRole = mem?.role || 'member';

  if (window.allFellowships?.length) {
    window.activeFellowship = window.allFellowships.find(f => f.id === fellowshipId) || null;
  }

  syncFellowshipSwitcherUI();
  closeFellowshipSwitcher();

  window.soundEngine?.playClick?.();
  window.showToast?.(`Switched to ${window.activeFellowship?.name || 'Fellowship'}!`, 'info');

  // Trigger reactive refreshes
  if (window.syncFellowshipDashboard) window.syncFellowshipDashboard();
  if (window.loadFellowshipMessages) window.loadFellowshipMessages();
  if (window.loadFellowshipMembers) window.loadFellowshipMembers();
  if (window.syncFellowshipQuizzes) window.syncFellowshipQuizzes();
  if (window.syncFellowshipEvents) window.syncFellowshipEvents();
};

window.joinFellowship = async function(fellowshipId) {
  const user = window.auth?.currentUser;
  if (!user) {
    showAuthScreen();
    return;
  }

  try {
    const fellowship = window.allFellowships.find(f => f.id === fellowshipId);
    const membershipId = `${user.uid}_${fellowshipId}`;

    await window.db.collection('memberships').doc(membershipId).set({
      id: membershipId,
      userId: user.uid,
      fellowshipId: fellowshipId,
      fellowshipName: fellowship?.name || 'Home Fellowship',
      fellowshipMotto: fellowship?.motto || '',
      userDisplayName: window.currentUserProfile?.displayName || user.displayName || user.email.split('@')[0],
      userEmail: user.email,
      userPhotoURL: window.currentUserProfile?.photoURL || user.photoURL || '',
      role: 'member',
      status: 'active',
      joinedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update count in fellowship
    await window.db.collection('fellowships').doc(fellowshipId).update({
      memberCount: window.firebase.firestore.FieldValue.increment(1)
    }).catch(() => {});

    window.activeFellowshipId = fellowshipId;
    localStorage.setItem('homecell_active_fellowship_id', fellowshipId);

    window.soundEngine?.playSuccess?.();
    window.showToast?.(`Welcome to ${fellowship?.name || 'the fellowship'}!`, 'success');

    // Enter main platform directly
    window.enterMainPlatform();
  } catch (err) {
    console.error("Join fellowship error:", err);
    window.showToast?.('Failed to join fellowship: ' + err.message, 'error');
  }
};

window.leaveFellowship = async function(fellowshipId) {
  const user = window.auth?.currentUser;
  if (!user) return;

  if (!confirm("Are you sure you want to leave this Home Fellowship?")) return;

  try {
    const membershipId = `${user.uid}_${fellowshipId}`;
    await window.db.collection('memberships').doc(membershipId).delete();

    await window.db.collection('fellowships').doc(fellowshipId).update({
      memberCount: window.firebase.firestore.FieldValue.increment(-1)
    }).catch(() => {});

    window.soundEngine?.playClick?.();
    window.showToast?.("Left fellowship successfully.", "info");

    if (window.activeFellowshipId === fellowshipId) {
      const remaining = window.userMemberships.filter(m => m.fellowshipId !== fellowshipId);
      if (remaining.length > 0) {
        window.switchActiveFellowship(remaining[0].fellowshipId);
      } else {
        window.showDiscoveryView();
      }
    }
  } catch (err) {
    console.error("Leave fellowship error:", err);
    window.showToast?.("Failed to leave fellowship: " + err.message, "error");
  }
};

// Create Home Fellowship (Creator becomes Cell Leader)
window.createHomeFellowship = async function(data) {
  const user = window.auth?.currentUser;
  if (!user) throw new Error("Authentication required.");

  if (!data.name || !data.address) {
    throw new Error("Fellowship Name and Address are required.");
  }

  const leaderName = window.currentUserProfile?.displayName || user.displayName || user.email.split('@')[0];
  const newFellowshipRef = window.db.collection('fellowships').doc();

  const fellowshipPayload = {
    id: newFellowshipRef.id,
    name: data.name.trim(),
    motto: data.motto ? data.motto.trim() : 'Faith • Fellowship • Community',
    address: data.address.trim(),
    city: data.city ? data.city.trim() : 'Local Parish',
    day: data.day || 'Wednesday',
    time: data.time || '6:00 PM',
    phone: data.phone ? data.phone.trim() : '',
    description: data.description ? data.description.trim() : '',
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80',
    leaderId: user.uid,
    leaderName: leaderName,
    leaderEmail: user.email,
    memberCount: 1,
    additionalInfo: data.additionalInfo ? data.additionalInfo.trim() : '',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
  };

  await newFellowshipRef.set(fellowshipPayload);

  // Add creator as Cell Leader in memberships
  const membershipId = `${user.uid}_${newFellowshipRef.id}`;
  await window.db.collection('memberships').doc(membershipId).set({
    id: membershipId,
    userId: user.uid,
    fellowshipId: newFellowshipRef.id,
    fellowshipName: fellowshipPayload.name,
    fellowshipMotto: fellowshipPayload.motto,
    userDisplayName: leaderName,
    userEmail: user.email,
    userPhotoURL: window.currentUserProfile?.photoURL || user.photoURL || '',
    role: 'leader',
    status: 'active',
    joinedAt: window.firebase.firestore.FieldValue.serverTimestamp()
  });

  window.activeFellowshipId = newFellowshipRef.id;
  localStorage.setItem('homecell_active_fellowship_id', newFellowshipRef.id);

  window.soundEngine?.playLevelUp?.();
  window.showToast?.(`Home Fellowship "${fellowshipPayload.name}" created successfully!`, 'success');

  // Enter main platform as leader
  window.enterMainPlatform();
};

// Routing & View Management
window.showAuthScreen = function() {
  document.getElementById('app-auth-screen')?.classList.remove('hidden');
  document.getElementById('app-discovery-screen')?.classList.add('hidden');
  document.getElementById('app-main-platform')?.classList.add('hidden');
};

window.showDiscoveryView = function() {
  document.getElementById('app-auth-screen')?.classList.add('hidden');
  document.getElementById('app-discovery-screen')?.classList.remove('hidden');
  document.getElementById('app-main-platform')?.classList.add('hidden');

  if (window.renderDiscoveryFellowships) window.renderDiscoveryFellowships();
  if (window.lucide) window.lucide.createIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showMainAppView = function() {
  document.getElementById('app-auth-screen')?.classList.add('hidden');
  document.getElementById('app-discovery-screen')?.classList.add('hidden');
  document.getElementById('app-main-platform')?.classList.remove('hidden');

  if (window.lucide) window.lucide.createIcons();
};

window.enterMainPlatform = function() {
  sessionStorage.removeItem('homecell_just_authenticated');
  window.showMainAppView();
  window.switchTab?.(window.currentAppTab || 'feed');
};

window.handleSignOut = async function() {
  try {
    sessionStorage.removeItem('homecell_just_authenticated');
    localStorage.removeItem('homecell_active_fellowship_id');
    await window.auth.signOut();
    window.showToast?.("Signed out safely. Peace be with you.", "info");
  } catch (err) {
    console.error("Sign out error:", err);
  }
};

// Fellowship Switcher Dropdown Open/Close
window.toggleFellowshipSwitcher = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('fellowship-switcher-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.closeFellowshipSwitcher = function() {
  const dropdown = document.getElementById('fellowship-switcher-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
};

window.addEventListener('click', (e) => {
  const dropdown = document.getElementById('fellowship-switcher-dropdown');
  const btn = document.getElementById('header-fellowship-switcher-btn');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
      dropdown.classList.add('hidden');
    }
  }
});

console.log("Firebase & Fellowship Engine ready.");
