import React from 'react';
import { RoundData } from '../types';
import { Sparkles, History } from 'lucide-react';

interface RoundsHistoryBarProps {
  rounds: RoundData[];
  onOpenManualModal: () => void;
}

export const RoundsHistoryBar: React.FC<RoundsHistoryBarProps> = ({
  rounds,
  onOpenManualModal,
}) => {
  const recentRounds = rounds.slice(-25).reverse();
  const pinkCount = rounds.slice(-30).filter(r => r.tier === 'pink').length;
  const purpleCount = rounds.slice(-30).filter(r => r.tier === 'purple').length;

  const getBadgeClass = (tier: RoundData['tier']) => {
    switch (tier) {
      case 'pink':
        return 'bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white border-fuchsia-400/80 shadow-md shadow-fuchsia-900/40 font-black scale-105';
      case 'purple':
        return 'bg-purple-900/80 text-purple-200 border-purple-600/70 hover:bg-purple-800/80';
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

        {/* Scrollable Badges List */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 mask-edges">
          {recentRounds.map((round) => (
            <div
              key={round.id}
              className={`shrink-0 cursor-default px-2.5 py-0.5 rounded-lg border text-xs transition duration-150 ${getBadgeClass(
                round.tier
              )}`}
              title={`Minuto :${String(round.minute).padStart(2, '0')} (${round.timeFormatted})`}
            >
              <div className="flex items-baseline gap-1">
                <span>{round.multiplier.toFixed(2)}x</span>
                <span className="text-[9px] opacity-70 font-mono">
                  :{String(round.minute).padStart(2, '0')}
                </span>
              </div>
            </div>
          ))}
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
