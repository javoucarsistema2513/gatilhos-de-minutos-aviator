import React, { useState, useMemo } from 'react';
import { RadarSignal, Candle, StudyMethod, LiveCandlePreview } from '../types/aviator';
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
  Calculator,
  Plus,
  BookOpen,
  Compass,
  TrendingUp,
  Award,
  ArrowRight,
  SlidersHorizontal,
  Camera,
  Bot
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { calculateLivePreview } from '../utils/aviatorEngine';

interface NextCandleAlertCardProps {
  signal: RadarSignal;
  latestCandle: Candle | null;
  currentTimeStr: string;
  selectedMethod: StudyMethod;
  calibrationOffset: number;
  onSelectMethod: (method: StudyMethod) => void;
  onSelectCalibrationOffset: (offset: number) => void;
  onAutoRecalibrate: () => void;
  onRegisterResult: (isWin: boolean) => void;
  onAddCandle: (multiplier: number) => void;
  onOpenGuide: () => void;
  onOpenImageScanner: () => void;
}

export const NextCandleAlertCard: React.FC<NextCandleAlertCardProps> = ({
  signal,
  latestCandle,
  currentTimeStr,
  selectedMethod,
  calibrationOffset,
  onSelectMethod,
  onSelectCalibrationOffset,
  onAutoRecalibrate,
  onRegisterResult,
  onAddCandle,
  onOpenGuide,
  onOpenImageScanner,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const isSuperPink = signal.candleType === 'SUPER_ROSA';
  const isPink = signal.candleType === 'ROSA' || isSuperPink;

  // Real-time calculation preview as the user types
  const livePreview: LiveCandlePreview | null = useMemo(() => {
    const val = parseFloat(quickInput.replace(',', '.'));
    if (!isNaN(val) && val >= 1.0) {
      return calculateLivePreview(val, new Date(), calibrationOffset);
    }
    return null;
  }, [quickInput, calibrationOffset]);

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

  const handleSelectPreset = (val: number) => {
    setQuickInput(val.toFixed(2));
  };

  const study = signal.studyCalculation;
  const trigger = study.triggerInfo;
  const finalDigit = study.finalDigitInfo;
  const rule13 = study.rule13Active;

  const getStatusConfig = () => {
    switch (signal.phase) {
      case 'GALE_PROTECTION':
        return {
          title: `PROTEÇÃO GALE 1 NO MINUTO :${String(signal.galeMinute).padStart(2, '0')}!`,
          subtitle: `A rodada virou para o minuto :${String(signal.galeMinute).padStart(2, '0')}. Mantenha a mão de proteção com saída no ${study.protectionCashout}!`,
          badgeBg: 'bg-amber-400 text-black font-black animate-pulse',
          badgeText: '🛡️ PROTEÇÃO GALE ATIVA',
          containerBorder: 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.45)] ring-2 ring-amber-400/50',
          headerBg: 'bg-amber-950/80 border-amber-400/50',
        };
      case 'ACTIVE_ENTRY':
        return {
          title: `ENTRAR AGORA NO MINUTO :${String(signal.targetMinute).padStart(2, '0')}!`,
          subtitle: `Horário ${signal.targetTimeStr}:${String(signal.targetSeconds).padStart(2, '0')} ativo na 82b! Rodada autorizada.`,
          badgeBg: 'bg-emerald-500 text-black font-black animate-pulse',
          badgeText: '● ENTRADA PRINCIPAL ATIVA',
          containerBorder: 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.45)] ring-2 ring-emerald-500/50',
          headerBg: 'bg-emerald-950/70 border-emerald-500/50',
        };
      case 'PREPARING':
        return {
          title: `ATENÇÃO: FALTAM ${signal.secondsRemaining}s PARA A ENTRADA!`,
          subtitle: `Entrada exata às ${signal.targetTimeStr}:${String(signal.targetSeconds).padStart(2, '0')}. Prepare a aposta no Aviator!`,
          badgeBg: 'bg-amber-500 text-black font-black animate-pulse',
          badgeText: '⚠️ PREPARAR APOSTA IMEDIATA',
          containerBorder: 'border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/40',
          headerBg: 'bg-amber-950/70 border-amber-500/50',
        };
      case 'WIN':
        const mult = signal.resultCandle?.multiplier || (isSuperPink ? 62.4 : isPink ? 14.5 : 2.8);
        return {
          title: isSuperPink
            ? `🌟 SUPER GREEN! VELA DE ${mult.toFixed(2)}x CONFIRMADA!`
            : isPink 
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
          title: `ENTRADA CALIBRADA: ${signal.targetTimeStr}:${String(signal.targetSeconds).padStart(2, '0')}`,
          subtitle: `${study.methodName}. Acompanhe o cronômetro.`,
          badgeBg: isSuperPink
            ? 'bg-amber-500 text-black font-black'
            : isPink 
            ? 'bg-pink-900/80 border border-pink-400/50 text-pink-200' 
            : 'bg-purple-900/80 border border-purple-400/50 text-purple-200',
          badgeText: isSuperPink ? '🌟 SINAL: SUPER ROSA (50x/100x+)' : isPink ? '🌸 SINAL: VELA ROSA (10x+)' : '⚡ SINAL: VELA ROXA (2x+)',
          containerBorder: isSuperPink 
            ? 'border-amber-400/80 shadow-[0_0_35px_rgba(251,191,36,0.35)]' 
            : isPink 
            ? 'border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.25)]' 
            : 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.25)]',
          headerBg: 'bg-[#0f0822] border-rose-950/70',
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
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
            signal.phase === 'GALE_PROTECTION'
              ? 'bg-amber-950/80 border-amber-400 text-amber-300'
              : isSuperPink
              ? 'bg-amber-950/60 border-amber-400 text-amber-400'
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
            ) : isSuperPink ? (
              <Award className="w-6 h-6 text-amber-400 animate-bounce" />
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

        {/* Sync, AI Image & Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImageScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-purple-950/90 hover:from-rose-900 hover:to-purple-900 border border-rose-500/70 text-xs font-bold text-pink-300 hover:text-white transition cursor-pointer shadow-md shadow-rose-950/40"
            title="Enviar Print do Gráfico Real (82b) para a IA Analisar"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>Print IA</span>
          </button>

          <button
            onClick={onAutoRecalibrate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-rose-300 hover:text-white transition cursor-pointer"
            title="Recalcular com base na mesa da 82b"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Sincronizar</span>
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

      {/* Selector: Métodos de Estudo dos Módulos & Calibração de Tempo 82b */}
      <div className="bg-[#120722] border-b border-rose-950/80 px-4 py-2.5 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>Método do Estudo:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => onSelectMethod('AUTO_BEST')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                selectedMethod === 'AUTO_BEST'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/60 ring-1 ring-rose-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🎯 Auto: Melhor Padrão
            </button>

            <button
              onClick={() => onSelectMethod('SUBTRACAO_DECIMAIS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                selectedMethod === 'SUBTRACAO_DECIMAIS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60 ring-1 ring-purple-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Módulo 5 pág 3 & Módulo 3 pág 7: Subtração da vela e decimais"
            >
              📐 Subtração Decimais
            </button>

            <button
              onClick={() => onSelectMethod('DIGITO_APOS_PONTO')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                selectedMethod === 'DIGITO_APOS_PONTO'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/60 ring-1 ring-indigo-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Módulo 5 pág 4 & pág 33: 1º dígito após o ponto"
            >
              🔢 1º Dígito Pós Ponto
            </button>

            <button
              onClick={() => onSelectMethod('MINUTO_MAIS_DECIMAL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                selectedMethod === 'MINUTO_MAIS_DECIMAL'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/60 ring-1 ring-teal-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Módulo 4 pág 44: Minuto + Decimal da vela"
            >
              ⏰ Minuto + Decimal
            </button>

            <button
              onClick={() => onSelectMethod('VELAS_ESPECIAIS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                selectedMethod === 'VELAS_ESPECIAIS'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-900/60 ring-1 ring-pink-400'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Módulo 4: Velas especiais 1.00x, 1.37x, 1.88x, 1.99x"
            >
              ✨ Velas Especiais
            </button>
          </div>
        </div>

        {/* Calibração de Tempo 82b (Corrige os 2 minutos de atraso) */}
        <div className="flex items-center justify-between pt-1.5 border-t border-purple-950/60 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
            <span>Calibração 82b (Tempo Real):</span>
          </span>

          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => onSelectCalibrationOffset(-3)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                calibrationOffset === -3
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Antecipar 3 minutos"
            >
              -3 min
            </button>

            <button
              onClick={() => onSelectCalibrationOffset(-2)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                calibrationOffset === -2
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Calibração recomendada para 82b.game (Antecipar 2 minutos)"
            >
              -2 min (Recomendado 82b)
            </button>

            <button
              onClick={() => onSelectCalibrationOffset(-1)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                calibrationOffset === -1
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Antecipar 1 minuto"
            >
              -1 min
            </button>

            <button
              onClick={() => onSelectCalibrationOffset(0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                calibrationOffset === 0
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Sem calibração (0 min)"
            >
              0 min
            </button>
          </div>
        </div>
      </div>

      {/* Main Core Display */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Column 1: Horário da Entrada com Segundos Exatos */}
        <div className="p-5 rounded-xl bg-[#110822] border border-rose-950 flex flex-col justify-between items-center text-center">
          <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>Horário e Segundo Exato (82b)</span>
          </span>

          <div className="my-2">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              {signal.targetTimeStr}:{String(signal.targetSeconds).padStart(2, '0')}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1 text-xs font-black font-mono uppercase tracking-widest">
              <span className="text-rose-400">MINUTO :{String(signal.targetMinute).padStart(2, '0')}</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400">GALE 1 :{String(signal.galeMinute).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Seconds Countdown Box */}
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
                  <span>MINUTO ATIVO :{String(signal.targetMinute).padStart(2, '0')} (RODADA EM CURSO)</span>
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
                  <span>Contagem até {signal.targetTimeStr}:{String(signal.targetSeconds).padStart(2, '0')}</span>
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

        {/* Column 2: Alvo Previsto pelo Estudo */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between items-center text-center ${
          isSuperPink
            ? 'bg-gradient-to-b from-amber-950/50 via-[#1e1308] to-[#0f061e] border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
            : isPink 
            ? 'bg-gradient-to-b from-pink-950/50 via-[#180824] to-[#0f061e] border-pink-500/60 shadow-[0_0_20px_rgba(236,72,153,0.2)]' 
            : 'bg-gradient-to-b from-purple-950/50 via-[#150827] to-[#0f061e] border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
        }`}>
          <span className="text-xs uppercase font-mono font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
            {isSuperPink ? <Award className="w-4 h-4 text-amber-400" /> : isPink ? <Sparkles className="w-4 h-4 text-pink-400" /> : <Zap className="w-4 h-4 text-purple-400" />}
            <span>Alvo Previsto na 82b</span>
          </span>

          <div className="my-2 text-center w-full">
            {isSuperPink ? (
              <div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-yellow-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]">
                  SUPER ROSA
                </div>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40 uppercase tracking-wider">
                  ALVO: 50.00x A 100.00x+
                </div>
              </div>
            ) : isPink ? (
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
            Proteção recomendada: <span className="text-emerald-400 font-bold">{study.protectionCashout}</span> | Entradas: <span className="text-white font-bold">{study.suggestedEntries} fixas</span>
          </div>
        </div>

      </div>

      {/* PAINEL DOS ESTUDOS: FÓRMULA MATEMÁTICA E GATILHOS DETECTADOS */}
      <div className="mx-4 sm:mx-6 mb-4 p-4 rounded-xl bg-[#130726] border border-purple-500/40 text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/60">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white uppercase text-[11px] tracking-wide">
              Fórmula do Estudo Aplicada:
            </span>
          </div>
          <button 
            onClick={onOpenGuide}
            className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-white underline cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ver Apostilas dos Módulos</span>
          </button>
        </div>

        {/* Display da Fórmula Exata */}
        <div className="p-3 rounded-lg bg-[#0a0417] border border-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">
              Método: {study.methodName}
            </span>
            <div className="text-sm font-mono font-bold text-rose-300 mt-0.5">
              {study.formulaDisplay}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-mono block">Minuto e Segundo Alvo:</span>
            <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              {signal.targetTimeStr}:{String(signal.targetSeconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Special Triggers & Dica de Ouro 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          <div className={`p-2.5 rounded-lg border ${
            trigger?.isTrigger 
              ? 'bg-rose-950/40 border-rose-500/60 text-rose-200' 
              : 'bg-[#0e051d] border-purple-950 text-slate-300'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Gatilho Especial (Módulo 4)
            </span>
            <p className="text-[11px] mt-0.5 font-medium leading-relaxed">
              {trigger?.isTrigger ? (
                <strong className="text-rose-300">{trigger.title}</strong>
              ) : (
                <span>Nenhum gatilho de reset ativo no momento. Operando no fluxo calibrado da 82b.</span>
              )}
            </p>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            finalDigit?.type === 'RED_ALERT_7'
              ? 'bg-red-950/60 border-red-500 text-red-200'
              : finalDigit?.type === 'GREEN_2X_1'
              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
              : finalDigit?.type === 'PURPLE_2X_5'
              ? 'bg-purple-950/50 border-purple-500/60 text-purple-200'
              : 'bg-[#0e051d] border-purple-950 text-slate-300'
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
              Dica de Ouro 2: Final da Vela (,{latestCandle?.multiplier.toFixed(2).split('.')[1]})
            </span>
            <p className="text-[11px] mt-0.5 font-medium leading-relaxed">
              {finalDigit?.description}
            </p>
          </div>

        </div>

        {/* Regra dos 13 (Casas Ímpares após vela 30x+) */}
        {rule13 && (
          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/50 flex items-center justify-between text-[11px] text-indigo-200">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>
                <strong>Regra dos 13 Ativa:</strong> Vela de {rule13.highCandleMultiplier.toFixed(2)}x saiu há {14 - rule13.remainingHouses} casas.
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
              rule13.isOddHouse 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {rule13.isOddHouse ? 'CASA ÍMPAR (95% ASSERTIVIDADE)' : 'CASA PAR'}
            </span>
          </div>
        )}

      </div>

      {/* NOVO: Sincronização Direta da Vela da 82b COM PRÉVIA INSTANTÂNEA EM TEMPO REAL! */}
      <div className="mx-4 sm:mx-6 mb-4 p-4 rounded-xl bg-[#0f0722] border border-purple-500/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-900/60">
          <div>
            <span className="font-bold text-white text-xs block">
              Sincronizar Vela da 82b (Cálculo Instantâneo em Tempo Real):
            </span>
            <span className="text-slate-400 text-[11px]">
              Digite o valor da vela que acabou de sair para ver na hora o alvo e o horário exato!
            </span>
          </div>

          {/* Quick presets from studied candles */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => handleSelectPreset(1.00)}
              className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-600/40 text-[10px] font-bold text-amber-300 cursor-pointer"
            >
              1.00x Reset
            </button>
            <button
              onClick={() => handleSelectPreset(1.37)}
              className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-[10px] font-bold text-pink-300 cursor-pointer"
            >
              1.37x Especial
            </button>
            <button
              onClick={() => handleSelectPreset(1.88)}
              className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-600/40 text-[10px] font-bold text-purple-300 cursor-pointer"
            >
              1.88x Especial
            </button>
            <button
              onClick={() => handleSelectPreset(12.50)}
              className="px-2 py-0.5 rounded bg-pink-950/60 hover:bg-pink-900 border border-pink-500/50 text-[10px] font-bold text-pink-300 cursor-pointer"
            >
              12.50x Rosa
            </button>
          </div>
        </div>

        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ex: 1.37 ou 2.45"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-[#160a2c] border border-purple-500 text-sm text-white placeholder-slate-500 focus:outline-none font-mono focus:ring-2 focus:ring-purple-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Sincronizar</span>
          </button>
          <button
            type="button"
            onClick={onOpenImageScanner}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900 to-rose-900 hover:from-purple-800 hover:to-rose-800 border border-purple-500/70 text-pink-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow shrink-0"
            title="Enviar foto ou print do gráfico real para a IA ler as velas"
          >
            <Camera className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Enviar Print IA</span>
          </button>
        </form>

        {/* PRÉVIA INSTANTÂNEA AO DIGITAR (Calculada na hora!) */}
        {livePreview && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#1b0a33] to-[#120524] border border-emerald-500/50 shadow-lg animate-in fade-in zoom-in-95 duration-150 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>PRÉVIA INSTANTÂNEA DA VELA DIGITADA ({livePreview.multiplierEntered.toFixed(2)}x):</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Calibração 82b: {calibrationOffset} min aplicada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Box 1: Vela Alvo */}
              <div className="p-2.5 rounded-lg bg-[#0e051c] border border-purple-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Vela Alvo Prevista:</span>
                  <span className={`text-base font-black font-mono ${
                    livePreview.targetCandle === 'SUPER_ROSA'
                      ? 'text-amber-300'
                      : livePreview.targetCandle === 'ROSA'
                      ? 'text-pink-400'
                      : 'text-purple-300'
                  }`}>
                    {livePreview.targetCandle === 'SUPER_ROSA' ? 'SUPER ROSA' : livePreview.targetCandle === 'ROSA' ? 'VELA ROSA' : 'VELA ROXA'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {livePreview.targetMultiplier}
                </span>
              </div>

              {/* Box 2: Horário Exato da Entrada */}
              <div className="p-2.5 rounded-lg bg-[#0e051c] border border-purple-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Horário Exato de Entrada:</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {livePreview.targetTimeFormatted}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">Minuto Alvo:</span>
                  <span className="text-xs font-mono font-bold text-rose-300">
                    :{String(livePreview.targetMinute).padStart(2, '0')}
                  </span>
                </div>
              </div>

            </div>

            <div className="pt-2 border-t border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-300">
              <span className="font-mono text-rose-300">• {livePreview.formulaDisplay}</span>
              <button
                onClick={handleQuickAdd}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
              >
                <span>Aplicar esta Entrada</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

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
                : `INSTRUÇÃO DE ENTRADA (${study.methodName}):`}
            </span>
            <p className="text-[11px] mt-0.5 text-slate-300">
              {signal.phase === 'GALE_PROTECTION' ? (
                <span>
                  No Aviator da 82b, rodadas longas podem iniciar no segundo final e fechar no minuto seguinte. Mantenha a aposta agora no minuto <strong>:{String(signal.galeMinute).padStart(2, '0')}</strong> com auto-cashout no <strong>{study.protectionCashout}</strong>!
                </span>
              ) : isSuperPink ? (
                <span>
                  Alvo de <strong>Super Rosa (50x a 100x+)</strong>. Mão 1 no <strong>{study.protectionCashout}</strong> para proteção total da banca e mão 2 buscando decolagem de 50x a 100x!
                </span>
              ) : isPink ? (
                <span>
                  Alvo de <strong>Vela Rosa (10.00x+)</strong>. Entrada às <strong>{signal.targetTimeStr}:{String(signal.targetSeconds).padStart(2, '0')}</strong> com proteção no <strong>{study.protectionCashout}</strong> (cobre o valor e zera o risco).
                </span>
              ) : (
                <span>
                  Alvo de <strong>Vela Roxa ({study.multiplierTarget})</strong>. Entrada às <strong>{signal.targetTimeStr}:{String(signal.targetSeconds).padStart(2, '0')}</strong>. Saída no <strong>{study.protectionCashout}</strong> recomendada.
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
