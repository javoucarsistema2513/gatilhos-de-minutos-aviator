import React, { useMemo, useState } from 'react';
import { AviatorCandle, CandleStatistics, PayingMinuteAnalysis } from '../types';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  Crosshair,
  DollarSign,
  Flame,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { calculateSurgicalPatternStats, MINUTE_PATTERN_DEFINITIONS } from '../utils/calculator';

interface StrategyCalculatorProps {
  candles: AviatorCandle[];
  statistics: CandleStatistics;
  payingMinutes: PayingMinuteAnalysis[];
  onOpenMinutagem?: () => void;
}

export const StrategyCalculator: React.FC<StrategyCalculatorProps> = ({
  candles,
  statistics,
  payingMinutes,
  onOpenMinutagem,
}) => {
  // Bankroll Management State
  const [bankroll, setBankroll] = useState<number>(500);
  const [riskPercent, setRiskPercent] = useState<number>(2); // 2% per entry
  const [galeLevel, setGaleLevel] = useState<'none' | 'gale1' | 'gale2'>('gale1');
  const [targetType, setTargetType] = useState<'purple' | 'pink'>('purple');

  const baseStake = Math.max(1, (bankroll * riskPercent) / 100);
  const gale1Stake = baseStake * 2;
  const gale2Stake = baseStake * 4;

  const currentClockMinute = new Date().getMinutes();

  // Calculate surgical patterns stats
  const surgicalStats = useMemo(() => {
    return calculateSurgicalPatternStats(candles);
  }, [candles]);

  // Top 5 hottest minutes for pink and purple
  const topMinutes = payingMinutes.slice(0, 8);

  // Next hot minute coming up
  const nextHotMinute =
    payingMinutes.find((pm) => pm.minute > currentClockMinute) || payingMinutes[0];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/40">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Calculadora de Ciclos & Gestão de Banca
              </h2>
              <p className="text-xs text-slate-400">
                Modelos matemáticos de minutagem pagante e projeção de risco para velas rosa e roxa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 px-3.5 py-2 border border-slate-800">
            <Clock className="w-4 h-4 text-pink-400" />
            <div className="text-xs">
              <span className="text-slate-400">Minuto Atual do Relógio: </span>
              <strong className="text-white font-mono text-sm">
                :{String(currentClockMinute).padStart(2, '0')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Minutagem Pagante (Paying Minutes Heatmap) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-pink-500" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Minutagens Pagantes Mais Quentes da Mesa
              </h3>
              <p className="text-[11px] text-slate-400">
                Minutos (:00 a :59) com maior concentração de velas rosa (10x+) e roxas (2x+)
              </p>
            </div>
          </div>

          {nextHotMinute && (
            <div className="rounded-xl bg-pink-950/40 border border-pink-500/40 px-3 py-1.5 text-xs text-pink-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Próximo Minuto Pagante: </span>
              <strong className="text-white font-bold">
                :{String(nextHotMinute.minute).padStart(2, '0')}
              </strong>
            </div>
          )}
        </div>

        {/* Top Hot Minutes Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {topMinutes.slice(0, 4).map((pm, i) => (
            <div
              key={pm.minute}
              className={`rounded-xl border p-3.5 transition ${
                i === 0
                  ? 'border-pink-500/60 bg-pink-950/30'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Minuto</span>
                <span className="rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold px-1.5 py-0.5">
                  Top #{i + 1}
                </span>
              </div>
              <div className="mt-1 text-2xl font-black font-mono text-white">
                :{String(pm.minute).padStart(2, '0')}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-pink-400 font-bold">{pm.pinkCount}x Rosa</span>
                <span className="text-purple-300">{pm.purpleCount}x Roxa</span>
              </div>
            </div>
          ))}
        </div>

        {/* 60 Minutes Compact Heatmap Grid */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mapa de Calor de 60 Minutos (:00 a :59)
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
            {payingMinutes
              .slice()
              .sort((a, b) => a.minute - b.minute)
              .map((pm) => {
                const isCurrent = pm.minute === currentClockMinute;
                let bgClass = 'bg-slate-950 text-slate-500 border-slate-800';
                if (pm.pinkCount > 0) {
                  bgClass = 'bg-pink-900/60 text-pink-200 border-pink-500 font-bold shadow-sm shadow-pink-500/20';
                } else if (pm.purpleCount > 1) {
                  bgClass = 'bg-purple-900/50 text-purple-200 border-purple-500';
                } else if (pm.purpleCount === 1) {
                  bgClass = 'bg-slate-900 text-purple-300 border-slate-700';
                }

                return (
                  <div
                    key={pm.minute}
                    className={`flex flex-col items-center justify-center rounded-lg border py-1 px-0.5 text-center transition ${bgClass} ${
                      isCurrent ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950' : ''
                    }`}
                    title={`Minuto :${String(pm.minute).padStart(2, '0')} - ${pm.pinkCount} Rosas, ${pm.purpleCount} Roxas`}
                  >
                    <span className="text-[10px] font-mono">:{String(pm.minute).padStart(2, '0')}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {pm.pinkCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-pink-400"></span>}
                      {pm.purpleCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>}
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex items-center justify-end gap-3 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-pink-500"></span> Com Vela Rosa
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span> Com Vela Roxa
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Minuto Atual
            </span>
          </div>
        </div>
      </div>

      {/* Section 1.5: Padrões Cirúrgicos 2M, 3M, 4M e 5M Breakdown */}
      <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5 shadow-xl">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-700 text-white shadow-md">
              <Crosshair className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  Matriz Cirúrgica dos Padrões de Minutagem (2M, 3M, 4M e 5M)
                </h3>
                <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[10px] font-black text-pink-300">
                  PRECISÃO MATEMÁTICA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Estatísticas cirúrgicas calculadas sobre o algoritmo do Aviator para cada intervalo temporal.
              </p>
            </div>
          </div>

          {onOpenMinutagem && (
            <button
              onClick={onOpenMinutagem}
              className="flex items-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 px-3 py-1.5 text-xs font-bold text-white transition shadow-sm"
            >
              <span>Ver Rastreador ao Vivo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {surgicalStats.map((st) => {
            const isPink = st.interval === 5;
            return (
              <div
                key={`strat-pattern-${st.interval}`}
                className={`rounded-xl border p-4 transition ${
                  isPink
                    ? 'border-pink-500/40 bg-pink-950/20'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-black text-white border border-slate-800">
                    +{st.interval} MINUTOS
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">
                    {st.accuracyRate}% Green
                  </span>
                </div>

                <div className="mt-2 text-xs font-bold text-white">
                  {st.name}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {st.description}
                </p>

                <div className="mt-3 rounded-lg bg-slate-900/90 p-2 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Alvo Ideal:</span>
                    <strong className="text-pink-300">{st.idealTarget.split('(')[0]}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Payout Médio:</span>
                    <strong className="text-amber-300 font-mono">{st.avgMultiplierOnHit}x</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Rosas Pagas:</span>
                    <strong className="text-pink-400 font-mono">{st.pinkHits} velas</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Bankroll & Martingale Calculator */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Gestão de Risco & Calculadora de Entradas
            </h3>
            <p className="text-[11px] text-slate-400">
              Calcule exatamente o valor de cada entrada, stop loss e projeção de lucro seguro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sua Banca Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">R$</span>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={bankroll}
                  onChange={(e) => setBankroll(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2 text-sm font-bold text-white focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gerenciamento de Risco por Entrada ({riskPercent}%)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pct: 1, label: 'Conservador (1%)' },
                  { pct: 2, label: 'Moderado (2%)' },
                  { pct: 5, label: 'Agressivo (5%)' },
                ].map((item) => (
                  <button
                    key={item.pct}
                    type="button"
                    onClick={() => setRiskPercent(item.pct)}
                    className={`rounded-xl border p-2 text-xs font-bold transition ${
                      riskPercent === item.pct
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Proteção com Martingale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { level: 'none', label: 'Sem Gale' },
                  { level: 'gale1', label: 'Gale 1' },
                  { level: 'gale2', label: 'Gale 2' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setGaleLevel(item.level as 'none' | 'gale1' | 'gale2')}
                    className={`rounded-xl border p-2 text-xs font-bold transition ${
                      galeLevel === item.level
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Objetivo do Sinal
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('purple')}
                  className={`rounded-xl border p-2 text-xs font-bold transition ${
                    targetType === 'purple'
                      ? 'border-purple-500 bg-purple-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  ⚡ Vela Roxa (2.00x)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('pink')}
                  className={`rounded-xl border p-2 text-xs font-bold transition ${
                    targetType === 'pink'
                      ? 'border-pink-500 bg-pink-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  💎 Vela Rosa (10.00x)
                </button>
              </div>
            </div>
          </div>

          {/* Stake Breakdown Table */}
          <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 flex flex-col justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Tabela de Entradas Calculada
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300">1ª Entrada (Mão Inicial)</span>
                <span className="text-sm font-black text-white">R$ {baseStake.toFixed(2)}</span>
              </div>

              {galeLevel !== 'none' && (
                <div className="flex items-center justify-between rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <span className="text-xs font-semibold text-purple-300">Gale 1 (Proteção)</span>
                  <span className="text-sm font-black text-purple-300">R$ {gale1Stake.toFixed(2)}</span>
                </div>
              )}

              {galeLevel === 'gale2' && (
                <div className="flex items-center justify-between rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <span className="text-xs font-semibold text-pink-300">Gale 2 (Recuperação Final)</span>
                  <span className="text-sm font-black text-pink-300">R$ {gale2Stake.toFixed(2)}</span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Investimento Total por Ciclo:</span>
                <span className="text-sm font-black text-emerald-400">
                  R${' '}
                  {(
                    baseStake +
                    (galeLevel !== 'none' ? gale1Stake : 0) +
                    (galeLevel === 'gale2' ? gale2Stake : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-900/70 p-2.5 text-[11px] text-slate-400 leading-relaxed border border-slate-800/80">
              💡 <strong>Regra de Ouro:</strong> Nunca arrisque mais do que 5% da sua banca total em uma única operação. Pare imediatamente ao atingir o Stop Loss.
            </div>
          </div>

          {/* Profit & Targets Summary */}
          <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 flex flex-col justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Metas Recomendadas
            </h4>

            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-3">
                <div className="text-[10px] font-bold uppercase text-emerald-400">
                  Stop Win Recomendado (+10%)
                </div>
                <div className="text-lg font-black text-emerald-300 mt-0.5">
                  R$ {(bankroll * 1.1).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Lucro líquido: +R$ {(bankroll * 0.1).toFixed(2)}
                </div>
              </div>

              <div className="rounded-xl bg-rose-950/30 border border-rose-500/30 p-3">
                <div className="text-[10px] font-bold uppercase text-rose-400">
                  Stop Loss Máximo Recomendado (-15%)
                </div>
                <div className="text-lg font-black text-rose-300 mt-0.5">
                  R$ {(bankroll * 0.85).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Limite de perda diária: -R$ {(bankroll * 0.15).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Retorno projetado na 1ª entrada:{' '}
                  <strong className="text-emerald-400">
                    R$ {(baseStake * (targetType === 'purple' ? 2 : 10) - baseStake).toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
