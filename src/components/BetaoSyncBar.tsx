import React, { useState } from 'react';
import {
  Flame,
  Snowflake,
  Scale,
  Plus,
  ClipboardPaste,
  RotateCcw,
  Sparkles,
  Zap,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { TableClimate, RoundData } from '../types';
import { getMultiplierTier, formatTime, parseBatchCandles } from '../utils/aviatorEngine';

interface BetaoSyncBarProps {
  climate: TableClimate;
  onAddRound: (round: RoundData) => void;
  onBatchAddRounds: (rounds: RoundData[]) => void;
  onSyncClock: () => void;
  onOpenBetaoBridge?: () => void;
  isLiveConnected?: boolean;
}

export const BetaoSyncBar: React.FC<BetaoSyncBarProps> = ({
  climate,
  onAddRound,
  onBatchAddRounds,
  onSyncClock,
  onOpenBetaoBridge,
  isLiveConnected = false,
}) => {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleQuickAdd = (multiplier: number) => {
    const now = new Date();
    const newRound: RoundData = {
      id: `round-quick-${Date.now()}`,
      multiplier,
      timestamp: now.getTime(),
      minute: now.getMinutes(),
      timeFormatted: formatTime(now),
      tier: getMultiplierTier(multiplier),
      source: 'BETAO_SYNC',
    };
    onAddRound(newRound);
  };

  const handleApplyBatch = () => {
    const parsed = parseBatchCandles(pastedText);
    if (parsed.length > 0) {
      onBatchAddRounds(parsed);
      setPastedText('');
      setIsPasteOpen(false);
    }
  };

  return (
    <div
      id="betao-sync-bar"
      className="rounded-2xl border border-slate-800 bg-[#0B0F1C]/90 p-3 sm:p-4 shadow-xl backdrop-blur-md"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Clima da Mesa do Betão */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl flex items-center justify-center ${
              climate.status === 'QUENTE'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : climate.status === 'FRIO'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {climate.status === 'QUENTE' && <Flame className="w-5 h-5 text-rose-500 animate-pulse" />}
            {climate.status === 'FRIO' && <Snowflake className="w-5 h-5 text-sky-400 animate-spin" />}
            {climate.status === 'NEUTRO' && <Scale className="w-5 h-5 text-emerald-400" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide uppercase">
                {climate.title}
              </span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                  climate.safeToEnter
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {climate.safeToEnter ? 'ENTRADA SEGURA' : 'ALERTA DE MESA FRIA'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {climate.description}
            </p>
          </div>
        </div>

        {/* Botões de Sincronia Instantânea com a Mesa do Betão */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-start md:justify-end">
          {/* Botão Conexão Ao Vivo com Betão */}
          {onOpenBetaoBridge && (
            <button
              id="open-betao-bridge-btn"
              onClick={onOpenBetaoBridge}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isLiveConnected
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80 shadow-emerald-950'
                  : 'bg-rose-950/80 border-rose-500/60 text-rose-300 hover:bg-rose-900/80 shadow-rose-950'
              }`}
              title="Abrir extrator automático para seguir rodadas de betao.bet.br/games/aviator-spribe"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{isLiveConnected ? 'Mesa Betão Sincronizada' : 'Conectar Mesa Betão'}</span>
            </button>
          )}

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mx-0.5 hidden lg:inline">
            Atalhos:
          </span>

          {/* Atalho Azul */}
          <button
            id="quick-add-blue"
            onClick={() => handleQuickAdd(1.35)}
            className="px-2.5 py-1.5 rounded-xl bg-sky-950/70 border border-sky-600/40 text-sky-300 hover:bg-sky-900/60 font-mono text-xs font-bold transition active:scale-95 flex items-center gap-1"
            title="Adicionar vela azul vista no Betão (< 2.00x)"
          >
            <Plus className="w-3 h-3 text-sky-400" />
            Azul &lt;2x
          </button>

          {/* Atalho Roxo */}
          <button
            id="quick-add-purple"
            onClick={() => handleQuickAdd(2.8)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 font-mono text-xs font-bold transition active:scale-95 flex items-center gap-1"
            title="Adicionar vela roxa vista no Betão (2.00x a 9.99x)"
          >
            <Plus className="w-3 h-3 text-purple-400" />
            Roxa 2x+
          </button>

          {/* Atalho Rosa */}
          <button
            id="quick-add-pink"
            onClick={() => handleQuickAdd(14.5)}
            className="px-2.5 py-1.5 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-200 hover:bg-fuchsia-900 font-mono text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-sm shadow-fuchsia-900/50"
            title="Adicionar vela rosa vista no Betão (10.00x+)"
          >
            <Sparkles className="w-3 h-3 text-fuchsia-400" />
            Rosa 10x+ 🌸
          </button>

          {/* Botão Colar Histórico */}
          <button
            id="open-paste-modal-btn"
            onClick={() => setIsPasteOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold text-xs transition flex items-center gap-1"
            title="Colar lista de multiplicadores do Betão"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
            Colar Velas
          </button>
        </div>
      </div>

      {/* Modal de Colar Histórico em Lote */}
      {isPasteOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
              Colar Velas Recentes do Betão
            </span>
            <button
              onClick={() => setIsPasteOpen(false)}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Copie ou digite os multiplicadores da barra do Aviator no Betão separados por espaço ou vírgula (ex: <code>1.20 2.45 15.80 1.05 4.30 25.10</code>):
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 1.15 1.80 3.40 18.20 1.02 2.10"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
            />
            <button
              id="apply-pasted-candles-btn"
              onClick={handleApplyBatch}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
            >
              Importar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
