// app.js
// Central Application Orchestrator and Navigation Desk

let activeTab = 'feed';

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
  const tabIds = ['feed', 'dashboard', 'bible', 'cells', 'chat', 'prayers', 'calendar', 'downloads', 'admin', 'settings'];

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
        if (id === 'admin') {
          btn.className = `nav-btn-${id} flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 text-purple-600 bg-purple-50/80 dark:text-purple-400 dark:bg-purple-950/40 border border-purple-200/20 dark:border-purple-900/20 shadow-sm shrink-0 select-none cursor-pointer snap-center scale-102`;
        } else {
          btn.className = `nav-btn-${id} flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 text-blue-600 bg-blue-50/80 dark:text-blue-400 dark:bg-blue-950/50 border border-blue-200/20 dark:border-blue-900/20 shadow-sm shrink-0 select-none cursor-pointer snap-center scale-102`;
        }
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        if (id === 'admin') {
          btn.className = `nav-btn-${id} flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 text-purple-500/70 hover:text-purple-600 dark:text-purple-400/70 dark:hover:text-purple-300 hover:bg-purple-50/30 dark:hover:bg-purple-950/10 border border-transparent shrink-0 select-none cursor-pointer snap-center`;
        } else {
          btn.className = `nav-btn-${id} flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100/50 dark:hover:bg-zinc-800/30 border border-transparent shrink-0 select-none cursor-pointer snap-center`;
        }
      }
    }
  });

  // Call designated module initializers on tab switch
  if (tabId === 'feed' && window.initFeedEngine) window.initFeedEngine();
  if (tabId === 'dashboard' && window.initDashboard) window.initDashboard();
  if (tabId === 'bible' && window.initBibleEngine) window.initBibleEngine();
  if (tabId === 'cells' && window.initCellsModule) window.initCellsModule();
  if (tabId === 'chat' && window.initCellsModule) window.initCellsModule();
  if (tabId === 'prayers' && window.initPrayersModule) window.initPrayersModule();
  if (tabId === 'calendar' && window.initCalendarModule) window.initCalendarModule();
  if (tabId === 'downloads' && window.initDownloadsModule) window.initDownloadsModule();
  if (tabId === 'admin' && window.initAdminModule) window.initAdminModule();

  // Close mobile sidebar if active
  if (window.toggleMobileSidebar) {
    window.toggleMobileSidebar(false);
  }

  // Highlight active sidebar links and recreate Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Mobile sidebar navigation drawer toggle controls
function toggleMobileSidebar(isOpen) {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar || !backdrop) return;
  if (isOpen) {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    backdrop.classList.remove('hidden');
    setTimeout(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
    }, 50);
  } else {
    sidebar.classList.remove('translate-x-0');
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 300);
  }
}

// Auth state management
let isAuthListenerAttached = false;

function listenToAuthState() {
  if (isAuthListenerAttached) return;
  isAuthListenerAttached = true;

  if (!window.auth) {
    console.warn("Firebase Auth is not ready yet, retrying in 100ms...");
    isAuthListenerAttached = false;
    setTimeout(listenToAuthState, 100);
    return;
  }

  // Handle redirect result if user signed in via redirect (especially on mobile)
  window.auth.getRedirectResult()
    .then(result => {
      if (result && result.user) {
        window.showToast?.("Google authentication successful.");
      }
    })
    .catch(err => {
      console.error("Google redirect auth failed:", err);
      window.showToast?.("Google redirect sign-in failed: " + err.message, 'error');
    });

  window.auth.onAuthStateChanged(user => {
    const authModal = document.getElementById('auth-modal');
    const badge = document.getElementById('user-profile-badge');

    if (!user) {
      // User logged out: keep authModal hidden by default so they can view the portfolio
      if (authModal) authModal.classList.add('hidden');
      if (badge) badge.classList.add('hidden');
      document.documentElement.classList.add('unauthenticated');
      
      window.currentUserRole = 'Guest';
      window.currentUserProfile = null;
      switchTab('feed');
      return;
    }

    document.documentElement.classList.remove('unauthenticated');
    if (authModal) {
      authModal.classList.add('hidden');
      authModal.classList.remove('flex');
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
                const adminBtn = document.getElementById('nav-admin');
                if (adminBtn) adminBtn.classList.remove('hidden');
              });
          }

          if (window.currentUserRole === 'Super Admin') {
            const adminBtn = document.getElementById('nav-admin');
            if (adminBtn) adminBtn.classList.remove('hidden');
          } else {
            const adminBtn = document.getElementById('nav-admin');
            if (adminBtn) adminBtn.classList.add('hidden');
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

          // Update mobile sidebar badges
          const mobNameEl = document.getElementById('mobile-sidebar-user-name');
          const mobRoleEl = document.getElementById('mobile-sidebar-user-role');
          const mobAvatarEl = document.getElementById('mobile-user-avatar');
          const nameValue = profile.displayName || user.email;
          if (mobNameEl) mobNameEl.innerText = nameValue;
          if (mobRoleEl) {
            mobRoleEl.innerText = window.currentUserRole.toUpperCase();
            if (window.currentUserRole === 'Super Admin') {
              mobRoleEl.className = "text-[9px] uppercase font-bold text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-950/40 px-1.5 py-0.5 rounded tracking-widest";
            } else {
              mobRoleEl.className = "text-[9px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded tracking-widest";
            }
          }
          if (mobAvatarEl) {
            mobAvatarEl.innerText = nameValue.charAt(0).toUpperCase();
          }

          if (badge) badge.classList.remove('hidden');
          if (authModal) authModal.classList.add('hidden');

          if (window.startDownloadPromoBanner) {
            window.startDownloadPromoBanner();
          }

          // Initialize Dashboard
          if (activeTab === 'feed') {
            switchTab('dashboard');
          } else {
            switchTab(activeTab);
          }

          // Sync notification metadata (such as role and uid) with server Web Push subscribers list
          if (window.updateSubscriptionOnServer) {
            window.updateSubscriptionOnServer();
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
        let friendlyMsg = err.message;
        if (err.code === 'auth/email-already-in-use') {
          friendlyMsg = "An account with this email already exists. Please use the 'Sign In' tab.";
        } else if (err.code === 'auth/weak-password') {
          friendlyMsg = "The password is too weak. Please use at least 6 characters.";
        } else if (err.code === 'auth/invalid-email') {
          friendlyMsg = "Please enter a valid email address.";
        }
        window.showToast?.(friendlyMsg, 'error');
      });
  } else {
    window.auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.showToast?.("Signed in successfully.");
      })
      .catch(err => {
        console.error("Sign-in failed:", err);
        let friendlyMsg = err.message;
        if (err.code === 'auth/invalid-credential' || (err.message && err.message.includes('invalid-credential'))) {
          friendlyMsg = "Incorrect password or no account found. If you are a new member, please tap the 'Sign Up' tab first!";
        }
        window.showToast?.(friendlyMsg, 'error');
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

  // General Service Worker Registration for PWA installability on all devices
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('PWA Service Worker registered with scope: ', reg.scope))
      .catch(err => console.error('PWA Service Worker registration failed: ', err));
  }

  // Apply dismissed states for widgets
  ['quick-help-box', 'member-journeys-box'].forEach(id => {
    if (localStorage.getItem(`dismissed-${id}`) === 'true') {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    }
  });

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
      provider.addScope('profile');
      provider.addScope('email');
      const inIframe = window.self !== window.top;

      window.showToast?.("Opening Google Sign-In...", "info");

      // Try Popup first on all devices for fastest execution (no full page reload)
      window.auth.signInWithPopup(provider)
        .then(() => {
          window.showToast?.("Google authentication successful.", "success");
        })
        .catch(err => {
          console.warn("Google Popup failed/blocked, trying redirect fallback:", err);
          
          if (!inIframe) {
            window.showToast?.("Redirecting to Google Sign-In...");
            window.auth.signInWithRedirect(provider);
          } else {
            console.error("Google authentication failed:", err);
            let friendlyMsg = "Google authentication failed: " + err.message;
            if (inIframe) {
              friendlyMsg += " Hint: If the popup is blocked or cookies are restricted in the iframe, try opening the application in a new window using the 'Open in New Tab' button on the top right, or use Email/Password sign up.";
            }
            window.showToast?.(friendlyMsg, 'error');
          }
        });
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
            window.updateSubscriptionOnServer?.();

            // Notify Super Admins offline/off-app of new cell registration
            if (window.sendPushNotification) {
              window.sendPushNotification(
                "🏰 New Fellowship Cell Registered!",
                `Cell "${cellName}" has been established in ${cellCity} by leader ${name}.`,
                "/?tab=cells",
                "Super Admin"
              );
            }
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
            window.updateSubscriptionOnServer?.();
            // Trigger first daily streak
            setTimeout(() => {
              window.incrementUserStreak?.("onboarding signup");
            }, 1000);
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
          // Trigger profile streak increase
          setTimeout(() => {
            window.incrementUserStreak?.("updating soul testimony profile details");
          }, 1000);
        })
        .catch(err => window.handleFirestoreError(err, 'write', `users/${user.uid}`));
    });
  }
});

// Global User Streak Tracker Engine
window.incrementUserStreak = function(reason) {
  const user = window.auth.currentUser;
  if (!user) return;

  const docRef = window.db.collection('users').doc(user.uid);
  docRef.get().then(doc => {
    let currentStreak = 0;
    let lastCheckinDate = "";
    
    if (doc.exists) {
      const data = doc.data();
      currentStreak = data.streak || 0;
      lastCheckinDate = data.lastCheckinDate || "";
    }

    const todayStr = new Date().toDateString();
    
    // Check if they already did check-in today
    if (lastCheckinDate === todayStr) {
      // Just update reason to show they did more things
      docRef.update({
        lastStreakReason: reason
      }).then(() => {
        window.showToast?.(`Activity logged: ${reason}! Keep it up.`, "info");
      }).catch(err => console.error("Streak log update error: ", err));
      return;
    }

    // Determine if streak is consecutive (yesterday) or reset
    let newStreak = currentStreak + 1;
    if (lastCheckinDate) {
      const lastDate = new Date(lastCheckinDate);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // Streak broken, reset to 1
        newStreak = 1;
        window.showToast?.("Daily streak was reset, starting fresh today!", "info");
      }
    }

    // Update Firestore
    docRef.update({
      streak: newStreak,
      lastCheckinDate: todayStr,
      lastStreakReason: reason
    }).then(() => {
      window.showToast?.(`🔥 Daily Streak updated to ${newStreak} days! (Reason: ${reason})`, "success");
      
      // Check if new streak triggers highest streak congratulatory milestone!
      checkNewHighStreakMilestone(newStreak, user.uid);
    }).catch(err => console.error("Streak increment update error: ", err));

  }).catch(err => console.error("Streak query error: ", err));
};

function checkNewHighStreakMilestone(newStreak, myUid) {
  // Query other users' maximum streaks (excluding current user)
  window.db.collection('users').orderBy('streak', 'desc').limit(2).get().then(snap => {
    let highestOtherStreak = 0;
    snap.forEach(doc => {
      if (doc.id !== myUid) {
        highestOtherStreak = Math.max(highestOtherStreak, doc.data().streak || 0);
      }
    });

    // If new streak is strictly greater than the highest other streak, celebrate!
    if (newStreak > highestOtherStreak && newStreak > 1) {
      const displayName = window.currentUserProfile?.displayName || "A dedicated member";
      
      // Trigger confetti & celebration!
      window.triggerConfetti?.();
      
      // Trigger off-app background push notifications!
      window.sendPushNotification?.(
        "🏆 NEW REIGNING CHAMPION!",
        `Congratulations to ${displayName} for achieving the new highest spiritual streak of ${newStreak} days! Can you beat them?`,
        "/?tab=dashboard"
      );

      // Automated community post on the feed celebrating this milestone!
      const docId = window.db.collection('community_feed').doc().id;
      window.db.collection('community_feed').doc(docId).set({
        id: docId,
        text: `👑 High-Streak Milestone Celebration! Let us rejoice as ${displayName} sets a brand new highest streak of ${newStreak} consecutive days in devotion, prayer, and study! Keep shining your light! 🌟✨`,
        type: 'announcement',
        authorUid: myUid,
        authorName: displayName,
        authorRole: window.currentUserRole || 'Member',
        likesCount: 0,
        likes: {},
        comments: [],
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }).catch(err => console.warn("Leaderboard automatic post failed: ", err));
    }
  }).catch(err => console.warn("Streak leaderboard validation query limit: ", err));
}

function dismissWidget(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
    localStorage.setItem(`dismissed-${id}`, 'true');
    window.showToast?.("Widget dismissed.");
  }
}

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
window.toggleMobileSidebar = toggleMobileSidebar;
window.dismissWidget = dismissWidget;
