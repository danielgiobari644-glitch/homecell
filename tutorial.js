// tutorial.js
// Interactive Premium Onboarding Tutorial Tour with Real-time Canvas Arrows & Push Integration

(function() {
  const steps = [
    {
      id: "welcome",
      title: "✨ Welcome to Home.cell!",
      content: "Welcome to your digital Home Fellowship Connection Portal. This tool helps you grow in faith, check in for daily devotions, share life-changing testimonies, and stay connected with your local cell group assembly. Let's take a 1-minute tour to set you up!",
      targetSelector: null, // Centered
      action: () => window.switchTab?.('feed')
    },
    {
      id: "feed",
      title: "🗣️ Community Testimony Feed",
      content: "This is the heartbeat of our community! Share what God has done in your life, read testimonies, study daily scriptures, and encourage your fellow cell members with likes and comments.",
      targetSelector: "#nav-feed",
      action: () => window.switchTab?.('feed')
    },
    {
      id: "dashboard",
      title: "🏆 Fellowship Dashboard & Streaks",
      content: "Your personalized home base. Complete your daily devotional check-ins, keep your scripture reading streak alive, and see who is the reigning Fellowship Streak Champion of the week!",
      targetSelector: "#nav-dashboard",
      action: () => window.switchTab?.('dashboard')
    },
    {
      id: "push",
      title: "🔔 Real Off-App Push Notifications",
      content: "Get notified instantly about urgent prayer requests, live fellowship streams, daily devotions, and real-time bible trivia even when you are off the app or offline! Tap below to allow real push notifications.",
      targetSelector: "#btn-enable-push",
      action: () => window.switchTab?.('dashboard'),
      isPushStep: true
    },
    {
      id: "bible",
      title: "📖 Interactive Scriptures & Trivia",
      content: "Explore the scriptures, listen to relaxing audio read-alongs, write verse notes, and participate in our live bible trivia arena to test your scriptural knowledge with the assembly!",
      targetSelector: "#nav-bible",
      action: () => window.switchTab?.('bible')
    },
    {
      id: "prayers",
      title: "🔥 Intercession Room & Requests",
      content: "Carry one another's burdens. Submit prayer requests, view the intercessory pipeline, and click 'Amen' or 'Praying' to stand in the gap for other cohort members.",
      targetSelector: "#nav-prayers",
      action: () => window.switchTab?.('prayers')
    },
    {
      id: "finish",
      title: "🧭 You're All Ready!",
      content: "Your tour is complete. You have unlocked all the spiritual tools to stay connected, encourage, and be encouraged. Tap 'Begin Journey' below to dive into the fellowship!",
      targetSelector: null, // Centered
      action: () => window.switchTab?.('dashboard')
    }
  ];

  let currentStepIndex = 0;
  let tutorialOverlay = null;

  // CSS Injector for modern styling, custom arrows, glassmorphism and glows
  function injectTutorialCSS() {
    if (document.getElementById('tutorial-styles')) return;

    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.innerHTML = `
      .tutorial-glow-highlight {
        ring-color: #f59e0b !important;
        box-shadow: 0 0 0 4px #f59e0b, 0 0 25px 8px rgba(245, 158, 11, 0.6) !important;
        transition: all 0.3s ease-in-out !important;
        z-index: 51 !important;
        position: relative !important;
      }
      @keyframes floatAnimation {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      .tutorial-card-float {
        animation: floatAnimation 4s ease-in-out infinite;
      }
      /* Dashed animated line for SVG */
      @keyframes dashDraw {
        to {
          stroke-dashoffset: -40;
        }
      }
      .animate-dash {
        animation: dashDraw 1.5s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // Create UI overlay and append to body
  function createTutorialUI() {
    if (document.getElementById('tutorial-overlay-wrapper')) {
      document.getElementById('tutorial-overlay-wrapper').remove();
    }

    injectTutorialCSS();

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'tutorial-overlay-wrapper';
    wrapper.className = 'fixed inset-0 z-[100] pointer-events-none transition-all duration-500';
    
    // Backdrop dim layer
    const backdrop = document.createElement('div');
    backdrop.id = 'tutorial-backdrop';
    backdrop.className = 'absolute inset-0 bg-slate-950/40 dark:bg-zinc-950/60 backdrop-blur-[1px] pointer-events-auto transition-opacity duration-500 opacity-0';
    wrapper.appendChild(backdrop);

    // SVG container for arrow drawing
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("id", "tutorial-svg-canvas");
    svg.setAttribute("class", "absolute inset-0 w-full h-full pointer-events-none transition-all duration-500 opacity-0");
    
    // Glow Filter and Arrow marker defs
    svg.innerHTML = `
      <defs>
        <filter id="arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="tour-arrowhead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f59e0b" />
        </marker>
      </defs>
      <path id="tutorial-arrow-path" d="" stroke="#f59e0b" stroke-width="3" stroke-dasharray="8,5" fill="none" marker-end="url(#tour-arrowhead)" filter="url(#arrow-glow)" class="animate-dash"></path>
    `;
    wrapper.appendChild(svg);

    // Floating glassmorphism card
    const card = document.createElement('div');
    card.id = 'tutorial-card';
    card.className = 'absolute pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-200/50 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl w-[calc(100vw-32px)] xs:w-full max-w-[320px] sm:max-w-[350px] transition-all duration-500 opacity-0 transform translate-y-4 flex flex-col justify-between space-y-4 tutorial-card-float ring-1 ring-amber-500/10';
    card.style.boxShadow = '0 15px 35px -10px rgba(245, 158, 11, 0.2), 0 0 30px -5px rgba(245, 158, 11, 0.08)';
    
    card.innerHTML = `
      <!-- Top header info -->
      <div>
        <div class="flex items-center justify-between gap-4 mb-2">
          <span id="tutorial-step-indicator" class="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
            Step 1 of 7
          </span>
          <button onclick="window.closeAppTutorial()" class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <h3 id="tutorial-title" class="text-base sm:text-lg font-black font-display tracking-tight text-slate-900 dark:text-zinc-50 leading-snug">
          Welcome to Home.cell
        </h3>
        <p id="tutorial-content" class="text-[11px] sm:text-xs text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed">
          Welcome to your digital Home Fellowship Connection Portal!
        </p>
      </div>

      <!-- Action buttons & permission triggers -->
      <div id="tutorial-action-area" class="hidden flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
        <button id="btn-tutorial-push" onclick="window.triggerTutorialPushPermission()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-orange-500/20 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-bounce"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          Grant Push Permission Now
        </button>
        <span class="text-[9px] text-center text-slate-400 dark:text-zinc-500 block">Requires your web browser notification consent.</span>
      </div>

      <!-- Bottom controls -->
      <div class="flex items-center justify-between gap-4 pt-2.5 border-t border-slate-100 dark:border-zinc-800">
        <button id="btn-tutorial-back" onclick="window.prevTutorialStep()" class="px-3 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer">
          Back
        </button>
        <div class="flex items-center gap-2">
          <button onclick="window.closeAppTutorial()" class="px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer">
            Skip
          </button>
          <button id="btn-tutorial-next" onclick="window.nextTutorialStep()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 cursor-pointer">
            Next
          </button>
        </div>
      </div>
    `;

    wrapper.appendChild(card);
    document.body.appendChild(wrapper);

    tutorialOverlay = wrapper;
  }

  // Draw arrow connecting the tutorial card and the highlighted element
  function drawConnectionArrow(targetEl, cardEl) {
    const svg = document.getElementById('tutorial-svg-canvas');
    const path = document.getElementById('tutorial-arrow-path');
    if (!svg || !path) return;

    if (!targetEl) {
      svg.classList.add('opacity-0');
      path.setAttribute('d', '');
      return;
    }

    svg.classList.remove('opacity-0');

    const targetRect = targetEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();

    let startX, startY, endX, endY;
    let cp1x, cp1y, cp2x, cp2y;

    // Check relative positions to draw a clean curved arrow
    if (window.innerWidth < 768) {
      // Mobile Layout: Card is fixed at the bottom. Draw arrow pointing up to target
      startX = cardRect.left + cardRect.width / 2;
      startY = cardRect.top;
      endX = targetRect.left + targetRect.width / 2;
      endY = targetRect.bottom + 8;

      // Control points for mobile vertical curve
      cp1x = startX;
      cp1y = startY - (startY - endY) / 2;
      cp2x = endX;
      cp2y = endY + (startY - endY) / 2;
    } else {
      // Desktop Layout: Card is beside target
      if (cardRect.left > targetRect.right) {
        // Card is to the right of the target
        startX = cardRect.left;
        startY = cardRect.top + cardRect.height / 2;
        endX = targetRect.right + 12;
        endY = targetRect.top + targetRect.height / 2;

        cp1x = startX - (startX - endX) / 2;
        cp1y = startY;
        cp2x = endX + (startX - endX) / 2;
        cp2y = endY;
      } else {
        // Card is to the left of the target
        startX = cardRect.right;
        startY = cardRect.top + cardRect.height / 2;
        endX = targetRect.left - 12;
        endY = targetRect.top + targetRect.height / 2;

        cp1x = startX + (endX - startX) / 2;
        cp1y = startY;
        cp2x = endX - (endX - startX) / 2;
        cp2y = endY;
      }
    }

    // Set SVG path
    path.setAttribute('d', `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`);
  }

  // Render current step details & position the card dynamically
  function renderStep(stepIndex) {
    const step = steps[stepIndex];
    if (!step) return;

    currentStepIndex = stepIndex;

    // Trigger tab change action if any
    if (typeof step.action === 'function') {
      step.action();
    }

    // Short timeout to let the tab change and content render/stabilize
    setTimeout(() => {
      const card = document.getElementById('tutorial-card');
      const backdrop = document.getElementById('tutorial-backdrop');
      const svg = document.getElementById('tutorial-svg-canvas');
      const stepIndicator = document.getElementById('tutorial-step-indicator');
      const titleEl = document.getElementById('tutorial-title');
      const contentEl = document.getElementById('tutorial-content');
      const backBtn = document.getElementById('btn-tutorial-back');
      const nextBtn = document.getElementById('btn-tutorial-next');
      const actionArea = document.getElementById('tutorial-action-area');

      if (!card || !stepIndicator || !titleEl || !contentEl || !backBtn || !nextBtn) return;

      // Clean up previous highlights
      document.querySelectorAll('.tutorial-glow-highlight').forEach(el => {
        el.classList.remove('tutorial-glow-highlight');
      });

      // Update text
      stepIndicator.innerText = `Step ${stepIndex + 1} of ${steps.length}`;
      titleEl.innerText = step.title;
      contentEl.innerText = step.content;

      // Configure back/next buttons
      if (stepIndex === 0) {
        backBtn.classList.add('invisible');
      } else {
        backBtn.classList.remove('invisible');
      }

      if (stepIndex === steps.length - 1) {
        nextBtn.innerText = "Begin Journey";
        nextBtn.className = "px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow-md";
      } else {
        nextBtn.innerText = "Next";
        nextBtn.className = "px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 cursor-pointer";
      }

      // Configure Push Permission button on push step
      if (step.isPushStep) {
        actionArea.classList.remove('hidden');
        // If already granted, update push button in tutorial
        const state = window.getNotificationPermissionState?.();
        const pushBtn = document.getElementById('btn-tutorial-push');
        if (state === 'granted') {
          if (pushBtn) {
            pushBtn.innerText = "🟢 Push Notifications Granted!";
            pushBtn.disabled = true;
            pushBtn.className = "w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-default";
          }
        }
      } else {
        actionArea.classList.add('hidden');
      }

      // Handle highlighting and positioning
      const targetEl = step.targetSelector ? document.querySelector(step.targetSelector) : null;
      
      // Animate active backdrop
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');

      if (targetEl) {
        // Highlight targeted element
        targetEl.classList.add('tutorial-glow-highlight');

        // Scroll to target into view smoothly if not visible
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Position Card beside or below
        const targetRect = targetEl.getBoundingClientRect();
        
        if (window.innerWidth < 768) {
          // Mobile: Dynamically position card to avoid overlapping bottom navigation elements
          card.style.left = '50%';
          if (targetRect.top > window.innerHeight / 2) {
            // Target is in bottom half, put card near the top (out of the way)
            card.style.top = '72px';
            card.style.bottom = 'auto';
          } else {
            // Target is in top half, put card near the bottom (above bottom nav)
            card.style.bottom = '100px';
            card.style.top = 'auto';
          }
          card.style.transform = 'translateX(-50%) scale(1)';
        } else {
          // Desktop: Position card relative to target
          const spaceOnRight = window.innerWidth - targetRect.right;
          const cardWidth = 350;
          const cardHeight = card.offsetHeight || 200;

          let cardLeft, cardTop;

          if (spaceOnRight > cardWidth + 40) {
            // Place on the right of target
            cardLeft = targetRect.right + 20;
            cardTop = targetRect.top + (targetRect.height - cardHeight) / 2;
          } else {
            // Place on the left of target
            cardLeft = targetRect.left - cardWidth - 20;
            cardTop = targetRect.top + (targetRect.height - cardHeight) / 2;
          }

          // Safety bounds check
          if (cardLeft < 20) cardLeft = 20;
          if (cardLeft + cardWidth > window.innerWidth - 20) cardLeft = window.innerWidth - cardWidth - 20;
          if (cardTop < 80) cardTop = 80; // Keep space for header
          if (cardTop + cardHeight > window.innerHeight - 20) cardTop = window.innerHeight - cardHeight - 20;

          card.style.left = `${cardLeft}px`;
          card.style.top = `${cardTop}px`;
          card.style.bottom = 'auto';
          card.style.transform = 'translate(0, 0) scale(1)';
        }

        // Display arrow
        setTimeout(() => {
          svg.classList.add('opacity-100');
          drawConnectionArrow(targetEl, card);
        }, 100);

      } else {
        // Centered screen layout for steps with no target element
        card.style.left = '50%';
        card.style.top = '50%';
        card.style.bottom = 'auto';
        card.style.transform = 'translate(-50%, -50%) scale(1)';
        
        svg.classList.remove('opacity-100');
        svg.classList.add('opacity-0');
      }

      // Trigger card fade in entry
      card.classList.remove('opacity-0', 'translate-y-4');
      card.classList.add('opacity-100', 'translate-y-0');

      // Refresh icons inside card
      if (window.lucide) window.lucide.createIcons();

    }, 350);
  }

  // Next Step trigger
  window.nextTutorialStep = function() {
    if (currentStepIndex < steps.length - 1) {
      renderStep(currentStepIndex + 1);
    } else {
      window.closeAppTutorial();
    }
  };

  // Back step trigger
  window.prevTutorialStep = function() {
    if (currentStepIndex > 0) {
      renderStep(currentStepIndex - 1);
    }
  };

  // Trigger push permissions directly from the tutorial tour step
  window.triggerTutorialPushPermission = async function() {
    const pushBtn = document.getElementById('btn-tutorial-push');
    if (!pushBtn) return;

    pushBtn.disabled = true;
    pushBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Activating push services...
    `;

    try {
      const state = await window.requestNotificationPermission();
      if (state === 'granted') {
        pushBtn.innerText = "🟢 Push Notifications Granted!";
        pushBtn.className = "w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-100 text-emerald-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-default";
        window.showToast?.("Push Notifications enabled from onboarding tour!", "success");
      } else {
        pushBtn.innerText = "❌ Consent Dismissed";
        pushBtn.disabled = false;
        pushBtn.className = "w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-100 text-rose-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer";
      }
    } catch (e) {
      console.error(e);
      pushBtn.innerText = "Error requesting permissions";
      pushBtn.disabled = false;
    }
  };

  // Start tutorial function
  window.startAppTutorial = function(force = false) {
    if (!force) {
      const isCompleted = localStorage.getItem('homecell_tutorial_completed');
      if (isCompleted === 'true') {
        return; // Already completed before
      }
    }

    createTutorialUI();
    renderStep(0);
  };

  // Close / Skip tutorial
  window.closeAppTutorial = function() {
    localStorage.setItem('homecell_tutorial_completed', 'true');
    
    // Clean up glows
    document.querySelectorAll('.tutorial-glow-highlight').forEach(el => {
      el.classList.remove('tutorial-glow-highlight');
    });

    if (tutorialOverlay) {
      const card = document.getElementById('tutorial-card');
      const backdrop = document.getElementById('tutorial-backdrop');
      const svg = document.getElementById('tutorial-svg-canvas');

      if (card) {
        card.style.transform = 'translateY(12px) scale(0.95)';
        card.style.opacity = '0';
      }
      if (backdrop) backdrop.style.opacity = '0';
      if (svg) svg.style.opacity = '0';

      setTimeout(() => {
        tutorialOverlay.remove();
        tutorialOverlay = null;
      }, 500);
    }
  };

  // Re-calculate arrows on window resize
  window.addEventListener('resize', () => {
    if (!tutorialOverlay) return;
    const step = steps[currentStepIndex];
    if (step && step.targetSelector) {
      const targetEl = document.querySelector(step.targetSelector);
      const card = document.getElementById('tutorial-card');
      if (targetEl && card) {
        // Simple re-layout and re-draw
        renderStep(currentStepIndex);
      }
    }
  });

  // Automated trigger after user login and auth state settles
  window.auth?.onAuthStateChanged(user => {
    if (user) {
      // Small timeout to allow everything to finish mounting
      setTimeout(() => {
        window.startAppTutorial(false);
      }, 3000);
    }
  });

})();
