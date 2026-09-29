import React, { useState } from 'react';
import { Plane, Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside installed standalone PWA app, hide button
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>App Instalado</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-900/40 hover:from-rose-500 hover:to-purple-500 hover:shadow-rose-600/30 transition-all duration-200 active:scale-95 cursor-pointer border border-rose-400/30"
        title="Instalar App Radar Aviator no seu celular ou computador"
      >
        <Plane className="w-4 h-4 text-white -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        <span className="tracking-wide">Instalar App</span>
        <Download className="w-3.5 h-3.5 opacity-80" />
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-rose-900/60 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 transition-all cursor-pointer shadow-md"
        >
          <Plane className="w-3.5 h-3.5 text-rose-400 -rotate-45" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[#120a21] border border-rose-500/30 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center p-2">
                  <img src="/icon.svg" alt="Aviator Icon" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Instalar Radar Aviator</h3>
                  <p className="text-xs text-rose-300">PWA com ícone de avião na tela de início</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 bg-slate-900/60 rounded-xl p-3.5 border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">1</div>
                  <p>No Safari, toque no botão <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-sky-400" /> Compartilhar</strong> na barra inferior.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">2</div>
                  <p>Role a tela e toque em <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> Adicionar à Tela de Início</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">3</div>
                  <p>Toque em <strong>Adicionar</strong> no canto superior direito para fixar o ícone do Avião.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-rose-900/50"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers that haven't fired beforeinstallprompt yet or already available
  return (
    <button
      onClick={() => {
        alert('Para instalar: no menu do navegador (três pontinhos), clique em "Instalar aplicativo" ou "Adicionar à tela inicial"');
      }}
      className="flex items-center gap-1.5 rounded-xl bg-rose-950/60 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 transition cursor-pointer"
      title="Instalar como aplicativo PWA com ícone de avião"
    >
      <Plane className="w-3.5 h-3.5 text-rose-400 -rotate-45" />
      <span>Instalar App</span>
    </button>
  );
};
