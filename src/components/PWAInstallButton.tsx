import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-install-pwa"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-3.5 py-2 text-xs md:text-sm font-semibold text-white shadow-lg shadow-pink-600/30 hover:from-pink-500 hover:to-purple-500 transition-all active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span>Instalar App PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 transition-all"
        >
          <Smartphone className="w-3.5 h-3.5 text-pink-400" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-pink-500" />
                  Instalar no iOS (Safari)
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-xs font-bold text-pink-400">
                    1
                  </span>
                  <p>
                    Toque no botão <strong className="text-white flex items-center gap-1 inline-flex"><Share2 className="w-3.5 h-3.5 text-blue-400" /> Compartilhar</strong> na barra do Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                    2
                  </span>
                  <p>
                    Role para baixo e selecione <strong className="text-white">Adicionar à Tela de Início</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    3
                  </span>
                  <p>
                    Toque em <strong className="text-emerald-400">Adicionar</strong> no canto superior direito para rodar em tela cheia como aplicativo nativo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      id="btn-install-shortcut"
      onClick={() => {
        alert(
          'Para instalar este PWA: clique nos 3 pontinhos do seu navegador (ou ícone de instalação na barra de endereço) e selecione "Instalar aplicativo"!'
        );
      }}
      className="flex items-center gap-1.5 rounded-xl border border-pink-500/30 bg-pink-950/20 px-3 py-1.5 text-xs font-medium text-pink-300 hover:bg-pink-950/40 transition"
      title="Instalar aplicativo PWA"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Instalar PWA</span>
    </button>
  );
};
