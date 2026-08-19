// sound-engine.js - Zero-Dependency Web Audio Synthesizer for Home.cell
(function() {
  let audioCtx = null;
  let isMuted = localStorage.getItem('homecell_sound_muted') === 'true';

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.soundEngine = {
    isMuted: function() {
      return isMuted;
    },

    toggleMute: function() {
      isMuted = !isMuted;
      localStorage.setItem('homecell_sound_muted', isMuted ? 'true' : 'false');
      window.updateSoundToggleIcons?.();
      window.showToast?.(isMuted ? "🔇 Sound Effects Muted" : "🔊 Sound Effects Enabled", "info");
      return isMuted;
    },

    playClick: function() {
      if (isMuted) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch (e) {}
    },

    playCorrect: function() {
      if (isMuted) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.06 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.25);
        });
      } catch (e) {}
    },

    playCoins: function() {
      if (isMuted) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const notes = [987.77, 1318.51]; // B5, E6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      } catch (e) {}
    },

    playVictory: function() {
      if (isMuted) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const chords = [
          [523.25, 659.25, 783.99],
          [587.33, 739.99, 880],
          [659.25, 830.61, 987.77],
          [1046.50, 1318.51, 1567.98]
        ];
        chords.forEach((chord, cIdx) => {
          chord.forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + cIdx * 0.16);
            gain.gain.setValueAtTime(0.15, ctx.currentTime + cIdx * 0.16);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cIdx * 0.16 + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + cIdx * 0.16);
            osc.stop(ctx.currentTime + cIdx * 0.16 + 0.45);
          });
        });
      } catch (e) {}
    }
  };

  window.addEventListener('click', function unlockAudio() {
    getAudioContext();
    window.removeEventListener('click', unlockAudio);
  }, { once: true });
})();
