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

  const tabTitles = {
    feed: 'Community Feed',
    dashboard: 'Faith Dashboard',
    streak: 'My Streak',
    bible: 'Scripture & Trivia',
    cells: 'Cell Fellowships',
    chat: 'Fellowship Lounge',
    prayers: 'Prayer Desk',
    calendar: 'Parish Events',
    downloads: 'Resource Hub',
    settings: 'Profile & Settings',
    admin: 'Admin Console'
  };

  // Update top active tab badge
  const tabTitleEl = document.getElementById('active-tab-title-text');
  if (tabTitleEl && tabTitles[tabId]) {
    tabTitleEl.innerText = tabTitles[tabId];
  }

  // List of all navigation tabs
  const tabIds = ['feed', 'dashboard', 'streak', 'bible', 'cells', 'chat', 'prayers', 'calendar', 'downloads', 'admin', 'settings'];

  tabIds.forEach(id => {
    const pane = document.getElementById(`tab-${id}`);
    const navBtns = document.querySelectorAll(`.nav-item-${id}, #nav-${id}, #mobile-nav-${id}`);

    if (pane) {
      if (id === tabId) {
        pane.classList.add('active');
        pane.classList.remove('hidden');
      } else {
        pane.classList.remove('active');
        pane.classList.add('hidden');
      }
    }

    navBtns.forEach(btn => {
      const isSelected = (id === tabId);
      if (id === 'admin') {
        btn.className = `nav-item-${id} w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
            : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
        }`;
      } else {
        btn.className = `nav-item-${id} w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
        }`;
      }
    });
  });

  // Call designated module initializers on tab switch
  if (tabId === 'feed' && window.initFeedEngine) window.initFeedEngine();
  if (tabId === 'dashboard' && window.initDashboard) window.initDashboard();
  if (tabId === 'streak' && window.initStreakModule) window.initStreakModule();
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

    const isSuperAdminEmail = user.email && (user.email.toLowerCase() === 'danielgiobari644@gmail.com');

    // User logged in, check profile document
    window.db.collection('users').doc(user.uid).get()
      .then(doc => {
        let profile = doc.exists ? doc.data() : null;

        if (isSuperAdminEmail) {
          // Force Super Admin role and auto-complete profile for danielgiobari644@gmail.com
          const superAdminData = {
            uid: user.uid,
            displayName: (profile && profile.displayName) || user.displayName || 'Daniel Giobari',
            email: 'danielgiobari644@gmail.com',
            bio: (profile && profile.bio) || 'General Super Admin & Founder of Home.Cell',
            coordinates: (profile && profile.coordinates) || 'Global Headquarters',
            role: 'Super Admin',
            onboarded: true,
            cellId: (profile && profile.cellId) || 'none',
            createdAt: (profile && profile.createdAt) || window.firebase.firestore.FieldValue.serverTimestamp()
          };

          // Save/Merge to Firestore
          window.db.collection('users').doc(user.uid).set(superAdminData, { merge: true }).catch(e => console.warn("Super Admin auto-set error:", e));

          window.currentUserProfile = superAdminData;
          window.currentUserRole = 'Super Admin';

          window.showToast?.("🛡️ Welcome Super Admin Daniel! Executive console unlocked.", "success");
          applyUserSessionUI(superAdminData, user, badge, authModal);
        } else if (!doc.exists || !profile.onboarded) {
          // New User signup or incomplete profile: launch Onboarding
          openOnboardingModal();
        } else {
          // Registered member, sync variables and unlock console
          window.currentUserProfile = profile;
          window.currentUserRole = profile.role || 'Member';
          applyUserSessionUI(profile, user, badge, authModal);
        }
      })
      .catch(err => {
        console.error("Auth state profile fetch error:", err);
        if (isSuperAdminEmail) {
          const fallbackData = {
            uid: user.uid,
            displayName: user.displayName || 'Daniel Giobari',
            email: 'danielgiobari644@gmail.com',
            role: 'Super Admin',
            onboarded: true
          };
          window.currentUserProfile = fallbackData;
          window.currentUserRole = 'Super Admin';
          applyUserSessionUI(fallbackData, user, badge, authModal);
        } else {
          window.handleFirestoreError(err, 'get', `users/${user.uid}`);
        }
      });
  });
}

function applyUserSessionUI(profile, user, badge, authModal) {
  const adminBtns = document.querySelectorAll('#nav-admin, #mobile-nav-admin, .nav-item-admin');
  if (window.currentUserRole === 'Super Admin') {
    adminBtns.forEach(btn => btn.classList.remove('hidden'));
  } else {
    adminBtns.forEach(btn => btn.classList.add('hidden'));
  }

  // Update header badges
  const nameEl = document.getElementById('header-user-name');
  const roleEl = document.getElementById('header-user-role');
  const nameValue = profile.displayName || user.email;
  if (nameEl) nameEl.innerText = nameValue;
  if (roleEl) {
    roleEl.innerText = window.currentUserRole.toUpperCase();
    if (window.currentUserRole === 'Super Admin') {
      roleEl.className = "text-[9px] uppercase font-bold text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-950/40 px-1.5 py-0.5 rounded tracking-widest";
    } else {
      roleEl.className = "text-[9px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded tracking-widest";
    }
  }

  // Update desktop sidebar badges
  const deskNameEl = document.getElementById('sidebar-user-name');
  const deskRoleEl = document.getElementById('sidebar-user-role');
  if (deskNameEl) deskNameEl.innerText = nameValue;
  if (deskRoleEl) deskRoleEl.innerText = window.currentUserRole.toUpperCase();

  // Update mobile sidebar badges
  const mobNameEl = document.getElementById('mobile-sidebar-user-name');
  const mobRoleEl = document.getElementById('mobile-sidebar-user-role');
  const mobAvatarEl = document.getElementById('mobile-user-avatar');
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

  // Check if user should see fellowship prompt or sidebar spotlight hint
  setTimeout(() => {
    checkSidebarSpotlight();
    checkJoinFellowshipPrompt();
  }, 800);

  // Sync notification metadata with server
  if (window.updateSubscriptionOnServer) {
    window.updateSubscriptionOnServer();
  }
}

// Onboarding Wizard State & Control
let currentObSlide = 1;
const totalObSlides = 7;
let touchStartX = 0;
let touchEndX = 0;

function renderOnboardingSlide(slideNum) {
  currentObSlide = Math.max(1, Math.min(totalObSlides, slideNum));

  // Update badge & progress bar
  const badge = document.getElementById('ob-step-badge');
  const bar = document.getElementById('ob-progress-bar');
  if (badge) badge.innerText = `STEP ${currentObSlide} OF ${totalObSlides}`;
  if (bar) bar.style.width = `${(currentObSlide / totalObSlides) * 100}%`;

  // Hide all slides, reveal target slide
  for (let i = 1; i <= totalObSlides; i++) {
    const slide = document.getElementById(`ob-slide-${i}`);
    if (slide) {
      if (i === currentObSlide) {
        slide.classList.remove('hidden');
        slide.classList.add('animate-fadeIn');
      } else {
        slide.classList.add('hidden');
      }
    }
  }

  // Prev / Next button states
  const btnPrev = document.getElementById('btn-ob-prev');
  const btnNext = document.getElementById('btn-ob-next');

  if (btnPrev) {
    if (currentObSlide === 1) btnPrev.classList.add('invisible');
    else btnPrev.classList.remove('invisible');
  }

  if (btnNext) {
    if (currentObSlide === totalObSlides) {
      btnNext.innerHTML = `Complete Setup <i data-lucide="check" class="w-4 h-4"></i>`;
      btnNext.classList.replace('bg-blue-600', 'bg-emerald-600');
      btnNext.classList.replace('hover:bg-blue-500', 'hover:bg-emerald-500');
    } else {
      btnNext.innerHTML = `Next <i data-lucide="chevron-right" class="w-4 h-4"></i>`;
      btnNext.classList.replace('bg-emerald-600', 'bg-blue-600');
      btnNext.classList.replace('hover:bg-emerald-500', 'hover:bg-blue-500');
    }
  }

  // Dots indicator
  const dotsBox = document.getElementById('ob-dots-container');
  if (dotsBox) {
    dotsBox.innerHTML = '';
    for (let i = 1; i <= totalObSlides; i++) {
      const dot = document.createElement('button');
      dot.className = `w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
        i === currentObSlide ? 'w-6 bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400'
      }`;
      dot.onclick = () => {
        window.soundEngine?.playClick();
        renderOnboardingSlide(i);
      };
      dotsBox.appendChild(dot);
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function nextOnboardingSlide() {
  window.soundEngine?.playClick();
  if (currentObSlide < totalObSlides) {
    renderOnboardingSlide(currentObSlide + 1);
  } else {
    // Focus on display name on slide 7
    const input = document.getElementById('ob-display-name');
    if (input) input.focus();
  }
}

function prevOnboardingSlide() {
  window.soundEngine?.playClick();
  if (currentObSlide > 1) {
    renderOnboardingSlide(currentObSlide - 1);
  }
}

function skipOnboardingToSetup() {
  window.soundEngine?.playClick();
  renderOnboardingSlide(totalObSlides);
}

function openOnboardingModal() {
  const ob = document.getElementById('onboarding-modal');
  if (ob) ob.classList.remove('hidden');

  renderOnboardingSlide(1);

  // Attach touch gesture listeners for swiping
  const viewport = document.getElementById('ob-slides-viewport');
  if (viewport && !viewport.dataset.touchAttached) {
    viewport.dataset.touchAttached = 'true';
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, { passive: true });
  }

  // Populate cells directory into onboarding select
  if (window.db) {
    window.db.collection('cells').where('status', '==', 'active').get().then(snap => {
      const obSelect = document.getElementById('ob-cell-choice');
      if (!obSelect) return;
      
      obSelect.innerHTML = `
        <option value="none">Browse & Join Cell Groups Later</option>
        <option value="new">Create/Register a new Fellowship Cell Group</option>
      `;

      snap.forEach(doc => {
        const cell = doc.data();
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.innerText = `${cell.name} (${cell.city})`;
        obSelect.appendChild(opt);
      });
    }).catch(err => console.warn("Onboarding cell choice load:", err));
  }
}

function handleSwipeGesture() {
  const diffX = touchEndX - touchStartX;
  if (Math.abs(diffX) > 40) {
    if (diffX < 0) nextOnboardingSlide(); // Swipe left = next
    else prevOnboardingSlide(); // Swipe right = prev
  }
}

function closeOnboardingModal() {
  const ob = document.getElementById('onboarding-modal');
  if (ob) ob.classList.add('hidden');
  localStorage.setItem('homecell_onboarding_completed', 'true');

  // Trigger fellowship modal if user is not in a cell group
  setTimeout(() => {
    checkJoinFellowshipPrompt();
  }, 500);
}

function restartOnboardingTutorial() {
  window.showToast?.("Restarting Interactive Onboarding Tour...", "info");
  openOnboardingModal();
}

// Join Fellowship Prompt Modal Logic
let fellowshipModalCellsList = [];

function checkJoinFellowshipPrompt() {
  const profile = window.currentUserProfile;
  if (profile && (!profile.cellId || profile.cellId === 'none')) {
    if (!localStorage.getItem('homecell_dismissed_fellowship_prompt')) {
      openJoinFellowshipModal();
    }
  }
}

function openJoinFellowshipModal() {
  const modal = document.getElementById('join-fellowship-modal');
  const cardsBox = document.getElementById('fellowship-modal-cards-list');
  if (!modal || !cardsBox) return;

  modal.classList.remove('hidden');

  if (window.db) {
    window.db.collection('cells').where('status', '==', 'active').get().then(snap => {
      fellowshipModalCellsList = [];
      snap.forEach(doc => {
        fellowshipModalCellsList.push({ id: doc.id, ...doc.data() });
      });
      renderFellowshipModalCards(fellowshipModalCellsList);
    }).catch(err => console.warn("Load fellowship modal cells:", err));
  }
}

function renderFellowshipModalCards(cells) {
  const cardsBox = document.getElementById('fellowship-modal-cards-list');
  if (!cardsBox) return;

  cardsBox.innerHTML = '';
  if (cells.length === 0) {
    cardsBox.innerHTML = `
      <div class="col-span-full text-center py-8 text-slate-400">
        <p class="text-xs font-bold">No matching fellowship cells found.</p>
      </div>
    `;
    return;
  }

  cells.forEach(cell => {
    const card = document.createElement('div');
    card.className = "p-4 bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/70 rounded-2xl space-y-3 flex flex-col justify-between shadow-xs";
    card.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between gap-1">
          <span class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">${cell.city || 'Home Cell'}</span>
          <span class="text-[10px] font-bold text-slate-400">👥 Members</span>
        </div>
        <h4 class="text-sm font-black text-slate-900 dark:text-zinc-100">${cell.name}</h4>
        <p class="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">${cell.description}</p>
        <div class="text-[11px] text-slate-600 dark:text-zinc-300 font-medium">
          👤 Leader: <span class="font-bold">${cell.leaderName}</span>
        </div>
      </div>
      <button onclick="window.joinCell('${cell.id}'); window.closeJoinFellowshipModal();" class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5">
        Request to Join <i data-lucide="plus" class="w-3.5 h-3.5"></i>
      </button>
    `;
    cardsBox.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

function filterFellowshipModalList(query) {
  const q = query.toLowerCase().trim();
  const filtered = fellowshipModalCellsList.filter(c => 
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.city && c.city.toLowerCase().includes(q)) ||
    (c.leaderName && c.leaderName.toLowerCase().includes(q))
  );
  renderFellowshipModalCards(filtered);
}

function closeJoinFellowshipModal() {
  const modal = document.getElementById('join-fellowship-modal');
  if (modal) modal.classList.add('hidden');
  localStorage.setItem('homecell_dismissed_fellowship_prompt', 'true');

  // Trigger quiz prompt next
  setTimeout(() => {
    checkQuizPrompt();
  }, 400);
}

// Sidebar Spotlight Hint
function checkSidebarSpotlight() {
  if (!localStorage.getItem('homecell_sidebar_hint_seen')) {
    const overlay = document.getElementById('sidebar-spotlight-overlay');
    if (overlay) overlay.classList.remove('hidden');

    // Add pulse ring to hamburger buttons
    const btn1 = document.getElementById('btn-toggle-sidebar');
    const btn2 = document.getElementById('mobile-nav-toggle');
    if (btn1) btn1.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2', 'animate-pulse');
    if (btn2) btn2.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2', 'animate-pulse');
  }
}

function dismissSidebarSpotlight() {
  const overlay = document.getElementById('sidebar-spotlight-overlay');
  if (overlay) overlay.classList.add('hidden');
  localStorage.setItem('homecell_sidebar_hint_seen', 'true');

  const btn1 = document.getElementById('btn-toggle-sidebar');
  const btn2 = document.getElementById('mobile-nav-toggle');
  if (btn1) btn1.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2', 'animate-pulse');
  if (btn2) btn2.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2', 'animate-pulse');
}

// Quiz Prompt
function checkQuizPrompt() {
  if (!localStorage.getItem('homecell_quiz_prompt_seen')) {
    const modal = document.getElementById('encourage-quiz-modal');
    if (modal) modal.classList.remove('hidden');
  }
}

function launchQuizFromPrompt() {
  const modal = document.getElementById('encourage-quiz-modal');
  if (modal) modal.classList.add('hidden');
  localStorage.setItem('homecell_quiz_prompt_seen', 'true');

  if (window.switchTab) window.switchTab('bible');
  if (window.setBibleSubMode) window.setBibleSubMode('quiz');
}

// Attach keyboard navigation for onboarding
window.addEventListener('keydown', (e) => {
  const ob = document.getElementById('onboarding-modal');
  if (ob && !ob.classList.contains('hidden')) {
    if (e.key === 'ArrowRight') nextOnboardingSlide();
    if (e.key === 'ArrowLeft') prevOnboardingSlide();
  }
});

window.renderOnboardingSlide = renderOnboardingSlide;
window.nextOnboardingSlide = nextOnboardingSlide;
window.prevOnboardingSlide = prevOnboardingSlide;
window.skipOnboardingToSetup = skipOnboardingToSetup;
window.restartOnboardingTutorial = restartOnboardingTutorial;
window.openJoinFellowshipModal = openJoinFellowshipModal;
window.closeJoinFellowshipModal = closeJoinFellowshipModal;
window.filterFellowshipModalList = filterFellowshipModalList;
window.dismissSidebarSpotlight = dismissSidebarSpotlight;
window.launchQuizFromPrompt = launchQuizFromPrompt;

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
    navigator.serviceWorker.register('sw.js')
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
  const navs = ['dashboard', 'bible', 'cells', 'prayers', 'calendar', 'downloads', 'admin'];
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
      if (e.target.value === 'request_new' || e.target.value === 'new') {
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

      if (!choice || choice === '' || choice === 'none') {
        window.showToast?.("All members must choose an available Cell Group to join during sign up.", "error");
        return;
      }

      const userDocRef = window.db.collection('users').doc(user.uid);

      if (choice === 'request_new' || choice === 'new') {
        const cellName = document.getElementById('ob-new-cell-name').value.trim();
        const cellCity = document.getElementById('ob-new-cell-city').value.trim();
        const cellDesc = document.getElementById('ob-new-cell-desc').value.trim();

        if (!cellName || !cellCity) {
          window.showToast?.("Please input the name & city location of your new Fellowship cell.", "error");
          return;
        }

        const newCellId = window.db.collection('cells').doc().id;
        const isSuperAdminUser = (user.email === 'danielgiobari644@gmail.com');

        // Register new cell with pending_approval status unless created by Super Admin
        window.db.collection('cells').doc(newCellId).set({
          id: newCellId,
          name: cellName,
          city: cellCity,
          description: cellDesc || 'A holy gathering point of fellowship & prayer.',
          leaderUid: user.uid,
          leaderName: name,
          leaderEmail: user.email,
          coLeaders: [],
          status: isSuperAdminUser ? 'active' : 'pending_approval',
          approvedByAdmin: isSuperAdminUser,
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
              role: isSuperAdminUser ? 'Super Admin' : 'Member',
              cellId: newCellId,
              cellStatus: isSuperAdminUser ? 'active' : 'pending_approval',
              onboarded: true,
              createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
          })
          .then(() => {
            if (isSuperAdminUser) {
              window.showToast?.("Fellowship cell established & active!", "success");
            } else {
              window.showToast?.("Cell creation request submitted! Awaiting Super Admin review & approval.", "info");
            }
            closeOnboardingModal();
            window.updateSubscriptionOnServer?.();

            // Notify Super Admin of pending cell approval
            if (window.sendPushNotification && !isSuperAdminUser) {
              window.sendPushNotification(
                "🏰 New Cell Pending Super Admin Approval!",
                `Cell "${cellName}" requested by ${name} in ${cellCity} requires approval.`,
                "/?tab=admin",
                "Super Admin"
              );
            }
          })
          .catch(err => window.handleFirestoreError(err, 'write', 'onboarding'));

      } else {
        // Standard join selected cell
        const isSuperAdminUser = (user.email === 'danielgiobari644@gmail.com');
        userDocRef.set({
          uid: user.uid,
          displayName: name,
          email: user.email,
          bio: bio,
          coordinates: coords,
          role: isSuperAdminUser ? 'Super Admin' : 'Member',
          cellId: choice,
          onboarded: true,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        })
          .then(() => {
            window.showToast?.("Onboarding successfully completed & Cell Group joined!", "success");
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
