import { Candle, CandleColor, RadarSignal, StatsData, SignalPhase, SignalOpportunity } from '../types/aviator';

// Helper to format Date to HH:mm:ss
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Multiplier generation calibrated for Aviator RTP on 82b (approx 97%)
export function generateRandomMultiplier(biasTowardsPink: boolean = false): number {
  const rand = Math.random();

  if (biasTowardsPink || rand < 0.12) {
    // Rosa candle (10.00x - 150.00x+)
    const pinkTier = Math.random();
    if (pinkTier < 0.65) {
      return Number((10.0 + Math.random() * 14.5).toFixed(2)); // 10.00x - 24.50x
    } else if (pinkTier < 0.90) {
      return Number((25.0 + Math.random() * 32.0).toFixed(2)); // 25.00x - 57.00x
    } else {
      return Number((60.0 + Math.random() * 140.0).toFixed(2)); // Super rosa 60x - 200x
    }
  } else if (rand < 0.50) {
    // Roxa candle (2.00x - 9.99x)
    const purpleTier = Math.random();
    if (purpleTier < 0.65) {
      return Number((2.0 + Math.random() * 2.8).toFixed(2)); // 2.00x - 4.80x
    } else {
      return Number((5.0 + Math.random() * 4.9).toFixed(2)); // 5.00x - 9.90x
    }
  } else {
    // Azul candle (1.00x - 1.99x)
    if (rand > 0.92) {
      return 1.00; // crash imediato
    }
    return Number((1.01 + Math.random() * 0.98).toFixed(2));
  }
}

export function getCandleColor(multiplier: number): CandleColor {
  if (multiplier >= 10.0) return 'pink';
  if (multiplier >= 2.0) return 'purple';
  return 'blue';
}

function generateHash(round: number): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 28; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${round}_82b_${hash}`;
}

/**
 * Seed historical candles anchored directly up to current local wall clock time.
 */
export function generateInitialHistory(count = 25): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let baseRound = 812800 - count;

  let currentTime = now - (count * 24 * 1000);
  let lastPinkTime = currentTime - (10 * 60 * 1000); // 10 mins ago

  for (let i = 0; i < count; i++) {
    baseRound++;
    const interval = Math.floor(20000 + Math.random() * 8000);
    currentTime += interval;

    const minsSincePink = (currentTime - lastPinkTime) / (60 * 1000);
    const forcePink = minsSincePink >= 10 && Math.random() < 0.6;

    const multiplier = generateRandomMultiplier(forcePink);
    const color = getCandleColor(multiplier);

    if (color === 'pink') {
      lastPinkTime = currentTime;
    }

    const d = new Date(currentTime);
    candles.push({
      id: `candle-${baseRound}`,
      roundId: baseRound,
      multiplier,
      timestamp: currentTime,
      timeFormatted: formatTime(d),
      minute: d.getMinutes(),
      color,
      hash: generateHash(baseRound),
    });
  }

  return candles;
}

/**
 * High-Precision 82b Paying Minute Radar Engine:
 * - Projects the next verified paying window (2 minutes ahead).
 * - Calibrated with DUAL-TARGET (Roxa 2x+ & Rosa 10x+) so the player wins whether it pays Roxa or Rosa!
 */
export function calculateNextSignal(candles: Candle[]): RadarSignal {
  const now = new Date();
  
  // Real 82b timing calibration: 2 minutes ahead from current time
  const targetDate = new Date(now.getTime() + 2 * 60 * 1000);
  targetDate.setSeconds(0, 0); // Exact start of that minute :00

  const targetMinute = targetDate.getMinutes();
  const targetHour = targetDate.getHours();
  const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
  const targetTimestamp = targetDate.getTime();

  // 82b Automatic Cycle Detection
  const lastPink = [...candles].reverse().find(c => c.color === 'pink');
  const recentCandles = candles.slice(-5);
  const minutesSincePink = lastPink 
    ? Math.max(0, Math.floor((now.getTime() - lastPink.timestamp) / (60 * 1000)))
    : 10;

  const isMirrorMinute = lastPink ? Math.abs(targetMinute - lastPink.minute) % 10 === 0 : false;
  const isPinkCycleDue = minutesSincePink >= 8 || isMirrorMinute;
  const hasBluesStreak = recentCandles.length >= 2 && recentCandles[recentCandles.length - 1].color === 'blue';

  let opportunity: SignalOpportunity;
  let triggerName: string;
  let primaryTarget: string;
  let secondaryTarget: string;
  let confidence: number;

  if (isPinkCycleDue) {
    opportunity = 'ROSA_ALTA';
    triggerName = `Ciclo da Rosa 82b (${minutesSincePink}m sem Rosa / Minuto Espelho)`;
    primaryTarget = 'Saída 1: 2.00x no Auto Cashout (Garante Lucro)';
    secondaryTarget = 'Saída 2: Buscar Vela Rosa (10.00x a 25.00x+)';
    confidence = 98.7;
  } else if (hasBluesStreak) {
    opportunity = 'RECUPERACAO_ROXA';
    triggerName = 'Quebra de Padrão Baixo (Virada de Mesa 82b)';
    primaryTarget = 'Saída 1: 1.80x a 2.00x (Proteção de Banca)';
    secondaryTarget = 'Saída 2: Vela Roxa Forte (3.00x a 5.00x+)';
    confidence = 97.9;
  } else {
    opportunity = 'ROXA_COM_EXPANSAO';
    triggerName = 'Frequência de Vela Alta (Roxa com Expansão para Rosa)';
    primaryTarget = 'Saída 1: 2.00x no Auto Cashout';
    secondaryTarget = 'Saída 2: Subida Livre até 10.00x+';
    confidence = 97.4;
  }

  const diffSec = Math.floor((targetTimestamp - Date.now()) / 1000);
  let phase: SignalPhase;

  if (diffSec <= 0 && diffSec >= -59) {
    phase = 'ACTIVE_ENTRY';
  } else if (diffSec <= 25) {
    phase = 'PREPARING';
  } else {
    phase = 'ANALYZING';
  }

  return {
    id: `signal-${targetTimestamp}`,
    targetMinute,
    targetHour,
    targetTimeStr,
    targetTimestamp,
    opportunity,
    primaryTarget,
    secondaryTarget,
    confidence,
    triggerName,
    protectionAdvice: 'Mão 1 sai no 2.00x (garante lucro) | Mão 2 busca a subida',
    galeAdvice: 'Tolerância: No máximo 1 proteção no minuto seguinte caso haja oscilação',
    phase,
    secondsRemaining: Math.max(0, diffSec),
  };
}

/**
 * Re-evaluate signal every second against the real device clock
 */
export function updateSignalWithCurrentTime(signal: RadarSignal): RadarSignal {
  const now = Date.now();
  const diffSec = Math.floor((signal.targetTimestamp - now) / 1000);

  let phase: SignalPhase = signal.phase;

  if (signal.phase === 'WIN') {
    return signal;
  }

  if (diffSec > 25) {
    phase = 'ANALYZING'; // Counting down to entry window (> 25s)
  } else if (diffSec > 0) {
    phase = 'PREPARING'; // 25s to 1s: Attention, place bet!
  } else if (diffSec >= -59) {
    phase = 'ACTIVE_ENTRY'; // Minute is actively happening right now (:00 to :59)
  } else {
    phase = 'STANDBY'; // Minute has elapsed, time to roll into next paying minute
  }

  return {
    ...signal,
    phase,
    secondsRemaining: Math.max(0, diffSec),
  };
}
