import React, { useState } from 'react';
import { AviatorCandle, CandleColor } from '../types';
import { Download, Filter, History, RefreshCw, Trash2 } from 'lucide-react';

interface CandleHistoryTableProps {
  candles: AviatorCandle[];
  onResetCandles: () => void;
}

export const CandleHistoryTable: React.FC<CandleHistoryTableProps> = ({
  candles,
  onResetCandles,
}) => {
  const [filterColor, setFilterColor] = useState<CandleColor | 'all'>('all');

  const filteredCandles = candles.filter((c) => {
    if (filterColor === 'all') return true;
    return c.color === filterColor;
  });

  const exportCSV = () => {
    const headers = 'Rodada,Multiplicador,Cor,Minuto,Horario\n';
    const rows = candles
      .map(
        (c) =>
          `${c.roundNumber},${c.multiplier.toFixed(2)},${c.color},:${c.payingMinute},"${new Date(
            c.timestamp
          ).toLocaleTimeString()}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aviator_radar_velas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Histórico Completo de Velas Gravadas
            </h2>
            <p className="text-xs text-slate-400">
              {candles.length} velas catalogadas nesta sessão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onResetCandles}
            className="flex items-center gap-1.5 rounded-xl border border-rose-900/40 bg-rose-950/30 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" />
            <span>Resetar Dados</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filtrar por:
        </span>

        {[
          { key: 'all', label: 'Todas as Velas' },
          { key: 'pink', label: 'Velas Rosa (10x+)' },
          { key: 'purple', label: 'Velas Roxa (2x-10x)' },
          { key: 'blue', label: 'Velas Azul (<2x)' },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilterColor(btn.key as CandleColor | 'all')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              filterColor === btn.key
                ? 'border-pink-500 bg-pink-600 text-white'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-4 py-3">Rodada</th>
                <th className="px-4 py-3">Multiplicador</th>
                <th className="px-4 py-3">Classificação</th>
                <th className="px-4 py-3">Minutagem</th>
                <th className="px-4 py-3">Horário da Saída (Hora : Min : Seg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandles.map((c) => {
                const isLatest = candles.length > 0 && c.id === candles[0].id;
                const candleDate = new Date(c.timestamp);
                const hourStr = String(candleDate.getHours()).padStart(2, '0');
                const minStr = String(candleDate.getMinutes()).padStart(2, '0');
                const secStr = String(candleDate.getSeconds()).padStart(2, '0');

                let badge = '';
                if (c.color === 'pink') {
                  badge = 'bg-pink-500/20 text-pink-400 border border-pink-500/30 font-black';
                } else if (c.color === 'purple') {
                  badge = 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold';
                } else {
                  badge = 'bg-slate-800 text-blue-300';
                }

                return (
                  <tr
                    key={c.id}
                    className={`transition ${
                      isLatest ? 'bg-pink-950/20 hover:bg-pink-950/30 border-l-2 border-l-pink-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>#{c.roundNumber}</span>
                        {isLatest && (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">
                            🔴 Última Saída
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-lg px-2.5 py-1 text-xs ${badge}`}>
                        {c.multiplier.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize font-semibold text-slate-300">
                        {c.color === 'pink' ? 'Vela Rosa (Alta)' : c.color === 'purple' ? 'Vela Roxa (Média)' : 'Vela Azul (Baixa)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-300">
                      :{String(c.payingMinute).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold">{hourStr}:{minStr}:</span>
                        <span className="text-emerald-400 font-black">{secStr}s</span>
                        {isLatest && (
                          <span className="text-[10px] text-slate-400">
                            (Acabou de sair)
                          </span>
                        )}
                      </div>
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
