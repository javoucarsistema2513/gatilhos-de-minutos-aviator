import { AviatorCandle, CandleColor, MinutagemProjection, MinutagemStats } from '../types/aviator';

export function getCandleColor(multiplier: number): CandleColor {
  if (multiplier >= 100.0) return 'gold';
  if (multiplier >= 10.0) return 'pink';
  if (multiplier >= 2.0) return 'purple';
  return 'blue';
}

export function formatTime24(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatMinuteOnly(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function analyzeMinutagem(candles: AviatorCandle[], currentTime: Date = new Date()): {
  stats: MinutagemStats;
  projections: MinutagemProjection[];
} {
  const total = candles.length;
  let blues = 0;
  let purples = 0;
  let pinks = 0;

  candles.forEach((c) => {
    if (c.multiplier >= 10.0) pinks++;
    else if (c.multiplier >= 2.0) purples++;
    else blues++;
  });

  // Pink candles sorted by timestamp ascending
  const pinkCandles = candles
    .filter((c) => c.multiplier >= 10.0)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Intervals between consecutive pinks in minutes
  const intervals: number[] = [];
  const endingsFreq: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) endingsFreq[i] = 0;

  for (let i = 0; i < pinkCandles.length; i++) {
    const minDigit = pinkCandles[i].timestamp.getMinutes() % 10;
    endingsFreq[minDigit] = (endingsFreq[minDigit] || 0) + 1;

    if (i > 0) {
      const diffMs = pinkCandles[i].timestamp.getTime() - pinkCandles[i - 1].timestamp.getTime();
      const diffMins = Math.max(1, Math.round((diffMs / 60000) * 10) / 10);
      intervals.push(diffMins);
    }
  }

  const avgInterval =
    intervals.length > 0
      ? Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10
      : 5.0; // fallback standard 5 mins
  const minInterval = intervals.length > 0 ? Math.min(...intervals) : 3.0;
  const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 10.0;

  // Last pink info
  const lastPink = pinkCandles.length > 0 ? pinkCandles[pinkCandles.length - 1] : null;

  // Consecutive blues currently (from latest backwards)
  let consecutiveBlues = 0;
  for (let i = candles.length - 1; i >= 0; i--) {
    if (candles[i].multiplier < 2.0) {
      consecutiveBlues++;
    } else {
      break;
    }
  }

  // Market state analysis
  let marketState: 'Pagador' | 'Neutro' | 'Recolhedor / Frio' = 'Neutro';
  if (candles.length >= 10) {
    const recent = candles.slice(-10);
    const recentPinks = recent.filter((c) => c.multiplier >= 10).length;
    const recentBlues = recent.filter((c) => c.multiplier < 2.0).length;
    if (recentPinks >= 2 || recentBlues <= 3) {
      marketState = 'Pagador';
    } else if (recentBlues >= 7) {
      marketState = 'Recolhedor / Frio';
    }
  }

  const stats: MinutagemStats = {
    totalCandles: total,
    pinkCandlesCount: pinks,
    purpleCandlesCount: purples,
    blueCandlesCount: blues,
    lastPinkMinute: lastPink ? lastPink.minuteString : null,
    lastPinkTime: lastPink ? lastPink.timeString : null,
    lastPinkMultiplier: lastPink ? lastPink.multiplier : null,
    averagePinkIntervalMin: avgInterval,
    minIntervalMin: minInterval,
    maxIntervalMin: maxInterval,
    pinkEndingsFrequency: endingsFreq,
    currentConsecutiveBlues: consecutiveBlues,
    marketState,
  };

  // Generate projections based on the last pink or current time
  const projections: MinutagemProjection[] = [];
  const baseDate = lastPink ? new Date(lastPink.timestamp) : new Date(currentTime);

  // Common Aviator minute intervals after a pink:
  // 1. Short interval: 3 to 4 min
  // 2. Medium interval: Average interval (~5-7 min)
  // 3. Long / Mirror interval: 8 to 11 min
  const targetDeltas = [
    Math.max(2, Math.round(minInterval)),
    Math.max(3, Math.round(avgInterval)),
    Math.round(avgInterval + 3),
    Math.round(avgInterval + 6),
  ];

  // Eliminate duplicates
  const uniqueDeltas = Array.from(new Set(targetDeltas)).sort((a, b) => a - b);

  uniqueDeltas.forEach((delta, index) => {
    const targetDate = new Date(baseDate.getTime() + delta * 60000);
    // target at 00 seconds
    targetDate.setSeconds(0, 0);

    const secondsRemaining = Math.round((targetDate.getTime() - currentTime.getTime()) / 1000);

    let confidence: 'Alta' | 'Média' | 'Normal' = 'Normal';
    if (index === 1) confidence = 'Alta';
    else if (index === 0 && consecutiveBlues >= 3) confidence = 'Alta';
    else if (index <= 2) confidence = 'Média';

    projections.push({
      targetMinute: formatMinuteOnly(targetDate),
      deltaMinutes: delta,
      secondsRemaining,
      confidence,
      reason:
        index === 0
          ? `Ciclo Rápido (+${delta} min da última vela rosa)`
          : index === 1
          ? `Média Histórica Calculada (+${delta} min)`
          : `Gatilho de Espelhamento (+${delta} min)`,
    });
  });

  return { stats, projections };
}

// Initial realistic dataset for instant testing
export function getInitialDemoCandles(): AviatorCandle[] {
  const now = new Date();
  const list: AviatorCandle[] = [];

  // Multipliers array with simulated past rounds
  const presets = [
    { mult: 1.22, minAgo: 24, sec: 10 },
    { mult: 2.45, minAgo: 23, sec: 40 },
    { mult: 1.15, minAgo: 22, sec: 15 },
    { mult: 14.80, minAgo: 21, sec: 0 }, // PINK (21 min ago)
    { mult: 1.05, minAgo: 20, sec: 20 },
    { mult: 3.10, minAgo: 19, sec: 35 },
    { mult: 1.88, minAgo: 18, sec: 50 },
    { mult: 1.34, minAgo: 17, sec: 25 },
    { mult: 26.50, minAgo: 16, sec: 0 }, // PINK (16 min ago, delta 5 min)
    { mult: 4.20, minAgo: 15, sec: 15 },
    { mult: 1.95, minAgo: 14, sec: 40 },
    { mult: 2.12, minAgo: 13, sec: 10 },
    { mult: 1.40, minAgo: 12, sec: 35 },
    { mult: 18.25, minAgo: 11, sec: 0 }, // PINK (11 min ago, delta 5 min)
    { mult: 1.10, minAgo: 10, sec: 18 },
    { mult: 1.72, minAgo: 9, sec: 45 },
    { mult: 3.80, minAgo: 8, sec: 20 },
    { mult: 1.25, minAgo: 7, sec: 50 },
    { mult: 42.10, minAgo: 6, sec: 0 }, // PINK (6 min ago, delta 5 min)
    { mult: 1.30, minAgo: 4, sec: 30 },
    { mult: 2.05, minAgo: 3, sec: 15 },
    { mult: 1.48, minAgo: 1, sec: 45 },
  ];

  presets.forEach((p, idx) => {
    const d = new Date(now.getTime() - p.minAgo * 60000 + p.sec * 1000);
    list.push({
      id: `candle-${idx}-${d.getTime()}`,
      multiplier: p.mult,
      timestamp: d,
      minuteString: formatMinuteOnly(d),
      timeString: formatTime24(d),
      isPink: p.mult >= 10.0,
    });
  });

  return list;
}
