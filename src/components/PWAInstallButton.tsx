import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const [showGenericGuide, setShowGenericGuide] = useState(false);

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
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-white shadow-md shadow-pink-600/30 hover:from-pink-500 hover:to-purple-500 transition-all active:scale-95 shrink-0"
        title="Instalar App no dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Instalar App</span>
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
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 transition-all shrink-0"
          title="Instalar no iPhone"
        >
          <Smartphone className="w-3.5 h-3.5 text-pink-400" />
          <span className="hidden md:inline">Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-pink-500" />
                  Instalar no iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-xl">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-xs font-bold text-pink-400">
                    1
                  </span>
                  <p>
                    Toque no botão <strong className="text-white inline-flex items-center gap-1"><Share2 className="w-3 h-3 text-blue-400" /> Compartilhar</strong> no Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-xl">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                    2
                  </span>
                  <p>
                    Role para baixo e toque em <strong className="text-white">Adicionar à Tela de Início</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-800/60 p-2.5 rounded-xl">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    3
                  </span>
                  <p>
                    Toque em <strong className="text-emerald-400">Adicionar</strong> para rodar como aplicativo nativo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
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
    <>
      <button
        id="btn-install-shortcut"
        onClick={() => setShowGenericGuide(true)}
        className="flex items-center gap-1 rounded-xl border border-pink-500/30 bg-pink-950/20 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-pink-300 hover:bg-pink-950/40 transition shrink-0"
        title="Instalar aplicativo no celular ou PC"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Instalar</span>
      </button>

      {showGenericGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-pink-500" />
                Como Instalar o App
              </h3>
              <button
                onClick={() => setShowGenericGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-300">
              <p>
                • <strong>No Android/Chrome:</strong> Toque no menu do navegador (três pontinhos no topo) e escolha <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
              </p>
              <p>
                • <strong>No iPhone/Safari:</strong> Toque em Compartilhar e selecione <strong>"Adicionar à Tela de Início"</strong>.
              </p>
              <p>
                • <strong>No Computador:</strong> Clique no ícone de download/instalação na barra de endereço do navegador.
              </p>
            </div>
            <button
              onClick={() => setShowGenericGuide(false)}
              className="mt-4 w-full rounded-xl bg-pink-600 py-2 text-xs font-bold text-white hover:bg-pink-500 transition"
            >
              OK, Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
