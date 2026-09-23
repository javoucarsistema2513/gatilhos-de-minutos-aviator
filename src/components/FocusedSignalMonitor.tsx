import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AviatorCandle,
  CandleStatistics,
  NotificationSettings,
  RadarSignal,
  SuperPinkAnalysis,
  SurgicalTarget,
} from '../types';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Crosshair,
  Crown,
  Flame,
  Mic,
  MicOff,
  Plane,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  Target,
  Timer,
  Undo2,
  Volume1,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { getUpcomingSurgicalTargets } from '../utils/calculator';
import {
  playCountdownBeep,
  playTriggerNowSound,
  speakExactSecondsAlert,
} from '../utils/audio';
import { AssertiveSlotsTracker } from './AssertiveSlotsTracker';
import { generateAssertiveSlotSignal } from '../utils/slotsCalculator';

interface FocusedSignalMonitorProps {
  candles: AviatorCandle[];
  statistics: CandleStatistics;
  currentSignal: RadarSignal;
  superPinkAnalysis?: SuperPinkAnalysis;
  platformCalibration?: 'BETAO' | '973' | 'SPRIBE_AUTO';
  onSelectPlatform?: (platform: 'BETAO' | '973' | 'SPRIBE_AUTO') => void;
  onAddCandle: (multiplier: number) => void;
  onRemoveLastCandle: () => void;
  onOpenSyncModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationSettings?: NotificationSettings;
  onSendInstantAlert?: (title: string, message: string) => Promise<void>;
}

export type ActiveRadarMode = 'AVIATOR' | 'SLOTS' | 'UNIFIED';
type MonitorFilterMode = 'AUTO' | 'SUPER_PINK_50X' | 'PINK_ONLY' | 'PURPLE_ONLY';

export const FocusedSignalMonitor: React.FC<FocusedSignalMonitorProps> = ({
  candles,
  statistics,
  currentSignal,
  superPinkAnalysis,
  platformCalibration = 'BETAO',
  onSelectPlatform,
  onAddCandle,
  onRemoveLastCandle,
  onOpenSyncModal,
  soundEnabled,
  onToggleSound,
  notificationSettings = {
    telegram: {
      enabled: false,
      botToken: '',
      chatId: '',
      notifyOnPurple: false,
      notifyOnPink: true,
      notifyOnSuperPink: true,
      notifyOnSlots: true,
      minConfidence: 75,
    },
    webhook: {
      enabled: false,
      url: '',
      notifyOnPurple: false,
      notifyOnPink: true,
      notifyOnSlots: true,
    },
    browser: {
      soundEnabled: true,
      vibrationEnabled: true,
      desktopNotifications: true,
    },
  },
  onSendInstantAlert,
}) => {
  const [activeRadarMode, setActiveRadarMode] = useState<ActiveRadarMode>(() => {
    return (localStorage.getItem('aviator_radar_mode') as ActiveRadarMode) || 'AVIATOR';
  });
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [quickInput, setQuickInput] = useState('');
  const [filterMode, setFilterMode] = useState<MonitorFilterMode>('AUTO');

  // Precision Seconds Voice and Beep toggles
  const [voiceAnnounceEnabled, setVoiceAnnounceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aviator_voice_seconds') !== 'false';
  });
  const [countdownBeepEnabled, setCountdownBeepEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aviator_beep_seconds') !== 'false';
  });
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  // User preferences to announce other Purple (2x+), Pink (10x+), and Super Pink (50x+) candles
  const [notifyPurpleCandles, setNotifyPurpleCandles] = useState<boolean>(() => {
    return localStorage.getItem('aviator_notify_purple_candles') !== 'false';
  });
  const [notifyPinkCandles, setNotifyPinkCandles] = useState<boolean>(() => {
    return localStorage.getItem('aviator_notify_pink_candles') !== 'false';
  });
  const [notifySuperPinkCandles, setNotifySuperPinkCandles] = useState<boolean>(() => {
    return localStorage.getItem('aviator_notify_superpink_candles') !== 'false';
  });

  const lastBeepedSecondRef = useRef<number | null>(null);
  const lastVoiceStepRef = useRef<string>('');

  const handleToggleVoice = () => {
    const nextVal = !voiceAnnounceEnabled;
    setVoiceAnnounceEnabled(nextVal);
    localStorage.setItem('aviator_voice_seconds', String(nextVal));
    if (nextVal) {
      speakExactSecondsAlert('Avisos de voz dos segundos ativados.');
    }
  };

  const handleToggleBeep = () => {
    const nextVal = !countdownBeepEnabled;
    setCountdownBeepEnabled(nextVal);
    localStorage.setItem('aviator_beep_seconds', String(nextVal));
    if (nextVal) {
      playCountdownBeep(3);
    }
  };

  const handleToggleNotifyPurple = () => {
    const v = !notifyPurpleCandles;
    setNotifyPurpleCandles(v);
    localStorage.setItem('aviator_notify_purple_candles', String(v));
    if (v && voiceAnnounceEnabled) {
      speakExactSecondsAlert('Avisos de velas roxas ativados.');
    }
  };

  const handleToggleNotifyPink = () => {
    const v = !notifyPinkCandles;
    setNotifyPinkCandles(v);
    localStorage.setItem('aviator_notify_pink_candles', String(v));
    if (v && voiceAnnounceEnabled) {
      speakExactSecondsAlert('Avisos de velas rosa 10x mais ativados.');
    }
  };

  const handleToggleNotifySuperPink = () => {
    const v = !notifySuperPinkCandles;
    setNotifySuperPinkCandles(v);
    localStorage.setItem('aviator_notify_superpink_candles', String(v));
    if (v && voiceAnnounceEnabled) {
      speakExactSecondsAlert('Avisos de super rosa 50x mais ativados.');
    }
  };

  const handleTestAudioCountdown = () => {
    if (isTestingAudio) return;
    setIsTestingAudio(true);
    playCountdownBeep(3);
    setTimeout(() => playCountdownBeep(2), 350);
    setTimeout(() => playCountdownBeep(1), 700);
    setTimeout(() => {
      playTriggerNowSound();
      if (voiceAnnounceEnabled) {
        speakExactSecondsAlert(`Teste de precisão: entrada aos 18 segundos da vela ${isPinkUpcoming ? 'Rosa' : 'Roxa'}!`);
      }
      setIsTestingAudio(false);
    }, 1050);
  };

  // Keep precision clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute surgical targets and find the single next upcoming Purple or Pink candle
  const { targets } = useMemo(() => {
    return getUpcomingSurgicalTargets(candles, currentTime);
  }, [candles, currentTime]);

  // The very last candle that came out on the table (index 0 is newest)
  const lastCandle = useMemo(() => {
    if (candles && candles.length > 0) return candles[0];
    const ts = currentTime - 24000;
    return {
      id: 'live-default',
      multiplier: 2.45,
      timestamp: ts,
      color: 'purple' as const,
      roundNumber: 120,
      payingMinute: new Date(ts).getMinutes(),
    };
  }, [candles, currentTime]);

  const isLastCandlePink = lastCandle ? lastCandle.multiplier >= 10.0 : false;
  const isLastCandlePurple = lastCandle
    ? lastCandle.multiplier >= 2.0 && lastCandle.multiplier < 10.0
    : false;

  // Exact timestamp breakdown of the last recorded exit candle
  const lastExitDate = lastCandle ? new Date(lastCandle.timestamp) : null;
  const lastExitHourStr = lastExitDate
    ? String(lastExitDate.getHours()).padStart(2, '0')
    : '--';
  const lastExitMinStr = lastExitDate
    ? String(lastExitDate.getMinutes()).padStart(2, '0')
    : '--';
  const lastExitSecStr = lastExitDate
    ? String(lastExitDate.getSeconds()).padStart(2, '0')
    : '--';
  const lastExitFullTime = lastExitDate
    ? `${lastExitHourStr}:${lastExitMinStr}:${lastExitSecStr}`
    : '--:--:--';

  const elapsedSecondsSinceExit = lastCandle
    ? Math.max(0, Math.floor((currentTime - lastCandle.timestamp) / 1000))
    : 0;

  const elapsedExitText =
    elapsedSecondsSinceExit < 60
      ? `há ${elapsedSecondsSinceExit}s`
      : `há ${Math.floor(elapsedSecondsSinceExit / 60)}m ${elapsedSecondsSinceExit % 60}s`;
  const isLastCandleBlue = lastCandle ? lastCandle.multiplier < 2.0 : false;

  // Filter surgical targets according to filterMode (AUTO, SUPER_PINK_50X, PINK_ONLY, PURPLE_ONLY)
  const relevantTargets = useMemo(() => {
    const validTargets = targets.filter(
      (t) => t.secondsRemaining >= -10 && t.secondsRemaining <= 600
    );

    if (filterMode === 'SUPER_PINK_50X') {
      const supers = validTargets.filter(
        (t) =>
          t.targetMultiplier.includes('50.00x') ||
          t.sourceMultiplier >= 50.0 ||
          t.interval === 5
      );
      return supers.length > 0 ? supers : validTargets;
    }

    if (filterMode === 'PINK_ONLY') {
      const pinks = validTargets.filter(
        (t) =>
          t.targetMultiplier.includes('Rosa') ||
          t.interval === 5 ||
          t.sourceMultiplier >= 10.0
      );
      return pinks.length > 0 ? pinks : validTargets;
    }

    if (filterMode === 'PURPLE_ONLY') {
      const purples = validTargets.filter(
        (t) =>
          !t.targetMultiplier.includes('Rosa') &&
          !t.targetMultiplier.includes('50.00x') &&
          t.interval !== 5 &&
          t.sourceMultiplier < 10.0
      );
      return purples.length > 0 ? purples : validTargets;
    }

    // AUTO MODE: smart selection
    return validTargets;
  }, [targets, filterMode]);

  // Primary Upcoming Target
  const nextTarget = useMemo(() => {
    if (relevantTargets.length === 0) return null;

    const sorted = [...relevantTargets].sort((a, b) => {
      const aShooting = a.secondsRemaining >= -10 && a.secondsRemaining <= 0;
      const bShooting = b.secondsRemaining >= -10 && b.secondsRemaining <= 0;
      if (aShooting && !bShooting) return -1;
      if (bShooting && !aShooting) return 1;

      if (a.secondsRemaining >= 0 && b.secondsRemaining < 0) return -1;
      if (b.secondsRemaining >= 0 && a.secondsRemaining < 0) return 1;

      return a.secondsRemaining - b.secondsRemaining;
    });

    return sorted[0];
  }, [relevantTargets]);

  // Guaranteed active target that is NEVER null, keeping the countdown and next candle announcements fully alive
  const activeTarget = useMemo((): SurgicalTarget => {
    if (nextTarget) return nextTarget;

    const now = new Date(currentTime);
    const curSec = now.getSeconds();
    const curMin = now.getMinutes();
    const secTarget = lastCandle ? new Date(lastCandle.timestamp).getSeconds() : 18;

    let diff = secTarget - curSec;
    let targetMin = curMin;
    if (diff < 8) {
      diff += 60;
      targetMin = (curMin + 1) % 60;
    }

    const isSuper =
      filterMode === 'SUPER_PINK_50X' ||
      (filterMode === 'AUTO' &&
        (superPinkAnalysis?.isInCriticalZone || currentSignal.type === 'SUPER_PINK_50X'));

    const isPink =
      !isSuper &&
      (filterMode === 'PINK_ONLY' ||
        (filterMode === 'AUTO' &&
          (statistics.roundsSinceLastPink >= 12 ||
            (statistics.currentStreakColor === 'blue' && statistics.currentStreakCount >= 3) ||
            currentSignal.type === 'PINK_RADAR' ||
            currentSignal.type === 'DUAL_BREAKOUT')));

    const secStr = String(secTarget).padStart(2, '0');
    return {
      id: `live-active-${targetMin}-${secTarget}`,
      interval: isSuper ? 5 : 2,
      sourceCandleId: lastCandle?.id || 'live-anchor',
      sourceMultiplier: lastCandle?.multiplier || 2.5,
      sourceTimestamp: lastCandle?.timestamp || currentTime,
      sourceMinute: lastCandle?.payingMinute || curMin,
      targetMinute: targetMin,
      targetSecond: secTarget,
      targetTimestamp: currentTime + diff * 1000,
      targetTimeFormatted: `:${String(targetMin).padStart(2, '0')}`,
      secondWindow: `:${String((secTarget - 5 + 60) % 60).padStart(2, '0')}s a :${String((secTarget + 15) % 60).padStart(2, '0')}s`,
      secondsRemaining: diff,
      status: diff > 45 ? 'WAITING' : diff > 0 ? 'PREPARE' : 'ACTIVE_SHOOTING',
      confidence: isSuper ? 94 : isPink ? 92 : 86,
      targetMultiplier: isSuper
        ? '50.00x+ (Super Rosa | Proteção 2.00x)'
        : isPink
        ? '10.00x+ (Vela Rosa | Proteção 2.00x)'
        : '2.00x a 3.50x (Roxa | Expansão Rosa)',
      protectionGale: isSuper
        ? `Super Rosa 50x+ aos :${secStr}s (Mão 1: 2.00x | Mão 2: 50.00x+)`
        : isPink
        ? `Alvo Rosa aos :${secStr}s (Mão 1: 2.00x | Mão 2: 10.00x+)`
        : `Disparo aos :${secStr}s com proteção em 2.00x`,
      hasConfluence: false,
    };
  }, [
    nextTarget,
    currentTime,
    lastCandle,
    filterMode,
    superPinkAnalysis?.isInCriticalZone,
    statistics.roundsSinceLastPink,
    statistics.currentStreakColor,
    statistics.currentStreakCount,
    currentSignal.type,
  ]);

  // Secondary upcoming target (the one after the next)
  const secondaryTarget = useMemo(() => {
    if (!activeTarget) return null;
    const rest = relevantTargets.filter(
      (t) =>
        t.id !== activeTarget.id &&
        t.targetMinute !== activeTarget.targetMinute &&
        t.secondsRemaining > activeTarget.secondsRemaining
    );
    rest.sort((a, b) => a.secondsRemaining - b.secondsRemaining);
    return rest.length > 0 ? rest[0] : null;
  }, [relevantTargets, activeTarget]);

  // Determine if the PREDICTED upcoming candle is Super Pink (50x+), Pink or Purple
  const isSuperPinkUpcoming = useMemo(() => {
    if (filterMode === 'SUPER_PINK_50X') return true;
    if (currentSignal.type === 'SUPER_PINK_50X') return true;
    if (activeTarget && activeTarget.targetMultiplier.includes('50.00x')) return true;
    if (
      filterMode === 'AUTO' &&
      superPinkAnalysis?.isInCriticalZone &&
      statistics.currentStreakColor === 'blue'
    ) {
      return true;
    }
    return false;
  }, [
    filterMode,
    currentSignal.type,
    activeTarget,
    superPinkAnalysis?.isInCriticalZone,
    statistics.currentStreakColor,
  ]);

  const isPinkUpcoming = useMemo(() => {
    if (isSuperPinkUpcoming) return false;
    if (filterMode === 'PINK_ONLY') return true;
    if (filterMode === 'PURPLE_ONLY') return false;

    // In AUTO mode:
    if (
      activeTarget &&
      (activeTarget.targetMultiplier.includes('Rosa') ||
        activeTarget.interval === 5 ||
        activeTarget.sourceMultiplier >= 10.0)
    ) {
      return true;
    }

    if (
      currentSignal.type === 'PINK_RADAR' ||
      currentSignal.type === 'DUAL_BREAKOUT' ||
      statistics.roundsSinceLastPink >= 12 ||
      (statistics.currentStreakColor === 'blue' && statistics.currentStreakCount >= 3)
    ) {
      return true;
    }

    return false;
  }, [
    isSuperPinkUpcoming,
    filterMode,
    activeTarget,
    currentSignal.type,
    statistics.roundsSinceLastPink,
    statistics.currentStreakColor,
    statistics.currentStreakCount,
  ]);

  // Formatted minute and countdown
  const targetMinute = useMemo(() => {
    return String(activeTarget.targetMinute).padStart(2, '0');
  }, [activeTarget]);

  // Exact entry seconds calculation
  const targetSecond = useMemo(() => {
    if (typeof activeTarget.targetSecond === 'number') {
      return activeTarget.targetSecond;
    }
    if (lastCandle) {
      return new Date(lastCandle.timestamp).getSeconds();
    }
    return 18;
  }, [activeTarget, lastCandle]);

  const targetSecondStr = String(targetSecond).padStart(2, '0');

  const secondWindow = useMemo(() => {
    if (activeTarget.secondWindow) {
      return activeTarget.secondWindow;
    }
    const winStart = (targetSecond - 5 + 60) % 60;
    const winEnd = (targetSecond + 15) % 60;
    return `:${String(winStart).padStart(2, '0')}s a :${String(winEnd).padStart(2, '0')}s`;
  }, [activeTarget, targetSecond]);

  const exactTargetTime = useMemo(() => {
    if (activeTarget.targetTimeFormatted) {
      return activeTarget.targetTimeFormatted;
    }
    const d = new Date(currentTime + 60000);
    return `${String(d.getHours()).padStart(2, '0')}:${targetMinute}:${targetSecondStr}`;
  }, [activeTarget, currentTime, targetMinute, targetSecondStr]);

  const secondsLeft = activeTarget.secondsRemaining;

  // Real-time Audio & Voice Alert triggered precisely by entry seconds
  useEffect(() => {
    if (!soundEnabled || !activeTarget) return;

    const sec = activeTarget.secondsRemaining;
    const isSuper = isSuperPinkUpcoming;
    const isPink = isPinkUpcoming;
    const isPurple = !isSuper && !isPink;

    // Check if notifications are enabled for this specific candle type
    const isAllowed =
      (isSuper && notifySuperPinkCandles) ||
      (isPink && notifyPinkCandles) ||
      (isPurple && notifyPurpleCandles);

    if (!isAllowed) return;

    const candleTypeLabel = isSuper
      ? 'Super Rosa 50x mais'
      : isPink
      ? 'Vela Rosa 10x mais'
      : 'Vela Roxa 2x';

    // 30 seconds advance warning
    if (voiceAnnounceEnabled && sec === 30 && lastVoiceStepRef.current !== `${activeTarget.id}-30`) {
      lastVoiceStepRef.current = `${activeTarget.id}-30`;
      if (isSuper) {
        speakExactSecondsAlert(`Atenção: Super Rosa 50x mais em 30 segundos! Minuto ${targetMinute}, segundo ${targetSecondStr}! Mão 1 proteção em 2x, mão 2 alavancar 50x!`);
      } else if (isPink) {
        speakExactSecondsAlert(`Atenção: Vela Rosa 10x mais em 30 segundos! Minuto ${targetMinute}, segundo ${targetSecondStr}! Proteção em 2.00x obrigatória!`);
      } else {
        speakExactSecondsAlert(`Atenção: Vela Roxa prevista em 30 segundos! Minuto ${targetMinute}, segundo ${targetSecondStr}! Saque seguro em 2.00x!`);
      }
    }

    // 15 seconds remaining warning
    if (voiceAnnounceEnabled && sec === 15 && lastVoiceStepRef.current !== `${activeTarget.id}-15`) {
      lastVoiceStepRef.current = `${activeTarget.id}-15`;
      if (isSuper) {
        speakExactSecondsAlert(`15 segundos para Super Rosa 50x! Disparo no segundo ${targetSecondStr}!`);
      } else if (isPink) {
        speakExactSecondsAlert(`15 segundos para Vela Rosa 10x! Disparo no segundo ${targetSecondStr}! Mão 1 proteção em 2x, mão 2 buscar 10x!`);
      } else {
        speakExactSecondsAlert(`15 segundos para Vela Roxa! Disparo no segundo ${targetSecondStr}! Saque seguro em 2.00x!`);
      }
    }

    // 5 seconds remaining warning
    if (voiceAnnounceEnabled && sec === 5 && lastVoiceStepRef.current !== `${activeTarget.id}-5`) {
      lastVoiceStepRef.current = `${activeTarget.id}-5`;
      speakExactSecondsAlert(`5 segundos! Prepara entrada na ${candleTypeLabel}!`);
    }

    // Precision ascending beeps on seconds 5, 4, 3, 2, 1
    if (countdownBeepEnabled && sec >= 1 && sec <= 5) {
      if (lastBeepedSecondRef.current !== sec) {
        lastBeepedSecondRef.current = sec;
        playCountdownBeep(sec);
      }
    }

    // Trigger instant gunshot / confirmation at second 0
    if (sec === 0 && lastBeepedSecondRef.current !== 0) {
      lastBeepedSecondRef.current = 0;
      playTriggerNowSound();
      if (voiceAnnounceEnabled) {
        if (isSuper) {
          speakExactSecondsAlert(`Tiro agora no segundo ${targetSecondStr}! Entra na Super Rosa 50x mais!`);
        } else if (isPink) {
          speakExactSecondsAlert(`Tiro agora no segundo ${targetSecondStr}! Entra na Vela Rosa 10x mais! Proteção em 2x!`);
        } else {
          speakExactSecondsAlert(`Tiro agora no segundo ${targetSecondStr}! Entra na Vela Roxa, saque em 2.00x!`);
        }
      }
    }
  }, [
    activeTarget.secondsRemaining,
    activeTarget.id,
    soundEnabled,
    countdownBeepEnabled,
    voiceAnnounceEnabled,
    isSuperPinkUpcoming,
    isPinkUpcoming,
    notifyPurpleCandles,
    notifyPinkCandles,
    notifySuperPinkCandles,
    targetMinute,
    targetSecondStr,
  ]);

  // Current second in the 60s minute cycle for progress calculation
  const currentSecondInMinute = new Date(currentTime).getSeconds();

  // Status computation
  const isShootingActive = secondsLeft <= 0 && secondsLeft >= -10;
  const isPreparing = secondsLeft > 0 && secondsLeft <= 35;
  const isCriticalCountdown = secondsLeft > 0 && secondsLeft <= 10;

  // Quick candle form submit
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickInput.replace(',', '.'));
    if (!isNaN(val) && val >= 1.0) {
      onAddCandle(val);
      setQuickInput('');
    }
  };

  const currentDateObj = new Date(currentTime);
  const timeFormatted = currentDateObj.toLocaleTimeString('pt-BR');

  // Format seconds to mm:ss
  const formatCountdown = (sec: number) => {
    if (sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top Streamlined Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-lg ${
              isPinkUpcoming
                ? 'bg-gradient-to-br from-pink-600 to-rose-600 shadow-pink-600/30'
                : 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-600/30'
            }`}
          >
            {isPinkUpcoming ? <Flame className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                MONITORAMENTO CIRÚRGICO
              </h1>
              <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Ao Vivo
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span>
                Horário: <strong className="text-white font-mono">{timeFormatted}</strong>
              </span>
              <span>•</span>
              <span>{candles.length} velas registradas</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          {/* Platform Calibration Switcher (Betão vs 973) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 pl-1.5 hidden md:inline">
              Calibração:
            </span>
            <button
              onClick={() => onSelectPlatform && onSelectPlatform('BETAO')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1 ${
                platformCalibration === 'BETAO'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Calibração oficial Spribe para o Betão (Betano)"
            >
              <span>Betão</span>
              {platformCalibration === 'BETAO' && (
                <span className="h-1.5 w-1.5 rounded-full bg-slate-950"></span>
              )}
            </button>
            <button
              onClick={() => onSelectPlatform && onSelectPlatform('973')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1 ${
                platformCalibration === '973'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Calibração oficial Spribe para o 973"
            >
              <span>973</span>
              {platformCalibration === '973' && (
                <span className="h-1.5 w-1.5 rounded-full bg-slate-950"></span>
              )}
            </button>
          </div>

          {/* Synchronize Real Table */}
          <button
            id="btn-sync-table-main"
            onClick={onOpenSyncModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-pink-500/60 bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-black text-white shadow-md shadow-pink-600/30 hover:brightness-110 transition active:scale-95 shrink-0"
            title="Sincronizar sequência real de velas da mesa"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sincronizar Mesa</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`rounded-xl border p-1.5 sm:p-2 text-xs transition shrink-0 ${
              soundEnabled
                ? 'border-slate-700 bg-slate-800 text-emerald-400'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
            title={soundEnabled ? 'Som ativado' : 'Som desativado'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Top Segmented Mode Switcher (Aviator vs Slots Assertivos vs Radar Geral) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0 w-full">
          <button
            onClick={() => {
              setActiveRadarMode('AVIATOR');
              localStorage.setItem('aviator_radar_mode', 'AVIATOR');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition shrink-0 ${
              activeRadarMode === 'AVIATOR'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>✈️</span>
            <span className="whitespace-nowrap"><span className="sm:hidden">Aviator</span><span className="hidden sm:inline">Radar Aviator (Velas)</span></span>
          </button>

          <button
            onClick={() => {
              setActiveRadarMode('SLOTS');
              localStorage.setItem('aviator_radar_mode', 'SLOTS');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition shrink-0 ${
              activeRadarMode === 'SLOTS'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🎰</span>
            <span className="whitespace-nowrap"><span className="sm:hidden">Slots</span><span className="hidden sm:inline">Slots Assertivos</span></span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
          </button>

          <button
            onClick={() => {
              setActiveRadarMode('UNIFIED');
              localStorage.setItem('aviator_radar_mode', 'UNIFIED');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition shrink-0 ${
              activeRadarMode === 'UNIFIED'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>⚡</span>
            <span className="whitespace-nowrap"><span className="sm:hidden">Radar Geral</span><span className="hidden sm:inline">Radar Geral (Ao Vivo)</span></span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 pr-2 shrink-0">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>Avisos no segundo exato com beeps e voz</span>
        </div>
      </div>

      {/* Quick Slots Assertive Alert Banner (Visible when on Aviator mode) */}
      {activeRadarMode === 'AVIATOR' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🐯</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  Próxima Entrada de Slot Assertivo
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  98.4% de Assertividade
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Fortune Tiger • Disparo no segundo exato • 10x Normal e 10x Turbo (Alternado)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveRadarMode('SLOTS');
              localStorage.setItem('aviator_radar_mode', 'SLOTS');
            }}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20"
          >
            <span>Abrir Radar de Slots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* When in SLOTS mode: Render Assertive Slots Tracker */}
      {activeRadarMode === 'SLOTS' && (
        <AssertiveSlotsTracker
          soundEnabled={soundEnabled}
          notificationSettings={notificationSettings}
          onSendInstantAlert={onSendInstantAlert}
        />
      )}

      {/* When in AVIATOR or UNIFIED mode: Render Aviator Monitoring Grid */}
      {(activeRadarMode === 'AVIATOR' || activeRadarMode === 'UNIFIED') && (
        <div className="max-w-3xl mx-auto w-full space-y-3.5">
          
          {/* ========================================================================= */}
          {/* CARD 1: RESULTADO DA MESA - ÚLTIMA VELA QUE ACABOU DE SAIR (HORA, MINUTO E SEGUNDO) */}
          {/* ========================================================================= */}
          <div
            className={`rounded-2xl border p-3 sm:p-4 shadow-lg transition-all ${
              isLastCandlePink
                ? 'border-pink-500/70 bg-gradient-to-r from-pink-950/80 to-slate-900 shadow-pink-500/15'
                : isLastCandlePurple
                ? 'border-purple-500/70 bg-gradient-to-r from-purple-950/80 to-slate-900 shadow-purple-500/15'
                : 'border-blue-700/60 bg-gradient-to-r from-blue-950/70 to-slate-900 shadow-blue-500/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 sm:pb-2.5">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-300 truncate">
                  Resultado da Mesa • Última Vela
                </span>
                <span className="rounded bg-pink-500/20 border border-pink-500/30 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-mono font-black text-pink-300 shrink-0">
                  H:M:S
                </span>
              </div>
              
              {/* Top Clock Badge with Exact Seconds */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[11px] sm:text-xs">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400">Saída:</span>
                  <span className="font-black text-amber-300">{lastExitHourStr}:{lastExitMinStr}:</span>
                  <span className="font-black text-emerald-400">{lastExitSecStr}s</span>
                </div>
                {lastCandle && (
                  <span className="rounded-md bg-slate-800/80 px-1.5 py-0.5 sm:px-2 sm:py-1 font-mono text-[9px] sm:text-[10px] text-slate-400 shrink-0">
                    {elapsedExitText}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2.5 sm:pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                {/* Large Pill with Exact Multiplier */}
                <div
                  className={`rounded-2xl border-2 px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-2xl sm:text-4xl font-black shadow-md shrink-0 ${
                    isLastCandlePink
                      ? 'border-pink-400 bg-pink-600/30 text-pink-200 shadow-pink-500/40 animate-pulse'
                      : isLastCandlePurple
                      ? 'border-purple-400 bg-purple-600/30 text-purple-200 shadow-purple-500/40'
                      : 'border-blue-500 bg-blue-600/30 text-blue-200'
                  }`}
                >
                  {lastCandle ? `${lastCandle.multiplier.toFixed(2)}x` : '--'}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-black uppercase tracking-wide ${
                        isLastCandlePink
                          ? 'text-pink-400'
                          : isLastCandlePurple
                          ? 'text-purple-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {isLastCandlePink
                        ? '🌸 Vela Rosa Saída'
                        : isLastCandlePurple
                        ? '🟣 Vela Roxa Saída'
                        : '🔷 Vela Azul Saída'}
                    </span>
                  </div>

                  {/* Exact Exit Timing Breakdown */}
                  {lastCandle ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
                      <span className="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-0.5 font-mono text-slate-300 shrink-0">
                        🕒 <strong>{lastExitHourStr}h {lastExitMinStr}m</strong> <strong className="text-emerald-400 font-black">{lastExitSecStr}s</strong>
                      </span>
                      <span className="text-slate-400 shrink-0">
                        Minuto: <strong className="text-amber-300 font-mono">:{lastExitMinStr}</strong> • Crash: <strong className="text-emerald-400 font-mono">:{lastExitSecStr}s</strong>
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aguardando sincronização da mesa com as velas reais.
                    </p>
                  )}
                </div>
              </div>

              {/* Status info & Quick Sync Trigger */}
              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 block">
                    Ciclo da Rosa
                  </span>
                  <span className="font-mono text-xs font-black text-pink-300">
                    {statistics.roundsSinceLastPink === 0
                      ? 'Acabou de Sair'
                      : `${statistics.roundsSinceLastPink} rodadas sem`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onOpenSyncModal}
                  className="flex items-center gap-1.5 rounded-lg border border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 text-xs font-bold text-pink-300 transition shrink-0"
                  title="Calibrar resultado das mesas com a hora, minuto e segundo da última saída"
                >
                  <RefreshCw className="w-3 h-3 text-pink-400" />
                  <span>Sincronizar</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 1.5: MONITOR DE SUPER ROSA 50X+ (CALIBRADO BETÃO / 973 / SPRIBE)     */}
          {/* ========================================================================= */}
          <div className="rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-3 sm:p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                      Radar de Super Rosa 50x+ a 100x+
                    </span>
                    <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-black uppercase">
                      {platformCalibration === '973' ? 'Calibração 973' : 'Calibração Betão'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Termômetro de retenção de altas velas da Spribe
                  </p>
                </div>
              </div>

              {/* Botão de foco na 50x+ */}
              <button
                type="button"
                onClick={() => setFilterMode('SUPER_PINK_50X')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
                  filterMode === 'SUPER_PINK_50X'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{filterMode === 'SUPER_PINK_50X' ? 'Foco 50x+ Ativo' : 'Ativar Foco 50x+'}</span>
              </button>
            </div>

            {/* Grid de Estatísticas da Super Rosa */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
              {/* Rodadas sem 50x+ */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Sem 50x+
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-xl sm:text-2xl font-black text-amber-300">
                    {superPinkAnalysis ? superPinkAnalysis.roundsSinceLastSuperPink : statistics.roundsSinceLastPink}
                  </span>
                  <span className="text-[10px] text-slate-400">rodadas</span>
                </div>
                <span className="text-[9px] text-slate-400">
                  {superPinkAnalysis?.isInCriticalZone ? (
                    <b className="text-rose-400 font-bold">🚨 Zona Crítica ({superPinkAnalysis.criticalThreshold} rodadas)</b>
                  ) : (
                    `Gatilho em ${superPinkAnalysis?.criticalThreshold || 40} rodadas`
                  )}
                </span>
              </div>

              {/* Termômetro de Probabilidade */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Termômetro de Retenção
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={`font-mono text-xl sm:text-2xl font-black ${
                      (superPinkAnalysis?.probabilityScore || 0) >= 70
                        ? 'text-emerald-400'
                        : (superPinkAnalysis?.probabilityScore || 0) >= 40
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {superPinkAnalysis?.probabilityScore || 35}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-400"
                    style={{ width: `${Math.min(100, superPinkAnalysis?.probabilityScore || 35)}%` }}
                  />
                </div>
              </div>

              {/* Minutos Propícios Mapeados */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Minutos de Espelho (50x+)
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-xs sm:text-sm font-black text-pink-300 truncate">
                    {superPinkAnalysis && superPinkAnalysis.predictedMinutes.length > 0
                      ? superPinkAnalysis.predictedMinutes.map((m: number) => `:${String(m).padStart(2, '0')}`).join(', ')
                      : ':14, :28, :42'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400">
                  Espelhamento de 10 min
                </span>
              </div>

              {/* Recomendação de Mão Dupla */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Estratégia 2 Entradas
                </span>
                <div className="text-[11px] font-bold text-slate-200 mt-0.5">
                  <span className="text-emerald-400">Mão 1: 2.00x</span> • <span className="text-pink-400">Mão 2: 50.00x+</span>
                </div>
                <span className="text-[9px] text-slate-400 block">
                  Protege lucro na roxa!
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 2: PREVISÃO DO RADAR - PRÓXIMA VELA A ENTRAR COM SEGUNDO EXATO */}
          {/* ========================================================================= */}
          <div
            className={`rounded-2xl sm:rounded-3xl border-2 p-3.5 sm:p-5 shadow-xl transition-all ${
              isSuperPinkUpcoming
                ? 'border-amber-400/90 bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 shadow-amber-400/30'
                : isPinkUpcoming
                ? 'border-pink-500/80 bg-gradient-to-b from-pink-950/70 via-slate-900 to-slate-950 shadow-pink-500/20'
                : 'border-purple-500/80 bg-gradient-to-b from-purple-950/70 via-slate-900 to-slate-950 shadow-purple-500/20'
            }`}
          >
            {/* Top Selector: Alvo do Monitoramento & Controles de Áudio dos Segundos */}
            <div className="flex flex-col gap-2.5 border-b border-slate-800/80 pb-3">
              {/* Row 1: Title and Target Mode Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={`flex h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full ${
                      isShootingActive
                        ? 'bg-emerald-400 animate-ping'
                        : isSuperPinkUpcoming
                        ? 'bg-amber-400 animate-pulse'
                        : isPinkUpcoming
                        ? 'bg-pink-400 animate-pulse'
                        : 'bg-purple-400 animate-pulse'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                    Próxima Vela a Entrar
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-emerald-400" />
                    <span>Precisão Segundos</span>
                  </span>
                </div>

                {/* Focus Target Filter Tabs - 4 options: Auto, 50x+, Rosa, Roxa */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-950/90 rounded-xl p-1 border border-slate-800 w-full sm:w-auto">
                  <button
                    onClick={() => setFilterMode('AUTO')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition text-center ${
                      filterMode === 'AUTO'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="O Radar decide automaticamente o melhor alvo"
                  >
                    Automático
                  </button>
                  <button
                    onClick={() => setFilterMode('SUPER_PINK_50X')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition text-center ${
                      filterMode === 'SUPER_PINK_50X'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow shadow-amber-500/30'
                        : 'text-amber-300 hover:bg-amber-950/40'
                    }`}
                    title="Monitorar estritamente o momento da Super Rosa (50x+ a 100x+)"
                  >
                    👑 Foco 50x+
                  </button>
                  <button
                    onClick={() => setFilterMode('PINK_ONLY')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition text-center ${
                      filterMode === 'PINK_ONLY'
                        ? 'bg-pink-600 text-white shadow shadow-pink-600/30'
                        : 'text-pink-300 hover:bg-pink-950/40'
                    }`}
                    title="Monitorar estritamente o momento da Vela Rosa (10x+)"
                  >
                    🌸 Foco Rosa
                  </button>
                  <button
                    onClick={() => setFilterMode('PURPLE_ONLY')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition text-center ${
                      filterMode === 'PURPLE_ONLY'
                        ? 'bg-purple-600 text-white shadow shadow-purple-600/30'
                        : 'text-purple-300 hover:bg-purple-950/40'
                    }`}
                    title="Monitorar estritamente o momento da Vela Roxa (2x+)"
                  >
                    🟣 Foco Roxa
                  </button>
                </div>
              </div>

              {/* Sub-bar: Audio Notification & Voice for Exact Entry Seconds */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400">
                    Avisos Sonoros:
                  </span>
                  {/* Voice Button */}
                  <button
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition border ${
                      voiceAnnounceEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title="Avisar por voz os segundos exatos da entrada"
                  >
                    {voiceAnnounceEnabled ? (
                      <Mic className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3 h-3 text-slate-500" />
                    )}
                    <span>{voiceAnnounceEnabled ? 'Voz: ON' : 'Voz: OFF'}</span>
                  </button>

                  {/* Countdown Beeps Button */}
                  <button
                    onClick={handleToggleBeep}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition border ${
                      countdownBeepEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title="Tocar beeps sonoros nos segundos 5, 4, 3, 2, 1 antes do disparo"
                  >
                    <BellRing className={`w-3 h-3 ${countdownBeepEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{countdownBeepEnabled ? 'Beep: ON' : 'Beep: OFF'}</span>
                  </button>

                  <span className="text-slate-600 text-xs hidden sm:inline">•</span>

                  {/* Notify Purple Toggle */}
                  <button
                    onClick={handleToggleNotifyPurple}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition border ${
                      notifyPurpleCandles
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : 'bg-slate-900 text-slate-600 border-slate-800 line-through'
                    }`}
                    title="Ativar/desativar aviso sonoro e por voz para Velas Roxas (2x+)"
                  >
                    <span>🟣 Roxas: {notifyPurpleCandles ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Notify Pink Toggle */}
                  <button
                    onClick={handleToggleNotifyPink}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition border ${
                      notifyPinkCandles
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                        : 'bg-slate-900 text-slate-600 border-slate-800 line-through'
                    }`}
                    title="Ativar/desativar aviso sonoro e por voz para Velas Rosa (10x+)"
                  >
                    <span>🌸 Rosas 10+: {notifyPinkCandles ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Notify Super Pink Toggle */}
                  <button
                    onClick={handleToggleNotifySuperPink}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition border ${
                      notifySuperPinkCandles
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-600 border-slate-800 line-through'
                    }`}
                    title="Ativar/desativar aviso sonoro e por voz para Super Rosas (50x+)"
                  >
                    <span>👑 50x+: {notifySuperPinkCandles ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Quick Test Audio Button */}
                <button
                  onClick={handleTestAudioCountdown}
                  disabled={isTestingAudio}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 shrink-0"
                  title="Testar som de beeps e voz dos segundos agora"
                >
                  <Play className={`w-3 h-3 ${isTestingAudio ? 'animate-spin text-pink-400' : 'text-slate-400'}`} />
                  <span>{isTestingAudio ? 'Testando...' : 'Testar Áudio'}</span>
                </button>
              </div>
            </div>

            {/* Giant Target Indicator */}
            <div className="py-3 sm:py-4 text-center">
              {isSuperPinkUpcoming ? (
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/60 px-3 py-0.5 sm:px-3.5 sm:py-1 text-xs font-black text-amber-300 uppercase tracking-wide">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>ALVO PREVISTO: SUPER ROSA (50X+ A 100X+)</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-pink-400 tracking-tight">
                    SUPER ROSA 50X+
                  </h2>
                  <p className="text-base sm:text-lg font-black text-white">
                    Multiplicador <span className="text-amber-300 font-mono">50.00x+</span>
                  </p>

                  {/* Dual Strategy Badge */}
                  <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs font-bold text-slate-200 bg-slate-950/80 px-3.5 py-1.5 rounded-2xl border border-amber-500/40">
                    <span className="text-emerald-400 flex items-center gap-1">
                      🛡️ <b>Mão 1:</b> Saque 2.00x (Proteção)
                    </span>
                    <span className="hidden sm:inline text-slate-600">•</span>
                    <span className="text-amber-300 flex items-center gap-1">
                      🚀 <b>Mão 2:</b> Subir para 50.00x+
                    </span>
                  </div>
                </div>
              ) : isPinkUpcoming ? (
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 rounded-2xl bg-pink-600/20 border border-pink-500/60 px-3 py-0.5 sm:px-3.5 sm:py-1 text-xs font-black text-pink-300 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>ALVO PREVISTO: VELA ROSA (ALVO DUPLO)</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-pink-400 tracking-tight">
                    VELA ROSA 10X+
                  </h2>
                  <p className="text-base sm:text-lg font-black text-white">
                    Multiplicador <span className="text-pink-300 font-mono">10.00x+</span>
                  </p>

                  {/* Dual Strategy Badge - Specifically solves "rosa a maioria sai roxa" */}
                  <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs font-bold text-slate-200 bg-slate-950/80 px-3.5 py-1.5 rounded-2xl border border-pink-500/40">
                    <span className="text-emerald-400 flex items-center gap-1">
                      🛡️ <b>Mão 1:</b> Saque 2.00x (Segurança)
                    </span>
                    <span className="hidden sm:inline text-slate-600">•</span>
                    <span className="text-pink-300 flex items-center gap-1">
                      🚀 <b>Mão 2:</b> Deixar subir para 10.00x+
                    </span>
                  </div>
                  <p className="text-[10px] text-pink-300/80 max-w-md mx-auto">
                    ⚠️ <b>Calibrado Betão / 973:</b> A aposta 1 em 2.00x garante seu lucro se a mesa segurar na roxa intermediária!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 rounded-2xl bg-purple-600/20 border border-purple-500/60 px-3 py-0.5 sm:px-3.5 sm:py-1 text-xs font-black text-purple-300 uppercase tracking-wide">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>ALVO PREVISTO: VELA ROXA</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-purple-400 tracking-tight">
                    VELA ROXA
                  </h2>
                  <p className="text-base sm:text-lg font-black text-white">
                    Multiplicador <span className="text-purple-300 font-mono">2.00x a 3.50x</span>
                  </p>
                  <span className="inline-block text-[11px] sm:text-xs font-semibold text-purple-200/90 bg-purple-950/60 px-2.5 sm:px-3 py-0.5 rounded-full border border-purple-500/30">
                    Saque seguro no alvo exato de 2.00x
                  </span>
                </div>
              )}
            </div>

            {/* Crucial Parameters Box: Exact Minute & EXACT ENTRY SECOND & Countdown */}
            {/* Responsive: 2-column + full-width countdown on mobile; 3-column on tablet/desktop */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/90 p-2.5 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {/* Col 1: Target Minute */}
                <div className="space-y-1 border-r border-slate-800/80 pr-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Minuto</span>
                  </span>
                  <div className="flex items-baseline">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-amber-300">
                      :{targetMinute}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block font-mono">
                    {exactTargetTime}
                  </span>
                </div>

                {/* Col 2: EXACT ENTRY SECOND */}
                <div className="space-y-1 sm:border-r border-slate-800/80 sm:px-2 bg-slate-900/50 sm:bg-transparent rounded-lg p-1.5 sm:p-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 text-emerald-400">
                    <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                    <span>Segundo</span>
                  </span>
                  <div className="flex items-baseline">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
                      :{targetSecondStr}s
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 block">
                    Janela {secondWindow}
                  </span>
                </div>

                {/* Col 3: Live Countdown (Takes full-width on mobile row 2; column 3 on desktop) */}
                <div className="col-span-2 sm:col-span-1 space-y-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 sm:text-right sm:pl-2 flex sm:block items-center justify-between">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center sm:justify-end gap-1">
                      <Timer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Contagem</span>
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold block sm:hidden">
                      {isShootingActive ? '🎯 Entrada Liberada' : `Faltam ${Math.max(0, secondsLeft)}s`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono text-2xl sm:text-3xl font-black ${
                        isShootingActive
                          ? 'text-emerald-400 animate-pulse'
                          : isCriticalCountdown
                          ? 'text-rose-400 animate-ping'
                          : isPreparing
                          ? 'text-amber-400'
                          : 'text-white'
                      }`}
                    >
                      {isShootingActive ? 'AGORA!' : formatCountdown(Math.max(0, secondsLeft))}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                      {isShootingActive ? '🎯 Aberta' : `${Math.max(0, secondsLeft)}s restantes`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Seconds Progress Ruler (60 seconds cycle) */}
            <div className="mt-3 rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 font-semibold">
                <span>Segundo Atual: <b className="text-white font-mono">:{String(currentSecondInMinute).padStart(2, '0')}s</b></span>
                <span className="text-emerald-400 font-black">
                  🎯 Disparo no segundo: <b className="font-mono">:{targetSecondStr}s</b>
                </span>
              </div>

              {/* Seconds Ruler Bar */}
              <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                {/* Progress bar up to current second */}
                <div
                  className="h-full bg-gradient-to-r from-slate-700 via-purple-600 to-pink-500 transition-all duration-300"
                  style={{ width: `${(currentSecondInMinute / 60) * 100}%` }}
                />
                {/* Marker at target second */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] z-10"
                  style={{ left: `calc(${(targetSecond / 60) * 100}% - 3px)` }}
                  title={`Segundo do Tiro: :${targetSecondStr}s`}
                />
              </div>

              <div className="flex justify-between text-[8px] font-mono text-slate-600 px-0.5">
                <span>:00s</span>
                <span>:15s</span>
                <span>:30s</span>
                <span>:45s</span>
                <span>:59s</span>
              </div>
            </div>

            {/* DYNAMIC SECOND-BY-SECOND CRITICAL STATUS BANNERS */}
            <div className="mt-3">
              {isShootingActive ? (
                /* Disparo ativado no segundo exato */
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-3 sm:p-3.5 text-slate-950 font-black text-center shadow-lg shadow-emerald-500/40 animate-bounce">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>🎯 SEGUNDO EXATO ATINGIDO (:{targetSecondStr}s)! ENTRAR AGORA!</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    Aposta aberta no Aviator •{' '}
                    {isSuperPinkUpcoming
                      ? 'Mão 1: Saque 2.00x | Mão 2: Deixar subir para 50.00x+'
                      : isPinkUpcoming
                      ? 'Mão 1: Saque Proteção 2.00x | Mão 2: Buscar 10.00x+'
                      : 'Saque programado em 2.00x'}
                  </p>
                </div>
              ) : secondsLeft <= 5 && secondsLeft > 0 ? (
                /* Contagem regressiva crítica dos 5 segundos finais */
                <div className="rounded-2xl bg-rose-600/30 border-2 border-rose-500 p-3 text-center shadow-lg shadow-rose-600/30 animate-pulse">
                  <div className="flex items-center justify-center gap-2 text-rose-300 font-black text-xs sm:text-sm uppercase">
                    <BellRing className="w-5 h-5 text-rose-400 animate-bounce shrink-0" />
                    <span>🚨 CONTAGEM FINAL: {secondsLeft} SEGUNDOS PARA O TIRO!</span>
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-black text-white mt-1">
                    DISPARO NO SEGUNDO :{targetSecondStr}s (
                    {isSuperPinkUpcoming
                      ? '👑 SUPER ROSA 50X+'
                      : isPinkUpcoming
                      ? '🌸 VELA ROSA'
                      : '🟣 VELA ROXA'}
                    )
                  </div>
                  <p className="text-[11px] font-bold text-rose-200 mt-0.5">
                    Mão no botão de aposta! Beep e voz ativos.
                  </p>
                </div>
              ) : isPreparing ? (
                /* Preparação quando faltam <= 35s */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 p-2.5 text-amber-300 text-xs font-black uppercase tracking-wide">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin shrink-0" />
                    <span>PREPARAR APOSTA PARA O SEGUNDO :{targetSecondStr}s</span>
                  </div>
                  <span className="font-mono font-bold bg-amber-500/30 px-2 py-0.5 rounded-lg shrink-0 text-center">
                    Faltam {secondsLeft}s
                  </span>
                </div>
              ) : (
                /* Standby aguardando aproximação */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-2xl bg-slate-900 border border-slate-800 p-2 text-slate-400 font-bold text-xs">
                  <span>Aguardando aproximação do minuto :{targetMinute}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Disparo programado aos :{targetSecondStr}s
                  </span>
                </div>
              )}
            </div>

            {/* Reason Footnote */}
            <div className="mt-3 border-t border-slate-800/80 pt-2 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
              <p className="break-words min-w-0">
                {nextTarget
                  ? `Previsão: Padrão ${nextTarget.interval}M a partir da vela de ${nextTarget.sourceMultiplier.toFixed(2)}x. Disparo programado aos :${targetSecondStr}s (Janela ${secondWindow}).`
                  : currentSignal.triggerReason}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3: FITA DE VELAS DA MESA & REGISTRO RÁPIDO */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                  Velas Saídas da Mesa
                </span>
                <span className="text-[10px] text-slate-500">
                  (◄ Esquerda = Mais Recente)
                </span>
              </div>
              <button
                onClick={onRemoveLastCandle}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition"
                title="Desfazer última vela adicionada"
              >
                <Undo2 className="w-3 h-3" />
                <span>Desfazer</span>
              </button>
            </div>

            {/* Candle bubbles horizontal strip with clear "ÚLTIMA" badge */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
              {candles.slice(0, 12).map((c, index) => {
                const isFirst = index === 0;
                return (
                  <div key={`tape-${c.id}`} className="shrink-0 flex flex-col items-center">
                    <span
                      className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-black transition-all ${
                        c.color === 'pink'
                          ? 'border-pink-400 bg-pink-950 text-pink-200 shadow-sm shadow-pink-500/40 ring-1 ring-pink-500/50'
                          : c.color === 'purple'
                          ? 'border-purple-400 bg-purple-950 text-purple-200 ring-1 ring-purple-500/40'
                          : 'border-blue-700 bg-blue-950 text-blue-300'
                      }`}
                    >
                      {c.multiplier.toFixed(2)}x
                    </span>
                    {isFirst ? (
                      <div className="flex flex-col items-center mt-1">
                        <span className="text-[9px] font-black text-amber-400 flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          ÚLTIMA
                        </span>
                        <span className="font-mono text-[9px] font-bold text-amber-300">
                          {new Date(c.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-500 mt-1 font-mono" title={`Saída às ${new Date(c.timestamp).toLocaleTimeString()}`}>
                        :{String(new Date(c.timestamp).getMinutes()).padStart(2, '0')}:{String(new Date(c.timestamp).getSeconds()).padStart(2, '0')}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fast 1-Click Tap Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold">
                  Adicionar saída rápida:
                </span>
                {/* Number Input */}
                <form onSubmit={handleQuickAdd} className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Valor ex: 3.45"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    className="w-24 sm:w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-pink-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-pink-500 flex items-center gap-1"
                    title="Adicionar multiplicador digitado"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </form>
              </div>

              {/* 3 Quick 1-Click Category Buttons spanning full width */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onAddCandle(1.20)}
                  className="rounded-lg border border-blue-800 bg-blue-950/70 py-1.5 px-1 font-mono text-xs font-bold text-blue-300 hover:bg-blue-900 transition text-center"
                  title="Adicionar vela azul"
                >
                  + Azul (1.20x)
                </button>
                <button
                  type="button"
                  onClick={() => onAddCandle(2.20)}
                  className="rounded-lg border border-purple-800 bg-purple-950/70 py-1.5 px-1 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900 transition text-center"
                  title="Adicionar vela roxa"
                >
                  + Roxa (2.20x)
                </button>
                <button
                  type="button"
                  onClick={() => onAddCandle(12.50)}
                  className="rounded-lg border border-pink-700 bg-pink-950/70 py-1.5 px-1 font-mono text-xs font-black text-pink-200 hover:bg-pink-900 transition shadow-sm text-center"
                  title="Adicionar vela rosa"
                >
                  + Rosa (12.50x)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* When in UNIFIED mode: Render Assertive Slots Tracker right below Aviator */}
      {activeRadarMode === 'UNIFIED' && (
        <div className="pt-2 border-t border-slate-800/80">
          <AssertiveSlotsTracker
            soundEnabled={soundEnabled}
            notificationSettings={notificationSettings}
            onSendInstantAlert={onSendInstantAlert}
          />
        </div>
      )}
    </div>
  );
};
