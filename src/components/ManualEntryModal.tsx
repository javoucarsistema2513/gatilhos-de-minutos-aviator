import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { RoundData } from '../types';
import { getMultiplierTier, formatTime } from '../utils/aviatorEngine';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRound: (round: RoundData) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onAddRound,
}) => {
  const [val, setVal] = useState<string>('');

  if (!isOpen) return null;

  const handleAdd = (multiplierNum: number) => {
    if (isNaN(multiplierNum) || multiplierNum < 1.00) return;
    const now = new Date();
    const newRound: RoundData = {
      id: `round-manual-${Date.now()}`,
      multiplier: Number(multiplierNum.toFixed(2)),
      timestamp: now.getTime(),
      minute: now.getMinutes(),
      timeFormatted: formatTime(now),
      tier: getMultiplierTier(multiplierNum),
    };
    onAddRound(newRound);
    setVal('');
    onClose();
  };

  const quickPresets = [
    { label: '1.10x', val: 1.10, tier: 'blue' },
    { label: '1.45x', val: 1.45, tier: 'blue' },
    { label: '1.80x', val: 1.80, tier: 'blue' },
    { label: '2.15x', val: 2.15, tier: 'purple' },
    { label: '3.50x', val: 3.50, tier: 'purple' },
    { label: '6.20x', val: 6.20, tier: 'purple' },
    { label: '10.50x 🌸', val: 10.50, tier: 'pink' },
    { label: '25.00x 🌸', val: 25.00, tier: 'pink' },
    { label: '50.00x 🌸', val: 50.00, tier: 'pink' },
    { label: '100.00x 🌸', val: 100.00, tier: 'pink' },
  ];

  return (
    <div
      id="manual-entry-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-rose-500/30 p-5 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Inserir Vela do Betão</h3>
          </div>
          <button
            id="close-manual-modal-button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Digite o multiplicador que acabou de sair na sua mesa do Aviator no Betão para sincronizar e recalcular os gatilhos no minuto exato.
        </p>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd(parseFloat(val));
          }}
          className="mt-4 flex gap-2"
        >
          <div className="relative flex-1">
            <input
              id="candle-multiplier-input"
              type="number"
              step="0.01"
              min="1.00"
              placeholder="Ex: 14.85"
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base focus:border-rose-500 focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
              x
            </span>
          </div>
          <button
            id="submit-candle-button"
            type="submit"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white transition active:scale-95"
          >
            Adicionar
          </button>
        </form>

        {/* Quick Tap Presets */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            Ou toque em um valor rápido:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleAdd(preset.val)}
                className={`p-2 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-1 ${
                  preset.tier === 'pink'
                    ? 'bg-fuchsia-950/70 border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-900'
                    : preset.tier === 'purple'
                    ? 'bg-purple-950/70 border-purple-500/40 text-purple-300 hover:bg-purple-900'
                    : 'bg-sky-950/70 border-sky-600/40 text-sky-300 hover:bg-sky-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
