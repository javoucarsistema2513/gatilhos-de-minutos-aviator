/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { FocusedSignalMonitor } from './components/FocusedSignalMonitor';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TableSynchronizerModal } from './components/TableSynchronizerModal';
import {
  AviatorCandle,
  CandleColor,
  NotificationLog,
  NotificationSettings,
  RadarSignal,
} from './types';
import {
  analyzePayingMinutes,
  calculateStatistics,
  evaluateLiveSignal,
  getCandleColor,
} from './utils/calculator';
import { playClickSound, playPinkAlertSound, playPurpleAlertSound } from './utils/audio';

const generateInitialCandles = (): AviatorCandle[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aviator_saved_candles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
  }

  const now = Date.now();
  const sampleMultipliers = [
    2.45, 1.34, 1.15, 14.80, 2.10, 1.05, 3.82, 1.95, 4.10, 1.22,
    18.90, 2.05, 1.35, 1.20, 5.40, 1.12, 2.65, 1.48, 1.29, 2.20
  ];
  return sampleMultipliers.map((mult, idx) => {
    const ts = now - idx * 22000;
    const color: CandleColor = mult >= 10 ? 'pink' : mult >= 2 ? 'purple' : 'blue';
    return {
      id: `seed-${idx}`,
      multiplier: mult,
      timestamp: ts,
      color,
      roundNumber: 200 - idx,
      payingMinute: new Date(ts).getMinutes(),
    };
  });
};

export default function App() {
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [candles, setCandles] = useState<AviatorCandle[]>(generateInitialCandles);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aviator_sound_enabled') !== 'false';
  });
  const [isSimulating, setIsSimulating] = useState<boolean>(() => {
    return localStorage.getItem('aviator_is_simulating') === 'true';
  });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(20);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Notification Settings (persisted in localStorage)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('aviator_notif_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      telegram: {
        enabled: false,
        botToken: '',
        chatId: '',
        notifyOnPurple: true,
        notifyOnPink: true,
        notifyOnSuperPink: true,
        minConfidence: 75,
      },
      webhook: {
        enabled: false,
        url: '',
        notifyOnPurple: false,
        notifyOnPink: true,
      },
      browser: {
        soundEnabled: true,
        vibrationEnabled: true,
        desktopNotifications: true,
      },
    };
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const lastSignalIdRef = useRef<string>('');

  // Save settings changes to localStorage
  const handleUpdateSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    localStorage.setItem('aviator_notif_settings', JSON.stringify(newSettings));
  };

  useEffect(() => {
    localStorage.setItem('aviator_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Check browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    } else {
      setBrowserPermission('unsupported');
    }
  }, []);

  // Fetch initial candles from server
  useEffect(() => {
    async function loadCandles() {
      try {
        const res = await fetch('/api/candles');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.candles) && data.candles.length > 0) {
            setCandles(data.candles);
            localStorage.setItem('aviator_saved_candles', JSON.stringify(data.candles));
          }
        }
      } catch (e) {
        console.warn('Usando candles locais de fallback:', e);
      }
    }
    loadCandles();
  }, []);

  // Compute stats and active signal
  const statistics = useMemo(() => calculateStatistics(candles), [candles]);
  const currentSignal = useMemo(() => evaluateLiveSignal(candles), [candles]);
  const payingMinutes = useMemo(() => analyzePayingMinutes(candles), [candles]);

  // Dispatch API and Push Notifications
  const dispatchSignalNotifications = async (signal: RadarSignal) => {
    if (signal.type === 'STANDBY') return;

    // Avoid duplicate dispatch for identical signal
    if (lastSignalIdRef.current === signal.id) return;
    lastSignalIdRef.current = signal.id;

    // Play Sound
    if (soundEnabled) {
      if (signal.type === 'PINK_RADAR') {
        playPinkAlertSound();
      } else {
        playPurpleAlertSound();
      }
    }

    // Vibration on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(signal.type === 'PINK_RADAR' ? [200, 100, 200, 100, 300] : [150, 80, 150]);
      } catch {
        // Ignore
      }
    }

    // 1. Browser Native Push Notification
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(signal.title, {
          body: `Alvo: ${signal.targetMultiplier} | Confiança: ${signal.confidence}% | Minutagem: ${signal.payingMinuteTarget}`,
          icon: '/public/pwa-192x192.png',
          badge: '/public/favicon.ico',
        });

        setNotificationLogs((prev) => [
          {
            id: `log-${Date.now()}-push`,
            timestamp: Date.now(),
            channel: 'browser',
            status: 'sent',
            title: signal.title,
            message: `Alvo: ${signal.targetMultiplier}`,
          },
          ...prev,
        ]);
      } catch (e) {
        console.warn('Falha no Web Push:', e);
      }
    }

    // 2. Telegram Bot API Dispatch
    if (
      notificationSettings.telegram.enabled &&
      notificationSettings.telegram.botToken &&
      notificationSettings.telegram.chatId
    ) {
      const isPink = signal.type === 'PINK_RADAR';
      const shouldSend =
        (isPink && notificationSettings.telegram.notifyOnPink) ||
        (!isPink && notificationSettings.telegram.notifyOnPurple);

      if (shouldSend && signal.confidence >= notificationSettings.telegram.minConfidence) {
        const text = `
${isPink ? '🚨 <b>ALERTA MÁXIMO: CICLO DE VELA ROSA (10X+)</b> 🚨' : '⚡ <b>SINAL CONFIRMADO: VELA ROXA (2.00x)</b> ⚡'}

🎯 <b>Alvo Sugerido:</b> ${signal.targetMultiplier}
📈 <b>Confiança do Radar:</b> ${signal.confidence}%
⏰ <b>Minutagem Pagante:</b> ${signal.payingMinuteTarget}
⏱️ <b>Segundo Exato da Entrada:</b> ${signal.payingSecondTarget || ':18s (Janela :12s a :25s)'}
🛡️ <b>Proteção / Entrada:</b> ${signal.protectionGale}
📊 <b>Análise:</b> ${signal.triggerReason}

<i>Enviado instantaneamente por Aviator Radar PWA com precisão de segundos</i>
        `.trim();

        try {
          const res = await fetch('/api/notify/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              botToken: notificationSettings.telegram.botToken,
              chatId: notificationSettings.telegram.chatId,
              message: text,
            }),
          });
          const resData = await res.json();

          setNotificationLogs((prev) => [
            {
              id: `log-${Date.now()}-tg`,
              timestamp: Date.now(),
              channel: 'telegram',
              status: resData.success ? 'sent' : 'failed',
              title: signal.title,
              message: text,
            },
            ...prev,
          ]);

          setUnreadCount((c) => c + 1);
        } catch (err) {
          console.error('Telegram dispatch error:', err);
        }
      }
    }

    // 3. Webhook Dispatch
    if (notificationSettings.webhook.enabled && notificationSettings.webhook.url) {
      const isPink = signal.type === 'PINK_RADAR';
      const shouldSend =
        (isPink && notificationSettings.webhook.notifyOnPink) ||
        (!isPink && notificationSettings.webhook.notifyOnPurple);

      if (shouldSend) {
        const payload = {
          title: signal.title,
          multiplier: signal.targetMultiplier,
          confidence: signal.confidence,
          payingMinute: signal.payingMinuteTarget,
          payingSeconds: signal.payingSecondTarget || ':18s',
          exactSecond: signal.targetSecond,
          reason: signal.triggerReason,
          protection: signal.protectionGale,
          type: signal.type,
          timestamp: new Date().toISOString(),
        };

        try {
          const res = await fetch('/api/notify/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: notificationSettings.webhook.url,
              payload,
            }),
          });
          const resData = await res.json();

          setNotificationLogs((prev) => [
            {
              id: `log-${Date.now()}-wh`,
              timestamp: Date.now(),
              channel: 'webhook',
              status: resData.success ? 'sent' : 'failed',
              title: signal.title,
              message: JSON.stringify(payload),
            },
            ...prev,
          ]);

          setUnreadCount((c) => c + 1);
        } catch (err) {
          console.error('Webhook error:', err);
        }
      }
    }
  };

  // Check and dispatch signal when currentSignal changes
  useEffect(() => {
    if (currentSignal.type !== 'STANDBY') {
      dispatchSignalNotifications(currentSignal);
    }
  }, [currentSignal.id]);

  // Add Candle Handler
  const handleAddCandle = async (multiplier: number, customTimestamp?: number) => {
    playClickSound();
    const candleTime = customTimestamp && customTimestamp > 0 ? customTimestamp : Date.now();
    try {
      const res = await fetch('/api/candles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier, timestamp: candleTime }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.candle) {
          setCandles((prev) => [data.candle, ...prev]);
        }
      } else {
        // Local fallback
        const dateObj = new Date(candleTime);
        const color = getCandleColor(multiplier);
        const newCandle: AviatorCandle = {
          id: `local-${Date.now()}`,
          multiplier: Number(multiplier.toFixed(2)),
          timestamp: candleTime,
          color,
          roundNumber: candles.length + 1,
          payingMinute: dateObj.getMinutes(),
        };
        setCandles((prev) => [newCandle, ...prev]);
      }
    } catch {
      // Local fallback
      const dateObj = new Date(candleTime);
      const color = getCandleColor(multiplier);
      const newCandle: AviatorCandle = {
        id: `local-${Date.now()}`,
        multiplier: Number(multiplier.toFixed(2)),
        timestamp: candleTime,
        color,
        roundNumber: candles.length + 1,
        payingMinute: dateObj.getMinutes(),
      };
      setCandles((prev) => [newCandle, ...prev]);
    }
  };

  // Reset Candles
  const handleResetCandles = async () => {
    try {
      const res = await fetch('/api/candles/reset', { method: 'POST' });
      if (res.ok) {
        const candlesRes = await fetch('/api/candles');
        const data = await candlesRes.json();
        setCandles(data.candles || []);
      }
    } catch {
      // ignore
    }
  };

  // Toggle Simulation and persist preference
  const handleToggleSimulation = (sim: boolean) => {
    setIsSimulating(sim);
    localStorage.setItem('aviator_is_simulating', String(sim));
  };

  // Batch Synchronize Candles with official game table
  const handleSyncBatch = async (
    inputText: string,
    replaceAll: boolean,
    secondsPerRound: number,
    newestFirst: boolean = true,
    lastExitTimestamp?: number
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/candles/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          multipliers: inputText,
          replaceAll,
          secondsPerRound,
          newestFirst,
          lastExitTimestamp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.candles)) {
          setCandles(data.candles);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Batch sync error:', err);
      return false;
    }
  };

  // Remove the last added candle
  const handleRemoveLastCandle = async () => {
    playClickSound();
    try {
      const res = await fetch('/api/candles/last', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.candles)) {
          setCandles(data.candles);
          return;
        }
      }
      setCandles((prev) => prev.slice(1));
    } catch {
      setCandles((prev) => prev.slice(1));
    }
  };

  // Simulated live round ticker
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Generate new realistic round according to Aviator odds
          const rand = Math.random();
          let mult = 1.0;
          if (rand < 0.08) {
            // Pink candle (10x - 45x)
            mult = Number((10.0 + Math.random() * 32.0).toFixed(2));
          } else if (rand < 0.44) {
            // Purple candle (2.0x - 8.5x)
            mult = Number((2.0 + Math.random() * 5.5).toFixed(2));
          } else {
            // Blue candle (1.00x - 1.98x)
            mult = Number((1.01 + Math.random() * 0.95).toFixed(2));
          }

          handleAddCandle(mult);
          return Math.floor(18 + Math.random() * 8); // Reset countdown to 18-26 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, candles.length]);

  // Request native browser permissions
  const handleRequestBrowserPermissions = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        return perm === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  };

  // Telegram test helper
  const handleTestTelegram = async (botToken: string, chatId: string) => {
    try {
      const res = await fetch('/api/notify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'telegram', botToken, chatId }),
      });
      return await res.json();
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Falha na conexão' };
    }
  };

  // Webhook test helper
  const handleTestWebhook = async (webhookUrl: string) => {
    try {
      const res = await fetch('/api/notify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'webhook', webhookUrl }),
      });
      return await res.json();
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Falha na conexão' };
    }
  };

  // Instant notification trigger from Surgical Tracker
  const handleSendInstantAlert = async (title: string, message: string) => {
    // 1. Browser push
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          body: message,
          icon: '/icon.svg',
        });
      } catch {
        // Ignore
      }
    }

    // 2. Telegram
    if (
      notificationSettings.telegram.enabled &&
      notificationSettings.telegram.botToken &&
      notificationSettings.telegram.chatId
    ) {
      try {
        const text = `🚨 <b>${title}</b>\n\n${message}\n\n<i>Aviator Radar Cirúrgico PWA</i>`;
        const res = await fetch('/api/notify/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: notificationSettings.telegram.botToken,
            chatId: notificationSettings.telegram.chatId,
            message: text,
          }),
        });
        const d = await res.json();
        setNotificationLogs((prev) => [
          {
            id: `log-${Date.now()}-tg`,
            timestamp: Date.now(),
            channel: 'telegram',
            status: d.success ? 'sent' : 'failed',
            title,
            message,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error('Telegram dispatch error:', err);
      }
    }

    // 3. Webhook
    if (notificationSettings.webhook.enabled && notificationSettings.webhook.url) {
      try {
        const res = await fetch('/api/notify/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: notificationSettings.webhook.url,
            payload: { title, message, timestamp: Date.now() },
          }),
        });
        const d = await res.json();
        setNotificationLogs((prev) => [
          {
            id: `log-${Date.now()}-wh`,
            timestamp: Date.now(),
            channel: 'webhook',
            status: d.success ? 'sent' : 'failed',
            title,
            message,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error('Webhook error:', err);
      }
    }

    setUnreadCount((c) => c + 1);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        unreadNotificationsCount={unreadCount}
        isSimulating={isSimulating}
        setIsSimulating={handleToggleSimulation}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenNotificationsModal={() => {
          setIsNotificationsModalOpen(true);
          setUnreadCount(0);
        }}
      />

      {/* Main Single-Screen Canvas: Focused Signal Monitor */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 sm:px-6 sm:py-5">
        <FocusedSignalMonitor
          candles={candles}
          statistics={statistics}
          currentSignal={currentSignal}
          onAddCandle={handleAddCandle}
          onRemoveLastCandle={handleRemoveLastCandle}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          notificationSettings={notificationSettings}
          onSendInstantAlert={handleSendInstantAlert}
        />
      </main>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        settings={notificationSettings}
        onUpdateSettings={handleUpdateSettings}
        logs={notificationLogs}
        onTestTelegram={handleTestTelegram}
        onTestWebhook={handleTestWebhook}
        onRequestBrowserPermissions={handleRequestBrowserPermissions}
        browserPermission={browserPermission}
      />

      {/* Table Synchronizer Modal */}
      <TableSynchronizerModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncBatch={handleSyncBatch}
        currentCandlesCount={candles.length}
      />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
