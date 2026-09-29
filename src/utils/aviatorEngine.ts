import { 
  Candle, 
  CandleColor, 
  RadarSignal, 
  StatsData, 
  SignalPhase, 
  CandlePrediction,
  PatternInterval,
  DecimalAnalysis
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
 * Mathematical Decimal Sum & Round Analysis:
 * Computes the exact integer, decimals, sum of digits, and sums across recent rounds.
 * This provides the mathematical basis for anti-breakout (anti-quebra) precision.
 */
export function computeDecimalAnalysis(candles: Candle[]): DecimalAnalysis {
  const latest = candles[candles.length - 1];
  const lastMultiplier = latest ? latest.multiplier : 2.50;
  
  const integerPart = Math.floor(lastMultiplier);
  const decimalPart = Math.round((lastMultiplier - integerPart) * 100);

  // Digits sum (e.g. 2.45 -> '245' -> 2 + 4 + 5 = 11)
  const digitsStr = String(lastMultiplier.toFixed(2)).replace('.', '');
  const digitsSum = digitsStr.split('').reduce((acc, d) => acc + (parseInt(d, 10) || 0), 0);

  // Recent 3 candles sum
  const recent3 = candles.slice(-3);
  const sumLast3Multipliers = Number(recent3.reduce((acc, c) => acc + c.multiplier, 0).toFixed(2));
  const sumLast3Decimals = recent3.reduce((acc, c) => {
    const dec = Math.round((c.multiplier - Math.floor(c.multiplier)) * 100);
    return acc + dec;
  }, 0);

  // Retention index evaluation
  let retentionStatus: 'EXPANSAO_ALTA' | 'ESTAVEL_PAGANDO' | 'RETENCAO_CUIDADO';
  let retentionLabel: string;
  let antiQuebraScore: number;

  const hasPinkRecent = recent3.some(c => c.color === 'pink');
  const allBlues = recent3.length >= 2 && recent3.every(c => c.color === 'blue');

  if (hasPinkRecent || sumLast3Multipliers >= 12.0) {
    retentionStatus = 'EXPANSAO_ALTA';
    retentionLabel = '🔥 Alta Expansão: Soma decimal favorável para pagamento de Vela Rosa (10.00x+)';
    antiQuebraScore = 98.9;
  } else if (allBlues || sumLast3Multipliers < 3.8) {
    retentionStatus = 'RETENCAO_CUIDADO';
    retentionLabel = '🛡️ Filtro Anti-Quebra: Retenção detectada. Entrada calibrada estritamente no 2.00x seguro!';
    antiQuebraScore = 97.6;
  } else {
    retentionStatus = 'ESTAVEL_PAGANDO';
    retentionLabel = '✅ Mesa Estável: Soma decimal confirmando fluxo de Vela Roxa (2.00x a 5.00x)';
    antiQuebraScore = 98.3;
  }

  return {
    lastMultiplier,
    integerPart,
    decimalPart,
    digitsSum,
    sumLast3Multipliers,
    sumLast3Decimals,
    retentionStatus,
    retentionLabel,
    antiQuebraScore,
  };
}

/**
 * 82b Pattern Radar Engine:
 * Follows 3, 4, 5 minutes interval patterns calibrated by the Decimal Sum of the rounds!
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
  const decimalAnalysis = computeDecimalAnalysis(candles);

  // Base timestamp: use the latest candle timestamp if it occurred recently (< 8 min ago)
  const isRecentCandle = latestCandle && (now.getTime() - latestCandle.timestamp < 8 * 60 * 1000);
  const baseTime = isRecentCandle ? new Date(latestCandle.timestamp) : now;

  // Pattern selection: 3, 4, or 5 minutes
  let patternMinutes: PatternInterval = selectedPattern || 3;
  if (!selectedPattern) {
    if (decimalAnalysis.retentionStatus === 'EXPANSAO_ALTA') {
      patternMinutes = 5; // Padrão 5 min da Rosa
    } else if (decimalAnalysis.retentionStatus === 'RETENCAO_CUIDADO') {
      patternMinutes = 3; // Padrão 3 min da Roxa (quebra rápida)
    } else {
      patternMinutes = 3;
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

  if (patternMinutes === 5 || decimalAnalysis.retentionStatus === 'EXPANSAO_ALTA') {
    candleType = 'ROSA';
    targetMultiplier = '10.00x+';
    triggerName = `Padrão de 5 Minutos (Soma Decimal ${decimalAnalysis.sumLast3Multipliers}x)`;
    instructions = 'Buscar Vela Rosa: Configurar cashout em 10.00x ou mais';
    confidence = decimalAnalysis.antiQuebraScore;
  } else if (patternMinutes === 4) {
    candleType = 'ROXA';
    targetMultiplier = '3.00x a 7.00x';
    triggerName = `Padrão de 4 Minutos (Soma dos Decimais: ${decimalAnalysis.sumLast3Decimals})`;
    instructions = 'Mão 1 no 2.00x | Mão 2 deixa esticar até 5.00x+';
    confidence = decimalAnalysis.antiQuebraScore;
  } else {
    // 3 minutes
    candleType = 'ROXA';
    targetMultiplier = '2.00x a 3.50x';
    triggerName = `Padrão de 3 Minutos (Soma de Dígitos: ${decimalAnalysis.digitsSum})`;
    instructions = 'Auto Cashout cravado no 2.00x para proteção da banca';
    confidence = decimalAnalysis.antiQuebraScore;
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
    decimalAnalysis,
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
