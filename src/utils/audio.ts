/**
 * Gerador de Alertas Sonoros e Voz para Gatilhos do Aviator no Betão
 * Utiliza a Web Audio API pura e síntese de voz nativa com desbloqueio obrigatório de navegadores
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public voiceEnabled: boolean = true;
  public isUnlocked: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private ptVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem('aviator_audio_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
      const savedVoice = localStorage.getItem('aviator_voice_enabled');
      if (savedVoice !== null) {
        this.voiceEnabled = savedVoice === 'true';
      }
    } catch {
      this.enabled = true;
      this.voiceEnabled = true;
    }

    // Carregar vozes em português
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const findVoice = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        // Priorizar português do Brasil
        const brVoice = voices.find(
          (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR'
        );
        const anyPt = voices.find((v) => v.lang.startsWith('pt'));
        this.ptVoice = brVoice || anyPt || null;
      } catch {
        // ignore
      }
    };

    findVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  /**
   * Desbloqueia o AudioContext e o sintetizador de voz com interação do usuário.
   * Navegadores (Chrome, Safari, Firefox) bloqueiam som e voz automática sem este gesto.
   */
  public async unlock(): Promise<boolean> {
    this.isUnlocked = true;
    this.enabled = true;
    this.voiceEnabled = true;

    try {
      localStorage.setItem('aviator_audio_enabled', 'true');
      localStorage.setItem('aviator_voice_enabled', 'true');
    } catch {
      // ignore
    }

    // Ativar AudioContext
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }

    // Tocar sinal sonoro de confirmação
    this.playSignalAlert();

    // Falar mensagem de boas-vindas para desbloquear o motor de voz
    this.speakVoice('Voz do Betão ativada com sucesso!');

    return true;
  }

  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('aviator_audio_enabled', String(this.enabled));
    } catch {
      // ignore
    }
    if (this.enabled) {
      this.unlock();
    }
    return this.enabled;
  }

  public toggleVoice(): boolean {
    this.voiceEnabled = !this.voiceEnabled;
    try {
      localStorage.setItem('aviator_voice_enabled', String(this.voiceEnabled));
    } catch {
      // ignore
    }
    if (this.voiceEnabled) {
      this.speakVoice('Voz de alertas ligada.');
    }
    return this.voiceEnabled;
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

      gain.gain.setValueAtTime(0.25, now);
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
   * Som de Atenção: Preparar Aposta no Betão (Alerta duplo audível)
   */
  public playPrepareWarning() {
    this.playBeep(700, 0.12, 'triangle', 0.25);
    setTimeout(() => {
      this.playBeep(920, 0.2, 'sine', 0.3);
    }, 140);
  }

  /**
   * Som de Vitória / GREEN!
   */
  public playGreenCelebration() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const start = ctx.currentTime + index * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
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
    this.playBeep(987.77, 0.05, 'sine', 0.15);
  }

  /**
   * Fala por voz sintética em português com tratamento de bloqueio e fila do navegador
   */
  public speakVoice(text: string) {
    if (!this.enabled || !this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Retomar caso o sintetizador esteja pausado pelo sistema operacional
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Parar falas anteriores para evitar sobreposição
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (this.ptVoice) {
        utterance.voice = this.ptVoice;
      }

      // Prevenir bug do garbage collector no Chromium (manter referência ativa)
      this.currentUtterance = utterance;

      utterance.onend = () => {
        this.currentUtterance = null;
      };

      utterance.onerror = (e) => {
        console.warn('Speech error:', e);
        this.currentUtterance = null;
      };

      // Pequeno timeout para contornar bug do Chromium ao chamar cancel() seguido de speak()
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          // ignore
        }
      }, 50);
    } catch {
      // ignore
    }
  }
}

export const soundEffects = new SoundEffects();

