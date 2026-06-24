// app.js
// Central Application Orchestrator and Navigation Desk

let activeTab = 'portfolio';

// Initialize Theme early to prevent flicker
function initTheme() {
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    window.showToast?.("High-contrast Light Theme active.");
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    window.showToast?.("High-contrast Dark Theme active.");
  }
}

// Seamless Tab Routing Desk
function switchTab(tabId) {
  activeTab = tabId;

  // List of all navigation tabs
  const tabIds = ['portfolio', 'dashboard', 'bible', 'cells', 'prayers', 'calendar', 'downloads', 'admin'];

  tabIds.forEach(id => {
    const pane = document.getElementById(`tab-${id}`);
    const btn = document.getElementById(`nav-${id}`);

    if (pane) {
      if (id === tabId) {
        pane.classList.add('active');
        pane.classList.remove('hidden');
      } else {
        pane.classList.remove('active');
        pane.classList.add('hidden');
      }
    }

    if (btn) {
      if (id === tabId) {
        btn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40 border border-transparent";
      } else {
        btn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent";
      }
    }
  });

  // Call designated module initializers on tab switch
  if (tabId === 'dashboard' && window.initDashboard) window.initDashboard();
  if (tabId === 'bible' && window.initBibleEngine) window.initBibleEngine();
  if (tabId === 'cells' && window.initCellsModule) window.initCellsModule();
  if (tabId === 'prayers' && window.initPrayersModule) window.initPrayersModule();
  if (tabId === 'calendar' && window.initCalendarModule) window.initCalendarModule();
  if (tabId === 'downloads' && window.initDownloadsModule) window.initDownloadsModule();
  if (tabId === 'admin' && window.initAdminModule) window.initAdminModule();

  // Highlight active sidebar links and recreate Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Auth state management
let isAuthListenerAttached = false;

function listenToAuthState() {
  if (isAuthListenerAttached) return;
  isAuthListenerAttached = true;

  window.auth.onAuthStateChanged(user => {
    const authModal = document.getElementById('auth-modal');
    const badge = document.getElementById('user-profile-badge');

    if (!user) {
      // User logged out: display Login modal frame
      if (authModal) authModal.classList.remove('hidden');
      if (badge) badge.classList.add('hidden');
      
      window.currentUserRole = 'Guest';
      window.currentUserProfile = null;
      switchTab('portfolio');
      return;
    }

    // User logged in, check profile document
    window.db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (!doc.exists) {
          // New User signup: launch Onboarding
          openOnboardingModal();
        } else {
          // Registered member, sync variables and unlock console
          const profile = doc.data();
          window.currentUserProfile = profile;
          window.currentUserRole = profile.role || 'Member';

          // Ensure Super Admin email matched is locked
          if (user.email === 'danielgiobari644@gmail.com' && profile.role !== 'Super Admin') {
            window.db.collection('users').doc(user.uid).update({ role: 'Super Admin' })
              .then(() => {
                window.currentUserRole = 'Super Admin';
                window.showToast?.("Super Admin credentials unlocked.");
              });
          }

          // Update header badges
          const nameEl = document.getElementById('header-user-name');
          const roleEl = document.getElementById('header-user-role');
          if (nameEl) nameEl.innerText = profile.displayName || user.email;
          if (roleEl) {
            roleEl.innerText = window.currentUserRole.toUpperCase();
            if (window.currentUserRole === 'Super Admin') {
              roleEl.className = "text-[9px] uppercase font-bold text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-950/40 px-1.5 py-0.5 rounded tracking-widest";
            } else {
              roleEl.className = "text-[9px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded tracking-widest";
            }
          }

          if (badge) badge.classList.remove('hidden');
          if (authModal) authModal.classList.add('hidden');

          // Initialize Dashboard
          if (activeTab === 'portfolio') {
            switchTab('dashboard');
          } else {
            switchTab(activeTab);
          }
        }
      })
      .catch(err => window.handleFirestoreError(err, 'get', `users/${user.uid}`));
  });
}

// Onboarding Modal control
function openOnboardingModal() {
  const ob = document.getElementById('onboarding-modal');
  if (ob) ob.classList.remove('hidden');

  // Populate cells directory into onboarding select
  window.db.collection('cells').where('status', '==', 'active').get().then(snap => {
    const obSelect = document.getElementById('ob-cell-choice');
    if (!obSelect) return;
    
    obSelect.innerHTML = `
      <option value="none">Register / Setup Independently later</option>
      <option value="new">Create/Register a new Fellowship Cell Group</option>
    `;

    snap.forEach(doc => {
      const cell = doc.data();
      const opt = document.createElement('option');
      opt.value = doc.id;
      opt.innerText = `${cell.name} (${cell.city})`;
      obSelect.appendChild(opt);
    });
  });
}

function closeOnboardingModal() {
  const ob = document.getElementById('onboarding-modal');
  if (ob) ob.classList.add('hidden');
}

// Edit soul testimony profile modal
function openProfileEditModal() {
  const p = window.currentUserProfile;
  if (!p) return;

  const m = document.getElementById('profile-modal');
  const nameInput = document.getElementById('edit-profile-name');
  const bioInput = document.getElementById('edit-profile-bio');
  const coordsInput = document.getElementById('edit-profile-coords');

  if (nameInput) nameInput.value = p.displayName || '';
  if (bioInput) bioInput.value = p.bio || '';
  if (coordsInput) coordsInput.value = p.coordinates || '';

  if (m) m.classList.remove('hidden');
}

function closeProfileModal() {
  const m = document.getElementById('profile-modal');
  if (m) m.classList.add('hidden');
}

// Standard Auth Actions
function handleAuthSubmit(email, password, isSignUpMode) {
  if (isSignUpMode) {
    window.auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        window.showToast?.("Account created successfully!");
      })
      .catch(err => {
        console.error("Signup failed:", err);
        window.showToast?.(err.message, 'error');
      });
  } else {
    window.auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.showToast?.("Signed in successfully.");
      })
      .catch(err => {
        console.error("Sign-in failed:", err);
        window.showToast?.(err.message, 'error');
      });
  }
}

function signOutUser() {
  window.auth.signOut()
    .then(() => {
      window.showToast?.("Logged out securely.");
    })
    .catch(err => window.showToast?.("Sign-out failed: " + err.message, 'error'));
}

function triggerPasswordReset() {
  const emailInput = document.getElementById('auth-email');
  if (!emailInput) return;
  const email = emailInput.value.trim();

  if (!email) {
    window.showToast?.("Please input your email address in the field to request recovery links.", 'error');
    return;
  }

  window.auth.sendPasswordResetEmail(email)
    .then(() => window.showToast?.(`Reset instructions dispatched to ${email}`))
    .catch(err => window.showToast?.(err.message, 'error'));
}

// Toggle Signin/Signup tab selectors
let authMode = 'signin';
function setAuthTab(mode) {
  authMode = mode;
  const tabSignin = document.getElementById('btn-tab-signin');
  const tabSignup = document.getElementById('btn-tab-signup');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (mode === 'signup') {
    if (tabSignin) tabSignin.className = "flex-1 pb-3 text-center border-b-2 border-transparent text-slate-500 dark:text-zinc-400";
    if (tabSignup) tabSignup.className = "flex-1 pb-3 text-center border-b-2 border-blue-600 text-blue-600";
    if (submitBtn) submitBtn.innerHTML = `Sign Up <i data-lucide="user-plus" class="w-5 h-5"></i>`;
  } else {
    if (tabSignin) tabSignin.className = "flex-1 pb-3 text-center border-b-2 border-blue-600 text-blue-600";
    if (tabSignup) tabSignup.className = "flex-1 pb-3 text-center border-b-2 border-transparent text-slate-500 dark:text-zinc-400";
    if (submitBtn) submitBtn.innerHTML = `Sign In <i data-lucide="arrow-right" class="w-5 h-5"></i>`;
  }
  if (window.lucide) window.lucide.createIcons();
}

// DOM Setup
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  listenToAuthState();

  // Sidebar navigation handlers
  const navs = ['portfolio', 'dashboard', 'bible', 'cells', 'prayers', 'calendar', 'downloads', 'admin'];
  navs.forEach(nav => {
    const btn = document.getElementById(`nav-${nav}`);
    if (btn) {
      btn.onclick = () => switchTab(nav);
    }
  });

  // Auth form submissions
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value.trim();
      const pass = document.getElementById('auth-password').value;
      handleAuthSubmit(email, pass, authMode === 'signup');
    });
  }

  // Google OAuth triggers
  const googleBtn = document.getElementById('google-auth-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      window.auth.signInWithPopup(provider)
        .then(() => window.showToast?.("Google authentication successful."))
        .catch(err => window.showToast?.("Google authentication failed: " + err.message, 'error'));
    });
  }

  // Onboarding Form handler (Create/Join cell)
  const obChoiceSelect = document.getElementById('ob-cell-choice');
  const obNewCellSection = document.getElementById('ob-new-cell-section');
  if (obChoiceSelect && obNewCellSection) {
    obChoiceSelect.addEventListener('change', (e) => {
      if (e.target.value === 'new') {
        obNewCellSection.classList.remove('hidden');
      } else {
        obNewCellSection.classList.add('hidden');
      }
    });
  }

  const onboardingForm = document.getElementById('onboarding-form');
  if (onboardingForm) {
    onboardingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = window.auth.currentUser;
      if (!user) return;

      const name = document.getElementById('ob-display-name').value.trim();
      const bio = document.getElementById('ob-spiritual-bio').value.trim();
      const coords = document.getElementById('ob-coordinates').value.trim();
      const choice = document.getElementById('ob-cell-choice').value;

      const userDocRef = window.db.collection('users').doc(user.uid);

      if (choice === 'new') {
        const cellName = document.getElementById('ob-new-cell-name').value.trim();
        const cellCity = document.getElementById('ob-new-cell-city').value.trim();
        const cellDesc = document.getElementById('ob-new-cell-desc').value.trim();

        if (!cellName || !cellCity) {
          window.showToast?.("Please input the name & city location of your new Fellowship cell.", "error");
          return;
        }

        const newCellId = window.db.collection('cells').doc().id;

        // Register new cell
        window.db.collection('cells').doc(newCellId).set({
          id: newCellId,
          name: cellName,
          city: cellCity,
          description: cellDesc || 'A holy gathering point of fellowship & prayer.',
          leaderUid: user.uid,
          leaderName: name,
          leaderEmail: user.email,
          coLeaders: [],
          status: 'active',
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        })
          .then(() => {
            // Write User Profile
            return userDocRef.set({
              uid: user.uid,
              displayName: name,
              email: user.email,
              bio: bio,
              coordinates: coords,
              role: 'Cell Leader', // Automatic promotion
              cellId: newCellId,
              createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
          })
          .then(() => {
            window.showToast?.("Fellowship cell established & profile fully onboarded!");
            closeOnboardingModal();
          })
          .catch(err => window.handleFirestoreError(err, 'write', 'onboarding'));

      } else {
        // Standard join or none
        userDocRef.set({
          uid: user.uid,
          displayName: name,
          email: user.email,
          bio: bio,
          coordinates: coords,
          role: 'Member',
          cellId: choice,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        })
          .then(() => {
            window.showToast?.("Onboarding successfully completed!");
            closeOnboardingModal();
          })
          .catch(err => window.handleFirestoreError(err, 'write', 'onboarding'));
      }
    });
  }

  // Profile Edit form handler
  const profileEditForm = document.getElementById('profile-edit-form');
  if (profileEditForm) {
    profileEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = window.auth.currentUser;
      if (!user) return;

      const name = document.getElementById('edit-profile-name').value.trim();
      const bio = document.getElementById('edit-profile-bio').value.trim();
      const coords = document.getElementById('edit-profile-coords').value.trim();

      window.db.collection('users').doc(user.uid).update({
        displayName: name,
        bio: bio,
        coordinates: coords
      })
        .then(() => {
          window.showToast?.("Soul testimony details updated successfully.");
          closeProfileModal();
        })
        .catch(err => window.handleFirestoreError(err, 'write', `users/${user.uid}`));
    });
  }
});

// Expose globally
window.switchTab = switchTab;
window.toggleTheme = toggleTheme;
window.signOutUser = signOutUser;
window.triggerPasswordReset = triggerPasswordReset;
window.setAuthTab = setAuthTab;
window.openOnboardingModal = openOnboardingModal;
window.closeOnboardingModal = closeOnboardingModal;
window.openProfileEditModal = openProfileEditModal;
window.closeProfileModal = closeProfileModal;
