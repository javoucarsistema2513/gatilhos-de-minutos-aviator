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

export type SignalPhase = 'ANALYZING' | 'PREPARING' | 'ACTIVE_ENTRY' | 'WIN' | 'STANDBY';

export type SignalOpportunity = 'ROSA_ALTA' | 'ROXA_COM_EXPANSAO' | 'RECUPERACAO_ROXA';

export interface RadarSignal {
  id: string;
  targetMinute: number; // minute 0-59
  targetHour: number; // hour 0-23
  targetTimeStr: string; // e.g. "16:45"
  targetTimestamp: number; // Exact millisecond when the minute starts
  opportunity: SignalOpportunity;
  primaryTarget: string; // "Saída Segura no 2.00x (Roxa)"
  secondaryTarget: string; // "Buscar 10.00x+ (Rosa)"
  confidence: number; // e.g. 98.4%
  triggerName: string; // e.g. "Ciclo da Rosa 82b"
  protectionAdvice: string; // "1ª Mão no 2.00x (garante lucro) | 2ª Mão deixa subir"
  galeAdvice: string; // "Tolerância: No máximo 1 proteção no minuto seguinte"
  phase: SignalPhase;
  secondsRemaining: number;
  resultCandle?: Candle;
  winType?: 'PURPLE_WIN' | 'PINK_WIN' | 'NORMAL_WIN';
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
