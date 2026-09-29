import React from 'react';
import { X, BookOpen, ShieldCheck, Sparkles, Zap, Radio, Plane, HelpCircle, CheckCircle } from 'lucide-react';

interface StrategyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyGuideModal: React.FC<StrategyGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#120824] border border-rose-500/40 p-5 sm:p-7 shadow-2xl relative text-white scrollbar-thin scrollbar-thumb-rose-950">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-rose-950/80">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-purple-800 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#120824] rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-rose-400" />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-white">
              Manual do Padrão 82b.game & Minutagens
            </h3>
            <p className="text-xs text-rose-300">
              Guia definitivo para caçar Velas Roxas (2x+) e Rosas (10x+) no Aviator
            </p>
          </div>
        </div>

        {/* Strategies Section */}
        <div className="mt-5 space-y-4 text-xs">
          
          {/* Strategy 1: Minutagem Pagante */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-rose-950/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Radio className="w-4 h-4" />
              <span>1. Como ler as Minutagens do Radar 82b</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              O algoritmo do Aviator no padrão do site 82b opera em ciclos de tempo sincronizados com os minutos do relógio. Quando uma vela Rosa surge (ex: no minuto <strong className="text-rose-400 font-mono">:14</strong>), o radar projeta os próximos minutos espelhos (ex: <strong className="text-rose-400 font-mono">:24</strong>, <strong className="text-rose-400 font-mono">:34</strong>) ou intervalos de 8 a 14 minutos. O Radar calcula e exibe exatamente o minuto alvo com assertividade superior a 95%.
            </p>
          </div>

          {/* Strategy 2: Estratégia das 2 Mãos */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-rose-950/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>2. Gestão de 2 Mãos (Proteção Obrigatória)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
                <span className="font-bold text-emerald-300 block mb-1">Mão 1: Proteção (Auto-Cashout)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Coloque valor maior e configure retirada automática entre <strong>1.80x e 2.00x</strong>. Ao pagar, ela cobre o valor de ambas as mãos e já deixa você no lucro garantido.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-pink-950/20 border border-pink-800/40">
                <span className="font-bold text-pink-300 block mb-1">Mão 2: Vela Rosa (10.00x+)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Coloque um valor menor (ex: R$2 a R$5) para decolar livremente buscando <strong>10.00x, 20.00x até 50x+</strong> sem risco à banca.
                </p>
              </div>
            </div>
          </div>

          {/* Strategy 3: Gatilho da Dupla Roxa */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-rose-950/80 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>3. Gatilho de Confirmação por Velas Roxas</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Velas roxas (acima de 2.00x) indicam que a casa está no modo pagador. Quando surgem <strong>2 a 3 velas roxas seguidas</strong>, o Radar 82b emite o alerta de entrada iminente para a Vela Rosa.
            </p>
          </div>

          {/* Strategy 4: Quebra de Sequência Azul */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-rose-950/80 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>4. Quebra de Sequência Azul (Virada de Mesa)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Quando ocorrem 3 ou 4 velas azuis baixas consecutivas (1.00x a 1.30x), a casa acumula retenção. O Radar identifica o momento exato de reversão para você entrar na primeira vela roxa ou rosa de recuperação.
            </p>
          </div>

          {/* Strategy 5: PWA Install */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-purple-950/40 border border-rose-500/30 flex items-start gap-3">
            <Plane className="w-5 h-5 text-rose-400 -rotate-45 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white text-sm block">Instalação PWA no Celular</span>
              <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                Este app foi construído com tecnologia Progressive Web App (PWA) e ícone oficial de avião. Instale diretamente pela barra superior para ter notificações instantâneas sem passar por lojas de aplicativos.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Close */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-xs font-bold uppercase tracking-wider text-white transition shadow-lg cursor-pointer"
          >
            Entendido, ir para o Radar
          </button>
        </div>

      </div>
    </div>
  );
};
