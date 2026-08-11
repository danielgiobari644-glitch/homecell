// loading-screen.js
// Production Cinematic Loading Screen System for Home.cell
// Supports Super Admin Video Overrides, Fallback Built-in Animation, Progress Tracking & Smooth Transitions

(function() {
  let isDismissed = false;
  let canvasAnimId = null;
  let minTimeElapsed = false;
  let videoLoadedSuccessfully = false;
  let activeConfig = {
    enabled: true,
    videoUrl: "",
    title: "Home.cell",
    tagline: "Connecting fellowship cell network...",
    minDisplayDuration: 2200,
    maxDisplayDuration: 5500,
    loop: true
  };

  // 1. Core Built-In Earth Horizon & Connected Cell Network Canvas Animation
  function initFallbackCanvasAnimation() {
    const canvas = document.getElementById('loading-cell-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create Cell Nodes
    const numNodes = Math.min(Math.floor(window.innerWidth / 35), 45);
    const nodes = [];
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.8) + canvas.height * 0.1,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.05 + 0.02
      });
    }

    function renderFrame() {
      if (isDismissed) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Earth Horizon Glow Arc at the bottom
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height + 250,
        100,
        canvas.width / 2,
        canvas.height + 250,
        canvas.width * 0.75
      );
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.45)');
      gradient.addColorStop(0.35, 'rgba(79, 70, 229, 0.25)');
      gradient.addColorStop(0.7, 'rgba(147, 51, 234, 0.1)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Horizon Atmosphere Curve
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height + 280, canvas.width * 0.65, Math.PI, 0, false);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Update and draw cell nodes & connections
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;
        n1.pulse += n1.pulseSpeed;

        if (n1.x < 0 || n1.x > canvas.width) n1.vx *= -1;
        if (n1.y < canvas.height * 0.05 || n1.y > canvas.height * 0.85) n1.vy *= -1;

        // Draw connections between nearby cell nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.35;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.stroke();
          }
        }

        // Draw glowing cell node
        const nodeAlpha = 0.5 + Math.sin(n1.pulse) * 0.4;
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius + Math.sin(n1.pulse) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      canvasAnimId = requestAnimationFrame(renderFrame);
    }

    renderFrame();
  }

  // 2. Fetch Active Loading Screen Configuration from Firestore
  async function loadFirebaseConfig() {
    try {
      if (!window.db) return;
      const snap = await window.db.collection('appSettings').doc('loadingScreen').get();
      if (snap.exists) {
        const data = snap.data();
        activeConfig = { ...activeConfig, ...data };
        applyLoadingConfig(activeConfig);
      }
    } catch (e) {
      console.warn("Loading screen config fetch skipped/cached:", e?.message || e);
    }
  }

  // 3. Apply Video or Fallback Settings
  function applyLoadingConfig(cfg) {
    const videoEl = document.getElementById('loading-video-element');
    const taglineEl = document.getElementById('loading-screen-tagline');

    if (taglineEl && cfg.tagline) {
      taglineEl.innerText = cfg.tagline;
    }

    if (cfg.enabled && cfg.videoUrl && videoEl) {
      videoEl.src = cfg.videoUrl;
      videoEl.loop = cfg.loop !== false;
      videoEl.muted = true;
      videoEl.setAttribute('muted', '');
      videoEl.setAttribute('playsinline', '');
      videoEl.setAttribute('autoplay', '');

      // Video load handlers
      let videoLoadTimeout = setTimeout(() => {
        if (!videoLoadedSuccessfully) {
          console.warn("Video load timeout - using built-in Home.cell fallback animation.");
          if (videoEl) videoEl.classList.add('hidden');
        }
      }, 2500);

      videoEl.onloadeddata = function() {
        clearTimeout(videoLoadTimeout);
        videoLoadedSuccessfully = true;
        videoEl.classList.remove('hidden');
        videoEl.classList.add('opacity-100');
        videoEl.play().catch(err => console.warn("Video play prevented:", err));
      };

      videoEl.onerror = function() {
        clearTimeout(videoLoadTimeout);
        console.warn("Video failed to load - falling back to built-in animation.");
        if (videoEl) videoEl.classList.add('hidden');
      };
    }
  }

  // 4. Progress Bar Animation
  function startProgressBar() {
    const bar = document.getElementById('loading-progress-bar');
    const statusText = document.getElementById('loading-status-text');
    const skipBtn = document.getElementById('loading-skip-btn');
    let progress = 10;

    const stages = [
      { pct: 30, text: "Initializing Home.cell core..." },
      { pct: 60, text: "Connecting cell fellowship network..." },
      { pct: 85, text: "Syncing daily devotionals & scripture..." },
      { pct: 100, text: "Welcome to Home.cell Sanctuary!" }
    ];

    let currentStage = 0;

    const interval = setInterval(() => {
      if (isDismissed) {
        clearInterval(interval);
        return;
      }

      if (currentStage < stages.length) {
        const target = stages[currentStage];
        if (progress < target.pct) {
          progress += Math.floor(Math.random() * 8) + 4;
          if (progress > target.pct) progress = target.pct;
        } else {
          currentStage++;
        }

        if (bar) bar.style.width = `${progress}%`;
        if (statusText && stages[currentStage - 1]) {
          statusText.innerText = stages[currentStage - 1].text;
        }
      } else {
        clearInterval(interval);
      }
    }, 150);

    // Show skip button after 3.5 seconds in case user wants to jump in immediately
    setTimeout(() => {
      if (skipBtn && !isDismissed) {
        skipBtn.classList.remove('opacity-0', 'pointer-events-none');
        skipBtn.classList.add('opacity-100');
      }
    }, 3500);
  }

  // 5. Dismiss Loading Screen Smoothly
  window.dismissLoadingScreen = function(force = false) {
    if (isDismissed) return;

    const overlay = document.getElementById('app-loading-screen');
    if (!overlay) return;

    if (!minTimeElapsed && !force) {
      setTimeout(() => window.dismissLoadingScreen(false), 300);
      return;
    }

    isDismissed = true;
    if (canvasAnimId) cancelAnimationFrame(canvasAnimId);

    // Complete progress bar
    const bar = document.getElementById('loading-progress-bar');
    if (bar) bar.style.width = '100%';

    overlay.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(1.02)';

    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.add('pointer-events-none');
    }, 700);
  };

  // Fullscreen Preview Trigger for Super Admin Console
  window.testLoadingScreenPreview = function(previewConfig = null) {
    const overlay = document.getElementById('app-loading-screen');
    if (!overlay) return;

    isDismissed = false;
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.transform = 'scale(1)';
    overlay.classList.remove('pointer-events-none');

    // Show close preview button
    let closeBtn = document.getElementById('loading-preview-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.id = 'loading-preview-close-btn';
      closeBtn.className = 'fixed top-6 right-6 z-[100000] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-2xl cursor-pointer transition-all flex items-center gap-2';
      closeBtn.innerHTML = '❌ Exit Admin Preview';
      closeBtn.onclick = function() {
        window.closeLoadingScreenPreview();
      };
      overlay.appendChild(closeBtn);
    }
    closeBtn.classList.remove('hidden');

    if (previewConfig) {
      applyLoadingConfig(previewConfig);
    } else {
      applyLoadingConfig(activeConfig);
    }

    initFallbackCanvasAnimation();
    startProgressBar();
  };

  window.closeLoadingScreenPreview = function() {
    const closeBtn = document.getElementById('loading-preview-close-btn');
    if (closeBtn) closeBtn.classList.add('hidden');
    window.dismissLoadingScreen(true);
  };

  // Initialization lifecycle
  document.addEventListener('DOMContentLoaded', () => {
    initFallbackCanvasAnimation();
    startProgressBar();
    loadFirebaseConfig();

    // Minimum display timer
    setTimeout(() => {
      minTimeElapsed = true;
    }, activeConfig.minDisplayDuration || 2200);

    // Maximum timeout fallback (ensures application always opens)
    setTimeout(() => {
      window.dismissLoadingScreen(true);
    }, activeConfig.maxDisplayDuration || 5500);
  });

})();
