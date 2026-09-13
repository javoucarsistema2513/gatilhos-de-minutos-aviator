import React, { useState } from 'react';
import { DollarSign, ShieldAlert, CheckCircle, Calculator } from 'lucide-react';

export const BankrollCalculator: React.FC = () => {
  const [bankroll, setBankroll] = useState<number>(100);
  const [riskPercent, setRiskPercent] = useState<number>(5); // 5% por gatilho

  // Valores calculados
  const totalEntry = (bankroll * riskPercent) / 100;
  const bet1 = Math.round((totalEntry * 0.7) * 100) / 100; // 70% na aposta de proteção
  const bet2 = Math.round((totalEntry * 0.3) * 100) / 100; // 30% na aposta de vela alta

  // Retorno com proteção em 2.00x
  const protectionReturn = bet1 * 2.00;
  const netZero = protectionReturn >= (bet1 + bet2);

  // Retorno com alvo em 10.00x
  const pinkTargetProfit = (bet1 * 2.00 - (bet1 + bet2)) + (bet2 * 10.00);

  return (
    <div
      id="bankroll-calculator-card"
      className="rounded-2xl border border-slate-800 bg-[#0C101C]/80 p-4 sm:p-5 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Calculator className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Estratégia de 2 Apostas no Betão</h3>
          <p className="text-[11px] text-slate-400">Proteção de Banca + Alvo de Vela Rosa no Betão</p>
        </div>
      </div>

      {/* Input de Banca e Risco */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            Sua Banca Atual (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
              R$
            </span>
            <input
              id="bankroll-input"
              type="number"
              min="10"
              step="10"
              value={bankroll}
              onChange={(e) => setBankroll(Math.max(1, Number(e.target.value)))}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            Risco por Gatilho ({riskPercent}%)
          </label>
          <div className="flex items-center gap-2">
            {[2, 3, 5, 10].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setRiskPercent(pct)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  riskPercent === pct
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Bet Breakdown */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Bet 1: Proteção */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-sky-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400">1ª Aposta (Proteção)</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              Auto Cashout: 2.00x
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">
              R$ {bet1.toFixed(2)}
            </span>
            <span className="text-xs text-sky-300 font-semibold font-mono">
              Retorna R$ {protectionReturn.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            {netZero ? '✓ Bateu 2.00x? Paga as duas apostas e anula 100% do risco!' : 'Reduz o impacto.'}
          </p>
        </div>

        {/* Bet 2: Alvo Vela Rosa */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-fuchsia-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-fuchsia-400">2ª Aposta (Alvo Rosa)</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              Alvo: 5x a 10x+
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">
              R$ {bet2.toFixed(2)}
            </span>
            <span className="text-xs text-fuchsia-300 font-semibold font-mono">
              Em 10x = +R$ {(bet2 * 10).toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Aposta livre para decolar junto com o gatilho de minuto!
          </p>
        </div>
      </div>

      {/* Stop Win / Stop Loss */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Stop Win Recomendado: <strong className="text-emerald-400 font-mono">R$ {(bankroll * 1.30).toFixed(2)} (+30%)</strong>
        </span>
        <span className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          Stop Loss Recomendado: <strong className="text-rose-400 font-mono">R$ {(bankroll * 0.85).toFixed(2)} (-15%)</strong>
        </span>
      </div>
    </div>
  );
};
