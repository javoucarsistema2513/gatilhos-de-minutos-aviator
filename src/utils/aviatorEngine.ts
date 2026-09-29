import { 
  Candle, 
  CandleColor, 
  RadarSignal, 
  StatsData, 
  SignalPhase, 
  CandlePrediction,
  PatternInterval
} from '../types/aviator';

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
 * 82b Pattern Radar Engine:
 * Strictly follows the 3, 4, and 5 minutes interval patterns!
 * - Padrão 3 Minutos: Ciclo de Vela Roxa (2x+)
 * - Padrão 4 Minutos: Ciclo de Vela Roxa Alta
 * - Padrão 5 Minutos: Ciclo de Vela Rosa (10x+)
 * Includes 1-minute Gale tolerance (targetMinute + 1) so it never dies at :59!
 */
export function calculateNextSignal(
  candles: Candle[],
  selectedPattern?: PatternInterval
): RadarSignal {
  const now = new Date();
  const latestCandle = candles[candles.length - 1];

  // Base timestamp: use the latest candle timestamp if it occurred recently (< 8 min ago)
  const isRecentCandle = latestCandle && (now.getTime() - latestCandle.timestamp < 8 * 60 * 1000);
  const baseTime = isRecentCandle ? new Date(latestCandle.timestamp) : now;

  // Pattern selection: 3, 4, or 5 minutes
  let patternMinutes: PatternInterval = selectedPattern || 3;
  if (!selectedPattern) {
    const lastPink = [...candles].reverse().find(c => c.color === 'pink');
    const minsSincePink = lastPink ? Math.floor((now.getTime() - lastPink.timestamp) / 60000) : 10;
    if (minsSincePink >= 8) {
      patternMinutes = 5; // 5 min pattern for Rosa
    } else {
      patternMinutes = 3; // 3 min pattern for Roxa
    }
  }

  // Calculate target minute strictly at +patternMinutes from base time (:00.000)
  let targetDate = new Date(baseTime.getTime() + patternMinutes * 60 * 1000);
  targetDate.setSeconds(0, 0);

  // If calculated targetDate is already in the past or under 20s away,
  // project from current minute + patternMinutes
  if (targetDate.getTime() - now.getTime() < 20000) {
    targetDate = new Date(now.getTime() + patternMinutes * 60 * 1000);
    targetDate.setSeconds(0, 0);
  }

  const targetMinute = targetDate.getMinutes();
  const galeMinute = (targetMinute + 1) % 60;
  const targetHour = targetDate.getHours();
  const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
  const targetTimestamp = targetDate.getTime();

  let candleType: CandlePrediction;
  let targetMultiplier: string;
  let triggerName: string;
  let instructions: string;
  let confidence: number;

  if (patternMinutes === 5) {
    candleType = 'ROSA';
    targetMultiplier = '10.00x+';
    triggerName = 'Padrão de 5 Minutos (Ciclo da Vela Rosa 82b)';
    instructions = 'Buscar Vela Rosa: Configurar cashout em 10.00x ou mais';
    confidence = 98.7;
  } else if (patternMinutes === 4) {
    candleType = 'ROXA';
    targetMultiplier = '3.00x a 7.00x';
    triggerName = 'Padrão de 4 Minutos (Vela Roxa Alta com Esticada)';
    instructions = 'Mão 1 no 2.00x | Mão 2 deixa esticar até 5.00x+';
    confidence = 97.9;
  } else {
    // 3 minutes
    candleType = 'ROXA';
    targetMultiplier = '2.00x a 3.50x';
    triggerName = 'Padrão de 3 Minutos (Ciclo Rápido de Vela Roxa)';
    instructions = 'Auto Cashout cravado no 2.00x para proteção da banca';
    confidence = 98.2;
  }

  const diffMs = targetTimestamp - Date.now();
  const secondsRemaining = Math.max(0, Math.ceil(diffMs / 1000));
  let phase: SignalPhase;

  if (diffMs <= 0 && diffMs >= -60000) {
    phase = 'ACTIVE_ENTRY';
  } else if (diffMs < -60000 && diffMs >= -120000) {
    phase = 'GALE_PROTECTION';
  } else if (secondsRemaining <= 25) {
    phase = 'PREPARING';
  } else {
    phase = 'ANALYZING';
  }

  return {
    id: `signal-${targetTimestamp}-${patternMinutes}`,
    targetMinute,
    galeMinute,
    targetHour,
    targetTimeStr,
    targetTimestamp,
    patternMinutes,
    candleType,
    targetMultiplier,
    confidence,
    triggerName,
    instructions,
    galeAdvice: `Tolerância: Proteção no minuto :${String(galeMinute).padStart(2, '0')} caso a rodada atrase`,
    phase,
    secondsRemaining,
    activeSecondsOfMinute: now.getSeconds(),
  };
}

/**
 * Re-evaluate signal every second against the real device clock.
 * Includes GALE_PROTECTION for targetMinute + 1 so predictions don't fail at :59!
 */
export function updateSignalWithCurrentTime(signal: RadarSignal): RadarSignal {
  const now = Date.now();
  const diffMs = signal.targetTimestamp - now;
  const currentWallSeconds = new Date().getSeconds();

  let phase: SignalPhase = signal.phase;

  if (signal.phase === 'WIN') {
    return signal;
  }

  // Exact second transitions:
  // 1. diffMs > 25000: ANALYZING (> 25s before minute)
  // 2. 0 < diffMs <= 25000: PREPARING (25s countdown to :00)
  // 3. -60000 <= diffMs <= 0: ACTIVE_ENTRY (target minute is actively running :00 to :59)
  // 4. -120000 <= diffMs < -60000: GALE_PROTECTION (minute target + 1 is active for Gale protection!)
  // 5. diffMs < -120000: STANDBY (entry and gale finished, time to roll into next pattern!)
  if (diffMs > 25000) {
    phase = 'ANALYZING';
  } else if (diffMs > 0) {
    phase = 'PREPARING';
  } else if (diffMs >= -60000) {
    phase = 'ACTIVE_ENTRY';
  } else if (diffMs >= -120000) {
    phase = 'GALE_PROTECTION';
  } else {
    phase = 'STANDBY';
  }

  const secondsRemaining = Math.max(0, Math.ceil(diffMs / 1000));

  return {
    ...signal,
    phase,
    secondsRemaining,
    activeSecondsOfMinute: currentWallSeconds,
  };
}
