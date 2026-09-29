import React, { useState } from 'react';
import { Candle } from '../types/aviator';
import { X, Copy, Check, ShieldCheck, Sparkles, Clock, Hash, Zap } from 'lucide-react';

interface CandleDetailsModalProps {
  candle: Candle | null;
  onClose: () => void;
}

export const CandleDetailsModal: React.FC<CandleDetailsModalProps> = ({
  candle,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!candle) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(candle.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPink = candle.color === 'pink';
  const isPurple = candle.color === 'purple';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#120824] border border-rose-500/40 p-5 sm:p-6 shadow-2xl relative text-white">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isPink 
              ? 'bg-rose-600/20 border border-rose-500/60 text-pink-400' 
              : isPurple 
              ? 'bg-purple-600/20 border border-purple-500/60 text-purple-400' 
              : 'bg-slate-800 text-sky-400'
          }`}>
            {isPink ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Zap className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black uppercase tracking-wide">
                {isPink ? 'Vela Rosa Detectada' : isPurple ? 'Vela Roxa Registrada' : 'Vela Azul Registrada'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isPink 
                  ? 'bg-pink-600 text-white' 
                  : isPurple 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-800 text-sky-400'
              }`}>
                #{candle.roundId}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Horário Oficial 82b.game
            </p>
          </div>
        </div>

        {/* Big Multiplier Display */}
        <div className="my-6 text-center p-4 rounded-xl bg-[#090412] border border-rose-950/80">
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Multiplicador Final de Saída
          </span>
          <div className={`text-5xl font-black font-mono tracking-tight mt-1 ${
            isPink 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300' 
              : isPurple 
              ? 'text-purple-300' 
              : 'text-sky-400'
          }`}>
            {candle.multiplier.toFixed(2)}x
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>{candle.timeFormatted}</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">Minuto :{String(candle.minute).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Technical Data list */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Classificação 82b:</span>
            <span className="font-bold text-white uppercase">
              {isPink ? 'Super Vela Rosa (10x+)' : isPurple ? 'Vela Roxa Normal (2x - 9.99x)' : 'Vela Azul Baixa (< 2x)'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Regra de Pagamento:</span>
            <span className="text-emerald-400 font-semibold">
              {isPink ? 'Pagamento Máximo de Alvo' : isPurple ? 'Proteção Paga com Lucro' : 'Loss / Recolhimento'}
            </span>
          </div>

          {/* Provably fair hash */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Hash Provably Fair (SHA-256):
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-sans cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <div className="font-mono text-[10px] text-slate-300 break-all bg-black/40 p-2 rounded border border-slate-800">
              {candle.hash}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs uppercase tracking-wider text-white transition shadow-lg shadow-rose-900/50 cursor-pointer"
        >
          Fechar
        </button>

      </div>
    </div>
  );
};
