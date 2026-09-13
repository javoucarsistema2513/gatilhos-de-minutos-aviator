/**
 * Gerador de Alertas Sonoros e Voz para Gatilhos do Aviator no Betão
 * Utiliza a Web Audio API pura e síntese de voz nativa
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private voiceEnabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('aviator_audio_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('aviator_audio_enabled', String(this.enabled));
    } catch {
      // ignore
    }
    if (this.enabled) {
      this.playBeep(880, 0.1, 'sine');
    }
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public playBeep(
    freq = 600,
    duration = 0.15,
    type: OscillatorType = 'sine',
    volume = 0.15
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  /**
   * Alerta de Confirmação de Gatilho / Entrada
   */
  public playSignalAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.28); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  /**
   * Som de Atenção: Preparar Aposta no Betão
   */
  public playPrepareWarning() {
    this.playBeep(750, 0.12, 'triangle', 0.18);
    setTimeout(() => {
      this.playBeep(900, 0.16, 'sine', 0.2);
    }, 140);
  }

  /**
   * Som de Vitória / GREEN!
   */
  public playGreenCelebration() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Acorde C Maior alegre
      notes.forEach((freq, index) => {
        const start = ctx.currentTime + index * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Tick de contagem regressiva nos últimos segundos
   */
  public playTick() {
    this.playBeep(987.77, 0.04, 'sine', 0.1);
  }

  /**
   * Fala por voz sintética opcional em português (ex: "Prepare a entrada no Betão")
   */
  public speakVoice(text: string) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore speech errors
    }
  }
}

export const soundEffects = new SoundEffects();
