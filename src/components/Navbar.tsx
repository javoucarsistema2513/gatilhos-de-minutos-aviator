import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bell, BellOff, HelpCircle, Activity } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenGuide: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGuide,
  isMuted,
  onToggleMute,
  notificationsEnabled,
  onToggleNotifications,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rose-950/60 bg-[#0b0614]/90 backdrop-blur-md px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-purple-800 p-0.5 shadow-lg shadow-rose-950/60 flex items-center justify-center">
              <div className="w-full h-full bg-[#120824] rounded-[10px] flex items-center justify-center overflow-hidden">
                <img 
                  src="/icon.svg" 
                  alt="Aviator Airplane Icon" 
                  className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" 
                />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase flex items-center gap-1">
                <span className="text-rose-500">RADAR</span> AVIATOR
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                82B.GAME
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400 inline" />
              <span>ALGORITMO DE VELAS ROXAS & ROSAS</span>
            </p>
          </div>
        </div>

        {/* Center: Live Clock & Sync indicator */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#140b29] border border-rose-950/80">
          <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Hora Oficial (Sync)</span>
            <span className="text-sm font-black font-mono text-white tracking-widest">{currentTime || '--:--:--'}</span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">AO VIVO</span>
          </div>
        </div>

        {/* Action Controls & PWA Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isMuted
                ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-rose-950/40 border-rose-600/30 text-rose-300 hover:bg-rose-900/50'
            }`}
            title={isMuted ? 'Ativar Sons do Radar' : 'Silenciar Sons'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Notifications toggle */}
          <button
            onClick={onToggleNotifications}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              !notificationsEnabled
                ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
            }`}
            title={notificationsEnabled ? 'Notificações de Rosas Ativadas' : 'Ativar Alertas no Navegador'}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4 text-purple-400" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Strategy Guide Modal trigger */}
          <button
            onClick={onOpenGuide}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-medium"
            title="Como funciona o padrão 82b e as minutagens"
          >
            <HelpCircle className="w-4 h-4 text-rose-400" />
            <span className="hidden lg:inline">Estratégias 82b</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
