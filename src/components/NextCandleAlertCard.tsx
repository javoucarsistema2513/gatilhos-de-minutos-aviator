import React, { useState } from 'react';
import { RadarSignal, Candle, PatternInterval } from '../types/aviator';
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
  ShieldAlert,
  Sliders,
  Calculator,
  Plus
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface NextCandleAlertCardProps {
  signal: RadarSignal;
  latestCandle: Candle | null;
  currentTimeStr: string;
  onSelectPattern: (pattern: PatternInterval) => void;
  onAutoRecalibrate: () => void;
  onRegisterResult: (isWin: boolean) => void;
  onAddCandle: (multiplier: number) => void;
}

export const NextCandleAlertCard: React.FC<NextCandleAlertCardProps> = ({
  signal,
  latestCandle,
  currentTimeStr,
  onSelectPattern,
  onAutoRecalibrate,
  onRegisterResult,
  onAddCandle,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const isPink = signal.candleType === 'ROSA';

  // Live countdown formatting
  const mins = Math.floor(signal.secondsRemaining / 60);
  const secs = signal.secondsRemaining % 60;
  const countdownFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickInput.replace(',', '.'));
    if (!isNaN(val) && val >= 1.0) {
      onAddCandle(Number(val.toFixed(2)));
      setQuickInput('');
    }
  };

  const getStatusConfig = () => {
    switch (signal.phase) {
      case 'GALE_PROTECTION':
        return {
          title: `PROTEÇÃO GALE 1 NO MINUTO :${String(signal.galeMinute).padStart(2, '0')}!`,
          subtitle: `A rodada virou para o minuto :${String(signal.galeMinute).padStart(2, '0')}. Mantenha a mão de proteção com cashout 2.00x!`,
          badgeBg: 'bg-amber-400 text-black font-black animate-pulse',
          badgeText: '🛡️ PROTEÇÃO GALE ATIVA',
          containerBorder: 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.45)] ring-2 ring-amber-400/50',
          headerBg: 'bg-amber-950/80 border-amber-400/50',
        };
      case 'ACTIVE_ENTRY':
        return {
          title: `ENTRAR AGORA NO MINUTO :${String(signal.targetMinute).padStart(2, '0')}!`,
          subtitle: `Minuto principal ativo às ${signal.targetTimeStr}:00 na 82b! Rodada autorizada.`,
          badgeBg: 'bg-emerald-500 text-black font-black animate-pulse',
          badgeText: '● ENTRADA PRINCIPAL ATIVA',
          containerBorder: 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.45)] ring-2 ring-emerald-500/50',
          headerBg: 'bg-emerald-950/70 border-emerald-500/50',
        };
      case 'PREPARING':
        return {
          title: `ATENÇÃO: FALTAM ${signal.secondsRemaining}s PARA O MINUTO :${String(signal.targetMinute).padStart(2, '0')}!`,
          subtitle: `Abra a aposta no Aviator 82b agora. Entrada exata às ${signal.targetTimeStr}:00!`,
          badgeBg: 'bg-amber-500 text-black font-black animate-pulse',
          badgeText: '⚠️ PREPARAR APOSTA IMEDIATA',
          containerBorder: 'border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/40',
          headerBg: 'bg-amber-950/70 border-amber-500/50',
        };
      case 'WIN':
        const mult = signal.resultCandle?.multiplier || (isPink ? 14.5 : 2.8);
        return {
          title: isPink 
            ? `🔥 GREEN CONFIRMADO! VELA ROSA DE ${mult.toFixed(2)}x!` 
            : `⚡ GREEN CONFIRMADO! VELA ROXA DE ${mult.toFixed(2)}x!`,
          subtitle: `Vela confirmada com lucro na 82b.game! Padrão batido com sucesso.`,
          badgeBg: 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black',
          badgeText: '✅ GREEN CONFIRMADO!',
          containerBorder: 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.4)]',
          headerBg: 'bg-emerald-950/70 border-emerald-400/50',
        };
      case 'ANALYZING':
      default:
        return {
          title: `SINAL CONFIRMADO PARA O MINUTO :${String(signal.targetMinute).padStart(2, '0')}`,
          subtitle: `Horário de entrada calibrado para às ${signal.targetTimeStr}:00 (Padrão ${signal.patternMinutes} min).`,
          badgeBg: isPink ? 'bg-pink-900/80 border border-pink-400/50 text-pink-200' : 'bg-purple-900/80 border border-purple-400/50 text-purple-200',
          badgeText: isPink ? '🌸 SINAL: VELA ROSA' : '⚡ SINAL: VELA ROXA',
          containerBorder: isPink ? 'border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.25)]' : 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.25)]',
          headerBg: 'bg-[#0f0822] border-rose-950/70',
        };
    }
  };

  const status = getStatusConfig();

  const handleTestSound = () => {
    soundFx.playAlertSignal();
  };

  const dec = signal.decimalAnalysis;

  return (
    <div className={`w-full rounded-2xl bg-[#0c0618] border ${status.containerBorder} transition-all duration-300 overflow-hidden`}>
      
      {/* Top Status Header */}
      <div className={`p-4 sm:p-5 border-b ${status.headerBg} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
            signal.phase === 'GALE_PROTECTION'
              ? 'bg-amber-950/80 border-amber-400 text-amber-300'
              : isPink 
              ? 'bg-pink-950/60 border-pink-500/60 text-pink-400' 
              : 'bg-purple-950/60 border-purple-500/60 text-purple-400'
          }`}>
            {signal.phase === 'GALE_PROTECTION' ? (
              <ShieldAlert className="w-6 h-6 text-amber-300 animate-pulse" />
            ) : signal.phase === 'ACTIVE_ENTRY' ? (
              <Flame className="w-6 h-6 text-emerald-400 animate-bounce" />
            ) : signal.phase === 'WIN' ? (
              <Check className="w-6 h-6 text-emerald-400" />
            ) : isPink ? (
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
                Relógio Oficial: <strong className="text-white font-mono">{currentTimeStr}</strong>
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
            title="Recalcular com base na mesa da 82b"
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

      {/* Pattern Selector Bar (3, 4, 5 minutos solicitados pelo usuário) */}
      <div className="bg-[#120722] border-b border-rose-950/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
          <Sliders className="w-3.5 h-3.5 text-rose-400" />
          <span>Padrão 82b:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectPattern(3)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              signal.patternMinutes === 3
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60 ring-1 ring-purple-400'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Padrão 3 Min (Roxa)</span>
          </button>

          <button
            onClick={() => onSelectPattern(4)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              signal.patternMinutes === 4
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/60 ring-1 ring-indigo-400'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Padrão 4 Min</span>
          </button>

          <button
            onClick={() => onSelectPattern(5)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              signal.patternMinutes === 5
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/60 ring-1 ring-pink-400'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Padrão 5 Min (Rosa)</span>
          </button>
        </div>
      </div>

      {/* Main Core Display */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Column 1: Horário da Entrada & Segundos Exatos */}
        <div className="p-5 rounded-xl bg-[#110822] border border-rose-950 flex flex-col justify-between items-center text-center">
          <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>Horário de Entrada 82b</span>
          </span>

          <div className="my-2">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              {signal.targetTimeStr}:00
            </div>
            <div className="flex items-center justify-center gap-2 mt-1 text-xs font-black font-mono uppercase tracking-widest">
              <span className="text-rose-400">MINUTO :{String(signal.targetMinute).padStart(2, '0')}</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400">GALE :{String(signal.galeMinute).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Seconds Countdown Box (Zero seconds difference) */}
          <div className="w-full mt-2 pt-3 border-t border-rose-950/60 flex flex-col items-center">
            {signal.phase === 'GALE_PROTECTION' ? (
              <div className="w-full space-y-1">
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>PROTEÇÃO GALE 1 NO MINUTO :{String(signal.galeMinute).padStart(2, '0')}</span>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  :{String(signal.activeSecondsOfMinute).padStart(2, '0')}s <span className="text-xs text-slate-400 font-normal">do gale</span>
                </div>
              </div>
            ) : signal.phase === 'ACTIVE_ENTRY' ? (
              <div className="w-full space-y-1">
                <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>MINUTO PRINCIPAL :{String(signal.targetMinute).padStart(2, '0')} (RODADA EM CURSO)</span>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  :{String(signal.activeSecondsOfMinute).padStart(2, '0')}s <span className="text-xs text-slate-400 font-normal">do minuto</span>
                </div>
              </div>
            ) : signal.phase === 'WIN' ? (
              <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono font-black text-sm">
                RODADA FINALIZADA COM SUCESSO
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1 mb-1">
                  <Timer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Contagem até o Minuto :{String(signal.targetMinute).padStart(2, '0')}</span>
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-rose-400 tracking-widest">
                    {countdownFormatted}
                  </span>
                  <span className="text-xs font-mono text-slate-400">s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Alvo Definido pelo Padrão */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between items-center text-center ${
          isPink 
            ? 'bg-gradient-to-b from-pink-950/50 via-[#180824] to-[#0f061e] border-pink-500/60 shadow-[0_0_20px_rgba(236,72,153,0.2)]' 
            : 'bg-gradient-to-b from-purple-950/50 via-[#150827] to-[#0f061e] border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
        }`}>
          <span className="text-xs uppercase font-mono font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
            {isPink ? <Sparkles className="w-4 h-4 text-pink-400" /> : <Zap className="w-4 h-4 text-purple-400" />}
            <span>Alvo Previsto na 82b</span>
          </span>

          <div className="my-2 text-center w-full">
            {isPink ? (
              <div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]">
                  VELA ROSA
                </div>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 font-black text-xs border border-pink-500/40 uppercase tracking-wider">
                  ALVO: 10.00x+ A 25.00x+
                </div>
              </div>
            ) : (
              <div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 drop-shadow-[0_0_15px_rgba(192,38,211,0.6)]">
                  VELA ROXA
                </div>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 font-bold text-xs border border-purple-500/40 uppercase tracking-wider">
                  ALVO: 2.00x A 5.00x
                </div>
              </div>
            )}
          </div>

          <div className="w-full pt-2.5 border-t border-rose-950/60 text-[11px] font-mono text-slate-300 text-center">
            Padrão: <span className="text-rose-400 font-bold">Ciclo de {signal.patternMinutes} Minutos</span>
          </div>
        </div>

      </div>

      {/* NEW: Painel de Alta Precisão - Soma da Rodada com Decimais */}
      <div className="mx-4 sm:mx-6 mb-4 p-3.5 rounded-xl bg-[#130726] border border-purple-500/40 text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-900/60">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white uppercase text-[11px] tracking-wide">
              Cálculo por Soma da Rodada com Decimal:
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
            Assertividade: {dec.antiQuebraScore}%
          </span>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
          
          <div className="p-2 rounded-lg bg-[#0e051d] border border-purple-950">
            <span className="text-[10px] text-slate-400 block font-mono">Última Vela</span>
            <span className="text-sm font-black font-mono text-white">
              {dec.lastMultiplier.toFixed(2)}x
            </span>
            <span className="text-[10px] text-purple-300 block font-mono">
              Decimais: ,{String(dec.decimalPart).padStart(2, '0')} (Dígitos: {dec.digitsSum})
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#0e051d] border border-purple-950">
            <span className="text-[10px] text-slate-400 block font-mono">Soma das 3 Rodadas</span>
            <span className="text-sm font-black font-mono text-rose-400">
              {dec.sumLast3Multipliers.toFixed(2)}x
            </span>
            <span className="text-[10px] text-rose-300 block font-mono">
              Soma Decimais: {dec.sumLast3Decimals}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#0e051d] border border-purple-950">
            <span className="text-[10px] text-slate-400 block font-mono">Status da Mesa</span>
            <span className="text-xs font-black font-mono text-amber-300 block mt-0.5">
              {dec.retentionStatus === 'EXPANSAO_ALTA' ? 'ALTA EXPANSÃO' : dec.retentionStatus === 'RETENCAO_CUIDADO' ? 'RETENÇÃO (ANTI-QUEBRA)' : 'MESA ESTÁVEL'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {signal.candleType === 'ROSA' ? 'Alvo: 10.00x+' : 'Alvo: 2.00x'}
            </span>
          </div>

        </div>

        {/* Retention / Anti-Breakout Banner */}
        <div className="mt-2.5 pt-2 border-t border-purple-950/80 text-[11px] text-slate-300 flex items-center gap-1.5">
          <span>{dec.retentionLabel}</span>
        </div>
      </div>

      {/* Direct Quick Add / Real-time Sync Form */}
      <div className="mx-4 sm:mx-6 mb-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="font-bold text-white text-[11px]">Sincronizar Vela da 82b:</span>
          <span className="text-slate-400 text-[10px]">(digite o valor que acabou de sair)</span>
        </div>

        <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Ex: 2.45"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className="w-24 px-2 py-1 rounded bg-[#100720] border border-purple-500/60 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Calcular Soma</span>
          </button>
        </form>
      </div>

      {/* Regra de Ouro da Entrada & Proteção Gale */}
      <div className="px-4 sm:px-6 pb-5 pt-1">
        
        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed mb-3 flex items-start gap-2.5 ${
          signal.phase === 'GALE_PROTECTION'
            ? 'bg-amber-950/40 border-amber-400/50 text-amber-100'
            : isPink 
            ? 'bg-pink-950/30 border-pink-500/40 text-pink-100' 
            : 'bg-purple-950/30 border-purple-500/40 text-purple-100'
        }`}>
          <div className={`p-1.5 rounded-lg shrink-0 ${
            signal.phase === 'GALE_PROTECTION'
              ? 'bg-amber-500/20 text-amber-300'
              : isPink 
              ? 'bg-pink-500/20 text-pink-300' 
              : 'bg-purple-500/20 text-purple-300'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold uppercase tracking-wide block text-white text-[11px]">
              {signal.phase === 'GALE_PROTECTION' 
                ? 'PROTEÇÃO GALE ATIVA (NÃO DESISTA DA ENTRADA):' 
                : `INSTRUÇÃO PADRÃO ${signal.patternMinutes} MINUTOS (SOMA DECIMAL):`}
            </span>
            <p className="text-[11px] mt-0.5 text-slate-300">
              {signal.phase === 'GALE_PROTECTION' ? (
                <span>
                  No Aviator da 82b, rodadas longas podem iniciar no segundo final e fechar no minuto seguinte. Mantenha a aposta agora no minuto <strong>:{String(signal.galeMinute).padStart(2, '0')}</strong> com auto-cashout no <strong>2.00x</strong>!
                </span>
              ) : isPink ? (
                <span>
                  Padrão de <strong>5 Minutos (Vela Rosa)</strong>. Entrada principal no minuto <strong>:{String(signal.targetMinute).padStart(2, '0')}</strong> com proteção no <strong>:{String(signal.galeMinute).padStart(2, '0')}</strong>. Busque 10.00x+ com 1ª mão no 2.00x.
                </span>
              ) : (
                <span>
                  Padrão de <strong>{signal.patternMinutes} Minutos (Vela Roxa)</strong>. Entrada principal no minuto <strong>:{String(signal.targetMinute).padStart(2, '0')}</strong> com proteção no <strong>:{String(signal.galeMinute).padStart(2, '0')}</strong>. Saída no <strong>2.00x</strong> garantida.
                </span>
              )}
            </p>
          </div>
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
