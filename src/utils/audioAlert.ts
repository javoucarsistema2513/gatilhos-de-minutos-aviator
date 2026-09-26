/**
 * Web Audio API synthesizer for Aviator real-time alerts.
 * Generates audio tones without requiring external audio files.
 */

export const playAviatorSound = (type: 'warning' | 'target' | 'test') => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // If suspended by browser autoplay policy, resume on user action
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (type === 'test') {
      // Pleasant chime ascending
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'warning') {
      // Short caution radar blip (for 45s, 30s, 15s remaining)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780, ctx.currentTime);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'target') {
      // Dual high-intensity entrance chime for active Betão target minute
      const now = ctx.currentTime;
      [
        { freq: 880, delay: 0 },
        { freq: 1174, delay: 0.16 },
        { freq: 1760, delay: 0.32 },
      ].forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.28, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.22);
      });
    }
  } catch (err) {
    console.warn('Web Audio playback error or blocked:', err);
  }
};
