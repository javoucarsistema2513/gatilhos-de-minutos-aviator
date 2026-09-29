/**
 * Background Notification and Timing Service for Radar Aviator 82b
 * - Web Worker timer to avoid browser throttling in inactive tabs
 * - Service Worker notifications for native background delivery on mobile & desktop
 * - Background audio keep-alive to prevent Android/iOS from killing the background process
 */

class BackgroundNotificationService {
  private worker: Worker | null = null;
  private isAudioKeepAliveActive: boolean = false;
  private audioContext: AudioContext | null = null;
  private silentGain: GainNode | null = null;
  private lastNotificationSentTag: string = '';
  private lastNotificationTime: number = 0;

  constructor() {
    this.initWorker();
  }

  /**
   * Initializes a Web Worker from an inline Blob URL so it works in any environment
   * without needing external build configuration. Web Workers continue ticking even
   * when the tab is in the background or minimized!
   */
  private initWorker() {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'START') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage({ type: 'TICK', time: Date.now() });
              }, 1000);
            }
          } else if (e.data === 'STOP') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      this.worker.postMessage('START');
    } catch (err) {
      console.warn('Web Worker timer not available, falling back to standard timer', err);
    }
  }

  /**
   * Subscribe to the background Web Worker tick (1 second intervals)
   */
  public onTick(callback: (timestamp: number) => void): () => void {
    if (this.worker) {
      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'TICK') {
          callback(e.data.time);
        }
      };
      this.worker.addEventListener('message', handler);
      return () => {
        this.worker?.removeEventListener('message', handler);
      };
    } else {
      const interval = setInterval(() => callback(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }

  /**
   * Check if notifications are permitted
   */
  public isPermissionGranted(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Request notification permission from the user
   */
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Send a welcome test notification
        this.sendNotification(
          '🔔 Radar Aviator 82b Ativado!',
          'Você receberá notificações em segundo plano quando as velas previstas estiverem chegando!',
          'welcome-tag'
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting notification permission', err);
      return false;
    }
  }

  /**
   * Send a system notification in the background
   * Uses ServiceWorkerRegistration.showNotification() for true background delivery,
   * falling back to new Notification()
   */
  public async sendNotification(title: string, body: string, tag: string, vibrate = true) {
    if (!this.isPermissionGranted()) {
      return;
    }

    // Debounce to prevent duplicate rapid spamming
    const now = Date.now();
    if (this.lastNotificationSentTag === tag && now - this.lastNotificationTime < 10000) {
      return;
    }
    this.lastNotificationSentTag = tag;
    this.lastNotificationTime = now;

    const options: any = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: tag || 'aviator-alert',
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: vibrate ? [200, 100, 200, 100, 200] : undefined,
      data: {
        url: window.location.href,
        timestamp: now,
      },
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, options);
          return;
        }
      }

      // Fallback
      new Notification(title, options);
    } catch (err) {
      console.warn('Service worker notification failed, using direct Notification fallback', err);
      try {
        new Notification(title, options);
      } catch (e) {
        console.error('Could not display notification', e);
      }
    }
  }

  /**
   * Enable silent background keep-alive audio.
   * This prevents mobile browsers (Android Chrome, iOS Safari) from suspending
   * the web page when minimized or when the user switches to the 82b.game app.
   */
  public toggleBackgroundKeepAlive(enable: boolean): boolean {
    if (enable) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!this.audioContext && AudioCtx) {
          this.audioContext = new AudioCtx();
        }

        if (this.audioContext) {
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }

          // Inaudible 1Hz sub-oscillator with infinitesimal gain (0.00001)
          // keeps the browser audio track active so OS does not throttle Web Worker
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          gain.gain.value = 0.00001; // virtually silent
          osc.frequency.value = 1;
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start();
          this.silentGain = gain;
          this.isAudioKeepAliveActive = true;
          return true;
        }
      } catch (err) {
        console.warn('Audio keep-alive not available', err);
      }
      return false;
    } else {
      if (this.audioContext) {
        try {
          this.audioContext.suspend();
        } catch (_) {}
      }
      this.isAudioKeepAliveActive = false;
      return false;
    }
  }

  public getIsKeepAliveActive(): boolean {
    return this.isAudioKeepAliveActive;
  }
}

export const backgroundService = new BackgroundNotificationService();
