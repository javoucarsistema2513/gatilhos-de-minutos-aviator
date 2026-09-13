import React from 'react';
import { MinuteHeatmapData } from '../types';
import { Flame, Sparkles, Clock, Target, Info } from 'lucide-react';

interface MinuteHeatmapProps {
  heatmapData: MinuteHeatmapData[];
  currentMinute: number;
  targetMinute?: number;
  onSelectMinute?: (minute: number) => void;
}

export const MinuteHeatmap: React.FC<MinuteHeatmapProps> = ({
  heatmapData,
  currentMinute,
  targetMinute,
  onSelectMinute,
}) => {
  // Encontrar os top 5 minutos mais pagadores
  const topMinutes = [...heatmapData]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const getMinuteBoxClass = (item: MinuteHeatmapData) => {
    const isCurrent = item.minute === currentMinute;
    const isTarget = item.minute === targetMinute;

    if (isTarget) {
      return 'bg-rose-600 text-white font-black ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-950 scale-110 shadow-lg shadow-rose-600/50 z-20';
    }

    if (isCurrent) {
      return 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-300 scale-105 shadow-md shadow-emerald-500/40 z-10';
    }

    if (item.pinkCount > 0) {
      return 'bg-gradient-to-br from-fuchsia-600 to-rose-700 text-white font-bold border border-fuchsia-400/60 shadow-xs shadow-fuchsia-900/30';
    }

    if (item.score >= 70) {
      return 'bg-purple-800/80 text-purple-200 border border-purple-500/50 hover:bg-purple-700/80';
    }

    if (item.score >= 45) {
      return 'bg-slate-800/70 text-slate-300 border border-slate-700/40 hover:bg-slate-750';
    }

    return 'bg-slate-900/40 text-slate-500 border border-slate-800/30 hover:bg-slate-800/40';
  };

  return (
    <div
      id="minute-heatmap-container"
      className="rounded-2xl border border-slate-800 bg-[#0C101C]/80 p-4 sm:p-5 shadow-xl backdrop-blur-md"
    >
      {/* Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Mapa de Minutos Pagadores (0 a 59)
            </h3>
            <p className="text-[11px] text-slate-400">
              Densidade e probabilidade de velas por minuto do relógio
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Minuto Atual
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" /> Gatilho Ativo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-fuchsia-600 inline-block" /> Vela Rosa
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-800 inline-block" /> Alta Atividade
          </span>
        </div>
      </div>

      {/* 60 Minutes Grid (00 to 59) */}
      <div className="mt-4 grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 gap-1.5 sm:gap-2">
        {heatmapData.map((item) => {
          const isTarget = item.minute === targetMinute;
          const isCurrent = item.minute === currentMinute;

          return (
            <button
              key={item.minute}
              type="button"
              onClick={() => onSelectMinute?.(item.minute)}
              className={`relative flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 text-xs transition duration-150 ${getMinuteBoxClass(
                item
              )}`}
              title={`Minuto :${String(item.minute).padStart(2, '0')} - Assertividade: ${item.score}% (${item.pinkCount} rosas, ${item.purpleCount} roxas)`}
            >
              <span className="font-mono text-xs tracking-tighter">
                :{String(item.minute).padStart(2, '0')}
              </span>

              {item.pinkCount > 0 && !isTarget && !isCurrent && (
                <Sparkles className="w-2.5 h-2.5 text-fuchsia-300 mt-0.5" />
              )}

              {isTarget && (
                <Target className="w-3 h-3 text-white animate-bounce mt-0.5" />
              )}

              {isCurrent && !isTarget && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Top 5 Minutos da Hora */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-800/60 bg-slate-950/40 p-3 rounded-xl border">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-white">Top 5 Minutos Mais Pagadores:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {topMinutes.map((top, idx) => (
            <div
              key={top.minute}
              className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-700 px-2 py-0.5 text-xs font-mono"
            >
              <span className="text-amber-400 font-bold">#{idx + 1}</span>
              <span className="text-white font-black">:{String(top.minute).padStart(2, '0')}</span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                ({top.score}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
