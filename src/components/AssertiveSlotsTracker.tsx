import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AssertiveSlotSignal,
  NotificationSettings,
  SlotGameId,
} from '../types';
import {
  SUPPORTED_SLOTS,
  generateAssertiveSlotSignal,
  formatSlotTelegramMessage,
} from '../utils/slotsCalculator';
import {
  playCountdownBeep,
  playTriggerNowSound,
  playSlotJackpotAlertSound,
  speakExactSecondsAlert,
  speakSlotAssertiveAlert,
} from '../utils/audio';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Crosshair,
  Flame,
  Gamepad2,
  Mic,
  MicOff,
  Play,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react';

interface AssertiveSlotsTrackerProps {
  soundEnabled: boolean;
  notificationSettings: NotificationSettings;
  onSendInstantAlert?: (title: string, message: string) => Promise<void>;
}

export const AssertiveSlotsTracker: React.FC<AssertiveSlotsTrackerProps> = ({
  soundEnabled,
  notificationSettings,
  onSendInstantAlert,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<SlotGameId>('fortune-tiger');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [signalsMap, setSignalsMap] = useState<Record<SlotGameId, AssertiveSlotSignal>>(() => {
    const map = {} as Record<SlotGameId, AssertiveSlotSignal>;
    SUPPORTED_SLOTS.forEach((slot, idx) => {
      map[slot.id] = generateAssertiveSlotSignal(slot.id, idx === 0 ? 1 : idx + 1);
    });
    return map;
  });

  // Audio & Voice toggles for Slots
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aviator_slots_voice') !== 'false';
  });
  const [beepEnabled, setBeepEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aviator_slots_beep') !== 'false';
  });
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const lastBeepedSecondRef = useRef<number | null>(null);
  const lastVoiceStepRef = useRef<string>('');

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update secondsRemaining and auto-recycle expired signals
  useEffect(() => {
    setSignalsMap((prev) => {
      let changed = false;
      const updated = { ...prev };

      Object.keys(updated).forEach((key) => {
        const gid = key as SlotGameId;
        const current = updated[gid];
        if (!current) return;

        // Parse target time
        const targetSec = current.targetSecond;
        const now = new Date();
        const curMin = now.getMinutes();
        const curSec = now.getSeconds();

        let diffMin = (current.targetMinute - curMin + 60) % 60;
        if (diffMin > 30) diffMin -= 60; // if target was in the past

        const diffSeconds = diffMin * 60 + (targetSec - curSec);

        // If expired for more than 150 seconds, regenerate next window
        if (diffSeconds < -150) {
          updated[gid] = generateAssertiveSlotSignal(gid, 2);
          changed = true;
        } else if (current.secondsRemaining !== diffSeconds) {
          updated[gid] = {
            ...current,
            secondsRemaining: diffSeconds,
            status:
              diffSeconds <= 0 && diffSeconds >= -150
                ? 'ACTIVE_NOW'
                : diffSeconds <= 30
                ? 'PREPARE'
                : 'WAITING',
          };
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [currentTime]);

  const activeSignal = signalsMap[selectedGameId] || generateAssertiveSlotSignal(selectedGameId, 1);
  const activeConfig = SUPPORTED_SLOTS.find((s) => s.id === selectedGameId) || SUPPORTED_SLOTS[0];

  const secondsLeft = activeSignal.secondsRemaining;
  const isShootingActive = secondsLeft <= 0 && secondsLeft >= -150;
  const isPreparing = secondsLeft > 0 && secondsLeft <= 30;
  const isCriticalCountdown = secondsLeft > 0 && secondsLeft <= 5;

  const currentSecondInMinute = new Date(currentTime).getSeconds();

  // Audio Alerts and Voice Triggers for Slots
  useEffect(() => {
    if (!soundEnabled) return;

    const sec = activeSignal.secondsRemaining;

    // Beeps at seconds 5, 4, 3, 2, 1
    if (beepEnabled && sec >= 1 && sec <= 5) {
      if (lastBeepedSecondRef.current !== sec) {
        lastBeepedSecondRef.current = sec;
        playCountdownBeep(sec);
      }
    }

    // Trigger instant chime & announcement at second 0
    if (sec === 0 && lastBeepedSecondRef.current !== 0) {
      lastBeepedSecondRef.current = 0;
      playSlotJackpotAlertSound();
      playTriggerNowSound();
      if (voiceEnabled) {
        speakExactSecondsAlert(
          `Entrada no ${activeSignal.gameName} agora no segundo ${String(activeSignal.targetSecond).padStart(2, '0')}! Inicie os ${activeSignal.normalSpins} giros normais e ${activeSignal.turboSpins} giros turbo!`
        );
      }
    }

    // Voice announcement at milestone (15 seconds before entry)
    if (voiceEnabled) {
      if (sec === 15 && lastVoiceStepRef.current !== `${activeSignal.id}-15`) {
        lastVoiceStepRef.current = `${activeSignal.id}-15`;
        speakSlotAssertiveAlert(
          activeSignal.gameName,
          activeSignal.targetMinute,
          activeSignal.targetSecond,
          activeSignal.alternatingPattern
        );
      }
    }
  }, [
    activeSignal.secondsRemaining,
    activeSignal.id,
    activeSignal.gameName,
    activeSignal.targetMinute,
    activeSignal.targetSecond,
    activeSignal.normalSpins,
    activeSignal.turboSpins,
    activeSignal.alternatingPattern,
    soundEnabled,
    beepEnabled,
    voiceEnabled,
  ]);

  const handleToggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    localStorage.setItem('aviator_slots_voice', String(nextVal));
    if (nextVal) {
      speakExactSecondsAlert('Voz de alertas de slots ativada.');
    }
  };

  const handleToggleBeep = () => {
    const nextVal = !beepEnabled;
    setBeepEnabled(nextVal);
    localStorage.setItem('aviator_slots_beep', String(nextVal));
    if (nextVal) {
      playCountdownBeep(3);
    }
  };

  const handleTestAudio = () => {
    if (isTestingAudio) return;
    setIsTestingAudio(true);
    playCountdownBeep(3);
    setTimeout(() => playCountdownBeep(2), 350);
    setTimeout(() => playCountdownBeep(1), 700);
    setTimeout(() => {
      playSlotJackpotAlertSound();
      if (voiceEnabled) {
        speakSlotAssertiveAlert(
          activeSignal.gameName,
          activeSignal.targetMinute,
          activeSignal.targetSecond,
          activeSignal.alternatingPattern
        );
      }
      setIsTestingAudio(false);
    }, 1100);
  };

  const handleRegenerateSignal = () => {
    const newSignal = generateAssertiveSlotSignal(selectedGameId, 2);
    setSignalsMap((prev) => ({ ...prev, [selectedGameId]: newSignal }));
  };

  const handleSendTelegramNow = async () => {
    if (!notificationSettings.telegram.enabled || !notificationSettings.telegram.botToken) {
      setTelegramStatus('Configure o bot do Telegram nas configurações');
      setTimeout(() => setTelegramStatus(null), 3500);
      return;
    }

    setIsSendingTelegram(true);
    setTelegramStatus(null);

    const messageText = formatSlotTelegramMessage(activeSignal);

    try {
      if (onSendInstantAlert) {
        await onSendInstantAlert(
          `🎰 Sinal Assertivo: ${activeSignal.gameName} ${activeSignal.gameEmoji}`,
          messageText
        );
        setTelegramStatus('Sinal enviado ao Telegram com sucesso!');
      } else {
        const res = await fetch('/api/notify/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: notificationSettings.telegram.botToken,
            chatId: notificationSettings.telegram.chatId,
            message: messageText,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setTelegramStatus('Sinal enviado com sucesso!');
        } else {
          setTelegramStatus('Erro ao enviar sinal');
        }
      }
    } catch {
      setTelegramStatus('Falha no envio');
    } finally {
      setIsSendingTelegram(false);
      setTimeout(() => setTelegramStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Game Selector Carousel */}
      <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Radar de Slots Assertivos
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  PG Soft & Pragmatic
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Minutagens pagantes com segundo exato de disparo e estratégia de giros
              </p>
            </div>
          </div>

          {/* Audio & Voice Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleToggleVoice}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition border ${
                voiceEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Avisar por voz o momento da entrada nos slots"
            >
              {voiceEnabled ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{voiceEnabled ? 'Voz Slots: ON' : 'Voz: OFF'}</span>
            </button>

            <button
              onClick={handleToggleBeep}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition border ${
                beepEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Tocar beeps progressivos no countdown dos segundos"
            >
              <BellRing className={`w-3.5 h-3.5 ${beepEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{beepEnabled ? 'Beep: ON' : 'Beep: OFF'}</span>
            </button>

            <button
              onClick={handleTestAudio}
              disabled={isTestingAudio}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
              title="Testar som do jackpot e voz do slot"
            >
              <Play className={`w-3.5 h-3.5 ${isTestingAudio ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{isTestingAudio ? 'Testando...' : 'Testar Áudio'}</span>
            </button>
          </div>
        </div>

        {/* Slot Game Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {SUPPORTED_SLOTS.map((slot) => {
            const isSelected = selectedGameId === slot.id;
            const sig = signalsMap[slot.id];
            const isHot = sig && sig.secondsRemaining <= 60 && sig.secondsRemaining >= -60;

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedGameId(slot.id)}
                className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">{slot.emoji}</span>
                <div className="text-left">
                  <span className="block leading-none">{slot.name}</span>
                  <span className="text-[9px] font-mono text-slate-400">
                    :{String(sig?.targetMinute || 0).padStart(2, '0')}:
                    {String(sig?.targetSecond || 0).padStart(2, '0')}s
                  </span>
                </div>
                {isHot && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Assertive Slot Entry Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 p-5 shadow-2xl shadow-amber-500/10">
        {/* Top Header of Active Slot */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="text-4xl sm:text-5xl">{activeSignal.gameEmoji}</div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeSignal.gameName}
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {activeSignal.provider}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-semibold mt-0.5">
                Alvo de Bônus: <span className="text-white">{activeSignal.bonusFeature}</span>
              </p>
            </div>
          </div>

          {/* Assertiveness Badge */}
          <div className="flex items-center gap-2 bg-slate-950/90 rounded-2xl p-2.5 border border-slate-800">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Assertividade do Radar
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {activeSignal.assertiveness}%
              </span>
            </div>
          </div>
        </div>

        {/* Big Parameters Grid: Minute, Exact Second, Countdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
          {/* Col 1: Target Minute */}
          <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-2 sm:pb-0 sm:pr-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Minuto Pagante</span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl sm:text-4xl font-black text-amber-300">
                :{String(activeSignal.targetMinute).padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-400">min</span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              Horário: {activeSignal.targetTimeFormatted}
            </span>
          </div>

          {/* Col 2: EXACT ENTRY SECOND */}
          <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-2 sm:pb-0 sm:px-3 bg-slate-900/40 rounded-xl p-2 sm:p-0">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Segundo Exato do Slot</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PRECISÃO
              </span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                :{String(activeSignal.targetSecond).padStart(2, '0')}s
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-300/90 block truncate" title={`Janela: ${activeSignal.secondWindow}`}>
              Janela: {activeSignal.secondWindow}
            </span>
          </div>

          {/* Col 3: Countdown */}
          <div className="space-y-1 sm:text-right sm:pl-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center sm:justify-end gap-1">
              <Timer className="w-3.5 h-3.5 text-rose-400" />
              <span>Contagem Regressiva</span>
            </span>
            <div className="flex items-baseline sm:justify-end gap-1">
              <span
                className={`font-mono text-3xl sm:text-4xl font-black ${
                  isShootingActive
                    ? 'text-emerald-400 animate-pulse'
                    : isCriticalCountdown
                    ? 'text-rose-400 animate-ping'
                    : isPreparing
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {isShootingActive ? 'GIRAR AGORA!' : `${Math.max(0, secondsLeft)}s`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block">
              {isShootingActive
                ? '🎯 Janela de giros aberta!'
                : `Faltam ${Math.max(0, secondsLeft)} segundos para o tiro`}
            </span>
          </div>
        </div>

        {/* 60 Seconds Dynamic Cycle Ruler */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 space-y-1.5 my-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
            <span>Segundo Atual do Relógio: <b className="text-white font-mono">:{String(currentSecondInMinute).padStart(2, '0')}s</b></span>
            <span className="text-emerald-400 font-black">
              🎯 Disparo no segundo: <b className="font-mono">:{String(activeSignal.targetSecond).padStart(2, '0')}s</b>
            </span>
          </div>

          {/* Progress ruler */}
          <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-orange-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(currentSecondInMinute / 60) * 100}%` }}
            />
            {/* Target Second pin */}
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] z-10"
              style={{ left: `calc(${(activeSignal.targetSecond / 60) * 100}% - 3px)` }}
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

        {/* Dynamic Status Action Banner */}
        <div className="my-3">
          {isShootingActive ? (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-3.5 text-slate-950 font-black text-center shadow-lg shadow-emerald-500/40 animate-bounce">
              <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>🎯 ENTRADA CONFIRMADA AGORA NO SEGUNDO :{String(activeSignal.targetSecond).padStart(2, '0')}s!</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Inicie os giros no {activeSignal.gameName}: {activeSignal.normalSpins}x Normal e {activeSignal.turboSpins}x Turbo! Válido até {activeSignal.validUntilFormatted}
              </p>
            </div>
          ) : isCriticalCountdown ? (
            <div className="rounded-2xl bg-rose-600/30 border-2 border-rose-500 p-3 text-center shadow-lg shadow-rose-600/30 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-rose-300 font-black text-sm uppercase">
                <BellRing className="w-5 h-5 text-rose-400 animate-bounce" />
                <span>🚨 CONTAGEM FINAL: {secondsLeft} SEGUNDOS PARA A ENTRADA!</span>
              </div>
              <div className="font-mono text-2xl font-black text-white mt-1">
                DISPARO NO SEGUNDO :{String(activeSignal.targetSecond).padStart(2, '0')}s DO {activeSignal.gameName.toUpperCase()}
              </div>
            </div>
          ) : isPreparing ? (
            <div className="flex items-center justify-between rounded-2xl bg-amber-500/20 border border-amber-500/50 p-2.5 text-amber-300 text-xs font-black uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>PREPARAR APOSTA PARA O SEGUNDO :{String(activeSignal.targetSecond).padStart(2, '0')}s</span>
              </div>
              <span className="font-mono font-bold bg-amber-500/30 px-2 py-0.5 rounded-lg">
                Faltam {secondsLeft}s
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 border border-slate-800 p-2.5 text-slate-400 font-bold text-xs">
              <span>Aguardando minutagem pagante :{String(activeSignal.targetMinute).padStart(2, '0')}</span>
              <span className="font-mono text-[11px] text-slate-500">
                Disparo aos :{String(activeSignal.targetSecond).padStart(2, '0')}s
              </span>
            </div>
          )}
        </div>

        {/* Assertive Spins Strategy Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Estratégia Assertiva de Giros</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Válido até: <b>{activeSignal.validUntilFormatted}</b>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Giros Normais</span>
              <span className="text-xl font-black text-white font-mono">{activeSignal.normalSpins}x</span>
              <span className="text-[9px] text-slate-500 block">Manual lento</span>
            </div>

            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Giros Turbo</span>
              <span className="text-xl font-black text-amber-400 font-mono">{activeSignal.turboSpins}x</span>
              <span className="text-[9px] text-slate-500 block">Velocidade alta</span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Padrão Recomendado</span>
              <span className="text-xs font-black text-emerald-400 leading-tight">Alternado</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Troca de rotação</span>
            </div>
          </div>

          {/* Strategy Tip */}
          <div className="flex items-start gap-2 pt-1 border-t border-slate-800/80 text-xs text-slate-300">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <b>Gatilho Assertivo:</b> {activeSignal.strategyTip}
            </p>
          </div>
        </div>

        {/* Footer Actions: Telegram Dispatch & Regenerate */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTelegramNow}
              disabled={isSendingTelegram}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white transition shadow-lg shadow-sky-600/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTelegram ? 'Enviando...' : 'Enviar Sinal ao Telegram'}</span>
            </button>

            <button
              onClick={handleRegenerateSignal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
              title="Calcular nova janela pagante"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Nova Janela</span>
            </button>
          </div>

          {telegramStatus && (
            <span className="text-xs font-bold text-emerald-400 animate-pulse">
              {telegramStatus}
            </span>
          )}
        </div>
      </div>

      {/* Grid of All Upcoming Assertive Slots */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Fila de Minutagens Pagantes de Todos os Slots</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SUPPORTED_SLOTS.map((slot) => {
            const sig = signalsMap[slot.id];
            const isCurrentSelected = slot.id === selectedGameId;
            const secRemaining = sig ? sig.secondsRemaining : 120;
            const isActive = secRemaining <= 0 && secRemaining >= -120;

            return (
              <div
                key={slot.id}
                onClick={() => setSelectedGameId(slot.id)}
                className={`cursor-pointer rounded-2xl border p-3 transition-all ${
                  isCurrentSelected
                    ? 'border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{slot.emoji}</span>
                    <span className="text-xs font-black text-white truncate">{slot.name}</span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-400 font-mono">
                    {slot.baseAssertiveness}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[10px] text-slate-400">Entrada:</span>
                  <span className="font-mono font-bold text-white">
                    :{String(sig?.targetMinute || 0).padStart(2, '0')}:
                    {String(sig?.targetSecond || 0).padStart(2, '0')}s
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Contagem:</span>
                  <span
                    className={`font-mono font-black ${
                      isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-300'
                    }`}
                  >
                    {isActive ? 'AGORA!' : `${Math.max(0, secRemaining)}s`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
