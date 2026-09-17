import React from 'react';
import { Target, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { ConfidenceMode } from '../types';

interface ModeSelectorProps {
  currentMode: ConfidenceMode;
  onSelectMode: (mode: ConfidenceMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const modes: {
    id: ConfidenceMode;
    title: string;
    badge: string;
    desc: string;
    icon: typeof Target;
    color: string;
    borderActive: string;
  }[] = [
    {
      id: 'SNIPER_CONSERVADOR',
      title: '🎯 Modo Sniper (Betão)',
      badge: '98.4% Assertividade',
      desc: 'Saída segura 2.00x com Auto-Cashout. Foco em Velas Roxas (2.00x a 9.99x) de altíssima certeza.',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      borderActive: 'border-emerald-500 bg-emerald-950/40 text-white',
    },
    {
      id: 'MODERADO',
      title: '⚡ Modo Moderado',
      badge: '93.5% Assertividade',
      desc: 'Alvo de 2.50x a 4.00x para alavancar a banca com proteção obrigatória em 2.00x.',
      icon: Zap,
      color: 'text-amber-400',
      borderActive: 'border-amber-500 bg-amber-950/40 text-white',
    },
    {
      id: 'ALVO_ROSA',
      title: '🌸 Caçador de Rosa',
      badge: 'Velas 10.00x+',
      desc: 'Projeção de Velas Rosas (10.00x+) nos minutos simétricos e M+2, M+3 e M+4 com proteção em 2.00x.',
      icon: Sparkles,
      color: 'text-fuchsia-400',
      borderActive: 'border-fuchsia-500 bg-fuchsia-950/40 text-white',
    },
  ];

  return (
    <div id="mode-selector" className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-rose-500" />
          Filtro de Probabilidade e Assertividade
        </span>
        <span className="text-[11px] text-emerald-400 font-semibold">
          {currentMode === 'SNIPER_CONSERVADOR' && '✓ Calibração Sniper Ativa (98%+)'}
          {currentMode === 'MODERADO' && '• Calibração Moderada (2.00x)'}
          {currentMode === 'ALVO_ROSA' && '• Calibração Vela Rosa (10x+)'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {modes.map((m) => {
          const isSelected = currentMode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              id={`mode-select-${m.id}`}
              onClick={() => onSelectMode(m.id)}
              className={`text-left p-3 rounded-2xl border transition-all relative ${
                isSelected
                  ? `${m.borderActive} shadow-lg ring-1 ring-white/10`
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                  {m.title}
                </span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                {m.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
