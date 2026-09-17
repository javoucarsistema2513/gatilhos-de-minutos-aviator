import React from 'react';
import { TriggerSignal } from '../types';
import {
  Target,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Sparkles,
} from 'lucide-react';

interface ActiveSignalCardProps {
  signal: TriggerSignal | null;
  currentSecond: number;
  currentMinute: number;
  onConfirmGreen: (signalId: string) => void;
}

export const ActiveSignalCard: React.FC<ActiveSignalCardProps> = ({
  signal,
  currentSecond,
  currentMinute,
  onConfirmGreen,
}) => {
  if (!signal) {
    return (
      <div
        id="no-signal-card"
        className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A]/70 p-6 text-center shadow-xl backdrop-blur-md"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
          <Clock className="w-6 h-6 animate-pulse text-rose-500" />
        </div>
        <h3 className="mt-3 text-base font-bold text-white">Analisando Padrões no Betão...</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          O radar estatístico está monitorando as velas recentes do Betão. Um novo gatilho com assertividade 98%+ será disparado a qualquer momento.
        </p>
      </div>
    );
  }

  const isNow = signal.targetMinute === currentMinute;

  let secondsRemaining = 0;
  if (isNow) {
    secondsRemaining = 60 - currentSecond;
  } else {
    const minDiff = (signal.targetMinute - currentMinute + 60) % 60;
    secondsRemaining = (minDiff - 1) * 60 + (60 - currentSecond);
  }

  const formatRemaining = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Status de Timing de Entrada
  const isPrepareWindow = !isNow && secondsRemaining <= 25 && secondsRemaining > 0;
  const isEnterNow = isNow;

  return (
    <div
      id="active-signal-card"
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-2xl backdrop-blur-md ${
        isEnterNow
          ? 'border-emerald-500 bg-gradient-to-b from-[#0F2E20] via-[#0A1D15] to-[#07130E] shadow-emerald-900/40 ring-2 ring-emerald-400'
          : isPrepareWindow
          ? 'border-amber-500 bg-gradient-to-b from-[#2E240D] via-[#1D1708] to-[#120E05] shadow-amber-900/40 ring-2 ring-amber-400 animate-pulse'
          : 'border-rose-500/30 bg-gradient-to-b from-[#1E1122] via-[#111322] to-[#0B0F19]'
      } p-4 sm:p-5`}
    >
      {/* Top Banner com Semáforo de Entrada */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider ${
              isEnterNow
                ? 'bg-emerald-500 text-slate-950 animate-bounce'
                : isPrepareWindow
                ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {isEnterNow
              ? '🟢 ENTRAR AGORA NO BETÃO!'
              : isPrepareWindow
              ? '🟡 PREPARAR APOSTA NO BETÃO!'
              : '⚪ GATILHO SNIPER DETECTADO'}
          </span>

          <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded-lg">
            {signal.strategyName}
          </span>

          {/* Badge de Vela Alvo (Roxa vs Rosa) - Sem Inversão */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl shadow-xs border ${
              signal.expectedTier === 'pink'
                ? 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-500/70 animate-pulse'
                : 'bg-purple-950/90 text-purple-300 border-purple-500/70'
            }`}
          >
            {signal.expectedTier === 'pink' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>🌸 ALVO: VELA ROSA (10x+)</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>💜 ALVO: VELA ROXA (2x a 9.99x)</span>
              </>
            )}
          </span>
        </div>

        {/* Nível de Confiança */}
        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-xl shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{signal.confidenceTier}</span>
        </div>
      </div>

      {/* Caixa de Alerta de Timing em Destaque */}
      {isEnterNow ? (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <strong className="text-white block font-extrabold text-sm">
                RODADA ABERTA NO BETÃO: MINUTO {signal.targetMinuteFormatted}
              </strong>
              <span>
                Faça sua aposta agora! Saída de segurança em{' '}
                <strong className="text-white underline">{signal.recommendedSafeExit.toFixed(2)}x</strong> com Auto Cashout.
              </span>
            </div>
          </div>
        </div>
      ) : isPrepareWindow ? (
        <div className="mt-3 p-3 rounded-xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
            <div>
              <strong className="text-white block font-extrabold text-sm">
                PREPARE-SE NO BETÃO: Faltam {secondsRemaining}s!
              </strong>
              <span>
                Abra a aba do Aviator no Betão, digite o valor e confira o Auto Cashout ligado em{' '}
                <strong>{signal.recommendedSafeExit.toFixed(2)}x</strong>.
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Grid: Target Minute & Probability Display */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Minuto da Entrada */}
        <div className="sm:col-span-4 flex flex-col items-center sm:items-start justify-center p-3 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-rose-400" />
            Minuto da Entrada
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono drop-shadow">
              {signal.targetMinuteFormatted}
            </span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              ({signal.targetTimeFormatted})
            </span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400">
            {isEnterNow ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Válido agora no Betão
              </span>
            ) : (
              `Entrar aos :00s do minuto ${signal.targetMinuteFormatted}`
            )}
          </span>
        </div>

        {/* Probabilidade de Acerto Sniper */}
        <div className="sm:col-span-5 flex flex-col justify-center p-3 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Probabilidade de Acerto
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {signal.probability}%
            </span>
          </div>

          <div className="mt-2.5 h-3 w-full rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-700 shadow-sm shadow-emerald-500/50"
              style={{ width: `${signal.probability}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Filtro de Confluência</span>
            <span className="font-bold text-emerald-400">✓ Calibrado Betão</span>
          </div>
        </div>

        {/* Contagem Regressiva */}
        <div className="sm:col-span-3 flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {isEnterNow ? 'Tempo Restante' : 'Entrada em'}
          </span>
          <span
            className={`mt-1 text-2xl sm:text-3xl font-black font-mono tracking-wider ${
              isEnterNow
                ? 'text-emerald-400 animate-pulse'
                : isPrepareWindow
                ? 'text-amber-400 animate-bounce'
                : 'text-white'
            }`}
          >
            {formatRemaining(secondsRemaining)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">
            {isEnterNow ? 'Operando no minuto' : 'Aguarde o alerta'}
          </span>
        </div>
      </div>

      {/* Janela de Execução & Passo a Passo Exato */}
      <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Janela de Entrada no Minuto: <strong className="text-sky-400 font-mono">{signal.entryWindowSeconds}</strong>
          </span>
          <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
            Até 2 Tentativas (Gale 1)
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          {signal.galeAdvice}
        </p>
      </div>

      {/* Recomendações de Saída */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Saída 1: Proteção com 98% de Acerto */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-sky-500/40">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
              1ª Aposta: Saída Segura (Auto-Cashout)
            </span>
            <span className="text-lg font-black text-sky-400 font-mono">
              {signal.recommendedSafeExit.toFixed(2)}x
            </span>
          </div>
          <span className="text-[10px] font-black text-sky-300 bg-sky-950 border border-sky-500/50 px-2 py-1 rounded-md">
            PROTEÇÃO 2.00x+
          </span>
        </div>

        {/* Saída 2: Alvo Principal (Vela Rosa ou Roxa) */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border ${
            signal.expectedTier === 'pink' ? 'border-fuchsia-500/50' : 'border-purple-500/50'
          }`}
        >
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
              2ª Aposta: {signal.expectedTier === 'pink' ? 'Alvo Vela Rosa' : 'Alvo Vela Roxa'}
            </span>
            <span
              className={`text-lg font-black font-mono ${
                signal.expectedTier === 'pink' ? 'text-fuchsia-400' : 'text-purple-400'
              }`}
            >
              {signal.recommendedTarget.toFixed(2)}x+
            </span>
          </div>
          <span
            className={`text-[10px] font-black px-2 py-1 rounded-md border ${
              signal.expectedTier === 'pink'
                ? 'text-fuchsia-300 bg-fuchsia-950/80 border-fuchsia-500/50'
                : 'text-purple-300 bg-purple-950/80 border-purple-500/50'
            }`}
          >
            {signal.expectedTier === 'pink' ? 'VELA ROSA 🌸' : 'VELA ROXA 💜'}
          </span>
        </div>
      </div>

      {/* Description & Confirm Green */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <p className="text-xs text-slate-300 flex items-center gap-1.5 text-center sm:text-left">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:inline" />
          <span>{signal.description}</span>
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="hear-signal-voice-btn"
            onClick={() => {
              import('../utils/audio').then(({ soundEffects }) => {
                soundEffects.unlock();
                soundEffects.speakVoice(
                  `Entrada no minuto ${signal.targetMinuteFormatted} no Betão. Saída segura em ${signal.recommendedSafeExit.toFixed(2)}x com 98% de acerto.`
                );
              });
            }}
            className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 px-3 py-2.5 text-xs font-bold transition active:scale-95"
            title="Ouvir instrução por voz"
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" />
            <span>Ouvir Alerta</span>
          </button>

          <button
            id="confirm-green-button"
            onClick={() => onConfirmGreen(signal.id)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-4 py-2.5 text-xs font-black shadow-lg shadow-emerald-700/40 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Validar Green</span>
          </button>
        </div>
      </div>
    </div>
  );
};
