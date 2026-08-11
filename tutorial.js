// tutorial.js
// Home.cell Interactive Onboarding, Multi-Step Tutorial, Feature Guide & Contextual Tips Engine

(function() {
  // Total steps in the interactive onboarding tour
  const TOTAL_TUTORIAL_STEPS = 18;
  let currentTutorialStep = 1;

  // Complete data dictionary of all 18 interactive tutorial steps
  const TUTORIAL_STEPS = [
    {
      id: 1,
      icon: "🏰",
      iconGradient: "from-blue-600 to-indigo-600",
      title: "Welcome to Home.cell 👋",
      subtitle: "A place to grow in God's Word, connect with others, participate in your cell, and become a champion.",
      body: "Welcome to your digital sanctuary! Home.cell brings together daily devotionals, Bible reading, competitive scripture trivia, house cell fellowships, and digital Christian store resources into one unified journey.",
      highlights: [
        { icon: "📖", text: "Read God's Word & track your reading milestones" },
        { icon: "🧠", text: "Take Bible quizzes, win championships & earn Kingdom Coins" },
        { icon: "👥", text: "Connect with local house fellowship cell groups" },
        { icon: "🏪", text: "Unlock digital wallpapers, quotes & guides in Kingdom Store" }
      ],
      badge: "STEP 1 OF 18 • WELCOME"
    },
    {
      id: 2,
      icon: "🏠",
      iconGradient: "from-indigo-600 to-purple-600",
      title: "Your Home Dashboard",
      subtitle: "Your central hub bringing your entire Home.cell experience together.",
      body: "The Faith Dashboard displays today's inspired devotional verse, upcoming cell gatherings, daily missions, and live fellowship announcements in real time.",
      highlights: [
        { icon: "🌅", text: "Today's Devotional & Daily Verse of the Day" },
        { icon: "📅", text: "Parish & Cell Group Event Schedules" },
        { icon: "🎯", text: "Daily Missions & Kingdom Challenges" },
        { icon: "🔔", text: "Real-time Testimony & Intercession Highlights" }
      ],
      badge: "STEP 2 OF 18 • DASHBOARD"
    },
    {
      id: 3,
      icon: "📖",
      iconGradient: "from-emerald-600 to-teal-600",
      title: "God's Word (Scripture Reader)",
      subtitle: "Read Scripture directly inside Home.cell and track your reading journey.",
      body: "Read Scripture offline or online with chapter navigation, bookmarking, and progress tracking. Meaningful Bible reading directly earns Kingdom Coins!",
      highlights: [
        { icon: "📖", text: "Complete Old & New Testament Books" },
        { icon: "🪙", text: "Earn +5 Kingdom Coins for reading chapters" },
        { icon: "📊", text: "Track total chapters read & reading consistency" },
        { icon: "🏆", text: "Unlock 'Scripture Seeker' Hall of Fame achievements" }
      ],
      badge: "STEP 3 OF 18 • BIBLE"
    },
    {
      id: 4,
      icon: "🙏",
      iconGradient: "from-amber-500 to-orange-600",
      title: "Daily Devotionals & Guides",
      subtitle: "Discover devotionals designed to help you spend meaningful time in God's Word.",
      body: "Access daily inspired devotionals, complete devotional series, and unlock prayer guides and PDF study packs in your personal library.",
      highlights: [
        { icon: "🌅", text: "Fresh daily spiritual devotionals" },
        { icon: "🪙", text: "Earn KC rewards upon completing daily devotionals" },
        { icon: "📚", text: "Access devotional study packs & guides" },
        { icon: "📂", text: "Saved permanently in your personal My Library" }
      ],
      badge: "STEP 4 OF 18 • DEVOTIONALS"
    },
    {
      id: 5,
      icon: "👥",
      iconGradient: "from-teal-600 to-cyan-600",
      title: "Your House Cell Group",
      subtitle: "Connect with your church family, participate in discussions, and grow together.",
      body: "Home.cell connects you to local or online house cell groups. Chat in real time, view member presence, and participate in cell announcements.",
      highlights: [
        { icon: "🏡", text: "Join existing cells or request to register a new cell group" },
        { icon: "💬", text: "Cell Chat Lounge for daily spiritual fellowship" },
        { icon: "🟢", text: "Live online member presence indicators" },
        { icon: "👥", text: "Member avatar roster & leader support" }
      ],
      badge: "STEP 5 OF 18 • CELL GROUPS"
    },
    {
      id: 6,
      icon: "🌍",
      iconGradient: "from-rose-500 to-pink-600",
      title: "Global Praise Community",
      subtitle: "Share, encourage, interact, and discover what other members are doing.",
      body: "Broadcast praise reports, ask for prayer intercession, react to encourage brethren, and celebrate God's goodness with a global family.",
      highlights: [
        { icon: "🙏", text: "Post testimonies & prayer petitions" },
        { icon: "💬", text: "Uplifting comments & encouragement reactions" },
        { icon: "🤝", text: "Build meaningful Christian relationships" },
        { icon: "🛡️", text: "Spam-free, supportive environment" }
      ],
      badge: "STEP 6 OF 18 • COMMUNITY"
    },
    {
      id: 7,
      icon: "🧠",
      iconGradient: "from-purple-600 to-indigo-600",
      title: "Test Your Bible Knowledge",
      subtitle: "Take Bible quizzes, challenge yourself, compete with others, and earn Kingdom Coins.",
      body: "Test your scripture comprehension across Genesis, Gospels, Epistles, and Bible Trivia. Winning quizzes awards major Kingdom Coins!",
      highlights: [
        { icon: "🏆", text: "QUIZ VICTORY: Win #1 to earn +100 Kingdom Coins!" },
        { icon: "🪙", text: "Configurable rewards for Participation, Top 10 & Top 3" },
        { icon: "🏅", text: "Climb the dedicated Quiz Champions Leaderboard" },
        { icon: "🔥", text: "Earn accuracy bonuses & streak multipliers" }
      ],
      badge: "STEP 7 OF 18 • QUIZZES"
    },
    {
      id: 8,
      icon: "🪙",
      iconGradient: "from-amber-400 to-amber-600",
      title: "Kingdom Coins Economy",
      subtitle: "Your activity in Home.cell helps you earn Kingdom Coins.",
      body: "A unified economy celebrating your growth! Follow the simple loop: Earn KC through meaningful activities -> Save KC -> Spend in Kingdom Store -> Unlock Digital Resources!",
      highlights: [
        { icon: "📖", text: "Earn KC from Bible reading, devotionals & quizzes" },
        { icon: "🔥", text: "Earn bonus KC from streaks, daily missions & referrals" },
        { icon: "🏪", text: "Spend KC in the Kingdom Store to buy wallpapers & guides" },
        { icon: "🧾", text: "Transparent audit log of all earned & spent KC" }
      ],
      badge: "STEP 8 OF 18 • KINGDOM COINS"
    },
    {
      id: 9,
      icon: "🏆",
      iconGradient: "from-yellow-500 to-amber-600",
      title: "Home.cell Hall of Fame",
      subtitle: "Celebrating people who are growing, serving, learning, and making an impact.",
      body: "A prestigious Hall of Fame with a Gold, Silver & Bronze Top 3 podium, multi-category leaderboards, time period filters, and personal position tracking!",
      highlights: [
        { icon: "🥇", text: "Top 3 Visual Podium with user avatars & stats" },
        { icon: "📊", text: "6 Categories: Kingdom Coins, Streaks, Bible, Quizzes, Store & Devotionals" },
        { icon: "📅", text: "Filters: Today, This Week, This Month, All Time" },
        { icon: "🎯", text: "Personal Position Banner: See your exact rank & KC to next spot!" }
      ],
      badge: "STEP 9 OF 18 • HALL OF FAME"
    },
    {
      id: 10,
      icon: "👤",
      iconGradient: "from-blue-500 to-indigo-600",
      title: "Your Profile & Progression",
      subtitle: "Your profile is your Home.cell identity.",
      body: "Customize your avatar picture, edit your spiritual bio, track your journey statistics, and display unlocked achievement badges.",
      highlights: [
        { icon: "🖼️", text: "Upload custom profile pictures with live instant previews" },
        { icon: "📈", text: "Full Journey Stats: KC, streaks, chapters read, quiz wins & store items" },
        { icon: "🏅", text: "Badges: Scripture Seeker, Quiz Champion, Faithful & Kingdom Builder" },
        { icon: "📍", text: "Set location coordinates for cell discovery" }
      ],
      badge: "STEP 10 OF 18 • PROFILE"
    },
    {
      id: 11,
      icon: "🏪",
      iconGradient: "from-emerald-500 to-teal-700",
      title: "Kingdom Store Marketplace",
      subtitle: "Discover digital Christian resources published by Home.cell administrators.",
      body: "Browse digital wallpapers, scripture quote graphics, faith promise collections, and study guides. Spend Kingdom Coins to unlock instant ownership!",
      highlights: [
        { icon: "🖼️", text: "High-resolution phone & desktop Christian wallpapers" },
        { icon: "💬", text: "Typography quote graphics & scripture art" },
        { icon: "📖", text: "Scripture collections & devotional PDFs" },
        { icon: "🔐", text: "Atomic transaction security — buy with 1 click using KC" }
      ],
      badge: "STEP 11 OF 18 • KINGDOM STORE"
    },
    {
      id: 12,
      icon: "📚",
      iconGradient: "from-cyan-600 to-blue-700",
      title: "My Library & Downloads",
      subtitle: "Everything you unlock in the Kingdom Store lives here permanently.",
      body: "Access your personal digital repository anytime. Every unlocked wallpaper, quote graphic, study guide, or custom creation features a 1-click Download button!",
      highlights: [
        { icon: "🔒", text: "Permanent digital ownership of purchased items" },
        { icon: "📥", text: "Working 1-click Download buttons for full-res files" },
        { icon: "📂", text: "Organized by Wallpapers, Quotes, Scripture Packs & Custom Items" },
        { icon: "📱", text: "Save images directly to your phone or desktop" }
      ],
      badge: "STEP 12 OF 18 • MY LIBRARY"
    },
    {
      id: 13,
      icon: "✨",
      iconGradient: "from-purple-500 to-pink-600",
      title: "Custom Creation Requests",
      subtitle: "Request personalized Christian designs crafted specifically for you!",
      body: "Spend Kingdom Coins to request custom wallpapers, event flyers, personalized verse quotes, or photo edits created by Super Admin.",
      highlights: [
        { icon: "🎨", text: "Request custom wallpapers, posters, quotes or image edits" },
        { icon: "🖼️", text: "Upload your photo for Christian retouching or graphic add-ons" },
        { icon: "📋", text: "Live Status Tracker: Submitted 🟡 -> In Progress 🔵 -> Ready 🟢" },
        { icon: "📥", text: "Download finished custom creations straight from My Library" }
      ],
      badge: "STEP 13 OF 18 • CUSTOM REQUESTS"
    },
    {
      id: 14,
      icon: "💬",
      iconGradient: "from-blue-600 to-indigo-700",
      title: "Direct Admin Support Chat",
      subtitle: "Need help? Chat directly with a Home.cell Super Admin anytime.",
      body: "Enjoy 1-on-1 private messaging with Super Admin for support with account settings, store purchases, custom requests, downloads, or spiritual guidance.",
      highlights: [
        { icon: "💬", text: "1-on-1 real-time messaging with Super Admin" },
        { icon: "🟢", text: "Real presence indicator: 🟢 Admin Available / ⚪ Offline" },
        { icon: "🔔", text: "Instant notifications when support responds" },
        { icon: "🆘", text: "Quick help for custom requests, coins, or app issues" }
      ],
      badge: "STEP 14 OF 18 • ADMIN HELP"
    },
    {
      id: 15,
      icon: "💡",
      iconGradient: "from-amber-500 to-yellow-600",
      title: "Feedback Hub & Ideas",
      subtitle: "You help shape the future of Home.cell!",
      body: "Submit feature suggestions, store resource requests, or bug reports. Upvote community ideas to elevate top feedback for Super Admin review.",
      highlights: [
        { icon: "💡", text: "Post ideas for new features or store products" },
        { icon: "👍", text: "Upvote top suggestions from other members" },
        { icon: "📊", text: "Track status: Under Review, Planned, Completed" },
        { icon: "🎉", text: "Earn +10 Kingdom Coins when Super Admin rewards your idea!" }
      ],
      badge: "STEP 15 OF 18 • FEEDBACK HUB"
    },
    {
      id: 16,
      icon: "📅",
      iconGradient: "from-emerald-500 to-teal-600",
      title: "Daily Streaks & Consistency",
      subtitle: "Build a daily streak by consistently engaging with God's Word.",
      body: "Maintain daily consistency by reading scripture, completing devotionals, or logging in. Progress rings, milestone cards, and glowing metrics keep you motivated!",
      highlights: [
        { icon: "📅", text: "Track current streak & longest historical streak" },
        { icon: "🎯", text: "Glowing metric cards & milestone celebrations" },
        { icon: "🏅", text: "Unlock 7-day, 30-day & 100-day streak badges" },
        { icon: "🪙", text: "Bonus Kingdom Coins for milestone streak days" }
      ],
      badge: "STEP 16 OF 18 • STREAKS"
    },
    {
      id: 17,
      icon: "🔔",
      iconGradient: "from-indigo-600 to-purple-600",
      title: "Personalization & Notifications",
      subtitle: "Tailor your Home.cell experience and stay connected.",
      body: "Select your preferred theme, manage push notification alerts for cell announcements or admin support replies, and customize privacy settings.",
      highlights: [
        { icon: "🎨", text: "Choose from Classic Light, Midnight Dark, Kingdom Purple & Royal Gold" },
        { icon: "🔔", text: "Enable offline push alert sync for cell events & messages" },
        { icon: "🔐", text: "Manage privacy preferences & account security" },
        { icon: "🔄", text: "Replay this tutorial or open Feature Guide anytime in Settings" }
      ],
      badge: "STEP 17 OF 18 • PREFERENCES"
    },
    {
      id: 18,
      icon: "🎉",
      iconGradient: "from-amber-400 via-yellow-500 to-emerald-500",
      title: "You're Ready! 🎉",
      subtitle: "Home.cell is more than an app. Read. Grow. Connect. Compete. Serve.",
      body: "You're fully equipped to explore Home.cell! Earn Kingdom Coins, build your streak, test your Bible knowledge, explore the Kingdom Store, connect with your cell family, and become a champion!",
      highlights: [
        { icon: "📖", text: "Read God's Word & complete daily devotionals" },
        { icon: "🧠", text: "Compete in Bible quizzes & win +100 KC" },
        { icon: "🏆", text: "Climb the Hall of Fame Leaderboard" },
        { icon: "🏪", text: "Unlock digital resources in the Kingdom Store" }
      ],
      badge: "STEP 18 OF 18 • CHAMPION READY"
    }
  ];

  // Feature Guide dictionary for quick lookup by category
  const FEATURE_GUIDE_TOPICS = [
    { key: 'home', icon: '🏠', name: 'Home Dashboard', tab: 'dashboard', desc: 'Daily verse, devotional, missions & announcements' },
    { key: 'bible', icon: '📖', name: 'Scripture Reader', tab: 'bible', desc: 'Offline Bible, chapter tracking & KC rewards' },
    { key: 'devotionals', icon: '🙏', name: 'Devotionals', tab: 'bible', desc: 'Daily devotional readings & devotional packs' },
    { key: 'cells', icon: '👥', name: 'House Cell Groups', tab: 'cells', desc: 'Cell chat, online status, directory & intercession' },
    { key: 'community', icon: '🌍', name: 'Praise Feed', tab: 'feed', desc: 'Testimony reports, prayer petitions & reactions' },
    { key: 'quizzes', icon: '🧠', name: 'Bible Quizzes', tab: 'bible', desc: 'Competitive trivia rooms, victories & +100 KC' },
    { key: 'kc', icon: '🪙', name: 'Kingdom Coins', tab: 'champions', desc: 'Unified earn, save & spend economy' },
    { key: 'hof', icon: '🏆', name: 'Hall of Fame', tab: 'champions', desc: 'Top 3 podium, multi-categories & personal position' },
    { key: 'profile', icon: '👤', name: 'Profile & Avatar', tab: 'settings', desc: 'Custom photo upload, journey stats & badges' },
    { key: 'store', icon: '🏪', name: 'Kingdom Store', tab: 'champions', desc: 'Wallpapers, quote art, PDFs & scripture packs' },
    { key: 'library', icon: '📚', name: 'My Library', tab: 'champions', desc: 'Unlocked digital resources & 1-click downloads' },
    { key: 'custom', icon: '✨', name: 'Custom Requests', tab: 'champions', desc: 'Personal wallpapers, flyers & photo edits' },
    { key: 'admin_chat', icon: '💬', name: 'Admin Help Chat', tab: 'chat', desc: '1-on-1 support chat with Super Admin & live status' },
    { key: 'feedback', icon: '💡', name: 'Feedback Hub', tab: 'champions', desc: 'Submit feature ideas, upvote & earn +10 KC' },
    { key: 'streaks', icon: '🔥', name: 'Daily Streaks', tab: 'streak', desc: 'Consistency tracking, progress rings & badges' },
    { key: 'settings', icon: '⚙️', name: 'Settings & Themes', tab: 'settings', desc: 'Appearance suite, push alerts & replay tour' }
  ];

  // Initialize and mount onboarding engine
  function initTutorialSystem() {
    console.log("Initializing Home.cell Interactive Tutorial System...");
    renderContextualTips();
  }

  // Render specific step in the 18-step onboarding modal
  function renderTutorialStep(stepNum) {
    currentTutorialStep = Math.max(1, Math.min(TOTAL_TUTORIAL_STEPS, stepNum));
    const step = TUTORIAL_STEPS[currentTutorialStep - 1];
    if (!step) return;

    // Update Step Badge
    const badgeEl = document.getElementById('ob-step-badge');
    if (badgeEl) badgeEl.innerText = step.badge;

    // Update Progress Bar
    const barEl = document.getElementById('ob-progress-bar');
    if (barEl) barEl.style.width = `${(currentTutorialStep / TOTAL_TUTORIAL_STEPS) * 100}%`;

    // Render Slide Content in the viewport
    const viewport = document.getElementById('ob-slides-viewport');
    if (viewport) {
      const isLastStep = currentTutorialStep === TOTAL_TUTORIAL_STEPS;
      const isFirstStep = currentTutorialStep === 1;

      viewport.innerHTML = `
        <div class="space-y-6 animate-fadeIn my-auto text-center max-w-xl mx-auto py-2">
          
          <!-- Icon Badge -->
          <div class="w-20 h-20 rounded-3xl bg-gradient-to-tr ${step.iconGradient} text-white flex items-center justify-center text-4xl mx-auto shadow-xl shadow-indigo-500/20 transform transition-transform duration-300 hover:scale-105">
            ${step.icon}
          </div>

          <!-- Titles -->
          <div class="space-y-2">
            <h2 class="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-zinc-50 tracking-tight">
              ${step.title}
            </h2>
            <p class="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              ${step.subtitle}
            </p>
            <p class="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-lg mx-auto">
              ${step.body}
            </p>
          </div>

          <!-- Highlights List Card -->
          <div class="p-4 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-2xl text-left space-y-2.5 shadow-xs">
            <div class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>✨ Feature Highlights</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${step.highlights.map(h => `
                <div class="p-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl flex items-start gap-2.5 shadow-xs">
                  <span class="text-base shrink-0">${h.icon}</span>
                  <span class="text-xs font-bold text-slate-700 dark:text-zinc-200 leading-snug">${h.text}</span>
                </div>
              `).join('')}
            </div>
          </div>

          ${isLastStep ? `
            <div class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-center space-y-2">
              <div class="text-sm font-black text-emerald-700 dark:text-emerald-300">
                🎉 Congratulations! You are ready to start your journey.
              </div>
              <p class="text-xs text-slate-600 dark:text-zinc-300">
                Tap the button below to jump directly into your Faith Dashboard!
              </p>
            </div>
          ` : ''}

        </div>
      `;
    }

    // Update Controls (Prev, Next, Dots)
    const btnPrev = document.getElementById('btn-ob-prev');
    const btnNext = document.getElementById('btn-ob-next');

    if (btnPrev) {
      if (currentTutorialStep === 1) {
        btnPrev.classList.add('invisible');
      } else {
        btnPrev.classList.remove('invisible');
      }
    }

    if (btnNext) {
      if (currentTutorialStep === TOTAL_TUTORIAL_STEPS) {
        btnNext.innerHTML = `ENTER HOME.CELL →`;
        btnNext.className = `px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1.5`;
        btnNext.onclick = finishTutorial;
      } else {
        btnNext.innerHTML = `Next Step <i data-lucide="chevron-right" class="w-4 h-4"></i>`;
        btnNext.className = `px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5`;
        btnNext.onclick = nextTutorialStep;
      }
    }

    // Render Step Dots Indicator
    const dotsBox = document.getElementById('ob-dots-container');
    if (dotsBox) {
      dotsBox.innerHTML = '';
      for (let i = 1; i <= TOTAL_TUTORIAL_STEPS; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `h-2 rounded-full transition-all cursor-pointer ${
          i === currentTutorialStep 
            ? 'w-6 bg-blue-600 dark:bg-blue-400' 
            : 'w-2 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400'
        }`;
        dot.title = `Step ${i}: ${TUTORIAL_STEPS[i - 1].title}`;
        dot.onclick = () => {
          window.soundEngine?.playClick();
          renderTutorialStep(i);
        };
        dotsBox.appendChild(dot);
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function nextTutorialStep() {
    window.soundEngine?.playClick();
    if (currentTutorialStep < TOTAL_TUTORIAL_STEPS) {
      renderTutorialStep(currentTutorialStep + 1);
    } else {
      finishTutorial();
    }
  }

  function prevTutorialStep() {
    window.soundEngine?.playClick();
    if (currentTutorialStep > 1) {
      renderTutorialStep(currentTutorialStep - 1);
    }
  }

  function skipTutorial() {
    window.soundEngine?.playClick();
    finishTutorial();
  }

  function finishTutorial() {
    const obModal = document.getElementById('onboarding-modal');
    if (obModal) obModal.classList.add('hidden');

    localStorage.setItem('homecell_tutorial_completed', 'true');

    if (window.currentUserUid && window.db) {
      window.db.collection('users').doc(window.currentUserUid).set({
        hasCompletedTutorial: true,
        tutorialCompleted: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(err => console.warn("Tutorial status sync:", err));
    }

    window.showToast?.("🎉 Welcome to Home.cell! Enjoy your fellowship journey.", "success");

    if (window.switchTab) window.switchTab('dashboard');
  }

  function startAppTutorial() {
    const obModal = document.getElementById('onboarding-modal');
    if (obModal) obModal.classList.remove('hidden');
    renderTutorialStep(1);
  }

  // Feature Guide Modal Engine
  function openFeatureGuideModal() {
    let guideModal = document.getElementById('feature-guide-modal');
    if (!guideModal) {
      createFeatureGuideModalDOM();
      guideModal = document.getElementById('feature-guide-modal');
    }

    renderFeatureGuideCards();
    guideModal.classList.remove('hidden');
  }

  function closeFeatureGuideModal() {
    const guideModal = document.getElementById('feature-guide-modal');
    if (guideModal) guideModal.classList.add('hidden');
  }

  function createFeatureGuideModalDOM() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'feature-guide-modal';
    modalDiv.className = 'hidden fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
    modalDiv.innerHTML = `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] animate-fadeIn">
        
        <!-- Modal Header -->
        <div class="p-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 rounded-2xl">
              <i data-lucide="compass" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-black font-display text-slate-900 dark:text-zinc-100">Home.cell Feature & Interactive Help Guide</h3>
              <p class="text-xs text-slate-500 dark:text-zinc-400">Explore specific app modules, learn how to earn Kingdom Coins, or replay the interactive tour.</p>
            </div>
          </div>
          <button onclick="closeFeatureGuideModal()" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Filter & Action Bar -->
        <div class="p-4 bg-slate-100/60 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div class="relative flex-1 min-w-[220px]">
            <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3 text-slate-400"></i>
            <input type="text" id="guide-search-input" onkeyup="filterGuideTopics(this.value)" placeholder="Search feature guide topics (e.g. Quizzes, Coins, Store...)" class="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <button onclick="closeFeatureGuideModal(); startAppTutorial();" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5">
            <i data-lucide="play" class="w-4 h-4"></i> Replay Full Interactive Tour
          </button>
        </div>

        <!-- Guide Topics Grid Container -->
        <div class="p-6 overflow-y-auto flex-1">
          <div id="guide-topics-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <!-- Loaded dynamically -->
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-center shrink-0">
          <p class="text-xs text-slate-500 dark:text-zinc-400">
            Have a question not covered here? <button onclick="closeFeatureGuideModal(); window.openSupportChat ? window.openSupportChat() : switchTab('chat');" class="text-blue-600 dark:text-blue-400 font-bold hover:underline">Chat 1-on-1 with Home.cell Support</button>
          </p>
        </div>

      </div>
    `;

    document.body.appendChild(modalDiv);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderFeatureGuideCards(query = '') {
    const grid = document.getElementById('guide-topics-grid');
    if (!grid) return;

    const q = query.toLowerCase().trim();
    const filtered = FEATURE_GUIDE_TOPICS.filter(t => 
      !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
    );

    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-400">
          <p class="text-sm font-bold">No guide topics match "${query}"</p>
        </div>
      `;
      return;
    }

    filtered.forEach(topic => {
      // Find matching tutorial step index
      const matchingStep = TUTORIAL_STEPS.find(s => s.title.toLowerCase().includes(topic.name.toLowerCase()) || s.badge.toLowerCase().includes(topic.key));
      const stepNum = matchingStep ? matchingStep.id : 1;

      const card = document.createElement('div');
      card.className = "p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-blue-500/50 transition-all shadow-xs";
      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">${topic.icon}</span>
            <h4 class="text-sm font-bold text-slate-900 dark:text-zinc-100">${topic.name}</h4>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">${topic.desc}</p>
        </div>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800">
          <button onclick="closeFeatureGuideModal(); window.switchTab('${topic.tab}');" class="flex-1 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-[11px] rounded-lg transition-all cursor-pointer text-center">
            Open Tab
          </button>
          <button onclick="closeFeatureGuideModal(); startAppTutorial(); renderTutorialStep(${stepNum});" class="py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer text-center" title="Read step in tutorial">
            Guide
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function filterGuideTopics(q) {
    renderFeatureGuideCards(q);
  }

  // Contextual Dismissible Mini-Tutorial Tips Engine
  function renderContextualTips() {
    // 1. Kingdom Store Tip
    const storeBox = document.getElementById('store-contextual-tip');
    if (storeBox && !localStorage.getItem('tip_dismissed_store')) {
      storeBox.innerHTML = `
        <div class="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-xs mb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl shrink-0">💡</span>
            <p class="text-xs font-semibold leading-relaxed">
              <strong class="font-black">Kingdom Store Tip:</strong> Use Kingdom Coins earned from Bible reading & quizzes to unlock digital wallpapers, quote art, and devotional guides!
            </p>
          </div>
          <button onclick="dismissContextualTip('store')" class="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-lg text-xs font-bold shrink-0 cursor-pointer">
            Dismiss ✕
          </button>
        </div>
      `;
    }

    // 2. Hall of Fame Tip
    const hofBox = document.getElementById('hof-contextual-tip');
    if (hofBox && !localStorage.getItem('tip_dismissed_hof')) {
      hofBox.innerHTML = `
        <div class="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-2xl flex items-center justify-between gap-3 text-purple-900 dark:text-purple-200 shadow-xs mb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl shrink-0">🏆</span>
            <p class="text-xs font-semibold leading-relaxed">
              <strong class="font-black">Welcome to the Hall of Fame:</strong> Switch categories to see rankings for KC, Streaks, Scripture Reading, Quiz Wins, and Store Collections!
            </p>
          </div>
          <button onclick="dismissContextualTip('hof')" class="p-1 hover:bg-purple-200/50 dark:hover:bg-purple-900/50 rounded-lg text-xs font-bold shrink-0 cursor-pointer">
            Dismiss ✕
          </button>
        </div>
      `;
    }

    // 3. Custom Requests Tip
    const customBox = document.getElementById('custom-requests-contextual-tip');
    if (customBox && !localStorage.getItem('tip_dismissed_custom')) {
      customBox.innerHTML = `
        <div class="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-center justify-between gap-3 text-indigo-900 dark:text-indigo-200 shadow-xs mb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl shrink-0">✨</span>
            <p class="text-xs font-semibold leading-relaxed">
              <strong class="font-black">Create Something Personal:</strong> You can request a custom wallpaper, flyer, or Christian photo edit crafted by Super Admin!
            </p>
          </div>
          <button onclick="dismissContextualTip('custom')" class="p-1 hover:bg-indigo-200/50 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold shrink-0 cursor-pointer">
            Dismiss ✕
          </button>
        </div>
      `;
    }

    // 4. Support Chat Tip
    const chatBox = document.getElementById('chat-contextual-tip');
    if (chatBox && !localStorage.getItem('tip_dismissed_chat')) {
      chatBox.innerHTML = `
        <div class="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-center justify-between gap-3 text-blue-900 dark:text-blue-200 shadow-xs mb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl shrink-0">💬</span>
            <p class="text-xs font-semibold leading-relaxed">
              <strong class="font-black">Need assistance?</strong> Chat 1-on-1 with Home.cell support for help with account settings, store purchases, or custom requests.
            </p>
          </div>
          <button onclick="dismissContextualTip('chat')" class="p-1 hover:bg-blue-200/50 dark:hover:bg-blue-900/50 rounded-lg text-xs font-bold shrink-0 cursor-pointer">
            Dismiss ✕
          </button>
        </div>
      `;
    }
  }

  function dismissContextualTip(tipKey) {
    localStorage.setItem(`tip_dismissed_${tipKey}`, 'true');
    const ids = {
      store: 'store-contextual-tip',
      hof: 'hof-contextual-tip',
      custom: 'custom-requests-contextual-tip',
      chat: 'chat-contextual-tip'
    };
    const el = document.getElementById(ids[tipKey]);
    if (el) el.innerHTML = '';
  }

  // Expose methods to global scope
  window.initTutorialSystem = initTutorialSystem;
  window.renderTutorialStep = renderTutorialStep;
  window.nextTutorialStep = nextTutorialStep;
  window.prevTutorialStep = prevTutorialStep;
  window.skipTutorial = skipTutorial;
  window.finishTutorial = finishTutorial;
  window.startAppTutorial = startAppTutorial;
  window.openFeatureGuideModal = openFeatureGuideModal;
  window.closeFeatureGuideModal = closeFeatureGuideModal;
  window.filterGuideTopics = filterGuideTopics;
  window.dismissContextualTip = dismissContextualTip;
  window.renderContextualTips = renderContextualTips;

  // Auto initialize on DOM Content Loaded
  document.addEventListener('DOMContentLoaded', initTutorialSystem);

})();
