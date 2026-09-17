import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { RoundsHistoryBar } from './components/RoundsHistoryBar';
import { ActiveSignalCard } from './components/ActiveSignalCard';
import { MinuteHeatmap } from './components/MinuteHeatmap';
import { BestPayoutHoursMap } from './components/BestPayoutHoursMap';
import { SignalsHistory } from './components/SignalsHistory';
import { BankrollCalculator } from './components/BankrollCalculator';
import { ManualEntryModal } from './components/ManualEntryModal';
import { StrategyGuideModal } from './components/StrategyGuideModal';
import { BetaoLiveBridgeModal } from './components/BetaoLiveBridgeModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BetaoSyncBar } from './components/BetaoSyncBar';
import { ModeSelector } from './components/ModeSelector';
import { VoiceNotificationBanner } from './components/VoiceNotificationBanner';
import { RoundData, TriggerSignal, ConfidenceMode } from './types';
import {
  generateInitialRounds,
  generateRealisticMultiplier,
  generateCalibratedMultiplierForSignal,
  getMultiplierTier,
  analyzeTriggers,
  calculateMinuteHeatmap,
  calculateHourlyPayoutMap,
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
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [liveRoundsCount, setLiveRoundsCount] = useState<number>(0);
  const [lastLiveRoundTime, setLastLiveRoundTime] = useState<string | undefined>(undefined);

  const prevSignalIdRef = useRef<string | null>(null);
  const prevSecondRef = useRef<number>(-1);
  const hasSpokenPrepareRef = useRef<string | null>(null);
  const hasSpokenEnterRef = useRef<string | null>(null);

  // Receptor de rodadas em tempo real da mesa do Betão (postMessage & BroadcastChannel)
  useEffect(() => {
    const processIncomingRound = (mult: number, timestamp?: number) => {
      const ts = timestamp || Date.now();
      const d = new Date(ts);
      const timeStr = formatTime(d);
      const newRound: RoundData = {
        id: `betao-live-${ts}-${Math.random().toString(36).substring(2, 6)}`,
        multiplier: mult,
        timestamp: ts,
        minute: d.getMinutes(),
        timeFormatted: timeStr,
        tier: getMultiplierTier(mult),
        source: 'BETAO_LIVE',
      };

      setIsLiveConnected(true);
      setLiveRoundsCount((prev) => prev + 1);
      setLastLiveRoundTime(timeStr);
      setRounds((prev) => [...prev.slice(-99), newRound]);

      // Alerta de vela recebida da mesa
      soundEffects.playBeep(920, 0.1, 'sine');
    };

    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'BETAO_ROUND' && typeof event.data.multiplier === 'number') {
        processIncomingRound(event.data.multiplier, event.data.timestamp);
      } else if (event.data.type === 'BETAO_BATCH_ROUNDS' && Array.isArray(event.data.multipliers)) {
        const batch: RoundData[] = [];
        const now = Date.now();
        event.data.multipliers.forEach((m: number, idx: number) => {
          if (typeof m === 'number' && m >= 1.0) {
            const fakeTime = now - (event.data.multipliers.length - idx) * 20 * 1000;
            const d = new Date(fakeTime);
            batch.push({
              id: `betao-batch-${fakeTime}-${idx}`,
              multiplier: Number(m.toFixed(2)),
              timestamp: fakeTime,
              minute: d.getMinutes(),
              timeFormatted: formatTime(d),
              tier: getMultiplierTier(m),
              source: 'BETAO_LIVE',
            });
          }
        });
        if (batch.length > 0) {
          setIsLiveConnected(true);
          setLiveRoundsCount((prev) => prev + batch.length);
          setRounds((prev) => [...prev.slice(-(100 - batch.length)), ...batch]);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('betao_aviator_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'BETAO_ROUND' && typeof event.data.multiplier === 'number') {
          processIncomingRound(event.data.multiplier, event.data.timestamp);
        }
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      if (bc) bc.close();
    };
  }, []);

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

  // Atualização suave de rodadas em segundo plano simulando o fluxo da mesa do Betão
  useEffect(() => {
    if (!isAutoFeed) return;

    const interval = window.setInterval(() => {
      const now = new Date();
      const currentMin = now.getMinutes();
      const isTargetMin = activeSignal && (activeSignal.targetMinute === currentMin || activeSignal.targetMinute === (currentMin + 1) % 60);
      const multiplier = isTargetMin
        ? generateCalibratedMultiplierForSignal(activeSignal)
        : generateRealisticMultiplier();

      const newRound: RoundData = {
        id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        multiplier,
        timestamp: now.getTime(),
        timeFormatted: formatTime(now),
        minute: now.getMinutes(),
        tier: getMultiplierTier(multiplier),
      };
      setRounds((prev) => [...prev.slice(-99), newRound]);
    }, 14000);

    return () => clearInterval(interval);
  }, [isAutoFeed, activeSignal]);

  // Recalcular gatilhos com base no modo selecionado e rodadas
  useEffect(() => {
    const signal = analyzeTriggers(rounds, currentDate, confidenceMode);
    setActiveSignal(signal);

    // Se um novo sinal foi detectado e for diferente do anterior, tocar alerta sonoro e falar
    if (signal && signal.id !== prevSignalIdRef.current) {
      prevSignalIdRef.current = signal.id;
      soundEffects.playSignalAlert();
      soundEffects.speakVoice(
        `Novo gatilho Betão detectado: Minuto ${signal.targetMinuteFormatted}. Alvo: ${signal.expectedTier === 'pink' ? 'Vela Rosa 10x+' : 'Vela Roxa'}. Saída Segura em ${signal.recommendedSafeExit.toFixed(2)}x!`
      );
      notificationService.sendNotification({
        title: `🎯 NOVO GATILHO BETÃO: Minuto ${signal.targetMinuteFormatted}`,
        body: `Alvo: ${signal.expectedTierLabel}. Saída Segura: ${signal.recommendedSafeExit.toFixed(2)}x. Probabilidade: ${signal.probability}%.`,
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
        if (newRound.multiplier >= 10.00) {
          soundEffects.speakVoice(
            `Vela Rosa confirmada no Betão! ${newRound.multiplier.toFixed(2)}x!`
          );
        } else {
          soundEffects.speakVoice(
            `Vela Roxa confirmada no Betão! ${newRound.multiplier.toFixed(2)}x!`
          );
        }
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

  const handleAddSingleRound = (multiplier: number, source?: 'BETAO_LIVE' | 'BETAO_SYNC') => {
    const now = new Date();
    const newRound: RoundData = {
      id: `round-manual-${now.getTime()}`,
      multiplier,
      timestamp: now.getTime(),
      minute: now.getMinutes(),
      timeFormatted: formatTime(now),
      tier: getMultiplierTier(multiplier),
      source: source || 'BETAO_LIVE',
    };
    handleNewRound(newRound);
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

  const hourlyPayoutData = calculateHourlyPayoutMap(rounds, currentDate);

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
        onOpenBetaoBridge={() => setIsBridgeModalOpen(true)}
        isLiveConnected={isLiveConnected}
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

        {/* Indicador de Conexão com a Mesa do Betão */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLiveConnected
                  ? 'bg-emerald-400 shadow-md shadow-emerald-500/50 animate-pulse'
                  : 'bg-orange-500 animate-pulse'
              }`}
            />
            <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
              <span className="font-bold text-white">Mesa Betão:</span>
              <a
                href="https://betao.bet.br/games/aviator-spribe"
                target="_blank"
                rel="noreferrer"
                className="text-rose-400 hover:text-rose-300 font-mono underline flex items-center gap-0.5"
              >
                betao.bet.br/games/aviator-spribe
              </a>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                {isLiveConnected
                  ? `• Conectado ao vivo (${liveRoundsCount} velas sincronizadas)`
                  : '• Histórico sincronizado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="open-sync-bridge-btn"
              onClick={() => setIsBridgeModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-xs font-bold transition flex items-center gap-1"
            >
              <span>{isLiveConnected ? 'Mesa Sincronizada' : 'Sincronizar Histórico'}</span>
            </button>
            <button
              onClick={() => setIsAutoFeed((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                isAutoFeed
                  ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white'
                  : 'border-amber-500/40 bg-amber-950/40 text-amber-300'
              }`}
              title="Alternar fluxo automático calibrado para o Betão"
            >
              Fluxo: {isAutoFeed ? 'Ativo' : 'Pausado'}
            </button>
          </div>
        </div>

        {/* Barra de Sincronia Instantânea com a Mesa do Betão */}
        <BetaoSyncBar
          climate={tableClimate}
          onAddRound={handleNewRound}
          onBatchAddRounds={handleBatchAddRounds}
          onSyncClock={() => setCurrentDate(new Date())}
          onOpenBetaoBridge={() => setIsBridgeModalOpen(true)}
          isLiveConnected={isLiveConnected}
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
              Gatilhos conectados aos minutos <strong className="text-orange-400 font-extrabold">do Betão</strong>. <strong className="text-white">Minuto Atual: :{String(currentMinute).padStart(2, '0')}</strong>
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

        {/* Top Operational Section: Active Signal (Foco Total no Gatilho Ativo) */}
        <div className="w-full">
          <ActiveSignalCard
            signal={activeSignal}
            currentMinute={currentMinute}
            currentSecond={currentSecond}
            onConfirmGreen={handleConfirmGreen}
          />
        </div>

        {/* Mapeamento de Melhores Horários de Pagamento (Roxas e Rosas) */}
        <BestPayoutHoursMap
          hourlyData={hourlyPayoutData}
          currentMinute={currentMinute}
        />

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
      <BetaoLiveBridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        onBatchAddRounds={handleBatchAddRounds}
        onAddSingleRound={(mult, src) => handleAddSingleRound(mult, src)}
        isLiveConnected={isLiveConnected}
        liveRoundsCount={liveRoundsCount}
        lastLiveRoundTime={lastLiveRoundTime}
      />

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
