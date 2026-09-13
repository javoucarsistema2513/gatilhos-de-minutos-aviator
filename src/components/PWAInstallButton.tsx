import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed
  if (isInstalled) {
    return (
      <div
        id="pwa-installed-badge"
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>PWA Instalado</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-button"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-lg shadow-rose-600/30 transition active:scale-95 border border-rose-400/40"
      >
        <Download className="w-4 h-4" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-guide-button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div
            id="ios-install-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#0F172A] border border-rose-500/30 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Instalar no iOS</h3>
                </div>
                <button
                  id="close-ios-modal-button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">1. Toque em Compartilhar</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Na barra inferior do seu navegador Safari do iPhone.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">2. Adicionar à Tela de Início</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Role a lista para baixo e selecione &quot;Adicionar à Tela de Início&quot;.</p>
                  </div>
                </div>
              </div>

              <button
                id="ios-guide-dismiss-button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop generic install guide button
  return (
    <button
      id="pwa-generic-install-button"
      onClick={() => {
        alert("Para instalar este app PWA: no Chrome ou Edge clique no ícone de instalar (computador/seta para baixo) na barra de endereços!");
      }}
      className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
    >
      <Download className="w-3.5 h-3.5 text-rose-400" />
      <span>Instalar PWA</span>
    </button>
  );
};
