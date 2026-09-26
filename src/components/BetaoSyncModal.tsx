import React, { useState } from 'react';
import {
  X,
  Flame,
  Clock,
  Radio,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Volume2,
  Copy,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AviatorCandle } from '../types/aviator';
import { formatMinuteOnly, formatTime24 } from '../utils/aviatorFormulas';
import { playAviatorSound } from '../utils/audioAlert';

interface BetaoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCandles: (newCandles: AviatorCandle[]) => void;
  clockOffsetSeconds: number;
  onSetClockOffset: (secs: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const BetaoSyncModal: React.FC<BetaoSyncModalProps> = ({
  isOpen,
  onClose,
  onImportCandles,
  clockOffsetSeconds,
  onSetClockOffset,
  soundEnabled,
  onToggleSound,
}) => {
  const [inputText, setInputText] = useState('');
  const [direction, setDirection] = useState<'left_to_right' | 'right_to_left'>('left_to_right');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseAndSync = () => {
    if (!inputText.trim()) {
      setFeedback('Cole ao menos alguns multiplicadores para sincronizar.');
      return;
    }

    // Match numbers with dots or commas (e.g., 1.25x, 14,50, 2.10, 100x)
    const normalized = inputText.replace(/,/g, '.');
    const matches = normalized.match(/\d+(\.\d+)?/g);

    if (!matches || matches.length === 0) {
      setFeedback('Nenhum multiplicador válido detectado.');
      return;
    }

    const numbers = matches.map(Number).filter((n) => !isNaN(n) && n >= 1.0);
    if (numbers.length === 0) {
      setFeedback('Os valores precisam ser maiores ou iguais a 1.00x.');
      return;
    }

    // Order: if left_to_right, assume left is oldest and right is newest (standard reading).
    // If right_to_left, assume right is oldest and left is newest (as in some Betano layouts).
    const orderedNumbers = direction === 'left_to_right' ? numbers : [...numbers].reverse();

    const total = orderedNumbers.length;
    const now = Date.now();

    // Average Aviator round duration is ~12 seconds
    const generatedCandles: AviatorCandle[] = orderedNumbers.map((mult, idx) => {
      const secondsAgo = (total - 1 - idx) * 12;
      const d = new Date(now - secondsAgo * 1000 + clockOffsetSeconds * 1000);
      return {
        id: `betao-import-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        multiplier: Math.round(mult * 100) / 100,
        timestamp: d,
        minuteString: formatMinuteOnly(d),
        timeString: formatTime24(d),
        isPink: mult >= 10.0,
      };
    });

    onImportCandles(generatedCandles);
    playAviatorSound('test');
    setFeedback(`Sucesso! ${generatedCandles.length} velas do Betão sincronizadas.`);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handlePasteDemoSample = () => {
    // Typical Betano Aviator strip sample
    setInputText('1.15x 1.82x 14.50x 1.05x 2.10x 3.45x 1.20x 1.95x 28.40x 1.30x 2.05x 1.10x 10.20x 1.45x');
    setFeedback(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-6 text-white space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Sincronizador Betão Ao Vivo</h3>
              <p className="text-xs text-slate-400">
                Alinhe a minutagem diretamente com a fita de resultados da sua mesa no Betano
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Architecture Note */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-300 leading-relaxed">
            <strong className="text-emerald-300">Como funciona o cálculo em tempo real com o Betão:</strong>
            <p className="text-[11px] text-slate-400">
              A Betano protege seu tráfego contra invasões com Cloudflare WAF e tokens de sessão restritos. Por isso, 
              <strong> nenhum robô externo pode invadir o WebSocket diretamente sem arriscar o banimento da sua conta</strong>.
              O AeroCalc utiliza a <strong>Sincronização Ativa de Fita + Relógio de Brasília</strong>: você cola ou atualiza as velas da mesa e nosso radar calcula em tempo real os minutos quentes e emite alarmes sonoros.
            </p>
          </div>
        </div>

        {/* Paste Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">
              Cole a sequência de multiplicadores da barra do Betão:
            </label>
            <button
              onClick={handlePasteDemoSample}
              className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Usar Exemplo da Betano
            </button>
          </div>

          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setFeedback(null);
            }}
            placeholder="Exemplo: 1.25x 14.50x 1.80x 2.10x 32.00x 1.05x ... (copie do Betão ou digite separados por espaço ou vírgula)"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
            <div className="flex items-center space-x-2">
              <span>Ordem de leitura:</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="left_to_right">Mais antigo → Mais recente (Padrão)</option>
                <option value="right_to_left">Mais recente → Mais antigo</option>
              </select>
            </div>

            <span className="text-[11px] text-slate-500 font-mono">
              Ritmo médio estimado: ~12s por rodada
            </span>
          </div>
        </div>

        {/* Clock Fine Tuning / Latency Offset */}
        <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" /> Ajuste Fino de Delay da Betano (Offset)
            </span>
            <span className="font-mono text-cyan-300 font-bold">
              {clockOffsetSeconds > 0 ? `+${clockOffsetSeconds}s` : `${clockOffsetSeconds}s`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Compense o atraso da animação de voo ou do streaming da sua internet em relação aos servidores da Betano:
          </p>
          <div className="flex items-center space-x-2">
            {[-15, -10, -5, 0, 5, 10, 15].map((secs) => (
              <button
                key={secs}
                onClick={() => onSetClockOffset(secs)}
                className={`flex-1 py-1 rounded text-[11px] font-mono transition-colors ${
                  clockOffsetSeconds === secs
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {secs > 0 ? `+${secs}` : secs}s
              </button>
            ))}
          </div>
        </div>

        {/* Feedback message if any */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              feedback.startsWith('Sucesso')
                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-500 text-rose-300'
            }`}
          >
            {feedback.startsWith('Sucesso') ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{feedback}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={onToggleSound}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              soundEnabled
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Alarme: {soundEnabled ? 'Ativado' : 'Silenciado'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleParseAndSync}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold font-mono shadow-lg shadow-rose-900/40 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>SINCRONIZAR COM BETÃO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
