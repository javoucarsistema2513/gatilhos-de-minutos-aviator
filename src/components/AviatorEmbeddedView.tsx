import React, { useState } from 'react';
import { AviatorCandle, RadarSignal } from '../types';
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Info,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Undo2,
  Zap,
} from 'lucide-react';

interface AviatorEmbeddedViewProps {
  currentSignal: RadarSignal;
  onAddCandle: (multiplier: number) => void;
  onRemoveLastCandle: () => void;
  onOpenSyncModal: () => void;
  recentCandles: AviatorCandle[];
}

export const AviatorEmbeddedView: React.FC<AviatorEmbeddedViewProps> = ({
  currentSignal,
  onAddCandle,
  onRemoveLastCandle,
  onOpenSyncModal,
  recentCandles,
}) => {
  const targetUrl =
    'https://d18ets18cyzpod.cloudfront.net/home/embedded?id=483312306&currency=BRL&fixed.isSaveShort=true&fixed.isHideDomain=1';

  const [iframeKey, setIframeKey] = useState(0);
  const [quickInput, setQuickInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(true);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickInput.replace(',', '.'));
    if (!isNaN(val) && val >= 1.0) {
      onAddCandle(val);
      setQuickInput('');
    }
  };

  const last5Candles = recentCandles.slice(0, 7);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 flex flex-col' : ''}`}>
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-tight">
                Aviator Oficial Integrado
              </h2>
              <span className="rounded bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 font-black uppercase flex items-center gap-1 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Ao Vivo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              Acompanhe a mesa oficial do Cloudfront e alimente o radar cirúrgico em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Synchronize Table Button */}
          <button
            id="btn-open-sync-from-game"
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 rounded-xl border border-pink-500/60 bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-pink-600/20 hover:brightness-110 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sincronizar Mesa</span>
          </button>

          {/* Split Mode Toggle */}
          <button
            onClick={() => setIsSplitMode(!isSplitMode)}
            className={`hidden lg:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isSplitMode
                ? 'border-purple-500/50 bg-purple-950/40 text-purple-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
            title="Alternar entre visualização lado a lado e jogo inteiro"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>{isSplitMode ? 'Tela Dividida' : 'Tela Única'}</span>
          </button>

          {/* Refresh iframe button */}
          <button
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            title="Recarregar jogo"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Recarregar</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            title={isFullscreen ? 'Sair da tela cheia' : 'Modo tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Minimizar' : 'Expandir'}</span>
          </button>

          {/* Open in external tab */}
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nova Aba</span>
          </a>
        </div>
      </div>

      {/* Main Content Area (supports Split Mode on desktop) */}
      <div className={`grid gap-4 ${isSplitMode ? 'lg:grid-cols-12' : 'grid-cols-1'} ${isFullscreen ? 'flex-1' : ''}`}>
        {/* Left Side HUD in Split Mode */}
        {isSplitMode && (
          <div className="lg:col-span-4 space-y-3">
            {/* Live Signal Card */}
            <div
              className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all ${
                currentSignal.type === 'PINK_RADAR'
                  ? 'border-pink-500 bg-gradient-to-br from-pink-950/60 via-slate-900 to-slate-900 shadow-pink-500/20'
                  : currentSignal.type === 'PURPLE_WAVE'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900'
                  : 'border-slate-800 bg-slate-900/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentSignal.type === 'PINK_RADAR' ? (
                    <span className="flex h-3 w-3 rounded-full bg-pink-500 animate-ping"></span>
                  ) : (
                    <Zap className="h-4 w-4 text-purple-400" />
                  )}
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    {currentSignal.title}
                  </h3>
                </div>
                <span className="rounded bg-pink-500/20 border border-pink-500/40 px-2 py-0.5 font-mono text-xs font-black text-pink-300">
                  {currentSignal.confidence}% assertividade
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Alvo Multiplicador
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-400">
                    {currentSignal.targetMultiplier}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Minuto Pagador
                  </span>
                  <span className="font-mono text-sm font-black text-amber-300">
                    {currentSignal.payingMinuteTarget}
                  </span>
                </div>
              </div>

              <p className="mt-2.5 text-[11px] text-slate-300 border-t border-slate-800/80 pt-2">
                {currentSignal.triggerReason}
              </p>
            </div>

            {/* Quick 1-Click Fast Tap Logger */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-pink-400" />
                  <span>Registro Rápido de Vela</span>
                </h4>
                <button
                  onClick={onRemoveLastCandle}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition"
                  title="Desfazer última vela"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Desfazer</span>
                </button>
              </div>

              {/* Multiplier Preset Buttons */}
              <div className="space-y-2">
                {/* Blue Presets */}
                <div>
                  <span className="text-[10px] font-bold text-blue-400 block mb-1">Azul (&lt;2x)</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1.15, 1.30, 1.55, 1.85].map((val) => (
                      <button
                        key={`quick-${val}`}
                        onClick={() => onAddCandle(val)}
                        className="rounded-lg border border-blue-800/70 bg-blue-950/50 py-1 font-mono text-xs font-bold text-blue-300 hover:bg-blue-900/80 transition"
                      >
                        {val.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purple Presets */}
                <div>
                  <span className="text-[10px] font-bold text-purple-400 block mb-1">Roxa (2x a 9x)</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2.10, 2.80, 4.20, 7.50].map((val) => (
                      <button
                        key={`quick-${val}`}
                        onClick={() => onAddCandle(val)}
                        className="rounded-lg border border-purple-800/70 bg-purple-950/50 py-1 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900/80 transition"
                      >
                        {val.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pink Presets */}
                <div>
                  <span className="text-[10px] font-bold text-pink-400 block mb-1">Rosa (10x+)</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[10.50, 18.00, 45.00].map((val) => (
                      <button
                        key={`quick-${val}`}
                        onClick={() => onAddCandle(val)}
                        className="rounded-lg border border-pink-600/70 bg-pink-950/50 py-1 font-mono text-xs font-black text-pink-200 hover:bg-pink-900/80 shadow-sm transition"
                      >
                        {val.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Input */}
              <form onSubmit={handleQuickAdd} className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Digitar valor (ex: 3.42)"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-pink-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-pink-500 transition shadow"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Last Recorded Candles Strip */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-400 text-[11px]">Últimas Velas Coletadas:</span>
                <span className="text-[10px] text-slate-500">{recentCandles.length} no total</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {last5Candles.map((c) => (
                  <span
                    key={`side-${c.id}`}
                    className={`rounded-lg border px-2 py-0.5 font-mono text-[11px] font-bold ${
                      c.color === 'pink'
                        ? 'border-pink-500/80 bg-pink-950/80 text-pink-300'
                        : c.color === 'purple'
                        ? 'border-purple-500/80 bg-purple-950/80 text-purple-300'
                        : 'border-blue-800/80 bg-blue-950/80 text-blue-300'
                    }`}
                  >
                    {c.multiplier.toFixed(2)}x
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Iframe Container */}
        <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl ${isSplitMode ? 'lg:col-span-8' : 'w-full'} ${isFullscreen ? 'flex-1' : 'h-[640px]'}`}>
          <iframe
            key={iframeKey}
            src={targetUrl}
            title="Aviator Embedded Game"
            className="h-full w-full border-0"
            allow="autoplay; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />

          {/* Floating Pill on top of game if not in split mode */}
          {!isSplitMode && (
            <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md pointer-events-auto">
              <div
                className={`rounded-xl border p-3 shadow-2xl backdrop-blur-md transition-all ${
                  currentSignal.type === 'PINK_RADAR'
                    ? 'border-pink-500/80 bg-slate-950/90 shadow-pink-500/30 ring-2 ring-pink-500/50'
                    : currentSignal.type === 'PURPLE_WAVE'
                    ? 'border-purple-500/80 bg-slate-950/90 shadow-purple-500/30'
                    : 'border-slate-700 bg-slate-950/85'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {currentSignal.type === 'PINK_RADAR' ? (
                      <span className="flex h-3 w-3 rounded-full bg-pink-500 animate-ping"></span>
                    ) : (
                      <Zap className="h-4 w-4 text-purple-400" />
                    )}
                    <span className="text-xs font-extrabold text-white">
                      {currentSignal.title}
                    </span>
                  </div>
                  <span className="rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 px-1.5 py-0.5 text-[10px] font-black">
                    {currentSignal.confidence}% Confiança
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">
                    Alvo: <strong className="text-emerald-400">{currentSignal.targetMultiplier}</strong>
                  </span>
                  <span className="text-slate-400">
                    Minutagem: <strong className="text-amber-300">{currentSignal.payingMinuteTarget}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating Bar on the game */}
          <div className="absolute bottom-3 left-3 right-3 pointer-events-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                  Vela rápida:
                </span>
                <button
                  onClick={() => onAddCandle(1.20)}
                  className="rounded-lg bg-blue-900/60 border border-blue-700 px-2.5 py-1 text-xs font-bold text-blue-300 hover:bg-blue-800 transition"
                >
                  + Azul (1.20x)
                </button>
                <button
                  onClick={() => onAddCandle(2.20)}
                  className="rounded-lg bg-purple-900/60 border border-purple-700 px-2.5 py-1 text-xs font-bold text-purple-300 hover:bg-purple-800 transition"
                >
                  + Roxa (2.20x)
                </button>
                <button
                  onClick={() => onAddCandle(12.50)}
                  className="rounded-lg bg-pink-900/60 border border-pink-600 px-2.5 py-1 text-xs font-black text-pink-200 hover:bg-pink-800 transition shadow"
                >
                  + Rosa (12.50x)
                </button>
                <button
                  onClick={onRemoveLastCandle}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white transition"
                  title="Desfazer última vela adicionada"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick input field */}
              <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: 5.40"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-pink-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-pink-500 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Helper note regarding synchronization */}
      <div className="flex items-start gap-2 rounded-xl bg-slate-900/50 p-3 text-xs text-slate-400 border border-slate-800/60">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          <strong>Sincronização 100% Precisa:</strong> O site do Aviator roda em um domínio seguro externo. Para que o radar calcule com perfeição a sua mesa atual, clique em <strong>Sincronizar Mesa</strong> acima e cole a sequência de velas que você vê na barra superior do jogo. Você também pode registrar cada nova rodada com 1 clique nos botões de atalho.
        </p>
      </div>
    </div>
  );
};
