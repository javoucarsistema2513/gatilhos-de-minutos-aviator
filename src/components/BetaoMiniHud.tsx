import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Zap,
  Clock,
  AlertTriangle,
  Minus,
  Maximize2,
  Flame,
  Radio,
  X
} from 'lucide-react';
import { playAviatorSound } from '../utils/audioAlert';

interface BetaoMiniHudProps {
  currentMinuteStr: string;
  currentSecond: number;
  timeString: string;
  liveStatus: {
    type: 'active' | 'warning' | 'waiting';
    title: string;
    desc: string;
    targetMin?: string;
  };
  nextTargetMinute?: string;
  secondsRemaining: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAddCandle: (mult: number) => void;
  onClose: () => void;
  consecutiveBlues: number;
}

export const BetaoMiniHud: React.FC<BetaoMiniHudProps> = ({
  currentMinuteStr,
  currentSecond,
  timeString,
  liveStatus,
  nextTargetMinute,
  secondsRemaining,
  soundEnabled,
  onToggleSound,
  onAddCandle,
  onClose,
  consecutiveBlues,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return 'ENTRAR AGORA!';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTestSound = () => {
    playAviatorSound('test');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-full shadow-2xl border font-mono font-bold text-xs ${
            liveStatus.type === 'active'
              ? 'bg-rose-600 border-rose-300 text-white animate-pulse shadow-rose-600/50'
              : liveStatus.type === 'warning'
              ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-500/50'
              : 'bg-slate-900 border-slate-700 text-cyan-300 shadow-slate-950'
          }`}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>HUD BETÃO: {nextTargetMinute ? `Min ${nextTargetMinute}` : 'Ativo'}</span>
          <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">
            {secondsRemaining > 0 ? formatCountdown(secondsRemaining) : 'ENTRAR'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-slate-950/95 border-2 border-rose-500/80 rounded-2xl shadow-2xl shadow-rose-950/50 backdrop-blur-md p-4 text-white font-sans transition-all">
      {/* Header bar of HUD */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="text-xs font-bold font-mono tracking-wider text-rose-300 uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" /> HUD Betão Ao Vivo
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Silenciar Alarme' : 'Ativar Alarme Sonoro'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimizar HUD"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Fechar Mini-HUD"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Signal Display */}
      <div
        className={`rounded-xl p-3 border mb-3 text-center transition-all ${
          liveStatus.type === 'active'
            ? 'bg-rose-950/90 border-rose-500 shadow-lg shadow-rose-900/40 animate-pulse'
            : liveStatus.type === 'warning'
            ? 'bg-amber-950/90 border-amber-500 shadow-lg shadow-amber-900/40'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
          <span>Relógio Betão: <strong className="text-white">{timeString}</strong></span>
          <span className="text-cyan-400">Minuto: :{currentMinuteStr}</span>
        </div>

        <div className="py-1">
          {liveStatus.type === 'active' ? (
            <div className="flex items-center justify-center space-x-2 text-rose-300 font-bold font-mono text-lg animate-bounce">
              <Zap className="w-5 h-5 text-rose-400" />
              <span>SINAL ATIVO BETÃO!</span>
            </div>
          ) : liveStatus.type === 'warning' ? (
            <div className="flex items-center justify-center space-x-2 text-amber-300 font-bold font-mono text-base">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>PREPARAR ENTRADA!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-slate-300 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aguardando próximo gatilho</span>
            </div>
          )}
        </div>

        {/* Big Countdown */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-around">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Minuto Alvo</div>
            <div className="text-lg font-bold font-mono text-white">
              {nextTargetMinute ? `:${nextTargetMinute}` : '--'}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Contagem</div>
            <div
              className={`text-xl font-bold font-mono ${
                liveStatus.type === 'active'
                  ? 'text-rose-400 animate-pulse'
                  : liveStatus.type === 'warning'
                  ? 'text-amber-300'
                  : 'text-cyan-300'
              }`}
            >
              {secondsRemaining > 0 ? formatCountdown(secondsRemaining) : 'ATIVO'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick 1-Click Multiplier logger for Betão */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Registrar última vela que caiu no Betão:</span>
          {consecutiveBlues >= 3 && (
            <span className="text-amber-400 font-mono font-bold text-[10px]">
              {consecutiveBlues}x azuis seguidas
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
          <button
            onClick={() => onAddCandle(1.25)}
            className="py-1.5 rounded bg-blue-950/70 border border-blue-600/40 text-blue-300 hover:bg-blue-900 font-bold"
            title="Vela Azul (< 2.0x)"
          >
            &lt; 2.0x
          </button>
          <button
            onClick={() => onAddCandle(3.5)}
            className="py-1.5 rounded bg-purple-950/70 border border-purple-600/40 text-purple-300 hover:bg-purple-900 font-bold"
            title="Vela Roxa (2x a 9.99x)"
          >
            2x-9x
          </button>
          <button
            onClick={() => onAddCandle(14.5)}
            className="py-1.5 rounded bg-pink-950/80 border border-pink-500 text-pink-300 hover:bg-pink-900 font-bold shadow-sm"
            title="Vela Rosa (10x+)"
          >
            🌸 10x+
          </button>
          <button
            onClick={() => onAddCandle(105.0)}
            className="py-1.5 rounded bg-amber-950/80 border border-amber-500 text-amber-300 hover:bg-amber-900 font-bold"
            title="Vela Dourada (100x+)"
          >
            👑 100x+
          </button>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Alarme: {soundEnabled ? '🔔 Ativo' : '🔕 Mudo'}</span>
        <button
          onClick={handleTestSound}
          className="text-cyan-400 hover:underline flex items-center gap-1"
        >
          Testar Som
        </button>
      </div>
    </div>
  );
};
