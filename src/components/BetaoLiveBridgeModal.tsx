import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Zap,
  Radio,
  Sparkles,
  ClipboardPaste,
  ShieldCheck,
  X,
  Play,
  ArrowRight,
  Info,
} from 'lucide-react';
import { RoundData } from '../types';
import { parseBatchCandles } from '../utils/aviatorEngine';

interface BetaoLiveBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAddRounds: (rounds: RoundData[]) => void;
  onAddSingleRound: (multiplier: number, source?: 'BETAO_LIVE' | 'BETAO_SYNC') => void;
  isLiveConnected: boolean;
  liveRoundsCount: number;
  lastLiveRoundTime?: string;
}

export const BetaoLiveBridgeModal: React.FC<BetaoLiveBridgeModalProps> = ({
  isOpen,
  onClose,
  onBatchAddRounds,
  onAddSingleRound,
  isLiveConnected,
  liveRoundsCount,
  lastLiveRoundTime,
}) => {
  const [copied, setCopied] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [activeTab, setActiveTab] = useState<'extrator' | 'colar' | 'manual'>('extrator');

  if (!isOpen) return null;

  const betaoUrl = 'https://betao.bet.br/games/aviator-spribe';

  // Código do extrator oficial do Betão Aviator
  const extractorCode = `javascript:(function(){
  console.log("%c✈️ SINCRONIZADOR BETAO AVIATOR ATIVADO", "background:#e11d48;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px");
  let lastMult = null;
  function notify(raw){
    const clean = String(raw).replace(/[^0-9.,]/g,'').replace(',','.');
    const val = parseFloat(clean);
    if(isNaN(val)||val<1.0||val===lastMult)return;
    lastMult = val;
    const data = {type:'BETAO_ROUND',multiplier:val,timestamp:Date.now(),sourceUrl:'${betaoUrl}'};
    if(window.opener&&!window.opener.closed){
      window.opener.postMessage(data,'*');
      console.log("%c✈️ [BETAO] Vela enviada ao Radar:", "color:#10b981;font-weight:bold;", val+"x");
    }
    try{
      const bc = new BroadcastChannel('betao_aviator_sync');
      bc.postMessage(data);
      bc.close();
    }catch(e){}
  }
  function observe(doc){
    if(!doc)return;
    const observer = new MutationObserver(mutations=>{
      for(const m of mutations){
        for(const n of m.addedNodes){
          if(n.nodeType===1){
            const txt=(n.innerText||n.textContent||'').trim();
            if(txt.includes('x')||/\\d+[.,]\\d+/.test(txt)){notify(txt);}
          }
        }
      }
    });
    observer.observe(doc.body||doc.documentElement,{childList:true,subtree:true});
    doc.querySelectorAll('iframe').forEach(ifr=>{try{if(ifr.contentDocument)observe(ifr.contentDocument);}catch(e){}});
  }
  observe(document);
  alert("✅ Extrator Betão Aviator Conectado! As rodadas da sua mesa serão enviadas ao Radar em tempo real.");
})();`;

  const handleCopyExtractor = async () => {
    try {
      await navigator.clipboard.writeText(extractorCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenBetao = () => {
    // Abrir Betão mantendo window.opener conectado para postMessage direto
    window.open(betaoUrl, 'betao_aviator_window');
  };

  const handleApplyPaste = () => {
    const rounds = parseBatchCandles(pasteInput);
    if (rounds.length > 0) {
      onBatchAddRounds(rounds);
      setPasteInput('');
      onClose();
    }
  };

  return (
    <div
      id="betao-live-bridge-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-rose-500/40 bg-[#0B0F19] p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-600 to-rose-800 shadow-md shadow-orange-600/30">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Sincronizador Betão Aviator</h3>
                <span className="rounded bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.5 text-[10px] font-black text-rose-400">
                  OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conexão direta com a mesa:{' '}
                <a
                  href={betaoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-400 underline hover:text-rose-300 font-mono"
                >
                  betao.bet.br/games/aviator-spribe
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status de Conexão */}
        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                isLiveConnected
                  ? 'bg-emerald-400 shadow-md shadow-emerald-500/50 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-white block">
                {isLiveConnected
                  ? '🟢 Sincronizado com betao.bet.br'
                  : 'Pronto para receber rodadas do Betão'}
              </span>
              <span className="text-[11px] text-slate-400">
                {liveRoundsCount > 0
                  ? `${liveRoundsCount} rodadas recebidas da mesa oficial${
                      lastLiveRoundTime ? ` (Última às ${lastLiveRoundTime})` : ''
                    }`
                  : 'Abra a mesa do Betão abaixo para sincronizar as velas'}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenBetao}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shadow-rose-900 shrink-0 active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir Betão
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 mt-3.5 shrink-0">
          <button
            onClick={() => setActiveTab('extrator')}
            className={`flex-1 pb-2 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'extrator'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            1. Extrator Automático
          </button>
          <button
            onClick={() => setActiveTab('colar')}
            className={`flex-1 pb-2 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'colar'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            2. Colar Sequência
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 pb-2 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'manual'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            3. Registro Rápido
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-3.5 overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
          {activeTab === 'extrator' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Info className="w-4 h-4 text-rose-400 shrink-0" />
                  Como sincronizar em tempo real com o Betão:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    Clique em{' '}
                    <strong className="text-white">"Abrir Betão"</strong> para abrir a mesa oficial
                    em uma aba conectada.
                  </li>
                  <li>
                    Copie o código do extrator abaixo clicando em{' '}
                    <strong className="text-white">"Copiar Extrator do Betão"</strong>.
                  </li>
                  <li>
                    Na aba do Betão, abra o Console do navegador (<kbd className="px-1 py-0.5 bg-black/60 rounded border border-slate-700 font-mono">F12</kbd> ou{' '}
                    <kbd className="px-1 py-0.5 bg-black/60 rounded border border-slate-700 font-mono">Ctrl+Shift+J</kbd>), cole o código e aperte <kbd className="px-1 py-0.5 bg-black/60 rounded border border-slate-700 font-mono">Enter</kbd> (ou salve como Favorito/Bookmarklet).
                  </li>
                  <li>
                    <strong>Pronto!</strong> A cada rodada que terminar no Betão, a vela será capturada e enviada ao Radar automaticamente com alerta sonoro!
                  </li>
                </ol>
              </div>

              {/* Box de Código */}
              <div className="relative rounded-xl border border-slate-800 bg-black/70 p-3 font-mono text-[11px] text-slate-300">
                <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Código do Extrator Betão (v2.0)
                  </span>
                  <button
                    onClick={handleCopyExtractor}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar Extrator'}
                  </button>
                </div>
                <div className="max-h-24 overflow-y-auto text-slate-400 break-all select-all font-mono text-[10px] leading-tight">
                  {extractorCode}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colar' && (
            <div className="space-y-3">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Copie a sequência de velas exibida na barra superior do Aviator no Betão e cole
                aqui. O radar atualizará imediatamente o mapa de calor e os gatilhos:
              </p>

              <textarea
                rows={3}
                placeholder="Exemplo: 1.15 2.40 18.20 1.05 3.80 25.10 1.90 12.00"
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {parseBatchCandles(pasteInput).length > 0 &&
                    `✓ ${parseBatchCandles(pasteInput).length} velas válidas identificadas`}
                </span>
                <button
                  onClick={handleApplyPaste}
                  disabled={!pasteInput.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Importar Velas do Betão
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-3">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Você pode registrar instantaneamente as velas da sua mesa no Betão clicando nos
                atalhos abaixo durante a rodada:
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onAddSingleRound(1.35, 'BETAO_LIVE');
                  }}
                  className="p-3 rounded-xl bg-sky-950/80 border border-sky-600/50 hover:bg-sky-900 text-sky-200 font-bold flex flex-col items-center gap-1 transition active:scale-95"
                >
                  <span className="text-xs uppercase font-sans">Azul (&lt;2x)</span>
                  <span className="text-base font-mono text-white">1.35x</span>
                </button>

                <button
                  onClick={() => {
                    onAddSingleRound(2.8, 'BETAO_LIVE');
                  }}
                  className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 hover:bg-purple-900 text-purple-200 font-bold flex flex-col items-center gap-1 transition active:scale-95"
                >
                  <span className="text-xs uppercase font-sans">Roxa (2x+)</span>
                  <span className="text-base font-mono text-white">2.80x</span>
                </button>

                <button
                  onClick={() => {
                    onAddSingleRound(14.5, 'BETAO_LIVE');
                  }}
                  className="p-3 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/50 hover:bg-fuchsia-900 text-fuchsia-200 font-bold flex flex-col items-center gap-1 transition active:scale-95 shadow-md shadow-fuchsia-950"
                >
                  <span className="text-xs uppercase font-sans flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-fuchsia-400" />
                    Rosa (10x+)
                  </span>
                  <span className="text-base font-mono text-white">14.50x</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alimentando estratégias M+2, M+3 e M+4</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
