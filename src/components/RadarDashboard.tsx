import React, { useMemo, useState } from 'react';
import { AviatorCandle, CandleStatistics, RadarSignal } from '../types';
import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Flame,
  Plus,
  Radio,
  Send,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Zap,
  RefreshCw,
  ClipboardPaste,
  Undo2,
} from 'lucide-react';
import { getUpcomingSurgicalTargets } from '../utils/calculator';

interface RadarDashboardProps {
  candles: AviatorCandle[];
  statistics: CandleStatistics;
  currentSignal: RadarSignal;
  onAddCandle: (multiplier: number) => void;
  onRemoveLastCandle?: () => void;
  onOpenSyncModal: () => void;
  onTestNotification: () => void;
  countdown: number;
  isSimulating: boolean;
  onViewGame: () => void;
  onOpenMinutagem?: () => void;
}

export const RadarDashboard: React.FC<RadarDashboardProps> = ({
  candles,
  statistics,
  currentSignal,
  onAddCandle,
  onRemoveLastCandle,
  onOpenSyncModal,
  onTestNotification,
  countdown,
  isSimulating,
  onViewGame,
  onOpenMinutagem,
}) => {
  const [customMultiplier, setCustomMultiplier] = useState('');

  // Live surgical targets
  const { targets: surgicalTargets, confluences } = useMemo(() => {
    return getUpcomingSurgicalTargets(candles);
  }, [candles]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customMultiplier.replace(',', '.'));
    if (!isNaN(val) && val >= 1.0) {
      onAddCandle(val);
      setCustomMultiplier('');
    }
  };

  // Determine critical pink zone
  const isPinkCritical = statistics.roundsSinceLastPink >= statistics.avgPinkInterval - 2;
  const pinkProgress = Math.min(100, Math.round((statistics.roundsSinceLastPink / statistics.avgPinkInterval) * 100));

  return (
    <div className="space-y-6">
      {/* Synchronization Banner with Official Table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-pink-500/40 bg-gradient-to-r from-pink-950/40 via-slate-900 to-purple-950/40 p-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-600/30 border border-pink-500/50 text-pink-300">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                Sincronização com Aviator Oficial (Cloudfront)
              </h3>
              <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[10px] font-black text-pink-300 border border-pink-500/30">
                CALIBRAÇÃO CIRÚRGICA
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Alinhe as velas reais do site oficial para calcular com máxima precisão os ciclos de 2M, 3M, 4M e 5M.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            id="btn-radar-calibrate-table"
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-pink-600/30 hover:brightness-110 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calibrar Mesa Agora</span>
          </button>
          <button
            onClick={onViewGame}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            Ver Jogo Integrado
          </button>
        </div>
      </div>

      {/* Top Section: Live Candle Tape */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Fita de Velas em Tempo Real
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              {candles.length} rodadas registradas
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span> Azul (&lt;2x): {statistics.bluePct}%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span> Roxa (2x-10x): {statistics.purplePct}%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-pink-500"></span> Rosa (10x+): {statistics.pinkPct}%
            </span>
          </div>
        </div>

        {/* Scrollable Candles Pill Tape */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {candles.slice(0, 24).map((c, idx) => {
            const isLatest = idx === 0;
            let badgeStyle = '';
            if (c.color === 'pink') {
              badgeStyle =
                'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-extrabold border-pink-400 shadow-md shadow-pink-600/30';
            } else if (c.color === 'purple') {
              badgeStyle =
                'bg-gradient-to-r from-purple-700 to-indigo-600 text-purple-100 font-bold border-purple-500/50';
            } else {
              badgeStyle = 'bg-slate-800/90 text-blue-300 border-blue-900/50';
            }

            return (
              <div
                key={c.id}
                className={`relative flex shrink-0 items-center justify-center rounded-xl border px-3 py-1.5 text-xs transition-all ${badgeStyle} ${
                  isLatest ? 'scale-105 ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 font-black' : 'opacity-90'
                }`}
              >
                {isLatest && (
                  <span className="absolute -top-2.5 rounded bg-emerald-500 px-1 text-[8px] font-black uppercase text-slate-950">
                    Última
                  </span>
                )}
                <span>{c.multiplier.toFixed(2)}x</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Alert / Signal Card */}
      <div
        id="card-active-signal"
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all shadow-2xl ${
          currentSignal.type === 'PINK_RADAR'
            ? 'border-pink-500/80 bg-gradient-to-br from-pink-950/60 via-slate-900 to-purple-950/40 shadow-pink-500/20'
            : currentSignal.type === 'PURPLE_WAVE'
            ? 'border-purple-500/80 bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 shadow-purple-500/20'
            : currentSignal.type === 'CHESS_ALTERNATION'
            ? 'border-indigo-500/70 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950'
            : 'border-slate-800 bg-slate-900/70'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                currentSignal.type === 'PINK_RADAR'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/40 animate-pulse'
                  : currentSignal.type === 'PURPLE_WAVE'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {currentSignal.type === 'PINK_RADAR' ? (
                <Sparkles className="h-6 w-6" />
              ) : currentSignal.type === 'PURPLE_WAVE' ? (
                <Zap className="h-6 w-6" />
              ) : (
                <TrendingUp className="h-6 w-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    currentSignal.level === 'EXTREME'
                      ? 'bg-rose-500 text-white animate-bounce'
                      : currentSignal.level === 'HIGH'
                      ? 'bg-pink-500 text-white'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {currentSignal.level === 'EXTREME' ? 'ALERTA MÁXIMO' : 'SINAL CONFIRMADO'}
                </span>
                <span className="text-xs text-slate-400">
                  Calculado às {new Date(currentSignal.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                {currentSignal.title}
              </h2>
            </div>
          </div>

          {/* Confidence Indicator */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 self-start md:self-auto">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Confiança do Algoritmo</div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-black ${
                    currentSignal.confidence >= 85
                      ? 'text-pink-400'
                      : currentSignal.confidence >= 70
                      ? 'text-purple-400'
                      : 'text-slate-200'
                  }`}
                >
                  {currentSignal.confidence}%
                </span>
                <span className="text-xs text-slate-400">estatística</span>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={currentSignal.type === 'PINK_RADAR' ? 'text-pink-500' : 'text-purple-500'}
                  strokeDasharray={`${currentSignal.confidence}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                {currentSignal.confidence}%
              </div>
            </div>
          </div>
        </div>

        {/* Signal Targets Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">Alvo de Saque Recomendado</div>
            <div className="mt-1 text-base font-black text-emerald-400">
              {currentSignal.targetMultiplier}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">Estratégia de Proteção</div>
            <div className="mt-1 text-sm font-semibold text-purple-300">
              {currentSignal.protectionGale}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">Minutagem Pagante Alvo</div>
            <div className="mt-1 text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              {currentSignal.payingMinuteTarget}
            </div>
          </div>
        </div>

        {/* Trigger explanation */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-950/30 p-3 text-xs text-slate-300 border border-slate-800/50">
          <Flame className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Diagnóstico do Radar:</strong> {currentSignal.triggerReason}
          </p>
        </div>

        {/* Action button inside card */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>
              {isSimulating
                ? `Próxima verificação de rodada em ~${countdown}s`
                : 'Sincronização pausada (adicione velas manualmente)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTestNotification}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Send className="w-3.5 h-3.5 text-pink-400" />
              <span>Notificar Instantaneamente</span>
            </button>

            <button
              onClick={onViewGame}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:opacity-95 transition"
            >
              <span>Abrir Aviator Oficial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Padrões Cirúrgicos de Minutagem (2M, 3M, 4M, 5M) Quick Widget */}
      <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600/30 text-pink-400 border border-pink-500/40">
              <Crosshair className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Padrões Cirúrgicos de Minutagem
                </h3>
                <span className="rounded bg-pink-500/20 px-1.5 py-0.2 text-[10px] font-extrabold text-pink-300">
                  2M • 3M • 4M • 5M
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Projeção matemática das próximas janelas de entrada para velas rosa e roxa.
              </p>
            </div>
          </div>

          {onOpenMinutagem && (
            <button
              id="btn-goto-surgical-tracker"
              onClick={onOpenMinutagem}
              className="flex items-center gap-1 text-xs font-bold text-pink-400 hover:text-pink-300 transition"
            >
              <span>Abrir Rastreador Cirúrgico</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Cards Grid */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([2, 3, 4, 5] as const).map((interval) => {
            const target = surgicalTargets.find((t) => t.interval === interval);
            const isPinkTarget = interval === 5;

            let statusBg = 'bg-slate-950/60 border-slate-800 text-slate-300';
            if (target?.status === 'ACTIVE_SHOOTING') {
              statusBg = 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 animate-pulse';
            } else if (target?.status === 'PREPARE') {
              statusBg = 'bg-amber-950/50 border-amber-500/60 text-amber-300';
            } else if (target?.status === 'VALIDATED_HIT') {
              statusBg = 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400';
            }

            return (
              <div
                key={`dash-surg-${interval}`}
                onClick={onOpenMinutagem}
                className={`cursor-pointer rounded-xl border p-3 transition hover:border-pink-500/50 hover:bg-slate-800/40 ${statusBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-black text-white">
                    +{interval} MIN
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {target?.confidence || 80}% assertividade
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Alvo
                    </span>
                    <span className="font-mono text-lg font-black text-white">
                      :{target ? String(target.targetMinute).padStart(2, '0') : '--'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Restam
                    </span>
                    <span
                      className={`font-mono text-xs font-black ${
                        target?.secondsRemaining && target.secondsRemaining <= 0
                          ? 'text-emerald-400'
                          : target?.secondsRemaining && target.secondsRemaining <= 45
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {target
                        ? target.secondsRemaining <= 0
                          ? 'TIRO ATIVO'
                          : `${target.secondsRemaining}s`
                        : '--'}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-[10px] truncate text-slate-400">
                  {isPinkTarget ? '🎯 Foco: Vela Rosa (10x+)' : '⚡ Foco: Vela Roxa (2x+)'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Pink Cycle Detector & Purple Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pink Candle Radar Card */}
        <div className="rounded-2xl border border-pink-900/40 bg-slate-900/80 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 h-28 w-28 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400 font-bold text-xs">
                10x
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Radar de Velas Rosa (10.00x+)</h3>
                <p className="text-[11px] text-slate-400">Ciclos de repetição & Minutagem pagante</p>
              </div>
            </div>

            <span
              className={`rounded-lg px-2 py-1 text-xs font-bold ${
                isPinkCritical
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isPinkCritical ? '🔥 ZONA DE TIRO' : 'ZONA NEUTRA'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Sem Rosa Há</div>
              <div
                className={`text-2xl font-black mt-1 ${
                  statistics.roundsSinceLastPink >= 15
                    ? 'text-pink-400 animate-pulse'
                    : 'text-white'
                }`}
              >
                {statistics.roundsSinceLastPink}
              </div>
              <div className="text-[10px] text-slate-500">rodadas</div>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Média de Ciclo</div>
              <div className="text-2xl font-black mt-1 text-purple-300">
                {statistics.avgPinkInterval}
              </div>
              <div className="text-[10px] text-slate-500">rodadas</div>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Maior Vela</div>
              <div className="text-2xl font-black mt-1 text-pink-500">
                {statistics.highestMultiplier.toFixed(2)}x
              </div>
              <div className="text-[10px] text-slate-500">recorde recente</div>
            </div>
          </div>

          {/* Progress bar towards next pink */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Pressão de Ciclo para Rosa</span>
              <span className="font-bold text-pink-400">{pinkProgress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPinkCritical
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400'
                    : 'bg-pink-600'
                }`}
                style={{ width: `${Math.min(100, pinkProgress)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              {isPinkCritical
                ? '⚠️ Probabilidade matemática máxima! A média de velas rosas foi atingida ou ultrapassada. Fique pronto para entrar com proteção.'
                : `Aguarde acumular mais rodadas para o ciclo de rosa entrar na zona de tiro (Média: a cada ${statistics.avgPinkInterval} rodadas).`}
            </p>
          </div>
        </div>

        {/* Purple Flow Meter & Streak Analysis */}
        <div className="rounded-2xl border border-purple-900/40 bg-slate-900/80 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 h-28 w-28 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs">
                2x
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Fluxo de Velas Roxa (2.00x+)</h3>
                <p className="text-[11px] text-slate-400">Análise de quebras e sequências</p>
              </div>
            </div>

            <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs font-bold text-purple-300 border border-purple-500/30">
              Taxa Geral: {statistics.purplePct}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Sequência Atual</div>
              <div
                className={`text-2xl font-black mt-1 ${
                  statistics.currentStreakColor === 'blue'
                    ? 'text-blue-400'
                    : statistics.currentStreakColor === 'purple'
                    ? 'text-purple-400'
                    : 'text-pink-400'
                }`}
              >
                {statistics.currentStreakCount}x
              </div>
              <div className="text-[10px] uppercase text-slate-500 font-semibold">
                {statistics.currentStreakColor === 'blue'
                  ? 'Azul (Baixa)'
                  : statistics.currentStreakColor === 'purple'
                  ? 'Roxa'
                  : 'Rosa'}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Média Geral</div>
              <div className="text-2xl font-black mt-1 text-white">
                {statistics.averageMultiplier.toFixed(2)}x
              </div>
              <div className="text-[10px] text-slate-500">multiplicador</div>
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Velas Roxas</div>
              <div className="text-2xl font-black mt-1 text-purple-400">
                {statistics.purpleCount}
              </div>
              <div className="text-[10px] text-slate-500">nas últimas {candles.length}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-950/50 p-3 border border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 text-purple-300 font-bold mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Gatilho de Entrada Roxa (2x)
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {statistics.currentStreakColor === 'blue' && statistics.currentStreakCount >= 2
                ? `⚡ Alerta de Reversão! ${statistics.currentStreakCount} azuis seguidas criam pressão estatística para recuperação e quebra em vela roxa no próximo ciclo.`
                : 'Mesa operando dentro da distribuição normal. Recomendado aguardar 2 ou mais azuis consecutivas para entrada com risco mitigado.'}
            </p>
          </div>
        </div>
      </div>

      {/* Manual Input Bar & Quick Presets */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-pink-400" />
              Adicionar Vela Manualmente ao Radar
            </h4>
            <p className="text-[11px] text-slate-400">
              Acompanhe a mesa em tempo real e adicione as velas observadas para atualizar instantaneamente os cálculos.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {onRemoveLastCandle && (
              <button
                type="button"
                onClick={onRemoveLastCandle}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-rose-400 hover:border-rose-500/50 transition mr-1"
                title="Desfazer última vela registrada"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Desfazer</span>
              </button>
            )}
            <span className="text-[10px] text-slate-500 font-semibold">Atalhos:</span>
            {[
              { val: 1.15, label: '1.15x', color: 'bg-blue-950/60 text-blue-300 border-blue-800' },
              { val: 1.84, label: '1.84x', color: 'bg-blue-950/60 text-blue-300 border-blue-800' },
              { val: 2.10, label: '2.10x', color: 'bg-purple-950/60 text-purple-300 border-purple-800' },
              { val: 4.50, label: '4.50x', color: 'bg-purple-950/60 text-purple-300 border-purple-800' },
              { val: 11.20, label: '11.2x (Rosa)', color: 'bg-pink-950/60 text-pink-300 border-pink-800 font-bold' },
              { val: 28.50, label: '28.5x (Rosa)', color: 'bg-rose-950/60 text-rose-300 border-rose-800 font-bold' },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onAddCandle(preset.val)}
                className={`rounded-lg border px-2 py-1 text-xs transition active:scale-95 ${preset.color} hover:brightness-125`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input form */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="input-multiplier"
              type="text"
              placeholder="Digite o multiplicador ex: 2.45 ou 15.80"
              value={customMultiplier}
              onChange={(e) => setCustomMultiplier(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <button
            id="btn-submit-candle"
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-600/20 hover:from-pink-500 hover:to-purple-500 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Vela</span>
          </button>
        </form>
      </div>
    </div>
  );
};
