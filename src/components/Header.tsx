import React from 'react';
import { Volume2, VolumeX, ShieldCheck, Clock, Flame, Radio } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { soundEffects } from '../utils/audio';

interface HeaderProps {
  currentTime: string;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  winRate: number;
  currentStreak: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  isAudioEnabled,
  onToggleAudio,
  winRate,
  currentStreak,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-rose-950/40 bg-[#0B0F19]/90 backdrop-blur-md px-3 sm:px-6 py-2.5"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-600 to-rose-800 shadow-md shadow-orange-600/30">
            <span className="font-black text-white text-xs tracking-tighter">BET</span>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0F19] animate-ping" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0F19]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1">
                GATILHOS <span className="text-rose-500 font-extrabold">AVIATOR</span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded bg-orange-500/20 border border-orange-500/40 px-1.5 py-0.5 text-[10px] font-black text-orange-400 uppercase tracking-wider shadow-xs shadow-orange-950">
                NO BETÃO
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                <Radio className="w-2.5 h-2.5 animate-pulse text-rose-500" />
                AO VIVO
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              Minutos Pagadores &amp; Probabilidades no Betão
            </p>
          </div>
        </div>

        {/* Real-time Clock & Global Stats */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Relógio Atômico */}
          <div
            id="atomic-clock"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 sm:px-3 py-1 text-slate-200 shadow-inner"
            title="Horário Oficial em Tempo Real"
          >
            <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-rose-100">
              {currentTime}
            </span>
          </div>

          {/* Taxa de Assertividade Badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{winRate}% Assertividade</span>
          </div>

          {/* Streak Badge */}
          {currentStreak > 0 && (
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-amber-400 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{currentStreak} Greens Seguidos</span>
            </div>
          )}

          {/* Botão de Áudio */}
          <button
            id="audio-toggle-button"
            onClick={onToggleAudio}
            className={`p-2 rounded-xl border transition ${
              isAudioEnabled
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
            title={isAudioEnabled ? 'Desativar Sons' : 'Ativar Sons de Alerta'}
            aria-label="Controle de Áudio"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
