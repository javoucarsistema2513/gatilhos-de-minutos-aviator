import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  Zap,
  Radio,
  Sparkles,
  ClipboardPaste,
  ShieldCheck,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { RoundData } from '../types';
import { parseBatchCandles, getMultiplierTier, formatTime } from '../utils/aviatorEngine';

export const OFFICIAL_BETAO_CLOUDFRONT_URL =
  'https://d18ets18cyzpod.cloudfront.net/home/embedded?id=483312306&currency=BRL&fixed.isSaveShort=true&fixed.isHideDomain=1';

interface BetaoLiveFrameProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddRound: (round: RoundData) => void;
  onReplaceRounds: (rounds: RoundData[]) => void;
  isLiveConnected: boolean;
  liveRoundsCount: number;
  lastLiveRoundTime?: string;
}

export const BetaoLiveFrame: React.FC<BetaoLiveFrameProps> = ({
  isOpen,
  onToggleOpen,
  onAddRound,
  onReplaceRounds,
  isLiveConnected,
  liveRoundsCount,
  lastLiveRoundTime,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [copiedExtractor, setCopiedExtractor] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const extractorCode = `javascript:(function(){
  console.log("%c✈️ SINCRONIZADOR CLOUDFRONT AVIATOR ATIVADO", "background:#e11d48;color:#fff;font-weight:bold;padding:6px 12px;border-radius:6px;font-size:13px");
  let lastMult = null;
  let count = 0;
  let badge = document.getElementById('betao-radar-sync-badge');
  if(!badge){
    badge = document.createElement('div');
    badge.id = 'betao-radar-sync-badge';
    badge.style.cssText = 'position:fixed;top:8px;left:8px;z-index:9999999;background:rgba(11,15,25,0.95);border:2px solid #10b981;border-radius:10px;padding:6px 12px;color:#fff;font-family:system-ui,-apple-system,sans-serif;font-size:11px;font-weight:bold;box-shadow:0 4px 20px rgba(0,0,0,0.8);pointer-events:none;display:flex;align-items:center;gap:6px;';
    badge.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;box-shadow:0 0 8px #10b981"></span> RADAR CONECTADO: Aguardando velas...';
    document.body.appendChild(badge);
  }
  function sendRound(val){
    if(!val || isNaN(val) || val < 1.0 || val === lastMult) return;
    lastMult = val;
    count++;
    if(badge){
      const color = val >= 10 ? '#f43f5e' : (val >= 2 ? '#a855f7' : '#38bdf8');
      badge.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:'+color+';display:inline-block"></span> VELA ENVIADA: <strong style="color:'+color+';font-size:13px">'+val.toFixed(2)+'x</strong> ('+count+' enviadas)';
    }
    const payload = {
      type: 'BETAO_ROUND',
      multiplier: val,
      timestamp: Date.now(),
      sourceUrl: '${OFFICIAL_BETAO_CLOUDFRONT_URL}',
      source: 'BETAO_LIVE'
    };
    if(window.opener && !window.opener.closed){
      window.opener.postMessage(payload, '*');
    }
    try{
      const bc = new BroadcastChannel('betao_aviator_sync');
      bc.postMessage(payload);
      bc.close();
    }catch(e){}
    console.log("%c🎯 [RADAR] Vela da Mesa:", "color:#10b981;font-weight:bold;", val+"x");
  }
  function scan(){
    const selectors = [
      '.payouts-block .bubble-multiplier',
      '.bubble-multiplier',
      '.payout',
      'app-bubble-multiplier',
      '.result-history .bubble',
      'div[class*="bubble"]',
      'div[class*="payout"]',
      'span[class*="multiplier"]'
    ];
    for(const sel of selectors){
      const list = document.querySelectorAll(sel);
      if(list.length > 0){
        const text = (list[0].innerText || list[0].textContent || '').trim();
        const m = text.match(/(\\d+[.,]\\d+)x?/i);
        if(m){
          const n = parseFloat(m[1].replace(',','.'));
          if(!isNaN(n) && n >= 1.0){
            sendRound(n);
            break;
          }
        }
      }
    }
  }
  const obs = new MutationObserver(()=>scan());
  obs.observe(document.body || document.documentElement, {childList:true, subtree:true, characterData:true});
  document.querySelectorAll('iframe').forEach(ifr=>{
    try{ if(ifr.contentDocument) obs.observe(ifr.contentDocument.body, {childList:true, subtree:true, characterData:true}); }catch(e){}
  });
  setInterval(scan, 800);
  scan();
  alert("✅ Extrator Conectado com Sucesso à Mesa! As velas exatas sairão automaticamente no Radar.");
})();`;

  const handleCopyExtractor = async () => {
    try {
      await navigator.clipboard.writeText(extractorCode);
      setCopiedExtractor(true);
      setTimeout(() => setCopiedExtractor(false), 2500);
    } catch {
      setCopiedExtractor(true);
      setTimeout(() => setCopiedExtractor(false), 2500);
    }
  };

  const handleOpenExternal = () => {
    window.open(OFFICIAL_BETAO_CLOUDFRONT_URL, 'betao_aviator_window');
  };

  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = quickInput.replace(',', '.').replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    if (!isNaN(val) && val >= 1.0) {
      const now = new Date();
      const round: RoundData = {
        id: `manual-live-${now.getTime()}`,
        multiplier: Number(val.toFixed(2)),
        timestamp: now.getTime(),
        minute: now.getMinutes(),
        timeFormatted: formatTime(now),
        tier: getMultiplierTier(val),
        source: 'BETAO_LIVE',
      };
      onAddRound(round);
      setQuickInput('');
    }
  };

  const handleApplyPreset = (mult: number) => {
    const now = new Date();
    const round: RoundData = {
      id: `manual-preset-${now.getTime()}`,
      multiplier: mult,
      timestamp: now.getTime(),
      minute: now.getMinutes(),
      timeFormatted: formatTime(now),
      tier: getMultiplierTier(mult),
      source: 'BETAO_LIVE',
    };
    onAddRound(round);
  };

  const handleApplyBatchReplace = () => {
    const parsed = parseBatchCandles(batchInput);
    if (parsed.length > 0) {
      onReplaceRounds(parsed);
      setBatchInput('');
      setIsBatchOpen(false);
    }
  };

  return (
    <div
      id="betao-live-frame-container"
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${
        isOpen
          ? 'border-rose-500/40 bg-[#0B0F1C]'
          : 'border-slate-800 bg-[#0B0F1C]/80 hover:border-slate-700'
      }`}
    >
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-5 py-3 border-b border-slate-800 bg-[#0E1324]/90">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleOpen}
            className="flex items-center gap-2 text-left focus:outline-none group"
            title={isOpen ? 'Recolher visualização da mesa' : 'Expandir visualização da mesa'}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-600 to-rose-800 shadow-md shadow-orange-600/30">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-1">
                  MESA OFICIAL AO VIVO
                </span>
                <span className="rounded bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 text-[9px] font-black text-rose-400">
                  CLOUDFRONT
                </span>
                {isLiveConnected ? (
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 animate-pulse">
                    SINCRONIZADO ({liveRoundsCount})
                  </span>
                ) : (
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                    CONEXÃO DIRETA
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono line-clamp-1">
                id=483312306 &bull; d18ets18cyzpod.cloudfront.net
              </p>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyExtractor}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 border ${
              copiedExtractor
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-950/60 border-rose-600/50 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="Copiar script para sincronizar automaticamente as velas da mesa"
          >
            {copiedExtractor ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedExtractor ? 'Copiado!' : 'Extrator Automático'}</span>
          </button>

          <button
            onClick={handleOpenExternal}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1"
            title="Abrir mesa oficial em janela conectada"
          >
            <ExternalLink className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Abrir em Nova Aba</span>
          </button>

          <button
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Recarregar mesa embutida"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition hidden md:block"
            title={isFullscreen ? 'Reduzir tamanho' : 'Expandir tamanho'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title={isOpen ? 'Recolher painel' : 'Expandir painel'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Body (when open) */}
      {isOpen && (
        <div className="p-3 sm:p-4 space-y-3">
          {/* Iframe Viewport da Mesa */}
          <div
            ref={iframeContainerRef}
            className={`relative w-full rounded-xl overflow-hidden border border-slate-800 bg-black shadow-inner transition-all duration-200 ${
              isFullscreen ? 'h-[620px]' : 'h-[390px] sm:h-[460px]'
            }`}
          >
            <iframe
              key={iframeKey}
              src={OFFICIAL_BETAO_CLOUDFRONT_URL}
              title="Mesa Oficial Betão Aviator"
              className="w-full h-full border-0"
              allow="clipboard-write; clipboard-read; autoplay; encrypted-media; fullscreen"
            />
          </div>

          {/* Barra de Registro e Sincronia Instantânea com o Jogo */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 space-y-2.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
              {/* Formulário de Registro Rápido da Vela Atual */}
              <form onSubmit={handleQuickSubmit} className="flex items-center gap-1.5 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="Vela que voou (ex: 2.45)"
                    className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 focus:outline-none placeholder:text-slate-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                    X
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!quickInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95 shadow-md shadow-rose-900/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Vela</span>
                </button>
              </form>

              {/* Botões de Atalho Rápido de Vela */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden xl:inline">
                  Atalhos:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1.35)}
                  className="px-2.5 py-1 rounded-xl bg-sky-950/70 border border-sky-600/40 text-sky-300 hover:bg-sky-900/60 font-mono text-[11px] font-bold transition active:scale-95"
                  title="Registrar vela azul (< 2.00x)"
                >
                  🔵 Azul 1.35x
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(2.80)}
                  className="px-2.5 py-1 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 font-mono text-[11px] font-bold transition active:scale-95"
                  title="Registrar vela roxa (2.00x - 9.99x)"
                >
                  🟣 Roxa 2.80x
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(14.50)}
                  className="px-2.5 py-1 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-200 hover:bg-fuchsia-900 font-mono text-[11px] font-black transition active:scale-95 shadow-sm shadow-fuchsia-900/50"
                  title="Registrar vela rosa (10.00x+)"
                >
                  🌸 Rosa 14.50x
                </button>

                <button
                  type="button"
                  onClick={() => setIsBatchOpen(!isBatchOpen)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 hover:bg-slate-700 text-[11px] font-bold transition flex items-center gap-1"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Colar Velas Deste Site</span>
                </button>
              </div>
            </div>

            {/* Painel de Colagem de Sequência do Site */}
            {isBatchOpen && (
              <div className="pt-2.5 border-t border-slate-800 animate-in fade-in duration-150 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
                    Colar Velas da Barra Superior do Aviator no Site:
                  </span>
                  <button
                    onClick={() => setIsBatchOpen(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Fechar
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Copie ou digite a sequência de velas exibida no topo do jogo (separadas por espaço
                  ou vírgula). O radar recalculará imediatamente todas as confluências e gatilhos:
                </p>
                <textarea
                  rows={2}
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="Exemplo: 1.15 2.40 18.20 1.05 3.80 25.10 1.90 12.00"
                  className="w-full p-2.5 rounded-xl bg-black/70 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 focus:outline-none placeholder:text-slate-600"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {parseBatchCandles(batchInput).length > 0 &&
                      `✓ ${parseBatchCandles(batchInput).length} velas válidas identificadas`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyBatchReplace}
                      disabled={!batchInput.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Substituir Todo Histórico por Estas Velas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dica do Extrator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-950/20 border border-rose-900/30 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Para captura 100% automatizada sem digitar nada: abra a mesa em nova aba e execute o{' '}
                <strong className="text-rose-300">Extrator Automático</strong> no Console (<kbd className="px-1 bg-black/40 rounded text-[10px]">F12</kbd>).
              </span>
            </div>
            <button
              onClick={handleCopyExtractor}
              className="text-rose-400 hover:text-rose-300 font-bold underline shrink-0"
            >
              {copiedExtractor ? '✓ Script Copiado' : 'Copiar Código'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
