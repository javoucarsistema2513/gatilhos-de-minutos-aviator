import React, { useEffect, useMemo, useState } from 'react';
import {
  AviatorCandle,
  CandleStatistics,
  MinutePatternInterval,
  SurgicalTarget,
} from '../types';
import {
  calculateSurgicalPatternStats,
  getUpcomingSurgicalTargets,
  MINUTE_PATTERN_DEFINITIONS,
} from '../utils/calculator';
import {
  playClickSound,
  playConfluenceAlertSound,
  playPinkAlertSound,
  playPurpleAlertSound,
  playSurgicalBeep,
} from '../utils/audio';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Crosshair,
  Flame,
  Gauge,
  Layers,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

interface SurgicalMinuteTrackerProps {
  candles: AviatorCandle[];
  statistics: CandleStatistics;
  soundEnabled: boolean;
  onSendInstantAlert?: (title: string, message: string) => void;
  onOpenGame?: () => void;
  onOpenSyncModal?: () => void;
}

export const SurgicalMinuteTracker: React.FC<SurgicalMinuteTrackerProps> = ({
  candles,
  statistics,
  soundEnabled,
  onSendInstantAlert,
  onOpenGame,
  onOpenSyncModal,
}) => {
  // Real-time clock updating every 1 second for millisecond surgical precision
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [selectedInterval, setSelectedInterval] = useState<MinutePatternInterval | 'ALL'>('ALL');
  const [audioBeepWarning, setAudioBeepWarning] = useState<boolean>(true);
  const [lastBeepTargetId, setLastBeepTargetId] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live targets, stats, and confluences
  const { targets, confluences } = useMemo(() => {
    return getUpcomingSurgicalTargets(candles, currentTime);
  }, [candles, currentTime]);

  const patternStats = useMemo(() => {
    return calculateSurgicalPatternStats(candles);
  }, [candles]);

  // Audio warning when target enters PREPARE zone (< 20 seconds left)
  useEffect(() => {
    if (!soundEnabled || !audioBeepWarning) return;

    const urgentTarget = targets.find(
      (t) => t.secondsRemaining > 0 && t.secondsRemaining <= 15
    );

    if (urgentTarget && urgentTarget.id !== lastBeepTargetId) {
      playSurgicalBeep();
      setLastBeepTargetId(urgentTarget.id);
    }
  }, [targets, soundEnabled, audioBeepWarning, lastBeepTargetId]);

  // Format current time
  const dateObj = new Date(currentTime);
  const currentHours = String(dateObj.getHours()).padStart(2, '0');
  const currentMinutes = String(dateObj.getMinutes()).padStart(2, '0');
  const currentSeconds = String(dateObj.getSeconds()).padStart(2, '0');
  const timeFormatted = `${currentHours}:${currentMinutes}:${currentSeconds}`;

  // Filter targets if user selects a specific interval
  const filteredTargets = useMemo(() => {
    if (selectedInterval === 'ALL') return targets;
    return targets.filter((t) => t.interval === selectedInterval);
  }, [targets, selectedInterval]);

  // Highest priority active confluence
  const activeConfluence = confluences.find(
    (c) => c.status === 'ACTIVE_SHOOTING' || c.status === 'PREPARE'
  ) || confluences[0];

  const handleManualNotification = (target: SurgicalTarget) => {
    if (soundEnabled) playClickSound();
    if (onSendInstantAlert) {
      const title = `🎯 SINAL CIRÚRGICO: PADRÃO +${target.interval} MINUTOS`;
      const msg = `Alvo no minuto :${String(target.targetMinute).padStart(2, '0')} (${target.targetMultiplier}). Origem: vela ${target.sourceMultiplier.toFixed(2)}x. Estratégia: ${target.protectionGale}. Assertividade: ${target.confidence}%.`;
      onSendInstantAlert(title, msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Precision Bar & Live Clock */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white shadow-lg shadow-pink-600/30">
              <Crosshair className="h-6 w-6 animate-spin-slow" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-pink-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  PADRÕES CIRÚRGICOS DE MINUTAGEM
                </h2>
                <span className="rounded-md border border-pink-500/40 bg-pink-500/20 px-2 py-0.5 text-[10px] font-extrabold text-pink-300">
                  PRECISÃO 2M • 3M • 4M • 5M
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rastreamento cirúrgico de velas rosa (10x+) e roxas (2x+) com contagem regressiva por segundo.
              </p>
            </div>
          </div>

          {/* Precision Clock Box */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-pink-500/30 bg-pink-950/30 px-4 py-2 text-pink-200 shadow-inner">
              <Clock className="w-4 h-4 text-pink-400 animate-pulse" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                  Relógio Cirúrgico
                </span>
                <span className="font-mono text-base font-black text-white">
                  {timeFormatted}
                </span>
              </div>
            </div>

            {/* Sound / Beep Toggle */}
            <button
              id="toggle-surgical-beep-btn"
              onClick={() => {
                setAudioBeepWarning(!audioBeepWarning);
                if (soundEnabled) playClickSound();
              }}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
                audioBeepWarning
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              {audioBeepWarning ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span className="hidden sm:inline">
                {audioBeepWarning ? 'Bipe 15s Ativo' : 'Bipe Mudo'}
              </span>
            </button>

            {/* Synchronize Button */}
            {onOpenSyncModal && (
              <button
                id="btn-sync-from-tracker"
                onClick={onOpenSyncModal}
                className="flex items-center gap-1.5 rounded-xl border border-pink-500/50 bg-pink-950/40 px-3 py-2 text-xs font-bold text-pink-300 hover:bg-pink-900/60 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sincronizar Mesa</span>
              </button>
            )}

            {onOpenGame && (
              <button
                id="btn-open-game-from-tracker"
                onClick={onOpenGame}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Ver Aviator</span>
              </button>
            )}
          </div>
        </div>

        {/* Pattern Filter Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap mr-1">
            Filtrar Padrão:
          </span>
          <button
            id="filter-all-patterns"
            onClick={() => {
              setSelectedInterval('ALL');
              if (soundEnabled) playClickSound();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              selectedInterval === 'ALL'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Todos os 4 Padrões
          </button>

          {([2, 3, 4, 5] as MinutePatternInterval[]).map((int) => {
            const stat = patternStats.find((s) => s.interval === int);
            const isSelected = selectedInterval === int;
            return (
              <button
                key={`filter-int-${int}`}
                id={`filter-int-${int}`}
                onClick={() => {
                  setSelectedInterval(int);
                  if (soundEnabled) playClickSound();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>+{int} Minutos</span>
                {stat && (
                  <span className="rounded-full bg-slate-900/80 px-1.5 py-0.2 text-[10px] text-pink-300">
                    {stat.accuracyRate}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Super Confluence Banner (When 2, 3, 4, or 5 Min Patterns align) */}
      {activeConfluence && (
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 shadow-2xl transition-all ${
            activeConfluence.status === 'ACTIVE_SHOOTING'
              ? 'border-emerald-500/80 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 animate-pulse'
              : activeConfluence.status === 'PREPARE'
              ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/70 via-slate-900 to-purple-950/70'
              : 'border-pink-500/50 bg-gradient-to-r from-pink-950/40 via-slate-900 to-indigo-950/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-pink-600 text-white shadow-lg shadow-pink-600/30">
                <Sparkles className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                    ⚡ SUPER CONFLUÊNCIA CIRÚRGICA
                  </span>
                  <span className="rounded-md bg-pink-500/20 border border-pink-500/40 px-2 py-0.5 text-[11px] font-extrabold text-pink-300">
                    {activeConfluence.patterns.map((p) => `+${p}M`).join(' + ')} ALINHADOS
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  Alvo Minuto {activeConfluence.targetTimeFormatted} — Confluência Dupla/Tripla
                </h3>
                <p className="text-xs text-slate-300">
                  {activeConfluence.sourcesCount} velas anteriores convergem cirurgicamente para o minuto {activeConfluence.targetTimeFormatted}. Maior probabilidade de explosão rosa ou roxa!
                </p>
              </div>
            </div>

            {/* Confluence Countdown & CTA */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-center min-w-[120px]">
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  {activeConfluence.status === 'ACTIVE_SHOOTING'
                    ? 'TIRO EM ANDAMENTO'
                    : activeConfluence.status === 'PREPARE'
                    ? 'ABRIR APOSTA'
                    : 'CONTAGEM ALVO'}
                </span>
                <span
                  className={`font-mono text-xl font-black ${
                    activeConfluence.secondsRemaining <= 0
                      ? 'text-emerald-400 animate-pulse'
                      : activeConfluence.secondsRemaining <= 45
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {activeConfluence.secondsRemaining <= 0
                    ? 'MINUTO ATIVO'
                    : `${Math.floor(activeConfluence.secondsRemaining / 60)}m ${String(
                        activeConfluence.secondsRemaining % 60
                      ).padStart(2, '0')}s`}
                </span>
              </div>

              {onSendInstantAlert && (
                <button
                  id="btn-alert-confluence"
                  onClick={() => {
                    const title = `🚨 SUPER CONFLUÊNCIA AVIATOR: MINUTO ${activeConfluence.targetTimeFormatted}`;
                    const msg = `Padrões ${activeConfluence.patterns.map((p) => `+${p}M`).join(', ')} convergindo no minuto ${activeConfluence.targetTimeFormatted}! Confiança: ${activeConfluence.confidence}%.`;
                    onSendInstantAlert(title, msg);
                    if (soundEnabled) playConfluenceAlertSound();
                  }}
                  className="rounded-xl bg-pink-600 hover:bg-pink-500 p-2.5 text-white shadow-md transition"
                  title="Disparar Alerta para Telegram / Webhook"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid of the 4 Main Surgical Patterns (2, 3, 4 and 5 minutes) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Monitoramento dos 4 Padrões em Tempo Real
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Atualização contínua a cada segundo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([2, 3, 4, 5] as MinutePatternInterval[]).map((interval) => {
            const def = MINUTE_PATTERN_DEFINITIONS[interval];
            const stat = patternStats.find((s) => s.interval === interval);
            const target = targets.find((t) => t.interval === interval);

            // Calculate cycle progress (0% to 100%)
            const totalDurationSec = interval * 60;
            const secRem = target ? target.secondsRemaining : 0;
            const progressPct = target
              ? Math.max(0, Math.min(100, Math.round(((totalDurationSec - secRem) / totalDurationSec) * 100)))
              : 0;

            let cardBorder = 'border-slate-800 bg-slate-900/80';
            let statusBadge = (
              <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                Aguardando Gatilho
              </span>
            );

            if (target) {
              if (target.status === 'ACTIVE_SHOOTING') {
                cardBorder = 'border-emerald-500/80 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 shadow-lg shadow-emerald-500/10';
                statusBadge = (
                  <span className="flex items-center gap-1 rounded-md border border-emerald-400 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 animate-pulse">
                    <Flame className="w-3 h-3 text-emerald-400" />
                    ZONA DE TIRO ATIVA (: {String(target.targetMinute).padStart(2, '0')})
                  </span>
                );
              } else if (target.status === 'PREPARE') {
                cardBorder = 'border-amber-500/80 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 shadow-lg shadow-amber-500/10';
                statusBadge = (
                  <span className="flex items-center gap-1 rounded-md border border-amber-400 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 animate-bounce">
                    <Zap className="w-3 h-3 text-amber-400" />
                    PREPARAR ENTRADA ({target.secondsRemaining}s)
                  </span>
                );
              } else if (target.status === 'VALIDATED_HIT') {
                cardBorder = 'border-emerald-500/40 bg-slate-900/80';
                statusBadge = (
                  <span className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    GREEN CONFIRMADO
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="rounded-md border border-slate-700 bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    Aguardando Contagem ({target.secondsRemaining}s)
                  </span>
                );
              }
            }

            return (
              <div
                key={`surgical-card-${interval}`}
                id={`surgical-card-${interval}`}
                className={`rounded-2xl border p-5 shadow-xl transition hover:border-slate-700 ${cardBorder}`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl font-black text-sm border shadow-inner ${
                        interval === 5
                          ? 'border-pink-500/40 bg-pink-950/50 text-pink-300'
                          : interval === 3
                          ? 'border-purple-500/40 bg-purple-950/50 text-purple-300'
                          : interval === 2
                          ? 'border-cyan-500/40 bg-cyan-950/50 text-cyan-300'
                          : 'border-amber-500/40 bg-amber-950/50 text-amber-300'
                      }`}
                    >
                      +{interval}M
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white">
                          {def.name}
                        </h4>
                        {target?.hasConfluence && (
                          <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                            CONFLUÊNCIA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{def.description}</p>
                    </div>
                  </div>

                  <div>{statusBadge}</div>
                </div>

                {/* Main Projections / Target Info */}
                {target ? (
                  <div className="my-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl bg-slate-950/80 p-3 border border-slate-800/80">
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          Minuto Alvo
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-black text-white font-mono">
                            :{String(target.targetMinute).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({target.targetTimeFormatted || `${target.targetMinute}m`})
                          </span>
                        </div>
                      </div>

                      {/* Exact Entry Second */}
                      <div className="border-t sm:border-t-0 sm:border-x border-slate-800/80 pt-1.5 sm:pt-0 sm:px-2">
                        <span className="block text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                          <Crosshair className="w-3 h-3 text-emerald-400" />
                          <span>Segundo Exato</span>
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-emerald-400 font-mono">
                            :{String(target.targetSecond !== undefined ? target.targetSecond : 18).padStart(2, '0')}s
                          </span>
                        </div>
                        <span className="text-[9px] text-emerald-300/80 block truncate">
                          {target.secondWindow || 'Janela :13s a :28s'}
                        </span>
                      </div>

                      {/* Countdown */}
                      <div className="sm:text-right border-t sm:border-t-0 border-slate-800/80 pt-1.5 sm:pt-0">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          Contagem Regressiva
                        </span>
                        <span
                          className={`font-mono text-xl font-black ${
                            target.status === 'ACTIVE_SHOOTING'
                              ? 'text-emerald-400 animate-pulse'
                              : target.status === 'PREPARE'
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {target.secondsRemaining <= 0
                            ? 'DISPARANDO'
                            : `${Math.floor(target.secondsRemaining / 60)}m ${String(
                                target.secondsRemaining % 60
                              ).padStart(2, '0')}s`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Cycle */}
                    <div>
                      <div className="mb-1 flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Origem: Vela {target.sourceMultiplier.toFixed(2)}x (: {String(target.sourceMinute).padStart(2, '0')})</span>
                        <span>Ciclo: {progressPct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            target.status === 'ACTIVE_SHOOTING'
                              ? 'bg-gradient-to-r from-emerald-500 to-pink-500'
                              : target.status === 'PREPARE'
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          Alvo de Saída:
                        </span>
                        <span className="font-bold text-pink-300">
                          {target.targetMultiplier}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          Estratégia de Gale:
                        </span>
                        <span className="font-medium text-slate-200">
                          {target.protectionGale}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="my-6 rounded-xl bg-slate-950/40 border border-slate-800/60 p-4 text-center">
                    <p className="text-xs text-slate-400">
                      Aguardando uma nova vela de referência (2x+ ou 10x+) para disparar a projeção de +{interval} minutos.
                    </p>
                  </div>
                )}

                {/* Card Footer: Statistical Accuracy & Notification */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Assertividade:</span>
                    <span className="font-extrabold text-emerald-400 font-mono">
                      {stat ? `${stat.accuracyRate}%` : '80%'}
                    </span>
                    {stat && (
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                          stat.status === 'HOT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {stat.status === 'HOT' ? 'ALTA FREQUÊNCIA' : 'ESTÁVEL'}
                      </span>
                    )}
                  </div>

                  {target && onSendInstantAlert && (
                    <button
                      id={`btn-notify-pattern-${interval}`}
                      onClick={() => handleManualNotification(target)}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition"
                      title="Enviar sinal deste padrão"
                    >
                      <Send className="w-3 h-3 text-pink-400" />
                      <span>Notificar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistical Backtesting & Accuracy Comparison Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Auditoria de Assertividade dos Padrões (Mesa Atual)
              </h3>
              <p className="text-[11px] text-slate-400">
                Verificação retroativa cirúrgica em todas as rodadas registradas na sessão.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Base: <strong>{candles.length} velas analisadas</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 uppercase text-[10px] font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-3 py-2.5 rounded-l-lg">Padrão</th>
                <th className="px-3 py-2.5">Tempo do Ciclo</th>
                <th className="px-3 py-2.5 text-center">Gatilhos Testados</th>
                <th className="px-3 py-2.5 text-center">Velas Rosa (10x+)</th>
                <th className="px-3 py-2.5 text-center">Velas Roxas (2x+)</th>
                <th className="px-3 py-2.5 text-center">Multiplicador Médio</th>
                <th className="px-3 py-2.5 text-center">Taxa de Acerto</th>
                <th className="px-3 py-2.5 rounded-r-lg text-right">Classificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {patternStats.map((stat) => {
                return (
                  <tr
                    key={`backtest-row-${stat.interval}`}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="px-3 py-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded font-mono text-xs font-black ${
                            stat.interval === 5
                              ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                              : stat.interval === 3
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                              : 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {stat.interval}M
                        </span>
                        <span>{stat.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-400">
                      {stat.interval * 60} segundos
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-semibold text-white">
                      {stat.totalTested}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-pink-400">
                      {stat.pinkHits} velas
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-purple-400">
                      {stat.purpleHits} velas
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-amber-300">
                      {stat.avgMultiplierOnHit.toFixed(2)}x
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full ${
                              stat.accuracyRate >= 80
                                ? 'bg-emerald-500'
                                : stat.accuracyRate >= 70
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${stat.accuracyRate}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-extrabold text-white">
                          {stat.accuracyRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          stat.status === 'HOT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {stat.status === 'HOT' ? '🔥 ALTA FREQUÊNCIA' : '⚖️ ESTÁVEL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
