import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, Monitor, CheckCircle, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, platformName, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed in standalone mode
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Instalado</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Instalar AeroCalc no seu celular ou computador (PWA)"
        className={`relative group flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-rose-950/50 transition-all border border-rose-400/40 ${className}`}
      >
        {/* Red airplane icon badge */}
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
          <img src="/icon.svg" alt="Avião Vermelho" className="w-3 h-3" />
        </div>
        <span className="font-sans">Instalar App</span>
        <Download className="w-3.5 h-3.5 text-rose-100 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* Guided installation modal for iOS / manual PWA install on all devices */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white space-y-5">
            {/* Header with Red Airplane */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-rose-500/60 p-1.5 flex items-center justify-center shadow-md shadow-rose-950">
                  <img src="/icon.svg" alt="AeroCalc Avião Vermelho" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Instalar AeroCalc PWA
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Todos os Dispositivos
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Funciona offline e em tela cheia sem barras de navegador</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Instructions */}
            {isIOS ? (
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                  <Smartphone className="w-4 h-4" />
                  <span>Passo a passo no iPhone ou iPad (Safari):</span>
                </div>
                <ol className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <span>
                      Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" />) na barra inferior do Safari.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <span>
                      Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />).
                    </span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono flex items-center justify-center flex-shrink-0">
                      3
                    </span>
                    <span>
                      Toque em <strong>Adicionar</strong> no canto superior direito. O ícone com o avião vermelho aparecerá na sua tela inicial!
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                  {platformName === 'android' ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                  <span>
                    Instalação no {platformName === 'android' ? 'Android (Chrome / Samsung)' : 'Computador (Chrome / Edge / Windows / Mac)'}:
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O AeroCalc é compatível com o padrão PWA. No menu do seu navegador (três pontinhos <strong className="text-white">⋮</strong> ou ícone de instalação na barra de endereços), clique em <strong className="text-rose-300">"Instalar Aplicativo"</strong> ou <strong className="text-rose-300">"Adicionar à tela inicial"</strong>.
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>✓ Acesso offline</span>
                  <span>✓ Notificações e som</span>
                  <span>✓ Modo tela cheia</span>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
