import React from 'react';
import { RadarSignal, Candle } from '../types/aviator';
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Volume2, 
  Flame, 
  Check, 
  RefreshCw, 
  Timer,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface NextCandleAlertCardProps {
  signal: RadarSignal;
  latestCandle: Candle | null;
  currentTimeStr: string;
  onAutoRecalibrate: () => void;
  onRegisterResult: (isWin: boolean) => void;
}

export const NextCandleAlertCard: React.FC<NextCandleAlertCardProps> = ({
  signal,
  latestCandle,
  currentTimeStr,
  onAutoRecalibrate,
  onRegisterResult,
}) => {
  const isPinkOpportunity = signal.opportunity === 'ROSA_ALTA';

  // Live countdown formatting
  const mins = Math.floor(signal.secondsRemaining / 60);
  const secs = signal.secondsRemaining % 60;
  const countdownFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const getStatusConfig = () => {
    switch (signal.phase) {
      case 'ACTIVE_ENTRY':
        return {
          title: `ENTRAR AGORA NO MINUTO :${String(signal.targetMinute).padStart(2, '0')}!`,
          subtitle: `Horário ${signal.targetTimeStr} ativo na 82b.game! Rodada acontecendo agora.`,
          badgeBg: 'bg-emerald-500 text-black font-black animate-pulse',
          badgeText: '● ENTRADA CONFIRMADA (RODADA ATIVA)',
          containerBorder: 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.45)] ring-2 ring-emerald-500/50',
          headerBg: 'bg-emerald-950/60 border-emerald-500/50',
        };
      case 'PREPARING':
        return {
          title: `ATENÇÃO: FALTAM ${signal.secondsRemaining}s PARA O MINUTO :${String(signal.targetMinute).padStart(2, '0')}!`,
          subtitle: `Abra a aposta no Aviator 82b agora. Mão 1 no 2.00x e Mão 2 na subida!`,
          badgeBg: 'bg-amber-500 text-black font-black animate-pulse',
          badgeText: '⚠️ PREPARAR APOSTA IMEDIATA',
          containerBorder: 'border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/40',
          headerBg: 'bg-amber-950/60 border-amber-500/50',
        };
      case 'WIN':
        const mult = signal.resultCandle?.multiplier || 2.5;
        const isPinkWin = mult >= 10.0;
        return {
          title: isPinkWin 
            ? `🔥 SUPER GREEN! VELA ROSA DE ${mult.toFixed(2)}x CONFIRMADA!` 
            : `⚡ GREEN CONFIRMADO! VELA ROXA DE ${mult.toFixed(2)}x PAGA!`,
          subtitle: isPinkWin 
            ? `Vela Rosa bateu no minuto :${String(signal.targetMinute).padStart(2, '0')}! Lucro máximo atingido!`
            : `Alvo do 2.00x batido com sucesso no minuto :${String(signal.targetMinute).padStart(2, '0')}!`,
          badgeBg: 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black',
          badgeText: isPinkWin ? '🔥 SUPER GREEN (ROSA)!' : '✅ GREEN (ROXA)!',
          containerBorder: 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.4)]',
          headerBg: 'bg-emerald-950/60 border-emerald-400/50',
        };
      case 'ANALYZING':
      default:
        return {
          title: `SINAL CONFIRMADO PARA O MINUTO :${String(signal.targetMinute).padStart(2, '0')}`,
          subtitle: `Horário de entrada calibrado para às ${signal.targetTimeStr}. Acompanhe o cronômetro.`,
          badgeBg: 'bg-purple-900/80 border border-purple-400/40 text-purple-200',
          badgeText: '🔍 RADAR 82B EM TEMPO REAL',
          containerBorder: 'border-rose-950/80 shadow-2xl',
          headerBg: 'bg-[#0f0822] border-rose-950/60',
        };
    }
  };

  const status = getStatusConfig();

  const handleTestSound = () => {
    soundFx.playAlertSignal();
  };

  return (
    <div className={`w-full rounded-2xl bg-[#0c0618] border ${status.containerBorder} transition-all duration-300 overflow-hidden`}>
      
      {/* Top Status Header */}
      <div className={`p-4 sm:p-5 border-b ${status.headerBg} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#170a2c] border border-rose-500/30 flex items-center justify-center shrink-0">
            {signal.phase === 'ACTIVE_ENTRY' ? (
              <Flame className="w-6 h-6 text-emerald-400 animate-bounce" />
            ) : signal.phase === 'WIN' ? (
              <Check className="w-6 h-6 text-emerald-400" />
            ) : isPinkOpportunity ? (
              <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
            ) : (
              <Zap className="w-6 h-6 text-purple-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${status.badgeBg}`}>
                {status.badgeText}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Relógio 82b: <strong className="text-white font-mono">{currentTimeStr}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase text-white mt-1 tracking-wide">
              {status.title}
            </h2>
          </div>
        </div>

        {/* Sync & Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAutoRecalibrate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-rose-300 hover:text-white transition cursor-pointer"
            title="Recalcular e sincronizar com o relógio da 82b"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>Sincronizar</span>
          </button>

          <button
            onClick={handleTestSound}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer"
            title="Testar som do alerta de entrada"
          >
            <Volume2 className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>

      {/* Main Core Display */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Column 1: Horário da Entrada & Minuto Exato com Segundos Vivos */}
        <div className="p-5 rounded-xl bg-[#110822] border border-rose-950 flex flex-col justify-between items-center text-center">
          <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>Horário da Entrada 82b</span>
          </span>

          <div className="my-2">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              {signal.targetTimeStr}
            </div>
            <div className="text-xs font-black font-mono uppercase text-rose-400 tracking-widest mt-1">
              MINUTO EXATO :{String(signal.targetMinute).padStart(2, '0')}
            </div>
          </div>

          {/* Seconds Countdown Box */}
          <div className="w-full mt-2 pt-3 border-t border-rose-950/60 flex flex-col items-center">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mb-1">
              <Timer className="w-3.5 h-3.5 text-rose-400" />
              <span>Contagem Regressiva:</span>
            </span>

            {signal.phase === 'ACTIVE_ENTRY' ? (
              <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono font-black text-sm animate-pulse">
                RODADA ACONTECENDO AGORA
              </div>
            ) : signal.phase === 'WIN' ? (
              <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono font-black text-sm">
                FINALIZADO COM SUCESSO
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black font-mono text-rose-400 tracking-widest">
                  {countdownFormatted}
                </span>
                <span className="text-xs font-mono text-slate-400">s</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Alvo Duplo Descomplicado (Roxa 2x + Rosa 10x+) */}
        <div className="p-5 rounded-xl border border-purple-500/40 bg-gradient-to-b from-[#180a2c] to-[#0f061e] flex flex-col justify-between items-center text-center">
          <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>Alvo Calibrado 82b (Vela Alta)</span>
          </span>

          {/* Dual Target Badges */}
          <div className="my-2.5 w-full space-y-2">
            {/* Target 1: Roxa */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-purple-950/60 border border-purple-500/40">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-bold text-purple-200">1ª MÃO: VELA ROXA</span>
              </div>
              <span className="text-xs font-mono font-black text-white bg-purple-600 px-2 py-0.5 rounded">
                2.00x Auto
              </span>
            </div>

            {/* Target 2: Rosa */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-pink-950/60 border border-pink-500/40">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="text-xs font-bold text-pink-200">2ª MÃO: VELA ROSA</span>
              </div>
              <span className="text-xs font-mono font-black text-white bg-pink-600 px-2 py-0.5 rounded">
                10.00x+
              </span>
            </div>
          </div>

          <div className="w-full pt-2.5 border-t border-rose-950/60 text-[11px] font-mono text-slate-300 text-center">
            Padrão: <span className="text-rose-400 font-semibold">{signal.triggerName}</span>
          </div>
        </div>

      </div>

      {/* Explicação Clara: Por que Roxa e Rosa caminham juntas */}
      <div className="px-4 sm:px-6 pb-5 pt-1">
        
        {/* Banner Explicativo anti-confusão */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed mb-3">
          <div className="flex items-center gap-1.5 text-white font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Como lucrar sem confusão no Aviator 82b:</span>
          </div>
          <p className="text-slate-400">
            • Se a vela parar entre <strong>2.00x e 9.99x</strong> ➔ Você ganha o <strong>GREEN na Vela Roxa</strong> (1ª Mão).<br/>
            • Se a vela subir acima de <strong>10.00x</strong> ➔ Você ganha o <strong>SUPER GREEN na Vela Rosa</strong> (Ambas as mãos pagas!).<br/>
            <span className="text-emerald-400 font-medium font-mono">Qualquer vela acima de 2.00x é vitória com dinheiro no bolso.</span>
          </p>
        </div>

        {/* Real-time result confirmation buttons */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Bateu a vela na 82b?</span>
            <button
              onClick={() => onRegisterResult(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow"
            >
              <Check className="w-3 h-3" />
              <span>Green!</span>
            </button>
            <button
              onClick={() => onRegisterResult(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
            >
              Ajustar
            </button>
          </div>

          {latestCandle && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <span>Última registrada:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                latestCandle.color === 'pink'
                  ? 'bg-pink-600 text-white'
                  : latestCandle.color === 'purple'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-sky-300'
              }`}>
                {latestCandle.multiplier.toFixed(2)}x ({latestCandle.timeFormatted})
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
