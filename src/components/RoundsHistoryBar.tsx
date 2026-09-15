import React from 'react';
import { RoundData } from '../types';
import { Sparkles, History, Clock } from 'lucide-react';

interface RoundsHistoryBarProps {
  rounds: RoundData[];
  onOpenManualModal: () => void;
}

export const RoundsHistoryBar: React.FC<RoundsHistoryBarProps> = ({
  rounds,
  onOpenManualModal,
}) => {
  const recentRounds = rounds.slice(-25).reverse();
  const pinkCount = rounds.slice(-30).filter((r) => r.tier === 'pink').length;
  const purpleCount = rounds.slice(-30).filter((r) => r.tier === 'purple').length;

  // Os dois últimos registros de vela pagadora (>= 2.00x - roxas e rosas)
  const payingRounds = rounds.filter((r) => r.multiplier >= 2.00);
  const lastTwoPaying = payingRounds.slice(-2);
  const lastTwoPayingIds = new Set(lastTwoPaying.map((r) => r.id));

  // Também identificar as 2 últimas velas rosas (>= 10.00x)
  const pinkRounds = rounds.filter((r) => r.tier === 'pink');
  const lastTwoPinkIds = new Set(pinkRounds.slice(-2).map((r) => r.id));

  const isHighlightedPaying = (round: RoundData) =>
    lastTwoPayingIds.has(round.id) || lastTwoPinkIds.has(round.id);

  const getBadgeClass = (round: RoundData) => {
    const isPaying = isHighlightedPaying(round);
    switch (round.tier) {
      case 'pink':
        return `bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white font-black transition-all ${
          isPaying
            ? 'ring-2 ring-amber-300 border-amber-300 shadow-lg shadow-fuchsia-900/60 scale-105'
            : 'border-fuchsia-400/80 shadow-md shadow-fuchsia-900/40'
        }`;
      case 'purple':
        return `text-purple-200 transition-all ${
          isPaying
            ? 'bg-purple-900/90 ring-2 ring-amber-400 border-amber-400/90 font-black shadow-md shadow-purple-950 scale-105'
            : 'bg-purple-900/80 border-purple-600/70 hover:bg-purple-800/80'
        }`;
      case 'blue':
      default:
        return 'bg-sky-950/70 text-sky-300 border-sky-700/50 hover:bg-sky-900/70';
    }
  };

  return (
    <div
      id="rounds-history-container"
      className="w-full bg-[#080B13] border-b border-slate-800/80 px-3 sm:px-6 py-2"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
        {/* Label & Stats */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Histórico:</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded-md bg-fuchsia-950/60 border border-fuchsia-500/40 text-fuchsia-300 font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-fuchsia-400" />
              {pinkCount} Rosas
            </span>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300 font-medium">
              {purpleCount} Roxas
            </span>
          </div>
        </div>

        {/* Destaque das 2 Últimas Velas Pagadoras com Hora, Minuto e Segundo */}
        {lastTwoPaying.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-xs shrink-0">
            <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <Clock className="w-3 h-3 text-amber-400" />
              2 Últimas Pagadoras:
            </span>
            <div className="flex items-center gap-1.5">
              {lastTwoPaying.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-mono ${
                    p.tier === 'pink'
                      ? 'bg-rose-950/80 border-rose-500/70 text-rose-200'
                      : 'bg-purple-950/80 border-purple-500/70 text-purple-200'
                  }`}
                  title={`Vela pagadora registrada exatamente às ${p.timeFormatted}`}
                >
                  <span className="font-extrabold font-sans">{p.multiplier.toFixed(2)}x</span>
                  <span className="text-amber-300 font-bold bg-black/60 px-1 rounded text-[10px] tracking-tight">
                    {p.timeFormatted}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Badges List */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 mask-edges">
          {recentRounds.map((round) => {
            const isPayingTwo = isHighlightedPaying(round);
            return (
              <div
                key={round.id}
                className={`shrink-0 cursor-default px-2.5 py-1 rounded-lg border text-xs transition duration-150 ${getBadgeClass(
                  round
                )}`}
                title={`Vela: ${round.multiplier.toFixed(2)}x | Horário exato: ${round.timeFormatted} (Hora, Minuto e Segundo)`}
              >
                {isPayingTwo ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[12px]">{round.multiplier.toFixed(2)}x</span>
                    <span className="text-[10px] font-mono font-bold bg-black/70 px-1.5 py-0.5 rounded text-amber-300 border border-amber-400/50 tracking-wider flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-amber-400 inline shrink-0" />
                      {round.timeFormatted}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span>{round.multiplier.toFixed(2)}x</span>
                    <span className="text-[9px] opacity-70 font-mono">
                      :{String(round.minute).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botão de Adicionar Vela Manual */}
        <button
          id="add-candle-button"
          onClick={onOpenManualModal}
          className="shrink-0 px-2.5 py-1 rounded-lg border border-orange-500/40 bg-orange-950/30 hover:bg-orange-900/40 text-[11px] font-bold text-orange-300 transition"
          title="Inserir vela vista no Betão"
        >
          + Inserir Vela do Betão
        </button>
      </div>
    </div>
  );
};
