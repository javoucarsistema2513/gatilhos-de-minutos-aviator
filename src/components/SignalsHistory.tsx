import React, { useState } from 'react';
import { TriggerSignal } from '../types';
import { CheckCircle, XCircle, Clock, Award, TrendingUp, Sparkles, Zap, Filter } from 'lucide-react';

interface SignalsHistoryProps {
  signals: TriggerSignal[];
  winRate: number;
  totalGreens: number;
  totalReds: number;
}

export const SignalsHistory: React.FC<SignalsHistoryProps> = ({
  signals,
  winRate,
  totalGreens,
  totalReds,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PINK' | 'PURPLE'>('ALL');

  // Contagem específica de Velas Rosas e Roxas no histórico
  const pinkSignalsCount = signals.filter(
    (s) => s.expectedTier === 'pink' || (s.resultMultiplier && s.resultMultiplier >= 10.00)
  ).length;

  const purpleSignalsCount = signals.filter(
    (s) => s.expectedTier === 'purple' && (!s.resultMultiplier || s.resultMultiplier < 10.00)
  ).length;

  const filteredSignals = signals
    .filter((sig) => {
      const isPink = sig.expectedTier === 'pink' || (sig.resultMultiplier && sig.resultMultiplier >= 10.00);
      const isPurple = sig.expectedTier === 'purple' && (!sig.resultMultiplier || sig.resultMultiplier < 10.00);

      if (filter === 'PINK') return isPink;
      if (filter === 'PURPLE') return isPurple;
      return true;
    })
    .slice(-20)
    .reverse();

  return (
    <div
      id="signals-history-container"
      className="rounded-2xl border border-slate-800 bg-[#0C101C]/80 p-4 sm:p-5 shadow-xl backdrop-blur-md"
    >
      {/* Header & Win Rate Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Histórico de Sinais &amp; Atividade</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Roxas 💜 &amp; Rosas 🌸
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Gatilhos verificados e executados em tempo real no Betão</p>
          </div>
        </div>

        {/* Win Rate & Counts Stats */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{winRate}% Assertividade</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono">
            {/* Contador de Rosas */}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-300 font-bold" title="Velas Rosas (10x+)">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              <span>{pinkSignalsCount} ROSAS</span>
            </span>

            {/* Contador de Roxas */}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-300 font-bold" title="Velas Roxas (2x a 9.99x)">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>{purpleSignalsCount} ROXAS</span>
            </span>

            {/* Contador de Loss */}
            <span className="px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-600/50 text-rose-400 font-bold">
              {totalReds} LOSS
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs: Todas | Só Rosas 🌸 | Só Roxas 💜 */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-1 text-xs">
        <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filtrar atividade:</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              filter === 'ALL'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({signals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PINK')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              filter === 'PINK'
                ? 'bg-fuchsia-600 text-white shadow-xs shadow-fuchsia-500/25'
                : 'text-fuchsia-300/80 hover:text-fuchsia-200 hover:bg-fuchsia-950/40'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Velas Rosas ({pinkSignalsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('PURPLE')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              filter === 'PURPLE'
                ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/25'
                : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/40'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Velas Roxas ({purpleSignalsCount})</span>
          </button>
        </div>
      </div>

      {/* Signals List */}
      <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredSignals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhum sinal com este filtro registrado até o momento.
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const isGreen = sig.status === 'GREEN';
            const isRed = sig.status === 'RED';
            const isPending = sig.status === 'PENDING' || sig.status === 'ACTIVE';

            // Determinar se o resultado ou alvo é Vela Rosa (10x+) ou Vela Roxa (2x - 9.99x)
            const isPinkTier =
              (sig.resultMultiplier && sig.resultMultiplier >= 10.00) ||
              sig.resultTier === 'pink' ||
              sig.expectedTier === 'pink';

            const isPinkResult = Boolean(sig.resultMultiplier && sig.resultMultiplier >= 10.00);

            return (
              <div
                key={sig.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs transition ${
                  isPinkTier
                    ? 'bg-fuchsia-950/20 border-fuchsia-900/40 hover:border-fuchsia-700/60'
                    : 'bg-purple-950/20 border-purple-900/40 hover:border-purple-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isGreen ? (
                    isPinkResult || sig.expectedTier === 'pink' ? (
                      <div className="p-1 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                        <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        <Zap className="w-4 h-4 text-purple-400" />
                      </div>
                    )
                  ) : isRed ? (
                    <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <XCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <Clock className="w-4 h-4 animate-spin" />
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-white font-mono">
                        Minuto {sig.targetMinuteFormatted} ({sig.targetTimeFormatted})
                      </span>

                      {/* Badge do Tipo de Vela (Roxa ou Rosa) */}
                      {sig.expectedTier === 'pink' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-black bg-fuchsia-950/90 text-fuchsia-300 border border-fuchsia-500/60 shadow-xs">
                          <Sparkles className="w-3 h-3 text-fuchsia-400" />
                          <span>🌸 VELA ROSA (10x+)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-black bg-purple-950/90 text-purple-300 border border-purple-500/60 shadow-xs">
                          <Zap className="w-3 h-3 text-purple-400" />
                          <span>💜 VELA ROXA (2x-9.99x)</span>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        {sig.strategyName}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Probabilidade: <strong className="text-emerald-400">{sig.probability}%</strong> | Saída Segura: <strong className="text-sky-300">{sig.recommendedSafeExit.toFixed(2)}x</strong>
                      {sig.recommendedTarget && (
                        <span className="ml-1.5 text-slate-500">
                          (Alvo: <strong className={sig.expectedTier === 'pink' ? 'text-fuchsia-400' : 'text-purple-400'}>{sig.recommendedTarget.toFixed(2)}x</strong>)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Outcome Badge */}
                <div className="text-right shrink-0">
                  {isGreen ? (
                    isPinkResult ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-fuchsia-950 to-pink-950 border border-fuchsia-500 px-2.5 py-1 text-xs font-black text-fuchsia-200 shadow-sm shadow-fuchsia-500/30">
                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 animate-pulse" />
                        <span>ROSA {sig.resultMultiplier ? `${sig.resultMultiplier.toFixed(2)}x` : '10x+'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-500 px-2.5 py-1 text-xs font-black text-purple-200 shadow-sm shadow-purple-500/30">
                        <Zap className="w-3.5 h-3.5 text-purple-300" />
                        <span>ROXA {sig.resultMultiplier ? `${sig.resultMultiplier.toFixed(2)}x` : '2x+'}</span>
                      </span>
                    )
                  ) : isRed ? (
                    <span className="inline-flex items-center rounded-lg bg-rose-950/80 border border-rose-500/60 px-2.5 py-1 text-xs font-bold text-rose-400">
                      LOSS {sig.resultMultiplier ? `${sig.resultMultiplier.toFixed(2)}x` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-amber-950/80 border border-amber-500/60 px-2.5 py-1 text-xs font-bold text-amber-300">
                      EM ANDAMENTO
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

