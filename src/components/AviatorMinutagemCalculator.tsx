import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Sparkles,
  Flame,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Plus,
  Play,
  Pause,
  ShieldCheck,
  Zap,
  DollarSign,
  ChevronRight,
  Info,
  Volume2,
  VolumeX,
  Radio,
  Copy,
  Sliders,
  ExternalLink,
  Layers
} from 'lucide-react';
import { AviatorCandle } from '../types/aviator';
import {
  analyzeMinutagem,
  formatMinuteOnly,
  formatTime24,
  getCandleColor,
  getInitialDemoCandles
} from '../utils/aviatorFormulas';
import { playAviatorSound } from '../utils/audioAlert';
import { BetaoMiniHud } from './BetaoMiniHud';
import { BetaoSyncModal } from './BetaoSyncModal';

export const AviatorMinutagemCalculator: React.FC = () => {
  const [candles, setCandles] = useState<AviatorCandle[]>(() => getInitialDemoCandles());
  const [nowTime, setNowTime] = useState<Date>(new Date());
  const [inputMultiplier, setInputMultiplier] = useState<string>('');
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);

  // Real-time Betano sync & sound controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [clockOffsetSeconds, setClockOffsetSeconds] = useState<number>(0);
  const [showBetaoSyncModal, setShowBetaoSyncModal] = useState<boolean>(false);
  const [showMiniHud, setShowMiniHud] = useState<boolean>(false);
  const [quickPasteBetao, setQuickPasteBetao] = useState<string>('');
  const lastSoundRef = useRef<string | null>(null);

  // Bankroll management state
  const [bankroll, setBankroll] = useState<number>(200);
  const [bet1Amount, setBet1Amount] = useState<number>(10);
  const [bet1AutoCashout, setBet1AutoCashout] = useState<number>(1.5);
  const [bet2Amount, setBet2Amount] = useState<number>(5);
  const [bet2AutoCashout, setBet2AutoCashout] = useState<number>(10.0);
  const [stopWin, setStopWin] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<number>(50);

  // Live timer tick every 1 second incorporating clock offset
  useEffect(() => {
    const timer = setInterval(() => {
      const base = new Date();
      if (clockOffsetSeconds !== 0) {
        setNowTime(new Date(base.getTime() + clockOffsetSeconds * 1000));
      } else {
        setNowTime(base);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [clockOffsetSeconds]);

  // Auto simulate next round every 8 seconds if turned on (matching Betano round pace)
  useEffect(() => {
    if (!autoSimulate) return;
    const interval = setInterval(() => {
      // realistic Aviator distribution: ~50% < 2.0x, ~40% 2-9.99x, ~10% >= 10x
      const rand = Math.random();
      let mult = 1.05;
      if (rand < 0.52) {
        mult = Math.round((1.01 + Math.random() * 0.98) * 100) / 100;
      } else if (rand < 0.88) {
        mult = Math.round((2.0 + Math.random() * 7.99) * 100) / 100;
      } else if (rand < 0.98) {
        mult = Math.round((10.0 + Math.random() * 35.0) * 100) / 100;
      } else {
        mult = Math.round((50.0 + Math.random() * 90.0) * 100) / 100;
      }

      const d = new Date(Date.now() + clockOffsetSeconds * 1000);
      const newCandle: AviatorCandle = {
        id: `candle-${Date.now()}`,
        multiplier: mult,
        timestamp: d,
        minuteString: formatMinuteOnly(d),
        timeString: formatTime24(d),
        isPink: mult >= 10.0,
      };

      setCandles((prev) => [...prev.slice(-49), newCandle]);
    }, 8000);

    return () => clearInterval(interval);
  }, [autoSimulate, clockOffsetSeconds]);

  // Run minutagem calculation analysis
  const { stats, projections } = useMemo(() => {
    return analyzeMinutagem(candles, nowTime);
  }, [candles, nowTime]);

  // Check if current minute matches any projected target minute
  const currentMinuteStr = formatMinuteOnly(nowTime);
  const currentSecond = nowTime.getSeconds();

  const activeTargetProjection = projections.find((p) => p.targetMinute === currentMinuteStr);
  const nextClosestProjection = projections.find((p) => p.secondsRemaining > 0);

  // Status logic
  let liveStatus: {
    type: 'active' | 'warning' | 'waiting';
    title: string;
    desc: string;
    targetMin?: string;
  } = {
    type: 'waiting',
    title: 'AGUARDANDO GATILHO DE MINUTO',
    desc: 'Nenhum minuto alvo no momento. Acompanhe a contagem regressiva abaixo.',
  };

  if (activeTargetProjection) {
    liveStatus = {
      type: 'active',
      title: `🚨 MINUTO ALVO ATIVO: ${currentMinuteStr}`,
      desc: `Momento de entrada calculado pela minutagem (+${activeTargetProjection.deltaMinutes} min da última rosa). Alta probabilidade de vela rosa!`,
      targetMin: currentMinuteStr,
    };
  } else if (nextClosestProjection && nextClosestProjection.secondsRemaining <= 60 && nextClosestProjection.secondsRemaining > 0) {
    liveStatus = {
      type: 'warning',
      title: `⚠️ ATENÇÃO: ENTRADA EM ${nextClosestProjection.secondsRemaining}s`,
      desc: `Minuto alvo ${nextClosestProjection.targetMinute} iniciando em instantes! Prepare sua aposta dupla de cobertura e rosa.`,
      targetMin: nextClosestProjection.targetMinute,
    };
  }

  // Real-time audio trigger on status changes
  useEffect(() => {
    if (!soundEnabled) return;

    if (liveStatus.type === 'active' && liveStatus.targetMin) {
      const triggerKey = `target-${liveStatus.targetMin}`;
      if (lastSoundRef.current !== triggerKey) {
        lastSoundRef.current = triggerKey;
        playAviatorSound('target');
      }
    } else if (liveStatus.type === 'warning' && nextClosestProjection) {
      const rem = nextClosestProjection.secondsRemaining;
      if (rem === 45 || rem === 30 || rem === 15 || rem === 5) {
        const triggerKey = `warn-${nextClosestProjection.targetMinute}-${rem}`;
        if (lastSoundRef.current !== triggerKey) {
          lastSoundRef.current = triggerKey;
          playAviatorSound('warning');
        }
      }
    }
  }, [liveStatus.type, liveStatus.targetMin, nextClosestProjection?.secondsRemaining, soundEnabled]);

  // Handle adding a candle
  const handleAddCandle = (val?: number) => {
    const mult = val !== undefined ? val : parseFloat(inputMultiplier);
    if (isNaN(mult) || mult < 1.0) return;

    const d = new Date(Date.now() + clockOffsetSeconds * 1000);
    const newCandle: AviatorCandle = {
      id: `candle-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      multiplier: Math.round(mult * 100) / 100,
      timestamp: d,
      minuteString: formatMinuteOnly(d),
      timeString: formatTime24(d),
      isPink: mult >= 10.0,
    };

    setCandles((prev) => [...prev.slice(-49), newCandle]);
    setInputMultiplier('');
  };

  // Quick inline parser for Betão string
  const handleQuickImportBetao = (raw: string) => {
    if (!raw.trim()) return;
    const normalized = raw.replace(/,/g, '.');
    const matches = normalized.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length === 0) return;

    const numbers = matches.map(Number).filter((n) => !isNaN(n) && n >= 1.0);
    if (numbers.length === 0) return;

    const total = numbers.length;
    const now = Date.now() + clockOffsetSeconds * 1000;

    const newCandles: AviatorCandle[] = numbers.map((mult, idx) => {
      const secondsAgo = (total - 1 - idx) * 12;
      const d = new Date(now - secondsAgo * 1000);
      return {
        id: `betao-quick-${now}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        multiplier: Math.round(mult * 100) / 100,
        timestamp: d,
        minuteString: formatMinuteOnly(d),
        timeString: formatTime24(d),
        isPink: mult >= 10.0,
      };
    });

    setCandles(newCandles);
    setQuickPasteBetao('');
    playAviatorSound('test');
  };

  const handleClearHistory = () => {
    setCandles([]);
  };

  const handleResetDemo = () => {
    setCandles(getInitialDemoCandles());
  };

  // Format seconds to mm:ss
  const formatCountdown = (secs: number) => {
    if (secs <= 0) return 'AGORA!';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Bet calculations
  const totalBet = bet1Amount + bet2Amount;
  const bet1Return = Math.round(bet1Amount * bet1AutoCashout * 100) / 100;
  const bet1CoversTotal = bet1Return >= totalBet;
  const bet2Return = Math.round(bet2Amount * bet2AutoCashout * 100) / 100;
  const totalProfit = Math.round((bet1Return + bet2Return - totalBet) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Real-time Status Alert Banner */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-lg ${
          liveStatus.type === 'active'
            ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-900/30 animate-pulse'
            : liveStatus.type === 'warning'
            ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-amber-900/30'
            : 'bg-slate-900/90 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${
                  liveStatus.type === 'active'
                    ? 'bg-rose-500 text-white'
                    : liveStatus.type === 'warning'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {liveStatus.type === 'active'
                  ? 'SINAL ATIVO NO BETÃO'
                  : liveStatus.type === 'warning'
                  ? 'PREPARAR ENTRADA'
                  : 'RADAR DE MINUTAGEM BETÃO'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Horário da Mesa: <strong className="text-white font-mono">{formatTime24(nowTime)}</strong>
                {clockOffsetSeconds !== 0 && (
                  <span className="text-amber-400 text-[10px] ml-1">
                    ({clockOffsetSeconds > 0 ? `+${clockOffsetSeconds}` : clockOffsetSeconds}s)
                  </span>
                )}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {liveStatus.type === 'active' && <Zap className="w-5 h-5 text-rose-400 animate-bounce" />}
              {liveStatus.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {liveStatus.type === 'waiting' && <Clock className="w-5 h-5 text-cyan-400" />}
              {liveStatus.title}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">{liveStatus.desc}</p>
          </div>

          {/* Quick Real-time Projections Pill */}
          <div className="flex flex-wrap items-center gap-2 font-mono">
            {projections.slice(0, 3).map((p, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-xl border text-center text-xs ${
                  p.targetMinute === currentMinuteStr
                    ? 'bg-rose-600 border-rose-400 text-white font-bold animate-pulse'
                    : p.secondsRemaining > 0 && p.secondsRemaining <= 90
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Minuto {p.targetMinute}
                </div>
                <div className="text-sm font-bold mt-0.5">
                  {p.secondsRemaining > 0 ? formatCountdown(p.secondsRemaining) : 'ENCERRADO'}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Confiança: {p.confidence}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BETÃO REAL-TIME CONTROL CENTER (Barra de Ações e Conexão ao Vivo) */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold font-mono text-rose-300 uppercase tracking-wide">
              Central Betão em Tempo Real
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40 font-mono">
              Spribe / Betano Sync
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Sound Alarm */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAviatorSound('test');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors border ${
                soundEnabled
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Alarme sonoro ao entrar nos minutos alvos ou contagem de 30s"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Alarme: {soundEnabled ? 'Ativo' : 'Mudo'}</span>
            </button>

            {/* Test Sound */}
            <button
              onClick={() => playAviatorSound('test')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-300"
              title="Ouvir teste de som do alarme"
            >
              Testar Beep
            </button>

            {/* Open Mini HUD */}
            <button
              onClick={() => setShowMiniHud(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border ${
                showMiniHud
                  ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-950'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Abre o Mini-HUD flutuante para jogar com a tela da Betano lado a lado"
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Mini-HUD Betão</span>
            </button>

            {/* Open Full Sync Modal */}
            <button
              onClick={() => setShowBetaoSyncModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-mono font-bold shadow-md shadow-rose-950 transition-all"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Sincronizar Fita Betão</span>
            </button>
          </div>
        </div>

        {/* Inline Quick Paste Bar from Betano */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="text-xs text-slate-300 font-medium whitespace-nowrap flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Colar Fita do Betão:</span>
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cole os multiplicadores da barra do Betão (ex: 1.25x 14.50x 1.80x 2.10x 35.00x 1.05x)"
              value={quickPasteBetao}
              onChange={(e) => setQuickPasteBetao(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickImportBetao(quickPasteBetao);
              }}
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            onClick={() => handleQuickImportBetao(quickPasteBetao)}
            disabled={!quickPasteBetao.trim()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold font-mono rounded-xl transition-all whitespace-nowrap"
          >
            SINCRONIZAR AGORA
          </button>
        </div>

        {/* Quick Offset selector */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
          <div className="flex items-center space-x-2">
            <span>Atraso / Delay da Mesa:</span>
            {[-10, -5, 0, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setClockOffsetSeconds(s)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  clockOffsetSeconds === s
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s > 0 ? `+${s}` : s}s
              </button>
            ))}
          </div>
          <span className="text-slate-500 text-[10px]">
            💡 Dica: Cole a sequência de multiplicadores que aparece no topo do jogo da Betano.
          </span>
        </div>
      </div>

      {/* Main Grid: Input & Live Candles Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Input & Round Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" /> Registrar Vela / Rodada
            </h3>
            <button
              onClick={() => setAutoSimulate(!autoSimulate)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                autoSimulate
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Gera rodadas aleatórias simulando o jogo Aviator a cada 8 segundos"
            >
              {autoSimulate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{autoSimulate ? 'PARAR AUTO' : 'SIMULAR AO VIVO'}</span>
            </button>
          </div>

          {/* Manual Input */}
          <div className="space-y-3">
            <label className="text-xs text-slate-300 block font-medium">
              Multiplicador da Rodada (ex: 1.45, 3.20, 15.80, 102.0)
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  min="1.0"
                  placeholder="Ex: 12.50"
                  value={inputMultiplier}
                  onChange={(e) => setInputMultiplier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCandle();
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-mono text-sm">x</span>
              </div>
              <button
                onClick={() => handleAddCandle()}
                disabled={!inputMultiplier}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all font-mono"
              >
                REGISTRAR
              </button>
            </div>

            {/* Quick Multiplier Buttons */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                Atalhos rápidos para registrar vela com 1 clique:
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleAddCandle(1.24)}
                  className="px-2 py-1.5 rounded-lg bg-blue-950/80 border border-blue-600/40 text-blue-300 text-xs font-mono hover:bg-blue-900/90 font-bold transition-all"
                >
                  1.24x
                </button>
                <button
                  onClick={() => handleAddCandle(1.85)}
                  className="px-2 py-1.5 rounded-lg bg-blue-950/80 border border-blue-600/40 text-blue-300 text-xs font-mono hover:bg-blue-900/90 font-bold transition-all"
                >
                  1.85x
                </button>
                <button
                  onClick={() => handleAddCandle(3.40)}
                  className="px-2 py-1.5 rounded-lg bg-purple-950/80 border border-purple-600/40 text-purple-300 text-xs font-mono hover:bg-purple-900/90 font-bold transition-all"
                >
                  3.40x
                </button>
                <button
                  onClick={() => handleAddCandle(6.80)}
                  className="px-2 py-1.5 rounded-lg bg-purple-950/80 border border-purple-600/40 text-purple-300 text-xs font-mono hover:bg-purple-900/90 font-bold transition-all"
                >
                  6.80x
                </button>
                <button
                  onClick={() => handleAddCandle(12.45)}
                  className="px-2 py-1.5 rounded-lg bg-pink-950/80 border border-pink-500/50 text-pink-300 text-xs font-mono hover:bg-pink-900/90 font-bold transition-all col-span-2"
                >
                  🌸 12.45x (Rosa)
                </button>
                <button
                  onClick={() => handleAddCandle(28.90)}
                  className="px-2 py-1.5 rounded-lg bg-pink-950/80 border border-pink-500/50 text-pink-300 text-xs font-mono hover:bg-pink-900/90 font-bold transition-all"
                >
                  🌸 28.90x
                </button>
                <button
                  onClick={() => handleAddCandle(105.0)}
                  className="px-2 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono hover:bg-amber-900/90 font-bold transition-all"
                >
                  👑 105x
                </button>
              </div>
            </div>

            {/* Quick Dataset Controls */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                onClick={handleResetDemo}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
              >
                <RotateCcw className="w-3 h-3" /> Restaurar Histórico Exemplo
              </button>
              <button
                onClick={handleClearHistory}
                className="text-slate-500 hover:text-rose-400 font-mono text-[11px]"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Live Multiplier Stream & Minutagem Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Multiplier Stream Banner (Like real Aviator top bar) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Histórico de Rodadas Recentes ({candles.length})
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Azul &lt; 2x | Roxo 2x-9.99x | Rosa ≥ 10x
              </span>
            </div>

            {/* Horizontal Scroll of Candle Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-700">
              {candles.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 font-mono">
                  Nenhuma rodada cadastrada. Adicione velas ou clique em "Restaurar Histórico Exemplo".
                </div>
              ) : (
                candles
                  .slice()
                  .reverse()
                  .map((c) => {
                    const color = getCandleColor(c.multiplier);
                    return (
                      <div
                        key={c.id}
                        className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex flex-col items-center min-w-[58px] transition-transform hover:scale-105 ${
                          color === 'gold'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : color === 'pink'
                            ? 'bg-pink-600/30 border-pink-400 text-pink-300 ring-1 ring-pink-500/50'
                            : color === 'purple'
                            ? 'bg-purple-900/40 border-purple-500 text-purple-300'
                            : 'bg-blue-950/50 border-blue-700 text-blue-400'
                        }`}
                      >
                        <span>{c.multiplier.toFixed(2)}x</span>
                        <span className="text-[9px] font-normal text-slate-400">{c.minuteString}</span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Minutagem Analytics Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Last Pink Candle */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Última Vela Rosa
              </div>
              <div className="text-lg font-mono font-bold text-pink-400 mt-1">
                {stats.lastPinkMultiplier ? `${stats.lastPinkMultiplier.toFixed(2)}x` : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                às {stats.lastPinkMinute || '--:--'}
              </div>
            </div>

            {/* Average Interval */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Intervalo Médio (ΔT)
              </div>
              <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                {stats.averagePinkIntervalMin} <span className="text-xs font-normal">min</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Mín: {stats.minIntervalMin}m | Máx: {stats.maxIntervalMin}m
              </div>
            </div>

            {/* Blue Sequence Count */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Sequência de Azuis
              </div>
              <div
                className={`text-lg font-mono font-bold mt-1 ${
                  stats.currentConsecutiveBlues >= 4 ? 'text-amber-400' : 'text-slate-100'
                }`}
              >
                {stats.currentConsecutiveBlues} <span className="text-xs font-normal">seguidas</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {stats.currentConsecutiveBlues >= 4 ? '⚠️ Tendência de quebra' : 'Normal'}
              </div>
            </div>

            {/* Market State */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Momento do Mercado
              </div>
              <div
                className={`text-sm font-mono font-bold mt-1.5 ${
                  stats.marketState === 'Pagador'
                    ? 'text-emerald-400'
                    : stats.marketState === 'Recolhedor / Frio'
                    ? 'text-rose-400'
                    : 'text-cyan-300'
                }`}
              >
                {stats.marketState}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {stats.pinkCandlesCount} rosas em {stats.totalCandles}
              </div>
            </div>
          </div>

          {/* Projections Table with Countdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> Próximos Minutos Calculados pela Minutagem
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Projeção algorítmica de minutos quentes para entrada em busca de multiplicadores altos (≥ 10x).
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-800">
                Alvo: Vela Rosa (10x+)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {projections.map((proj, idx) => {
                const isTargetNow = proj.targetMinute === currentMinuteStr;
                const isUrgent = proj.secondsRemaining > 0 && proj.secondsRemaining <= 60;

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3.5 space-y-2 relative transition-all ${
                      isTargetNow
                        ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-950'
                        : isUrgent
                        ? 'bg-amber-950/50 border-amber-500 shadow-md shadow-amber-950'
                        : 'bg-slate-800/60 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">Gatilho {idx + 1}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          proj.confidence === 'Alta'
                            ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {proj.confidence}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold font-mono text-white">
                        {proj.targetMinute}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        (+{proj.deltaMinutes} min)
                      </span>
                    </div>

                    {/* Countdown */}
                    <div className="pt-1 border-t border-slate-700/50 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">Tempo restante:</span>
                      <span
                        className={`font-bold ${
                          isTargetNow
                            ? 'text-rose-400 animate-pulse text-sm'
                            : isUrgent
                            ? 'text-amber-300 text-sm'
                            : 'text-cyan-300'
                        }`}
                      >
                        {isTargetNow ? 'ATIVO AGORA' : formatCountdown(proj.secondsRemaining)}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight pt-1">
                      {proj.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 2-Bet Strategy Calculator & Minute Digits Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strategy: 2 Simultaneous Bets (Safe Cashout + Pink Candle Hunt) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Estratégia de 2 Apostas (Cobertura & Alvo)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Gestão de Risco
            </span>
          </div>

          <p className="text-xs text-slate-400">
            A aposta 1 garante a cobertura do valor total investido nas duas mãos. A aposta 2 busca o lucro alto na minutagem.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Bet 1 */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Aposta 1 (Proteção)</span>
                <span className="text-cyan-400 font-mono">1.50x / 2.00x</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Valor da Aposta (R$)</label>
                <input
                  type="number"
                  value={bet1Amount}
                  onChange={(e) => setBet1Amount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Saída Automática (x)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bet1AutoCashout}
                  onChange={(e) => setBet1AutoCashout(Math.max(1.01, Number(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300"
                />
              </div>
              <div className="text-[11px] text-slate-300 font-mono pt-1">
                Retorno: <strong className="text-emerald-400">R$ {bet1Return.toFixed(2)}</strong>
              </div>
            </div>

            {/* Bet 2 */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Aposta 2 (Minutagem)</span>
                <span className="text-pink-400 font-mono">10.00x+</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Valor da Aposta (R$)</label>
                <input
                  type="number"
                  value={bet2Amount}
                  onChange={(e) => setBet2Amount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-pink-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Alvo da Vela (x)</label>
                <input
                  type="number"
                  step="1"
                  value={bet2AutoCashout}
                  onChange={(e) => setBet2AutoCashout(Math.max(2.0, Number(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-pink-300"
                />
              </div>
              <div className="text-[11px] text-slate-300 font-mono pt-1">
                Retorno: <strong className="text-pink-400">R$ {bet2Return.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Summary equation */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Custo Total da Rodada:</span>
              <span className="text-slate-200 font-bold">R$ {totalBet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Aposta 1 cobre o total?</span>
              <span className={bet1CoversTotal ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                {bet1CoversTotal ? 'SIM (Risco Zero ao bater 1.50x)' : 'PARCIAL'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Lucro Líquido se bater a Vela Rosa:</span>
              <span className="text-emerald-400 font-bold text-sm">
                +R$ {totalProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown of Minute Endings (Terminações de Minuto) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Frequência de Terminações de Minuto (0 a 9)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Padrão de Dígitos</span>
          </div>

          <p className="text-xs text-slate-400">
            Analisa o último algarismo do minuto em que as velas de 10x+ saíram para identificar repetições de dígitos (ex: minutos terminados em 2, 5 ou 7).
          </p>

          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
              const count = stats.pinkEndingsFrequency[digit] || 0;
              const hasOccurrences = count > 0;
              return (
                <div
                  key={digit}
                  className={`p-2.5 rounded-xl border text-center font-mono ${
                    hasOccurrences
                      ? 'bg-pink-950/40 border-pink-500/60 text-pink-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-xs text-slate-400 font-semibold">Minuto final</div>
                  <div className="text-lg font-bold text-white mt-0.5">...{digit}</div>
                  <div className="text-[10px] text-pink-400 mt-0.5 font-semibold">
                    {count} {count === 1 ? 'vela' : 'velas'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Note */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Como funciona a Minutagem:</strong> No Aviator, o algoritmo segue ciclos de distribuição temporal. As velas rosas tendem a se agrupar em intervalos de 4 a 8 minutos. Ao identificar o minuto da última vela alta, programamos as entradas nos minutos alvos correspondentes.
            </p>
          </div>
        </div>
      </div>

      {/* Betao Mini-HUD Floating Widget */}
      {showMiniHud && (
        <BetaoMiniHud
          currentMinuteStr={currentMinuteStr}
          currentSecond={currentSecond}
          timeString={formatTime24(nowTime)}
          liveStatus={liveStatus}
          nextTargetMinute={nextClosestProjection?.targetMinute}
          secondsRemaining={nextClosestProjection?.secondsRemaining || 0}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playAviatorSound('test');
          }}
          onAddCandle={handleAddCandle}
          onClose={() => setShowMiniHud(false)}
          consecutiveBlues={stats.currentConsecutiveBlues}
        />
      )}

      {/* Betao Full Sync Modal */}
      <BetaoSyncModal
        isOpen={showBetaoSyncModal}
        onClose={() => setShowBetaoSyncModal(false)}
        onImportCandles={(newCandles) => setCandles(newCandles)}
        clockOffsetSeconds={clockOffsetSeconds}
        onSetClockOffset={setClockOffsetSeconds}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled(!soundEnabled);
          if (!soundEnabled) playAviatorSound('test');
        }}
      />
    </div>
  );
};
