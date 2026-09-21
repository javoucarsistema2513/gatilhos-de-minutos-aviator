import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  Flame,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Timer,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { AviatorCandle } from '../types';

interface TableSynchronizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncBatch: (
    input: string,
    replaceAll: boolean,
    secondsPerRound: number,
    newestFirst: boolean,
    lastExitTimestamp?: number
  ) => Promise<boolean>;
  currentCandlesCount: number;
}

export const TableSynchronizerModal: React.FC<TableSynchronizerModalProps> = ({
  isOpen,
  onClose,
  onSyncBatch,
  currentCandlesCount,
}) => {
  const [inputText, setInputText] = useState('');
  const [replaceAll, setReplaceAll] = useState(true);
  const [newestFirst, setNewestFirst] = useState(true);
  const [secondsPerRound, setSecondsPerRound] = useState(22);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Exact Hour, Minute and Second of the last candle exit
  const [exitHour, setExitHour] = useState<number>(() => new Date().getHours());
  const [exitMinute, setExitMinute] = useState<number>(() => new Date().getMinutes());
  const [exitSecond, setExitSecond] = useState<number>(() => new Date().getSeconds());
  const [isLiveClockSynced, setIsLiveClockSynced] = useState<boolean>(true);

  // Sync to live clock when opened and in live mode
  useEffect(() => {
    if (!isOpen || !isLiveClockSynced) return;
    const interval = setInterval(() => {
      const now = new Date();
      setExitHour(now.getHours());
      setExitMinute(now.getMinutes());
      setExitSecond(now.getSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isLiveClockSynced]);

  if (!isOpen) return null;

  const handleSyncToNow = () => {
    const now = new Date();
    setExitHour(now.getHours());
    setExitMinute(now.getMinutes());
    setExitSecond(now.getSeconds());
    setIsLiveClockSynced(true);
  };

  const handleAdjustSecondsAgo = (secondsAgo: number) => {
    setIsLiveClockSynced(false);
    const target = new Date(Date.now() - secondsAgo * 1000);
    setExitHour(target.getHours());
    setExitMinute(target.getMinutes());
    setExitSecond(target.getSeconds());
  };

  // Compute calculated timestamp for the last candle exit
  const computeLastExitTimestamp = (): number => {
    const d = new Date();
    d.setHours(exitHour, exitMinute, exitSecond, 0);
    return d.getTime();
  };

  const formattedExitTime = `${String(exitHour).padStart(2, '0')}:${String(exitMinute).padStart(
    2,
    '0'
  )}:${String(exitSecond).padStart(2, '0')}`;

  // Parse preview of input numbers in real time
  const parsedPreview = (inputText.replace(/,/g, '.').match(/\d+(\.\d+)?/g) || [])
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 1.0);

  const pinkCount = parsedPreview.filter((n) => n >= 10.0).length;
  const purpleCount = parsedPreview.filter((n) => n >= 2.0 && n < 10.0).length;
  const blueCount = parsedPreview.filter((n) => n < 2.0).length;

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleLoadSample = (sample: string) => {
    setInputText(sample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedPreview.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Nenhum multiplicador válido detectado. Digite ou cole números como: 1.25 2.50 14.20',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const exitTimestamp = computeLastExitTimestamp();
      const ok = await onSyncBatch(
        inputText,
        replaceAll,
        secondsPerRound,
        newestFirst,
        exitTimestamp
      );
      if (ok) {
        setStatusMessage({
          type: 'success',
          text: `Sincronização concluída! ${parsedPreview.length} velas calibradas com a última saída cravada às ${formattedExitTime}.`,
        });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Falha ao sincronizar. Verifique os dados e tente novamente.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Erro de comunicação ao salvar velas.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-pink-500/40 bg-slate-900 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-700 text-white shadow-md shadow-pink-500/20">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Sincronizador da Mesa Real
                <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[10px] font-extrabold text-pink-300">
                  AO VIVO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Calibre as velas reais do site para o radar calcular os padrões de 2M, 3M, 4M e 5M com 100% de exatidão.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Explanation Box */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 text-xs text-blue-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Como calibrar com o Aviator em 3 passos:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>
                Olhe a <strong>barra superior de histórico</strong> no Aviator (onde aparecem as pílulas com multiplicadores como <span className="text-pink-300 font-bold">14.50x</span>, <span className="text-purple-300 font-bold">2.10x</span>, <span className="text-blue-300 font-bold">1.25x</span>).
              </li>
              <li>
                Digite ou copie a sequência da esquerda para a direita no campo abaixo.
              </li>
              <li>
                Clique em <strong>Calibrar Mesa</strong>. O Radar recalcula instantaneamente os minutos pagadores e as próximas velas rosa e roxas!
              </li>
            </ol>
          </div>

          {/* Quick presets */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Exemplos rápidos:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleLoadSample('1.25 1.10 3.45 1.40 12.80 2.15 1.05 4.80 1.95 2.60 1.18 18.40 2.30 1.35')
                }
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:border-pink-500 transition"
              >
                Sequência Padrão (14 velas)
              </button>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center gap-1 rounded-md border border-pink-500/40 bg-pink-950/40 px-2.5 py-1 text-[11px] font-bold text-pink-300 hover:bg-pink-900/60 transition"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Colar do Teclado</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Sequência de Velas (aceita números com ponto ou vírgula, separados por espaço ou vírgula):
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ex: 1.25, 2.40, 1.15, 14.80, 3.10, 1.05, 5.20, 1.85, 22.00, 1.30, 2.05"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          {/* Live Preview of parsed candles */}
          {parsedPreview.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Pré-visualização: {parsedPreview.length} velas detectadas
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-pink-500/20 px-1.5 py-0.5 text-[10px] font-bold text-pink-400">
                    {pinkCount} Rosa (10x+)
                  </span>
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">
                    {purpleCount} Roxa (2x+)
                  </span>
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                    {blueCount} Azul (&lt;2x)
                  </span>
                </div>
              </div>

              {/* Badges preview row */}
              <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto py-1">
                {parsedPreview.map((num, i) => {
                  const isPink = num >= 10.0;
                  const isPurple = num >= 2.0 && num < 10.0;
                  const isFirst = i === 0;
                  const isLast = i === parsedPreview.length - 1;
                  const badgeClass = isPink
                    ? 'border-pink-500 bg-pink-950/80 text-pink-300 shadow-sm shadow-pink-500/20'
                    : isPurple
                    ? 'border-purple-500 bg-purple-950/80 text-purple-300'
                    : 'border-blue-700 bg-blue-950/80 text-blue-300';

                  return (
                    <div key={`preview-${i}`} className="flex items-center gap-1">
                      <div className="flex flex-col items-center">
                        <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${badgeClass}`}>
                          {num.toFixed(2)}x
                        </span>
                        {isFirst && (
                          <div className="flex flex-col items-center mt-0.5">
                            <span className="text-[9px] font-black text-amber-400">
                              {newestFirst ? '🔴 ACABOU DE SAIR' : 'Mais antiga'}
                            </span>
                            {newestFirst && (
                              <span className="text-[9px] font-mono font-bold text-amber-300">
                                às {formattedExitTime}
                              </span>
                            )}
                          </div>
                        )}
                        {isLast && parsedPreview.length > 1 && (
                          <div className="flex flex-col items-center mt-0.5">
                            <span className="text-[9px] font-bold text-slate-500">
                              {newestFirst ? 'Mais antiga' : '🔴 ACABOU DE SAIR'}
                            </span>
                            {!newestFirst && (
                              <span className="text-[9px] font-mono font-bold text-amber-300">
                                às {formattedExitTime}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isLast && (
                        <span className="text-[10px] text-slate-600 font-bold px-0.5">
                          {newestFirst ? '◄' : '►'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXACT EXIT TIME SECTION: HORA, MINUTO E SEGUNDO DA ÚLTIMA SAÍDA */}
          <div className="rounded-2xl border border-pink-500/50 bg-gradient-to-br from-pink-950/40 via-slate-900 to-purple-950/40 p-4 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-pink-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span>Horário da Última Saída da Mesa</span>
                    <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[9px] font-black text-pink-300 border border-pink-500/30">
                      HORA : MINUTO : SEGUNDO
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Define o momento exato em que a última vela saiu para calcular o ritmo e os minutos pagantes com precisão de segundos.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLiveClockSynced ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-mono font-bold text-slate-300">
                  {isLiveClockSynced ? 'Relógio em Tempo Real' : 'Horário Personalizado'}
                </span>
              </div>
            </div>

            {/* Big Digital Display + Steppers */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Left: Big Digital Display */}
              <div className="sm:col-span-6 rounded-xl border border-slate-800 bg-slate-950/90 p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                  Última Saída Gravada em:
                </span>
                <div className="font-mono text-3xl font-black text-amber-300 tracking-wider flex items-center gap-1">
                  <span>{String(exitHour).padStart(2, '0')}</span>
                  <span className="text-pink-400 animate-pulse">:</span>
                  <span>{String(exitMinute).padStart(2, '0')}</span>
                  <span className="text-pink-400 animate-pulse">:</span>
                  <span className="text-emerald-400">{String(exitSecond).padStart(2, '0')}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">
                  Minuto Pagante: <strong className="text-amber-300">:{String(exitMinute).padStart(2, '0')}</strong> • Segundo: <strong className="text-emerald-300">:{String(exitSecond).padStart(2, '0')}s</strong>
                </span>
              </div>

              {/* Right: Quick Adjustment Buttons */}
              <div className="sm:col-span-6 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Ajustes Rápidos de Horário:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSyncToNow}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition border ${
                      isLiveClockSynced
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/20'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Agora Mesmo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustSecondsAgo(10)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-pink-500 transition"
                  >
                    -10s
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustSecondsAgo(20)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-pink-500 transition"
                  >
                    -20s
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustSecondsAgo(30)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-pink-500 transition"
                  >
                    -30s
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustSecondsAgo(60)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-pink-500 transition"
                  >
                    -1 min
                  </button>
                </div>

                {/* Fine Manual Inputs for Hour, Minute, Second */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Hora (00-23)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={exitHour}
                      onChange={(e) => {
                        setIsLiveClockSynced(false);
                        const val = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                        setExitHour(val);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-center text-xs font-bold text-white focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Minuto (00-59)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={exitMinute}
                      onChange={(e) => {
                        setIsLiveClockSynced(false);
                        const val = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                        setExitMinute(val);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-center text-xs font-bold text-amber-300 focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Segundo (00-59)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={exitSecond}
                      onChange={(e) => {
                        setIsLiveClockSynced(false);
                        const val = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                        setExitSecond(val);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-center text-xs font-bold text-emerald-300 focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reading Order Option (Newest First vs Oldest First) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Ordem em que você digitou as velas:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewestFirst(true)}
                className={`rounded-lg p-2 text-left text-xs font-bold border transition ${
                  newestFirst
                    ? 'border-pink-500 bg-pink-500/15 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-pink-300">Padrão Barra Aviator</span>
                  {newestFirst && <CheckCircle2 className="w-4 h-4 text-pink-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  1ª vela digitada foi a que ACABOU de sair (da esquerda para a direita).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNewestFirst(false)}
                className={`rounded-lg p-2 text-left text-xs font-bold border transition ${
                  !newestFirst
                    ? 'border-purple-500 bg-purple-500/15 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-300">Ordem Inversa</span>
                  {!newestFirst && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  A ÚLTIMA vela digitada foi a que acabou de sair.
                </p>
              </button>
            </div>
          </div>

          {/* Options: Replace all vs Append & Seconds per round */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Modo de Substituição:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplaceAll(true)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold border transition ${
                    replaceAll
                      ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Substituir Tudo (Calibração Limpa)
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceAll(false)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold border transition ${
                    !replaceAll
                      ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Adicionar ao Topo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Ritmo da Mesa (segundos por rodada):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={15}
                  max={30}
                  value={secondsPerRound}
                  onChange={(e) => setSecondsPerRound(Number(e.target.value))}
                  className="flex-1 accent-pink-500"
                />
                <span className="font-mono text-xs font-bold text-white w-12 text-right">
                  {secondsPerRound}s
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Padrão Spribe: 20 a 24 segundos por voo.
              </span>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setStatusMessage(null);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Campo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || parsedPreview.length === 0}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg shadow-pink-600/30 hover:brightness-110 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Calibrando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Calibrar Mesa com {parsedPreview.length} Velas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
