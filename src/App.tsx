import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { RoundsHistoryBar } from './components/RoundsHistoryBar';
import { ActiveSignalCard } from './components/ActiveSignalCard';
import { LiveFlightRadar } from './components/LiveFlightRadar';
import { MinuteHeatmap } from './components/MinuteHeatmap';
import { SignalsHistory } from './components/SignalsHistory';
import { BankrollCalculator } from './components/BankrollCalculator';
import { ManualEntryModal } from './components/ManualEntryModal';
import { StrategyGuideModal } from './components/StrategyGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BetaoSyncBar } from './components/BetaoSyncBar';
import { ModeSelector } from './components/ModeSelector';
import { VoiceNotificationBanner } from './components/VoiceNotificationBanner';
import { RoundData, TriggerSignal, ConfidenceMode } from './types';
import {
  generateInitialRounds,
  analyzeTriggers,
  calculateMinuteHeatmap,
  calculateGlobalStats,
  calculateTableClimate,
  formatTime,
} from './utils/aviatorEngine';
import { soundEffects } from './utils/audio';
import { notificationService } from './utils/notifications';
import { BackgroundTicker } from './utils/workerTicker';
import { HelpCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [rounds, setRounds] = useState<RoundData[]>(() => generateInitialRounds(50));
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [confidenceMode, setConfidenceMode] = useState<ConfidenceMode>('SNIPER_CONSERVADOR');
  const [activeSignal, setActiveSignal] = useState<TriggerSignal | null>(null);
  const [signalsHistory, setSignalsHistory] = useState<TriggerSignal[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(soundEffects.enabled);
  const [isAutoFeed, setIsAutoFeed] = useState<boolean>(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  const prevSignalIdRef = useRef<string | null>(null);
  const prevSecondRef = useRef<number>(-1);
  const hasSpokenPrepareRef = useRef<string | null>(null);
  const hasSpokenEnterRef = useRef<string | null>(null);

  // Desbloquear motor de áudio e fala no primeiro clique ou toque na tela
  useEffect(() => {
    const handleUnlock = () => {
      soundEffects.unlock();
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
    };
    window.addEventListener('click', handleUnlock);
    window.addEventListener('touchstart', handleUnlock);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        notificationService.resetTabTitle();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Relógio Atômico em Tempo Real via Web Worker Ticker (imune a congelamento em segundo plano)
  useEffect(() => {
    const ticker = new BackgroundTicker();

    ticker.start((timestamp) => {
      const now = new Date(timestamp);
      setCurrentDate(now);

      const sec = now.getSeconds();
      const currentMin = now.getMinutes();

      // Alerta de Preparação no Betão (quando faltam 15 segundos para o minuto alvo)
      if (activeSignal && activeSignal.targetMinute === (currentMin + 1) % 60 && sec === 45) {
        const prepareKey = `${activeSignal.id}-prepare-${activeSignal.targetMinute}`;
        if (hasSpokenPrepareRef.current !== prepareKey) {
          hasSpokenPrepareRef.current = prepareKey;
          soundEffects.playPrepareWarning();
          soundEffects.speakVoice(
            `Atenção! Faltam 15 segundos para o minuto ${activeSignal.targetMinuteFormatted} no Betão. Prepare a aposta!`
          );
          notificationService.notifyPrepare(activeSignal.targetMinuteFormatted, 15);
        }
      }

      // Alerta de Entrada Ativa no Betão (no segundo :00 do minuto alvo)
      if (activeSignal && activeSignal.targetMinute === currentMin && sec === 0) {
        const enterKey = `${activeSignal.id}-enter-${activeSignal.targetMinute}`;
        if (hasSpokenEnterRef.current !== enterKey) {
          hasSpokenEnterRef.current = enterKey;
          soundEffects.playSignalAlert();
          soundEffects.speakVoice(
            `Entrada confirmada agora no Betão! Minuto ${activeSignal.targetMinuteFormatted}. Saída de segurança em ${activeSignal.recommendedSafeExit.toFixed(2)}x!`
          );
          notificationService.notifyEnter(
            activeSignal.targetMinuteFormatted,
            activeSignal.recommendedSafeExit,
            activeSignal.probability
          );
        }
      }

      // Tick sonoro nos últimos 3 segundos antes da virada do minuto
      if (sec >= 57 && sec !== prevSecondRef.current) {
        prevSecondRef.current = sec;
        soundEffects.playTick();
      }
    });

    return () => {
      ticker.stop();
    };
  }, [activeSignal]);

  // Recalcular gatilhos com base no modo selecionado e rodadas
  useEffect(() => {
    const signal = analyzeTriggers(rounds, currentDate, confidenceMode);
    setActiveSignal(signal);

    // Se um novo sinal foi detectado e for diferente do anterior, tocar alerta sonoro e falar
    if (signal && signal.id !== prevSignalIdRef.current) {
      prevSignalIdRef.current = signal.id;
      soundEffects.playSignalAlert();
      soundEffects.speakVoice(
        `Novo gatilho Sniper Betão detectado: Minuto ${signal.targetMinuteFormatted} com ${signal.probability}% de probabilidade!`
      );
      notificationService.sendNotification({
        title: `🎯 NOVO GATILHO BETÃO: Minuto ${signal.targetMinuteFormatted}`,
        body: `Alvo projetado: ${signal.recommendedSafeExit.toFixed(2)}x. Probabilidade: ${signal.probability}%.`,
        tag: 'betao-new-signal',
      });

      // Adicionar à lista de sinais se não existir
      setSignalsHistory((prev) => {
        if (prev.some((s) => s.id === signal.id)) return prev;
        return [...prev, signal];
      });
    }
  }, [rounds, currentDate.getMinutes(), confidenceMode]);

  // Manipulador para nova rodada finalizada
  const handleNewRound = (newRound: RoundData) => {
    setRounds((prev) => [...prev.slice(-99), newRound]);

    // Verificar se a nova rodada bateu a meta de algum sinal ativo
    if (activeSignal && activeSignal.targetMinute === newRound.minute) {
      const isGreen = newRound.multiplier >= activeSignal.recommendedSafeExit;
      if (isGreen) {
        soundEffects.playGreenCelebration();
        soundEffects.speakVoice(
          `Green confirmado no Betão! Vela ${newRound.multiplier.toFixed(2)}x!`
        );
        notificationService.notifyGreen(newRound.multiplier);
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F43F5E', '#A855F7', '#F59E0B'],
        });
      }

      setSignalsHistory((prev) =>
        prev.map((s) => {
          if (s.id === activeSignal.id && s.status !== 'GREEN' && s.status !== 'RED') {
            return {
              ...s,
              status: isGreen ? 'GREEN' : 'RED',
              resultMultiplier: newRound.multiplier,
            };
          }
          return s;
        })
      );
    }
  };

  // Importação em lote de velas reais do Betão
  const handleBatchAddRounds = (newRounds: RoundData[]) => {
    setRounds((prev) => [...prev.slice(-(100 - newRounds.length)), ...newRounds]);
    soundEffects.playBeep(800, 0.15, 'triangle');
  };

  // Validar Green manualmente
  const handleConfirmGreen = (signalId: string) => {
    soundEffects.playGreenCelebration();
    soundEffects.speakVoice('Green validado com sucesso!');
    notificationService.sendNotification({
      title: '🎉 GREEN VALIDADO NO BETÃO!',
      body: 'Gatilho confirmado e computado no seu histórico de acertos.',
      tag: 'betao-manual-green',
    });
    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#10B981', '#06B6D4', '#E11D48', '#F59E0B'],
    });

    setSignalsHistory((prev) =>
      prev.map((s) => {
        if (s.id === signalId) {
          return {
            ...s,
            status: 'GREEN',
            resultMultiplier: s.resultMultiplier || 2.5,
          };
        }
        return s;
      })
    );
  };

  const handleToggleAudio = () => {
    const updated = soundEffects.toggleSound();
    setIsAudioEnabled(updated);
  };

  const currentMinute = currentDate.getMinutes();
  const currentSecond = currentDate.getSeconds();
  const currentTimeFormatted = formatTime(currentDate);

  const tableClimate = calculateTableClimate(rounds);

  const heatmapData = calculateMinuteHeatmap(
    rounds,
    currentMinute,
    activeSignal?.targetMinute
  );

  const stats = calculateGlobalStats(rounds, signalsHistory);

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white pb-12">
      {/* Top Header */}
      <Header
        currentTime={currentTimeFormatted}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        winRate={stats.winRate}
        currentStreak={stats.currentStreak}
      />

      {/* Aviator Horizontal Multipliers Bar */}
      <RoundsHistoryBar
        rounds={rounds}
        onOpenManualModal={() => setIsManualModalOpen(true)}
      />

      {/* Main Content Dashboard */}
      <main className="mx-auto w-full max-w-7xl px-3 sm:px-6 pt-3 sm:pt-5 space-y-4 sm:space-y-5 flex-1">
        {/* Banner de Notificações em Segundo Plano & Desbloqueio de Voz */}
        <VoiceNotificationBanner onUnlockAudio={() => soundEffects.unlock()} />

        {/* Barra de Sincronia Instantânea com a Mesa do Betão */}
        <BetaoSyncBar
          climate={tableClimate}
          onAddRound={handleNewRound}
          onBatchAddRounds={handleBatchAddRounds}
          onSyncClock={() => setCurrentDate(new Date())}
        />

        {/* Seletor de Modo de Probabilidade (Sniper 98% / Moderado / Rosa) */}
        <ModeSelector
          currentMode={confidenceMode}
          onSelectMode={(mode) => setConfidenceMode(mode)}
        />

        {/* Banner de Status & Guia */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900/60 to-purple-950/40 border border-rose-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-ping" />
            <span className="text-slate-300">
              Radar conectado aos minutos <strong className="text-orange-400 font-extrabold">do Betão</strong>. <strong className="text-white">Minuto Atual: :{String(currentMinute).padStart(2, '0')}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="open-strategy-guide-button"
              onClick={() => setIsGuideModalOpen(true)}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-4"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Como funcionam os minutos?</span>
            </button>
          </div>
        </div>

        {/* Top Operational Section: Active Signal + Live Flight Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Signal Card (Principal) */}
          <div className="lg:col-span-7">
            <ActiveSignalCard
              signal={activeSignal}
              currentMinute={currentMinute}
              currentSecond={currentSecond}
              onConfirmGreen={handleConfirmGreen}
            />
          </div>

          {/* Live Flight Radar Simulator */}
          <div className="lg:col-span-5">
            <LiveFlightRadar
              onNewRound={handleNewRound}
              isAutoFeed={isAutoFeed}
              onToggleAutoFeed={() => setIsAutoFeed((prev) => !prev)}
            />
          </div>
        </div>

        {/* 60-Minute Heatmap Grid */}
        <MinuteHeatmap
          heatmapData={heatmapData}
          currentMinute={currentMinute}
          targetMinute={activeSignal?.targetMinute}
        />

        {/* Bottom Section: Signals History + Dual-Bet Bankroll Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Signals History Feed */}
          <div className="lg:col-span-7">
            <SignalsHistory
              signals={signalsHistory}
              winRate={stats.winRate}
              totalGreens={stats.totalGreens}
              totalReds={stats.totalReds}
            />
          </div>

          {/* Betão Dual Bet & Bankroll Strategy */}
          <div className="lg:col-span-5">
            <BankrollCalculator />
          </div>
        </div>
      </main>

      {/* Modals & Offline Indicator */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddRound={handleNewRound}
      />

      <StrategyGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <OfflineIndicator />

      {/* Subtle Footer */}
      <footer className="mt-8 border-t border-slate-900 px-4 py-4 text-center text-[11px] text-slate-500">
        <p>Gatilhos de Minutos Aviator no Betão PWA • Sistema probabilístico analítico em tempo real • Jogue com responsabilidade</p>
      </footer>
    </div>
  );
}
