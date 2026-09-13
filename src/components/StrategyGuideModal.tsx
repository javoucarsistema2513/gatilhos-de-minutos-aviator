import React from 'react';
import { X, BookOpen, Clock, Target, ShieldCheck, Sparkles } from 'lucide-react';

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
    <div
      id="strategy-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0F172A] border border-rose-500/30 p-5 sm:p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Como Funcionam os Gatilhos de Minutos</h3>
          </div>
          <button
            id="close-guide-modal-button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Item 1 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-rose-400" />
              1. Gatilho de Minuto Igual / Final Repetido
            </h4>
            <p className="mt-1 text-slate-400">
              Quando sai uma vela rosa (≥ 10.00x) em determinado minuto (ex: minuto 14, com final 4), o algoritmo do Aviator tende a repetir picos de pagamento nos minutos que terminam no mesmo algarismo: <strong>:24, :34, :44, :54</strong>.
            </p>
          </div>

          {/* Item 2 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              2. Projeção M+2 e M+3 pós-Rosa
            </h4>
            <p className="mt-1 text-slate-400">
              Uma das estratégias mais consolidadas entre jogadores do Betão: após uma vela rosa, projeta-se nova entrada em <strong>+2 minutos</strong> ou <strong>+3 minutos</strong> após a vela pagadora.
            </p>
          </div>

          {/* Item 3 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              3. Recuperação de Sequência Baixa (Quebra de Blues)
            </h4>
            <p className="mt-1 text-slate-400">
              O RTP (retorno teórico do jogo) é de aproximadamente 97%. Quando ocorrem 4 a 6 velas azuis consecutivas (&lt; 2.00x), a probabilidade matemática de reversão para vela roxa ou rosa aumenta para mais de 92%.
            </p>
          </div>

          {/* Item 4 */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Target className="w-4 h-4 text-amber-400" />
              4. Dupla Aposta: Proteção + Alvo Rosa
            </h4>
            <p className="mt-1 text-slate-400">
              Nunca aposte tudo em uma só tentativa. Use <strong>70% na aposta 1</strong> com saída automática em <strong>2.00x</strong> (cobre o custo das duas apostas) e <strong>30% na aposta 2</strong> para deixar subir até 5x, 10x ou mais.
            </p>
          </div>
        </div>

        <button
          id="understand-guide-button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition"
        >
          Entendido, Voltar aos Sinais
        </button>
      </div>
    </div>
  );
};
