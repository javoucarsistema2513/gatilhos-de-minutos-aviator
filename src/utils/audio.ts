/**
 * Gerador de Alertas Sonoros e Voz para Gatilhos do Aviator no Betão
 * Suporta modo duplo de voz (Áudio HD PWA + Voz Nativa) com compatibilidade total
 * para aplicativo instalado (PWA Standalone no Android, iOS, Windows e Mac) e navegadores.
 */

export type VoiceEngineType = 'auto' | 'pwa_audio' | 'native';

/**
 * Detecta se a aplicação está rodando como Aplicativo Instalado (PWA Standalone)
 */
export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

class SoundEffects {
  private ctx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  public enabled: boolean = true;
  public voiceEnabled: boolean = true;
  public isUnlocked: boolean = false;
  public voiceEngine: VoiceEngineType = 'auto';
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
      const savedEngine = localStorage.getItem('aviator_voice_engine') as VoiceEngineType | null;
      if (savedEngine) {
        this.voiceEngine = savedEngine;
      }
    } catch {
      this.enabled = true;
      this.voiceEnabled = true;
      this.voiceEngine = 'auto';
    }

    // Carregar vozes do sistema
    this.initVoices();
  }

  public setVoiceEngine(engine: VoiceEngineType) {
    this.voiceEngine = engine;
    try {
      localStorage.setItem('aviator_voice_engine', engine);
    } catch {
      // ignore
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const findVoice = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
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
   * Desbloqueia o AudioContext e o elemento HTML5 Audio com interação do usuário.
   * Crucial para navegadores mobile e apps instalados (Android WebAPK e iOS).
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

    // 1. Ativar Web Audio Context
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }

    // 2. Pré-aquecer elemento HTML5 Audio (libera reprodução espontânea em apps instalados)
    try {
      if (!this.audioElement && typeof Audio !== 'undefined') {
        this.audioElement = new Audio();
      }
      if (this.audioElement) {
        this.audioElement.volume = 1.0;
        this.audioElement.src =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        const p = this.audioElement.play();
        if (p !== undefined) {
          p.then(() => {
            this.audioElement?.pause();
          }).catch(() => {});
        }
      }
    } catch {
      // ignore
    }

    // 3. Tocar sinal sonoro de confirmação
    this.playSignalAlert();

    // 4. Falar mensagem de boas-vindas
    this.speakVoice('Voz do Betão ativada com sucesso no aplicativo!');

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
   * Reproduz voz por streaming de Áudio HD (HTML5 Audio).
   * Funciona 100% no Aplicativo Instalado (PWA / WebAPK) no Android, iOS e Desktop,
   * sem depender dos serviços de TTS do sistema operacional.
   */
  public speakWithAudio(text: string, onFail?: () => void): boolean {
    if (!this.enabled || !this.voiceEnabled) return false;
    if (typeof window === 'undefined') return false;

    try {
      // Tratamento de fonemas para fala fluida em português
      const clean = text
        .replace(/([0-9]+)\.([0-9]+)x/gi, '$1 ponto $2 xis')
        .replace(/([0-9]+)x/gi, '$1 xis')
        .replace(/[🎯🎉🚨🟢🟡🔊]/g, '')
        .trim();

      const encoded = encodeURIComponent(clean.slice(0, 160));
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encoded}`;

      if (!this.audioElement) {
        this.audioElement = new Audio();
      }

      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.src = ttsUrl;
      this.audioElement.volume = 1.0;

      let hasStarted = false;
      const playPromise = this.audioElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            hasStarted = true;
          })
          .catch((err) => {
            console.warn('[PWA Audio TTS] Playback prevented:', err);
            if (!hasStarted && onFail) onFail();
          });
      }

      // Timeout caso haja falha de conexão de rede
      const timer = setTimeout(() => {
        if (!hasStarted && this.audioElement && this.audioElement.paused) {
          if (onFail) onFail();
        }
      }, 1200);

      this.audioElement.onplaying = () => {
        hasStarted = true;
        clearTimeout(timer);
      };

      return true;
    } catch (err) {
      console.warn('[PWA Audio TTS] Erro:', err);
      if (onFail) onFail();
      return false;
    }
  }

  /**
   * Fala por voz sintética nativa (SpeechSynthesis) com proteção para PWA:
   * 1. Preservação de referência contra Garbage Collector do Chromium
   * 2. Evita cancelamento agressivo no Android
   * 3. Fallback automático se a voz nativa congelar
   */
  public speakNative(text: string, onFail?: () => void): boolean {
    if (!this.enabled || !this.voiceEnabled) return false;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onFail) onFail();
      return false;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // No Android PWA, só cancela se realmente houver algo travado em execução
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Buscar voz brasileira disponível dinamicamente
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const brVoice =
          voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
          voices.find((v) => v.lang.startsWith('pt'));
        if (brVoice) {
          utterance.voice = brVoice;
        }
      }

      // Proteger o utterance contra Garbage Collector no Chrome/WebAPK
      const win = window as unknown as { __aviatorUtterances?: SpeechSynthesisUtterance[] };
      if (!win.__aviatorUtterances) {
        win.__aviatorUtterances = [];
      }
      win.__aviatorUtterances.push(utterance);

      let started = false;

      utterance.onstart = () => {
        started = true;
      };

      utterance.onend = () => {
        if (win.__aviatorUtterances) {
          win.__aviatorUtterances = win.__aviatorUtterances.filter((u) => u !== utterance);
        }
      };

      utterance.onerror = (e) => {
        console.warn('[Native TTS] Erro no utterance:', e);
        if (win.__aviatorUtterances) {
          win.__aviatorUtterances = win.__aviatorUtterances.filter((u) => u !== utterance);
        }
        if (!started && onFail) {
          onFail();
        }
      };

      // Se o Android PWA não disparar a voz em 400ms, acionar o áudio fallback
      setTimeout(() => {
        if (!started) {
          console.warn('[Native TTS] Início não detectado no App Instalado. Acionando fallback...');
          if (onFail) onFail();
        }
      }, 400);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('[Native TTS] Exceção:', e);
      if (onFail) onFail();
      return false;
    }
  }

  /**
   * Dispara a fala usando o motor ideal com fallback transparente.
   * No app instalado (PWA Standalone), usa prioritariamente Áudio HD PWA
   * para contornar o bloqueio de TTS nativo do WebAPK no Android.
   */
  public speakVoice(text: string) {
    if (!this.enabled || !this.voiceEnabled) return;

    const isInstalled = isStandaloneApp();
    const preferAudio =
      this.voiceEngine === 'pwa_audio' ||
      (this.voiceEngine === 'auto' && isInstalled);

    if (preferAudio) {
      // Prioridade: Áudio HD PWA (funciona perfeitamente no App Instalado)
      this.speakWithAudio(text, () => {
        // Fallback para voz nativa se offline
        this.speakNative(text);
      });
    } else {
      // Prioridade: Voz Nativa
      this.speakNative(text, () => {
        // Fallback para Áudio HD PWA se o TTS nativo falhar no app instalado
        this.speakWithAudio(text);
      });
    }
  }
}

export const soundEffects = new SoundEffects();


