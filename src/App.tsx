/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, RadarSignal, StudyMethod } from './types/aviator';
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
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { AIChartScannerModal } from './components/AIChartScannerModal';
import { FutureCandlesRadar } from './components/FutureCandlesRadar';
import { CandleDetailsModal } from './components/CandleDetailsModal';
import { StrategyGuideModal } from './components/StrategyGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AIChartAnalysis, FuturePinkSignal, CandleRoundDetail } from './types/aviator';
import { Plane, Activity, Sparkles } from 'lucide-react';

export default function App() {
  // Real candles history (calibrated with 82b wall-clock)
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialHistory(25));
  
  // Selected study method (defaults to AUTO_BEST)
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod>('AUTO_BEST');

  // 82b calibration offset (-2 minutes by default to eliminate delay)
  const [calibrationOffset, setCalibrationOffset] = useState<number>(-2);

  // 82b Pattern Radar Signal (Next Candle to enter)
  const [signal, setSignal] = useState<RadarSignal>(() => calculateNextSignal(candles, 'AUTO_BEST', -2));
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);

  // Browser / background notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return backgroundService.isPermissionGranted();
  });

  // Modals
  const [selectedCandle, setSelectedCandle] = useState<Candle | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isImageScannerOpen, setIsImageScannerOpen] = useState(false);

  // Active Main View (Live radar vs 7h/12h/24h Future Predictions)
  const [activeView, setActiveView] = useState<'LIVE' | 'FUTURE_FORECAST'>('LIVE');

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
            const isPinkSig = updated.candleType === 'ROSA' || updated.candleType === 'SUPER_ROSA';
            backgroundService.sendNotification(
              isPinkSig 
                ? `🌸 ALERTA ESTUDOS: VELA ROSA NO MINUTO :${String(updated.targetMinute).padStart(2, '0')}!` 
                : `⚡ ALERTA ESTUDOS: VELA ROXA NO MINUTO :${String(updated.targetMinute).padStart(2, '0')}!`,
              `Entrada exata às ${updated.targetTimeStr}:${String(updated.targetSeconds).padStart(2, '0')}. Alvo: ${updated.targetMultiplier}.`,
              `prep-${updated.targetMinute}`
            );
          } else if (updated.phase === 'ACTIVE_ENTRY') {
            soundFx.playAlertSignal();
            const isPinkSig = updated.candleType === 'ROSA' || updated.candleType === 'SUPER_ROSA';
            backgroundService.sendNotification(
              `🟢 ENTRAR AGORA NO MINUTO :${String(updated.targetMinute).padStart(2, '0')}!`,
              isPinkSig
                ? `Rodada iniciada no Aviator 82b! Alvo: ${updated.targetMultiplier}.`
                : `Rodada iniciada no Aviator 82b! Alvo: Vela Roxa.`,
              `active-${updated.targetMinute}`
            );
          } else if (updated.phase === 'GALE_PROTECTION') {
            soundFx.playRadarSweep();
            backgroundService.sendNotification(
              `🛡️ PROTEÇÃO GALE NO MINUTO :${String(updated.galeMinute).padStart(2, '0')}!`,
              `Rodada esticou para o minuto :${String(updated.galeMinute).padStart(2, '0')}. Mantenha a aposta com auto cashout no 1.49x/2.00x!`,
              `gale-${updated.galeMinute}`
            );
          }
          prevPhaseRef.current = updated.phase;
        }

        // When minute and gale have concluded, automatically project next paying window
        if (updated.phase === 'STANDBY') {
          return calculateNextSignal(candles, selectedMethod, calibrationOffset);
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
  }, [candles, selectedMethod, calibrationOffset]);

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
      seconds: now.getSeconds(),
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
        setSignal(calculateNextSignal([...candles, newCandle], selectedMethod, calibrationOffset));
      }, 7000);
    } else {
      // Re-calibrate signal based on the freshly added 82b candle
      setSignal(calculateNextSignal([...candles, newCandle], selectedMethod, calibrationOffset));
    }
  }, [candles, signal, selectedMethod, calibrationOffset]);

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
        setSignal(calculateNextSignal(candles, selectedMethod, calibrationOffset));
      }, 7000);
    } else {
      soundFx.playClick();
      setSignal(calculateNextSignal(candles, selectedMethod, calibrationOffset));
    }
  }, [candles, signal, selectedMethod, calibrationOffset]);

  // 4. Select study method
  const handleSelectMethod = useCallback((method: StudyMethod) => {
    setSelectedMethod(method);
    soundFx.playClick();
    setSignal(calculateNextSignal(candles, method, calibrationOffset));
  }, [candles, calibrationOffset]);

  // 5. Select 82b calibration offset (-2m, -3m, etc.)
  const handleSelectCalibrationOffset = useCallback((offset: number) => {
    setCalibrationOffset(offset);
    soundFx.playClick();
    setSignal(calculateNextSignal(candles, selectedMethod, offset));
  }, [candles, selectedMethod]);

  // 6. Automatic Recalibration
  const handleAutoRecalibrate = useCallback(() => {
    soundFx.playRadarSweep();
    setSignal(calculateNextSignal(candles, selectedMethod, calibrationOffset));
  }, [candles, selectedMethod, calibrationOffset]);

  // 7. Handle Candles Imported from Gemini Multimodal Chart Analysis (with round details and decimals)
  const handleImportCandlesFromAI = useCallback((multipliers: number[], roundDetails?: CandleRoundDetail[]) => {
    if (!multipliers || multipliers.length === 0) return;
    const now = Date.now();
    const newCandles: Candle[] = multipliers.map((mult, idx) => {
      const candleTime = new Date(now - (multipliers.length - 1 - idx) * 35000);
      const color = getCandleColor(mult);
      const detail = roundDetails && roundDetails[idx];
      let roundId = Math.floor(812600 + candles.length + idx + 1);
      if (detail?.roundNumber) {
        const parsed = parseInt(detail.roundNumber.replace(/\D/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          roundId = parsed;
        }
      }
      return {
        id: `ai-candle-${roundId}-${idx}`,
        roundId,
        multiplier: mult,
        timestamp: candleTime.getTime(),
        timeFormatted: formatTime(candleTime),
        minute: candleTime.getMinutes(),
        seconds: candleTime.getSeconds(),
        color,
        hash: `${roundId}_82b_ai_${idx}`,
      };
    });

    soundFx.playPurpleWin();
    setCandles((prev) => {
      const merged = [...prev, ...newCandles];
      return merged.slice(-40);
    });

    setTimeout(() => {
      setSignal(calculateNextSignal([...candles, ...newCandles], selectedMethod, calibrationOffset));
    }, 100);
  }, [candles, selectedMethod, calibrationOffset]);

  // 8. Handle Direct AI Prediction Applied from Image Scanner (incorporating decimal analysis)
  const handleApplyAIPrediction = useCallback((analysis: AIChartAnalysis) => {
    soundFx.playAlertSignal();
    const decimalExtra = analysis.decimalFormula 
      ? ` • Subtração: ${analysis.decimalFormula.subtractionMath}` 
      : '';
    setSignal((prev) => ({
      ...prev,
      candleType: analysis.targetCandle,
      targetMultiplier: analysis.targetMultiplier,
      confidence: analysis.confidence,
      triggerName: `IA Gemini: ${analysis.dominantPattern}${decimalExtra}`,
      instructions: `${analysis.entryStrategy}${analysis.decimalFormula ? ` [Entrada: ${analysis.decimalFormula.projectedMinute}]` : ''}`,
      protectionAdvice: analysis.protectionAdvice,
    }));
  }, []);

  // 9. Handle Selection of a Future Pink Signal to load directly into the Active Radar
  const handleSelectFutureSignalForEntry = useCallback((futureSig: FuturePinkSignal) => {
    soundFx.playAlertSignal();
    setSignal((prev) => ({
      ...prev,
      candleType: futureSig.category === 'SUPER_ROSA_100X' ? 'SUPER_ROSA' : 'ROSA',
      targetMultiplier: futureSig.targetMultiplierLabel,
      targetHour: futureSig.targetHour,
      targetMinute: futureSig.targetMinute,
      targetSeconds: futureSig.targetSeconds,
      targetTimeStr: `${String(futureSig.targetHour).padStart(2, '0')}:${String(futureSig.targetMinute).padStart(2, '0')}`,
      targetTimestamp: futureSig.targetTimestamp,
      triggerName: `Futura 100x+: ${futureSig.patternRule}`,
      instructions: `Entrada Programada 82b: ${futureSig.recommendedEntryMinute}`,
      protectionAdvice: futureSig.protectionStrategy,
      confidence: futureSig.confidence,
      phase: 'PREPARING',
    }));
    setActiveView('LIVE');
  }, []);

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
        onOpenImageScanner={() => setIsImageScannerOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        activeView={activeView}
        onToggleView={setActiveView}
      />

      {/* Top 82b Candle Sync Ribbon with Quick Match Buttons */}
      <CandleTape
        candles={candles}
        onSelectCandle={(c) => setSelectedCandle(c)}
        onAddCandle={handleAddCandleFromUser}
        onClearAndSync={handleAutoRecalibrate}
      />

      {/* View Switcher Sub-nav Bar (Mobile & Desktop) */}
      <div className={`w-full mx-auto px-3 sm:px-4 pt-3 transition-all duration-300 ${activeView === 'FUTURE_FORECAST' ? 'max-w-6xl' : 'max-w-2xl'}`}>
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setActiveView('LIVE')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeView === 'LIVE'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 text-rose-300" />
            <span>Radar Ao Vivo (Minuto a Minuto)</span>
          </button>

          <button
            onClick={() => setActiveView('FUTURE_FORECAST')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeView === 'FUTURE_FORECAST'
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-pink-950/60'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Velas Futuras 7h • 12h • 24h</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/30 uppercase font-black">
              100x+
            </span>
          </button>
        </div>
      </div>

      {/* Main Single-Focused Centerpiece */}
      <main className={`flex-1 ${activeView === 'FUTURE_FORECAST' ? 'max-w-6xl' : 'max-w-2xl'} w-full mx-auto px-3 sm:px-4 py-4 flex flex-col justify-center space-y-4 transition-all duration-300`}>
        
        {activeView === 'LIVE' ? (
          <>
            {/* THE HERO: Next Candle Alert Card with Live Typing Preview & 82b Calibration */}
            <NextCandleAlertCard
              signal={signal}
              latestCandle={candles[candles.length - 1] || null}
              currentTimeStr={currentTimeStr}
              selectedMethod={selectedMethod}
              calibrationOffset={calibrationOffset}
              onSelectMethod={handleSelectMethod}
              onSelectCalibrationOffset={handleSelectCalibrationOffset}
              onAutoRecalibrate={handleAutoRecalibrate}
              onRegisterResult={handleRegisterResult}
              onAddCandle={handleAddCandleFromUser}
              onOpenGuide={() => setIsGuideOpen(true)}
              onOpenImageScanner={() => setIsImageScannerOpen(true)}
            />

            {/* AI Assistant Panel: Real-time Round Analysis & Strategy Chat */}
            <AIAssistantPanel
              candles={candles}
              currentSignal={signal}
              onOpenImageScanner={() => setIsImageScannerOpen(true)}
              onApplyAIPrediction={handleApplyAIPrediction}
            />

            {/* Background Notifications Card */}
            <BackgroundStatusCard
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
            />
          </>
        ) : (
          /* Future Pink Predictions (7h, 12h, 24h) */
          <FutureCandlesRadar
            candles={candles}
            onSelectSignalForEntry={handleSelectFutureSignalForEntry}
          />
        )}

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-rose-950/60 bg-[#090412] py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-rose-500 -rotate-45" />
            <span className="font-bold text-slate-300">Radar Aviator 82b.game — Estudos Módulos I a V</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-mono">● SINCRONIZADO EM SEGUNDO PLANO</span>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Apostilas dos Estudos
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

      {/* AI Chart Scanner / Multimodal Vision Modal */}
      <AIChartScannerModal
        isOpen={isImageScannerOpen}
        onClose={() => setIsImageScannerOpen(false)}
        onImportCandles={handleImportCandlesFromAI}
        onApplyAIPrediction={handleApplyAIPrediction}
      />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />

    </div>
  );
}
