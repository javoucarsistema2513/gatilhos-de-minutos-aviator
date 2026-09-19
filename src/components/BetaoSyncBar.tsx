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
  onReplaceRounds?: (rounds: RoundData[]) => void;
  onSyncClock: () => void;
  onOpenBetaoBridge?: () => void;
  onToggleLiveFrame?: () => void;
  isLiveFrameOpen?: boolean;
  isLiveConnected?: boolean;
  feedMode?: 'REAL_BETAO' | 'SIMULATION';
  onToggleFeedMode?: () => void;
}

export const BetaoSyncBar: React.FC<BetaoSyncBarProps> = ({
  climate,
  onAddRound,
  onBatchAddRounds,
  onReplaceRounds,
  onSyncClock,
  onOpenBetaoBridge,
  onToggleLiveFrame,
  isLiveFrameOpen = false,
  isLiveConnected = false,
  feedMode = 'REAL_BETAO',
  onToggleFeedMode,
}) => {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [instantValue, setInstantValue] = useState('');

  const handleQuickAdd = (multiplier: number) => {
    const now = new Date();
    const newRound: RoundData = {
      id: `round-quick-${Date.now()}`,
      multiplier,
      timestamp: now.getTime(),
      minute: now.getMinutes(),
      timeFormatted: formatTime(now),
      tier: getMultiplierTier(multiplier),
      source: 'BETAO_LIVE',
    };
    onAddRound(newRound);
  };

  const handleInstantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = instantValue.replace(',', '.').replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    if (!isNaN(val) && val >= 1.0) {
      handleQuickAdd(Number(val.toFixed(2)));
      setInstantValue('');
    }
  };

  const handleApplyBatch = () => {
    const parsed = parseBatchCandles(pastedText);
    if (parsed.length > 0) {
      onBatchAddRounds(parsed);
      setPastedText('');
      setIsPasteOpen(false);
    }
  };

  const handleApplyReplace = () => {
    const parsed = parseBatchCandles(pastedText);
    if (parsed.length > 0 && onReplaceRounds) {
      onReplaceRounds(parsed);
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
          {/* Alternar Modo Mesa Real vs Simulação */}
          {onToggleFeedMode && (
            <button
              onClick={onToggleFeedMode}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                feedMode === 'REAL_BETAO'
                  ? 'bg-rose-950/90 border-rose-500/80 text-rose-300 hover:bg-rose-900'
                  : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={
                feedMode === 'REAL_BETAO'
                  ? 'Modo Mesa Real Ativado (Apenas velas do site CloudFront / Betão)'
                  : 'Modo Simulação Ativado (Gera velas automáticas para treino)'
              }
            >
              <Radio className={`w-3.5 h-3.5 ${feedMode === 'REAL_BETAO' ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{feedMode === 'REAL_BETAO' ? '🔴 Mesa Real (CloudFront)' : '🔄 Modo Treino'}</span>
            </button>
          )}

          {/* Botão Ver/Ocultar Mesa Embutida */}
          {onToggleLiveFrame && (
            <button
              onClick={onToggleLiveFrame}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isLiveFrameOpen
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900/80'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="Abrir ou fechar a visualização do jogo embutido oficial"
            >
              <span>{isLiveFrameOpen ? 'Ocultar Mesa' : '📺 Ver Jogo Ao Vivo'}</span>
            </button>
          )}

          {/* Botão Conexão Ao Vivo com Betão */}
          {onOpenBetaoBridge && (
            <button
              id="open-betao-bridge-btn"
              onClick={onOpenBetaoBridge}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isLiveConnected
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80 shadow-emerald-950'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Abrir extrator e sincronizador com d18ets18cyzpod.cloudfront.net"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>{isLiveConnected ? 'Mesa Conectada' : 'Extrator'}</span>
            </button>
          )}

          {/* Entrada Instantânea de Vela */}
          <form onSubmit={handleInstantSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={instantValue}
              onChange={(e) => setInstantValue(e.target.value)}
              placeholder="Vela (ex: 2.10)"
              className="w-24 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 focus:outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!instantValue.trim()}
              className="px-2 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition active:scale-95"
              title="Adicionar esta vela"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Atalho Azul */}
          <button
            id="quick-add-blue"
            onClick={() => handleQuickAdd(1.35)}
            className="px-2 py-1.5 rounded-xl bg-sky-950/70 border border-sky-600/40 text-sky-300 hover:bg-sky-900/60 font-mono text-xs font-bold transition active:scale-95 flex items-center gap-1"
            title="Adicionar vela azul vista no site (< 2.00x)"
          >
            <Plus className="w-3 h-3 text-sky-400" />
            Azul
          </button>

          {/* Atalho Roxo */}
          <button
            id="quick-add-purple"
            onClick={() => handleQuickAdd(2.8)}
            className="px-2 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 font-mono text-xs font-bold transition active:scale-95 flex items-center gap-1"
            title="Adicionar vela roxa vista no site (2.00x a 9.99x)"
          >
            <Plus className="w-3 h-3 text-purple-400" />
            Roxa
          </button>

          {/* Atalho Rosa */}
          <button
            id="quick-add-pink"
            onClick={() => handleQuickAdd(14.5)}
            className="px-2 py-1.5 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-200 hover:bg-fuchsia-900 font-mono text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-sm shadow-fuchsia-900/50"
            title="Adicionar vela rosa vista no site (10.00x+)"
          >
            <Sparkles className="w-3 h-3 text-fuchsia-400" />
            Rosa 🌸
          </button>

          {/* Botão Colar Histórico */}
          <button
            id="open-paste-modal-btn"
            onClick={() => setIsPasteOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold text-xs transition flex items-center gap-1"
            title="Colar lista de multiplicadores do site"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
            Colar
          </button>
        </div>
      </div>

      {/* Modal de Colar Histórico em Lote */}
      {isPasteOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
              Colar Velas Exatas do Site (d18ets18cyzpod.cloudfront.net)
            </span>
            <button
              onClick={() => setIsPasteOpen(false)}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Copie a sequência da barra superior do jogo (separadas por espaço ou vírgula):
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Ex: 1.15 1.80 3.40 18.20 1.02 2.10"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                id="replace-pasted-candles-btn"
                onClick={handleApplyReplace}
                disabled={!pastedText.trim()}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                title="Substitui todo o histórico para que o radar calcule com as velas exatas do site"
              >
                <Zap className="w-3 h-3" />
                Substituir Todo Histórico
              </button>
              <button
                id="apply-pasted-candles-btn"
                onClick={handleApplyBatch}
                disabled={!pastedText.trim()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition border border-slate-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
