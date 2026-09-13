/**
 * Gerenciador de Notificações em Segundo Plano (Web Notifications API & Service Worker)
 * Permite que o usuário receba alertas mesmo jogando no Betão em outra aba ou aplicativo minimizado.
 */

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  private originalTitle: string = 'Gatilhos de Minutos Aviator';
  private titleFlashInterval: number | null = null;

  public getStatus(): NotificationStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationStatus;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Solicita autorização do usuário para enviar notificações
   */
  public async requestPermission(): Promise<NotificationStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.sendNotification({
          title: '🔔 Notificações do Betão Ativadas!',
          body: 'Você receberá os alertas dos minutos pagadores mesmo em segundo plano.',
          tag: 'betao-welcome',
        });
      }
      return permission as NotificationStatus;
    } catch {
      return 'denied';
    }
  }

  /**
   * Envia notificação nativa (via Service Worker se disponível, ou direto pela API)
   */
  public async sendNotification(options: {
    title: string;
    body: string;
    tag?: string;
    icon?: string;
    badge?: string;
    vibrate?: number[];
    requireInteraction?: boolean;
    renotify?: boolean;
  }) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      // Fallback: Se não tiver permissão de notificação, pisca o título da aba
      this.flashTabTitle(options.title);
      return;
    }

    // Vibrar dispositivo se suportado (celular / tablet)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(options.vibrate || [200, 100, 200, 100, 200]);
      } catch {
        // ignore
      }
    }

    // Sempre piscar o título da aba caso o usuário esteja em outra aba
    this.flashTabTitle(options.title);

    const notificationOptions = {
      body: options.body,
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/pwa-192x192.png',
      tag: options.tag || 'betao-alert',
      vibrate: options.vibrate || [200, 100, 200, 100, 200],
      requireInteraction: options.requireInteraction ?? true,
      renotify: options.renotify ?? true,
      silent: false,
    } as NotificationOptions & { vibrate?: number[]; renotify?: boolean };

    try {
      // Tenta enviar via Service Worker (melhor suporte a segundo plano no Android e Desktop)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(options.title, notificationOptions as NotificationOptions);
          return;
        }
      }

      // Fallback para new Notification direto
      const n = new Notification(options.title, notificationOptions as NotificationOptions);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      // Fallback simples
      try {
        new Notification(options.title, {
          body: options.body,
          icon: '/pwa-192x192.png',
        });
      } catch {
        // ignore
      }
    }
  }

  /**
   * Notificação de Atenção: Faltam 15 segundos para o minuto
   */
  public notifyPrepare(targetMinuteFormatted: string, secondsRemaining: number) {
    this.sendNotification({
      title: `🟡 PREPARAR NO BETÃO! Minuto ${targetMinuteFormatted}`,
      body: `Faltam ${secondsRemaining}s! Abra o Aviator no Betão e confira o Auto-Cashout em 1.50x.`,
      tag: 'betao-stage-alert',
      renotify: true,
      requireInteraction: true,
    });
  }

  /**
   * Notificação de Entrada Confirmada no minuto exato (:00s)
   */
  public notifyEnter(targetMinuteFormatted: string, safeExit: number, probability: number) {
    this.sendNotification({
      title: `🟢 ENTRAR AGORA NO BETÃO! Minuto ${targetMinuteFormatted}`,
      body: `Entrada liberada! Probabilidade: ${probability}%. Saída Segura em ${safeExit.toFixed(2)}x.`,
      tag: 'betao-stage-alert',
      renotify: true,
      requireInteraction: true,
    });
  }

  /**
   * Notificação de Green Confirmado
   */
  public notifyGreen(multiplier: number) {
    this.sendNotification({
      title: `🎉 GREEN NO BETÃO! Vela ${multiplier.toFixed(2)}x`,
      body: 'Gatilho de minuto bateu a meta com sucesso! Lucro garantido.',
      tag: 'betao-green-alert',
      renotify: true,
      requireInteraction: false,
    });
  }

  /**
   * Pisca o título da aba do navegador para chamar atenção visual
   */
  public flashTabTitle(alertText: string) {
    if (typeof document === 'undefined') return;
    if (this.titleFlashInterval) {
      clearInterval(this.titleFlashInterval);
    }

    let isAlert = true;
    let count = 0;
    this.originalTitle = 'Gatilhos de Minutos Aviator no Betão';

    this.titleFlashInterval = window.setInterval(() => {
      document.title = isAlert ? `🚨 ${alertText}` : this.originalTitle;
      isAlert = !isAlert;
      count++;
      if (count > 20) {
        if (this.titleFlashInterval) clearInterval(this.titleFlashInterval);
        document.title = this.originalTitle;
      }
    }, 800);
  }

  public resetTabTitle() {
    if (this.titleFlashInterval) {
      clearInterval(this.titleFlashInterval);
      this.titleFlashInterval = null;
    }
    if (typeof document !== 'undefined') {
      document.title = 'Gatilhos de Minutos Aviator no Betão';
    }
  }
}

export const notificationService = new NotificationService();
