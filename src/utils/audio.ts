/**
 * Web Audio API synthesizer for instant zero-latency alerts
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playPinkAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Ascending arpeggio (C5 -> E5 -> G5 -> C6)
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    osc.frequency.setValueAtTime(1046.5, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch {
    // Ignore audio permission errors
  }
}

export function playPurpleAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Ignore
  }
}

export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Ignore
  }
}

export function playSurgicalBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5 note
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // Ignore
  }
}

export function playConfluenceAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.0, now + 0.09); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.18); // D6
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  } catch {
    // Ignore
  }
}

/**
 * High precision second-by-second countdown beep for seconds 5, 4, 3, 2, 1
 */
export function playCountdownBeep(secondsLeft: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Ascending frequencies as zero approaches
    const freqMap: Record<number, number> = {
      5: 784, // G5
      4: 880, // A5
      3: 988, // B5
      2: 1175, // D6
      1: 1397, // F6
    };

    const freq = freqMap[secondsLeft] || 880;
    osc.type = secondsLeft <= 2 ? 'square' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // Ignore
  }
}

/**
 * Explosive trigger confirmation sound when the exact second 0 is reached
 */
export function playTriggerNowSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dual oscillator chord for powerful energetic trigger
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(1046.5, now + 0.08); // C6
    osc2.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.setValueAtTime(1318.5, now + 0.08); // E6

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.48);
    osc2.stop(now + 0.48);
  } catch {
    // Ignore
  }
}

/**
 * Text-to-Speech announcer for exact entry seconds in pt-BR
 */
export function speakExactSecondsAlert(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop pending speech to keep real-time sync
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.18; // Slightly brisk for real-time betting tempo
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Try finding a pt-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech errors
  }
}

/**
 * Casino slot jackpot chime / win fanfare for assertive slot entry alert
 */
export function playSlotJackpotAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Arpeggio notes: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz), C7 (2093Hz)
    const notes = [1046.5, 1318.5, 1567.98, 2093.0];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.36);
    });
  } catch {
    // Ignore
  }
}

/**
 * Speaks an assertive slot notification in Brazilian Portuguese
 */
export function speakSlotAssertiveAlert(gameName: string, targetMinute: number, targetSecond: number, pattern: string) {
  const text = `Atenção: entrada no ${gameName}! Minuto ${targetMinute}, disparo no segundo ${targetSecond}! Estratégia: ${pattern}.`;
  speakExactSecondsAlert(text);
}


