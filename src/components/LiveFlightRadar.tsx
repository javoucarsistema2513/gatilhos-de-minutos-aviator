import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RefreshCw, Send, Sparkles } from 'lucide-react';
import { generateRealisticMultiplier, getMultiplierTier } from '../utils/aviatorEngine';
import { RoundData } from '../types';
import { soundEffects } from '../utils/audio';

interface LiveFlightRadarProps {
  onNewRound: (round: RoundData) => void;
  isAutoFeed: boolean;
  onToggleAutoFeed: () => void;
}

type FlightState = 'COUNTDOWN' | 'FLYING' | 'FLEW_AWAY';

export const LiveFlightRadar: React.FC<LiveFlightRadarProps> = ({
  onNewRound,
  isAutoFeed,
  onToggleAutoFeed,
}) => {
  const [flightState, setFlightState] = useState<FlightState>('COUNTDOWN');
  const [countdown, setCountdown] = useState<number>(4);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [lastCrashMultiplier, setLastCrashMultiplier] = useState<number | null>(null);

  const targetCrashRef = useRef<number>(2.45);
  const flightIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Iniciar nova rodada
  const startNextRound = () => {
    targetCrashRef.current = generateRealisticMultiplier();
    setFlightState('COUNTDOWN');
    setCountdown(4);
    setCurrentMultiplier(1.00);
  };

  useEffect(() => {
    if (!isAutoFeed) {
      if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    if (flightState === 'COUNTDOWN') {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setFlightState('FLYING');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (flightState === 'FLYING') {
      const startTime = Date.now();
      const target = targetCrashRef.current;

      flightIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        // Curva exponencial suave do multiplicador: começa lento e acelera
        const mult = 1.00 + Math.pow(elapsed * 0.7, 1.4);

        if (mult >= target) {
          // Crash aconteceu!
          clearInterval(flightIntervalRef.current!);
          setCurrentMultiplier(target);
          setLastCrashMultiplier(target);
          setFlightState('FLEW_AWAY');

          // Criar RoundData
          const now = new Date();
          const newRound: RoundData = {
            id: `round-${Date.now()}`,
            multiplier: target,
            timestamp: now.getTime(),
            minute: now.getMinutes(),
            timeFormatted: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
            tier: getMultiplierTier(target),
          };
          onNewRound(newRound);

          // Efeito sonoro suave
          if (target >= 10.00) {
            soundEffects.playGreenCelebration();
          }

          // Esperar 3.5 segundos para a próxima rodada
          setTimeout(() => {
            if (isAutoFeed) {
              startNextRound();
            }
          }, 3500);
        } else {
          setCurrentMultiplier(Number(mult.toFixed(2)));
        }
      }, 50);
    }

    return () => {
      if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [flightState, isAutoFeed]);

  // Cálculo de posição do aviãozinho na tela
  // Normaliza o voo para uma curva parabólica
  const progressPercent = Math.min(100, ((currentMultiplier - 1.00) / 12) * 100);
  const planeX = Math.min(85, 12 + progressPercent * 0.75);
  const planeY = Math.max(18, 75 - progressPercent * 0.58);

  const getMultiplierColor = () => {
    if (currentMultiplier >= 10.00) return 'text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.7)]';
    if (currentMultiplier >= 2.00) return 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]';
    return 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]';
  };

  return (
    <div
      id="live-flight-radar"
      className="relative overflow-hidden rounded-2xl border border-rose-950/60 bg-gradient-to-b from-[#0F1424] via-[#0A0D18] to-[#070910] p-4 sm:p-5 shadow-2xl"
    >
      {/* Header bar of Radar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            Radar em Tempo Real
            <span className="text-[10px] text-orange-400 font-bold bg-orange-950/60 border border-orange-500/30 px-1.5 py-0.5 rounded">Mesa do Betão</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-feed-button"
            onClick={onToggleAutoFeed}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
              isAutoFeed
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isAutoFeed ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoFeed ? 'Feed Ativo' : 'Feed Pausado'}</span>
          </button>
        </div>
      </div>

      {/* Flight Canvas Area */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#080B14] to-[#04060A] border border-slate-800/80 mt-3 flex items-center justify-center">
        {/* Radar concentric grid lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748B" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Flight Curve Graphic */}
        {flightState === 'FLYING' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d={`M 10% 85% Q ${planeX * 0.5}% 80%, ${planeX}% ${planeY}%`}
              fill="none"
              stroke="#E11D48"
              strokeWidth="4"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]"
            />
            {/* Gradient area underneath curve */}
            <path
              d={`M 10% 85% Q ${planeX * 0.5}% 80%, ${planeX}% ${planeY}% L ${planeX}% 85% Z`}
              fill="rgba(225, 29, 72, 0.12)"
            />
          </svg>
        )}

        {/* Airplane Visual Element */}
        {flightState === 'FLYING' && (
          <div
            className="absolute transition-all duration-75 pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${planeX}%`, top: `${planeY}%` }}
          >
            <div className="relative">
              {/* Aviator Airplane */}
              <div className="w-12 h-8 text-rose-500 flex items-center justify-center drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]">
                <Send className="w-8 h-8 rotate-45 transform fill-rose-600 text-white" />
              </div>
              {/* Jet particle smoke trail */}
              <div className="absolute -bottom-1 -left-3 w-4 h-2 rounded-full bg-rose-400/40 blur-xs animate-ping" />
            </div>
          </div>
        )}

        {/* Center Multiplier Counter or Countdown Screen */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {flightState === 'COUNTDOWN' && (
            <div className="space-y-1 animate-in fade-in zoom-in duration-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                Próxima Rodada em
              </span>
              <div className="text-4xl sm:text-5xl font-black text-rose-500 font-mono tracking-tighter drop-shadow-md">
                00:0{countdown}
              </div>
              <span className="text-[10px] text-slate-400">Sincronizando com os minutos <strong className="text-orange-400">do Betão</strong>...</span>
            </div>
          )}

          {flightState === 'FLYING' && (
            <div className="space-y-0.5 animate-in fade-in duration-100">
              <div className={`text-5xl sm:text-6xl font-black tracking-tight font-mono transition-colors ${getMultiplierColor()}`}>
                {currentMultiplier.toFixed(2)}x
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Subindo...
              </span>
            </div>
          )}

          {flightState === 'FLEW_AWAY' && (
            <div className="space-y-1 animate-in zoom-in-95 duration-150">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                O Avião Voou Para Longe!
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-rose-500">
                {lastCrashMultiplier?.toFixed(2)}x
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-semibold text-slate-300">
                {lastCrashMultiplier && lastCrashMultiplier >= 10.00 ? (
                  <span className="text-fuchsia-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> VELA ROSA CONFIRMADA!
                  </span>
                ) : lastCrashMultiplier && lastCrashMultiplier >= 2.00 ? (
                  <span className="text-purple-400 font-bold">Vela Roxa Registrada</span>
                ) : (
                  <span className="text-sky-400">Vela Azul Registrada</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
