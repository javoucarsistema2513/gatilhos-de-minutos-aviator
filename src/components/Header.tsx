import React from 'react';
import { Volume2, VolumeX, ShieldCheck, Clock, Flame, Radio, ExternalLink, Link2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { soundEffects } from '../utils/audio';

interface HeaderProps {
  currentTime: string;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  winRate: number;
  currentStreak: number;
  onOpenBetaoBridge?: () => void;
  isLiveConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  isAudioEnabled,
  onToggleAudio,
  winRate,
  currentStreak,
  onOpenBetaoBridge,
  isLiveConnected = false,
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
              <button
                onClick={onOpenBetaoBridge}
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition ${
                  isLiveConnected
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-orange-500/20 border-orange-500/40 text-orange-400 hover:bg-orange-500/30'
                }`}
                title="Sincronizar com betao.bet.br/games/aviator-spribe"
              >
                <Link2 className="w-2.5 h-2.5" />
                <span>{isLiveConnected ? 'BETÃO CONECTADO' : 'MESA BETÃO'}</span>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                <Radio className="w-2.5 h-2.5 animate-pulse text-rose-500" />
                AO VIVO
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Mesa Oficial:</span>
              <a
                href="https://betao.bet.br/games/aviator-spribe"
                target="_blank"
                rel="noreferrer"
                className="text-rose-400 hover:text-rose-300 underline font-mono flex items-center gap-0.5"
                title="Abrir mesa betao.bet.br/games/aviator-spribe"
              >
                betao.bet.br/games/aviator-spribe
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
            </div>
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

          {/* Botão de Áudio e Voz */}
          <button
            id="audio-toggle-button"
            onClick={onToggleAudio}
            className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 ${
              isAudioEnabled
                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 shadow-xs shadow-rose-950'
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
            title={isAudioEnabled ? 'Sons e Voz Ativos (Clique para alternar)' : 'Ativar Sons e Voz'}
            aria-label="Controle de Áudio e Voz"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{isAudioEnabled ? 'Voz & Som ON' : 'Voz Mudo'}</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
