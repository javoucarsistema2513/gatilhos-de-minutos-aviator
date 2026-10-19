import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Copy, 
  Check, 
  Bell, 
  BellOff, 
  RefreshCw, 
  Bot, 
  Flame, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  Filter,
  Layers,
  Award,
  Zap,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Candle, FuturePinkSignal, ForecastHorizon, FuturePinkCategory, AIForecastAudit } from '../types/aviator';
import { 
  generateFuturePinkForecast, 
  updateFutureSignalsStatus, 
  calculateForecastSummary, 
  formatSignalsForSharing 
} from '../utils/futurePredictionsEngine';
import { soundFx } from '../utils/audio';

interface FutureCandlesRadarProps {
  candles: Candle[];
  onSelectSignalForEntry?: (signal: FuturePinkSignal) => void;
}

export const FutureCandlesRadar: React.FC<FutureCandlesRadarProps> = ({ candles, onSelectSignalForEntry }) => {
  const [horizon, setHorizon] = useState<ForecastHorizon>('24H');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | '100X_PLUS' | '500X_PLUS' | 'SPECIAL'>('ALL');
  const [alarmIds, setAlarmIds] = useState<Set<string>>(() => new Set());
  const [signals, setSignals] = useState<FuturePinkSignal[]>(() => generateFuturePinkForecast(candles, new Date()));
  const [copied, setCopied] = useState(false);
  
  // AI Audit state
  const [isAuditingAI, setIsAuditingAI] = useState(false);
  const [aiAudit, setAiAudit] = useState<AIForecastAudit | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Recalibrate forecasts whenever candles or manual refresh happens
  const handleRecalibrate = useCallback(() => {
    soundFx.playRadarSweep();
    const newForecast = generateFuturePinkForecast(candles, new Date(), alarmIds);
    setSignals(newForecast);
  }, [candles, alarmIds]);

  // Update countdowns every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setSignals((prev) => updateFutureSignalsStatus(prev, new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for upcoming alarm triggers (< 3 minutes and < 1 minute)
  useEffect(() => {
    signals.forEach((sig) => {
      if (sig.alarmActive && sig.status === 'JANELA_PROXIMA' && sig.minutesRemaining <= 3) {
        // Play notification alert chime
        soundFx.playAlertSignal();
      }
    });
  }, [signals]);

  // Toggle individual alarm
  const handleToggleAlarm = (id: string) => {
    setAlarmIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        soundFx.playClick();
      }
      return next;
    });

    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, alarmActive: !s.alarmActive } : s))
    );
  };

  // Toggle all alarms in current horizon
  const handleToggleAllAlarms = () => {
    const visibleIds = filteredSignals.map((s) => s.id);
    const allActive = visibleIds.every((id) => alarmIds.has(id));

    setAlarmIds((prev) => {
      const next = new Set(prev);
      if (allActive) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
        soundFx.playClick();
      }
      return next;
    });

    setSignals((prev) =>
      prev.map((s) =>
        visibleIds.includes(s.id) ? { ...s, alarmActive: !allActive } : s
      )
    );
  };

  // Copy formatted signals
  const handleCopySignals = async () => {
    const text = formatSignalsForSharing(signals, horizon);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      soundFx.playPinkWin();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Request AI Audit with Gemini
  const handleRunAIAudit = async () => {
    setIsAuditingAI(true);
    setAuditError(null);
    setIsAuditOpen(true);
    soundFx.playRadarSweep();

    try {
      const res = await fetch('/api/ai/forecast-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horizon,
          scheduledSignals: signals,
          latestCandles: candles,
        }),
      });

      if (res.status === 404) {
        setAuditError('Serviço de IA não encontrado no servidor (HTTP 404). As funções serverless foram preparadas em /api.');
        return;
      }

      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        setAuditError('Serviço de IA temporariamente indisponível. Tente novamente.');
        return;
      }

      if (data?.success && data?.audit) {
        setAiAudit(data.audit);
        soundFx.playPinkWin();
      } else {
        setAuditError(data?.error || 'Não foi possível concluir a auditoria da IA no momento.');
      }
    } catch (err: unknown) {
      setAuditError('Falha na conexão com o servidor de IA.');
    } finally {
      setIsAuditingAI(false);
    }
  };

  // Filter signals based on selected horizon and category
  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      // Horizon filter
      if (horizon === '7H' && s.horizon !== '7H') return false;
      if (horizon === '12H' && s.horizon === '24H') return false; // 12H includes 7H and 12H

      // Category filter
      if (categoryFilter === '100X_PLUS' && s.minMultiplier < 100) return false;
      if (categoryFilter === '500X_PLUS' && s.category !== 'ULTRA_ROSA_500X') return false;
      if (categoryFilter === 'SPECIAL' && s.category !== 'ROSA_ESPECIAL') return false;

      return true;
    });
  }, [signals, horizon, categoryFilter]);

  const summary = useMemo(() => calculateForecastSummary(signals), [signals]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-pink-950/40 border border-pink-500/30 p-5 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500/20 to-amber-500/20 text-pink-300 border border-pink-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Cronograma de Longo Alcance • 82B Spribe
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Matriz Ativa
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Previsão de Velas Futuras
              <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
                (7h • 12h • 24h)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Mapeamento algorítmico de <strong className="text-pink-300 font-semibold">Rosas Especiais</strong> e <strong className="text-amber-300 font-semibold">Super Rosas 100x a 1000x+</strong> com horários exatos, minutos de entrada e proteção na 82b.
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2 sm:self-end lg:self-center">
            <button
              onClick={handleRunAIAudit}
              disabled={isAuditingAI}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
            >
              {isAuditingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Auditoria IA...
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  Auditar com IA (Gemini)
                </>
              )}
            </button>

            <button
              onClick={handleCopySignals}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer"
              title="Copiar lista para WhatsApp ou Telegram"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Sinais</span>
                </>
              )}
            </button>

            <button
              onClick={handleRecalibrate}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Recalibrar com horário atual"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Summary Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-amber-300/80 font-medium">
              <span>Super Rosas 100x+</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-300">{summary.superRosas100x}</span>
              <span className="text-[11px] text-slate-400 font-mono">janelas</span>
            </div>
            <span className="text-[10px] text-amber-400/70 mt-0.5">Alvo 100x a 350x</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-purple-300/80 font-medium">
              <span>Ultra 500x - 1000x+</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-300">{summary.ultraRosas500x}</span>
              <span className="text-[11px] text-slate-400 font-mono">raras</span>
            </div>
            <span className="text-[10px] text-purple-400/70 mt-0.5">Jackpot Spribe</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-pink-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-pink-300/80 font-medium">
              <span>Rosas Especiais</span>
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-pink-300">{summary.rosasEspeciais}</span>
              <span className="text-[11px] text-slate-400 font-mono">ciclos</span>
            </div>
            <span className="text-[10px] text-pink-400/70 mt-0.5">Alvo 10x a 50x</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-emerald-300/80 font-medium">
              <span>Próxima Janela</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-lg font-black text-emerald-300 truncate block">
                {summary.nextUpcoming ? summary.nextUpcoming.targetTimeFormatted.slice(0, 5) : '--:--'}
              </span>
              <span className="text-[11px] font-mono text-emerald-400/80">
                {summary.nextUpcoming?.timeRemainingStr || 'Aguardando'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 truncate">
              {summary.nextUpcoming?.targetMultiplierLabel || 'Calculando...'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Forecast Audit Drawer / Modal */}
      {isAuditOpen && (
        <div className="rounded-2xl bg-gradient-to-b from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/40 p-5 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
                <Bot className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Auditoria de Inteligência Artificial • Super Rosas 100x+
                  <span className="text-xs font-normal text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Gemini 3.8
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cruzamento dos 5 Módulos e do fluxo diário da plataforma 82b
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAuditOpen(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {isAuditingAI && (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-purple-300 animate-pulse">
                Auditor de IA processando probabilidades para as próximas {horizon}...
              </p>
            </div>
          )}

          {auditError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
              {auditError}
            </div>
          )}

          {aiAudit && !isAuditingAI && (
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-2.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Os 3 Horários de Ouro para 100x+ Identificados
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiAudit.goldenHours.map((gh, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {gh.timeRange}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400">
                            {gh.assertividade}% assertivo
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white mt-1.5">
                          Alvo: <span className="text-pink-300">{gh.expectedTarget}</span>
                        </p>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {gh.motivo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Advice & Warning */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Recomendação de Alavancagem
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiAudit.generalAdvice}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Proteção de Capital Obrigatória
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiAudit.riskWarning}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Horizon & Category Selectors */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        {/* Horizon Tabs (7H, 12H, 24H, ALL) */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setHorizon('7H')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              horizon === '7H'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ 7 Horas
          </button>
          <button
            onClick={() => setHorizon('12H')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              horizon === '12H'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 12 Horas
          </button>
          <button
            onClick={() => setHorizon('24H')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              horizon === '24H'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👑 24 Horas
          </button>
          <button
            onClick={() => setHorizon('ALL')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              horizon === 'ALL'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas
          </button>
        </div>

        {/* Multiplier / Category Filters & Alarm All */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Filtrar:</span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setCategoryFilter('100X_PLUS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                categoryFilter === '100X_PLUS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-amber-400/70 hover:text-amber-300'
              }`}
            >
              <Award className="w-3 h-3 text-amber-400" />
              100x+
            </button>
            <button
              onClick={() => setCategoryFilter('500X_PLUS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                categoryFilter === '500X_PLUS'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-purple-400/70 hover:text-purple-300'
              }`}
            >
              <Zap className="w-3 h-3 text-purple-400" />
              500x - 1000x+
            </button>
            <button
              onClick={() => setCategoryFilter('SPECIAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                categoryFilter === 'SPECIAL'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-pink-400/70 hover:text-pink-300'
              }`}
            >
              10x - 50x
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Toggle All Alarms */}
          <button
            onClick={handleToggleAllAlarms}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Ativar ou desativar alarmes para a lista visível"
          >
            <Bell className="w-3 h-3 text-amber-400" />
            <span>Alternar Alarmes</span>
          </button>
        </div>
      </div>

      {/* Grid of Future Pink Candles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSignals.map((sig, idx) => {
          const is100x = sig.minMultiplier >= 100;
          const is500x = sig.category === 'ULTRA_ROSA_500X';
          const isImminent = sig.status === 'JANELA_PROXIMA' || sig.status === 'EM_ANDAMENTO';

          return (
            <div
              key={sig.id}
              className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${
                is500x
                  ? 'bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-950 border border-purple-500/50 shadow-lg shadow-purple-900/20 hover:border-purple-400'
                  : is100x
                  ? 'bg-gradient-to-br from-slate-900/90 via-amber-950/30 to-slate-950 border border-amber-500/40 shadow-lg shadow-amber-900/20 hover:border-amber-400'
                  : 'bg-slate-900/70 border border-pink-500/25 hover:border-pink-500/40'
              } ${isImminent ? 'ring-2 ring-emerald-500/60' : ''}`}
            >
              {/* Corner Glow */}
              <div 
                className={`absolute -right-12 -top-12 w-28 h-28 rounded-full blur-2xl pointer-events-none ${
                  is500x ? 'bg-purple-500/20' : is100x ? 'bg-amber-500/20' : 'bg-pink-500/15'
                }`} 
              />

              <div>
                {/* Header of Card: Horizon badge, Time, Countdown, Alarm */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-mono text-base font-black px-2.5 py-1 rounded-lg border ${
                        is500x
                          ? 'bg-purple-950/60 text-purple-200 border-purple-500/40'
                          : is100x
                          ? 'bg-amber-950/60 text-amber-200 border-amber-500/40'
                          : 'bg-pink-950/60 text-pink-200 border-pink-500/30'
                      }`}
                    >
                      {sig.targetTimeFormatted}
                    </span>

                    <span 
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isImminent
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {sig.timeRemainingStr}
                    </span>
                  </div>

                  {/* Alarm Toggle Button */}
                  <button
                    onClick={() => handleToggleAlarm(sig.id)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      sig.alarmActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                    title={sig.alarmActive ? 'Alarme ativado' : 'Ativar alarme'}
                  >
                    {sig.alarmActive ? (
                      <Bell className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Multiplier & Category Banner */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span 
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        is500x
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : is100x
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      }`}
                    >
                      {sig.categoryLabel}
                    </span>
                    <div className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                      {is500x ? (
                        <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                          {sig.targetMultiplierLabel}
                        </span>
                      ) : is100x ? (
                        <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-pink-400 bg-clip-text text-transparent">
                          {sig.targetMultiplierLabel}
                        </span>
                      ) : (
                        <span className="text-pink-300">
                          {sig.targetMultiplierLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confidence Gauge */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Assertividade</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {sig.confidence}%
                    </span>
                  </div>
                </div>

                {/* Entry Window & Strategy */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                    <Clock className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span>{sig.recommendedEntryMinute}</span>
                  </div>

                  <div className="flex items-start gap-1.5 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight text-slate-300">{sig.protectionStrategy}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed mt-2">
                    <strong className="text-slate-300 font-semibold block mb-0.5">Estudo 82B: {sig.patternRule}</strong>
                    {sig.patternDetails}
                  </div>
                </div>
              </div>

              {/* Card Footer: Status and Action */}
              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  Horizonte: <strong className="text-white">{sig.horizon}</strong>
                </span>

                {onSelectSignalForEntry && (
                  <button
                    onClick={() => onSelectSignalForEntry(sig)}
                    className="flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 cursor-pointer"
                  >
                    <span>Carregar no Radar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSignals.length === 0 && (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">Nenhuma vela com este filtro</h3>
          <p className="text-xs text-slate-500 mt-1">Selecione "Todos os Alvos" ou alterne o horizonte para ver todas as previsões.</p>
        </div>
      )}
    </div>
  );
};
