import React, { useState } from 'react';
import { Candle, CandleColor } from '../types/aviator';
import { Plus, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { formatTime, getCandleColor } from '../utils/aviatorEngine';

interface CandleTapeProps {
  candles: Candle[];
  onSelectCandle: (candle: Candle) => void;
  onAddCandle: (multiplier: number) => void;
  onClearAndSync: () => void;
}

export const CandleTape: React.FC<CandleTapeProps> = ({
  candles,
  onSelectCandle,
  onAddCandle,
  onClearAndSync,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [isInputOpen, setIsInputOpen] = useState(false);

  // Recent 16 candles
  const displayCandles = [...candles].reverse().slice(0, 16);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customInput.replace(',', '.'));
    if (!isNaN(val) && val >= 1.0) {
      onAddCandle(Number(val.toFixed(2)));
      setCustomInput('');
      setIsInputOpen(false);
    }
  };

  const getPillStyle = (color: CandleColor, multiplier: number) => {
    if (color === 'pink') {
      return 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-900/50 border border-pink-400 font-extrabold animate-pulse';
    }
    if (color === 'purple') {
      return 'bg-purple-700 text-purple-100 border border-purple-500/50 font-bold';
    }
    return 'bg-slate-800 text-sky-300 border border-slate-700 font-medium';
  };

  return (
    <div className="w-full bg-[#0d071b] border-y border-rose-950/70 py-2 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Label & Sync Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Velas 82b:
          </span>

          {/* Quick Add buttons for the user to match their 82b screen immediately */}
          <button
            onClick={() => onAddCandle(1.40)}
            className="px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-600/40 text-[10px] font-bold text-sky-300 transition cursor-pointer"
            title="Registrar vela azul (< 2x) que acabou de sair na 82b"
          >
            + Azul
          </button>
          
          <button
            onClick={() => onAddCandle(2.80)}
            className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-600/40 text-[10px] font-bold text-purple-300 transition cursor-pointer"
            title="Registrar vela roxa (2x+) que acabou de sair na 82b"
          >
            + Roxa
          </button>

          <button
            onClick={() => onAddCandle(14.50)}
            className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-[10px] font-bold text-pink-300 transition cursor-pointer"
            title="Registrar vela rosa (10x+) que acabou de sair na 82b"
          >
            + Rosa
          </button>

          <button
            onClick={() => setIsInputOpen(!isInputOpen)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            title="Digitar multiplicador exato da 82b"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Custom Input Popover */}
        {isInputOpen && (
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Ex: 3.45"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-18 px-2 py-0.5 rounded bg-slate-900 border border-rose-500 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-0.5 rounded bg-rose-600 text-[10px] font-bold text-white hover:bg-rose-500 cursor-pointer"
            >
              OK
            </button>
          </form>
        )}

        {/* Candle Ribbon */}
        <div className="flex-1 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-rose-950/60 scrollbar-track-transparent w-full">
          <div className="flex items-center gap-1.5 justify-start sm:justify-end">
            {displayCandles.map((candle, idx) => (
              <button
                key={candle.id}
                onClick={() => onSelectCandle(candle)}
                className={`relative px-2 py-0.5 rounded-full text-[11px] tracking-tight whitespace-nowrap cursor-pointer shrink-0 ${getPillStyle(
                  candle.color,
                  candle.multiplier
                )} ${idx === 0 ? 'ring-2 ring-emerald-400' : ''}`}
                title={`Vela: ${candle.multiplier.toFixed(2)}x - Horário: ${candle.timeFormatted} (Minuto :${String(candle.minute).padStart(2, '0')})`}
              >
                <span>{candle.multiplier.toFixed(2)}x</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
