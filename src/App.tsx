/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, RadarSignal, PatternInterval } from './types/aviator';
import { 
  generateInitialHistory, 
  calculateNextSignal, 
  updateSignalWithCurrentTime,
  getCandleColor,
  formatTime
} from './utils/aviatorEngine';
import { soundFx } from './utils/audio';
import { backgroundService } from './utils/backgroundNotificationService';
import { Navbar } from './components/Navbar';
import { CandleTape } from './components/CandleTape';
import { NextCandleAlertCard } from './components/NextCandleAlertCard';
import { BackgroundStatusCard } from './components/BackgroundStatusCard';
import { CandleDetailsModal } from './components/CandleDetailsModal';
import { StrategyGuideModal } from './components/StrategyGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Plane } from 'lucide-react';

export default function App() {
  // Real candles history (calibrated with 82b wall-clock)
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialHistory(25));
  
  // Selected 82b pattern interval (3, 4, or 5 minutes)
  const [selectedPattern, setSelectedPattern] = useState<PatternInterval>(3);

  // 82b Pattern Radar Signal (Next Candle to enter)
  const [signal, setSignal] = useState<RadarSignal>(() => calculateNextSignal(candles, 3));
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);

  // Browser / background notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return backgroundService.isPermissionGranted();
  });

  // Modals
  const [selectedCandle, setSelectedCandle] = useState<Candle | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Current formatted time (HH:mm:ss)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => formatTime(new Date()));

  const prevPhaseRef = useRef(signal.phase);

  // 1. Background Web Worker Tick: Runs continuously even when minimized or in another tab!
  useEffect(() => {
    const unsubscribeWorker = backgroundService.onTick((timestamp) => {
      const now = new Date(timestamp);
      setCurrentTimeStr(formatTime(now));

      setSignal((prevSignal) => {
        const updated = updateSignalWithCurrentTime(prevSignal);

        // State transition detection & Background Notifications
        if (prevPhaseRef.current !== updated.phase) {
          if (updated.phase === 'PREPARING') {
            soundFx.playRadarSweep();
            const isPinkSig = updated.candleType === 'ROSA';
            backgroundService.sendNotification(
              isPinkSig 
                ? `🌸 ALERTA: VELA ROSA NO MINUTO :${String(updated.targetMinute).padStart(2, '0')}!` 
                : `⚡ ALERTA: VELA ROXA NO MINUTO :${String(updated.targetMinute).padStart(2, '0')}!`,
              isPinkSig
                ? `Entrada às ${updated.targetTimeStr}:00 na 82b! Busque 10.00x+.`
                : `Entrada às ${updated.targetTimeStr}:00 na 82b! Auto Cashout no 2.00x.`,
              `prep-${updated.targetMinute}`
            );
          } else if (updated.phase === 'ACTIVE_ENTRY') {
            soundFx.playAlertSignal();
            const isPinkSig = updated.candleType === 'ROSA';
            backgroundService.sendNotification(
              `🟢 ENTRAR AGORA NO MINUTO :${String(updated.targetMinute).padStart(2, '0')}!`,
              isPinkSig
                ? `Rodada iniciada no Aviator 82b! Alvo: Vela Rosa (10.00x+).`
                : `Rodada iniciada no Aviator 82b! Alvo: Vela Roxa (2.00x).`,
              `active-${updated.targetMinute}`
            );
          } else if (updated.phase === 'GALE_PROTECTION') {
            soundFx.playRadarSweep();
            backgroundService.sendNotification(
              `🛡️ PROTEÇÃO GALE NO MINUTO :${String(updated.galeMinute).padStart(2, '0')}!`,
              `Rodada esticou para o minuto :${String(updated.galeMinute).padStart(2, '0')}. Mantenha a aposta com auto cashout no 2.00x!`,
              `gale-${updated.galeMinute}`
            );
          }
          prevPhaseRef.current = updated.phase;
        }

        // When minute and gale have concluded, automatically project next paying window
        if (updated.phase === 'STANDBY') {
          return calculateNextSignal(candles, selectedPattern);
        }

        return updated;
      });
    });

    // Page Visibility listener: resync immediately when switching back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = new Date();
        setCurrentTimeStr(formatTime(now));
        setSignal((prev) => updateSignalWithCurrentTime(prev));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeWorker();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [candles, selectedPattern]);

  // 2. User adds/syncs a candle that just appeared on 82b.game
  const handleAddCandleFromUser = useCallback((multiplier: number) => {
    const now = new Date();
    const color = getCandleColor(multiplier);
    const roundId = Math.floor(812600 + candles.length + 1);

    const newCandle: Candle = {
      id: `candle-${Date.now()}`,
      roundId,
      multiplier,
      timestamp: now.getTime(),
      timeFormatted: formatTime(now),
      minute: now.getMinutes(),
      color,
      hash: `${roundId}_82b_${Date.now()}`,
    };

    if (color === 'pink') {
      soundFx.playPinkWin();
      backgroundService.sendNotification(
        '🔥 VELA ROSA REGISTRADA NA 82B!',
        `Multiplicador de ${multiplier.toFixed(2)}x às ${newCandle.timeFormatted}!`,
        `pink-${Date.now()}`
      );
    } else if (color === 'purple') {
      soundFx.playPurpleWin();
    } else {
      soundFx.playClick();
    }

    setCandles((prev) => {
      const next = [...prev, newCandle];
      return next.slice(-40);
    });

    // Check if candle matches target minute OR gale protection minute
    const currentMin = now.getMinutes();
    const isTargetMin = currentMin === signal.targetMinute || currentMin === signal.galeMinute;
    const isWin = multiplier >= 2.0;

    if (isTargetMin && isWin) {
      if (multiplier >= 10.0) {
        soundFx.playPinkWin();
      } else {
        soundFx.playPurpleWin();
      }

      backgroundService.sendNotification(
        `✅ GREEN CONFIRMADO!`,
        `Vela de ${multiplier.toFixed(2)}x confirmada no Aviator 82b!`,
        `win-${signal.targetMinute}`
      );

      setSignal((prev) => ({
        ...prev,
        phase: 'WIN',
        resultCandle: newCandle,
      }));

      setTimeout(() => {
        setSignal(calculateNextSignal([...candles, newCandle], selectedPattern));
      }, 7000);
    } else {
      // Re-calibrate signal based on the freshly added 82b candle
      setSignal(calculateNextSignal([...candles, newCandle], selectedPattern));
    }
  }, [candles, signal, selectedPattern]);

  // 3. User registers Green or Recalculate
  const handleRegisterResult = useCallback((isWin: boolean) => {
    if (isWin) {
      soundFx.playPinkWin();
      backgroundService.sendNotification(
        `✅ GREEN CONFIRMADO!`,
        `Vitória registrada com lucro no Aviator 82b!`,
        `win-${signal.targetMinute}`
      );
      setSignal((prev) => ({
        ...prev,
        phase: 'WIN',
      }));
      setTimeout(() => {
        setSignal(calculateNextSignal(candles, selectedPattern));
      }, 7000);
    } else {
      soundFx.playClick();
      setSignal(calculateNextSignal(candles, selectedPattern));
    }
  }, [candles, signal, selectedPattern]);

  // 4. Select pattern (3, 4, or 5 minutes)
  const handleSelectPattern = useCallback((pattern: PatternInterval) => {
    setSelectedPattern(pattern);
    soundFx.playClick();
    setSignal(calculateNextSignal(candles, pattern));
  }, [candles]);

  // 5. Automatic Recalibration
  const handleAutoRecalibrate = useCallback(() => {
    soundFx.playRadarSweep();
    setSignal(calculateNextSignal(candles, selectedPattern));
  }, [candles, selectedPattern]);

  // Toggle Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
  };

  // Toggle / Request Notifications
  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de sistema.');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      backgroundService.sendNotification(
        '🔔 Alertas em Segundo Plano Ativos!',
        'Você será notificado com som e vibração antes de cada entrada.',
        'status-test'
      );
    } else {
      const granted = await backgroundService.requestPermission();
      setNotificationsEnabled(granted);
    }
  };

  return (
    <div className="min-h-screen bg-[#070310] text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white pb-8">
      
      {/* Top Navbar */}
      <Navbar
        onOpenGuide={() => setIsGuideOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
      />

      {/* Top 82b Candle Sync Ribbon with Quick Match Buttons */}
      <CandleTape
        candles={candles}
        onSelectCandle={(c) => setSelectedCandle(c)}
        onAddCandle={handleAddCandleFromUser}
        onClearAndSync={handleAutoRecalibrate}
      />

      {/* Main Single-Focused Centerpiece */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3 sm:px-4 py-5 flex flex-col justify-center space-y-4">
        
        {/* THE HERO: Next Candle Alert Card */}
        <NextCandleAlertCard
          signal={signal}
          latestCandle={candles[candles.length - 1] || null}
          currentTimeStr={currentTimeStr}
          onSelectPattern={handleSelectPattern}
          onAutoRecalibrate={handleAutoRecalibrate}
          onRegisterResult={handleRegisterResult}
          onAddCandle={handleAddCandleFromUser}
        />

        {/* Background Notifications Card */}
        <BackgroundStatusCard
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
        />

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-rose-950/60 bg-[#090412] py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-rose-500 -rotate-45" />
            <span className="font-bold text-slate-300">Radar Aviator 82b.game</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-mono">● SINCRONIZADO EM SEGUNDO PLANO</span>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Ajuda / Dicas
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CandleDetailsModal
        candle={selectedCandle}
        onClose={() => setSelectedCandle(null)}
      />

      <StrategyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />

    </div>
  );
}
