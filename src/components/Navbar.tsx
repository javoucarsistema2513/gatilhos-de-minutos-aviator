import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Bell, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface NavbarProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  unreadNotificationsCount: number;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  onOpenSyncModal: () => void;
  onOpenNotificationsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  soundEnabled,
  setSoundEnabled,
  unreadNotificationsCount,
  isSimulating,
  setIsSimulating,
  onOpenSyncModal,
  onOpenNotificationsModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-purple-800 shadow-md shadow-pink-600/30">
            <img src="/icon.svg" alt="Radar Icon" className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-pink-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white sm:text-lg">
                AVIATOR <span className="bg-gradient-to-r from-pink-500 to-purple-400 bg-clip-text text-transparent">RADAR VIP</span>
              </h1>
              <span className="rounded-md border border-pink-500/40 bg-pink-500/20 px-2 py-0.5 text-[10px] font-black text-pink-300 uppercase">
                ROXA & ROSA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Previsão Cirúrgica da Próxima Vela (Roxa 2x+ ou Rosa 10x+)
            </p>
          </div>
        </div>

        {/* Right Actions: Sincronizar Mesa, Live/Simulation toggle, Notifications, Sound toggle, PWA Install */}
        <div className="flex items-center gap-2">
          {/* Synchronize Table Button */}
          <button
            id="btn-navbar-sync-table"
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 rounded-xl border border-pink-500/60 bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-pink-600/20 hover:brightness-110 transition active:scale-95"
            title="Sincronizar sequência de velas do Aviator oficial"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sincronizar Mesa</span>
            <span className="sm:hidden">Sincronizar</span>
          </button>

          {/* Mode Switch: Real Table vs Training Simulation */}
          <button
            id="btn-toggle-simulation"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold border transition ${
              !isSimulating
                ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400'
                : 'border-amber-500/60 bg-amber-950/40 text-amber-300'
            }`}
            title={
              !isSimulating
                ? 'Mesa Real Ativa: sem geração de velas fictícias'
                : 'Modo Treino: gerando rodadas automáticas para teste'
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                !isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline">
              {!isSimulating ? 'Mesa Real' : 'Modo Treino'}
            </span>
          </button>

          {/* Notifications / Alerts Button */}
          <button
            id="btn-navbar-notifications"
            onClick={onOpenNotificationsModal}
            className="relative flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Alertas no Telegram, Discord e Push"
          >
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Alertas</span>
            {unreadNotificationsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-xl border p-2 text-xs transition ${
              soundEnabled
                ? 'border-slate-800 bg-slate-900 text-pink-400 hover:bg-slate-800'
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Silenciar áudio' : 'Ativar alertas sonoros'}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-pink-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {/* PWA Install */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
