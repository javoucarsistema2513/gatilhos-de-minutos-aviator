import React from 'react';
import { TriggerSignal } from '../types';
import { CheckCircle, XCircle, Clock, Award, TrendingUp } from 'lucide-react';

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
  const verifiedSignals = signals.slice(-15).reverse();

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
            <h3 className="text-sm font-bold text-white">Histórico de Sinais &amp; Assertividade</h3>
            <p className="text-[11px] text-slate-400">Verificação de greens e acertos em tempo real</p>
          </div>
        </div>

        {/* Win Rate Stats Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{winRate}% Assertividade</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-600/50 text-emerald-400 font-bold">
              {totalGreens} GREEN
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-rose-950 border border-rose-600/50 text-rose-400 font-bold">
              {totalReds} LOSS
            </span>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
        {verifiedSignals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhum sinal verificado ainda nesta sessão. Aguarde a validação da primeira rodada.
          </div>
        ) : (
          verifiedSignals.map((sig) => {
            const isGreen = sig.status === 'GREEN';
            const isRed = sig.status === 'RED';
            const isPending = sig.status === 'PENDING' || sig.status === 'ACTIVE';

            return (
              <div
                key={sig.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5">
                  {isGreen ? (
                    <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : isRed ? (
                    <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                      <XCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                      <Clock className="w-4 h-4 animate-spin" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">
                        Minuto {sig.targetMinuteFormatted} ({sig.targetTimeFormatted})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        {sig.strategyName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Probabilidade calculada: <strong className="text-emerald-400">{sig.probability}%</strong> | Saída: {sig.recommendedSafeExit.toFixed(2)}x
                    </span>
                  </div>
                </div>

                {/* Outcome Badge */}
                <div className="text-right shrink-0">
                  {isGreen ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 px-2.5 py-1 text-xs font-black text-emerald-400">
                      GREEN {sig.resultMultiplier ? `${sig.resultMultiplier.toFixed(2)}x` : ''}
                    </span>
                  ) : isRed ? (
                    <span className="inline-flex items-center rounded-lg bg-rose-950/80 border border-rose-500/60 px-2.5 py-1 text-xs font-bold text-rose-400">
                      LOSS
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
