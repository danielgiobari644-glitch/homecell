// stream-player.js
// Unified Universal Live Streaming Engine for Home.cell
// Supports HLS, WebRTC (WHEP), iframe/embed, MP4 video, and Auto-Protocol Detection
// Works seamlessly on Web Browsers & Android WebView

(function() {
  'use strict';

  // 1. Android WebView Detection & Flags
  function detectAndroidWebView() {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isWebView = isAndroid && (
      /wv/i.test(ua) || 
      /Version\/4\.0/i.test(ua) || 
      Boolean(window.Android) || 
      !/Chrome\/[.0-9]* Mobile/i.test(ua)
    );
    return isWebView;
  }

  window.isAndroidWebView = detectAndroidWebView();

  // Active Stream Player Instance Registry for clean lifecycle management
  window.activeStreamPlayerInstances = window.activeStreamPlayerInstances || {};

  // Default Stream Config
  const DEFAULT_STREAM_CONFIG = {
    enabled: true,
    protocol: "auto", // iframe | hls | webrtc | mp4 | auto
    streamUrl: "",
    hlsUrl: "",
    webrtcUrl: "",
    iframeUrl: "",
    mp4Url: "",
    autoplay: true,
    controls: true,
    muted: false,
    reconnect: true,
    reconnectAttempts: 5,
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  };

  window.DEFAULT_STREAM_CONFIG = DEFAULT_STREAM_CONFIG;

  // 2. Protocol Resolution Heuristics
  function resolveStreamProtocol(url, configuredProtocol) {
    if (!url) return 'none';
    const proto = (configuredProtocol || 'auto').toLowerCase();
    
    if (proto !== 'auto') {
      return proto;
    }

    const cleanUrl = url.trim().toLowerCase();

    // Check extensions / path patterns
    if (cleanUrl.includes('.m3u8') || cleanUrl.includes('/hls/') || cleanUrl.includes('playlist.m3u8')) {
      return 'hls';
    }
    if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.ogg')) {
      return 'mp4';
    }
    if (cleanUrl.startsWith('webrtc://') || cleanUrl.includes('/webrtc/') || cleanUrl.includes('/whep') || cleanUrl.includes('/whip')) {
      return 'webrtc';
    }
    if (
      cleanUrl.includes('youtube.com') || 
      cleanUrl.includes('youtu.be') || 
      cleanUrl.includes('vimeo.com') || 
      cleanUrl.includes('twitch.tv') || 
      cleanUrl.includes('facebook.com') || 
      cleanUrl.includes('dailymotion.com') || 
      cleanUrl.includes('/embed/') ||
      cleanUrl.includes('.html')
    ) {
      return 'iframe';
    }

    // Default fallback if ambiguous
    const video = document.createElement('video');
    if (video.canPlayType('application/vnd.apple.mpegurl') || (window.Hls && window.Hls.isSupported())) {
      return 'hls';
    }
    return 'iframe';
  }

  window.resolveStreamProtocol = resolveStreamProtocol;

  // Process and sanitize Embed / Iframe URLs (e.g. converting YouTube watch links)
  function processEmbedUrl(url) {
    if (!url) return '';
    let clean = url.trim();
    try {
      if (clean.includes('youtube.com/watch')) {
        const urlObj = new URL(clean);
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          clean = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1`;
        }
      } else if (clean.includes('youtu.be/')) {
        const parts = clean.split('youtu.be/');
        const videoId = parts[1] ? parts[1].split('?')[0] : '';
        if (videoId) {
          clean = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1`;
        }
      } else if (clean.includes('twitch.tv/')) {
        const parts = clean.split('twitch.tv/');
        const channel = parts[1] ? parts[1].split('?')[0] : '';
        if (channel && !clean.includes('player.twitch.tv')) {
          const parent = window.location.hostname || 'localhost';
          clean = `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true`;
        }
      }
    } catch (e) {
      console.warn("Embed URL formatting exception:", e);
    }
    return clean;
  }

  // 3. Destroy and Clean Up Active Stream Player Instance
  function destroyStreamPlayer(containerId) {
    const instance = window.activeStreamPlayerInstances[containerId];
    if (!instance) return;

    if (instance.reconnectTimer) {
      clearTimeout(instance.reconnectTimer);
    }

    if (instance.hls) {
      try {
        instance.hls.destroy();
      } catch (e) {
        console.warn("HLS destruction error:", e);
      }
    }

    if (instance.peerConnection) {
      try {
        instance.peerConnection.getSenders().forEach(sender => {
          if (sender.track) sender.track.stop();
        });
        instance.peerConnection.close();
      } catch (e) {
        console.warn("WebRTC PeerConnection close error:", e);
      }
    }

    if (instance.videoElement) {
      try {
        instance.videoElement.pause();
        instance.videoElement.srcObject = null;
        instance.videoElement.src = '';
        instance.videoElement.load();
      } catch (e) {
        console.warn("Video element reset error:", e);
      }
    }

    delete window.activeStreamPlayerInstances[containerId];
  }

  window.destroyStreamPlayer = destroyStreamPlayer;

  // 4. Main Unified Stream Player Setup Engine
  window.setupUnifiedStreamPlayer = function(targetContainer, options = {}) {
    const container = typeof targetContainer === 'string' ? document.getElementById(targetContainer) : targetContainer;
    if (!container) return;

    const containerId = container.id || ('stream_player_' + Math.random().toString(36).substring(2, 9));
    container.id = containerId;

    // Destroy any existing player in this container
    destroyStreamPlayer(containerId);

    const config = Object.assign({}, DEFAULT_STREAM_CONFIG, options);
    let streamUrl = config.streamUrl || config.url || '';
    const configuredProtocol = config.protocol || 'auto';

    // Protocol specific URL overrides if provided
    if (configuredProtocol === 'hls' && config.hlsUrl) streamUrl = config.hlsUrl;
    if (configuredProtocol === 'webrtc' && config.webrtcUrl) streamUrl = config.webrtcUrl;
    if (configuredProtocol === 'iframe' && config.iframeUrl) streamUrl = config.iframeUrl;
    if (configuredProtocol === 'mp4' && config.mp4Url) streamUrl = config.mp4Url;

    container.innerHTML = '';
    container.className = "aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 relative flex items-center justify-center border border-slate-800 shadow-inner group";

    if (!streamUrl) {
      renderOfflineState(container, "Broadcast Offline", "No active livestream URL is configured right now.");
      return;
    }

    // HTTPS / Mixed Content Detection
    const isPageHttps = window.location.protocol === 'https:';
    const isStreamHttp = streamUrl.trim().toLowerCase().startsWith('http://');

    if (isPageHttps && isStreamHttp) {
      renderHttpsMixedContentError(container, streamUrl, config);
      return;
    }

    const resolvedProtocol = resolveStreamProtocol(streamUrl, configuredProtocol);

    // Player State Tracking Object
    const instanceState = {
      containerId,
      config,
      streamUrl,
      configuredProtocol,
      resolvedProtocol,
      hls: null,
      peerConnection: null,
      videoElement: null,
      iframeElement: null,
      reconnectAttempts: 0,
      reconnectTimer: null,
      playerState: 'connecting', // connecting, playing, paused, error, reconnecting
      lastError: null,
      diagnosticsVisible: false
    };

    window.activeStreamPlayerInstances[containerId] = instanceState;

    // Floating Emoji Particle Overlay Canvas Container
    const particleOverlay = document.createElement('div');
    particleOverlay.id = `emoji-particles-${containerId}`;
    particleOverlay.className = "absolute inset-0 pointer-events-none z-20 overflow-hidden";
    container.appendChild(particleOverlay);

    // Diagnostics HUD Overlay
    const diagOverlay = document.createElement('div');
    diagOverlay.id = `diag-overlay-${containerId}`;
    diagOverlay.className = "hidden absolute inset-0 bg-slate-950/95 backdrop-blur-md p-4 text-[10px] font-mono text-emerald-400 overflow-y-auto z-40 border border-emerald-500/30 rounded-2xl space-y-2";
    container.appendChild(diagOverlay);

    // Diagnostics Toggle Button (Top right on hover / admin)
    const diagBtn = document.createElement('button');
    diagBtn.type = 'button';
    diagBtn.className = "absolute top-3 right-3 z-30 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-700/80 backdrop-blur-md opacity-70 hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 shadow-lg";
    diagBtn.innerHTML = `🛠️ Diagnostics`;
    diagBtn.onclick = (e) => {
      e.stopPropagation();
      instanceState.diagnosticsVisible = !instanceState.diagnosticsVisible;
      if (instanceState.diagnosticsVisible) {
        diagOverlay.classList.remove('hidden');
        updateDiagnosticsHud(instanceState);
      } else {
        diagOverlay.classList.add('hidden');
      }
    };
    container.appendChild(diagBtn);

    // Loading / Status Overlay Indicator
    const statusOverlay = document.createElement('div');
    statusOverlay.id = `status-overlay-${containerId}`;
    statusOverlay.className = "absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center text-center p-6 space-y-3 transition-opacity duration-300";
    statusOverlay.innerHTML = `
      <div class="relative">
        <div class="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
        <span class="absolute inset-0 flex items-center justify-center text-[10px]">📡</span>
      </div>
      <div>
        <p class="text-xs font-black text-white font-display tracking-tight" id="status-title-${containerId}">Connecting to live stream...</p>
        <p class="text-[10px] text-slate-400 mt-1" id="status-desc-${containerId}">Protocol: ${resolvedProtocol.toUpperCase()} | Optimizing media pipeline...</p>
      </div>
    `;
    container.appendChild(statusOverlay);

    // Dispatch to protocol handler
    if (resolvedProtocol === 'hls') {
      initHlsPlayer(container, instanceState);
    } else if (resolvedProtocol === 'webrtc') {
      initWebRtcPlayer(container, instanceState);
    } else if (resolvedProtocol === 'mp4') {
      initMp4Player(container, instanceState);
    } else if (resolvedProtocol === 'iframe') {
      initIframePlayer(container, instanceState);
    } else {
      renderErrorState(container, instanceState, "Unsupported Format", "Your app or browser does not support this streaming protocol.");
    }

    updateDiagnosticsHud(instanceState);
  };

  // Helper: Show Status Message in Player Overlay
  function showPlayerStatus(instanceState, title, desc, isError = false) {
    const containerId = instanceState.containerId;
    const titleEl = document.getElementById(`status-title-${containerId}`);
    const descEl = document.getElementById(`status-desc-${containerId}`);
    const overlay = document.getElementById(`status-overlay-${containerId}`);

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = desc || '';
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.opacity = '1';
    }

    instanceState.playerState = isError ? 'error' : 'connecting';
    updateDiagnosticsHud(instanceState);
  }

  function hidePlayerStatus(instanceState) {
    const containerId = instanceState.containerId;
    const overlay = document.getElementById(`status-overlay-${containerId}`);
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.style.opacity === '0') overlay.classList.add('hidden');
      }, 300);
    }
    instanceState.playerState = 'playing';
    updateDiagnosticsHud(instanceState);
  }

  // 5. HLS Player Handler
  function initHlsPlayer(container, instanceState) {
    const video = document.createElement('video');
    video.id = `video-${instanceState.containerId}`;
    video.controls = instanceState.config.controls !== false;
    video.autoplay = instanceState.config.autoplay !== false;
    video.muted = instanceState.config.muted || false;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.className = "w-full h-full object-contain bg-slate-950 rounded-2xl focus:outline-none";

    container.appendChild(video);
    instanceState.videoElement = video;

    const streamUrl = instanceState.streamUrl;

    // Check Native HLS support first (iOS Safari / Android Native HLS)
    const canPlayNativeHls = video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');

    if (canPlayNativeHls) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        hidePlayerStatus(instanceState);
        if (instanceState.config.autoplay) {
          video.play().catch(e => handleAutoplayBlock(video, instanceState, e));
        }
      });

      video.addEventListener('playing', () => hidePlayerStatus(instanceState));
      video.addEventListener('error', (e) => {
        const err = video.error ? `Error code ${video.error.code}` : 'Video playback error';
        instanceState.lastError = err;
        renderErrorState(container, instanceState, "HLS Stream Error", "Native player encountered an error loading the HLS stream.");
      });

    } else if (window.Hls && window.Hls.isSupported()) {
      // Use hls.js
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        fragLoadingRetryDelay: 1000,
        manifestLoadingRetryDelay: 1000
      });

      instanceState.hls = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        hidePlayerStatus(instanceState);
        if (instanceState.config.autoplay) {
          video.play().catch(e => handleAutoplayBlock(video, instanceState, e));
        }
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        instanceState.lastError = `HLS.js ${data.type}: ${data.details}`;
        updateDiagnosticsHud(instanceState);

        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              showPlayerStatus(instanceState, "Network Error", "Attempting HLS stream network recovery...", true);
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              showPlayerStatus(instanceState, "Media Error", "Recovering HLS stream media buffer...", true);
              hls.recoverMediaError();
              break;
            default:
              renderErrorState(container, instanceState, "HLS Connection Failed", `Fatal HLS stream error: ${data.details || 'Connection lost'}`);
              break;
          }
        }
      });

      video.addEventListener('playing', () => hidePlayerStatus(instanceState));

    } else {
      renderErrorState(container, instanceState, "HLS Format Unsupported", "Your browser/WebView does not support HLS stream playback.");
    }
  }

  // Handle browser autoplay policy restrictions smoothly
  function handleAutoplayBlock(video, instanceState, error) {
    console.warn("Autoplay blocked, attempting muted playback:", error);
    video.muted = true;
    video.play().then(() => {
      showToastNotification?.("Stream playing muted. Tap audio icon for sound 🔊", "info");
    }).catch(e => {
      console.warn("Muted autoplay also blocked:", e);
    });
  }

  // 6. WebRTC Player Handler (Supports WHEP / Custom SDP Signaling)
  async function initWebRtcPlayer(container, instanceState) {
    const video = document.createElement('video');
    video.id = `video-webrtc-${instanceState.containerId}`;
    video.controls = instanceState.config.controls !== false;
    video.autoplay = instanceState.config.autoplay !== false;
    video.muted = instanceState.config.muted || false;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.className = "w-full h-full object-contain bg-slate-950 rounded-2xl focus:outline-none";

    container.appendChild(video);
    instanceState.videoElement = video;

    const iceServers = instanceState.config.iceServers || DEFAULT_STREAM_CONFIG.iceServers;
    const streamUrl = instanceState.streamUrl;

    try {
      const pc = new RTCPeerConnection({ iceServers });
      instanceState.peerConnection = pc;

      // Add recvonly transceivers for audio & video
      try {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } catch (e) {
        console.warn("Transceiver addition warning:", e);
      }

      pc.ontrack = (evt) => {
        if (evt.streams && evt.streams[0]) {
          video.srcObject = evt.streams[0];
        } else {
          let stream = video.srcObject;
          if (!stream) {
            stream = new MediaStream();
            video.srcObject = stream;
          }
          stream.addTrack(evt.track);
        }
        hidePlayerStatus(instanceState);
        video.play().catch(e => handleAutoplayBlock(video, instanceState, e));
      };

      pc.oniceconnectionstatechange = () => {
        instanceState.lastError = `ICE State: ${pc.iceConnectionState}`;
        updateDiagnosticsHud(instanceState);

        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          showPlayerStatus(instanceState, "WebRTC Disconnected", "Live stream connection lost. Reconnecting...", true);
          attemptWebRtcReconnect(container, instanceState);
        }
      };

      pc.onconnectionstatechange = () => {
        instanceState.lastError = `Connection State: ${pc.connectionState}`;
        updateDiagnosticsHud(instanceState);

        if (pc.connectionState === 'connected') {
          hidePlayerStatus(instanceState);
        } else if (pc.connectionState === 'failed') {
          renderErrorState(container, instanceState, "WebRTC Connection Failed", "Unable to establish low-latency WebRTC peer connection.");
        }
      };

      // Generate local SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Perform WHEP signaling POST request
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error(`WHEP endpoint returned status ${response.status} ${response.statusText}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

    } catch (err) {
      console.error("WebRTC player setup exception:", err);
      instanceState.lastError = err.message || err.toString();
      renderErrorState(container, instanceState, "WebRTC Stream Error", `Failed to connect WebRTC endpoint: ${err.message || 'Server unreachable'}`);
    }
  }

  function attemptWebRtcReconnect(container, instanceState) {
    if (instanceState.reconnectAttempts >= instanceState.config.reconnectAttempts) {
      renderErrorState(container, instanceState, "Connection Timed Out", "Reconnection attempts exhausted. Please tap retry.");
      return;
    }

    instanceState.reconnectAttempts++;
    instanceState.reconnectTimer = setTimeout(() => {
      showPlayerStatus(instanceState, `Reconnecting (${instanceState.reconnectAttempts}/${instanceState.config.reconnectAttempts})...`, "Re-establishing WebRTC session...");
      destroyStreamPlayer(instanceState.containerId);
      window.setupUnifiedStreamPlayer(container, instanceState.config);
    }, 3000);
  }

  // 7. Direct MP4 Video Player Handler
  function initMp4Player(container, instanceState) {
    const video = document.createElement('video');
    video.id = `video-mp4-${instanceState.containerId}`;
    video.controls = instanceState.config.controls !== false;
    video.autoplay = instanceState.config.autoplay !== false;
    video.muted = instanceState.config.muted || false;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.className = "w-full h-full object-contain bg-slate-950 rounded-2xl focus:outline-none";
    video.src = instanceState.streamUrl;

    container.appendChild(video);
    instanceState.videoElement = video;

    video.addEventListener('loadeddata', () => hidePlayerStatus(instanceState));
    video.addEventListener('playing', () => hidePlayerStatus(instanceState));
    video.addEventListener('error', () => {
      const err = video.error ? `Error code ${video.error.code}` : 'Video load error';
      instanceState.lastError = err;
      renderErrorState(container, instanceState, "Video Stream Error", "Failed to load direct MP4 video file.");
    });

    if (instanceState.config.autoplay) {
      video.play().catch(e => handleAutoplayBlock(video, instanceState, e));
    }
  }

  // 8. Iframe / Embed Player Handler
  function initIframePlayer(container, instanceState) {
    const processedUrl = processEmbedUrl(instanceState.streamUrl);

    const iframe = document.createElement('iframe');
    iframe.id = `iframe-${instanceState.containerId}`;
    iframe.className = "w-full h-full rounded-2xl overflow-hidden bg-slate-950 border-none relative z-10";
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media; web-share";
    iframe.allowFullscreen = true;
    iframe.setAttribute('playsinline', '');
    iframe.setAttribute('webkit-playsinline', '');

    // Set src safely via JavaScript property
    iframe.src = processedUrl;

    container.appendChild(iframe);
    instanceState.iframeElement = iframe;

    iframe.onload = () => {
      hidePlayerStatus(instanceState);
    };

    // Timeout fallback if iframe load event doesn't fire
    setTimeout(() => {
      hidePlayerStatus(instanceState);
    }, 2000);
  }

  // 9. Error State Renderer with Retry & HTTPS Fix Option
  function renderErrorState(container, instanceState, title, message) {
    instanceState.playerState = 'error';
    instanceState.lastError = message;

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center text-rose-400 space-y-3 bg-slate-950/95 w-full h-full rounded-2xl border border-rose-900/50 relative z-20">
        <div class="p-3 bg-rose-500/10 rounded-full border border-rose-500/20">
          <span class="text-2xl">⚠️</span>
        </div>
        <div>
          <p class="text-sm font-black font-display text-white">${title}</p>
          <p class="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">${message}</p>
        </div>
        <div class="flex items-center gap-2 pt-2">
          <button type="button" onclick="window.retryStreamPlayer('${instanceState.containerId}')" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5">
            🔄 Retry Stream
          </button>
        </div>
      </div>
    `;

    updateDiagnosticsHud(instanceState);
  }

  // HTTPS Mixed Content Error Renderer
  function renderHttpsMixedContentError(container, streamUrl, config) {
    const containerId = container.id || 'stream_player_https_err';
    const httpsSuggestedUrl = streamUrl.replace(/^http:\/\//i, 'https://');

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center text-amber-400 space-y-3 bg-slate-950/95 w-full h-full rounded-2xl border border-amber-500/30 relative z-20">
        <div class="p-3 bg-amber-500/10 rounded-full border border-amber-500/20">
          <span class="text-2xl">🔒</span>
        </div>
        <div>
          <p class="text-sm font-black font-display text-white">HTTPS Mixed-Content Blocked</p>
          <p class="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
            This app is served over secure <span class="font-mono text-emerald-400">HTTPS</span>. The browser or Android WebView blocks unencrypted <span class="font-mono text-rose-400">HTTP</span> streams for security.
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button type="button" onclick="window.tryHttpsStreamUrl('${containerId}', '${encodeURIComponent(httpsSuggestedUrl)}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1">
            🔒 Try Secure HTTPS Endpoint
          </button>
          <button type="button" onclick="window.retryStreamPlayer('${containerId}')" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer">
            🔄 Retry Original
          </button>
        </div>
      </div>
    `;
  }

  // Offline State Renderer
  function renderOfflineState(container, title, desc) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3 bg-slate-950/80 w-full h-full rounded-2xl border border-slate-800">
        <div class="p-3 bg-slate-900 rounded-full text-slate-500">
          <span class="text-2xl">📡</span>
        </div>
        <div>
          <p class="text-xs font-black uppercase tracking-wider text-slate-300 font-display">${title}</p>
          <p class="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">${desc}</p>
        </div>
      </div>
    `;
  }

  // 10. Retry Function
  window.retryStreamPlayer = function(containerId) {
    const instance = window.activeStreamPlayerInstances[containerId];
    if (!instance) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    destroyStreamPlayer(containerId);
    window.setupUnifiedStreamPlayer(container, instance.config);
  };

  window.tryHttpsStreamUrl = function(containerId, encodedHttpsUrl) {
    const httpsUrl = decodeURIComponent(encodedHttpsUrl);
    const instance = window.activeStreamPlayerInstances[containerId];
    const container = document.getElementById(containerId);
    if (!container) return;

    const newConfig = Object.assign({}, instance ? instance.config : DEFAULT_STREAM_CONFIG, { streamUrl: httpsUrl, url: httpsUrl });
    destroyStreamPlayer(containerId);
    window.setupUnifiedStreamPlayer(container, newConfig);
  };

  // 11. Diagnostics HUD Updating Engine
  function updateDiagnosticsHud(instanceState) {
    const containerId = instanceState.containerId;
    const overlay = document.getElementById(`diag-overlay-${containerId}`);
    if (!overlay) return;

    const video = document.createElement('video');
    const nativeHls = video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');

    overlay.innerHTML = `
      <div class="flex items-center justify-between border-b border-emerald-500/30 pb-1 font-bold text-emerald-300">
        <span>🛠️ STREAM DIAGNOSTICS HUD</span>
        <span class="text-[9px] px-1.5 py-0.5 bg-emerald-950 rounded text-emerald-400">${instanceState.playerState.toUpperCase()}</span>
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>App Environment: <span class="text-white">${window.isAndroidWebView ? 'Android WebView 📱' : 'Web Browser 🌐'}</span></div>
        <div>Page Protocol: <span class="text-white">${window.location.protocol}</span></div>
        <div>Configured Protocol: <span class="text-amber-300">${instanceState.configuredProtocol}</span></div>
        <div>Resolved Protocol: <span class="text-emerald-300">${instanceState.resolvedProtocol}</span></div>
        <div>HLS Native Support: <span class="${nativeHls ? 'text-emerald-400' : 'text-slate-400'}">${nativeHls ? 'YES' : 'NO'}</span></div>
        <div>HLS.js Support: <span class="${window.Hls && Hls.isSupported() ? 'text-emerald-400' : 'text-slate-400'}">${window.Hls && Hls.isSupported() ? 'YES' : 'NO'}</span></div>
        <div>WebRTC Support: <span class="${Boolean(window.RTCPeerConnection) ? 'text-emerald-400' : 'text-rose-400'}">${Boolean(window.RTCPeerConnection) ? 'YES' : 'NO'}</span></div>
        <div>iframe Support: <span class="text-emerald-400">YES</span></div>
      </div>
      <div class="pt-1 border-t border-emerald-500/20 text-slate-300 break-all">
        Stream URL: <span class="text-emerald-200">${instanceState.streamUrl || 'None'}</span>
      </div>
      ${instanceState.lastError ? `
        <div class="p-1.5 bg-rose-950/80 border border-rose-500/30 text-rose-300 rounded text-[9px]">
          Last Event/Error: ${instanceState.lastError}
        </div>
      ` : ''}
    `;
  }

  // 12. Floating Emoji Particle Animation Generator for Live Reactions
  window.triggerFloatingEmoji = function(emoji, containerId) {
    let targetContainer = null;
    if (containerId) {
      targetContainer = document.getElementById(`emoji-particles-${containerId}`);
    }
    if (!targetContainer) {
      // Find active dashboard player or feed player container
      const activeKeys = Object.keys(window.activeStreamPlayerInstances);
      if (activeKeys.length > 0) {
        targetContainer = document.getElementById(`emoji-particles-${activeKeys[0]}`);
      }
    }
    if (!targetContainer) return;

    const particle = document.createElement('div');
    particle.className = "absolute text-2xl select-none pointer-events-none z-30 animate-kc-float";
    particle.innerText = emoji || '🙏';
    
    // Randomize horizontal trajectory
    const leftOffset = Math.floor(Math.random() * 80) + 10;
    particle.style.left = `${leftOffset}%`;
    particle.style.bottom = `10px`;

    targetContainer.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 2200);
  };

  // Toast Notification helper
  function showToastNotification(msg, type) {
    if (window.showToast) {
      window.showToast(msg, type);
    }
  }

  console.log("Unified Stream Player Engine initialized. Android WebView detected:", window.isAndroidWebView);

})();
