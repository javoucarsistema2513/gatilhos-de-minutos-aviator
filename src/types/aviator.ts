export type CandleColor = 'blue' | 'purple' | 'pink';

export interface Candle {
  id: string;
  roundId: number;
  multiplier: number;
  timestamp: number; // millisecond timestamp
  timeFormatted: string; // HH:mm:ss
  minute: number; // 0-59
  color: CandleColor;
  hash: string;
}

export type SignalPhase = 'ANALYZING' | 'PREPARING' | 'ACTIVE_ENTRY' | 'GALE_PROTECTION' | 'WIN' | 'STANDBY';

export type CandlePrediction = 'ROXA' | 'ROSA';

export type PatternInterval = 3 | 4 | 5;

export interface DecimalAnalysis {
  lastMultiplier: number;
  integerPart: number;
  decimalPart: number;
  digitsSum: number; // sum of digits, e.g. 2.45 -> 2 + 4 + 5 = 11
  sumLast3Multipliers: number; // e.g. 1.34 + 2.18 + 4.82 = 8.34
  sumLast3Decimals: number; // e.g. 34 + 18 + 82 = 134
  retentionStatus: 'EXPANSAO_ALTA' | 'ESTAVEL_PAGANDO' | 'RETENCAO_CUIDADO';
  retentionLabel: string;
  antiQuebraScore: number; // e.g. 98.8%
}

export interface RadarSignal {
  id: string;
  targetMinute: number; // minute 0-59
  galeMinute: number; // targetMinute + 1 (minute 0-59)
  targetHour: number; // hour 0-23
  targetTimeStr: string; // e.g. "17:37"
  targetTimestamp: number; // Exact millisecond when the minute starts (:00.000)
  patternMinutes: PatternInterval; // 3, 4, or 5 minutes pattern
  candleType: CandlePrediction; // ROXA (2.00x+) or ROSA (10.00x+)
  targetMultiplier: string; // e.g. "2.00x a 3.50x" or "10.00x+"
  confidence: number; // e.g. 98.4%
  triggerName: string; // e.g. "Padrão de 5 Minutos (Vela Rosa)"
  instructions: string; // Clear single execution rule
  galeAdvice: string; // "Tolerância: Proteção no minuto seguinte"
  phase: SignalPhase;
  secondsRemaining: number;
  activeSecondsOfMinute: number; // 0 to 59 during the active minute
  decimalAnalysis: DecimalAnalysis; // Mathematical round & decimal sum
  resultCandle?: Candle;
}

export interface StatsData {
  total: number;
  blues: number;
  purples: number;
  pinks: number;
  bluePct: number;
  purplePct: number;
  pinkPct: number;
  highestMultiplier: number;
  lastPinkMinutesAgo: number;
  lastPinkMultiplier: number;
  lastPinkTime: string;
  averagePinkIntervalMinutes: number;
}
